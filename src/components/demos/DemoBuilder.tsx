"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Eye, EyeOff, ChevronDown, Monitor, Smartphone, Tablet,
  Save, ExternalLink, Loader2, Globe, Check, Palette, Type, Layers, Plus,
  Undo2, Redo2, Code2, Menu,
} from "lucide-react";
import type { DemoConfig, Section, SectionType, ButtonShape, ButtonFill, ElementKey } from "@/lib/demo/types";
import { SECTION_LABELS, SECTION_CATEGORIES, newId, defaultNav, defaultFooter, defaultNavLinks } from "@/lib/demo/types";
import { TEMPLATES, getTemplate } from "@/lib/demo/templates";
import { FONT_PAIRS } from "@/lib/demo/fonts";
import { renderDemo } from "@/lib/demo/render";
import { SectionEditor } from "./SectionEditor";
import { MediaPicker } from "./MediaPicker";
import { NavEditor, FooterEditor } from "./NavFooterEditor";
import { ElementInspector } from "./ElementInspector";

const inputCls =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary transition-colors";

type Tab = "design" | "content" | "navfooter" | "brand" | "advanced";

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
      id={`demo-section-row-${section.id}`}
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

const BUTTON_SHAPES: { id: ButtonShape; label: string }[] = [
  { id: "pill", label: "Redondeado" },
  { id: "rounded", label: "Suave" },
  { id: "sharp", label: "Cuadrado" },
];
const BUTTON_FILLS: { id: ButtonFill; label: string }[] = [
  { id: "solid", label: "Relleno" },
  { id: "outline", label: "Contorno" },
];

const MAX_HISTORY = 60;

