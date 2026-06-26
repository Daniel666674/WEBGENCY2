import Link from "next/link";
import { FolderKanban, Calendar, AlertCircle } from "lucide-react";
import { PROJECT_STATUS_CONFIG } from "@/components/projects/ProjectCard";

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  deadline?: number | null;
  clientName?: string | null;
  milestonesTotal: number;
  milestonesCompleted: number;
}

export function ActiveProjects({ projects }: { projects: ProjectSummary[] }) {
  const now = Date.now();

  const sorted = [...projects].sort((a, b) => {
    const aD = a.deadline ?? Infinity;
    const bD = b.deadline ?? Infinity;
    return Number(aD) - Number(bD);
  });

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <FolderKanban className="h-4 w-4 text-primary" />
          Proyectos Activos
        </h3>
        <Link href="/projects" className="text-xs text-primary hover:underline">
          Ver todos
        </Link>
      </div>

      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Sin proyectos activos</p>
      )}

      <div className="space-y-2">
        {sorted.map((p) => {
          const cfg = PROJECT_STATUS_CONFIG[p.status] ?? PROJECT_STATUS_CONFIG.discovery;
          const progress = p.milestonesTotal > 0
            ? Math.round((p.milestonesCompleted / p.milestonesTotal) * 100)
            : 0;
          const dl = p.deadline ? new Date(p.deadline) : null;
          const daysLeft = dl ? Math.ceil((dl.getTime() - now) / 86400000) : null;
          const isOverdue = daysLeft !== null && daysLeft < 0;
          const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;

          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  {cfg.label}
                </span>
                <span className="text-xs font-medium truncate flex-1">{p.name}</span>
                {dl && (
                  <span className={`text-[10px] flex items-center gap-0.5 shrink-0 ${isOverdue ? "text-destructive font-medium" : isUrgent ? "text-warning" : "text-muted-foreground"}`}>
                    {isOverdue && <AlertCircle className="h-3 w-3" />}
                    <Calendar className="h-3 w-3" />
                    {isOverdue
                      ? `${Math.abs(daysLeft!)}d vencido`
                      : daysLeft === 0 ? "Hoy"
                      : `${daysLeft}d`}
                  </span>
                )}
              </div>
              {p.milestonesTotal > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{progress}%</span>
                </div>
              )}
              {p.clientName && (
                <p className="text-[10px] text-muted-foreground mt-1">{p.clientName}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
