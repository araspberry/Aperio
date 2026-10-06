import SwiftUI
import AVKit

struct HomeView: View {
    let library: ContentLibrary
    @EnvironmentObject var personal: PersonalStore
    @EnvironmentObject var navigation: NavigationState
    @State private var allThreads = false
    @State private var quiz = false
    private var daily: DailyReading { library.daily() }
    private var greeting: String {
        let hour = Calendar.current.component(.hour,from:Date())
        let salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
        return salutation + (personal.data.name.isEmpty ? "." : ", \(personal.data.name).")
    }
    private var journeys: [Journey] {
        if allThreads { return library.home.journeys }
        let ids = ["wisdom","prayer","mercy"]
        return ids.compactMap { id in library.home.journeys.first { $0.id == id } }
    }
    var body: some View {
        ScrollView {
            LazyVStack(alignment:.leading,spacing:28) {
                VStack(alignment:.leading,spacing:10) {
                    Text(Date(),format:.dateTime.weekday(.wide).month(.wide).day()).font(.caption).textCase(.uppercase).tracking(1.4).foregroundStyle(Theme.muted)
                    Text(greeting).font(Theme.serif(35)).tracking(-1)
                    Text("A little space for what matters.").font(.subheadline).foregroundStyle(Theme.muted)
                }.padding(.top,14)
                VStack(alignment:.leading,spacing:18) {
                    HStack { Eyebrow(text:"Scripture of the day"); Spacer(); Image(systemName:"sun.horizon").foregroundStyle(Theme.olive) }
                    Text(daily.theme).font(Theme.serif(29))
                    ReadingText(text:library.verses(daily.passage).first { $0.v == daily.verse }?.t ?? "",size:23)
                    Text(daily.reference + " · BSB").font(.caption.weight(.semibold)).foregroundStyle(Theme.olive)
                    Text(daily.reflection).font(.subheadline).lineSpacing(5).foregroundStyle(Theme.muted)
                    Button { personal.update { $0.activeJourney = nil }; navigation.read(daily.passage) } label:{ Label("Read in context",systemImage:"arrow.right").labelStyle(.titleAndIcon) }.buttonStyle(AperioButton())
                }.padding(24).frame(maxWidth:.infinity,alignment:.leading).background(.white.opacity(0.75),in:RoundedRectangle(cornerRadius:22)).overlay { RoundedRectangle(cornerRadius:22).stroke(Theme.line,lineWidth:1) }
                Button { navigation.read(personal.data.passage) } label: {
                    VStack(alignment:.leading,spacing:12) {
                        Eyebrow(text:"Your place in the Word",light:true)
                        HStack { Text(library.name(personal.data.passage)).font(Theme.serif(29)); Spacer(); Image(systemName:"arrow.up.right").font(.title3) }
                        Text("Continue reading").font(.subheadline).foregroundStyle(Theme.sage)
                    }.padding(24).frame(maxWidth:.infinity,alignment:.leading).foregroundStyle(Theme.paper).background(Theme.graphite,in:RoundedRectangle(cornerRadius:20))
                }.buttonStyle(.plain)
                HStack(alignment:.firstTextBaseline) {
                    Text("Follow a thread.").font(Theme.serif(29)).tracking(-0.7)
                    Spacer()
                    Button(allThreads ? "Featured" : "All threads") { allThreads.toggle() }.font(.caption.weight(.semibold)).padding(.vertical,12)
                }
                ForEach(journeys) { journey in
                    Button { start(journey) } label: {
                        ZStack(alignment:.bottomLeading) {
                            MotionCover(url:library.root.appendingPathComponent(journey.video),poster:library.root.appendingPathComponent(journey.poster)).frame(height:300).clipped()
                            LinearGradient(colors:[.clear,Theme.graphite.opacity(0.3),Theme.graphite.opacity(0.98)],startPoint:.top,endPoint:.bottom)
                            VStack(alignment:.leading,spacing:10) {
                                Eyebrow(text:journey.tag,light:true)
                                Text(journey.title).font(Theme.serif(29)).tracking(-0.5)
                                Text(journey.description).font(.subheadline).lineSpacing(3)
                                Divider().overlay(Theme.paper.opacity(0.25)).padding(.vertical,6)
                                HStack { Text((personal.data.journeyProgress[journey.id] ?? 0) > 0 ? "Keep following" : "Explore this thread").font(.caption.weight(.bold)); Spacer(); Image(systemName:"arrow.right") }.foregroundStyle(Theme.sage)
                            }.padding(23).foregroundStyle(.white)
                        }.frame(height:300).clipShape(RoundedRectangle(cornerRadius:20))
                    }.buttonStyle(.plain)
                }
                VStack(alignment:.leading,spacing:15) {
                    Eyebrow(text:"A little discovery")
                    Text("Look a little closer.").font(Theme.serif(28))
                    Text("Three questions, a fresh detail, and something to carry into your day.").font(.subheadline).lineSpacing(4).foregroundStyle(Theme.muted)
                    Button("Try today’s quiz") { quiz = true }.buttonStyle(AperioButton())
                }.padding(24).frame(maxWidth:.infinity,alignment:.leading).background(Theme.sage.opacity(0.23),in:RoundedRectangle(cornerRadius:20))
                VStack(alignment:.leading,spacing:14) {
                    Eyebrow(text:"A quiet space")
                    Text("Bring what’s on your heart.").font(Theme.serif(28))
                    Text(daily.prayerPrompt).font(Theme.serif(20)).lineSpacing(5)
                    Button("Open your prayer journal") { navigation.tab = 2 }.font(.subheadline.weight(.semibold)).padding(.vertical,8)
                }.padding(.vertical,12)
            }.padding(.horizontal,23).padding(.bottom,28)
        }.sheet(isPresented:$quiz) { QuizView(daily:daily,library:library).environmentObject(navigation) }
    }
    private func start(_ journey: Journey) {
        let index = min(personal.data.journeyProgress[journey.id] ?? 0,journey.steps.count-1)
        let step = journey.steps[index]
        personal.update { $0.activeJourney = journey.id }
        if let p = library.passage(book:step.book,chapter:step.chapter,verse:step.verse) { navigation.read(p) }
    }
}
struct MotionCover: View {
    let url: URL; let poster: URL
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @Environment(\.scenePhase) var scenePhase
    @State private var player: AVQueuePlayer?
    @State private var looper: AVPlayerLooper?
    var body: some View {
        ZStack {
            if let image = UIImage(contentsOfFile:poster.path) { Image(uiImage:image).resizable().scaledToFill() }
            if let player, !reduceMotion { MovieLayer(player:player) }
        }.accessibilityHidden(true).onAppear {
            guard !reduceMotion, player == nil else { return }
            let queue = AVQueuePlayer(); queue.isMuted = true
            looper = AVPlayerLooper(player:queue,templateItem:AVPlayerItem(url:url)); player = queue; queue.play()
        }.onDisappear { player?.pause(); player = nil; looper = nil }
            .onChange(of:scenePhase) { _,phase in phase == .active && !reduceMotion ? player?.play() : player?.pause() }
            .onChange(of:reduceMotion) { _,reduce in reduce ? player?.pause() : player?.play() }
    }
}
struct MovieLayer: UIViewRepresentable {
    let player: AVPlayer
    class PlayerView: UIView {
        override class var layerClass: AnyClass { AVPlayerLayer.self }
        var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
    }
    func makeUIView(context:Context)->PlayerView { let view = PlayerView(); view.playerLayer.videoGravity = .resizeAspectFill; view.playerLayer.player = player; view.isUserInteractionEnabled = false; return view }
    func updateUIView(_ view:PlayerView,context:Context) { view.playerLayer.player = player }
}
struct QuizView: View {
    let daily: DailyReading; let library: ContentLibrary
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var personal: PersonalStore
    @EnvironmentObject var navigation: NavigationState
    @State private var answers = [Int:Int]()
    var body: some View {
        NavigationStack {
            ScrollView { VStack(alignment:.leading,spacing:25) {
                Eyebrow(text:daily.reference)
                Text("Look a little closer.").font(Theme.serif(32))
                ForEach(Array(daily.questions.enumerated()),id:\.offset) { index,question in
                    VStack(alignment:.leading,spacing:14) {
                        Text("\(index+1). \(question.prompt)").font(Theme.serif(22))
                        ForEach(question.options.indices,id:\.self) { option in
                            Button { guard answers[index] == nil else { return }; answers[index] = option
                                if answers.count == daily.questions.count { personal.update { $0.quizScores[daily.id] = answers.filter { daily.questions[$0.key].answer == $0.value }.count } }
                            } label: {
                                HStack { Text(question.options[option]).multilineTextAlignment(.leading); Spacer(); if answers[index] != nil && option == question.answer { Image(systemName:"checkmark.circle.fill") } }
                                    .padding(15).frame(maxWidth:.infinity,alignment:.leading).background(answers[index] == option ? Theme.sage : .white,in:RoundedRectangle(cornerRadius:12))
                            }.buttonStyle(.plain)
                        }
                        if answers[index] != nil { Text(question.explanation).font(.subheadline).lineSpacing(5).foregroundStyle(Theme.muted) }
                    }
                }
                Button("Return to the passage") { navigation.read(daily.passage); dismiss() }.buttonStyle(AperioButton())
            }.padding(24) }.background(Theme.paper).navigationTitle("Today’s discovery").navigationBarTitleDisplayMode(.inline).toolbar { ToolbarItem(placement:.confirmationAction) { Button("Done") { dismiss() } } }
        }.tint(Theme.olive)
    }
}
