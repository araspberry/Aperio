// Scripture of the Day — story experience. Six full-screen cards:
// verse → devotion → reflection → verse again → prayer → share.
// Tap the right edge to advance, left edge to go back.
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, Share, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { getBook, getChapter, getCommentary } from "../db/content";
import { verseOfDayRef } from "../lib/verse-of-day";
import { reflectionFor, prayerFor } from "../lib/story-content";
import { fonts, spacing } from "../theme";
import { useTheme } from "../lib/theme-context";

interface StoryData {
  text: string;
  ref: string;
  theme: string;
  book: number;
  chapter: number;
  devotion: string;
}

// Build a devotion of roughly 300-450 words from the chapter's devotional commentary.
function devotionExcerpt(commentary: string): string {
  const blocks = commentary
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b && !/^#{1,3}\s/.test(b))
    .map((b) => b.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\n/g, " "));
  const out: string[] = [];
  let words = 0;
  for (const b of blocks) {
    const w = b.split(/\s+/).length;
    if (words >= 300 || (words > 0 && words + w > 450)) break;
    out.push(b);
    words += w;
  }
  return out.join("\n\n");
}

// Lighten/darken a hex color by pct (-1..1) for gradient stops.
function shade(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const mix = (c: number) =>
    Math.max(0, Math.min(255, Math.round(pct > 0 ? c + (255 - c) * pct : c * (1 + pct))));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// Segmented progress ring — one arc per card, filling clockwise.
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function ProgressRing({ total, index, color }: { total: number; index: number; color: string }) {
  const size = 34;
  const c = size / 2;
  const r = 13;
  const gap = 10; // degrees between segments
  const seg = 360 / total;
  const arcs = [];
  for (let i = 0; i < total; i++) {
    const start = i * seg + gap / 2;
    const end = (i + 1) * seg - gap / 2;
    const p1 = polar(c, c, r, start);
    const p2 = polar(c, c, r, end);
    arcs.push(
      <Path
        key={i}
        d={`M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`}
        stroke={color}
        strokeOpacity={i <= index ? 0.95 : 0.28}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />,
    );
  }
  return <Svg width={size} height={size}>{arcs}</Svg>;
}

export default function StoryScreen() {
  const { colors, dark } = useTheme();
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<StoryData | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const ref = verseOfDayRef();
        const [book, verses, commentary] = await Promise.all([
          getBook(db, ref.book),
          getChapter(db, ref.book, ref.chapter),
          getCommentary(db, ref.book, ref.chapter),
        ]);
        const v = verses.find((x) => x.verse === ref.verse);
        if (!book || !v) return;
        setData({
          text: v.text.replace(/\s+/g, " ").trim(),
          ref: `${book.name} ${ref.chapter}:${ref.verse}`,
          theme: ref.theme,
          book: ref.book,
          chapter: ref.chapter,
          devotion: commentary?.devotional
            ? devotionExcerpt(commentary.devotional)
            : "Sit with today's verse slowly. Read it three times — once for your head, once for your heart, and once for your day.",
        });
      } catch {}
    })();
  }, [db]);

  const onShare = async () => {
    if (!data) return;
    try {
      await Share.share({ message: `"${data.text}"\n— ${data.ref}\n\nShared from Aperio · aperiobible.app` });
    } catch {}
  };

  const cards = useMemo(() => {
    if (!data) return [];
    const ink = colors.ink;
    const white = "#FFFFFF";
    return [
      {
        bg: colors.scriptureBlue,
        fg: dark ? colors.ink : colors.navy,
        eyebrow: `SCRIPTURE OF THE DAY · ${data.theme.toUpperCase()}`,
        body: `"${data.text}"`,
        caption: `— ${data.ref}`,
        serif: true,
      },
      {
        bg: colors.card,
        fg: ink,
        eyebrow: "DEVOTION",
        body: data.devotion,
        caption: null,
        serif: true,
      },
      {
        bg: colors.sage,
        fg: dark ? colors.ink : "#26331F",
        eyebrow: "REFLECT",
        body: reflectionFor(data.theme),
        caption: null,
        serif: false,
      },
      {
        bg: colors.navyInk,
        fg: white,
        eyebrow: "READ IT AGAIN — SLOWLY",
        body: `"${data.text}"`,
        caption: `— ${data.ref}`,
        serif: true,
      },
      {
        bg: colors.slate,
        fg: white,
        eyebrow: "PRAY",
        body: prayerFor(data.theme, data.ref),
        caption: "Amen.",
        serif: true,
      },
      {
        bg: colors.parchment,
        fg: ink,
        eyebrow: "SHARE THE WORD",
        body: `"${data.text}"\n— ${data.ref}`,
        caption: null,
        serif: true,
        share: true,
      },
    ];
  }, [data, colors, dark]);

  if (cards.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.parchment, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted }}>Opening today's story…</Text>
      </View>
    );
  }

  const card = cards[Math.min(index, cards.length - 1)];
  const advance = () => {
    if (index < cards.length - 1) setIndex(index + 1);
    else router.back();
  };
  const goBack = () => {
    if (index > 0) setIndex(index - 1);
  };

  return (
    <LinearGradient
      colors={[shade(String(card.bg), 0.1), String(card.bg), shade(String(card.bg), -0.14)]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1, paddingTop: insets.top }}
    >
      {/* Header — progress ring + close */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.m,
          marginTop: 8,
        }}
      >
        <ProgressRing total={cards.length} index={index} color={String(card.fg)} />
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close story">
          <Ionicons name="close" size={26} color={card.fg} />
        </Pressable>
      </View>

      {/* Card title */}
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 15,
          letterSpacing: 2.2,
          color: card.fg,
          opacity: 0.92,
          paddingHorizontal: spacing.m,
          marginTop: 22,
        }}
      >
        {card.eyebrow}
      </Text>

      {/* Card body */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.xl, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontFamily: card.serif ? fonts.serifSemi : fonts.sansMed,
            fontSize: card.body.length > 1200 ? 15.5 : card.body.length > 420 ? 17 : 22,
            lineHeight: card.body.length > 1200 ? 26 : card.body.length > 420 ? 28 : 34,
            color: card.fg,
          }}
        >
          {card.body}
        </Text>
        {card.caption ? (
          <Text style={{ fontFamily: fonts.serifItalic, fontSize: 16, color: card.fg, opacity: 0.85, marginTop: spacing.m }}>
            {card.caption}
          </Text>
        ) : null}

        {card.share ? (
          <View style={{ marginTop: spacing.xl, gap: spacing.s }}>
            <Pressable
              onPress={onShare}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: colors.navyInk,
                borderRadius: 16,
                paddingVertical: 15,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Ionicons name="share-outline" size={17} color="#FFFFFF" />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: "#FFFFFF" }}>Share today's verse</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                router.back();
                setTimeout(() => router.push(`/reader/${data!.book}/${data!.chapter}`), 50);
              }}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text style={{ fontFamily: fonts.sansMed, fontSize: 14, color: colors.goldDeep }}>
                Read the full chapter →
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Tap zones */}
      <View pointerEvents="box-none" style={{ position: "absolute", top: 130, left: 0, right: 0, bottom: card.share ? 220 : 0, flexDirection: "row", justifyContent: "space-between" }}>
        <Pressable style={{ width: "24%" }} onPress={goBack} accessibilityLabel="Previous card" />
        <Pressable style={{ width: "24%" }} onPress={advance} accessibilityLabel="Next card" />
      </View>

      {/* Hint on first card */}
      {index === 0 && (
        <Text
          style={{
            position: "absolute",
            bottom: insets.bottom + 18,
            alignSelf: "center",
            fontFamily: fonts.sans,
            fontSize: 12,
            color: card.fg,
            opacity: 0.6,
          }}
        >
          Tap the right edge to continue
        </Text>
      )}
    </LinearGradient>
  );
}
