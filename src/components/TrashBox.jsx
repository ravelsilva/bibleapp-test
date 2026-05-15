import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, RotateCcw, Clock, AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function TrashBox({ onRestore, onBack }) {
  const [deleted, setDeleted] = useState([]);

  const load = async () => {
    const all = await base44.entities.DeletedNote.list("-deleted_at", 200);
    const now = new Date();
    // Filter out expired ones
    const valid = all.filter(d => new Date(d.expires_at) > now);
    setDeleted(valid);
    // Clean expired
    const expired = all.filter(d => new Date(d.expires_at) <= now);
    for (const d of expired) {
      await base44.entities.DeletedNote.delete(d.id);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (item) => {
    const restored = await base44.entities.Note.create({
      title: item.title,
      content: item.content,
      folder_id: item.folder_id,
      icon: item.icon,
      tags: item.tags,
      favorito: item.favorito,
      pregado: item.pregado,
      data_pregacao: item.data_pregacao,
      fixado: item.fixado,
    });
    await base44.entities.DeletedNote.delete(item.id);
    load();
    onRestore && onRestore(restored);
  };

  const handlePermanentDelete = async (id) => {
    await base44.entities.DeletedNote.delete(id);
    load();
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <span className="text-3xl">🗑️</span>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lixeira</h1>
            <p className="text-sm text-muted-foreground">Notas excluídas ficam aqui por 48 horas</p>
          </div>
        </div>

        {deleted.length > 0 && (
          <div className="flex items-center gap-1.5 mb-6 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {deleted.length} nota{deleted.length !== 1 ? "s" : ""} na lixeira. Serão apagadas permanentemente após 48h.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {deleted.map((item) => {
              const expiresIn = formatDistanceToNow(new Date(item.expires_at), { locale: ptBR, addSuffix: true });
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card opacity-80 hover:opacity-100 transition-all"
                >
                  <span className="text-xl mt-0.5">{item.icon || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{item.title || "Sem título"}</p>
                    {item.content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: item.content.replace(/<[^>]+>/g, " ").slice(0, 100) }}
                      />
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/60">Expira {expiresIn}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-green-600"
                      onClick={() => handleRestore(item)}
                      title="Restaurar"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={() => handlePermanentDelete(item.id)}
                      title="Excluir permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {deleted.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Lixeira vazia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}