// Single source of truth for pricing across the CRM (Calculator + Proposals).
// Every number here is derived from the 7 real, detailed proposals stored in
// this CRM (Stike, ESCENA, PROTECTAPPF, Skinny Boy, Real Comfort, Alivia,
// Cobra Repuestos) — not generic guesses. Items marked `estimated: true` were
// bundled inside a larger real quote rather than sold standalone; their price
// is derived from the delta between tiers, not a directly-quoted line item.

export type Track = "website" | "custom";

export interface BaseTier {
  id: string;
  name: string;
  track: Track;
  oneTimeFee: number; // centavos COP
  description: string;
  features: string[];
  sourceLabel: string;
  recommendedMaintenanceId: string;
}

export const BASE_TIERS: BaseTier[] = [
  {
    id: "web_basico",
    name: "Básico",
    track: "website",
    oneTimeFee: 150000000, // $1,500,000
    description: "De mockup a sitio en producción",
    features: [
      "Auditoría y pulido de contenido, fotos y precios reales",
      "Dominio propio conectado + 1 correo corporativo",
      "Cumplimiento legal Colombia (Ley 1581/2012, Ley 1480/2011): privacidad, términos, cookies",
      "Google Analytics 4 + Search Console conectados",
      "Revisión de velocidad y experiencia mobile",
      "1 semana de soporte post-lanzamiento",
    ],
    sourceLabel: "Precio real — Stike Bike Shop, ESCENA Bike Shop",
    recommendedMaintenanceId: "maint_esencial",
  },
  {
    id: "web_estandar",
    name: "Estándar",
    track: "website",
    oneTimeFee: 280000000, // $2,800,000
    description: "Catálogo grande con pedidos organizados",
    features: [
      "Todo lo del plan Básico",
      "Panel/CMS para catálogo: alta y edición en lote, importar/exportar CSV o Excel",
      "Gestión de fotos y categorías sin tocar código",
      "Registro estructurado de pedidos + notificación automática a la tienda",
      "Confirmación automática al cliente de que su pedido fue recibido",
      "Reglas de envío por zona",
      "2 semanas de soporte post-lanzamiento",
    ],
    sourceLabel: "Precio real — Stike Premium $2.500.000, ESCENA Premium $3.200.000",
    recommendedMaintenanceId: "maint_crecimiento",
  },
  {
    id: "web_avanzado",
    name: "Avanzado",
    track: "website",
    oneTimeFee: 350000000, // $3,500,000
    description: "Cobrando solo, con datos de conversión",
    features: [
      "Todo lo del plan Estándar",
      "Pasarela de pago real (Bold: tarjeta débito/crédito, PSE, Nequi) con confirmación automática",
      "Dashboard de conversión (visitas → pedidos)",
      "1 mes de soporte + 1 ronda de ajustes con datos reales de uso",
    ],
    sourceLabel:
      "Precio real — Stike Avanzado $3.500.000 (validado con ESCENA $6.200.000 menos portal de mayoristas y WhatsApp 24/7, vendidos aparte)",
    recommendedMaintenanceId: "maint_crecimiento",
  },
  {
    id: "custom_sistema",
    name: "Sistema a Medida",
    track: "custom",
    oneTimeFee: 500000000, // $5,000,000
    description: "CRM / ERP a medida para el negocio",
    features: [
      "Panel de gestión completo a medida (clientes, inventario, cartera o pedidos según el negocio)",
      "Tareas y flujos de trabajo asignables por equipo",
      "Dashboard ejecutivo con KPIs en tiempo real",
      "Historial de interacciones y actividad por cliente o cuenta",
      "2 sesiones de capacitación al equipo",
      "Manual de operación documentado",
    ],
    sourceLabel: "Precio real — Real Comfort $5.500.000, Alivia $4.500.000, Cobra Repuestos $4.500.000",
    recommendedMaintenanceId: "maint_pro",
  },
];

export type ModuleCategory =
  | "catalogo"
  | "automatizacion"
  | "marketing"
  | "seo"
  | "acceso"
  | "diseno"
  | "pagos";

