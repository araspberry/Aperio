import SwiftUI

struct StudyCenter: View {
    let library: ContentLibrary
    @EnvironmentObject var navigation: NavigationState
    @State private var tab = "Commentary"
    @State private var perspective = "devotional"
    @State private var commentary: Commentary?
    @State private var introduction: BookIntroduction?
    @State private var words = [String:[StudyWord]]()
    @State private var references = [CrossReference]()
    @State private var selected: StudyWord?
    @State private var lexemes = [String:Lexeme]()
    @State private var occurrences = [[Int]]()
    @State private var error: String?
    private let tabs = ["Commentary","Verses","Lexicon","Cross refs","Timeline"]
    private var passage: Passage { navigation.passage }
    var body: some View {
        VStack(spacing:0) {
            HStack {
                VStack(alignment:.leading,spacing:5) { Eyebrow(text:"Study Center",light:true); Text(library.name(passage)).font(.caption).foregroundStyle(Theme.paper.opacity(0.7)) }
                Spacer()
                Button { navigation.study = false } label:{ Image(systemName:"xmark").frame(width:44,height:44) }.accessibilityLabel("Close Study Center")
            }.padding(.horizontal,20).padding(.top,15)
            ScrollView(.horizontal,showsIndicators:false) { HStack(spacing:20) { ForEach(tabs,id:\.self) { name in
                Button { tab = name; selected = nil } label:{ Text(name).font(.subheadline.weight(.semibold)).padding(.vertical,14).foregroundStyle(tab == name ? Theme.sage : Theme.paper.opacity(0.6)).overlay(alignment:.bottom) { if tab == name { Theme.sage.frame(height:2) } } }.accessibilityIdentifier("study.\(name)")
            } }.padding(.horizontal,20) }
            Divider().overlay(.white.opacity(0.12))
            ScrollView {
                VStack(alignment:.leading,spacing:22) {
                    switch tab {
                    case "Commentary": commentaryBody
                    case "Verses": versesBody
                    case "Lexicon": lexiconBody
                    case "Cross refs": crossReferences
                    default: timelineBody
                    }
                }.padding(22).frame(maxWidth:.infinity,alignment:.leading)
            }
        }.foregroundStyle(Theme.paper).background(Theme.graphite).clipShape(UnevenRoundedRectangle(topLeadingRadius:24,bottomLeadingRadius:0,bottomTrailingRadius:0,topTrailingRadius:24))
            .overlay(alignment:.top) { Capsule().fill(Theme.sage.opacity(0.6)).frame(width:34,height:3).padding(.top,7) }
            .onAppear(perform:load).onChange(of:passage) { _,_ in load() }
    }
    func load() {
        selected = nil; error = nil
        do { commentary = try library.commentary(passage) } catch { commentary = nil; self.error = "Commentary couldn’t be opened for this chapter." }
        introduction = try? library.introduction(passage.book)
        words = (try? library.words(passage)) ?? [:]
        references = (try? library.references(passage)) ?? []
    }
    @ViewBuilder var commentaryBody: some View {
        HStack(spacing:5) { ForEach(["devotional","scholarly","prophetic"],id:\.self) { mode in
            Button { perspective = mode } label:{ Text(mode.capitalized).font(.caption.weight(.semibold)).minimumScaleFactor(0.7).lineLimit(1).frame(maxWidth:.infinity).padding(.vertical,13).background(perspective == mode ? Theme.sage : .white.opacity(0.07),in:Capsule()).foregroundStyle(perspective == mode ? Theme.graphite : Theme.paper) }
        } }
        if let mode = commentary?.modes[perspective] {
            Text(mode.title).font(Theme.serif(29)).tracking(-0.5)
            ForEach(mode.overview,id:\.self) { ReadingText(text:$0,size:19) }
            ForEach(mode.sections.indices,id:\.self) { index in
                let section = mode.sections[index]
                if let start = section.start, let end = section.end { Eyebrow(text:start == end ? "Verse \(start)" : "Verses \(start)–\(end)",light:true).padding(.top,8) }
                Text(section.title).font(Theme.serif(25))
                ForEach(section.paragraphs,id:\.self) { ReadingText(text:$0,size:19) }
            }
            if let commentary {
                DisclosureGroup("Sources & editorial information") {
                    VStack(alignment:.leading,spacing:14) {
                        Text("\(commentary.status). Saved commentary; no AI is called while you read.").font(.caption).foregroundStyle(Theme.paper.opacity(0.65))
                        ForEach(commentary.sources) { source in if let url = URL(string:source.url) { Link(source.label,destination:url).font(.caption).foregroundStyle(Theme.sage) } }
                    }.padding(.top,12)
                }.tint(Theme.sage).font(.subheadline)
            }
        } else { Text(error ?? "Commentary isn’t available for this chapter.") }
    }
    @ViewBuilder var versesBody: some View {
        Text("A closer reading").font(Theme.serif(29))
        ForEach(library.verses(passage)) { verse in
            VStack(alignment:.leading,spacing:12) {
                Eyebrow(text:"Verse \(verse.v)",light:true)
                ReadingText(text:verse.t,size:20)
                if let sections = commentary?.modes[perspective]?.sections, let section = sections.first(where: { verse.v >= ($0.start ?? 0) && verse.v <= ($0.end ?? 0) }) {
                    Text(section.title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.sage)
                    Text("Passage commentary · verses \(section.start ?? verse.v)–\(section.end ?? verse.v)").font(.caption).foregroundStyle(Theme.paper.opacity(0.55))
                    ForEach(section.paragraphs,id:\.self) { ReadingText(text:$0,size:17) }
                }
                Button("Explore the original words") { navigation.selectedVerse = verse.v; selected = nil; tab = "Lexicon" }.font(.caption.weight(.semibold)).foregroundStyle(Theme.sage).padding(.vertical,10)
                Divider().overlay(.white.opacity(0.12))
            }
        }
    }
    @ViewBuilder var lexiconBody: some View {
        if let selected {
            Button { self.selected = nil } label:{ Label("Back to Lexicon",systemImage:"arrow.left") }.font(.subheadline).foregroundStyle(Theme.sage)
            Text(selected.o).font(.system(size:39,design:.serif)).frame(maxWidth:.infinity,alignment:.leading)
            Text(selected.tr).font(.title3).foregroundStyle(Theme.sage)
            ReadingText(text:selected.g,size:24)
            Text(selected.lang + " · " + selected.grammar).font(.subheadline).lineSpacing(4).foregroundStyle(Theme.paper.opacity(0.65))
            ForEach(selected.ids,id:\.self) { id in
                if let entry = lexemes[id] {
                    Eyebrow(text:id,light:true)
                    ReadingText(text:entry.strongs_def ?? entry.kjv_def ?? "No definition recorded.")
                }
            }
            Text("Other passages with this word").font(Theme.serif(23))
            Text("A shared original-language word doesn’t always carry the same meaning. Read each passage in context.").font(.caption).foregroundStyle(Theme.paper.opacity(0.65))
            ForEach(Array(occurrences.prefix(20).enumerated()),id:\.offset) { _,row in
                if row.count >= 3 {
                    let p = Passage(book:row[0],chapter:row[1],verse:row[2])
                    if library.valid(p) { Button(library.name(p,verse:true)) { navigation.read(p) }.foregroundStyle(Theme.sage).padding(.vertical,6) }
                }
            }
        } else {
            Text("The words behind the Word.").font(Theme.serif(29))
            Text("Choose a phrase to explore the Hebrew or Greek, its grammar, and its meaning.").font(.subheadline).lineSpacing(4).foregroundStyle(Theme.paper.opacity(0.7))
            HStack { Text("Verse"); Spacer(); Picker("Verse",selection:Binding(get:{navigation.selectedVerse ?? passage.verse},set:{navigation.selectedVerse = $0})) { ForEach(library.verses(passage)) { verse in Text("\(verse.v)").tag(verse.v) } }.tint(Theme.sage) }
            let verse = navigation.selectedVerse ?? passage.verse
            ForEach(words[String(verse)] ?? []) { word in
                Button { selected = word; lexemes = (try? library.lexemes(word.lang)) ?? [:]; occurrences = word.ids.first.flatMap { try? library.occurrences($0) } ?? [] } label:{
                    HStack(alignment:.top) { VStack(alignment:.leading,spacing:8) { Text(word.g).font(Theme.serif(22)); Text(word.tr).font(.caption).foregroundStyle(Theme.sage) }; Spacer(); Text(word.o).font(.system(size:23,design:.serif)).foregroundStyle(Theme.sage) }.padding(17).frame(maxWidth:.infinity,alignment:.leading).background(.white.opacity(0.055),in:RoundedRectangle(cornerRadius:12))
                }.buttonStyle(.plain)
            }
            if (words[String(verse)] ?? []).isEmpty { Text("No aligned original-language phrases are available for this verse.").font(.subheadline) }
        }
    }
    @ViewBuilder var crossReferences: some View {
        Text("Scripture in conversation.").font(Theme.serif(29))
        if references.isEmpty { Text("No passage cross-references are recorded here yet. The Lexicon offers separate word-occurrence links.").font(.subheadline).lineSpacing(5) }
        ForEach(references) { reference in
            Button { if let p = library.passage(book:reference.book,chapter:reference.chapter,verse:reference.start) { navigation.read(p) } } label:{
                VStack(alignment:.leading,spacing:10) {
                    Text(reference.label).font(Theme.serif(24)).foregroundStyle(Theme.sage)
                    Text("From verse \(reference.sourceVerse)").font(.caption).foregroundStyle(Theme.paper.opacity(0.6))
                    if let p = library.passage(book:reference.book,chapter:reference.chapter,verse:reference.start), let verse = library.verses(p).first(where: { $0.v == reference.start }) { Text(verse.t).font(Theme.serif(18)).lineSpacing(5) }
                }.padding(18).frame(maxWidth:.infinity,alignment:.leading).background(.white.opacity(0.05),in:RoundedRectangle(cornerRadius:12))
            }.buttonStyle(.plain)
        }
    }
    @ViewBuilder var timelineBody: some View {
        Text("Where are we in the story?").font(Theme.serif(29))
        if let intro = introduction {
            Text(intro.timeline.context).font(.subheadline).lineSpacing(5)
            ForEach(intro.chapterPeriods.indices,id:\.self) { index in
                let period = intro.chapterPeriods[index]
                let active = passage.chapter >= period.start && passage.chapter <= period.end
                HStack(alignment:.top,spacing:16) {
                    VStack { Circle().fill(active ? Theme.sage : .white.opacity(0.25)).frame(width:12,height:12); Rectangle().fill(Theme.sage.opacity(0.25)).frame(width:1) }
                    VStack(alignment:.leading,spacing:10) {
                        if active { Eyebrow(text:"You are here",light:true) }
                        Text(period.label).font(Theme.serif(24))
                        Text(period.dateLabel).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.sage)
                        Text(period.note).font(.subheadline).lineSpacing(4).foregroundStyle(Theme.paper.opacity(0.7))
                        Text("Chapters \(period.start)–\(period.end)").font(.caption)
                    }.padding(.bottom,24)
                }
            }
            Text(intro.timeline.note).font(.caption).foregroundStyle(Theme.paper.opacity(0.65))
        }
    }
}
