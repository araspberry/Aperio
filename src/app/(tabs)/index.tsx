// Home — verse of the day, continue reading, quick links.
import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { getBooks, getVersePreview, type Book } from "../../db/content";
import { getProgress, getStreak, getTodayQuiz } from "../../db/user";
import { verseOfDayRef } from "../../lib/verse-of-day";
import { colors, fonts, type, spacing } from "../../theme";

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<{ book_num: number; chapter: number } | null>(null);
  const [votd, setVotd] = useState<{ ref: string; text: string; book: number; chapter: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const allBooks = await getBooks(db);
          const [b, c, v] = verseOfDayRef();
          const text = await getVersePreview(db, b, c, v);
          const name = allBooks.find((x) => x.book_num === b)?.name ?? "";
          const [p, s, q] = await Promise.all([getProgress(), getStreak(), getTodayQuiz()]);
          if (!active) return;
          setBooks(allBooks);
          setVotd({ ref: `${name} ${c}:${v}`, text, book: b, chapter: c });
          setProgress(p);
          setStreak(s);
          setQuizDone(!!q);
        } catch {}
      })();
      return () => {
        active = false;
      };
    }, [db]),
  );

  const continueBook = progress ? books.find((b) => b.book_num === progress.book_num) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.parchment }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.m, paddingHorizontal: spacing.m, paddingBottom: 120 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s }}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={{ width: 34, height: 34, borderRadius: 8 }}
            resizeMode="contain"
          />
          <Text style={type.h1}>Aperio</Text>
        </View>
        {streak > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.parchmentAlt, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="flame" size={14} color={colors.gold} />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.goldDeep }}>{streak}</Text>
          </View>
        )}
      </View>
      <Text style={[type.caption, { marginTop: 2 }]}>Scripture, opened.</Text>

      {/* Verse of the day */}
      {votd && (
        <Pressable
          onPress={() => router.push(`/reader/${votd.book}/${votd.chapter}`)}
          style={{ marginTop: spacing.m, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.l }}
        >
          <Text style={type.label}>Verse of the day</Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 18, lineHeight: 30, color: colors.ink, marginTop: spacing.s }}>
            {votd.text}
          </Text>
          <Text style={{ fontFamily: fonts.displayMed, fontSize: 15, color: colors.goldDeep, marginTop: spacing.s }}>
            — {votd.ref}
          </Text>
        </Pressable>
      )}

      {/* Continue reading */}
      {continueBook && progress && (
        <Pressable
          onPress={() => router.push(`/reader/${progress.book_num}/${progress.chapter}`)}
          style={{
            marginTop: spacing.m,
            backgroundColor: colors.navyDeep,
            borderRadius: 18,
            padding: spacing.m,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={[type.label, { color: colors.goldSoft }]}>Continue reading</Text>
            <Text style={{ color: colors.white, fontFamily: fonts.display, fontSize: 20, marginTop: 4 }}>
              {continueBook.name} {progress.chapter}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color={colors.gold} />
        </Pressable>
      )}

      {/* Quick links */}
      <Text style={[type.label, { marginTop: spacing.l, marginBottom: spacing.s }]}>Quick links</Text>
      <View style={{ flexDirection: "row", gap: spacing.s }}>
        <QuickLink
          icon="sparkles"
          label={quizDone ? "Quiz done ✓" : "Daily quiz"}
          onPress={() => router.push("/quiz")}
        />
        <QuickLink icon="book" label="Books" onPress={() => router.push("/read")} />
        <QuickLink icon="search" label="Search" onPress={() => router.push("/search")} />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.s, marginTop: spacing.s }}>
        <QuickLink icon="rose" label="Prayer" onPress={() => router.push("/prayer")} />
        <QuickLink
          icon="shuffle"
          label="Surprise me"
          onPress={() => {
            if (!books.length) return;
            const b = books[Math.floor(Math.random() * books.length)];
            const c = 1 + Math.floor(Math.random() * b.chapters_count);
            router.push(`/reader/${b.book_num}/${c}`);
          }}
        />
        <QuickLink icon="bookmark" label="Saved" onPress={() => router.push("/profile")} />
      </View>
    </ScrollView>
  );
}

function QuickLink({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed ? colors.parchmentAlt : colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 16,
        alignItems: "center",
        gap: 6,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.goldDeep} />
      <Text style={{ fontFamily: fonts.sansMed, fontSize: 12, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}
