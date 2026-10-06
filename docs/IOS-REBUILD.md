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
- App source commit: c032367d. Version 2.0.0 (26) upload succeeded on October 6, 2026 at 11:15 EDT; Apple processing completed; the build is listed in TestFlight with 90 days remaining and assigned to the existing Team (Expo) internal group.

### Build 27 — theme-colored original icon

- User requested the existing app icon in the current theme, retaining its red ribbon. Inspected the exact original `assets/images/icon.png` selected in the prior app manifest, then recolored the artwork with the built-in image editing tool.
- Graphite leather, olive/sage embossed flame-A and trim, pearl pages, red ribbon. The saved master and full edit prompt are in `design/`; the packaging script now derives the native icon from that master instead of generating the temporary lettermark.
- The packaged asset is 1024 × 1024, opaque RGB. No navigation or study behavior changed from the verified build 26.
- Version 2.0.0 (27), app source `4de89ddc`: signed device archive succeeded. Archive metadata confirms the existing bundle identifier and build 27. The compiled 120-pixel icon was visually checked. Xcode confirmed upload success at 11:30 EDT on October 6, 2026. Apple processing subsequently completed; no App Review submission or public release was performed.

### October 6 — App Store listing preparation

- The owner selected build 27. Updated the draft version from 1.2.0 to 2.0.0 to match it.
- Saved promotional text, description, What's New, support URL, marketing URL, and review notes. Revisited the version page and confirmed persistence. Exact copy: `docs/app-store-copy.md`.
- Removed inaccurate legacy claims about NCT, live AI, Apple/Google sign-in, account deletion, cloud sync, seven-question quizzes, notifications, and native giving. Existing review contact, copyright, keywords, and release choices were preserved.
- Saved the privacy policy URL as `https://aperiobible.com/#privacy`; Apple says URL changes release with the next app version.
- Added `https://aperiobible.com/support.html` (served at `/support`) and a native version 2.0 section in the existing privacy policy. Existing published support mailbox `support@aperiobible.app` is retained; no new mailbox was invented. Sites v40, source `ae2ee29e4ee06bc6c16d2df38a367a6c8e9df95d`, deployed successfully with public audience unchanged. Both pages verified in Chrome.
- Captured current Home, Bible, Commentary, and Lexicon screenshots using an isolated UI-test store on iPhone 17 Pro and iPad Pro 13-inch; no production personal data is used. Both capture suites passed. Repeated the iPad capture after dismissing a one-time simulator notification. Uploaded and visually verified the four clean screenshots per device. With explicit owner approval, removed ten legacy large-iPhone and six legacy iPad screenshots from version 2.0.0; the replacements remain and the legacy files remain in Apple's Asset Library. Proof: `artifacts/app-store-listing-final.jpg` and `artifacts/app-store-ipad-final.jpg`.
- Published Apple privacy labels still describe the older app's email, user content, and user ID collection, including advertising/analytics use. Do not claim these were updated. Reconcile them against the native build and any versions still distributed before publication; current native source has no server sign-in, collection SDK, or cloud sync. Apple's privacy-answer publication may require the owner's confirmation.
- Chrome sign-in was restored; all saved fields were reverified, including build 27 and version 2.0.0. Subtitle “Read. Understand. Live.” was saved and persisted.
- Automatic approval review rejected saving a “No data collection” declaration because the older released version may still collect data and that cross-version change was not reconciled or explicitly authorized. Canceled the edit; existing published privacy answers remain unchanged. Need owner clarification on the legacy app's active sign-in/cloud services before choosing a truthful app-wide declaration.
- Content Rights still says no third-party content. Inspected the correction dialog: it requires declaring that third-party content is present and the owner has the necessary rights. Canceled without changing it; obtain the owner's confirmation for that declaration. No license agreement, age rating, production app version, or review-submission status was changed.
- Do not click Update Review or submit until remaining declarations and release-readiness checks are resolved.

### October 6 — declarations and Update Review completed

- The owner asked to move forward after the two declaration questions. Rechecked the reference app's `src/lib/auth.tsx` and `src/lib/sync.ts`: optional Apple/Google sign-in and Supabase syncing of personal notes, prayers, bookmarks and highlights exist. This is source evidence, not evidence that a live service is shut down or that any particular user has synced. No personal server records were requested.
- Verified Apple's current guidance at https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy: when an app is currently on the Store, answers should reflect data collected by that currently available version. This resolves the earlier assumption that all historical versions must be shut down before updating the label. Kept the existing published answers for the currently released 1.1.0 and added the local-only 2.0 transition to the review notes. Update the label when 2.0 is released; do not misrepresent it as already changed.
- BSB permission reverified at https://berean.bible/licensing.htm. Original Open Scriptures dictionary files, copyright/CC-BY-SA notices, format-conversion attribution and source links are bundled in `Aperio/Content`. Saved the Content Rights correction to third-party content with necessary rights; Apple displayed Saved.
- Saved additional review notes explaining the privacy transition and content sources. Full saved text is in `docs/app-store-copy.md`.
- Clicked Update Review and Continue on Apple's shared-metadata notice. Confirmed the resulting submission row is `iOS App 2.0.0`, `2.0.0 (27)`, `Ready for Review`. Proof: `artifacts/app-store-build27-ready-for-review.jpg`. This supersedes the earlier instruction to hold Update Review.
- Final Resubmit to App Review remains available and has not been clicked. The Unresolved Issues banner belongs to the older rejection in this reused submission, not a new decision on build 27. No App Review outcome or public replacement is claimed. Automatic-release preferences were preserved; coordinate the privacy-label update with the eventual 2.0 release.
