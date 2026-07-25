"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Plan", id: "step-plan" },
  { n: 2, label: "Módulos", id: "step-modulos" },
  { n: 3, label: "Personalizaciones", id: "step-personalizaciones" },
  { n: 4, label: "Resumen", id: "step-resumen" },
];

export function Stepper({ active, onSelect }: { active: number; onSelect: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              onSelect(s.n);
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors",
                active === s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {s.n}
            </span>
            <span className={cn("text-sm font-medium whitespace-nowrap", active === s.n ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
          </button>
          {i < STEPS.length - 1 && <span className="h-px w-6 bg-border shrink-0" />}
        </div>
      ))}
    </div>
  );
}
