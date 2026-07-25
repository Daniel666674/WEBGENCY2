"use client";

import { useState } from "react";
import { KanbanBoard } from "./KanbanBoard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Filter, LayoutGrid, List, Lightbulb } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";
import type { PipelineColumn } from "@/types";

interface PipelineViewProps {
  columns: PipelineColumn[];
}

export function PipelineView({ columns }: PipelineViewProps) {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const allDeals = columns.flatMap((c) =>
    c.deals.map((d) => ({ ...d, stageName: c.name, stageColor: c.color }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" disabled>
            Todos los pipelines
          </Button>
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("kanban")}
              aria-label="Vista Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("list")}
              aria-label="Vista Lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard initialColumns={columns} />
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="hidden md:table-cell">Probabilidad</TableHead>
                <TableHead className="hidden lg:table-cell">Cierre est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDeals.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{deal.title}</TableCell>
                  <TableCell>{deal.contactName || "—"}</TableCell>
                  <TableCell className="font-semibold text-primary">{formatCurrency(deal.value)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: deal.stageColor, color: deal.stageColor }}>
                      {deal.stageName}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{deal.probability}%</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(deal.expectedClose)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 rounded-lg border bg-amber-500/5 border-amber-500/20 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700">Consejo</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arrastra los deals entre etapas para mantener tu pipeline actualizado y tu embudo de ventas siempre al día.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          Ver guía del pipeline
        </Button>
      </div>
    </div>
  );
}
