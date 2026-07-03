"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/constants";
import { BASE_TIERS, ADDON_MODULES, MAINTENANCE_TIERS, type Track } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Calculator, Globe, Wrench, Layers, Check, ChevronDown, ChevronUp,
  TrendingUp, User, Share2, Info,
} from "lucide-react";

function fmt(cents: number) {
  return formatCurrency(cents);
}

function PlanCard({
  selected, onClick, label, price, priceLabel, sub, features, sourceLabel, accent,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  price: string;
  priceLabel?: string;
  sub?: string;
  features: string[];
  sourceLabel?: string;
  accent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-xl p-3.5 cursor-pointer transition-all select-none relative",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20",
        accent && "border-amber-400/60"
      )}
    >
      {accent && (
        <span className="absolute -top-2 right-3 text-[10px] bg-amber-400 text-white px-2 py-0.5 rounded-full font-semibold">
          Recomendado
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-primary">{price}</p>
          {priceLabel && <p className="text-[10px] text-muted-foreground">{priceLabel}</p>}
        </div>
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {selected && (features.length > 0 || sourceLabel) && (
        <div className="mt-2 pt-2 border-t">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? "Ocultar" : "Ver"} incluido
          </button>
          {open && (
            <>
              <ul className="mt-2 space-y-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {sourceLabel && (
                <p className="mt-2 text-[10px] text-muted-foreground italic flex items-start gap-1">
                  <Info className="h-3 w-3 shrink-0 mt-0.5" /> {sourceLabel}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge }: { icon: typeof Globe; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold">{title}</h2>
      {badge && (
        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </div>
  );
}

function ModuleRow({
  selected, onClick, name, description, oneTimeFee, monthlyFee, estimated,
}: {
  selected: boolean;
  onClick: () => void;
  name: string;
  description: string;
  oneTimeFee: number;
  monthlyFee?: number;
  estimated?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-xl p-3 cursor-pointer transition-all select-none flex items-start gap-3",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          selected ? "bg-primary border-primary" : "border-muted-foreground/40"
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{name}</p>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-primary">{fmt(oneTimeFee)}</p>
            {monthlyFee !== undefined && (
              <p className="text-[10px] text-muted-foreground">+ {fmt(monthlyFee)}/mes</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {estimated && (
          <span className="inline-block mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Precio estimado
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-2", muted && "opacity-60")}>
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      <span className="text-xs font-semibold shrink-0">{value}</span>
    </div>
  );
}

interface Contact {
  id: string;
  name: string;
  company: string | null;
}

export default function CalculatorPage() {
  const router = useRouter();

  const [track, setTrack] = useState<Track>("website");
  const [baseTierId, setBaseTierId] = useState<string | null>("web_estandar");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [maintenanceId, setMaintenanceId] = useState<string | null>("maint_crecimiento");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts).catch(() => {});
  }, []);

  const availableBaseTiers = useMemo(() => BASE_TIERS.filter((t) => t.track === track), [track]);
  const availableAddons = useMemo(() => ADDON_MODULES.filter((m) => m.tracks.includes(track)), [track]);

  function handleTrackChange(next: Track) {
    setTrack(next);
    const firstTier = BASE_TIERS.find((t) => t.track === next);
    setBaseTierId(firstTier?.id ?? null);
    setMaintenanceId(firstTier?.recommendedMaintenanceId ?? null);
    setSelectedAddons([]);
    setSavedProposalId(null);
  }

  function handleBaseTierChange(id: string) {
    setBaseTierId(id);
    const tier = BASE_TIERS.find((t) => t.id === id);
    if (tier) setMaintenanceId(tier.recommendedMaintenanceId);
    setSavedProposalId(null);
  }

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSavedProposalId(null);
  }

  const baseTier = BASE_TIERS.find((t) => t.id === baseTierId);
  const selectedAddonObjects = availableAddons.filter((m) => selectedAddons.includes(m.id));
  const maintenanceTier = MAINTENANCE_TIERS.find((t) => t.id === maintenanceId);

  const addonsOneTime = selectedAddonObjects.reduce((s, m) => s + m.oneTimeFee, 0);
  const addonsMonthly = selectedAddonObjects.reduce((s, m) => s + (m.monthlyFee ?? 0), 0);

  const totalOneTime = (baseTier?.oneTimeFee ?? 0) + addonsOneTime;
  const totalMonthly = (maintenanceTier?.monthlyFee ?? 0) + addonsMonthly;
  const threeYearValue = totalOneTime + totalMonthly * 36;

  async function handleSaveProposal() {
    if (!contactId) { toast.error("Selecciona un contacto"); return; }
    if (!baseTier) { toast.error("Selecciona un plan base"); return; }
    setSaving(true);
    try {
      const features = [...baseTier.features];
      const addOns = selectedAddonObjects.map((m) =>
        m.monthlyFee ? `${m.name} — ${fmt(m.oneTimeFee)} + ${fmt(m.monthlyFee)}/mes` : `${m.name} — ${fmt(m.oneTimeFee)}`
      );
      const deliverables = maintenanceTier
        ? [`Mantenimiento ${maintenanceTier.name} — ${fmt(maintenanceTier.monthlyFee)}/mes`, ...maintenanceTier.features]
        : [];
      const notes = `Cotización generada con la calculadora — Track: ${track === "website" ? "Sitio Web" : "Sistema a Medida"}. Valor total a 3 años: ${fmt(threeYearValue)}.`;

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          planName: baseTier.name,
          oneTimeFee: totalOneTime,
          monthlyFee: totalMonthly,
          features,
          addOns,
          automations: [],
          deliverables,
          notes,
        }),
      });
      if (!res.ok) throw new Error();
      const proposal = await res.json();

      await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientStatus: "proposal_sent" }),
      });

      setSavedProposalId(proposal.id);
      toast.success("Propuesta creada y contacto actualizado");
    } catch {
      toast.error("Error al guardar la propuesta");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!savedProposalId) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/proposals/${savedProposalId}/share`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      const url = `${window.location.origin}/p/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("Error al generar enlace");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          Calculadora de Propuestas
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Precios reales de las 7 propuestas ya cerradas en el CRM — arma solo lo que el cliente necesita.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── Left: builder ── */}
        <div className="space-y-6">
          {/* Track selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleTrackChange("website")}
              className={cn(
                "border rounded-xl p-4 text-left transition-all",
                track === "website" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40"
              )}
            >
              <p className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Sitio Web / E-commerce</p>
              <p className="text-xs text-muted-foreground mt-1">Mockup a producción, catálogo, pagos</p>
            </button>
            <button
              onClick={() => handleTrackChange("custom")}
              className={cn(
                "border rounded-xl p-4 text-left transition-all",
                track === "custom" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40"
              )}
            >
              <p className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Sistema a Medida</p>
              <p className="text-xs text-muted-foreground mt-1">CRM / ERP para operación del negocio</p>
            </button>
          </div>

          {/* Base tier */}
          <div className="space-y-3">
            <SectionHeader icon={Globe} title="Plan base" badge="Pago único · elige uno" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableBaseTiers.map((t) => (
                <PlanCard
                  key={t.id}
                  selected={baseTierId === t.id}
                  onClick={() => handleBaseTierChange(t.id)}
                  label={t.name}
                  price={fmt(t.oneTimeFee)}
                  sub={t.description}
                  features={t.features}
                  sourceLabel={t.sourceLabel}
                  accent={t.id === "web_estandar" || t.id === "custom_sistema"}
                />
              ))}
            </div>
          </div>

          {/* Add-on modules */}
          <div className="space-y-3">
            <SectionHeader icon={Layers} title="Módulos a la carte" badge="Opcional · solo lo que necesite" />
            <div className="space-y-2">
              {availableAddons.map((m) => (
                <ModuleRow
                  key={m.id}
                  selected={selectedAddons.includes(m.id)}
                  onClick={() => toggleAddon(m.id)}
                  name={m.name}
                  description={m.description}
                  oneTimeFee={m.oneTimeFee}
                  monthlyFee={m.monthlyFee}
                  estimated={m.estimated}
                />
              ))}
            </div>
          </div>

          {/* Maintenance */}
          <div className="space-y-3">
            <SectionHeader icon={Wrench} title="Mantenimiento mensual" badge="Recurrente · elige uno" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <PlanCard
                selected={maintenanceId === null}
                onClick={() => setMaintenanceId(null)}
                label="Sin mantenimiento"
                price="—"
                features={[]}
                sub="El cliente gestiona solo"
              />
              {MAINTENANCE_TIERS.map((t) => (
                <PlanCard
                  key={t.id}
                  selected={maintenanceId === t.id}
                  onClick={() => setMaintenanceId(t.id)}
                  label={t.name}
                  price={fmt(t.monthlyFee)}
                  priceLabel="/mes"
                  features={t.features}
                  accent={t.recommended}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: summary + save ── */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Breakdown */}
          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <p className="text-sm font-semibold">Desglose completo</p>
            <div className="space-y-1.5">
              {baseTier && <SummaryLine label={`Plan ${baseTier.name}`} value={fmt(baseTier.oneTimeFee)} />}
              {selectedAddonObjects.map((m) => (
                <SummaryLine
                  key={m.id}
                  label={m.name}
                  value={m.monthlyFee ? `${fmt(m.oneTimeFee)} + ${fmt(m.monthlyFee)}/mes` : fmt(m.oneTimeFee)}
                />
              ))}
              {maintenanceTier && (
                <SummaryLine label={`Mantenimiento ${maintenanceTier.name}`} value={`${fmt(maintenanceTier.monthlyFee)}/mes`} />
              )}
              {!maintenanceTier && <SummaryLine label="Mantenimiento" value="—" muted />}
            </div>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Total único</span>
                <span className="text-lg font-bold">{fmt(totalOneTime)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Total mensual</span>
                <span className={cn("text-lg font-bold", totalMonthly > 0 ? "text-primary" : "text-muted-foreground")}>
                  {totalMonthly > 0 ? fmt(totalMonthly) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* 3-year value */}
          <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Valor del cliente a 3 años</p>
            </div>
            <p className="text-2xl font-bold text-primary">{fmt(threeYearValue)}</p>
            <p className="text-xs text-muted-foreground">
              {fmt(totalOneTime)} setup + {fmt(totalMonthly)}/mes × 36 meses — un cliente retenido vale más que
              una venta única.
            </p>
          </div>

          {/* Save as proposal */}
          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <p className="text-sm font-semibold flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Guardar como propuesta
            </p>
            <select
              value={contactId}
              onChange={(e) => { setContactId(e.target.value); setSavedProposalId(null); }}
              className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
            >
              <option value="">Selecciona un contacto...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.company ? `${c.company} — ${c.name}` : c.name}</option>
              ))}
            </select>
            {!savedProposalId ? (
              <button
                onClick={handleSaveProposal}
                disabled={saving || !contactId || !baseTier}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Guardando..." : "Guardar propuesta"}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Propuesta guardada
                </p>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" /> {sharing ? "Generando..." : "Compartir enlace"}
                </button>
                <button
                  onClick={() => router.push("/proposals")}
                  className="w-full text-xs text-primary underline underline-offset-2"
                >
                  Ver en Propuestas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
