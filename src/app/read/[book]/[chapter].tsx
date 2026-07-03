// The reader — scripture first, everything offline.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import {
  getBook,
  getChapter,
  getCommentary,
  type Book,
  type Verse,
  type Commentary,
} from "../../../db/content";
import {
  listHighlights,
  toggleHighlight,
  toggleBookmark,
  saveProgress,
  listBookmarks,
} from "../../../db/user";
import { CommentarySheet } from "../../../components/CommentarySheet";
import { colors, spacing, fonts } from "../../../theme";

export default function ReaderScreen() {
  const params = useLocalSearchParams<{ book: string; chapter: string; verse?: string }>();
  const bookNum = parseInt(params.book ?? "1", 10) || 1;
  const chapterNum = parseInt(params.chapter ?? "1", 10) || 1;
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [book, setBook] = useState<Book | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());
  const [chapterBookmarked, setChapterBookmarked] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showCommentary, setShowCommentary] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, vs, cm, hls, bms] = await Promise.all([
        getBook(db, bookNum),
        getChapter(db, bookNum, chapterNum),
        getCommentary(db, bookNum, chapterNum),
        listHighlights(bookNum, chapterNum),
        listBookmarks(),
      ]);
      setBook(b);
      setVerses(vs);
      setCommentary(cm);
      setHighlighted(new Set(hls.map((h) => h.verse)));
      setChapterBookmarked(bms.some((m) => m.book_num === bookNum && m.chapter === chapterNum && m.verse == null));
      setSelected(null);
      saveProgress(bookNum, chapterNum).catch(() => {});
    } catch {
      // Leave previous content in place rather than crash.
    }
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

  // Group verses into paragraphs for typographic flow.
  const paragraphs = useMemo(() => {
    const out: Verse[][] = [];
    for (const v of verses) {
      if (v.para_start || out.length === 0) out.push([v]);
      else out[out.length - 1].push(v);
    }
    return out;
  }, [verses]);

  const title = book ? `${book.name} ${chapterNum}` : "";
  const hasPrev = chapterNum > 1;
  const hasNext = !!book && chapterNum < book.chapters_count;

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Pressable onPress={() => onToggleBookmark(null)} hitSlop={12}>
              <Ionicons
                name={chapterBookmarked ? "bookmark" : "bookmark-outline"}
                size={22}
                color={chapterBookmarked ? colors.goldDeep : colors.navy}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.parchment }}
        contentContainerStyle={{ padding: spacing.l, paddingBottom: 140 + insets.bottom }}
      >
        {paragraphs.map((para, pi) => (
          <Text key={pi} style={{ marginBottom: spacing.m }}>
            {para.map((v) => (
              <Text
                key={v.verse}
                onPress={() => setSelected(selected === v.verse ? null : v.verse)}
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 19,
                  lineHeight: 34,
                  color: colors.ink,
                  backgroundColor: highlighted.has(v.verse)
                    ? colors.highlight
                    : selected === v.verse
                      ? colors.goldSoft
                      : "transparent",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.goldDeep, fontWeight: "700" }}>
                  {" "}{v.verse}{" "}
                </Text>
                {v.text.replace(/\n\n/g, "\n").split("\n").join("\n")}
              </Text>
            ))}
          </Text>
        ))}
      </ScrollView>

      {/* Verse action bar */}
      {selected !== null && (
        <View
          style={{
            position: "absolute",
            bottom: 96 + insets.bottom,
            left: spacing.m,
            right: spacing.m,
            backgroundColor: colors.navy,
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
          <Pressable onPress={() => onToggleHighlight(selected)} style={{ alignItems: "center" }} hitSlop={8}>
            <Ionicons name="color-wand" size={20} color={colors.goldSoft} />
            <Text style={{ color: colors.goldSoft, fontSize: 12, marginTop: 2 }}>
              {highlighted.has(selected) ? "Unhighlight" : "Highlight"}
            </Text>
          </Pressable>
          <Pressable onPress={() => onToggleBookmark(selected)} style={{ alignItems: "center" }} hitSlop={8}>
            <Ionicons name="bookmark-outline" size={20} color={colors.goldSoft} />
            <Text style={{ color: colors.goldSoft, fontSize: 12, marginTop: 2 }}>Bookmark</Text>
          </Pressable>
          <Pressable onPress={() => setSelected(null)} style={{ alignItems: "center" }} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.goldSoft} />
            <Text style={{ color: colors.goldSoft, fontSize: 12, marginTop: 2 }}>Close</Text>
          </Pressable>
        </View>
      )}

      {/* Bottom bar: prev / commentary / next */}
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
        <Pressable
          disabled={!hasPrev}
          onPress={() => router.replace(`/read/${bookNum}/${chapterNum - 1}`)}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: hasPrev ? colors.card : colors.parchmentDeep,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={22} color={hasPrev ? colors.navy : colors.border} />
        </Pressable>
        <Pressable
          onPress={() => setShowCommentary(true)}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.navy,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Ionicons name="sparkles" size={18} color={colors.gold} />
          <Text style={{ color: colors.goldSoft, fontSize: 16, fontWeight: "600" }}>Commentary</Text>
        </Pressable>
        <Pressable
          disabled={!hasNext}
          onPress={() => router.replace(`/read/${bookNum}/${chapterNum + 1}`)}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: hasNext ? colors.card : colors.parchmentDeep,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-forward" size={22} color={hasNext ? colors.navy : colors.border} />
        </Pressable>
      </View>

      <CommentarySheet commentary={commentary} visible={showCommentary} onClose={() => setShowCommentary(false)} />
    </>
  );
}
