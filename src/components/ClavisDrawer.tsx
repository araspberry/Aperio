// The Clavis Study Drawer — bottom sheet with peek (22%) / split (55%) / full (92%).
// Tabs: Commentary (Devotional/Scholarly/Prophetic) · Verses · Lexicon · Cross Refs · My Notes.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import {
  getCrossrefs,
  getVersePreview,
  searchStrongs,
  type Commentary,
  type Verse,
  type CrossRef,
  type StrongsEntry,
} from "../db/content";
import { listNotes, addNote, deleteNote, type Note } from "../db/user";
import { fullSync } from "../lib/sync";
import { colors, fonts, spacing } from "../theme";

export interface ClavisDrawerHandle {
  open: (snap?: number, tab?: TabKey, verse?: number) => void;
  close: () => void;
}

type TabKey = "commentary" | "verses" | "lexicon" | "crossrefs" | "notes";
type ToneKey = "devotional" | "scholarly" | "prophetic";

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "commentary", label: "Commentary", icon: "sparkles" },
  { key: "verses", label: "Verses", icon: "list" },
  { key: "lexicon", label: "Lexicon", icon: "language" },
  { key: "crossrefs", label: "Cross refs", icon: "git-compare" },
  { key: "notes", label: "My notes", icon: "create" },
];

const TONES: { key: ToneKey; label: string }[] = [
  { key: "devotional", label: "Devotional" },
  { key: "scholarly", label: "Scholarly" },
  { key: "prophetic", label: "Prophetic" },
];

function CommentaryBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (/^#{1,3}\s/.test(trimmed)) {
          return (
            <Text key={i} style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 28, color: colors.navyDeep, marginBottom: spacing.m }}>
              {trimmed.replace(/^#{1,3}\s*/, "")}
            </Text>
          );
        }
        const clean = trimmed.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\n/g, " ");
        return (
          <Text key={i} style={{ fontFamily: fonts.serif, fontSize: 16, lineHeight: 28, color: colors.ink, marginBottom: spacing.m }}>
            {clean}
          </Text>
        );
      })}
    </>
  );
}

interface Props {
  bookNum: number;
  chapter: number;
  reference: string;
  commentary: Commentary | null;
  verses: Verse[];
  onVersePick: (verse: number) => void;
  onNavigate: (bookNum: number, chapter: number) => void;
}

