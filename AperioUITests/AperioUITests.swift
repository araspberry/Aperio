import XCTest
import UIKit

final class AperioUITests: XCTestCase {
    func testGivingChoicesSubscriptionOptionsAndStudyScrolling() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["APERIO_UI_TEST"] = "1"
        app.launchEnvironment["APERIO_UI_TEST_RESET"] = "1"
        app.launchEnvironment["APERIO_TEST_STOREFRONT"] = "USA"
        app.launch()
        XCTAssertTrue(app.buttons["header.subscribe"].waitForExistence(timeout:20))
        app.buttons["header.subscribe"].tap()
        XCTAssertTrue(app.buttons["subscribe.verse_only"].waitForExistence(timeout:5))
        app.buttons["subscribe.verse_and_updates"].tap()
        XCTAssertTrue(app.buttons["subscribe.verse_and_updates"].isSelected)
        app.buttons["subscribe.verse_only"].tap()
        XCTAssertTrue(app.buttons["subscribe.verse_only"].isSelected)
        let emailShot = XCTAttachment(screenshot:app.screenshot()); emailShot.name = "Email preferences"; emailShot.lifetime = .keepAlways; add(emailShot)
        app.buttons["Done"].tap()
        app.buttons["navigation.menu"].tap(); app.buttons["tab.give"].tap()
        XCTAssertTrue(app.buttons["giving.amount.25"].waitForExistence(timeout:5))
        app.swipeUp()
        app.segmentedControls["giving.frequency"].buttons["Monthly"].tap()
        app.buttons["giving.amount.50"].tap()
        XCTAssertEqual(app.staticTexts["giving.summary"].label,"$50.00")
        app.buttons["giving.amount.Other"].tap()
        app.textFields["giving.custom"].typeText("17.75")
        app.buttons["Done"].tap()
        XCTAssertEqual(app.staticTexts["giving.summary"].label,"$17.75")
        XCTAssertTrue(app.buttons["giving.continue"].isEnabled)
        let give = XCTAttachment(screenshot:app.screenshot()); give.name = "Selected monthly gift"; give.lifetime = .keepAlways; add(give)
        // Never launch a live payment during UI tests.
        app.buttons["navigation.menu"].tap(); app.buttons["tab.bible"].tap()
        app.buttons["reader.study"].tap()
        let handle = app.otherElements["study.resize"]
        XCTAssertTrue(handle.waitForExistence(timeout:5))
        let scroll = app.scrollViews["study.content"]
        func reachLastSection() {
            scroll.swipeUp(velocity:.fast) // Also lets a preceding resize animation settle.
            let y = handle.frame.midY
            let sources = app.buttons["study.sources"]
            for _ in 0..<25 {
                if sources.isHittable { break }
                scroll.swipeUp(velocity:.fast)
            }
            XCTAssertTrue(sources.isHittable,"The final study section must remain reachable at this height")
            XCTAssertEqual(handle.frame.midY,y,accuracy:4,"Scrolling study content must not resize the panel")
            for _ in 0..<25 {
                if app.buttons["Devotional"].isHittable { break }
                scroll.swipeDown(velocity:.fast)
            }
            XCTAssertTrue(app.buttons["Devotional"].isHittable,"The start of the study must remain reachable")
        }
        reachLastSection()
        let start = handle.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.5))
        start.press(forDuration:0.1,thenDragTo:start.withOffset(CGVector(dx:0,dy:155)))
        reachLastSection()
        handle.doubleTap()
        reachLastSection()
        assertStudyCoversBottom(app.screenshot())
    }

    func testRememberedScriptureSearch() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["APERIO_UI_TEST"] = "1"
        app.launchEnvironment["APERIO_UI_TEST_RESET"] = "1"
        app.launch()
        XCTAssertTrue(app.buttons["Search Scripture"].waitForExistence(timeout:20))
        app.buttons["Search Scripture"].tap()
        let field = app.searchFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout:5)); field.tap(); field.typeText("Works tested in fire")
        let result = app.buttons["search.result.45:3:13"]
        XCTAssertTrue(result.waitForExistence(timeout:10))
        let shot = XCTAttachment(screenshot:app.screenshot()); shot.name = "Remembered wording search"; shot.lifetime = .keepAlways; add(shot)
        result.tap()
        XCTAssertTrue(app.buttons["reader.bookPicker"].waitForExistence(timeout:5))
        XCTAssertTrue(app.buttons["reader.bookPicker"].label.contains("1 Corinthians"))
        XCTAssertTrue(app.buttons["verse.13"].isHittable)
    }

    func testMobileUpdatesAndResizableStudy() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["APERIO_UI_TEST"] = "1"
        app.launchEnvironment["APERIO_UI_TEST_RESET"] = "1"
        app.launchEnvironment["APERIO_TEST_STOREFRONT"] = "USA"
        app.launch()
        XCTAssertTrue(app.buttons["header.subscribe"].waitForExistence(timeout:20))
        let home = XCTAttachment(screenshot:app.screenshot()); home.name = "Refined header"; home.lifetime = .keepAlways; add(home)
        app.buttons["header.subscribe"].tap()
        XCTAssertTrue(app.textFields["subscribe.email"].waitForExistence(timeout:5))
        XCTAssertFalse(app.buttons["subscribe.submit"].isEnabled)
        app.textFields["subscribe.email"].tap(); app.textFields["subscribe.email"].typeText("reader@example.test")
        app.swipeUp()
        XCTAssertFalse(app.buttons["subscribe.submit"].isEnabled)
        app.switches["subscribe.consent"].tap()
        XCTAssertTrue(app.buttons["subscribe.submit"].isEnabled)
        // No automated signup is sent to the public database.
        app.buttons["Done"].tap()
        app.buttons["navigation.menu"].tap(); app.buttons["tab.give"].tap()
        XCTAssertTrue(app.buttons["giving.continue"].waitForExistence(timeout:5))
        let give = XCTAttachment(screenshot:app.screenshot()); give.name = "US giving"; give.lifetime = .keepAlways; add(give)
        app.buttons["navigation.menu"].tap(); app.buttons["tab.bible"].tap()
        app.buttons["reader.chapterPicker"].tap()
        XCTAssertTrue(app.buttons["picker.chapter.24"].waitForExistence(timeout:5))
        XCTAssertFalse(app.textFields["picker.bookSearch"].exists)
        app.buttons["picker.chapter.24"].tap()
        XCTAssertTrue(app.buttons["reader.chapterPicker"].label.contains("24"))
        app.buttons["reader.chapterPicker"].tap(); app.buttons["picker.chapter.23"].tap()
        app.buttons["reader.bookPicker"].tap()
        XCTAssertTrue(app.textFields["picker.bookSearch"].waitForExistence(timeout:5))
        app.buttons["Done"].tap()
        app.buttons["reader.study"].tap()
        let handle = app.otherElements["study.resize"]
        XCTAssertTrue(handle.waitForExistence(timeout:5))
        let initialY = handle.frame.midY
        XCTAssertGreaterThan(initialY,app.frame.height*0.4)
        XCTAssertLessThan(initialY,app.frame.height*0.78)
        assertStudyCoversBottom(app.screenshot())
        let half = XCTAttachment(screenshot:app.screenshot()); half.name = "Half-height Study Center"; half.lifetime = .keepAlways; add(half)
        let start = handle.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.5))
        start.press(forDuration:0.1,thenDragTo:start.withOffset(CGVector(dx:0,dy:-180)))
        XCTAssertLessThan(handle.frame.midY,initialY-100)
        let raisedY = handle.frame.midY
        let raised = handle.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.5))
        raised.press(forDuration:0.1,thenDragTo:raised.withOffset(CGVector(dx:0,dy:140)))
        XCTAssertGreaterThan(handle.frame.midY,raisedY+80)
        assertStudyCoversBottom(app.screenshot())
        app.buttons["Close Study Center"].tap()
        XCTAssertTrue(handle.waitForNonExistence(timeout:3))
        app.buttons["reader.study"].tap()
        XCTAssertTrue(handle.waitForExistence(timeout:5))
        XCTAssertEqual(handle.frame.midY,initialY,accuracy:5)
        handle.doubleTap()
        XCTAssertTrue(app.buttons["navigation.menu"].isHittable)
        assertStudyCoversBottom(app.screenshot())
        app.terminate()
        app.launchEnvironment["APERIO_TEST_STOREFRONT"] = "GBR"
        app.launch()
        XCTAssertTrue(app.buttons["navigation.menu"].waitForExistence(timeout:20))
        app.buttons["navigation.menu"].tap()
        XCTAssertFalse(app.buttons["tab.give"].exists,"External giving must not appear outside the US storefront")
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        XCTAssertTrue(app.buttons["tab.home"].waitForExistence(timeout:5))
        XCTAssertTrue(app.buttons["tab.home"].isHittable)
        app.scrollViews.containing(.button,identifier:"tab.home").firstMatch.swipeUp()
        XCTAssertTrue(app.buttons["Settings"].isHittable,"The expanded menu must scroll on short screens")
    }

    func testAppStoreScreenshots() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["APERIO_UI_TEST"] = "1"
        app.launchEnvironment["APERIO_UI_TEST_RESET"] = "1"
        app.launch()
        XCTAssertTrue(app.buttons["navigation.menu"].waitForExistence(timeout:20))
        func capture(_ name:String) {
            let shot = XCTAttachment(screenshot:app.screenshot())
            shot.name = name; shot.lifetime = .keepAlways; add(shot)
        }
        capture("01-home")
        app.buttons["navigation.menu"].tap(); app.buttons["tab.bible"].tap()
        XCTAssertTrue(app.buttons["reader.study"].waitForExistence(timeout:10))
        capture("02-bible")
        app.buttons["reader.study"].tap()
        XCTAssertTrue(app.buttons["study.Lexicon"].waitForExistence(timeout:5))
        app.otherElements["study.resize"].doubleTap()
        capture("03-commentary")
        app.buttons["study.Lexicon"].tap()
        let phrase = app.buttons.containing(.staticText,identifier:"A Psalm").firstMatch
        XCTAssertTrue(phrase.waitForExistence(timeout:5)); phrase.tap()
        XCTAssertTrue(app.buttons["Back to Lexicon"].waitForExistence(timeout:5))
        capture("04-lexicon")
    }

    func testNativeReadingStudyAndPersonalData() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchEnvironment["APERIO_UI_TEST"] = "1"
        app.launchEnvironment["APERIO_UI_TEST_RESET"] = "1"
        app.launch()
        app.launchEnvironment["APERIO_UI_TEST_RESET"] = "0"
        XCTAssertTrue(app.buttons["navigation.menu"].waitForExistence(timeout:20))
        app.buttons["navigation.menu"].tap(); app.buttons["tab.bible"].tap()
        XCTAssertTrue(app.buttons["reader.study"].waitForExistence(timeout:10))
        let reader = XCTAttachment(screenshot:app.screenshot()); reader.name = "Floating Study Center pill"; reader.lifetime = .keepAlways; add(reader)
        app.buttons["navigation.menu"].tap()
        XCTAssertTrue(app.buttons["tab.home"].isHittable)
        let menu = XCTAttachment(screenshot:app.screenshot()); menu.name = "Expanded floating menu"; menu.lifetime = .keepAlways; add(menu)
        app.buttons["navigation.menu"].tap()
        app.buttons["reader.study"].tap()
        XCTAssertTrue(app.buttons["study.Lexicon"].waitForExistence(timeout:5))
        app.otherElements["study.resize"].doubleTap()
        XCTAssertTrue(app.buttons["navigation.menu"].isHittable,"Floating navigation must remain usable in Study Center")
        XCTAssertFalse(app.buttons["verse.5"].exists,"Covered Scripture must not remain exposed to VoiceOver")
        assertStudyCoversBottom(app.screenshot())
        app.buttons["navigation.menu"].tap()
        XCTAssertTrue(app.buttons["tab.home"].isHittable)
        app.buttons["navigation.menu"].tap()
        app.buttons["study.Lexicon"].tap()
        XCTAssertTrue(app.staticTexts["The words behind the Word."].exists)
        let firstPhrase = app.buttons.containing(.staticText,identifier:"A Psalm").firstMatch
        XCTAssertTrue(firstPhrase.waitForExistence(timeout:5))
        firstPhrase.tap()
        XCTAssertTrue(app.buttons["Back to Lexicon"].waitForExistence(timeout:5))
        let study = XCTAttachment(screenshot:app.screenshot()); study.name = "Hebrew word study"; study.lifetime = .keepAlways; add(study)
        assertStudyCoversBottom(app.screenshot())
        app.buttons["Back to Lexicon"].tap()
        app.buttons["Close Study Center"].tap()
        app.buttons["verse.1"].tap()
        let note = app.textViews["note.editor"]
        XCTAssertTrue(note.waitForExistence(timeout:5)); note.tap(); note.typeText("A quiet reminder from the native test.")
        app.buttons["olive highlight"].tap()
        app.buttons["Save"].tap()
        app.buttons["navigation.menu"].tap(); app.buttons["tab.saved"].tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@","A quiet reminder")).firstMatch.waitForExistence(timeout:5))
        app.buttons["navigation.menu"].tap(); app.buttons["tab.prayer"].tap()
        app.buttons["Write a prayer"].tap()
        let title = app.textFields["prayer.title"]; XCTAssertTrue(title.waitForExistence(timeout:5)); title.tap(); title.typeText("A prayer for today")
        let body = app.textViews["prayer.body"]; body.tap(); body.typeText("Thank you for the gift of this day.")
        app.buttons["Save"].tap()
        XCTAssertTrue(app.staticTexts["A prayer for today"].waitForExistence(timeout:5))
        let attachment = XCTAttachment(screenshot:app.screenshot()); attachment.name = "Native prayer journal"; attachment.lifetime = .keepAlways; add(attachment)
        app.terminate(); app.launch()
        app.buttons["navigation.menu"].tap(); app.buttons["tab.saved"].tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format:"label CONTAINS %@","A quiet reminder")).firstMatch.waitForExistence(timeout:5))
        app.buttons["navigation.menu"].tap(); app.buttons["tab.bible"].tap()
        app.buttons["reader.bookPicker"].tap()
        let genesis = app.buttons.containing(.staticText,identifier:"Genesis").firstMatch
        XCTAssertTrue(genesis.waitForExistence(timeout:5)); genesis.tap()
        app.buttons["Introduction to Genesis"].tap()
        XCTAssertTrue(app.staticTexts["A Beginning Larger Than One Family"].waitForExistence(timeout:5))
        XCTAssertTrue(app.buttons["navigation.menu"].isHittable)
        let intro = XCTAttachment(screenshot:app.screenshot()); intro.name = "Book introduction"; intro.lifetime = .keepAlways; add(intro)
    }

    private func assertStudyCoversBottom(_ screenshot:XCUIScreenshot,file:StaticString = #filePath,line:UInt = #line) {
        guard let image = screenshot.image.cgImage else { return XCTFail("Missing screenshot",file:file,line:line) }
        // Sample the bottom safe area away from the home indicator. The reported
        // regression left a white strip with Scripture visible in this band.
        for fraction in [0.08,0.25,0.75,0.92] {
            let rect = CGRect(x:Int(Double(image.width)*fraction),y:image.height-8,width:1,height:1)
            guard let pixel = image.cropping(to:rect) else { return XCTFail("Missing bottom pixel",file:file,line:line) }
            var rgba = [UInt8](repeating:0,count:4)
            let rendered = rgba.withUnsafeMutableBytes { bytes -> Bool in
                guard let context = CGContext(data:bytes.baseAddress,width:1,height:1,bitsPerComponent:8,bytesPerRow:4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue) else { return false }
                context.draw(pixel,in:CGRect(x:0,y:0,width:1,height:1)); return true
            }
            XCTAssertTrue(rendered,file:file,line:line)
            XCTAssertTrue(rgba.prefix(3).allSatisfy { (40...68).contains(Int($0)) },"Study Center must cover the screen's bottom edge with graphite; found \(rgba)",file:file,line:line)
        }
    }
}
