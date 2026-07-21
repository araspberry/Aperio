// Settings / About — support, legal, and app info in one place.
import React from "react";
import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { fonts, spacing } from "../../theme";
import { useTheme } from "../../lib/theme-context";

function Row({ icon, label, sub, onPress, last }: { icon: any; label: string; sub?: string; onPress: () => void; last?: boolean }) {
  const { colors, type } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.chip,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={colors.navyInk} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.sansMed, fontSize: 15.5, color: colors.ink }}>{label}</Text>
        {!!sub && <Text style={[type.caption, { marginTop: 1 }]}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={{ fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 2, color: colors.inkMuted, marginTop: spacing.l, marginBottom: spacing.s, marginLeft: 4 }}>
      {children}
    </Text>
  );
}

import type { Palette } from "../../theme";

const card = (colors: Palette) => ({
  backgroundColor: colors.card,
  borderRadius: 22,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  paddingHorizontal: spacing.m,
} as const);

export default function SettingsScreen() {
  const { colors, type } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.parchment }}
      contentContainerStyle={{ padding: spacing.m, paddingBottom: 88 }}
    >
      <View style={{ ...card(colors), paddingVertical: spacing.m }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.heading }}>Where the Word opens.</Text>
        <Text style={[type.caption, { marginTop: 6, lineHeight: 18 }]}>
          Aperio is a quiet place to read, study, and pray — with Scripture and Clavis commentary
          stored on your device, so it works anywhere, even offline. Scripture is presented in the
          New Clavis Translation (NCT), an original English rendering prepared for Aperio.
        </Text>
      </View>

      <SectionLabel>SUPPORT</SectionLabel>
      <View style={card(colors)}>
        <Row
          icon="mail-outline"
          label="Contact support"
          sub="support@aperiobible.app"
          onPress={() => Linking.openURL("mailto:support@aperiobible.app")}
        />
        <Row
          icon="star-outline"
          label="Rate Aperio"
          sub="Love the app? A review helps others find it."
          onPress={() => Linking.openURL("https://apps.apple.com/app/id6763618868?action=write-review")}
        />
        <Row
          icon="globe-outline"
          label="Visit aperiobible.app"
          onPress={() => Linking.openURL("https://aperiobible.app")}
          last
        />
      </View>

      <SectionLabel>LEGAL</SectionLabel>
      <View style={card(colors)}>
        <Row
          icon="document-text-outline"
          label="Terms of use"
          onPress={() => Linking.openURL("https://aperiobible.app/terms.html")}
        />
        <Row
          icon="shield-checkmark-outline"
          label="Privacy policy"
          sub="Your faith data is never sold or used for ads."
          onPress={() => Linking.openURL("https://aperiobible.app/privacy.html")}
          last
        />
      </View>

      <Text style={{ textAlign: "center", fontFamily: fonts.serifItalic, fontSize: 14, color: colors.inkMuted, marginTop: spacing.xl }}>
        "Open my eyes, that I may behold wondrous things out of your law." — Psalm 119:18
      </Text>
      <Text style={{ textAlign: "center", fontFamily: fonts.sans, fontSize: 12, color: colors.verseNum, marginTop: 8 }}>
        Aperio {Constants.expoConfig?.version ?? "1.1.0"}
      </Text>
    </ScrollView>
  );
}
