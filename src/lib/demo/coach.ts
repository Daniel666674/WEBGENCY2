import type { SectionType, SectionItem, Brand, DemoBrief, BriefGoal, BriefTone } from "./types";

export type { DemoBrief, BriefGoal, BriefTone };

/**
 * The builder's coaching layer.
 *
 * analyzeDemo() in advisor.ts audits a finished demo and says what is broken.
 * This is the other half: what to tell someone *while* they work on a
 * section, before anything is wrong. Guidance is written for a salesperson
 * building a demo for a prospect, not for a designer.
 */

export interface SectionCoaching {
  /** One line: what this section is for. */
  purpose: string;
  /** Concrete, do-this-now advice. Kept to 3–4 so it stays readable. */
  tips: string[];
}

export const SECTION_COACHING: Record<SectionType, SectionCoaching> = {
  hero: {
    purpose: "Lo primero que ve el visitante. Decide en 3 segundos si se queda.",
    tips: [
      "Di qué haces y para quién, no un eslogan abstracto. \"Diseño de cocinas a medida en Bogotá\" gana contra \"Transformamos espacios\".",
      "6 a 10 palabras en el título. Si no cabe en una línea del celular, es largo.",
      "Un solo botón. Dos opciones compiten entre sí y bajan los clics.",
      "La foto tiene que mostrar el trabajo real o el producto, no una imagen genérica de banco.",
    ],
  },
  features: {
    purpose: "Qué vendes, en bloques que se escanean de un vistazo.",
    tips: [
      "3 servicios funcionan mejor que 6. Si vendes más, agrupa.",
      "Escribe el beneficio, no la tarea: \"Tu cocina lista en 4 semanas\" en vez de \"Instalación\".",
      "Mantén los textos del mismo largo — bloques disparejos se ven descuidados.",
    ],
  },
  gallery: {
    purpose: "La prueba visual de que sabes hacer lo que dices.",
    tips: [
      "6 a 9 fotos. Más que eso cansa y diluye las buenas.",
      "Todas con la misma orientación y calidad similar. Una foto borrosa contamina el resto.",
      "Si el trabajo tiene antes/después, esa comparación vende más que cualquier texto.",
      "Ponle un pie de foto corto a cada una: dónde fue, para quién.",
    ],
  },
  video: {
    purpose: "Un video corto genera más confianza que tres párrafos.",
    tips: [
      "Menos de 90 segundos. Nadie ve más en una web que recién conoce.",
      "Que se entienda sin audio — mucha gente lo abre en silencio.",
    ],
  },
  about: {
    purpose: "Por qué confiar en vos y no en el competidor de al lado.",
    tips: [
      "Cuenta el origen concreto: cuándo empezaste, por qué, qué te diferencia.",
      "Una foto real del equipo o del local vale más que una foto de banco.",
      "Números concretos: años en el mercado, clientes atendidos, proyectos entregados.",
    ],
  },
  testimonials: {
    purpose: "Lo que dicen otros pesa más que lo que digas vos.",
    tips: [
      "Nombre y apellido reales, y si se puede la empresa. \"Cliente satisfecho\" no convence a nadie.",
      "El mejor testimonio menciona el problema que tenía la persona antes.",
      "3 buenos superan a 8 genéricos.",
    ],
  },
  menu: {
    purpose: "Precios o planes. Quita la fricción de tener que preguntar.",
    tips: [
      "Mostrar precios filtra a quien no puede pagarte y ahorra reuniones.",
      "Si no querés publicar precios, usa rangos: \"Desde $X\".",
      "Marca una opción como recomendada — la mayoría elige la sugerida.",
    ],
  },
  faq: {
    purpose: "Responde las objeciones antes de que frenen la venta.",
    tips: [
      "Escribe las 5 preguntas que más te hacen por WhatsApp. Esas son.",
      "Incluye las incómodas: precio, tiempos de entrega, garantía.",
      "Respuestas de 2 o 3 líneas. Si te extendés, es una página aparte.",
    ],
  },
  stats: {
    purpose: "Cifras que resumen tu trayectoria de un golpe.",
    tips: [
      "3 o 4 cifras. Más se vuelve ruido.",
      "Que sean verificables. Un número inflado se nota y cuesta la venta.",
      "Combina volumen y calidad: \"+300 proyectos\" junto a \"4.9 de calificación\".",
    ],
  },
  team: {
    purpose: "Le pone cara al negocio. Sirve mucho en servicios profesionales.",
    tips: [
      "Fotos con el mismo fondo y encuadre parecido.",
      "El cargo en lenguaje humano, no el título interno de la empresa.",
    ],
  },
  logos: {
    purpose: "Marcas conocidas que ya trabajaron con vos.",
    tips: [
      "Todos los logos del mismo alto visual, en gris o en su color, pero consistentes.",
      "5 a 8 alcanzan. Si tenés uno muy conocido, ponelo primero.",
      "Solo clientes reales — esto es fácil de verificar.",
    ],
  },
  banner: {
    purpose: "Una franja para destacar algo puntual: promo, aviso, novedad.",
    tips: [
      "Un mensaje solo. Si tenés dos cosas urgentes, ninguna lo es.",
      "Sirve para lo temporal. Si es permanente, va en otra sección.",
    ],
  },
  divider: {
    purpose: "Aire entre secciones que se pisan visualmente.",
    tips: ["Usalo con moderación: el espacio en blanco ya separa bastante."],
  },
  columns: {
    purpose: "Texto libre para lo que no encaja en las demás secciones.",
    tips: [
      "Si lo estás usando mucho, probablemente falta una sección específica.",
      "Párrafos cortos. Los bloques largos no se leen en celular.",
    ],
  },
  cta: {
    purpose: "El empujón final antes de que se vayan.",
    tips: [
      "Un verbo concreto: \"Pedir cotización\" gana contra \"Más información\".",
      "Repetí aquí la promesa del título de portada, no un mensaje nuevo.",
      "Quitá la fricción: decí que es gratis, o cuánto demora.",
    ],
  },
  contact: {
    purpose: "Donde termina la visita y empieza la conversación.",
    tips: [
      "WhatsApp convierte mucho más que un formulario en Latinoamérica.",
      "Poné horario de atención — evita la sensación de escribirle al vacío.",
      "Si tenés local, la dirección y el mapa dan confianza real.",
    ],
  },
};

