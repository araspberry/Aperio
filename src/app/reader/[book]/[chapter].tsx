// The reader — verse-by-verse with gold Strong's words, floating CLAVIS trigger,
// verse action bar, and the Clavis study drawer.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
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
import { colors, fonts, spacing } from "../../../theme";

export default function ReaderScreen() {
  const params = useLocalSearchParams<{ book: string; chapter: string }>();
  const bookNum = parseInt(params.book ?? "1", 10) || 1;
  const chapterNum = parseInt(params.chapter ?? "1", 10) || 1;
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const drawerRef = useRef<ClavisDrawerHandle>(null);

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
      saveProgress(bookNum, chapterNum).catch(() => {});
    } catch {}
  }, [db, bookNum, chapterNum]);

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
  const title = book ? `${book.name} ${chapterNum}` : "";
  const hasPrev = chapterNum > 1;
  const hasNext = !!book && chapterNum < book.chapters_count;

  return (
    <View style={{ flex: 1, backgroundColor: colors.parchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          paddingHorizontal: spacing.m,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.parchment,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 60 }}>
          <Ionicons name="chevron-back" size={24} color={colors.navyDeep} />
        </Pressable>
        <Pressable onPress={() => setPickerOpen(true)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.navyDeep }}>{title}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.goldDeep} />
        </Pressable>
        <View style={{ width: 60, alignItems: "flex-end" }}>
          <Pressable onPress={() => onToggleBookmark(null)} hitSlop={12}>
            <Ionicons
              name={chapterBookmarked ? "bookmark" : "bookmark-outline"}
              size={21}
              color={chapterBookmarked ? colors.goldDeep : colors.navyDeep}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.l, paddingBottom: 180 }}>
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
      </ScrollView>

      {/* Verse action bar */}
      {selected !== null && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 88,
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
            icon="sparkles"
            label={`CLAVIS v.${selected}`}
            gold
            onPress={() => {
              drawerRef.current?.open(1, "commentary", selected);
            }}
          />
          <ActionButton icon="close" label="Close" onPress={() => setSelected(null)} />
        </View>
      )}

      {/* Bottom bar: prev / CLAVIS / next */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + spacing.m,
          left: spacing.m,
          right: spacing.m,
          flexDirection: "row",
          gap: spacing.s,
        }}
      >
        <NavButton icon="chevron-back" enabled={hasPrev} onPress={() => router.setParams({ chapter: String(chapterNum - 1) })} />
        <Pressable
          onPress={() => drawerRef.current?.open(1)}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.navyDeep,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Ionicons name="sparkles" size={17} color={colors.gold} />
          <Text style={{ color: colors.goldSoft, fontFamily: fonts.sansBold, fontSize: 14, letterSpacing: 2 }}>
            CLAVIS
          </Text>
        </Pressable>
        <NavButton icon="chevron-forward" enabled={hasNext} onPress={() => router.setParams({ chapter: String(chapterNum + 1) })} />
      </View>

      <ClavisDrawer
        ref={drawerRef}
        bookNum={bookNum}
        chapter={chapterNum}
        reference={title}
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

function ActionButton({ icon, label, onPress, gold }: { icon: any; label: string; onPress: () => void; gold?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center" }} hitSlop={8}>
      <Ionicons name={icon} size={19} color={gold ? colors.gold : colors.goldSoft} />
      <Text style={{ color: gold ? colors.gold : colors.goldSoft, fontFamily: fonts.sansMed, fontSize: 10.5, marginTop: 2 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function NavButton({ icon, enabled, onPress }: { icon: any; enabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: enabled ? colors.card : colors.parchmentAlt,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={22} color={enabled ? colors.navyDeep : colors.border} />
    </Pressable>
  );
}
