# Aperio for iOS

A fresh SwiftUI implementation of the Aperio reading experience. This branch contains only the new native app, its tests and build tooling, and the current website's saved content and artwork. The earlier Expo app is a reference, not a dependency.

## Run

Open `Aperio.xcodeproj`, choose the Aperio scheme and an iPhone simulator, then Run. Requires Xcode 26.2; deployment target iOS 17.0. iPhone and iPad layouts are supported.

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer swift test
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project Aperio.xcodeproj -scheme Aperio -sdk iphonesimulator -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
```

The checked-in project has no third-party runtime packages. `scripts/create_project.py` regenerates the project after adding Swift files. The app icon reuses the owner's original leather-book/flame-A design with graphite and olive colors and its red ribbon. The edited master and provenance are in `design/`; `scripts/render-icon.swift` packages it as an opaque 1024-pixel sRGB icon.

## Included

- Floating + navigation for Home, Bible, Prayer, Saved and Account, available while studying; a separate floating Study Center pill on the Bible screen.
- Offline BSB text for 66 books / 1,189 chapters, 66 introductions, saved three-perspective commentary, Hebrew/Greek phrase study, lexicons, available passage cross-references and chapter timeline context.
- Current graphite/pearl/olive visual direction, all nine motion covers, daily Scripture, quizzes, themed reading threads with persistent progress and continuation controls.
- Direct verse-tap highlights, notes and bookmarks, without opening Study Center; prayer creation/editing/answered status; text-size preferences; Scripture search; backup export and merge restore.
- Read-only migration of the previous app's local SQLite notes, highlights, bookmarks, prayers and reading position. The original database remains untouched.

## Preview boundaries

This is a native preview, not yet an App Store release. Saves are on-device. Website account sign-in and cross-device sync have not been connected. Existing cloud-only records are not imported; an installed legacy app's local database can be imported. Existing legacy database files are never deleted. The app explicitly explains its current storage behavior.

The previous App Store version was rejected for its payment mechanism. This build contains no giving/payment flow. Stripe continues to work on the existing website. A native giving flow requires a separate StoreKit/storefront decision before distribution.

App Store record: Aperio Bible, Apple ID `6763618868`, bundle identifier `com.aperio.bible`, Apple team `JYTDLQ3GAT`. Both identity values were confirmed in App Store Connect / the existing development certificate on October 6, 2026. The current released version is 1.1.0; 1.2.0 build 24 was rejected. This rebuild first reached TestFlight as 2.0.0 build 25 on October 6, 2026. Build 26 with the bottom-covering Study Center has also processed. Build 27 adds the recolored original app icon and uploaded successfully at 11:30 EDT; Apple processing is pending.

See `docs/IOS-REBUILD.md` for reference and release notes. Content attribution is included under `Aperio/Content/`.

## Verified preview

The native iPhone simulator build launches, the signed device archive builds, all five core/data tests pass, and the native UI regression passes (Study Center, Lexicon return, floating navigation and Study Center pill, direct verse note/highlight, prayer, restart persistence and Genesis introduction). The user refreshed Xcode sign-in and accepted Apple's updated Developer Agreement; App Store export then succeeded. The final floating-navigation build was accepted by App Store Connect on October 6 at 10:58 EDT, completed processing, and was automatically assigned to the existing internal TestFlight group (one tester, the owner). Build-specific testing notes are saved. The build has not been submitted to App Review.
