// Read — all 66 books.
import React, { useEffect, useState } from "react";
import { Text, SectionList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getBooks, type Book } from "../../db/content";
import { colors, fonts, type, spacing } from "../../theme";

export default function ReadScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    getBooks(db).then(setBooks).catch(() => {});
  }, [db]);

  const sections = [
    { title: "Old Testament", data: books.filter((b) => b.testament === "OT") },
    { title: "New Testament", data: books.filter((b) => b.testament === "NT") },
  ];

  return (
    <SectionList
      style={{ backgroundColor: colors.parchment }}
      contentContainerStyle={{ paddingBottom: 120 }}
      sections={sections}
      keyExtractor={(b) => String(b.book_num)}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text style={[type.label, { paddingHorizontal: spacing.m, paddingTop: spacing.m, paddingBottom: spacing.s }]}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/chapter-picker/${item.book_num}`)}
          style={({ pressed }) => ({
            marginHorizontal: spacing.m,
            marginBottom: 6,
            backgroundColor: pressed ? colors.parchmentAlt : colors.card,
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
          <Text style={{ fontFamily: fonts.serifSemi, fontSize: 16, color: colors.ink }}>{item.name}</Text>
          <Text style={type.caption}>{item.chapters_count} ch</Text>
        </Pressable>
      )}
    />
  );
}