export const MODULE_CATEGORY_LABELS: Record<ModuleCategory, string> = {
  catalogo: "Catálogo / Inventario",
  automatizacion: "Automatizaciones y chatbot",
  marketing: "Marketing y redes sociales",
  seo: "SEO",
  acceso: "Accesos (admin / cliente)",
  diseno: "Diseño y medios",
  pagos: "Pagos y financiación",
};

export interface AddonModule {
  id: string;
  category: ModuleCategory;
  name: string;
  description: string;
  oneTimeFee: number; // centavos COP (precio por unidad si `unit` está definido)
  monthlyFee?: number; // centavos COP
  unit?: "video"; // si está definido, se selecciona por cantidad en vez de on/off
  tracks: Track[];
  sourceLabel: string;
  estimated?: boolean;
}

export const ADDON_MODULES: AddonModule[] = [
  {
    id: "addon_portal_mayoristas",
    category: "catalogo",
    name: "Portal de mayoristas",
    description:
      "Zona con login para tiendas registradas: catálogo y precios diferenciados, aprobación manual de cuentas nuevas.",
    oneTimeFee: 180000000, // $1,800,000
    tracks: ["website"],
    sourceLabel: "Precio real — ESCENA Bike Shop",
  },
  {
    id: "addon_whatsapp_ia",
    category: "automatizacion",
    name: "WhatsApp 24/7 con IA",
    description:
      "Responde catálogo, precios y disponibilidad, toma pedidos simples 24/7, escala a un humano en horario laboral.",
    oneTimeFee: 140000000, // $1,400,000
    monthlyFee: 24000000, // $240,000 (rango real $180.000–$300.000)
    tracks: ["website", "custom"],
    sourceLabel: "Precio real — ESCENA Bike Shop ($1.400.000 + $180.000–$300.000/mes)",
  },
  {
    id: "addon_chatbot_web",
    category: "automatizacion",
    name: "Chatbot web (FAQ + captura de leads)",
    description:
      "Widget de chat en el sitio que responde preguntas frecuentes y captura datos de contacto 24/7, sin depender de WhatsApp.",
    oneTimeFee: 60000000, // $600,000
    monthlyFee: 6000000, // $60,000
    tracks: ["website"],
    sourceLabel: "Estimado — aún no vendido como línea independiente en una propuesta real",
    estimated: true,
  },
  {
    id: "addon_addi_sistecredito",
    category: "pagos",
    name: "Addi + Sistecrédito",
    description:
      "Botones de pago a crédito integrados al checkout (requiere estar ya autorizado como comercio con ambos).",
    oneTimeFee: 80000000, // $800,000
    tracks: ["website"],
    sourceLabel: "Precio real — Stike Bike Shop",
  },
  {
    id: "addon_rediseno",
    category: "diseno",
    name: "Rediseño completo del sitio",
    description: "Rediseño visual completo, más allá de la auditoría y el pulido incluidos en el plan Básico.",
    oneTimeFee: 130000000, // $1,300,000
    tracks: ["website"],
    sourceLabel: "Estimado — derivado de PROTECTAPPF ($2.800.000 menos plan Básico $1.500.000)",
    estimated: true,
  },
  {
    id: "addon_video",
    category: "diseno",
    name: "Video corporativo / reel",
    description: "Producción y edición de un video corto para el sitio o redes sociales. Precio por unidad.",
    oneTimeFee: 35000000, // $350,000 por video
    unit: "video",
    tracks: ["website", "custom"],
    sourceLabel: "Estimado — tarifa de mercado por video, no cotizado aún como línea propia",
    estimated: true,
  },
  {
    id: "addon_fotografia",
    category: "diseno",
    name: "Sesión de fotografía de producto/negocio",
    description: "Sesión profesional para renovar las fotos de catálogo o del local.",
    oneTimeFee: 30000000, // $300,000
    tracks: ["website"],
    sourceLabel: "Estimado — tarifa de mercado, no cotizado aún como línea propia",
    estimated: true,
  },
  {
    id: "addon_contable",
    category: "automatizacion",
    name: "Integración contable (Alegra + DIAN)",
    description: "Facturación electrónica automática por cada venta, con validación DIAN en tiempo real.",
    oneTimeFee: 100000000, // $1,000,000
    monthlyFee: 20000000, // $200,000
    tracks: ["website", "custom"],
    sourceLabel: "Estimado — derivado de Real Comfort, Alivia",
    estimated: true,
  },
  {
    id: "addon_docs",
    category: "automatizacion",
    name: "Automatización de documentos",
    description: "Clasificación automática de facturas y documentos entrantes por Gmail, WhatsApp y Google Drive.",
    oneTimeFee: 70000000, // $700,000
    tracks: ["custom"],
    sourceLabel: "Estimado — derivado de Alivia (8 automatizaciones documentales)",
    estimated: true,
  },
  {
    id: "addon_ia_voz",
    category: "automatizacion",
    name: "IA de voz para cobranza",
    description: "Llamadas de voz automatizadas en español para gestión de cobranza o seguimiento de clientes en mora.",
    oneTimeFee: 90000000, // $900,000
    monthlyFee: 15000000, // $150,000
    tracks: ["custom"],
    sourceLabel: "Estimado — derivado de Real Comfort (Dapta AI)",
    estimated: true,
  },
  {
    id: "addon_redes_sociales",
    category: "marketing",
    name: "Conexión y optimización de redes sociales",
    description: "Vincula Instagram, Facebook, TikTok y demás perfiles al sitio, con pixel de seguimiento configurado.",
    oneTimeFee: 12000000, // $120,000
    tracks: ["website"],
    sourceLabel: "Estimado — no cotizado aún como línea propia",
    estimated: true,
  },
  {
    id: "addon_campanas_ads",
    category: "marketing",
    name: "Campañas de pauta (Meta/Google Ads)",
    description: "Configuración inicial de campañas + gestión y optimización mensual de la pauta.",
    oneTimeFee: 40000000, // $400,000
    monthlyFee: 25000000, // $250,000
    tracks: ["website", "custom"],
    sourceLabel: "Estimado — no cotizado aún como línea propia",
    estimated: true,
  },
  {
    id: "addon_seo_onpage",
    category: "seo",
    name: "SEO técnico inicial",
    description: "Metadatos, sitemap, datos estructurados y velocidad, más allá del GA4 + Search Console de base.",
    oneTimeFee: 30000000, // $300,000
    tracks: ["website"],
    sourceLabel: "Estimado — no cotizado aún como línea propia",
    estimated: true,
  },
  {
    id: "addon_seo_mensual",
    category: "seo",
    name: "SEO mensual (contenido + mejoras continuas)",
    description: "Optimización continua mes a mes: contenido nuevo, ajustes técnicos y seguimiento de posiciones.",
    oneTimeFee: 0,
    monthlyFee: 25000000, // $250,000/mes
    tracks: ["website", "custom"],
    sourceLabel: "Estimado — derivado de la revisión SEO mensual del plan de mantenimiento Crecimiento",
    estimated: true,
  },
  {
    id: "addon_seo_blog",
    category: "seo",
    name: "SEO/GEO avanzado + Blog",
    description: "Blog con estrategia de contenido, SEO avanzado y GEO (posicionamiento en buscadores de IA).",
    oneTimeFee: 50000000, // $500,000
    tracks: ["website"],
    sourceLabel: "Estimado — derivado de Skinny Boy, B-Line Design",
    estimated: true,
  },
  {
    id: "addon_login_admin",
    category: "acceso",
    name: "Panel de administración con login",
    description: "Acceso protegido para el equipo editar textos, precios y fotos sin un CMS completo de catálogo.",
    oneTimeFee: 40000000, // $400,000
    tracks: ["website"],
    sourceLabel: "Estimado — no cotizado aún como línea propia",
    estimated: true,
  },
  {
    id: "addon_login_cliente",
    category: "acceso",
    name: "Portal de cliente con login",
    description: "Zona privada para que cada cliente vea sus pedidos, historial y documentos.",
    oneTimeFee: 90000000, // $900,000
    tracks: ["website"],
    sourceLabel: "Estimado — no cotizado aún como línea propia",
    estimated: true,
  },
];

