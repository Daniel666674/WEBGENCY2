"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, X, Loader2, Link2, Image as ImageIcon, Film } from "lucide-react";
import type { MediaRef } from "@/lib/demo/types";

interface Props {
  value?: MediaRef;
  onChange: (m: MediaRef | undefined) => void;
  label?: string;
  accept?: "image" | "video" | "both";
  compact?: boolean;
}

export function MediaPicker({ value, onChange, label = "Imagen", accept = "both", compact }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
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
      onChange({
        url: blob.url,
        alt: file.name.replace(/\.[^.]+$/, ""),
        kind: file.type.startsWith("video") ? "video" : "image",
      });
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

      {showUrl ? (
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground"
                >
                  <Upload className="h-3 w-3" /> Subir
                </button>
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
