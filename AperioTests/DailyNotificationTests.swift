import XCTest
@testable import AperioCore

@MainActor private final class NotificationClientMock: DailyNotificationClient {
    var status: NotificationPermission = .notDetermined
    var permits = true
    var fails = false
    var permissionRequests = 0
    var replacements = [[DailyVerseAlert]]()
    var cancellations = 0
    var previews = [DailyVerseAlert]()
    func permission() async -> NotificationPermission { status }
    func requestPermission() async throws -> Bool { permissionRequests += 1; status = permits ? .authorized : .denied; return permits }
    func replace(with alerts:[DailyVerseAlert]) async throws {
        if fails { throw CocoaError(.fileWriteUnknown) }
        replacements.append(alerts)
    }
    func cancel() async { cancellations += 1 }
    func preview(_ alert:DailyVerseAlert) async throws { previews.append(alert) }
}

final class DailyNotificationTests: XCTestCase {
    private func library() throws -> ContentLibrary {
        try ContentLibrary(root:URL(fileURLWithPath:#filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("Aperio/Content"))
    }
    func testSixtyAlertsMatchHomeAcrossTimeZonesAndDaylightSaving() throws {
        let library = try library()
        for zone in ["America/New_York","America/Los_Angeles","Europe/London","Asia/Kolkata","Pacific/Kiritimati","Pacific/Honolulu"] {
            var calendar = Calendar(identifier:.gregorian); calendar.timeZone = TimeZone(identifier:zone)!
            for start in ["2026-10-12T12:00:00Z","2027-03-01T12:00:00Z"] {
                let base = ISO8601DateFormatter().date(from:start)!
                for hour in [2,8,23] {
                    let pref = DailyNotificationPreference(enabled:true,hour:hour,minute:17,sound:false)
                    let alerts = try DailyNotificationPlan.make(library:library,preference:pref,now:base,timeZone:calendar.timeZone)
                    XCTAssertEqual(alerts.count,60); XCTAssertEqual(Set(alerts.map(\.id)).count,60)
                    var previous = base
                    for alert in alerts {
                        let date = try XCTUnwrap(calendar.date(from:DateComponents(year:alert.year,month:alert.month,day:alert.day,hour:alert.hour,minute:alert.minute)))
                        XCTAssertGreaterThan(date,previous)
                        if previous != base { XCTAssertEqual(calendar.dateComponents([.day],from:calendar.startOfDay(for:previous),to:calendar.startOfDay(for:date)).day,1) }
                        previous = date
                        let daily = library.daily(on:date,calendar:calendar)
                        XCTAssertEqual(alert.passage,daily.passage)
                        XCTAssertEqual(alert.text,library.verses(daily.passage).first { $0.v == daily.verse }?.t)
                        XCTAssertFalse(alert.sound)
                    }
                }
            }
        }
    }
    func testPayloadOpensExactSavedVerseAndRejectsUnexpectedInput() throws {
        let alerts = try DailyNotificationPlan.make(library:library(),preference:DailyNotificationPreference())
        for alert in alerts { XCTAssertEqual(DailyVerseAlert.passage(from:alert.payload),alert.passage) }
        for payload in [[:],["kind":"other","passage":"18:23:1"],["kind":"aperio.daily-verse.v1","passage":"https://example.com"],["kind":"aperio.daily-verse.v1","passage":"18:0:1"],["kind":"aperio.daily-verse.v1","passage":"66:1:1"],["kind":"aperio.daily-verse.v1","passage":"18:23:1:4"],["kind":"aperio.daily-verse.v1","passage":"18:23:-1"]] {
            XCTAssertNil(DailyVerseAlert.passage(from:payload))
        }
        XCTAssertThrowsError(try DailyNotificationPlan.make(library:library(),preference:DailyNotificationPreference(hour:24)))
    }
    @MainActor func testOptInPersistenceTimeChangesPreviewAndCancellation() async throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at:dir) }
        let client = NotificationClientMock()
        let store = DailyNotificationStore(library:try library(),client:client,directory:dir)
        await store.refresh()
        XCTAssertFalse(store.active); XCTAssertEqual(client.permissionRequests,0); XCTAssertTrue(client.replacements.isEmpty)
        await store.setTime(hour:9,minute:35)
        XCTAssertTrue(client.replacements.isEmpty)
        await store.setEnabled(true)
        XCTAssertTrue(store.active,store.error ?? ""); XCTAssertEqual(client.permissionRequests,1)
        XCTAssertEqual(client.replacements.last?.count,60)
        XCTAssertTrue((try XCTUnwrap(client.replacements.last)).allSatisfy { $0.hour == 9 && $0.minute == 35 })
        await store.setTime(hour:18,minute:5); await store.setSound(false)
        XCTAssertTrue((try XCTUnwrap(client.replacements.last)).allSatisfy { $0.hour == 18 && $0.minute == 5 && !$0.sound })
        XCTAssertEqual(Set((try XCTUnwrap(client.replacements.last)).map(\.id)).count,60,"Updates replace the daily request identifiers")
        await store.sendPreview(); XCTAssertEqual(client.previews.count,1)
        let reopened = DailyNotificationStore(library:try library(),client:client,directory:dir)
        await reopened.refresh()
        XCTAssertTrue(reopened.active); XCTAssertEqual(reopened.preference,store.preference)
        await reopened.setEnabled(false)
        XCTAssertFalse(reopened.active); XCTAssertFalse(reopened.preference.enabled)
        XCTAssertGreaterThan(client.cancellations,0)
        let before = client.previews.count; await reopened.sendPreview(); XCTAssertEqual(client.previews.count,before)
        let again = DailyNotificationStore(library:try library(),client:client,directory:dir)
        XCTAssertFalse(again.preference.enabled)
        XCTAssertEqual(again.preference.hour,18)
    }
    @MainActor func testDeniedRevokedAndScheduleFailureNeverReportEnabled() async throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at:dir) }
        let client = NotificationClientMock(); client.permits = false
        let store = DailyNotificationStore(library:try library(),client:client,directory:dir)
        await store.setEnabled(true)
        XCTAssertFalse(store.active); XCTAssertFalse(store.preference.enabled)
        XCTAssertEqual(store.permission,.denied); XCTAssertEqual(client.permissionRequests,1)
        await store.setEnabled(true); XCTAssertEqual(client.permissionRequests,1,"Don't repeat an iOS permission request after denial")
        client.status = .authorized; await store.setEnabled(true); XCTAssertTrue(store.active)
        client.status = .denied; await store.refresh()
        XCTAssertFalse(store.active); XCTAssertFalse(store.preference.enabled)
        client.status = .authorized; client.fails = true
        await store.setEnabled(true)
        XCTAssertFalse(store.active); XCTAssertFalse(store.preference.enabled); XCTAssertNotNil(store.error)
    }
    @MainActor func testCorruptPreferenceIsPreservedAndNotificationsRemainOff() async throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at:dir,withIntermediateDirectories:true)
        defer { try? FileManager.default.removeItem(at:dir) }
        let file = dir.appendingPathComponent("daily-notifications.json")
        try Data("broken".utf8).write(to:file)
        let client = NotificationClientMock()
        let store = DailyNotificationStore(library:try library(),client:client,directory:dir)
        await store.refresh(); await store.setEnabled(true)
        XCTAssertFalse(store.active); XCTAssertNotNil(store.error); XCTAssertEqual(client.permissionRequests,0)
        XCTAssertEqual(try String(contentsOf:file,encoding:.utf8),"broken")
    }
}
