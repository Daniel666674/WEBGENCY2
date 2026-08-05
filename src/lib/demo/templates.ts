import type { DemoConfig, Section } from "./types";
import { newId, defaultNav, defaultFooter, defaultNavLinks } from "./types";

function navFooterFor(sections: Section[]): Pick<DemoConfig, "nav" | "footer"> {
  const links = defaultNavLinks(sections);
  return {
    nav: { ...defaultNav(), links },
    footer: { ...defaultFooter(), columns: [{ id: newId(), title: "Enlaces", links }] },
  };
}

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
    // Background treatment behind everything — the biggest lever for making
    // templates read as visually distinct rather than reskins of each other.
    texture: "none" | "grid" | "dots" | "gradient" | "noise";
    // Section border/divider style
    divider: "none" | "hairline" | "thick";
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
      texture: "none",
      divider: "hairline",
    },
    defaults: () => {
      const sections = baseSections();
      return {
        template: "editorial",
        fontPair: "editorial",
        brand: { name: "", accent: "#b45309", ink: "#1c1917", paper: "#faf9f7", buttonShape: "pill", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
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
      texture: "noise",
      divider: "none",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "cover" }, gallery: { enabled: true, variant: "masonry" } });
      return {
        template: "studio",
        fontPair: "modern",
        brand: { name: "", accent: "#22d3ee", ink: "#fafafa", paper: "#0a0a0a", buttonShape: "sharp", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
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
      texture: "none",
      divider: "none",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "stack" }, gallery: { enabled: true, variant: "grid2" } });
      return {
        template: "boutique",
        fontPair: "refined",
        brand: { name: "", accent: "#8a7358", ink: "#44403c", paper: "#faf7f2", buttonShape: "sharp", buttonFill: "outline" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
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
      texture: "dots",
      divider: "none",
    },
    defaults: () => {
      const sections = baseSections({
        hero: { variant: "cover" },
        menu: { enabled: true, variant: "cards" },
        gallery: { enabled: true, variant: "carousel" },
      });
      return {
        template: "mercado",
        fontPair: "warm",
        brand: { name: "", accent: "#ea580c", ink: "#431407", paper: "#fffbf5", buttonShape: "pill", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
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
      texture: "grid",
      divider: "thick",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "offset" }, menu: { enabled: true, variant: "tiers" } });
      return {
        template: "impulso",
        fontPair: "bold",
        brand: { name: "", accent: "#84cc16", ink: "#18181b", paper: "#fafafa", buttonShape: "sharp", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
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
      texture: "none",
      divider: "hairline",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "split" }, testimonials: { enabled: true } });
      return {
        template: "clinica",
        fontPair: "friendly",
        brand: { name: "", accent: "#0284c7", ink: "#0f172a", paper: "#f8fafc", buttonShape: "rounded", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
  {
    id: "brutal",
    name: "Brutalista",
    description: "Blanco y negro puro, bordes gruesos, tipografía enorme sin decoración. Nada de sombras suaves.",
    bestFor: "Streetwear · Música · Arte · Marcas culturales",
    swatch: ["#000000", "#ffffff", "#ff2d00"],
    defaultFontPair: "brutalist",
    dna: {
      sectionPadY: "clamp(48px, 8vw, 96px)",
      maxWidth: "1200px",
      h1: "clamp(3rem, 10vw, 7.5rem)",
      h2: "clamp(2.2rem, 5vw, 4rem)",
      radius: "0px",
      surface: "bordered",
      eyebrow: "none",
      align: "left",
      imageRadius: "0px",
      texture: "none",
      divider: "thick",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "offset" }, gallery: { enabled: true, variant: "grid2" } });
      return {
        template: "brutal",
        fontPair: "brutalist",
        brand: { name: "", accent: "#ff2d00", ink: "#000000", paper: "#ffffff", buttonShape: "sharp", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Oscuro y sofisticado con acentos neón. Grid punteado de fondo. Tecnología con actitud.",
    bestFor: "SaaS · Gaming · Web3 · Tech de consumo",
    swatch: ["#09090b", "#fafafa", "#a855f7"],
    defaultFontPair: "technical",
    dna: {
      sectionPadY: "clamp(72px, 10vw, 130px)",
      maxWidth: "1200px",
      h1: "clamp(2.6rem, 7vw, 5rem)",
      h2: "clamp(1.9rem, 3.8vw, 3.1rem)",
      radius: "16px",
      surface: "card",
      eyebrow: "caps",
      align: "left",
      imageRadius: "16px",
      texture: "grid",
      divider: "none",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "cover" }, stats: { enabled: true } });
      return {
        template: "midnight",
        fontPair: "technical",
        brand: { name: "", accent: "#a855f7", ink: "#fafafa", paper: "#09090b", buttonShape: "rounded", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
  {
    id: "pastel",
    name: "Pastel",
    description: "Colores suaves, esquinas muy redondeadas, todo se siente amable. Ideal para audiencias jóvenes.",
    bestFor: "Guarderías · Juguetes · Apps para niños · Wellness ligero",
    swatch: ["#78350f", "#fff7ed", "#fb923c"],
    defaultFontPair: "playful",
    dna: {
      sectionPadY: "clamp(56px, 8vw, 100px)",
      maxWidth: "1080px",
      h1: "clamp(2.4rem, 6vw, 4.2rem)",
      h2: "clamp(1.7rem, 3.2vw, 2.6rem)",
      radius: "28px",
      surface: "card",
      eyebrow: "caps",
      align: "center",
      imageRadius: "24px",
      texture: "dots",
      divider: "none",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "stack" }, team: { enabled: true, variant: "grid" } });
      return {
        template: "pastel",
        fontPair: "playful",
        brand: { name: "", accent: "#fb923c", ink: "#78350f", paper: "#fff7ed", buttonShape: "pill", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
  {
    id: "terracotta",
    name: "Terracota",
    description: "Tierra, cerámica, artesanal. Tonos cálidos apagados con textura de grano sutil.",
    bestFor: "Cerámica · Decoración · Yoga · Productos naturales",
    swatch: ["#431407", "#fdf4e9", "#c2703d"],
    defaultFontPair: "vintage",
    dna: {
      sectionPadY: "clamp(72px, 10vw, 130px)",
      maxWidth: "1080px",
      h1: "clamp(2.4rem, 6vw, 4.4rem)",
      h2: "clamp(1.8rem, 3.2vw, 2.7rem)",
      radius: "6px",
      surface: "flat",
      eyebrow: "rule",
      align: "left",
      imageRadius: "6px",
      texture: "noise",
      divider: "hairline",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "split" }, about: { variant: "stat", enabled: true } });
      return {
        template: "terracotta",
        fontPair: "vintage",
        brand: { name: "", accent: "#c2703d", ink: "#431407", paper: "#fdf4e9", buttonShape: "rounded", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
  {
    id: "mono",
    name: "Monocromo",
    description: "Un solo color, todo en escala de grises con un acento tenue. Extremadamente calmado.",
    bestFor: "Estudios de diseño · Fotografía de autor · Portafolios",
    swatch: ["#171717", "#fafafa", "#737373"],
    defaultFontPair: "minimal-jp",
    dna: {
      sectionPadY: "clamp(96px, 14vw, 180px)",
      maxWidth: "980px",
      h1: "clamp(2.2rem, 5.5vw, 4rem)",
      h2: "clamp(1.6rem, 3vw, 2.4rem)",
      radius: "0px",
      surface: "flat",
      eyebrow: "none",
      align: "left",
      imageRadius: "0px",
      texture: "none",
      divider: "hairline",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "stack" }, features: { variant: "numbered" } });
      return {
        template: "mono",
        fontPair: "minimal-jp",
        brand: { name: "", accent: "#737373", ink: "#171717", paper: "#fafafa", buttonShape: "sharp", buttonFill: "outline" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
  {
    id: "corporate",
    name: "Corporativo",
    description: "Azul institucional, grid ordenado, tarjetas con sombra ligera. Serio pero accesible.",
    bestFor: "Bancos · Seguros · Legal · Contabilidad · B2B enterprise",
    swatch: ["#1e293b", "#ffffff", "#2563eb"],
    defaultFontPair: "corporate",
    dna: {
      sectionPadY: "clamp(64px, 9vw, 120px)",
      maxWidth: "1160px",
      h1: "clamp(2.2rem, 5vw, 3.6rem)",
      h2: "clamp(1.6rem, 3vw, 2.4rem)",
      radius: "10px",
      surface: "card",
      eyebrow: "caps",
      align: "left",
      imageRadius: "10px",
      texture: "none",
      divider: "none",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "split" }, logos: { enabled: true }, stats: { enabled: true } });
      return {
        template: "corporate",
        fontPair: "corporate",
        brand: { name: "", accent: "#2563eb", ink: "#1e293b", paper: "#ffffff", buttonShape: "rounded", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Gradiente cálido de fondo, formas suaves, energía positiva. Se siente optimista.",
    bestFor: "Eventos · Marcas de bienestar · Apps de estilo de vida",
    swatch: ["#7c2d12", "#fff1e6", "#f43f5e"],
    defaultFontPair: "handwritten",
    dna: {
      sectionPadY: "clamp(64px, 9vw, 120px)",
      maxWidth: "1080px",
      h1: "clamp(2.6rem, 6.5vw, 4.6rem)",
      h2: "clamp(1.8rem, 3.4vw, 2.8rem)",
      radius: "22px",
      surface: "card",
      eyebrow: "caps",
      align: "center",
      imageRadius: "20px",
      texture: "gradient",
      divider: "none",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "stack" }, testimonials: { enabled: true, variant: "single" } });
      return {
        template: "sunset",
        fontPair: "handwritten",
        brand: { name: "", accent: "#f43f5e", ink: "#7c2d12", paper: "#fff1e6", buttonShape: "pill", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
  {
    id: "newsroom",
    name: "Newsroom",
    description: "Columnas densas, tipografía condensada, mucho contenido visible a la vez. Estilo periódico digital.",
    bestFor: "Medios · Blogs · Cultura · Publicaciones",
    swatch: ["#18181b", "#f4f4f5", "#dc2626"],
    defaultFontPair: "condensed",
    dna: {
      sectionPadY: "clamp(48px, 7vw, 88px)",
      maxWidth: "1280px",
      h1: "clamp(2.4rem, 6vw, 4.4rem)",
      h2: "clamp(1.7rem, 3vw, 2.5rem)",
      radius: "2px",
      surface: "flat",
      eyebrow: "rule",
      align: "left",
      imageRadius: "2px",
      texture: "none",
      divider: "hairline",
    },
    defaults: () => {
      const sections = baseSections({ hero: { variant: "split" }, features: { variant: "grid4" } });
      return {
        template: "newsroom",
        fontPair: "condensed",
        brand: { name: "", accent: "#dc2626", ink: "#18181b", paper: "#f4f4f5", buttonShape: "sharp", buttonFill: "solid" },
        customCss: "",
        sections,
        ...navFooterFor(sections),
      };
    },
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
