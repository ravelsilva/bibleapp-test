import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BIBLE_BOOKS } from "@/lib/bibleApi";
import { CheckCircle, Clock, Circle, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  not_started: { label: "Não iniciado", icon: Circle, color: "text-muted-foreground", bg: "bg-muted/50" },
  in_progress: { label: "Em andamento", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
  completed: { label: "Concluído", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
};

export default function ReadingTracker() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTestament, setActiveTestament] = useState("AT");

  useEffect(() => { loadProgress(); }, [year]);

  const loadProgress = async () => {
    setLoading(true);
    const data = await base44.entities.ReadingProgress.filter({ year });
    setProgress(data);
    setLoading(false);
  };

  const getBookStatus = (abbrev) => {
    const found = progress.find(p => p.book_abbrev === abbrev);
    return found?.status || "not_started";
  };

  const getBookProgress = (abbrev) => progress.find(p => p.book_abbrev === abbrev);

  const cycleStatus = async (book) => {
    const existing = getBookProgress(book.abbrev);
    const statuses = ["not_started", "in_progress", "completed"];
    const current = existing?.status || "not_started";
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];

    if (existing) {
      await base44.entities.ReadingProgress.update(existing.id, { status: next });
    } else {
      await base44.entities.ReadingProgress.create({
        year, month: 1,
        book_abbrev: book.abbrev,
        book_name: book.name,
        status: next,
        chapters_read: [],
      });
    }
    loadProgress();
  };

  const completed = progress.filter(p => p.status === "completed").length;
  const inProgress = progress.filter(p => p.status === "in_progress").length;
  const totalBooks = 66;
  const pct = Math.round((completed / totalBooks) * 100);

  const prevYear = () => setYear(y => y - 1);
  const nextYear = () => setYear(y => y + 1);

  const books = BIBLE_BOOKS.filter(b => b.testament === activeTestament);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-foreground" />
            <div>
              <h1 className="text-2xl font-semibold font-crimson text-foreground">Minha Jornada Bíblica</h1>
              <p className="text-sm text-muted-foreground">Acompanhe sua leitura anual</p>
            </div>
          </div>
          {/* Year nav */}
          <div className="flex items-center gap-2">
            <button onClick={prevYear} className="p-1.5 rounded-md hover:bg-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[60px] text-center">{year}</span>
            <button onClick={nextYear} className="p-1.5 rounded-md hover:bg-accent transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard value={completed} label="Livros concluídos" color="text-green-600" icon="✅" />
          <StatCard value={inProgress} label="Em andamento" color="text-yellow-600" icon="📖" />
          <StatCard value={totalBooks - completed - inProgress} label="Não iniciados" color="text-muted-foreground" icon="⭕" />
          <div className="p-3 rounded-xl border border-border bg-card">
            <p className="text-2xl mb-0.5">🏆</p>
            <p className="text-2xl font-bold text-foreground">{pct}%</p>
            <p className="text-xs text-muted-foreground">do ano</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progresso anual</span>
            <span>{completed}/{totalBooks} livros</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Testament tabs */}
        <div className="flex gap-2 mb-4">
          {["AT", "NT"].map(t => (
            <button key={t} onClick={() => setActiveTestament(t)}
              className={cn("px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
                activeTestament === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              )}>
              {t === "AT" ? "Antigo Testamento" : "Novo Testamento"}
            </button>
          ))}
        </div>

        {/* Books grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {books.map(book => {
            const status = getBookStatus(book.abbrev);
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <button key={book.id} onClick={() => cycleStatus(book)}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all hover:border-foreground/20 hover:shadow-sm",
                  cfg.bg,
                  status === "completed" ? "border-green-200 dark:border-green-800" :
                    status === "in_progress" ? "border-yellow-200 dark:border-yellow-800" :
                      "border-border"
                )}>
                <Icon className={cn("w-4 h-4 flex-shrink-0", cfg.color)} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{book.name}</p>
                  <p className={cn("text-xs", cfg.color)}>{cfg.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground/50 text-center mt-4">Clique em um livro para alternar o status</p>
      </div>
    </div>
  );
}

function StatCard({ value, label, color, icon }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-card">
      <p className="text-2xl mb-0.5">{icon}</p>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}