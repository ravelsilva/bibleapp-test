import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Paperclip, ChevronLeft, MoreHorizontal, Maximize2, Home,
  BookMarked, FileDown, LayoutTemplate, Undo2
} from "lucide-react";
import NoteAttachments from "./NoteAttachments";
import NoteMenu from "./NoteMenu";
import NoteMetaBar from "./NoteMetaBar";
import PreachMode from "./PreachMode";
import BiblePanel from "./BiblePanel";
import NoteTemplate from "@/components/NoteTemplate";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const HIGHLIGHT_COLORS = [
  { label: "Amarelo", bg: "#fef08a" },
  { label: "Verde", bg: "#bbf7d0" },
  { label: "Azul", bg: "#bfdbfe" },
  { label: "Rosa", bg: "#fecdd3" },
  { label: "Laranja", bg: "#fed7aa" },
];

const QUILL_MODULES = {
  toolbar: { container: "#note-toolbar" },
  history: { delay: 500, maxStack: 100, userOnly: false },
};

const QUILL_FORMATS = [
  "header", "bold", "italic", "underline", "strike",
  "list", "bullet", "blockquote", "code-block", "link", "color", "background",
];

export default function NoteEditor({ note, onBack, onGoHome, onDeleted, onUpdated }) {
  const [currentNote, setCurrentNote] = useState(note);
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [saving, setSaving] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [preachMode, setPreachMode] = useState(false);
  const [showBiblePanel, setShowBiblePanel] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const saveTimer = useRef(null);
  const quillRef = useRef(null);

  const save = useCallback(async (t, c) => {
    setSaving(true);
    await base44.entities.Note.update(currentNote.id, { title: t, content: c });
    setSaving(false);
    const merged = { ...currentNote, title: t, content: c };
    setCurrentNote(merged);
    onUpdated && onUpdated(merged);
  }, [currentNote.id]);

  const scheduleSave = (t, c) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(t, c), 1200);
  };

  const handleTitleChange = (val) => { setTitle(val); scheduleSave(val, content); };
  const handleContentChange = (val) => { setContent(val); scheduleSave(title, val); };

  const handleMetaChange = (updated) => {
    setCurrentNote(updated);
    onUpdated && onUpdated(updated);
  };

  useEffect(() => {
    setCurrentNote(note);
    setTitle(note.title || "");
    setContent(note.content || "");
  }, [note.id]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const handleUndo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) quill.history.undo();
  };

  const applyHighlight = (color) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const sel = quill.getSelection();
    if (!sel || sel.length === 0) return;
    quill.formatText(sel.index, sel.length, "background", color);
  };

  const removeHighlight = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const sel = quill.getSelection();
    if (!sel || sel.length === 0) return;
    quill.formatText(sel.index, sel.length, "background", false);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    const editorEl = document.querySelector(".ql-editor");
    if (!editorEl) return;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidthMM = pdf.internal.pageSize.getWidth();
    const pageHeightMM = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidthMM = pageWidthMM - margin * 2;

    const canvas = await html2canvas(editorEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      allowTaint: true,
    });

    // MM per pixel ratio using actual canvas width
    const pxToMM = contentWidthMM / canvas.width;

    // Title block
    const titleBlockMM = 22;
    const startY = margin + titleBlockMM;
    const availFirstPage = pageHeightMM - startY - margin;
    const availOtherPages = pageHeightMM - margin * 2;

    const titleText = title || "Nota sem título";
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    const titleLines = pdf.splitTextToSize(titleText, contentWidthMM);
    pdf.text(titleLines, margin, margin + 8);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(130, 130, 130);
    pdf.text(`Exportado em ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, margin + 16);
    pdf.setTextColor(0, 0, 0);

    // Slice canvas into pages
    let sourceYPx = 0;
    let destYMM = startY;
    let isFirstPage = true;

    while (sourceYPx < canvas.height) {
      const availMM = isFirstPage ? availFirstPage : availOtherPages;
      const sliceHeightPx = Math.min(Math.round(availMM / pxToMM), canvas.height - sourceYPx);
      const sliceHeightMM = sliceHeightPx * pxToMM;

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, sourceYPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, destYMM, contentWidthMM, sliceHeightMM);

      sourceYPx += sliceHeightPx;
      if (sourceYPx < canvas.height) {
        pdf.addPage();
        destYMM = margin;
        isFirstPage = false;
      }
    }

    pdf.save(`${title || "nota"}.pdf`);
  };

  const updatedAt = currentNote.updated_date
    ? format(new Date(currentNote.updated_date), "d 'de' MMM 'às' HH:mm", { locale: ptBR })
    : null;

  if (preachMode) {
    return <PreachMode note={{ ...currentNote, title, content }} onClose={() => setPreachMode(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[2.25rem]" onClick={onBack} title="Voltar">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[2.25rem]" onClick={onGoHome} title="Início">
            <Home className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {saving && <span className="text-xs text-muted-foreground px-1 hidden sm:block">Salvando...</span>}
          {!saving && updatedAt && <span className="text-xs text-muted-foreground hidden lg:block px-1">Salvo {updatedAt}</span>}
          <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[2.25rem]" onClick={handleUndo} title="Desfazer">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[2.25rem]" onClick={() => setShowTemplateModal(true)} title="Templates">
            <LayoutTemplate className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[2.25rem]" onClick={exportPDF} title="Exportar PDF">
            <FileDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[2.25rem]" onClick={() => setPreachMode(true)} title="Modo Pregar">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => setShowBiblePanel(!showBiblePanel)}
            title="Bíblia"
            className={showBiblePanel ? "h-9 w-9 min-w-[2.25rem] bg-amber-100 dark:bg-amber-900/30 text-amber-700" : "h-9 w-9 min-w-[2.25rem]"}
          >
            <BookMarked className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[2.25rem]" onClick={() => setShowAttachments(!showAttachments)} title="Anexos">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-9 w-9 min-w-[2.25rem]"
            onClick={(e) => { setMenuPos({ x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 100) }); setShowMenu(true); }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Meta bar */}
      <NoteMetaBar note={currentNote} onChange={handleMetaChange} />

      {/* Sticky Quill Toolbar - always visible, not pushed by keyboard */}
      <div className="flex-shrink-0 bg-background border-b border-border flex items-center flex-wrap gap-1 px-2 py-1 overflow-x-auto">
        <div id="note-toolbar" className="flex items-center flex-wrap gap-0 ql-toolbar ql-snow" style={{ border: "none", padding: 0 }}>
          <select className="ql-header" defaultValue="">
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
            <option value="">Normal</option>
          </select>
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
          <button className="ql-blockquote" />
          <button className="ql-code-block" />
          <button className="ql-link" />
          <select className="ql-color" />
          <button className="ql-clean" />
        </div>
        {/* Highlight colors */}
        <div className="flex items-center gap-1 ml-1 border-l border-border pl-2">
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.label}
              title={`Destacar ${c.label}`}
              className="w-4 h-4 rounded-full border border-white/60 hover:scale-125 transition-transform shadow-sm flex-shrink-0"
              style={{ backgroundColor: c.bg }}
              onMouseDown={(e) => { e.preventDefault(); applyHighlight(c.bg); }}
            />
          ))}
          <button
            title="Remover destaque"
            className="text-xs text-muted-foreground hover:text-foreground px-1 rounded hover:bg-accent transition-colors ml-0.5 flex-shrink-0"
            onMouseDown={(e) => { e.preventDefault(); removeHighlight(); }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-10 py-8">
            <div className="mb-6">
              <div className="text-4xl mb-3 select-none">{currentNote.icon || "📝"}</div>
              <Input
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Sem título"
                className="text-3xl font-semibold font-crimson border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40"
              />
            </div>
            <ReactQuill
              ref={quillRef}
              value={content}
              onChange={handleContentChange}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              placeholder="Escreva algo incrível..."
              theme="snow"
            />
          </div>
        </div>

        {showBiblePanel && (
          <div className="w-72 border-l border-border bg-muted/20 overflow-y-auto flex-shrink-0">
            <BiblePanel onInsert={(verseData) => {
              const quill = quillRef.current?.getEditor();
              if (!quill) return;
              const range = quill.getSelection(true);
              const pos = range ? range.index + range.length : quill.getLength();
              // Insert as a single blockquote block using HTML
              const lines = verseData.text.split("\n");
              const html = `<blockquote>${lines.join("<br>")}<br><em>${verseData.reference} — ${verseData.version}</em></blockquote>`;
              quill.clipboard.dangerouslyPasteHTML(pos, html);
              const newContent = quill.root.innerHTML;
              setContent(newContent);
              scheduleSave(title, newContent);
            }} />
          </div>
        )}
        {showAttachments && (
          <div className="w-72 border-l border-border bg-muted/20 overflow-y-auto flex-shrink-0">
            <NoteAttachments noteId={currentNote.id} />
          </div>
        )}
      </div>

      {showMenu && (
        <NoteMenu
          note={currentNote}
          position={menuPos}
          onClose={() => setShowMenu(false)}
          onDeleted={onDeleted}
        />
      )}
      {showTemplateModal && (
        <NoteTemplate
          folderId={currentNote.folder_id}
          onCreated={(note) => { setShowTemplateModal(false); onUpdated && onUpdated(note); }}
          onClose={() => setShowTemplateModal(false)}
          applyToExisting={(templateContent) => {
            setContent(templateContent);
            scheduleSave(title, templateContent);
            setShowTemplateModal(false);
          }}
        />
      )}
    </div>
  );
}