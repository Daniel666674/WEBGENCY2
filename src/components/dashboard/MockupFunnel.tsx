"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, Send, FileSignature, CheckCircle2 } from "lucide-react";

interface FunnelStage {
  label: string;
  sublabel: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

interface MockupFunnelProps {
  totalLeads: number;
  withMockup: number;
  proposalSent: number;
  activeClients: number;
}

export function MockupFunnel({
  totalLeads,
  withMockup,
  proposalSent,
  activeClients,
}: MockupFunnelProps) {
  const stages: FunnelStage[] = [
    {
      label: "Leads Totales",
      sublabel: "En el CRM",
      count: totalLeads,
      icon: ImageIcon,
      color: "text-slate-600",
      bg: "bg-slate-500/10",
    },
    {
      label: "Mockup Listo",
      sublabel: "Sitio diseñado, listo para pitch",
      count: withMockup,
      icon: ImageIcon,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Propuesta Enviada",
      sublabel: "Lead vio su sitio",
      count: proposalSent,
      icon: Send,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Clientes Activos",
      sublabel: "Firmados y pagando",
      count: activeClients,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
  ];

  const max = Math.max(totalLeads, 1);

  const pct = (n: number) => Math.round((n / max) * 100);

  const rates = [
    totalLeads > 0 ? Math.round((withMockup / totalLeads) * 100) : 0,
    withMockup > 0 ? Math.round((proposalSent / withMockup) * 100) : 0,
    proposalSent > 0 ? Math.round((activeClients / proposalSent) * 100) : 0,
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          Embudo de Mockups
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tu modelo de ventas: diseña primero, cierra después
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const width = pct(stage.count);
          return (
            <div key={stage.label}>
              <div className="flex items-center gap-3 mb-1">
                <div className={`rounded-lg p-1.5 ${stage.bg} shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 ${stage.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stage.label}</span>
                    <span className={`text-lg font-bold ${stage.color}`}>
                      {stage.count}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{stage.sublabel}</p>
                </div>
              </div>
              <div className="ml-9 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    i === 0
                      ? "bg-slate-400"
                      : i === 1
                      ? "bg-amber-500"
                      : i === 2
                      ? "bg-primary"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
              {/* Conversion rate arrow between stages */}
              {i < stages.length - 1 && (
                <div className="ml-9 mt-1 mb-1 flex items-center gap-1">
                  <div className="h-px flex-1 border-l border-dashed border-border" />
                  <span className="text-[10px] text-muted-foreground px-1">
                    {rates[i]}% pasan →
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Summary insight */}
        <div className="mt-4 pt-4 border-t rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            {activeClients > 0 && totalLeads > 0 ? (
              <>
                Cierras{" "}
                <span className="font-semibold text-foreground">
                  {Math.round((activeClients / totalLeads) * 100)}%
                </span>{" "}
                de tus leads en clientes activos.
                {withMockup > proposalSent && (
                  <>
                    {" "}
                    <span className="text-amber-600 font-medium">
                      {withMockup - proposalSent} mockups sin enviar.
                    </span>
                  </>
                )}
              </>
            ) : (
              "Agrega leads y mockups para ver tu embudo de conversión."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
