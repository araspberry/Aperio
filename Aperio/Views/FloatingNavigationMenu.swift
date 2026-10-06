import SwiftUI

struct FloatingNavigationMenu: View {
    @Binding var open: Bool
    let onSearch: () -> Void
    let onSettings: () -> Void
    @EnvironmentObject var navigation: NavigationState
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    var body: some View {
        VStack(alignment:.trailing,spacing:14) {
            if open {
                VStack(alignment:.leading,spacing:4) {
                    Eyebrow(text:"Where to?").padding(.horizontal,16).padding(.top,10).padding(.bottom,6)
                    item("Home","house",0)
                    item("Bible","book",1)
                    item("Prayer","hands.sparkles",2)
                    item("Saved","bookmark",3)
                    item("Account","person.crop.circle",4)
                    Divider().padding(.horizontal,14).padding(.vertical,4)
                    action("Search Scripture","magnifyingglass",onSearch)
                    action("Settings","slider.horizontal.3",onSettings)
                }.padding(8).frame(width:230).background(Theme.paper,in:RoundedRectangle(cornerRadius:25))
                    .overlay { RoundedRectangle(cornerRadius:25).strokeBorder(Theme.line,lineWidth:1) }
                    .shadow(color:.black.opacity(0.16),radius:24,y:8)
                    .transition(.scale(scale:0.92,anchor:.bottomTrailing).combined(with:.opacity))
                    .accessibilityElement(children:.contain).accessibilityLabel("Aperio navigation")
            }
            Button { open.toggle() } label: {
                Image(systemName:"plus").font(.system(size:27,weight:.regular)).rotationEffect(.degrees(open ? 45 : 0))
                    .foregroundStyle(Theme.paper).frame(width:60,height:60).background(Theme.graphite,in:Circle())
                    .overlay { Circle().strokeBorder(Theme.sage.opacity(0.5),lineWidth:1) }.shadow(color:.black.opacity(0.22),radius:12,y:5)
            }.buttonStyle(.plain).accessibilityIdentifier("navigation.menu").accessibilityLabel(open ? "Close menu" : "Open menu")
                .accessibilityValue(open ? "Expanded" : "Collapsed")
        }.animation(reduceMotion ? nil : .spring(response:0.28,dampingFraction:0.86),value:open)
    }
    func item(_ label:String,_ icon:String,_ tab:Int) -> some View {
        Button { navigation.tab = tab; navigation.study = false; open = false } label: {
            HStack(spacing:13) {
                Image(systemName:icon).font(.system(size:19)).frame(width:33,height:33).background(Theme.sage.opacity(0.28),in:Circle())
                Text(label).font(.subheadline.weight(navigation.tab == tab ? .semibold : .regular))
                Spacer()
                if navigation.tab == tab { Circle().fill(Theme.olive).frame(width:5,height:5) }
            }.foregroundStyle(Theme.graphite).padding(.horizontal,10).padding(.vertical,7).background(navigation.tab == tab ? Theme.sage.opacity(0.4) : .clear,in:RoundedRectangle(cornerRadius:16)).contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityIdentifier("tab.\(label.lowercased())").accessibilityAddTraits(navigation.tab == tab ? .isSelected : [])
    }
    func action(_ label:String,_ icon:String,_ perform:@escaping ()->Void) -> some View {
        Button { open = false; perform() } label: {
            HStack(spacing:13) { Image(systemName:icon).frame(width:33,height:33); Text(label).font(.subheadline); Spacer() }.foregroundStyle(Theme.muted).padding(.horizontal,10).padding(.vertical,5).contentShape(Rectangle())
        }.buttonStyle(.plain)
    }
}
