"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileCode,
  Home,
  Link2,
  Loader2,
  Lock,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SECTION_LABELS } from "@/lib/demo/types";
import type { SectionType } from "@/lib/demo/types";
import { GithubPicker } from "./GithubPicker";
import { UrlPicker } from "./UrlPicker";

type ImportMode = "verbatim" | "sections";

interface ReportSection {
  id: string;
  type: SectionType;
  variant: string;
  confidence: "high" | "medium" | "low";
  evidence: string;
  itemCount: number;
  heading: string;
}

interface SectionsReportPage {
  id: string;
  slug: string;
  title: string;
  path: string;
  isHome: boolean;
  sections: ReportSection[];
}

interface VerbatimReportPage {
  id: string;
  slug: string;
  title: string;
  path: string;
  isHome: boolean;
  bytes: number;
}

type Report =
  | {
      mode: "sections";
      multiPage: boolean;
      pages: SectionsReportPage[];
      warnings: string[];
      brand: { name: string; accent: string; detectedColors: boolean };
      images: number;
      linksRewired: number;
    }
  | {
      mode: "verbatim";
      multiPage: boolean;
      pages: VerbatimReportPage[];
      warnings: string[];
      linksRewired: number;
    };

interface SourceFile {
  path: string;
  html: string;
  baseUrl?: string;
  css?: string[];
  /** Set for files that already went through a headless browser (the "Desde
   *  una URL" tab): URLs are already absolute and scripts already stripped,
   *  so verbatim mode can skip the server-side equivalent of that pass. */
  rendered?: boolean;
}

const CONFIDENCE_STYLE: Record<ReportSection["confidence"], string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-amber-100 text-amber-700",
};

const CONFIDENCE_LABEL: Record<ReportSection["confidence"], string> = {
  high: "Seguro",
  medium: "Probable",
  low: "Revisar",
};

/**
 * Import HTML pages and turn them into a demo — two different ways.
 *
 * "Diseño original" keeps the source's own HTML and CSS untouched, which is
 * what makes the result look exactly like the page it came from; nothing
 * about it is visually editable in the builder afterward. "Secciones
 * editables" runs the same pages through the classifier instead, trading the
 * original's CSS for a page built from the CRM's own editable sections.
 * Neither is strictly better — they're not the same feature — so the choice
 * is explicit rather than picked for the user. Fidelity is the default,
 * since it's the one you can't get back after picking the other.
 *
 * Both share the review step, and it's what makes either mode usable: the
 * files are analyzed server-side without saving anything, and the result is
 * shown before the demo exists — pages to exclude in verbatim mode, sections
 * to exclude in sections mode.
 */
