"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, RefreshCw, User, ChevronDown, ChevronLeft, ChevronRight, Globe, Monitor, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  meta: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | number | null;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  userColor: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Creó",
  update: "Actualizó",
  delete: "Eliminó",
  publish: "Publicó",
  unpublish: "Despublicó",
  move_stage: "Movió etapa",
  login: "Inició sesión",
  login_failed: "Login fallido",
  import: "Importó",
  duplicate: "Duplicó",
};

const RESOURCE_LABELS: Record<string, string> = {
  contact: "contacto",
  deal: "deal",
  proposal: "propuesta",
  activity: "actividad",
  demo: "demo",
  auth: "autenticación",
  setting: "configuración",
  pipeline_stage: "etapa",
  preset: "preset",
};

const ACTION_COLORS: Record<string, string> = {
  create: "var(--color-green-500, #22c55e)",
  update: "var(--color-blue-500, #3b82f6)",
  delete: "var(--color-red-500, #ef4444)",
  publish: "var(--color-purple-500, #a855f7)",
  unpublish: "var(--color-orange-500, #f97316)",
  move_stage: "var(--color-cyan-500, #06b6d4)",
  login: "var(--color-green-600, #16a34a)",
  login_failed: "var(--color-red-600, #dc2626)",
  import: "var(--color-indigo-500, #6366f1)",
  duplicate: "var(--color-teal-500, #14b8a6)",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatEntryDate(val: string | number | null): string {
  if (!val) return "";
  try {
    const d = typeof val === "number" ? new Date(val * 1000) : new Date(val);
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return String(val);
  }
}

function formatFullDate(val: string | number | null): string {
  if (!val) return "";
  try {
    const d = typeof val === "number" ? new Date(val * 1000) : new Date(val);
    return format(d, "dd MMM yyyy, HH:mm:ss", { locale: es });
  } catch {
    return "";
  }
}

function getResourceName(meta: Record<string, unknown>): string {
  return (meta.name as string) || (meta.title as string) || (meta.planName as string) || "";
}

function getActorName(entry: AuditEntry): string {
  return entry.userName || (entry.meta._actorName as string) || "Sistema";
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return ua.slice(0, 30);
}

function ChangesDiff({ changes }: { changes: Record<string, { from: unknown; to: unknown }> }) {
  if (!changes || typeof changes !== "object") return null;
  const entries = Object.entries(changes);
  if (entries.length === 0) return null;

  const FIELD_LABELS: Record<string, string> = {
    name: "Nombre",
    email: "Email",
    phone: "Teléfono",
    company: "Empresa",
    source: "Fuente",
    temperature: "Temperatura",
    score: "Score",
    clientStatus: "Estado",
    title: "Título",
    value: "Valor",
    stageId: "Etapa",
    probability: "Probabilidad",
    notes: "Notas",
    monthlyPayment: "Pago mensual",
    contactId: "Contacto",
  };

  return (
    <div className="mt-2 space-y-1">
      {entries.map(([field, { from, to }]) => (
        <div key={field} className="flex items-center gap-2 text-xs">
          <span className="font-medium min-w-[80px]" style={{ color: "var(--muted-foreground)" }}>
            {FIELD_LABELS[field] ?? field}:
          </span>
          <span className="line-through px-1 rounded" style={{ background: "var(--color-red-100, #fee2e2)", color: "var(--color-red-700, #b91c1c)" }}>
            {String(from ?? "—")}
          </span>
          <span>→</span>
          <span className="px-1 rounded" style={{ background: "var(--color-green-100, #dcfce7)", color: "var(--color-green-700, #15803d)" }}>
            {String(to ?? "—")}
          </span>
        </div>
      ))}
    </div>
  );
}

const PAGE_SIZE = 50;

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));
      if (filterAction !== "all") params.set("action", filterAction);
      if (filterResource !== "all") params.set("resourceType", filterResource);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.entries ?? [];
        setEntries(list);
        setTotal(data.total ?? list.length);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterResource, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterUser === "all"
    ? entries
    : entries.filter((e) => getActorName(e) === filterUser);

  const actors = Array.from(new Set(entries.map((e) => getActorName(e)).filter(Boolean)));
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }}
          >
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Auditoría</h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Registro detallado de actividad — {total.toLocaleString()} eventos
            </p>
          </div>
        </div>
        <button
          onClick={() => { setPage(0); load(); }}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["create", "update", "delete", "login"] as const).map((action) => {
          const count = entries.filter((e) => e.action === action).length;
          return (
            <button
              key={action}
              onClick={() => { setFilterAction(filterAction === action ? "all" : action); setPage(0); }}
              className="rounded-xl p-3 text-left transition-all"
              style={{
                background: filterAction === action ? ACTION_COLORS[action] : "var(--card)",
                border: `1px solid ${filterAction === action ? "transparent" : "var(--border)"}`,
                color: filterAction === action ? "#fff" : "inherit",
              }}
            >
              <p className="text-xs font-medium mb-0.5" style={{ opacity: 0.7 }}>
                {ACTION_LABELS[action] ?? action}
              </p>
              <p className="text-xl font-bold">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {/* Action filter */}
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
          className="rounded-lg border px-2 py-1.5 text-xs"
          style={{ background: "var(--background)", borderColor: "var(--border)" }}
        >
          <option value="all">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* Resource filter */}
        <select
          value={filterResource}
          onChange={(e) => { setFilterResource(e.target.value); setPage(0); }}
          className="rounded-lg border px-2 py-1.5 text-xs"
          style={{ background: "var(--background)", borderColor: "var(--border)" }}
        >
          <option value="all">Todos los recursos</option>
          {Object.entries(RESOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* User filter */}
        {actors.length > 1 && (
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}
          >
            <option value="all">Todos los usuarios</option>
            {actors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <Calendar className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            className="rounded-lg border px-2 py-1 text-xs"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}
          />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            className="rounded-lg border px-2 py-1 text-xs"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}
          />
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--muted-foreground)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl p-12 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <ScrollText className="h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-medium">Sin registros</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No hay eventos que coincidan con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((entry) => {
            const actor = getActorName(entry);
            const resourceName = getResourceName(entry.meta);
            const actionColor = ACTION_COLORS[entry.action] ?? "var(--muted-foreground)";
            const expanded = expandedId === entry.id;
            const changes = entry.meta.changes as Record<string, { from: unknown; to: unknown }> | undefined;

            return (
              <button
                type="button"
                key={entry.id}
                onClick={() => setExpandedId(expanded ? null : entry.id)}
                className="flex flex-col rounded-xl p-3 text-left transition-colors hover:ring-1"
                style={{ background: "var(--card)", border: "1px solid var(--border)", "--tw-ring-color": "var(--border)" } as React.CSSProperties}
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Avatar */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: entry.userColor ?? "var(--sidebar-primary)" }}
                  >
                    {getInitials(entry.userName)}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 text-sm">
                      <span className="font-semibold">{actor}</span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide"
                        style={{ background: actionColor }}
                      >
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                      <span style={{ color: "var(--muted-foreground)" }}>
                        {RESOURCE_LABELS[entry.resourceType] ?? entry.resourceType}
                      </span>
                      {resourceName && (
                        <span className="font-medium truncate max-w-[200px]">
                          &ldquo;{resourceName}&rdquo;
                        </span>
                      )}
                    </div>
                    {entry.userEmail && (
                      <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {entry.userEmail}
                      </p>
                    )}
                    {changes && !expanded && (
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {Object.keys(changes).length} campo(s) modificado(s)
                      </p>
                    )}
                  </div>

                  {/* Time + expand */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {formatEntryDate(entry.createdAt)}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                      style={{ color: "var(--muted-foreground)" }}
                    />
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="mt-3 ml-11 space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>Fecha exacta: </span>
                        <span>{formatFullDate(entry.createdAt)}</span>
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>ID recurso: </span>
                        <span className="font-mono text-[11px]">{entry.resourceId}</span>
                      </div>
                      {entry.ipAddress && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                          <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>IP: </span>
                          <span className="font-mono text-[11px]">{entry.ipAddress}</span>
                        </div>
                      )}
                      {entry.userAgent && (
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                          <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>Navegador: </span>
                          <span>{parseBrowser(entry.userAgent)}</span>
                        </div>
                      )}
                    </div>

                    {changes && <ChangesDiff changes={changes} />}

                    {/* Raw meta (excluding internal fields) */}
                    {Object.keys(entry.meta).filter(k => k !== "_actorName" && k !== "changes").length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>Detalles: </span>
                        {Object.entries(entry.meta)
                          .filter(([k]) => k !== "_actorName" && k !== "changes")
                          .map(([k, v]) => (
                            <span key={k} className="inline-block mr-2">
                              <span style={{ color: "var(--muted-foreground)" }}>{k}:</span>{" "}
                              <span className="font-medium">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</span>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Página {page + 1} de {totalPages} — {total.toLocaleString()} eventos
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            Siguiente <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Footer note about actors */}
      {actors.length > 0 && (
        <div
          className="flex items-center gap-2 rounded-xl p-3 text-xs"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <User className="h-3.5 w-3.5 shrink-0" />
          <span>
            Actores registrados: {actors.join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
