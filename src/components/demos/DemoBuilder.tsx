"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Eye, EyeOff, Monitor, Smartphone, Tablet, ArrowLeft,
  ExternalLink, Loader2, Globe, Check, Palette, Type, Layers, Plus,
  Undo2, Redo2, Code2, Menu, ChevronRight, Copy, Trash2, PanelsTopLeft, Files, SlidersHorizontal,
  AlertTriangle, Lightbulb, Lock,
} from "lucide-react";
import type { DemoConfig, DemoPage, Section, SectionType, ButtonShape, ButtonFill, ElementKey, NavLink, DemoBrief } from "@/lib/demo/types";
import { SECTION_LABELS, SECTION_CATEGORIES, newId, defaultNav, defaultFooter, defaultNavLinks, defaultPages } from "@/lib/demo/types";
import { isItemDriven, starterItems } from "@/lib/demo/coach";
import { CoachTips } from "./CoachTips";
import { TEMPLATES, getTemplate } from "@/lib/demo/templates";
import { FONT_PAIRS } from "@/lib/demo/fonts";
import { renderDemo } from "@/lib/demo/render";
import { buildVerbatimEditDocument, extractRootColorVars, hasNavBlock, replaceNavBlock, setRootColorVar, type VerbatimEditMode } from "@/lib/demo/verbatim";
import { SectionEditor } from "./SectionEditor";
import { MediaPicker } from "./MediaPicker";
import { NavEditor, FooterEditor } from "./NavFooterEditor";
import { ElementInspector } from "./ElementInspector";
import { DesignAdvisor } from "./DesignAdvisor";
import { DemoSetup } from "./DemoSetup";
import { analyzeDemo } from "@/lib/demo/advisor";

const inputCls =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary transition-colors";

type GlobalTab = "design" | "brand" | "navfooter" | "advisor" | "advanced";
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

const DENSITIES = [
  { id: "compact" as const, label: "Compacto" },
  { id: "normal" as const, label: "Normal" },
  { id: "spacious" as const, label: "Amplio" },
];
const IMAGE_STYLES = [
  { id: "normal" as const, label: "Normal" },
  { id: "grayscale" as const, label: "B/N" },
  { id: "duotone" as const, label: "Duotono" },
  { id: "soft" as const, label: "Sombra" },
];

/** Section fields that can be edited directly in the canvas. */
const EDITABLE_FIELDS = ["heading", "subheading", "body", "eyebrow", "ctaText"];

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

/**
 * Code editor for a "diseño original" page.
 *
 * The trade that mode makes — the source's real HTML/CSS instead of a
 * re-render from Section data — costs the visual, click-to-edit builder:
 * there's no Section for a click to land on. It doesn't have to cost
 * editing entirely. This is the same content, editable as what it actually
 * is — real markup — rather than not editable at all.
 *
 * Commits on blur, not per keystroke: the change flows into `cfg` and
 * reloads the preview iframe, and doing that on every keystroke of a
 * multi-KB HTML document would make the panel feel like it's fighting the
 * person typing in it. An explicit button covers the keyboard-only path
 * (tab away without blurring) and doubles as "show me now" for anyone who
 * doesn't intuitively expect blur to commit.
 */
/** Color swatches for a page's `:root` CSS variables — the real, editable
 *  palette of a site that themes itself with custom properties. */
