"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2, Play, Plus, Save, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SettingToggle } from "./SettingToggle";
import type { AutomationsConfig, AutomationRuleId, RuleMeta } from "@/lib/automations";

interface PreviewItem {
  ruleId: string;
  label: string;
  entity: { type: string; id: string; name: string };
}

interface UserLite {
  id: string;
  name: string;
}

/**
 * The rules editor.
 *
 * The "Probar" button is the important part of this screen: it runs the real
 * engine in dry-run mode and shows the exact list of things that would be
 * created right now. A scheduled job that writes to the database unsupervised
 * only earns trust if you can look at its output before arming it.
 */
export function AutomationRules() {
  const [config, setConfig] = useState<AutomationsConfig | null>(null);
  const [meta, setMeta] = useState<RuleMeta[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<"dry" | "real" | null>(null);
  const [preview, setPreview] = useState<{ applied: PreviewItem[]; skipped: PreviewItem[]; dryRun: boolean } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/automations").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/users").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([a, u]) => {
        if (a) {
          setConfig(a.config);
          setMeta(a.rules);
        }
        setUsers(Array.isArray(u) ? u.map((x: UserLite) => ({ id: x.id, name: x.name })) : []);
      })
      .catch(() => toast.error("No se pudo cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  function patchRule(id: AutomationRuleId, fields: Partial<AutomationsConfig["rules"][AutomationRuleId]>) {
    setConfig((c) => (c ? { ...c, rules: { ...c.rules, [id]: { ...c.rules[id], ...fields } } } : c));
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/automations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { config: fresh } = await res.json();
      setConfig(fresh);
      toast.success("Automatizaciones guardadas");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function run(dryRun: boolean) {
    setRunning(dryRun ? "dry" : "real");
    setPreview(null);
    try {
      const res = await fetch("/api/automations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setPreview({ applied: body.applied, skipped: body.skipped, dryRun: body.dryRun });
      toast.success(
        dryRun
          ? `${body.applied.length} acciones se ejecutarían ahora`
          : `${body.applied.length} acciones ejecutadas`
      );
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al ejecutar");
    } finally {
      setRunning(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando reglas...
        </CardContent>
      </Card>
    );
  }
  if (!config) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          No se pudo cargar la configuración de automatizaciones.
        </CardContent>
      </Card>
    );
  }

  const activeCount = Object.values(config.rules).filter((r) => r.enabled).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" /> Motor de automatizaciones
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Corre una vez al día en el servidor. {activeCount} de {meta.length} reglas activas.
          </p>
        </div>
        <SettingToggle
          checked={config.masterEnabled}
          onChange={(v) => setConfig({ ...config, masterEnabled: v })}
        />
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Responsable por defecto de lo que se cree</span>
          <select
            value={config.defaultAssigneeId ?? ""}
            onChange={(e) => setConfig({ ...config, defaultAssigneeId: e.target.value || null })}
            className="text-sm border rounded-lg px-3 py-2 bg-background max-w-xs"
          >
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className={cn("space-y-2 transition-opacity", !config.masterEnabled && "opacity-50")}>
          {meta.map((m) => {
            const rule = config.rules[m.id];
            if (!rule) return null;
            return (
              <div key={m.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {m.title}
                      {m.notifyOnly && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          solo aviso
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
                  </div>
                  <SettingToggle checked={rule.enabled} onChange={(v) => patchRule(m.id, { enabled: v })} />
                </div>

                {rule.enabled && (
                  <div className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3">
                    {!m.noThreshold && (
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted-foreground">{m.daysLabel}</span>
                        <input
                          type="number"
                          min={0}
                          max={365}
                          value={rule.days}
                          onChange={(e) => patchRule(m.id, { days: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-20 text-sm border rounded-lg px-2 py-1.5 bg-background"
                        />
                      </label>
                    )}
                    {!m.notifyOnly && (
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-muted-foreground">Asignar a</span>
                        <select
                          value={rule.assignTo ?? ""}
                          onChange={(e) => patchRule(m.id, { assignTo: e.target.value || null })}
                          className="text-sm border rounded-lg px-2 py-1.5 bg-background"
                        >
                          <option value="">Responsable por defecto</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      No se repite antes de {m.cooldownDays} días
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <OnboardingChecklist
          items={config.onboardingChecklist}
          onChange={(onboardingChecklist) => setConfig({ ...config, onboardingChecklist })}
        />

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            onClick={() => run(true)}
            disabled={running !== null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" /> {running === "dry" ? "Simulando..." : "Probar (simulacro)"}
          </button>
          <button
            onClick={() => run(false)}
            disabled={running !== null || !config.masterEnabled}
            title={config.masterEnabled ? undefined : "Activá el motor primero"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5" /> {running === "real" ? "Ejecutando..." : "Ejecutar ahora"}
          </button>
        </div>

        {preview && <PreviewResult {...preview} />}
      </CardContent>
    </Card>
  );
}

function PreviewResult({ applied, skipped, dryRun }: { applied: PreviewItem[]; skipped: PreviewItem[]; dryRun: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {dryRun ? "Se ejecutaría ahora" : "Ejecutado"} — {applied.length}
      </p>
      {applied.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nada que hacer. Todo está al día o ya se hizo dentro de su periodo de espera.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {applied.map((a, i) => (
            <li key={`${a.ruleId}-${i}`} className="flex gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{a.label}</span>
            </li>
          ))}
        </ul>
      )}
      {skipped.length > 0 && (
        <p className="text-xs text-muted-foreground border-t pt-2">
          {skipped.length} omitidas porque ya se hicieron recientemente.
        </p>
      )}
    </div>
  );
}

function OnboardingChecklist({ items, onChange }: { items: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div>
        <p className="text-sm font-medium">Checklist de onboarding</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Las tareas que se crean solas cuando un deal se gana. Se reparten con dos días de diferencia entre cada una.
        </p>
      </div>

      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
            <input
              value={item}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              className="flex-1 text-sm border rounded-lg px-2 py-1.5 bg-background"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-1.5 rounded text-muted-foreground hover:text-destructive cursor-pointer"
              title="Quitar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !draft.trim()) return;
            e.preventDefault();
            onChange([...items, draft.trim()]);
            setDraft("");
          }}
          placeholder="Agregar un paso al onboarding..."
          className="flex-1 text-sm border rounded-lg px-2 py-1.5 bg-background"
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onClick={() => {
            onChange([...items, draft.trim()]);
            setDraft("");
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted disabled:opacity-40 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>
    </div>
  );
}
