"use client";

import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, ChevronsUpDown } from "lucide-react";
import type { NavConfig, FooterConfig, NavLink, NavSize, NavLayout, MobileNavStyle, FooterSize } from "@/lib/demo/types";
import { newId } from "@/lib/demo/types";

const inputCls =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary transition-colors";
const miniInputCls =
  "w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function SegButtons<T extends string>({
  value, options, onChange, cols = 3,
}: {
  value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; cols?: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
      {options.map((o) => (
        <button
          key={o.id} type="button" onClick={() => onChange(o.id)}
          className={`rounded-md border px-1.5 py-1.5 text-[11px] font-medium transition-colors ${
            value === o.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SortableLinkRow({
  id, link, onChange, onRemove, allowChildren,
}: {
  id: string; link: NavLink; onChange: (l: NavLink) => void; onRemove: () => void; allowChildren?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [showChildren, setShowChildren] = useState(!!link.children?.length);
  const children = link.children ?? [];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-lg border border-border bg-card p-2.5"
    >
      <div className="flex items-center gap-1.5">
        <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none rounded p-0.5 text-muted-foreground active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <input className={miniInputCls} placeholder="Texto" value={link.label} onChange={(e) => onChange({ ...link, label: e.target.value })} />
        <input className={miniInputCls} placeholder="#seccion o URL" value={link.url} onChange={(e) => onChange({ ...link, url: e.target.value })} />
        {allowChildren && (
          <button
            type="button" onClick={() => setShowChildren((v) => !v)}
            className={`shrink-0 rounded p-1 ${children.length ? "text-primary" : "text-muted-foreground"}`}
            title="Submenú"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" onClick={onRemove} className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {allowChildren && showChildren && (
        <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2 pl-5">
          <p className="text-[10px] font-medium text-muted-foreground">Submenú (aparece al pasar el mouse / en el menú móvil)</p>
          {children.map((c, i) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <input
                className={miniInputCls} placeholder="Texto"
                value={c.label}
                onChange={(e) => onChange({ ...link, children: children.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)) })}
              />
              <input
                className={miniInputCls} placeholder="#seccion o URL"
                value={c.url}
                onChange={(e) => onChange({ ...link, children: children.map((x, xi) => (xi === i ? { ...x, url: e.target.value } : x)) })}
              />
              <button
                type="button"
                onClick={() => onChange({ ...link, children: children.filter((_, xi) => xi !== i) })}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...link, children: [...children, { id: newId(), label: "", url: "" }] })}
            className="flex items-center gap-1 self-start rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:border-primary"
          >
            <Plus className="h-3 w-3" /> Agregar al submenú
          </button>
        </div>
      )}
    </div>
  );
}

function LinkListEditor({
  links, onChange, allowChildren,
}: {
  links: NavLink[]; onChange: (links: NavLink[]) => void; allowChildren?: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = links.findIndex((l) => l.id === active.id);
    const to = links.findIndex((l) => l.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(links, from, to));
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {links.map((l) => (
              <SortableLinkRow
                key={l.id} id={l.id} link={l} allowChildren={allowChildren}
                onChange={(next) => onChange(links.map((x) => (x.id === l.id ? next : x)))}
                onRemove={() => onChange(links.filter((x) => x.id !== l.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={() => onChange([...links, { id: newId(), label: "Nuevo enlace", url: "#" }])}
        className="flex items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="h-3 w-3" /> Agregar enlace
      </button>
    </div>
  );
}

const NAV_SIZES: { id: NavSize; label: string }[] = [
  { id: "compact", label: "Compacto" }, { id: "normal", label: "Normal" }, { id: "large", label: "Grande" },
];
const NAV_LAYOUTS: { id: NavLayout; label: string }[] = [
  { id: "left", label: "Logo a la izquierda" }, { id: "center", label: "Logo centrado" },
];
const MOBILE_STYLES: { id: MobileNavStyle; label: string }[] = [
  { id: "drawer", label: "Panel lateral" }, { id: "dropdown", label: "Desplegable" },
];
const FOOTER_SIZES: { id: FooterSize; label: string }[] = [
  { id: "compact", label: "Compacto" }, { id: "normal", label: "Normal" }, { id: "spacious", label: "Espacioso" },
];

export function NavEditor({ nav, onChange }: { nav: NavConfig; onChange: (n: NavConfig) => void }) {
  const set = (patch: Partial<NavConfig>) => onChange({ ...nav, ...patch });
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Tamaño del menú</p>
        <SegButtons value={nav.size} options={NAV_SIZES} onChange={(v) => set({ size: v })} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Posición del logo</p>
        <SegButtons value={nav.layout} options={NAV_LAYOUTS} onChange={(v) => set({ layout: v })} cols={2} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Menú móvil (menú hamburguesa)</p>
        <SegButtons value={nav.mobileStyle} options={MOBILE_STYLES} onChange={(v) => set({ mobileStyle: v })} cols={2} />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button" onClick={() => set({ showLogo: !nav.showLogo })}
          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium ${nav.showLogo ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
        >
          {nav.showLogo ? "Logo visible" : "Logo oculto"}
        </button>
        <button
          type="button" onClick={() => set({ sticky: !nav.sticky })}
          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium ${nav.sticky ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
        >
          {nav.sticky ? "Fijo al hacer scroll" : "No fijo"}
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Enlaces del menú <span className="opacity-60">· arrastra para reordenar · el ícono abre submenús</span>
        </p>
        <LinkListEditor links={nav.links} onChange={(links) => set({ links })} allowChildren />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Botón del menú (opcional)">
          <input className={inputCls} value={nav.ctaText ?? ""} onChange={(e) => set({ ctaText: e.target.value })} placeholder="Ej. Contáctanos" />
        </Field>
        <Field label="Enlace del botón">
          <input className={inputCls} value={nav.ctaUrl ?? ""} onChange={(e) => set({ ctaUrl: e.target.value })} placeholder="#contacto" />
        </Field>
      </div>
    </div>
  );
}

export function FooterEditor({ footer, onChange }: {
  footer: FooterConfig; onChange: (f: FooterConfig) => void;
}) {
  const set = (patch: Partial<FooterConfig>) => onChange({ ...footer, ...patch });
  const columns = footer.columns;

  function setColumn(id: string, patch: Partial<FooterConfig["columns"][number]>) {
    set({ columns: columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Estilo</p>
        <SegButtons
          value={footer.variant}
          options={[{ id: "columns", label: "Columnas" }, { id: "simple", label: "Simple, centrado" }]}
          onChange={(v) => set({ variant: v })}
          cols={2}
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Espaciado</p>
        <SegButtons value={footer.size} options={FOOTER_SIZES} onChange={(v) => set({ size: v })} />
      </div>

      <Field label="Frase corta (opcional)">
        <textarea rows={2} className={inputCls} value={footer.tagline ?? ""} onChange={(e) => set({ tagline: e.target.value })} />
      </Field>

      <div className="flex items-center gap-2">
        <button
          type="button" onClick={() => set({ showLogo: !footer.showLogo })}
          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium ${footer.showLogo ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
        >
          {footer.showLogo ? "Logo visible" : "Logo oculto"}
        </button>
        <button
          type="button" onClick={() => set({ showContact: !footer.showContact })}
          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium ${footer.showContact ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
        >
          {footer.showContact ? "Contacto visible" : "Contacto oculto"}
        </button>
        <button
          type="button" onClick={() => set({ showSocial: !footer.showSocial })}
          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium ${footer.showSocial ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
        >
          {footer.showSocial ? "Redes visibles" : "Redes ocultas"}
        </button>
      </div>

      {footer.variant === "columns" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">Columnas de enlaces</p>
          {columns.map((col) => (
            <div key={col.id} className="rounded-lg border border-border p-2.5">
              <div className="mb-2 flex items-center gap-1.5">
                <input
                  className={`${miniInputCls} font-semibold`}
                  value={col.title}
                  onChange={(e) => setColumn(col.id, { title: e.target.value })}
                  placeholder="Título de la columna"
                />
                <button
                  type="button"
                  onClick={() => set({ columns: columns.filter((c) => c.id !== col.id) })}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <LinkListEditor links={col.links} onChange={(links) => setColumn(col.id, { links })} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => set({ columns: [...columns, { id: newId(), title: "Nueva columna", links: [] }] })}
            className="flex items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-3 w-3" /> Agregar columna
          </button>
        </div>
      )}

      <Field label="Texto extra en el copyright (opcional)">
        <input className={inputCls} value={footer.copyrightExtra ?? ""} onChange={(e) => set({ copyrightExtra: e.target.value })} placeholder="Ej. Hecho con cariño en Bogotá" />
      </Field>
    </div>
  );
}