export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"file" | "github" | "url">("url");
  const [mode, setMode] = useState<ImportMode>("verbatim");
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [title, setTitle] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [openPages, setOpenPages] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setFiles([]);
    setTitle("");
    setReport(null);
    setExcluded(new Set());
    setOpenPages(new Set());
    setDragging(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function analyze(sources: SourceFile[], name?: string) {
    if (sources.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/demo-pages/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: sources, title: name, mode, dryRun: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setFiles(sources);
      setTitle(name ?? ("brand" in body.report ? body.report.brand.name : "") ?? "");
      setReport(body.report);
      setExcluded(new Set());
      // Multi-page opens collapsed except home; a single page opens expanded,
      // since there is nothing to scan past. Only meaningful in sections mode
      // — verbatim's review step has nothing to expand.
      setOpenPages(
        new Set(
          body.report.mode === "sections"
            ? body.report.multiPage
              ? body.report.pages.filter((p: SectionsReportPage) => p.isHome).map((p: SectionsReportPage) => p.id)
              : body.report.pages.map((p: SectionsReportPage) => p.id)
            : []
        )
      );
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No pudimos leer esos archivos");
    } finally {
      setBusy(false);
    }
  }

  async function takeFiles(list: FileList | null) {
    const all = [...(list ?? [])];
    const chosen = all.filter((f) => /\.html?$/i.test(f.name) || f.type === "text/html");
    if (chosen.length === 0) return toast.error("Tienen que ser archivos .html");

    // A dropped .css comes along for the ride. It is the only way an upload
    // can pick up the site's real palette — otherwise a black site imports
    // white, because the colours were never in the HTML.
    const css: string[] = [];
    for (const f of all.filter((f) => /\.css$/i.test(f.name))) css.push(await f.text());

    const sources: SourceFile[] = [];
    for (const f of chosen) {
      // webkitRelativePath is set when a whole folder is dropped, and it is
      // what makes subfolder links resolve correctly.
      const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
      sources.push({ path, html: await f.text(), css });
    }
    const base = chosen[0].name.replace(/\.html?$/i, "");
    await analyze(sources, sources.length > 1 ? undefined : base);
  }

  async function create() {
    if (!report) return;
    setBusy(true);
    try {
      const res = await fetch("/api/demo-pages/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          title: title || undefined,
          mode,
          dryRun: false,
          exclude: [...excluded],
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast.success(report.multiPage ? `Demo importado con ${report.pages.length} páginas` : "Demo importado");
      close();
      router.push(`/demos/${body.id}`);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No se pudo crear el demo");
      setBusy(false);
    }
  }

  function toggleSection(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage(page: SectionsReportPage) {
    const ids = page.sections.map((s) => s.id);
    const allOff = ids.every((id) => excluded.has(id));
    setExcluded((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (allOff) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function toggleVerbatimPage(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!open) return null;

  const kept =
    report?.mode === "sections"
      ? report.pages.flatMap((p) => p.sections).filter((s) => !excluded.has(s.id)).length
      : (report?.pages.filter((p) => !excluded.has(p.id)).length ?? 0);
  const livePages =
    report?.mode === "sections"
      ? report.pages.filter((p) => p.sections.some((s) => !excluded.has(s.id))).length
      : kept;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-xl border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            {report && (
              <button
                onClick={reset}
                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                title="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-base font-semibold">
              {report ? "Revisá lo que encontramos" : "Importar páginas HTML"}
            </h2>
          </div>
          <button onClick={close} className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!report ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("verbatim")}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors cursor-pointer",
                  mode === "verbatim" ? "border-primary bg-primary/5" : "hover:border-primary/40"
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Lock className="h-3.5 w-3.5" /> Diseño original
                </span>
                <span className="text-xs text-muted-foreground">
                  Se ve exactamente igual al original. No se edita visualmente.
                </span>
              </button>
              <button
                onClick={() => setMode("sections")}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors cursor-pointer",
                  mode === "sections" ? "border-primary bg-primary/5" : "hover:border-primary/40"
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5" /> Secciones editables
                </span>
                <span className="text-xs text-muted-foreground">
                  Editable en el builder. No conserva el CSS del original.
                </span>
              </button>
            </div>

            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(["url", "github", "file"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                    tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "url" ? "Desde una URL" : t === "github" ? "Desde GitHub" : "Subir archivos"}
                </button>
              ))}
            </div>

            {tab === "file" ? (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    void takeFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
                    dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  {busy ? (
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium">
                    {busy ? "Leyendo las páginas..." : "Arrastrá los archivos .html o hacé clic"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Varios .html se importan como un solo demo con sus páginas. Sumá el .css para que viajen los colores.
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".html,.htm,.css,text/html"
                  multiple
                  className="hidden"
                  onChange={(e) => void takeFiles(e.target.files)}
                />
              </>
            ) : tab === "github" ? (
              <GithubPicker busy={busy} onPick={(picked, name) => void analyze(picked, name)} />
            ) : (
              <UrlPicker
                busy={busy}
                onPick={(picked, name) => void analyze(picked.map((f) => ({ ...f, rendered: true })), name)}
              />
            )}

            <p className="text-xs text-muted-foreground">
              {mode === "verbatim"
                ? "Guardamos el HTML y el CSS del original tal cual. Las imágenes y los enlaces se resuelven, pero no vas a poder editar el texto ni el estilo desde el builder."
                : "El contenido, las imágenes y los enlaces se conservan. El CSS del original no: el demo se vuelve a dibujar con la plantilla y la marca del CRM, que es lo que lo hace editable acá."}
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Nombre del demo</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm border rounded-lg px-3 py-2 bg-background"
              />
            </label>

            {report.linksRewired > 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 p-2.5 text-xs text-green-800">
                <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Reconectamos {report.linksRewired} {report.linksRewired === 1 ? "enlace" : "enlaces"} entre páginas —
                el menú va a navegar dentro del demo, no a archivos sueltos.
              </p>
            )}

            {report.warnings.map((w, i) => (
              <p
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2.5 text-xs text-amber-800"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {w}
              </p>
            ))}

            {report.mode === "verbatim" ? (
              <>
                <p className="text-sm font-medium">
                  {report.pages.length} {report.pages.length === 1 ? "página" : "páginas"} · diseño original
                </p>
                <div className="space-y-1.5">
                  {report.pages.map((page) => {
                    const on = !excluded.has(page.id);
                    return (
                      <label
                        key={page.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors",
                          on ? "hover:border-primary/40" : "opacity-45"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleVerbatimPage(page.id)}
                          className="cursor-pointer"
                        />
                        {page.isHome && <Home className="h-3.5 w-3.5 shrink-0 text-primary" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium">{page.title}</span>
                            <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {page.isHome ? "/" : `/${page.slug}`}
                            </code>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{page.path}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {Math.max(1, Math.round(page.bytes / 1024))} KB
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {report.multiPage
                      ? `${report.pages.length} páginas · ${kept} secciones`
                      : `${kept} ${kept === 1 ? "sección" : "secciones"}`}
                  </p>
                  <span className="text-xs text-muted-foreground">{report.images} imágenes</span>
                </div>

                <div className="space-y-2">
                  {report.pages.map((page) => {
                    const isOpen = openPages.has(page.id);
                    const on = page.sections.filter((s) => !excluded.has(s.id)).length;
                    return (
                      <div key={page.id} className="rounded-lg border">
                        {report.multiPage && (
                          <div className="flex items-center gap-2 border-b px-3 py-2">
                            <button
                              onClick={() =>
                                setOpenPages((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(page.id)) next.delete(page.id);
                                  else next.add(page.id);
                                  return next;
                                })
                              }
                              className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                            >
                              {page.isHome && <Home className="h-3.5 w-3.5 shrink-0 text-primary" />}
                              <span className="truncate text-sm font-medium">{page.title}</span>
                              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {page.isHome ? "/" : `/${page.slug}`}
                              </code>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {on}/{page.sections.length}
                              </span>
                            </button>
                            <button
                              onClick={() => togglePage(page)}
                              className="shrink-0 text-xs text-primary hover:underline cursor-pointer"
                            >
                              {on === 0 ? "Incluir" : "Excluir"}
                            </button>
                          </div>
                        )}

                        {(isOpen || !report.multiPage) && (
                          <div className="space-y-1.5 p-2">
                            {page.sections.length === 0 ? (
                              <p className="px-1 py-2 text-xs text-muted-foreground">
                                No encontramos contenido importable en esta página.
                              </p>
                            ) : (
                              page.sections.map((s) => {
                                const sectionKept = !excluded.has(s.id);
                                return (
                                  <label
                                    key={s.id}
                                    className={cn(
                                      "flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition-colors",
                                      sectionKept ? "hover:border-primary/40" : "opacity-45"
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={sectionKept}
                                      onChange={() => toggleSection(s.id)}
                                      className="mt-0.5 cursor-pointer"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium">{SECTION_LABELS[s.type]}</span>
                                        <span
                                          className={cn(
                                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                            CONFIDENCE_STYLE[s.confidence]
                                          )}
                                        >
                                          {CONFIDENCE_LABEL[s.confidence]}
                                        </span>
                                        {s.itemCount > 0 && (
                                          <span className="text-xs text-muted-foreground">{s.itemCount} elementos</span>
                                        )}
                                      </div>
                                      {s.heading && (
                                        <p className="mt-0.5 truncate text-xs text-foreground/80">{s.heading}</p>
                                      )}
                                      <p className="mt-0.5 text-xs text-muted-foreground">{s.evidence}</p>
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex items-center gap-2 border-t pt-4">
              <button
                onClick={create}
                disabled={busy || kept === 0}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {busy
                  ? "Creando..."
                  : report.mode === "verbatim"
                    ? `Crear demo · ${livePages} ${livePages === 1 ? "página" : "páginas"}`
                    : report.multiPage
                      ? `Crear demo · ${livePages} ${livePages === 1 ? "página" : "páginas"}`
                      : `Crear demo con ${kept} ${kept === 1 ? "sección" : "secciones"}`}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer"
              >
                <FileCode className="h-3.5 w-3.5" /> Otros archivos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
