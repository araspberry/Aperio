// Word Study — the full Strong's Hebrew & Greek lexicon, offline.
import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, Keyboard } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { searchStrongs, type StrongsEntry } from "../../db/content";
import { colors, spacing, fonts, type } from "../../theme";

export default function StudyScreen() {
  const db = useSQLiteContext();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<StrongsEntry[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const runSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setHits([]);
      return;
    }
    try {
      setHits(await searchStrongs(db, text));
    } catch {
      setHits([]);
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
          <Ionicons name="language" size={18} color={colors.inkMuted} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: spacing.s, fontSize: 16, color: colors.ink }}
            placeholder='Try "agape", "shalom", or H1254'
            placeholderTextColor={colors.inkMuted}
            value={query}
            onChangeText={runSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>
      </View>
      <FlatList
        data={hits}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingHorizontal: spacing.m, paddingBottom: spacing.xl }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.m }}>
            <Text style={[type.body, { color: colors.inkMuted, textAlign: "center" }]}>
              Explore the original Hebrew and Greek behind the English — 14,000+ entries from Strong's
              lexicon, fully offline.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const expanded = open === item.id;
          return (
            <Pressable
              onPress={() => setOpen(expanded ? null : item.id)}
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: expanded ? colors.gold : colors.border,
                padding: spacing.m,
                marginBottom: spacing.s,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serif, fontSize: 20, color: colors.navy }}>{item.lemma}</Text>
                  <Text style={{ fontSize: 14, color: colors.inkMuted, fontStyle: "italic" }}>{item.translit}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.goldDeep }}>
                  {item.id} · {item.language}
                </Text>
              </View>
              <Text style={{ ...type.body, marginTop: 6 }} numberOfLines={expanded ? undefined : 2}>
                {item.definition || item.kjv_def}
              </Text>
              {expanded && (
                <>
                  {!!item.derivation && (
                    <Text style={[type.caption, { marginTop: spacing.s }]}>Derivation: {item.derivation}</Text>
                  )}
                  {!!item.kjv_def && (
                    <Text style={[type.caption, { marginTop: 4 }]}>KJV renderings: {item.kjv_def}</Text>
                  )}
                  {!!item.pron && <Text style={[type.caption, { marginTop: 4 }]}>Pronounced: {item.pron}</Text>}
                </>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
