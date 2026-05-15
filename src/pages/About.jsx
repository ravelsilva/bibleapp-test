import { useState } from "react";
import { Flame, BookOpen, Heart, ChevronLeft, Send, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function About() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!name.trim() || !description.trim()) return;
    setSending(true);
    const user = await base44.auth.me();
    await base44.entities.Contribution.create({
      name: name.trim(),
      description: description.trim(),
      user_email: user.email,
      status: "pending",
    });
    setSent(true);
    setSending(false);
    setName("");
    setDescription("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">VerbumFlame</h1>
            <p className="text-xs text-muted-foreground">Estudo bíblico e notas de pregação</p>
          </div>
        </div>

        {/* Description */}
        <div className="p-5 rounded-xl border border-border bg-card mb-5">
          <p className="text-sm text-foreground leading-relaxed">
            Um espaço sagrado para estudar a Palavra, preparar pregações e organizar conteúdos bíblicos com profundidade e elegância. Desenvolvido para pastores, líderes e estudantes que levam a Palavra a sério.
          </p>
        </div>

        {/* Creator */}
        <div className="p-5 rounded-xl border border-border bg-card mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">👤 Criador</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Ravel Luís</p>
              <p className="text-xs text-muted-foreground">@r4vellz</p>
            </div>
          </div>
        </div>

        {/* Bible Versions */}
        <div className="p-5 rounded-xl border border-border bg-card mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">📖 Versões da Bíblia</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "ACF", name: "Almeida Corrigida Fiel" },
              { id: "ARC", name: "Almeida Revista e Corrigida" },
              { id: "KJF", name: "King James Fiel 2000" },
              { id: "NVI", name: "Nova Versão Internacional" },
              { id: "NAA", name: "Nova Almeida Atualizada" },
              { id: "NTLH", name: "Linguagem de Hoje" },
            ].map(v => (
              <div key={v.id} className="px-3 py-2 rounded-lg bg-accent/50">
                <p className="text-xs font-semibold text-foreground">{v.id}</p>
                <p className="text-xs text-muted-foreground">{v.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Credits */}
        <div className="p-5 rounded-xl border border-border bg-card mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">🙏 Créditos</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-foreground">Versões bíblicas em JSON</p>
                <a href="https://github.com/damarals/biblias" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  github.com/damarals/biblias <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/40">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Os textos bíblicos pertencem aos seus respectivos detentores de direitos, incluindo a Sociedade Bíblica do Brasil (SBB), Biblica e outras entidades responsáveis pelas traduções. O VerbumFlame não possui vínculo oficial com essas organizações e utiliza os dados exclusivamente para fins de leitura, estudo e organização pessoal.
            </p>
          </div>
        </div>

        {/* Contribution form */}
        <div className="p-5 rounded-xl border border-border bg-card mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">💬 Contribuições</h2>
          <p className="text-xs text-muted-foreground mb-4">Contribuições são bem-vindas! Se você tiver sugestões, melhorias ou encontrar algum problema, envie abaixo.</p>
          {sent ? (
            <div className="text-center py-6">
              <p className="text-sm text-foreground font-medium">✅ Mensagem enviada!</p>
              <p className="text-xs text-muted-foreground mt-1">Obrigado pela contribuição.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setSent(false)}>Enviar outra</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva sua sugestão ou problema..." className="text-sm min-h-[80px]" />
              </div>
              <Button size="sm" onClick={handleSend} disabled={!name.trim() || !description.trim() || sending} className="w-full">
                {sending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Desenvolvido com Base44 · A Palavra nunca falha 🔥
        </p>
      </div>
    </div>
  );
}