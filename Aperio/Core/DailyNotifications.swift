import Foundation
import SwiftUI

struct DailyNotificationPreference: Codable, Equatable {
    var enabled = false
    var hour = 8
    var minute = 0
    var sound = true
    var valid: Bool { (0...23).contains(hour) && (0...59).contains(minute) }
}

enum NotificationPermission: Equatable {
    case notDetermined, denied, authorized, provisional
    var allowed: Bool { self == .authorized || self == .provisional }
}

struct DailyVerseAlert: Equatable {
    static let prefix = "aperio.daily-verse."
    let year: Int
    let month: Int
    let day: Int
    let hour: Int
    let minute: Int
    let reference: String
    let text: String
    let passage: Passage
    let sound: Bool
    var id: String { Self.prefix + String(format:"%04d-%02d-%02d",year,month,day) }
    var payload: [String:String] { ["kind":"aperio.daily-verse.v1","passage":passage.id] }

    static func passage(from payload: [AnyHashable:Any]) -> Passage? {
        guard payload["kind"] as? String == "aperio.daily-verse.v1",
              let raw = payload["passage"] as? String else { return nil }
        let values = raw.split(separator:":",omittingEmptySubsequences:false).compactMap { Int($0) }
        guard values.count == 3,raw.split(separator:":",omittingEmptySubsequences:false).count == 3,
              (0..<66).contains(values[0]),(1...150).contains(values[1]),(1...176).contains(values[2]) else { return nil }
        return Passage(book:values[0],chapter:values[1],verse:values[2])
    }
}

enum DailyNotificationPlan {
    static func make(library:ContentLibrary,preference:DailyNotificationPreference,now:Date = Date(),timeZone:TimeZone = .current) throws -> [DailyVerseAlert] {
        guard preference.valid else { throw PlanError.invalidTime }
        guard !library.home.days.isEmpty else { throw PlanError.missingVerse }
        var calendar = Calendar(identifier:.gregorian); calendar.timeZone = timeZone
        let start = calendar.startOfDay(for:now)
        // Leave room beneath iOS's pending-notification limit. Refill on each
        // foreground visit; the UI explicitly explains the 60-day window.
        var alerts = [DailyVerseAlert]()
        for offset in 0...60 {
            guard alerts.count < 60 else { break }
            guard let date = calendar.date(byAdding:.day,value:offset,to:start),
                  let fire = calendar.date(bySettingHour:preference.hour,minute:preference.minute,second:0,of:date,matchingPolicy:.nextTime,repeatedTimePolicy:.first,direction:.forward),
                  fire > now else { continue }
            let daily = library.daily(on:fire,calendar:calendar)
            guard let verse = library.verses(daily.passage).first(where: { $0.v == daily.verse }) else { throw PlanError.missingVerse }
            let parts = calendar.dateComponents([.year,.month,.day,.hour,.minute],from:fire)
            alerts.append(DailyVerseAlert(year:parts.year!,month:parts.month!,day:parts.day!,hour:parts.hour!,minute:parts.minute!,reference:library.name(daily.passage,verse:true),text:verse.t,passage:daily.passage,sound:preference.sound))
        }
        return alerts
    }
    static func preview(library:ContentLibrary,preference:DailyNotificationPreference,now:Date = Date()) throws -> DailyVerseAlert {
        let daily = library.daily(on:now)
        guard let verse = library.verses(daily.passage).first(where: { $0.v == daily.verse }) else { throw PlanError.missingVerse }
        let parts = Calendar(identifier:.gregorian).dateComponents([.year,.month,.day],from:now)
        return DailyVerseAlert(year:parts.year!,month:parts.month!,day:parts.day!,hour:preference.hour,minute:preference.minute,reference:library.name(daily.passage,verse:true),text:verse.t,passage:daily.passage,sound:preference.sound)
    }
    enum PlanError: Error { case invalidTime, missingVerse }
}

@MainActor protocol DailyNotificationClient {
    func permission() async -> NotificationPermission
    func requestPermission() async throws -> Bool
    func replace(with alerts:[DailyVerseAlert]) async throws
    func cancel() async
    func preview(_ alert:DailyVerseAlert) async throws
}

