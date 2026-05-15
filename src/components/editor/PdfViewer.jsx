import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Highlighter, Eraser, StickyNote, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const HIGHLIGHT_COLORS = [
  { hex: "#fef08a", label: "Amarelo" },
  { hex: "#bbf7d0", label: "Verde" },
  { hex: "#bfdbfe", label: "Azul" },
  { hex: "#fecdd3", label: "Rosa" },
  { hex: "#fed7aa", label: "Laranja" },
];

export default function PdfViewer({ file, onClose }) {
  const [activeColor, setActiveColor] = useState(null);
  const [annotation, setAnnotation] = useState(file.annotation || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(!!file.annotation);
  const saveTimer = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    setAnnotation(file.annotation || "");
    setShowAnnotation(!!file.annotation);
  }, [file.id]);

  // Inject CSS into the iframe to apply highlight cursor when a color is active
  useEffect(() => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;
      let style = iframe.contentDocument.getElementById("vf-highlight-style");
      if (!style) {
        style = iframe.contentDocument.createElement("style");
        style.id = "vf-highlight-style";
        iframe.contentDocument.head.appendChild(style);
      }
      style.textContent = activeColor
        ? `* { cursor: crosshair !important; } ::selection { background: ${activeColor} !important; }`
        : `::selection { background: highlight; }`;
    } catch {}
  }, [activeColor]);

  const handleAnnotationChange = (text) => {
    setAnnotation(text);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await base44.entities.NoteFile.update(file.id, { annotation: text });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card flex-shrink-0 flex-wrap">
        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.file_name}</span>

        <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
          <Highlighter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.hex}
              title={`Marca-texto ${c.label}`}
              onClick={() => setActiveColor(activeColor === c.hex ? null : c.hex)}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0",
                activeColor === c.hex ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
          {activeColor && (
            <button
              title="Desativar marca-texto"
              onClick={() => setActiveColor(null)}
              className="ml-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeColor && (
          <span className="text-xs text-muted-foreground italic">
            Selecione o texto no PDF para destacar
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAnnotation(s => !s)}
          >
            <StickyNote className="w-3.5 h-3.5" />
            Anotações
            {showAnnotation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Annotation bar */}
      {showAnnotation && (
        <div className="border-b border-border bg-muted/20 px-3 py-2 flex items-start gap-2 flex-shrink-0">
          <Textarea
            value={annotation}
            onChange={e => handleAnnotationChange(e.target.value)}
            placeholder="Escreva anotações sobre este PDF... (salvo automaticamente)"
            className="text-xs min-h-[60px] flex-1 resize-none border-border"
          />
          <div className="flex-shrink-0 pt-1">
            {saving ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Salvando
              </span>
            ) : saved ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Salvo
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* PDF iframe */}
      <iframe
        ref={iframeRef}
        src={file.file_url}
        title={file.file_name}
        className="flex-1 w-full border-0"
        style={{ background: "#525659" }}
      />
    </div>
  );
}