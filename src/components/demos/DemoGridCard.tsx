"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { TEMPLATES } from "@/lib/demo/templates";
import { DemoActionsMenu } from "./DemoActionsMenu";
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

  return (
    <Link
      href={`/demos/${demo.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative flex h-24 items-center gap-1.5 px-4" style={{ background: tpl?.swatch[0] ?? "#1c1917" }}>
        {tpl?.swatch.map((c) => (
          <span key={c} className="h-8 w-8 rounded border border-white/20" style={{ background: c }} />
        ))}
        <span
          className={`absolute right-3 top-3 h-2 w-2 rounded-full ${demo.published ? "bg-green-400" : "bg-muted-foreground/50"}`}
          title={demo.published ? "Publicado" : "Borrador"}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{demo.title}</p>
            <p className="truncate text-xs text-muted-foreground">{demo.contactName ?? "Sin asignar"}</p>
          </div>
          <div onClick={(e) => e.preventDefault()}>
            <DemoActionsMenu demo={demo} duplicating={duplicating} onDuplicate={onDuplicate} onDelete={onDelete} />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{tpl?.name ?? demo.template}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" /> {demo.views}
          </span>
        </div>
      </div>
    </Link>
  );
}
