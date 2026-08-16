"use client";

import Link from "next/link";
import { Eye, ExternalLink } from "lucide-react";
import { TEMPLATES } from "@/lib/demo/templates";
import { formatRelativeDate } from "@/lib/constants";
import { DemoActionsMenu } from "./DemoActionsMenu";
import { DemoThumbnail } from "./DemoThumbnail";
import type { DemoRow } from "./types";

export function DemoGridCard({
  demo, duplicating, onDuplicate, onDelete,
}: {
  demo: DemoRow;
  duplicating: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const tpl = TEMPLATES.find((t) => t.id === demo.template);
  const swatch = tpl?.swatch ?? ["#1c1917", "#f5f5f4", "#b45309"];
  const statusColor = demo.published ? "bg-green-400" : "bg-amber-400";
  const statusLabel = demo.published ? "Publicado" : "Borrador";

  return (
    <Link
      href={`/demos/${demo.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Live thumbnail preview */}
      <div className="relative" style={{ height: 160 }}>
        <DemoThumbnail
          demoId={demo.id}
          className="h-full w-full rounded-t-xl"
        />
        <div
          className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-white backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
          {statusLabel}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor}`} />
              <p className="truncate text-sm font-semibold">{demo.title}</p>
            </div>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              {demo.slug}.demoos.com <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
            </p>
            {demo.updatedAt && (
              <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                Actualizado {formatRelativeDate(new Date(demo.updatedAt))}
              </p>
            )}
          </div>
          <div onClick={(e) => e.preventDefault()}>
            <DemoActionsMenu demo={demo} duplicating={duplicating} onDuplicate={onDuplicate} onDelete={onDelete} />
          </div>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3 text-[11px]">
          <div>
            <p className="text-muted-foreground/60">Plantilla</p>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {swatch.map((c) => (
                  <span key={c} className="h-3 w-3 rounded-sm border border-white/10" style={{ background: c }} />
                ))}
              </div>
              <span className="truncate font-medium">{tpl?.name ?? demo.template}</span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground/60">Cliente</p>
            <p className="mt-1 truncate font-medium">{demo.contactName ?? "Sin asignar"}</p>
            {demo.contactCompany && (
              <p className="truncate text-muted-foreground/60">{demo.contactCompany}</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground/60">Vistas</p>
            <p className="mt-1 flex items-center gap-1 font-medium">
              <Eye className="h-3 w-3 text-muted-foreground/60" />
              {demo.views.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
