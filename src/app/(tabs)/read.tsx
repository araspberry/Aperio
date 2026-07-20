// Read the Bible — grouped book grid with search.
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { getBooks, type Book } from "../../db/content";
import { fonts, spacing } from "../../theme";
import { useTheme } from "../../lib/theme-context";

const GROUPS: { testament: "OT" | "NT"; label: string; range: [number, number] }[] = [
  { testament: "OT", label: "Pentateuch", range: [1, 5] },
  { testament: "OT", label: "History", range: [6, 17] },
  { testament: "OT", label: "Wisdom & Poetry", range: [18, 22] },
  { testament: "OT", label: "Major Prophets", range: [23, 27] },
  { testament: "OT", label: "Minor Prophets", range: [28, 39] },
  { testament: "NT", label: "Gospels & Acts", range: [40, 44] },
  { testament: "NT", label: "Pauline Epistles", range: [45, 57] },
  { testament: "NT", label: "General Epistles", range: [58, 65] },
  { testament: "NT", label: "Apocalyptic", range: [66, 66] },
];

export default function ReadScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getBooks(db).then(setBooks).catch(() => {});
  }, [db]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q));
  }, [books, query]);

  const testaments: { name: string; key: "OT" | "NT" }[] = [
    { name: "Old Testament", key: "OT" },
    { name: "New Testament", key: "NT" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.parchment }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.m, paddingHorizontal: spacing.l, paddingBottom: 88 }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.heading }}>Read the Bible</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 14.5, color: colors.inkMuted, marginTop: 6 }}>
        All 66 books · tap a chapter to begin.
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          paddingHorizontal: spacing.m,
          marginTop: spacing.m,
        }}
      >
        <Ionicons name="search" size={17} color={colors.inkMuted} />
        <TextInput
          style={{ flex: 1, paddingVertical: 13, paddingHorizontal: spacing.s, fontFamily: fonts.sans, fontSize: 15.5, color: colors.ink }}
          placeholder="Search any book..."
          placeholderTextColor={colors.inkMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      {testaments.map((t) => {
        const tBooks = filtered.filter((b) => b.testament === t.key);
        if (!tBooks.length) return null;
        return (
          <View key={t.key}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginTop: spacing.l,
                borderBottomWidth: 1,
                borderColor: colors.cardBorder,
                paddingBottom: spacing.s,
              }}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.heading }}>{t.name}</Text>
              <Text style={{ fontFamily: fonts.sansMed, fontSize: 12, letterSpacing: 1.5, color: colors.goldDeep }}>
                {tBooks.length} BOOKS
              </Text>
            </View>
            {GROUPS.filter((g) => g.testament === t.key).map((g) => {
              const gBooks = tBooks.filter((b) => b.book_num >= g.range[0] && b.book_num <= g.range[1]);
              if (!gBooks.length) return null;
              return (
                <View key={g.label}>
                  <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2, color: colors.inkMuted, marginTop: spacing.m, marginBottom: spacing.s }}>
                    {g.label.toUpperCase()}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.s }}>
                    {gBooks.map((b) => (
                      <Pressable
                        key={b.book_num}
                        onPress={() => router.push(`/chapter-picker/${b.book_num}`)}
                        style={({ pressed }) => ({
                          width: "48.4%",
                          backgroundColor: pressed ? colors.parchmentAlt : colors.card,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          paddingHorizontal: spacing.m,
                          paddingVertical: 14,
                        })}
                      >
                        <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.heading }} numberOfLines={1}>
                          {b.name}
                        </Text>
                        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, marginTop: 3 }}>
                          {b.chapters_count} chapters
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}
