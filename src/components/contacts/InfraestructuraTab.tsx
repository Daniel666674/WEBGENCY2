"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Server, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { InfraData, AccessMapEntry } from "@/types";

const EMPTY: InfraData = {
  hostingProvider: null,
  hostingPlan: null,
  domainRegistrar: null,
  dnsStatus: null,
  techStack: [],
  accessMap: [],
  deploymentPipeline: null,
  thirdPartyIntegrations: [],
};

export function InfraestructuraTab({ contactId, initialData }: { contactId: string; initialData: InfraData | null }) {
  const router = useRouter();
  const data = initialData ?? EMPTY;
  const [saving, setSaving] = useState(false);
  const [hostingProvider, setHostingProvider] = useState(data.hostingProvider ?? "");
  const [hostingPlan, setHostingPlan] = useState(data.hostingPlan ?? "");
  const [domainRegistrar, setDomainRegistrar] = useState(data.domainRegistrar ?? "");
  const [dnsStatus, setDnsStatus] = useState(data.dnsStatus ?? "");
  const [techStack, setTechStack] = useState(data.techStack.join("\n"));
  const [deploymentPipeline, setDeploymentPipeline] = useState(data.deploymentPipeline ?? "");
  const [thirdParty, setThirdParty] = useState(data.thirdPartyIntegrations.join("\n"));
  const [accessMap, setAccessMap] = useState<AccessMapEntry[]>(data.accessMap);
  const [newAccess, setNewAccess] = useState<AccessMapEntry>({ system: "", whoHasAccess: "", howToRequest: "" });

  const handleSave = async () => {
    setSaving(true);
    const payload: InfraData = {
      hostingProvider: hostingProvider || null,
      hostingPlan: hostingPlan || null,
      domainRegistrar: domainRegistrar || null,
      dnsStatus: dnsStatus || null,
      techStack: techStack.split("\n").map((s) => s.trim()).filter(Boolean),
      accessMap,
      deploymentPipeline: deploymentPipeline || null,
      thirdPartyIntegrations: thirdParty.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ infraData: payload }),
      });
      if (!res.ok) throw new Error();
      toast.success("Infraestructura actualizada");
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
            <Server className="h-4 w-4" /> Hosting y Dominio
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Proveedor de hosting</Label>
            <Input value={hostingProvider} onChange={(e) => setHostingProvider(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Plan de hosting</Label>
            <Input value={hostingPlan} onChange={(e) => setHostingPlan(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Registrador de dominio</Label>
            <Input value={domainRegistrar} onChange={(e) => setDomainRegistrar(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Estado de DNS</Label>
            <Input value={dnsStatus} onChange={(e) => setDnsStatus(e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stack Tecnico y Despliegue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Tech stack (uno por linea)</Label>
            <Textarea value={techStack} onChange={(e) => setTechStack(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Pipeline de despliegue</Label>
            <Textarea value={deploymentPipeline} onChange={(e) => setDeploymentPipeline(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Integraciones de terceros (una por linea)</Label>
            <Textarea value={thirdParty} onChange={(e) => setThirdParty(e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mapa de Accesos</CardTitle>
          <p className="text-xs text-muted-foreground">Quien tiene acceso a que sistema y como pedirlo — no es un lugar para credenciales.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {accessMap.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg border">
              <div className="flex-1 min-w-0 grid grid-cols-3 gap-2">
                <span className="font-medium truncate">{a.system}</span>
                <span className="truncate">{a.whoHasAccess}</span>
                <span className="text-muted-foreground truncate">{a.howToRequest}</span>
              </div>
              <button onClick={() => setAccessMap(accessMap.filter((_, j) => j !== i))} className="cursor-pointer text-destructive shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Sistema" value={newAccess.system} onChange={(e) => setNewAccess({ ...newAccess, system: e.target.value })} className="h-8" />
            <Input placeholder="Quien tiene acceso" value={newAccess.whoHasAccess} onChange={(e) => setNewAccess({ ...newAccess, whoHasAccess: e.target.value })} className="h-8" />
            <Input placeholder="Como pedirlo" value={newAccess.howToRequest} onChange={(e) => setNewAccess({ ...newAccess, howToRequest: e.target.value })} className="h-8" />
          </div>
          <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => {
            if (!newAccess.system.trim()) return;
            setAccessMap([...accessMap, newAccess]);
            setNewAccess({ system: "", whoHasAccess: "", howToRequest: "" });
          }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
        <Save className="h-4 w-4 mr-1.5" /> {saving ? "Guardando..." : "Guardar Infraestructura"}
      </Button>
    </div>
  );
}
