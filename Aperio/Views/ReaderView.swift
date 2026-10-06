import SwiftUI

struct ReaderView: View {
    let library: ContentLibrary
    @EnvironmentObject var personal: PersonalStore
    @EnvironmentObject var navigation: NavigationState
    @State private var picker = false
    @State private var editPassage: Passage?
    @State private var focus = false
    private var passage: Passage { navigation.passage }
    private var journey: Journey? { library.home.journeys.first { $0.id == personal.data.activeJourney } }
    var body: some View {
        VStack(spacing:0) {
            HStack(spacing:12) {
                Button { picker = true } label: {
                    HStack(spacing:8) { Text(library.books[passage.book].name).lineLimit(1).minimumScaleFactor(0.7); Image(systemName:"chevron.down").font(.caption) }.frame(maxWidth:.infinity).frame(height:45)
                }.accessibilityIdentifier("reader.bookPicker")
                Button { picker = true } label: {
                    HStack(spacing:8) { Text(passage.chapter == 0 ? "Introduction" : "Chapter \(passage.chapter)").lineLimit(1).minimumScaleFactor(0.7); Image(systemName:"chevron.down").font(.caption) }.frame(maxWidth:.infinity).frame(height:45)
                }
            }.font(.subheadline.weight(.semibold)).buttonStyle(PickerButton()).padding(.horizontal,20).padding(.vertical,14)
            ZStack(alignment:.bottomTrailing) {
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment:.leading,spacing:22) {
                            if passage.chapter == 0 { introduction.id(0) }
                            else {
                                HStack { Eyebrow(text:"Berean Standard Bible"); Spacer(); Button { focus.toggle() } label:{ Image(systemName:focus ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right").frame(width:44,height:44) }.accessibilityLabel("Toggle focus") }
                                Text(library.books[passage.book].name).font(Theme.serif(39)).tracking(-1)
                                Text("Chapter \(passage.chapter)").font(.caption.weight(.semibold)).foregroundStyle(Theme.muted)
                                ForEach(library.verses(passage)) { verse in
                                    let p = Passage(book:passage.book,chapter:passage.chapter,verse:verse.v)
                                    let annotation = personal.annotation(p)
                                    Button {
                                        if navigation.study { navigation.selectedVerse = verse.v }
                                        else { editPassage = p }
                                    } label: {
                                        HStack(alignment:.firstTextBaseline,spacing:12) {
                                            Text("\(verse.v)").font(.caption).foregroundStyle(Theme.olive).frame(width:20,alignment:.trailing)
                                            Text(verse.t).font(Theme.serif(personal.data.fontSize)).lineSpacing(9).frame(maxWidth:.infinity,alignment:.leading)
                                            if !annotation.note.isEmpty { Image(systemName:"note.text").font(.caption).foregroundStyle(Theme.olive) }
                                        }.padding(.vertical,8).padding(.horizontal,6).background(highlight(annotation.color),in:RoundedRectangle(cornerRadius:8))
                                    }.buttonStyle(.plain).id(verse.v).accessibilityIdentifier("verse.\(verse.v)")
                                        .contextMenu {
                                            Button("Study verse",systemImage:"books.vertical") { navigation.selectedVerse = verse.v; navigation.study = true }
                                            Button("Highlight & note",systemImage:"highlighter") { editPassage = p }
                                            ShareLink(item:"\(verse.t)\n\(library.name(p,verse:true)) · BSB\nhttps://aperiobible.com/#\(library.books[p.book].name.addingPercentEncoding(withAllowedCharacters:.urlPathAllowed) ?? "")/\(p.chapter)/\(p.verse)")
                                        }
                                }
                                if let journey { journeyControl(journey) }
                                else {
                                    HStack {
                                        Button { previous() } label:{ Label("Previous",systemImage:"chevron.left") }.disabled(passage.chapter == 1 && passage.book == 0)
                                        Spacer()
                                        Button { next() } label:{ Label("Next",systemImage:"chevron.right") }.disabled(passage.book == 65 && passage.chapter == library.books[65].chapters.count)
                                    }.font(.subheadline.weight(.semibold)).padding(.top,28)
                                }
                                Text("Berean Standard Bible · Public domain").font(.caption2).foregroundStyle(Theme.muted).padding(.top,16)
                            }
                        }.padding(.horizontal,23).padding(.bottom,journey == nil ? 120 : 220)
                    }.onChange(of:passage) { _,new in proxy.scrollTo(new.chapter == 0 ? 0 : new.verse,anchor:.top) }.onAppear { proxy.scrollTo(passage.chapter == 0 ? 0 : passage.verse,anchor:.top) }
                }
                if passage.chapter > 0 && !focus && !navigation.study {
                    Button { navigation.study = true } label: {
                        HStack(spacing:12) {
                            ZStack {
                                Image(systemName:"book.pages.fill").font(.system(size:25,weight:.light)).foregroundStyle(Theme.sage)
                                Rectangle().fill(Color(hex:0xC94141)).frame(width:3,height:10).offset(x:6,y:15)
                            }.frame(width:32,height:38)
                            Text("Study Center").font(.subheadline.weight(.semibold)).foregroundStyle(Theme.paper)
                        }.padding(.horizontal,20).frame(height:58).background(Theme.graphite,in:Capsule())
                            .overlay { Capsule().strokeBorder(Theme.sage.opacity(0.65),lineWidth:1.5).padding(3) }
                            .shadow(color:.black.opacity(0.17),radius:12,y:5)
                    }.buttonStyle(.plain).frame(maxWidth:.infinity,alignment:.center).padding(.trailing,64).padding(.bottom,13)
                        .accessibilityLabel("Open Study Center").accessibilityIdentifier("reader.study")
                }
                if let journey, !navigation.study, passage.chapter > 0 {
                    journeyControl(journey).padding(14).background(Theme.graphite,in:RoundedRectangle(cornerRadius:16)).foregroundStyle(Theme.paper).padding(.horizontal,20).padding(.bottom,88)
                }
                if navigation.study { StudyCenter(library:library).transition(.move(edge:.trailing)).zIndex(2) }
            }
        }.animation(.easeInOut(duration:0.2),value:navigation.study)
            .sheet(isPresented:$picker) { PassagePicker(library:library).environmentObject(navigation) }
            .sheet(item:$editPassage) { p in AnnotationEditor(passage:p,library:library).environmentObject(navigation) }
    }
    @ViewBuilder private var introduction: some View {
        if let intro = try? library.introduction(passage.book) {
            Eyebrow(text:"An introduction to \(library.books[passage.book].name)")
            Text(intro.title).font(Theme.serif(36)).tracking(-0.8)
            Text(intro.subtitle).font(.title3).foregroundStyle(Theme.muted)
            VStack(alignment:.leading,spacing:10) { Eyebrow(text:"In the biblical story"); Text(intro.timeline.dateLabel).font(Theme.serif(22)); Text(intro.timeline.context).font(.subheadline); Text(intro.timeline.note).font(.caption).foregroundStyle(Theme.muted) }.padding(20).background(Theme.sage.opacity(0.25),in:RoundedRectangle(cornerRadius:16))
            ForEach(intro.sections.indices,id:\.self) { i in Text(intro.sections[i].title).font(Theme.serif(25)); ForEach(intro.sections[i].paragraphs,id:\.self) { ReadingText(text:$0) } }
            Text("The shape of the book").font(Theme.serif(26))
            ForEach(intro.outline.indices,id:\.self) { i in
                Button { navigation.read(Passage(book:passage.book,chapter:intro.outline[i].startChapter)) } label: { VStack(alignment:.leading,spacing:8) { Text(intro.outline[i].label).font(.headline); Text("Chapters \(intro.outline[i].startChapter)–\(intro.outline[i].endChapter)").font(.caption); Text(intro.outline[i].description).font(.subheadline).foregroundStyle(Theme.muted) }.frame(maxWidth:.infinity,alignment:.leading).padding(18).background(.white,in:RoundedRectangle(cornerRadius:12)) }.buttonStyle(.plain)
            }
            Button("Begin chapter one") { navigation.read(Passage(book:passage.book,chapter:1)) }.buttonStyle(AperioButton())
        } else { EmptyState(title:"Introduction unavailable",detail:"You can still begin reading this book.",icon:"book"); Button("Begin chapter one") { navigation.read(Passage(book:passage.book,chapter:1)) }.buttonStyle(AperioButton()) }
    }
    func journeyControl(_ journey:Journey) -> some View {
        let index = min(personal.data.journeyProgress[journey.id] ?? 0,journey.steps.count-1)
        return HStack(spacing:12) {
            VStack(alignment:.leading,spacing:3) { Text(journey.title).font(.caption.weight(.bold)).lineLimit(1); Text("Reading \(index+1) of \(journey.steps.count)").font(.caption2).opacity(0.75) }
            Spacer()
            Button(index+1 == journey.steps.count ? "Finish thread" : "Read & continue") {
                personal.update { $0.journeyProgress[journey.id] = index+1 }
                if index+1 < journey.steps.count { let step = journey.steps[index+1]; if let p = library.passage(book:step.book,chapter:step.chapter,verse:step.verse) { navigation.read(p) } }
                else { personal.update { $0.activeJourney = nil }; navigation.tab = 0 }
            }.font(.caption.weight(.bold)).padding(12).background(Theme.sage,in:RoundedRectangle(cornerRadius:10)).foregroundStyle(Theme.graphite)
            Button { personal.update { $0.activeJourney = nil } } label:{ Image(systemName:"xmark").frame(width:30,height:44) }.accessibilityLabel("Leave thread")
        }
    }
    func next() { if passage.chapter < library.books[passage.book].chapters.count { navigation.read(Passage(book:passage.book,chapter:passage.chapter+1)) } else if passage.book < 65 { navigation.read(Passage(book:passage.book+1,chapter:0)) } }
    func previous() { if passage.chapter > 1 { navigation.read(Passage(book:passage.book,chapter:passage.chapter-1)) } else if passage.book > 0 { navigation.read(Passage(book:passage.book-1,chapter:library.books[passage.book-1].chapters.count)) } }
}
func highlight(_ color: String?) -> Color {
    switch color { case "olive":Theme.sage.opacity(0.65); case "gold":Color(hex:0xF2DB91).opacity(0.55); case "rose":Color(hex:0xEABFBE).opacity(0.55); case "blue":Color(hex:0xB8D6E3).opacity(0.55); default:.clear }
}
struct PickerButton: ButtonStyle {
    func makeBody(configuration:Configuration)->some View { configuration.label.foregroundStyle(Theme.paper).background(Theme.graphite,in:RoundedRectangle(cornerRadius:10)).overlay { RoundedRectangle(cornerRadius:10).strokeBorder(Theme.olive,lineWidth:configuration.isPressed ? 2 : 0) } }
}
struct PassagePicker: View {
    let library: ContentLibrary
    @EnvironmentObject var navigation: NavigationState
    @EnvironmentObject var personal: PersonalStore
    @Environment(\.dismiss) var dismiss
    @State private var query = ""
    @State private var chosen: Int?
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment:.leading,spacing:20) {
                    if let chosen {
                        Text(library.books[chosen].name).font(Theme.serif(36))
                        Button("Introduction to \(library.books[chosen].name)") { open(chosen,0) }.buttonStyle(AperioButton())
                        LazyVGrid(columns:[GridItem(.adaptive(minimum:56))],spacing:12) {
                            ForEach(1...library.books[chosen].chapters.count,id:\.self) { ch in Button("\(ch)") { open(chosen,ch) }.font(.headline).frame(maxWidth:.infinity).frame(height:50).background(Theme.sage.opacity(0.32),in:RoundedRectangle(cornerRadius:10)) }
                        }
                    } else {
                        TextField("Find a book",text:$query).padding(14).background(.white,in:RoundedRectangle(cornerRadius:12)).autocorrectionDisabled()
                        ForEach([0,39],id:\.self) { start in
                            Eyebrow(text:start == 0 ? "Old Testament" : "New Testament")
                            ForEach(start..<(start == 0 ? 39 : 66),id:\.self) { b in
                                if query.isEmpty || library.books[b].name.localizedCaseInsensitiveContains(query) {
                                    Button { chosen = b } label:{ HStack { Text(library.books[b].name).font(Theme.serif(22)); Spacer(); Text("\(library.books[b].chapters.count)").font(.caption).foregroundStyle(Theme.muted); Image(systemName:"chevron.right").font(.caption) }.padding(.vertical,12).contentShape(Rectangle()) }.buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }.padding(24)
            }.background(Theme.paper).navigationTitle("Open Scripture").navigationBarTitleDisplayMode(.inline).toolbar {
                if chosen != nil { ToolbarItem(placement:.cancellationAction) { Button("Books") { chosen = nil } } }
                ToolbarItem(placement:.confirmationAction) { Button("Done") { dismiss() } }
            }
        }.tint(Theme.olive)
    }
    func open(_ book:Int,_ chapter:Int) { personal.update { $0.activeJourney = nil }; navigation.read(Passage(book:book,chapter:chapter)); dismiss() }
}
