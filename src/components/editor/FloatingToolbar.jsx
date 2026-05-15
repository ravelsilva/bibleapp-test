import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Highlighter } from "lucide-react";

const COLORS = [
  { label: "Amarelo", bg: "#fef08a", text: "#000" },
  { label: "Verde", bg: "#bbf7d0", text: "#000" },
  { label: "Azul", bg: "#bfdbfe", text: "#000" },
  { label: "Rosa", bg: "#fecdd3", text: "#000" },
  { label: "Laranja", bg: "#fed7aa", text: "#000" },
];

export default function FloatingToolbar({ quillRef }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef(null);

  useEffect(() => {
    const checkSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setVisible(false);
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0) { setVisible(false); return; }

      setPosition({
        top: rect.top + window.scrollY - 48,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setVisible(true);
    };

    document.addEventListener("selectionchange", checkSelection);
    return () => document.removeEventListener("selectionchange", checkSelection);
  }, []);

  const applyFormat = (format, value = true) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const sel = quill.getSelection();
    if (!sel) return;
    quill.formatText(sel.index, sel.length, format, value);
  };

  const applyBackground = (color) => {
    applyFormat("background", color);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[9999] flex items-center gap-1 px-2 py-1.5 rounded-lg bg-foreground shadow-xl border border-foreground/20"
      style={{ top: position.top, left: position.left, transform: "translateX(-50%)" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        className="p-1.5 rounded hover:bg-white/10 text-background transition-colors"
        onMouseDown={() => applyFormat("bold")}
        title="Negrito"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        className="p-1.5 rounded hover:bg-white/10 text-background transition-colors"
        onMouseDown={() => applyFormat("italic")}
        title="Itálico"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        className="p-1.5 rounded hover:bg-white/10 text-background transition-colors"
        onMouseDown={() => applyFormat("underline")}
        title="Sublinhado"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-white/20 mx-0.5" />
      {COLORS.map((c) => (
        <button
          key={c.label}
          className="w-5 h-5 rounded-full border-2 border-white/30 hover:scale-110 transition-transform"
          style={{ backgroundColor: c.bg }}
          onMouseDown={() => applyBackground(c.bg)}
          title={`Destacar ${c.label}`}
        />
      ))}
      <button
        className="p-1.5 rounded hover:bg-white/10 text-background/60 transition-colors"
        onMouseDown={() => applyFormat("background", false)}
        title="Remover destaque"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}