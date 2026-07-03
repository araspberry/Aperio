// Scripture of the day — a curated rotation of beloved passages with a theme
// tag, chosen deterministically by date so it works fully offline.
// [book_num, chapter, verse, theme]
const ROTATION: [number, number, number, string][] = [
  [43, 3, 16, "Love"],
  [19, 23, 1, "Provision"],
  [50, 4, 13, "Strength"],
  [24, 29, 11, "Hope"],
  [45, 8, 28, "Purpose"],
  [20, 3, 5, "Trust"],
  [23, 40, 31, "Renewal"],
  [19, 46, 1, "Refuge"],
  [40, 11, 28, "Rest"],
  [43, 14, 6, "Truth"],
  [19, 119, 105, "Guidance"],
  [45, 12, 2, "Transformation"],
  [48, 5, 22, "Fruitfulness"],
  [58, 11, 1, "Faith"],
  [40, 6, 33, "Provision"],
  [19, 27, 1, "Courage"],
  [23, 41, 10, "Courage"],
  [62, 4, 19, "Love"],
  [46, 13, 4, "Love"],
  [19, 34, 8, "Goodness"],
  [43, 1, 1, "The Word"],
  [45, 5, 8, "Grace"],
  [49, 2, 8, "Grace"],
  [19, 139, 14, "Identity"],
  [51, 3, 23, "Work"],
  [40, 5, 16, "Witness"],
  [66, 21, 4, "Comfort"],
  [23, 53, 5, "Healing"],
  [19, 91, 1, "Shelter"],
  [43, 10, 10, "Abundance"],
  [45, 10, 9, "Salvation"],
  [58, 4, 12, "The Word"],
  [59, 1, 5, "Wisdom"],
  [19, 121, 1, "Help"],
  [40, 28, 19, "Mission"],
  [43, 15, 5, "Abiding"],
  [47, 5, 17, "New Creation"],
  [50, 1, 6, "Assurance"],
  [19, 37, 4, "Delight"],
  [26, 36, 26, "Renewal"],
  [55, 1, 7, "Boldness"],
  [60, 5, 7, "Peace"],
  [43, 16, 33, "Overcoming"],
  [19, 51, 10, "Cleansing"],
  [42, 6, 31, "Kindness"],
  [40, 22, 37, "Love"],
  [49, 6, 10, "Strength"],
  [23, 26, 3, "Peace"],
  [19, 118, 24, "Joy"],
  [43, 8, 32, "Freedom"],
  [46, 10, 13, "Endurance"],
  [50, 4, 6, "Peace"],
  [62, 1, 9, "Forgiveness"],
  [20, 16, 9, "Guidance"],
  [24, 33, 3, "Prayer"],
  [45, 15, 13, "Hope"],
  [58, 12, 1, "Perseverance"],
  [19, 100, 4, "Thanksgiving"],
  [43, 13, 34, "Love"],
  [61, 1, 3, "Promise"],
  [40, 7, 7, "Prayer"],
  [19, 19, 1, "Glory"],
  [66, 3, 20, "Invitation"],
  [45, 3, 23, "Grace"],
  [51, 2, 6, "Rootedness"],
  [19, 42, 1, "Longing"],
  [43, 11, 25, "Resurrection"],
  [56, 3, 5, "Mercy"],
  [40, 5, 14, "Witness"],
  [30, 5, 24, "Justice"],
  [33, 6, 8, "Humility"],
  [35, 3, 17, "Joy"],
  [38, 4, 6, "The Spirit"],
];

export function verseOfDayRef(date = new Date()): { book: number; chapter: number; verse: number; theme: string } {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  const [book, chapter, verse, theme] = ROTATION[day % ROTATION.length];
  return { book, chapter, verse, theme };
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Peace to you tonight";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "A quiet evening";
}
