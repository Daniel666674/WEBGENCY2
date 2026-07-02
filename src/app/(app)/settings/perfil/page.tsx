"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { User, Pencil, Fingerprint, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { EditUserDialog } from "@/components/settings/EditUserDialog";

export default function PerfilPage() {
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

  if (loading || !activeUser) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <SettingsHeader icon={User} title="Perfil" description="Administra tu informacion personal y preferencias de cuenta." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <SettingsHeader icon={User} title="Perfil" description="Administra tu informacion personal y preferencias de cuenta." />

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ backgroundColor: activeUser.color }}
            >
              {activeUser.avatar ?? activeUser.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold">{activeUser.name}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {activeUser.isHers ? "Miembro" : "Admin"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg p-3 bg-muted/30">
            <Mail className="h-4 w-4 shrink-0" />
            Sin cuenta de Google vinculada todavia — el login queda simulado hasta activar
            <code className="mx-1 px-1 py-0.5 rounded bg-muted text-foreground">AUTH_ENABLED</code>
            con credenciales reales.
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              <Pencil className="h-4 w-4" /> Editar perfil
            </button>
            <button
              disabled
              title="Disponible cuando el login con Google este activado (requiere HTTPS + dominio propio)"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium opacity-50 cursor-not-allowed"
            >
              <Fingerprint className="h-4 w-4" /> Registrar Face ID
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            >
              <LogOut className="h-4 w-4" /> {loggingOut ? "Saliendo..." : "Cerrar sesion"}
            </button>
          </div>
        </CardContent>
      </Card>

      <EditUserDialog user={activeUser} open={editing} onClose={() => setEditing(false)} onSaved={refetchUsers} />
    </div>
  );
}
