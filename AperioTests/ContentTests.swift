import XCTest
import SQLite3
@testable import AperioCore

final class ContentTests: XCTestCase {
    func library() throws -> ContentLibrary { try ContentLibrary(root:URL(fileURLWithPath:#filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("Aperio/Content")) }
    func testEveryChapterAndIntroductionDecode() throws {
        let library = try library()
        XCTAssertEqual(library.books.count,66)
        XCTAssertEqual(library.books.reduce(0) { $0 + $1.chapters.count },1189)
        XCTAssertEqual(library.books.reduce(0) { $0 + $1.chapters.reduce(0) { $0 + $1.count } },31102)
        for (bookIndex,book) in library.books.enumerated() {
            let introduction = try library.introduction(bookIndex)
            XCTAssertFalse(introduction.sections.isEmpty,book.name)
            for ch in 1...book.chapters.count {
                let passage = Passage(book:bookIndex,chapter:ch)
                let commentary = try library.commentary(passage)
                for mode in ["devotional","scholarly","prophetic"] { XCTAssertFalse(commentary.modes[mode]?.overview.isEmpty ?? true,"\(book.name) \(ch) \(mode)") }
                XCTAssertFalse(try library.words(passage).isEmpty,"\(book.name) \(ch)")
                XCTAssertTrue(introduction.chapterPeriods.contains { $0.start <= ch && $0.end >= ch },"\(book.name) \(ch)")
            }
        }
    }
    func testLanguageAndReferences() throws {
        let library = try library()
        let psalm = Passage(book:18,chapter:23)
        let words = try library.words(psalm)["1"] ?? []
        XCTAssertTrue(words.contains { $0.ids.contains("H7462") && $0.g == "is my shepherd" })
        XCTAssertNotNil(try library.lexemes("Hebrew")["H7462"])
        XCTAssertNotNil(try library.lexemes("Greek")["G3056"])
        XCTAssertFalse(try library.references(psalm).isEmpty)
        for row in try library.occurrences("H7462") { XCTAssertTrue(row.count >= 3); XCTAssertTrue(library.valid(Passage(book:row[0],chapter:row[1],verse:row[2]))) }
    }
    func testSearchAndJourneyDestinations() throws {
        let library = try library()
        XCTAssertTrue(library.search("Psalm 23:1").contains { $0.passage == Passage(book:18,chapter:23,verse:1) })
        XCTAssertTrue(library.search("be still").contains { $0.text.localizedCaseInsensitiveContains("be still") })
        XCTAssertTrue(library.search("").isEmpty)
        for journey in library.home.journeys {
            XCTAssertFalse(journey.steps.isEmpty)
            for step in journey.steps { let p = try XCTUnwrap(library.passage(book:step.book,chapter:step.chapter,verse:step.verse)); XCTAssertTrue(library.verses(p).contains { $0.v == p.verse }) }
            XCTAssertTrue(FileManager.default.fileExists(atPath:library.root.appendingPathComponent(journey.video).path))
        }
        for day in library.home.days { for question in day.questions { XCTAssertTrue(question.options.indices.contains(question.answer)) } }
    }
    func testLegacyImportPreservesAndMerges() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString+".db")
        defer { try? FileManager.default.removeItem(at:url) }
        var db: OpaquePointer?; XCTAssertEqual(sqlite3_open(url.path,&db),SQLITE_OK)
        let sql = """
        CREATE TABLE notes(id TEXT,book_num INTEGER,chapter INTEGER,verse INTEGER,body TEXT,deleted INTEGER);
        INSERT INTO notes VALUES('n',19,23,1,'A note from the previous app',0);
        INSERT INTO notes VALUES('deleted',19,23,1,'Deleted note',1);
        CREATE TABLE prayers(id TEXT,title TEXT,body TEXT,answered INTEGER,updated_at TEXT,deleted INTEGER);
        INSERT INTO prayers VALUES('p','Family','Keep us close',1,'2026-01-01T00:00:00Z',0);
        """
        XCTAssertEqual(sqlite3_exec(db,sql,nil,nil,nil),SQLITE_OK); sqlite3_close(db)
        let data = try LegacyImport.read(url:url,into:PersonalData())
        XCTAssertTrue(data.legacyImported)
        XCTAssertEqual(data.annotations.first?.passage,Passage(book:18,chapter:23,verse:1))
        XCTAssertEqual(data.annotations.first?.note,"A note from the previous app")
        XCTAssertEqual(data.prayers.count,1); XCTAssertTrue(data.prayers[0].answered)
        let repeated = try LegacyImport.read(url:url,into:data)
        XCTAssertEqual(repeated.annotations.count,1); XCTAssertEqual(repeated.prayers.count,1)
        XCTAssertTrue(FileManager.default.fileExists(atPath:url.path))
    }
    @MainActor func testPersonalPersistenceAndCorruptionProtection() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at:root) }
        let store = PersonalStore(directory:root)
        store.save(Annotation(passage:Passage(book:18,chapter:23),note:"Remember",color:"olive"))
        store.update { $0.prayers.append(Prayer(title:"Today",body:"Thank you")) }
        XCTAssertNil(store.error)
        let reopened = PersonalStore(directory:root)
        XCTAssertEqual(reopened.data.annotations.first?.note,"Remember"); XCTAssertEqual(reopened.data.prayers.count,1)
        let url = root.appendingPathComponent("personal-v1.json")
        try Data("damaged".utf8).write(to:url)
        let damaged = PersonalStore(directory:root)
        damaged.update { $0.name = "Must not overwrite" }
        XCTAssertNotNil(damaged.error); XCTAssertEqual(try String(contentsOf:url,encoding:.utf8),"damaged")
    }
}
