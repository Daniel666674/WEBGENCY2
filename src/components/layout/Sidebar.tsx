"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Activity,
  Settings,
  Briefcase,
  DollarSign,
  Zap,
  TrendingUp,
  FileText,
  Package,
  Calculator,
  UserCheck,
  FolderKanban,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  header?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
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

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  return (
    <>
      {/* Invisible trigger strip — 10px wide, full height, left edge */}
      <div
        className="fixed left-0 top-0 h-full w-[10px] z-50"
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
      />

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 z-50 flex flex-col",
          "bg-[var(--sidebar)] text-[var(--sidebar-foreground)]",
          "shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-[var(--sidebar-border)] shrink-0">
          <Zap className="h-5 w-5 text-[var(--sidebar-primary)]" />
          <span className="text-xl font-bold tracking-tight">OLIWAN</span>
        </div>

        {/* Nav */}
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
                    onClick={() => scheduleClose()}
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

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[var(--sidebar-border)] shrink-0">
          <p className="text-xs text-[var(--sidebar-foreground)]/50">OLIWAN v1.0</p>
          <p className="text-xs text-[var(--sidebar-foreground)]/50">Revenue Engine</p>
        </div>
      </aside>
    </>
  );
}
