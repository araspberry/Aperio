# Chapter cross-references

Top 10 cross references per chapter, aggregated by community votes from the
Treasury of Scripture Knowledge / OpenBible cross-reference dataset
(public domain, via scrollmapper/bible_databases).

Format, one chapter per line:

```
from_book_num|from_chapter|to_book.to_chapter.verse_start.verse_end;...
```

`tools/build_db.py` compiles these into the `crossrefs` table of the bundled
SQLite database, merged with references cited in Aperio's own commentary.
