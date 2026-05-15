import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TEMPLATES = [
  {
    id: "pregacao",
    name: "Pregação Completa",
    description: "Estrutura detalhada para uma mensagem",
    content: `<h2>TEMA:</h2><p><em></em></p>
<h2>TEXTO BASE:</h2><p><em></em></p>
<h2>OBJETIVO:</h2><p><em>O que quero que as pessoas entendam?</em></p>
<h2>INTRODUÇÃO:</h2><p><em>Conectar com a realidade</em></p>
<h2>CONTEXTO BÍBLICO:</h2><p><em>Explicação</em></p>
<h2>PONTO 1:</h2><ul><li>Versículo:</li><li>Explicação:</li><li>Aplicação:</li></ul>
<h2>PONTO 2:</h2><ul><li>Versículo:</li><li>Explicação:</li><li>Aplicação:</li></ul>
<h2>PONTO 3:</h2><ul><li>Versículo:</li><li>Explicação:</li><li>Aplicação:</li></ul>
<h2>CONCLUSÃO:</h2><p><em>Resumo</em></p>
<h2>APLICAÇÃO FINAL:</h2><p><em>O que a pessoa precisa fazer</em></p>`,
  },
  {
    id: "estudo_profundo",
    name: "Estudo Profundo",
    description: "Análise aprofundada de texto bíblico",
    content: `<h2>TEXTO:</h2><p><em></em></p>
<h2>INTERPRETAÇÃO:</h2><p><em>O que o texto diz?</em></p>
<h2>CONTEXTO:</h2><p><em>Autor, época, situação</em></p>
<h2>DÚVIDAS:</h2><p><em></em></p>
<h2>INSIGHTS:</h2><p><em></em></p>
<h2>APLICAÇÃO:</h2><p><em></em></p>
<h2>RELAÇÃO COM JESUS:</h2><p><em></em></p>`,
  },
  {
    id: "personagem",
    name: "Estudo de Personagem",
    description: "Análise de personagem bíblico",
    content: `<h2>PERSONAGEM:</h2><p><em></em></p>
<h2>TEXTO BASE:</h2><p><em></em></p>
<h2>HISTÓRIA:</h2><p><em></em></p>
<h2>QUALIDADES:</h2><p><em></em></p>
<h2>FRAQUEZAS:</h2><p><em></em></p>
<h2>LIÇÕES:</h2><p><em></em></p>
<h2>APLICAÇÃO:</h2><p><em></em></p>`,
  },
  {
    id: "devocional",
    name: "Devocional",
    description: "Reflexão pessoal diária",
    content: `<h2>LEITURA:</h2><p><em></em></p>
<h2>O QUE DEUS FALOU COMIGO:</h2><p><em></em></p>
<h2>REFLEXÃO:</h2><p><em></em></p>
<h2>ORAÇÃO:</h2><p><em></em></p>
<h2>AÇÃO DO DIA:</h2><p><em></em></p>`,
  },
  {
    id: "celula",
    name: "Célula / Grupo",
    description: "Para reuniões em grupo",
    content: `<h2>LOUVOR:</h2><p><em>Músicas ou dinâmica de abertura...</em></p>
<h2>PALAVRA:</h2><p><em>Texto base e reflexão...</em></p>
<h2>DISCUSSÃO:</h2><ul><li>...</li><li>...</li></ul>
<h2>ORAÇÃO:</h2><p><em>Pedidos e intercessões...</em></p>`,
  },
];

export default function NoteTemplate({ folderId, onCreated, onClose, applyToExisting }) {
  const handleSelect = async (template) => {
    // If applyToExisting, just push the content to the current note
    if (applyToExisting) {
      applyToExisting(template.content);
      return;
    }
    const note = await base44.entities.Note.create({
      title: template.name,
      content: template.content,
      folder_id: folderId || null,
      icon: "📝",
    });
    onCreated(note);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Escolher Template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 mt-2 max-h-[60vh] overflow-y-auto">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t)}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 hover:border-foreground/20 transition-all text-left group"
            >
              <div>
                <p className="font-medium text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}