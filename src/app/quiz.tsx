// Daily quiz — full-screen modal. Questions are generated deterministically
// from the bundled scripture + lexicon, so each day is the same for everyone
// and works fully offline.
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { getBooks, getChapter, type Book, type Verse } from "../db/content";
import { verseOfDayRef } from "../lib/verse-of-day";
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

async function buildQuiz(
  db: SQLiteDatabase,
  books: Book[],
): Promise<{ questions: Question[]; passageRef: string }> {
  const day = new Date().toISOString().slice(0, 10);
  const seed = [...day].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rand = mulberry32(seed);
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Today's quiz always comes from the Scripture of the Day passage.
  const votd = verseOfDayRef();
  const book = books.find((b) => b.book_num === votd.book);
  const verses = await getChapter(db, votd.book, votd.chapter);
  const passageRef = book ? `${book.name} ${votd.chapter}` : "today's passage";
  const questions: Question[] = [];
  if (!book || verses.length === 0) return { questions, passageRef };

  const clean = (w: string) => w.replace(/[^A-Za-z']/g, "");
  const substantive = (v: Verse) => v.text.length >= 60 && v.text.length <= 300;
  const filtered = verses.filter(substantive);
  const pool = shuffle(filtered.length >= 7 ? filtered : verses);

  // Word bank for distractors, drawn from the same chapter.
  const wordBank = Array.from(
    new Set(
      verses
        .flatMap((v) => v.text.split(/\s+/))
        .map(clean)
        .filter((w) => w.length >= 5),
    ),
  );

  // 4 x fill-in-the-blank from today's chapter
  for (const v of pool.slice(0, 4)) {
    const words = v.text.split(/\s+/);
    const idxs = words.map((w, i) => ({ w: clean(w), i })).filter((x) => x.w.length >= 5);
    if (idxs.length === 0) continue;
    const target = idxs[Math.floor(rand() * idxs.length)];
    const answerWord = target.w;
    const distractors = shuffle(
      wordBank.filter((w) => w.toLowerCase() !== answerWord.toLowerCase()),
    ).slice(0, 3);
    if (distractors.length < 3) continue;
    const blanked = words
      .map((w, i) => (i === target.i ? w.replace(clean(w), "_____") : w))
      .join(" ");
    const options = shuffle([answerWord, ...distractors]);
    questions.push({
      prompt: `Fill in the blank — ${book.name} ${votd.chapter}:${v.verse}`,
      quote: blanked.length > 220 ? blanked.slice(0, 220) + "…" : blanked,
      options,
      answer: options.indexOf(answerWord),
    });
  }

  // 3 x "which of these lines is from today's passage?"
  const snippet = (t: string) => (t.length > 110 ? t.slice(0, 110) + "…" : t);
  for (const v of pool.slice(4, 7)) {
    const decoys: string[] = [];
    for (let tries = 0; tries < 8 && decoys.length < 3; tries++) {
      const row = await db.getFirstAsync<{ text: string }>(
        `SELECT text FROM verses WHERE book_num != ? AND length(text) BETWEEN 80 AND 200
         LIMIT 1 OFFSET ${Math.floor(rand() * 25000)}`,
        [votd.book],
      );
      if (row && !decoys.includes(snippet(row.text))) decoys.push(snippet(row.text));
    }
    if (decoys.length < 3) continue;
    const correct = snippet(v.text);
    const options = shuffle([correct, ...decoys]);
    questions.push({
      prompt: `Which of these is from today's passage, ${book.name} ${votd.chapter}?`,
      options,
      answer: options.indexOf(correct),
    });
  }

  return { questions: shuffle(questions), passageRef };
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
  const [passageRef, setPassageRef] = useState<string>("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const prev = await getTodayQuiz();
        if (prev) {
          setAlreadyDone(prev);
          return;
        }
        const allBooks = await getBooks(db);
        const built = await buildQuiz(db, allBooks);
        setPassageRef(built.passageRef);
        setQuestions(built.questions);
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
    <View style={{ flex: 1, backgroundColor: colors.parchment, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.m }}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 2, color: colors.goldDeep }}>
          DAILY QUIZ{passageRef ? ` · ${passageRef.toUpperCase()}` : ""}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.heading} />
        </Pressable>
      </View>

      {alreadyDone ? (
        <Centered>
          <Ionicons name="checkmark-circle" size={54} color={colors.goldDeep} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.heading, marginTop: spacing.m, textAlign: "center" }}>
            Already done today
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted, marginTop: spacing.s }}>
            You scored {alreadyDone.score} / {alreadyDone.total}. Come back tomorrow!
          </Text>
        </Centered>
      ) : done ? (
        <Centered>
          <Ionicons name="trophy" size={54} color={colors.goldDeep} />
          <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.heading, marginTop: spacing.m }}>
            {score} / {questions.length}
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted, marginTop: spacing.s, textAlign: "center" }}>
            {score === questions.length ? "Perfect — well done!" : score >= 3 ? "Solid work. Keep reading!" : "The Word rewards the diligent — read on!"}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: spacing.l, backgroundColor: colors.navyInk, borderRadius: 14, paddingHorizontal: spacing.xl, paddingVertical: 14 }}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.white }}>Done</Text>
          </Pressable>
        </Centered>
      ) : !started ? (
        <Centered>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: colors.scriptureBlue,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="sparkles" size={32} color={colors.navy} />
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.heading, marginTop: spacing.l, textAlign: "center" }}>
            Today's Quiz
          </Text>
          {passageRef ? (
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: colors.goldDeep, marginTop: 6 }}>
              {passageRef}
            </Text>
          ) : null}
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 15,
              lineHeight: 24,
              color: colors.inkMuted,
              marginTop: spacing.m,
              textAlign: "center",
              maxWidth: 300,
            }}
          >
            Seven questions drawn from today's Scripture of the Day — fill in the missing words and spot the true
            verses. A new quiz arrives each morning.
          </Text>
          <Pressable
            onPress={() => setStarted(true)}
            disabled={questions.length === 0}
            style={({ pressed }) => ({
              marginTop: spacing.l,
              backgroundColor: colors.navyInk,
              borderRadius: 16,
              paddingHorizontal: 44,
              paddingVertical: 15,
              opacity: questions.length === 0 ? 0.5 : pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.white }}>
              {questions.length === 0 ? "Preparing…" : "Start Quiz"}
            </Text>
          </Pressable>
        </Centered>
      ) : !q ? (
        <Centered>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted }}>Preparing today's questions…</Text>
        </Centered>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.l, paddingBottom: insets.bottom + spacing.xl }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted }}>
            Question {current + 1} of {questions.length}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 30, color: colors.heading, marginTop: spacing.s }}>
            {q.prompt}
          </Text>
          {q.quote && (
            <View
              style={{
                backgroundColor: colors.scriptureBlue,
                borderRadius: 14,
                padding: spacing.m,
                marginTop: spacing.m,
                borderLeftWidth: 3,
                borderLeftColor: colors.goldDeep,
              }}
            >
              <Text style={{ fontFamily: fonts.serifItalic, fontSize: 16, lineHeight: 27, color: colors.ink }}>
                “{q.quote}”
              </Text>
            </View>
          )}
          <View style={{ marginTop: spacing.l, gap: spacing.s }}>
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answer;
              const isChosen = chosen === i;
              const bg =
                chosen === null ? colors.card : isAnswer ? "#E2F0DF" : isChosen ? "#F7E3E1" : colors.card;
              const border =
                chosen === null ? colors.cardBorder : isAnswer ? "#5C8A5A" : isChosen ? "#C2726B" : colors.cardBorder;
              const txt = chosen !== null && (isAnswer || isChosen) ? "#1D2438" : colors.ink;
              return (
                <Pressable
                  key={i}
                  onPress={() => choose(i)}
                  style={{ backgroundColor: bg, borderRadius: 14, padding: spacing.m, borderWidth: 1, borderColor: border }}
                >
                  <Text style={{ fontFamily: fonts.sansMed, fontSize: 15, color: txt }}>{opt}</Text>
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
