import { useState, useEffect } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PreachMode({ note, onClose }) {
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9998] bg-background flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tamanho:</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setFontSize(f => Math.max(14, f - 2))}>
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
          <span className="text-sm font-medium w-8 text-center">{fontSize}</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setFontSize(f => Math.min(28, f + 2))}>
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
        </div>
        <span className="text-sm font-medium text-muted-foreground">Modo Pregar — ESC para sair</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-4xl mx-auto px-8 sm:px-16 py-12">
          <div className="flex items-center gap-4 mb-8">
            <span style={{ fontSize: fontSize * 1.4 }}>{note.icon || "📝"}</span>
            <h1
              className="font-crimson font-semibold text-foreground leading-tight"
              style={{ fontSize: fontSize + 12 }}
            >
              {note.title || "Sem título"}
            </h1>
          </div>
          <div
            className="font-crimson text-foreground leading-loose prose prose-lg max-w-none"
            style={{ fontSize }}
            dangerouslySetInnerHTML={{ __html: note.content || "<p>Sem conteúdo.</p>" }}
          />
        </div>
      </div>
    </div>
  );
}