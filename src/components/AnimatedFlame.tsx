// Streak flame — gently pulses while the streak is alive.
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../theme";
import { useTheme } from "../lib/theme-context";

export function AnimatedFlame({ streak }: { streak: number }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.18, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [streak, scale]);

  if (streak <= 0) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Ionicons name="flame-outline" size={16} color={colors.inkMuted} />
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted }}>Start a streak today</Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name="flame" size={18} color={colors.gold} />
      </Animated.View>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.goldDeep }}>
        {streak} day{streak === 1 ? "" : "s"}
      </Text>
    </View>
  );
}
