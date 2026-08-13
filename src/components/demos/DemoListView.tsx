"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { TEMPLATES } from "@/lib/demo/templates";
import { formatRelativeDate } from "@/lib/constants";
import { DemoActionsMenu } from "./DemoActionsMenu";
import type { DemoRow } from "./types";

export function DemoListView({
  demos, duplicatingId, onDuplicate, onDelete,
}: {
  demos: DemoRow[];
  duplicatingId: string | null;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Demo</TableHead>
            <TableHead>Plantilla</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vistas</TableHead>
            <TableHead>Actualizado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {demos.map((demo) => {
            const tpl = TEMPLATES.find((t) => t.id === demo.template);
            return (
              <TableRow key={demo.id} className="group">
                <TableCell>
                  <Link href={`/demos/${demo.id}`} className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-12 shrink-0 items-center gap-0.5 rounded-md px-1.5" style={{ background: tpl?.swatch[0] ?? "#1c1917" }}>
                      {tpl?.swatch.slice(0, 3).map((c) => (
                        <span key={c} className="h-3.5 w-3.5 rounded-sm border border-white/20" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${demo.published ? "bg-green-400" : "bg-muted-foreground/50"}`} />
                        <p className="truncate text-sm font-medium">{demo.title}</p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">/{demo.slug}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{tpl?.name ?? demo.template}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{demo.contactName ?? "Sin asignar"}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {demo.views}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {demo.updatedAt ? formatRelativeDate(new Date(demo.updatedAt)) : "—"}
                </TableCell>
                <TableCell>
                  <DemoActionsMenu
                    demo={demo}
                    duplicating={duplicatingId === demo.id}
                    onDuplicate={() => onDuplicate(demo.id)}
                    onDelete={() => onDelete(demo.id, demo.title)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
