import Foundation

/// A local, immutable index of the bundled translation. Results always contain
/// Scripture, never generated paraphrases. Constructed off the main thread.
struct ScriptureSearchIndex: Sendable {
    private struct Document: Sendable {
        let result: SearchResult
        let phrase: String
        let terms: [String]
    }
    private let books: [BibleBook]
    private let documents: [Document]
    private let postings: [String: [Int]]
    private let vocabulary: [String]

    init(books: [BibleBook]) {
        self.books = books
        var docs = [Document](), index = [String:[Int]]()
        for (b, book) in books.enumerated() {
            for (c, verses) in book.chapters.enumerated() {
                for verse in verses {
                    let words = Self.words(verse.t)
                    let terms = words.map(Self.root)
                    let id = docs.count
                    for term in Set(terms) { index[term,default:[]].append(id) }
                    docs.append(Document(result:SearchResult(passage:Passage(book:b,chapter:c+1,verse:verse.v),text:verse.t,reference:"\(book.name) \(c+1):\(verse.v)"),phrase:words.joined(separator:" "),terms:terms))
                }
            }
        }
        documents = docs; postings = index; vocabulary = index.keys.sorted()
    }

    func search(_ input: String) -> [SearchResult] {
        let query = String(input.trimmingCharacters(in:.whitespacesAndNewlines).prefix(300))
        guard query.count >= 2 else { return [] }
        if let references = reference(query) { return references }
        let words = Self.words(query), phrase = words.joined(separator:" ")
        let terms = Array(Set(words.filter { !Self.stop.contains($0) }.map(Self.root))).sorted()
        guard !terms.isEmpty else { return [] }
        // Exact spelling and inflections take priority. A single typo is only
        // considered when a term does not exist anywhere in Scripture.
        let alternatives: [[String]] = terms.map { term in
            if postings[term] != nil { return [term] }
            guard term.count >= 5 else { return [] }
            return Array(vocabulary.filter { Self.oneEdit(term,$0) }.sorted {
                let a = postings[$0]?.count ?? 0, b = postings[$1]?.count ?? 0
                return a == b ? $0 < $1 : a > b
            }.prefix(3))
        }
        var candidates = Set<Int>()
        for options in alternatives { for term in options { candidates.formUnion(postings[term] ?? []) } }
        let remembered = rememberedPassages(terms:Set(terms))
        for id in remembered { candidates.insert(id) }
        var scored = [(id:Int,score:Double,related:Bool)]()
        for id in candidates {
            let doc = documents[id]
            let exact = doc.phrase.contains(phrase)
            var score = 0.0, matches = 0
            var related = false
            var positions = [Int]()
            for (i,options) in alternatives.enumerated() {
                if let term = options.first(where:{ doc.terms.contains($0) }) {
                    matches += 1
                    let frequency = postings[term]?.count ?? 1
                    let weight = log(1 + Double(documents.count)/Double(frequency))
                    let typo = term != terms[i]
                    score += weight * (typo ? 0.6 : 1)
                    related = related || typo
                    if let pos = doc.terms.firstIndex(of:term) { positions.append(pos) }
                }
            }
            let rememberedMatch = remembered.contains(id)
            let required = terms.count < 5 ? terms.count : Int(ceil(Double(terms.count)*0.8))
            guard exact || rememberedMatch || matches >= required else { continue }
            score += Double(matches)*4
            if exact { score += 80 }
            if rememberedMatch { score += 60; related = true }
            if let low = positions.min(), let high = positions.max() { score += 8 / Double(1 + high - low) }
            score /= 0.85 + 0.15 * Double(doc.terms.count) / 25
            scored.append((id,score,related || !exact))
        }
        return scored.sorted { $0.score == $1.score ? $0.id < $1.id : $0.score > $1.score }.prefix(100).map { item in
            let result = documents[item.id].result
            return SearchResult(passage:result.passage,text:result.text,reference:result.reference,match:item.related ? "Related wording" : "Phrase match")
        }
    }

