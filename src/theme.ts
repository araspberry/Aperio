// Aperio — "Cathedral Principle" design language.
// Cream parchment + deep navy + gold, carried over from the original app.
import { Platform } from "react-native";

export const colors = {
  parchment: "#F7F2E7",
  parchmentDeep: "#EFE7D3",
  card: "#FFFDF7",
  navy: "#131C33",
  navySoft: "#26314F",
  ink: "#1D2438",
  inkMuted: "#6D6A5E",
  gold: "#C9A24B",
  goldSoft: "#E3CD97",
  goldDeep: "#A87F2E",
  border: "#E2D9C3",
  highlight: "#F5E5B8",
  danger: "#A93F3F",
  white: "#FFFFFF",
};

export const fonts = {
  serif: Platform.select({ ios: "Georgia", default: "serif" }) as string,
  sans: Platform.select({ ios: "System", default: "sans-serif" }) as string,
};

export const type = {
  scripture: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 32, color: colors.ink },
  h1: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.navy, fontWeight: "700" as const },
  h2: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27, color: colors.navy, fontWeight: "700" as const },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.ink },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
};

export const spacing = { xs: 4, s: 8, m: 16, l: 24, xl: 32 };
