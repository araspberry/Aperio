// Chat-launcher style navigation — a pulsating navy button in the bottom-right
// corner that opens a themed menu (replaces the floating tab bar).
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts } from "../theme";
import { useTheme } from "../lib/theme-context";

const ITEMS: { route: string; path: string; label: string }[] = [
  { route: "index", path: "/", label: "Home" },
  { route: "read", path: "/read", label: "Read" },
  { route: "search", path: "/search", label: "Search" },
  { route: "prayer", path: "/prayer", label: "Prayer" },
  { route: "profile", path: "/profile", label: "Account" },
  { route: "settings", path: "/settings", label: "Settings" },
];

function ItemIcon({ route, color }: { route: string; color: string }) {
  const size = 19;
  switch (route) {
    case "index":
      return <Ionicons name="home-outline" size={size} color={color} />;
    case "read":
      return <MaterialCommunityIcons name="book-cross" size={size} color={color} />;
    case "search":
      return <Ionicons name="search" size={size} color={color} />;
    case "prayer":
      return <MaterialCommunityIcons name="hands-pray" size={size} color={color} />;
    case "profile":
      return <Ionicons name="person-outline" size={size} color={color} />;
    case "settings":
      return <Ionicons name="settings-outline" size={size} color={color} />;
    default:
      return <Ionicons name="ellipse-outline" size={size} color={color} />;
  }
}

export function FabMenu() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  // Radiating pulse behind the launcher, like a chat widget.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Menu spring-in.
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: open ? 1 : 0, useNativeDriver: true, friction: 8, tension: 90 }).start();
  }, [open, anim]);

  // Highlight "Read" while inside the reader or chapter picker too.
  const activeRoute =
    pathname === "/" ? "index"
    : pathname.startsWith("/reader") || pathname.startsWith("/chapter-picker") || pathname.startsWith("/read") ? "read"
    : ITEMS.find((i) => pathname.startsWith(i.path) && i.path !== "/")?.route ?? "";

  const go = (item: (typeof ITEMS)[number]) => {
    setOpen(false);
    if (item.route !== activeRoute || item.route === "read") router.push(item.path as any);
  };

  const bottom = Math.max(insets.bottom, 14) + 8;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
      {open && (
        <Pressable
          onPress={() => setOpen(false)}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(13,26,48,0.45)" }}
        />
      )}

      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={{
          position: "absolute",
          right: 20,
          bottom: bottom + 76,
          width: 232,
          backgroundColor: colors.menuBg,
          borderRadius: 26,
          paddingVertical: 10,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansMed,
            fontSize: 10.5,
            letterSpacing: 2.5,
            color: colors.inkMuted,
            paddingHorizontal: 18,
            paddingTop: 6,
            paddingBottom: 4,
          }}
        >
          WHERE TO?
        </Text>
        {ITEMS.map((item) => {
          const focused = item.route === activeRoute;
          return (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => go(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginHorizontal: 8,
                paddingHorizontal: 10,
                paddingVertical: 9,
                borderRadius: 18,
                backgroundColor: focused ? colors.scriptureBlue : "transparent",
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: focused ? colors.menuChipActive : colors.menuChip,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ItemIcon route={item.route} color={colors.heading} />
              </View>
              <Text
                style={{
                  fontFamily: focused ? fonts.sansBold : fonts.sansMed,
                  fontSize: 15,
                  color: colors.heading,
                }}
              >
                {item.label}
              </Text>
              {focused && (
                <View style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 3, backgroundColor: colors.goldDeep }} />
              )}
            </Pressable>
          );
        })}
      </Animated.View>

      <View pointerEvents="box-none" style={{ position: "absolute", right: 20, bottom, width: 60, height: 60 }}>
        {!open && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.navyInk,
              opacity: pulse.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.35, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] }) }],
            }}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? "Close menu" : "Open menu"}
          onPress={() => setOpen(!open)}
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.navyInk,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pressed ? 0.94 : 1 }],
            shadowColor: "#0D1A30",
            shadowOpacity: 0.35,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 10,
          })}
        >
          <Animated.View
            style={{
              transform: [
                { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) },
              ],
            }}
          >
            <Ionicons name="add" size={30} color={colors.white} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}
