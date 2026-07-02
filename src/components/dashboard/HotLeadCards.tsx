"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Globe, Flame, Thermometer } from "lucide-react";
import { SOURCE_LABELS } from "@/lib/constants";

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

const TEMP_DOT: Record<string, string> = {
  hot: "bg-red-500",
  warm: "bg-amber-400",
  cold: "bg-blue-400",
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
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
      {leads.map((lead) => {
        const status = STATUS_LABELS[lead.clientStatus] || STATUS_LABELS.prospect;
        return (
          <Link
            key={lead.id}
            href={`/contacts/${lead.id}`}
            className="shrink-0 w-56 rounded-xl bg-card ring-1 ring-foreground/10 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:ring-primary/15 hover:-translate-y-0.5 p-4 flex flex-col gap-3 group cursor-pointer"
          >
            {/* Top: name + temp dot */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {lead.name}
                </p>
                {lead.company && (
                  <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                )}
              </div>
              <div
                className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 ${TEMP_DOT[lead.temperature] || "bg-muted"}`}
                title={lead.temperature}
              />
            </div>

            {/* Score bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</span>
                <span className={`text-xs font-bold ${lead.score >= 70 ? "text-green-600" : lead.score >= 40 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {lead.score}
                </span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${lead.score >= 70 ? "bg-green-500" : lead.score >= 40 ? "bg-amber-400" : "bg-slate-300"}`}
                  style={{ width: `${lead.score}%` }}
                />
              </div>
            </div>

            {/* Status + Source */}
            <div className="flex flex-wrap gap-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-2 mt-auto pt-1 border-t">
              {lead.mockupUrl ? (
                <a
                  href={lead.mockupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                >
                  <ImageIcon className="h-3 w-3" /> Mockup
                </a>
              ) : (
                <span className="text-[10px] text-muted-foreground/50">Sin mockup</span>
              )}
              {lead.siteUrl && (
                <a
                  href={lead.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline ml-auto"
                >
                  <Globe className="h-3 w-3" /> Sitio
                </a>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
