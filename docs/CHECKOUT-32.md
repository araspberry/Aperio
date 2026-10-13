# Aperio 2.0.2 (32): dedicated checkout and verse numbers

The native giving screen sends its selected amount, frequency, and stable attempt ID directly to `https://aperiobible.com/checkout`. The US storefront restriction and external default-browser handoff remain. This is a branded Stripe Embedded Checkout page, not native card collection. No ChatGPT or Aperio account is required for payment.

The website verifies payment status with Stripe before displaying success or offering an automatic return. `aperio://giving/return` opens the existing Scripture passage, and `aperio://giving/edit` opens a fresh giving selection. Native return links are navigation only and never certify payment. A visible Return to Aperio link remains when a browser requires a user gesture.

Verse numbers use a single-line intrinsic width, monospaced digits, and a scaled minimum gutter. Matthew 7:24 and Psalm 119:176 are covered by UI checks.

## Validation on October 13, 2026

- 20 Swift core tests passed (`artifacts/checkout-32-core.log`).
- Giving, subscription choices, and Study Center scrolling regression passed; two- and three-digit verse labels passed (`artifacts/checkout-32-ui.xcresult`).
- Native checkout return and edit deep links passed (`artifacts/checkout-32-return.xcresult`).
- Website: 69 tests passed, covering guest ownership, amount/frequency preservation, fixed Stripe return URL, verified success, pending/open/expired status, malformed links, and idempotent retries.
- No live payment was submitted during development.
- Distribution archive/upload status is recorded below when confirmed. Version 2.0.1 (31) was already Ready for Distribution, so this update uses 2.0.2 (32).

## What's New in This Version

- A smoother giving experience: your chosen amount and frequency carry straight into a dedicated, secure checkout.
- Return to Aperio after checkout and pick up where you left off.
- Improved verse-number spacing keeps multi-digit numbers together while reading.

## Review notes for this update

Giving appears only for the US App Store storefront. It is optional support for Aperio; it does not unlock digital content, subscriptions to app features, or any other benefit. Selecting an amount and frequency opens an external browser at the Aperio domain for Stripe checkout. It is not presented as a tax-deductible charitable donation. The checkout offers a return to the native app. No account is needed to read or to complete checkout. Do not submit a real payment during review.
