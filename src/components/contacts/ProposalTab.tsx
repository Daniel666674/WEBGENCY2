"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/constants";
import { BASE_TIERS, MAINTENANCE_TIERS, ADD_ONS_CATALOG, AUTOMATIONS_CATALOG, DELIVERABLES_CATALOG, getAgencySuggestions } from "@/lib/catalog";
import { toast } from "sonner";
import { Plus, Lightbulb, ChevronDown, ChevronUp, Package, FileText, Zap, Check, Share2, FolderPlus, Copy } from "lucide-react";
import { useRouter } from "next/navigation";

interface Proposal {
  id: string; contactId: string; planName: string;
  oneTimeFee: number; monthlyFee: number;
  features: string[]; addOns: string[]; automations: string[]; deliverables: string[];
  notes: string | null; createdAt: string | number; updatedAt: string | number;
}

interface ProposalTabProps {
  contactId: string;
  contactNotes?: string;
  contactCompany?: string;
}

function ChecklistSection({ title, icon: Icon, items, selected, onChange }: {
  title: string; icon: typeof Package; items: string[];
  selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (item: string) =>
    onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item]);
  return (
    <div>
      <Label className="flex items-center gap-1.5 mb-2"><Icon className="h-4 w-4" /> {title}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded hover:bg-muted">
            <input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)} className="rounded" />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function BadgeList({ label, items, variant = "outline" }: {
  label: string; items: string[]; variant?: "secondary" | "outline";
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => <Badge key={i} variant={variant} className="text-xs">{item}</Badge>)}
      </div>
    </div>
  );
}

