"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/constants";
import {
  BASE_TIERS,
  ADDON_MODULES,
  MAINTENANCE_TIERS,
  COMMUNITY_MANAGER_TIERS,
  MODULE_CATEGORY_LABELS,
  CUSTOM_FOUNDATION,
  CUSTOM_PAGE_ADDON,
  type Track,
  type ModuleCategory,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Calculator, Globe, Wrench, Layers, Check, ChevronDown, ChevronUp,
  TrendingUp, User, Share2, Info, Sparkles, Minus, Plus, Megaphone,
} from "lucide-react";

function fmt(cents: number) {
  return formatCurrency(cents);
}

const CATEGORY_ORDER: ModuleCategory[] = [
  "catalogo", "automatizacion", "marketing", "seo", "acceso", "diseno", "pagos",
];

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
  qty, onToggle, onIncrement, onDecrement, name, description, oneTimeFee, monthlyFee, estimated, unit,
}: {
  qty: number;
  onToggle?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  name: string;
  description: string;
  oneTimeFee: number;
  monthlyFee?: number;
  estimated?: boolean;
  unit?: string;
}) {
  const selected = qty > 0;
  const multiplier = unit ? Math.max(qty, 1) : 1;

  return (
    <div
      onClick={unit ? undefined : onToggle}
      className={cn(
        "border rounded-xl p-3 transition-all select-none flex items-start gap-3",
        !unit && "cursor-pointer",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20"
      )}
    >
      {unit ? (
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onDecrement?.(); }}
            disabled={qty === 0}
            className="w-5 h-5 rounded-md border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-xs font-semibold">{qty}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onIncrement?.(); }}
            className="w-5 h-5 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            selected ? "bg-primary border-primary" : "border-muted-foreground/40"
          )}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{name}</p>
          <div className="text-right shrink-0">
            {oneTimeFee > 0 ? (
              <p className="text-sm font-bold text-primary">
                {fmt(oneTimeFee * multiplier)}
                {unit && <span className="text-[10px] font-normal text-muted-foreground"> ({fmt(oneTimeFee)}/{unit})</span>}
              </p>
            ) : (
              <p className="text-sm font-bold text-primary">{fmt(monthlyFee ?? 0)}<span className="text-[10px] font-normal text-muted-foreground">/mes</span></p>
            )}
            {oneTimeFee > 0 && monthlyFee !== undefined && monthlyFee > 0 && (
              <p className="text-[10px] text-muted-foreground">+ {fmt(monthlyFee * multiplier)}/mes</p>
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

function QuantityCard({
  label, description, qty, unitPrice, onIncrement, onDecrement,
}: {
  label: string;
  description: string;
  qty: number;
  unitPrice: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="border rounded-xl p-3.5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{fmt(unitPrice)} c/u</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onDecrement}
          disabled={qty === 0}
          className="w-7 h-7 rounded-md border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-bold">{qty}</span>
        <button
          onClick={onIncrement}
          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
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

type BuildMode = "tiers" | "custom";

export default function CalculatorPage() {
  const router = useRouter();

  const [buildMode, setBuildMode] = useState<BuildMode>("tiers");

  const [track, setTrack] = useState<Track>("website");
  const [baseTierId, setBaseTierId] = useState<string | null>("web_estandar");
  const [pageQty, setPageQty] = useState(0);
  const [moduleQty, setModuleQty] = useState<Record<string, number>>({});
  const [maintenanceId, setMaintenanceId] = useState<string | null>("maint_crecimiento");
  const [communityManagerId, setCommunityManagerId] = useState<string | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts).catch(() => {});
  }, []);

  const availableBaseTiers = useMemo(() => BASE_TIERS.filter((t) => t.track === track), [track]);
  const availableAddons = useMemo(
    () => ADDON_MODULES.filter((m) => m.tracks.includes(buildMode === "custom" ? "website" : track)),
    [track, buildMode]
  );
  const addonsByCategory = useMemo(() => {
    const map = new Map<ModuleCategory, typeof ADDON_MODULES>();
    for (const cat of CATEGORY_ORDER) {
      const items = availableAddons.filter((m) => m.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [availableAddons]);

  function resetSelections() {
    setModuleQty({});
    setPageQty(0);
    setSavedProposalId(null);
  }

  function handleBuildModeChange(next: BuildMode) {
    setBuildMode(next);
    resetSelections();
    if (next === "tiers") {
      const firstTier = BASE_TIERS.find((t) => t.track === track);
      setMaintenanceId(firstTier?.recommendedMaintenanceId ?? null);
    } else {
      setMaintenanceId("maint_crecimiento");
    }
  }

  function handleTrackChange(next: Track) {
    setTrack(next);
    const firstTier = BASE_TIERS.find((t) => t.track === next);
    setBaseTierId(firstTier?.id ?? null);
    setMaintenanceId(firstTier?.recommendedMaintenanceId ?? null);
    resetSelections();
  }

  function handleBaseTierChange(id: string) {
    setBaseTierId(id);
    const tier = BASE_TIERS.find((t) => t.id === id);
    if (tier) setMaintenanceId(tier.recommendedMaintenanceId);
    setSavedProposalId(null);
  }

  function getQty(id: string) {
    return moduleQty[id] ?? 0;
  }
  function toggleModule(id: string) {
    setModuleQty((prev) => ({ ...prev, [id]: (prev[id] ?? 0) > 0 ? 0 : 1 }));
    setSavedProposalId(null);
  }
  function incrementModule(id: string) {
    setModuleQty((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setSavedProposalId(null);
  }
  function decrementModule(id: string) {
    setModuleQty((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }));
    setSavedProposalId(null);
  }

  const baseTier = BASE_TIERS.find((t) => t.id === baseTierId);
  const selectedAddonObjects = ADDON_MODULES.filter((m) => getQty(m.id) > 0);
  const maintenanceTier = MAINTENANCE_TIERS.find((t) => t.id === maintenanceId);
  const communityManagerTier = COMMUNITY_MANAGER_TIERS.find((t) => t.id === communityManagerId);
  const communityManagerFee = communityManagerTier
    ? Math.round((communityManagerTier.monthlyFeeMin + communityManagerTier.monthlyFeeMax) / 2)
    : 0;

  const addonsOneTime = selectedAddonObjects.reduce((s, m) => s + m.oneTimeFee * getQty(m.id), 0);
  const addonsMonthly = selectedAddonObjects.reduce((s, m) => s + (m.monthlyFee ?? 0) * getQty(m.id), 0);

  const baseOneTime =
    buildMode === "tiers"
      ? baseTier?.oneTimeFee ?? 0
      : CUSTOM_FOUNDATION.oneTimeFee + pageQty * CUSTOM_PAGE_ADDON.oneTimeFee;

  const totalOneTime = baseOneTime + addonsOneTime;
  const totalMonthly = (maintenanceTier?.monthlyFee ?? 0) + addonsMonthly + communityManagerFee;
  const threeYearValue = totalOneTime + totalMonthly * 36;

  async function handleSaveProposal() {
    if (!contactId) { toast.error("Selecciona un contacto"); return; }
    if (buildMode === "tiers" && !baseTier) { toast.error("Selecciona un plan base"); return; }
    setSaving(true);
    try {
      const features =
        buildMode === "tiers"
          ? [...(baseTier?.features ?? [])]
          : [
              CUSTOM_FOUNDATION.name,
              ...(pageQty > 0 ? [`${pageQty} página${pageQty !== 1 ? "s" : ""} adicional${pageQty !== 1 ? "es" : ""}`] : []),
            ];
      const addOns = selectedAddonObjects.map((m) => {
        const qty = getQty(m.id);
        const qtyLabel = m.unit && qty > 1 ? ` x${qty}` : "";
        const oneTime = m.oneTimeFee * qty;
        const monthly = (m.monthlyFee ?? 0) * qty;
        if (oneTime > 0 && monthly > 0) return `${m.name}${qtyLabel} — ${fmt(oneTime)} + ${fmt(monthly)}/mes`;
        if (monthly > 0) return `${m.name}${qtyLabel} — ${fmt(monthly)}/mes`;
        return `${m.name}${qtyLabel} — ${fmt(oneTime)}`;
      });
      const deliverables = [
        ...(maintenanceTier
          ? [`Mantenimiento ${maintenanceTier.name} — ${fmt(maintenanceTier.monthlyFee)}/mes`, ...maintenanceTier.features]
          : []),
        ...(communityManagerTier
          ? [`Community Manager ${communityManagerTier.name} — ${fmt(communityManagerFee)}/mes`, ...communityManagerTier.features]
          : []),
      ];
      const modeLabel =
        buildMode === "tiers"
          ? track === "website" ? "Sitio Web (por plan)" : "Sistema a Medida"
          : "Sitio 100% Personalizado";
      const notes = `Cotización generada con la calculadora — ${modeLabel}. Valor total a 3 años: ${fmt(threeYearValue)}.`;

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          planName: buildMode === "tiers" ? baseTier!.name : "Sitio Personalizado",
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

      {/* Build mode toggle */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => handleBuildModeChange("tiers")}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
            buildMode === "tiers" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5" /> Por planes
        </button>
        <button
          onClick={() => handleBuildModeChange("custom")}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
            buildMode === "custom" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" /> Sitio 100% personalizado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── Left: builder ── */}
        <div className="space-y-6">
          {buildMode === "tiers" ? (
            <>
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
            </>
          ) : (
            <>
              {/* Foundation (fixed) */}
              <div className="space-y-3">
                <SectionHeader icon={Globe} title="Fundación del sitio" badge="Incluida · pago único" />
                <div className="border rounded-xl p-3.5 bg-muted/20">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{CUSTOM_FOUNDATION.name}</p>
                    <p className="text-sm font-bold text-primary shrink-0">{fmt(CUSTOM_FOUNDATION.oneTimeFee)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{CUSTOM_FOUNDATION.description}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground italic flex items-start gap-1">
                    <Info className="h-3 w-3 shrink-0 mt-0.5" /> {CUSTOM_FOUNDATION.sourceLabel}
                  </p>
                </div>
                <QuantityCard
                  label={CUSTOM_PAGE_ADDON.name}
                  description={CUSTOM_PAGE_ADDON.description}
                  qty={pageQty}
                  unitPrice={CUSTOM_PAGE_ADDON.oneTimeFee}
                  onIncrement={() => { setPageQty((q) => q + 1); setSavedProposalId(null); }}
                  onDecrement={() => { setPageQty((q) => Math.max(0, q - 1)); setSavedProposalId(null); }}
                />
              </div>

              {/* Modules grouped by category */}
              <div className="space-y-5">
                <SectionHeader icon={Sparkles} title="Arma tu sitio a la carte" badge="Elige lo que el cliente realmente necesita" />
                {Array.from(addonsByCategory.entries()).map(([cat, items]) => (
                  <div key={cat} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-0.5">
                      {MODULE_CATEGORY_LABELS[cat]}
                    </p>
                    <div className="space-y-2">
                      {items.map((m) => (
                        <ModuleRow
                          key={m.id}
                          qty={getQty(m.id)}
                          onToggle={() => toggleModule(m.id)}
                          onIncrement={() => incrementModule(m.id)}
                          onDecrement={() => decrementModule(m.id)}
                          name={m.name}
                          description={m.description}
                          oneTimeFee={m.oneTimeFee}
                          monthlyFee={m.monthlyFee}
                          estimated={m.estimated}
                          unit={m.unit}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Add-on modules (tiers mode only — custom mode shows its own grouped list above) */}
          {buildMode === "tiers" && (
            <div className="space-y-3">
              <SectionHeader icon={Layers} title="Módulos a la carte" badge="Opcional · solo lo que necesite" />
              <div className="space-y-2">
                {availableAddons.map((m) => (
                  <ModuleRow
                    key={m.id}
                    qty={getQty(m.id)}
                    onToggle={() => toggleModule(m.id)}
                    onIncrement={() => incrementModule(m.id)}
                    onDecrement={() => decrementModule(m.id)}
                    name={m.name}
                    description={m.description}
                    oneTimeFee={m.oneTimeFee}
                    monthlyFee={m.monthlyFee}
                    estimated={m.estimated}
                    unit={m.unit}
                  />
                ))}
              </div>
            </div>
          )}

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

          {/* Community Manager */}
          <div className="space-y-3">
            <SectionHeader icon={Megaphone} title="Community Manager" badge="Opcional · recurrente" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <PlanCard
                selected={communityManagerId === null}
                onClick={() => { setCommunityManagerId(null); setSavedProposalId(null); }}
                label="Sin community manager"
                price="—"
                features={[]}
                sub="El cliente gestiona sus redes"
              />
              {COMMUNITY_MANAGER_TIERS.map((t) => (
                <PlanCard
                  key={t.id}
                  selected={communityManagerId === t.id}
                  onClick={() => { setCommunityManagerId(t.id); setSavedProposalId(null); }}
                  label={t.name}
                  price={`${fmt(t.monthlyFeeMin)}–${fmt(t.monthlyFeeMax)}`}
                  priceLabel="/mes"
                  sub={t.tagline}
                  features={t.features}
                  sourceLabel={t.sourceLabel}
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
              {buildMode === "tiers" ? (
                baseTier && <SummaryLine label={`Plan ${baseTier.name}`} value={fmt(baseTier.oneTimeFee)} />
              ) : (
                <>
                  <SummaryLine label={CUSTOM_FOUNDATION.name} value={fmt(CUSTOM_FOUNDATION.oneTimeFee)} />
                  {pageQty > 0 && (
                    <SummaryLine
                      label={`${pageQty} × ${CUSTOM_PAGE_ADDON.name}`}
                      value={fmt(pageQty * CUSTOM_PAGE_ADDON.oneTimeFee)}
                    />
                  )}
                </>
              )}
              {selectedAddonObjects.map((m) => {
                const qty = getQty(m.id);
                const oneTime = m.oneTimeFee * qty;
                const monthly = (m.monthlyFee ?? 0) * qty;
                const label = m.unit && qty > 1 ? `${m.name} ×${qty}` : m.name;
                const value =
                  oneTime > 0 && monthly > 0
                    ? `${fmt(oneTime)} + ${fmt(monthly)}/mes`
                    : monthly > 0
                    ? `${fmt(monthly)}/mes`
                    : fmt(oneTime);
                return <SummaryLine key={m.id} label={label} value={value} />;
              })}
              {maintenanceTier && (
                <SummaryLine label={`Mantenimiento ${maintenanceTier.name}`} value={`${fmt(maintenanceTier.monthlyFee)}/mes`} />
              )}
              {!maintenanceTier && <SummaryLine label="Mantenimiento" value="—" muted />}
              {communityManagerTier && (
                <SummaryLine label={`Community Manager ${communityManagerTier.name}`} value={`${fmt(communityManagerFee)}/mes`} />
              )}
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
                disabled={saving || !contactId || (buildMode === "tiers" && !baseTier)}
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
