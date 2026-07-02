"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatTile } from "@/components/shared/StatTile";
import { Plus, Briefcase, Download, DollarSign, Percent } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";
import { DealForm } from "@/components/deals/DealForm";

interface DealRow {
  id: string;
  title: string;
  value: number;
  probability: number;
  contactName: string | null;
  stageName: string | null;
  stageColor: string | null;
  expectedClose: number | Date | null;
  createdAt: number | Date;
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/deals").then((r) => r.json()), new Promise((r) => setTimeout(r, 1800))])
      .then(([data]) => {
        setDeals(data);
        setLoading(false);
      });
  }, [showForm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Oportunidades de venta activas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/api/export?type=deals")}
            className="cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowForm(true)} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Deal
          </Button>
        </div>
      </div>

      {loading ? (
        <DogSpinnerPage label="Cargando deals..." />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No hay deals"
          description="Crea tu primer deal para comenzar a gestionar tu pipeline."
          actionLabel="Crear deal"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile icon={Briefcase} label="Total Deals" value={deals.length} color="primary" highlight />
            <StatTile
              icon={DollarSign}
              label="Valor en Pipeline"
              value={formatCurrency(deals.reduce((s, d) => s + d.value, 0))}
              color="green"
            />
            <StatTile
              icon={Percent}
              label="Probabilidad Promedio"
              value={
                deals.length > 0
                  ? `${Math.round(deals.reduce((s, d) => s + d.probability, 0) / deals.length)}%`
                  : "—"
              }
              color="amber"
            />
          </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="hidden md:table-cell">Probabilidad</TableHead>
                <TableHead className="hidden lg:table-cell">Cierre est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/deals/${deal.id}`)}
                >
                  <TableCell className="font-medium">{deal.title}</TableCell>
                  <TableCell>{deal.contactName || "-"}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatCurrency(deal.value)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: deal.stageColor || undefined,
                        color: deal.stageColor || undefined,
                      }}
                    >
                      {deal.stageName}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {deal.probability}%
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(deal.expectedClose)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </>
      )}

      <DealForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