// ─── "Sitio 100% personalizado" mode — building from scratch, not from a tier ─

export const CUSTOM_FOUNDATION = {
  id: "custom_fundacion",
  name: "Fundación del sitio (hasta 5 páginas)",
  description:
    "Diseño y desarrollo de un sitio nuevo desde cero: hasta 5 páginas, dominio propio + correo corporativo, " +
    "cumplimiento legal Colombia (Ley 1581/2012, Ley 1480/2011), GA4 + Search Console, optimizado para velocidad y mobile.",
  oneTimeFee: 150000000, // $1,500,000
  sourceLabel: "Precio real — equivalente al plan Básico (Stike Bike Shop, ESCENA Bike Shop)",
};

export const CUSTOM_PAGE_ADDON = {
  id: "custom_pagina_adicional",
  name: "Página adicional",
  description:
    "Cada página más allá de las 5 incluidas en la fundación (ej. nosotros, servicios, landing de campaña).",
  oneTimeFee: 15000000, // $150,000 por página
  sourceLabel: "Estimado — tarifa por página adicional",
};

export interface MaintenanceTier {
  id: string;
  name: string;
  monthlyFee: number; // centavos COP
  features: string[];
  recommended?: boolean;
}

export const MAINTENANCE_TIERS: MaintenanceTier[] = [
  {
    id: "maint_esencial",
    name: "Esencial",
    monthlyFee: 20000000, // $200,000
    features: [
      "Monitoreo de disponibilidad y respaldo del código/contenido",
      "Hasta 3 cambios pequeños al mes (precios, textos, fotos)",
      "Revisión mensual de enlaces, formularios y WhatsApp",
      "Soporte por WhatsApp/correo, respuesta en 48 h",
    ],
  },
  {
    id: "maint_crecimiento",
    name: "Crecimiento",
    monthlyFee: 41500000, // $415,000
    features: [
      "Todo lo de Esencial",
      "Hasta 15 altas/bajas de producto al mes vía el panel",
      "Reporte mensual de analítica (visitas, productos más vistos, origen de tráfico)",
      "Revisión SEO mensual (sitemap, metadatos, velocidad)",
      "Soporte con respuesta en 24 h",
    ],
    recommended: true,
  },
  {
    id: "maint_pro",
    name: "Pro",
    monthlyFee: 77500000, // $775,000
    features: [
      "Todo lo de Crecimiento",
      "Altas/bajas de inventario ilimitadas (uso razonable)",
      "Ajuste mensual de automatizaciones e IA según resultados reales",
      "Gestión de cuentas mayoristas nuevas (revisión y aprobación asistida)",
      "Llamada mensual de estrategia + soporte prioritario el mismo día",
    ],
  },
];

