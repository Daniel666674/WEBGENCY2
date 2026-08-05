"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Eye, EyeOff, Monitor, Smartphone, Tablet, ArrowLeft,
  ExternalLink, Loader2, Globe, Check, Palette, Type, Layers, Plus,
  Undo2, Redo2, Code2, Menu, ChevronRight, Copy, Trash2, PanelsTopLeft,
  AlertTriangle,
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

type GlobalTab = "design" | "brand" | "navfooter" | "advanced";
type Device = "desktop" | "tablet" | "mobile";

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

/** A row in the left structure rail. */
function StructureRow({
  section, active, onSelect, onToggleEnabled,
}: {
  section: Section; active: boolean;
  onSelect: () => void; onToggleEnabled: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`group flex items-center gap-1 rounded-lg px-1.5 py-1.5 transition-colors ${
        active ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted"
      }`}
    >
      <button
        type="button" {...attributes} {...listeners}
        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Arrastrar sección"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-2 overflow-hidden text-left">
        <span className={`truncate text-[13px] ${section.enabled ? "" : "text-muted-foreground line-through"} ${active ? "font-semibold text-primary" : ""}`}>
          {SECTION_LABELS[section.type]}
        </span>
      </button>
      <button
        type="button" onClick={onToggleEnabled}
        className={`rounded p-1 transition-colors ${section.enabled ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/50"}`}
        title={section.enabled ? "Ocultar del sitio" : "Mostrar en el sitio"}
      >
        {section.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

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
  const [device, setDevice] = useState<Device>("desktop");

  // The right panel shows one of three things, most specific first:
  // an element inspector, a section editor, or the global settings tabs.
  const [selected, setSelected] = useState<{ id: string; key: ElementKey } | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [globalTab, setGlobalTab] = useState<GlobalTab>("design");
  const [addPickerOpen, setAddPickerOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [unpublishedChanges, setUnpublishedChanges] = useState(false);

  const dirty = useRef(false);
  const version = useRef(initialVersion);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

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

  // Canvas -> sidebar selection.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { source?: string; type?: string; id?: string; key?: string } | undefined;
      if (!data || data.source !== "oliwan-demo") return;

      if (data.type === "select-element" && data.id && data.key) {
        setSelected({ id: data.id, key: data.key as ElementKey });
        setActiveSectionId(data.id);
        return;
      }
      if (data.type === "deselect") {
        setSelected(null);
        return;
      }
      if (data.type !== "select" || !data.id) return;

      setSelected(null);
      if (data.id === "__nav__" || data.id === "__footer__") {
        setActiveSectionId(null);
        setGlobalTab("navfooter");
      } else {
        setActiveSectionId(data.id);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const toCanvas = useCallback((msg: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage({ source: "oliwan-editor", ...msg }, "*");
  }, []);

  const updateBrand = (patch: Partial<DemoConfig["brand"]>) => update({ brand: { ...cfg.brand, ...patch } });
  const updateSection = (s: Section) => update({ sections: cfg.sections.map((x) => (x.id === s.id ? s : x)) });
  const updateNav = (n: NonNullable<DemoConfig["nav"]>) => update({ nav: n });
  const updateFooter = (f: NonNullable<DemoConfig["footer"]>) => update({ footer: f });

  const write = useCallback(async (extra: Record<string, unknown> = {}) => {
    if (conflict) return false;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/demo-pages/${demoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, config: cfg, template: cfg.template, version: version.current, ...extra }),
      });
      if (res.status === 409) { setConflict(true); return false; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "No se pudo guardar.");
        return false;
      }
      const row = await res.json();
      version.current = row.version ?? version.current + 1;
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
    if (ok) { setPublished(next); if (next) setUnpublishedChanges(false); }
  }, [write]);

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
    const proto = getTemplate(cfg.template).defaults().sections.find((s) => s.type === type);
    const built: Section = proto
      ? { ...proto, id: newId(), enabled: true }
      : { id: newId(), type, variant: "list", enabled: true, heading: "" };
    update({ sections: [...cfg.sections, built] });
    setAddPickerOpen(false);
    setSelected(null);
    setActiveSectionId(built.id);
  }

  function duplicateSection(s: Section) {
    const clone: Section = { ...s, id: newId() };
    const idx = cfg.sections.findIndex((x) => x.id === s.id);
    const next = [...cfg.sections];
    next.splice(idx + 1, 0, clone);
    update({ sections: next });
    setActiveSectionId(clone.id);
  }

  function removeSection(id: string) {
    update({ sections: cfg.sections.filter((x) => x.id !== id) });
    if (activeSectionId === id) setActiveSectionId(null);
    if (selected?.id === id) setSelected(null);
  }

  function selectSection(id: string) {
    setSelected(null);
    setActiveSectionId(id);
    toCanvas({ type: "select", id });
  }

  const clearSelection = useCallback(() => {
    setSelected(null);
    toCanvas({ type: "deselect" });
  }, [toCanvas]);

  const activeSection = activeSectionId ? cfg.sections.find((s) => s.id === activeSectionId) ?? null : null;
  // Gate on the resolved section so a deleted-while-selected section falls
  // back to the tabs instead of rendering an empty panel.
  const inspecting = !!(selected && activeSection && selected.id === activeSection.id);
  const frameW = device === "desktop" ? "100%" : device === "tablet" ? "820px" : "390px";
  const canUndo = historyIndex.current > 0;
  const canRedo = historyIndex.current < history.current.length - 1;
  void historyTick;

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      {/* ── Top bar ───────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
        <Link
          href="/demos"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Demos</span>
        </Link>

        <input
          value={title}
          onChange={(e) => { dirty.current = true; setUnpublishedChanges(true); setTitle(e.target.value); }}
          className="min-w-0 max-w-[220px] flex-shrink rounded-md bg-transparent px-2 py-1 text-sm font-semibold outline-none hover:bg-muted focus:bg-muted"
          placeholder="Nombre del demo"
        />

        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          {saving ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…</>
          ) : conflict ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Modificado en otra pestaña
            </span>
          ) : saveError ? (
            <span className="text-red-600 dark:text-red-400">{saveError}</span>
          ) : saved ? (
            <><Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> Guardado</>
          ) : null}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden items-center gap-0.5 rounded-lg bg-muted p-0.5 sm:flex">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([id, Icon]) => (
              <button
                key={id} type="button" onClick={() => setDevice(id)}
                className={`rounded-md p-1.5 transition-colors ${device === id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                aria-label={id}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
            <button
              type="button" onClick={undo} disabled={!canUndo}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button" onClick={redo} disabled={!canRedo}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              title="Rehacer (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {conflict ? (
            <button
              type="button" onClick={() => window.location.reload()}
              className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white"
            >
              Recargar
            </button>
          ) : (
            <>
              <a
                href={`/demo/${slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium hover:border-primary"
                title={published ? "Abrir el sitio público" : "El sitio aún no está publicado"}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Vista previa</span>
              </a>
              <button
                type="button" onClick={() => setPublishState(!published)} disabled={saving}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                  published && !unpublishedChanges
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                {published ? (unpublishedChanges ? "Republicar" : "Publicado") : "Publicar"}
              </button>
            </>
          )}
        </div>
      </header>

      {published && unpublishedChanges && !conflict && (
        <div className="shrink-0 border-b border-border bg-muted/60 px-4 py-1.5">
          <p className="text-[11px] text-muted-foreground">
            El sitio público todavía muestra la última versión publicada. Presiona{" "}
            <span className="font-semibold text-foreground">Republicar</span> para actualizarlo.
          </p>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* ── Left: structure ─────────────────────────────── */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <PanelsTopLeft className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Estructura del sitio</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => { setSelected(null); setActiveSectionId(null); setGlobalTab("navfooter"); toCanvas({ type: "select", id: "__nav__" }); }}
              className="mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
            >
              <Menu className="h-3.5 w-3.5 text-muted-foreground" /> Menú
            </button>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
              <SortableContext items={cfg.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-0.5">
                  {cfg.sections.map((s) => (
                    <StructureRow
                      key={s.id}
                      section={s}
                      active={activeSectionId === s.id}
                      onSelect={() => selectSection(s.id)}
                      onToggleEnabled={() => updateSection({ ...s, enabled: !s.enabled })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              type="button"
              onClick={() => { setSelected(null); setActiveSectionId(null); setGlobalTab("navfooter"); toCanvas({ type: "select", id: "__footer__" }); }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground" /> Pie de página
            </button>

            <div className="mt-2 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => setAddPickerOpen((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-primary hover:bg-primary/5"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar sección
              </button>
              {addPickerOpen && (
                <div className="mt-2 flex flex-col gap-2.5 rounded-lg border border-border p-2">
                  {SECTION_CATEGORIES.map((cat) => (
                    <div key={cat.label}>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {cat.types.map((t) => (
                          <button
                            key={t} type="button" onClick={() => addSection(t)}
                            className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium hover:border-primary hover:text-primary"
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
        </aside>

        {/* ── Center: canvas ──────────────────────────────── */}
        <main className="flex min-w-0 flex-1 justify-center overflow-auto bg-muted/40 p-3">
          <iframe
            ref={frameRef}
            srcDoc={html}
            title="Vista previa"
            className="h-full rounded-lg border border-border bg-white shadow-sm transition-all"
            style={{ width: frameW, maxWidth: "100%" }}
            sandbox="allow-same-origin allow-scripts"
          />
        </main>

        {/* ── Right: inspector ────────────────────────────── */}
        <aside className="hidden w-[340px] shrink-0 flex-col border-l border-border bg-card lg:flex">
          {inspecting && activeSection && selected ? (
            <div className="flex-1 overflow-y-auto p-3.5">
              <ElementInspector
                section={activeSection}
                elementKey={selected.key}
                onChange={updateSection}
                onClearSelection={clearSelection}
              />
            </div>
          ) : activeSection ? (
            <>
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => { setActiveSectionId(null); toCanvas({ type: "deselect" }); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Secciones
                </button>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="truncate text-xs font-semibold">{SECTION_LABELS[activeSection.type]}</span>
                <div className="ml-auto flex items-center gap-0.5">
                  <button
                    type="button" onClick={() => duplicateSection(activeSection)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground" title="Duplicar sección"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button" onClick={() => removeSection(activeSection.id)}
                    className="rounded p-1 text-muted-foreground hover:text-red-500" title="Eliminar sección"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3.5">
                <p className="mb-3 rounded-md bg-muted/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                  Haz clic en cualquier texto o imagen de la vista previa para editar su estilo por separado.
                </p>
                <SectionEditor section={activeSection} onChange={updateSection} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1 border-b border-border p-2">
                {([
                  ["design", "Diseño", Palette],
                  ["navfooter", "Menú", Menu],
                  ["brand", "Marca", Type],
                  ["advanced", "CSS", Code2],
                ] as const).map(([id, label, Icon]) => (
                  <button
                    key={id} type="button" onClick={() => setGlobalTab(id)}
                    className={`flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors ${
                      globalTab === id ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3.5">
                {globalTab === "design" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Plantilla</p>
                      <div className="flex flex-col gap-1.5">
                        {TEMPLATES.map((t) => (
                          <button
                            key={t.id} type="button" onClick={() => applyTemplate(t.id)}
                            className={`flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-colors ${
                              cfg.template === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {t.swatch.map((c) => (
                                  <span key={c} className="h-3.5 w-3.5 rounded-sm border border-black/10" style={{ background: c }} />
                                ))}
                              </div>
                              <span className="text-[13px] font-semibold">{t.name}</span>
                              {cfg.template === t.id && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                            </div>
                            <p className="text-[10px] leading-snug text-muted-foreground">{t.bestFor}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Tipografía</p>
                      <div className="flex flex-col gap-1">
                        {FONT_PAIRS.map((f) => (
                          <button
                            key={f.id} type="button" onClick={() => update({ fontPair: f.id })}
                            className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                              cfg.fontPair === f.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold">{f.label}</span>
                              {cfg.fontPair === f.id && <Check className="h-3.5 w-3.5 text-primary" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{f.mood}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Estilo de botones</p>
                      <div className="mb-1.5 grid grid-cols-3 gap-1">
                        {BUTTON_SHAPES.map((s) => (
                          <button
                            key={s.id} type="button" onClick={() => updateBrand({ buttonShape: s.id })}
                            className={`rounded-md border px-1 py-1.5 text-[10px] font-medium transition-colors ${
                              (cfg.brand.buttonShape ?? "pill") === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {BUTTON_FILLS.map((s) => (
                          <button
                            key={s.id} type="button" onClick={() => updateBrand({ buttonFill: s.id })}
                            className={`rounded-md border px-1 py-1.5 text-[10px] font-medium transition-colors ${
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

                {globalTab === "navfooter" && cfg.nav && cfg.footer && (
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

                {globalTab === "brand" && (
                  <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Nombre del negocio</label>
                      <input className={inputCls} value={cfg.brand.name} onChange={(e) => updateBrand({ name: e.target.value })} />
                    </div>

                    <MediaPicker label="Logo" accept="image" value={cfg.brand.logo} onChange={(m) => updateBrand({ logo: m })} />

                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ["accent", "Principal"],
                        ["ink", "Texto"],
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

                {globalTab === "advanced" && (
                  <div className="flex flex-col gap-3.5">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Solo para usuarios con conocimiento de CSS. Se agrega al final de los estilos del sitio.
                      </p>
                    </div>
                    <textarea
                      rows={18}
                      spellCheck={false}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs outline-none focus:border-primary"
                      placeholder={"section { }\n.btn:hover { }"}
                      value={cfg.customCss ?? ""}
                      onChange={(e) => update({ customCss: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