export function DemoBuilder({
  demoId, initialConfig, initialTitle, initialPublished, initialVersion, slug,
}: {
  demoId: string; initialConfig: DemoConfig; initialTitle: string;
  initialPublished: boolean; initialVersion: number; slug: string;
}) {
  const [cfg, setCfgRaw] = useState<DemoConfig>(() => ({
    ...initialConfig,
    nav: initialConfig.nav ?? { ...defaultNav(), links: defaultNavLinks(initialConfig.sections) },
    footer: initialConfig.footer ?? { ...defaultFooter(), columns: [{ id: newId(), title: "Enlaces", links: defaultNavLinks(initialConfig.sections) }] },
  }));
  const [title, setTitle] = useState(initialTitle);
  const [published, setPublished] = useState(initialPublished);
  const [tab, setTab] = useState<Tab>("design");
  const [openSection, setOpenSection] = useState<string | null>(null);
  // Which element the canvas currently has selected, if any. When set,
  // the panel shows that element's inspector instead of the tab content.
  const [selected, setSelected] = useState<{ id: string; key: ElementKey } | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  // Drafts autosave continuously, but the public page only moves when the
  // user publishes. Without this hint, editing a live demo and then checking
  // its URL looks broken.
  const [unpublishedChanges, setUnpublishedChanges] = useState(false);
  const dirty = useRef(false);
  // Server row version, round-tripped on every write so a second tab (or an
  // out-of-order autosave) is rejected instead of silently overwriting.
  const version = useRef(initialVersion);

  // Undo/redo history — plain snapshot stack, good enough for a config this size.
  const history = useRef<DemoConfig[]>([initialConfig]);
  const historyIndex = useRef(0);
  const [historyTick, setHistoryTick] = useState(0);
  const suppressHistory = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const html = useMemo(() => renderDemo(cfg, { mode: "edit" }), [cfg]);

  const setCfg = useCallback((next: DemoConfig) => {
    setCfgRaw(next);
    if (suppressHistory.current) return;
    const h = history.current.slice(0, historyIndex.current + 1);
    h.push(next);
    if (h.length > MAX_HISTORY) h.shift();
    history.current = h;
    historyIndex.current = h.length - 1;
    setHistoryTick((v) => v + 1);
  }, []);

  const update = useCallback((patch: Partial<DemoConfig>) => {
    dirty.current = true;
    setSaved(false);
    setUnpublishedChanges(true);
    setCfg({ ...cfg, ...patch });
  }, [cfg, setCfg]);

  const undo = useCallback(() => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    suppressHistory.current = true;
    dirty.current = true;
    setCfgRaw(history.current[historyIndex.current]);
    suppressHistory.current = false;
    setHistoryTick((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    suppressHistory.current = true;
    dirty.current = true;
    setCfgRaw(history.current[historyIndex.current]);
    suppressHistory.current = false;
    setHistoryTick((v) => v + 1);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "y") { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Click-to-select: the rendered preview posts the id of whatever the
  // user clicked (a section, __nav__, or __footer__) so the sidebar can
  // jump straight to its editor instead of making them hunt for it.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { source?: string; type?: string; id?: string; key?: string } | undefined;
      if (!data || data.source !== "oliwan-demo") return;

      if (data.type === "select-element" && data.id && data.key) {
        setSelected({ id: data.id, key: data.key as ElementKey });
        return;
      }
      if (data.type === "deselect") {
        setSelected(null);
        return;
      }
      if (data.type !== "select" || !data.id) return;

      setSelected(null);
      if (data.id === "__nav__" || data.id === "__footer__") {
        setTab("navfooter");
      } else {
        setTab("content");
        setOpenSection(data.id);
        requestAnimationFrame(() => {
          document.getElementById(`demo-section-row-${data.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const updateBrand = (patch: Partial<DemoConfig["brand"]>) =>
    update({ brand: { ...cfg.brand, ...patch } });

  const updateNav = (n: NonNullable<DemoConfig["nav"]>) => update({ nav: n });
  const updateFooter = (f: NonNullable<DemoConfig["footer"]>) => update({ footer: f });

  const updateSection = (s: Section) =>
    update({ sections: cfg.sections.map((x) => (x.id === s.id ? s : x)) });

  const removeSection = (id: string) =>
    update({ sections: cfg.sections.filter((x) => x.id !== id) });

  // Single writer for every PUT. `publish` is only sent when the user
  // explicitly acts on it — an ordinary autosave must never touch the
  // snapshot the client is looking at.
  const write = useCallback(async (extra: Record<string, unknown> = {}) => {
    if (conflict) return false; // stop writing once we know we're stale
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/demo-pages/${demoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          config: cfg,
          template: cfg.template,
          version: version.current,
          ...extra,
        }),
      });

      if (res.status === 409) {
        setConflict(true);
        return false;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "No se pudo guardar. Revisa tu conexión.");
        return false;
      }

      const saved_ = await res.json();
      version.current = saved_.version ?? version.current + 1;
      dirty.current = false;
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      return true;
    } catch {
      setSaveError("No se pudo guardar. Revisa tu conexión.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [demoId, title, cfg, conflict]);

  const save = useCallback(() => write(), [write]);

  const setPublishState = useCallback(async (next: boolean) => {
    const ok = await write({ publish: next });
    if (ok) {
      setPublished(next);
      if (next) setUnpublishedChanges(false);
    }
  }, [write]);

  // Autosave 1.5s after the last edit
  useEffect(() => {
    if (!dirty.current || conflict) return;
    const t = setTimeout(() => { save(); }, 1500);
    return () => clearTimeout(t);
  }, [cfg, title, save, conflict]);

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
      brand: {
        ...cfg.brand,
        accent: fresh.brand.accent, ink: fresh.brand.ink, paper: fresh.brand.paper,
        buttonShape: fresh.brand.buttonShape, buttonFill: fresh.brand.buttonFill,
      },
      sections: cfg.sections.map((s) => {
        const match = fresh.sections.find((f) => f.type === s.type);
        return match ? { ...s, variant: match.variant } : s;
      }),
    });
  }

  function addSection(type: SectionType) {
    const t = getTemplate(cfg.template);
    const proto = t.defaults().sections.find((s) => s.type === type);
    const built: Section = proto
      ? { ...proto, id: newId(), enabled: true }
      : { id: newId(), type, variant: "list", enabled: true, heading: "" };
    update({ sections: [...cfg.sections, built] });
    setAddPickerOpen(false);
    setOpenSection(built.id);
  }

  function duplicateSection(s: Section) {
    const clone: Section = { ...s, id: newId() };
    const idx = cfg.sections.findIndex((x) => x.id === s.id);
    const next = [...cfg.sections];
    next.splice(idx + 1, 0, clone);
    update({ sections: next });
  }

  const selectedSection = selected ? cfg.sections.find((s) => s.id === selected.id) ?? null : null;
  // Gate the panel on the *resolved* section, not just the selection: if the
  // section was deleted while selected, fall back to the tabs rather than
  // rendering an empty panel.
  const inspecting = !!(selected && selectedSection);

  // Clearing from the sidebar has to tell the canvas too, or its outline
  // would linger on an element the inspector is no longer showing.
  const clearSelection = useCallback(() => {
    setSelected(null);
    frameRef.current?.contentWindow?.postMessage({ source: "oliwan-editor", type: "deselect" }, "*");
  }, []);

  const frameW = device === "desktop" ? "100%" : device === "tablet" ? "820px" : "390px";
  const canUndo = historyIndex.current > 0;
  const canRedo = historyIndex.current < history.current.length - 1;
  void historyTick; // re-render trigger for undo/redo button state

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
              onClick={() => setPublishState(!published)}
              disabled={saving}
              title={published ? "Dejar de publicar" : "Publicar los cambios actuales"}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
                published ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              {published ? (unpublishedChanges ? "Republicar" : "Publicado") : "Publicar"}
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
          <div className="flex items-center gap-1.5">
            <button
              type="button" onClick={undo} disabled={!canUndo}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground disabled:opacity-40"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" /> Deshacer
            </button>
            <button
              type="button" onClick={redo} disabled={!canRedo}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground disabled:opacity-40"
              title="Rehacer (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" /> Rehacer
            </button>
          </div>
        </div>

        {/* Save status — a stale tab must stop autosaving and say so, rather
            than quietly losing whatever the other tab wrote. */}
        {conflict && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Este demo se modificó en otra pestaña
            </p>
            <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80">
              Se detuvo el guardado automático para no borrar esos cambios.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white"
            >
              Recargar
            </button>
          </div>
        )}
        {!conflict && saveError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
            <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
          </div>
        )}
        {!conflict && !saveError && published && unpublishedChanges && (
          <div className="rounded-lg border border-border bg-muted/60 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">
              Tus cambios están guardados pero el sitio público todavía muestra la última versión publicada.
              Presiona <span className="font-semibold text-foreground">Republicar</span> para actualizarlo.
            </p>
          </div>
        )}

        {/* Tabs — replaced by the element inspector while something is selected */}
        <div className={`grid grid-cols-5 gap-1 rounded-lg bg-muted p-1${inspecting ? " hidden" : ""}`}>
          {([
            ["design", "Diseño", Palette],
            ["content", "Contenido", Layers],
            ["navfooter", "Menú", Menu],
            ["brand", "Marca", Type],
            ["advanced", "Avanzado", Code2],
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
          {selectedSection && selected && (
            <ElementInspector
              section={selectedSection}
              elementKey={selected.key}
              onChange={updateSection}
              onClearSelection={clearSelection}
            />
          )}

          {!inspecting && tab === "design" && (
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

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Estilo de botones</p>
                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                  {BUTTON_SHAPES.map((s) => (
                    <button
                      key={s.id} type="button" onClick={() => updateBrand({ buttonShape: s.id })}
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                        (cfg.brand.buttonShape ?? "pill") === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {BUTTON_FILLS.map((s) => (
                    <button
                      key={s.id} type="button" onClick={() => updateBrand({ buttonFill: s.id })}
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                        (cfg.brand.buttonFill ?? "solid") === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!inspecting && tab === "content" && (
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
                        <div className="flex flex-col gap-3">
                          <SectionEditor section={s} onChange={updateSection} />
                          <div className="flex gap-1.5 border-t border-border pt-3">
                            <button
                              type="button" onClick={() => duplicateSection(s)}
                              className="flex-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary"
                            >
                              Duplicar sección
                            </button>
                            <button
                              type="button" onClick={() => removeSection(s.id)}
                              className="flex-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-red-500 hover:text-red-500"
                            >
                              Eliminar sección
                            </button>
                          </div>
                        </div>
                      </SortableSection>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="rounded-xl border border-dashed border-border">
                <button
                  type="button"
                  onClick={() => setAddPickerOpen((v) => !v)}
                  className="flex w-full items-center justify-center gap-1.5 p-3 text-xs font-medium text-primary"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar sección
                </button>
                {addPickerOpen && (
                  <div className="flex flex-col gap-3 border-t border-border p-3">
                    {SECTION_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.types.map((t) => (
                            <button
                              key={t} type="button" onClick={() => addSection(t)}
                              className="rounded-md border border-border px-2 py-1 text-[11px] font-medium hover:border-primary hover:text-primary"
                            >
                              {SECTION_LABELS[t]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!inspecting && tab === "navfooter" && cfg.nav && cfg.footer && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-3 text-sm font-semibold">Menú de navegación</p>
                <NavEditor nav={cfg.nav} onChange={updateNav} />
              </div>
              <div className="border-t border-border pt-5">
                <p className="mb-3 text-sm font-semibold">Pie de página</p>
                <FooterEditor footer={cfg.footer} onChange={updateFooter} />
              </div>
            </div>
          )}

          {!inspecting && tab === "brand" && (
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

          {!inspecting && tab === "advanced" && (
            <div className="flex flex-col gap-3.5">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Solo para usuarios con conocimiento de CSS. Este código se agrega al final de los estilos del sitio.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">CSS personalizado</label>
                <textarea
                  rows={16}
                  spellCheck={false}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs outline-none focus:border-primary"
                  placeholder={"section { }\n.btn:hover { }"}
                  value={cfg.customCss ?? ""}
                  onChange={(e) => update({ customCss: e.target.value })}
                />
              </div>
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
            ref={frameRef}
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
