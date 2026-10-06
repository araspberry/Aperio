# iOS rebuild record — October 6, 2026

## Direction

The user requested a new branch, a fresh iOS implementation based on the current Aperio website, and replacement of the previous App Store app. The former GitHub app is reference only. The branch `ios-rebuild` is an orphan branch so it contains no legacy mobile source tree. Main is unchanged.

Reference reviewed: araspberry/Aperio at d9e5c80ded9e378174c88d6fb83788fb4da1d10c. Reviewed app manifest, build settings, tab structure, Home, Study Center and personal-data schema. Sources informed feature organization and migration, not native view implementation. Current website content/artwork imported from the owner's Aperio Site checkout at cd8b77d91e46fa407a7069938229e8ed292d3853.

## Native architecture

SwiftUI, iOS 17+, no hosted page wrapper and no external runtime dependencies. Bundled JSON data decoded through ContentLibrary. Commentary is saved content; no reader action makes an AI request. AVQueuePlayer loops local motion covers and respects Reduce Motion and backgrounding. PersonalStore uses atomic protected JSON writes; corrupt existing files are preserved and writes are blocked. LegacyImport opens the old SQLite database read-only, translates 1-based book identifiers, merges verse annotations and preserves the database.

A floating + menu remains outside the reader and Study Center. It expands to Home, Bible, Prayer, Saved, Account, Search and Settings. A separate floating Study Center pill uses the current book/ribbon artwork. Tapping a verse directly opens its highlight, note and bookmark editor. Study Center is an in-reader panel, not a modal that covers navigation. Native sheets handle passage selection, verse annotations, quizzes and text preferences.

## Apple observations

- Aperio Bible: 6763618868, com.aperio.bible (verified in App Information).
- The separate AperioApp record 6781547905 is not the reference app's identity and has not been modified.
- 1.1.0 Ready for Distribution; 1.2.0 (24) Rejected.
- Rejection dated August 13, 2026: guideline 3.1.1. App-development contributions used an unsupported non-IAP payment mechanism. Apple specified external browser links on the US storefront or in-app purchase where required.
- The account holder accepted the updated Apple Developer Program agreement after refreshing Xcode sign-in. Distribution export succeeded.
- Digital Services Act trader status also requires attention if distributing in the EU.
- Existing App Information says it has no third-party content and old listing copy advertises NCT and on-demand AI features. These statements do not describe the rebuild and need correction before submission.

No version was submitted or released by this change. No legacy app record/build was deleted.

## Required before public replacement

1. Complete on-device testing of the processed TestFlight build (upload, processing, internal group assignment and distribution signing are verified).
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
- Native UI regression passed after correcting the book list row hit areas: Bible navigation; Study Center and accessible floating + menu; Hebrew phrase detail and Back to Lexicon; highlighting and verse notes; Saved; prayer entry; persistence after relaunch; Genesis introduction.
- Debug-only automated-test storage is isolated from real personal data. No production launch argument can reset personal data.
- Initial TestFlight export failed because Xcode's account session had expired. User signed back in and the developer team appeared. The next export reached Apple successfully but failed with `PLA Update available`; the user then confirmed agreement acceptance and the subsequent App Store export succeeded.
- The updated floating-navigation UI regression passed on October 6, 2026, with screenshots of the reader pill, expanded menu, Hebrew lexicon, prayer journal and book introduction. Direct highlighting is exercised with Study Center closed.
- Website account syncing and native giving remain unimplemented preview boundaries. No claim of a public/App Store replacement is made.

### Upload record

- Source: `56dbba67` on `ios-rebuild`.
- Version: 2.0.0 (25), uploaded to the existing Aperio Bible record.
- October 6, 2026 at 10:58 EDT: Xcode reported “Uploaded package is processing”, “Upload succeeded” and “EXPORT SUCCEEDED”.
- Apple-side processing completed: 2.0.0 (25) is listed with 90 days remaining, automatically assigned to Team (Expo), with one existing tester (the owner). Group settings confirm Automatic for Xcode Builds.
- Build-specific What to Test notes were saved and the confirmation screenshot is in local artifacts/testflight-build-25.jpg.
- No App Review submission or public release. Actual phone installation/testing remains the owner’s next step.

### Build 26 — Study Center presentation

- User reported Scripture showing below the Study Center in the bottom safe area. The panel now slides from the bottom, fills the available reader area, and extends its opaque background through the home-indicator area without extending its controls.
- The underlying reader is excluded from touch and accessibility while the panel is open. Reduce Motion disables the slide animation.
- The native UI regression passed, including screenshot pixel checks at the bottom edge in Commentary and Lexicon, floating-menu operation during study, direct highlighting after closing study, note persistence, prayer entry and book introduction navigation. Visual inspection confirmed the reported white/Scripture strip is gone.
- App source commit: c032367d. Distribution status will be recorded after upload.
