"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle, Lightbulb, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import type { DemoConfig } from "@/lib/demo/types";
import { analyzeDemo, templateTips, type AdviceLevel } from "@/lib/demo/advisor";

const LEVEL_META: Record<AdviceLevel, { icon: typeof AlertCircle; cls: string; label: string }> = {
  error: {
    icon: AlertCircle,
    cls: "border-red-500/40 bg-red-500/[0.07] text-red-600 dark:text-red-400",
    label: "Corregir",
  },
  warning: {
    icon: AlertTriangle,
    cls: "border-amber-500/40 bg-amber-500/[0.07] text-amber-600 dark:text-amber-400",
    label: "Revisar",
  },
  tip: {
    icon: Lightbulb,
    cls: "border-border bg-muted/50 text-muted-foreground",
    label: "Sugerencia",
  },
};

export function DesignAdvisor({
  cfg, onGoToSection,
}: {
  cfg: DemoConfig;
  onGoToSection: (id: string) => void;
}) {
  const advice = useMemo(() => analyzeDemo(cfg), [cfg]);
  const tips = useMemo(() => templateTips(cfg), [cfg]);

  const errors = advice.filter((a) => a.level === "error").length;
  const warnings = advice.filter((a) => a.level === "warning").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="rounded-lg border border-border p-3">
        {advice.length === 0 ? (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs font-semibold">Todo en orden</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                No encontramos problemas. El demo está listo para mostrarse.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs">
            {errors > 0 && (
              <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" /> {errors} por corregir
              </span>
            )}
            {warnings > 0 && (
              <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> {warnings} por revisar
              </span>
            )}
            {errors === 0 && warnings === 0 && (
              <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Sin problemas graves
              </span>
            )}
          </div>
        )}
      </div>

      {/* Findings */}
      {advice.length > 0 && (
        <div className="flex flex-col gap-2">
          {advice.map((a) => {
            const meta = LEVEL_META[a.level];
            const Icon = meta.icon;
            return (
              <div key={a.id} className={`rounded-lg border p-2.5 ${meta.cls}`}>
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-snug">{a.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{a.detail}</p>
                    {a.sectionId && (
                      <button
                        type="button"
                        onClick={() => onGoToSection(a.sectionId!)}
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        Ir a la sección <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Template-specific guidance */}
      <div className="border-t border-border pt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Consejos para esta plantilla
        </p>
        <ul className="flex flex-col gap-2">
          {tips.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
