// A verse with tappable gold words (Strong's) and tap-to-select behavior.
import React, { memo, useMemo } from "react";
import { Text } from "react-native";
import { fonts } from "../theme";
import { useTheme } from "../lib/theme-context";

export interface WordTagMap {
  get(word: string): { h: string | null; g: string | null } | undefined;
}

const MAX_GOLD_PER_VERSE = 5;

interface Props {
  verse: number;
  text: string;
  isOT: boolean;
  selected: boolean;
  highlighted: boolean;
  wordTags: WordTagMap | null;
  onSelect: (verse: number) => void;
  onWordPress: (strongsId: string, word: string) => void;
}

function VerseItemInner({ verse, text, isOT, selected, highlighted, wordTags, onSelect, onWordPress }: Props) {
  const { colors } = useTheme();
  // Split into word / non-word runs, marking up to MAX_GOLD words that
  // have a Strong's mapping (first occurrence only).
  const segments = useMemo(() => {
    const out: { t: string; sid?: string }[] = [];
    if (!wordTags) return [{ t: text }];
    let goldCount = 0;
    const seen = new Set<string>();
    const re = /[A-Za-z][A-Za-z'’-]{3,}/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const word = m[0];
      const key = word.toLowerCase().replace(/[’']s$/, "").replace(/[’'-]/g, "");
      const tag = goldCount < MAX_GOLD_PER_VERSE && !seen.has(key) ? wordTags.get(key) : undefined;
      const sid = tag ? (isOT ? tag.h ?? tag.g : tag.g ?? tag.h) : undefined;
      if (sid) {
        if (m.index > last) out.push({ t: text.slice(last, m.index) });
        out.push({ t: word, sid });
        seen.add(key);
        goldCount += 1;
        last = m.index + word.length;
      }
    }
    if (last < text.length) out.push({ t: text.slice(last) });
    return out;
  }, [text, wordTags, isOT]);

  return (
    <Text
      onPress={() => onSelect(verse)}
      suppressHighlighting
      style={{
        fontFamily: fonts.serif,
        fontSize: 19,
        lineHeight: 34,
        color: colors.navy,
        backgroundColor: highlighted ? colors.highlight : selected ? colors.goldSoft : "transparent",
        borderRadius: 3,
      }}
    >
      <Text style={{ fontFamily: fonts.sansMed, fontSize: 12, color: colors.verseNum }}>
        {" "}{verse}{" "}
      </Text>
      {segments.map((s, i) =>
        s.sid ? (
          <Text
            key={i}
            onPress={() => onWordPress(s.sid!, s.t)}
            suppressHighlighting
            style={{ color: colors.goldDeep, textDecorationLine: "underline", textDecorationColor: colors.goldSoft }}
          >
            {s.t}
          </Text>
        ) : (
          <Text key={i}>{s.t}</Text>
        ),
      )}
    </Text>
  );
}

export const VerseItem = memo(VerseItemInner);
