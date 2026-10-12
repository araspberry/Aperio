import SwiftUI

struct VerseSubscriptionView: View {
    @ObservedObject var store: VerseSubscriptionStore
    @ObservedObject var notifications: DailyNotificationStore
    @State private var delivery = "phone"
    @EnvironmentObject private var personal: PersonalStore
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var name = ""
    @State private var consent = false
    @State private var preference: VerseEmailPreference = .verseOnly
    @State private var confirmRemoval = false
    private var saved: Bool { store.receipt != nil && store.receipt?.status != "draft" }
    var body: some View {
        NavigationStack {
            VStack(spacing:0) {
                Picker("Delivery",selection:$delivery) {
                    Text("On my phone").tag("phone")
                    Text("By email").tag("email")
                }.pickerStyle(.segmented).padding(.horizontal,24).padding(.vertical,14).accessibilityIdentifier("subscribe.delivery")
                if delivery == "phone" { DailyNotificationPreferencesView(store:notifications) }
                else { emailContent }
            }.background(Theme.paper).navigationTitle("Verse of the Day").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement:.confirmationAction) { Button("Done") { dismiss() } } }
                .confirmationDialog("Remove your Verse of the Day signup?",isPresented:$confirmRemoval,titleVisibility:.visible) {
                    Button("Remove signup",role:.destructive) { Task { await store.cancel() } }
                }
        }.tint(Theme.olive).onAppear { email = store.receipt?.email ?? ""; name = store.receipt?.name ?? personal.data.name; preference = store.receipt?.preference ?? .verseOnly }
    }
    private var emailContent: some View {
            ScrollView {
                VStack(alignment:.leading,spacing:23) {
                    Image(systemName:"envelope.open").font(.system(size:30,weight:.light)).foregroundStyle(Theme.olive)
                        .frame(width:64,height:64).background(Theme.sage.opacity(0.3),in:RoundedRectangle(cornerRadius:20))
                    Eyebrow(text:"A daily invitation")
                    Text("A little Word.\nA little room to breathe.").font(Theme.serif(32)).tracking(-0.7)
                    Text("Choose what you’d like in your inbox. Keep it to daily Scripture, or stay in the loop with Aperio too.").font(.subheadline).lineSpacing(5).foregroundStyle(Theme.muted)
                    if saved {
                        Label(store.receipt?.status == "active" ? "You’re subscribed" : "Your request is saved",systemImage:"checkmark.circle.fill").font(.headline).foregroundStyle(Theme.olive)
                        Text(store.receipt?.email ?? "").font(.subheadline).textSelection(.enabled)
                        Text((store.receipt?.preference ?? .verseOnly).title).font(.subheadline.weight(.semibold))
                        Text(store.message ?? "Email delivery is being prepared. We’ll send a confirmation before daily emails begin.").font(.subheadline).lineSpacing(4).foregroundStyle(Theme.muted)
                        Button("Remove my signup request",role:.destructive) { confirmRemoval = true }.disabled(store.busy)
                    } else {
                        VStack(alignment:.leading,spacing:10) {
                            Text("What would you like to receive?").font(.headline)
                            ForEach(VerseEmailPreference.allCases,id:\.self) { option in
                                Button { preference = option; consent = false } label: {
                                    HStack(alignment:.top,spacing:12) {
                                        Image(systemName:preference == option ? "checkmark.circle.fill" : "circle").foregroundStyle(Theme.olive)
                                        VStack(alignment:.leading,spacing:5) {
                                            Text(option.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                                            Text(option.detail).font(.footnote).foregroundStyle(Theme.muted)
                                        }
                                        Spacer(minLength:0)
                                    }.padding(16).frame(maxWidth:.infinity,alignment:.leading)
                                        .background(preference == option ? Theme.sage.opacity(0.32) : .white,in:RoundedRectangle(cornerRadius:13))
                                        .overlay { RoundedRectangle(cornerRadius:13).strokeBorder(preference == option ? Theme.olive : Theme.line,lineWidth:1) }
                                }.buttonStyle(.plain).accessibilityAddTraits(preference == option ? .isSelected : [])
                                    .accessibilityIdentifier("subscribe."+option.rawValue)
                            }
                        }
                        VStack(alignment:.leading,spacing:8) {
                            Text("First name (optional)").font(.subheadline.weight(.semibold))
                            TextField("Your first name",text:$name).textContentType(.givenName).accessibilityIdentifier("subscribe.name").padding(15).background(.white,in:RoundedRectangle(cornerRadius:12))
                            Text("Email address").font(.subheadline.weight(.semibold)).padding(.top,10)
                            TextField("you@example.com",text:$email).keyboardType(.emailAddress).textContentType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled().accessibilityIdentifier("subscribe.email").padding(15).background(.white,in:RoundedRectangle(cornerRadius:12))
                        }
                        Text("Email delivery is being prepared. Join the list now; we’ll ask you to confirm your email before daily verses begin.").font(.footnote).lineSpacing(4).foregroundStyle(Theme.muted)
                        Toggle(isOn:$consent) {
                            Text(preference == .verseOnly ? "I’m 13 or older and agree to receive only Verse of the Day emails. I can unsubscribe anytime." : "I’m 13 or older and agree to receive Verse of the Day, product updates, and occasional Aperio news. I can unsubscribe anytime.").font(.footnote).lineSpacing(3)
                        }.accessibilityIdentifier("subscribe.consent")
                        Button { Task { await store.subscribe(email:email,name:name,consent:consent,preference:preference) } } label: {
                            HStack { if store.busy { ProgressView().tint(Theme.paper) }; Text(store.busy ? "Saving…" : "Subscribe") }.frame(maxWidth:.infinity)
                        }.buttonStyle(AperioButton()).disabled(store.busy || !consent || !VerseEmail.isValid(email)).accessibilityIdentifier("subscribe.submit")
                        if store.receipt != nil { Button("Remove pending request",role:.destructive) { confirmRemoval = true }.disabled(store.busy) }
                    }
                    if let error = store.error { Text(error).font(.subheadline).foregroundStyle(Color(hex:0x9B3434)).accessibilityIdentifier("subscribe.error") }
                    if !saved,let message = store.message { Text(message).font(.subheadline).foregroundStyle(Theme.olive) }
                    Divider()
                    Text("This optional signup saves your email, any name you provide, your email choices, and your consent with Aperio. It does not create a reading account or upload your prayers, notes, or highlights.").font(.footnote).lineSpacing(4).foregroundStyle(Theme.muted)
                    Link("Privacy policy",destination:URL(string:"https://aperiobible.com/#privacy")!).font(.footnote.weight(.semibold))
                }.padding(26).padding(.bottom,24)
            }.background(Theme.paper)
    }
}
