// Read-only access to the bundled scripture + commentary database.
// Everything here works fully offline — the app never needs the network to read.
import { type SQLiteDatabase } from "expo-sqlite";

export interface Book {
  book_num: number;
  name: string;
  abbr: string;
  testament: "OT" | "NT";
  chapters_count: number;
}

export interface Verse {
  book_num: number;
  chapter: number;
  verse: number;
  text: string;
  para_start: number;
}

export interface Commentary {
  book_num: number;
  chapter: number;
  reference: string;
  devotional: string;
  scholarly: string;
  prophetic: string;
}

export interface StrongsEntry {
  id: string;
  language: "Hebrew" | "Greek";
  lemma: string;
  translit: string;
  pron: string;
  definition: string;
  kjv_def: string;
  derivation: string;
}

export interface SearchHit {
  book_num: number;
  chapter: number;
  verse: number;
  text: string;
  book_name: string;
}

export async function getBooks(db: SQLiteDatabase): Promise<Book[]> {
  return db.getAllAsync<Book>("SELECT * FROM books ORDER BY book_num");
}

export async function getBook(db: SQLiteDatabase, bookNum: number): Promise<Book | null> {
  return db.getFirstAsync<Book>("SELECT * FROM books WHERE book_num = ?", [bookNum]);
}

export async function getChapter(db: SQLiteDatabase, bookNum: number, chapter: number): Promise<Verse[]> {
  return db.getAllAsync<Verse>(
    "SELECT * FROM verses WHERE book_num = ? AND chapter = ? ORDER BY verse",
    [bookNum, chapter],
  );
}

export async function getCommentary(db: SQLiteDatabase, bookNum: number, chapter: number): Promise<Commentary | null> {
  return db.getFirstAsync<Commentary>(
    "SELECT * FROM commentary WHERE book_num = ? AND chapter = ?",
    [bookNum, chapter],
  );
}

/** Full-text search across all 31,000+ verses. Safe against FTS syntax errors. */
export async function searchVerses(db: SQLiteDatabase, query: string, limit = 60): Promise<SearchHit[]> {
  const cleaned = query.trim().replace(/["'*^]/g, "");
  if (!cleaned) return [];
  const ftsQuery = cleaned
    .split(/\s+/)
    .map((w) => `"${w}"`)
    .join(" ");
  try {
    return await db.getAllAsync<SearchHit>(
      `SELECT v.book_num, v.chapter, v.verse, v.text, b.name AS book_name
       FROM verses_fts f
       JOIN verses v ON v.rowid = f.rowid
       JOIN books b ON b.book_num = v.book_num
       WHERE verses_fts MATCH ?
       ORDER BY v.book_num, v.chapter, v.verse
       LIMIT ?`,
      [ftsQuery, limit],
    );
  } catch {
    return [];
  }
}

export async function searchStrongs(db: SQLiteDatabase, query: string, limit = 40): Promise<StrongsEntry[]> {
  const cleaned = query.trim().replace(/["'*^]/g, "");
  if (!cleaned) return [];
  // Direct ID lookup (H1254 / G26) first.
  if (/^[HGhg]\d+$/.test(cleaned)) {
    const hit = await db.getAllAsync<StrongsEntry>(
      "SELECT * FROM strongs WHERE id = ?",
      [cleaned.toUpperCase()],
    );
    if (hit.length) return hit;
  }
  const ftsQuery = cleaned
    .split(/\s+/)
    .map((w) => `"${w}"*`)
    .join(" ");
  try {
    return await db.getAllAsync<StrongsEntry>(
      `SELECT s.* FROM strongs_fts f
       JOIN strongs s ON s.rowid = f.rowid
       WHERE strongs_fts MATCH ?
       LIMIT ?`,
      [ftsQuery, limit],
    );
  } catch {
    return [];
  }
}

export interface CrossRef {
  ref_book_num: number;
  ref_chapter: number;
  ref_verse_start: number | null;
  ref_verse_end: number | null;
  ref_label: string;
  book_name: string;
}

export async function getCrossrefs(db: SQLiteDatabase, bookNum: number, chapter: number): Promise<CrossRef[]> {
  return db.getAllAsync<CrossRef>(
    `SELECT c.ref_book_num, c.ref_chapter, c.ref_verse_start, c.ref_verse_end, c.ref_label, b.name AS book_name
     FROM crossrefs c JOIN books b ON b.book_num = c.ref_book_num
     WHERE c.book_num = ? AND c.chapter = ? ORDER BY c.ref_label`,
    [bookNum, chapter],
  );
}

export async function getVersePreview(db: SQLiteDatabase, bookNum: number, chapter: number, verse: number | null): Promise<string> {
  const row = verse
    ? await db.getFirstAsync<{ text: string }>(
        "SELECT text FROM verses WHERE book_num = ? AND chapter = ? AND verse = ?",
        [bookNum, chapter, verse],
      )
    : await db.getFirstAsync<{ text: string }>(
        "SELECT text FROM verses WHERE book_num = ? AND chapter = ? AND verse = 1",
        [bookNum, chapter],
      );
  return row?.text ?? "";
}

let wordTagCache: Map<string, { h: string | null; g: string | null }> | null = null;

/** Word → Strong's mapping used to render tappable gold words in the reader. */
export async function getWordTags(db: SQLiteDatabase): Promise<Map<string, { h: string | null; g: string | null }>> {
  if (wordTagCache) return wordTagCache;
  try {
    const rows = await db.getAllAsync<{ word: string; strongs_h: string | null; strongs_g: string | null }>(
      "SELECT word, strongs_h, strongs_g FROM word_tags",
    );
    wordTagCache = new Map(rows.map((r) => [r.word, { h: r.strongs_h, g: r.strongs_g }]));
  } catch {
    // Table absent from this content build — readers still work, just without gold word links.
    wordTagCache = new Map();
  }
  return wordTagCache;
}

export async function getStrongsEntry(db: SQLiteDatabase, id: string): Promise<StrongsEntry | null> {
  return db.getFirstAsync<StrongsEntry>("SELECT * FROM strongs WHERE id = ?", [id]);
}

/** Parse references like "John 3:16", "1 John 4", "Gen 1:1". Returns null if not a reference. */
export function parseReference(
  books: Book[],
  input: string,
): { book: Book; chapter: number; verse?: number } | null {
  const m = input.trim().match(/^((?:[1-3]\s?)?[A-Za-z .]+?)\s*(\d{1,3})(?:\s*[:.]\s*(\d{1,3}))?$/);
  if (!m) return null;
  const name = m[1].replace(/\s+/g, " ").replace(/\.$/, "").trim().toLowerCase();
  const book = books.find(
    (b) =>
      b.name.toLowerCase() === name ||
      b.abbr.toLowerCase() === name ||
      b.name.toLowerCase().startsWith(name),
  );
  if (!book) return null;
  const chapter = parseInt(m[2], 10);
  if (chapter < 1 || chapter > book.chapters_count) return null;
  return { book, chapter, verse: m[3] ? parseInt(m[3], 10) : undefined };
}
