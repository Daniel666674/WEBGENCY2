"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

interface FunnelHorizontalProps {
  totalLeads: number;
  withMockup: number;
  proposalSent: number;
  activeClients: number;
  mockupsUnsent: number;
}

interface Stage {
  label: string;
  sub: string;
  count: number;
  color: string;
  bar: string;
}

export function FunnelHorizontal({
  totalLeads,
  withMockup,
  proposalSent,
  activeClients,
  mockupsUnsent,
}: FunnelHorizontalProps) {
  const max = Math.max(totalLeads, 1);

  const stages: Stage[] = [
    { label: "Leads", sub: "En el CRM", count: totalLeads, color: "text-slate-500", bar: "bg-slate-400" },
    { label: "Mockup listo", sub: "Diseñado", count: withMockup, color: "text-amber-600", bar: "bg-amber-400" },
    { label: "Propuesta", sub: "Enviada", count: proposalSent, color: "text-primary", bar: "bg-primary" },
    { label: "Activos", sub: "Pagando", count: activeClients, color: "text-green-600", bar: "bg-green-500" },
  ];

  const rates = [
    totalLeads > 0 ? Math.round((withMockup / totalLeads) * 100) : 0,
    withMockup > 0 ? Math.round((proposalSent / withMockup) * 100) : 0,
    proposalSent > 0 ? Math.round((activeClients / proposalSent) * 100) : 0,
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          Embudo de Ventas — Modelo Mockup
        </CardTitle>
        <div className="flex items-center gap-2">
          {mockupsUnsent > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
              {mockupsUnsent} sin enviar
            </span>
          )}
          <span className="text-xs text-muted-foreground border rounded-md px-2 py-1">
            Este mes
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, i) => (
            <div key={stage.label}>
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <p className="text-xs font-semibold text-foreground">{stage.label}</p>
                  <p className="text-[10px] text-muted-foreground">{stage.sub}</p>
                </div>
                <span className={`text-xl font-bold leading-none w-8 shrink-0 text-right ${stage.color}`}>
                  {stage.count}
                </span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max((stage.count / max) * 100, 2)}%` }}
                  />
                </div>
                {i < stages.length - 1 && (
                  <span className="text-[10px] font-medium text-muted-foreground w-9 shrink-0 text-right">
                    {rates[i]}%
                  </span>
                )}
                {i === stages.length - 1 && <span className="w-9 shrink-0" />}
              </div>
            </div>
          ))}
        </div>

        {/* Insight line */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            {activeClients > 0 && totalLeads > 0 ? (
              <>
                Conversión total{" "}
                <span className="font-semibold text-primary">
                  {Math.round((activeClients / totalLeads) * 100)}%
                </span>
                {" — "}de cada 10 leads, {Math.round((activeClients / totalLeads) * 10)} se vuelven clientes.
                {mockupsUnsent > 0 && (
                  <span className="text-amber-600 font-medium ml-1">
                    Tienes {mockupsUnsent} mockup{mockupsUnsent > 1 ? "s" : ""} listos sin enviar.
                  </span>
                )}
              </>
            ) : (
              "Agrega contactos con mockupUrl para activar el embudo."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
