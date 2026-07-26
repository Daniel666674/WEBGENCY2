"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatTile } from "@/components/shared/StatTile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/constants";
import { BASE_TIERS, MAINTENANCE_TIERS, ADD_ONS_CATALOG, AUTOMATIONS_CATALOG, DELIVERABLES_CATALOG } from "@/lib/catalog";
import { toast } from "sonner";
import {
  FileText, DollarSign, TrendingUp, Target, Plus, X, Share2, FolderPlus, ChevronDown, ChevronUp,
  Check, Package, Zap, User, Search, Filter, MoreVertical, Trash2, Rocket, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Contact { id: string; name: string; company: string | null; }

interface Proposal {
  id: string;
  contactId: string;
  contactName: string | null;
  contactClientStatus: string | null;
  planName: string;
  oneTimeFee: number;
  monthlyFee: number;
  features: string[];
  addOns: string[];
  automations: string[];
  deliverables: string[];
  notes: string | null;
  shareToken: string | null;
  viewedAt: string | number | null;
  validUntil: string | number | null;
  createdAt: string | number;
}

type StatusTab = "Todas" | "Activas" | "En revisión" | "Aceptadas" | "Rechazadas";
const TABS: StatusTab[] = ["Todas", "Activas", "En revisión", "Aceptadas", "Rechazadas"];

function proposalStatus(p: Proposal): Exclude<StatusTab, "Todas"> {
  if (p.contactClientStatus === "active_client") return "Aceptadas";
  if (p.contactClientStatus === "churned") return "Rechazadas";
  if (p.shareToken && p.viewedAt) return "En revisión";
  return "Activas";
}

const ICON_PALETTE = [
  { icon: Rocket, bg: "bg-purple-500/15", color: "text-purple-500" },
  { icon: Package, bg: "bg-green-500/15", color: "text-green-500" },
  { icon: FileText, bg: "bg-amber-500/15", color: "text-amber-500" },
  { icon: DollarSign, bg: "bg-blue-500/15", color: "text-blue-500" },
  { icon: Zap, bg: "bg-primary/15", color: "text-primary" },
];
function iconFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ICON_PALETTE[hash % ICON_PALETTE.length];
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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [tab, setTab] = useState<StatusTab>("Todas");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

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
      new Promise((r) => setTimeout(r, 1800)),
    ]).then(([props, conts]) => {
      setProposals(props);
      setContacts(conts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handlePlanChange(name: string) {
    setPlanName(name);
    const plan = BASE_TIERS.find((p) => p.track === "website" && p.name === name);
    if (plan) {
      const maintenance = MAINTENANCE_TIERS.find((m) => m.id === plan.recommendedMaintenanceId);
      setOneTimePesos(plan.oneTimeFee ? String(plan.oneTimeFee / 100) : "");
      setMonthlyPesos(maintenance?.monthlyFee ? String(maintenance.monthlyFee / 100) : "");
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

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(null);
    if (!confirm("¿Eliminar esta propuesta?")) return;
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast.success("Propuesta eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  const currentPlan = BASE_TIERS.find((p) => p.track === "website" && p.name === planName);
  const featureOptions = Array.from(new Set([...(currentPlan?.features || []), ...features]));

  const totalOneTime = proposals.reduce((s, p) => s + p.oneTimeFee, 0);
  const totalMonthly = proposals.reduce((s, p) => s + p.monthlyFee, 0);
  const avgOneTime = proposals.length > 0 ? Math.round(totalOneTime / proposals.length) : 0;
  const avgMonthly = proposals.length > 0 ? Math.round(totalMonthly / proposals.length) : 0;
  const acceptedCount = proposals.filter((p) => proposalStatus(p) === "Aceptadas").length;
  const closeRate = proposals.length > 0 ? Math.round((acceptedCount / proposals.length) * 100) : 0;
  const now = Date.now();
  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
  const toMs = (d: unknown) => (d instanceof Date ? d.getTime() : d ? Number(d) : 0);
  const activeThisMonth = proposals.filter((p) => toMs(p.createdAt) >= monthStart).length;

  const filtered = useMemo(() => {
    let list = tab === "Todas" ? proposals : proposals.filter((p) => proposalStatus(p) === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.planName.toLowerCase().includes(q) || (p.contactName || "").toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const diff = toMs(a.createdAt) - toMs(b.createdAt);
      return sortAsc ? diff : -diff;
    });
    return list;
  }, [proposals, tab, search, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [tab, search, perPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "Cancelar" : "Nueva propuesta"}
        </button>
      </div>

      {!loading && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile icon={FileText} label="Total propuestas" value={proposals.length} subtext={`Activas este mes: ${activeThisMonth}`} color="purple" />
            <StatTile icon={DollarSign} label="Setup acumulado" value={formatCurrency(totalOneTime)} subtext={`Promedio por propuesta: ${formatCurrency(avgOneTime)}`} color="green" />
            <StatTile icon={TrendingUp} label="MRR potencial" value={formatCurrency(totalMonthly)} subtext={`Promedio mensual: ${formatCurrency(avgMonthly)}`} color="amber" />
            <StatTile icon={Target} label="Tasa de cierre estimada" value={`${closeRate}%`} subtext={`Basado en historial: ${closeRate}%`} color="blue" />
          </div>

          {/* Filter tabs + toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    tab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar propuestas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSortAsc((v) => !v)}>
              {sortAsc ? "Más antiguas" : "Más recientes"}
            </Button>
          </div>
        </>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="border rounded-xl bg-card p-5 space-y-5">
          <p className="text-sm font-semibold">Nueva propuesta</p>

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

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plan</label>
            <div className="flex flex-wrap gap-1.5">
              {[...BASE_TIERS.filter((p) => p.track === "website").map((p) => p.name), "Custom"].map((name) => (
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
              className="px-4 py-2 text-sm text-muted-foreground cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !contactId}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
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
        <EmptyState
          icon={FileText}
          title="Sin propuestas todavía"
          description="Crea tu primera propuesta para empezar a cerrar clientes."
          actionLabel="Crear la primera propuesta"
          onAction={() => setShowCreate(true)}
        />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">Sin propuestas con estos filtros.</p>
      ) : (
        <div className="border rounded-xl bg-card divide-y overflow-hidden">
          {pageItems.map((p) => {
            const isOpen = expanded === p.id;
            const { icon: Icon, bg, color } = iconFor(p.id);
            const status = proposalStatus(p);
            const statusBadge: Record<Exclude<StatusTab, "Todas">, string> = {
              Activas: "bg-blue-100 text-blue-700",
              "En revisión": "bg-amber-100 text-amber-700",
              Aceptadas: "bg-green-100 text-green-700",
              Rechazadas: "bg-red-100 text-red-700",
            };
            return (
              <div key={p.id}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{p.planName}</p>
                      {p.contactName && (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/contacts/${p.contactId}`); }}
                          className="text-xs text-primary underline underline-offset-2 hover:opacity-80 cursor-pointer"
                        >
                          {p.contactName}
                        </button>
                      )}
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusBadge[status]}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(p.oneTimeFee)} setup · {formatCurrency(p.monthlyFee)}/mes
                      {p.features.length > 0 && ` · ${p.features.length} features`}
                      {" · "}
                      {formatDate(typeof p.createdAt === "string" ? new Date(p.createdAt) : p.createdAt)}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleShare(p, e)}
                      disabled={sharing === p.id}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {sharing === p.id ? "..." : "Compartir"}
                    </button>
                    <button
                      onClick={(e) => handleConvert(p.id, e)}
                      disabled={converting === p.id}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      {converting === p.id ? "..." : "Proyecto"}
                    </button>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === p.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-8 z-10 w-36 rounded-lg border bg-popover shadow-md py-1"
                      >
                        <button
                          onClick={(e) => handleDelete(p.id, e)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-muted cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-3 bg-muted/10">
                    <div className="flex sm:hidden items-center gap-2">
                      <button
                        onClick={(e) => handleShare(p, e)}
                        disabled={sharing === p.id}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Compartir
                      </button>
                      <button
                        onClick={(e) => handleConvert(p.id, e)}
                        disabled={converting === p.id}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <FolderPlus className="h-3.5 w-3.5" /> Proyecto
                      </button>
                    </div>
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

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * perPage + 1} a {Math.min(page * perPage, filtered.length)} de {filtered.length} propuesta{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="text-xs border rounded-lg px-2 py-1.5 bg-background cursor-pointer"
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n} por página</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
