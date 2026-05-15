import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Image, Trash2, ExternalLink, Loader2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfViewer from "./PdfViewer";

export default function NoteAttachments({ noteId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [openPdf, setOpenPdf] = useState(null);
  const inputRef = useRef(null);

  const loadFiles = async () => {
    const f = await base44.entities.NoteFile.filter({ note_id: noteId });
    setFiles(f);
  };

  useEffect(() => { loadFiles(); }, [noteId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const type = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "other";
    await base44.entities.NoteFile.create({
      note_id: noteId,
      file_name: file.name,
      file_url,
      file_type: type,
      file_size: file.size,
    });
    setUploading(false);
    loadFiles();
    e.target.value = "";
  };

  const handleDelete = async (id) => {
    await base44.entities.NoteFile.delete(id);
    loadFiles();
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-4">
      {openPdf && (
        <PdfViewer
          file={openPdf}
          onClose={() => { setOpenPdf(null); loadFiles(); }}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Anexos</h3>
        <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} />
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
          {uploading ? "Enviando..." : "Anexar"}
        </Button>
      </div>

      {files.length === 0 && !uploading && (
        <div className="text-center py-6">
          <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum arquivo</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">PDFs e imagens</p>
        </div>
      )}

      <div className="space-y-2">
        {files.map(file => (
          <div key={file.id} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="group flex items-center gap-2 p-2.5 hover:bg-accent/30 transition-colors">
              <div className="flex-shrink-0">
                {file.file_type === "image" ? <Image className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{file.file_name}</p>
                {file.file_size && <p className="text-xs text-muted-foreground">{formatSize(file.file_size)}</p>}
                {file.annotation && (
                  <p className="text-xs text-muted-foreground/70 truncate mt-0.5 italic">{file.annotation}</p>
                )}
              </div>
              <div className="flex gap-0.5">
                {file.file_type === "pdf" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Abrir PDF"
                    onClick={() => setOpenPdf(file)}>
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                )}
                {file.file_type === "image" && (
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(file.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}