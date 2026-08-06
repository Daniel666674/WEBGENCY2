"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, UserPlus, Crown } from "lucide-react";
import { NAV_SECTION_KEYS, NAV_SECTION_LABELS, type NavSectionKey } from "@/lib/permissions";

interface AllowedEmailRow {
  id: string;
  email: string;
  role: string;
  permissions: NavSectionKey[];
  registeredUser: { id: string; email: string | null; name: string; image: string | null } | null;
}

export function UsuariosAllowlist() {
  const [rows, setRows] = useState<AllowedEmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "member">("member");
  const [invitePerms, setInvitePerms] = useState<NavSectionKey[]>(["principal"]);
  const [inviting, setInviting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/allowed-emails");
      if (res.ok) setRows(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function invite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Email invalido");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole, permissions: invitePerms }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error"); return; }
      toast.success("Usuario invitado — ya puede iniciar sesion con Google");
      setInviteEmail("");
      setInviteRole("member");
      setInvitePerms(["principal"]);
      load();
    } catch {
      toast.error("Error al invitar");
    } finally {
      setInviting(false);
    }
  }

  async function updateRow(row: AllowedEmailRow, patch: { role?: string; permissions?: NavSectionKey[] }) {
    setSavingId(row.id);
    try {
      const res = await fetch(`/api/allowed-emails/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: patch.role ?? row.role,
          permissions: patch.permissions ?? row.permissions,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      load();
    } finally {
      setSavingId(null);
    }
  }

  async function revoke(row: AllowedEmailRow) {
    if (!confirm(`Revocar el acceso de ${row.email}?`)) return;
    const res = await fetch(`/api/allowed-emails/${row.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error ?? "Error"); return; }
    toast.success("Acceso revocado");
    load();
  }

  function togglePermInvite(key: NavSectionKey) {
    setInvitePerms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nadie tiene acceso todavia.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-muted"
                    >
                      {row.registeredUser?.image ? (
                        <img src={row.registeredUser.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold uppercase">{row.email[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{row.registeredUser?.name ?? row.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                    </div>
                    {row.role === "owner" && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <Crown className="h-3.5 w-3.5" /> Owner
                      </span>
                    )}
                    <button
                      onClick={() => revoke(row)}
                      title="Revocar acceso"
                      className="p-1.5 rounded-lg border border-destructive/30 text-destructive cursor-pointer hover:bg-destructive/5 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pl-12">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        checked={row.role === "member"}
                        onChange={() => updateRow(row, { role: "member" })}
                        disabled={savingId === row.id}
                      />
                      Miembro
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        checked={row.role === "owner"}
                        onChange={() => updateRow(row, { role: "owner" })}
                        disabled={savingId === row.id}
                      />
                      Owner (acceso total)
                    </label>
                  </div>

                  {row.role !== "owner" && (
                    <div className="pl-12 grid grid-cols-2 gap-1.5">
                      {NAV_SECTION_KEYS.map((key) => (
                        <label key={key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={row.permissions.includes(key)}
                            disabled={savingId === row.id}
                            onChange={() => {
                              const next = row.permissions.includes(key)
                                ? row.permissions.filter((p) => p !== key)
                                : [...row.permissions, key];
                              updateRow(row, { permissions: next });
                            }}
                          />
                          {NAV_SECTION_LABELS[key]}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" /> Invitar usuario
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Se agrega a la lista de acceso — puede iniciar sesion con su cuenta de Google apenas lo invites.
            </p>
          </div>

          <Input
            type="email"
            placeholder="email@ejemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" checked={inviteRole === "member"} onChange={() => setInviteRole("member")} />
              Miembro
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" checked={inviteRole === "owner"} onChange={() => setInviteRole("owner")} />
              Owner (acceso total)
            </label>
          </div>

          {inviteRole === "member" && (
            <div className="grid grid-cols-2 gap-1.5">
              {NAV_SECTION_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={invitePerms.includes(key)} onChange={() => togglePermInvite(key)} />
                  {NAV_SECTION_LABELS[key]}
                </label>
              ))}
            </div>
          )}

          <Button onClick={invite} disabled={inviting || !inviteEmail.trim()} className="cursor-pointer">
            {inviting ? "Invitando..." : "Invitar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
