export interface FontPair {
  id: string;
  label: string;
  mood: string;
  heading: string;
  body: string;
  headingWeight: string;
  bodyWeight: string;
  googleQuery: string;
  headingCase?: "none" | "upper";
  headingTracking: string;
}

// Real, deliberately-paired typography. Each pair carries its own voice —
// swapping the pair should visibly change the personality of the page.
export const FONT_PAIRS: FontPair[] = [
  {
    id: "editorial",
    label: "Editorial",
    mood: "Serio, con autoridad. Revistas, consultoría, despachos.",
    heading: "'Playfair Display', Georgia, serif",
    body: "'Source Sans 3', -apple-system, sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
    googleQuery: "Playfair+Display:wght@500;700;900&family=Source+Sans+3:wght@400;600",
    headingTracking: "-0.02em",
  },
  {
    id: "modern",
    label: "Moderno",
    mood: "Limpio y técnico. Software, agencias, startups.",
    heading: "'Space Grotesk', -apple-system, sans-serif",
    body: "'Inter', -apple-system, sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
    googleQuery: "Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600",
    headingTracking: "-0.03em",
  },
  {
    id: "warm",
    label: "Cálido",
    mood: "Cercano y humano. Restaurantes, bienestar, artesanal.",
    heading: "'Fraunces', Georgia, serif",
    body: "'Nunito Sans', -apple-system, sans-serif",
    headingWeight: "600",
    bodyWeight: "400",
    googleQuery: "Fraunces:opsz,wght@9..144,500;9..144,700&family=Nunito+Sans:wght@400;600",
    headingTracking: "-0.01em",
  },
  {
    id: "bold",
    label: "Impacto",
    mood: "Fuerte y directo. Gimnasios, eventos, deportes.",
    heading: "'Archivo Black', Impact, sans-serif",
    body: "'Archivo', -apple-system, sans-serif",
    headingWeight: "400",
    bodyWeight: "400",
    googleQuery: "Archivo+Black&family=Archivo:wght@400;500;600",
    headingCase: "upper",
    headingTracking: "-0.01em",
  },
  {
    id: "refined",
    label: "Refinado",
    mood: "Elegante y espacioso. Lujo, moda, inmobiliaria.",
    heading: "'Cormorant Garamond', Georgia, serif",
    body: "'Jost', -apple-system, sans-serif",
    headingWeight: "600",
    bodyWeight: "300",
    googleQuery: "Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500",
    headingTracking: "0.01em",
  },
  {
    id: "friendly",
    label: "Amigable",
    mood: "Accesible y claro. Comercio, servicios, salud.",
    heading: "'Poppins', -apple-system, sans-serif",
    body: "'Karla', -apple-system, sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
    googleQuery: "Poppins:wght@500;600;700&family=Karla:wght@400;500;600",
    headingTracking: "-0.02em",
  },
];

export function getFontPair(id: string): FontPair {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[1];
}
