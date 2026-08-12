"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Kanban, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/SettingsHeader";

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  dealCount: number;
}

const PALETTE = ["#64748b", "#2563eb", "#8b5cf6", "#ea580c", "#16a34a", "#dc2626", "#0d9a8a", "#d97706"];

/**
 * A pipeline you can actually edit.
 *
 * This page was a read-only list that ended with "use /customize in Claude
 * Code" — and that command's bulk-replace refused to run at all once any deal
 * existed, so in practice the stages were frozen forever after setup. Editing
 * is per-stage now, and deleting one asks where its deals should go.
 */
export default function PipelinePage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/pipeline/stages");
      if (!res.ok) throw new Error();
      setStages(await res.json());
      setDirty(false);
    } catch {
      toast.error("No se pudieron cargar las etapas");
    } finally {
      setLoading(false);
    }
  }

  function patch(id: string, fields: Partial<Stage>) {
    setStages((prev) =>
      prev.map((s) => {
        if (s.id !== id) return fields.isWon ? { ...s, isWon: false } : s;
        return { ...s, ...fields, ...(fields.isWon ? { isLost: false } : {}) };
      })
    );
    setDirty(true);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    setStages(next.map((s, i) => ({ ...s, order: i + 1 })));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/pipeline/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stages: stages.map((s, i) => ({ ...s, order: i + 1 })) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Pipeline guardado");
      await load();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function add() {
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/pipeline/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: PALETTE[stages.length % PALETTE.length] }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setNewName("");
      await load();
      toast.success(`Etapa "${name}" agregada`);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al agregar");
    }
  }

  async function remove(stage: Stage) {
    let moveTo: string | undefined;
    if (stage.dealCount > 0) {
      const options = stages.filter((s) => s.id !== stage.id);
      const answer = window.prompt(
        `"${stage.name}" tiene ${stage.dealCount} deal(s). ¿A qué etapa los movemos?\n\n` +
          options.map((s, i) => `${i + 1}. ${s.name}`).join("\n"),
        "1"
      );
      if (answer === null) return;
      const picked = options[Number(answer) - 1];
      if (!picked) return toast.error("Opción inválida");
      moveTo = picked.id;
    } else if (!window.confirm(`¿Eliminar la etapa "${stage.name}"?`)) {
      return;
    }

    try {
      const url = `/api/pipeline/stages?id=${stage.id}${moveTo ? `&moveTo=${moveTo}` : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      await load();
      toast.success("Etapa eliminada");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al eliminar");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Kanban} title="Pipeline" description="Las etapas por las que pasa cada negocio." />

      <Card>
        <CardContent className="pt-6 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando etapas...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {stages.map((stage, i) => (
                  <div key={stage.id} className="rounded-lg border p-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 cursor-pointer"
                          title="Subir"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={i === stages.length - 1}
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 cursor-pointer"
                          title="Bajar"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        value={stage.name}
                        onChange={(e) => patch(stage.id, { name: e.target.value })}
                        className="flex-1 text-sm border rounded-lg px-2 py-1.5 bg-background"
                      />
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {stage.dealCount} {stage.dealCount === 1 ? "deal" : "deals"}
                      </span>
                      <button
                        onClick={() => remove(stage)}
                        disabled={stages.length <= 1}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive disabled:opacity-30 cursor-pointer"
                        title="Eliminar etapa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pl-7">
                      <div className="flex items-center gap-1">
                        {PALETTE.map((c) => (
                          <button
                            key={c}
                            onClick={() => patch(stage.id, { color: c })}
                            style={{ backgroundColor: c }}
                            className={`h-4 w-4 rounded-full cursor-pointer transition-transform ${
                              stage.color.toLowerCase() === c ? "ring-2 ring-offset-1 ring-foreground scale-110" : ""
                            }`}
                            title={c}
                          />
                        ))}
                      </div>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stage.isWon}
                          onChange={(e) => patch(stage.id, { isWon: e.target.checked })}
                          className="cursor-pointer"
                        />
                        Ganado
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stage.isLost}
                          disabled={stage.isWon}
                          onChange={(e) => patch(stage.id, { isLost: e.target.checked })}
                          className="cursor-pointer disabled:opacity-40"
                        />
                        Perdido
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t pt-4">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="Nombre de la nueva etapa..."
                  className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background"
                />
                <button
                  onClick={add}
                  disabled={!newName.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={save}
                  disabled={saving || !dirty}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Marcar una etapa como &quot;Ganado&quot; activa el onboarding automático al mover un deal ahí.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