export function ProposalTab({ contactId, contactNotes, contactCompany }: ProposalTabProps) {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [planName, setPlanName] = useState("Custom");
  const [oneTimePesos, setOneTimePesos] = useState("");
  const [monthlyPesos, setMonthlyPesos] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [automations, setAutomations] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const suggestions = useMemo(
    () => getAgencySuggestions({ company: contactCompany, notes: contactNotes, currentPlan: planName }),
    [contactCompany, contactNotes, planName]
  );

  const fetchProposals = async () => {
    try {
      const res = await fetch(`/api/proposals?contactId=${contactId}`);
      if (res.ok) setProposals(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchProposals(); }, [contactId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlanChange = (name: string) => {
    setPlanName(name);
    const plan = BASE_TIERS.find((p) => p.track === "website" && p.name === name);
    if (plan) {
      const maintenance = MAINTENANCE_TIERS.find((m) => m.id === plan.recommendedMaintenanceId);
      setOneTimePesos(plan.oneTimeFee ? String(plan.oneTimeFee / 100) : "");
      setMonthlyPesos(maintenance?.monthlyFee ? String(maintenance.monthlyFee / 100) : "");
      setFeatures([...plan.features]);
    }
  };

  const resetForm = () => {
    setPlanName("Custom"); setOneTimePesos(""); setMonthlyPesos("");
    setFeatures([]); setCustomFeature(""); setAddOns([]);
    setAutomations([]); setDeliverables([]); setNotes("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId, planName,
          oneTimeFee: Math.round((parseFloat(oneTimePesos) || 0) * 100),
          monthlyFee: Math.round((parseFloat(monthlyPesos) || 0) * 100),
          features, addOns, automations, deliverables, notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Propuesta creada");
      setShowForm(false); resetForm(); fetchProposals();
    } catch { toast.error("Error al crear la propuesta"); }
    setSaving(false);
  };

  const addCustomFeature = () => {
    const trimmed = customFeature.trim();
    if (trimmed && !features.includes(trimmed)) { setFeatures([...features, trimmed]); setCustomFeature(""); }
  };

  const currentPlan = BASE_TIERS.find((p) => p.track === "website" && p.name === planName);
  const featureOptions = Array.from(new Set([...(currentPlan?.features || []), ...features]));
  const toCurrency = (v: string) => formatCurrency(Math.round((parseFloat(v) || 0) * 100));

  const handleShare = async (proposalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSharing(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/share`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      const url = `${window.location.origin}/p/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("Error al generar enlace");
    }
    setSharing(null);
  };

  const handleConvert = async (proposalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConverting(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/convert`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { projectId } = await res.json();
      toast.success("Proyecto creado");
      router.push(`/projects/${projectId}`);
    } catch {
      toast.error("Error al convertir propuesta");
    }
    setConverting(null);
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4">Cargando propuestas...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" /> Propuestas ({proposals.length})
        </h3>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-1" /> Nueva Propuesta
          </Button>
        )}
      </div>

      {suggestions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3 px-4">
            <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-600" /> Sugerencias IA
            </p>
            <ul className="space-y-1">
              {suggestions.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Nueva Propuesta</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Plan</Label>
              <Select value={planName} onValueChange={(v) => v && handlePlanChange(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BASE_TIERS.filter((p) => p.track === "website").map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name} - {p.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tarifa unica (COP)</Label>
                <Input type="number" placeholder="0" value={oneTimePesos}
                  onChange={(e) => setOneTimePesos(e.target.value)} className="mt-1" />
                {oneTimePesos && <p className="text-xs text-muted-foreground mt-1">{toCurrency(oneTimePesos)}</p>}
              </div>
              <div>
                <Label>Mensualidad (COP)</Label>
                <Input type="number" placeholder="0" value={monthlyPesos}
                  onChange={(e) => setMonthlyPesos(e.target.value)} className="mt-1" />
                {monthlyPesos && <p className="text-xs text-muted-foreground mt-1">{toCurrency(monthlyPesos)}/mes</p>}
              </div>
            </div>
            <ChecklistSection title="Caracteristicas" icon={Check} items={featureOptions}
              selected={features} onChange={setFeatures} />
            <div className="flex gap-2">
              <Input placeholder="Agregar caracteristica..." value={customFeature}
                onChange={(e) => setCustomFeature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomFeature())} />
              <Button variant="outline" size="sm" onClick={addCustomFeature} className="cursor-pointer">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ChecklistSection title="Add-ons" icon={Package} items={ADD_ONS_CATALOG}
              selected={addOns} onChange={setAddOns} />
            <ChecklistSection title="Automatizaciones" icon={Zap} items={AUTOMATIONS_CATALOG}
              selected={automations} onChange={setAutomations} />
            <ChecklistSection title="Entregables" icon={FileText} items={DELIVERABLES_CATALOG}
              selected={deliverables} onChange={setDeliverables} />
            <div>
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..." className="mt-1" rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}
                className="cursor-pointer">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
                {saving ? "Guardando..." : "Guardar Propuesta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {proposals.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No hay propuestas. Crea la primera.</p>
      )}
      {proposals.map((p) => {
        const isOpen = expanded === p.id;
        return (
          <Card key={p.id} className="cursor-pointer" onClick={() => setExpanded(isOpen ? null : p.id)}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{p.planName}</CardTitle>
                  <Badge variant="secondary">{formatCurrency(p.oneTimeFee)}</Badge>
                  <Badge variant="outline">{formatCurrency(p.monthlyFee)}/mes</Badge>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            {isOpen && (
              <CardContent className="pt-0 space-y-3">
                <BadgeList label="Caracteristicas" items={p.features} variant="secondary" />
                <BadgeList label="Add-ons" items={p.addOns} />
                <BadgeList label="Automatizaciones" items={p.automations} />
                <BadgeList label="Entregables" items={p.deliverables} />
                {p.notes && <p className="text-sm text-muted-foreground">{p.notes}</p>}
                <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer gap-1.5"
                    disabled={sharing === p.id}
                    onClick={(e) => handleShare(p.id, e)}
                  >
                    {sharing === p.id ? (
                      "Generando..."
                    ) : (
                      <><Share2 className="h-3.5 w-3.5" /> Compartir</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer gap-1.5"
                    disabled={converting === p.id}
                    onClick={(e) => handleConvert(p.id, e)}
                  >
                    {converting === p.id ? (
                      "Creando..."
                    ) : (
                      <><FolderPlus className="h-3.5 w-3.5" /> Convertir a Proyecto</>
                    )}
                  </Button>
                  {shareUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="cursor-pointer gap-1.5 text-muted-foreground ml-auto"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success("Enlace copiado");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar enlace
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
