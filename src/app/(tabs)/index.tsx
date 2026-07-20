// Home — greeting, Scripture of the Day, Continue reading / Daily Quiz,
// Prayer journal, Clavis Recommends. Light redesign per Jul 2026 screenshots.
import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Share } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getBooks, getVersePreview, type Book } from "../../db/content";
import { getProgress, getTodayQuiz } from "../../db/user";
import { verseOfDayRef, greeting } from "../../lib/verse-of-day";
import { colors, fonts, spacing } from "../../theme";

const RECOMMENDS = [
  {
    badge: "21 DAYS",
    title: "The Gospel of John",
    blurb: "A 21-day journey through John, with Clavis unlocking every chapter.",
    bg: colors.sage,
    book: 43,
  },
  {
    badge: "28 CHAPTERS",
    title: "Romans — A Deep Dive",
    blurb: "Paul's theological masterpiece, verse by verse.",
    bg: colors.rose,
    book: 45,
  },
  {
    badge: "15 PSALMS",
    title: "Psalms of Comfort",
    blurb: "Songs for anxious seasons, read slowly with Clavis.",
    bg: colors.scriptureBlue,
    book: 19,
  },
];

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
      contentContainerStyle={{ paddingTop: insets.top + spacing.m, paddingBottom: 88 }}
    >
      <View style={{ paddingHorizontal: spacing.l }}>
        {/* Top bar */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 27, color: colors.navyInk }}>
            Ap<Text style={{ color: colors.gold }}>e</Text>rio
          </Text>
          <Pressable onPress={() => router.push("/profile")} hitSlop={10}>
            <Ionicons name="settings-outline" size={21} color={colors.inkMuted} />
          </Pressable>
        </View>

        {/* Greeting */}
        <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 44, color: colors.navyInk, marginTop: spacing.l }}>
          {greeting()}, friend.
        </Text>

        {/* Scripture of the day — powder-blue card */}
        {votd && (
          <View style={{ marginTop: spacing.l, borderRadius: 24, padding: spacing.l, backgroundColor: colors.scriptureBlue }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2.5, color: colors.navyInk }}>
                SCRIPTURE OF THE DAY
              </Text>
              <Pressable
                onPress={() => router.push(`/reader/${votd.book}/${votd.chapter}?clavis=1`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: colors.white,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Ionicons name="book-outline" size={13} color={colors.navyInk} />
                <Text style={{ fontFamily: fonts.sansMed, fontSize: 12, color: colors.navyInk }}>Read Story</Text>
              </Pressable>
            </View>
            <Text style={{ fontFamily: fonts.serifSemi, fontSize: 23, lineHeight: 36, color: colors.navyInk, marginTop: spacing.m }}>
              "{votd.text}"
            </Text>
            <Text style={{ fontFamily: fonts.serifItalic, fontSize: 16, color: colors.navyInk, marginTop: spacing.m }}>
              — {votd.ref}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.s, marginTop: spacing.l }}>
              <Pressable
                onPress={() => router.push(`/reader/${votd.book}/${votd.chapter}?clavis=1`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: colors.navyInk,
                  borderRadius: 24,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="book-outline" size={15} color={colors.white} />
                <Text style={{ fontFamily: fonts.sansMed, fontSize: 14, color: colors.white }}>Read Today's Story</Text>
              </Pressable>
              <Pressable
                onPress={shareVerse}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: colors.white,
                  borderRadius: 24,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="share-social-outline" size={15} color={colors.navyInk} />
                <Text style={{ fontFamily: fonts.sansMed, fontSize: 14, color: colors.navyInk }}>Share</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Continue reading / Daily quiz */}
        <View style={{ flexDirection: "row", gap: spacing.s, marginTop: spacing.m }}>
          <Pressable
            onPress={() =>
              continueBook && progress
                ? router.push(`/reader/${progress.book_num}/${progress.chapter}`)
                : router.push("/read")
            }
            style={cardStyle}
          >
            <Ionicons name="bookmark" size={22} color={colors.navyInk} />
            <Text style={cardTitle}>{continueBook ? "Continue Reading" : "Start Reading"}</Text>
            <Text style={cardSub}>
              {continueBook && progress ? `${continueBook.name} ${progress.chapter}` : "Choose a book"}
            </Text>
            <View style={arrowCircle}>
              <Ionicons name="arrow-forward" size={15} color={colors.navyInk} />
            </View>
          </Pressable>
          <Pressable onPress={() => router.push("/quiz")} style={cardStyle}>
            <MaterialCommunityIcons name="medal-outline" size={23} color={colors.navyInk} />
            <Text style={cardTitle}>Daily Quiz</Text>
            <Text style={cardSub}>{quizDone ? "Done for today ✓" : "7 questions · today's passage"}</Text>
            <View style={arrowCircle}>
              <Ionicons name="arrow-forward" size={15} color={colors.navyInk} />
            </View>
          </Pressable>
        </View>

        {/* Prayer journal — slate banner */}
        <Pressable
          onPress={() => router.push("/prayer")}
          style={{ marginTop: spacing.s, borderRadius: 24, padding: spacing.l, backgroundColor: colors.slate }}
        >
          <View style={{ alignSelf: "flex-start", backgroundColor: colors.navyInk, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontFamily: fonts.sansMed, fontSize: 10.5, letterSpacing: 2, color: colors.white }}>
              PRAYER JOURNAL
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 23, color: colors.white, marginTop: 12 }}>
            What's on your heart today?
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 6 }}>
            Tap to write today's prayer →
          </Text>
        </Pressable>

        {/* Clavis recommends */}
        <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2.5, color: colors.inkMuted, marginTop: spacing.l }}>
          CLAVIS RECOMMENDS
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.l, gap: spacing.s, marginTop: spacing.m }}
      >
        {RECOMMENDS.map((r) => (
          <Pressable
            key={r.title}
            onPress={() => router.push(`/reader/${r.book}/1?clavis=1`)}
            style={{ width: 228, minHeight: 170, borderRadius: 24, padding: spacing.l, backgroundColor: r.bg }}
          >
            <View style={{ alignSelf: "flex-start", backgroundColor: colors.navyInk, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ fontFamily: fonts.sansMed, fontSize: 10.5, letterSpacing: 1.5, color: colors.white }}>
                {r.badge}
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 27, color: colors.navyInk, marginTop: 12 }}>
              {r.title}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: colors.ink, marginTop: 8 }}>
              {r.blurb}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const cardStyle = {
  flex: 1,
  backgroundColor: colors.card,
  borderRadius: 22,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  padding: spacing.m,
  paddingBottom: 44,
} as const;

const cardTitle = {
  fontFamily: fonts.display,
  fontSize: 19,
  color: colors.navyInk,
  marginTop: 12,
} as const;

const cardSub = {
  fontFamily: fonts.sans,
  fontSize: 13,
  color: colors.inkMuted,
  marginTop: 4,
} as const;

const arrowCircle = {
  position: "absolute",
  right: 12,
  bottom: 12,
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: "#EEF1F6",
  alignItems: "center",
  justifyContent: "center",
} as const;
