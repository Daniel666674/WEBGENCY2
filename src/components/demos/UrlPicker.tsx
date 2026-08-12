"use client";

import { useState } from "react";
import { Globe, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RenderedFile {
  path: string;
  html: string;
  baseUrl: string;
  css: string[];
}

/**
 * Import a live site by URL, rendered in a real browser first.
 *
 * This is the path that actually solves a site built with client-side
 * JavaScript. Fetching the raw file gets you `<div id="home-cats"></div>` —
 * the categories, the header, the footer only exist once a browser has run
 * the page's scripts. This tab does that first, on the server, and hands the
 * importer the DOM as a visitor actually sees it.
 *
 * Discovery is a courtesy on top: after rendering the entered URL, the
 * same-origin links found on the page are offered as a checklist, so the user
 * picks the rest of the site instead of typing every URL by hand.
 */
export function UrlPicker({
  busy,
  onPick,
}: {
  busy: boolean;
  onPick: (files: RenderedFile[], name: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [home, setHome] = useState<RenderedFile | null>(null);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [importing, setImporting] = useState(false);

  async function load() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setHome(null);
    setDiscovered([]);
    setPicked(new Set());
    try {
      const res = await fetch("/api/demo-pages/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, discover: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      const [page] = body.pages as { url: string; html: string; css: string[]; title: string }[];
      setHome({ path: page.url, html: page.html, baseUrl: page.url, css: page.css });
      setDiscovered(body.discovered ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos abrir esa página");
    } finally {
      setLoading(false);
    }
  }

  function toggle(link: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(link)) next.delete(link);
      else next.add(link);
      return next;
    });
  }

  async function importAll() {
    if (!home) return;
    setImporting(true);
    try {
      const rest =
        picked.size > 0
          ? await fetch("/api/demo-pages/render", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ urls: [...picked] }),
            }).then(async (r) => {
              const b = await r.json();
              if (!r.ok) throw new Error(b.error);
              return b.pages as { url: string; html: string; css: string[] }[];
            })
          : [];

      const files: RenderedFile[] = [
        home,
        ...rest.map((p) => ({ path: p.url, html: p.html, baseUrl: p.url, css: p.css })),
      ];

      const name = (() => {
        try {
          return new URL(home.path).hostname.replace(/^www\./, "");
        } catch {
          return "Demo";
        }
      })();

      onPick(files, name);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos traer esas páginas");
    } finally {
      setImporting(false);
    }
  }

  const shown = discovered.filter((d) => d.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
          placeholder="https://tusitio.com"
          className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background"
        />
        <button
          onClick={() => void load()}
          disabled={loading || !url.trim()}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
          {loading ? "Abriendo..." : "Abrir"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Abrimos la página en un navegador real, como la ve un visitante — funciona con sitios armados con JavaScript
        (categorías, menús, listados que un archivo estático no muestra).
      </p>

      {home && (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
            <Globe className="h-3.5 w-3.5" /> Página cargada correctamente
          </p>

          {discovered.length > 0 && (
            <>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  Encontramos {discovered.length} enlaces en el sitio — elegí cuáles sumar
                </span>
                {discovered.length > 6 && (
                  <div className="relative w-32">
                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Filtrar..."
                      className="w-full rounded border bg-background py-1 pl-6 pr-2 text-xs"
                    />
                  </div>
                )}
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {shown.map((link) => {
                  const on = picked.has(link);
                  let label = link;
                  try {
                    label = new URL(link).pathname || "/";
                  } catch {
                    /* keep raw */
                  }
                  return (
                    <button
                      key={link}
                      onClick={() => toggle(link)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
                        on ? "border-primary/60 bg-primary/5" : "hover:border-primary/40"
                      )}
                    >
                      <Plus className={cn("h-3 w-3 shrink-0 transition-transform", on && "rotate-45 text-primary")} />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <button
            onClick={() => void importAll()}
            disabled={busy || importing}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {importing
              ? "Renderizando páginas..."
              : picked.size > 0
                ? `Analizar ${picked.size + 1} páginas`
                : "Analizar esta página"}
          </button>
        </div>
      )}
    </div>
  );
}
