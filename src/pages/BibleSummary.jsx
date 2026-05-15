import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Loader2, ChevronLeft, AlertCircle } from "lucide-react";
import { BIBLE_BOOKS, fetchChapter } from "@/lib/bibleApi";
import { cn } from "@/lib/utils";



function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Local aliases to fix "João" and others
const BOOK_ALIASES = {
  "joao": "jo", "jo": "jo", "joão": "jo", "john": "jo",
  "genesis": "gn", "gênesis": "gn", "geneses": "gn", "gn": "gn",
  "exodo": "ex", "êxodo": "ex", "exodus": "ex", "ex": "ex",
  "salmos": "sl", "salmo": "sl", "sl": "sl",
  "mateus": "mt", "mt": "mt",
  "marcos": "mc", "mc": "mc",
  "lucas": "lc", "lc": "lc",
  "atos": "at", "at": "at",
  "romanos": "rm", "rm": "rm",
  "apocalipse": "ap", "ap": "ap",
  "hebreus": "hb", "hb": "hb",
  "tiago": "tg", "tg": "tg",
  "1joao": "1jo", "1jo": "1jo",
  "2joao": "2jo", "2jo": "2jo",
  "3joao": "3jo", "3jo": "3jo",
  "judas": "jd", "jd": "jd",
  "jo": "job", "job": "job", // Jó (not João, because "jo" alone = Jó)
};

function parseRef(input) {
  const text = input.trim();
  const norm = normalize(text);

  let matchedBook = null;
  let rest = "";

  // Try matching by full name (longest first to avoid partial matches)
  const sorted = [...BIBLE_BOOKS].sort((a, b) => b.name.length - a.name.length);
  for (const b of sorted) {
    const bookNorm = normalize(b.name);
    const abbrevNorm = normalize(b.abbrev);
    if (norm.startsWith(bookNorm + " ") || norm === bookNorm) {
      matchedBook = b;
      rest = text.slice(b.name.length).trim();
      break;
    }
    if (norm.startsWith(abbrevNorm + " ") || norm === abbrevNorm) {
      matchedBook = b;
      rest = text.slice(b.abbrev.length).trim();
      break;
    }
  }

  // Alias-based fallback (handles "joao 3:16", "exodo 2" etc.)
  if (!matchedBook) {
    // Try to extract a word prefix before any digits
    const wordPart = norm.replace(/\s*\d.*$/, "").replace(/\s+/g, "");
    const id = BOOK_ALIASES[wordPart];
    if (id) {
      matchedBook = BIBLE_BOOKS.find(b => b.id === id);
      if (matchedBook) {
        // rest = everything after the word part
        const originalWordLen = text.search(/\d/);
        rest = originalWordLen >= 0 ? text.slice(originalWordLen).trim() : "";
      }
    }
  }

  if (!matchedBook) return null;

  if (!rest) return { book: matchedBook, chapter: 1, verse: null, verse2: null };

  // parse chapter[:verse[-verse2]]  — support both - and --
  const chapterVerseMatch = rest.match(/^(\d+)(?::(\d+)(?:-{1,2}(\d+))?)?$/);
  if (!chapterVerseMatch) return null;

  const chapter = parseInt(chapterVerseMatch[1]);
  const verse = chapterVerseMatch[2] ? parseInt(chapterVerseMatch[2]) : null;
  const verse2 = chapterVerseMatch[3] ? parseInt(chapterVerseMatch[3]) : null;

  return { book: matchedBook, chapter, verse, verse2 };
}

