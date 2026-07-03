import React from "react";
import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../components/FloatingTabBar";
import { colors } from "../../theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.parchment },
        headerTintColor: colors.navyDeep,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 18 },
        sceneStyle: { backgroundColor: colors.parchment },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="read" options={{ title: "Read" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="prayer" options={{ title: "Prayer" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
