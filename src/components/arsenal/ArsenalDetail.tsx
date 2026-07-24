"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil, Trash2, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArsenalForm } from "./ArsenalForm";
import {
  CATEGORY_STYLE, STATUS_STYLE, parseTags, type ArsenalItem,
} from "@/lib/arsenalConfig";
import { cn } from "@/lib/utils";

export function ArsenalDetail({ item: initial }: { item: ArsenalItem }) {
  const router = useRouter();
  const [item, setItem] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const catStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["Tool"];
  const statusStyle = STATUS_STYLE[item.status] ?? STATUS_STYLE["active"];
  const tags = parseTags(item.tags);
  const useCases = parseTags(item.useCases);

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/arsenal/${item.id}`, { method: "DELETE" });
      toast.success("Eliminado");
      router.push("/arsenal");
    } catch {
      toast.error("Error al eliminar");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back nav */}
      <Link href="/arsenal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Arsenal
      </Link>

      {/* Header card */}
      <Card>
        <CardContent className="pt-6 pb-5 px-6">
          <div className="flex items-start gap-4">
            <span className="text-5xl leading-none select-none shrink-0">{item.icon ?? "🔧"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", catStyle.badge)}>
                  {item.category}
                </span>
                <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", statusStyle.badge)}>
                  {statusStyle.label}
                </span>
              </div>
              <h1 className="text-2xl font-bold leading-tight">{item.name}</h1>
              {item.description && (
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="h-3.5 w-3.5" /> {item.url.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {item.costCents && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" /> ${(item.costCents / 100).toFixed(0)}/mes
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting}
                className="cursor-pointer text-destructive hover:bg-destructive/10 border-destructive/30">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Use cases */}
      {useCases.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Casos de uso</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {useCases.map((u, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{u}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Details */}
      {item.details && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Detalles</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{item.details}</pre>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {item.notes && (
        <Card className="border-dashed">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Notas internas</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
          </CardContent>
        </Card>
      )}

      <ArsenalForm
        open={editing}
        onClose={() => setEditing(false)}
        item={item}
        onSaved={(updated) => setItem(updated)}
      />
    </div>
  );
}
