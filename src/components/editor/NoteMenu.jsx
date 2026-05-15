import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2 } from "lucide-react";

export default function NoteMenu({ note, position, onClose, onDeleted }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Calculate safe position so menu doesn't go off-screen
  const menuWidth = 180;
  const menuHeight = 60;
  const safeLeft = Math.min(position.x, window.innerWidth - menuWidth - 8);
  const safeTop = Math.min(position.y, window.innerHeight - menuHeight - 8);

  const handleDelete = async () => {
    const now = new Date();
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000);
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
    onDeleted(note.id);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1"
      style={{ left: safeLeft, top: safeTop, minWidth: menuWidth }}
    >
      <button
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        onClick={handleDelete}
      >
        <Trash2 className="w-4 h-4 flex-shrink-0" /> Excluir nota
      </button>
    </div>
  );
}