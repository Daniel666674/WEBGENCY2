"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCode, GitBranch, Loader2, Lock, Search, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
 * Repo → branch → .html file.
 *
 * Loads the file's contents and hands them up; the parent runs the same
 * analysis it runs for an uploaded file, so both entry paths land in the same
 * review step.
 */
export function GithubPicker({
  busy,
  onPick,
}: {
  busy: boolean;
  onPick: (html: string, baseUrl: string, name: string) => void;
}) {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [ref, setRef] = useState("");
  const [files, setFiles] = useState<RepoFile[] | null>(null);
  const [filter, setFilter] = useState("");
  const [fetching, setFetching] = useState<string | null>(null);

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

  async function pick(path: string) {
    if (!repo) return;
    setFetching(path);
    try {
      const res = await fetch(
        `/api/integrations/github?action=file&repo=${encodeURIComponent(repo.fullName)}&path=${encodeURIComponent(path)}&ref=${encodeURIComponent(ref)}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);

      // Relative image paths resolve to raw.githubusercontent.com, which needs
      // auth on a private repo — so those images would 404 for the client
      // looking at the published demo. Say so now, not after publishing.
      if (repo.private) {
        toast.warning("El repositorio es privado: las imágenes con rutas relativas no van a cargar en el demo publicado.");
      }
      onPick(body.content, body.rawBaseUrl, path.split("/").pop()!.replace(/\.html?$/i, ""));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos traer el archivo");
    } finally {
      setFetching(null);
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
          Se conecta una sola vez con un token de acceso de GitHub con permiso de lectura. Lo hace el owner desde
          Configuración.
        </p>
        <Link
          href="/settings/integraciones"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Settings className="h-3.5 w-3.5" /> Ir a Integraciones
        </Link>
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
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {shownFiles.map((f) => (
              <button
                key={f.path}
                disabled={busy || fetching !== null}
                onClick={() => void pick(f.path)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors cursor-pointer",
                  "hover:border-primary/40 disabled:opacity-50"
                )}
              >
                {fetching === f.path ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{f.path}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{Math.max(1, Math.round(f.size / 1024))} KB</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
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
