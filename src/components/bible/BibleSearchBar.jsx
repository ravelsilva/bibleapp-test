import { useState } from "react";
import { parseReference } from "@/lib/bibleSearch";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function BibleSearchBar({ onResult, compact, nightMode }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const parsed = parseReference(query);
    if (parsed) {
      onResult(parsed.book, parsed.chapter, parsed.verse, parsed.verseEnd);
      setQuery("");
    } else {
      setError("Formato: João 3:16 ou Ageu 1:2-8");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSearch} className={cn("flex items-center gap-2", compact ? "w-52" : "w-full")}>
      <div className="relative flex-1">
        <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5", nightMode ? "text-stone-500" : "text-muted-foreground")} />
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setError(null); }}
          placeholder="Ex: Ageu 1:2-8..."
          className={cn("pl-8 h-7 text-xs", nightMode ? "bg-stone-800 border-stone-700 text-stone-200 placeholder:text-stone-500" : "bg-background")}
        />
        {error && <p className="absolute left-0 top-full mt-0.5 text-xs text-destructive whitespace-nowrap z-10 bg-background px-1 rounded shadow">{error}</p>}
      </div>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground flex-shrink-0" />}
    </form>
  );
}