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

/**
 * Per-element style overrides. Every addressable piece of a section (its
 * heading, its lede, its button, its image) can carry one of these; the
 * renderer composes template DNA → section style → element override, so an
 * override only has to specify what it actually changes.
 *
 * A superset across all element kinds — the inspector shows only the
 * controls that apply to the selected element (see ELEMENT_KIND).
 */
export interface ElementStyle {
  // Typography (text + button elements)
  fontFamily?: "heading" | "body";
  fontSize?: number;        // px
  fontWeight?: string;
  lineHeight?: number;      // unitless multiplier
  letterSpacing?: number;   // em
  color?: string;
  align?: "left" | "center" | "right";
  textTransform?: "none" | "uppercase";
  // Box
  marginTop?: number;       // px
  marginBottom?: number;    // px
  // Free-form drag offset (px, relative to template position)
  offsetX?: number;
  offsetY?: number;
  // Button / media
  bg?: string;
  radius?: number;          // px
  // Per-breakpoint visibility
  hideDesktop?: boolean;
  hideTablet?: boolean;
  hideMobile?: boolean;
}

/** Stable, finite set of addressable elements within a section. */
export type ElementKey =
  | "eyebrow"
  | "heading"
  | "subheading"
  | "body"
  | "cta"
  | "media"
  | "items.title"
  | "items.body"
  | "items.price";

export type ElementKind = "text" | "button" | "media";

export const ELEMENT_KIND: Record<ElementKey, ElementKind> = {
  eyebrow: "text",
  heading: "text",
  subheading: "text",
  body: "text",
  cta: "button",
  media: "media",
  "items.title": "text",
  "items.body": "text",
  "items.price": "text",
};

export const ELEMENT_LABELS: Record<ElementKey, string> = {
  eyebrow: "Etiqueta",
  heading: "Título",
  subheading: "Frase de apoyo",
  body: "Texto",
  cta: "Botón",
  media: "Imagen",
  "items.title": "Título de los elementos",
  "items.body": "Texto de los elementos",
  "items.price": "Precio de los elementos",
};

export interface Section {
  id: string;
  type: SectionType;
  variant: string;
  enabled: boolean;
  /** Keyed by ElementKey. Absent = render exactly as the template dictates. */
  elements?: Partial<Record<ElementKey, ElementStyle>>;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
  media?: MediaRef;
  items?: SectionItem[];
  style?: SectionStyle;
  /**
   * Internal team note — never reaches render.ts and is never sent to the
   * public /demo/[slug] route. Purely for handoff between whoever is
   * building the demo and whoever reviews or takes over.
   */
  notes?: string;
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
  /** Global vertical rhythm multiplier applied on top of the template's. */
  density?: "compact" | "normal" | "spacious";
  /** Treatment applied to every in-section image (logos are excluded). */
  imageStyle?: "normal" | "grayscale" | "duotone" | "soft";
}

export interface NavLink {
  id: string;
  label: string;
  url: string;
  /**
   * When set, this link targets another DemoPage by id instead of `url`.
   * Resolved to a relative "./slug" href at render time so it works
   * regardless of the demo's own slug. `url` is kept as a fallback for
   * single-page demos and is ignored once `page` is set.
   */
  page?: string;
  children?: NavLink[]; // submenu / dropdown items
}

export type NavSize = "compact" | "normal" | "large";
export type NavLayout = "left" | "center";
export type MobileNavStyle = "drawer" | "dropdown";

export interface NavConfig {
  showLogo: boolean;
  sticky: boolean;
  size: NavSize;
  layout: NavLayout;
  links: NavLink[];
  ctaText?: string;
  ctaUrl?: string;
  mobileStyle: MobileNavStyle;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: NavLink[];
}

export type FooterSize = "compact" | "normal" | "spacious";

export interface FooterConfig {
  variant: "simple" | "columns";
  size: FooterSize;
  showLogo: boolean;
  tagline?: string;
  columns: FooterColumn[];
  showContact: boolean;
  showSocial: boolean;
  copyrightExtra?: string;
}

