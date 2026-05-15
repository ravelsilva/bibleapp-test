import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { fetchChapter, VERSIONS } from "@/lib/bibleApi";
import { ChevronLeft, ChevronRight, ChevronDown, Star, BookOpen, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import VerseMenu from "./VerseMenu";
import BibleSearchBar from "./BibleSearchBar";

const HIGHLIGHT_COLORS = {
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Promessas", dot: "bg-yellow-400" },
  green: { bg: "bg-green-100 dark:bg-green-900/30", label: "Fé", dot: "bg-green-400" },
  blue: { bg: "bg-blue-100 dark:bg-blue-900/30", label: "Sabedoria", dot: "bg-blue-400" },
  red: { bg: "bg-red-100 dark:bg-red-900/30", label: "Doutrina", dot: "bg-red-400" },
  purple: { bg: "bg-purple-100 dark:bg-purple-900/30", label: "Pregação", dot: "bg-purple-400" },
};

export default function BibleChapterView({
  book, chapter, version, compareMode, compareVersion,
  nightMode, onInsertVerse, onChapterChange,
  selectedVerses, onSelectedVersesChange
}) {
  const [chapterData, setChapterData] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [verseMenu, setVerseMenu] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    if (!book) return;
    loadChapter();
  }, [book, chapter, version]);

  useEffect(() => {
    loadHighlights();
    loadFavorites();
    onSelectedVersesChange && onSelectedVersesChange([]);
  }, [book, chapter]);

  const loadChapter = async () => {
    if (!book) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChapter(version, book.abbrev, chapter);
      setChapterData(data);
      if (compareMode) {
        const v2 = compareVersion || "nvi";
        const comp = await fetchChapter(v2, book.abbrev, chapter);
        setCompareData(comp);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (compareMode && book) {
      const v2 = compareVersion || "nvi";
      fetchChapter(v2, book.abbrev, chapter).then(setCompareData).catch(() => {});
    }
  }, [compareMode, compareVersion]);

  const loadHighlights = async () => {
    if (!book) return;
    const h = await base44.entities.BibleHighlight.filter({ book_abbrev: book.abbrev, chapter });
    setHighlights(h);
  };

  const loadFavorites = async () => {
    if (!book) return;
    const f = await base44.entities.BibleFavorite.filter({ book_abbrev: book.abbrev, chapter });
    setFavorites(f);
  };

  const getHighlight = (verseNum) => highlights.find(h => h.verse === verseNum && h.version === version);
  const isFavorite = (verseNum) => favorites.some(f => f.verse === verseNum);

  const handleHighlight = async (verse, color) => {
    const existing = getHighlight(verse.number);
    if (existing) {
      if (existing.color === color) {
        await base44.entities.BibleHighlight.delete(existing.id);
      } else {
        await base44.entities.BibleHighlight.update(existing.id, { color });
      }
    } else {
      await base44.entities.BibleHighlight.create({
        version, book_abbrev: book.abbrev, book_name: book.name,
        chapter, verse: verse.number, verse_text: verse.text, color,
      });
    }
    loadHighlights();
    setVerseMenu(null);
  };

  const handleFavorite = async (verse) => {
    const existing = favorites.find(f => f.verse === verse.number);
    if (existing) {
      await base44.entities.BibleFavorite.delete(existing.id);
    } else {
      await base44.entities.BibleFavorite.create({
        version, book_abbrev: book.abbrev, book_name: book.name,
        chapter, verse: verse.number, verse_text: verse.text,
        reference: `${book.name} ${chapter}:${verse.number} — ${version.toUpperCase()}`,
      });
    }
    loadFavorites();
    setVerseMenu(null);
  };

  const handleInsert = (verse) => {
    if (!onInsertVerse) return;
    // If multiple verses selected, insert all
    const verses = chapterData?.verses || [];
    if (selectedVerses && selectedVerses.length > 1) {
      const selected = verses.filter(v => selectedVerses.includes(v.number)).sort((a, b) => a.number - b.number);
      const text = selected.map(v => `${v.number} ${v.text}`).join("\n");
      const first = selected[0].number;
      const last = selected[selected.length - 1].number;
      const ref = first === last
        ? `${book.name} ${chapter}:${first}`
        : `${book.name} ${chapter}:${first}-${last}`;
      onInsertVerse({ text, reference: ref, version: version.toUpperCase() });
    } else {
      onInsertVerse({
        text: verse.text,
        reference: `${book.name} ${chapter}:${verse.number}`,
        version: version.toUpperCase(),
      });
    }
    setVerseMenu(null);
  };

  // Multi-verse selection — tap/click toggles addition; shift+click makes range
  const handleVerseClick = (e, verse) => {
    // Right-click or single click with no selection: open context menu
    if (e.type === "contextmenu") {
      e.preventDefault();
      setVerseMenu({ verse, x: e.clientX, y: e.clientY });
      return;
    }

    // Single click with no verses already selected: open context menu inline
    if (!selectedVerses || selectedVerses.length === 0) {
      setVerseMenu({ verse, x: e.clientX, y: e.clientY });
      return;
    }

    const num = verse.number;

    // Shift+click: range selection (desktop)
    if (e.shiftKey && selectionStart !== null) {
      const min = Math.min(selectionStart, num);
      const max = Math.max(selectionStart, num);
      const range = [];
      for (let i = min; i <= max; i++) range.push(i);
      onSelectedVersesChange(range);
      return;
    }

    // Toggle individual verse (works on mobile tap too)
    const alreadySelected = selectedVerses?.includes(num);
    if (alreadySelected) {
      const updated = selectedVerses.filter(v => v !== num);
      onSelectedVersesChange(updated);
      if (updated.length === 0) setSelectionStart(null);
    } else {
      const updated = [...(selectedVerses || []), num];
      onSelectedVersesChange(updated);
      setSelectionStart(num);
    }
  };

  const handleVerseLongPress = (verse, e) => {
    setVerseMenu({ verse, x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 });
  };

  const copySelectedVerses = () => {
    const verses = chapterData?.verses || [];
    const selected = verses.filter(v => selectedVerses.includes(v.number)).sort((a, b) => a.number - b.number);
    if (selected.length === 0) return;
    const text = selected.map(v => `${v.number} ${v.text}`).join("\n");
    const first = selected[0].number;
    const last = selected[selected.length - 1].number;
    const ref = first === last
      ? `${book.name} ${chapter}:${first}`
      : `${book.name} ${chapter}:${first}-${last}`;
    navigator.clipboard.writeText(`${text}\n\n— ${ref} (${version.toUpperCase()})`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    onSelectedVersesChange([]);
  };

  const handleSingleCopy = (verse) => {
    navigator.clipboard.writeText(`${verse.text} (${book.name} ${chapter}:${verse.number} — ${version.toUpperCase()})`);
    setVerseMenu(null);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 60 || dy > 80) return; // too short or vertical
    if (dx < 0 && chapter < book.chapters) onChapterChange(chapter + 1); // swipe left → next
    if (dx > 0 && chapter > 1) onChapterChange(chapter - 1); // swipe right → prev
  };

  const handleSearchResult = (resBook, resChapter, resVerse, resVerseEnd) => {
    if (resBook) {
      window.dispatchEvent(new CustomEvent("bible-navigate", { detail: { book: resBook, chapter: resChapter || 1 } }));
      onChapterChange(resChapter || 1);
      // If verse range, select those verses after load
      if (resVerse && resVerseEnd) {
        const range = [];
        for (let i = resVerse; i <= resVerseEnd; i++) range.push(i);
        setTimeout(() => {
          onSelectedVersesChange(range);
          // Scroll to first verse
          const el = document.getElementById(`verse-${resVerse}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 600);
      } else if (resVerse) {
        setTimeout(() => {
          onSelectedVersesChange([resVerse]);
          const el = document.getElementById(`verse-${resVerse}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 600);
      }
    }
  };

  if (!book) {
    return (
      <div className={cn("flex-1 h-full flex flex-col items-center justify-center text-center p-8", nightMode ? "bg-stone-950" : "bg-background")}>
        <BookOpen className={cn("w-16 h-16 mb-4", nightMode ? "text-stone-700" : "text-muted-foreground/20")} />
        <h2 className={cn("text-xl font-semibold font-crimson mb-2", nightMode ? "text-stone-300" : "text-foreground")}>
          Bíblia Sagrada
        </h2>
        <p className={cn("text-sm mb-6", nightMode ? "text-stone-500" : "text-muted-foreground")}>
          Selecione um livro → capítulo para começar
        </p>
        <BibleSearchBar
          onResult={handleSearchResult}
          nightMode={nightMode}
          className="max-w-sm w-full"
        />
      </div>
    );
  }

  const verses = chapterData?.verses || [];
  const nightText = nightMode ? "text-stone-200" : "text-foreground";
  const nightMuted = nightMode ? "text-stone-500" : "text-muted-foreground";
  const nightBg = nightMode ? "bg-stone-950" : "bg-background";

  // Compare: only show selected verses if any
  const compareVerses = compareData?.verses || [];
  const filteredCompareVerses = compareMode && selectedVerses?.length > 0
    ? compareVerses.filter(v => selectedVerses.includes(v.number))
    : compareVerses;
  const filteredMainVerses = compareMode && selectedVerses?.length > 0
    ? verses.filter(v => selectedVerses.includes(v.number))
    : verses;

  return (
    <div className={cn("flex flex-col h-full", nightBg)}>
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b flex-shrink-0", nightMode ? "border-stone-800" : "border-border")}>
        <BibleSearchBar
          onResult={handleSearchResult}
          compact
          nightMode={nightMode}
        />
        <div className="flex items-center gap-1 ml-3 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            disabled={chapter <= 1}
            onClick={() => chapter > 1 && onChapterChange(chapter - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {/* Chapter picker button */}
          <div className="relative">
            <button
              onClick={() => setShowChapterPicker(p => !p)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium transition-colors",
                nightMode ? "text-stone-200 hover:bg-stone-800" : "text-foreground hover:bg-accent"
              )}
            >
              <span className="whitespace-nowrap">{book.name} {chapter}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {showChapterPicker && (
              <div className={cn(
                "absolute right-0 top-full mt-1 z-50 rounded-xl border shadow-xl overflow-hidden",
                nightMode ? "bg-stone-900 border-stone-700" : "bg-background border-border"
              )}
                style={{ width: book.chapters > 30 ? "240px" : "160px", maxHeight: "320px", overflowY: "auto" }}
              >
                <div className="p-2">
                  <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2 px-1", nightMode ? "text-stone-400" : "text-muted-foreground")}>
                    {book.name}
                  </p>
                  <div className={cn("grid gap-1", book.chapters > 30 ? "grid-cols-6" : "grid-cols-5")}>
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                      <button
                        key={ch}
                        onClick={() => { onChapterChange(ch); setShowChapterPicker(false); }}
                        className={cn(
                          "text-xs py-1.5 rounded-md font-medium transition-colors",
                          ch === chapter
                            ? "bg-amber-500 text-white"
                            : nightMode ? "text-stone-300 hover:bg-stone-700" : "text-foreground hover:bg-accent"
                        )}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            disabled={chapter >= book.chapters}
            onClick={() => chapter < book.chapters && onChapterChange(chapter + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Multi-verse selection toolbar */}
      {selectedVerses && selectedVerses.length > 0 && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 border-b text-xs flex-shrink-0",
          nightMode ? "bg-stone-900 border-stone-800 text-stone-300" : "bg-accent border-border text-foreground"
        )}>
          <span className="font-medium">
            {selectedVerses.length === 1
              ? `Versículo ${selectedVerses[0]} selecionado`
              : `${selectedVerses.length} versículos selecionados`}
          </span>
          <button
            onClick={copySelectedVerses}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors",
              nightMode ? "bg-stone-700 hover:bg-stone-600 text-stone-100" : "bg-foreground text-background hover:bg-foreground/90"
            )}
          >
            {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copySuccess ? "Copiado!" : "Copiar"}
          </button>
          {onInsertVerse && selectedVerses.length > 0 && (
            <button
              onClick={() => handleInsert(null)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors",
                nightMode ? "bg-amber-800 hover:bg-amber-700 text-stone-100" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              )}
            >
              Inserir na nota
            </button>
          )}
          <button
            onClick={() => { onSelectedVersesChange([]); setSelectionStart(null); }}
            className="ml-auto text-muted-foreground hover:text-foreground px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Verses */}
      <div
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => showChapterPicker && setShowChapterPicker(false)}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className={cn("w-6 h-6 animate-spin", nightMuted)} />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive text-sm">{error}</p>
            <button onClick={loadChapter} className="text-xs text-muted-foreground mt-2 hover:underline">Tentar novamente</button>
          </div>
        ) : (
          <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 py-8", compareMode ? "grid grid-cols-2 gap-6" : "")}>
            {/* Main version */}
            <div>
              {!compareMode && (
                <div className="mb-6">
                  <h1 className={cn("text-3xl font-crimson font-semibold mb-1", nightText)}>{book.name} {chapter}</h1>
                  <p className={cn("text-sm", nightMuted)}>{version.toUpperCase()}</p>
                </div>
              )}
              {compareMode && (
                <div className="mb-4">
                  <p className={cn("text-xs font-bold uppercase tracking-wider", nightMuted)}>{version.toUpperCase()}</p>
                  {selectedVerses?.length > 0 && (
                    <p className={cn("text-xs mt-0.5", nightMuted)}>
                      {selectedVerses.length === 1 ? `v. ${selectedVerses[0]}` : `v. ${Math.min(...selectedVerses)}-${Math.max(...selectedVerses)}`}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-0.5">
                {(compareMode ? filteredMainVerses : verses).map((verse) => {
                  const hl = getHighlight(verse.number);
                  const fav = isFavorite(verse.number);
                  const isSelected = selectedVerses?.includes(verse.number);
                  return (
                    <p
                      id={`verse-${verse.number}`}
                      key={verse.number}
                      onClick={(e) => handleVerseClick(e, verse)}
                      onContextMenu={(e) => handleVerseClick(e, verse)}
                      className={cn(
                        "leading-relaxed cursor-pointer rounded px-2 py-1 transition-colors select-none",
                        isSelected
                          ? nightMode ? "bg-amber-900/40 ring-1 ring-amber-700" : "bg-amber-50 ring-1 ring-amber-300"
                          : hl ? HIGHLIGHT_COLORS[hl.color].bg
                          : nightMode ? "hover:bg-stone-800/50" : "hover:bg-accent/40",
                        nightMode ? "font-crimson text-stone-200" : "font-crimson text-foreground"
                      )}
                      style={{ fontSize: "17px" }}
                    >
                      <span className={cn("text-xs font-bold mr-2 select-none font-inter", nightMode ? "text-stone-500" : "text-muted-foreground")}>
                        {verse.number}
                      </span>
                      {verse.text}
                      {fav && <Star className="inline w-3 h-3 text-yellow-500 fill-current ml-1" />}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Compare version */}
            {compareMode && compareData && (
              <div className={cn("border-l pl-6", nightMode ? "border-stone-800" : "border-border")}>
                <p className={cn("text-xs font-bold uppercase tracking-wider mb-4", nightMuted)}>
                  {(compareVersion || "nvi").toUpperCase()}
                </p>
                <div className="space-y-0.5">
                  {filteredCompareVerses.map((verse) => (
                    <p key={verse.number} className={cn("leading-relaxed font-crimson px-2 py-1", nightText)} style={{ fontSize: "17px" }}>
                      <span className={cn("text-xs font-bold mr-2 select-none font-inter", nightMuted)}>{verse.number}</span>
                      {verse.text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verse context menu */}
      {verseMenu && (
        <VerseMenu
          verse={verseMenu.verse}
          position={{ x: verseMenu.x, y: verseMenu.y }}
          highlight={getHighlight(verseMenu.verse.number)}
          isFavorite={isFavorite(verseMenu.verse.number)}
          onHighlight={(color) => handleHighlight(verseMenu.verse, color)}
          onFavorite={() => handleFavorite(verseMenu.verse)}
          onInsert={() => handleInsert(verseMenu.verse)}
          onCopy={() => handleSingleCopy(verseMenu.verse)}
          onClose={() => setVerseMenu(null)}
          canInsert={!!onInsertVerse}
          bookName={book.name}
          chapter={chapter}
          version={version}
        />
      )}
    </div>
  );
}