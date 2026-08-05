export type SectionType =
  | "hero"
  | "features"
  | "gallery"
  | "video"
  | "about"
  | "testimonials"
  | "menu"
  | "cta"
  | "contact";

export interface MediaRef {
  url: string;
  alt?: string;
  kind: "image" | "video";
}

export interface SectionItem {
  title?: string;
  body?: string;
  media?: MediaRef;
  price?: string;
  author?: string;
  role?: string;
}

export interface Section {
  id: string;
  type: SectionType;
  variant: string;
  enabled: boolean;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
  media?: MediaRef;
  items?: SectionItem[];
}

export interface Brand {
  name: string;
  logo?: MediaRef;
  accent: string;
  ink: string;
  paper: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  instagram?: string;
}

export interface DemoConfig {
  template: string;
  fontPair: string;
  brand: Brand;
  sections: Section[];
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Portada",
  features: "Servicios",
  gallery: "Galería",
  video: "Video",
  about: "Nosotros",
  testimonials: "Testimonios",
  menu: "Menú / Precios",
  cta: "Llamado a la acción",
  contact: "Contacto",
};

// Layout variants available per section type. The label is what the
// non-technical user picks from; the id drives the renderer.
export const SECTION_VARIANTS: Record<SectionType, { id: string; label: string }[]> = {
  hero: [
    { id: "split", label: "Imagen al lado" },
    { id: "cover", label: "Imagen de fondo" },
    { id: "stack", label: "Centrado, sin imagen" },
    { id: "offset", label: "Texto grande + foto abajo" },
  ],
  features: [
    { id: "grid3", label: "3 columnas" },
    { id: "rows", label: "Filas con imagen" },
    { id: "numbered", label: "Lista numerada" },
  ],
  gallery: [
    { id: "masonry", label: "Mosaico" },
    { id: "carousel", label: "Tira horizontal" },
    { id: "grid2", label: "Rejilla 2x2" },
  ],
  video: [
    { id: "full", label: "Ancho completo" },
    { id: "framed", label: "Con marco y texto" },
  ],
  about: [
    { id: "split", label: "Texto + imagen" },
    { id: "centered", label: "Solo texto centrado" },
    { id: "stat", label: "Con cifras destacadas" },
  ],
  testimonials: [
    { id: "cards", label: "Tarjetas" },
    { id: "single", label: "Una cita grande" },
  ],
  menu: [
    { id: "list", label: "Lista con precios" },
    { id: "cards", label: "Tarjetas con foto" },
    { id: "tiers", label: "Planes / paquetes" },
  ],
  cta: [
    { id: "band", label: "Franja de color" },
    { id: "boxed", label: "Caja centrada" },
  ],
  contact: [
    { id: "split", label: "Datos + mapa" },
    { id: "inline", label: "Fila de botones" },
    { id: "card", label: "Tarjeta centrada" },
  ],
};
