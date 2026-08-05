"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, RefreshCw, User, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  meta: Record<string, unknown>;
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
};

const RESOURCE_LABELS: Record<string, string> = {
  contact: "contacto",
  deal: "deal",
  proposal: "propuesta",
  activity: "actividad",
};

const ACTION_COLORS: Record<string, string> = {
  create: "var(--color-green-500, #22c55e)",
  update: "var(--color-blue-500, #3b82f6)",
  delete: "var(--color-red-500, #ef4444)",
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

function getResourceName(meta: Record<string, unknown>): string {
  return (
    (meta.name as string) ||
    (meta.title as string) ||
    (meta.planName as string) ||
    ""
  );
}

function getActorName(entry: AuditEntry): string {
  return entry.userName || (entry.meta._actorName as string) || "Sistema";
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs?limit=200");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all"
    ? entries
    : entries.filter((e) => e.action === filter || e.resourceType === filter);

  const resourceTypes = Array.from(new Set(entries.map((e) => e.resourceType)));
  const actors = Array.from(new Set(entries.map((e) => getActorName(e)).filter(Boolean)));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
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
              Registro de actividad del sistema
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {(["create", "update", "delete"] as const).map((action) => {
          const count = entries.filter((e) => e.action === action).length;
          return (
            <div
              key={action}
              className="rounded-xl p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
                {ACTION_LABELS[action] ?? action}
              </p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
          style={
            filter === "all"
              ? { background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }
              : { background: "var(--accent)", color: "var(--accent-foreground)" }
          }
        >
          Todos ({entries.length})
        </button>
        {(["create", "update", "delete"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={
              filter === a
                ? { background: ACTION_COLORS[a], color: "#fff" }
                : { background: "var(--accent)", color: "var(--accent-foreground)" }
            }
          >
            {ACTION_LABELS[a]}
          </button>
        ))}
        {resourceTypes.map((rt) => (
          <button
            key={rt}
            onClick={() => setFilter(rt)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={
              filter === rt
                ? { background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }
                : { background: "var(--accent)", color: "var(--accent-foreground)" }
            }
          >
            {RESOURCE_LABELS[rt] ?? rt}
          </button>
        ))}
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
          <p className="font-medium">Sin registros aún</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Las acciones del sistema aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry) => {
            const actor = getActorName(entry);
            const resourceName = getResourceName(entry.meta);
            const actionColor = ACTION_COLORS[entry.action] ?? "var(--muted-foreground)";

            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
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
                      className="rounded px-1.5 py-0.5 text-xs font-bold text-white"
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
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {entry.userEmail}
                    </p>
                  )}
                </div>

                {/* Time */}
                <span
                  className="shrink-0 text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {formatEntryDate(entry.createdAt)}
                </span>
              </div>
            );
          })}
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
