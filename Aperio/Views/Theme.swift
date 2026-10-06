import SwiftUI

enum Theme {
    static let paper = Color(hex:0xFAF9F6), ink = Color(hex:0x252826), graphite = Color(hex:0x303536)
    static let olive = Color(hex:0x536143), sage = Color(hex:0xCDD6B8), muted = Color(hex:0x676B63), line = Color(hex:0xDFDFD5)
    static func serif(_ size: CGFloat) -> Font { .custom("Georgia",size:size,relativeTo:.body) }
}
extension Color {
    init(hex: UInt32) { self.init(red:Double((hex>>16)&255)/255,green:Double((hex>>8)&255)/255,blue:Double(hex&255)/255) }
}
struct Eyebrow: View {
    let text: String; var light = false
    var body: some View { Text(text.uppercased()).font(.system(.caption,design:.rounded).weight(.bold)).tracking(2).foregroundStyle(light ? Theme.sage : Theme.olive) }
}
struct AperioButton: ButtonStyle {
    var light = false
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(.system(.subheadline).weight(.semibold)).padding(.horizontal,20).padding(.vertical,15).frame(minHeight:48)
            .foregroundStyle(light ? Theme.graphite : Theme.paper).background(light ? Theme.sage : Theme.graphite,in:RoundedRectangle(cornerRadius:12))
            .opacity(configuration.isPressed ? 0.78 : 1)
    }
}
struct ReadingText: View {
    let text: String; var size: CGFloat = 18
    var body: some View {
        Text((try? AttributedString(markdown:text,options:.init(interpretedSyntax:.inlineOnlyPreservingWhitespace))) ?? AttributedString(text))
            .font(Theme.serif(size)).lineSpacing(7).textSelection(.enabled).frame(maxWidth:.infinity,alignment:.leading)
    }
}
struct EmptyState: View {
    let title: String; let detail: String; let icon: String
    var body: some View { VStack(spacing:18) { Image(systemName:icon).font(.system(size:32,weight:.light)).foregroundStyle(Theme.olive); Text(title).font(Theme.serif(26)); Text(detail).font(.subheadline).foregroundStyle(Theme.muted).multilineTextAlignment(.center) }.frame(maxWidth:.infinity).padding(.vertical,50).padding(.horizontal,24) }
}
