"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import { TrendingUp, Users, DollarSign } from "lucide-react";

interface MRRHeroProps {
  mrr: number;
  arr: number;
  activeClients: number;
  conversionRate: number;
  overdueFollowups: number;
}

export function MRRHero({ mrr, arr, activeClients, conversionRate, overdueFollowups }: MRRHeroProps) {
  return (
    <Card className="h-full border-primary/20 bg-gradient-to-b from-primary/8 to-primary/3 flex flex-col relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-25"
        style={{ backgroundColor: "var(--primary)" }}
      />
      <CardContent className="flex flex-col h-full p-6 gap-6 relative">
        {/* Main MRR */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">
            MRR
          </p>
          <div className="text-4xl font-bold text-primary leading-none">
            {formatCurrency(mrr)}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            ARR {formatCurrency(arr)}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Clients */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Clientes Activos</p>
          </div>
          <p className="text-2xl font-bold">{activeClients}</p>
        </div>

        {/* Conversion */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Tasa de cierre</p>
            <p className="text-xs font-bold text-primary">{conversionRate}%</p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${Math.min(conversionRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Overdue alert */}
        {overdueFollowups > 0 && (
          <div className="mt-auto rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-xs text-destructive font-medium">
              {overdueFollowups} seguimiento{overdueFollowups > 1 ? "s" : ""} vencido{overdueFollowups > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