// ─── Community Manager — recurring content/social media management ────────
// Distinct from technical Mantenimiento above and from the one-off
// "Campañas de pauta" add-on: this is ongoing content production and
// publishing, sold as its own monthly service in the real Parra Shop quote.

export interface CommunityManagerTier {
  id: string;
  name: string;
  tagline: string;
  monthlyFeeMin: number; // centavos COP
  monthlyFeeMax: number; // centavos COP
  features: string[];
  sourceLabel: string;
}

export const COMMUNITY_MANAGER_TIERS: CommunityManagerTier[] = [
  {
    id: "cm_gestion_remota",
    name: "Gestión Remota",
    tagline: "Tú grabas, nosotros producimos",
    monthlyFeeMin: 155000000, // $1,550,000
    monthlyFeeMax: 165000000, // $1,650,000
    features: [
      "Parrilla de contenidos mensual",
      "Guiones detallados con indicaciones de ángulos, iluminación y encuadre",
      "Edición de videos y piezas a partir del material grabado por el cliente",
    ],
    sourceLabel: "Precio real — Parra Shop ($1.550.000–$1.650.000/mes)",
  },
  {
    id: "cm_gestion_completa",
    name: "Gestión Completa",
    tagline: "Nosotros nos encargamos de todo",
    monthlyFeeMin: 180000000, // $1,800,000
    monthlyFeeMax: 200000000, // $2,000,000
    features: [
      "Parrilla de contenidos mensual para Instagram, Facebook/WhatsApp y TikTok",
      "Redacción de guiones y copy para cada red social",
      "2 visitas al mes para grabación de video y fotografía en la sede del cliente",
      "Diseño y edición de todo el contenido",
      "Programación y publicación del contenido",
    ],
    sourceLabel: "Precio real — Parra Shop ($1.800.000–$2.000.000/mes)",
  },
];

