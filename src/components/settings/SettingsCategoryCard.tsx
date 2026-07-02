import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface SettingsCategoryCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

export function SettingsCategoryCard({ href, icon: Icon, title, description, badge }: SettingsCategoryCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-3 rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:ring-1 hover:ring-primary/15 hover:-translate-y-0.5"
    >
      <div className="flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {badge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
