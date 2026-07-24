// Daily verse notifications — fully local. The Scripture of the Day rotation
// is deterministic by date, so we pre-schedule the next 30 mornings on-device.
// No account, no server, nothing leaves the phone.
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SQLiteDatabase } from "expo-sqlite";
import { getBook, getChapter } from "../db/content";
import { verseOfDayRef } from "./verse-of-day";

const KEY = "aperio:daily-verse-subscribed";
const DELIVERY_HOUR = 8; // 8:00 am local time

export async function isDailySubscribed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

/** Returns true if permission was granted and the schedule was created. */
export async function subscribeDailyVerse(db: SQLiteDatabase): Promise<boolean> {
  const perm = await Notifications.requestPermissionsAsync();
  const granted =
    perm.granted || perm.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) return false;
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {}
  await scheduleUpcoming(db);
  return true;
}

export async function unsubscribeDailyVerse(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/** Call on app launch — keeps the next 30 days topped up. */
export async function refreshDailySchedule(db: SQLiteDatabase): Promise<void> {
  if (await isDailySubscribed()) await scheduleUpcoming(db);
}

async function scheduleUpcoming(db: SQLiteDatabase): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, DELIVERY_HOUR, 0, 0);
    if (fireAt <= now) continue;
    const ref = verseOfDayRef(fireAt);
    try {
      const book = await getBook(db, ref.book);
      const verses = await getChapter(db, ref.book, ref.chapter);
      const v = verses.find((x) => x.verse === ref.verse);
      if (!book || !v) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Scripture of the Day · ${ref.theme}`,
          body: `"${v.text.replace(/\s+/g, " ").trim()}" — ${book.name} ${ref.chapter}:${ref.verse}`,
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      });
    } catch {}
  }
}
