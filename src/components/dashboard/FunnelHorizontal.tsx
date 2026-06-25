"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ImageIcon } from "lucide-react";

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
        {mockupsUnsent > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
            {mockupsUnsent} sin enviar
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-0">
          {stages.map((stage, i) => (
            <div key={stage.label} className="flex items-end gap-0 flex-1">
              {/* Stage block */}
              <div className="flex-1 flex flex-col items-center gap-2">
                {/* Big count */}
                <span className={`text-3xl font-bold leading-none ${stage.color}`}>
                  {stage.count}
                </span>
                {/* Bar */}
                <div className="w-full h-16 bg-muted rounded-t-md overflow-hidden flex items-end">
                  <div
                    className={`w-full ${stage.bar} rounded-t-md transition-all duration-700`}
                    style={{ height: `${Math.max((stage.count / max) * 100, 4)}%` }}
                  />
                </div>
                {/* Label */}
                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground">{stage.label}</p>
                  <p className="text-[10px] text-muted-foreground">{stage.sub}</p>
                </div>
              </div>

              {/* Arrow + rate between stages */}
              {i < stages.length - 1 && (
                <div className="flex flex-col items-center justify-end pb-8 px-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground mb-0.5">{rates[i]}%</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              )}
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
