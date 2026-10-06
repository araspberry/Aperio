import Foundation
import SQLite3

/// Reads the previous app's on-device database without modifying it.
/// Only the documented data schema is used; no legacy app implementation is linked.
enum LegacyImport {
    static func locate() -> URL? {
        let manager = FileManager.default
        let documents = manager.urls(for:.documentDirectory,in:.userDomainMask)[0]
        let library = manager.urls(for:.libraryDirectory,in:.userDomainMask)[0]
        return [documents.appendingPathComponent("SQLite/aperio-user.db"),library.appendingPathComponent("SQLite/aperio-user.db"),library.appendingPathComponent("Application Support/SQLite/aperio-user.db")].first { manager.fileExists(atPath:$0.path) }
    }
    static func read(url: URL, into original: PersonalData) throws -> PersonalData {
        var db: OpaquePointer?
        guard sqlite3_open_v2(url.path,&db,SQLITE_OPEN_READONLY,nil) == SQLITE_OK else { if db != nil { sqlite3_close(db) }; throw CocoaError(.fileReadUnknown) }
        defer { sqlite3_close(db) }
        func rows(_ query:String) throws -> [[String:String]] {
            var statement: OpaquePointer?
            guard sqlite3_prepare_v2(db,query,-1,&statement,nil) == SQLITE_OK else { throw CocoaError(.fileReadCorruptFile) }
            defer { sqlite3_finalize(statement) }
            var result = [[String:String]]()
            var status = sqlite3_step(statement)
            while status == SQLITE_ROW {
                var row = [String:String]()
                for index in 0..<sqlite3_column_count(statement) { if let value = sqlite3_column_text(statement,index) { row[String(cString:sqlite3_column_name(statement,index))] = String(cString:value) } }
                result.append(row); status = sqlite3_step(statement)
            }
            guard status == SQLITE_DONE else { throw CocoaError(.fileReadUnknown) }; return result
        }
        let tables = Set(try rows("SELECT name FROM sqlite_master WHERE type='table'").compactMap { $0["name"] })
        var data = original
        func ref(_ row:[String:String]) -> Passage? {
            guard let number = Int(row["book_num"] ?? ""), (1...66).contains(number), let chapter = Int(row["chapter"] ?? ""), chapter > 0 else { return nil }
            return Passage(book:number-1,chapter:chapter,verse:max(1,Int(row["verse"] ?? "") ?? 1))
        }
        for table in ["bookmarks","highlights","notes"] where tables.contains(table) {
            for row in try rows("SELECT * FROM \(table)" + (table == "notes" ? " WHERE deleted=0" : "")) {
                guard let p = ref(row) else { continue }
                var entry = data.annotations.first { $0.id == p.id } ?? Annotation(passage:p)
                switch table {
                case "bookmarks": entry.bookmarked = true
                case "highlights": if entry.color == nil { entry.color = row["color"] ?? "gold" }
                default: if let body = row["body"], !body.isEmpty, !entry.note.contains(body) { entry.note += (entry.note.isEmpty ? "" : "\n\n") + body }
                }
                data.annotations.removeAll { $0.id == p.id }; data.annotations.append(entry)
            }
        }
        if tables.contains("prayers") {
            for row in try rows("SELECT * FROM prayers WHERE deleted=0") {
                guard let id = row["id"], !data.prayers.contains(where: { $0.id == id }) else { continue }
                data.prayers.append(Prayer(id:id,title:row["title"] ?? "Prayer",body:row["body"] ?? "",answered:row["answered"] == "1",updated:ISO8601DateFormatter().date(from:row["updated_at"] ?? "") ?? Date()))
            }
        }
        if tables.contains("progress"), let row = try rows("SELECT * FROM progress ORDER BY updated_at DESC LIMIT 1").first, let p = ref(row) { data.passage = p }
        data.legacyImported = true
        return data
    }
}
