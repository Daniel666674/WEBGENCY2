import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

interface SettingsHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function SettingsHeader({ icon: Icon, title, description }: SettingsHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/settings"
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-muted transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
