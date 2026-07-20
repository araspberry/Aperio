// Daily quiz — full-screen modal. Questions are generated deterministically
// from the bundled scripture + lexicon, so each day is the same for everyone
// and works fully offline.
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { getBooks, type Book } from "../db/content";
import { saveQuizResult, getTodayQuiz } from "../db/user";
import { fonts, spacing } from "../theme";
import { useTheme } from "../lib/theme-context";

interface Question {
  prompt: string;
  quote?: string;
  options: string[];
  answer: number; // index into options
}

// Deterministic PRNG seeded by the date, so the quiz is stable per day.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function buildQuiz(db: SQLiteDatabase, books: Book[]): Promise<Question[]> {
  const day = new Date().toISOString().slice(0, 10);
  const seed = [...day].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rand = mulberry32(seed);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const questions: Question[] = [];

  // 4 × "which book is this verse from?"
  for (let i = 0; i < 4; i++) {
    const row = await db.getFirstAsync<{ book_num: number; text: string }>(
      `SELECT book_num, text FROM verses WHERE length(text) BETWEEN 80 AND 220
       LIMIT 1 OFFSET ${Math.floor(rand() * 25000)}`,
    );
    if (!row) continue;
    const correct = books.find((b) => b.book_num === row.book_num)!;
    const wrong = shuffle(books.filter((b) => b.book_num !== row.book_num)).slice(0, 3);
    const options = shuffle([correct, ...wrong]);
    questions.push({
      prompt: "Which book is this from?",
      quote: row.text.length > 180 ? row.text.slice(0, 180) + "…" : row.text,
      options: options.map((b) => b.name),
      answer: options.indexOf(correct),
    });
  }

  // 3 × "what does this word mean?" (Strong's)
  for (let i = 0; i < 3; i++) {
    const rows = await db.getAllAsync<{ lemma: string; translit: string; kjv_def: string; language: string }>(
      `SELECT lemma, translit, kjv_def, language FROM strongs
       WHERE length(kjv_def) BETWEEN 4 AND 40 AND kjv_def NOT LIKE '%,%'
       LIMIT 4 OFFSET ${Math.floor(rand() * 4000)}`,
    );
    if (rows.length < 4) continue;
    const answerIdx = Math.floor(rand() * 4);
    const q = rows[answerIdx];
    questions.push({
      prompt: `The ${q.language} word “${q.translit}” (${q.lemma}) means…`,
      options: rows.map((r) => r.kjv_def),
      answer: answerIdx,
    });
  }

  return shuffle(questions);
}

export default function QuizScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const prev = await getTodayQuiz();
        if (prev) {
          setAlreadyDone(prev);
          return;
        }
        const allBooks = await getBooks(db);
        setQuestions(await buildQuiz(db, allBooks));
      } catch {}
    })();
  }, [db]);

  const choose = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    const correct = i === questions[current].answer;
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(current + 1);
        setChosen(null);
      } else {
        setDone(true);
        saveQuizResult(newScore, questions.length).catch(() => {});
      }
    }, 900);
  };

  const q = questions[current];

  return (
    <View style={{ flex: 1, backgroundColor: colors.navyDeep, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.m }}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold }}>
          DAILY QUIZ
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.goldSoft} />
        </Pressable>
      </View>

      {alreadyDone ? (
        <Centered>
          <Ionicons name="checkmark-circle" size={54} color={colors.gold} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.white, marginTop: spacing.m, textAlign: "center" }}>
            Already done today
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.goldSoft, marginTop: spacing.s }}>
            You scored {alreadyDone.score} / {alreadyDone.total}. Come back tomorrow!
          </Text>
        </Centered>
      ) : done ? (
        <Centered>
          <Ionicons name="trophy" size={54} color={colors.gold} />
          <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.white, marginTop: spacing.m }}>
            {score} / {questions.length}
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.goldSoft, marginTop: spacing.s, textAlign: "center" }}>
            {score === questions.length ? "Perfect — well done!" : score >= 3 ? "Solid work. Keep reading!" : "The Word rewards the diligent — read on!"}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: spacing.l, backgroundColor: colors.gold, borderRadius: 14, paddingHorizontal: spacing.xl, paddingVertical: 14 }}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.navyDeep }}>Done</Text>
          </Pressable>
        </Centered>
      ) : !q ? (
        <Centered>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.goldSoft }}>Preparing today's questions…</Text>
        </Centered>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.l, paddingBottom: insets.bottom + spacing.xl }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.tabInactive }}>
            Question {current + 1} of {questions.length}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 30, color: colors.white, marginTop: spacing.s }}>
            {q.prompt}
          </Text>
          {q.quote && (
            <View style={{ backgroundColor: colors.navy, borderRadius: 14, padding: spacing.m, marginTop: spacing.m, borderLeftWidth: 3, borderLeftColor: colors.gold }}>
              <Text style={{ fontFamily: fonts.serifItalic, fontSize: 16, lineHeight: 27, color: colors.parchment }}>
                “{q.quote}”
              </Text>
            </View>
          )}
          <View style={{ marginTop: spacing.l, gap: spacing.s }}>
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answer;
              const isChosen = chosen === i;
              const bg =
                chosen === null ? colors.navy : isAnswer ? "#2E5C3F" : isChosen ? "#6B3030" : colors.navy;
              return (
                <Pressable
                  key={i}
                  onPress={() => choose(i)}
                  style={{ backgroundColor: bg, borderRadius: 14, padding: spacing.m, borderWidth: 1, borderColor: chosen !== null && isAnswer ? colors.gold : "transparent" }}
                >
                  <Text style={{ fontFamily: fonts.sansMed, fontSize: 15, color: colors.parchment }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>{children}</View>;
}
