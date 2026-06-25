"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, ImageIcon, Globe, ExternalLink } from "lucide-react";
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

interface HotLeadsTableProps {
  leads: HotLead[];
}

const TEMP_COLORS: Record<string, string> = {
  hot: "bg-red-100 text-red-700 border-red-200",
  warm: "bg-amber-100 text-amber-700 border-amber-200",
  cold: "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  prospect: "Prospecto",
  proposal_sent: "Propuesta enviada",
  active_client: "Cliente activo",
  churned: "Churned",
};

export function HotLeadsTable({ leads }: HotLeadsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-red-500" />
          Leads Calientes con Mockup
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Prospectos listos para el pitch — score ≥ 50 o temperatura caliente
        </p>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Agrega leads con mockup para verlos aquí
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Contacto</th>
                  <th className="text-left pb-2 font-medium">Fuente</th>
                  <th className="text-center pb-2 font-medium">Score</th>
                  <th className="text-center pb-2 font-medium">Temp</th>
                  <th className="text-left pb-2 font-medium">Estado</th>
                  <th className="text-center pb-2 font-medium">Mockup</th>
                  <th className="text-center pb-2 font-medium">Sitio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/contacts/${lead.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {lead.name}
                      </Link>
                      {lead.company && (
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs text-muted-foreground">
                        {SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS] || lead.source}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`inline-block w-10 text-center text-xs font-bold rounded-full px-1.5 py-0.5 ${
                          lead.score >= 70
                            ? "bg-green-100 text-green-700"
                            : lead.score >= 40
                            ? "bg-amber-100 text-amber-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {lead.score}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          TEMP_COLORS[lead.temperature] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {lead.temperature === "hot"
                          ? "Caliente"
                          : lead.temperature === "warm"
                          ? "Tibio"
                          : "Frío"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs text-muted-foreground">
                        {STATUS_LABELS[lead.clientStatus] || lead.clientStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      {lead.mockupUrl ? (
                        <a
                          href={lead.mockupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                          title="Ver mockup"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {lead.siteUrl ? (
                        <a
                          href={lead.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                          title="Ver sitio"
                        >
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
