// Custom floating tab bar — dark navy pill with light icons (Jul 2026 redesign).
import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme";

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  index: { active: "home", idle: "home-outline" },
  read: { active: "reader", idle: "reader-outline" },
  search: { active: "search", idle: "search-outline" },
  prayer: { active: "flame", idle: "flame-outline" },
  profile: { active: "person", idle: "person-outline" },
};

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: Math.max(insets.bottom, 12),
        backgroundColor: colors.navyInk,
        borderRadius: 32,
        flexDirection: "row",
        paddingVertical: 12,
        paddingHorizontal: 8,
        shadowColor: "#1B2A4A",
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
      }}
    >
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const focused = state.index === index;
        const icons = ICONS[route.name] ?? { active: "ellipse", idle: "ellipse-outline" };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 9,
              borderRadius: 22,
              backgroundColor: focused ? "rgba(255,255,255,0.12)" : "transparent",
            }}
          >
            {route.name === "read" ? (
              <MaterialCommunityIcons name="book-cross" size={22} color={focused ? colors.white : "#94A0BC"} />
            ) : route.name === "prayer" ? (
              <MaterialCommunityIcons name="hands-pray" size={22} color={focused ? colors.white : "#94A0BC"} />
            ) : (
              <Ionicons name={focused ? icons.active : icons.idle} size={22} color={focused ? colors.white : "#94A0BC"} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
