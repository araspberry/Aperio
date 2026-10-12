import XCTest
@testable import AperioCore

private final class SignupProtocol: URLProtocol {
    static var handler: ((URLRequest) throws -> (Int,Data))?
    override class func canInit(with request:URLRequest) -> Bool { true }
    override class func canonicalRequest(for request:URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            let (status,data) = try Self.handler!(request)
            client?.urlProtocol(self,didReceive:HTTPURLResponse(url:request.url!,statusCode:status,httpVersion:nil,headerFields:["Content-Type":"application/json"])!,cacheStoragePolicy:.notAllowed)
            client?.urlProtocol(self,didLoad:data); client?.urlProtocolDidFinishLoading(self)
        } catch { client?.urlProtocol(self,didFailWithError:error) }
    }
    override func stopLoading() {}
}

final class VerseSubscriptionTests: XCTestCase {
    func testEmailValidation() {
        for value in ["reader@example.test"," NAME+verse@example.com ","name.last@example.co.uk"] { XCTAssertTrue(VerseEmail.isValid(value),value) }
        for value in ["", "reader", "a@", "a@b", "a @b.com", "a@b..com", "a\nb@c.com"] { XCTAssertFalse(VerseEmail.isValid(value),value) }
    }
    @MainActor func testConsentPersistenceRetryAndRemoval() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at:directory); SignupProtocol.handler = nil }
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [SignupProtocol.self]
        let session = URLSession(configuration:config)
        let store = VerseSubscriptionStore(directory:directory,baseURL:URL(string:"https://signup.example.test")!,session:session)
        var calls = 0
        SignupProtocol.handler = { _ in calls += 1; throw URLError(.notConnectedToInternet) }
        await store.subscribe(email:"reader@example.test",name:"Reader",consent:false)
        XCTAssertEqual(calls,0); XCTAssertNil(store.receipt)
        await store.subscribe(email:"reader@example.test",name:"Reader",consent:true)
        XCTAssertEqual(calls,1); XCTAssertNotNil(store.error)
        let receipt = try XCTUnwrap(store.receipt)
        XCTAssertEqual(receipt.status,"draft")
        let reopened = VerseSubscriptionStore(directory:directory,baseURL:URL(string:"https://signup.example.test")!,session:session)
        XCTAssertEqual(reopened.receipt?.id,receipt.id)
        XCTAssertEqual(reopened.receipt?.token,receipt.token)
        SignupProtocol.handler = { request in
            calls += 1
            XCTAssertEqual(request.httpMethod,"POST")
            XCTAssertEqual(request.url?.path,"/api/verse-email/subscribe")
            return (202,Data(#"{"status":"pending","message":"Delivery is being prepared."}"#.utf8))
        }
        await reopened.subscribe(email:"reader@example.test",name:"Reader",consent:true,preference:.verseAndUpdates)
        XCTAssertNil(reopened.error); XCTAssertEqual(reopened.receipt?.status,"pending"); XCTAssertEqual(reopened.receipt?.preference,.verseAndUpdates)
        XCTAssertEqual(reopened.receipt?.id,receipt.id)
        let before = calls
        await reopened.subscribe(email:"different@example.test",name:"Reader",consent:true)
        XCTAssertEqual(calls,before); XCTAssertNotNil(reopened.error)
        SignupProtocol.handler = { _ in (503,Data(#"{"error":"Please retry."}"#.utf8)) }
        await reopened.cancel()
        XCTAssertNotNil(reopened.receipt); XCTAssertNotNil(reopened.error)
        SignupProtocol.handler = { request in
            XCTAssertEqual(request.url?.path,"/api/verse-email/cancel")
            return (200,Data(#"{"status":"removed"}"#.utf8))
        }
        await reopened.cancel()
        XCTAssertNil(reopened.receipt); XCTAssertNil(reopened.error)
        XCTAssertFalse(FileManager.default.fileExists(atPath:directory.appendingPathComponent("verse-subscription.json").path))
    }
}
