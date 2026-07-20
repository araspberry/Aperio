// App-wide light/dark theming. The choice persists across launches.
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors as lightColors, darkColors, fonts, type Palette } from "../theme";

const KEY = "aperio:theme-mode";

type ThemeValue = {
  dark: boolean;
  toggle: () => void;
  colors: Palette;
  type: {
    scripture: object; h1: object; h2: object; body: object; caption: object; label: object;
  };
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === "dark") setDark(true); })
      .catch(() => {});
  }, []);

  const toggle = () => {
    setDark((d) => {
      AsyncStorage.setItem(KEY, d ? "light" : "dark").catch(() => {});
      return !d;
    });
  };

  const value = useMemo<ThemeValue>(() => {
    const c = dark ? darkColors : lightColors;
    return {
      dark,
      toggle,
      colors: c,
      type: {
        scripture: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 32, color: c.ink },
        h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 36, color: c.heading },
        h2: { fontFamily: fonts.display, fontSize: 20, lineHeight: 27, color: c.heading },
        body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: c.ink },
        caption: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: c.inkMuted },
        label: { fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" as const, color: c.inkMuted },
      },
    };
  }, [dark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}
