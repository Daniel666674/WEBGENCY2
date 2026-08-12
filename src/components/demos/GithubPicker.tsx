"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckSquare, FileCode, GitBranch, Loader2, Lock, Search, Settings, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";

interface Repo {
  fullName: string;
  private: boolean;
  defaultBranch: string;
}

interface RepoFile {
  path: string;
  size: number;
}

/**
 * Repo → branch → the .html files that make up the site.
 *
 * Multi-select, because a site in a repo is `index.html` plus the pages it
 * links to. Importing them one at a time would produce unrelated demos whose
 * menus point at dead `.html` files; imported together they become one demo
 * with real pages and working navigation.
 *
 * Loads the contents and hands them up; the parent runs the same analysis it
 * runs for an uploaded file, so both entry paths land in the same review step.
 */
export function GithubPicker({
  busy,
  onPick,
}: {
  busy: boolean;
  onPick: (files: { path: string; html: string; baseUrl: string; css: string[] }[], name: string) => void;
}) {
  const { activeUser } = useUser();
  const isOwner = activeUser?.role === "owner";
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [ref, setRef] = useState("");
  const [files, setFiles] = useState<RepoFile[] | null>(null);
  const [filter, setFilter] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetch("/api/integrations/github?action=repos")
      .then(async (r) => {
        const body = await r.json();
        if (r.status === 428) {
          setNotConnected(true);
          return;
        }
        if (!r.ok) throw new Error(body.error);
        setRepos(body.repos);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al listar repositorios"))
      .finally(() => setLoading(false));
  }, []);

  async function openRepo(r: Repo) {
    setRepo(r);
    setRef(r.defaultBranch);
    setFiles(null);
    setFilter("");
    setPicked(new Set());
    try {
      const res = await fetch(
        `/api/integrations/github?action=files&repo=${encodeURIComponent(r.fullName)}&ref=${encodeURIComponent(r.defaultBranch)}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setFiles(body.files);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al listar archivos");
      setFiles([]);
    }
  }

  function toggle(path: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function importPicked() {
    if (!repo || picked.size === 0) return;
    setFetching(true);
    try {
      // Sequential on purpose: firing eight parallel requests at the GitHub
      // API through one token is the fastest way to get rate-limited.
      const get = async (path: string) => {
        const res = await fetch(
          `/api/integrations/github?action=file&repo=${encodeURIComponent(repo.fullName)}&path=${encodeURIComponent(path)}&ref=${encodeURIComponent(ref)}`
        );
        const body = await res.json();
        if (!res.ok) throw new Error(`${path}: ${body.error}`);
        return body as { content: string; rawBaseUrl: string };
      };

      // Stylesheets are fetched too, and they are not optional polish: a real
      // site keeps its palette in a linked .css, so importing the HTML alone
      // turns a black site into a white one. Cached across pages because a
      // site's pages share one stylesheet.
      const cssCache = new Map<string, string>();
      const loaded: { path: string; html: string; baseUrl: string; css: string[] }[] = [];

      for (const path of picked) {
        const file = await get(path);
        const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
        const css: string[] = [];

        for (const href of stylesheetHrefs(file.content).slice(0, 4)) {
          const cssPath = repoPath(href, dir);
          if (!cssPath) continue;
          if (!cssCache.has(cssPath)) {
            try {
              cssCache.set(cssPath, (await get(cssPath)).content);
            } catch {
              // A missing or unreadable stylesheet costs colours, not the
              // import — carry on with the template's palette.
              cssCache.set(cssPath, "");
            }
          }
          const text = cssCache.get(cssPath);
          if (text) css.push(text);
        }

        loaded.push({ path, html: file.content, baseUrl: file.rawBaseUrl, css });
      }

      // Relative image paths resolve to raw.githubusercontent.com, which needs
      // auth on a private repo — so those images would 404 for the client
      // looking at the published demo. Say so now, not after publishing.
      if (repo.private) {
        toast.warning("El repositorio es privado: las imágenes con rutas relativas no van a cargar en el demo publicado.");
      }
      onPick(loaded, repo.fullName.split("/").pop() ?? "Demo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos traer los archivos");
    } finally {
      setFetching(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Conectando con GitHub...
      </div>
    );
  }

  if (notConnected) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <GitBranch className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">GitHub no está conectado</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {isOwner
            ? "Se conecta una sola vez con un token de acceso de GitHub con permiso de lectura."
            : "Se conecta una sola vez, y solo el owner puede hacerlo. Mientras tanto podés subir el archivo .html desde la otra pestaña."}
        </p>
        {/* Only the owner gets the link: Configuración is permission-gated, so
            sending anyone else there is a trip to a lock screen. */}
        {isOwner && (
          <Link
            href="/settings/integraciones"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Settings className="h-3.5 w-3.5" /> Ir a Integraciones
          </Link>
        )}
      </div>
    );
  }

  if (!repo) {
    const shown = (repos ?? []).filter((r) => r.fullName.toLowerCase().includes(filter.toLowerCase()));
    return (
      <div className="space-y-2">
        <SearchBox value={filter} onChange={setFilter} placeholder="Buscar repositorio..." />
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {shown.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Ningún repositorio coincide.</p>
          ) : (
            shown.map((r) => (
              <button
                key={r.fullName}
                onClick={() => void openRepo(r)}
                className="flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors hover:border-primary/40 cursor-pointer"
              >
                <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{r.fullName}</span>
                {r.private && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  const shownFiles = (files ?? []).filter((f) => f.path.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setRepo(null); setFilter(""); }}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          ← Repositorios
        </button>
        <span className="truncate text-xs text-muted-foreground">{repo.fullName}</span>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="ml-auto w-28 rounded border bg-background px-2 py-1 text-xs"
          title="Rama o commit"
        />
      </div>

      {files === null ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Buscando archivos .html...
        </div>
      ) : files.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No encontramos archivos .html en esta rama.
        </p>
      ) : (
        <>
          <SearchBox value={filter} onChange={setFilter} placeholder="Filtrar archivos..." />

          <div className="flex items-center justify-between px-0.5 text-xs text-muted-foreground">
            <span>
              {picked.size === 0
                ? "Elegí las páginas del sitio"
                : `${picked.size} ${picked.size === 1 ? "página elegida" : "páginas elegidas"}`}
            </span>
            <button
              onClick={() =>
                setPicked(picked.size === shownFiles.length ? new Set() : new Set(shownFiles.map((f) => f.path)))
              }
              className="text-primary hover:underline cursor-pointer"
            >
              {picked.size === shownFiles.length ? "Ninguna" : "Todas"}
            </button>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {shownFiles.map((f) => {
              const on = picked.has(f.path);
              return (
                <button
                  key={f.path}
                  disabled={busy || fetching}
                  onClick={() => toggle(f.path)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors cursor-pointer disabled:opacity-50",
                    on ? "border-primary/60 bg-primary/5" : "hover:border-primary/40"
                  )}
                >
                  {on ? (
                    <CheckSquare className="h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : (
                    <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{f.path}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {Math.max(1, Math.round(f.size / 1024))} KB
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => void importPicked()}
            disabled={busy || fetching || picked.size === 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            {fetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {fetching
              ? "Trayendo archivos..."
              : picked.size > 1
                ? `Analizar ${picked.size} páginas`
                : "Analizar página"}
          </button>

          {picked.size > 1 && (
            <p className="text-xs text-muted-foreground">
              La página <strong>index.html</strong> queda como inicio y el resto cuelgan de ella. Los enlaces entre
              páginas se reconectan solos.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** `<link rel="stylesheet" href="...">` hrefs, minus the font CDNs. */
function stylesheetHrefs(html: string): string[] {
  const out: string[] = [];
  for (const [, tag] of html.matchAll(/<link\b([^>]*)>/gi)) {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) continue;
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (href && !/fonts\.googleapis|fonts\.gstatic|^https?:/i.test(href)) out.push(href);
  }
  return out;
}

/** Resolves a stylesheet href to a repo path, or "" if it is not in the repo. */
function repoPath(href: string, fromDir: string): string {
  const clean = href.split(/[?#]/)[0];
  const segments = clean.startsWith("/") ? clean.slice(1).split("/") : (fromDir + clean).split("/");
  const out: string[] = [];
  for (const seg of segments) {
    if (!seg || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background py-2 pl-8 pr-3 text-sm"
      />
    </div>
  );
}
