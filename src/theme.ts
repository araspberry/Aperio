// Aperio design system — from the UX/UI Schema.
// Cream parchment + deep navy + gold. Playfair Display / Lora / Inter.

export const colors = {
  navyDeep: "#0D1A30",
  navy: "#1B2A4A",
  navySheet: "#12213E", // Clavis Study Center drawer
  goldSoft: "#D4B87A",
  goldDeep: "#9A6E1A",
  gold: "#C4952A",
  parchment: "#F7F7F8", // very light soft gray app background
  parchmentAlt: "#EFEFF1",
  card: "#FFFFFF",
  cream: "#F5EDD8",
  ink: "#1D2438",
  inkMuted: "#777161",
  verseNum: "#A29B89",
  border: "#E2E6EE",
  highlight: "#F1E3B4",
  danger: "#A93F3F",
  white: "#FFFFFF",
  blue: "#2563EB", // active tab tint (per screenshots)
  blueSoft: "#E8EFFD",
  tabInactive: "#8B8676",
  // Redesign (Jul 2026 screenshots)
  scriptureBlue: "#D9E3F2", // powder-blue Scripture of the Day card
  slate: "#5D6D8E", // Prayer Journal banner
  sage: "#ACC0A2", // Clavis Recommends — reading plan card
  rose: "#C8ACA3", // Clavis Recommends — deep dive card
  cardBorder: "#D8DEE9", // cool thin border on white cards
  navyInk: "#122344", // brand navy fills (pills, launcher, badges)
  heading: "#122344", // large headings / titles (flips light in dark mode)
  chip: "#EEF1F6", // small icon chips / arrow circles
  menuBg: "#F7F8FA", // launcher menu card
  menuChip: "#EAEDF3", // menu item icon circle
  menuChipActive: "rgba(255,255,255,0.65)",
  gradientTop: "#2B50C4", // Scripture of the Day card
  gradientBottom: "#0B1730",
};

export type Palette = typeof colors;

// Dark counterpart — same keys, tuned for a deep navy night reading mode.
export const darkColors: Palette = {
  ...colors,
  navy: "#2C3E66",
  parchment: "#0F1524",
  parchmentAlt: "#1A2233",
  card: "#161E30",
  ink: "#E7EAF3",
  inkMuted: "#9AA3B8",
  verseNum: "#6E7890",
  border: "#28324A",
  highlight: "#4A4020",
  danger: "#E2726E",
  blue: "#6FA4EF",
  blueSoft: "#1E2C47",
  goldDeep: "#D4A73F",
  scriptureBlue: "#22304C",
  slate: "#46557A",
  sage: "#4F6049",
  rose: "#6B5450",
  cardBorder: "#2A3550",
  navyInk: "#26375E",
  heading: "#E9EEFA",
  chip: "#263048",
  menuBg: "#161E30",
  menuChip: "#263048",
  menuChipActive: "rgba(255,255,255,0.14)",
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
