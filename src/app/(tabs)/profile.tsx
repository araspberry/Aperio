// Profile — bookmarks, optional sign-in, and about.
import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform, Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as AppleAuthentication from "expo-apple-authentication";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { fullSync } from "../../lib/sync";
import { listBookmarks, type Bookmark } from "../../db/user";
import { getBooks, type Book } from "../../db/content";
import { colors, spacing, fonts, type } from "../../theme";

export default function ProfileScreen() {
  const { session, loading, signInWithApple, signInWithGoogle, signOut } = useAuth();
  const db = useSQLiteContext();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [syncing, setSyncing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listBookmarks().then(setBookmarks).catch(() => {});
      getBooks(db).then(setBooks).catch(() => {});
    }, [db]),
  );

  const bookName = (n: number) => books.find((b) => b.book_num === n)?.name ?? "";

  const manualSync = async () => {
    setSyncing(true);
    try {
      await fullSync();
      setBookmarks(await listBookmarks());
    } catch {}
    setSyncing(false);
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently removes your account and all synced data from our servers. Data saved on this device stays on your phone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.functions.invoke("delete-account");
              if (error) throw error;
              await signOut();
              Alert.alert("Account deleted", "Your account and synced data have been removed.");
            } catch {
              Alert.alert("Couldn't delete account", "Check your connection and try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.parchment }} contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xl }}>
      {/* Account */}
      <View style={{ backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.m }}>
        {session ? (
          <>
            <Text style={type.h2}>Signed in</Text>
            <Text style={[type.caption, { marginTop: 4 }]}>{session.user.email ?? "Apple ID account"}</Text>
            <Text style={[type.caption, { marginTop: 8 }]}>
              Your bookmarks, highlights, and prayers are backed up and follow you to any device.
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.s, marginTop: spacing.m }}>
              <Pressable
                onPress={manualSync}
                style={{ flex: 1, backgroundColor: colors.navyInk, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
              >
                {syncing ? (
                  <ActivityIndicator color={colors.gold} />
                ) : (
                  <Text style={{ color: colors.goldSoft, fontWeight: "600" }}>Sync now</Text>
                )}
              </Pressable>
              <Pressable
                onPress={signOut}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <Text style={{ color: colors.inkMuted, fontWeight: "600" }}>Sign out</Text>
              </Pressable>
            </View>
            <Pressable onPress={deleteAccount} style={{ marginTop: spacing.m, alignItems: "center" }}>
              <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "600" }}>Delete account</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={type.h2}>Back up your journey</Text>
            <Text style={[type.caption, { marginTop: 4 }]}>
              Optional — Aperio works fully without an account. Sign in only if you want your bookmarks,
              highlights, and prayers saved to the cloud.
            </Text>
            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={{ height: 48, marginTop: spacing.m }}
                onPress={signInWithApple}
              />
            )}
            <Pressable
              onPress={signInWithGoogle}
              disabled={loading}
              style={{
                height: 48,
                marginTop: spacing.s,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                backgroundColor: colors.white,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.navy} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color={colors.ink} />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.ink }}>Continue with Google</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </View>

      {/* Bookmarks */}
      <Text style={[type.h2, { marginTop: spacing.l, marginBottom: spacing.s }]}>Bookmarks</Text>
      {bookmarks.length === 0 ? (
        <Text style={[type.caption]}>
          Nothing saved yet. While reading, tap a verse — or the bookmark icon — to save your place.
        </Text>
      ) : (
        bookmarks.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => router.push(`/reader/${m.book_num}/${m.chapter}`)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.parchmentAlt : colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              padding: spacing.m,
              marginBottom: 6,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.s,
            })}
          >
            <Ionicons name="bookmark" size={16} color={colors.goldDeep} />
            <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: colors.ink }}>
              {bookName(m.book_num)} {m.chapter}
              {m.verse ? `:${m.verse}` : ""}
            </Text>
          </Pressable>
        ))
      )}

      {/* About */}
      <Text style={[type.h2, { marginTop: spacing.l, marginBottom: spacing.s }]}>About</Text>
      <View style={{ backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.m }}>
        <Text style={type.body}>
          Aperio — Latin for "I open, I reveal." Scripture with commentary in three voices, the original
          languages at your fingertips, and a place to pray. Everything works offline.
        </Text>
        <Text style={[type.caption, { marginTop: spacing.s }]}>
          Strong's lexicon data is in the public domain. Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
