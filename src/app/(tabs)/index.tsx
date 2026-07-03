// Home — greeting, Scripture of the Day, Start reading / Daily Quiz, Prayer journal.
import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Share } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getBooks, getVersePreview, type Book } from "../../db/content";
import { getProgress, getTodayQuiz } from "../../db/user";
import { verseOfDayRef, greeting } from "../../lib/verse-of-day";
import { colors, fonts, spacing } from "../../theme";

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<{ book_num: number; chapter: number } | null>(null);
  const [votd, setVotd] = useState<{ ref: string; text: string; book: number; chapter: number; theme: string } | null>(null);
  const [quizDone, setQuizDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const allBooks = await getBooks(db);
          const v = verseOfDayRef();
          const text = await getVersePreview(db, v.book, v.chapter, v.verse);
          const name = allBooks.find((x) => x.book_num === v.book)?.name ?? "";
          const [p, q] = await Promise.all([getProgress(), getTodayQuiz()]);
          if (!active) return;
          setBooks(allBooks);
          setVotd({ ref: `${name} ${v.chapter}:${v.verse}`, text, book: v.book, chapter: v.chapter, theme: v.theme });
          setProgress(p);
          setQuizDone(!!q);
        } catch {}
      })();
      return () => {
        active = false;
      };
    }, [db]),
  );

  const continueBook = progress ? books.find((b) => b.book_num === progress.book_num) : null;

  const shareVerse = async () => {
    if (!votd) return;
    try {
      await Share.share({ message: `"${votd.text}"\n— ${votd.ref}\n\nShared from Aperio` });
    } catch {}
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.parchment }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.m, paddingHorizontal: spacing.l, paddingBottom: 130 }}
    >
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 27, color: colors.navy }}>
          Ap<Text style={{ color: colors.gold }}>e</Text>rio
        </Text>
        <Pressable onPress={() => router.push("/profile")} hitSlop={10}>
          <Ionicons name="settings-outline" size={21} color={colors.inkMuted} />
        </Pressable>
      </View>

      {/* Greeting */}
      <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 44, color: colors.navy, marginTop: spacing.l }}>
        {greeting()}, friend.
      </Text>

      {/* Scripture of the day */}
      {votd && (
        <LinearGradient
          colors={[colors.gradientTop, colors.gradientBottom]}
          style={{ marginTop: spacing.l, borderRadius: 24, padding: spacing.l }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2.5, color: colors.goldSoft }}>
              SCRIPTURE OF THE DAY
            </Text>
            <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.55)" }}>
              {votd.theme.toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.sans, fontSize: 22, lineHeight: 36, color: colors.white, marginTop: spacing.m, fontWeight: "500" }}>
            "{votd.text}"
          </Text>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.goldSoft, marginTop: spacing.m }}>
            — {votd.ref}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.s, marginTop: spacing.l }}>
            <Pressable
              onPress={() => router.push(`/reader/${votd.book}/${votd.chapter}?clavis=1`)}
              style={{ borderWidth: 1.5, borderColor: colors.goldSoft, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10 }}
            >
              <Text style={{ fontFamily: fonts.sansMed, fontSize: 14, color: colors.goldSoft }}>Open in Clavis</Text>
            </Pressable>
            <Pressable
              onPress={shareVerse}
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="share-social-outline" size={15} color={colors.white} />
              <Text style={{ fontFamily: fonts.sansMed, fontSize: 14, color: colors.white }}>Share</Text>
            </Pressable>
          </View>
        </LinearGradient>
      )}

      {/* Start reading / Daily quiz */}
      <View style={{ flexDirection: "row", gap: spacing.s, marginTop: spacing.m }}>
        <Pressable
          onPress={() =>
            continueBook && progress
              ? router.push(`/reader/${progress.book_num}/${progress.chapter}`)
              : router.push("/read")
          }
          style={cardStyle}
        >
          <Ionicons name="book-outline" size={22} color={colors.goldDeep} />
          <Text style={cardTitle}>{continueBook ? "Continue reading" : "Start reading"}</Text>
          <Text style={cardSub}>
            {continueBook && progress ? `${continueBook.name} ${progress.chapter}` : "Choose a book"}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push("/quiz")} style={cardStyle}>
          <MaterialCommunityIcons name="medal-outline" size={22} color={colors.goldDeep} />
          <Text style={cardTitle}>Daily Quiz</Text>
          <Text style={cardSub}>{quizDone ? "Done for today ✓" : "7 questions · today's reading"}</Text>
        </Pressable>
      </View>

      {/* Prayer journal */}
      <Pressable onPress={() => router.push("/prayer")} style={[cardStyle, { marginTop: spacing.s, flex: undefined }]}>
        <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2, color: colors.inkMuted }}>
          PRAYER JOURNAL
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.navy, marginTop: 8 }}>
          What's on your heart today?
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 6 }}>
          Tap to write today's prayer →
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const cardStyle = {
  flex: 1,
  backgroundColor: colors.card,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.m,
} as const;

const cardTitle = {
  fontFamily: fonts.display,
  fontSize: 19,
  color: colors.navy,
  marginTop: 12,
} as const;

const cardSub = {
  fontFamily: fonts.sans,
  fontSize: 13,
  color: colors.inkMuted,
  marginTop: 4,
} as const;
