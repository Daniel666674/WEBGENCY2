"use client";

import { Layers, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BuildMode } from "./types";

export function ModeToggle({ mode, onChange }: { mode: BuildMode; onChange: (m: BuildMode) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={() => onChange("tiers")}
        className={cn(
          "relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer",
          mode === "tiers" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20"
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Layers className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Por planes</p>
          <p className="text-xs text-muted-foreground mt-0.5">Elige un plan prediseñado y ajusta módulos.</p>
        </div>
      </button>

      <button
        onClick={() => onChange("custom")}
        className={cn(
          "relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer",
          mode === "custom" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20"
        )}
      >
        <span className="absolute top-3 right-3 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          Más flexible
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Star className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Sitio 100% personalizado</p>
          <p className="text-xs text-muted-foreground mt-0.5">Construye tu solución a la medida desde cero.</p>
        </div>
      </button>
    </div>
  );
}
