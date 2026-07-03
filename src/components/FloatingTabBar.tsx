// Custom floating tab bar — navy pill with gold active state, per the UX schema.
import React from "react";
import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../theme";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home",
  read: "book",
  search: "search",
  prayer: "rose",
  profile: "person-circle",
};

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
        backgroundColor: colors.navyDeep,
        borderRadius: 28,
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 6,
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
      }}
    >
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const focused = state.index === index;
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
            style={{ flex: 1, alignItems: "center", gap: 2 }}
          >
            <Ionicons
              name={ICONS[route.name] ?? "ellipse"}
              size={21}
              color={focused ? colors.gold : colors.tabInactive}
            />
            <Text
              style={{
                fontFamily: fonts.sansMed,
                fontSize: 10,
                color: focused ? colors.goldSoft : colors.tabInactive,
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
