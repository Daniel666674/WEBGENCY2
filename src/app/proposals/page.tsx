"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { formatCurrency } from "@/lib/constants";
import { AGENCY_PLANS, ADD_ONS_CATALOG, AUTOMATIONS_CATALOG, DELIVERABLES_CATALOG } from "@/lib/catalog";
import { toast } from "sonner";
import {
  FileText, DollarSign, Plus, X, Share2, FolderPlus, ChevronDown, ChevronUp,
  Check, Package, Zap, User,
} from "lucide-react";

interface Contact { id: string; name: string; company: string | null; }

interface Proposal {
  id: string;
  contactId: string;
  contactName: string | null;
  planName: string;
  oneTimeFee: number;
  monthlyFee: number;
  features: string[];
  addOns: string[];
  automations: string[];
  deliverables: string[];
  notes: string | null;
  shareToken: string | null;
  createdAt: string | number;
}

function TagChecklist({
  title, icon: Icon, items, selected, onChange,
}: {
  title: string; icon: typeof Package; items: string[];
  selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (item: string) =>
    onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item]);
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              selected.includes(item)
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            {selected.includes(item) && <Check className="h-2.5 w-2.5 inline mr-1" />}
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);

  // Form state
  const [contactId, setContactId] = useState("");
  const [planName, setPlanName] = useState("Custom");
  const [oneTimePesos, setOneTimePesos] = useState("");
  const [monthlyPesos, setMonthlyPesos] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [automations, setAutomations] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([
      fetch("/api/proposals").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
      new Promise((r) => setTimeout(r, 700)),
    ]).then(([props, conts]) => {
      setProposals(props);
      setContacts(conts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handlePlanChange(name: string) {
    setPlanName(name);
    const plan = AGENCY_PLANS.find((p) => p.name === name);
    if (plan) {
      setOneTimePesos(plan.oneTimeFee ? String(plan.oneTimeFee / 100) : "");
      setMonthlyPesos(plan.monthlyFee ? String(plan.monthlyFee / 100) : "");
      setFeatures([...plan.features]);
    }
  }

  function resetForm() {
    setContactId(""); setPlanName("Custom"); setOneTimePesos(""); setMonthlyPesos("");
    setFeatures([]); setCustomFeature(""); setAddOns([]); setAutomations([]); setDeliverables([]); setNotes("");
  }

  async function handleSave() {
    if (!contactId) { toast.error("Selecciona un contacto"); return; }
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
      if (!res.ok) throw new Error();
      // Auto-wire: mark contact as proposal_sent
      await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientStatus: "proposal_sent" }),
      });
      toast.success("Propuesta creada y contacto actualizado");
      setShowCreate(false);
      resetForm();
      setLoading(true);
      load();
    } catch {
      toast.error("Error al crear la propuesta");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare(p: Proposal, e: React.MouseEvent) {
    e.stopPropagation();
    setSharing(p.id);
    try {
      const res = await fetch(`/api/proposals/${p.id}/share`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      const url = `${window.location.origin}/p/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("Error al generar enlace");
    }
    setSharing(null);
  }

  async function handleConvert(proposalId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setConverting(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/convert`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { projectId } = await res.json();
      toast.success("Proyecto creado");
      router.push(`/projects/${projectId}`);
    } catch {
      toast.error("Error al convertir");
    }
    setConverting(null);
  }

  const currentPlan = AGENCY_PLANS.find((p) => p.name === planName);
  const featureOptions = Array.from(new Set([...(currentPlan?.features || []), ...features]));

  const totalOneTime = proposals.reduce((s, p) => s + p.oneTimeFee, 0);
  const totalMonthly = proposals.reduce((s, p) => s + p.monthlyFee, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Propuestas
          </h1>
          <p className="text-muted-foreground text-sm">
            {proposals.length} propuestas · {formatCurrency(totalOneTime)} setup · {formatCurrency(totalMonthly)}/mes potencial
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); if (showCreate) resetForm(); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "Cancelar" : "Nueva propuesta"}
        </button>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total propuestas", value: proposals.length, icon: FileText },
            { label: "Setup acumulado", value: formatCurrency(totalOneTime), icon: DollarSign },
            { label: "MRR potencial", value: formatCurrency(totalMonthly), icon: DollarSign, highlight: true },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className="border rounded-xl p-4 bg-card">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Icon className="h-3.5 w-3.5" /> {label}
              </p>
              <p className={`text-xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="border rounded-xl bg-card p-5 space-y-5">
          <p className="text-sm font-semibold">Nueva propuesta</p>

          {/* Contact picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
              <User className="h-3.5 w-3.5" /> Contacto
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
            >
              <option value="">Selecciona un contacto...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.company} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Plan */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plan</label>
            <div className="flex flex-wrap gap-1.5">
              {[...AGENCY_PLANS.map((p) => p.name), "Custom"].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handlePlanChange(name)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                    planName === name
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tarifa única (COP)</label>
              <input
                type="number"
                placeholder="0"
                value={oneTimePesos}
                onChange={(e) => setOneTimePesos(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
              />
              {oneTimePesos && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(Math.round((parseFloat(oneTimePesos) || 0) * 100))}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mensualidad (COP)</label>
              <input
                type="number"
                placeholder="0"
                value={monthlyPesos}
                onChange={(e) => setMonthlyPesos(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
              />
              {monthlyPesos && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(Math.round((parseFloat(monthlyPesos) || 0) * 100))}/mes
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          <TagChecklist
            title="Características incluidas"
            icon={Check}
            items={featureOptions}
            selected={features}
            onChange={setFeatures}
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Agregar característica personalizada..."
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = customFeature.trim();
                  if (t && !features.includes(t)) setFeatures([...features, t]);
                  setCustomFeature("");
                }
              }}
              className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background"
            />
            <button
              type="button"
              onClick={() => {
                const t = customFeature.trim();
                if (t && !features.includes(t)) setFeatures([...features, t]);
                setCustomFeature("");
              }}
              className="px-3 py-2 border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <TagChecklist title="Add-ons" icon={Package} items={ADD_ONS_CATALOG} selected={addOns} onChange={setAddOns} />
          <TagChecklist title="Automatizaciones" icon={Zap} items={AUTOMATIONS_CATALOG} selected={automations} onChange={setAutomations} />
          <TagChecklist title="Entregables" icon={FileText} items={DELIVERABLES_CATALOG} selected={deliverables} onChange={setDeliverables} />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notas adicionales</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas visibles en la propuesta..."
              className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowCreate(false); resetForm(); }}
              className="px-4 py-2 text-sm text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !contactId}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar propuesta"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <DogSpinnerPage label="Cargando propuestas..." />
      ) : proposals.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin propuestas todavía.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-sm text-primary underline underline-offset-2"
          >
            Crear la primera propuesta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => {
            const isOpen = expanded === p.id;
            return (
              <div
                key={p.id}
                className="border rounded-xl bg-card overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{p.planName}</p>
                      {p.contactName && (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/contacts/${p.contactId}`); }}
                          className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
                        >
                          {p.contactName}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(p.oneTimeFee)} setup · {formatCurrency(p.monthlyFee)}/mes
                      {p.features.length > 0 && ` · ${p.features.length} features`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={(e) => handleShare(p, e)}
                      disabled={sharing === p.id}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {sharing === p.id ? "..." : "Compartir"}
                    </button>
                    <button
                      onClick={(e) => handleConvert(p.id, e)}
                      disabled={converting === p.id}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      {converting === p.id ? "..." : "Proyecto"}
                    </button>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-3">
                    {p.features.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Check className="h-3 w-3" /> Características</p>
                        <div className="flex flex-wrap gap-1">
                          {p.features.map((f, i) => <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{f}</span>)}
                        </div>
                      </div>
                    )}
                    {p.addOns.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Package className="h-3 w-3" /> Add-ons</p>
                        <div className="flex flex-wrap gap-1">
                          {p.addOns.map((a, i) => <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{a}</span>)}
                        </div>
                      </div>
                    )}
                    {p.automations.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Zap className="h-3 w-3" /> Automatizaciones</p>
                        <div className="flex flex-wrap gap-1">
                          {p.automations.map((a, i) => <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{a}</span>)}
                        </div>
                      </div>
                    )}
                    {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