function VerbatimColors({ css, onCommit }: { css: string; onCommit: (next: string) => void }) {
  const vars = useMemo(() => extractRootColorVars(css), [css]);

  if (vars.length === 0) {
    return (
      <div className="p-3 text-[11px] leading-relaxed text-muted-foreground">
        No encontramos variables de color en <code className="rounded bg-muted px-1">:root</code> de este CSS.
        Si el sitio define sus colores de otra forma, cambialos directamente en la pestaña CSS.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-1 overflow-y-auto p-3">
      {vars.map((v) => (
        <div key={v.name} className="flex items-center gap-2 rounded-md border border-border p-2">
          {v.kind === "hex" ? (
            <input
              type="color"
              value={normalizeHex(v.value)}
              onChange={(e) => onCommit(setRootColorVar(css, v.name, e.target.value))}
              className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
              aria-label={v.name}
            />
          ) : (
            <span className="h-7 w-7 shrink-0 rounded border border-border" style={{ background: v.value }} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] text-muted-foreground">{v.name}</p>
            <input
              defaultValue={v.value}
              key={v.value}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== v.value) onCommit(setRootColorVar(css, v.name, e.target.value.trim()));
              }}
              spellCheck={false}
              className="w-full bg-transparent font-mono text-xs outline-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function normalizeHex(v: string): string {
  // <input type="color"> only accepts #rrggbb — expand #rgb, drop alpha.
  const hex = v.replace("#", "");
  if (hex.length === 3) return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  if (hex.length >= 6) return `#${hex.slice(0, 6)}`;
  return "#000000";
}

/** Click-to-edit preview for a "diseño original" page: the same iframe as the
 *  read-only preview, but with the body (mode "text") or the page's own
 *  `<nav>` (mode "menu") made editable in place — text via `contentEditable`,
 *  order via native drag-and-drop, and (menu mode only) a link's URL via a
 *  double-click prompt plus add/remove controls (see `buildVerbatimEditDocument`).
 *  Changes come back via `postMessage`, already stripped of the editing
 *  scaffolding, so they merge straight into `html` the same as a code edit would. */
function VerbatimLiveEditor({
  html, css, mode, hint, onCommit,
}: {
  html: string; css: string; mode: VerbatimEditMode; hint: string; onCommit: (html: string) => void;
}) {
  // Regenerated only on mount, when the mode changes, and on an explicit
  // "Recargar vista" click — not on every edit the iframe reports back, or
  // the reload would fight the person editing it.
  const [version, setVersion] = useState(0);
  const [doc, setDoc] = useState(() => buildVerbatimEditDocument(html, css, mode));
  function reload() {
    setDoc(buildVerbatimEditDocument(html, css, mode));
    setVersion((v) => v + 1);
  }

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e.data || e.data.source !== "oliwan-verbatim" || e.data.type !== "change") return;
      onCommit(e.data.html);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onCommit]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border p-2">
        <p className="text-[11px] text-muted-foreground">{hint}</p>
        <button
          type="button"
          onClick={reload}
          className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Recargar vista
        </button>
      </div>
      <iframe key={version} srcDoc={doc} title="Editor visual" className="min-h-0 flex-1 border-0 bg-white" sandbox="allow-scripts allow-same-origin" />
    </div>
  );
}

/**
 * Code editor for a "diseño original" page.
 *
 * The trade that mode makes — the source's real HTML/CSS instead of a
 * re-render from Section data — costs the visual, click-to-edit builder:
 * there's no Section for a click to land on. It doesn't have to cost
 * editing entirely. This is the same content, editable as what it actually
 * is — real markup — rather than not editable at all.
 *
 * Commits on blur, not per keystroke: the change flows into `cfg` and
 * reloads the preview iframe, and doing that on every keystroke of a
 * multi-KB HTML document would make the panel feel like it's fighting the
 * person typing in it. An explicit button covers the keyboard-only path
 * (tab away without blurring) and doubles as "show me now" for anyone who
 * doesn't intuitively expect blur to commit.
 *
 * "Visual" and "Colores" commit immediately instead — a color picker and a
 * drag are already discrete, deliberate actions, not keystrokes to debounce.
 */
