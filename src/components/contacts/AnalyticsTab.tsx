"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Search, Save, Link2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsConfig {
  ga4PropertyId: string | null;
  ga4MeasurementId: string | null;
  gscSiteUrl: string | null;
}

interface ReportData {
  connected: boolean;
  reason?: string;
  detail?: string;
  ga4?: { sessions: number; users: number; conversions: number } | null;
  gsc?: { clicks: number; impressions: number; avgPosition: number } | null;
}

const REASON_LABELS: Record<string, string> = {
  auth_disabled: "El login con Google aun no esta activado en este CRM.",
  not_signed_in: "Inicia sesion con Google para ver metricas en vivo.",
  not_configured: "Agrega el GA4 Property ID o el sitio de Search Console arriba.",
  no_google_token: "Tu cuenta de Google no tiene un token valido — vuelve a iniciar sesion.",
  ga4_error: "No se pudo consultar GA4 — revisa el Property ID y los permisos.",
  gsc_error: "No se pudo consultar Search Console — revisa el sitio y los permisos.",
};

export function AnalyticsTab({ contactId }: { contactId: string }) {
  const [config, setConfig] = useState<AnalyticsConfig>({
    ga4PropertyId: "",
    ga4MeasurementId: "",
    gscSiteUrl: "",
  });
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([
      fetch(`/api/contacts/${contactId}/analytics`).then((r) => r.json()),
      fetch(`/api/contacts/${contactId}/analytics/report`).then((r) => r.json()),
    ]).then(([cfg, rep]) => {
      setConfig({
        ga4PropertyId: cfg.ga4PropertyId ?? "",
        ga4MeasurementId: cfg.ga4MeasurementId ?? "",
        gscSiteUrl: cfg.gscSiteUrl ?? "",
      });
      setReport(rep);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [contactId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/analytics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuracion guardada");
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground py-4">Cargando...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Conexion GA4 / Search Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>GA4 Property ID</Label>
            <Input
              placeholder="p.ej. 123456789 (numerico, no el Measurement ID)"
              value={config.ga4PropertyId ?? ""}
              onChange={(e) => setConfig({ ...config, ga4PropertyId: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>GA4 Measurement ID</Label>
            <Input
              placeholder="p.ej. G-XXXXXXX (solo referencia, para el tag del sitio)"
              value={config.ga4MeasurementId ?? ""}
              onChange={(e) => setConfig({ ...config, ga4MeasurementId: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Sitio en Search Console</Label>
            <Input
              placeholder="p.ej. https://cliente.com/ o sc-domain:cliente.com"
              value={config.gscSiteUrl ?? ""}
              onChange={(e) => setConfig({ ...config, gscSiteUrl: e.target.value })}
              className="mt-1"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="cursor-pointer">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Guardando..." : "Guardar"}
          </Button>
        </CardContent>
      </Card>

      {report && !report.connected && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4 px-4 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              {REASON_LABELS[report.reason ?? ""] ?? "Metricas en vivo no disponibles todavia."}
              {report.detail && <span className="block text-xs text-amber-700 mt-1">{report.detail}</span>}
            </p>
          </CardContent>
        </Card>
      )}

      {report?.connected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.ga4 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> GA4 — ultimos 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sesiones</span>
                  <span className="font-semibold">{report.ga4.sessions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usuarios</span>
                  <span className="font-semibold">{report.ga4.users.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Conversiones</span>
                  <span className="font-semibold text-primary">{report.ga4.conversions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
          {report.gsc && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Search className="h-4 w-4" /> Search Console — ultimos 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clics</span>
                  <span className="font-semibold">{report.gsc.clicks.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Impresiones</span>
                  <span className="font-semibold">{report.gsc.impressions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Posicion promedio</span>
                  <span className="font-semibold">{report.gsc.avgPosition.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
