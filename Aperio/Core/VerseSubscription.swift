import Foundation
import SwiftUI

struct VerseSubscriptionReceipt: Codable {
    var id = UUID().uuidString.lowercased()
    var token = (UUID().uuidString + UUID().uuidString).replacingOccurrences(of:"-",with:"").lowercased()
    var email: String
    var name: String
    var status = "draft"
    var preference: VerseEmailPreference? = .verseOnly
}

struct VerseSubscriptionResponse: Decodable {
    var status: String?
    var message: String?
    var error: String?
}

enum VerseEmailPreference: String, Codable, CaseIterable {
    case verseOnly = "verse_only", verseAndUpdates = "verse_and_updates"
    var title: String { self == .verseOnly ? "Just Verse of the Day" : "Verse of the Day, updates & more" }
    var detail: String { self == .verseOnly ? "A daily Scripture in your inbox." : "Daily Scripture, new features, and occasional Aperio news." }
}

enum VerseEmail {
    static func normalized(_ value:String) -> String { value.trimmingCharacters(in:.whitespacesAndNewlines).lowercased() }
    static func isValid(_ value:String) -> Bool {
        let email = normalized(value)
        return email.count <= 254 && email.range(of:#"^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$"#,options:[.caseInsensitive,.regularExpression]) != nil
    }
}

@MainActor final class VerseSubscriptionStore: ObservableObject {
    @Published private(set) var receipt: VerseSubscriptionReceipt?
    @Published private(set) var busy = false
    @Published var message: String?
    @Published var error: String?
    private let file: URL
    private let baseURL: URL
    private let session: URLSession
    private var writable = true

    init(directory:URL? = nil,baseURL:URL = URL(string:"https://aperiobible.com")!,session:URLSession = .shared) {
        let root = directory ?? FileManager.default.urls(for:.applicationSupportDirectory,in:.userDomainMask)[0].appendingPathComponent("Aperio")
        self.file = root.appendingPathComponent("verse-subscription.json")
        self.baseURL = baseURL
        self.session = session
        do {
            try FileManager.default.createDirectory(at:root,withIntermediateDirectories:true)
            if FileManager.default.fileExists(atPath:file.path) { receipt = try JSONDecoder().decode(VerseSubscriptionReceipt.self,from:Data(contentsOf:file)) }
        } catch { writable = false; self.error = "Your saved email preference couldn’t be opened. Contact support before making changes." }
    }

    func subscribe(email:String,name:String,consent:Bool,preference:VerseEmailPreference = .verseOnly) async {
        guard !busy,writable else { return }
        guard consent,VerseEmail.isValid(email) else { error = "Enter a valid email and agree to receive Verse of the Day."; return }
        busy = true; error = nil; message = nil
        defer { busy = false }
        do {
            let normalized = VerseEmail.normalized(email)
            if let previous = receipt,previous.email != normalized {
                throw SubscriptionError(message:"Remove your previous signup request before choosing a different email.")
            }
            var next = receipt?.email == normalized ? receipt! : VerseSubscriptionReceipt(email:normalized,name:String(name.trimmingCharacters(in:.whitespacesAndNewlines).prefix(60)))
            next.preference = preference
            // Keep the same request credentials across retries, including a lost response.
            try save(next)
            let result = try await request("subscribe",body:["id":next.id,"token":next.token,"email":next.email,"name":next.name,"consent":true,"consentVersion":"verse-preferences-2026-10-12","preference":preference.rawValue,"source":"ios"])
            guard let status = result.status,["pending","confirmation_sent","active"].contains(status) else { throw URLError(.cannotParseResponse) }
            var saved = next; saved.status = status; try save(saved)
            message = result.message
        } catch { self.error = (error as? SubscriptionError)?.message ?? "We couldn’t confirm your signup. Check your connection and try again; your email is kept here for retry." }
    }

    func cancel() async {
        guard !busy,writable,let receipt else { return }
        busy = true; error = nil; message = nil
        defer { busy = false }
        do {
            let result = try await request("cancel",body:["id":receipt.id,"token":receipt.token])
            guard result.status == "removed" else { throw URLError(.cannotParseResponse) }
            try FileManager.default.removeItem(at:file)
            self.receipt = nil
            message = "Your signup request has been removed."
        } catch { self.error = (error as? SubscriptionError)?.message ?? "We couldn’t confirm removal. Please try again when you’re online." }
    }

    private func save(_ receipt:VerseSubscriptionReceipt) throws {
        try JSONEncoder().encode(receipt).write(to:file,options:[.atomic,.completeFileProtectionUntilFirstUserAuthentication])
        self.receipt = receipt
    }
    private func request(_ action:String,body:[String:Any]) async throws -> VerseSubscriptionResponse {
        var request = URLRequest(url:baseURL.appendingPathComponent("api/verse-email/"+action))
        request.httpMethod = "POST"; request.timeoutInterval = 25
        request.setValue("application/json",forHTTPHeaderField:"Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject:body)
        let (data,response) = try await session.data(for:request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        let decoded = try JSONDecoder().decode(VerseSubscriptionResponse.self,from:data)
        guard (200..<300).contains(http.statusCode) else { throw SubscriptionError(message:decoded.error ?? "Email signup is temporarily unavailable.") }
        return decoded
    }
    private struct SubscriptionError: Error { let message: String }
}
