import XCTest

final class AperioUITests: XCTestCase {
    func testNativeReadingStudyAndPersonalData() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["APERIO_UI_TEST"] = "1"
        app.launchEnvironment["APERIO_UI_TEST_RESET"] = "1"
        app.launch()
        app.launchEnvironment["APERIO_UI_TEST_RESET"] = "0"
        XCTAssertTrue(app.buttons["tab.bible"].waitForExistence(timeout:20))
        app.buttons["tab.bible"].tap()
        XCTAssertTrue(app.buttons["reader.study"].waitForExistence(timeout:10))
        app.buttons["reader.study"].tap()
        XCTAssertTrue(app.buttons["study.Lexicon"].waitForExistence(timeout:5))
        XCTAssertTrue(app.buttons["tab.home"].isHittable,"Bottom navigation must remain usable in Study Center")
        app.buttons["study.Lexicon"].tap()
        XCTAssertTrue(app.staticTexts["The words behind the Word."].exists)
        let firstPhrase = app.buttons.containing(.staticText,identifier:"A Psalm").firstMatch
        XCTAssertTrue(firstPhrase.waitForExistence(timeout:5))
        firstPhrase.tap()
        XCTAssertTrue(app.buttons["Back to Lexicon"].waitForExistence(timeout:5))
        let study = XCTAttachment(screenshot:app.screenshot()); study.name = "Hebrew word study"; study.lifetime = .keepAlways; add(study)
        app.buttons["Back to Lexicon"].tap()
        app.buttons["Close Study Center"].tap()
        app.buttons["verse.1"].tap()
        let note = app.textViews["note.editor"]
        XCTAssertTrue(note.waitForExistence(timeout:5)); note.tap(); note.typeText("A quiet reminder from the native test.")
        app.buttons["olive highlight"].tap()
        app.buttons["Save"].tap()
        app.buttons["tab.saved"].tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@","A quiet reminder")).firstMatch.waitForExistence(timeout:5))
        app.buttons["tab.prayer"].tap()
        app.buttons["Write a prayer"].tap()
        let title = app.textFields["prayer.title"]; XCTAssertTrue(title.waitForExistence(timeout:5)); title.tap(); title.typeText("A prayer for today")
        let body = app.textViews["prayer.body"]; body.tap(); body.typeText("Thank you for the gift of this day.")
        app.buttons["Save"].tap()
        XCTAssertTrue(app.staticTexts["A prayer for today"].waitForExistence(timeout:5))
        let attachment = XCTAttachment(screenshot:app.screenshot()); attachment.name = "Native prayer journal"; attachment.lifetime = .keepAlways; add(attachment)
        app.terminate(); app.launch()
        app.buttons["tab.saved"].tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@","A quiet reminder")).firstMatch.waitForExistence(timeout:5))
        app.buttons["tab.bible"].tap()
        app.buttons["reader.bookPicker"].tap()
        let genesis = app.buttons.containing(.staticText,identifier:"Genesis").firstMatch
        XCTAssertTrue(genesis.waitForExistence(timeout:5)); genesis.tap()
        app.buttons["Introduction to Genesis"].tap()
        XCTAssertTrue(app.staticTexts["A Beginning Larger Than One Family"].waitForExistence(timeout:5))
        XCTAssertTrue(app.buttons["tab.home"].isHittable)
        let intro = XCTAttachment(screenshot:app.screenshot()); intro.name = "Book introduction"; intro.lifetime = .keepAlways; add(intro)
    }
}
