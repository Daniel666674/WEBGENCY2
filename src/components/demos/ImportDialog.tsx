"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileCode,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SECTION_LABELS } from "@/lib/demo/types";
import type { SectionType } from "@/lib/demo/types";
import { GithubPicker } from "./GithubPicker";

interface ReportSection {
  id: string;
  type: SectionType;
  variant: string;
  confidence: "high" | "medium" | "low";
  evidence: string;
  itemCount: number;
  heading: string;
}

interface Report {
  sections: ReportSection[];
  warnings: string[];
  brand: { name: string; accent: string; detectedColors: boolean };
  images: number;
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
 * Import an HTML page and turn it into an editable demo.
 *
 * Two steps, and the second one is what makes this usable: the file is parsed
 * server-side without saving anything, and the result is shown section by
 * section before the demo exists. An importer that silently produced a
 * mangled demo would cost more time than building the page by hand.
 */
export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"file" | "github">("file");
  const [html, setHtml] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [title, setTitle] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setHtml("");
    setSourceUrl("");
    setTitle("");
    setReport(null);
    setExcluded(new Set());
    setDragging(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function analyze(source: string, url?: string, name?: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/demo-pages/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: source, sourceUrl: url, title: name, dryRun: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setHtml(source);
      setSourceUrl(url ?? "");
      setTitle(name ?? body.report.brand.name ?? "");
      setReport(body.report);
      setExcluded(new Set());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No pudimos leer ese archivo");
    } finally {
      setBusy(false);
    }
  }

  async function takeFile(file: File | undefined) {
    if (!file) return;
    if (!/\.html?$/i.test(file.name) && file.type !== "text/html") {
      return toast.error("Tiene que ser un archivo .html");
    }
    const text = await file.text();
    await analyze(text, undefined, file.name.replace(/\.html?$/i, ""));
  }

  async function create() {
    if (!report) return;
    setBusy(true);
    try {
      const res = await fetch("/api/demo-pages/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          sourceUrl: sourceUrl || undefined,
          title: title || undefined,
          dryRun: false,
          exclude: [...excluded],
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      toast.success("Demo importado");
      close();
      router.push(`/demos/${body.id}`);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "No se pudo crear el demo");
      setBusy(false);
    }
  }

  if (!open) return null;

  const kept = report ? report.sections.filter((s) => !excluded.has(s.id)).length : 0;

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
              {report ? "Revisá lo que encontramos" : "Importar una página HTML"}
            </h2>
          </div>
          <button onClick={close} className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!report ? (
          <div className="p-5 space-y-4">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(["file", "github"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                    tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "file" ? "Subir archivo" : "Desde GitHub"}
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
                    void takeFile(e.dataTransfer.files[0]);
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
                    {busy ? "Leyendo la página..." : "Arrastrá el archivo .html o hacé clic"}
                  </p>
                  <p className="text-xs text-muted-foreground">Hasta 2 MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={(e) => void takeFile(e.target.files?.[0])}
                />
              </>
            ) : (
              <GithubPicker
                busy={busy}
                onPick={(content, url, name) => void analyze(content, url, name)}
              />
            )}

            <p className="text-xs text-muted-foreground">
              El contenido, las imágenes y los enlaces se conservan. El CSS del original no: el demo se vuelve a
              dibujar con la plantilla y la marca del CRM, que es lo que lo hace editable acá.
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

            {report.warnings.map((w, i) => (
              <p
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2.5 text-xs text-amber-800"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {w}
              </p>
            ))}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {report.sections.length} {report.sections.length === 1 ? "sección" : "secciones"}
                </p>
                <span className="text-xs text-muted-foreground">{report.images} imágenes</span>
              </div>

              {report.sections.map((s) => {
                const on = !excluded.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition-colors",
                      on ? "hover:border-primary/40" : "opacity-45"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setExcluded((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id);
                          else next.add(s.id);
                          return next;
                        })
                      }
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
                      {s.heading && <p className="mt-0.5 truncate text-xs text-foreground/80">{s.heading}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.evidence}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-2 border-t pt-4">
              <button
                onClick={create}
                disabled={busy || kept === 0}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {busy ? "Creando..." : `Crear demo con ${kept} ${kept === 1 ? "sección" : "secciones"}`}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer"
              >
                <FileCode className="h-3.5 w-3.5" /> Otro archivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
