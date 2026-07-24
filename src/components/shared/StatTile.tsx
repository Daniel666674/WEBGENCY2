import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: "primary" | "purple" | "amber" | "green" | "red" | "blue" | "muted";
  subtext?: string;
  progress?: number;
  highlight?: boolean;
  className?: string;
}

const COLOR_MAP: Record<
  NonNullable<StatTileProps["color"]>,
  { chip: string; icon: string; value: string; bar: string }
> = {
  primary: { chip: "bg-primary/10", icon: "text-primary", value: "text-primary", bar: "bg-primary" },
  purple: { chip: "bg-purple-500/10", icon: "text-purple-600", value: "text-purple-600", bar: "bg-purple-500" },
  amber: { chip: "bg-amber-500/10", icon: "text-amber-600", value: "text-amber-600", bar: "bg-amber-500" },
  green: { chip: "bg-green-500/10", icon: "text-green-600", value: "text-green-600", bar: "bg-green-500" },
  red: { chip: "bg-red-500/10", icon: "text-red-600", value: "text-red-600", bar: "bg-red-500" },
  blue: { chip: "bg-blue-500/10", icon: "text-blue-600", value: "text-blue-600", bar: "bg-blue-500" },
  muted: { chip: "bg-muted", icon: "text-muted-foreground", value: "text-foreground", bar: "bg-muted-foreground" },
};

export function StatTile({
  icon: Icon,
  label,
  value,
  color = "muted",
  subtext,
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
        <div className={cn("text-2xl font-bold", color !== "muted" && c.value)}>{value}</div>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
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
