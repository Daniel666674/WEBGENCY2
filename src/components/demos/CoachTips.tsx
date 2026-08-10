"use client";

import { useState } from "react";
import { Lightbulb, ChevronDown, X } from "lucide-react";
import type { Section, DemoConfig } from "@/lib/demo/types";
import { SECTION_LABELS } from "@/lib/demo/types";
import { SECTION_COACHING, ELEMENT_COACHING, briefAdvice } from "@/lib/demo/coach";

const DISMISS_KEY = "oliwan_demo_tips_off";

function isDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DISMISS_KEY) === "1";
}

/**
 * Contextual coaching for whatever the user is editing right now.
 *
 * Sits above the section editor so the advice is read in the same glance as
 * the fields it applies to. Tips are specific to the section type, and — when
 * an individual element is selected — to that field. Anything derived from
 * the pre-build brief is shown first, since it is the only part that knows
 * about this particular business.
 */
export function CoachTips({
  section,
  elementKey,
  cfg,
}: {
  section: Section;
  /** Set when a single element is selected rather than the whole section. */
  elementKey?: string;
  cfg: DemoConfig;
}) {
  const [off, setOff] = useState(isDismissed);
  const [open, setOpen] = useState(true);

  if (off) return null;

  const coaching = SECTION_COACHING[section.type];
  if (!coaching) return null;

  const elementTip = elementKey ? ELEMENT_COACHING[elementKey] : undefined;
  // Brief-derived advice is about the business, not the section, so it only
  // makes sense on the sections it actually speaks to.
  const fromBrief = ["hero", "cta", "contact", "menu", "testimonials"].includes(section.type)
    ? briefAdvice(cfg.brief, cfg.brand).slice(0, 2)
    : [];

  function turnOff() {
    localStorage.setItem(DISMISS_KEY, "1");
    setOff(true);
  }

  return (
    <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/5">
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-left text-[11px] font-semibold"
        >
          Consejos · {SECTION_LABELS[section.type]}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
        <button
          type="button"
          onClick={turnOff}
          title="No mostrar más consejos"
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-amber-500/20 px-2.5 py-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">{coaching.purpose}</p>

          {elementTip && (
            <p className="rounded border border-amber-500/25 bg-background/60 px-2 py-1.5 text-[11px] leading-relaxed">
              {elementTip}
            </p>
          )}

          {fromBrief.length > 0 && (
            <ul className="space-y-1">
              {fromBrief.map((t) => (
                <li key={t} className="flex gap-1.5 text-[11px] font-medium leading-relaxed">
                  <span className="text-amber-600 dark:text-amber-400">→</span>
                  {t}
                </li>
              ))}
            </ul>
          )}

          <ul className="space-y-1">
            {coaching.tips.map((t) => (
              <li key={t} className="flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <span className="text-amber-600/70 dark:text-amber-400/70">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
