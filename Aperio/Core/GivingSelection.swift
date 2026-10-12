import Foundation

struct GivingSelection: Equatable {
    enum Frequency: String, CaseIterable { case once, monthly }
    let amount: Int
    let frequency: Frequency
    let attemptID: UUID
    init?(dollars:String,frequency:Frequency,attemptID:UUID = UUID()) {
        let value = dollars.trimmingCharacters(in:.whitespacesAndNewlines)
        guard value.range(of:#"^\d{1,5}(?:\.\d{1,2})?$"#,options:.regularExpression) != nil else { return nil }
        let parts = value.split(separator:".")
        guard let whole = Int(parts[0]) else { return nil }
        let decimal = parts.count == 2 ? String(parts[1]) : ""
        let cents = whole*100+(Int(decimal.padding(toLength:2,withPad:"0",startingAt:0)) ?? 0)
        guard (100...1_000_000).contains(cents) else { return nil }
        self.amount = cents; self.frequency = frequency; self.attemptID = attemptID
    }
    var formattedAmount: String { (Double(amount)/100).formatted(.currency(code:"USD")) }
    var checkoutURL: URL {
        var url = URLComponents(string:"https://aperiobible.com/")!
        url.queryItems = [URLQueryItem(name:"gift_source",value:"ios"),URLQueryItem(name:"gift_amount",value:String(amount)),URLQueryItem(name:"gift_frequency",value:frequency.rawValue),URLQueryItem(name:"gift_attempt",value:attemptID.uuidString.lowercased())]
        url.fragment = "give"
        return url.url!
    }
}
