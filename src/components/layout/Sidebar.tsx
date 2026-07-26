"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  GraduationCap,
  Layers,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

interface NavSection {
  header?: string;
  headerColor?: string;
  items: NavItem[];
  showDots?: boolean;
  showChevron?: boolean;
}

const navSections: NavSection[] = [
  {
    header: "PRINCIPAL",
    headerColor: "text-purple-400",
    showDots: true,
    items: [
      { href: "/onboarding",   label: "Inicio",           subtitle: "Onboarding",      icon: GraduationCap,  iconColor: "text-purple-300", iconBg: "bg-purple-500/25" },
      { href: "/",             label: "Vista General",    subtitle: "Dashboard",        icon: LayoutDashboard, iconColor: "text-purple-300", iconBg: "bg-purple-500/25" },
      { href: "/pipeline",     label: "Pipeline",         subtitle: "Ventas",           icon: Kanban,          iconColor: "text-purple-300", iconBg: "bg-purple-500/25" },
      { href: "/contacts",     label: "Contactos",        subtitle: "Clientes & Leads", icon: Users,           iconColor: "text-purple-300", iconBg: "bg-purple-500/25" },
      { href: "/deals",        label: "Deals",            subtitle: "Oportunidades",    icon: Briefcase,       iconColor: "text-purple-300", iconBg: "bg-purple-500/25" },
      { href: "/activities",   label: "Actividades",      subtitle: "Seguimiento",      icon: Zap,             iconColor: "text-purple-300", iconBg: "bg-purple-500/25" },
    ],
  },
  {
    header: "REVENUE",
    headerColor: "text-purple-400",
    showChevron: true,
    items: [
      { href: "/revenue",  label: "Revenue",  subtitle: "Ingresos",    icon: DollarSign, iconColor: "text-green-300", iconBg: "bg-green-500/25" },
      { href: "/forecast", label: "Forecast", subtitle: "Proyecciones", icon: TrendingUp, iconColor: "text-green-300", iconBg: "bg-green-500/25" },
    ],
  },
  {
    header: "CUENTAS",
    headerColor: "text-purple-400",
    showChevron: true,
    items: [
      { href: "/clients",      label: "Clientes Activos", subtitle: "Organizaciones", icon: UserCheck,    iconColor: "text-blue-300",   iconBg: "bg-blue-500/25" },
      { href: "/projects",     label: "Proyectos",        subtitle: "En curso",       icon: FolderKanban, iconColor: "text-blue-300",   iconBg: "bg-blue-500/25" },
      { href: "/tareas",       label: "Tareas",           subtitle: "Pendientes",     icon: ClipboardList, iconColor: "text-blue-300",  iconBg: "bg-blue-500/25" },
      { href: "/solicitudes",  label: "Solicitudes",      subtitle: "Gestión",        icon: MessageSquare, iconColor: "text-purple-300", iconBg: "bg-purple-500/25" },
      { href: "/deliverables", label: "Entregables",      subtitle: "Entregables",    icon: Package,       iconColor: "text-purple-300", iconBg: "bg-purple-500/25" },
    ],
  },
  {
    header: "NEGOCIOS",
    headerColor: "text-purple-400",
    showChevron: true,
    items: [
      { href: "/proposals",   label: "Propuestas",  subtitle: "Cotizaciones", icon: FileText,  iconColor: "text-pink-300", iconBg: "bg-pink-500/25" },
      { href: "/calculator",  label: "Calculadora", subtitle: "Herramientas", icon: Calculator, iconColor: "text-pink-300", iconBg: "bg-pink-500/25" },
    ],
  },
  {
    header: "ARSENAL",
    headerColor: "text-purple-400",
    showChevron: true,
    items: [
      { href: "/arsenal",  label: "Arsenal",       subtitle: "Herramientas", icon: Layers,  iconColor: "text-amber-300", iconBg: "bg-amber-500/25" },
    ],
  },
  {
    header: "CONFIG",
    headerColor: "text-purple-400",
    showChevron: true,
    items: [
      { href: "/settings", label: "Configuración", subtitle: "Ajustes",      icon: Settings, iconColor: "text-muted-foreground", iconBg: "bg-muted/50" },
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

  useEffect(() => {
    const handler = () => { cancelClose(); setOpen(true); };
    window.addEventListener("oliwan:sidebar:open", handler);
    return () => window.removeEventListener("oliwan:sidebar:open", handler);
  }, [cancelClose]);

  return (
    <>
      {/* Invisible trigger strip */}
      <div
        className="hidden md:block fixed left-0 top-0 h-full w-[10px] z-50"
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
      />

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-72 z-50 flex flex-col",
          "bg-[var(--sidebar)] text-[var(--sidebar-foreground)]",
          "shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
      >
        {/* Logo / header */}
        <div className="flex items-center gap-3 px-4 py-5 shrink-0">
          {/* Logo with purple ring */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/70 scale-110" />
            <div
              className="absolute inset-0 rounded-full blur-md opacity-50"
              style={{ backgroundColor: "var(--sidebar-primary)", animation: "oliwan-pulse 3.2s ease-in-out infinite" }}
            />
            <Image
              src="/logo.png"
              alt="OLIWAN"
              width={44}
              height={44}
              className="relative rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold tracking-tight leading-none">OLIWAN</p>
            <p className="text-xs font-medium text-purple-400 mt-0.5">Revenue Engine</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg border border-[var(--sidebar-border)] hover:bg-[var(--sidebar-accent)] transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-[var(--sidebar-foreground)]/60" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-3" : ""}>
              {section.header && (
                <p className={cn("text-[10px] font-bold uppercase tracking-widest px-3 pb-1.5 pt-2", section.headerColor ?? "text-muted-foreground/50")}>
                  {section.header}
                </p>
              )}
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer group",
                      isActive
                        ? "bg-purple-500/15 border border-purple-500/40"
                        : "hover:bg-[var(--sidebar-accent)] border border-transparent"
                    )}
                  >
                    {/* Icon square */}
                    <div className={cn("rounded-lg p-1.5 shrink-0", isActive ? "bg-purple-500/25" : item.iconBg)}>
                      <item.icon className={cn("h-4 w-4", isActive ? "text-purple-300" : item.iconColor)} />
                    </div>

                    {/* Label + subtitle */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold leading-tight", isActive ? "text-white" : "text-[var(--sidebar-foreground)]/80")}>
                        {item.label}
                      </p>
                      <p className="text-[11px] text-[var(--sidebar-foreground)]/40 leading-tight mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Right indicator */}
                    {section.showDots && (
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isActive ? "bg-purple-400" : "bg-[var(--sidebar-foreground)]/20")} />
                    )}
                    {section.showChevron && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--sidebar-foreground)]/30 group-hover:text-[var(--sidebar-foreground)]/60 transition-colors" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="mx-3 mb-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)]/50 px-4 py-3 shrink-0 relative overflow-hidden">
          {/* Wave background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: "radial-gradient(ellipse at 80% 50%, #6366f1 0%, transparent 70%)",
          }} />
          <div className="relative">
            <p className="text-xs font-semibold text-[var(--sidebar-foreground)]/80">OLIWAN v1.0</p>
            <p className="text-[11px] text-[var(--sidebar-foreground)]/40">Revenue Engine</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[11px] text-[var(--sidebar-foreground)]/60">Activo</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
