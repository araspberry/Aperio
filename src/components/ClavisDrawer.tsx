// The Clavis Study Center — dark navy bottom sheet with peek (22%) / split (55%) / full (92%).
// Tabs: Commentary (Devotional/Scholarly/Prophetic) · Verses · Lexicon · Cross Refs · Notes.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { fonts, spacing } from "../theme";
import { useTheme } from "../lib/theme-context";

export interface ClavisDrawerHandle {
  open: (snap?: number, tab?: TabKey, verse?: number) => void;
  close: () => void;
}

type TabKey = "commentary" | "verses" | "lexicon" | "crossrefs" | "notes";
type ToneKey = "devotional" | "scholarly" | "prophetic";

const TABS: { key: TabKey; label: string }[] = [
  { key: "commentary", label: "Commentary" },
  { key: "verses", label: "Verses" },
  { key: "lexicon", label: "Lexicon" },
  { key: "crossrefs", label: "Cross Refs" },
  { key: "notes", label: "Notes" },
];

const TONES: { key: ToneKey; label: string; icon: React.ReactNode }[] = [
  { key: "devotional", label: "DEVOTIONAL", icon: <MaterialCommunityIcons name="hands-pray" size={16} /> },
  { key: "scholarly", label: "SCHOLARLY", icon: <Ionicons name="school" size={16} /> },
  { key: "prophetic", label: "PROPHETIC", icon: <Ionicons name="flame" size={16} /> },
];

// Sheet palette
const S = {
  bg: "#12213E",
  card: "#1B2C4E",
  border: "rgba(212,184,122,0.18)",
  text: "#EDE7D8",
  muted: "#93A0BC",
};

