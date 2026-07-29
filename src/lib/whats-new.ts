// What's New announcements — shown via the bell on the Home screen.
// Bump `version` and edit `items` with each release; the bell shows a red
// dot until the user has opened the panel for the current version.
import AsyncStorage from "@react-native-async-storage/async-storage";

const SEEN_KEY = "aperio:whats-new-seen";

export interface WhatsNewItem {
  icon: string; // Ionicons name
  title: string;
  body: string;
}

export const WHATS_NEW: { version: string; items: WhatsNewItem[] } = {
  version: "1.2.0",
  items: [
    {
      icon: "sparkles",
      title: "A new look",
      body: "Aperio has a new icon — a navy Bible crowned with the flame of the Word.",
    },
    {
      icon: "albums-outline",
      title: "Scripture of the Day, told as a story",
      body: "Tap Read Today's Story for a new experience: the verse, a devotion, a reflection, and a prayer — one card at a time.",
    },
    {
      icon: "notifications-outline",
      title: "Daily verse notifications",
      body: 'Tap "Send me this daily" on the Scripture of the Day card to receive each morning\'s verse — private and fully on your device.',
    },
    {
      icon: "heart-outline",
      title: "Giving",
      body: "Aperio is free, with no ads and no subscriptions. If it has blessed you, you can now support it from the Account tab.",
    },
  ],
};

export async function hasUnseenWhatsNew(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SEEN_KEY)) !== WHATS_NEW.version;
  } catch {
    return false;
  }
}

export async function markWhatsNewSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(SEEN_KEY, WHATS_NEW.version);
  } catch {}
}
