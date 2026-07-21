// The reader — verse-by-verse with gold Strong's words, the floating Clavis key,
// and the Study Center drawer.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getBook,
  getBooks,
  getChapter,
  getCommentary,
  getWordTags,
  getStrongsEntry,
  type Book,
  type Verse,
  type Commentary,
  type StrongsEntry,
} from "../../../db/content";
import { listHighlights, toggleHighlight, toggleBookmark, saveProgress, listBookmarks } from "../../../db/user";
import { ClavisDrawer, type ClavisDrawerHandle } from "../../../components/ClavisDrawer";
import { VerseItem } from "../../../components/VerseItem";
import { StrongsPopover } from "../../../components/StrongsPopover";
import { PassagePicker } from "../../../components/PassagePicker";
import { FabMenu } from "../../../components/FabMenu";
import { fonts, spacing } from "../../../theme";
import { useTheme } from "../../../lib/theme-context";

export default function ReaderScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ book: string; chapter: string; clavis?: string }>();
  const bookNum = parseInt(params.book ?? "1", 10) || 1;
  const chapterNum = parseInt(params.chapter ?? "1", 10) || 1;
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const drawerRef = useRef<ClavisDrawerHandle>(null);
  const scrollRef = useRef<ScrollView>(null);
  const autoOpened = useRef(false);

  const [book, setBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [wordTags, setWordTags] = useState<Map<string, { h: string | null; g: string | null }> | null>(null);
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const [chapterBookmarked, setChapterBookmarked] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [strongs, setStrongs] = useState<{ entry: StrongsEntry; word: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, all, vs, cm, hls, bms, tags] = await Promise.all([
        getBook(db, bookNum),
        getBooks(db),
        getChapter(db, bookNum, chapterNum),
        getCommentary(db, bookNum, chapterNum),
        listHighlights(bookNum, chapterNum),
        listBookmarks(),
        getWordTags(db),
      ]);
      setBook(b);
      setBooks(all);
      setVerses(vs);
      setCommentary(cm);
      setWordTags(tags);
      setHighlighted(new Set(hls.map((h) => h.verse)));
      setChapterBookmarked(bms.some((m) => m.book_num === bookNum && m.chapter === chapterNum && m.verse == null));
      setSelected(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      saveProgress(bookNum, chapterNum).catch(() => {});
      if (params.clavis === "1" && !autoOpened.current) {
        autoOpened.current = true;
        setTimeout(() => drawerRef.current?.open(1), 450);
      }
    } catch {}
  }, [db, bookNum, chapterNum, params.clavis]);

  useEffect(() => {
    load();
  }, [load]);

  const onToggleHighlight = async (verse: number) => {
    try {
      await toggleHighlight(bookNum, chapterNum, verse);
      setHighlighted((prev) => {
        const next = new Set(prev);
        next.has(verse) ? next.delete(verse) : next.add(verse);
        return next;
      });
      setSelected(null);
    } catch {}
  };

  const onToggleBookmark = async (verse: number | null) => {
    try {
      await toggleBookmark(bookNum, chapterNum, verse);
      if (verse == null) setChapterBookmarked((v) => !v);
      setSelected(null);
    } catch {}
  };

  const onWordPress = async (sid: string, word: string) => {
    try {
      const entry = await getStrongsEntry(db, sid);
      if (entry) setStrongs({ entry, word });
    } catch {}
  };

  const paragraphs = useMemo(() => {
    const out: Verse[][] = [];
    for (const v of verses) {
      if (v.para_start || out.length === 0) out.push([v]);
      else out[out.length - 1].push(v);
    }
    return out;
  }, [verses]);

  const isOT = bookNum <= 39;
  const hasPrev = chapterNum > 1;
  const hasNext = !!book && chapterNum < book.chapters_count;

  return (
    <View style={{ flex: 1, backgroundColor: colors.parchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 10,
          paddingHorizontal: spacing.m,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.parchment,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 44 }}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
        <Pressable onPress={() => setPickerOpen(true)} hitSlop={8} style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.navy }}>
            {book?.name ?? ""} <Text style={{ color: colors.goldDeep }}>{chapterNum}</Text>{" "}
            <Ionicons name="chevron-down" size={12} color={colors.inkMuted} />
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted, marginTop: 1 }}>
            Tap to change passage
          </Text>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => onToggleBookmark(null)} hitSlop={8} accessibilityLabel="Bookmark chapter">
            <Ionicons
              name={chapterBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={chapterBookmarked ? colors.goldDeep : colors.navy}
            />
          </Pressable>
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 18,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Text numberOfLines={1} style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.navy }}>
              NCT
            </Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.l, paddingBottom: 160 }}>
        <Text style={{ fontFamily: fonts.sansMed, fontSize: 12, letterSpacing: 2.5, color: colors.inkMuted }}>
          CHAPTER {chapterNum}
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 40, color: colors.navy, marginTop: 4, marginBottom: spacing.m }}>
          {book?.name ?? ""}
        </Text>

        {paragraphs.map((para, pi) => (
          <Text key={`${bookNum}-${chapterNum}-${pi}`} style={{ marginBottom: spacing.m }}>
            {para.map((v) => (
              <VerseItem
                key={v.verse}
                verse={v.verse}
                text={v.text.replace(/\n/g, " ")}
                isOT={isOT}
                selected={selected === v.verse}
                highlighted={highlighted.has(v.verse)}
                wordTags={wordTags}
                onSelect={(n) => setSelected(selected === n ? null : n)}
                onWordPress={onWordPress}
              />
            ))}
          </Text>
        ))}

        {/* Chapter navigation */}
        <View style={{ flexDirection: "row", gap: spacing.s, marginTop: spacing.l }}>
          {hasPrev && (
            <Pressable
              onPress={() => router.setParams({ chapter: String(chapterNum - 1) })}
              style={navCard(colors)}
            >
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted }}>← Previous</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.navy, marginTop: 2 }}>
                {book?.name} {chapterNum - 1}
              </Text>
            </Pressable>
          )}
          {hasNext && (
            <Pressable
              onPress={() => router.setParams({ chapter: String(chapterNum + 1) })}
              style={[navCard(colors), { alignItems: "flex-end" }]}
            >
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted }}>Next →</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.navy, marginTop: 2 }}>
                {book?.name} {chapterNum + 1}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Verse action bar */}
      {selected !== null && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 110,
            left: spacing.m,
            right: spacing.m,
            backgroundColor: colors.navyDeep,
            borderRadius: 16,
            flexDirection: "row",
            justifyContent: "space-around",
            paddingVertical: 12,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <ActionButton
            icon="color-wand"
            label={highlighted.has(selected) ? "Unhighlight" : "Highlight"}
            onPress={() => onToggleHighlight(selected)}
          />
          <ActionButton icon="bookmark-outline" label="Bookmark" onPress={() => onToggleBookmark(selected)} />
          <ActionButton
            icon="key"
            label={`Clavis v.${selected}`}
            gold
            onPress={() => drawerRef.current?.open(1, "commentary", selected)}
          />
          <ActionButton icon="close" label="Close" onPress={() => setSelected(null)} />
        </View>
      )}

      {/* Study Center pill */}
      <Pressable
        onPress={() => drawerRef.current?.open(1)}
        accessibilityLabel="Open Study Center"
        style={({ pressed }) => ({
          position: "absolute",
          alignSelf: "center",
          bottom: insets.bottom + 22,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: colors.navyInk,
          borderRadius: 26,
          paddingHorizontal: 20,
          paddingVertical: 13,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          shadowColor: "#0D1A30",
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
          elevation: 9,
        })}
      >
        <MaterialCommunityIcons name="key-variant" size={17} color={colors.goldSoft} />
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.white, letterSpacing: 0.3 }}>
          Study Center
        </Text>
      </Pressable>

      <FabMenu />

      <ClavisDrawer
        ref={drawerRef}
        bookNum={bookNum}
        chapter={chapterNum}
        reference={`${book?.name ?? ""} ${chapterNum}`}
        commentary={commentary}
        verses={verses}
        onVersePick={(v) => setSelected(v)}
        onNavigate={(b, c) => {
          drawerRef.current?.close();
          router.setParams({ book: String(b), chapter: String(c) });
        }}
      />

      <StrongsPopover entry={strongs?.entry ?? null} word={strongs?.word ?? ""} onClose={() => setStrongs(null)} />
      <PassagePicker
        books={books}
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(b, c) => router.setParams({ book: String(b), chapter: String(c) })}
      />
    </View>
  );
}

import type { Palette } from "../../../theme";

const navCard = (colors: Palette) => ({
  flex: 1,
  backgroundColor: colors.card,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.m,
} as const);

function ActionButton({ icon, label, onPress, gold }: { icon: any; label: string; onPress: () => void; gold?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center" }} hitSlop={8}>
      <Ionicons name={icon} size={19} color={gold ? colors.gold : colors.goldSoft} />
      <Text style={{ color: gold ? colors.gold : colors.goldSoft, fontFamily: fonts.sansMed, fontSize: 10.5, marginTop: 2 }}>
        {label}
      </Text>
    </Pressable>
  );
}
