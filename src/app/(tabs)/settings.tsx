// Settings — simple, quiet: support, privacy, about.
import React from "react";
import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, type } from "../../theme";

function Row({ icon, label, sub, onPress, last }: { icon: any; label: string; sub?: string; onPress: () => void; last?: boolean }) {
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
          backgroundColor: "#EEF1F6",
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

export default function SettingsScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.parchment }}
      contentContainerStyle={{ padding: spacing.m, paddingBottom: 130 }}
    >
      <View style={{ backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.m }}>
        <Row
          icon="mail-outline"
          label="Contact support"
          sub="support@aperiobible.app"
          onPress={() => Linking.openURL("mailto:support@aperiobible.app")}
        />
        <Row
          icon="shield-checkmark-outline"
          label="Privacy policy"
          sub="Your faith data is never sold or used for ads."
          onPress={() => Linking.openURL("https://aperiobible.app/privacy.html")}
        />
        <Row
          icon="globe-outline"
          label="Visit aperiobible.app"
          onPress={() => Linking.openURL("https://aperiobible.app")}
          last
        />
      </View>

      <Text style={{ textAlign: "center", fontFamily: fonts.serifItalic, fontSize: 14, color: colors.inkMuted, marginTop: spacing.xl }}>
        Where the Word opens.
      </Text>
      <Text style={{ textAlign: "center", fontFamily: fonts.sans, fontSize: 12, color: colors.verseNum, marginTop: 6 }}>
        Aperio 1.0.0
      </Text>
    </ScrollView>
  );
}
