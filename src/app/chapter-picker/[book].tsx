// Chapter picker — numbered grid.
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getBook, type Book } from "../../db/content";
import { fonts, spacing } from "../../theme";
import { useTheme } from "../../lib/theme-context";

export default function ChapterPicker() {
  const { colors } = useTheme();
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookNum = parseInt(book ?? "1", 10) || 1;
  const db = useSQLiteContext();
  const router = useRouter();
  const [b, setB] = useState<Book | null>(null);

  useEffect(() => {
    getBook(db, bookNum).then(setB).catch(() => {});
  }, [db, bookNum]);

  if (!b) return <View style={{ flex: 1, backgroundColor: colors.parchment }} />;

  return (
    <>
      <Stack.Screen options={{ title: b.name }} />
      <FlatList
        style={{ backgroundColor: colors.parchment }}
        contentContainerStyle={{ padding: spacing.m, paddingBottom: 120 }}
        data={Array.from({ length: b.chapters_count }, (_, i) => i + 1)}
        numColumns={5}
        keyExtractor={(n) => String(n)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/reader/${bookNum}/${item}`)}
            style={({ pressed }) => ({
              flex: 1,
              margin: 4,
              aspectRatio: 1,
              maxWidth: "18%",
              borderRadius: 12,
              backgroundColor: pressed ? colors.goldSoft : colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text style={{ fontFamily: fonts.serifSemi, fontSize: 16, color: colors.ink }}>{item}</Text>
          </Pressable>
        )}
      />
    </>
  );
}
