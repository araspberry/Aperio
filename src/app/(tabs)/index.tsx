// Home / Read — continue reading + the library of 66 books.
import React, { useCallback, useState } from "react";
import { View, Text, SectionList, Pressable, Image } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { getBooks, type Book } from "../../db/content";
import { getProgress } from "../../db/user";
import { colors, type, spacing, fonts } from "../../theme";

interface Progress {
  book_num: number;
  chapter: number;
}

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const [allBooks, p] = await Promise.all([getBooks(db), getProgress()]);
          if (!active) return;
          setBooks(allBooks);
          setProgress(p);
        } catch {
          // Keep whatever we already have on screen.
        }
      })();
      return () => {
        active = false;
      };
    }, [db]),
  );

  const continueBook = progress ? books.find((b) => b.book_num === progress.book_num) : null;

  const sections = [
    { title: "Old Testament", data: books.filter((b) => b.testament === "OT") },
    { title: "New Testament", data: books.filter((b) => b.testament === "NT") },
  ];

  return (
    <SectionList
      style={{ backgroundColor: colors.parchment }}
      contentContainerStyle={{ paddingBottom: spacing.xl, paddingTop: insets.top + spacing.m }}
      sections={sections}
      keyExtractor={(b) => String(b.book_num)}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: spacing.m, marginBottom: spacing.m }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s }}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={{ width: 34, height: 34, borderRadius: 8 }}
              resizeMode="contain"
            />
            <Text style={type.h1}>Aperio</Text>
          </View>
          <Text style={[type.caption, { marginTop: 2 }]}>Scripture, opened.</Text>
          {continueBook && progress && (
            <Pressable
              onPress={() => router.push(`/read/${progress.book_num}/${progress.chapter}`)}
              style={{
                marginTop: spacing.m,
                backgroundColor: colors.navy,
                borderRadius: 16,
                padding: spacing.m,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ color: colors.goldSoft, fontSize: 12, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>
                  Continue reading
                </Text>
                <Text style={{ color: colors.white, fontFamily: fonts.serif, fontSize: 20, marginTop: 4 }}>
                  {continueBook.name} {progress.chapter}
                </Text>
              </View>
              <Text style={{ color: colors.gold, fontSize: 24 }}>→</Text>
            </Pressable>
          )}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text
          style={{
            ...type.caption,
            fontWeight: "700",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            paddingHorizontal: spacing.m,
            paddingTop: spacing.m,
            paddingBottom: spacing.s,
            backgroundColor: colors.parchment,
          }}
        >
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/read/${item.book_num}`)}
          style={({ pressed }) => ({
            marginHorizontal: spacing.m,
            marginBottom: 6,
            backgroundColor: pressed ? colors.parchmentDeep : colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.m,
            paddingVertical: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          })}
        >
          <Text style={{ fontFamily: fonts.serif, fontSize: 17, color: colors.ink }}>{item.name}</Text>
          <Text style={type.caption}>{item.chapters_count} ch</Text>
        </Pressable>
      )}
    />
  );
}
