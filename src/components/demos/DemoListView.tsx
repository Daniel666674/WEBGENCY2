"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { TEMPLATES } from "@/lib/demo/templates";
import { formatRelativeDate } from "@/lib/constants";
import { DemoActionsMenu } from "./DemoActionsMenu";
import { DemoThumbnail } from "./DemoThumbnail";
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
    <div className="flex flex-col divide-y divide-border">
      {demos.map((demo) => {
        const tpl = TEMPLATES.find((t) => t.id === demo.template);
        const swatch = tpl?.swatch ?? ["#1c1917", "#f5f5f4", "#b45309"];
        const statusColor = demo.published ? "bg-green-400" : "bg-amber-400";

        return (
          <div key={demo.id} className="group flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            {/* Thumbnail */}
            <Link href={`/demos/${demo.id}`} className="shrink-0">
              <DemoThumbnail
                demoId={demo.id}
                className="h-16 w-24 rounded-lg sm:h-20 sm:w-32"
              />
            </Link>

            {/* Title + slug + date */}
            <Link href={`/demos/${demo.id}`} className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor}`} />
                <p className="truncate text-sm font-semibold">{demo.title}</p>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                {demo.slug}.demoos.com <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </p>
              {demo.updatedAt && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                  Actualizado {formatRelativeDate(new Date(demo.updatedAt))}
                </p>
              )}
            </Link>

            {/* Template */}
            <div className="hidden min-w-0 flex-col gap-1 md:flex" style={{ width: 120 }}>
              <p className="text-[11px] text-muted-foreground/60">Plantilla</p>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {swatch.map((c) => (
                    <span key={c} className="h-3 w-3 rounded-sm border border-white/10" style={{ background: c }} />
                  ))}
                </div>
                <span className="truncate text-xs font-medium">{tpl?.name ?? demo.template}</span>
              </div>
            </div>

            {/* Client */}
            <div className="hidden min-w-0 flex-col gap-0.5 lg:flex" style={{ width: 120 }}>
              <p className="text-[11px] text-muted-foreground/60">Cliente</p>
              <p className="truncate text-xs font-medium">{demo.contactName ?? "Sin asignar"}</p>
              {demo.contactCompany && (
                <p className="truncate text-[11px] text-muted-foreground/60">{demo.contactCompany}</p>
              )}
            </div>

            {/* Views */}
            <div className="hidden flex-col gap-0.5 sm:flex" style={{ width: 70 }}>
              <p className="text-[11px] text-muted-foreground/60">Vistas</p>
              <p className="flex items-center gap-1 text-sm font-semibold">
                {demo.views.toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            <DemoActionsMenu
              demo={demo}
              duplicating={duplicatingId === demo.id}
              onDuplicate={() => onDuplicate(demo.id)}
              onDelete={() => onDelete(demo.id, demo.title)}
            />
          </div>
        );
      })}
    </div>
  );
}