@MainActor final class DailyNotificationStore: ObservableObject {
    @Published private(set) var preference = DailyNotificationPreference()
    @Published private(set) var permission: NotificationPermission = .notDetermined
    @Published private(set) var busy = false
    @Published private(set) var scheduled = false
    @Published var error: String?
    @Published var message: String?
    private let client: DailyNotificationClient
    private let library: ContentLibrary
    private let file: URL
    private var writable = true
    var active: Bool { preference.enabled && permission.allowed && scheduled }

    init(library:ContentLibrary,client:DailyNotificationClient,directory:URL? = nil) {
        self.library = library; self.client = client
        let root = directory ?? FileManager.default.urls(for:.applicationSupportDirectory,in:.userDomainMask)[0].appendingPathComponent("Aperio")
        file = root.appendingPathComponent("daily-notifications.json")
        do {
            try FileManager.default.createDirectory(at:root,withIntermediateDirectories:true)
            if FileManager.default.fileExists(atPath:file.path) {
                preference = try JSONDecoder().decode(DailyNotificationPreference.self,from:Data(contentsOf:file))
                guard preference.valid else { throw DailyNotificationPlan.PlanError.invalidTime }
            }
        } catch {
            writable = false; preference = DailyNotificationPreference()
            self.error = "Your notification preferences couldn’t be opened. They have been kept intact."
        }
    }

    func refresh() async {
        guard !busy else { return }
        busy = true; defer { busy = false }
        permission = await client.permission()
        guard writable else { await client.cancel(); scheduled = false; return }
        if preference.enabled && permission.allowed { await apply(preference) }
        else {
            await client.cancel(); scheduled = false
            if preference.enabled { var next = preference; next.enabled = false; persist(next) }
        }
    }

    func setEnabled(_ enabled:Bool) async {
        guard !busy else { return }
        busy = true; error = nil; message = nil; defer { busy = false }
        guard writable else { error = "Your saved notification preferences need recovery before changes can be saved."; return }
        var next = preference; next.enabled = enabled
        if !enabled {
            await client.cancel(); scheduled = false; persist(next)
            message = "Daily verse notifications are off. Your email choices haven’t changed."
            return
        }
        permission = await client.permission()
        if permission == .notDetermined {
            do { _ = try await client.requestPermission(); permission = await client.permission() }
            catch { self.error = "We couldn’t ask for notification permission. Please try again."; return }
        }
        guard permission.allowed else {
            await client.cancel(); scheduled = false
            next.enabled = false; persist(next)
            message = "Notifications are turned off in iPhone Settings. Allow them there, then turn on your daily verse here."
            return
        }
        await apply(next)
    }

    func setTime(hour:Int,minute:Int) async {
        guard !busy,writable else { return }
        var next = preference; next.hour = hour; next.minute = minute
        guard next.valid else { error = "Choose a valid notification time."; return }
        busy = true; error = nil; message = nil; defer { busy = false }
        if next.enabled { await apply(next) } else { persist(next) }
    }

    func setSound(_ sound:Bool) async {
        guard !busy,writable else { return }
        busy = true; error = nil; message = nil; defer { busy = false }
        var next = preference; next.sound = sound
        if next.enabled { await apply(next) } else { persist(next) }
    }

    func sendPreview() async {
        guard !busy,active else { return }
        busy = true; error = nil; message = nil; defer { busy = false }
        guard (await client.permission()).allowed else { permission = .denied; scheduled = false; await client.cancel(); return }
        do {
            let alert = try DailyNotificationPlan.preview(library:library,preference:preference)
            try await client.preview(alert)
            message = "A preview will arrive in about 5 seconds. Tap it to open the verse."
        } catch { self.error = "We couldn’t schedule the preview. Please try again." }
    }

    private func apply(_ next:DailyNotificationPreference) async {
        do {
            let alerts = try DailyNotificationPlan.make(library:library,preference:next)
            try await client.replace(with:alerts)
            guard persist(next) else { await client.cancel(); scheduled = false; return }
            scheduled = true
        } catch {
            await client.cancel(); scheduled = false
            var off = next; off.enabled = false; persist(off)
            self.error = "Daily verses couldn’t be scheduled. Please turn them on again to retry."
        }
    }

    @discardableResult private func persist(_ value:DailyNotificationPreference) -> Bool {
        do {
            try JSONEncoder().encode(value).write(to:file,options:[.atomic,.completeFileProtectionUntilFirstUserAuthentication])
            preference = value; return true
        } catch {
            writable = false; preference.enabled = false
            self.error = "We couldn’t save your notification preference. Please check available storage before trying again."
            return false
        }
    }
}
