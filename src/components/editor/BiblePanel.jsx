import { useState, useEffect, useRef } from "react";
import { BIBLE_BOOKS, VERSIONS, fetchChapter } from "@/lib/bibleApi";
import { parseReference } from "@/lib/bibleSearch";
import { Search, ChevronLeft, ChevronRight, ChevronDown, Copy, BookOpen, Loader2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BiblePanel({ onInsert }) {
  const [version, setVersion] = useState("acf");
  const [selectedBook, setSelectedBook] = useState(null);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("books"); // "books" | "chapters" | "reading"
  const [chaptersBook, setChaptersBook] = useState(null); // book being shown in chapter grid
  const [copied, setCopied] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Reload chapter when version changes
  useEffect(() => {
    if (selectedBook && view === "reading") {
      loadChapter(selectedBook, chapter, false);
    }
  }, [version]);

  const loadChapter = async (book, ch, clearSelection = true) => {
    setLoading(true);
    if (clearSelection) setSelected(new Set());
    setSelectedBook(book);
    setChapter(ch);
    setView("reading");
    try {
      const data = await fetchChapter(version, book.abbrev, ch);
      setVerses(data.verses || []);
    } catch (e) {
      setVerses([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    const val = search.trim();
    if (!val) return;

    const parsed = parseReference(val);
    if (!parsed || !parsed.book) {
      toast.error("Livro não encontrado.");
      return;
    }

    if (parsed.chapter) {
      // Navigate directly to chapter, pre-select verses if range given
      loadChapter(parsed.book, parsed.chapter, true).then(() => {
        if (parsed.verse) {
          const start = parsed.verse;
          const end = parsed.verseEnd || parsed.verse;
          const nums = [];
          for (let i = start; i <= end; i++) nums.push(i);
          setSelected(new Set(nums));
        }
      });
    } else {
      // Just book — show chapter grid
      setChaptersBook(parsed.book);
      setView("chapters");
    }
    setSearch("");
  };

  const normalizeStr = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Filter books in "books" view by typed text (only letters, no digits)
  const bookSearchTerm = search.trim().replace(/\s*\d.*$/, "");
  const filtered = bookSearchTerm
    ? BIBLE_BOOKS.filter(b => normalizeStr(b.name).includes(normalizeStr(bookSearchTerm)))
    : BIBLE_BOOKS;

  // --- Selection ---
  const toggleSelect = (verseNumber) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(verseNumber)) next.delete(verseNumber);
      else next.add(verseNumber);
      return next;
    });
  };

  const copySelected = () => {
    if (!selectedBook || selected.size === 0) return;
    const sorted = [...selected].sort((a, b) => a - b);
    const lines = sorted.map(n => {
      const v = verses.find(v => v.number === n);
      return v ? `${n}. ${v.text}` : "";
    }).filter(Boolean);
    const ref = sorted.length === 1
      ? `${selectedBook.name} ${chapter}:${sorted[0]}`
      : `${selectedBook.name} ${chapter}:${sorted[0]}-${sorted[sorted.length - 1]}`;
    const text = `${lines.join("\n")}\n(${ref} — ${version.toUpperCase()})`;
    navigator.clipboard.writeText(text);
    setCopied("multi");
    toast.success(`${selected.size} versículo(s) copiado(s)!`);
    setTimeout(() => { setCopied(null); setSelected(new Set()); }, 2000);
  };

  const handleCopyVerse = (verse) => {
    if (selected.size > 0) { toggleSelect(verse.number); return; }
    if (!selectedBook) return;
    const ref = `${selectedBook.name} ${chapter}:${verse.number}`;
    const text = `"${verse.text}" (${ref} — ${version.toUpperCase()})`;
    navigator.clipboard.writeText(text);
    setCopied(verse.number);
    toast.success("Versículo copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || !selectedBook) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 60 || dy > 80) return;
    if (dx < 0 && chapter < selectedBook.chapters) loadChapter(selectedBook, chapter + 1);
    if (dx > 0 && chapter > 1) loadChapter(selectedBook, chapter - 1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border bg-amber-50/50 dark:bg-amber-900/10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-foreground">Bíblia</span>
          <select
            value={version}
            onChange={e => setVersion(e.target.value)}
            className="ml-auto text-xs border border-border rounded px-1.5 py-0.5 bg-background text-foreground"
          >
            {VERSIONS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="João 3:16, Êxodo 2:5-7..."
              className="pl-7 h-7 text-xs"
            />
          </div>
        </form>
      </div>

      {/* Breadcrumb + chapter nav */}
      {view !== "books" && (selectedBook || chaptersBook) && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/30 flex-shrink-0 min-h-[2rem]">
          <button onClick={() => { setView("books"); setChaptersBook(null); }} className="text-xs text-muted-foreground hover:text-foreground">
            Livros
          </button>
          {view === "chapters" && chaptersBook && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{chaptersBook.name}</span>
            </>
          )}
          {view === "reading" && selectedBook && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setChaptersBook(selectedBook); setView("chapters"); }}
              >
                {selectedBook.name}
              </button>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              {/* Chapter navigator with picker */}
              <div className="flex items-center gap-0.5 ml-auto relative">
                <button
                  onClick={() => { if (chapter > 1) loadChapter(selectedBook, chapter - 1); }}
                  disabled={chapter <= 1}
                  className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowChapterPicker(p => !p)}
                  className="flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 hover:bg-accent rounded"
                >
                  Cap. {chapter} <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {showChapterPicker && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-border rounded-xl shadow-xl overflow-hidden"
                    style={{ width: selectedBook.chapters > 30 ? "220px" : "150px", maxHeight: "280px", overflowY: "auto" }}
                  >
                    <div className="p-2">
                      <div className={cn("grid gap-1", selectedBook.chapters > 30 ? "grid-cols-6" : "grid-cols-5")}>
                        {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                          <button
                            key={ch}
                            onClick={() => { loadChapter(selectedBook, ch); setShowChapterPicker(false); }}
                            className={cn(
                              "text-xs py-1.5 rounded-md font-medium transition-colors",
                              ch === chapter ? "bg-amber-500 text-white" : "text-foreground hover:bg-accent"
                            )}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { if (chapter < selectedBook.chapters) loadChapter(selectedBook, chapter + 1); }}
                  disabled={chapter >= selectedBook.chapters}
                  className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => showChapterPicker && setShowChapterPicker(false)}
      >
        {/* Books list */}
        {view === "books" && (
          <div className="py-1">
            {["AT", "NT"].map(t => (
              <div key={t}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                  {t === "AT" ? "Antigo Testamento" : "Novo Testamento"}
                </p>
                {filtered.filter(b => b.testament === t).map(book => (
                  <button
                    key={book.id}
                    onClick={() => { setChaptersBook(book); setView("chapters"); }}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left"
                  >
                    <span className="text-foreground">{book.name}</span>
                    <span className="text-muted-foreground/60">{book.chapters} cap.</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Chapter grid */}
        {view === "chapters" && chaptersBook && (
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-2">Selecione o capítulo:</p>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: chaptersBook.chapters }, (_, i) => i + 1).map(ch => (
                <button
                  key={ch}
                  onClick={() => loadChapter(chaptersBook, ch)}
                  className={cn(
                    "text-xs py-1.5 rounded-md border transition-colors text-center",
                    selectedBook?.id === chaptersBook.id && chapter === ch
                      ? "bg-amber-500 text-white border-amber-500 font-semibold"
                      : "border-border hover:bg-accent text-foreground"
                  )}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reading */}
        {view === "reading" && (
          <div className="px-3 py-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {selected.size > 0 && (
                  <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <span className="text-xs text-amber-700 dark:text-amber-300 flex-1 font-medium">
                      {selected.size} selecionado(s)
                    </span>
                    <Button size="sm" className="h-6 text-xs px-2 gap-1" onClick={copySelected}>
                      <Copy className="w-3 h-3" /> Copiar
                    </Button>
                    <button onClick={() => setSelected(new Set())} className="text-amber-600 hover:text-amber-800">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="space-y-1">
                  {verses.map(verse => {
                    const isSelected = selected.has(verse.number);
                    return (
                      <div
                        key={verse.number}
                        className={cn(
                          "group flex items-start gap-2 p-1.5 rounded transition-colors cursor-pointer",
                          isSelected
                            ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"
                            : "hover:bg-accent/50"
                        )}
                        onClick={() => selected.size > 0 ? toggleSelect(verse.number) : handleCopyVerse(verse)}
                        onContextMenu={(e) => { e.preventDefault(); toggleSelect(verse.number); }}
                        title={selected.size > 0 ? "Clique para selecionar/desselecionar" : "Clique para copiar · Clique direito para selecionar"}
                      >
                        <span className={cn(
                          "text-xs font-bold mt-0.5 flex-shrink-0 w-5",
                          isSelected ? "text-amber-600" : "text-muted-foreground"
                        )}>{verse.number}</span>
                        <p className="text-xs font-crimson text-foreground leading-relaxed flex-1">{verse.text}</p>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        ) : copied === verse.number ? (
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}