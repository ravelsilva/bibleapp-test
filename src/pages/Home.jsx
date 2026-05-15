import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/sidebar/Sidebar";
import NoteEditor from "@/components/editor/NoteEditor";
import FolderView from "@/components/FolderView";
import QuickIdeas from "@/components/QuickIdeas";
import TrashBox from "@/components/TrashBox";
import PreachHistory from "@/components/PreachHistory";
import { Flame, FileText, Folder, Star, Menu, X, ChevronLeft } from "lucide-react";
import BibleView from "@/components/bible/BibleView";
import BibleSummary from "./BibleSummary";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // "favorites"|"preached"|"ideas"|"trash"|null
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ notes: 0, folders: 0, favorites: 0 });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [noteHistory, setNoteHistory] = useState([]); // for back navigation

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const loadStats = async () => {
    const [notes, folders] = await Promise.all([
      base44.entities.Note.list("-created_date", 1000),
      base44.entities.Folder.list("-created_date", 1000),
    ]);
    setStats({
      notes: notes.length,
      folders: folders.length,
      favorites: notes.filter(n => n.favorito).length,
    });
  };

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    const handler = (e) => {
      const { id } = e.detail;
      // If viewing the deleted folder, go back home
      if (selectedFolder?.id === id) handleGoHome();
      loadStats();
    };
    window.addEventListener("folder-deleted", handler);
    return () => window.removeEventListener("folder-deleted", handler);
  }, [selectedFolder]);

  const handleSelectNote = (note) => {
    // Push current context to history
    setNoteHistory(prev => {
      const entry = selectedNote || selectedFolder || activeSection;
      if (entry) return [...prev.slice(-9), entry];
      return prev;
    });
    setSelectedNote(note);
    setSelectedFolder(null);
    setActiveSection(null);
    setSidebarOpen(false);
  };

  const handleSelectFolder = (folder) => {
    setNoteHistory([]);
    setSelectedFolder(folder);
    setSelectedNote(null);
    setActiveSection(null);
    setSidebarOpen(false);
  };

  const handleSectionChange = (section) => {
    setNoteHistory([]);
    setActiveSection(section);
    setSelectedNote(null);
    setSelectedFolder(null);
    setSidebarOpen(false);
    loadStats();
  };

  const handleBack = () => {
    if (noteHistory.length > 0) {
      const prev = noteHistory[noteHistory.length - 1];
      setNoteHistory(h => h.slice(0, -1));
      if (prev && typeof prev === "object" && prev.folder_id !== undefined) {
        // It's a note
        setSelectedNote(prev);
        setSelectedFolder(null);
        setActiveSection(null);
      } else if (prev && typeof prev === "object" && prev.name) {
        // It's a folder
        setSelectedFolder(prev);
        setSelectedNote(null);
        setActiveSection(null);
      } else {
        setSelectedNote(null);
        setSelectedFolder(null);
        setActiveSection(null);
      }
    } else {
      setSelectedNote(null);
      setSelectedFolder(null);
      setActiveSection(null);
    }
  };

  const handleGoHome = () => {
    setNoteHistory([]);
    setSelectedNote(null);
    setSelectedFolder(null);
    setActiveSection(null);
  };

  const handleNoteDeleted = (deletedId) => {
    setSelectedNote(null);
    setSelectedFolder(prev => prev); // keep folder context
    loadStats();
    // Dispatch event so FolderView can update
    window.dispatchEvent(new CustomEvent("note-deleted", { detail: { id: deletedId } }));
  };

  const handleNoteUpdated = (updatedNote) => {
    setSelectedNote(updatedNote);
  };

  const handleRestore = (note) => {
    handleSelectNote(note);
    loadStats();
  };

  const showWelcome = !selectedNote && !selectedFolder && !activeSection;

  const contentKey = selectedNote?.id || selectedFolder?.id || activeSection || "welcome";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed md:relative z-50 md:z-auto h-full transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} w-60 flex-shrink-0`}>
        <Sidebar
          selectedNoteId={selectedNote?.id}
          selectedFolderId={selectedFolder?.id}
          activeSection={activeSection}
          onSelectNote={handleSelectNote}
          onSelectFolder={handleSelectFolder}
          onSectionChange={handleSectionChange}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center px-4 py-3 border-b border-border bg-background">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent active:bg-accent/80 transition-colors -ml-1"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="ml-2 font-semibold text-sm text-foreground truncate">
            {selectedNote?.title || selectedFolder?.name || "VerbumFlame"}
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedNote ? (
              <motion.div key={`note-${selectedNote.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <NoteEditor
                  note={selectedNote}
                  onBack={handleBack}
                  onGoHome={handleGoHome}
                  onDeleted={handleNoteDeleted}
                  onUpdated={handleNoteUpdated}
                />
              </motion.div>
            ) : selectedFolder ? (
              <motion.div key={`folder-${selectedFolder.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <FolderView
                  folder={selectedFolder}
                  onSelectNote={handleSelectNote}
                  onNoteCreated={loadStats}
                  onBack={handleGoHome}
                  onSelectFolder={handleSelectFolder}
                />
              </motion.div>
            ) : activeSection === "ideas" ? (
              <motion.div key="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <QuickIdeas onConvertToNote={handleSelectNote} onBack={handleGoHome} />
              </motion.div>
            ) : activeSection === "trash" ? (
              <motion.div key="trash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <TrashBox onRestore={handleRestore} onBack={handleGoHome} />
              </motion.div>
            ) : activeSection === "bible" ? (
              <motion.div key="bible" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <BibleView onInsertVerse={selectedNote ? (v) => {
                  // store for NoteEditor to pick up
                  window.__bibleInsert = v;
                  window.dispatchEvent(new CustomEvent("bible-insert", { detail: v }));
                } : null} />
              </motion.div>
            ) : activeSection === "bible-summary" ? (
              <motion.div key="bible-summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <BibleSummary onBack={handleGoHome} />
              </motion.div>
            ) : activeSection === "all-folders" ? (
              <motion.div key="all-folders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <AllFoldersView onSelectFolder={handleSelectFolder} onBack={handleGoHome} />
              </motion.div>
            ) : activeSection === "all-notes" ? (
              <motion.div key="all-notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <AllNotesView onSelectNote={handleSelectNote} onBack={handleGoHome} />
              </motion.div>
            ) : activeSection === "preached" ? (
              <motion.div key="preached" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <PreachHistory onSelectNote={handleSelectNote} onBack={handleGoHome} />
              </motion.div>
            ) : activeSection === "favorites" ? (
              <motion.div key="favorites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                <FavoritesView onSelectNote={handleSelectNote} onBack={handleGoHome} />
              </motion.div>
            ) : (
              <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="max-w-sm">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5">
                    <Flame className="w-7 h-7 text-amber-500" />
                  </div>
                  <h1 className="text-2xl font-semibold text-foreground mb-1.5 font-crimson">VerbumFlame</h1>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                    Seu espaço sagrado para estudar, preparar pregações e organizar conteúdos.
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-left">
                    <StatCard icon={Folder} value={stats.folders} label="pastas" onClick={() => handleSectionChange("all-folders")} />
                    <StatCard icon={FileText} value={stats.notes} label="notas" onClick={() => handleSectionChange("all-notes")} />
                    <StatCard icon={Star} value={stats.favorites} label="favoritas" onClick={() => handleSectionChange("favorites")} />
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-6">Selecione uma pasta no menu lateral</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: IconComp, value, label, onClick }) {
  const Icon = IconComp;
  return (
    <button
      onClick={onClick}
      className="p-3 rounded-xl border border-border bg-card text-left hover:border-foreground/30 hover:bg-accent/50 active:scale-95 transition-all w-full"
    >
      <Icon className="w-4 h-4 text-muted-foreground mb-1.5" />
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </button>
  );
}

function AllFoldersView({ onSelectFolder, onBack }) {
  const [folders, setFolders] = useState([]);
  useEffect(() => {
    base44.entities.Folder.list("-created_date", 500).then(setFolders);
  }, []);
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Folder className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Todas as Pastas</h1>
          <span className="text-sm text-muted-foreground">({folders.length})</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {folders.map((folder, i) => (
            <motion.button key={folder.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => onSelectFolder(folder)}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-accent/30 transition-all text-left"
            >
              <span className="text-2xl">{folder.icon || "📁"}</span>
              <span className="font-medium text-sm text-foreground">{folder.name}</span>
            </motion.button>
          ))}
          {folders.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <Folder className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma pasta criada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AllNotesView({ onSelectNote, onBack }) {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    base44.entities.Note.list("-updated_date", 500).then(setNotes);
  }, []);
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <FileText className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Todas as Notas</h1>
          <span className="text-sm text-muted-foreground">({notes.length})</span>
        </div>
        <div className="space-y-2">
          {notes.map((note, i) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              onClick={() => onSelectNote(note)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 cursor-pointer transition-all"
            >
              <span className="text-xl">{note.icon || "📝"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{note.title || "Sem título"}</p>
                {(note.tags || []).length > 0 && (
                  <div className="flex gap-1 mt-1">{note.tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-accent text-muted-foreground">#{t}</span>)}</div>
                )}
              </div>
              {note.favorito && <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />}
            </motion.div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma nota criada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FavoritesView({ onSelectNote, onBack }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    base44.entities.Note.filter({ favorito: true }, "-updated_date").then(setNotes);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          {onBack && (
            <button onClick={onBack} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-3xl">⭐</span>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Favoritas</h1>
            <p className="text-sm text-muted-foreground">{notes.length} nota{notes.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="space-y-2">
          {notes.map((note, i) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => onSelectNote(note)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 cursor-pointer transition-all"
            >
              <span className="text-xl">{note.icon || "📝"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{note.title}</p>
                {(note.tags || []).length > 0 && (
                  <div className="flex gap-1 mt-1">{note.tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-accent text-muted-foreground">#{t}</span>)}</div>
                )}
              </div>
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            </motion.div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma nota favoritada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}