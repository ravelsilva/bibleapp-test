import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ArrowRight, Trash2, Lightbulb, ChevronLeft, X, FolderOpen, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function QuickIdeas({ onConvertToNote, onBack }) {
  const [ideas, setIdeas] = useState([]);
  const [folders, setFolders] = useState([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [convertingIdea, setConvertingIdea] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const load = async () => {
    const [data, folderData] = await Promise.all([
      base44.entities.QuickIdea.filter({ converted: false }, "-created_date"),
      base44.entities.Folder.list("-created_date", 100),
    ]);
    setIdeas(data);
    setFolders(folderData);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;
    setSaving(true);
    const newIdea = await base44.entities.QuickIdea.create({ content: input.trim(), converted: false });
    setInput("");
    setSaving(false);
    setIdeas(prev => [newIdea, ...prev]);
  };

  const handleDelete = async (id) => {
    await base44.entities.QuickIdea.delete(id);
    setIdeas(prev => prev.filter(i => i.id !== id));
  };

  const startConvert = (idea) => {
    setConvertingIdea(idea);
    setSelectedFolder(null);
    setNewFolderName("");
    setCreatingFolder(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const folder = await base44.entities.Folder.create({ name: newFolderName.trim(), icon: "📁" });
    setFolders(prev => [folder, ...prev]);
    setSelectedFolder(folder.id);
    setNewFolderName("");
    setCreatingFolder(false);
  };

  const confirmConvert = async () => {
    if (!convertingIdea) return;
    const note = await base44.entities.Note.create({
      title: convertingIdea.content.slice(0, 60),
      content: `<p>${convertingIdea.content}</p>`,
      icon: "💡",
      folder_id: selectedFolder || undefined,
    });
    await base44.entities.QuickIdea.update(convertingIdea.id, { converted: true, note_id: note.id });
    setIdeas(prev => prev.filter(i => i.id !== convertingIdea.id));
    setConvertingIdea(null);
    onConvertToNote && onConvertToNote(note);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <span className="text-3xl">💡</span>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Ideias Rápidas</h1>
            <p className="text-sm text-muted-foreground">Capture pensamentos e converta em notas depois</p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-8 p-4 rounded-xl border border-border bg-card">
          <Textarea
            placeholder="Uma ideia para uma mensagem, versículo que tocou, tema para estudar..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="border-none shadow-none resize-y bg-transparent focus-visible:ring-0 text-sm min-h-[80px]"
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">⌘+Enter para salvar</span>
            <Button size="sm" onClick={handleAdd} disabled={!input.trim() || saving} className="h-7">
              <Plus className="w-3.5 h-3.5 mr-1" /> Salvar ideia
            </Button>
          </div>
        </div>

        {/* Ideas list */}
        <div className="space-y-3">
          <AnimatePresence>
            {ideas.map((idea) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition-all"
              >
                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{idea.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {idea.created_date
                      ? format(new Date(idea.created_date), "d MMM, HH:mm", { locale: ptBR })
                      : "Agora"}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => startConvert(idea)}
                    title="Converter em nota"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(idea.id)}
                    title="Deletar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {ideas.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma ideia ainda. Escreva acima!</p>
            </div>
          )}
        </div>
      </div>

      {/* Folder picker modal */}
      <AnimatePresence>
        {convertingIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-sm">Converter em nota</h3>
                <button onClick={() => setConvertingIdea(null)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">"{convertingIdea.content}"</p>
              <p className="text-xs font-medium text-foreground mb-2">Escolha uma pasta:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto mb-3">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    selectedFolder === null ? "bg-foreground text-background" : "hover:bg-accent text-foreground"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Sem pasta
                </button>
                {folders.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFolder(f.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      selectedFolder === f.id ? "bg-foreground text-background" : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <span>{f.icon || "📁"}</span>
                    {f.name}
                  </button>
                ))}
              </div>
              {/* Create new folder */}
              {creatingFolder ? (
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Nome da pasta"
                    className="h-8 text-xs"
                    onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                    autoFocus
                  />
                  <Button size="sm" className="h-8 text-xs" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Criar</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setCreatingFolder(false)}>✕</Button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingFolder(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left text-muted-foreground hover:bg-accent transition-colors mb-3 border border-dashed border-border"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Nova pasta
                </button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setConvertingIdea(null)}>
                  Cancelar
                </Button>
                <Button size="sm" className="flex-1" onClick={confirmConvert}>
                  Converter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}