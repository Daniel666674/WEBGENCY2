"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, GitBranch, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Connects GitHub so the demo importer can read .html files from a repo.
 *
 * The token is write-only from the browser's point of view: the server
 * returns whether one is stored and its last four characters, never the value.
 * Saving with the field empty leaves the stored token untouched, so editing
 * anything else here cannot wipe it.
 */
export function GithubConnection() {
  const [status, setStatus] = useState<{ configured: boolean; hint: string } | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/github")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!token.trim()) return toast.error("Pegá un token para guardar");
    setSaving(true);
    try {
      const res = await fetch("/api/settings/github", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStatus(await res.json());
      setToken("");
      toast.success("GitHub conectado");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!confirm("¿Desconectar GitHub? El importador de demos dejará de poder leer repositorios.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/github", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStatus({ configured: false, hint: "" });
      toast.success("GitHub desconectado");
    } catch {
      toast.error("Error al desconectar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="h-4 w-4" /> GitHub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Permite importar páginas HTML directamente desde tus repositorios al builder de demos.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : (
          <>
            {status?.configured && (
              <p className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 p-2.5 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Conectado con el token {status.hint}
              </p>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {status?.configured ? "Reemplazar el token" : "Token de acceso personal"}
              </span>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="github_pat_..."
                className="text-sm border rounded-lg px-3 py-2 bg-background"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={save}
                disabled={saving || !token.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Conectar"}
              </button>
              {status?.configured && (
                <button
                  onClick={disconnect}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Desconectar
                </button>
              )}
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Cómo generar el token</p>
              <p>1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens</p>
              <p>2. Elegí los repositorios que querés que el CRM pueda leer</p>
              <p>3. En Permissions → Repository permissions, poné <strong>Contents: Read-only</strong></p>
              <p>4. Generá el token y pegalo acá. El CRM solo lee; nunca escribe en tus repos.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
