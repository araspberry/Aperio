// Best-effort sync of on-device data to Supabase for signed-in users.
// Sync is a bonus, never a requirement: every operation is wrapped so a
// network failure can never crash or block the app.
import { supabase } from "./supabase";
import { getUserDb } from "../db/user";

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function fullSync(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await Promise.allSettled([
    syncBookmarks(userId),
    syncHighlights(userId),
    syncPrayers(userId),
    syncNotes(userId),
  ]);
}

async function syncNotes(userId: string): Promise<void> {
  const db = await getUserDb();
  const dirty = await db.getAllAsync<any>("SELECT * FROM notes WHERE dirty = 1");
  for (const n of dirty) {
    if (n.deleted) {
      const { error } = await supabase.from("notes").delete().eq("id", n.id);
      if (!error) await db.runAsync("DELETE FROM notes WHERE id = ?", [n.id]);
      continue;
    }
    const { error } = await supabase.from("notes").upsert({
      id: n.id,
      user_id: userId,
      book_num: n.book_num,
      chapter: n.chapter,
      verse: n.verse,
      body: n.body,
      created_at: n.created_at,
      updated_at: n.updated_at,
    });
    if (!error) await db.runAsync("UPDATE notes SET dirty = 0 WHERE id = ?", [n.id]);
  }
  const { data: remote, error } = await supabase.from("notes").select("*");
  if (error || !remote) return;
  for (const r of remote) {
    await db.runAsync(
      `INSERT OR IGNORE INTO notes (id, book_num, chapter, verse, body, created_at, updated_at, deleted, dirty)
       VALUES (?,?,?,?,?,?,?,0,0)`,
      [r.id, r.book_num, r.chapter, r.verse, r.body, r.created_at, r.updated_at],
    );
  }
}

async function syncBookmarks(userId: string): Promise<void> {
  const db = await getUserDb();
  // Push local
  const dirty = await db.getAllAsync<any>("SELECT * FROM bookmarks WHERE dirty = 1");
  for (const b of dirty) {
    const { error } = await supabase.from("bookmarks").upsert(
      { user_id: userId, book_num: b.book_num, chapter: b.chapter, verse: b.verse },
      { onConflict: "user_id,book_num,chapter,verse", ignoreDuplicates: true },
    );
    if (!error) await db.runAsync("UPDATE bookmarks SET dirty = 0 WHERE id = ?", [b.id]);
  }
  // Pull remote
  const { data: remote, error } = await supabase.from("bookmarks").select("*");
  if (error || !remote) return;
  for (const r of remote) {
    await db.runAsync(
      `INSERT OR IGNORE INTO bookmarks (id, book_num, chapter, verse, created_at, dirty) VALUES (?,?,?,?,?,0)`,
      [r.id, r.book_num, r.chapter, r.verse, r.created_at],
    );
  }
}

async function syncHighlights(userId: string): Promise<void> {
  const db = await getUserDb();
  const dirty = await db.getAllAsync<any>("SELECT * FROM highlights WHERE dirty = 1");
  for (const h of dirty) {
    const { error } = await supabase.from("highlights").upsert(
      { user_id: userId, book_num: h.book_num, chapter: h.chapter, verse: h.verse, color: h.color },
      { onConflict: "user_id,book_num,chapter,verse", ignoreDuplicates: true },
    );
    if (!error) await db.runAsync("UPDATE highlights SET dirty = 0 WHERE id = ?", [h.id]);
  }
  const { data: remote, error } = await supabase.from("highlights").select("*");
  if (error || !remote) return;
  for (const r of remote) {
    await db.runAsync(
      `INSERT OR IGNORE INTO highlights (id, book_num, chapter, verse, color, created_at, dirty) VALUES (?,?,?,?,?,?,0)`,
      [r.id, r.book_num, r.chapter, r.verse, r.color, r.created_at],
    );
  }
}

async function syncPrayers(userId: string): Promise<void> {
  const db = await getUserDb();
  const dirty = await db.getAllAsync<any>("SELECT * FROM prayers WHERE dirty = 1");
  for (const p of dirty) {
    if (p.deleted) {
      const { error } = await supabase.from("prayers").delete().eq("id", p.id);
      if (!error) await db.runAsync("DELETE FROM prayers WHERE id = ?", [p.id]);
      continue;
    }
    const { error } = await supabase.from("prayers").upsert({
      id: p.id,
      user_id: userId,
      title: p.title,
      body: p.body,
      answered: !!p.answered,
      created_at: p.created_at,
      updated_at: p.updated_at,
    });
    if (!error) await db.runAsync("UPDATE prayers SET dirty = 0 WHERE id = ?", [p.id]);
  }
  const { data: remote, error } = await supabase.from("prayers").select("*");
  if (error || !remote) return;
  for (const r of remote) {
    await db.runAsync(
      `INSERT INTO prayers (id, title, body, answered, created_at, updated_at, deleted, dirty)
       VALUES (?,?,?,?,?,?,0,0)
       ON CONFLICT(id) DO UPDATE SET
         title = CASE WHEN prayers.dirty = 0 THEN excluded.title ELSE prayers.title END,
         body = CASE WHEN prayers.dirty = 0 THEN excluded.body ELSE prayers.body END,
         answered = CASE WHEN prayers.dirty = 0 THEN excluded.answered ELSE prayers.answered END,
         updated_at = CASE WHEN prayers.dirty = 0 THEN excluded.updated_at ELSE prayers.updated_at END`,
      [r.id, r.title, r.body, r.answered ? 1 : 0, r.created_at, r.updated_at],
    );
  }
}
