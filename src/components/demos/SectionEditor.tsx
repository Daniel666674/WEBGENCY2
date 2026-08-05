"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { Section, SectionItem } from "@/lib/demo/types";
import { SECTION_VARIANTS } from "@/lib/demo/types";
import { MediaPicker } from "./MediaPicker";

const inputCls =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function SortableItem({
  id,
  children,
  onRemove,
}: {
  id: string;
  children: React.ReactNode;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-lg border border-border bg-card p-3"
    >
      <div className="mb-2.5 flex items-center gap-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastrar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 text-xs font-medium text-muted-foreground">Elemento</span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground hover:text-red-500"
          aria-label="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

export function SectionEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (s: Section) => void;
}) {
  const set = (patch: Partial<Section>) => onChange({ ...section, ...patch });
  const variants = SECTION_VARIANTS[section.type] ?? [];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const items = section.items ?? [];
  const setItems = (next: SectionItem[]) => set({ items: next });
  const patchItem = (i: number, patch: Partial<SectionItem>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = Number(active.id);
    const to = Number(over.id);
    setItems(arrayMove(items, from, to));
  }

  // Which fields this section type actually uses
  const usesItems = ["features", "gallery", "testimonials", "menu"].includes(section.type) ||
    (section.type === "about" && section.variant === "stat");
  const usesMedia = ["hero", "about", "video"].includes(section.type);
  const usesCta = ["hero", "cta", "contact", "menu"].includes(section.type);
  const usesSubheading = section.type === "hero";
  const usesBody = ["features", "about", "cta", "contact", "video", "gallery", "menu"].includes(section.type);

  const itemLabels: Record<string, { title: string; body: string }> = {
    features: { title: "Título del servicio", body: "Descripción" },
    gallery: { title: "Pie de foto (opcional)", body: "" },
    testimonials: { title: "", body: "Testimonio" },
    menu: { title: "Nombre", body: "Descripción" },
    about: { title: "Cifra (ej. 15+)", body: "Etiqueta (ej. Años de experiencia)" },
  };
  const lbl = itemLabels[section.type] ?? { title: "Título", body: "Texto" };

  return (
    <div className="flex flex-col gap-3.5">
      {variants.length > 1 && (
        <Field label="Diseño de esta sección">
          <div className="grid grid-cols-2 gap-1.5">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => set({ variant: v.id })}
                className={`rounded-md border px-2.5 py-2 text-xs font-medium transition-colors ${
                  section.variant === v.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {section.type !== "cta" && (
        <Field label="Etiqueta pequeña (arriba del título)">
          <input className={inputCls} value={section.eyebrow ?? ""} onChange={(e) => set({ eyebrow: e.target.value })} placeholder="Opcional" />
        </Field>
      )}

      <Field label={section.type === "hero" ? "Título principal" : "Título de la sección"}>
        <input className={inputCls} value={section.heading ?? ""} onChange={(e) => set({ heading: e.target.value })} />
      </Field>

      {usesSubheading && (
        <Field label="Frase de apoyo">
          <textarea rows={2} className={inputCls} value={section.subheading ?? ""} onChange={(e) => set({ subheading: e.target.value })} />
        </Field>
      )}

      {usesBody && (
        <Field label="Texto">
          <textarea rows={section.type === "about" ? 5 : 3} className={inputCls} value={section.body ?? ""} onChange={(e) => set({ body: e.target.value })} />
        </Field>
      )}

      {usesMedia && (
        <MediaPicker
          label={section.type === "video" ? "Video (archivo o enlace de YouTube/Vimeo)" : "Imagen"}
          accept={section.type === "video" ? "video" : "both"}
          value={section.media}
          onChange={(m) => set({ media: m })}
        />
      )}

      {usesCta && (
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Texto del botón">
            <input className={inputCls} value={section.ctaText ?? ""} onChange={(e) => set({ ctaText: e.target.value })} />
          </Field>
          <Field label="Enlace del botón">
            <input className={inputCls} value={section.ctaUrl ?? ""} onChange={(e) => set({ ctaUrl: e.target.value })} placeholder="#contacto" />
          </Field>
        </div>
      )}

      {usesItems && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Elementos <span className="opacity-60">· arrastra para reordenar</span>
            </label>
            <button
              type="button"
              onClick={() => setItems([...items, { title: "", body: "" }])}
              className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
            >
              <Plus className="h-3 w-3" /> Agregar
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((_, i) => String(i))} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {items.map((it, i) => (
                  <SortableItem key={i} id={String(i)} onRemove={() => setItems(items.filter((_, idx) => idx !== i))}>
                    <div className="flex flex-col gap-2.5">
                      {lbl.title && (
                        <input
                          className={inputCls}
                          placeholder={lbl.title}
                          value={it.title ?? ""}
                          onChange={(e) => patchItem(i, { title: e.target.value })}
                        />
                      )}
                      {lbl.body && (
                        <textarea
                          rows={2}
                          className={inputCls}
                          placeholder={lbl.body}
                          value={it.body ?? ""}
                          onChange={(e) => patchItem(i, { body: e.target.value })}
                        />
                      )}
                      {section.type === "menu" && (
                        <input
                          className={inputCls}
                          placeholder="Precio (ej. $45.000)"
                          value={it.price ?? ""}
                          onChange={(e) => patchItem(i, { price: e.target.value })}
                        />
                      )}
                      {section.type === "testimonials" && (
                        <div className="grid grid-cols-2 gap-2">
                          <input className={inputCls} placeholder="Nombre" value={it.author ?? ""} onChange={(e) => patchItem(i, { author: e.target.value })} />
                          <input className={inputCls} placeholder="Cargo / empresa" value={it.role ?? ""} onChange={(e) => patchItem(i, { role: e.target.value })} />
                        </div>
                      )}
                      {["gallery", "features", "menu"].includes(section.type) && (
                        <MediaPicker
                          compact
                          label=""
                          value={it.media}
                          onChange={(m) => patchItem(i, { media: m })}
                        />
                      )}
                    </div>
                  </SortableItem>
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border py-5 text-center text-xs text-muted-foreground">
                    Sin elementos. Presiona &ldquo;Agregar&rdquo;.
                  </p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
