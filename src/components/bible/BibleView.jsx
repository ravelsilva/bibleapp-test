import { useState, useEffect, useRef } from "react";
import BibleSidebar from "./BibleSidebar";
import BibleChapterView from "./BibleChapterView";
import BibleFavoritesView from "./BibleFavoritesView";
import ReadingTracker from "./ReadingTracker";
import { BookOpen, Star, BarChart2, PanelLeftClose, PanelLeft, GitCompare, Moon, Sun } from "lucide-react";
import { VERSIONS } from "@/lib/bibleApi";
import { cn } from "@/lib/utils";

export default function BibleView({ onInsertVerse }) {
  const [activeTab, setActiveTab] = useState("read");
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState("acf");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState("nvi");
  const [nightMode, setNightMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState([]);

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSelectedChapter(1);
  };

  const handleSidebarClose = () => setSidebarOpen(false);

  useEffect(() => {
    const handler = (e) => {
      const { book, chapter } = e.detail;
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setActiveTab("read");
    };
    window.addEventListener("bible-navigate", handler);
    return () => window.removeEventListener("bible-navigate", handler);
  }, []);

  // Close sidebar on outside click (mobile)
  const sidebarRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (
        window.innerWidth < 768 &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [sidebarOpen]);

  const nightBg = nightMode ? "bg-stone-950" : "bg-background";

  return (
    <div className={cn("flex h-full relative overflow-hidden", nightBg)}>
      {/* Mobile overlay */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Bible Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "z-40 h-full flex-shrink-0 transition-all duration-300",
          "absolute md:relative",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-full md:w-0"
        )}
        style={{ width: sidebarOpen ? "208px" : undefined }}
      >
        {sidebarOpen && (
          <BibleSidebar
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
            selectedVersion={selectedVersion}
            onSelectBook={handleSelectBook}
            onSelectChapter={setSelectedChapter}
            onSelectVersion={setSelectedVersion}
            onClose={handleSidebarClose}
          />
        )}
      </div>

      {/* Main content */}
      <div className={cn("flex-1 flex flex-col min-w-0 overflow-hidden", nightBg)}>
        {/* Top bar - scrollable on mobile */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-2 border-b border-border overflow-x-auto flex-shrink-0",
          nightMode ? "bg-stone-950 border-stone-800" : "bg-background"
        )}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className={cn(
              "flex items-center justify-center w-9 h-9 min-w-[2.25rem] rounded-md transition-colors flex-shrink-0",
              nightMode ? "text-stone-400 hover:text-stone-200 hover:bg-stone-800" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            title={sidebarOpen ? "Recolher" : "Expandir"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          {/* Tabs */}
          <button onClick={() => setActiveTab("read")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0 min-w-0",
              activeTab === "read"
                ? nightMode ? "bg-stone-800 text-stone-100" : "bg-accent text-foreground"
                : nightMode ? "text-stone-400 hover:text-stone-200" : "text-muted-foreground hover:text-foreground"
            )}>
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Leitura</span>
          </button>

          <button onClick={() => setActiveTab("favorites")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0",
              activeTab === "favorites"
                ? nightMode ? "bg-stone-800 text-stone-100" : "bg-accent text-foreground"
                : nightMode ? "text-stone-400 hover:text-stone-200" : "text-muted-foreground hover:text-foreground"
            )}>
            <Star className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Favoritos</span>
          </button>

          <button onClick={() => setActiveTab("progress")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0",
              activeTab === "progress"
                ? nightMode ? "bg-stone-800 text-stone-100" : "bg-accent text-foreground"
                : nightMode ? "text-stone-400 hover:text-stone-200" : "text-muted-foreground hover:text-foreground"
            )}>
            <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Progresso</span>
          </button>

          <div className="flex-1" />

          {/* Compare */}
          <button
            onClick={() => setCompareMode(c => !c)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0",
              compareMode
                ? "bg-foreground text-background"
                : nightMode ? "text-stone-400 hover:text-stone-200" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            title="Comparar versões"
          >
            <GitCompare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Comparar</span>
          </button>

          {compareMode && (
            <select
              value={compareVersion}
              onChange={e => setCompareVersion(e.target.value)}
              className={cn(
                "text-xs border rounded px-1.5 py-1 flex-shrink-0",
                nightMode ? "border-stone-700 text-stone-200 bg-stone-900" : "border-border text-foreground bg-background"
              )}
            >
              {VERSIONS.filter(v => v.id !== selectedVersion).map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          )}

          {/* Night mode */}
          <button
            onClick={() => setNightMode(n => !n)}
            className={cn(
              "flex items-center justify-center w-9 h-9 min-w-[2.25rem] rounded-md transition-colors flex-shrink-0",
              nightMode ? "bg-stone-700 text-stone-100" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            title={nightMode ? "Modo claro" : "Modo noturno"}
          >
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "read" && (
            <BibleChapterView
              book={selectedBook}
              chapter={selectedChapter}
              version={selectedVersion}
              compareMode={compareMode}
              compareVersion={compareVersion}
              nightMode={nightMode}
              onInsertVerse={onInsertVerse}
              onChapterChange={setSelectedChapter}
              selectedVerses={selectedVerses}
              onSelectedVersesChange={setSelectedVerses}
            />
          )}
          {activeTab === "favorites" && (
            <BibleFavoritesView onInsertVerse={onInsertVerse} />
          )}
          {activeTab === "progress" && (
            <ReadingTracker />
          )}
        </div>
      </div>
    </div>
  );
}