/** Tips tied to the specific field being edited, shown in the inspector. */
export const ELEMENT_COACHING: Record<string, string> = {
  heading: "El título carga el peso. Concreto y corto gana siempre.",
  subheading: "La frase de apoyo explica el título — no lo repite con otras palabras.",
  eyebrow: "La etiqueta de arriba ubica al lector. 1 o 2 palabras.",
  body: "Párrafos de 2 o 3 líneas. En celular, un bloque largo se salta.",
  "items.title": "Todos los títulos de esta sección deberían tener un largo parecido.",
  "items.body": "Beneficio para el cliente, no descripción técnica de lo que hacés.",
  cta: "Empezá con un verbo. \"Pedir cotización\", \"Agendar visita\".",
  "items.price": "Precios con el mismo formato en todos los elementos. La inconsistencia se nota.",
  media: "Foto propia siempre que se pueda. Las de banco se reconocen y restan.",
};

// ─────────────────────────────────────────────────────────────
// Pre-build brief
// ─────────────────────────────────────────────────────────────

export const BRIEF_GOALS: { id: BriefGoal; label: string; hint: string }[] = [
  { id: "leads", label: "Conseguir contactos", hint: "Que dejen sus datos o escriban por WhatsApp" },
  { id: "sales", label: "Vender directo", hint: "Que compren o pidan cotización" },
  { id: "bookings", label: "Agendar citas", hint: "Reservas, turnos o visitas" },
  { id: "credibility", label: "Dar credibilidad", hint: "Respaldar al negocio ante quien lo busca" },
];

