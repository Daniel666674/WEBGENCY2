"use client";

import { useState, useRef, useEffect } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, X, Loader2, Link2, Image as ImageIcon, Film, LibraryBig, Trash2, Search } from "lucide-react";
import type { MediaRef } from "@/lib/demo/types";

interface Props {
  value?: MediaRef;
  onChange: (m: MediaRef | undefined) => void;
  label?: string;
  accept?: "image" | "video" | "both";
  compact?: boolean;
}

interface AssetRow {
  id: string;
  url: string;
  alt: string | null;
  kind: "image" | "video";
}

function LibraryPanel({
  accept, onPick, onClose,
}: {
  accept: "image" | "video" | "both";
  onPick: (a: AssetRow) => void;
  onClose: () => void;
}) {
  const [assets, setAssets] = useState<AssetRow[] | null>(null);

  useEffect(() => {
    fetch("/api/demo-assets")
      .then((r) => r.json())
      .then((d) => setAssets(Array.isArray(d) ? d : []))
      .catch(() => setAssets([]));
  }, []);

  async function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setAssets((cur) => (cur ? cur.filter((a) => a.id !== id) : cur));
    await fetch(`/api/demo-assets/${id}`, { method: "DELETE" });
  }

  const filtered = (assets ?? []).filter((a) => accept === "both" || a.kind === accept);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">Biblioteca de medios</span>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {assets === null ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-muted-foreground">
          Aún no has subido nada. Lo que subas aquí queda disponible para reutilizar en cualquier demo.
        </p>
      ) : (
        <div className="grid max-h-52 grid-cols-4 gap-1.5 overflow-y-auto">
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a)}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
              title={a.alt ?? ""}
            >
              {a.kind === "video" ? (
                <video src={a.url} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.alt ?? ""} className="h-full w-full object-cover" />
              )}
              <span
                onClick={(e) => remove(a.id, e)}
                role="button"
                tabIndex={0}
                className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface StockResult { id: string; url: string; alt: string; credit: string }

function StockSearchPanel({ onPick, onClose }: { onPick: (r: StockResult) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StockResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!q.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/demo-pages/image-search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo buscar"); setResults([]); return; }
      setResults(data.results ?? []);
    } catch {
      setError("No se pudo buscar");
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-2">
      <div className="flex items-center gap-1.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          placeholder="Ej. panadería, oficina moderna, playa"
          autoFocus
          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
        />
        <button type="button" onClick={search} disabled={busy || !q.trim()} className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={onClose} className="rounded-md border border-border px-2 py-1.5 text-xs">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {results && results.length > 0 && (
        <div className="grid max-h-52 grid-cols-4 gap-1.5 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onPick(r)}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
              title={`${r.alt} — foto de ${r.credit} en Unsplash`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt={r.alt} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {r.credit}
              </span>
            </button>
          ))}
        </div>
      )}
      {results && results.length === 0 && !error && (
        <p className="py-3 text-center text-[11px] text-muted-foreground">Sin resultados. Prueba otra búsqueda.</p>
      )}
    </div>
  );
}

export function MediaPicker({ value, onChange, label = "Imagen", accept = "both", compact }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptAttr =
    accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*";

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/attachments/blob-upload",
      });
      const kind: MediaRef["kind"] = file.type.startsWith("video") ? "video" : "image";
      const alt = file.name.replace(/\.[^.]+$/, "");
      onChange({ url: blob.url, alt, kind });
      // Best-effort — a failed registration shouldn't block the upload the
      // user actually asked for.
      fetch("/api/demo-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, alt, kind }),
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir el archivo");
    } finally {
      setBusy(false);
    }
  }

  function applyUrl() {
    const u = urlDraft.trim();
    if (!u) return;
    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(u) || /youtube|youtu\.be|vimeo/.test(u);
    onChange({ url: u, alt: "", kind: isVideo ? "video" : "image" });
    setUrlDraft("");
    setShowUrl(false);
  }

  function pickFromLibrary(a: AssetRow) {
    onChange({ url: a.url, alt: a.alt ?? "", kind: a.kind });
    setShowLibrary(false);
  }

  function pickFromStock(r: StockResult) {
    onChange({ url: r.url, alt: r.alt, kind: "image" });
    setShowStock(false);
    fetch("/api/demo-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: r.url, alt: r.alt, kind: "image" }),
    }).catch(() => {});
  }

  if (value?.url) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
        <div className="relative group rounded-lg overflow-hidden border border-border bg-muted">
          {value.kind === "video" ? (
            /youtube|youtu\.be|vimeo/.test(value.url) ? (
              <div className="flex items-center gap-2 p-3 text-xs">
                <Film className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{value.url}</span>
              </div>
            ) : (
              <video src={value.url} className={compact ? "w-full h-20 object-cover" : "w-full h-32 object-cover"} muted />
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt="" className={compact ? "w-full h-20 object-cover" : "w-full h-32 object-cover"} />
          )}
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-1.5 right-1.5 rounded-md bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Quitar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {showStock ? (
        <StockSearchPanel onPick={pickFromStock} onClose={() => setShowStock(false)} />
      ) : showLibrary ? (
        <LibraryPanel accept={accept} onPick={pickFromLibrary} onClose={() => setShowLibrary(false)} />
      ) : showUrl ? (
        <div className="flex gap-1.5">
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
            placeholder="Pega el enlace (YouTube, imagen…)"
            autoFocus
            className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          />
          <button type="button" onClick={applyUrl} className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">
            Usar
          </button>
          <button type="button" onClick={() => setShowUrl(false)} className="rounded-md border border-border px-2 py-1.5 text-xs">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`flex ${compact ? "h-20" : "h-28"} flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/40 text-center transition-colors hover:border-primary/60`}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground">Subiendo…</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-muted-foreground">
                {accept === "video" ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground"
                >
                  <Upload className="h-3 w-3" /> Subir
                </button>
                <button
                  type="button"
                  onClick={() => setShowLibrary(true)}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium"
                >
                  <LibraryBig className="h-3 w-3" /> Biblioteca
                </button>
                {accept !== "video" && (
                  <button
                    type="button"
                    onClick={() => setShowStock(true)}
                    className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium"
                  >
                    <Search className="h-3 w-3" /> Buscar foto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowUrl(true)}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium"
                >
                  <Link2 className="h-3 w-3" /> Enlace
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground">o arrastra el archivo aquí</span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
