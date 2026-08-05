import type { DemoConfig, Section } from "./types";
import { newId } from "./types";

export interface Template {
  id: string;
  name: string;
  description: string;
  bestFor: string;
  swatch: [string, string, string];
  defaultFontPair: string;
  // Design DNA — what actually makes each template structurally different.
  dna: {
    // Vertical rhythm between sections
    sectionPadY: string;
    // Max content width
    maxWidth: string;
    // Heading scale (clamp min/max in rem)
    h1: string;
    h2: string;
    // Corner treatment: sharp editorial vs soft friendly
    radius: string;
    // Does the template use full-bleed edges or contained cards
    surface: "flat" | "card" | "bordered";
    // Eyebrow label treatment above headings
    eyebrow: "rule" | "caps" | "none";
    // Section headings left-aligned (editorial) or centered (marketing)
    align: "left" | "center";
    // Image treatment
    imageRadius: string;
  };
  defaults: () => DemoConfig;
}

function baseSections(overrides: Partial<Record<string, Partial<Section>>> = {}): Section[] {
  const mk = (s: Section): Section => ({ ...s, ...(overrides[s.type] ?? {}) });
  return [
    mk({
      id: newId(), type: "hero", variant: "split", enabled: true,
      eyebrow: "", heading: "", subheading: "",
      ctaText: "Contáctanos", ctaUrl: "#contacto",
    }),
    mk({
      id: newId(), type: "features", variant: "grid3", enabled: true,
      eyebrow: "Servicios", heading: "Lo que hacemos", body: "",
      items: [
        { title: "Servicio uno", body: "Describe aquí el primer servicio que ofreces." },
        { title: "Servicio dos", body: "Describe aquí el segundo servicio que ofreces." },
        { title: "Servicio tres", body: "Describe aquí el tercer servicio que ofreces." },
      ],
    }),
    mk({
      id: newId(), type: "gallery", variant: "masonry", enabled: false,
      eyebrow: "Galería", heading: "Nuestro trabajo", items: [],
    }),
    mk({
      id: newId(), type: "video", variant: "framed", enabled: false,
      eyebrow: "", heading: "Míralo en acción", body: "",
    }),
    mk({
      id: newId(), type: "about", variant: "split", enabled: true,
      eyebrow: "Nosotros", heading: "Quiénes somos",
      body: "Cuenta aquí la historia del negocio: cuánto tiempo llevan, qué los hace distintos y por qué un cliente debería confiar en ustedes.",
    }),
    mk({
      id: newId(), type: "testimonials", variant: "cards", enabled: false,
      eyebrow: "Testimonios", heading: "Lo que dicen nuestros clientes",
      items: [
        { body: "Excelente servicio, superaron mis expectativas.", author: "Cliente satisfecho", role: "" },
      ],
    }),
    mk({
      id: newId(), type: "stats", variant: "row", enabled: false,
      eyebrow: "", heading: "",
      items: [
        { title: "10+", body: "Años de experiencia" },
        { title: "200+", body: "Clientes atendidos" },
        { title: "98%", body: "Satisfacción" },
      ],
    }),
    mk({
      id: newId(), type: "logos", variant: "row", enabled: false,
      eyebrow: "Confían en nosotros", heading: "", items: [],
    }),
    mk({
      id: newId(), type: "team", variant: "grid", enabled: false,
      eyebrow: "Equipo", heading: "Quiénes te van a atender",
      items: [
        { title: "Nombre Apellido", body: "Cargo o especialidad" },
      ],
    }),
    mk({
      id: newId(), type: "faq", variant: "list", enabled: false,
      eyebrow: "Preguntas frecuentes", heading: "¿Tienes dudas?",
      items: [
        { title: "¿Cómo empiezo?", body: "Escríbenos y coordinamos una primera llamada sin costo." },
        { title: "¿Cuánto tarda?", body: "Depende del proyecto, normalmente entre 2 y 6 semanas." },
      ],
    }),
    mk({
      id: newId(), type: "banner", variant: "solid", enabled: false,
      heading: "Oferta por tiempo limitado",
      body: "Aprovecha antes de que termine el mes.",
      ctaText: "Ver más", ctaUrl: "#contacto",
    }),
    mk({
      id: newId(), type: "columns", variant: "two", enabled: false,
      heading: "",
      items: [
        { title: "Nuestra misión", body: "Escribe aquí el primer bloque de texto libre." },
        { title: "Nuestra visión", body: "Escribe aquí el segundo bloque de texto libre." },
      ],
    }),
    mk({
      id: newId(), type: "divider", variant: "line", enabled: false,
    }),
    mk({
      id: newId(), type: "menu", variant: "list", enabled: false,
      eyebrow: "Precios", heading: "Nuestros planes", items: [],
    }),
    mk({
      id: newId(), type: "cta", variant: "band", enabled: true,
      heading: "¿Listo para empezar?",
      body: "Escríbenos hoy y recibe una asesoría sin costo.",
      ctaText: "Hablemos", ctaUrl: "#contacto",
    }),
    mk({
      id: newId(), type: "contact", variant: "split", enabled: true,
      eyebrow: "Contacto", heading: "Hablemos",
      body: "Estamos listos para atenderte.",
    }),
  ];
}

