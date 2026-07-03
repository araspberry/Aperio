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

// ---- Reading position ----
export async function saveProgress(book_num: number, chapter: number): Promise<void> {
  const db = await getUserDb();
  await db.runAsync(
    "INSERT INTO progress (k, book_num, chapter, updated_at) VALUES ('last',?,?,?) ON CONFLICT(k) DO UPDATE SET book_num=excluded.book_num, chapter=excluded.chapter, updated_at=excluded.updated_at",
    [book_num, chapter, now()],
  );
}

export async function getProgress(): Promise<{ book_num: number; chapter: number } | null> {
  const db = await getUserDb();
  return db.getFirstAsync<{ book_num: number; chapter: number }>(
    "SELECT book_num, chapter FROM progress WHERE k = 'last'",
  );
}
