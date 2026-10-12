import XCTest
@testable import AperioCore

final class SearchTests: XCTestCase {
    static let library = try! ContentLibrary(root:URL(fileURLWithPath:#filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("Aperio/Content"))
    func testRememberedWordingRanksTheRightPassage() {
        let examples = [
            ("Works tested by fire","1 Corinthians 3:13"),
            ("Works tested in fire","1 Corinthians 3:13"),
            ("Where does it say our works will be tested by fire?","1 Corinthians 3:13"),
            ("fire tested work","1 Corinthians 3:13"),
            ("Peace when anxious","Philippians 4:6"),
            ("Rest for the weary","Matthew 11:28"),
            ("love is patient love is kind","1 Corinthians 13:4"),
            ("ask God for wisdom","James 1:5"),
            ("faith without works dead","James 2:17"),
            ("fruit of the spirit","Galatians 5:22"),
            ("good samaritan","Luke 10:30"),
            ("prodigal son","Luke 15:11")
        ]
        for (query,expected) in examples {
            let results = Self.library.search(query)
            XCTAssertEqual(results.first?.reference,expected,"\(query): \(results.prefix(3).map(\.reference))")
            XCTAssertEqual(Set(results.map(\.id)).count,results.count)
            for result in results { XCTAssertTrue(Self.library.verses(result.passage).contains { $0.v == result.passage.verse && $0.t == result.text }) }
        }
    }
    func testReferencesArePreciseAndInvalidReferencesStayEmpty() {
        XCTAssertEqual(Self.library.search("1 Cor. 3:13").map(\.reference),["1 Corinthians 3:13"])
        XCTAssertEqual(Self.library.search("1Cor3:12–15").count,4)
        XCTAssertEqual(Self.library.search("Psalms 23").count,6)
        XCTAssertEqual(Self.library.search("John 3:16").map(\.reference),["John 3:16"])
        for query in ["Psalm 151", "John 3:999", "John 3:", "John 3:16-1", "John 3:16-999"] { XCTAssertTrue(Self.library.search(query).isEmpty,query) }
    }
    func testSpellingPunctuationAndNoSpuriousFallbacks() {
        XCTAssertTrue(Self.library.search("sheperd").contains { $0.reference == "Psalm 23:1" })
        XCTAssertTrue(Self.library.search("BE STILL").first?.text.localizedCaseInsensitiveContains("be still") == true)
        XCTAssertFalse(Self.library.search("God’s workmanship").isEmpty)
        for query in ["", "a", "the and of", "xylophone spaceship", "fire qzxvunknown"] { XCTAssertTrue(Self.library.search(query).isEmpty,query) }
        XCTAssertLessThanOrEqual(Self.library.search("God").count,100)
    }
    func testCachedSearchIsFastEnoughForTyping() {
        _ = Self.library.search("work fire")
        let start = Date()
        for _ in 0..<10 { _ = Self.library.search("Works tested by fire") }
        XCTAssertLessThan(Date().timeIntervalSince(start),2,"A warmed index should keep the search responsive")
    }
}
