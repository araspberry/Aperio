import csv, json, re, sqlite3, os, sys
csv.field_size_limit(10**8)
UP = "data"
OUT = "assets/db/aperio.db"
if os.path.exists(OUT): os.remove(OUT)
db = sqlite3.connect(OUT)
c = db.cursor()
c.executescript("""
create table books(book_num integer primary key, name text, abbr text, testament text, chapters_count integer);
create table verses(book_num integer, chapter integer, verse integer, text text, para_start integer default 0,
  primary key(book_num, chapter, verse));
create table commentary(book_num integer, chapter integer, reference text, devotional text, scholarly text, prophetic text,
  primary key(book_num, chapter));
create table strongs(id text primary key, language text, lemma text, translit text, pron text, definition text, kjv_def text, derivation text);
create virtual table verses_fts using fts5(text, content='verses', content_rowid='rowid');
create virtual table strongs_fts using fts5(id, lemma, translit, definition, kjv_def, content='strongs', content_rowid='rowid');
""")

crows = list(csv.DictReader(open(f"{UP}/aperio_commentary.csv")))
srows = list(csv.DictReader(open(f"{UP}/aperio_scripture.csv")))
meta = {}; counts = {}
for r in crows:
    meta[r["book"]] = (int(r["book_num"]), r["testament"])
    counts[r["book"]] = max(counts.get(r["book"],0), int(r["chapter"]))
abbrs = {r["book"]: r["abbr"] for r in srows}
for b,(num,test) in meta.items():
    c.execute("insert into books values(?,?,?,?,?)",(num,b,abbrs[b],test,counts[b]))

# parse verses: "[n] text" with blank-line paragraphs
vre = re.compile(r"\[(\d+)\]\s*")
total_v = 0; problems = []
for r in srows:
    bn = meta[r["book"]][0]; ch = int(r["chapter"]); content = r["content"]
    paras = [p.strip() for p in content.split("\n\n") if p.strip()]
    seen = {}
    order = []
    for p in paras:
        parts = vre.split(p)
        pre = parts[0].strip()
        if pre:
            if order:
                seen[order[-1]] = (seen[order[-1]][0] + "\n\n" + pre, seen[order[-1]][1])
            else:
                problems.append((r["book"],ch,"orphan-pre",pre[:40]))
        first_in_para = not pre  # continuation paragraph is not a new para start
        for i in range(1, len(parts), 2):
            n = int(parts[i]); t = parts[i+1].strip()
            if n in seen:
                problems.append((r["book"],ch,"dup",n)); continue
            seen[n] = (t, 1 if first_in_para else 0)
            order.append(n)
            first_in_para = False
    for n in order:
        t, ps = seen[n]
        c.execute("insert into verses values(?,?,?,?,?)",(bn,ch,n,t,ps))
        total_v += 1
    # gap check
    if seen and (min(seen)!=1 or max(seen)!=len(seen)):
        problems.append((r["book"],ch,"gaps",f"{min(seen)}..{max(seen)} count={len(seen)}"))

for r in crows:
    c.execute("insert into commentary values(?,?,?,?,?,?)",
        (int(r["book_num"]),int(r["chapter"]),r["reference"],
         r["commentary_devotional"],r["commentary_scholarly"],r["commentary_prophetic"]))

# strongs
def load_js(path, var):
    txt = open(path, encoding="utf-8").read()
    m = re.search(r"var\s+"+var+r"\s*=\s*(\{.*\})", txt, re.S)
    j = m.group(1)
    j = re.sub(r";\s*(module\.exports.*)?$", "", j.strip(), flags=re.S)
    return json.loads(j)
heb = load_js("/tmp/strongs/hebrew/strongs-hebrew-dictionary.js","strongsHebrewDictionary")
grk = load_js("/tmp/strongs/greek/strongs-greek-dictionary.js","strongsGreekDictionary")
for sid,e in heb.items():
    c.execute("insert into strongs values(?,?,?,?,?,?,?,?)",(sid,"Hebrew",e.get("lemma",""),e.get("xlit",""),e.get("pron",""),e.get("strongs_def",""),e.get("kjv_def",""),e.get("derivation","")))
for sid,e in grk.items():
    c.execute("insert into strongs values(?,?,?,?,?,?,?,?)",(sid,"Greek",e.get("lemma",""),e.get("translit",""),e.get("pronunciation",""),e.get("strongs_def",""),e.get("kjv_def",""),e.get("derivation","")))

c.execute("insert into verses_fts(rowid, text) select rowid, text from verses")
c.execute("insert into strongs_fts(rowid,id,lemma,translit,definition,kjv_def) select rowid,id,lemma,translit,definition,kjv_def from strongs")
db.commit()
c.execute("vacuum")
print("verses:", total_v)
print("strongs:", c.execute("select count(*) from strongs").fetchone()[0])
print("commentary:", c.execute("select count(*) from commentary").fetchone()[0])
print("db size MB:", round(os.path.getsize(OUT)/1e6,1))
print("problems:", len(problems))
for p in problems[:15]: print("  ", p)
