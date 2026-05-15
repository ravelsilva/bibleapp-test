import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Copy, Plus, Highlighter, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = [
  { id: "yellow", label: "Promessas", hex: "#facc15" },
  { id: "green", label: "Fé", hex: "#4ade80" },
  { id: "blue", label: "Sabedoria", hex: "#60a5fa" },
  { id: "red", label: "Doutrina", hex: "#f87171" },
  { id: "purple", label: "Pregação", hex: "#c084fc" },
];

export default function VerseMenu({ verse, position, highlight, isFavorite, onHighlight, onFavorite, onInsert, onCopy, onClose, canInsert, bookName, chapter, version }) {
  const ref = useRef(null);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [annotation, setAnnotation] = useState(highlight?.annotation || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnnotation(highlight?.annotation || "");
  }, [highlight]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const saveAnnotation = async () => {
    setSaving(true);
    if (highlight) {
      await base44.entities.BibleHighlight.update(highlight.id, { annotation });
    } else {
      await base44.entities.BibleHighlight.create({
        version,
        book_abbrev: verse.book || "",
        book_name: bookName,
        chapter,
        verse: verse.number,
        verse_text: verse.text,
        color: "yellow",
        annotation,
      });
    }
    setSaving(false);
    setShowAnnotation(false);
    onClose();
  };

  // Position the menu smartly
  const menuStyle = {
    position: "fixed",
    zIndex: 100,
    left: Math.min(position.x, window.innerWidth - 240),
    top: Math.min(position.y + 8, window.innerHeight - 320),
  };

  return (
    <div ref={ref} style={menuStyle}
      className="w-56 bg-card border border-border rounded-xl shadow-xl py-2 overflow-hidden">
      {/* Verse preview */}
      <div className="px-3 pb-2 border-b border-border">
        <p className="text-xs text-muted-foreground font-medium">{bookName} {chapter}:{verse.number} — {version.toUpperCase()}</p>
        <p className="text-xs text-foreground mt-0.5 line-clamp-2 font-crimson">{verse.text}</p>
      </div>

      {/* Highlight colors */}
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
          <Highlighter className="w-3 h-3" /> Destacar
        </p>
        <div className="flex gap-1.5">
          {COLORS.map(c => (
            <button key={c.id} onClick={() => onHighlight(c.id)} title={c.label}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                highlight?.color === c.id ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Annotation */}
      {showAnnotation ? (
        <div className="px-3 py-2 border-b border-border">
          <textarea
            value={annotation}
            onChange={e => setAnnotation(e.target.value)}
            placeholder="Sua anotação..."
            className="w-full text-xs border border-border rounded-md px-2 py-1.5 resize-none h-20 bg-background text-foreground"
          />
          <div className="flex gap-1 mt-1">
            <Button size="sm" className="h-6 text-xs flex-1" onClick={saveAnnotation} disabled={saving}>
              {saving ? "..." : "Salvar"}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowAnnotation(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="py-1">
        <button onClick={() => setShowAnnotation(s => !s)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          {highlight?.annotation ? "Editar anotação" : "Adicionar anotação"}
        </button>
        <button onClick={onFavorite}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors">
          <Star className={cn("w-3.5 h-3.5", isFavorite ? "text-yellow-500 fill-current" : "text-muted-foreground")} />
          {isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        </button>
        {canInsert && (
          <button onClick={onInsert}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors">
            <Plus className="w-3.5 h-3.5 text-muted-foreground" /> Inserir na nota
          </button>
        )}
        <button onClick={onCopy}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors">
          <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Copiar versículo
        </button>
      </div>
    </div>
  );
}