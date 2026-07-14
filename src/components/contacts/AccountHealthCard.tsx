"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AccountHealth, Upsell } from "@/types";

const CHURN_COLORS: Record<string, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

export function AccountHealthCard({
  contactId,
  accountHealth,
}: {
  contactId: string;
  accountHealth: AccountHealth | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [engagementLevel, setEngagementLevel] = useState(accountHealth?.engagementLevel ?? "");
  const [churnRisk, setChurnRisk] = useState(accountHealth?.churnRisk ?? "");
  const [blockers, setBlockers] = useState((accountHealth?.currentBlockers ?? []).join("\n"));
  const [upsells, setUpsells] = useState<Upsell[]>(accountHealth?.identifiedUpsells ?? []);
  const [newUpsell, setNewUpsell] = useState("");

  const handleSave = async () => {
    setSaving(true);
    const payload: AccountHealth = {
      engagementLevel: engagementLevel || null,
      churnRisk: churnRisk || null,
      currentBlockers: blockers.split("\n").map((s) => s.trim()).filter(Boolean),
      identifiedUpsells: upsells,
    };
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountHealth: payload }),
      });
      if (!res.ok) throw new Error();
      toast.success("Salud de cuenta actualizada");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <HeartPulse className="h-4 w-4" /> Salud de Cuenta
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!accountHealth ? (
            <p className="text-sm text-muted-foreground">Sin datos de salud de cuenta todavia.</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nivel de engagement</span>
                <span>{accountHealth.engagementLevel || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Riesgo de churn</span>
                {accountHealth.churnRisk ? (
                  <Badge style={{ backgroundColor: `${CHURN_COLORS[accountHealth.churnRisk] || "#64748b"}20`, color: CHURN_COLORS[accountHealth.churnRisk] || "#64748b" }}>
                    {accountHealth.churnRisk}
                  </Badge>
                ) : <span>-</span>}
              </div>
              {accountHealth.currentBlockers.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Bloqueos actuales</span>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    {accountHealth.currentBlockers.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
              {accountHealth.identifiedUpsells.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Upsells identificados</span>
                  <ul className="mt-1 space-y-1">
                    {accountHealth.identifiedUpsells.map((u, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Badge variant={u.pitched ? "default" : "outline"} className="text-xs">{u.pitched ? "Propuesto" : "Sin proponer"}</Badge>
                        {u.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <HeartPulse className="h-4 w-4" /> Salud de Cuenta
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setEditing(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Nivel de engagement</Label>
          <Input value={engagementLevel} onChange={(e) => setEngagementLevel(e.target.value)} placeholder="p.ej. alto" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Riesgo de churn</Label>
          <Input value={churnRisk} onChange={(e) => setChurnRisk(e.target.value)} placeholder="low / medium / high" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Bloqueos actuales (uno por linea)</Label>
          <Textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Upsells identificados</Label>
          <div className="space-y-1.5 mt-1">
            {upsells.map((u, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={u.pitched}
                  onChange={(e) => setUpsells(upsells.map((x, j) => j === i ? { ...x, pitched: e.target.checked } : x))}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="flex-1">{u.description}</span>
                <button onClick={() => setUpsells(upsells.filter((_, j) => j !== i))} className="cursor-pointer text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newUpsell} onChange={(e) => setNewUpsell(e.target.value)} placeholder="Descripcion del upsell" className="h-8" />
              <Button size="sm" variant="outline" className="cursor-pointer shrink-0" onClick={() => {
                if (!newUpsell.trim()) return;
                setUpsells([...upsells, { description: newUpsell.trim(), pitched: false }]);
                setNewUpsell("");
              }}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="cursor-pointer">
          <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Guardando..." : "Guardar"}
        </Button>
      </CardContent>
    </Card>
  );
}
