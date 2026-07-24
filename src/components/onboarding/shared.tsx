import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Small presentational building blocks shared across the onboarding sections,
// so each section file stays focused on content rather than markup.

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
  children,
}: {
  tone?: "primary" | "amber" | "green" | "red";
  title?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    primary: "border-primary/30 bg-primary/5",
    amber: "border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/10",
    green: "border-green-300/50 bg-green-50/60 dark:bg-green-500/10",
    red: "border-red-300/50 bg-red-50/60 dark:bg-red-500/10",
  };
  return (
    <div className={cn("rounded-xl border p-4 text-sm leading-relaxed", tones[tone])}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-foreground/80 space-y-2">{children}</div>
    </div>
  );
}

export function InfoCard({
  title,
  children,
  accent,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          {accent && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />}
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">{children}</div>
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
