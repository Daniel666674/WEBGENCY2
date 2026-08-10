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
  ScrollText,
  MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { hasPermission, permissionForPath, type NavSectionKey } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  key: NavSectionKey;
  header?: string;
  items: NavItem[];
  showDots?: boolean;
  showChevron?: boolean;
}

const navSections: NavSection[] = [
  {
    key: "principal",
    header: "PRINCIPAL",
    showDots: true,
    items: [
      { href: "/onboarding",   label: "Inicio",           subtitle: "Onboarding",       icon: GraduationCap },
      { href: "/",             label: "Vista General",    subtitle: "Dashboard",         icon: LayoutDashboard },
      { href: "/pipeline",     label: "Pipeline",         subtitle: "Ventas",            icon: Kanban },
      { href: "/contacts",     label: "Contactos",        subtitle: "Clientes & Leads",  icon: Users },
      { href: "/deals",        label: "Deals",            subtitle: "Oportunidades",     icon: Briefcase },
      { href: "/activities",   label: "Actividades",      subtitle: "Seguimiento",       icon: Zap },
    ],
  },
  {
    key: "revenue",
    header: "REVENUE",
    showChevron: true,
    items: [
      { href: "/revenue",  label: "Revenue",  subtitle: "Ingresos",     icon: DollarSign },
      { href: "/forecast", label: "Forecast", subtitle: "Proyecciones", icon: TrendingUp },
    ],
  },
  {
    key: "cuentas",
    header: "CUENTAS",
    showChevron: true,
    items: [
      { href: "/clients",      label: "Clientes Activos", subtitle: "Organizaciones", icon: UserCheck },
      { href: "/projects",     label: "Proyectos",        subtitle: "En curso",       icon: FolderKanban },
      { href: "/tareas",       label: "Tareas",           subtitle: "Pendientes",     icon: ClipboardList },
      { href: "/solicitudes",  label: "Solicitudes",      subtitle: "Gestión",        icon: MessageSquare },
      { href: "/deliverables", label: "Entregables",      subtitle: "Entregables",    icon: Package },
    ],
  },
  {
    key: "negocios",
    header: "NEGOCIOS",
    showChevron: true,
    items: [
      { href: "/proposals",  label: "Propuestas",  subtitle: "Cotizaciones", icon: FileText },
      { href: "/demos",      label: "Demos",       subtitle: "Sitios de muestra", icon: MonitorSmartphone },
      { href: "/calculator", label: "Calculadora", subtitle: "Herramientas", icon: Calculator },
    ],
  },
  {
    key: "arsenal",
    header: "ARSENAL",
    showChevron: true,
    items: [
      { href: "/arsenal", label: "Arsenal", subtitle: "Herramientas", icon: Layers },
    ],
  },
  {
    key: "config",
    header: "CONFIG",
    showChevron: true,
    items: [
      { href: "/settings", label: "Configuración", subtitle: "Ajustes", icon: Settings },
      { href: "/audit",    label: "Auditoría",     subtitle: "Actividad", icon: ScrollText },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeUser } = useUser();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Permissions are per page, so filter the items first and drop any section
  // left with nothing in it — otherwise a user granted a single page would
  // still see the empty header of every other section.
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const key = permissionForPath(item.href);
        return key ? hasPermission(activeUser, key) : true;
      }),
    }))
    .filter((section) => section.items.length > 0);

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
      {/* Desktop hover strip */}
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
          "fixed left-0 top-0 h-full w-72 z-50 flex flex-col shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-5 shrink-0">
          <div className="relative shrink-0">
            {/* Ring uses sidebar-primary */}
            <div
              className="absolute inset-[-3px] rounded-full border-2"
              style={{ borderColor: "var(--sidebar-primary)" }}
            />
            <div
              className="absolute inset-0 rounded-full blur-md opacity-40"
              style={{ backgroundColor: "var(--sidebar-primary)", animation: "oliwan-pulse 3.2s ease-in-out infinite" }}
            />
            <Image src="/logo.png" alt="OLIWAN" width={44} height={44} className="relative rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold tracking-tight leading-none" style={{ color: "var(--sidebar-foreground)" }}>
              OLIWAN
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "var(--sidebar-primary)" }}>
              Revenue Engine
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ border: "1px solid var(--sidebar-border)" }}
          >
            <ChevronLeft className="h-4 w-4" style={{ color: "var(--sidebar-foreground)", opacity: 0.6 }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {visibleSections.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-3" : ""}>
              {section.header && (
                <p
                  className="text-[10px] font-bold uppercase tracking-widest px-3 pb-1.5 pt-2"
                  style={{ color: "var(--sidebar-primary)", opacity: 0.8 }}
                >
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
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer group"
                    style={isActive ? {
                      background: "var(--sidebar-accent)",
                      border: "1px solid var(--sidebar-primary)",
                    } : {
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-accent)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "";
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="rounded-lg p-1.5 shrink-0"
                      style={{
                        background: isActive ? "var(--sidebar-primary)" : "var(--sidebar-accent)",
                        color: isActive ? "var(--sidebar-primary-foreground)" : "var(--sidebar-foreground)",
                        opacity: isActive ? 1 : 0.7,
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>

                    {/* Label + subtitle */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold leading-tight"
                        style={{ color: "var(--sidebar-foreground)", opacity: isActive ? 1 : 0.8 }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="text-[11px] leading-tight mt-0.5"
                        style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}
                      >
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Right indicator */}
                    {section.showDots && (
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background: isActive ? "var(--sidebar-primary)" : "var(--sidebar-accent)",
                        }}
                      />
                    )}
                    {section.showChevron && (
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 transition-opacity"
                        style={{ color: "var(--sidebar-foreground)", opacity: 0.3 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="mx-3 mb-3 rounded-xl px-4 py-3 shrink-0 relative overflow-hidden"
          style={{ border: "1px solid var(--sidebar-border)", background: "var(--sidebar-accent)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{ background: "radial-gradient(ellipse at 80% 50%, var(--sidebar-primary) 0%, transparent 70%)" }}
          />
          <div className="relative">
            <p className="text-xs font-semibold" style={{ color: "var(--sidebar-foreground)", opacity: 0.8 }}>OLIWAN v1.0</p>
            <p className="text-[11px]" style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}>Revenue Engine</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[11px]" style={{ color: "var(--sidebar-foreground)", opacity: 0.6 }}>Activo</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
