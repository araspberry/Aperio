// On-device user data: bookmarks, highlights, prayers, reading position.
// Works with no account at all. When the user signs in, sync.ts mirrors this to Supabase.
import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getUserDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("aperio-user.db");
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS bookmarks (
          id TEXT PRIMARY KEY,
          book_num INTEGER NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER,
          created_at TEXT NOT NULL,
          dirty INTEGER NOT NULL DEFAULT 1
        );
        CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_ref ON bookmarks(book_num, chapter, IFNULL(verse, -1));
        CREATE TABLE IF NOT EXISTS highlights (
          id TEXT PRIMARY KEY,
          book_num INTEGER NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          color TEXT NOT NULL DEFAULT 'gold',
          created_at TEXT NOT NULL,
          dirty INTEGER NOT NULL DEFAULT 1
        );
        CREATE UNIQUE INDEX IF NOT EXISTS highlights_ref ON highlights(book_num, chapter, verse);
        CREATE TABLE IF NOT EXISTS prayers (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT NOT NULL DEFAULT '',
          answered INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted INTEGER NOT NULL DEFAULT 0,
          dirty INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS progress (
          k TEXT PRIMARY KEY,
          book_num INTEGER NOT NULL,
          chapter INTEGER NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          book_num INTEGER NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER,
          body TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted INTEGER NOT NULL DEFAULT 0,
          dirty INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS activity (
          day TEXT PRIMARY KEY
        );
        CREATE TABLE IF NOT EXISTS quiz_history (
          day TEXT PRIMARY KEY,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const now = () => new Date().toISOString();

// ---- Bookmarks ----
export interface Bookmark {
  id: string;
  book_num: number;
  chapter: number;
  verse: number | null;
  created_at: string;
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const db = await getUserDb();
  return db.getAllAsync<Bookmark>("SELECT * FROM bookmarks ORDER BY created_at DESC");
}

export async function toggleBookmark(book_num: number, chapter: number, verse: number | null): Promise<boolean> {
  const db = await getUserDb();
  const existing = await db.getFirstAsync<Bookmark>(
    "SELECT * FROM bookmarks WHERE book_num = ? AND chapter = ? AND IFNULL(verse,-1) = IFNULL(?,-1)",
    [book_num, chapter, verse],
  );
  if (existing) {
    await db.runAsync("DELETE FROM bookmarks WHERE id = ?", [existing.id]);
    return false;
  }
  await db.runAsync(
    "INSERT INTO bookmarks (id, book_num, chapter, verse, created_at, dirty) VALUES (?,?,?,?,?,1)",
    [uuid(), book_num, chapter, verse, now()],
  );
  return true;
}

// ---- Highlights ----
export interface Highlight {
  id: string;
  book_num: number;
  chapter: number;
  verse: number;
  color: string;
  created_at: string;
}

export async function listHighlights(book_num: number, chapter: number): Promise<Highlight[]> {
  const db = await getUserDb();
  return db.getAllAsync<Highlight>(
    "SELECT * FROM highlights WHERE book_num = ? AND chapter = ?",
    [book_num, chapter],
  );
}

export async function toggleHighlight(book_num: number, chapter: number, verse: number): Promise<boolean> {
  const db = await getUserDb();
  const existing = await db.getFirstAsync<Highlight>(
    "SELECT * FROM highlights WHERE book_num = ? AND chapter = ? AND verse = ?",
    [book_num, chapter, verse],
  );
  if (existing) {
    await db.runAsync("DELETE FROM highlights WHERE id = ?", [existing.id]);
    return false;
  }
  await db.runAsync(
    "INSERT INTO highlights (id, book_num, chapter, verse, color, created_at, dirty) VALUES (?,?,?,?,'gold',?,1)",
    [uuid(), book_num, chapter, verse, now()],
  );
  return true;
}

// ---- Prayers ----
export interface Prayer {
  id: string;
  title: string;
  body: string;
  answered: number;
  created_at: string;
  updated_at: string;
}

export async function listPrayers(): Promise<Prayer[]> {
  const db = await getUserDb();
  return db.getAllAsync<Prayer>(
    "SELECT * FROM prayers WHERE deleted = 0 ORDER BY answered ASC, created_at DESC",
  );
}

export async function addPrayer(title: string, body: string): Promise<void> {
  const db = await getUserDb();
  await db.runAsync(
    "INSERT INTO prayers (id, title, body, answered, created_at, updated_at, deleted, dirty) VALUES (?,?,?,0,?,?,0,1)",
    [uuid(), title, body, now(), now()],
  );
}

export async function updatePrayer(id: string, fields: { title?: string; body?: string; answered?: boolean }): Promise<void> {
  const db = await getUserDb();
  const p = await db.getFirstAsync<Prayer>("SELECT * FROM prayers WHERE id = ?", [id]);
  if (!p) return;
  await db.runAsync(
    "UPDATE prayers SET title = ?, body = ?, answered = ?, updated_at = ?, dirty = 1 WHERE id = ?",
    [
      fields.title ?? p.title,
      fields.body ?? p.body,
      fields.answered === undefined ? p.answered : fields.answered ? 1 : 0,
      now(),
      id,
    ],
  );
}

export async function deletePrayer(id: string): Promise<void> {
  const db = await getUserDb();
  await db.runAsync("UPDATE prayers SET deleted = 1, updated_at = ?, dirty = 1 WHERE id = ?", [now(), id]);
}

// ---- Notes (Clavis "My Notes") ----
export interface Note {
  id: string;
  book_num: number;
  chapter: number;
  verse: number | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export async function listNotes(book_num: number, chapter: number): Promise<Note[]> {
  const db = await getUserDb();
  return db.getAllAsync<Note>(
    "SELECT * FROM notes WHERE deleted = 0 AND book_num = ? AND chapter = ? ORDER BY created_at DESC",
    [book_num, chapter],
  );
}

export async function addNote(book_num: number, chapter: number, verse: number | null, body: string): Promise<void> {
  const db = await getUserDb();
  await db.runAsync(
    "INSERT INTO notes (id, book_num, chapter, verse, body, created_at, updated_at, deleted, dirty) VALUES (?,?,?,?,?,?,?,0,1)",
    [uuid(), book_num, chapter, verse, body, now(), now()],
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getUserDb();
  await db.runAsync("UPDATE notes SET deleted = 1, updated_at = ?, dirty = 1 WHERE id = ?", [now(), id]);
}

// ---- Activity streak & daily quiz ----
const today = () => new Date().toISOString().slice(0, 10);

export async function recordActivity(): Promise<void> {
  try {
    const db = await getUserDb();
    await db.runAsync("INSERT OR IGNORE INTO activity (day) VALUES (?)", [today()]);
  } catch {}
}

export async function getStreak(): Promise<number> {
  const db = await getUserDb();
  const rows = await db.getAllAsync<{ day: string }>("SELECT day FROM activity ORDER BY day DESC LIMIT 400");
  const days = new Set(rows.map((r) => r.day));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1); // streak survives until today is missed
  while (days.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export async function getTodayQuiz(): Promise<{ score: number; total: number } | null> {
  const db = await getUserDb();
  return db.getFirstAsync<{ score: number; total: number }>(
    "SELECT score, total FROM quiz_history WHERE day = ?",
    [today()],
  );
}

export async function saveQuizResult(score: number, total: number): Promise<void> {
  const db = await getUserDb();
  await db.runAsync(
    "INSERT INTO quiz_history (day, score, total) VALUES (?,?,?) ON CONFLICT(day) DO UPDATE SET score=excluded.score, total=excluded.total",
    [today(), score, total],
  );
  await recordActivity();
}

// ---- Reading position ----
export async function saveProgress(book_num: number, chapter: number): Promise<void> {
  const db = await getUserDb();
  await db.runAsync(
    "INSERT INTO progress (k, book_num, chapter, updated_at) VALUES ('last',?,?,?) ON CONFLICT(k) DO UPDATE SET book_num=excluded.book_num, chapter=excluded.chapter, updated_at=excluded.updated_at",
    [book_num, chapter, now()],
  );
  await recordActivity();
}

export async function getProgress(): Promise<{ book_num: number; chapter: number } | null> {
  const db = await getUserDb();
  return db.getFirstAsync<{ book_num: number; chapter: number }>(
    "SELECT book_num, chapter FROM progress WHERE k = 'last'",
  );
}
