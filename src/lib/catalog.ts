export interface AgencyPlan {
  name: string;
  oneTimeFee: number; // centavos COP
  monthlyFee: number; // centavos COP
  features: string[];
  description: string;
}

export const AGENCY_PLANS: AgencyPlan[] = [
  {
    name: "Basico",
    oneTimeFee: 150000000, // $1,500,000 COP
    monthlyFee: 30000000,  // $300,000 COP
    description: "Presencia web esencial para negocios que arrancan",
    features: [
      "Sitio web hasta 5 paginas",
      "Diseno responsivo movil",
      "Formulario de contacto",
      "Google Maps integrado",
      "1 revision por mes",
    ],
  },
  {
    name: "Estandar",
    oneTimeFee: 200000000, // $2,000,000 COP
    monthlyFee: 40000000,  // $400,000 COP
    description: "Sitio web profesional con SEO y blog",
    features: [
      "Sitio web hasta 10 paginas",
      "Diseno responsivo movil",
      "SEO basico on-page",
      "Blog integrado",
      "Optimizacion de velocidad",
      "GEO (Generative Engine Optimization)",
      "Google Analytics",
      "2 revisiones por mes",
    ],
  },
  {
    name: "Premium",
    oneTimeFee: 300000000, // $3,000,000 COP
    monthlyFee: 60000000,  // $600,000 COP
    description: "Presencia digital completa con marketing",
    features: [
      "Sitio web ilimitado",
      "Diseno UI/UX personalizado",
      "SEO avanzado",
      "Blog + estrategia de contenido",
      "Catalogo de productos",
      "Integracion WhatsApp Business",
      "Google Analytics + Search Console",
      "Reportes mensuales",
      "Revisiones ilimitadas",
    ],
  },
  {
    name: "Marketing",
    oneTimeFee: 250000000, // $2,500,000 COP
    monthlyFee: 150000000, // $1,500,000 COP
    description: "Sitio web + community manager dedicado",
    features: [
      "Todo el plan Estandar",
      "Community manager dedicado",
      "Gestion de redes sociales (3 plataformas)",
      "4 publicaciones semanales",
      "Campanas de pauta basica",
      "Reportes de engagement mensuales",
    ],
  },
  {
    name: "Custom",
    oneTimeFee: 0,
    monthlyFee: 0,
    description: "Propuesta personalizada segun necesidades",
    features: [],
  },
];

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
    suggestions.push("Tienda en linea con catalogo de productos");
    suggestions.push("Integracion con Mercado Libre para mas ventas");
    suggestions.push("Pasarela de pagos (PSE / Nequi / Daviplata)");
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
    suggestions.push("Portal de documentos para clientes");
    suggestions.push("Sistema de citas y consultas");
    suggestions.push("Blog legal para posicionamiento SEO");
    suggestions.push("Chat en vivo para consultas rapidas");
  }

  if (suggestions.length === 0) {
    suggestions.push("Blog corporativo para mejorar SEO");
    suggestions.push("Chat en vivo o WhatsApp flotante");
    suggestions.push("Formulario de contacto con respuesta automatica");
    suggestions.push("Google My Business optimizado");
  }

  if (ctx.currentPlan === "Basico") {
    suggestions.push("Upgrade a plan Estandar para incluir SEO y blog");
  }
  if (ctx.currentPlan === "Estandar") {
    suggestions.push("Agrega community manager con plan Marketing");
  }

  return suggestions.slice(0, 5);
}

// ─── Real service catalog from proposals ────────────────────────────────────

export interface WebsitePlan {
  id: string;
  name: string;
  oneTimeFee: number; // centavos COP
  features: string[];
}

