// Chapter commentary in three voices: Devotional, Scholarly, Prophetic.
import React, { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Commentary } from "../db/content";
import { colors, spacing, fonts } from "../theme";

const TONES = [
  { key: "devotional", label: "Devotional" },
  { key: "scholarly", label: "Scholarly" },
  { key: "prophetic", label: "Prophetic" },
] as const;

type ToneKey = (typeof TONES)[number]["key"];

/** Minimal, crash-proof rendering of the commentary's light markdown. */
function CommentaryBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (/^#{1,3}\s/.test(trimmed)) {
          return (
            <Text
              key={i}
              style={{ fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: colors.navy, fontWeight: "700", marginBottom: spacing.m }}
            >
              {trimmed.replace(/^#{1,3}\s*/, "")}
            </Text>
          );
        }
        const clean = trimmed.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\n/g, " ");
        return (
          <Text
            key={i}
            style={{ fontFamily: fonts.serif, fontSize: 17, lineHeight: 28, color: colors.ink, marginBottom: spacing.m }}
          >
            {clean}
          </Text>
        );
      })}
    </>
  );
}

export function CommentarySheet({
  commentary,
  visible,
  onClose,
}: {
  commentary: Commentary | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [tone, setTone] = useState<ToneKey>("devotional");
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.parchment }}>
        <View
          style={{
            paddingTop: spacing.m,
            paddingHorizontal: spacing.m,
            paddingBottom: spacing.s,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 20, fontWeight: "700", color: colors.navy }}>
              {commentary?.reference ?? "Commentary"}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ color: colors.goldDeep, fontSize: 16, fontWeight: "600" }}>Done</Text>
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: "row",
              marginTop: spacing.m,
              backgroundColor: colors.parchmentDeep,
              borderRadius: 10,
              padding: 3,
            }}
          >
            {TONES.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTone(t.key)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: tone === t.key ? colors.navy : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: tone === t.key ? colors.goldSoft : colors.inkMuted,
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.l, paddingBottom: insets.bottom + spacing.xl }}
        >
          {commentary ? (
            <CommentaryBody text={commentary[tone] || "Commentary for this chapter is on its way."} />
          ) : (
            <Text style={{ fontFamily: fonts.serif, fontSize: 17, color: colors.inkMuted }}>
              Commentary for this chapter is on its way.
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
