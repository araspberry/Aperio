// Search scripture — by phrase or by reference ("John 3:16").
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { getBooks, searchVerses, parseReference, type Book, type SearchHit } from "../../db/content";
import { colors, spacing, fonts, type } from "../../theme";

export default function SearchScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [refHit, setRefHit] = useState<{ book: Book; chapter: number; verse?: number } | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    getBooks(db).then(setBooks).catch(() => {});
  }, [db]);

  const runSearch = async (text: string) => {
    const q = text.trim();
    setQuery(text);
    if (q.length < 2) {
      setHits([]);
      setRefHit(null);
      setSearched(false);
      return;
    }
    setRefHit(parseReference(books, q));
    if (q.length >= 3) {
      try {
        setHits(await searchVerses(db, q));
        setSearched(true);
      } catch {
        setHits([]);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.parchment }}>
      <View style={{ padding: spacing.m }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.m,
          }}
        >
          <Ionicons name="search" size={18} color={colors.inkMuted} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: spacing.s, fontSize: 16, color: colors.ink }}
            placeholder='Try "living water" or John 3:16'
            placeholderTextColor={colors.inkMuted}
            value={query}
            onChangeText={runSearch}
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>
      </View>
      <FlatList
        data={hits}
        keyExtractor={(h) => `${h.book_num}-${h.chapter}-${h.verse}`}
        contentContainerStyle={{ paddingHorizontal: spacing.m, paddingBottom: spacing.xl }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          refHit ? (
            <Pressable
              onPress={() => router.push(`/read/${refHit.book.book_num}/${refHit.chapter}`)}
              style={{
                backgroundColor: colors.navy,
                borderRadius: 14,
                padding: spacing.m,
                marginBottom: spacing.m,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.goldSoft, fontFamily: fonts.serif, fontSize: 18 }}>
                Go to {refHit.book.name} {refHit.chapter}
                {refHit.verse ? `:${refHit.verse}` : ""}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.gold} />
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          searched && query.trim().length >= 3 ? (
            <Text style={[type.body, { color: colors.inkMuted, textAlign: "center", marginTop: spacing.xl }]}>
              No verses found. Try different words.
            </Text>
          ) : (
            <Text style={[type.body, { color: colors.inkMuted, textAlign: "center", marginTop: spacing.xl }]}>
              Search all 31,000 verses — instantly, even offline.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/read/${item.book_num}/${item.chapter}`)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.parchmentDeep : colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.m,
              marginBottom: spacing.s,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.goldDeep, marginBottom: 4 }}>
              {item.book_name} {item.chapter}:{item.verse}
            </Text>
            <Text style={{ fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.ink }} numberOfLines={4}>
              {item.text}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