export const WEBSITE_PLANS: WebsitePlan[] = [
  {
    id: "basico",
    name: "Básico",
    oneTimeFee: 150000000,
    features: [
      "Hasta 3 páginas (Inicio, Catálogo, Contacto)",
      "Diseño limpio y responsivo",
      "Formulario de contacto + redes sociales",
      "Optimización básica SEO",
      "Dominio y hosting primer año incluido",
    ],
  },
  {
    id: "estandar",
    name: "Estándar",
    oneTimeFee: 250000000,
    features: [
      "Hasta 6 páginas personalizadas",
      "Catálogo de productos con filtros",
      "Sección de reseñas / testimonios",
      "SEO intermedio + Google Analytics",
      "Dominio y hosting primer año incluido",
    ],
  },
  {
    id: "avanzado",
    name: "Avanzado",
    oneTimeFee: 350000000,
    features: [
      "Páginas ilimitadas en el alcance",
      "Diseño UI/UX personalizado",
      "Tienda en línea (carrito + favoritos)",
      "Panel de administración de productos",
      "SEO avanzado + configuración Analytics",
      "Dominio y hosting primer año incluido",
    ],
  },
];

export interface ChatbotPlan {
  id: string;
  name: string;
  oneTimeFee: number;
  monthlyFee: number;
  features: string[];
}

export const CHATBOT_PLANS: ChatbotPlan[] = [
  {
    id: "esencial",
    name: "Esencial",
    oneTimeFee: 90000000,
    monthlyFee: 35000000,
    features: [
      "Respuestas automáticas a preguntas frecuentes",
      "Menú de catálogo y horarios de atención",
      "Captura de pedido y datos del cliente",
      "Transferencia a asesor humano (handoff)",
      "Operación, plataforma y soporte incluidos",
    ],
  },
  {
    id: "profesional",
    name: "Profesional",
    oneTimeFee: 150000000,
    monthlyFee: 50000000,
    features: [
      "Todo el plan Esencial",
      "Respuestas con IA en lenguaje natural",
      "Recomendación de productos según gustos",
      "1 campaña/mes (reactivación o venta cruzada)",
      "Reporte mensual de conversaciones y resultados",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    oneTimeFee: 250000000,
    monthlyFee: 75000000,
    features: [
      "Todo el plan Profesional",
      "Catálogo sincronizado dentro del bot",
      "Campañas masivas gestionadas",
      "Seguimiento de pedidos automatizado",
      "Múltiples flujos + soporte prioritario",
    ],
  },
];

export interface MaintenancePlan {
  id: string;
  name: string;
  monthlyFee: number;
  monthlyFeeMax?: number;
  features: string[];
}

export const MAINTENANCE_PLANS: MaintenancePlan[] = [
  {
    id: "soporte",
    name: "Mantenimiento & Soporte",
    monthlyFee: 30000000,
    features: [
      "1 sesión de edición/semana (hasta 5 cambios)",
      "Soporte WhatsApp lun–vie 8:00–18:00",
      "Resolución de fallos en 2–3 horas sin costo",
      "Monitoreo básico de disponibilidad",
      "Revisión mensual de Google Analytics",
    ],
  },
  {
    id: "remota",
    name: "Gestión Remota",
    monthlyFee: 155000000,
    monthlyFeeMax: 165000000,
    features: [
      "Parrilla de contenidos mensual",
      "Guiones detallados por red social",
      "Edición de videos y piezas a partir de material propio",
      "Instagram, Facebook/WhatsApp y TikTok",
    ],
  },
  {
    id: "completa",
    name: "Gestión Completa",
    monthlyFee: 180000000,
    monthlyFeeMax: 200000000,
    features: [
      "Todo el plan Gestión Remota",
      "2 visitas/mes para grabación (Bogotá)",
      "Fotografía de producto en sede",
      "Diseño, edición y publicación incluidos",
    ],
  },
];

export const EXTRAS_CATALOG = [
  { id: "pagina", label: "Página adicional", oneTimeFee: 15000000, note: "Desde $150.000 c/u" },
  { id: "urgencia", label: "Urgencia fuera de horario", oneTimeFee: 6000000, note: "$60.000/intervención" },
];
