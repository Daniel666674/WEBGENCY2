"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Pencil, Fingerprint, LogOut, Mail, KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { EditUserDialog } from "@/components/settings/EditUserDialog";

export default function PerfilPage() {
  const router = useRouter();
  const { activeUser, loading, refetchUsers } = useUser();
  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Credential change state
  const [showCredForm, setShowCredForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newUser, setNewUser] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [credDone, setCredDone] = useState(false);

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

  async function handleCredSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPw) { toast.error("Escribe tu contraseña actual"); return; }
    if (!newUser.trim()) { toast.error("Elige un nombre de usuario"); return; }
    if (newPw.length < 8) { toast.error("La contraseña nueva debe tener al menos 8 caracteres"); return; }
    if (newPw !== confirmPw) { toast.error("Las contraseñas no coinciden"); return; }

    setSavingCreds(true);
    try {
      const res = await fetch("/api/setup/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPw,
          newUsername: newUser.trim().toLowerCase(),
          newPassword: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al guardar");
      } else {
        setCredDone(true);
        setCurrentPw(""); setNewUser(""); setNewPw(""); setConfirmPw("");
        toast.success("Credenciales actualizadas — usa el nuevo usuario/contraseña la próxima vez");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSavingCreds(false);
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
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden"
              style={{ backgroundColor: activeUser.color }}
            >
              {activeUser.image ? (
                <img src={activeUser.image} alt={activeUser.name} className="w-full h-full object-cover" />
              ) : (
                activeUser.avatar ?? activeUser.name[0]
              )}
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
              onClick={() => { setShowCredForm((v) => !v); setCredDone(false); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              <KeyRound className="h-4 w-4" /> Cambiar acceso
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

      {showCredForm && (
        <Card>
          <CardContent className="pt-6">
            {credDone ? (
              <div className="flex items-center gap-3 py-2">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Credenciales actualizadas</p>
                  <p className="text-xs text-muted-foreground">
                    Usa tu nuevo usuario y contraseña la próxima vez que inicies sesión.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCredSave} className="space-y-4">
                <p className="text-sm font-semibold">Cambiar usuario y contraseña de login</p>
                <p className="text-xs text-muted-foreground -mt-2">
                  Tus nuevas credenciales se guardan en la base de datos — no en Vercel. Puedes cambiarlas cuantas veces quieras desde aqui.
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="current-pw">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="current-pw"
                      type={showPw ? "text" : "password"}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Tu contraseña actual (del .env o la que cambiaste antes)"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-username">Nuevo nombre de usuario</Label>
                  <Input
                    id="new-username"
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    placeholder="daniel"
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">Nueva contraseña</Label>
                  <Input
                    id="new-pw"
                    type={showPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirmar contraseña nueva</Label>
                  <Input
                    id="confirm-pw"
                    type={showPw ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingCreds}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {savingCreds ? "Guardando..." : "Guardar credenciales"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCredForm(false)}
                    className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <EditUserDialog user={activeUser} open={editing} onClose={() => setEditing(false)} onSaved={refetchUsers} />
    </div>
  );
}
