"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, Pencil, Save, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { InventoryHealth } from "@/types";

export function SalesHealthCard({
  contactId,
  salesDataNotes,
  inventoryHealth,
  funnelTracking,
}: {
  contactId: string;
  salesDataNotes: string | null;
  inventoryHealth: InventoryHealth | null;
  funnelTracking: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(salesDataNotes ?? "");
  const [lowStock, setLowStock] = useState(String(inventoryHealth?.lowStockCount ?? ""));
  const [outOfStock, setOutOfStock] = useState(String(inventoryHealth?.outOfStockCount ?? ""));
  const [funnel, setFunnel] = useState(funnelTracking ?? "");

  const handleSave = async () => {
    setSaving(true);
    const inv: InventoryHealth | null =
      lowStock !== "" || outOfStock !== ""
        ? { lowStockCount: Number(lowStock) || 0, outOfStockCount: Number(outOfStock) || 0 }
        : null;
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesDataNotes: notes || null,
          inventoryHealth: inv,
          funnelTracking: funnel || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ventas e inventario actualizados");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    const hasData = salesDataNotes || inventoryHealth || funnelTracking;
    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> Ventas e Inventario
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasData ? (
            <p className="text-sm text-muted-foreground">Sin datos de ventas/inventario todavia.</p>
          ) : (
            <>
              {salesDataNotes && <p className="text-sm whitespace-pre-wrap">{salesDataNotes}</p>}
              {inventoryHealth && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Stock bajo: <span className="font-semibold">{inventoryHealth.lowStockCount}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                    Agotados: <span className="font-semibold">{inventoryHealth.outOfStockCount}</span>
                  </span>
                </div>
              )}
              {funnelTracking && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Tracking de conversion</p>
                  <p className="text-sm whitespace-pre-wrap">{funnelTracking}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" /> Ventas e Inventario
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setEditing(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Notas de ventas (ingresos, pedidos, ticket promedio, top productos)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Productos con stock bajo</Label>
            <Input type="number" value={lowStock} onChange={(e) => setLowStock(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Productos agotados</Label>
            <Input type="number" value={outOfStock} onChange={(e) => setOutOfStock(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Tracking de conversion (que eventos si/no se miden)</Label>
          <Textarea value={funnel} onChange={(e) => setFunnel(e.target.value)} className="mt-1" />
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="cursor-pointer">
          <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Guardando..." : "Guardar"}
        </Button>
      </CardContent>
    </Card>
  );
}
