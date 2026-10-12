import SwiftUI
import UserNotifications
import UIKit

@MainActor final class DailyNotificationRouter: ObservableObject {
    static let shared = DailyNotificationRouter()
    struct Destination: Identifiable { let id = UUID(); let passage: Passage }
    @Published var destination: Destination?
    func receive(_ payload:[AnyHashable:Any]) {
        guard let passage = DailyVerseAlert.passage(from:payload) else { return }
        destination = Destination(passage:passage)
    }
}

final class AperioNotificationDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application:UIApplication,didFinishLaunchingWithOptions launchOptions:[UIApplication.LaunchOptionsKey:Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }
    func userNotificationCenter(_ center:UNUserNotificationCenter,willPresent notification:UNNotification,withCompletionHandler completionHandler:@escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner,.list,.sound])
    }
    func userNotificationCenter(_ center:UNUserNotificationCenter,didReceive response:UNNotificationResponse,withCompletionHandler completionHandler:@escaping () -> Void) {
        guard response.actionIdentifier == UNNotificationDefaultActionIdentifier else { completionHandler(); return }
        Task { @MainActor in
            DailyNotificationRouter.shared.receive(response.notification.request.content.userInfo)
            completionHandler()
        }
    }
}

@MainActor final class IPhoneDailyNotificationClient: DailyNotificationClient {
    private let center = UNUserNotificationCenter.current()
    func permission() async -> NotificationPermission {
        switch await center.notificationSettings().authorizationStatus {
        case .authorized, .ephemeral: return .authorized
        case .provisional: return .provisional
        case .denied: return .denied
        default: return .notDetermined
        }
    }
    func requestPermission() async throws -> Bool { try await center.requestAuthorization(options:[.alert,.sound]) }
    func replace(with alerts:[DailyVerseAlert]) async throws {
        let ids = Set(alerts.map(\.id))
        let existing = await center.pendingNotificationRequests()
        let stale = existing.filter { $0.identifier.hasPrefix(DailyVerseAlert.prefix) && $0.identifier != DailyVerseAlert.prefix + "preview" && !ids.contains($0.identifier) }.map(\.identifier)
        center.removePendingNotificationRequests(withIdentifiers:stale)
        for alert in alerts {
            // Floating local wall-clock components follow the device time zone.
            var components = DateComponents()
            components.calendar = Calendar(identifier:.gregorian)
            components.year = alert.year; components.month = alert.month; components.day = alert.day
            components.hour = alert.hour; components.minute = alert.minute
            let trigger = UNCalendarNotificationTrigger(dateMatching:components,repeats:false)
            try await center.add(UNNotificationRequest(identifier:alert.id,content:content(alert),trigger:trigger))
        }
    }
    func cancel() async {
        let pending = await center.pendingNotificationRequests()
        center.removePendingNotificationRequests(withIdentifiers:pending.filter { $0.identifier.hasPrefix(DailyVerseAlert.prefix) }.map(\.identifier))
        let delivered = await center.deliveredNotifications()
        center.removeDeliveredNotifications(withIdentifiers:delivered.filter { $0.request.identifier.hasPrefix(DailyVerseAlert.prefix) }.map { $0.request.identifier })
    }
    func preview(_ alert:DailyVerseAlert) async throws {
        let request = UNNotificationRequest(identifier:DailyVerseAlert.prefix + "preview",content:content(alert),trigger:UNTimeIntervalNotificationTrigger(timeInterval:5,repeats:false))
        try await center.add(request)
    }
    private func content(_ alert:DailyVerseAlert) -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        content.title = "Verse of the Day"
        content.subtitle = alert.reference + " · BSB"
        content.body = alert.text
        content.userInfo = alert.payload
        content.threadIdentifier = "aperio.daily-verse"
        if alert.sound { content.sound = .default }
        return content
    }
}
