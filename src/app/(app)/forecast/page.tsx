"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { TrendingUp, Target, DollarSign, Calendar } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  contactName?: string;
  expectedClose?: string | number | null;
  stageName?: string;
}

export default function ForecastPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((data) => {
        setDeals(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeDeals = deals.filter((d) => !["Cerrado Ganado", "Cerrado Perdido"].includes(d.stageName || ""));
  const totalPipeline = activeDeals.reduce((s, d) => s + d.value, 0);
  const weightedPipeline = activeDeals.reduce((s, d) => s + Math.round((d.value * d.probability) / 100), 0);

  const high = activeDeals.filter((d) => d.probability >= 70);
  const medium = activeDeals.filter((d) => d.probability >= 40 && d.probability < 70);
  const low = activeDeals.filter((d) => d.probability < 40);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Forecast</h1>
        <p className="text-muted-foreground">Proyeccion de ingresos basada en el pipeline</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Pipeline Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalPipeline)}</div>
                <p className="text-xs text-muted-foreground">{activeDeals.length} deals activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Forecast Ponderado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(weightedPipeline)}</div>
                <p className="text-xs text-muted-foreground">Ajustado por probabilidad</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" /> Tasa de Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {deals.length > 0
                    ? `${Math.round((deals.filter((d) => d.stageName === "Cerrado Ganado").length / deals.length) * 100)}%`
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Deals ganados / total</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { label: "Alta Probabilidad", items: high, color: "text-green-600", badge: "bg-green-100 text-green-700", threshold: "≥70%" },
              { label: "Media Probabilidad", items: medium, color: "text-amber-600", badge: "bg-amber-100 text-amber-700", threshold: "40-69%" },
              { label: "Baja Probabilidad", items: low, color: "text-red-600", badge: "bg-red-100 text-red-700", threshold: "<40%" },
            ].map((group) => (
              <Card key={group.label}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{group.label}</CardTitle>
                  <Badge className={group.badge}>{group.threshold}</Badge>
                </CardHeader>
                <CardContent>
                  {group.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin deals</p>
                  ) : (
                    <div className="space-y-3">
                      {group.items.map((deal) => (
                        <div key={deal.id} className="p-2.5 rounded-lg border">
                          <p className="text-sm font-medium truncate">{deal.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-sm font-semibold ${group.color}`}>
                              {formatCurrency(deal.value)}
                            </span>
                            <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t flex justify-between text-sm font-semibold">
                        <span>Subtotal</span>
                        <span>{formatCurrency(group.items.reduce((s, d) => s + d.value, 0))}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
