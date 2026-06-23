"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, Flame, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

interface KPICardsProps {
  stats: {
    totalContacts: number;
    activeDeals: number;
    totalPipelineValue: number;
    wonDealsValue: number;
    conversionRate: number;
    hotLeads: number;
    overdueFollowups?: number;
  };
}

export function KPICards({ stats }: KPICardsProps) {
  const cards = [
    {
      title: "Pipeline Activo",
      value: formatCurrency(stats.totalPipelineValue),
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
    },
    {
      title: "Ganado",
      value: formatCurrency(stats.wonDealsValue),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-600/10",
    },
    {
      title: "Deals Activos",
      value: stats.activeDeals.toString(),
      icon: Briefcase,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10",
    },
    {
      title: "Leads Calientes",
      value: stats.hotLeads.toString(),
      icon: Flame,
      color: "text-red-600",
      bgColor: "bg-red-600/10",
    },
    {
      title: "Total Contactos",
      value: stats.totalContacts.toString(),
      icon: Users,
      color: "text-sky-600",
      bgColor: "bg-sky-600/10",
    },
    {
      title: "Tareas Vencidas",
      value: (stats.overdueFollowups ?? 0).toString(),
      icon: AlertCircle,
      color: stats.overdueFollowups ? "text-orange-600" : "text-green-600",
      bgColor: stats.overdueFollowups ? "bg-orange-600/10" : "bg-green-600/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-1.5 ${card.bgColor}`}>
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
