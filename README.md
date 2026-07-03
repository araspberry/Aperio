# Aperio

*Latin: "I open, I reveal."*

The complete Bible with original commentary in three voices — devotional, scholarly, and prophetic — plus Strong's Hebrew & Greek lexicon, search, prayer journal, bookmarks, and highlights. **Everything works offline.** Optional Apple/Google sign-in backs up your personal data via Supabase; no account is ever required to read.

## Architecture (why this build passes review)

- **Offline-first**: all 31,080 verses, 1,189 chapters of commentary, and 14,197 lexicon entries ship inside the app in a bundled SQLite database (`assets/db/aperio.db`). Reading never touches the network — the top crash source in previous submissions is gone by design.
- **Optional auth** (App Store Guideline 5.1.1 compliant): the app is fully usable without an account. Sign in with Apple is offered alongside Google (Guideline 4.8 requirement).
- **Graceful failure everywhere**: every async operation is wrapped; auth/sync failures degrade to guest mode; the root layout exports a friendly ErrorBoundary instead of crashing.

## Stack

Expo SDK 57 · React Native · expo-router · expo-sqlite · Supabase (auth + sync only)

## Development

```bash
npm install
npx expo start        # then press i for iOS simulator
```

## Building for the App Store

```bash
npm install -g eas-cli
eas login             # Expo account
eas build --platform ios --profile production
eas submit --platform ios
```

Bundle ID: `com.aperio.app` (matches the existing App Store Connect record).

## One-time provider setup (Supabase dashboard)

For sign-in to work in production, in Supabase → Authentication → Providers:

1. **Apple**: enable, add `com.aperio.app` to Authorized Client IDs.
2. **Google**: enable with OAuth client credentials from Google Cloud Console; add the Supabase callback URL to the Google client's authorized redirect URIs.

## Content pipeline

Source-of-truth content lives in `data/` (scripture + commentary CSVs) and is mirrored in the
Supabase `books` / `scripture` / `commentary` tables. `tools/build_db.py` compiles the CSVs +
Strong's lexicon into `assets/db/aperio.db`. To update content: edit the CSVs, re-run the script,
rebuild the app.
