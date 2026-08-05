export type SectionType =
  | "hero"
  | "features"
  | "gallery"
  | "video"
  | "about"
  | "testimonials"
  | "menu"
  | "faq"
  | "stats"
  | "team"
  | "logos"
  | "banner"
  | "divider"
  | "columns"
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

export type SectionWidth = "narrow" | "normal" | "wide" | "full";
export type SectionPad = "compact" | "normal" | "spacious";
export type SectionAlign = "left" | "center";

export interface SectionStyle {
  bg?: string; // overrides brand.paper for this section only, "" = inherit
  width?: SectionWidth;
  pad?: SectionPad;
  align?: SectionAlign;
  overlay?: number; // 0-100, darkens a background image (hero/banner)
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
  style?: SectionStyle;
}

export type ButtonShape = "pill" | "rounded" | "sharp";
export type ButtonFill = "solid" | "outline";

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
  buttonShape?: ButtonShape;
  buttonFill?: ButtonFill;
}

export interface DemoConfig {
  template: string;
  fontPair: string;
  brand: Brand;
  sections: Section[];
  customCss?: string;
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
  faq: "Preguntas frecuentes",
  stats: "Cifras destacadas",
  team: "Equipo",
  logos: "Logos de clientes",
  banner: "Anuncio / Franja",
  divider: "Separador",
  columns: "Texto libre",
  cta: "Llamado a la acción",
  contact: "Contacto",
};

export const SECTION_CATEGORIES: { label: string; types: SectionType[] }[] = [
  { label: "Estructura", types: ["hero", "banner", "divider", "columns"] },
  { label: "Contenido", types: ["features", "about", "gallery", "video", "team", "faq", "stats"] },
  { label: "Confianza", types: ["testimonials", "logos"] },
  { label: "Ventas", types: ["menu", "cta", "contact"] },
];

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
    { id: "grid4", label: "4 columnas" },
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
  faq: [
    { id: "list", label: "Lista simple" },
    { id: "twocol", label: "Dos columnas" },
  ],
  stats: [
    { id: "row", label: "Fila de cifras" },
    { id: "cards", label: "Tarjetas" },
  ],
  team: [
    { id: "grid", label: "Rejilla de perfiles" },
    { id: "rows", label: "Filas con bio" },
  ],
  logos: [
    { id: "row", label: "Fila" },
    { id: "grid", label: "Rejilla" },
  ],
  banner: [
    { id: "solid", label: "Franja de color" },
    { id: "image", label: "Con imagen de fondo" },
  ],
  divider: [
    { id: "line", label: "Línea simple" },
    { id: "space", label: "Solo espacio" },
  ],
  columns: [
    { id: "two", label: "Dos columnas de texto" },
    { id: "three", label: "Tres columnas de texto" },
    { id: "single", label: "Una columna" },
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

export const WIDTH_LABELS: Record<SectionWidth, string> = {
  narrow: "Angosto", normal: "Normal", wide: "Ancho", full: "Completo",
};
export const PAD_LABELS: Record<SectionPad, string> = {
  compact: "Compacto", normal: "Normal", spacious: "Espacioso",
};
