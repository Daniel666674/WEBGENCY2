"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertData {
  overdueTasks: number;
  overdueSolicitudes: number;
  overdueMilestones: number;
  total: number;
}

export function AlertBanner() {
  const [data, setData] = useState<AlertData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data || data.total === 0 || dismissed) return null;

  const parts: string[] = [];
  if (data.overdueTasks > 0)
    parts.push(`${data.overdueTasks} tarea${data.overdueTasks !== 1 ? "s" : ""}`);
  if (data.overdueSolicitudes > 0)
    parts.push(`${data.overdueSolicitudes} solicitud${data.overdueSolicitudes !== 1 ? "es" : ""}`);
  if (data.overdueMilestones > 0)
    parts.push(`${data.overdueMilestones} hito${data.overdueMilestones !== 1 ? "s" : ""}`);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium",
        "bg-red-50 border-b border-red-200 text-red-800"
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
      <span className="flex-1">
        {parts.join(", ")} vencid{data.total !== 1 ? "os" : "o"} — revisa tu plan de trabajo.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-red-100 transition-colors cursor-pointer"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
