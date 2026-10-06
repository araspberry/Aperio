import XCTest
import UIKit

final class AperioUITests: XCTestCase {
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
