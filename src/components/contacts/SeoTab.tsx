"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Save } from "lucide-react";
import { toast } from "sonner";
import type { SeoData } from "@/types";

const EMPTY: SeoData = {
  indexingStatus: null,
  sitemapCoverage: null,
  structuredDataCompleteness: null,
  ga4Metrics: null,
  gscMetrics: null,
  openContentGaps: [],
};

export function SeoTab({ contactId, initialData }: { contactId: string; initialData: SeoData | null }) {
  const router = useRouter();
  const data = initialData ?? EMPTY;
  const [saving, setSaving] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState(data.indexingStatus ?? "");
  const [sitemapTotal, setSitemapTotal] = useState(String(data.sitemapCoverage?.total ?? ""));
  const [sitemapIndexed, setSitemapIndexed] = useState(String(data.sitemapCoverage?.indexed ?? ""));
  const [sitemapGaps, setSitemapGaps] = useState(data.sitemapCoverage?.gaps ?? "");
  const [structuredData, setStructuredData] = useState(data.structuredDataCompleteness ?? "");
  const [openGaps, setOpenGaps] = useState(data.openContentGaps.join("\n"));

  const handleSave = async () => {
    setSaving(true);
    const payload: SeoData = {
      indexingStatus: indexingStatus || null,
      sitemapCoverage:
        sitemapTotal !== "" || sitemapIndexed !== "" || sitemapGaps !== ""
          ? { total: Number(sitemapTotal) || 0, indexed: Number(sitemapIndexed) || 0, gaps: sitemapGaps }
          : null,
      structuredDataCompleteness: structuredData || null,
      ga4Metrics: data.ga4Metrics,
      gscMetrics: data.gscMetrics,
      openContentGaps: openGaps.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seoData: payload }),
      });
      if (!res.ok) throw new Error();
      toast.success("SEO actualizado");
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Indexacion y Sitemap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Estado de indexacion</Label>
            <Textarea value={indexingStatus} onChange={(e) => setIndexingStatus(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Total en sitemap</Label>
              <Input type="number" value={sitemapTotal} onChange={(e) => setSitemapTotal(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Indexadas</Label>
              <Input type="number" value={sitemapIndexed} onChange={(e) => setSitemapIndexed(e.target.value)} className="mt-1" />
            </div>
            <div className="sm:col-span-1">
              <Label className="text-xs">Brechas</Label>
              <Input value={sitemapGaps} onChange={(e) => setSitemapGaps(e.target.value)} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos Estructurados y Contenido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Completitud de datos estructurados (JSON-LD)</Label>
            <Textarea value={structuredData} onChange={(e) => setStructuredData(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Brechas de contenido abiertas (una por linea)</Label>
            <Textarea value={openGaps} onChange={(e) => setOpenGaps(e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {(data.ga4Metrics || data.gscMetrics) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.ga4Metrics && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">GA4</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sesiones</span><span>{data.ga4Metrics.sessions.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Usuarios</span><span>{data.ga4Metrics.users.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rebote</span><span>{data.ga4Metrics.bounceRate}%</span></div>
              </CardContent>
            </Card>
          )}
          {data.gscMetrics && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Search Console</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Clics</span><span>{data.gscMetrics.clicks.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Impresiones</span><span>{data.gscMetrics.impressions.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CTR</span><span>{data.gscMetrics.ctr}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Posicion prom.</span><span>{data.gscMetrics.avgPosition}</span></div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {!data.ga4Metrics && !data.gscMetrics && (
        <p className="text-sm text-muted-foreground">GA4 y Search Console aun no conectados — ver pestaña Analiticas.</p>
      )}

      <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
        <Save className="h-4 w-4 mr-1.5" /> {saving ? "Guardando..." : "Guardar SEO"}
      </Button>
    </div>
  );
}
