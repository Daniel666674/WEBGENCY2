"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SecurityData, SecurityGap, SecuritySeverity } from "@/types";

const EMPTY: SecurityData = {
  authMethod: null,
  adminAllowlist: [],
  lastSecurityReviewDate: null,
  knownGaps: [],
  complianceStatus: null,
  sslExpiry: null,
  lastBackupVerified: null,
  overallSecurityRating: null,
};

const SEVERITY_COLORS: Record<SecuritySeverity, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

export function SeguridadTab({ contactId, initialData }: { contactId: string; initialData: SecurityData | null }) {
  const router = useRouter();
  const data = initialData ?? EMPTY;
  const [saving, setSaving] = useState(false);
  const [authMethod, setAuthMethod] = useState(data.authMethod ?? "");
  const [adminAllowlist, setAdminAllowlist] = useState(data.adminAllowlist.join("\n"));
  const [lastReview, setLastReview] = useState(data.lastSecurityReviewDate ?? "");
  const [sslExpiry, setSslExpiry] = useState(data.sslExpiry ?? "");
  const [lastBackup, setLastBackup] = useState(data.lastBackupVerified ?? "");
  const [rating, setRating] = useState(data.overallSecurityRating ?? "");
  const [privacyPublished, setPrivacyPublished] = useState(data.complianceStatus?.privacyPolicyPublished ?? false);
  const [cookieConsent, setCookieConsent] = useState(data.complianceStatus?.cookieConsentLive ?? false);
  const [applicableLaw, setApplicableLaw] = useState(data.complianceStatus?.applicableLaw ?? "");
  const [gaps, setGaps] = useState<SecurityGap[]>(data.knownGaps);
  const [newGap, setNewGap] = useState<{ description: string; severity: SecuritySeverity }>({ description: "", severity: "medium" });

  const handleSave = async () => {
    setSaving(true);
    const payload: SecurityData = {
      authMethod: authMethod || null,
      adminAllowlist: adminAllowlist.split("\n").map((s) => s.trim()).filter(Boolean),
      lastSecurityReviewDate: lastReview || null,
      knownGaps: gaps,
      complianceStatus: { privacyPolicyPublished: privacyPublished, cookieConsentLive: cookieConsent, applicableLaw },
      sslExpiry: sslExpiry || null,
      lastBackupVerified: lastBackup || null,
      overallSecurityRating: rating || null,
    };
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ securityData: payload }),
      });
      if (!res.ok) throw new Error();
      toast.success("Seguridad actualizada");
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
            <Shield className="h-4 w-4" /> Autenticacion y Accesos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Metodo de autenticacion (capturar la transicion, ej. &ldquo;X (actual) → Y (planeado)&rdquo;)</Label>
            <Textarea value={authMethod} onChange={(e) => setAuthMethod(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Lista de administradores permitidos (uno por linea)</Label>
            <Textarea value={adminAllowlist} onChange={(e) => setAdminAllowlist(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Ultima revision de seguridad</Label>
              <Input value={lastReview} onChange={(e) => setLastReview(e.target.value)} placeholder="AAAA-MM-DD" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Vencimiento SSL</Label>
              <Input value={sslExpiry} onChange={(e) => setSslExpiry(e.target.value)} placeholder="AAAA-MM-DD" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Ultimo backup verificado</Label>
              <Input value={lastBackup} onChange={(e) => setLastBackup(e.target.value)} placeholder="AAAA-MM-DD" className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Brechas Conocidas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {gaps.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-sm p-2.5 rounded-lg border">
              <Badge style={{ backgroundColor: `${SEVERITY_COLORS[g.severity]}20`, color: SEVERITY_COLORS[g.severity] }}>{g.severity}</Badge>
              <span className="flex-1">{g.description}</span>
              <button onClick={() => setGaps(gaps.filter((_, j) => j !== i))} className="cursor-pointer text-destructive shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Descripcion de la brecha" value={newGap.description} onChange={(e) => setNewGap({ ...newGap, description: e.target.value })} className="h-8 flex-1" />
            <select
              value={newGap.severity}
              onChange={(e) => setNewGap({ ...newGap, severity: e.target.value as SecuritySeverity })}
              className="h-8 rounded-md border bg-transparent px-2 text-sm"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <Button size="sm" variant="outline" className="cursor-pointer shrink-0" onClick={() => {
              if (!newGap.description.trim()) return;
              setGaps([...gaps, { description: newGap.description.trim(), severity: newGap.severity, dateFound: new Date().toISOString().slice(0, 10) }]);
              setNewGap({ description: "", severity: "medium" });
            }}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Cumplimiento</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={privacyPublished} onChange={(e) => setPrivacyPublished(e.target.checked)} className="h-4 w-4 accent-primary" />
            Politica de privacidad publicada
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={cookieConsent} onChange={(e) => setCookieConsent(e.target.checked)} className="h-4 w-4 accent-primary" />
            Banner de consentimiento de cookies activo
          </label>
          <div>
            <Label className="text-xs">Ley aplicable</Label>
            <Input value={applicableLaw} onChange={(e) => setApplicableLaw(e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Rating General</CardTitle></CardHeader>
        <CardContent>
          <Label className="text-xs">Numero + el razonamiento detras (no solo un puntaje)</Label>
          <Textarea value={rating} onChange={(e) => setRating(e.target.value)} className="mt-1" />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
        <Save className="h-4 w-4 mr-1.5" /> {saving ? "Guardando..." : "Guardar Seguridad"}
      </Button>
    </div>
  );
}
