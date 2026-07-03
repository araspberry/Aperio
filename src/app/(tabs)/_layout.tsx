import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.parchment },
        headerTintColor: colors.navy,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.navy, borderTopColor: colors.navySoft },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "#8E96AC",
        sceneStyle: { backgroundColor: colors.parchment },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Read",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "Word Study",
          tabBarIcon: ({ color, size }) => <Ionicons name="language" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: "Prayer",
          tabBarIcon: ({ color, size }) => <Ionicons name="rose" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
