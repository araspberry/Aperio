// Tap a gold word → Greek/Hebrew definition slide-up.
import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type StrongsEntry } from "../db/content";
import { colors, fonts, spacing } from "../theme";

export function StrongsPopover({
  entry,
  word,
  onClose,
}: {
  entry: StrongsEntry | null;
  word: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!entry} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(13,26,48,0.35)" }} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.card,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: spacing.l,
          paddingBottom: insets.bottom + spacing.l,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        {entry && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, flex: 1 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.navyDeep }}>{entry.lemma}</Text>
                <Text style={{ fontFamily: fonts.serifItalic, fontSize: 15, color: colors.inkMuted }}>
                  {entry.translit}
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: colors.goldDeep }}>
                {entry.id} · {entry.language}
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
              behind “{word}”
            </Text>
            <Text style={{ fontFamily: fonts.serif, fontSize: 16, lineHeight: 26, color: colors.ink, marginTop: spacing.m }}>
              {entry.definition || entry.kjv_def}
            </Text>
            {!!entry.kjv_def && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.inkMuted, marginTop: spacing.s }}>
                KJV renderings: {entry.kjv_def}
              </Text>
            )}
            {!!entry.pron && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.inkMuted, marginTop: 4 }}>
                Pronounced: {entry.pron}
              </Text>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}