export type CanvasElementKind = "text" | "image" | "button" | "logo";

export interface CanvasElement {
  id: string;
  kind: CanvasElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  media?: MediaRef;
  url?: string;
  style?: ElementStyle;
  zIndex?: number;
}

export interface DemoPage {
  id: string;
  /** URL segment. "" is the home page, served at the demo's own root. */
  slug: string;
  title: string;
  sections: Section[];
  canvasElements?: CanvasElement[];
}

export type BriefGoal = "leads" | "sales" | "credibility" | "bookings";
export type BriefTone = "cercano" | "profesional" | "premium" | "atrevido";

/** Answers collected before the first edit, used to tailor the builder's
 *  coaching to this specific business instead of generic web advice. */
export interface DemoBrief {
  industry?: string;
  goal?: BriefGoal;
  audience?: string;
  tone?: BriefTone;
  differentiator?: string;
}

export interface DemoConfig {
  template: string;
  fontPair: string;
  brand: Brand;
  /**
   * The home page's sections. Kept as the single source of truth for
   * single-page demos (the overwhelming majority) and mirrored to
   * `pages[0].sections` whenever `pages` is present, so every older
   * caller that only knows about a flat `sections` list — nav-link
   * defaults, the design advisor's per-page view, demo creation — keeps
   * working without modification.
   */
  sections: Section[];
  /** Present only for demos with more than one page. */
  pages?: DemoPage[];
  customCss?: string;
  nav?: NavConfig;
  footer?: FooterConfig;
  /** Pre-build answers. Absent on demos created before the brief existed. */
  brief?: DemoBrief;
  /**
   * Pages imported in "diseño original" mode: their own HTML and CSS,
   * preserved instead of converted to `Section`s. Keyed by page slug (""
   * for home), matching the `slug` of the corresponding entry in `pages`.
   *
   * A page with an entry here ignores `sections` entirely at render time —
   * see `renderDemo`'s early branch and the public route. Present only on
   * demos imported with fidelity as the priority; absent otherwise, so
   * every caller that only knows sections keeps working unmodified.
   */
  verbatim?: Record<string, { html: string; css: string }>;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function defaultPages(sections: Section[]): DemoPage[] {
  return [{ id: newId(), slug: "", title: "Inicio", sections }];
}

export function defaultNav(): NavConfig {
  return { showLogo: true, sticky: true, size: "normal", layout: "left", links: [], ctaText: "", ctaUrl: "", mobileStyle: "drawer" };
}

export function defaultFooter(): FooterConfig {
  return {
    variant: "columns",
    size: "normal",
    showLogo: true,
    tagline: "",
    columns: [{ id: newId(), title: "Enlaces", links: [] }],
    showContact: true,
    showSocial: true,
    copyrightExtra: "",
  };
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

// Shared between the renderer (building href="#id") and the nav/footer
// default builders (seeding link labels from whatever sections exist).
export const SECTION_ANCHORS: Partial<Record<SectionType, [string, string]>> = {
  features: ["servicios", "Servicios"],
  gallery: ["galeria", "Galería"],
  video: ["video", "Video"],
  about: ["nosotros", "Nosotros"],
  testimonials: ["testimonios", "Testimonios"],
  menu: ["menu", "Menú"],
  faq: ["preguntas", "Preguntas"],
  stats: ["cifras", "Cifras"],
  team: ["equipo", "Equipo"],
  logos: ["clientes", "Clientes"],
  contact: ["contacto", "Contacto"],
};

export function defaultNavLinks(sections: Section[]): NavLink[] {
  return sections
    .filter((s) => s.enabled && SECTION_ANCHORS[s.type])
    .map((s) => {
      const [anchor, label] = SECTION_ANCHORS[s.type]!;
      return { id: newId(), label, url: `#${anchor}` };
    });
}

export const WIDTH_LABELS: Record<SectionWidth, string> = {
  narrow: "Angosto", normal: "Normal", wide: "Ancho", full: "Completo",
};
export const PAD_LABELS: Record<SectionPad, string> = {
  compact: "Compacto", normal: "Normal", spacious: "Espacioso",
};
