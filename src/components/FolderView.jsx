import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Plus, Clock, Star, CheckCircle, Pin, LayoutTemplate, X, ChevronLeft, Mic, PenLine, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import NoteTemplate from "./NoteTemplate";

const FILTERS = [
  { key: "all", label: "Todas", icon: FileText },
  { key: "ministeradas", label: "Ministradas", icon: Mic },
  { key: "rascunho", label: "Rascunho", icon: PenLine },
  { key: "falta_ministrar", label: "Falta ministrar", icon: AlertCircle },
  { key: "favoritas", label: "Favoritas", icon: Star },
  { key: "fixadas", label: "Fixadas", icon: Pin },
];

const FILTER_STORAGE_KEY = (folderId) => `folder_filter_${folderId}`;

export default function FolderView({ folder, onSelectNote, onNoteCreated, onBack, onSelectFolder }) {
  const [notes, setNotes] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState(() => {
    return localStorage.getItem(FILTER_STORAGE_KEY(folder.id)) || "all";
  });
  const [tagFilter, setTagFilter] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [allTags, setAllTags] = useState([]);

  const loadData = async () => {
    const [n, f] = await Promise.all([
      base44.entities.Note.filter({ folder_id: folder.id }, "-updated_date"),
      base44.entities.Folder.filter({ parent_id: folder.id }),
    ]);
    setNotes(n);
    setSubfolders(f);
    const tags = [...new Set(n.flatMap(note => note.tags || []))];
    setAllTags(tags);
  };

  useEffect(() => {
    loadData();
    // Restore saved filter for this folder
    const saved = localStorage.getItem(FILTER_STORAGE_KEY(folder.id));
    if (saved) setActiveFilter(saved);
    else setActiveFilter("all");
  }, [folder.id]);

  // Listen for note deletion to update list immediately
  useEffect(() => {
    const handler = (e) => {
      const { id } = e.detail;
      setNotes(prev => prev.filter(n => n.id !== id));
    };
    window.addEventListener("note-deleted", handler);
    return () => window.removeEventListener("note-deleted", handler);
  }, []);

  const handleNewNote = async () => {
    setCreating(true);
    const note = await base44.entities.Note.create({ title: "Sem título", content: "", folder_id: folder.id, icon: "📝" });
    setCreating(false);
    // Optimistic update - add immediately
    setNotes(prev => [note, ...prev]);
    onSelectNote(note);
    onNoteCreated && onNoteCreated();
  };

  const handleTemplateCreated = (note) => {
    loadData();
    onSelectNote(note);
    onNoteCreated && onNoteCreated();
  };

  const pinned = notes.filter(n => n.fixado);
  const unpinned = notes.filter(n => !n.fixado);

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    localStorage.setItem(FILTER_STORAGE_KEY(folder.id), key);
  };

  const applyFilters = (list) => {
    let filtered = list;
    if (activeFilter === "favoritas") filtered = filtered.filter(n => n.favorito);
    if (activeFilter === "ministeradas") filtered = filtered.filter(n => n.pregado);
    if (activeFilter === "rascunho") filtered = filtered.filter(n => !n.pregado && !n.fixado);
    if (activeFilter === "falta_ministrar") filtered = filtered.filter(n => !n.pregado);
    if (activeFilter === "fixadas") filtered = filtered.filter(n => n.fixado);
    if (tagFilter) filtered = filtered.filter(n => (n.tags || []).includes(tagFilter));
    return filtered;
  };

  const displayNotes = applyFilters(activeFilter === "fixadas" ? notes : unpinned);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <span className="text-4xl">{folder.icon || "📁"}</span>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{folder.name}</h1>
              <p className="text-sm text-muted-foreground">{notes.length} nota{notes.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowTemplate(true)} className="h-8 text-xs">
              <LayoutTemplate className="w-3.5 h-3.5 mr-1" /> Template
            </Button>
            <Button size="sm" onClick={handleNewNote} disabled={creating} className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Nova nota
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                activeFilter === f.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <f.icon className="w-3 h-3" /> {f.label}
            </button>
          ))}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all",
                tagFilter === tag
                  ? "bg-foreground text-background"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              #{tag}
              {tagFilter === tag && <X className="w-3 h-3 ml-0.5" />}
            </button>
          ))}
        </div>

        {/* Pinned notes */}
        {pinned.length > 0 && activeFilter === "all" && !tagFilter && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Pin className="w-3 h-3" /> Fixadas
            </p>
            <div className="grid grid-cols-1 gap-2">
              {pinned.map(note => <NoteCard key={note.id} note={note} onClick={() => onSelectNote(note)} />)}
            </div>
          </div>
        )}

        {/* Subfolders */}
        {subfolders.length > 0 && activeFilter === "all" && !tagFilter && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subpastas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subfolders.map(sf => (
                <div
                  key={sf.id}
                  onClick={() => onSelectFolder && onSelectFolder(sf)}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent/40 transition-colors cursor-pointer"
                >
                  <span className="text-xl">{sf.icon || "📁"}</span>
                  <span className="font-medium text-sm text-foreground">{sf.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="grid grid-cols-1 gap-2">
          <AnimatePresence>
            {displayNotes.map((note, i) => (
              <NoteCard key={note.id} note={note} index={i} onClick={() => onSelectNote(note)} />
            ))}
          </AnimatePresence>
          {displayNotes.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Nenhuma nota neste filtro</p>
              {activeFilter === "all" && !tagFilter && (
                <Button variant="outline" onClick={handleNewNote} disabled={creating}>
                  <Plus className="w-4 h-4 mr-1.5" /> Criar primeira nota
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {showTemplate && (
        <NoteTemplate
          folderId={folder.id}
          onCreated={handleTemplateCreated}
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  );
}

function NoteCard({ note, onClick, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer"
    >
      <span className="text-xl mt-0.5">{note.icon || "📝"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground text-sm truncate">{note.title || "Sem título"}</h3>
          {note.favorito && <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />}
          {note.pregado && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
          {note.fixado && <Pin className="w-3 h-3 text-blue-500 flex-shrink-0" />}
        </div>
        {note.content && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1"
            dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]+>/g, " ").slice(0, 100) }}
          />
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {(note.tags || []).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-accent text-muted-foreground">#{tag}</span>
          ))}
          <span className="text-xs text-muted-foreground/50 flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            {note.updated_date ? format(new Date(note.updated_date), "d MMM", { locale: ptBR }) : "—"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}