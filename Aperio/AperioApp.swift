import SwiftUI

@main struct AperioApp: App {
    @UIApplicationDelegateAdaptor(AperioNotificationDelegate.self) private var notificationDelegate
    @StateObject private var personal: PersonalStore
    init() {
        #if DEBUG
        let testDirectory = ProcessInfo.processInfo.environment["APERIO_UI_TEST"] == "1" ? FileManager.default.temporaryDirectory.appendingPathComponent("AperioUITest") : nil
        if let testDirectory, ProcessInfo.processInfo.environment["APERIO_UI_TEST_RESET"] == "1" { try? FileManager.default.removeItem(at:testDirectory) }
        _personal = StateObject(wrappedValue: PersonalStore(directory:testDirectory))
        #else
        _personal = StateObject(wrappedValue: PersonalStore())
        #endif
    }
    private let library: Result<ContentLibrary,Error> = Result { try ContentLibrary() }
    var body: some Scene {
        WindowGroup {
            switch library {
            case .success(let content): AppShell(library:content).environmentObject(personal).preferredColorScheme(.light)
            case .failure: ContentUnavailableView("Aperio couldn’t open",systemImage:"book.closed",description:Text("The Scripture library could not be loaded. Please reinstall the app after backing up your personal data."))
            }
        }
    }
}
@MainActor final class NavigationState: ObservableObject {
    @Published var tab = 0
    @Published var passage = Passage(book:18,chapter:23)
    @Published var study = false
    @Published var selectedVerse: Int?
    func read(_ passage: Passage) { self.passage = passage; selectedVerse = nil; study = false; tab = 1 }
}
struct AppShell: View {
    let library: ContentLibrary
    @EnvironmentObject var personal: PersonalStore
    @StateObject private var navigation = NavigationState()
    @State private var search = false
    @State private var settings = false
    @State private var subscribe = false
    @StateObject private var newsletter: VerseSubscriptionStore
    @StateObject private var notifications: DailyNotificationStore
    @StateObject private var notificationRouter = DailyNotificationRouter.shared
    @State private var navigationReady = false
    @StateObject private var giving = GivingAvailability()
    @Environment(\.scenePhase) private var scenePhase
    @State private var menuOpen = false
    @State private var givingVisit = UUID()
    init(library:ContentLibrary) {
        self.library = library
        #if DEBUG
        let directory = ProcessInfo.processInfo.environment["APERIO_UI_TEST"] == "1" ? FileManager.default.temporaryDirectory.appendingPathComponent("AperioUITest") : nil
        _newsletter = StateObject(wrappedValue:VerseSubscriptionStore(directory:directory))
        _notifications = StateObject(wrappedValue:DailyNotificationStore(library:library,client:IPhoneDailyNotificationClient(),directory:directory))
        #else
        _newsletter = StateObject(wrappedValue:VerseSubscriptionStore())
        _notifications = StateObject(wrappedValue:DailyNotificationStore(library:library,client:IPhoneDailyNotificationClient()))
        #endif
    }
    var body: some View {
        VStack(spacing:0) {
            HStack {
                Button { navigation.tab = 0 } label: { AperioWordmark() }.buttonStyle(.plain).accessibilityLabel("Aperio Bible App, Home")
                Spacer()
                Button { search = true } label: { Image(systemName:"magnifyingglass").font(.title3).frame(width:44,height:44) }.accessibilityLabel("Search Scripture")
                Button { subscribe = true } label: { Image(systemName:"envelope").font(.title3).frame(width:44,height:44) }.accessibilityLabel("Verse of the Day options").accessibilityIdentifier("header.subscribe")
            }.foregroundStyle(Theme.paper).padding(.horizontal,22).padding(.bottom,10).background(Theme.graphite)
            ZStack {
                Theme.paper
                switch navigation.tab {
                case 0: HomeView(library:library)
                case 1: ReaderView(library:library)
                case 2: PrayerView()
                case 3: SavedView(library:library)
                case 5:
                    if giving.available { GivingView(availability:giving).id(givingVisit) }
                    else { HomeView(library:library) }
                default: AccountView()
                }
            }.frame(maxWidth:.infinity,maxHeight:.infinity)
        }.background(Theme.graphite.ignoresSafeArea(edges:.top)).background(Theme.paper.ignoresSafeArea(edges:.bottom)).foregroundStyle(Theme.ink).tint(Theme.olive)
            .overlay {
                if menuOpen { Color.black.opacity(0.22).ignoresSafeArea().onTapGesture { menuOpen = false }.accessibilityLabel("Dismiss menu").accessibilityAddTraits(.isButton) }
            }
            .overlay(alignment:.bottomTrailing) {
                GeometryReader { geometry in
                    FloatingNavigationMenu(open:$menuOpen,showGiving:giving.available,maximumHeight:max(100,geometry.size.height-90),onSearch:{ search = true },onSettings:{ settings = true }).environmentObject(navigation)
                        .padding(.trailing,20).padding(.bottom,12).frame(maxWidth:.infinity,maxHeight:.infinity,alignment:.bottomTrailing)
                }
            }
            .environmentObject(navigation)
            .task { await giving.observe() }
            .task { await notifications.refresh() }
            .onChange(of:scenePhase) { _,phase in if phase == .active { Task { await giving.refresh(); await notifications.refresh() } } }
            .onChange(of:menuOpen) { _,open in if open { Task { await giving.refresh() } } }
            .onChange(of:giving.available) { _,available in if !available,navigation.tab == 5 { navigation.tab = 0 } }
            .onAppear {
                if !navigationReady {
                    if library.valid(personal.data.passage) { navigation.passage = personal.data.passage }
                    navigationReady = true
                }
                openNotification()
            }
            .onChange(of:notificationRouter.destination?.id) { _,_ in openNotification() }
            .onChange(of:navigation.passage) { _,new in personal.update { $0.passage = new } }
            .sheet(isPresented:$search) { SearchView(library:library).environmentObject(navigation) }
            .sheet(isPresented:$settings) { SettingsView(notifications:notifications) }
            .sheet(isPresented:$subscribe) { VerseSubscriptionView(store:newsletter,notifications:notifications) }
            .alert("Couldn’t save",isPresented:Binding(get:{personal.error != nil},set:{if !$0 { personal.error = nil }})) { Button("OK",role:.cancel) {} } message:{ Text(personal.error ?? "") }
            .onOpenURL { url in
                if let destination = GivingAppReturn(url:url) {
                    // A return link is navigation only, never proof of payment.
                    // Stripe and the server remain the source of payment status.
                    search = false; settings = false; subscribe = false; menuOpen = false
                    givingVisit = UUID()
                    if destination == .reading { navigation.read(navigation.passage) }
                    else { Task { await giving.refresh(); if giving.available { navigation.tab = 5 } } }
                    return
                }
                let pieces = (url.fragment ?? url.path).split(separator:"/").map(String.init)
                if pieces.first == "home" { navigation.tab = 0 }
                else if pieces.count >= 2, let chapter = Int(pieces[1]), let p = library.passage(book:pieces[0].removingPercentEncoding ?? pieces[0],chapter:chapter,verse:pieces.count>2 ? Int(pieces[2]) ?? 1 : 1) { navigation.read(p) }
            }
    }
    private func openNotification() {
        guard navigationReady,let destination = notificationRouter.destination else { return }
        notificationRouter.destination = nil
        let passage = destination.passage
        guard library.verses(passage).contains(where: { $0.v == passage.verse }) else { return }
        search = false; settings = false; subscribe = false; menuOpen = false
        personal.update { $0.activeJourney = nil }
        navigation.read(passage)
    }
}