function SummaryResult({ result }) {
  if (!result) return null;
  const isChapter = result.type === "chapter";

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-4 h-4 text-amber-600" />
        <span className="font-semibold text-foreground">{result.reference}</span>
        <span className="text-xs text-muted-foreground ml-auto">{result.version?.toUpperCase()}</span>
      </div>
      <div className="h-px bg-border" />
      {isChapter ? (
        <div className="space-y-2.5 text-sm">
          <Field label="Resumo do capítulo" value={result.resumo} highlight />
          <Field label="Aplicação prática" value={result.aplicacao_pratica} />
          <Field label="Contexto geral" value={result.contexto_geral} />
          <Field label="Principais acontecimentos" value={result.principais_acontecimentos} />
          <Field label="Tema central" value={result.tema_central} />
          <Field label="Palavras-chave" value={result.palavras_chave} />
        </div>
      ) : (
        <div className="space-y-2.5 text-sm">
          <Field label="Resumo" value={result.resumo} highlight />
          <Field label="Aplicação" value={result.aplicacao} />
          <Field label="Contexto" value={result.contexto} />
          <Field label="Tema" value={result.tema} />
          <Field label="Palavras-chave" value={result.palavras_chave} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, highlight }) {
  return (
    <div className={cn("rounded-lg p-3", highlight ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" : "bg-muted/50")}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-foreground leading-relaxed">{value || <span className="italic text-muted-foreground">—</span>}</p>
    </div>
  );
}

export default function BibleSummary({ onBack }) {
  const [search, setSearch] = useState("");
  const version = "acf";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSummarize = async (e) => {
    e?.preventDefault();
    const ref = parseRef(search);
    if (!ref) {
      setError("Referência inválida. Ex: João 3:16, João 3 ou Mateus 5:1-12");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      // Fetch verses from local Bible data
      const chapterData = await fetchChapter(version, ref.book.abbrev, ref.chapter);
      if (!chapterData || !chapterData.verses || chapterData.verses.length === 0) {
        setError("Não foi possível encontrar este trecho na versão selecionada.");
        setLoading(false);
        return;
      }

      let verses = chapterData.verses;
      let referenceStr = "";
      let selectedVerses = [];

      if (ref.verse !== null) {
        const start = ref.verse;
        const end = ref.verse2 || ref.verse;
        selectedVerses = verses.filter(v => v.number >= start && v.number <= end);
        referenceStr = end > start
          ? `${ref.book.name} ${ref.chapter}:${start}-${end}`
          : `${ref.book.name} ${ref.chapter}:${start}`;
      } else {
        selectedVerses = verses;
        referenceStr = `${ref.book.name} ${ref.chapter}`;
      }

      if (selectedVerses.length === 0) {
        setError("Versículos não encontrados. Verifique a referência.");
        setLoading(false);
        return;
      }

      const verseText = selectedVerses.map(v => `${v.number}. ${v.text}`).join("\n");
      const isChapter = ref.verse === null;

      const schema = isChapter
        ? {
            type: "object",
            properties: {
              resumo: { type: "string" },
              aplicacao_pratica: { type: "string" },
              contexto_geral: { type: "string" },
              principais_acontecimentos: { type: "string" },
              tema_central: { type: "string" },
              palavras_chave: { type: "string" },
            },
          }
        : {
            type: "object",
            properties: {
              resumo: { type: "string" },
              aplicacao: { type: "string" },
              contexto: { type: "string" },
              tema: { type: "string" },
              palavras_chave: { type: "string" },
            },
          };

      const prompt = isChapter
        ? `Você é um assistente bíblico. Resuma o capítulo bíblico abaixo de forma estruturada, objetiva e fiel ao texto. Cada campo deve ter 2-3 frases.

Referência: ${referenceStr}
Texto bíblico:
${verseText}

Preencha TODOS os campos do JSON: resumo, aplicacao_pratica, contexto_geral, principais_acontecimentos, tema_central, palavras_chave.`
        : `Você é um assistente bíblico. Resuma os versículos abaixo de forma estruturada e objetiva. Cada campo deve ter 1-2 frases.

Referência: ${referenceStr}
Texto bíblico:
${verseText}

Preencha TODOS os campos do JSON: resumo, aplicacao, contexto, tema, palavras_chave.`;

      const summary = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
      });

      setResult({
        ...summary,
        type: isChapter ? "chapter" : "verse",
        reference: referenceStr,
        version,
      });
    } catch (err) {
      setError("Erro ao gerar resumo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <BookOpen className="w-4 h-4 text-amber-600" />
        <h1 className="font-semibold text-sm text-foreground">Resumo Bíblico</h1>
        <span className="text-xs text-muted-foreground ml-1">— IA exclusiva para resumir passagens</span>
      </div>

      {/* Search bar */}
      <div className="px-4 py-4 border-b border-border bg-amber-50/40 dark:bg-amber-900/10 flex-shrink-0">
        <form onSubmit={handleSummarize} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setError(""); }}
              placeholder="Ex: João 3:16 · João 3 · Mateus 5:1-12"
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !search.trim()} className="gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
            Resumir
          </Button>
        </form>

        {/* Quick examples */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {["João 3:16", "João 3", "Salmos 23", "Romanos 8:28", "Mateus 5:1-12", "Gênesis 1"].map(ex => (
            <button
              key={ex}
              onClick={() => { setSearch(ex); setError(""); }}
              className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Gerando resumo bíblico...</p>
            <p className="text-xs opacity-60">Isso pode levar alguns segundos</p>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium mb-1">Pesquise uma passagem bíblica</p>
            <p className="text-xs opacity-70">Versículos, intervalos ou capítulos inteiros</p>
          </div>
        )}

        {!loading && result && <SummaryResult result={result} />}
      </div>
    </div>
  );
}