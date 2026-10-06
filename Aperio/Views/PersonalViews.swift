import SwiftUI
import UniformTypeIdentifiers

struct AnnotationEditor: View {
    let passage: Passage; let library: ContentLibrary
    @EnvironmentObject var personal: PersonalStore
    @EnvironmentObject var navigation: NavigationState
    @Environment(\.dismiss) var dismiss
    @State private var note = ""
    @State private var color: String?
    @State private var bookmarked = false
    var body: some View {
        NavigationStack {
            Form {
                Section(library.name(passage,verse:true)) { Text(library.verses(passage).first { $0.v == passage.verse }?.t ?? "").font(Theme.serif(21)).lineSpacing(6) }
                Section("Highlight") {
                    HStack(spacing:16) {
                        ForEach(["olive","gold","rose","blue"],id:\.self) { option in
                            Button { color = color == option ? nil : option } label:{ Circle().fill(highlight(option)).frame(width:42,height:42).overlay { if color == option { Image(systemName:"checkmark").foregroundStyle(Theme.ink) } } }.buttonStyle(.plain).accessibilityLabel("\(option) highlight").accessibilityAddTraits(color == option ? .isSelected : [])
                        }
                        Button { color = nil } label:{ Image(systemName:"xmark.circle").frame(width:42,height:42) }.accessibilityLabel("Remove highlight")
                    }
                }
                Section("Your note") { TextEditor(text:$note).frame(minHeight:150).accessibilityIdentifier("note.editor") }
                Toggle("Bookmark verse",isOn:$bookmarked)
                Button("Open in Study Center") { save(); navigation.selectedVerse = passage.verse; navigation.study = true; dismiss() }
            }.scrollContentBackground(.hidden).background(Theme.paper).navigationTitle("Make it yours").navigationBarTitleDisplayMode(.inline).toolbar {
                ToolbarItem(placement:.cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement:.confirmationAction) { Button("Save") { save(); if personal.error == nil { dismiss() } }.fontWeight(.semibold) }
            }
        }.tint(Theme.olive).onAppear { let current = personal.annotation(passage); note = current.note; color = current.color; bookmarked = current.bookmarked }
    }
    func save() { personal.save(Annotation(passage:passage,note:note,color:color,bookmarked:bookmarked)) }
}
struct SavedView: View {
    let library: ContentLibrary
    @EnvironmentObject var personal: PersonalStore
    @EnvironmentObject var navigation: NavigationState
    @State private var filter = "All"
    var entries: [Annotation] { personal.data.annotations.filter { filter == "All" || (filter == "Notes" && !$0.note.isEmpty) || (filter == "Highlights" && $0.color != nil) || (filter == "Bookmarks" && $0.bookmarked) }.sorted { $0.updated > $1.updated } }
    var body: some View {
        ScrollView { VStack(alignment:.leading,spacing:22) {
            Eyebrow(text:"Your reading life")
            Text("Keep what stays with you.").font(Theme.serif(34)).tracking(-0.7)
            Picker("Show saved",selection:$filter) { ForEach(["All","Notes","Highlights","Bookmarks"],id:\.self) { Text($0).tag($0) } }.pickerStyle(.segmented)
            if entries.isEmpty { EmptyState(title:"A place for your discoveries",detail:"Tap a verse while reading to highlight it, bookmark it, or write a note.",icon:"bookmark") }
            ForEach(entries) { entry in
                Button { personal.update { $0.activeJourney = nil }; navigation.read(entry.passage) } label:{
                    VStack(alignment:.leading,spacing:12) {
                        HStack { Text(library.name(entry.passage,verse:true)).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.olive); Spacer(); if entry.bookmarked { Image(systemName:"bookmark.fill").foregroundStyle(Theme.olive) } }
                        Text(library.verses(entry.passage).first { $0.v == entry.passage.verse }?.t ?? "").font(Theme.serif(21)).lineSpacing(5)
                        if !entry.note.isEmpty { Divider(); Text(entry.note).font(.subheadline).lineSpacing(4).foregroundStyle(Theme.muted) }
                    }.padding(20).frame(maxWidth:.infinity,alignment:.leading).background(entry.color == nil ? .white : highlight(entry.color),in:RoundedRectangle(cornerRadius:16))
                }.buttonStyle(.plain)
            }
        }.padding(24) }
    }
}
struct PrayerView: View {
    @EnvironmentObject var personal: PersonalStore
    @State private var editor: Prayer?
    @State private var answeredOnly = false
    var body: some View {
        ScrollView { VStack(alignment:.leading,spacing:24) {
            HStack { Eyebrow(text:"A quiet space"); Spacer(); Image(systemName:"hands.sparkles").foregroundStyle(Theme.olive) }
            Text("Bring what’s on your heart.").font(Theme.serif(35)).tracking(-0.8)
            Text("A few honest words are enough.").font(.subheadline).foregroundStyle(Theme.muted)
            Button { editor = Prayer(title:"",body:"") } label:{ Label("Write a prayer",systemImage:"plus") }.buttonStyle(AperioButton())
            Toggle("Answered prayers",isOn:$answeredOnly).font(.subheadline)
            let prayers = personal.data.prayers.filter { !answeredOnly || $0.answered }.sorted { $0.updated > $1.updated }
            if prayers.isEmpty { EmptyState(title:answeredOnly ? "Remember the answers" : "Begin where you are",detail:answeredOnly ? "Mark a prayer answered to keep it here." : "Your prayers are saved privately on this device. You can export a backup from Account.",icon:"leaf") }
            ForEach(prayers) { prayer in
                Button { editor = prayer } label:{ VStack(alignment:.leading,spacing:12) {
                    HStack { Text(prayer.title).font(Theme.serif(25)); Spacer(); if prayer.answered { Image(systemName:"checkmark.seal").foregroundStyle(Theme.olive) } }
                    Text(prayer.body).font(.subheadline).lineSpacing(5).foregroundStyle(Theme.muted)
                    Text(prayer.updated,format:.dateTime.month().day().year()).font(.caption).foregroundStyle(Theme.olive)
                }.padding(22).frame(maxWidth:.infinity,alignment:.leading).background(.white,in:RoundedRectangle(cornerRadius:18)) }.buttonStyle(.plain)
            }
        }.padding(24) }.sheet(item:$editor) { prayer in PrayerEditor(prayer:prayer) }
    }
}
struct PrayerEditor: View {
    @State var prayer: Prayer
    @EnvironmentObject var personal: PersonalStore
    @Environment(\.dismiss) var dismiss
    @State private var delete = false
    var body: some View {
        NavigationStack {
            Form {
                Section("A name for this prayer") { TextField("What’s on your heart?",text:$prayer.title).accessibilityIdentifier("prayer.title") }
                Section("Your words") { TextEditor(text:$prayer.body).frame(minHeight:240).accessibilityIdentifier("prayer.body") }
                Toggle("Answered",isOn:$prayer.answered)
                if personal.data.prayers.contains(where: { $0.id == prayer.id }) { Button("Delete prayer",role:.destructive) { delete = true } }
            }.scrollContentBackground(.hidden).background(Theme.paper).navigationTitle("Your prayer").navigationBarTitleDisplayMode(.inline).toolbar {
                ToolbarItem(placement:.cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement:.confirmationAction) { Button("Save") { prayer.updated = Date(); personal.update { $0.prayers.removeAll { $0.id == prayer.id }; $0.prayers.append(prayer) }; if personal.error == nil { dismiss() } }.disabled(prayer.title.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty) }
            }.confirmationDialog("Delete this prayer?",isPresented:$delete,titleVisibility:.visible) { Button("Delete prayer",role:.destructive) { personal.update { $0.prayers.removeAll { $0.id == prayer.id } }; dismiss() } }
        }.tint(Theme.olive)
    }
}
struct AccountView: View {
    @EnvironmentObject var personal: PersonalStore
    @State private var name = ""
    @State private var backup: URL?
    @State private var importing = false
    @State private var message: String?
    var body: some View {
        ScrollView { VStack(alignment:.leading,spacing:25) {
            Eyebrow(text:"Your Aperio")
            Text("Room to grow.").font(Theme.serif(35))
            VStack(alignment:.leading,spacing:14) {
                Text("What should we call you?").font(Theme.serif(23))
                TextField("Your first name",text:$name).textContentType(.givenName).padding(14).background(.white,in:RoundedRectangle(cornerRadius:10))
                Button("Save name") { personal.update { $0.name = String(name.trimmingCharacters(in:.whitespacesAndNewlines).prefix(50)) } }.buttonStyle(AperioButton())
            }
            Divider()
            Text("Private, on your device.").font(Theme.serif(25))
            Text("Scripture and study work offline. Your prayers, notes, highlights, and reading progress are saved on this device. This native preview does not yet sync with your website account.").font(.subheadline).lineSpacing(5).foregroundStyle(Theme.muted)
            Button { do { backup = try personal.exportURL() } catch { message = "We couldn’t prepare your backup." } } label:{ Label("Prepare a personal backup",systemImage:"square.and.arrow.up") }.buttonStyle(AperioButton())
            if let backup { ShareLink("Save or share backup",item:backup).font(.subheadline.weight(.semibold)); Text("The backup contains your private prayers and notes. Save it somewhere you trust.").font(.caption).foregroundStyle(Theme.muted) }
            Button { importing = true } label:{ Label("Restore an Aperio backup",systemImage:"square.and.arrow.down") }.padding(.vertical,10)
            Divider()
            Text("About Aperio").font(Theme.serif(25))
            Text("Read. Understand. Live.\nBerean Standard Bible (public domain). Original-language data from the Berean translation tables and Open Scriptures Strong’s dictionaries. Commentary and introductions are saved editorial content.").font(.subheadline).lineSpacing(5).foregroundStyle(Theme.muted)
            Link("Privacy policy",destination:URL(string:"https://aperiobible.com/#privacy")!)
            Text("iOS preview · 2.0.0").font(.caption).foregroundStyle(Theme.muted)
        }.padding(24) }.onAppear { name = personal.data.name }
            .fileImporter(isPresented:$importing,allowedContentTypes:[.json]) { result in
                do { try personal.importBackup(result.get()); message = "Your backup was merged. Existing entries were preserved." } catch { message = "This file couldn’t be restored. Please select an Aperio personal backup." }
            }.alert("Backup",isPresented:Binding(get:{message != nil},set:{if !$0 { message = nil }})) { Button("OK",role:.cancel) {} } message:{Text(message ?? "")}
    }
}
struct SettingsView: View {
    @EnvironmentObject var personal: PersonalStore
    @Environment(\.dismiss) var dismiss
    var body: some View {
        NavigationStack {
            Form {
                Section("Scripture type size") {
                    Slider(value:Binding(get:{personal.data.fontSize},set:{ value in personal.update { $0.fontSize = value } }),in:18...32,step:1).accessibilityLabel("Scripture text size")
                    Text("The LORD is my shepherd; I shall not want.").font(Theme.serif(personal.data.fontSize)).lineSpacing(7).padding(.vertical,14)
                }
                Section("Accessibility") { Text("Aperio follows your iPhone’s text-size settings and Reduce Motion preference. VoiceOver labels are included for reading and study controls.").font(.subheadline) }
            }.navigationTitle("Reading settings").navigationBarTitleDisplayMode(.inline).toolbar { ToolbarItem(placement:.confirmationAction) { Button("Done") { dismiss() } } }
        }.tint(Theme.olive)
    }
}
struct SearchView: View {
    let library: ContentLibrary
    @EnvironmentObject var navigation: NavigationState
    @EnvironmentObject var personal: PersonalStore
    @Environment(\.dismiss) var dismiss
    @State private var query = ""
    @State private var results = [SearchResult]()
    var body: some View {
        NavigationStack {
            List {
                if query.count < 2 { Text("Search a phrase or reference, such as ‘Psalm 23’ or ‘be still’.").foregroundStyle(Theme.muted) }
                else if results.isEmpty { Text("No passages found. Try a shorter phrase.").foregroundStyle(Theme.muted) }
                ForEach(results) { result in
                    Button { personal.update { $0.activeJourney = nil }; navigation.read(result.passage); dismiss() } label:{ VStack(alignment:.leading,spacing:8) { Text(result.reference).font(.caption.weight(.semibold)).foregroundStyle(Theme.olive); Text(result.text).font(Theme.serif(19)).lineSpacing(4).foregroundStyle(Theme.ink) }.padding(.vertical,8) }
                }
                if results.count == 100 { Text("Showing the first 100 matches. Refine your search for more specific results.").font(.caption) }
            }.searchable(text:$query,prompt:"Passage or phrase").navigationTitle("Search Scripture").navigationBarTitleDisplayMode(.inline).toolbar { ToolbarItem(placement:.confirmationAction) { Button("Done") { dismiss() } } }
                .task(id:query) {
                    let current = query
                    do { try await Task.sleep(for:.milliseconds(200)) } catch { return }
                    let found = await Task.detached { library.search(current) }.value
                    guard !Task.isCancelled else { return }; results = found
                }
        }.tint(Theme.olive)
    }
}
