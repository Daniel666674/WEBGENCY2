"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonitorSmartphone, Plus, ExternalLink, Trash2, FileEdit, Loader2, Copy } from "lucide-react";
import { TEMPLATES } from "@/lib/demo/templates";

interface DemoRow {
  id: string;
  contactId: string | null;
  title: string;
  slug: string;
  template: string;
  published: boolean;
  updatedAt: string | number | null;
  contactName: string | null;
}


export default function DemosPage() {
  const router = useRouter();
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/demo-pages").then((r) => r.json());
      setDemos(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/demo-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nuevo demo", template: "editorial" }),
      });
      if (res.ok) {
        const created = await res.json();
        router.push(`/demos/${created.id}?new=1`);
      } else {
        setCreating(false);
      }
    } catch {
      setCreating(false);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`¿Eliminar el demo "${title}"? Esta acción no se puede deshacer.`)) return;
    setDemos((d) => d.filter((x) => x.id !== id));
    await fetch(`/api/demo-pages/${id}`, { method: "DELETE" });
  }

  const [duplicating, setDuplicating] = useState<string | null>(null);

  async function duplicate(id: string) {
    setDuplicating(id);
    try {
      const res = await fetch(`/api/demo-pages/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        const created = await res.json();
        router.push(`/demos/${created.id}`);
      }
    } finally {
      setDuplicating(null);
    }
  }

  const publishedCount = demos.filter((d) => d.published).length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }}
          >
            <MonitorSmartphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Demos</h1>
            <p className="text-xs text-muted-foreground">Sitios de demostración para tus prospectos</p>
          </div>
        </div>
        <button
          onClick={create}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Nuevo demo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Total", demos.length],
          ["Publicados", publishedCount],
          ["Borradores", demos.length - publishedCount],
        ].map(([label, val]) => (
          <div key={label as string} className="rounded-xl border border-border bg-card p-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{val}</p>
          </div>
        ))}
      </div>


      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : demos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center">
          <MonitorSmartphone className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Aún no hay demos</p>
          <p className="text-sm text-muted-foreground">Crea un sitio de demostración para mostrarle a un prospecto.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((d) => {
            const tpl = TEMPLATES.find((t) => t.id === d.template);
            return (
              <div key={d.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-20 items-center gap-1.5 px-4" style={{ background: tpl?.swatch[0] ?? "#1c1917" }}>
                  {tpl?.swatch.map((c) => (
                    <span key={c} className="h-8 w-8 rounded border border-white/20" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{d.title}</p>
                      {d.contactName && <p className="truncate text-xs text-muted-foreground">{d.contactName}</p>}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        d.published ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d.published ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tpl?.name ?? d.template}</p>

                  <div className="mt-auto flex gap-1.5 pt-2">
                    <Link
                      href={`/demos/${d.id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      <FileEdit className="h-3.5 w-3.5" /> Editar
                    </Link>
                    {d.published && (
                      <a
                        href={`/demo/${d.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-xs hover:border-primary"
                        title="Ver publicado"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => duplicate(d.id)}
                      disabled={duplicating === d.id}
                      className="flex items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60"
                      title="Duplicar"
                    >
                      {duplicating === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => remove(d.id, d.title)}
                      className="flex items-center justify-center rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-red-500 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
