import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Edit2, Loader2, Pin, PinOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function FolderMenu({ folder, position, onClose, onRefresh }) {
  const ref = useRef(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    // Move all notes inside to trash
    const notes = await base44.entities.Note.filter({ folder_id: folder.id });
    const now = new Date();
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    await Promise.all(notes.map(async (note) => {
      await base44.entities.DeletedNote.create({
        original_id: note.id,
        title: note.title,
        content: note.content,
        folder_id: note.folder_id,
        icon: note.icon,
        tags: note.tags,
        favorito: note.favorito,
        pregado: note.pregado,
        data_pregacao: note.data_pregacao,
        fixado: note.fixado,
        deleted_at: now.toISOString(),
        expires_at: expires.toISOString(),
      });
      await base44.entities.Note.delete(note.id);
    }));
    await base44.entities.Folder.delete(folder.id);
    onRefresh();
    // Notify Home to go back to welcome screen and refresh stats
    window.dispatchEvent(new CustomEvent("folder-deleted", { detail: { id: folder.id } }));
    onClose();
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    await base44.entities.Folder.update(folder.id, { name: newName.trim() });
    onRefresh();
    onClose();
  };

  const handleTogglePin = async () => {
    await base44.entities.Folder.update(folder.id, { fixado: !folder.fixado });
    onRefresh();
    onClose();
  };

  // Safe position
  const safeLeft = Math.min(position.x, window.innerWidth - 180);
  const safeTop = Math.min(position.y, window.innerHeight - 150);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{ left: safeLeft, top: safeTop }}
    >
      {renaming ? (
        <div className="px-2 py-1">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") onClose(); }}
            autoFocus
            className="h-7 text-sm"
          />
        </div>
      ) : (
        <>
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            onClick={() => setRenaming(true)}
          >
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" /> Renomear
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            onClick={handleTogglePin}
          >
            {folder.fixado
              ? <><PinOff className="w-3.5 h-3.5 text-muted-foreground" /> Desafixar</>
              : <><Pin className="w-3.5 h-3.5 text-muted-foreground" /> Fixar pasta</>
            }
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {deleting ? "Excluindo..." : "Excluir pasta"}
          </button>
        </>
      )}
    </div>
  );
}