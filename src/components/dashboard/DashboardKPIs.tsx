"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import {
  TrendingUp,
  DollarSign,
  ImageIcon,
  Users,
  Briefcase,
  Target,
  AlertCircle,
} from "lucide-react";

interface DashboardKPIProps {
  mrr: number;
  arr: number;
  pipeline: number;
  mockupsActive: number;
  hotLeads: number;
  activeClients: number;
  conversionRate: number;
  overdueFollowups: number;
}

export function DashboardKPIs({
  mrr,
  arr,
  pipeline,
  mockupsActive,
  hotLeads,
  activeClients,
  conversionRate,
  overdueFollowups,
}: DashboardKPIProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* MRR — primary metric */}
      <Card className="lg:col-span-1 border-primary/30 bg-primary/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            MRR
          </CardTitle>
          <div className="rounded-lg p-1.5 bg-primary/10">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(mrr)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            ARR {formatCurrency(arr)}
          </p>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pipeline
          </CardTitle>
          <div className="rounded-lg p-1.5 bg-purple-500/10">
            <Briefcase className="h-3.5 w-3.5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pipeline)}</div>
          <p className="text-xs text-muted-foreground mt-1">Deals activos</p>
        </CardContent>
      </Card>

      {/* Mockups activos */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Mockups Activos
          </CardTitle>
          <div className="rounded-lg p-1.5 bg-amber-500/10">
            <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockupsActive}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {hotLeads} calientes
          </p>
        </CardContent>
      </Card>

      {/* Clientes + Conversión */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Clientes Activos
          </CardTitle>
          <div className="rounded-lg p-1.5 bg-green-500/10">
            <Users className="h-3.5 w-3.5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeClients}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(conversionRate, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {conversionRate}% cierre
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
