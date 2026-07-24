"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { EditUserDialog } from "./EditUserDialog";
import { SettingsCategoryCard } from "./SettingsCategoryCard";
import { toast } from "sonner";
import {
  User,
  Palette,
  Briefcase,
  Users,
  Kanban,
  Bell,
  Plug,
  Zap,
  Terminal,
  Fingerprint,
  LogOut,
  Pencil,
} from "lucide-react";

const CATEGORIES = [
  { href: "/settings/perfil", icon: User, title: "Perfil", description: "Administra tu informacion personal y preferencias de cuenta." },
  { href: "/settings/apariencia", icon: Palette, title: "Apariencia", description: "Personaliza el tema, colores dia/noche de la interfaz." },
  { href: "/settings/negocio", icon: Briefcase, title: "Negocio", description: "Informacion y preferencias de tu negocio." },
  { href: "/settings/usuarios", icon: Users, title: "Usuarios", description: "Gestiona los usuarios del equipo." },
  { href: "/settings/pipeline", icon: Kanban, title: "Pipeline", description: "Consulta las etapas de tu pipeline de ventas." },
  { href: "/settings/integraciones", icon: Plug, title: "Integraciones", description: "Conecta Google, WhatsApp y mas herramientas.", badge: "Próximamente" },
  { href: "/settings/automatizaciones", icon: Zap, title: "Automatizaciones", description: "Webhooks y flujos automaticos del CRM." },
  { href: "/settings/notificaciones", icon: Bell, title: "Notificaciones", description: "Configura como y cuando recibes avisos." },
  { href: "/settings/comandos", icon: Terminal, title: "Comandos", description: "Comandos de Claude Code disponibles en el proyecto." },
];

export function SettingsHub({ authEnabled }: { authEnabled: boolean }) {
  const router = useRouter();
  const { activeUser, loading, refetchUsers } = useUser();
  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
    } catch {
      toast.error("Error al cerrar sesion");
      setLoggingOut(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia y administra las preferencias de tu CRM.</p>
      </div>

      {/* Profile hero */}
      {!loading && activeUser && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border bg-card p-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden"
            style={{ backgroundColor: activeUser.color }}
          >
            {activeUser.image ? (
              <img src={activeUser.image} alt={activeUser.name} className="w-full h-full object-cover" />
            ) : (
              activeUser.avatar ?? activeUser.name[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold">{activeUser.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {authEnabled ? "Sesion con Google activa" : "Modo demo — sin login real activado todavia"}
            </p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {activeUser.isHers ? "Miembro" : "Admin"}
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar perfil
            </button>
            <button
              disabled
              title="Disponible cuando el login con Google este activado"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium opacity-50 cursor-not-allowed"
            >
              <Fingerprint className="h-3.5 w-3.5" /> Registrar Face ID
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" /> {loggingOut ? "Saliendo..." : "Cerrar sesion"}
            </button>
          </div>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((c) => (
          <SettingsCategoryCard key={c.href} {...c} />
        ))}
      </div>

      <EditUserDialog
        user={activeUser}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={refetchUsers}
      />
    </div>
  );
}
