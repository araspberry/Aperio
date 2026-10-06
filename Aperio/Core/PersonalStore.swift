import Foundation
import SwiftUI

struct Annotation: Codable, Identifiable {
    var id: String { passage.id }
    var passage: Passage; var note: String = ""; var color: String?; var bookmarked: Bool = false; var updated = Date()
}
struct Prayer: Codable, Identifiable {
    var id = UUID().uuidString; var title: String; var body: String; var answered = false; var updated = Date()
}
struct PersonalData: Codable {
    var schema = 1
    var name = ""
    var fontSize: Double = 23
    var passage = Passage(book:18,chapter:23)
    var annotations = [Annotation]()
    var prayers = [Prayer]()
    var journeyProgress = [String:Int]()
    var activeJourney: String?
    var quizScores = [String:Int]()
    var legacyImported = false
}
@MainActor final class PersonalStore: ObservableObject {
    @Published private(set) var data = PersonalData()
    @Published var error: String?
    private let url: URL
    private var writable = true
    init(directory: URL? = nil) {
        let dir = directory ?? FileManager.default.urls(for: .applicationSupportDirectory,in:.userDomainMask)[0].appendingPathComponent("Aperio",isDirectory:true)
        url = dir.appendingPathComponent("personal-v1.json")
        do {
            try FileManager.default.createDirectory(at:dir,withIntermediateDirectories:true)
            if FileManager.default.fileExists(atPath:url.path) { data = try JSONDecoder().decode(PersonalData.self,from:Data(contentsOf:url)) }
            if directory == nil, !data.legacyImported, let legacy = LegacyImport.locate() {
                let imported = try LegacyImport.read(url:legacy,into:data)
                try JSONEncoder().encode(imported).write(to:url,options:[.atomic,.completeFileProtectionUntilFirstUserAuthentication])
                data = imported
            }
        } catch { self.error = "Your saved data could not be opened. It has been kept intact. Please export a backup before making changes."; writable = false }
    }
    func update(_ change: (inout PersonalData)->Void) {
        guard writable else { error = "Saved data needs recovery before changes can be saved."; return }
        var next = data; change(&next)
        do {
            let bytes = try JSONEncoder().encode(next)
            try bytes.write(to:url,options:[.atomic,.completeFileProtectionUntilFirstUserAuthentication])
            data = next
        } catch { self.error = "We couldn’t save that change. Please check your available storage and try again." }
    }
    func annotation(_ passage: Passage) -> Annotation { data.annotations.first { $0.id == passage.id } ?? Annotation(passage:passage) }
    func save(_ item: Annotation) {
        update { d in
            d.annotations.removeAll { $0.id == item.id }
            if item.color != nil || item.bookmarked || !item.note.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty { d.annotations.append(item) }
        }
    }
    func exportURL() throws -> URL {
        let target = FileManager.default.temporaryDirectory.appendingPathComponent("Aperio-personal-backup.json")
        try JSONEncoder().encode(data).write(to:target,options:[.atomic,.completeFileProtectionUntilFirstUserAuthentication]); return target
    }
    func importBackup(_ target: URL) throws {
        let grant = target.startAccessingSecurityScopedResource(); defer { if grant { target.stopAccessingSecurityScopedResource() } }
        let backup = try JSONDecoder().decode(PersonalData.self,from:Data(contentsOf:target))
        guard backup.schema == 1, backup.annotations.allSatisfy({ (0..<66).contains($0.passage.book) && (1...150).contains($0.passage.chapter) && (1...176).contains($0.passage.verse) }) else { throw CocoaError(.coderReadCorrupt) }
        update { current in
            for item in backup.annotations where !current.annotations.contains(where: { $0.id == item.id }) { current.annotations.append(item) }
            for prayer in backup.prayers where !current.prayers.contains(where: { $0.id == prayer.id }) { current.prayers.append(prayer) }
        }
    }
}
