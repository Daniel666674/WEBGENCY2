"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Loader2 } from "lucide-react";
import { formatRelativeDate } from "@/lib/constants";

interface RunRow {
  id: string;
  ruleId: string;
  summary: string;
  createdAt: string;
}

/**
 * What the engine actually did, most recent first.
 *
 * Automations act while nobody is watching, so "why does this follow-up
 * exist?" has to have an answer that isn't guesswork.
 */
export function AutomationLog() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/automations/run")
      .then((r) => (r.ok ? r.json() : { runs: [] }))
      .then((d) => setRuns(d.runs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" /> Historial
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no se ha ejecutado ninguna automatización.
          </p>
        ) : (
          <ul className="space-y-2">
            {runs.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">{r.summary}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeDate(new Date(r.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
