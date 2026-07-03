import React, { Suspense } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { AuthProvider } from "../lib/auth";
import { colors, type, spacing } from "../theme";

// Graceful error screen — if anything unexpected happens, the reviewer (and the
// user) sees a friendly retry screen instead of a crash.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.parchment, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
      <Text style={[type.h2, { textAlign: "center" }]}>Something went wrong</Text>
      <Text style={[type.body, { textAlign: "center", marginTop: spacing.s, color: colors.inkMuted }]}>
        {error.message}
      </Text>
      <Pressable
        onPress={retry}
        style={{ marginTop: spacing.l, backgroundColor: colors.navy, paddingHorizontal: spacing.l, paddingVertical: spacing.m, borderRadius: 12 }}
      >
        <Text style={{ color: colors.goldSoft, fontWeight: "600", fontSize: 16 }}>Try again</Text>
      </Pressable>
    </View>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<Loading />}>
      <SQLiteProvider
        databaseName="aperio-content.db"
        assetSource={{ assetId: require("../../assets/db/aperio.db") }}
        useSuspense
      >
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.parchment },
              headerTintColor: colors.navy,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.parchment },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="read/[book]/[chapter]" options={{ headerBackTitle: "Books" }} />
          </Stack>
        </AuthProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
