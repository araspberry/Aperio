import React, { Suspense, useEffect } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_600SemiBold,
} from "@expo-google-fonts/lora";
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from "@expo-google-fonts/inter";
import { File, Paths } from "expo-file-system";
import { AuthProvider } from "../lib/auth";
import { ThemeProvider, useTheme } from "../lib/theme-context";
import { colors, spacing } from "../theme";

// Graceful error screen — reviewers (and users) see a friendly retry, never a crash.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.parchment, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
      <Text style={{ fontSize: 22, color: colors.navyDeep, fontWeight: "700", textAlign: "center" }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 15, color: colors.inkMuted, textAlign: "center", marginTop: spacing.s }}>
        {error.message}
      </Text>
      <Pressable
        onPress={retry}
        style={{ marginTop: spacing.l, backgroundColor: colors.navyDeep, paddingHorizontal: spacing.l, paddingVertical: spacing.m, borderRadius: 12 }}
      >
        <Text style={{ color: colors.goldSoft, fontWeight: "600", fontSize: 16 }}>Try again</Text>
      </Pressable>
    </View>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.navyDeep, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}

function ThemedApp() {
  const { colors: c, dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.parchment },
          headerTintColor: c.heading,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 18 },
          contentStyle: { backgroundColor: c.parchment },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chapter-picker/[book]" options={{ headerBackTitle: "Read" }} />
        <Stack.Screen name="reader/[book]/[chapter]" options={{ headerShown: false }} />
        <Stack.Screen name="quiz" options={{ presentation: "fullScreenModal", headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  // One-time cleanup: remove the v1 content DB copy (superseded by aperio-content-v2.db,
  // which carries the crossrefs table).
  useEffect(() => {
    try {
      const old = new File(Paths.document, "SQLite/aperio-content.db");
      if (old.exists) old.delete();
    } catch {}
  }, []);

  if (!fontsLoaded) return <Loading />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<Loading />}>
        <SQLiteProvider
          databaseName="aperio-content-v2.db"
          assetSource={{ assetId: require("../../assets/db/aperio.db") }}
          useSuspense
        >
          <AuthProvider>
            <ThemeProvider>
              <ThemedApp />
            </ThemeProvider>
          </AuthProvider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}
