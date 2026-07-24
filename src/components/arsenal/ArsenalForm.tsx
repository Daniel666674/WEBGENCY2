"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CATEGORIES, STATUSES, type ArsenalItem, parseTags } from "@/lib/arsenalConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (item: ArsenalItem) => void;
  item?: ArsenalItem | null;
}

const EMPTY = {
  name: "", category: "Tool", status: "active", icon: "🔧",
  description: "", url: "", tagsRaw: "", useCasesRaw: "", costDollars: "", details: "", notes: "",
};

export function ArsenalForm({ open, onClose, onSaved, item }: Props) {
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (item) {
      const tags = parseTags(item.tags).join(", ");
      const useCases = parseTags(item.useCases).join("\n");
      setF({
        name: item.name,
        category: item.category,
        status: item.status,
        icon: item.icon ?? "🔧",
        description: item.description ?? "",
        url: item.url ?? "",
        tagsRaw: tags,
        useCasesRaw: useCases,
        costDollars: item.costCents ? String(item.costCents / 100) : "",
        details: item.details ?? "",
        notes: item.notes ?? "",
      });
    } else {
      setF(EMPTY);
    }
  }, [open, item]);

  function set(key: keyof typeof EMPTY, val: string) {
    setF((p) => ({ ...p, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Nombre requerido"); return; }

    const tags = f.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const useCases = f.useCasesRaw.split("\n").map((u) => u.trim()).filter(Boolean);
    const costCents = f.costDollars ? Math.round(Number(f.costDollars) * 100) : null;

    setSaving(true);
    try {
      const url = item ? `/api/arsenal/${item.id}` : "/api/arsenal";
      const method = item ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name.trim(),
          category: f.category,
          status: f.status,
          icon: f.icon || "🔧",
          description: f.description || null,
          url: f.url || null,
          tags: JSON.stringify(tags),
          useCases: JSON.stringify(useCases),
          costCents,
          details: f.details || null,
          notes: f.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      toast.success(item ? "Actualizado" : "Creado");
      onSaved(data);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Nuevo item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-[64px_1fr] gap-3 items-start">
            <div>
              <Label className="text-xs">Icono</Label>
              <Input
                value={f.icon}
                onChange={(e) => set("icon", e.target.value)}
                className="mt-1 text-2xl text-center"
                maxLength={4}
                placeholder="🔧"
              />
            </div>
            <div>
              <Label className="text-xs">Nombre *</Label>
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} className="mt-1" placeholder="Ej. Vercel, n8n, Stripe..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Categoría</Label>
              <select
                value={f.category}
                onChange={(e) => set("category", e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Estado</Label>
              <select
                value={f.status}
                onChange={(e) => set("status", e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Descripción corta</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} className="mt-1 min-h-[64px] text-sm" placeholder="Qué es y para qué sirve en pocas palabras" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">URL / Link</Label>
              <Input value={f.url} onChange={(e) => set("url", e.target.value)} className="mt-1" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">Costo mensual (USD)</Label>
              <Input value={f.costDollars} onChange={(e) => set("costDollars", e.target.value)} className="mt-1" type="number" min="0" step="0.01" placeholder="0" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Tags (separados por coma)</Label>
            <Input value={f.tagsRaw} onChange={(e) => set("tagsRaw", e.target.value)} className="mt-1" placeholder="nextjs, api, saas, hosting..." />
          </div>

          <div>
            <Label className="text-xs">Casos de uso (uno por línea)</Label>
            <Textarea value={f.useCasesRaw} onChange={(e) => set("useCasesRaw", e.target.value)} className="mt-1 min-h-[80px] text-sm" placeholder={"Cuando el cliente necesita X\nPara proyectos tipo Y"} />
          </div>

          <div>
            <Label className="text-xs">Detalles completos</Label>
            <Textarea value={f.details} onChange={(e) => set("details", e.target.value)} className="mt-1 min-h-[120px] text-sm font-mono" placeholder="Notas técnicas, configuraciones, comandos, links de docs, aprendizajes..." />
          </div>

          <div>
            <Label className="text-xs">Notas internas</Label>
            <Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1 min-h-[60px] text-sm" placeholder="Solo visible para ti" />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving} className="cursor-pointer">
            {saving ? "Guardando..." : item ? "Guardar cambios" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
