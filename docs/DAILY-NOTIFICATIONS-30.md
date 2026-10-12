# Daily verse notifications — 2.0.1 (30)

The owner requested phone notifications in addition to Verse of the Day email. This build adds optional, device-scheduled iOS notifications. It does not implement a remote APNs provider or collect device tokens.

## Reader experience

The header envelope opens separate **On my phone** and **By email** choices. Phone alerts are off by default. Only enabling the daily verse switch requests iOS permission; readers choose their time and whether to include a notification sound. The same controls are accessible from Settings → Daily Scripture. Denied permission has a link to iOS notification settings, without repeatedly prompting.

Notifications include the exact BSB verse, its reference, and a route to that verse in the full chapter. The optional five-second preview is a real local notification. Email signup is independent and is never required or changed when enabling/disabling phone alerts. No production signup, email, payment, or notification to another person's device was sent during testing.

## Scheduling and limits

The Home page uses a 30-day reading rotation. The scheduler resolves the next 60 local calendar dates against that same saved content, including the exact passage verse. Stable date identifiers replace existing requests when the time or sound preference changes; unrelated notifications are untouched. The 60 daily requests plus at most one preview leave room below iOS's pending notification limit.

The app refreshes the rolling window on foreground visits and when opening notification preferences. Once scheduled, alerts can arrive while Aperio is closed or offline. If the app isn't reopened for 60 days, that prepared schedule ends. This limit and refresh behavior are explained in the reader-facing preferences. Focus, notification summaries, sound settings, and other iOS controls can affect presentation. This is not indefinite server push, promotional push, Android push, or web push.

Preferences remain in a protected local file and are not added to the email database. Disabling alerts cancels Aperio's pending and delivered daily notifications. Revoked permission disables the saved opt-in at the next refresh. A scheduling or storage failure does not report alerts as active, and a corrupt preference file is preserved.

Notification payloads accept only the known verse route schema. Actual bundled verse existence is checked before navigation. The router handles a queued launch response after reading-position restoration and dismisses overlays before opening the passage.

## Verification

- All 18 Swift core/data tests pass, including new coverage of 60-day schedules across six time zones, spring/fall daylight-saving boundaries, exact Home/content agreement, payload validation, opt-in, persistence, time/sound changes, preview, cancellation, denied/revoked permission, scheduling failures, and corrupt-file preservation.
- The iPhone simulator delivered a real five-second preview for John 13:15 on October 12. Tapping it opened John 13 at verse 15. Screenshots were inspected from `artifacts/notifications-ui-30-r2.xcresult`.
- Both final simulator UI tests passed (`artifacts/notifications-ui-30-final.xcresult`, October 12, 13:09 EDT): actual notification delivery and tap routing while backgrounded and after termination, turning alerts off, independent email choices and consent gating, separate chapter picker, US/non-US giving visibility, and Study Center resizing. No automated production signup or payment was submitted.

## Release and remaining setup

Build 30 supersedes build 29 for this update. Archive/upload results will be recorded after verification. App Store Connect listing/privacy updates remain pending from the earlier email-signup work; this change adds no server-collected notification data. Do not claim an App Store release solely from a successful upload.

Resend is a separate setup for email delivery. The user can create the Resend account with their regular login email; an Aperio sender address will be configured after verifying the sending domain. No API key, DNS verification, confirmation email flow, unsubscribe sender flow, or delivery schedule has been configured in this notification task.

Apple references:

- https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app
- https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications
- https://developer.apple.com/documentation/usernotifications/handling-notifications-and-notification-related-actions
