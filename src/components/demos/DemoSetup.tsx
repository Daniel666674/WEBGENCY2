"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { TEMPLATES } from "@/lib/demo/templates";
import { BRIEF_GOALS, BRIEF_TONES } from "@/lib/demo/coach";
import type { DemoBrief, BriefGoal, BriefTone } from "@/lib/demo/types";

interface ContactRow { id: string; name: string; company: string | null }

/**
 * First-run step shown over a freshly created demo. The row already exists by
 * the time this renders, so there is no half-saved state to reconcile — this
 * only fills in the details that need a human.
 */
export function DemoSetup({
  initialTemplate, onDone,
}: {
  initialTemplate: string;
  onDone: (v: { name: string; template: string; contactId: string; brief: DemoBrief }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState(initialTemplate);
  const [contactId, setContactId] = useState("");
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [busy, setBusy] = useState(false);
  // The brief steers every coaching tip later on. Nothing here is required —
  // a blank answer just means the advice stays generic for that dimension.
  const [brief, setBrief] = useState<DemoBrief>({});

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onDone({ name: name.trim(), template, contactId, brief });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-bold">Empecemos tu demo</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Puedes cambiar todo esto después. Las respuestas ajustan los consejos que te damos mientras construyes.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nombre del negocio</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Ej. Panadería La Espiga"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cliente del CRM (opcional)</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Sin asignar</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">¿A qué se dedica?</label>
              <input
                value={brief.industry ?? ""}
                onChange={(e) => setBrief((b) => ({ ...b, industry: e.target.value }))}
                placeholder="Ej. Panadería artesanal, estudio contable, gimnasio"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                ¿Qué querés que haga el visitante? <span className="opacity-60">· define qué secciones priorizamos</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BRIEF_GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setBrief((b) => ({ ...b, goal: b.goal === g.id ? undefined : (g.id as BriefGoal) }))}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${
                      brief.goal === g.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="block text-[13px] font-semibold">{g.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">{g.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">¿A quién le habla?</label>
              <input
                value={brief.audience ?? ""}
                onChange={(e) => setBrief((b) => ({ ...b, audience: e.target.value }))}
                placeholder="Ej. Dueños de restaurantes en Bogotá"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                ¿Por qué lo eligen a él y no a la competencia?
              </label>
              <input
                value={brief.differentiator ?? ""}
                onChange={(e) => setBrief((b) => ({ ...b, differentiator: e.target.value }))}
                placeholder="Ej. Entrega en 48 horas, garantía de 5 años"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Tono</label>
              <div className="flex flex-wrap gap-1.5">
                {BRIEF_TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setBrief((b) => ({ ...b, tone: b.tone === t.id ? undefined : (t.id as BriefTone) }))}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      brief.tone === t.id ? "border-primary bg-primary/5 font-semibold text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                Plantilla <span className="opacity-60">· elige la que más se parezca al negocio</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`flex flex-col gap-1.5 rounded-lg border p-2.5 text-left transition-colors ${
                      template === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex shrink-0 gap-0.5">
                        {t.swatch.map((c) => (
                          <span key={c} className="h-4 w-4 rounded-sm border border-black/10" style={{ background: c }} />
                        ))}
                      </div>
                      <span className="truncate text-[13px] font-semibold">{t.name}</span>
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{t.bestFor}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim() || busy}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Empezar a diseñar
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
