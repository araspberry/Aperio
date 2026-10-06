# iOS rebuild record — October 6, 2026

## Direction

The user requested a new branch, a fresh iOS implementation based on the current Aperio website, and replacement of the previous App Store app. The former GitHub app is reference only. The branch `ios-rebuild` is an orphan branch so it contains no legacy mobile source tree. Main is unchanged.

Reference reviewed: araspberry/Aperio at d9e5c80ded9e378174c88d6fb83788fb4da1d10c. Reviewed app manifest, build settings, tab structure, Home, Study Center and personal-data schema. Sources informed feature organization and migration, not native view implementation. Current website content/artwork imported from the owner's Aperio Site checkout at cd8b77d91e46fa407a7069938229e8ed292d3853.

## Native architecture

SwiftUI, iOS 17+, no hosted page wrapper and no external runtime dependencies. Bundled JSON data decoded through ContentLibrary. Commentary is saved content; no reader action makes an AI request. AVQueuePlayer loops local motion covers and respects Reduce Motion and backgrounding. PersonalStore uses atomic protected JSON writes; corrupt existing files are preserved and writes are blocked. LegacyImport opens the old SQLite database read-only, translates 1-based book identifiers, merges verse annotations and preserves the database.

A persistent root navigation bar remains outside the reader and Study Center. Study Center is an in-reader panel, not a modal that covers navigation. Native sheets handle passage selection, verse annotations, quizzes and text preferences.

## Apple observations

- Aperio Bible: 6763618868, com.aperio.bible (verified in App Information).
- The separate AperioApp record 6781547905 is not the reference app's identity and has not been modified.
- 1.1.0 Ready for Distribution; 1.2.0 (24) Rejected.
- Rejection dated August 13, 2026: guideline 3.1.1. App-development contributions used an unsupported non-IAP payment mechanism. Apple specified external browser links on the US storefront or in-app purchase where required.
- Account banner requires the account holder to review/accept an updated Apple Developer Program agreement. User asked to complete this; acceptance not yet confirmed at initial inspection.
- Digital Services Act trader status also requires attention if distributing in the EU.
- Existing App Information says it has no third-party content and old listing copy advertises NCT and on-demand AI features. These statements do not describe the rebuild and need correction before submission.

No version was submitted or released by this change. No legacy app record/build was deleted.

## Required before public replacement

1. Confirm developer agreement accepted and valid distribution signing/provisioning.
2. Complete native website-account integration or explicitly approve an on-device-only release; avoid claiming cloud sync that isn't implemented.
3. Test migration on an actual prior app installation, including existing cloud-only data and authentication transition.
4. Review the native giving approach against the actual rejection. No payment controls in this preview.
5. Prepare accurate 2.0 listing copy, privacy disclosures, support/privacy URLs and screenshots. Ensure account deletion if native account creation is added.
6. Device/TestFlight testing, accessibility and background/low-memory behavior checks, then final App Review submission.

## Verification

Five automated suites passed: all 66 introductions/1,189 chapter datasets and perspectives decode; language/reference examples; search/journey destinations and cover availability; SQLite migration with deleted-record exclusion/idempotency; persistence and corrupt-file preservation. Simulator build and visual verification recorded separately as they complete.

### Native build and interaction results

- iPhone 17 Pro simulator (iOS 26.3): build, install and launch succeeded.
- Signed iOS device archive succeeded using the existing Apple Development identity and team provisioning profile.
- A packaging defect was corrected: bundled assets now use `Content`, avoiding Apple's reserved `Resources` bundle layout detection.
- Native UI regression passed after correcting the book list row hit areas: Bible navigation; Study Center and visible bottom menu; Hebrew phrase detail and Back to Lexicon; highlighting and verse notes; Saved; prayer entry; persistence after relaunch; Genesis introduction.
- Debug-only automated-test storage is isolated from real personal data. No production launch argument can reset personal data.
- Initial TestFlight export failed because Xcode's account session had expired. User signed back in and the developer team appeared. The next export reached Apple successfully but failed with `PLA Update available`; updated Developer Agreement acceptance is required before obtaining a distribution profile.
- Website account syncing and native giving remain unimplemented preview boundaries. No claim of a public/App Store replacement is made.
