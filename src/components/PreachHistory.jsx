import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function PreachHistory({ onSelectNote, onBack }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Note.filter({ pregado: true }, "-data_pregacao");
      setNotes(data);
    };
    load();
  }, []);

  const grouped = notes.reduce((acc, note) => {
    const year = note.data_pregacao
      ? new Date(note.data_pregacao + "T00:00:00").getFullYear().toString()
      : "Sem data";
    if (!acc[year]) acc[year] = [];
    acc[year].push(note);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <span className="text-3xl">📅</span>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Histórico de Pregações</h1>
            <p className="text-sm text-muted-foreground">{notes.length} mensagem{notes.length !== 1 ? "s" : ""} registrada{notes.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {notes.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhuma pregação registrada ainda.</p>
            <p className="text-xs mt-1">Marque notas como "pregada" para vê-las aqui.</p>
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([year, yearNotes]) => (
              <div key={year}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> {year}
                  <span className="text-muted-foreground/50 font-normal">({yearNotes.length})</span>
                </h2>
                <div className="space-y-2">
                  {yearNotes.map((note, i) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => onSelectNote(note)}
                      className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm cursor-pointer transition-all"
                    >
                      <span className="text-xl">{note.icon || "📝"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{note.title}</p>
                        {note.data_pregacao && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(note.data_pregacao + "T00:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        )}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {note.tags.map(tag => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-accent text-muted-foreground">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}