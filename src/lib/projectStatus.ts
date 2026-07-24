// Plain data module (NOT "use client") so it can be safely imported by both
// Server Components (dashboard's ActiveProjects, the projects pages) and Client
// Components (ProjectCard). It used to live in ProjectCard.tsx, which is a
// "use client" module — importing this object from there into a Server
// Component turned it into a client-reference proxy whose property lookups all
// return undefined, so `PROJECT_STATUS_CONFIG[status] ?? PROJECT_STATUS_CONFIG.discovery`
// resolved to undefined and crashed on `.color` the moment any project existed.
export const PROJECT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  discovery:  { label: "Discovery",  color: "#6b7280", bg: "#f3f4f6" },
  design:     { label: "Diseño",     color: "#8b5cf6", bg: "#ede9fe" },
  dev:        { label: "Desarrollo", color: "#2563eb", bg: "#dbeafe" },
  launched:   { label: "Lanzado",    color: "#16a34a", bg: "#dcfce7" },
  paused:     { label: "Pausado",    color: "#ea580c", bg: "#ffedd5" },
};
