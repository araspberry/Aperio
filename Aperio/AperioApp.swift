import SwiftUI

@main struct AperioApp: App {
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
    var body: some View {
        VStack(spacing:0) {
            HStack {
                Button { navigation.tab = 0 } label: { (Text("aperio").foregroundStyle(Theme.paper) + Text(".").foregroundStyle(Theme.sage)).font(Theme.serif(35)).tracking(-2) }.accessibilityLabel("Aperio Home")
                Spacer()
                Button { search = true } label: { Image(systemName:"magnifyingglass").font(.title3).frame(width:44,height:44) }.accessibilityLabel("Search Scripture")
                Button { settings = true } label: { Image(systemName:"slider.horizontal.3").font(.title3).frame(width:44,height:44) }.accessibilityLabel("Reading settings")
            }.foregroundStyle(Theme.paper).padding(.horizontal,22).padding(.bottom,10).background(Theme.graphite)
            ZStack {
                Theme.paper
                switch navigation.tab {
                case 0: HomeView(library:library)
                case 1: ReaderView(library:library)
                case 2: PrayerView()
                case 3: SavedView(library:library)
                default: AccountView()
                }
            }.frame(maxWidth:.infinity,maxHeight:.infinity)
            HStack(spacing:0) {
                tab("Home","house",0); tab("Bible","book",1); tab("Prayer","hands.sparkles",2); tab("Saved","bookmark",3); tab("Account","person.crop.circle",4)
            }.padding(.horizontal,10).padding(.top,9).padding(.bottom,3).background(Theme.paper).overlay(alignment:.top) { Theme.line.frame(height:1) }
        }.background(Theme.graphite.ignoresSafeArea(edges:.top)).background(Theme.paper.ignoresSafeArea(edges:.bottom)).foregroundStyle(Theme.ink).tint(Theme.olive)
            .environmentObject(navigation)
            .onAppear { if library.valid(personal.data.passage) { navigation.passage = personal.data.passage } }
            .onChange(of:navigation.passage) { _,new in personal.update { $0.passage = new } }
            .sheet(isPresented:$search) { SearchView(library:library).environmentObject(navigation) }
            .sheet(isPresented:$settings) { SettingsView() }
            .alert("Couldn’t save",isPresented:Binding(get:{personal.error != nil},set:{if !$0 { personal.error = nil }})) { Button("OK",role:.cancel) {} } message:{ Text(personal.error ?? "") }
            .onOpenURL { url in
                let pieces = (url.fragment ?? url.path).split(separator:"/").map(String.init)
                if pieces.first == "home" { navigation.tab = 0 }
                else if pieces.count >= 2, let chapter = Int(pieces[1]), let p = library.passage(book:pieces[0].removingPercentEncoding ?? pieces[0],chapter:chapter,verse:pieces.count>2 ? Int(pieces[2]) ?? 1 : 1) { navigation.read(p) }
            }
    }
    func tab(_ label: String,_ icon: String,_ index: Int) -> some View {
        Button { navigation.tab = index; navigation.study = false } label: {
            VStack(spacing:5) { Image(systemName:navigation.tab == index && index != 2 ? icon + ".fill" : icon).font(.system(size:22)); Text(label).font(.caption2.weight(navigation.tab == index ? .bold : .regular)) }
                .foregroundStyle(navigation.tab == index ? Theme.olive : Theme.muted).frame(maxWidth:.infinity).frame(minHeight:52).background(navigation.tab == index ? Theme.sage.opacity(0.35) : .clear,in:RoundedRectangle(cornerRadius:15))
        }.accessibilityIdentifier("tab.\(label.lowercased())").accessibilityAddTraits(navigation.tab == index ? .isSelected : [])
    }
}