function CommentaryBody({ text }: { text: string }) {
  const { colors } = useTheme();
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (/^#{1,3}\s/.test(trimmed)) {
          return (
            <Text key={i} style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 28, color: colors.white, marginBottom: spacing.m }}>
              {trimmed.replace(/^#{1,3}\s*/, "")}
            </Text>
          );
        }
        const clean = trimmed.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\n/g, " ");
        return (
          <Text key={i} style={{ fontFamily: fonts.serif, fontSize: 16.5, lineHeight: 29, color: S.text, marginBottom: spacing.m }}>
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
  const snapIndex = useRef(-1);
  const { colors } = useTheme();
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

  const move = (dir: 1 | -1) => {
    const next = Math.max(0, Math.min(2, snapIndex.current + dir));
    sheetRef.current?.snapToIndex(next);
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["22%", "55%", "92%"]}
      enablePanDownToClose
      onChange={(i: number) => (snapIndex.current = i)}
      backgroundStyle={{ backgroundColor: S.bg, borderRadius: 26 }}
      handleIndicatorStyle={{ backgroundColor: S.muted, width: 40 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.m }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2.5, color: colors.goldSoft }}>
            STUDY CENTER <Text style={{ color: S.muted, letterSpacing: 0 }}>· {reference}{focusVerse ? `:${focusVerse}` : ""}</Text>
          </Text>
          <View style={{ flexDirection: "row", gap: 18 }}>
            <Pressable onPress={() => move(-1)} hitSlop={8}>
              <Ionicons name="arrow-down" size={19} color={S.text} />
            </Pressable>
            <Pressable onPress={() => move(1)} hitSlop={8}>
              <Ionicons name="arrow-up" size={19} color={S.text} />
            </Pressable>
            <Pressable onPress={() => sheetRef.current?.close()} hitSlop={8}>
              <Ionicons name="close" size={19} color={S.text} />
            </Pressable>
          </View>
        </View>

        {/* Underline tabs */}
        <View style={{ flexDirection: "row", marginTop: spacing.m, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                marginRight: 22,
                paddingBottom: 10,
                borderBottomWidth: 2,
                borderColor: tab === t.key ? colors.gold : "transparent",
              }}
            >
              <Text style={{ fontFamily: tab === t.key ? fonts.sansBold : fonts.sansMed, fontSize: 14, color: tab === t.key ? colors.goldSoft : S.muted }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={{ padding: spacing.m, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "commentary" && (
          <>
            <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2.5, color: colors.gold, marginBottom: spacing.s }}>
              {tone.toUpperCase()}
            </Text>
            {commentary ? (
              <CommentaryBody text={commentary[tone] || "Commentary for this chapter is on its way."} />
            ) : (
              <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: S.muted }}>
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
                backgroundColor: focusVerse === v.verse ? "#2A3D66" : S.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: S.border,
                padding: 12,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontFamily: fonts.serif, fontSize: 15, lineHeight: 24, color: S.text }} numberOfLines={3}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.goldSoft }}>{v.verse} </Text>
                {v.text}
              </Text>
            </Pressable>
          ))}

        {tab === "lexicon" && (
          <>
            <TextInput
              style={{
                backgroundColor: S.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: S.border,
                padding: 12,
                fontFamily: fonts.sans,
                fontSize: 15,
                color: S.text,
                marginBottom: spacing.s,
              }}
              placeholder='Search Hebrew or Greek — "agape", H1254'
              placeholderTextColor={S.muted}
              value={lexQuery}
              onChangeText={runLexSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {lexHits.length === 0 && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: S.muted, textAlign: "center", marginTop: spacing.m }}>
                14,197 entries from Strong's lexicon — fully offline. Tip: tap any gold word in the text.
              </Text>
            )}
            {lexHits.map((e) => (
              <View key={e.id} style={{ backgroundColor: S.card, borderRadius: 12, borderWidth: 1, borderColor: S.border, padding: 12, marginBottom: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flex: 1 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.white }}>{e.lemma}</Text>
                    <Text style={{ fontFamily: fonts.serifItalic, fontSize: 13, color: S.muted }}>{e.translit}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.goldSoft }}>{e.id}</Text>
                </View>
                <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 21, color: S.text, marginTop: 4 }}>
                  {e.definition || e.kjv_def}
                </Text>
              </View>
            ))}
          </>
        )}

        {tab === "crossrefs" && (
          <>
            {crossrefs.length === 0 && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: S.muted, textAlign: "center", marginTop: spacing.m }}>
                Loading connections…
              </Text>
            )}
            {crossrefs.map((r) => (
              <Pressable
                key={r.ref_label}
                onPress={() => onNavigate(r.ref_book_num, r.ref_chapter)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#2A3D66" : S.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: S.border,
                  padding: 12,
                  marginBottom: 6,
                })}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.goldSoft }}>{r.ref_label}</Text>
                  <Ionicons name="arrow-forward" size={13} color={S.muted} />
                </View>
                {!!r.preview && (
                  <Text style={{ fontFamily: fonts.serif, fontSize: 14.5, lineHeight: 23, color: S.text, marginTop: 3 }} numberOfLines={2}>
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
                  backgroundColor: S.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: S.border,
                  padding: 12,
                  fontFamily: fonts.serif,
                  fontSize: 15,
                  color: S.text,
                  minHeight: 44,
                }}
                placeholder={focusVerse ? `Note on ${reference}:${focusVerse}…` : `Note on ${reference}…`}
                placeholderTextColor={S.muted}
                value={noteDraft}
                onChangeText={setNoteDraft}
                multiline
              />
              <Pressable
                onPress={saveNote}
                disabled={!noteDraft.trim()}
                style={{
                  backgroundColor: noteDraft.trim() ? colors.gold : "#2A3D66",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-up" size={18} color={noteDraft.trim() ? colors.navyDeep : S.muted} />
              </Pressable>
            </View>
            {notes.length === 0 && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: S.muted, textAlign: "center", marginTop: spacing.m }}>
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
                style={{ backgroundColor: S.card, borderRadius: 12, borderWidth: 1, borderColor: S.border, padding: 12, marginBottom: 6 }}
              >
                {n.verse ? (
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.goldSoft, marginBottom: 3 }}>
                    v.{n.verse}
                  </Text>
                ) : null}
                <Text style={{ fontFamily: fonts.serif, fontSize: 15, lineHeight: 25, color: S.text }}>{n.body}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: S.muted, marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleDateString()}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </BottomSheetScrollView>

      {/* Floating tone switcher (Commentary tab only) */}
      {tab === "commentary" && (
        <View
          style={{
            position: "absolute",
            bottom: 26,
            left: spacing.m,
            right: spacing.m,
            flexDirection: "row",
            backgroundColor: "rgba(10,18,36,0.92)",
            borderRadius: 26,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            padding: 5,
          }}
        >
          {TONES.map((t) => {
            const active = tone === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTone(t.key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 9,
                  borderRadius: 21,
                  backgroundColor: active ? "rgba(255,255,255,0.14)" : "transparent",
                  gap: 2,
                }}
              >
                {React.cloneElement(t.icon as any, { color: active ? colors.white : S.muted })}
                <Text style={{ fontFamily: fonts.sansMed, fontSize: 10, letterSpacing: 1, color: active ? colors.white : S.muted }}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
});
