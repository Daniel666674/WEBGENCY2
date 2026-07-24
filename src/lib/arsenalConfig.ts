export const CATEGORIES = ["Stack", "Backend", "Automation", "Tool", "Integration", "Process"] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["active", "testing", "planned", "archived"] as const;
export type Status = (typeof STATUSES)[number];

export const CATEGORY_STYLE: Record<string, { badge: string; dot: string }> = {
  Stack:       { badge: "bg-primary/10 text-primary",                                    dot: "bg-primary" },
  Backend:     { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",   dot: "bg-blue-500" },
  Automation:  { badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", dot: "bg-purple-500" },
  Tool:        { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",    dot: "bg-amber-500" },
  Integration: { badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",    dot: "bg-green-500" },
  Process:     { badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",       dot: "bg-slate-500" },
};

export const STATUS_STYLE: Record<string, { badge: string; label: string }> = {
  active:   { badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",   label: "Activo" },
  testing:  { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",   label: "Pruebas" },
  planned:  { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",       label: "Planeado" },
  archived: { badge: "bg-muted text-muted-foreground",                                          label: "Archivado" },
};

export type ArsenalItem = {
  id: string;
  name: string;
  category: string;
  status: string;
  icon: string | null;
  description: string | null;
  url: string | null;
  tags: string;
  useCases: string;
  costCents: number | null;
  details: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function parseTags(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}
