"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Eye, EyeOff, ChevronDown, Monitor, Smartphone, Tablet,
  Save, ExternalLink, Loader2, Globe, Check, Palette, Type, Layers, Plus,
} from "lucide-react";
import type { DemoConfig, Section, SectionType } from "@/lib/demo/types";
import { SECTION_LABELS, newId } from "@/lib/demo/types";
import { TEMPLATES, getTemplate } from "@/lib/demo/templates";
import { FONT_PAIRS } from "@/lib/demo/fonts";
import { renderDemo } from "@/lib/demo/render";
import { SectionEditor } from "./SectionEditor";
import { MediaPicker } from "./MediaPicker";

const inputCls =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary transition-colors";

type Tab = "design" | "content" | "brand";

function SortableSection({
  section, open, onToggleOpen, onToggleEnabled, children,
}: {
  section: Section; open: boolean; onToggleOpen: () => void;
  onToggleEnabled: () => void; children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center gap-1 p-2.5">
        <button
          type="button" {...attributes} {...listeners}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastrar sección"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggleOpen} className="flex flex-1 items-center gap-2 text-left">
          <span className={`text-sm font-medium ${section.enabled ? "" : "text-muted-foreground line-through"}`}>
            {SECTION_LABELS[section.type]}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button" onClick={onToggleEnabled}
          className={`rounded p-1.5 transition-colors ${section.enabled ? "text-primary" : "text-muted-foreground"}`}
          aria-label={section.enabled ? "Ocultar sección" : "Mostrar sección"}
          title={section.enabled ? "Ocultar del sitio" : "Mostrar en el sitio"}
        >
          {section.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      {open && <div className="border-t border-border p-3.5">{children}</div>}
    </div>
  );
}

export function DemoBuilder({
  demoId, initialConfig, initialTitle, initialPublished, slug,
}: {
  demoId: string; initialConfig: DemoConfig; initialTitle: string;
  initialPublished: boolean; slug: string;
}) {
  const [cfg, setCfg] = useState<DemoConfig>(initialConfig);
  const [title, setTitle] = useState(initialTitle);
  const [published, setPublished] = useState(initialPublished);
  const [tab, setTab] = useState<Tab>("design");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const html = useMemo(() => renderDemo(cfg), [cfg]);

  const update = useCallback((patch: Partial<DemoConfig>) => {
    dirty.current = true;
    setSaved(false);
    setCfg((c) => ({ ...c, ...patch }));
  }, []);

  const updateBrand = (patch: Partial<DemoConfig["brand"]>) =>
    update({ brand: { ...cfg.brand, ...patch } });

  const updateSection = (s: Section) =>
    update({ sections: cfg.sections.map((x) => (x.id === s.id ? s : x)) });

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/demo-pages/${demoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, config: cfg, template: cfg.template, published }),
      });
      dirty.current = false;
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }, [demoId, title, cfg, published]);

  // Autosave 1.5s after the last edit
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => { save(); }, 1500);
    return () => clearTimeout(t);
  }, [cfg, title, published, save]);

  function onSectionDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = cfg.sections.findIndex((s) => s.id === active.id);
    const to = cfg.sections.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    update({ sections: arrayMove(cfg.sections, from, to) });
  }

  function applyTemplate(id: string) {
    const t = getTemplate(id);
    const fresh = t.defaults();
    // Keep the user's real content — swap only the design layer.
    update({
      template: id,
      fontPair: t.defaultFontPair,
      brand: { ...cfg.brand, accent: fresh.brand.accent, ink: fresh.brand.ink, paper: fresh.brand.paper },
      sections: cfg.sections.map((s) => {
        const match = fresh.sections.find((f) => f.type === s.type);
        return match ? { ...s, variant: match.variant } : s;
      }),
    });
  }

  function addSection(type: SectionType) {
    const t = getTemplate(cfg.template);
    const proto = t.defaults().sections.find((s) => s.type === type);
    if (!proto) return;
    update({ sections: [...cfg.sections, { ...proto, id: newId(), enabled: true }] });
  }

  const missingTypes = (Object.keys(SECTION_LABELS) as SectionType[])
    .filter((t) => !cfg.sections.some((s) => s.type === t));

  const frameW = device === "desktop" ? "100%" : device === "tablet" ? "820px" : "390px";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row gap-4 p-4">
      {/* ── Left: controls ─────────────────────── */}
      <div className="flex w-full lg:w-[400px] shrink-0 flex-col gap-3 overflow-hidden">
        {/* Title + publish */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3">
          <input
            value={title}
            onChange={(e) => { dirty.current = true; setTitle(e.target.value); }}
            className="w-full bg-transparent text-base font-semibold outline-none"
            placeholder="Nombre del demo"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { dirty.current = true; setPublished((p) => !p); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                published ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              {published ? "Publicado" : "Borrador"}
            </button>
            <a
              href={`/demo/${slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir
            </a>
            <button
              type="button" onClick={save} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saved ? "Guardado" : "Guardar"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {([
            ["design", "Diseño", Palette],
            ["content", "Contenido", Layers],
            ["brand", "Marca", Type],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id} type="button" onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                tab === id ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="flex-1 overflow-y-auto pr-1">
          {tab === "design" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Plantilla</p>
                <div className="flex flex-col gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id} type="button" onClick={() => applyTemplate(t.id)}
                      className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors ${
                        cfg.template === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {t.swatch.map((c) => (
                            <span key={c} className="h-4 w-4 rounded-sm border border-black/10" style={{ background: c }} />
                          ))}
                        </div>
                        <span className="text-sm font-semibold">{t.name}</span>
                        {cfg.template === t.id && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-[11px] leading-snug text-muted-foreground">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground opacity-70">{t.bestFor}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Tipografía</p>
                <div className="flex flex-col gap-1.5">
                  {FONT_PAIRS.map((f) => (
                    <button
                      key={f.id} type="button" onClick={() => update({ fontPair: f.id })}
                      className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                        cfg.fontPair === f.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{f.label}</span>
                        {cfg.fontPair === f.id && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{f.mood}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "content" && (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-muted-foreground">
                Arrastra para reordenar. El ojo oculta o muestra la sección.
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
                <SortableContext items={cfg.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
                    {cfg.sections.map((s) => (
                      <SortableSection
                        key={s.id}
                        section={s}
                        open={openSection === s.id}
                        onToggleOpen={() => setOpenSection(openSection === s.id ? null : s.id)}
                        onToggleEnabled={() => updateSection({ ...s, enabled: !s.enabled })}
                      >
                        <SectionEditor section={s} onChange={updateSection} />
                      </SortableSection>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {missingTypes.length > 0 && (
                <div className="rounded-xl border border-dashed border-border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Agregar sección</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingTypes.map((t) => (
                      <button
                        key={t} type="button" onClick={() => addSection(t)}
                        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:border-primary"
                      >
                        <Plus className="h-3 w-3" /> {SECTION_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "brand" && (
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nombre del negocio</label>
                <input className={inputCls} value={cfg.brand.name} onChange={(e) => updateBrand({ name: e.target.value })} />
              </div>

              <MediaPicker label="Logo" accept="image" value={cfg.brand.logo} onChange={(m) => updateBrand({ logo: m })} />

              <div className="grid grid-cols-3 gap-2">
                {([
                  ["accent", "Color principal"],
                  ["ink", "Color de texto"],
                  ["paper", "Fondo"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={cfg.brand[key] || "#000000"}
                        onChange={(e) => updateBrand({ [key]: e.target.value })}
                        className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
                      />
                      <input
                        className="w-full min-w-0 rounded-md border border-border bg-background px-1.5 py-1 text-[11px] outline-none focus:border-primary"
                        value={cfg.brand[key] || ""}
                        onChange={(e) => updateBrand({ [key]: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {([
                ["phone", "Teléfono"],
                ["whatsapp", "WhatsApp (solo números)"],
                ["email", "Correo"],
                ["instagram", "Instagram"],
                ["address", "Dirección"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <input className={inputCls} value={cfg.brand[key] ?? ""} onChange={(e) => updateBrand({ [key]: e.target.value })} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: live preview ────────────────── */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden rounded-xl border border-border bg-muted/40">
        <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">Vista previa en vivo</span>
          <div className="flex gap-1">
            {([
              ["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone],
            ] as const).map(([id, Icon]) => (
              <button
                key={id} type="button" onClick={() => setDevice(id)}
                className={`rounded-md p-1.5 transition-colors ${device === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-label={id}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 justify-center overflow-auto p-3">
          <iframe
            srcDoc={html}
            title="Vista previa"
            className="h-full rounded-lg border border-border bg-white shadow-sm transition-all"
            style={{ width: frameW, maxWidth: "100%" }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