export const ClavisDrawer = forwardRef<ClavisDrawerHandle, Props>(function ClavisDrawer(
  { bookNum, chapter, reference, commentary, verses, onVersePick, onNavigate },
  ref,
) {
  const db = useSQLiteContext();
  const sheetRef = useRef<BottomSheet>(null);
  const [tab, setTab] = useState<TabKey>("commentary");
  const [tone, setTone] = useState<ToneKey>("devotional");
  const [focusVerse, setFocusVerse] = useState<number | null>(null);
  const [crossrefs, setCrossrefs] = useState<(CrossRef & { preview?: string })[]>([]);
  const [lexQuery, setLexQuery] = useState("");
  const [lexHits, setLexHits] = useState<StrongsEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");

  useImperativeHandle(ref, () => ({
    open: (snap = 1, t, verse) => {
      if (t) setTab(t);
      if (verse !== undefined) setFocusVerse(verse);
      sheetRef.current?.snapToIndex(snap);
    },
    close: () => sheetRef.current?.close(),
  }));

  const loadNotes = useCallback(() => {
    listNotes(bookNum, chapter).then(setNotes).catch(() => {});
  }, [bookNum, chapter]);

  useEffect(() => {
    setCrossrefs([]);
    setFocusVerse(null);
    loadNotes();
    getCrossrefs(db, bookNum, chapter)
      .then(async (refs) => {
        const withPreview = await Promise.all(
          refs.map(async (r) => ({
            ...r,
            preview: (await getVersePreview(db, r.ref_book_num, r.ref_chapter, r.ref_verse_start).catch(() => "")).slice(0, 140),
          })),
        );
        setCrossrefs(withPreview);
      })
      .catch(() => {});
  }, [db, bookNum, chapter, loadNotes]);

  const runLexSearch = async (q: string) => {
    setLexQuery(q);
    if (q.trim().length < 2) {
      setLexHits([]);
      return;
    }
    try {
      setLexHits(await searchStrongs(db, q, 25));
    } catch {
      setLexHits([]);
    }
  };

  const saveNote = async () => {
    const body = noteDraft.trim();
    if (!body) return;
    try {
      await addNote(bookNum, chapter, focusVerse, body);
      setNoteDraft("");
      loadNotes();
      fullSync().catch(() => {});
    } catch {}
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["22%", "55%", "92%"]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.parchmentAlt, borderRadius: 24, borderWidth: 1, borderColor: colors.border }}
      handleIndicatorStyle={{ backgroundColor: colors.gold, width: 44 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.m }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.navyDeep }}>
            {reference}
            {focusVerse ? <Text style={{ color: colors.goldDeep }}>{`  ·  v.${focusVerse}`}</Text> : null}
          </Text>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 2, color: colors.goldDeep }}>
            CLAVIS
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginTop: spacing.s, gap: 4 }}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: tab === t.key ? colors.navyDeep : "transparent",
              }}
            >
              <Ionicons name={t.icon} size={15} color={tab === t.key ? colors.gold : colors.inkMuted} />
              <Text
                style={{
                  fontFamily: fonts.sansMed,
                  fontSize: 9,
                  marginTop: 2,
                  color: tab === t.key ? colors.goldSoft : colors.inkMuted,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xl * 2 }}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "commentary" && (
          <>
            <View style={{ flexDirection: "row", backgroundColor: colors.parchment, borderRadius: 10, padding: 3, marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border }}>
              {TONES.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setTone(t.key)}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: tone === t.key ? colors.navyDeep : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontFamily: fonts.sansMed, fontSize: 12, color: tone === t.key ? colors.goldSoft : colors.inkMuted }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {commentary ? (
              <CommentaryBody text={commentary[tone] || "Commentary for this chapter is on its way."} />
            ) : (
              <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: colors.inkMuted }}>
                Commentary for this chapter is on its way.
              </Text>
            )}
          </>
        )}

        {tab === "verses" &&
          verses.map((v) => (
            <Pressable
              key={v.verse}
              onPress={() => {
                setFocusVerse(v.verse);
                onVersePick(v.verse);
              }}
              style={{
                backgroundColor: focusVerse === v.verse ? colors.highlight : colors.card,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontFamily: fonts.serif, fontSize: 14.5, lineHeight: 23, color: colors.ink }} numberOfLines={3}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.goldDeep }}>{v.verse} </Text>
                {v.text}
              </Text>
            </Pressable>
          ))}

        {tab === "lexicon" && (
          <>
            <TextInput
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                fontFamily: fonts.sans,
                fontSize: 15,
                color: colors.ink,
                marginBottom: spacing.s,
              }}
              placeholder='Search Hebrew or Greek — "agape", H1254'
              placeholderTextColor={colors.inkMuted}
              value={lexQuery}
              onChangeText={runLexSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {lexHits.length === 0 && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: spacing.m }}>
                14,197 entries from Strong's lexicon — fully offline. Tip: tap any gold word in the text.
              </Text>
            )}
            {lexHits.map((e) => (
              <View key={e.id} style={{ backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flex: 1 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.navyDeep }}>{e.lemma}</Text>
                    <Text style={{ fontFamily: fonts.serifItalic, fontSize: 13, color: colors.inkMuted }}>{e.translit}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.goldDeep }}>{e.id}</Text>
                </View>
                <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.ink, marginTop: 4 }}>
                  {e.definition || e.kjv_def}
                </Text>
              </View>
            ))}
          </>
        )}

        {tab === "crossrefs" && (
          <>
            {crossrefs.length === 0 && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: spacing.m }}>
                Loading connections…
              </Text>
            )}
            {crossrefs.map((r) => (
              <Pressable
                key={r.ref_label}
                onPress={() => onNavigate(r.ref_book_num, r.ref_chapter)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.parchment : colors.card,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  marginBottom: 6,
                })}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.goldDeep }}>{r.ref_label}</Text>
                  <Ionicons name="arrow-forward" size={13} color={colors.inkMuted} />
                </View>
                {!!r.preview && (
                  <Text style={{ fontFamily: fonts.serif, fontSize: 14, lineHeight: 22, color: colors.ink, marginTop: 3 }} numberOfLines={2}>
                    {r.preview}
                  </Text>
                )}
              </Pressable>
            ))}
          </>
        )}

        {tab === "notes" && (
          <>
            <View style={{ flexDirection: "row", gap: spacing.s, marginBottom: spacing.s }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  fontFamily: fonts.serif,
                  fontSize: 15,
                  color: colors.ink,
                  minHeight: 44,
                }}
                placeholder={focusVerse ? `Note on ${reference}:${focusVerse}…` : `Note on ${reference}…`}
                placeholderTextColor={colors.inkMuted}
                value={noteDraft}
                onChangeText={setNoteDraft}
                multiline
              />
              <Pressable
                onPress={saveNote}
                disabled={!noteDraft.trim()}
                style={{
                  backgroundColor: noteDraft.trim() ? colors.navyDeep : colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-up" size={18} color={colors.goldSoft} />
              </Pressable>
            </View>
            {notes.length === 0 && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: spacing.m }}>
                Your reflections on {reference} live here.
              </Text>
            )}
            {notes.map((n) => (
              <Pressable
                key={n.id}
                onLongPress={() =>
                  Alert.alert("Delete note?", "", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        await deleteNote(n.id).catch(() => {});
                        loadNotes();
                        fullSync().catch(() => {});
                      },
                    },
                  ])
                }
                style={{ backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 6 }}
              >
                {n.verse ? (
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.goldDeep, marginBottom: 3 }}>
                    v.{n.verse}
                  </Text>
                ) : null}
                <Text style={{ fontFamily: fonts.serif, fontSize: 15, lineHeight: 24, color: colors.ink }}>{n.body}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted, marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleDateString()}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});
