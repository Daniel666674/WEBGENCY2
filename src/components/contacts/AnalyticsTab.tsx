"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Link2, AlertCircle, RefreshCw, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { AnalyticsDashboard, type AnalyticsData } from "./AnalyticsDashboard";
import { cn } from "@/lib/utils";

interface AnalyticsConfig {
  ga4PropertyId: string | null;
  ga4MeasurementId: string | null;
  gscSiteUrl: string | null;
}

type ReportData =
  | { connected: false; reason?: string; detail?: string }
  | AnalyticsData;

const REASON_LABELS: Record<string, string> = {
  auth_disabled:
    "Falta conectar Google. Recomendado: agrega GOOGLE_SERVICE_ACCOUNT_KEY con acceso de lectura a la propiedad GA4 y al sitio de Search Console.",
  not_signed_in: "Inicia sesión con Google para ver métricas en vivo.",
  not_configured: "Agrega el GA4 Property ID o el sitio de Search Console en la configuración.",
  no_google_token: "Tu cuenta de Google no tiene un token válido — vuelve a iniciar sesión.",
  ga4_error:
    "No se pudo consultar GA4 — revisa que la cuenta de servicio tenga acceso de lectura a esta propiedad y que el Property ID sea correcto.",
  gsc_error:
    "No se pudo consultar Search Console — revisa que la cuenta de servicio esté agregada como usuario en este sitio.",
};

const DAY_OPTIONS = [7, 28, 30, 90] as const;
type Days = (typeof DAY_OPTIONS)[number];

export function AnalyticsTab({ contactId }: { contactId: string }) {
  const [config, setConfig] = useState<AnalyticsConfig>({ ga4PropertyId: "", ga4MeasurementId: "", gscSiteUrl: "" });
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState<Days>(30);
  const [showConfig, setShowConfig] = useState(false);

  const loadConfig = useCallback(async () => {
    const res = await fetch(`/api/contacts/${contactId}/analytics`);
    const cfg = await res.json();
    setConfig({
      ga4PropertyId: cfg.ga4PropertyId ?? "",
      ga4MeasurementId: cfg.ga4MeasurementId ?? "",
      gscSiteUrl: cfg.gscSiteUrl ?? "",
    });
    if (!cfg.ga4PropertyId && !cfg.gscSiteUrl) setShowConfig(true);
  }, [contactId]);

  const loadReport = useCallback(async (d: Days, quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/analytics/report?days=${d}`);
      setReport(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contactId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => { loadReport(days); }, [days, loadReport]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/analytics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuración guardada");
      setShowConfig(false);
      loadReport(days);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Date filter + controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                days === d
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d === 7 ? "7 días" : d === 28 ? "28 días" : d === 30 ? "30 días" : "90 días"}
            </button>
          ))}
        </div>
        <button
          onClick={() => loadReport(days, true)}
          disabled={refreshing || loading}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Actualizar
        </button>
        <button
          onClick={() => setShowConfig((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Config
          {showConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Config panel (collapsible) */}
      {showConfig && (
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" /> Conexión GA4 / Search Console
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div>
              <Label className="text-xs">GA4 Property ID</Label>
              <Input
                placeholder="p.ej. 546141145 (numérico)"
                value={config.ga4PropertyId ?? ""}
                onChange={(e) => setConfig({ ...config, ga4PropertyId: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">GA4 Measurement ID</Label>
              <Input
                placeholder="p.ej. G-XXXXXXX (solo referencia)"
                value={config.ga4MeasurementId ?? ""}
                onChange={(e) => setConfig({ ...config, ga4MeasurementId: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Sitio en Search Console</Label>
              <Input
                placeholder="p.ej. https://cliente.com/ o sc-domain:cliente.com"
                value={config.gscSiteUrl ?? ""}
                onChange={(e) => setConfig({ ...config, gscSiteUrl: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 cursor-pointer">
              <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Guardando..." : "Guardar"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-10 text-center text-sm text-muted-foreground animate-pulse">
          Cargando métricas...
        </div>
      )}

      {/* Error / not connected */}
      {!loading && report && !report.connected && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="py-4 px-4 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {REASON_LABELS[(report as { reason?: string }).reason ?? ""] ?? "Métricas en vivo no disponibles todavía."}
              </p>
              {(report as { detail?: string }).detail && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {(report as { detail?: string }).detail}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard */}
      {!loading && report?.connected && (
        <AnalyticsDashboard data={report as AnalyticsData} />
      )}
    </div>
  );
}
