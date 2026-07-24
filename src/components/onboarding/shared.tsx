import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Small presentational building blocks shared across the onboarding sections,
// so each section file stays focused on content rather than markup.

export type AccentColor = "primary" | "green" | "blue" | "purple" | "amber" | "red";

const ACCENT_STYLES: Record<AccentColor, { chip: string; icon: string; text: string; border: string }> = {
  primary: { chip: "bg-primary/10", icon: "text-primary", text: "text-primary", border: "border-primary/30" },
  green: { chip: "bg-green-500/10", icon: "text-green-600", text: "text-green-600", border: "border-green-500/30" },
  blue: { chip: "bg-blue-500/10", icon: "text-blue-600", text: "text-blue-600", border: "border-blue-500/30" },
  purple: { chip: "bg-purple-500/10", icon: "text-purple-600", text: "text-purple-600", border: "border-purple-500/30" },
  amber: { chip: "bg-amber-500/10", icon: "text-amber-600", text: "text-amber-600", border: "border-amber-500/30" },
  red: { chip: "bg-red-500/10", icon: "text-red-600", text: "text-red-600", border: "border-red-500/30" },
};

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">{children}</p>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold tracking-tight mt-2">{children}</h2>;
}

export function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">{children}</h3>;
}

export function Callout({
  tone = "primary",
  title,
  icon: Icon,
  children,
}: {
  tone?: "primary" | "amber" | "green" | "red";
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    primary: "border-primary/30 bg-primary/5",
    amber: "border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/10",
    green: "border-green-300/50 bg-green-50/60 dark:bg-green-500/10",
    red: "border-red-300/50 bg-red-50/60 dark:bg-red-500/10",
  };
  const accent = ACCENT_STYLES[tone === "primary" ? "primary" : tone === "amber" ? "amber" : tone === "green" ? "green" : "red"];
  return (
    <div className={cn("rounded-xl border p-4 text-sm leading-relaxed", tones[tone])}>
      {title && (
        <div className="flex items-center gap-2 mb-2">
          {Icon && (
            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", accent.chip)}>
              <Icon className={cn("h-3.5 w-3.5", accent.icon)} />
            </span>
          )}
          <p className={cn("font-semibold text-xs uppercase tracking-wide", accent.text)}>{title}</p>
        </div>
      )}
      <div className="text-foreground/80 space-y-2">{children}</div>
    </div>
  );
}

export function InfoCard({
  title,
  children,
  accent,
  icon: Icon,
  color,
  listLabel,
  items,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  accent?: string;
  icon?: LucideIcon;
  color?: AccentColor;
  listLabel?: string;
  items?: string[];
}) {
  const a = color ? ACCENT_STYLES[color] : null;
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          {Icon && a && (
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", a.chip)}>
              <Icon className={cn("h-4 w-4", a.icon)} />
            </span>
          )}
          {!Icon && accent && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />}
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        {children && <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">{children}</div>}
        {items && items.length > 0 && (
          <div className="pt-1">
            {listLabel && <p className="text-xs text-muted-foreground mb-1.5">— {listLabel} —</p>}
            <ul className="space-y-1.5">
              {items.map((it, i) => (
                <li key={i} className="flex items-center gap-2 text-sm leading-relaxed">
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", a ? a.icon.replace("text-", "bg-") : "bg-primary")} />
                  <span className="text-foreground/80">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed">
          <span className="text-primary mt-0.5 shrink-0">✓</span>
          <span className="text-foreground/80">{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="space-y-3">
      {items.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {i + 1}
          </span>
          <div className="pt-0.5">
            <p className="font-semibold text-sm">{s.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const FLOW_CYCLE: AccentColor[] = ["primary", "blue", "purple", "amber", "green", "red"];

export function FlowSteps({
  items,
}: {
  items: { title: string; body: string; icon: LucideIcon; color?: AccentColor }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((s, i) => {
        const color = s.color ?? FLOW_CYCLE[i % FLOW_CYCLE.length];
        const a = ACCENT_STYLES[color];
        const Icon = s.icon;
        return (
          <div key={i} className="relative rounded-xl border bg-card p-4">
            <div className="relative w-fit">
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", a.chip)}>
                <Icon className={cn("h-5 w-5", a.icon)} />
              </span>
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {i + 1}
              </span>
            </div>
            <p className="font-semibold text-sm mt-3">{s.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">{s.body}</p>
            {i < items.length - 1 && (
              <span className="hidden lg:block absolute top-9 -right-3 w-3 border-t border-dashed border-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Banner({
  icon: Icon,
  label,
  children,
  highlights,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  highlights?: { icon: LucideIcon; label: string }[];
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div className="text-sm leading-relaxed">
          <span className="font-semibold">{label}</span> <span className="text-foreground/80">{children}</span>
        </div>
      </div>
      {highlights && highlights.length > 0 && (
        <div className="flex flex-wrap gap-4 lg:ml-auto lg:pl-4 lg:border-l lg:border-primary/20">
          {highlights.map((h, i) => {
            const HIcon = h.icon;
            return (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                <HIcon className="h-4 w-4 text-primary shrink-0" />
                {h.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