    // A small editorial phrase index bridges common remembered wording that
    // crosses verse boundaries. Each entry points to the actual passage.
    private func rememberedPassages(terms: Set<String>) -> Set<Int> {
        let entries: [(phrases:[String],book:String,chapter:Int,verse:Int)] = [
            (["peace when anxious", "peace that passes understanding", "peace beyond understanding"],"Philippians",4,6),
            (["rest for the weary", "weary heavy laden", "come to me burdened"],"Matthew",11,28),
            (["faith without works dead"],"James",2,17),
            (["all things work together for good"],"Romans",8,28),
            (["love is patient love is kind"],"1 Corinthians",13,4),
            (["ask God for wisdom"],"James",1,5),
            (["armor of God", "armour of God"],"Ephesians",6,11),
            (["fruit of the spirit", "fruits of the spirit"],"Galatians",5,22),
            (["prodigal son", "lost son returns"],"Luke",15,11),
            (["good samaritan"],"Luke",10,30),
            (["woman at the well"],"John",4,7),
            (["Jesus calms the storm"],"Mark",4,39)
        ]
        guard terms.count >= 2 else { return [] }
        var result = Set<Int>()
        for entry in entries {
            let matches = entry.phrases.contains { phrase in
                let expected = Set(Self.words(phrase).filter { !Self.stop.contains($0) }.map(Self.root))
                return terms.isSubset(of:expected) && Double(terms.count)/Double(expected.count) >= 0.75
            }
            if matches, let b = books.firstIndex(where: { $0.name == entry.book }),
               let id = documents.firstIndex(where: { $0.result.passage == Passage(book:b,chapter:entry.chapter,verse:entry.verse) }) { result.insert(id) }
        }
        return result
    }

    private func reference(_ query: String) -> [SearchResult]? {
        let text = query.lowercased().replacingOccurrences(of:".",with:"").replacingOccurrences(of:"–",with:"-")
        let aliases: [String:[String]] = ["Psalm":["psalms","ps","psa"],"Genesis":["gen"],"Exodus":["ex","exod"],"Leviticus":["lev"],"Numbers":["num"],"Deuteronomy":["deut"],"Proverbs":["prov"],"Ecclesiastes":["eccl"],"Song of Solomon":["song of songs","song"],"Isaiah":["isa"],"Jeremiah":["jer"],"Matthew":["matt","mt"],"Mark":["mk"],"Luke":["lk"],"John":["jn"],"Romans":["rom"],"1 Corinthians":["1 cor","1cor","first corinthians","i corinthians"],"2 Corinthians":["2 cor","2cor","second corinthians","ii corinthians"],"Galatians":["gal"],"Ephesians":["eph"],"Philippians":["phil"],"Colossians":["col"],"1 Thessalonians":["1 thess"],"2 Thessalonians":["2 thess"],"1 Timothy":["1 tim"],"2 Timothy":["2 tim"],"Hebrews":["heb"],"James":["jas"],"1 Peter":["1 pet"],"2 Peter":["2 pet"],"1 John":["1 jn"],"2 John":["2 jn"],"3 John":["3 jn"],"Revelation":["rev","revelations"]]
        for (b,book) in books.enumerated() {
            for name in ([book.name.lowercased()] + (aliases[book.name] ?? [])).sorted(by: { $0.count > $1.count }) {
                guard text.hasPrefix(name) else { continue }
                let suffix = String(text.dropFirst(name.count))
                guard suffix.isEmpty || suffix.first?.isWhitespace == true || suffix.first?.isNumber == true else { continue }
                let rest = suffix.trimmingCharacters(in:.whitespaces)
                if rest.isEmpty { return Array(documents.filter { $0.result.passage.book == b }.prefix(100).map(\.result)) }
                guard rest.first?.isNumber == true else { continue }
                let pieces = rest.replacingOccurrences(of:" ",with:"").split(separator:":",omittingEmptySubsequences:false)
                guard pieces.count <= 2, let chapter = Int(pieces[0]), chapter > 0, chapter <= book.chapters.count else { return [] }
                var start:Int? = nil, end:Int? = nil
                if pieces.count == 2 {
                    let range = pieces[1].split(separator:"-",omittingEmptySubsequences:false)
                    guard (1...2).contains(range.count), let first = Int(range[0]), first > 0 else { return [] }
                    start = first; end = range.count == 2 ? Int(range[1]) : first
                    guard let last = end, last >= first, book.chapters[chapter-1].contains(where: { $0.v == first }),book.chapters[chapter-1].contains(where: { $0.v == last }) else { return [] }
                }
                return Array(documents.filter { doc in
                    let p = doc.result.passage
                    return p.book == b && p.chapter == chapter && (start == nil || (p.verse >= start! && p.verse <= end!))
                }.prefix(100).map(\.result))
            }
        }
        return nil
    }

