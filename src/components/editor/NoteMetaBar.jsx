import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, CheckCircle, Calendar, Tag, Pin, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NoteMetaBar({ note, onChange }) {
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const update = async (fields) => {
    await base44.entities.Note.update(note.id, fields);
    onChange({ ...note, ...fields });
  };

  const toggleFavorito = () => update({ favorito: !note.favorito });
  const toggleFixado = () => update({ fixado: !note.fixado });
  const togglePregado = () => {
    if (note.pregado) {
      update({ pregado: false, data_pregacao: null });
    } else {
      setShowDatePicker(true);
    }
  };

  const handleDateConfirm = async (e) => {
    const date = e.target.value;
    if (date) {
      await update({ pregado: true, data_pregacao: date });
    }
    setShowDatePicker(false);
  };

  const addTag = async () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag) return;
    const tags = [...(note.tags || [])];
    if (!tags.includes(tag)) {
      await update({ tags: [...tags, tag] });
    }
    setTagInput("");
    setShowTagInput(false);
  };

  const removeTag = async (tag) => {
    await update({ tags: (note.tags || []).filter(t => t !== tag) });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-2 border-b border-border bg-muted/20 text-xs">
      {/* Favorito */}
      <button
        onClick={toggleFavorito}
        className={cn("flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
          note.favorito ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "text-muted-foreground hover:bg-accent"
        )}
        title="Favoritar"
      >
        <Star className={cn("w-3.5 h-3.5", note.favorito && "fill-current")} />
        {note.favorito ? "Favorita" : "Favoritar"}
      </button>

      {/* Fixar */}
      <button
        onClick={toggleFixado}
        className={cn("flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
          note.fixado ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-muted-foreground hover:bg-accent"
        )}
        title="Fixar no topo"
      >
        <Pin className="w-3.5 h-3.5" />
        {note.fixado ? "Fixada" : "Fixar"}
      </button>

      {/* Pregado */}
      <button
        onClick={togglePregado}
        className={cn("flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
          note.pregado ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "text-muted-foreground hover:bg-accent"
        )}
        title="Marcar como pregada"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        {note.pregado
          ? `Pregada${note.data_pregacao ? " · " + format(new Date(note.data_pregacao + "T00:00:00"), "d MMM yyyy", { locale: ptBR }) : ""}`
          : "Marcar pregada"}
      </button>

      {showDatePicker && (
        <input
          type="date"
          className="border border-border rounded px-2 py-0.5 text-xs bg-card"
          onChange={handleDateConfirm}
          autoFocus
          onBlur={() => setShowDatePicker(false)}
        />
      )}

      {/* Divider */}
      <div className="w-px h-4 bg-border mx-1" />

      {/* Tags */}
      {(note.tags || []).map(tag => (
        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-foreground font-medium">
          #{tag}
          <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {showTagInput ? (
        <div className="flex items-center gap-1">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addTag(); if (e.key === "Escape") setShowTagInput(false); }}
            placeholder="nova-tag"
            className="h-6 text-xs w-28 px-2"
            autoFocus
          />
          <button onClick={addTag} className="text-muted-foreground hover:text-foreground"><Plus className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button
          onClick={() => setShowTagInput(true)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Tag className="w-3 h-3" /> Tag
        </button>
      )}
    </div>
  );
}