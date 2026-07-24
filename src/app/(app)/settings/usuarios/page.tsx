"use client";

import { useState } from "react";
import { useUser, type AppUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Pencil, Link2, Copy, Check, Trash2, RefreshCw } from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { EditUserDialog } from "@/components/settings/EditUserDialog";
import { toast } from "sonner";

export default function UsuariosPage() {
  const { users, activeUser, loading, refetchUsers } = useUser();
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const [generating, setGenerating] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [alreadySetup, setAlreadySetup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  async function generateInvite() {
    setGenerating(true);
    try {
      const res = await fetch("/api/daniela-invite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error"); return; }
      setInviteUrl(data.url);
      setAlreadySetup(data.alreadySetup ?? false);
    } catch {
      toast.error("Error generando link");
    } finally {
      setGenerating(false);
    }
  }

  async function revokeInvite() {
    setRevoking(true);
    try {
      await fetch("/api/daniela-invite", { method: "DELETE" });
      setInviteUrl(null);
      toast.success("Link revocado");
    } catch {
      toast.error("Error");
    } finally {
      setRevoking(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isOwner = activeUser && !activeUser.isHers;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <SettingsHeader icon={Users} title="Usuarios" description="Gestiona los usuarios del equipo." />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.image ? (
                      <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{u.avatar ?? u.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.isHers ? "Miembro" : "Admin"}</p>
                  </div>
                  <button
                    onClick={() => setEditingUser(u)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Solo 2 cuentas — cuando se active el login con Google, cada una se vincula a una cuenta real.
          </p>
        </CardContent>
      </Card>

      {/* Invite Daniela section — only visible to the owner */}
      {isOwner && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm font-semibold">Acceso de Daniela</p>
              <p className="text-xs text-muted-foreground mt-1">
                Genera un link único para que Daniela configure su propio usuario y contraseña sin que tengas que
                decírsela. El link expira en 24 horas y se usa solo una vez.
              </p>
            </div>

            {!inviteUrl ? (
              <button
                onClick={generateInvite}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Link2 className="h-4 w-4" />
                {generating ? "Generando..." : "Generar link de acceso"}
              </button>
            ) : (
              <div className="space-y-3">
                {alreadySetup && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    Daniela ya configuró su acceso. Si generas un nuevo link podrá cambiar su contraseña.
                  </p>
                )}
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 text-sm font-mono break-all">
                  <span className="flex-1 text-xs text-muted-foreground truncate">{inviteUrl}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar link"}
                  </button>
                  <button
                    onClick={generateInvite}
                    disabled={generating}
                    title="Generar nuevo link"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={revokeInvite}
                    disabled={revoking}
                    title="Revocar link"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium cursor-pointer hover:bg-destructive/5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mándale este link a Daniela por WhatsApp — expira en 24 horas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={refetchUsers}
      />
    </div>
  );
}
