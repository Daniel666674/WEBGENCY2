"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Paperclip,
  Link2,
  Code2,
  FileText,
  Upload,
  Trash2,
  Download,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/constants";

type AttachmentType = "file" | "link" | "api" | "doc";

interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: number;
}

const TYPE_CONFIG: Record<AttachmentType, { label: string; icon: typeof Link2; color: string }> = {
  file: { label: "Archivo", icon: Paperclip, color: "bg-blue-100 text-blue-700" },
  link: { label: "Enlace", icon: Link2, color: "bg-teal-100 text-teal-700" },
  api:  { label: "API / Webhook", icon: Code2, color: "bg-purple-100 text-purple-700" },
  doc:  { label: "Documento", icon: FileText, color: "bg-amber-100 text-amber-700" },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsTab({
  contactId,
  proposalId,
  projectId,
}: {
  contactId?: string;
  proposalId?: string;
  projectId?: string;
}) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<AttachmentType>("link");
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const query = contactId
    ? `contactId=${contactId}`
    : projectId
    ? `projectId=${projectId}`
    : `proposalId=${proposalId}`;

  const load = () => {
    fetch(`/api/attachments?${query}`)
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Archivo muy grande (máx 10MB)");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    if (contactId) form.append("contactId", contactId);
    if (proposalId) form.append("proposalId", proposalId);
    if (projectId) form.append("projectId", projectId);

    try {
      const res = await fetch("/api/attachments", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      toast.success("Archivo subido");
      load();
    } catch {
      toast.error("Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleAddLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) {
      toast.error("Nombre y URL requeridos");
      return;
    }
    try {
      const res = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          proposalId,
          projectId,
          name: linkName.trim(),
          type: formType,
          url: linkUrl.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Enlace agregado");
      setLinkName("");
      setLinkUrl("");
      setShowForm(false);
      load();
    } catch {
      toast.error("Error al agregar enlace");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      toast.success("Eliminado");
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone / upload bar */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {uploading ? "Subiendo..." : "Arrastra un archivo aquí o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, imagen, ZIP, etc. · Máx 10MB</p>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
      </div>

      {/* Add link / API button */}
      {!showForm ? (
        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar enlace o API
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Nuevo enlace</p>
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={formType} onValueChange={(v) => v && setFormType(v as AttachmentType)}>
                <SelectTrigger className="h-8 cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Enlace</SelectItem>
                  <SelectItem value="api">API / Webhook</SelectItem>
                  <SelectItem value="doc">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input
                className="h-8"
                placeholder="Ej: API de pagos"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL</Label>
            <Input
              className="h-8"
              placeholder={formType === "api" ? "https://api.ejemplo.com/webhook" : "https://"}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
            />
          </div>
          <Button size="sm" className="cursor-pointer" onClick={handleAddLink}>Guardar</Button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No hay archivos ni enlaces. Sube un archivo o agrega un enlace arriba.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.link;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`p-1.5 rounded ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs py-0 h-4">{cfg.label}</Badge>
                      {item.size && (
                        <span className="text-xs text-muted-foreground">{formatBytes(item.size)}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {item.type === "file" ? (
                    <a
                      href={`/api/attachments/${item.id}`}
                      download={item.name}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <a
                      href={item.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive cursor-pointer"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
