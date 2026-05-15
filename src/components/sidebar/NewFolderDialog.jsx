import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const FOLDER_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#64748b"
];

const FOLDER_ICONS = ["📁", "📚", "✝️", "🙏", "📖", "⛪", "🕊️", "✨", "💡", "📝", "🎯", "🌿"];

export default function NewFolderDialog({ parentId, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("📁");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await base44.entities.Folder.create({ name: name.trim(), color, icon, parent_id: parentId || null });
    setLoading(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Nova {parentId ? "subpasta" : "pasta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Ícone</Label>
            <div className="flex flex-wrap gap-1.5">
              {FOLDER_ICONS.map(em => (
                <button
                  key={em}
                  onClick={() => setIcon(em)}
                  className={`text-xl p-1 rounded transition-all ${icon === em ? "bg-accent ring-2 ring-ring" : "hover:bg-muted"}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Nome</Label>
            <Input
              placeholder="Ex: Pregações, Estudos, Célula..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Cor</Label>
            <div className="flex gap-1.5 flex-wrap">
              {FOLDER_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${color === c ? "ring-2 ring-offset-1 ring-ring" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={!name.trim() || loading}>
              {loading ? "Criando..." : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}