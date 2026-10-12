# Aperio 2.0.1 (28) — October 12, 2026

The user approved US-storefront Stripe giving, optional daily-verse email signup, a separate chapter picker, smaller wordmark/subtitle, freely resizable Study Center and stronger remembered-phrase search.

## Search and reader

A cached, lock-protected immutable index covers all 31,102 bundled BSB verses. Ranking uses term coverage, frequency, proximity and phrases; selected inflections/related words, single spelling errors for unknown words, precise book aliases and verse ranges are supported. A small explicit common-phrase map bridges wording across verses. This is not an LLM or unrestricted semantic search. Results contain exact BSB text and open the matching verse in its full chapter. Queries are not transmitted or saved.

Both “Works tested in fire” and “Works tested by fire” rank 1 Corinthians 3:13 first through general work/workmanship and test/prove rules, without a hardcoded query-to-verse mapping.

Study Center opens at half the screen height, constrained to the available reader area. Its handle supports continuous drag, double-tap half/full, VoiceOver adjustment and named height actions. A minimum height preserves the header and tabs; the maximum covers the reader. Close/reopen resets height. Covered Scripture is hidden from touch and VoiceOver when fully expanded. The opaque surface reaches the bottom safe area and the + menu remains accessible.

## Giving and signup

Storefront.current.countryCode must be USA before Give is shown. The app observes changes and rechecks before opening an external browser. Existing Stripe payments and monthly management remain on the website; native code receives no payment details and unlocks no benefits. No donation was made during testing.

Signup saves email, optional first name, consent version/time, random request ID and hashed management credential in the hosted database. The app preserves its random removal credential in a protected local file for retries/removal. Pending consent is not verified email ownership. Daily email delivery is NOT connected; the screen and API disclose this. The user has not yet supplied an email provider. No live email was sent.

## Backend

Site source e68d0b500606a5e883c0f3beaba27b7dbd19a5ae; public version 42; successful deployment appgdep_6acd02fabc988191ab324f5b97a01684 on October 12. Additive migration 0005_previous_spacker_dave.sql preserves existing records. Live custom-domain GET /api/verse-email/config returned signupEnabled true and deliveryReady false.

All 51 backend tests pass, including signup consent, durable storage, idempotence, token isolation, rate limits, failures and existing account/payment regressions. An obsolete test requiring the homepage review-warning sentence was updated to respect the user's earlier explicit removal of that sentence.

## Verification

All 11 Swift core/data tests pass: 12 search examples, precise references, typo/irrelevant queries, exact returned text, warmed-query responsiveness, consent/email validation, persisted retries and removal failures, plus existing content and personal-data checks.

iPhone checks pass for opt-in controls without submitting a production signup, US/non-US giving, separate chapter selection, drag resizing/reset/opaque bottom, and remembered search opening its exact verse. Existing direct highlight/note, prayer persistence, Lexicon and introduction regression passed. Final landscape navigation check is recorded below when complete. Simulator runner caching briefly ran stale tests; only the disposable runner was uninstalled, preserving user app data.

Screenshots: artifacts/search-works-tested-in-fire.png and artifacts/study-center-half-height.png.

## Release status

Apple's public App Store record confirms 2.0.0 released October 7. This update uses 2.0.1 (28). Archive/upload results will be recorded below. Chrome's App Store Connect session was signed out; the user was asked to sign back in for listing/privacy work.

Before App Review, update the privacy questionnaire for optional email, name and request identifier used for app functionality, plus brief security counters. The app privacy manifest and website policy describe these new flows. No native cloud account or prayer/notes sync is claimed. Email-provider setup, verified sender, confirmation, unsubscribe and scheduling must be completed before enabling daily delivery. Backend publication is not an App Store release.

Apple references: https://developer.apple.com/app-store/review/guidelines/#link-to-other-purchase-methods ; https://developer.apple.com/documentation/storekit/storefront ; https://developer.apple.com/app-store/app-privacy-details/

## Follow-up refinements

Native giving now collects the gift selection (USD cents, $1–$10,000; preset/custom and once/monthly) before opening the website. A stable UUID per unchanged selection gives retries the same server idempotency key. Only the fixed aperiobible.com origin is built into native checkout links. The website validates the handoff, displays a read-only summary, and preserves it through optional sign-in. Change amount explicitly returns to the form. No guest-payment bypass or live charge was introduced.

The Study Center scroll viewport is explicitly bounded below its fixed header and tabs at each resized height. Only the 44-point handle receives the resize gesture. The subtitle is italic with a soft text shadow glow, without a pill or outline; Reduce Motion is respected.

Email preferences now separately record verse_only or verse_and_updates and a versioned explicit consent. Legacy daily-only records default to verse_only. The server rejects any attempt to use legacy consent for updates and only the request credential owner can change a choice. Website privacy copy and native manifest include optional first-party marketing. App Store privacy answers still need the same update before review. No email sending has been enabled.


Website follow-up: source 5aef3e4fbdde2d0af0a0ce512cd6e7124cf41edd, public version 43, deployment appgdep_6acd098f7ce481918e2101d6c9519924 confirmed succeeded October 12 at 16:23 UTC. Migration 0006_dark_unicorn adds the email preference with daily-only defaults. All 56 website tests pass, including mocked checkout handoff, sign-in continuity, malformed links, stale navigation, consent isolation, and existing payments/account regressions. Browser preview correctly shows the passed $17.75 monthly selection; payments were disabled in local preview.

Final native functional results: 13 Swift core/data tests pass. followup-28-r2.xcresult has three passing UI tests: native preset/custom monthly selection, separate email choices, content reaching both ends at half/compact/full Study Center heights without resizing the panel, US/non-US giving, chapter picker, landscape menu, and remembered-verse search. The first scroll test sampled an in-progress resize animation; the corrected test waits via the first scroll gesture before comparing settled handle positions. No functional failure remained.

Latest subtitle direction: horizontal beside the title; muted gray-olive letters with a slow, soft light-olive shimmer traveling left to right, 7.2-second cycle with a pause. No border or filled pill. Reduce Motion displays steady light-olive text.

App Store privacy update must declare optional email/name/request ID and email preferences as linked, for app functionality and first-party marketing when the broader option is selected. Short-lived security counters are not associated with subscribers. No third-party advertising or tracking.

The period after aperio now shares Theme.ribbon (#C94141) with the Study button’s red ribbon. The final release archive must include this refinement; earlier local build-28 archives are superseded and must not be uploaded.