function VerbatimEditor({
  page,
  onChange,
  multiPage,
  onApplyNavToAllPages,
}: {
  page: { html: string; css: string } | undefined;
  onChange: (next: { html: string; css: string }) => void;
  multiPage: boolean;
  /** Copies this page's `<nav>`/`<header>` into every other verbatim page in
   *  the demo — present only when there's more than one page to spread it to. */
  onApplyNavToAllPages?: () => void;
}) {
  const [sub, setSub] = useState<"visual" | "menu" | "colors" | "html" | "css">("visual");
  const [html, setHtml] = useState(page?.html ?? "");
  const [css, setCss] = useState(page?.css ?? "");
  const [dirty, setDirty] = useState(false);
  const showMenuTab = hasNavBlock(html);

  function commit() {
    if (!dirty) return;
    onChange({ html, css });
    setDirty(false);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Diseño original
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Es el HTML y el CSS del sitio importado, así que se sigue viendo igual. Cambiá colores, texto, el menú y
          el orden de los bloques desde acá, o editá el código directamente.
          {multiPage && " Los cambios afectan solo a esta página, salvo el menú."}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border p-2">
        {([
          { id: "visual" as const, label: "Visual" },
          ...(showMenuTab ? [{ id: "menu" as const, label: "Menú" }] : []),
          { id: "colors" as const, label: "Colores" },
          { id: "html" as const, label: "HTML" },
          { id: "css" as const, label: "CSS" },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSub(t.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              sub === t.id ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "visual" && (
        <VerbatimLiveEditor
          html={html}
          css={css}
          mode="text"
          hint="Hacé clic para escribir. Arrastrá un bloque para reordenarlo."
          onCommit={(next) => {
            setHtml(next);
            onChange({ html: next, css });
          }}
        />
      )}

      {sub === "menu" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <VerbatimLiveEditor
            html={html}
            css={css}
            mode="menu"
            hint="Clic para editar el texto · doble clic para la URL · × para eliminar · arrastrá para reordenar."
            onCommit={(next) => {
              setHtml(next);
              onChange({ html: next, css });
            }}
          />
          {multiPage && onApplyNavToAllPages && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={onApplyNavToAllPages}
                className="w-full rounded-md border border-dashed border-primary/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
              >
                Aplicar este menú a todas las páginas
              </button>
            </div>
          )}
        </div>
      )}

      {sub === "colors" && (
        <VerbatimColors
          css={css}
          onCommit={(next) => {
            setCss(next);
            onChange({ html, css: next });
          }}
        />
      )}

      {(sub === "html" || sub === "css") && (
        <>
          <textarea
            value={sub === "html" ? html : css}
            onChange={(e) => {
              if (sub === "html") setHtml(e.target.value);
              else setCss(e.target.value);
              setDirty(true);
            }}
            onBlur={commit}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none border-0 bg-background p-3 font-mono text-[11px] leading-relaxed outline-none"
            placeholder={sub === "html" ? "<section>...</section>" : ".clase { }"}
          />
          <div className="flex items-center gap-2 border-t border-border p-2">
            <button
              type="button"
              onClick={commit}
              disabled={!dirty}
              className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              {dirty ? "Aplicar cambios" : "Sin cambios"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function DemoBuilder({
  demoId, initialConfig, initialTitle, initialPublished, initialVersion, slug, isNew = false,
}: {
  demoId: string; initialConfig: DemoConfig; initialTitle: string;
  initialPublished: boolean; initialVersion: number; slug: string; isNew?: boolean;
}) {
  const [cfg, setCfgRaw] = useState<DemoConfig>(() => ({
    ...initialConfig,
    nav: initialConfig.nav ?? { ...defaultNav(), links: defaultNavLinks(initialConfig.sections) },
    footer: initialConfig.footer ?? { ...defaultFooter(), columns: [{ id: newId(), title: "Enlaces", links: defaultNavLinks(initialConfig.sections) }] },
    // Normalized the same way nav/footer are: every demo has `pages` in the
    // builder from here on, even a single-page one — it's just a one-page
    // array. `sections` stays mirrored to pages[0] so nothing that only
    // knows about the flat list (the advisor, demo creation) has to change.
    pages: initialConfig.pages?.length ? initialConfig.pages : defaultPages(initialConfig.sections),
  }));
  const [title, setTitle] = useState(initialTitle);
  const [published, setPublished] = useState(initialPublished);
  const [device, setDevice] = useState<Device>("desktop");
  const [activePageId, setActivePageId] = useState(() => (cfg.pages?.[0]?.id ?? ""));

  // The right panel shows one of three things, most specific first:
  // an element inspector, a section editor, or the global settings tabs.
  const [selected, setSelected] = useState<{ id: string; key: ElementKey } | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [globalTab, setGlobalTab] = useState<GlobalTab>("design");
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(isNew);

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

  const pages: DemoPage[] = cfg.pages?.length ? cfg.pages : defaultPages(cfg.sections);
  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
  const activeSections = activePage.sections;
  const isMultiPage = pages.length > 1;
  // A page imported in "diseño original" mode has no Sections at all — its
  // content is the html/css sitting in cfg.verbatim, and none of the
  // section-editing UI below (structure list, add-section, click-to-edit on
  // the canvas) has anything to act on for it. Keyed per page rather than
  // per demo: a page added later with `addPage()` gets real sections and
  // falls right back into normal editing, verbatim or not.
  const isVerbatimPage = !!cfg.verbatim?.[activePage.slug];

  // The canvas renders from its own copy of the config. Typing inside the
  // canvas updates `cfg` (so it saves and lands in history) but deliberately
  // does NOT advance `renderCfg` — regenerating srcDoc would reload the
  // iframe and drop the caret on every keystroke. The DOM already shows the
  // new text, so there is nothing to re-render.
  const [renderCfg, setRenderCfg] = useState<DemoConfig>(cfg);
  // Hovering a template swatch shows what it would look like without
  // touching saved state — separate from renderCfg so mouseleave restores
  // exactly, with no risk of a stray write reaching the server.
  const [previewOverride, setPreviewOverride] = useState<DemoConfig | null>(null);
  const html = useMemo(
    () => renderDemo(previewOverride ?? renderCfg, { mode: "edit", page: activePage.slug }),
    [renderCfg, previewOverride, activePage.slug]
  );

  function templatePreviewConfig(id: string): DemoConfig {
    const t = getTemplate(id);
    const fresh = t.defaults();
    return {
      ...cfg,
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
      // Swap the variant on every page, not just home, so previewing a
      // template swatch looks right regardless of which page is open.
      pages: (cfg.pages?.length ? cfg.pages : defaultPages(cfg.sections)).map((p) => ({
        ...p,
        sections: p.sections.map((s) => {
          const match = fresh.sections.find((f) => f.type === s.type);
          return match ? { ...s, variant: match.variant } : s;
        }),
      })),
    };
  }

  // Lets the canvas message handler read current state without re-subscribing.
  const cfgRef = useRef(cfg);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  const setCfg = useCallback((next: DemoConfig, rerender = true) => {
    setCfgRaw(next);
    if (rerender) setRenderCfg(next);
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

  /** Every section CRUD op reads/writes the active page's sections through
   *  this, instead of cfg.sections directly. Keeps `sections` mirrored to
   *  pages[0] so other code that only knows the flat list stays correct. */
  const updateSections = useCallback((next: Section[]) => {
    const nextPages = pages.map((p) => (p.id === activePage.id ? { ...p, sections: next } : p));
    update({ pages: nextPages, sections: activePage.id === pages[0].id ? next : cfg.sections });
  }, [pages, activePage, cfg.sections, update]);

  function addPage() {
    const usedSlugs = new Set(pages.map((p) => p.slug));
    let n = pages.length;
    let slug = `pagina-${n}`;
    while (usedSlugs.has(slug)) { n += 1; slug = `pagina-${n}`; }
    // Seed with a real, template-consistent starter section rather than
    // copying something from home — a page can start from nothing.
    const starter = getTemplate(cfg.template).defaults().sections.find((s) => s.type === "about");
    const seedSection: Section = starter
      ? { ...starter, id: newId(), enabled: true, heading: "Nueva página" }
      : { id: newId(), type: "columns", variant: "single", enabled: true, heading: "Nueva página" };
    const page: DemoPage = { id: newId(), slug, title: "Nueva página", sections: [seedSection] };
    update({ pages: [...pages, page] });
    setActivePageId(page.id);
  }

  function renamePage(id: string, patch: Partial<Pick<DemoPage, "title" | "slug">>) {
    update({ pages: pages.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }

  function removePage(id: string) {
    // The home page (pages[0]) is permanent — its slug is always "" and the
    // UI locks that field precisely because it can't become anything else.
    // Deleting it would either need to promote another page to home (which
    // the slug lock then makes un-fixable) or leave `sections` — the
    // top-level mirror everything else still reads — pointed at a page that
    // no longer exists. Simplest correct rule: it just can't be removed.
    if (pages.length <= 1 || id === pages[0].id) return;
    const next = pages.filter((p) => p.id !== id);
    // Clear any nav/footer link that pointed at the page being deleted,
    // everywhere it could appear — otherwise it silently becomes a dead "#"
    // link that never surfaces as broken until a client clicks it.
    const scrub = (links: NavLink[]): NavLink[] =>
      links.map((l) => ({
        ...l,
        page: l.page === id ? undefined : l.page,
        children: l.children ? scrub(l.children) : l.children,
      }));
    const nav = cfg.nav ? { ...cfg.nav, links: scrub(cfg.nav.links) } : cfg.nav;
    const footer = cfg.footer
      ? { ...cfg.footer, columns: cfg.footer.columns.map((c) => ({ ...c, links: scrub(c.links) })) }
      : cfg.footer;
    update({ pages: next, nav, footer });
    if (activePageId === id) setActivePageId(next[0].id);
  }

  /** Writes text typed in the canvas back into the config, without re-rendering. */
  const applyCanvasText = useCallback((sectionId: string, field: string, value: string) => {
    const current = cfgRef.current;
    const itemMatch = /^items\.(\d+)\.(title|body|price)$/.exec(field);
    if (!itemMatch && !EDITABLE_FIELDS.includes(field)) return;

    const patchSection = (sec: Section): Section => {
      if (sec.id !== sectionId) return sec;
      if (itemMatch) {
        const idx = Number(itemMatch[1]);
        const items = (sec.items ?? []).map((it, i) => (i === idx ? { ...it, [itemMatch[2]]: value } : it));
        return { ...sec, items };
      }
      return { ...sec, [field]: value };
    };

    // The edited section lives in whichever page the canvas is currently
    // showing (the only page that could have posted this message), so only
    // that page needs patching — but resolve it from `pages` rather than
    // assuming home, since most demos are single-page but not all are.
    const currentPages = current.pages?.length ? current.pages : defaultPages(current.sections);
    const nextPages = currentPages.map((p) => ({ ...p, sections: p.sections.map(patchSection) }));

    dirty.current = true;
    setSaved(false);
    setUnpublishedChanges(true);
    setCfg({ ...current, pages: nextPages, sections: nextPages[0].sections }, false);
  }, [setCfg]);

  const undo = useCallback(() => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    suppressHistory.current = true;
    dirty.current = true;
    setCfgRaw(history.current[historyIndex.current]);
    setRenderCfg(history.current[historyIndex.current]);
    suppressHistory.current = false;
    setHistoryTick((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    suppressHistory.current = true;
    dirty.current = true;
    setCfgRaw(history.current[historyIndex.current]);
    setRenderCfg(history.current[historyIndex.current]);
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

  const [rewriteError, setRewriteError] = useState<string | null>(null);
  useEffect(() => {
    if (!rewriteError) return;
    const t = setTimeout(() => setRewriteError(null), 6000);
    return () => clearTimeout(t);
  }, [rewriteError]);

  // Canvas -> sidebar selection, plus the AI rewrite round-trip. The rewrite
  // request is handled here (not in the iframe) so the network call goes
  // through the same fetch path as everything else in the builder.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as {
        source?: string; type?: string; id?: string; key?: string;
        field?: string; value?: string; rich?: boolean; text?: string; tone?: string;
      } | undefined;
      if (!data || data.source !== "oliwan-demo") return;

      if (data.type === "text-change" && data.id && data.field !== undefined) {
        applyCanvasText(data.id, data.field, data.value ?? "");
        return;
      }

      if (data.type === "rewrite-request" && data.id && data.field !== undefined) {
        const { id, field, rich, text, tone } = data;
        fetch("/api/demo-pages/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, tone, rich }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.error) {
              setRewriteError(res.error);
              // No `text` — the canvas branch just re-enables the field.
              frameRef.current?.contentWindow?.postMessage({ source: "oliwan-editor", type: "rewrite-result", id, field }, "*");
              return;
            }
            applyCanvasText(id, field, res.text);
            frameRef.current?.contentWindow?.postMessage(
              { source: "oliwan-editor", type: "rewrite-result", id, field, text: res.text }, "*"
            );
          })
          .catch(() => {
            setRewriteError("No se pudo reescribir el texto.");
            frameRef.current?.contentWindow?.postMessage({ source: "oliwan-editor", type: "rewrite-result", id, field }, "*");
          });
        return;
      }

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
  }, [applyCanvasText]);

  const toCanvas = useCallback((msg: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage({ source: "oliwan-editor", ...msg }, "*");
  }, []);

  const updateBrand = (patch: Partial<DemoConfig["brand"]>) => update({ brand: { ...cfg.brand, ...patch } });
  const updateSection = (s: Section) => updateSections(activeSections.map((x) => (x.id === s.id ? s : x)));
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
    const from = activeSections.findIndex((s) => s.id === active.id);
    const to = activeSections.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    updateSections(arrayMove(activeSections, from, to));
  }

  function applyTemplate(id: string) {
    setPreviewOverride(null);
    const { template, fontPair, brand, sections, pages: newPages } = templatePreviewConfig(id);
    update({ template, fontPair, brand, sections, pages: newPages });
  }

  /**
   * Some sections ship with an empty item list (Galería is the notable one).
   * Turning them on then produced a section the renderer skipped entirely —
   * it looked like the toggle did nothing. Seed starter rows so enabling a
   * section always puts something on the canvas to edit.
   */
  function withStarterItems(s: Section): Section {
    if (!isItemDriven(s.type) || (s.items?.length ?? 0) > 0) return s;
    const items = starterItems(s.type);
    return items.length ? { ...s, items } : s;
  }

  function toggleSectionEnabled(s: Section) {
    const next = { ...s, enabled: !s.enabled };
    updateSection(next.enabled ? withStarterItems(next) : next);
  }

  function addSection(type: SectionType) {
    const proto = getTemplate(cfg.template).defaults().sections.find((s) => s.type === type);
    const built: Section = proto
      ? { ...proto, id: newId(), enabled: true }
      : { id: newId(), type, variant: "list", enabled: true, heading: "" };
    updateSections([...activeSections, withStarterItems(built)]);
    setAddPickerOpen(false);
    setSelected(null);
    setActiveSectionId(built.id);
  }

  function duplicateSection(s: Section) {
    const clone: Section = { ...s, id: newId() };
    const idx = activeSections.findIndex((x) => x.id === s.id);
    const next = [...activeSections];
    next.splice(idx + 1, 0, clone);
    updateSections(next);
    setActiveSectionId(clone.id);
  }

  function removeSection(id: string) {
    updateSections(activeSections.filter((x) => x.id !== id));
    if (activeSectionId === id) setActiveSectionId(null);
    if (selected?.id === id) setSelected(null);
  }

  function selectSection(id: string) {
    setSelected(null);
    setActiveSectionId(id);
    // On a phone the editor is a separate overlay — picking a section from the
    // structure list should take you straight to its fields, not leave you
    // looking at the list you just used.
    if (typeof window !== "undefined" && window.innerWidth < 1024) setMobilePanel("editor");
    toCanvas({ type: "select", id });
  }

  function switchPage(id: string) {
    setActivePageId(id);
    setActiveSectionId(null);
    setSelected(null);
  }

  const clearSelection = useCallback(() => {
    setSelected(null);
    toCanvas({ type: "deselect" });
  }, [toCanvas]);

  const activeSection = activeSectionId ? activeSections.find((s) => s.id === activeSectionId) ?? null : null;
  // Gate on the resolved section so a deleted-while-selected section falls
  // back to the tabs instead of rendering an empty panel.
  const inspecting = !!(selected && activeSection && selected.id === activeSection.id);
  const adviceCount = useMemo(() => {
    const a = analyzeDemo(cfg);
    return a.filter((x) => x.level !== "tip").length;
  }, [cfg]);

  const finishSetup = useCallback(async ({ name, template, contactId, brief }: { name: string; template: string; contactId: string; brief: DemoBrief }) => {
    const t = getTemplate(template);
    const fresh = t.defaults();
    fresh.brand.name = name;
    const nextCfg: DemoConfig = { ...fresh, nav: fresh.nav, footer: fresh.footer, brief };

    const res = await fetch(`/api/demo-pages/${demoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: name, config: nextCfg, template, contactId: contactId || null,
        version: version.current,
      }),
    });
    if (res.ok) {
      const row = await res.json();
      version.current = row.version ?? version.current + 1;
    }

    setTitle(name);
    setCfgRaw(nextCfg);
    setRenderCfg(nextCfg);
    history.current = [nextCfg];
    historyIndex.current = 0;
    setHistoryTick((v) => v + 1);
    dirty.current = false;
    setSetupOpen(false);
    // Fresh demos start on Consejos: the templates ship with placeholder copy
    // and the advisor is the checklist for replacing it.
    setGlobalTab("advisor");
  }, [demoId]);

  const frameW = device === "desktop" ? "100%" : device === "tablet" ? "820px" : "390px";
  // Below lg the two side panels can't sit next to the canvas, so they become
  // full-screen overlays switched from a bottom bar. "canvas" = both closed.
  const [mobilePanel, setMobilePanel] = useState<"canvas" | "structure" | "editor">("canvas");
  const canUndo = historyIndex.current > 0;
  const canRedo = historyIndex.current < history.current.length - 1;
  void historyTick;

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      {setupOpen && <DemoSetup initialTemplate={cfg.template} onDone={finishSetup} />}
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
          className="min-w-0 max-w-[110px] flex-shrink rounded-md bg-transparent px-2 py-1 text-sm font-semibold outline-none hover:bg-muted focus:bg-muted sm:max-w-[220px]"
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

      {rewriteError && (
        <div className="fixed right-4 top-16 z-[200] flex items-center gap-2 rounded-lg border border-red-500/40 bg-card px-3 py-2 shadow-lg">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-xs">{rewriteError}</p>
          <button type="button" onClick={() => setRewriteError(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        {/* ── Left: structure ─────────────────────────────── */}
        <aside
          className={`${mobilePanel === "structure" ? "flex" : "hidden"} absolute bottom-0 left-0 right-0 top-0 z-30 w-full flex-col overflow-hidden border-r border-border bg-card md:static md:flex md:w-60 md:shrink-0`}
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <PanelsTopLeft className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Estructura del sitio</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {/* Page switcher — always shown, even for single-page demos, so
                adding a second page doesn't require hunting for the control. */}
            <div className="mb-2 flex flex-col gap-1 rounded-lg border border-border bg-muted/40 p-1.5">
              {pages.map((p) => (
                <div key={p.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => switchPage(p.id)}
                    className={`flex flex-1 items-center gap-1.5 truncate rounded-md px-2 py-1 text-left text-[12px] ${
                      p.id === activePage.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Files className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.title || "(sin nombre)"}</span>
                  </button>
                  {p.id === activePage.id && p.id !== pages[0].id && (
                    <button
                      type="button"
                      onClick={() => removePage(p.id)}
                      className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-red-500 group-hover:opacity-100"
                      title="Eliminar página"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPage}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] font-medium text-primary hover:bg-primary/5"
              >
                <Plus className="h-3 w-3" /> Agregar página
              </button>
              {isMultiPage && (
                <div className="mt-0.5 grid grid-cols-2 gap-1 border-t border-border pt-1.5">
                  <input
                    value={activePage.title}
                    onChange={(e) => renamePage(activePage.id, { title: e.target.value })}
                    placeholder="Título"
                    className="rounded border border-border bg-background px-1.5 py-1 text-[11px] outline-none focus:border-primary"
                  />
                  <input
                    value={activePage.slug}
                    onChange={(e) => renamePage(activePage.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="url-de-la-pagina"
                    disabled={activePage.id === pages[0].id}
                    title={activePage.id === pages[0].id ? "La página de inicio no lleva slug" : "Segmento de URL, ej. \"contacto\""}
                    className="rounded border border-border bg-background px-1.5 py-1 text-[11px] outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            {isVerbatimPage ? (
              <div className="rounded-lg border border-dashed border-border p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Diseño original conservado
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Esta página guardó el HTML y el CSS del sitio original tal cual, para que se vea exactamente
                  igual. No tiene secciones que arrastrar, pero se edita como código en el panel de la derecha —
                  el menú, el pie de página y el texto son parte de ese mismo HTML.
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setSelected(null); setActiveSectionId(null); setGlobalTab("navfooter"); toCanvas({ type: "select", id: "__nav__" }); }}
                  className="mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
                >
                  <Menu className="h-3.5 w-3.5 text-muted-foreground" /> Menú
                </button>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
                  <SortableContext items={activeSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-0.5">
                      {activeSections.map((s) => (
                        <StructureRow
                          key={s.id}
                          section={s}
                          active={activeSectionId === s.id}
                          onSelect={() => selectSection(s.id)}
                          onToggleEnabled={() => toggleSectionEnabled(s)}
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
              </>
            )}
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
        <aside
          className={`${mobilePanel === "editor" ? "flex" : "hidden"} absolute bottom-0 left-0 right-0 top-0 z-30 w-full flex-col overflow-hidden border-l border-border bg-card lg:static lg:flex lg:w-[340px] lg:shrink-0`}
        >
          {inspecting && activeSection && selected ? (
            <div className="flex-1 overflow-y-auto p-3.5">
              <CoachTips section={activeSection} elementKey={selected.key} cfg={cfg} />
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
                <CoachTips section={activeSection} cfg={cfg} />
                <p className="mb-3 rounded-md bg-muted/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                  Haz clic en cualquier texto o imagen de la vista previa para editar su estilo por separado.
                </p>
                <SectionEditor section={activeSection} onChange={updateSection} />
              </div>
            </>
          ) : isVerbatimPage ? (
            <VerbatimEditor
              key={activePage.id}
              page={cfg.verbatim![activePage.slug]}
              onChange={(next) => update({ verbatim: { ...cfg.verbatim, [activePage.slug]: next } })}
              multiPage={isMultiPage}
              onApplyNavToAllPages={
                isMultiPage
                  ? () => {
                      const source = cfg.verbatim![activePage.slug];
                      if (!source) return;
                      const next = { ...cfg.verbatim };
                      for (const slug of Object.keys(next)) {
                        if (slug === activePage.slug) continue;
                        next[slug] = { ...next[slug], html: replaceNavBlock(next[slug].html, source.html) };
                      }
                      update({ verbatim: next });
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-5 gap-1 border-b border-border p-2">
                {([
                  ["design", "Diseño", Palette],
                  ["navfooter", "Menú", Menu],
                  ["brand", "Marca", Type],
                  ["advisor", "Consejos", Lightbulb],
                  ["advanced", "CSS", Code2],
                ] as const).map(([id, label, Icon]) => (
                  <button
                    key={id} type="button" onClick={() => setGlobalTab(id)}
                    className={`relative flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors ${
                      globalTab === id ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                    {id === "advisor" && adviceCount > 0 && (
                      <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                        {adviceCount}
                      </span>
                    )}
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
                            onMouseEnter={() => setPreviewOverride(t.id === cfg.template ? null : templatePreviewConfig(t.id))}
                            onMouseLeave={() => setPreviewOverride(null)}
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
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Espaciado general</p>
                      <div className="grid grid-cols-3 gap-1">
                        {DENSITIES.map((o) => (
                          <button
                            key={o.id} type="button" onClick={() => updateBrand({ density: o.id })}
                            className={`rounded-md border px-1 py-1.5 text-[10px] font-medium transition-colors ${
                              (cfg.brand.density ?? "normal") === o.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Tratamiento de imágenes</p>
                      <div className="grid grid-cols-4 gap-1">
                        {IMAGE_STYLES.map((o) => (
                          <button
                            key={o.id} type="button" onClick={() => updateBrand({ imageStyle: o.id })}
                            className={`rounded-md border px-1 py-1.5 text-[10px] font-medium transition-colors ${
                              (cfg.brand.imageStyle ?? "normal") === o.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                            }`}
                          >
                            {o.label}
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
                      <NavEditor nav={cfg.nav} onChange={updateNav} pages={pages} />
                    </div>
                    <div className="border-t border-border pt-5">
                      <p className="mb-3 text-sm font-semibold">Pie de página</p>
                      <FooterEditor footer={cfg.footer} onChange={updateFooter} pages={pages} />
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

                {globalTab === "advisor" && (
                  <DesignAdvisor cfg={cfg} onGoToSection={selectSection} />
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

      {/* ── Mobile bottom bar ───────────────────────────────
          The side panels are overlays below lg, so this is the only way to
          reach them on a phone. Hidden from lg up, where both panels are
          permanently docked beside the canvas. */}
      <nav className="flex h-12 shrink-0 items-stretch border-t border-border bg-card lg:hidden">
        {([
          ["structure", "Estructura", PanelsTopLeft, "md:hidden"],
          ["canvas", "Vista previa", Eye, ""],
          ["editor", "Editar", SlidersHorizontal, ""],
        ] as const).map(([id, label, Icon, extra]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobilePanel(id)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${extra} ${
              mobilePanel === id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === "editor" && activeSection && (
              <span className="sr-only">{SECTION_LABELS[activeSection.type]}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