// ─── Plazo de permanencia — descuento por compromiso, no solo proyección ───

export interface ContractTerm {
  id: string;
  name: string;
  months: number;
  discountPct: number; // % de descuento sobre el total mensual
  description: string;
}

export const CONTRACT_TERMS: ContractTerm[] = [
  {
    id: "term_mensual",
    name: "Mes a mes",
    months: 1,
    discountPct: 0,
    description: "Sin permanencia, cancela cuando quieras",
  },
  {
    id: "term_1y",
    name: "1 año",
    months: 12,
    discountPct: 5,
    description: "5% de descuento en la mensualidad por permanencia de 1 año",
  },
  {
    id: "term_3y",
    name: "3 años",
    months: 36,
    discountPct: 10,
    description: "10% de descuento en la mensualidad — nuestro mejor precio, para el cliente que se queda",
  },
];

// ─── Forma de pago — cuándo entra el efectivo, no solo cuánto ──────────────

export interface PaymentSchedule {
  id: string;
  name: string;
  description: string;
  discountPct?: number; // % de descuento sobre el pago único, si aplica
  installments: { label: string; pct: number }[]; // % del pago único, suman 100
}

export const PAYMENT_SCHEDULES: PaymentSchedule[] = [
  {
    id: "pago_completo",
    name: "Pago completo al inicio",
    description: "5% de descuento por pago anticipado del 100%",
    discountPct: 5,
    installments: [{ label: "Al confirmar", pct: 100 }],
  },
  {
    id: "pago_50_50",
    name: "50% inicio / 50% entrega",
    description: "La forma de pago más común",
    installments: [
      { label: "Al confirmar", pct: 50 },
      { label: "Al entregar", pct: 50 },
    ],
  },
  {
    id: "pago_3_cuotas",
    name: "3 cuotas",
    description: "Inicio, mitad de proyecto y entrega",
    installments: [
      { label: "Al confirmar", pct: 34 },
      { label: "A mitad de proyecto", pct: 33 },
      { label: "Al entregar", pct: 33 },
    ],
  },
];

// ─── IVA, renovación de dominio/hosting y entrega prioritaria ──────────────

export const IVA_RATE = 0.19; // Colombia, tarifa general

export const DOMAIN_HOSTING_RENEWAL = {
  id: "domain_hosting_renewal",
  name: "Renovación dominio + hosting",
  description: "Año 1 incluido en la fundación del sitio; se renueva a partir del año 2.",
  annualFee: 22000000, // $220,000/año
  sourceLabel: "Estimado — dominio .com + hosting básico, no cotizado aún como línea propia",
};

export const RUSH_DELIVERY = {
  id: "rush_delivery",
  name: "Entrega prioritaria",
  description: "Reduce el tiempo de entrega estándar a la mitad, con dedicación exclusiva del equipo.",
  surchargePct: 20,
  sourceLabel: "Estimado — recargo estándar de la industria por prioridad",
};

// ─── Legacy exports kept for the free-text tag checklists on Proposals ─────

export const ADD_ONS_CATALOG = [
  "Tienda en linea (e-commerce)",
  "Sistema de reservas / citas",
  "Chat en vivo",
  "Integracion CRM",
  "Formularios avanzados",
  "Portal de clientes",
  "Multiidioma (EN/ES)",
  "Pasarela de pagos (PSE / Nequi / Daviplata)",
  "Integracion con Mercado Libre",
  "App movil basica (PWA)",
  "Video corporativo / reel",
  "Fotografia de producto",
  "Sesion de fotos del negocio",
  "Logotipo e identidad visual",
];

