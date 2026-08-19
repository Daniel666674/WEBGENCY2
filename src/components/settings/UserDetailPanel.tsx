"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Crown, ChevronDown, Pencil, ChevronRight, Globe, Monitor } from "lucide-react";
import { PERMISSION_SECTIONS, PERMISSION_LABELS } from "@/lib/permissions";
import { PermissionPicker } from "./PermissionPicker";
import { AllowedEmailRow, STATUS_LABELS, statusOf } from "./usuariosTypes";

interface AuditRow {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  meta: Record<string, unknown>;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

const ACTION_LABELS: Record<string, string> = {
  invite: "Invitó a un usuario",
  permissions_change: "Cambió permisos",
  revoke: "Revocó un acceso",
  import: "Importó",
  status: "Cambió un estado",
  create: "Creó",
  update: "Actualizó",
  delete: "Eliminó",
  login_success: "Inició sesión",
  login_failure: "Intento de login fallido",
  stage_move: "Movió de etapa",
};

const RESOURCE_LABELS: Record<string, string> = {
  contact: "Contacto",
  deal: "Negocio",
  activity: "Actividad",
  demo: "Demo",
  user: "Usuario",
  pipeline: "Pipeline",
  settings: "Configuración",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" }) +
    ", " + d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

export function UserDetailPanel({
  row,
  onClose,
  onUpdate,
  onRevoke,
}: {
  row: AllowedEmailRow;
  onClose: () => void;
  onUpdate: (patch: { role?: string; permissions?: string[] }) => Promise<void>;
  onRevoke: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(row.role);
  const [perms, setPerms] = useState(row.permissions);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [activity, setActivity] = useState<AuditRow[] | null>(null);

  const status = statusOf(row);
  const person = row.registeredUser;

  useEffect(() => {
    setRole(row.role);
    setPerms(row.permissions);
    setEditing(false);
  }, [row.id, row.role, row.permissions]);

  useEffect(() => {
    setActivity(null);
    if (!person?.id) return;
    fetch(`/api/audit-logs?userId=${person.id}&limit=15`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setActivity(Array.isArray(data) ? data : data.entries ?? []))
      .catch(() => setActivity([]));
  }, [person?.id]);

  async function save() {
    setSaving(true);
    try {
      await onUpdate({ role, permissions: perms });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const effectivePerms = role === "owner" ? PERMISSION_SECTIONS.flatMap((s) => s.pages.map((p) => p.key)) : perms;

  return (
    <div className="rounded-xl border bg-card flex flex-col max-h-[calc(100vh-8rem)]">
      <div className="p-4 border-b flex items-start gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-muted">
          {person?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold uppercase text-muted-foreground">{row.email[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{person?.name ?? row.email}</p>
          <p className="text-xs text-muted-foreground truncate">{row.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {row.role === "owner" ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Crown className="h-3 w-3" /> Owner
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Miembro</span>
            )}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              status === "activo" ? "bg-green-500/10 text-green-600" :
              status === "invitado" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
            }`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground cursor-pointer shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-2 text-xs border-b">
        <Row label="Fecha de invitación" value={new Date(row.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })} />
        <Row label="Último acceso" value={person?.lastLoginAt ? formatWhen(person.lastLoginAt) : "Nunca"} />
        <Row label="Invitado por" value={row.invitedByName ?? "—"} />
      </div>

      <div className="p-4 space-y-1 border-b overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-muted-foreground">Accesos asignados</p>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Editar
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" checked={role === "member"} onChange={() => setRole("member")} /> Miembro
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" checked={role === "owner"} onChange={() => setRole("owner")} /> Owner (acceso total)
              </label>
            </div>
            {role !== "owner" && <PermissionPicker value={perms} onChange={setPerms} />}
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="flex-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium py-1.5 cursor-pointer disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => { setEditing(false); setRole(row.role); setPerms(row.permissions); }} className="rounded-lg border text-xs font-medium px-3 py-1.5 cursor-pointer hover:bg-muted">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          PERMISSION_SECTIONS.map((section) => {
            const pageKeys = section.pages.map((p) => p.key);
            const on = pageKeys.filter((k) => effectivePerms.includes(k));
            const open = openSection === section.key;
            return (
              <div key={section.key} className="rounded-lg border">
                <button
                  onClick={() => setOpenSection(open ? null : section.key)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer"
                >
                  <span className="font-medium">{section.label}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {on.length}/{pageKeys.length}
                    <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {open && (
                  <div className="px-2.5 pb-2 flex flex-wrap gap-1">
                    {section.pages.map((p) => (
                      <span
                        key={p.key}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          effectivePerms.includes(p.key) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/50 line-through"
                        }`}
                      >
                        {PERMISSION_LABELS[p.key] ?? p.key}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
        <p className="text-xs font-semibold text-muted-foreground">Actividad reciente</p>
        {!person ? (
          <p className="text-xs text-muted-foreground">Sin actividad — todavía no inició sesión.</p>
        ) : activity === null ? (
          <p className="text-xs text-muted-foreground">Cargando...</p>
        ) : activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin actividad registrada.</p>
        ) : (
          <div className="space-y-1">
            {activity.map((a) => (
              <ActivityRow key={a.id} row={a} />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t">
        <button
          onClick={onRevoke}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium py-1.5 cursor-pointer hover:bg-destructive/5 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" /> Eliminar usuario
        </button>
      </div>
    </div>
  );
}

function shortBrowser(ua?: string): string {
  if (!ua) return "";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  return "Otro";
}

function ChangeDiff({ changes }: { changes: Record<string, { from: unknown; to: unknown }> }) {
  return (
    <div className="space-y-1 mt-1.5">
      {Object.entries(changes).map(([field, { from, to }]) => (
        <div key={field} className="flex items-center gap-1.5 flex-wrap">
          <span className="text-muted-foreground font-medium">{field}:</span>
          <span className="line-through text-red-400 dark:text-red-400/80">{String(from ?? "—")}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-green-600 dark:text-green-400">{String(to ?? "—")}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityRow({ row: a }: { row: AuditRow }) {
  const [open, setOpen] = useState(false);
  const changes = a.meta?.changes as Record<string, { from: unknown; to: unknown }> | undefined;
  const hasDetails = !!(changes && Object.keys(changes).length) || !!a.ipAddress || !!a.meta?.name || !!a.meta?.title;
  const resource = RESOURCE_LABELS[a.resourceType] ?? a.resourceType;
  const action = ACTION_LABELS[a.action] ?? a.action;
  const name = (a.meta?.name ?? a.meta?.title ?? "") as string;

  return (
    <div className="rounded-lg border border-border/50 text-xs">
      <button
        onClick={() => hasDetails && setOpen(!open)}
        className={`w-full flex items-start gap-2 px-2.5 py-2 text-left ${hasDetails ? "cursor-pointer hover:bg-muted/50" : ""}`}
      >
        {hasDetails && (
          <ChevronRight className={`h-3 w-3 mt-0.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        )}
        <div className="flex-1 min-w-0">
          <p className="leading-snug font-medium">
            {action}
            {resource && <span className="text-muted-foreground font-normal"> · {resource}</span>}
          </p>
          {name && <p className="text-[10px] text-muted-foreground truncate">{name}</p>}
          <p className="text-[10px] text-muted-foreground mt-0.5">{formatWhen(a.createdAt)}</p>
        </div>
      </button>
      {open && hasDetails && (
        <div className="px-2.5 pb-2 pt-0 border-t border-border/30 text-[10px] space-y-1.5">
          {changes && Object.keys(changes).length > 0 && (
            <ChangeDiff changes={changes} />
          )}
          {a.ipAddress && (
            <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
              <Globe className="h-3 w-3" /> {a.ipAddress}
              {a.userAgent && <><Monitor className="h-3 w-3 ml-2" /> {shortBrowser(a.userAgent)}</>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
