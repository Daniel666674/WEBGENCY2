import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: "primary" | "purple" | "amber" | "green" | "red" | "blue" | "muted";
  subtext?: string;
  change?: { value: number; label?: string };
  sparkline?: number[];
  progress?: number;
  highlight?: boolean;
  className?: string;
}

const COLOR_MAP: Record<
  NonNullable<StatTileProps["color"]>,
  { chip: string; icon: string; value: string; bar: string; spark: string }
> = {
  primary: { chip: "bg-primary/10", icon: "text-primary", value: "text-primary", bar: "bg-primary", spark: "var(--color-primary)" },
  purple: { chip: "bg-purple-500/10", icon: "text-purple-600", value: "text-purple-600", bar: "bg-purple-500", spark: "#9333ea" },
  amber: { chip: "bg-amber-500/10", icon: "text-amber-600", value: "text-amber-600", bar: "bg-amber-500", spark: "#d97706" },
  green: { chip: "bg-green-500/10", icon: "text-green-600", value: "text-green-600", bar: "bg-green-500", spark: "#16a34a" },
  red: { chip: "bg-red-500/10", icon: "text-red-600", value: "text-red-600", bar: "bg-red-500", spark: "#dc2626" },
  blue: { chip: "bg-blue-500/10", icon: "text-blue-600", value: "text-blue-600", bar: "bg-blue-500", spark: "#2563eb" },
  muted: { chip: "bg-muted", icon: "text-muted-foreground", value: "text-foreground", bar: "bg-muted-foreground", spark: "#a1a1aa" },
};

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = `M${points.join(" L")}`;
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} className="shrink-0 opacity-80">
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
  color = "muted",
  subtext,
  change,
  sparkline,
  progress,
  highlight = false,
  className,
}: StatTileProps) {
  const c = COLOR_MAP[color];
  return (
    <Card className={cn(highlight && "border-primary/30 bg-primary/5", className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
        <div className={cn("rounded-lg p-1.5", c.chip)}>
          <Icon className={cn("h-3.5 w-3.5", c.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className={cn("text-2xl font-bold", color !== "muted" && c.value)}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {change && (
              <p className={cn(
                "mt-0.5 text-xs font-medium",
                change.value > 0 ? "text-green-500" : change.value < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {change.value > 0 ? "↑" : change.value < 0 ? "↓" : ""} {Math.abs(change.value)}% {change.label ?? "vs. mes anterior"}
              </p>
            )}
            {subtext && !change && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          {sparkline && sparkline.length > 1 && (
            <MiniSparkline data={sparkline} color={c.spark} />
          )}
        </div>
        {progress !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", c.bar)}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
