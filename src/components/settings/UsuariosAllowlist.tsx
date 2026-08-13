"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Search, Crown, ChevronLeft, ChevronRight, Users, ShieldCheck, Clock3, UserCheck } from "lucide-react";
import { StatTile } from "@/components/shared/StatTile";
import { PERMISSION_KEYS } from "@/lib/permissions";
import { InviteUserDialog } from "./InviteUserDialog";
import { UserDetailPanel } from "./UserDetailPanel";
import { AllowedEmailRow, STATUS_LABELS, statusOf } from "./usuariosTypes";

const PAGE_SIZE = 8;

export function UsuariosAllowlist() {
  const [rows, setRows] = useState<AllowedEmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

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

  async function updateRow(row: AllowedEmailRow, patch: { role?: string; permissions?: string[] }) {
    const res = await fetch(`/api/allowed-emails/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: patch.role ?? row.role, permissions: patch.permissions ?? row.permissions }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Error al guardar");
      return;
    }
    toast.success("Accesos actualizados");
    load();
  }

  async function revoke(row: AllowedEmailRow) {
    if (!confirm(`Revocar el acceso de ${row.email}?`)) return;
    const res = await fetch(`/api/allowed-emails/${row.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error ?? "Error"); return; }
    toast.success("Acceso revocado");
    if (selectedId === row.id) setSelectedId(null);
    load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.email.toLowerCase().includes(q) || (r.registeredUser?.name ?? "").toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const owners = rows.filter((r) => r.role === "owner").length;
    const pending = rows.filter((r) => statusOf(r) === "pendiente").length;
    const active = rows.filter((r) => statusOf(r) === "activo").length;
    return { total: rows.length, owners, pending, active };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestiona los usuarios, permisos y accesos del equipo.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar usuarios..."
              className="pl-8 w-56"
            />
          </div>
          <Button onClick={() => setInviteOpen(true)} className="cursor-pointer">
            <UserPlus className="h-4 w-4" /> Invitar usuario
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={Users} label="Usuarios totales" value={stats.total} color="purple" highlight />
        <StatTile icon={Crown} label="Owners" value={stats.owners} color="amber" subtext={stats.total ? `${Math.round((stats.owners / stats.total) * 100)}% del total` : undefined} />
        <StatTile icon={Clock3} label="Invitaciones pendientes" value={stats.pending} color="blue" />
        <StatTile icon={UserCheck} label="Usuarios activos" value={stats.active} color="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <Card className="min-w-0">
          <CardContent className="p-0">
            {loading ? (
              <p className="text-sm text-muted-foreground p-6">Cargando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">
                {search ? "Nadie coincide con esa busqueda." : "Nadie tiene acceso todavia."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Accesos</TableHead>
                      <TableHead>Último acceso</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((row) => {
                      const status = statusOf(row);
                      const count = row.role === "owner" ? PERMISSION_KEYS.length : row.permissions.length;
                      const total = PERMISSION_KEYS.length;
                      const person = row.registeredUser;
                      return (
                        <TableRow
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={`cursor-pointer ${selectedId === row.id ? "bg-muted/50" : ""}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-muted">
                                {person?.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={person.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[11px] font-bold uppercase text-muted-foreground">{row.email[0]}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{person?.name ?? row.email}</p>
                                <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {row.role === "owner" ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                <Crown className="h-3.5 w-3.5" /> Owner
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Miembro</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="w-28">
                              <p className="text-xs font-medium mb-1">{count} / {total}</p>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${Math.round((count / total) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {person?.lastLoginAt
                              ? new Date(person.lastLoginAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              status === "activo" ? "bg-green-500/10 text-green-600" :
                              status === "invitado" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                            }`}>
                              {STATUS_LABELS[status]}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
                <span>Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} usuarios</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border disabled:opacity-40 cursor-pointer hover:bg-muted">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-7 w-7 rounded text-xs font-medium cursor-pointer ${n === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border disabled:opacity-40 cursor-pointer hover:bg-muted">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selected && (
          <UserDetailPanel
            row={selected}
            onClose={() => setSelectedId(null)}
            onUpdate={(patch) => updateRow(selected, patch)}
            onRevoke={() => revoke(selected)}
          />
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>Solo el owner puede invitar, cambiar permisos o revocar acceso. Los cambios de accesos se aplican en la siguiente petición del usuario afectado, sin que tenga que volver a iniciar sesión.</p>
      </div>

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={load} />
    </div>
  );
}
