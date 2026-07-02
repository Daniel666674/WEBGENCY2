"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Activity,
  Settings,
  Briefcase,
  DollarSign,
  TrendingUp,
  FileText,
  Package,
  Calculator,
  UserCheck,
  FolderKanban,
  ClipboardList,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/planner", label: "Planner", icon: CalendarDays },
      { href: "/pipeline", label: "Pipeline", icon: Kanban },
      { href: "/contacts", label: "Contactos", icon: Users },
      { href: "/deals", label: "Deals", icon: Briefcase },
      { href: "/activities", label: "Actividades", icon: Activity },
    ],
  },
  {
    header: "REVENUE",
    items: [
      { href: "/revenue", label: "Revenue", icon: DollarSign },
      { href: "/forecast", label: "Forecast", icon: TrendingUp },
    ],
  },
  {
    header: "ACCOUNT MANAGEMENT",
    items: [
      { href: "/clients", label: "Clientes Activos", icon: UserCheck },
      { href: "/projects", label: "Proyectos", icon: FolderKanban },
      { href: "/tareas", label: "Tareas", icon: ClipboardList },
      { href: "/solicitudes", label: "Solicitudes", icon: MessageSquare },
      { href: "/deliverables", label: "Entregables", icon: Package },
    ],
  },
  {
    header: "PROPUESTAS & PRECIOS",
    items: [
      { href: "/proposals", label: "Propuestas", icon: FileText },
      { href: "/calculator", label: "Calculadora", icon: Calculator },
    ],
  },
  {
    header: "CONFIG",
    items: [
      { href: "/settings", label: "Configuracion", icon: Settings },
    ],
  },
];

export function MobileNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[var(--sidebar)] text-[var(--sidebar-foreground)]">
      <div className="flex h-16 items-center gap-3 px-4 border-b border-[var(--sidebar-border)]">
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-lg blur-md opacity-60"
            style={{ backgroundColor: "var(--sidebar-primary)", animation: "oliwan-pulse 3.2s ease-in-out infinite" }}
          />
          <Image src="/logo.png" alt="OLIWAN" width={36} height={36} className="relative rounded-lg" />
        </div>
        <span className="text-lg font-bold tracking-tight">OLIWAN</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navSections.map((section, i) => (
          <div key={i}>
            {section.header && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-foreground)]/40 px-3 pt-4 pb-1">
                {section.header}
              </div>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] border-l-2 border-[var(--sidebar-primary)]"
                      : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
