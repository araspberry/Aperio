// Prayer journal — kept on this device; syncs when signed in.
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { listPrayers, addPrayer, updatePrayer, deletePrayer, getStreak, recordActivity, type Prayer } from "../../db/user";
import { fullSync } from "../../lib/sync";
import { AnimatedFlame } from "../../components/AnimatedFlame";
import { spacing, fonts } from "../../theme";
import { useTheme } from "../../lib/theme-context";

export default function PrayerScreen() {
  const { colors, type } = useTheme();
  const insets = useSafeAreaInsets();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [editing, setEditing] = useState<Prayer | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [streak, setStreak] = useState(0);

  const load = useCallback(async () => {
    try {
      setPrayers(await listPrayers());
      setStreak(await getStreak());
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openEditor = (p: Prayer | "new") => {
    setEditing(p);
    setTitle(p === "new" ? "" : p.title);
    setBody(p === "new" ? "" : p.body);
  };

  const save = async () => {
    const t = title.trim();
    if (!t) return;
    try {
      if (editing === "new") await addPrayer(t, body.trim());
      else if (editing) await updatePrayer(editing.id, { title: t, body: body.trim() });
      await recordActivity();
      setEditing(null);
      await load();
      fullSync().catch(() => {});
    } catch {}
  };

  const toggleAnswered = async (p: Prayer) => {
    try {
      await updatePrayer(p.id, { answered: !p.answered });
      await load();
      fullSync().catch(() => {});
    } catch {}
  };

  const remove = (p: Prayer) => {
    Alert.alert("Delete prayer?", `"${p.title}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePrayer(p.id);
            await load();
            fullSync().catch(() => {});
          } catch {}
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.parchment }}>
      <FlatList
        data={prayers}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.m, paddingBottom: 88 + insets.bottom }}
        ListHeaderComponent={
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: spacing.s }}>
            <AnimatedFlame streak={streak} />
          </View>
        }
        ListEmptyComponent={
          <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.m }}>
            <Text style={[type.body, { color: colors.inkMuted, textAlign: "center" }]}>
              A quiet place to bring your requests — and to remember when they're answered.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEditor(item)}
            onLongPress={() => remove(item)}
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              padding: spacing.m,
              marginBottom: spacing.s,
              opacity: item.answered ? 0.75 : 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s }}>
              <Pressable onPress={() => toggleAnswered(item)} hitSlop={10}>
                <Ionicons
                  name={item.answered ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={item.answered ? colors.goldDeep : colors.inkMuted}
                />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 17,
                    color: colors.ink,
                    textDecorationLine: item.answered ? "line-through" : "none",
                  }}
                >
                  {item.title}
                </Text>
                {!!item.body && (
                  <Text style={[type.caption, { marginTop: 2 }]} numberOfLines={2}>
                    {item.body}
                  </Text>
                )}
              </View>
              {item.answered ? (
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.goldDeep }}>ANSWERED</Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
      <Pressable
        onPress={() => openEditor("new")}
        style={{
          position: "absolute",
          right: spacing.l,
          bottom: insets.bottom + 100,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.navyInk,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>

      <Modal visible={editing !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: colors.parchment }}
        >
          <View style={{ padding: spacing.m, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Pressable onPress={() => setEditing(null)} hitSlop={12}>
              <Text style={{ color: colors.inkMuted, fontSize: 16 }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontFamily: fonts.serif, fontSize: 18, fontWeight: "700", color: colors.navy }}>
              {editing === "new" ? "New Prayer" : "Edit Prayer"}
            </Text>
            <Pressable onPress={save} hitSlop={12} disabled={!title.trim()}>
              <Text style={{ color: title.trim() ? colors.goldDeep : colors.border, fontSize: 16, fontWeight: "700" }}>
                Save
              </Text>
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: spacing.m, gap: spacing.s }}>
            <TextInput
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                padding: spacing.m,
                fontSize: 17,
                fontFamily: fonts.serif,
                color: colors.ink,
              }}
              placeholder="What are you praying for?"
              placeholderTextColor={colors.inkMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <TextInput
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                padding: spacing.m,
                fontSize: 15,
                color: colors.ink,
                minHeight: 140,
                textAlignVertical: "top",
              }}
              placeholder="Details, scripture, people on your heart…"
              placeholderTextColor={colors.inkMuted}
              value={body}
              onChangeText={setBody}
              multiline
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
