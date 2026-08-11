"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, ArrowRight, Copy, Check, Loader2, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/constants";
import { urgencyOf, type NextBestAction } from "@/lib/nba";

const DOT: Record<ReturnType<typeof urgencyOf>, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  normal: "bg-muted-foreground/40",
};

const LABEL: Record<ReturnType<typeof urgencyOf>, string> = {
  critical: "Ahora",
  high: "Hoy",
  normal: "Esta semana",
};

/**
 * The ranked action list on the dashboard.
 *
 * Deliberately short by default: a list you can finish beats a list that is
 * technically complete. The count of everything else is shown so nothing
 * feels hidden.
 */
export function NextBestActions({ limit = 6 }: { limit?: number }) {
  const [actions, setActions] = useState<NextBestAction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/nba?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : { actions: [], total: 0 }))
      .then((d) => {
        setActions(d.actions ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  async function dismiss(a: NextBestAction, reason: "done" | "not_relevant" | "snooze") {
    setBusy(a.id);
    try {
      const res = await fetch("/api/nba/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: a.id, reason }),
      });
      if (!res.ok) throw new Error();
      setActions((prev) => prev.filter((x) => x.id !== a.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success(reason === "snooze" ? "Lo vemos mañana" : reason === "done" ? "Marcada como hecha" : "No la mostramos por un mes");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setBusy(null);
    }
  }

  async function copyScript(a: NextBestAction) {
    if (!a.script) return;
    await navigator.clipboard.writeText(a.script);
    setCopied(a.id);
    toast.success("Mensaje copiado");
    setTimeout(() => setCopied((c) => (c === a.id ? null : c)), 2000);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Qué hacer ahora
        </CardTitle>
        {total > actions.length && (
          <span className="text-xs text-muted-foreground">{total - actions.length} más</span>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analizando el pipeline…
          </div>
        ) : actions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nada pendiente. Todo tiene su próximo paso agendado.
          </p>
        ) : (
          actions.map((a) => {
            const u = urgencyOf(a.score);
            return (
              <div
                key={a.id}
                className="group flex items-start gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:border-primary/40"
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[u]}`} title={LABEL[u]} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    {a.valueCents ? (
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                        {formatCurrency(a.valueCents)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.reason}</p>

                  <div className="mt-1.5 flex items-center gap-2">
                    <Link
                      href={a.href}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Ir <ArrowRight className="h-3 w-3" />
                    </Link>
                    {a.script && (
                      <button
                        type="button"
                        onClick={() => copyScript(a)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {copied === a.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copiar mensaje
                      </button>
                    )}

                    {/* Feedback. Without it the same three ignored actions sit
                        at the top forever and poison the whole list. */}
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        disabled={busy === a.id}
                        onClick={() => dismiss(a, "done")}
                        title="Ya lo hice"
                        className="rounded p-1 text-muted-foreground hover:text-green-600 disabled:opacity-40 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy === a.id}
                        onClick={() => dismiss(a, "snooze")}
                        title="Mañana"
                        className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy === a.id}
                        onClick={() => dismiss(a, "not_relevant")}
                        title="No aplica"
                        className="rounded p-1 text-muted-foreground hover:text-red-500 disabled:opacity-40 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
