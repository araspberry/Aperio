// Aperio design system — from the UX/UI Schema.
// Cream parchment + deep navy + gold. Playfair Display / Lora / Inter.

export const colors = {
  navyDeep: "#0D1A30",
  navy: "#1B2A4A",
  goldSoft: "#D4B87A",
  goldDeep: "#9A6E1A",
  gold: "#C4952A",
  parchment: "#F5EDD8",
  parchmentAlt: "#F5F0E6",
  card: "#FDFAF2",
  ink: "#1D2438",
  inkMuted: "#6D6A5E",
  border: "#E4DBC2",
  highlight: "#F1E3B4",
  danger: "#A93F3F",
  white: "#FFFFFF",
  tabInactive: "#8E96AC",
};

// Loaded in the root layout via expo-font.
export const fonts = {
  display: "PlayfairDisplay_700Bold", // headings, logo
  displayMed: "PlayfairDisplay_500Medium",
  serif: "Lora_400Regular", // scripture & commentary body
  serifSemi: "Lora_600SemiBold",
  serifItalic: "Lora_400Regular_Italic",
  sans: "Inter_400Regular", // UI labels, buttons, metadata
  sansMed: "Inter_500Medium",
  sansBold: "Inter_700Bold",
};

export const type = {
  scripture: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 32, color: colors.ink },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 36, color: colors.navyDeep },
  h2: { fontFamily: fonts.display, fontSize: 20, lineHeight: 27, color: colors.navyDeep },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: colors.ink },
  caption: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.inkMuted },
  label: { fontFamily: fonts.sansMed, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" as const, color: colors.inkMuted },
};

export const spacing = { xs: 4, s: 8, m: 16, l: 24, xl: 32 };
