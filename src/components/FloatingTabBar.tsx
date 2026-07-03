// Custom floating tab bar — navy pill with gold active state, per the UX schema.
import React from "react";
import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../theme";

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
        backgroundColor: colors.white,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        paddingVertical: 8,
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
              gap: 2,
              paddingVertical: 7,
              borderRadius: 22,
              backgroundColor: focused ? colors.blueSoft : "transparent",
            }}
          >
            <Ionicons name={focused ? icons.active : icons.idle} size={21} color={focused ? colors.blue : colors.ink} />
            <Text
              style={{
                fontFamily: focused ? fonts.sansBold : fonts.sansMed,
                fontSize: 10.5,
                color: focused ? colors.blue : colors.ink,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