export const AUTOMATIONS_CATALOG = [
  "Respuesta automatica WhatsApp",
  "Email de bienvenida al cliente",
  "Recordatorio de citas por WhatsApp",
  "Follow-up automatico de leads",
  "Notificacion de nuevo pedido",
  "Reporte semanal automatico por email",
  "Sincronizacion Google Calendar",
  "Chatbot de preguntas frecuentes",
  "Campana de reactivacion de clientes",
  "Integracion con Google Sheets",
];

export const DELIVERABLES_CATALOG = [
  "Acceso al panel de administracion",
  "Entrega de credenciales y dominio",
  "Manual de uso del sitio",
  "Capacitacion (1 hora virtual)",
  "Archivos fuente del diseno",
  "Reporte SEO inicial",
  "Configuracion Google My Business",
  "Politicas de privacidad y terminos",
  "Sitemap XML y robots.txt",
  "Certificado SSL instalado",
];

interface SuggestionContext {
  industry?: string;
  company?: string;
  notes?: string;
  currentPlan?: string;
}

export function getAgencySuggestions(ctx: SuggestionContext): string[] {
  const suggestions: string[] = [];
  const text = `${ctx.industry || ""} ${ctx.company || ""} ${ctx.notes || ""}`.toLowerCase();

  if (text.includes("restaur") || text.includes("comida") || text.includes("cafe") || text.includes("bar")) {
    suggestions.push("Sistema de reservas en linea — ideal para restaurantes");
    suggestions.push("Menu digital QR integrado al sitio");
    suggestions.push("Respuesta automatica por WhatsApp con horarios y menu");
    suggestions.push("Fotografia de platos para el catalogo");
  }

  if (text.includes("tienda") || text.includes("shop") || text.includes("ropa") || text.includes("perfume") || text.includes("bici")) {
    suggestions.push("Panel/CMS para catálogo grande (plan Estándar)");
    suggestions.push("Integracion con Mercado Libre para mas ventas");
    suggestions.push("Pasarela de pagos real (plan Avanzado)");
    suggestions.push("Notificacion automatica de nuevo pedido por WhatsApp");
  }

  if (text.includes("clinica") || text.includes("medic") || text.includes("dental") || text.includes("salon") || text.includes("spa") || text.includes("belleza")) {
    suggestions.push("Sistema de reservas y citas en linea");
    suggestions.push("Recordatorio de citas por WhatsApp");
    suggestions.push("Portal de pacientes / clientes");
    suggestions.push("Sincronizacion con Google Calendar");
  }

  if (text.includes("inmobil") || text.includes("finca raiz") || text.includes("aparta") || text.includes("casa")) {
    suggestions.push("Catalogo de propiedades con filtros");
    suggestions.push("Formulario de busqueda avanzada");
    suggestions.push("Integracion CRM para seguimiento de compradores");
    suggestions.push("Tour virtual 360 integrado");
  }

  if (text.includes("gym") || text.includes("fitness") || text.includes("deporte") || text.includes("entrenamiento")) {
    suggestions.push("Sistema de membresias y pagos recurrentes");
    suggestions.push("Horario de clases interactivo");
    suggestions.push("App PWA para reserva de clases");
    suggestions.push("Campana de reactivacion de socios inactivos");
  }

  if (text.includes("legal") || text.includes("abogad") || text.includes("consul") || text.includes("contador")) {
    suggestions.push("Sistema a Medida: portal de documentos y tareas por cliente");
    suggestions.push("Automatización de documentos (Gmail + Drive)");
    suggestions.push("Integración contable (Alegra + DIAN)");
    suggestions.push("Chat en vivo para consultas rapidas");
  }

  if (suggestions.length === 0) {
    suggestions.push("Blog corporativo para mejorar SEO");
    suggestions.push("Chat en vivo o WhatsApp flotante");
    suggestions.push("Formulario de contacto con respuesta automatica");
    suggestions.push("Google My Business optimizado");
  }

  if (ctx.currentPlan === "Básico") {
    suggestions.push("Upgrade a plan Estándar para incluir panel de catálogo grande");
  }
  if (ctx.currentPlan === "Estándar") {
    suggestions.push("Agrega el plan Avanzado para pasarela de pago real");
  }

  return suggestions.slice(0, 5);
}
