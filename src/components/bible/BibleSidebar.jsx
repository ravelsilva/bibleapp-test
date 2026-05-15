import { useState } from "react";
import { BIBLE_BOOKS, VERSIONS } from "@/lib/bibleApi";
import { Search, ChevronRight, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function BibleSidebar({
  selectedBook, selectedChapter, selectedVersion,
  onSelectBook, onSelectChapter, onSelectVersion,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const [showAT, setShowAT] = useState(true);
  const [showNT, setShowNT] = useState(true);
  const [expandedBook, setExpandedBook] = useState(null);

  const normalizeStr = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = BIBLE_BOOKS.filter(b =>
    normalizeStr(b.name).includes(normalizeStr(search))
  );
  const at = filtered.filter(b => b.testament === "AT");
  const nt = filtered.filter(b => b.testament === "NT");

  const handleBookClick = (book) => {
    // Only expand/collapse chapter list - do NOT auto-navigate
    setExpandedBook(expandedBook === book.id ? null : book.id);
  };

  const handleChapterClick = (e, book, ch) => {
    e.stopPropagation();
    onSelectBook(book);
    onSelectChapter(ch);
    // On mobile, close sidebar after selecting chapter
    if (window.innerWidth < 768 && onClose) onClose();
  };

  const renderBook = (book) => {
    const isSelected = selectedBook?.id === book.id;
    const isExpanded = expandedBook === book.id;

    return (
      <div key={book.id}>
        <div
          onClick={() => handleBookClick(book)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-xs",
            isSelected ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          {isExpanded ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          <span className="truncate flex-1">{book.name}</span>
          <span className="text-muted-foreground/50 text-xs">{book.chapters}</span>
        </div>
        {isExpanded && (
          <div className="ml-4 mb-1 flex flex-wrap gap-1 px-1">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
              <button
                key={ch}
                onClick={(e) => handleChapterClick(e, book, ch)}
                className={cn(
                  "w-7 h-7 rounded text-xs transition-colors font-medium",
                  selectedBook?.id === book.id && selectedChapter === ch
                    ? "bg-foreground text-background"
                    : "bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-52 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header with close button for mobile */}
      <div className="flex items-center justify-between px-2 pt-3 pb-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Bíblia</p>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors md:hidden">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Version selector */}
      <div className="px-2 pb-2 border-b border-sidebar-border">
        <div className="flex flex-col gap-1">
          {VERSIONS.map(v => (
            <button key={v.id} onClick={() => onSelectVersion(v.id)}
              className={cn(
                "flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors",
                selectedVersion === v.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}>
              <span className="font-semibold">{v.name}</span>
              <span className="opacity-60 text-xs truncate ml-1">{v.fullName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar livro..."
            className="pl-6 h-7 text-xs bg-background"
          />
        </div>
      </div>

      {/* Books list */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <button onClick={() => setShowAT(s => !s)}
          className="flex items-center gap-1 w-full px-1 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors mb-1">
          {showAT ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Antigo Testamento ({at.length})
        </button>
        {showAT && at.map(renderBook)}

        <button onClick={() => setShowNT(s => !s)}
          className="flex items-center gap-1 w-full px-1 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors mt-2 mb-1">
          {showNT ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Novo Testamento ({nt.length})
        </button>
        {showNT && nt.map(renderBook)}
      </div>
    </div>
  );
}