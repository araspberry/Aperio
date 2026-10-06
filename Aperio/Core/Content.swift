import Foundation

struct Verse: Codable, Identifiable, Sendable { let v: Int; let t: String; var id: Int { v } }
struct BibleBook: Codable, Sendable { let name: String; let chapters: [[Verse]] }
struct Passage: Codable, Hashable, Identifiable, Sendable {
    var book: Int; var chapter: Int; var verse: Int = 1
    var id: String { "\(book):\(chapter):\(verse)" }
}
struct Source: Codable, Identifiable { let id: String; let label: String; let url: String }
struct EssaySection: Codable { let title: String; let paragraphs: [String]; let start: Int?; let end: Int? }
struct StudyMode: Codable { let title: String; let overview: [String]; let sections: [EssaySection] }
struct Commentary: Codable { let title: String; let status: String; let sources: [Source]; let modes: [String:StudyMode] }
struct CommentaryIndex: Codable {
    struct Entry: Codable { let bookIndex: Int; let chapter: Int; let file: String }
    let chapters: [Entry]
}
struct BookIntroduction: Codable {
    struct Outline: Codable { let label: String; let startChapter: Int; let endChapter: Int; let description: String }
    struct Timeline: Codable { let era: String; let dateLabel: String; let context: String; let note: String }
    struct Period: Codable { let start: Int; let end: Int; let era: String; let label: String; let dateLabel: String; let note: String }
    let title: String; let subtitle: String; let atAGlance: [String:String]; let sections: [EssaySection]
    let outline: [Outline]; let timeline: Timeline; let chapterPeriods: [Period]; let sources: [Source]
}
struct StudyWord: Codable, Identifiable {
    let g: String; let o: String; let tr: String; let grammar: String; let lang: String; let ids: [String]
    let start: Int?; let end: Int?
    var id: String { "\(g):\(o):\(start ?? -1)" }
}
struct Lexeme: Codable { let lemma: String; let xlit: String?; let translit: String?; let strongs_def: String?; let kjv_def: String? }
struct CrossReference: Codable, Identifiable {
    let book: String; let chapter: Int; let start: Int; let end: Int; let label: String; let note: String; let sourceVerse: Int
    var id: String { "\(sourceVerse):\(book):\(chapter):\(start):\(end)" }
}
struct QuizQuestion: Codable { let prompt: String; let options: [String]; let answer: Int; let explanation: String; let verseStart: Int?; let verseEnd: Int? }
struct DailyReading: Codable, Identifiable {
    let id: String; let theme: String; let book: String; let bookIndex: Int; let chapter: Int; let verse: Int
    let reference: String; let reflection: String; let prayerPrompt: String; let questions: [QuizQuestion]
    var passage: Passage { Passage(book: bookIndex, chapter: chapter, verse: verse) }
}
struct Journey: Codable, Identifiable {
    struct Step: Codable { let book: String; let chapter: Int; let verse: Int; let title: String }
    let id: String; let title: String; let description: String; let tag: String; let poster: String; let video: String; let steps: [Step]
}
struct HomeContent: Codable { let days: [DailyReading]; let journeys: [Journey] }
struct SearchResult: Identifiable, Sendable { let passage: Passage; let text: String; let reference: String; var id: String { passage.id } }

final class ContentLibrary: @unchecked Sendable {
    let root: URL
    let books: [BibleBook]
    let home: HomeContent
    private let commentaryPaths: [String:String]
    init(root: URL = Bundle.main.resourceURL!.appendingPathComponent("Content")) throws {
        self.root = root
        func read<T:Decodable>(_ file: String) throws -> T { try JSONDecoder().decode(T.self, from: Data(contentsOf: root.appendingPathComponent(file))) }
        books = try read("data/bible.json")
        home = try read("home-content.json")
        let index: CommentaryIndex = try read("data/commentary/index.json")
        commentaryPaths = Dictionary(uniqueKeysWithValues: index.chapters.map { ("\($0.bookIndex):\($0.chapter)", $0.file) })
    }
    func load<T:Decodable>(_ path: String) throws -> T { try JSONDecoder().decode(T.self, from: Data(contentsOf: root.appendingPathComponent(path))) }
    func valid(_ p: Passage) -> Bool { books.indices.contains(p.book) && p.chapter >= 0 && p.chapter <= books[p.book].chapters.count }
    func name(_ p: Passage, verse: Bool = false) -> String {
        guard valid(p) else { return "Scripture" }
        return books[p.book].name + (p.chapter == 0 ? " · Introduction" : " \(p.chapter)" + (verse ? ":\(p.verse)" : ""))
    }
    func verses(_ p: Passage) -> [Verse] { valid(p) && p.chapter > 0 ? books[p.book].chapters[p.chapter-1] : [] }
    func introduction(_ book: Int) throws -> BookIntroduction { try load("data/introductions/\(book).json") }
    func commentary(_ p: Passage) throws -> Commentary {
        guard let path = commentaryPaths["\(p.book):\(p.chapter)"] else { throw CocoaError(.fileNoSuchFile) }
        return try load("data/" + path)
    }
    func words(_ p: Passage) throws -> [String:[StudyWord]] { try load("data/study/\(p.book)/\(p.chapter).json") }
    func references(_ p: Passage) throws -> [CrossReference] { try load("data/crossrefs/\(p.book)/\(p.chapter).json") }
    func lexemes(_ language: String) throws -> [String:Lexeme] { try load("data/\(language == "Greek" ? "greek" : "hebrew").json") }
    func occurrences(_ strongs: String) throws -> [[Int]] { try load("data/occurrences/\(strongs).json") }
    func passage(book: String, chapter: Int, verse: Int = 1) -> Passage? {
        guard let b = books.firstIndex(where: { $0.name.caseInsensitiveCompare(book) == .orderedSame || (book == "Psalms" && $0.name == "Psalm") }) else { return nil }
        let p = Passage(book: b, chapter: chapter, verse: verse)
        return valid(p) ? p : nil
    }
    func daily(on date: Date = Date()) -> DailyReading {
        let cal = Calendar(identifier: .gregorian)
        let components = cal.dateComponents([.year,.month,.day], from: date)
        var utc = Calendar(identifier: .gregorian); utc.timeZone = TimeZone(secondsFromGMT: 0)!
        let day = Int(utc.date(from: components)!.timeIntervalSince1970 / 86400)
        return home.days[((day % home.days.count) + home.days.count) % home.days.count]
    }
    func search(_ query: String) -> [SearchResult] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard q.count >= 2 else { return [] }
        var results = [SearchResult]()
        for (b,book) in books.enumerated() {
            for (c,verses) in book.chapters.enumerated() {
                for verse in verses {
                    let p = Passage(book:b,chapter:c+1,verse:verse.v), ref = name(p,verse:true)
                    if verse.t.localizedCaseInsensitiveContains(q) || ref.localizedCaseInsensitiveContains(q) {
                        results.append(SearchResult(passage:p,text:verse.t,reference:ref))
                        if results.count >= 100 { return results }
                    }
                }
            }
        }
        return results
    }
}
