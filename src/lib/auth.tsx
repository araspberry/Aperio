// Optional sign-in: Apple (native) and Google (secure web flow).
// Sign-in is never required — every failure degrades gracefully to guest mode.
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Alert, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { fullSync } from "./sync";

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  session: Session | null;
  loading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  loading: false,
  signInWithApple: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session);
      })
      .catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) fullSync().catch(() => {});
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithApple = async () => {
    if (Platform.OS !== "ios") return;
    setLoading(true);
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) throw new Error("No identity token returned");
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce,
      });
      if (error) throw error;
    } catch (e: any) {
      // User cancelling the Apple sheet is not an error.
      if (e?.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Sign in failed", "Apple sign-in didn't complete. You can keep using Aperio without an account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL("auth-callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) throw error ?? new Error("No auth URL");
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        } else {
          // Implicit flow fallback: tokens in the URL fragment.
          const params = new URLSearchParams(url.hash.replace(/^#/, ""));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
            if (setErr) throw setErr;
          }
        }
      }
    } catch {
      Alert.alert("Sign in failed", "Google sign-in didn't complete. You can keep using Aperio without an account.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Even if the network call fails, clear the local session state.
    }
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, signInWithApple, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
