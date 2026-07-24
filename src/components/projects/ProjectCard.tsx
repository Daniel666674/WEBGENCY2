"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/constants";
import { FolderKanban, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_CONFIG } from "@/lib/projectStatus";

// Re-exported for existing importers; the source of truth is the plain
// (non-"use client") module in @/lib/projectStatus so Server Components can
// import it without it becoming an undefined client-reference proxy.
export { PROJECT_STATUS_CONFIG };

interface ProjectCardProps {
  id: string;
  name: string;
  status: string;
  budgetCents: number;
  deadline?: Date | number | null;
  clientName?: string | null;
  milestonesTotal?: number;
  milestonesCompleted?: number;
}

export function ProjectCard({
  id,
  name,
  status,
  budgetCents,
  deadline,
  clientName,
  milestonesTotal = 0,
  milestonesCompleted = 0,
}: ProjectCardProps) {
  const router = useRouter();
  const cfg = PROJECT_STATUS_CONFIG[status] ?? PROJECT_STATUS_CONFIG.discovery;
  const progress = milestonesTotal > 0 ? Math.round((milestonesCompleted / milestonesTotal) * 100) : 0;

  const deadlineDate = deadline ? new Date(deadline) : null;
  const now = Date.now();
  const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - now) / 86400000) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;

  return (
    <div
      onClick={() => router.push(`/projects/${id}`)}
      className="bg-card border rounded-xl p-4 cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FolderKanban className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-sm truncate">{name}</span>
        </div>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
          {cfg.label}
        </span>
      </div>

      {clientName && (
        <p className="text-xs text-muted-foreground">{clientName}</p>
      )}

      {milestonesTotal > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {milestonesCompleted}/{milestonesTotal} milestones
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-primary">{formatCurrency(budgetCents)}</span>
        {deadlineDate && (
          <span
            className={cn(
              "flex items-center gap-1",
              isOverdue ? "text-destructive font-medium" :
              isUrgent  ? "text-warning font-medium" :
              "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            {isOverdue
              ? `${Math.abs(daysLeft!)}d vencido`
              : daysLeft === 0
              ? "Hoy"
              : `${daysLeft}d`}
          </span>
        )}
      </div>
    </div>
  );
}
