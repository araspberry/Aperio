# Aperio for iOS

A fresh SwiftUI implementation of the Aperio reading experience. This branch contains only the new native app, its tests and build tooling, and the current website's saved content and artwork. The earlier Expo app is a reference, not a dependency.

## Run

Open `Aperio.xcodeproj`, choose the Aperio scheme and an iPhone simulator, then Run. Requires Xcode 26.2; deployment target iOS 17.0. iPhone and iPad layouts are supported.

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer swift test
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project Aperio.xcodeproj -scheme Aperio -sdk iphonesimulator -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
```

The checked-in project has no third-party runtime packages. `scripts/create_project.py` regenerates the project after adding Swift files. The app icon is a rendering of the website's lettermark; its generator uses Apple's Core Graphics and Core Text.

## Included

- Native Home, Bible, Prayer, Saved and Account navigation, visible while studying.
- Offline BSB text for 66 books / 1,189 chapters, 66 introductions, saved three-perspective commentary, Hebrew/Greek phrase study, lexicons, available passage cross-references and chapter timeline context.
- Current graphite/pearl/olive visual direction, all nine motion covers, daily Scripture, quizzes, themed reading threads with persistent progress and continuation controls.
- Verse highlights, notes and bookmarks; prayer creation/editing/answered status; text-size preferences; Scripture search; backup export and merge restore.
- Read-only migration of the previous app's local SQLite notes, highlights, bookmarks, prayers and reading position. The original database remains untouched.

## Preview boundaries

This is a native preview, not yet an App Store release. Saves are on-device. Website account sign-in and cross-device sync have not been connected. Existing cloud-only records are not imported; an installed legacy app's local database can be imported. Existing legacy database files are never deleted. The app explicitly explains its current storage behavior.

The previous App Store version was rejected for its payment mechanism. This build contains no giving/payment flow. Stripe continues to work on the existing website. A native giving flow requires a separate StoreKit/storefront decision before distribution.

App Store record: Aperio Bible, Apple ID `6763618868`, bundle identifier `com.aperio.bible`, Apple team `JYTDLQ3GAT`. Both identity values were confirmed in App Store Connect / the existing development certificate on October 6, 2026. The current released version is 1.1.0; 1.2.0 build 24 was rejected. This rebuild is prepared as 2.0.0 build 25, subject to confirming the latest uploaded build before upload.

See `docs/IOS-REBUILD.md` for reference and release notes. Content attribution is included under `Aperio/Content/`.

## Verified preview

The native iPhone simulator build launches, the signed device archive builds, all five core/data tests pass, and the native UI regression passes (Study Center, Lexicon return, bottom navigation, note/highlight, prayer, restart persistence and Genesis introduction). TestFlight export currently awaits Apple's updated Developer Agreement acceptance. The build has not been submitted to App Review.
