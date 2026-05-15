import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronRight, ChevronDown, Plus, MoreHorizontal,
  FileText, Search, Star, CheckCircle,
  Lightbulb, Trash2, Calendar, Moon, Sun, Pin, Info, Flame, LogOut, BookOpen, FileSearch
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import FolderMenu from "./FolderMenu";
import NewFolderDialog from "./NewFolderDialog";

const NAV_ITEMS = [
  { key: "bible", label: "Bíblia", icon: BookOpen, isBible: true },
  { key: "bible-summary", label: "Resumo Bíblico", icon: FileSearch, isBibleSummary: true },
  { key: "favorites", label: "Favoritas", icon: Star },
  { key: "preached", label: "Histórico pregações", icon: Calendar },
  { key: "ideas", label: "Ideias Rápidas", icon: Lightbulb },
  { key: "trash", label: "Lixeira", icon: Trash2 },
];

export default function Sidebar({ selectedNoteId, onSelectNote, onSelectFolder, selectedFolderId, activeSection, onSectionChange, darkMode, onToggleDark }) {
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [search, setSearch] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState(null);
  const [menuFolder, setMenuFolder] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const loadData = async () => {
    const [f, n] = await Promise.all([
      base44.entities.Folder.list("-created_date", 200),
      base44.entities.Note.list("-updated_date", 500),
    ]);
    setFolders(f);
    setNotes(n);
  };

  useEffect(() => { loadData(); }, []);

  const toggleFolder = (id) => setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));

  // Search across title, content (stripped), and tags
  const searchResults = search.trim()
    ? notes.filter(n => {
        const q = search.toLowerCase();
        const inTitle = n.title?.toLowerCase().includes(q);
        const inContent = n.content?.replace(/<[^>]+>/g, " ").toLowerCase().includes(q);
        const inTags = (n.tags || []).some(t => t.includes(q));
        return inTitle || inContent || inTags;
      })
    : [];

  const rootFolders = folders.filter(f => !f.parent_id);
  const pinnedFolders = rootFolders.filter(f => f.fixado);
  const unpinnedFolders = rootFolders.filter(f => !f.fixado);

  const renderFolder = (folder, depth = 0) => {
    const children = folders.filter(f => f.parent_id === folder.id);
    const folderNotes = notes.filter(n => n.folder_id === folder.id);
    const isExpanded = expandedFolders[folder.id];
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "group flex items-center gap-1 py-1 rounded-md cursor-pointer transition-all",
            isSelected ? "bg-accent" : "hover:bg-accent/60"
          )}
          style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: "4px" }}
          onClick={() => onSelectFolder(folder)}
        >
          <span
            className="text-muted-foreground w-4 h-4 flex items-center justify-center flex-shrink-0 hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
          <span className="text-base mr-1">{folder.icon || "📁"}</span>
          <span className="text-sm font-medium text-foreground truncate flex-1">{folder.name}</span>
          {folder.fixado && <Pin className="w-2.5 h-2.5 text-blue-400 flex-shrink-0 mr-1" />}
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-5 w-5"
              onClick={(e) => { e.stopPropagation(); setNewFolderParentId(folder.id); setShowNewFolder(true); }}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5"
              onClick={(e) => { e.stopPropagation(); setMenuFolder(folder); setMenuPos({ x: e.clientX, y: e.clientY }); }}>
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
              {children.map(child => renderFolder(child, depth + 1))}
              {folderNotes.map(note => (
                <div
                  key={note.id}
                  className={cn(
                    "flex items-center gap-2 py-1 rounded-md cursor-pointer transition-all text-sm",
                    selectedNoteId === note.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  )}
                  style={{ paddingLeft: `${18 + (depth + 1) * 14}px`, paddingRight: "8px" }}
                  onClick={(e) => { e.stopPropagation(); onSelectNote(note); }}
                >
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{note.title || "Sem título"}</span>
                  {note.favorito && <Star className="w-3 h-3 text-yellow-500 fill-current ml-auto flex-shrink-0" />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-sm text-foreground">VerbumFlame</span>
          </div>
          <button
            onClick={onToggleDark}
            title="Alternar tema"
            className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent active:bg-accent/80 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs bg-background border-border"
          />
        </div>
      </div>

      {/* Search results */}
      {search.trim() && (
        <div className="border-b border-sidebar-border bg-background/60 max-h-48 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">Nenhum resultado</p>
          ) : (
            searchResults.map(note => (
              <div key={note.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-xs"
                onClick={() => { setSearch(""); onSelectNote(note); }}>
                <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-foreground truncate">{note.title}</p>
                  {(note.tags || []).length > 0 && (
                    <p className="text-muted-foreground/60">{note.tags.map(t => `#${t}`).join(" ")}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Nav items */}
      <div className="px-2 pt-2 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => onSectionChange(item.key)}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors",
              activeSection === item.key
                ? (item.isBible || item.isBibleSummary) ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 font-semibold" : "bg-accent text-foreground font-medium"
                : (item.isBible || item.isBibleSummary) ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {item.icon && <item.icon className={cn("w-3.5 h-3.5 flex-shrink-0", (item.isBible || item.isBibleSummary) && "text-amber-600")} />}
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-3 pt-3 pb-1">
        <div className="w-full h-px bg-sidebar-border" />
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex items-center justify-between px-1 py-1 mb-0.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pastas</span>
          <Button variant="ghost" size="icon" className="h-5 w-5"
            onClick={() => { setNewFolderParentId(null); setShowNewFolder(true); }}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {rootFolders.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-2 text-center">Nenhuma pasta</p>
        ) : (
          <>
            {pinnedFolders.length > 0 && (
              <div className="mb-1">
                <p className="text-xs text-muted-foreground/60 px-2 pb-0.5 flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5" /> Fixadas
                </p>
                {pinnedFolders.map(f => renderFolder(f))}
                {unpinnedFolders.length > 0 && <div className="h-px bg-sidebar-border mx-2 my-1" />}
              </div>
            )}
            {unpinnedFolders.map(f => renderFolder(f))}
          </>
        )}
      </div>

      {/* Bottom links */}
      <div className="px-2 py-2 border-t border-sidebar-border space-y-0.5">
        <Link to="/about" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          Sobre o VerbumFlame
        </Link>
        <button
          onClick={() => {
            if (confirm("Deseja sair da conta?")) {
              // Clear query cache to prevent data leaking to next user
              queryClientInstance.clear();
              base44.auth.logout();
            }
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          Sair da conta
        </button>
      </div>

      {showNewFolder && (
        <NewFolderDialog parentId={newFolderParentId} onClose={() => setShowNewFolder(false)} onCreated={loadData} />
      )}
      {menuFolder && (
        <FolderMenu
          folder={menuFolder}
          position={menuPos}
          onClose={() => setMenuFolder(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}