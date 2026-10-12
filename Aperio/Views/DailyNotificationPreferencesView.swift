import SwiftUI

struct DailyNotificationPreferencesView: View {
    @ObservedObject var store: DailyNotificationStore
    @Environment(\.openURL) private var openURL
    private var selectedTime: Date {
        Calendar.current.date(bySettingHour:store.preference.hour,minute:store.preference.minute,second:0,of:Date()) ?? Date()
    }
    var body: some View {
        ScrollView {
            VStack(alignment:.leading,spacing:24) {
                Image(systemName:"bell.badge").font(.system(size:30,weight:.light)).foregroundStyle(Theme.olive)
                    .frame(width:64,height:64).background(Theme.sage.opacity(0.3),in:RoundedRectangle(cornerRadius:20))
                Eyebrow(text:"A moment, just for the Word")
                Text("Let Scripture\nmeet you here.").font(Theme.serif(32)).tracking(-0.7)
                Text("A daily verse on your phone. Tap the notification to read the passage in Aperio—no email signup needed.").font(.subheadline).lineSpacing(5).foregroundStyle(Theme.muted)
                VStack(alignment:.leading,spacing:18) {
                    Toggle("Daily verse notification",isOn:Binding(get:{store.preference.enabled},set:{value in Task { await store.setEnabled(value) } }))
                        .font(.headline).accessibilityIdentifier("notifications.enabled")
                    Divider()
                    DatePicker("Your daily time",selection:Binding(get:{selectedTime},set:{date in
                        let components = Calendar.current.dateComponents([.hour,.minute],from:date)
                        Task { await store.setTime(hour:components.hour ?? 8,minute:components.minute ?? 0) }
                    }),displayedComponents:.hourAndMinute).accessibilityIdentifier("notifications.time")
                    Text("Uses the local time on this device.").font(.footnote).foregroundStyle(Theme.muted)
                    Toggle("Notification sound",isOn:Binding(get:{store.preference.sound},set:{value in Task { await store.setSound(value) } })).accessibilityIdentifier("notifications.sound")
                }.padding(20).background(.white,in:RoundedRectangle(cornerRadius:18)).overlay { RoundedRectangle(cornerRadius:18).strokeBorder(Theme.line) }.disabled(store.busy)
                if store.permission == .denied {
                    Text("Notifications are disabled in iPhone Settings. You can allow them there, then return to turn on your daily verse.").font(.subheadline).foregroundStyle(Theme.muted)
                    Button("Open notification settings") { openURL(URL(string:UIApplication.openNotificationSettingsURLString)!) }.buttonStyle(AperioButton()).accessibilityIdentifier("notifications.settings")
                } else if store.active {
                    Label("Your daily verse is on",systemImage:"checkmark.circle.fill").font(.subheadline.weight(.semibold)).foregroundStyle(Theme.olive).accessibilityIdentifier("notifications.active")
                    Button("Send me a preview") { Task { await store.sendPreview() } }.buttonStyle(AperioButton()).disabled(store.busy).accessibilityIdentifier("notifications.preview")
                }
                if let error = store.error { Text(error).font(.subheadline).foregroundStyle(Color(hex:0x9B3434)).accessibilityIdentifier("notifications.error") }
                if let message = store.message { Text(message).font(.subheadline).foregroundStyle(Theme.olive).accessibilityIdentifier("notifications.message") }
                Divider()
                Text("You’re in control. Turn this off anytime. Focus, Silent Mode, and your iPhone’s notification settings may quiet or delay an alert.").font(.footnote).lineSpacing(4).foregroundStyle(Theme.muted)
                Text("Daily verses are prepared on this device for the next 60 days and refreshed whenever you open Aperio. Open the app from time to time to keep them coming. Your notification time stays here; it isn’t added to your email subscription.").font(.footnote).lineSpacing(4).foregroundStyle(Theme.muted)
            }.padding(26).padding(.bottom,24)
        }.background(Theme.paper).tint(Theme.olive).task { await store.refresh() }
    }
}
