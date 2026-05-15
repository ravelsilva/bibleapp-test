import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function BibleFavoritesView({ onInsertVerse }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    base44.entities.BibleFavorite.list("-created_date").then(setFavorites);
  }, []);

  const handleDelete = async (id) => {
    await base44.entities.BibleFavorite.delete(id);
    setFavorites(f => f.filter(v => v.id !== id));
  };

  const handleInsert = (fav) => {
    if (!onInsertVerse) return;
    onInsertVerse({
      text: fav.verse_text,
      reference: `${fav.book_name} ${fav.chapter}:${fav.verse}`,
      version: fav.version.toUpperCase(),
    });
  };

  return (
    <div className="h-full overflow-y-auto p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-yellow-500 fill-current" />
          <div>
            <h1 className="text-2xl font-semibold font-crimson text-foreground">Versículos Favoritos</h1>
            <p className="text-sm text-muted-foreground">{favorites.length} salvo{favorites.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum versículo favorito ainda</p>
            <p className="text-xs mt-1">Clique em qualquer versículo e salve como favorito</p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav, i) => (
              <motion.div key={fav.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="group p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{fav.reference || `${fav.book_name} ${fav.chapter}:${fav.verse} — ${fav.version?.toUpperCase()}`}</p>
                    <p className="font-crimson text-foreground leading-relaxed" style={{ fontSize: "16px" }}>{fav.verse_text}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onInsertVerse && (
                      <button onClick={() => handleInsert(fav)} title="Inserir na nota"
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(fav.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}