export const BRIEF_TONES: { id: BriefTone; label: string }[] = [
  { id: "cercano", label: "Cercano" },
  { id: "profesional", label: "Profesional" },
  { id: "premium", label: "Premium" },
  { id: "atrevido", label: "Atrevido" },
];

/**
 * Turns the brief into advice that references the answers the user gave, so
 * the coaching reads as being about *their* business rather than generic
 * web-design commentary.
 */
export function briefAdvice(brief: DemoBrief | undefined, brand: Brand): string[] {
  if (!brief) return [];
  const out: string[] = [];

  if (brief.goal === "leads" && !brand.whatsapp) {
    out.push("Tu objetivo es conseguir contactos pero no cargaste WhatsApp. Es el canal que más convierte — agrégalo en Marca.");
  }
  if (brief.goal === "bookings") {
    out.push("Para agendar citas, el botón principal debería decir \"Agendar\" y apuntar a WhatsApp o a tu calendario.");
  }
  if (brief.goal === "sales") {
    out.push("Si el objetivo es vender, activá Menú / Precios: mostrar precios acorta el camino a la compra.");
  }
  if (brief.goal === "credibility") {
    out.push("Para dar credibilidad, priorizá Testimonios, Logos de clientes y Cifras destacadas por encima de todo lo demás.");
  }
  if (brief.audience?.trim()) {
    out.push(`Escribiste que le hablás a: "${brief.audience.trim()}". Releé el título de portada — ¿esa persona se siente identificada?`);
  }
  if (brief.differentiator?.trim()) {
    out.push(`Tu diferencial es "${brief.differentiator.trim()}". Debería aparecer en la portada, no escondido en Nosotros.`);
  }
  if (brief.tone === "premium") {
    out.push("Para un tono premium: menos secciones, más espacio en blanco y fotos grandes. La saturación abarata.");
  }
  if (brief.tone === "cercano") {
    out.push("Para un tono cercano: hablá de \"vos/tú\", mostrá caras reales y evitá el lenguaje corporativo.");
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Starter items
// ─────────────────────────────────────────────────────────────

/**
 * Placeholder rows for item-driven sections that ship empty.
 *
 * Enabling "Galería" used to add a section with zero items, which the
 * renderer then skipped entirely — the section appeared to do nothing at
 * all. Seeding gives the editor something to edit and the canvas something
 * to show.
 */
const STARTERS: Partial<Record<SectionType, SectionItem[]>> = {
  gallery: [
    { title: "Proyecto uno" },
    { title: "Proyecto dos" },
    { title: "Proyecto tres" },
  ],
  logos: [{ title: "Cliente uno" }, { title: "Cliente dos" }, { title: "Cliente tres" }],
  team: [
    { title: "Nombre Apellido", body: "Cargo o especialidad" },
    { title: "Nombre Apellido", body: "Cargo o especialidad" },
  ],
  faq: [
    { title: "¿Cuánto demora el trabajo?", body: "Responde aquí con un plazo concreto." },
    { title: "¿Cómo son los pagos?", body: "Explica aquí tus condiciones." },
  ],
  stats: [
    { title: "+100", body: "Clientes atendidos" },
    { title: "8", body: "Años de experiencia" },
    { title: "4.9", body: "Calificación promedio" },
  ],
  testimonials: [
    { title: "Escribe aquí lo que dijo tu cliente.", author: "Nombre Apellido", role: "Empresa" },
  ],
  menu: [
    { title: "Plan o producto", body: "Qué incluye.", price: "$0" },
  ],
  columns: [{ title: "Título del bloque", body: "Escribe aquí el contenido." }],
};

/** True when the section renders nothing without items. */
export function isItemDriven(type: SectionType): boolean {
  return type in STARTERS || type === "features";
}

/** Starter rows for a section type, or an empty list when it needs none. */
export function starterItems(type: SectionType): SectionItem[] {
  return (STARTERS[type] ?? []).map((it) => ({ ...it }));
}
