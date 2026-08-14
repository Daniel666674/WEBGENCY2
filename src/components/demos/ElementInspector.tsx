"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, RotateCcw, ChevronRight, Clipboard, ClipboardCheck, ClipboardPaste } from "lucide-react";
import type { Section, ElementKey, ElementStyle, ElementKind } from "@/lib/demo/types";
import { ELEMENT_KIND, ELEMENT_LABELS, SECTION_LABELS } from "@/lib/demo/types";

// Module-scoped on purpose: "copy this button's style, click another button,
// paste" is a same-session gesture, not something that should survive a
// reload or leak across demos via localStorage.
let styleClipboard: { kind: ElementKind; style: ElementStyle } | null = null;

const numCls =
  "w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-border pb-4 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[76px_1fr] items-center gap-2">
      <label className="text-[11px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

/** Number field that shows the inherited value as a placeholder while unset,
 *  so clearing it visibly returns the element to the template's styling. */
function NumField({
  value, onChange, placeholder = "Auto", min, max, step = 1, suffix,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        className={numCls}
        value={value ?? ""}
        placeholder={placeholder}
        min={min} max={max} step={step}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
      {suffix && <span className="shrink-0 text-[10px] text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function Seg<T extends string>({
  value, options, onChange,
}: {
  value: T | undefined;
  options: { id: T; label: string }[];
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length},1fr)` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          // Clicking the active option clears it, returning to the template value.
          onClick={() => onChange(value === o.id ? undefined : o.id)}
          className={`rounded-md border px-1 py-1.5 text-[10px] font-medium transition-colors ${
            value === o.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ColorField({
  value, onChange,
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
      />
      <input
        className={numCls}
        placeholder="Heredado"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const WEIGHTS = ["300", "400", "500", "600", "700", "800", "900"];

export function ElementInspector({
  section, elementKey, onChange, onClearSelection,
}: {
  section: Section;
  elementKey: ElementKey;
  onChange: (s: Section) => void;
  onClearSelection: () => void;
}) {
  const kind = ELEMENT_KIND[elementKey];
  const style: ElementStyle = section.elements?.[elementKey] ?? {};

  function set(patch: Partial<ElementStyle>) {
    const next: ElementStyle = { ...style, ...patch };
    // Drop keys that were cleared so the config stays minimal and the
    // element genuinely falls back to the template rather than pinning a value.
    for (const k of Object.keys(next) as (keyof ElementStyle)[]) {
      if (next[k] === undefined) delete next[k];
    }
    const elements = { ...(section.elements ?? {}), [elementKey]: next };
    if (Object.keys(next).length === 0) delete elements[elementKey];
    onChange({ ...section, elements });
  }

  function resetAll() {
    const elements = { ...(section.elements ?? {}) };
    delete elements[elementKey];
    onChange({ ...section, elements });
  }

  const hasOverrides = Object.keys(style).length > 0;
  const isText = kind === "text" || kind === "button";

  const [justCopied, setJustCopied] = useState(false);
  // Re-read on every render (selection changes) rather than syncing local
  // state from the module variable, so switching elements always reflects
  // whatever was most recently copied.
  const canPaste = styleClipboard?.kind === kind;

  function copyStyle() {
    styleClipboard = { kind, style };
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1200);
  }

  function pasteStyle() {
    if (!styleClipboard || styleClipboard.kind !== kind) return;
    const elements = { ...(section.elements ?? {}), [elementKey]: { ...styleClipboard.style } };
    onChange({ ...section, elements });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb — mirrors the reference's "Hero > Título" */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1 text-xs">
          <button
            type="button"
            onClick={onClearSelection}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {SECTION_LABELS[section.type]}
          </button>
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate font-semibold">{ELEMENT_LABELS[elementKey]}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={copyStyle}
            disabled={!hasOverrides}
            title={hasOverrides ? "Copiar este estilo" : "Este elemento no tiene estilo propio que copiar"}
            className="flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40"
          >
            {justCopied ? <ClipboardCheck className="h-3 w-3 text-green-600 dark:text-green-400" /> : <Clipboard className="h-3 w-3" />}
            {justCopied ? "Copiado" : "Copiar"}
          </button>
          {canPaste && (
            <button
              type="button"
              onClick={pasteStyle}
              title="Pegar el estilo copiado"
              className="flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
            >
              <ClipboardPaste className="h-3 w-3" /> Pegar
            </button>
          )}
          {hasOverrides && (
            <button
              type="button"
              onClick={resetAll}
              title="Quitar todos los cambios de este elemento"
              className="flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
            >
              <RotateCcw className="h-3 w-3" /> Restablecer
            </button>
          )}
        </div>
      </div>

      {isText && (
        <Group title="Tipografía">
          <Row label="Fuente">
            <Seg
              value={style.fontFamily}
              options={[{ id: "heading" as const, label: "Títulos" }, { id: "body" as const, label: "Texto" }]}
              onChange={(v) => set({ fontFamily: v })}
            />
          </Row>
          <Row label="Tamaño">
            <NumField value={style.fontSize} onChange={(v) => set({ fontSize: v })} min={8} max={400} suffix="px" />
          </Row>
          <Row label="Peso">
            <select
              className={numCls}
              value={style.fontWeight ?? ""}
              onChange={(e) => set({ fontWeight: e.target.value || undefined })}
            >
              <option value="">Heredado</option>
              {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Row>
          <Row label="Interlineado">
            <NumField value={style.lineHeight} onChange={(v) => set({ lineHeight: v })} min={0.5} max={4} step={0.05} />
          </Row>
          <Row label="Espaciado">
            <NumField value={style.letterSpacing} onChange={(v) => set({ letterSpacing: v })} min={-0.5} max={2} step={0.01} suffix="em" />
          </Row>
          <Row label="Color">
            <ColorField value={style.color} onChange={(v) => set({ color: v })} />
          </Row>
          <Row label="Alineación">
            <Seg
              value={style.align}
              options={[
                { id: "left" as const, label: "Izq" },
                { id: "center" as const, label: "Centro" },
                { id: "right" as const, label: "Der" },
              ]}
              onChange={(v) => set({ align: v })}
            />
          </Row>
          <Row label="Mayúsculas">
            <Seg
              value={style.textTransform}
              options={[{ id: "none" as const, label: "Normal" }, { id: "uppercase" as const, label: "MAYÚS" }]}
              onChange={(v) => set({ textTransform: v })}
            />
          </Row>
        </Group>
      )}

      {kind === "button" && (
        <Group title="Botón">
          <Row label="Fondo">
            <ColorField value={style.bg} onChange={(v) => set({ bg: v })} />
          </Row>
          <Row label="Esquinas">
            <NumField value={style.radius} onChange={(v) => set({ radius: v })} min={0} max={200} suffix="px" />
          </Row>
        </Group>
      )}

      {kind === "media" && (
        <Group title="Imagen">
          <Row label="Esquinas">
            <NumField value={style.radius} onChange={(v) => set({ radius: v })} min={0} max={200} suffix="px" />
          </Row>
        </Group>
      )}

      <Group title="Espaciado">
        <Row label="Arriba">
          <NumField value={style.marginTop} onChange={(v) => set({ marginTop: v })} min={-200} max={400} suffix="px" />
        </Row>
        <Row label="Abajo">
          <NumField value={style.marginBottom} onChange={(v) => set({ marginBottom: v })} min={-200} max={400} suffix="px" />
        </Row>
      </Group>

      {(style.offsetX !== undefined || style.offsetY !== undefined) && (
        <Group title="Posición libre">
          <Row label="Mover X">
            <NumField value={style.offsetX ?? 0} onChange={(v) => set({ offsetX: v || undefined })} min={-2000} max={2000} suffix="px" />
          </Row>
          <Row label="Mover Y">
            <NumField value={style.offsetY ?? 0} onChange={(v) => set({ offsetY: v || undefined })} min={-2000} max={2000} suffix="px" />
          </Row>
          <button
            type="button"
            onClick={() => set({ offsetX: undefined, offsetY: undefined })}
            className="mt-1 w-full rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Restablecer posición
          </button>
        </Group>
      )}

      <Group title="Visible en">
        <div className="grid grid-cols-3 gap-1.5">
          {([
            ["hideDesktop", Monitor, "Escritorio"],
            ["hideTablet", Tablet, "Tablet"],
            ["hideMobile", Smartphone, "Móvil"],
          ] as const).map(([key, Icon, label]) => {
            const visible = !style[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => set({ [key]: visible ? true : undefined } as Partial<ElementStyle>)}
                title={visible ? `Ocultar en ${label}` : `Mostrar en ${label}`}
                className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-[10px] font-medium transition-colors ${
                  visible ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground opacity-60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </Group>
    </div>
  );
}