export const TEMPLATES: Template[] = [
  {
    id: "editorial",
    name: "Editorial",
    description: "Tipografía grande, mucho aire, alineado a la izquierda. Se lee como una revista, no como una plantilla.",
    bestFor: "Consultoría · Despachos · B2B · Servicios profesionales",
    swatch: ["#1c1917", "#f5f5f4", "#b45309"],
    defaultFontPair: "editorial",
    dna: {
      sectionPadY: "clamp(72px, 11vw, 140px)",
      maxWidth: "1080px",
      h1: "clamp(2.6rem, 7vw, 5.2rem)",
      h2: "clamp(1.9rem, 3.6vw, 3rem)",
      radius: "2px",
      surface: "flat",
      eyebrow: "rule",
      align: "left",
      imageRadius: "2px",
    },
    defaults: () => ({
      template: "editorial",
      fontPair: "editorial",
      brand: { name: "", accent: "#b45309", ink: "#1c1917", paper: "#faf9f7", buttonShape: "pill", buttonFill: "solid" },
      customCss: "",
      sections: baseSections(),
    }),
  },
  {
    id: "studio",
    name: "Studio",
    description: "Oscuro, contrastado, imágenes a sangre. Estética de portafolio creativo.",
    bestFor: "Agencias · Fotografía · Arquitectura · Diseño",
    swatch: ["#0a0a0a", "#fafafa", "#22d3ee"],
    defaultFontPair: "modern",
    dna: {
      sectionPadY: "clamp(80px, 12vw, 160px)",
      maxWidth: "1240px",
      h1: "clamp(2.8rem, 8vw, 6rem)",
      h2: "clamp(2rem, 4vw, 3.4rem)",
      radius: "0px",
      surface: "flat",
      eyebrow: "caps",
      align: "left",
      imageRadius: "0px",
    },
    defaults: () => ({
      template: "studio",
      fontPair: "modern",
      brand: { name: "", accent: "#22d3ee", ink: "#fafafa", paper: "#0a0a0a", buttonShape: "sharp", buttonFill: "solid" },
      customCss: "",
      sections: baseSections({ hero: { variant: "cover" }, gallery: { enabled: true, variant: "masonry" } }),
    }),
  },
  {
    id: "boutique",
    name: "Boutique",
    description: "Serif refinada, paleta suave, mucho espacio en blanco. Se siente caro.",
    bestFor: "Moda · Joyería · Inmobiliaria · Spa · Lujo",
    swatch: ["#44403c", "#faf7f2", "#a8a29e"],
    defaultFontPair: "refined",
    dna: {
      sectionPadY: "clamp(88px, 13vw, 170px)",
      maxWidth: "1120px",
      h1: "clamp(2.4rem, 6vw, 4.6rem)",
      h2: "clamp(1.8rem, 3.4vw, 2.8rem)",
      radius: "0px",
      surface: "flat",
      eyebrow: "caps",
      align: "center",
      imageRadius: "0px",
    },
    defaults: () => ({
      template: "boutique",
      fontPair: "refined",
      brand: { name: "", accent: "#8a7358", ink: "#44403c", paper: "#faf7f2", buttonShape: "sharp", buttonFill: "outline" },
      customCss: "",
      sections: baseSections({ hero: { variant: "stack" }, gallery: { enabled: true, variant: "grid2" } }),
    }),
  },
  {
    id: "mercado",
    name: "Mercado",
    description: "Cálido, denso, con fotos de producto. Pensado para vender comida y productos físicos.",
    bestFor: "Restaurantes · Panaderías · Tiendas · Comida",
    swatch: ["#7c2d12", "#fffbf5", "#ea580c"],
    defaultFontPair: "warm",
    dna: {
      sectionPadY: "clamp(60px, 9vw, 110px)",
      maxWidth: "1140px",
      h1: "clamp(2.4rem, 6.5vw, 4.4rem)",
      h2: "clamp(1.8rem, 3.4vw, 2.7rem)",
      radius: "18px",
      surface: "card",
      eyebrow: "caps",
      align: "center",
      imageRadius: "16px",
    },
    defaults: () => ({
      template: "mercado",
      fontPair: "warm",
      brand: { name: "", accent: "#ea580c", ink: "#431407", paper: "#fffbf5", buttonShape: "pill", buttonFill: "solid" },
      customCss: "",
      sections: baseSections({
        hero: { variant: "cover" },
        menu: { enabled: true, variant: "cards" },
        gallery: { enabled: true, variant: "carousel" },
      }),
    }),
  },
  {
    id: "impulso",
    name: "Impulso",
    description: "Mayúsculas pesadas, bloques de color, alto contraste. Energía y urgencia.",
    bestFor: "Gimnasios · Eventos · Deportes · Coaching",
    swatch: ["#18181b", "#fafafa", "#84cc16"],
    defaultFontPair: "bold",
    dna: {
      sectionPadY: "clamp(64px, 10vw, 130px)",
      maxWidth: "1160px",
      h1: "clamp(2.8rem, 9vw, 6.4rem)",
      h2: "clamp(2rem, 4.4vw, 3.6rem)",
      radius: "4px",
      surface: "bordered",
      eyebrow: "caps",
      align: "left",
      imageRadius: "4px",
    },
    defaults: () => ({
      template: "impulso",
      fontPair: "bold",
      brand: { name: "", accent: "#84cc16", ink: "#18181b", paper: "#fafafa", buttonShape: "sharp", buttonFill: "solid" },
      customCss: "",
      sections: baseSections({ hero: { variant: "offset" }, menu: { enabled: true, variant: "tiers" } }),
    }),
  },
  {
    id: "clinica",
    name: "Clínica",
    description: "Ordenado, tranquilo, azules suaves. Transmite competencia y confianza.",
    bestFor: "Salud · Odontología · Legal · Contabilidad · Educación",
    swatch: ["#0f172a", "#f8fafc", "#0284c7"],
    defaultFontPair: "friendly",
    dna: {
      sectionPadY: "clamp(64px, 9vw, 120px)",
      maxWidth: "1100px",
      h1: "clamp(2.2rem, 5.5vw, 3.8rem)",
      h2: "clamp(1.7rem, 3.2vw, 2.5rem)",
      radius: "14px",
      surface: "card",
      eyebrow: "caps",
      align: "center",
      imageRadius: "12px",
    },
    defaults: () => ({
      template: "clinica",
      fontPair: "friendly",
      brand: { name: "", accent: "#0284c7", ink: "#0f172a", paper: "#f8fafc", buttonShape: "rounded", buttonFill: "solid" },
      customCss: "",
      sections: baseSections({ hero: { variant: "split" }, testimonials: { enabled: true } }),
    }),
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
