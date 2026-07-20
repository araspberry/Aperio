import React from "react";
import { Tabs } from "expo-router";
import { FabMenu } from "../../components/FabMenu";
import { useTheme } from "../../lib/theme-context";

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <FabMenu {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.parchment },
        headerTintColor: colors.heading,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 18 },
        sceneStyle: { backgroundColor: colors.parchment },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="read" options={{ title: "Read", headerShown: false }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="prayer" options={{ title: "Prayer" }} />
      <Tabs.Screen name="profile" options={{ title: "Account" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
