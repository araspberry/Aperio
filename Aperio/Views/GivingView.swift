import SwiftUI
import StoreKit

@MainActor final class GivingAvailability: ObservableObject {
    @Published private(set) var available = false
    func refresh() async {
        #if DEBUG
        if ProcessInfo.processInfo.environment["APERIO_UI_TEST"] == "1",let country = ProcessInfo.processInfo.environment["APERIO_TEST_STOREFRONT"] {
            available = country == "USA"; return
        }
        #endif
        available = await Storefront.current?.countryCode == "USA"
    }
    func observe() async {
        await refresh()
        for await _ in Storefront.updates {
            guard !Task.isCancelled else { return }
            await refresh()
        }
    }
}

struct GivingView: View {
    @ObservedObject var availability: GivingAvailability
    @Environment(\.openURL) private var openURL
    @State private var opening = false
    @State private var error: String?
    @State private var frequency: GivingSelection.Frequency = .once
    @State private var amountChoice = "25"
    @State private var customAmount = ""
    @State private var attemptID = UUID()
    @FocusState private var editingAmount: Bool
    private var selection: GivingSelection? { GivingSelection(dollars:amountChoice == "Other" ? customAmount : amountChoice,frequency:frequency,attemptID:attemptID) }
    var body: some View {
        ScrollView {
            VStack(alignment:.leading,spacing:25) {
                Image(systemName:"heart.fill").font(.system(size:30,weight:.light)).foregroundStyle(Theme.olive)
                    .frame(width:66,height:66).background(Theme.sage.opacity(0.3),in:Circle())
                Eyebrow(text:"Grow together")
                Text("Help Aperio\nkeep growing.").font(Theme.serif(37)).tracking(-1)
                Text("Your support helps us build thoughtful study tools and a richer experience in Scripture.").font(.title3).lineSpacing(5).foregroundStyle(Theme.muted)
                VStack(alignment:.leading,spacing:16) {
                    Text("Choose how you’ll give.").font(Theme.serif(29))
                    Picker("Giving frequency",selection:$frequency) {
                        Text("One time").tag(GivingSelection.Frequency.once)
                        Text("Monthly").tag(GivingSelection.Frequency.monthly)
                    }.pickerStyle(.segmented).accessibilityIdentifier("giving.frequency")
                    Text(frequency == .monthly ? "The same amount each month, until you cancel." : "A single gift to help Aperio grow.").font(.footnote).foregroundStyle(Theme.muted)
                    Text("Choose your amount").font(.subheadline.weight(.semibold)).padding(.top,8)
                    LazyVGrid(columns:Array(repeating:GridItem(.flexible(),spacing:10),count:3),spacing:10) {
                        ForEach(["5","10","25","50","100","Other"],id:\.self) { value in
                            Button { amountChoice = value; editingAmount = value == "Other" } label: {
                                Text(value == "Other" ? value : "$"+value).font(.headline).frame(maxWidth:.infinity).padding(.vertical,17)
                                    .foregroundStyle(Theme.olive).background(amountChoice == value ? Theme.sage.opacity(0.4) : Theme.paper,in:RoundedRectangle(cornerRadius:10))
                                    .overlay { RoundedRectangle(cornerRadius:10).strokeBorder(amountChoice == value ? Theme.olive : Theme.line,lineWidth:amountChoice == value ? 2 : 1) }
                            }.buttonStyle(.plain).accessibilityIdentifier("giving.amount."+value)
                                .accessibilityAddTraits(amountChoice == value ? .isSelected : [])
                        }
                    }
                    if amountChoice == "Other" {
                        HStack {
                            Text("$").foregroundStyle(Theme.muted)
                            TextField("Amount in USD",text:$customAmount).keyboardType(.decimalPad).focused($editingAmount).accessibilityIdentifier("giving.custom")
                            if editingAmount { Button("Done") { editingAmount = false }.font(.subheadline) }
                        }.padding(15).background(Theme.paper,in:RoundedRectangle(cornerRadius:10))
                        Text("$1–$10,000 USD").font(.caption).foregroundStyle(Theme.muted)
                    }
                    Divider().padding(.vertical,8)
                    HStack(alignment:.center) {
                        VStack(alignment:.leading,spacing:6) {
                            Text("Your support").font(.subheadline).foregroundStyle(Theme.muted)
                            Text(frequency == .monthly ? "Every month · USD" : "One time · USD").font(.subheadline)
                        }
                        Spacer()
                        Text(selection?.formattedAmount ?? "—").font(Theme.serif(30)).foregroundStyle(Theme.olive).accessibilityIdentifier("giving.summary")
                    }
                    Button {
                        editingAmount = false
                        if let selection { launch(selection.checkoutURL) }
                    } label: {
                        HStack { Text(opening ? "Opening…" : "Continue to payment"); Spacer(); Image(systemName:"arrow.up.right") }
                    }.buttonStyle(AperioButton()).disabled(opening || !availability.available || selection == nil).accessibilityIdentifier("giving.continue")
                    Text("Your chosen amount and frequency carry into Aperio’s secure website checkout in your browser. Review your gift before paying with Stripe.").font(.footnote).lineSpacing(3).foregroundStyle(Theme.muted)
                    Text("Giving is optional and does not unlock or change any app features.").font(.footnote).foregroundStyle(Theme.muted)
                }.padding(23).background(.white,in:RoundedRectangle(cornerRadius:20))
                Text("Support goes to Aperio’s development and operation. It is not presented as a tax-deductible charitable donation.").font(.footnote).lineSpacing(4).foregroundStyle(Theme.muted)
                Button("Manage monthly giving") { launch(URL(string:"https://billing.stripe.com/p/login/aFa3co4rm6em0fmfwe2B200")!) }.font(.subheadline.weight(.semibold)).disabled(opening || !availability.available)
                if let error { Text(error).font(.subheadline).foregroundStyle(Color(hex:0x9B3434)) }
            }.padding(25).padding(.bottom,100)
        }.task { await availability.refresh() }
            .onChange(of:frequency) { _,_ in attemptID = UUID() }
            .onChange(of:amountChoice) { _,_ in attemptID = UUID() }
            .onChange(of:customAmount) { _,_ in attemptID = UUID() }
    }
    private func launch(_ url:URL) {
        opening = true; error = nil
        Task {
            // Recheck at the point of use; storefronts can change while the app is open.
            await availability.refresh()
            guard availability.available else { opening = false; error = "Giving is currently available through the US App Store storefront."; return }
            openURL(url) { accepted in
                opening = false
                if !accepted { error = "We couldn’t open your browser. Please try again." }
            }
        }
    }
}