    private static func words(_ text:String) -> [String] {
        text.folding(options:[.caseInsensitive,.diacriticInsensitive],locale:Locale(identifier:"en_US_POSIX"))
            .replacingOccurrences(of:"’s",with:"").replacingOccurrences(of:"'s",with:"")
            .replacingOccurrences(of:"’",with:"").replacingOccurrences(of:"'",with:"")
            .split { !$0.isLetter && !$0.isNumber }.map(String.init)
    }
    private static func root(_ word:String) -> String {
        if let lemma = lemmas[word] { return lemma }
        if word.count > 4 && word.hasSuffix("ies") { return String(word.dropLast(3))+"y" }
        if word.count > 3 && word.hasSuffix("s") && !word.hasSuffix("ss") && !word.hasSuffix("us") && !word.hasSuffix("is") { return String(word.dropLast()) }
        return word
    }
    private static let lemmas: [String:String] = {
        let groups = [
            ["work","works","workmanship","deed","deeds"],
            ["test","tests","tested","testing","prove","proves","proved","proving"],
            ["anxious","anxiety","worry","worries","worried","worrying"],
            ["fear","fears","afraid","fearful"],
            ["forgive","forgives","forgiven","forgiving","forgiveness"],
            ["love","loves","loved","loving"],
            ["pray","prays","prayed","praying","prayer","prayers"],
            ["strength","strengthen","strengthens","strengthened"],
            ["raise","raised","rises","risen","rise"],
            ["suffer","suffers","suffered","suffering"],
            ["burn","burns","burned","burnt","burning"],
            ["calm","calms","calmed"], ["child","children"],
            ["build","builds","built","building"], ["armour","armor"],
            ["burden","burdens","burdened","laden"], ["peace","peaceful"]
        ]
        return Dictionary(uniqueKeysWithValues:groups.flatMap { group in group.map { ($0,group[0]) } })
    }()
    private static let stop = Set("a an the and or of to in on at by for from with into through that this those these is are was were be been being it its he his him she her they their them we our us you your i me my will would shall should can could do does did what where which who how about please find verse verses scripture scriptures bible says say said passage passages show tell remember".split(separator:" ").map(String.init))
    private static func oneEdit(_ a:String,_ b:String) -> Bool {
        let x = Array(a), y = Array(b)
        guard abs(x.count-y.count) <= 1 else { return false }
        if x.count == y.count {
            let diffs = x.indices.filter { x[$0] != y[$0] }
            if diffs.count == 1 { return true }
            return diffs.count == 2 && diffs[1] == diffs[0]+1 && x[diffs[0]] == y[diffs[1]] && x[diffs[1]] == y[diffs[0]]
        }
        let shorter = x.count < y.count ? x : y, longer = x.count < y.count ? y : x
        var i = 0, j = 0, skipped = false
        while i < shorter.count && j < longer.count {
            if shorter[i] == longer[j] { i += 1; j += 1 }
            else { if skipped { return false }; skipped = true; j += 1 }
        }
        return true
    }
}
