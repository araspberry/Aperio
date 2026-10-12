import XCTest
@testable import AperioCore

final class GivingSelectionTests: XCTestCase {
    func testExactCentsAndFixedDestination() throws {
        let attempt = UUID()
        for frequency in GivingSelection.Frequency.allCases {
            for (input,cents) in [("5",500),("10",1000),("25",2500),("50",5000),("100",10000),("17.75",1775),("1",100),("10000.00",1000000)] {
                let choice = try XCTUnwrap(GivingSelection(dollars:input,frequency:frequency,attemptID:attempt))
                XCTAssertEqual(choice.amount,cents)
                let url = try XCTUnwrap(URLComponents(url:choice.checkoutURL,resolvingAgainstBaseURL:false))
                XCTAssertEqual(url.scheme,"https"); XCTAssertEqual(url.host,"aperiobible.com"); XCTAssertEqual(url.fragment,"give")
                let values = Dictionary(uniqueKeysWithValues:url.queryItems!.map { ($0.name,$0.value!) })
                XCTAssertEqual(values["gift_amount"],String(cents)); XCTAssertEqual(values["gift_frequency"],frequency.rawValue)
                XCTAssertEqual(values["gift_attempt"],attempt.uuidString.lowercased())
                XCTAssertEqual(choice.checkoutURL,GivingSelection(dollars:input,frequency:frequency,attemptID:attempt)?.checkoutURL)
            }
        }
    }
    func testInvalidAmountsCannotOpenCheckout() {
        for input in ["", "0", "0.99", "10000.01", "-5", "17.755", "1e3", "NaN", "$25", "25,00", "25&redirect=https://other.test"] {
            XCTAssertNil(GivingSelection(dollars:input,frequency:.once),input)
        }
    }
}
