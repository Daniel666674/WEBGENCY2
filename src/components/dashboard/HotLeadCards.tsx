"use client";

import Link from "next/link";

interface HotLead {
  id: string;
  name: string;
  company: string | null;
  source: string;
  temperature: string;
  score: number;
  mockupUrl: string | null;
  siteUrl: string | null;
  clientStatus: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  prospect: { label: "Prospecto", color: "bg-slate-100 text-slate-600" },
  proposal_sent: { label: "Propuesta enviada", color: "bg-primary/10 text-primary" },
  active_client: { label: "Cliente activo", color: "bg-green-100 text-green-700" },
  churned: { label: "Churned", color: "bg-red-100 text-red-700" },
};

export function HotLeadCards({ leads }: { leads: HotLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No hay leads calientes aún. Agrega contactos con score ≥ 50 o temperatura caliente.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {leads.slice(0, 7).map((lead) => {
        const status = STATUS_LABELS[lead.clientStatus] || STATUS_LABELS.prospect;
        const initial = lead.name.trim().charAt(0).toUpperCase() || "?";
        return (
          <Link
            key={lead.id}
            href={`/contacts/${lead.id}`}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {lead.name}
                </p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${lead.score >= 70 ? "bg-green-500" : lead.score >= 40 ? "bg-amber-400" : "bg-slate-300"}`}
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                  {lead.score}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
      <Link
        href="/contacts"
        className="block text-center text-xs font-medium text-primary hover:underline pt-2"
      >
        Ver todos
      </Link>
    </div>
  );
}
