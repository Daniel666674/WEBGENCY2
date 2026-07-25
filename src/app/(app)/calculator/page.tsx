"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/constants";
import {
  BASE_TIERS,
  ADDON_MODULES,
  MAINTENANCE_TIERS,
  COMMUNITY_MANAGER_TIERS,
  CONTRACT_TERMS,
  PAYMENT_SCHEDULES,
  IVA_RATE,
  DOMAIN_HOSTING_RENEWAL,
  RUSH_DELIVERY,
  MODULE_CATEGORY_LABELS,
  CUSTOM_FOUNDATION,
  CUSTOM_PAGE_ADDON,
  type Track,
  type ModuleCategory,
} from "@/lib/catalog";
import { toast } from "sonner";
import {
  Globe, Layers, ChevronDown, ChevronUp,
  TrendingUp, Info, Sparkles,
  CalendarClock, Wallet, EyeOff, ShieldCheck, FileCheck2, Clock3, PenLine,
} from "lucide-react";
import { CalculatorHeader } from "@/components/calculator/CalculatorHeader";
import { ModeToggle } from "@/components/calculator/ModeToggle";
import { Stepper } from "@/components/calculator/Stepper";
import {
  SectionHeader, PlanCard, PlanListItem, ModuleRow, QuantityCard, ToggleCard,
  SummaryLine, Slider, CompactSelect,
} from "@/components/calculator/shared";
import type { BuildMode } from "@/components/calculator/types";

function fmt(cents: number) {
  return formatCurrency(cents);
}

const CATEGORY_ORDER: ModuleCategory[] = [
  "catalogo", "automatizacion", "marketing", "seo", "acceso", "diseno", "pagos",
];

interface Contact {
  id: string;
  name: string;
  company: string | null;
}

interface ProposalRow {
  createdAt: number | string;
}

const SCRATCH_ID = "scratch";

export default function CalculatorPage() {
  const [buildMode, setBuildMode] = useState<BuildMode>("tiers");
  const [activeStep, setActiveStep] = useState(1);

  const [track, setTrack] = useState<Track>("website");
  const [baseTierId, setBaseTierId] = useState<string | null>("web_estandar");
  const [pageQty, setPageQty] = useState(0);
  const [moduleQty, setModuleQty] = useState<Record<string, number>>({});
  const [maintenanceId, setMaintenanceId] = useState<string | null>("maint_crecimiento");
  const [communityManagerId, setCommunityManagerId] = useState<string | null>(null);

  const [termId, setTermId] = useState<string>("term_3y");
  const [paymentScheduleId, setPaymentScheduleId] = useState<string>("pago_50_50");
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [rushDelivery, setRushDelivery] = useState(false);
  const [ownsDomain, setOwnsDomain] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);
  const [showMargin, setShowMargin] = useState(false);
  const [marginCostPct, setMarginCostPct] = useState(45);
  const [clientNotes, setClientNotes] = useState("");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [proposals, setProposals] = useState<ProposalRow[]>([]);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts).catch(() => {});
    fetch("/api/proposals").then((r) => r.json()).then(setProposals).catch(() => {});
  }, []);

  const proposalsCount = proposals.length;
  const monthTrendPct = useMemo(() => {
    if (proposals.length === 0) return null;
    const now = new Date();
    const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const thisCount = proposals.filter((p) => new Date(p.createdAt).getTime() >= thisStart).length;
    const lastCount = proposals.filter((p) => {
      const t = new Date(p.createdAt).getTime();
      return t >= lastStart && t < thisStart;
    }).length;
    if (lastCount === 0) return thisCount > 0 ? 100 : null;
    return Math.round(((thisCount - lastCount) / lastCount) * 100);
  }, [proposals]);

  const availableBaseTiers = useMemo(() => BASE_TIERS.filter((t) => t.track === track), [track]);
  const customBaseOptions = useMemo(() => BASE_TIERS.filter((t) => t.track === "website"), []);
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
      setBaseTierId(firstTier?.id ?? null);
      setMaintenanceId(firstTier?.recommendedMaintenanceId ?? null);
    } else {
      setBaseTierId(SCRATCH_ID);
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

  const isScratch = buildMode === "custom" && baseTierId === SCRATCH_ID;
  const baseTier = isScratch ? undefined : BASE_TIERS.find((t) => t.id === baseTierId);
  const selectedAddonObjects = ADDON_MODULES.filter((m) => getQty(m.id) > 0);
  const maintenanceTier = MAINTENANCE_TIERS.find((t) => t.id === maintenanceId);
  const communityManagerTier = COMMUNITY_MANAGER_TIERS.find((t) => t.id === communityManagerId);
  const communityManagerFee = communityManagerTier
    ? Math.round((communityManagerTier.monthlyFeeMin + communityManagerTier.monthlyFeeMax) / 2)
    : 0;
  const term = CONTRACT_TERMS.find((t) => t.id === termId) ?? CONTRACT_TERMS[0];
  const paymentSchedule = PAYMENT_SCHEDULES.find((p) => p.id === paymentScheduleId) ?? PAYMENT_SCHEDULES[0];
  const hasWebsiteComponent = buildMode === "custom" || (buildMode === "tiers" && track === "website");

  const addonsOneTime = selectedAddonObjects.reduce((s, m) => s + m.oneTimeFee * getQty(m.id), 0);
  const addonsMonthly = selectedAddonObjects.reduce((s, m) => s + (m.monthlyFee ?? 0) * getQty(m.id), 0);

  const baseOneTime = isScratch
    ? CUSTOM_FOUNDATION.oneTimeFee + pageQty * CUSTOM_PAGE_ADDON.oneTimeFee
    : baseTier?.oneTimeFee ?? 0;

  // ── One-time chain: rush surcharge → payment-schedule discount → discretional discount → IVA ──
  const rawOneTime = baseOneTime + addonsOneTime;
  const rushFee = rushDelivery ? Math.round(rawOneTime * (RUSH_DELIVERY.surchargePct / 100)) : 0;
  const oneTimeBeforeScheduleDiscount = rawOneTime + rushFee;
  const scheduleDiscount = paymentSchedule.discountPct
    ? Math.round(oneTimeBeforeScheduleDiscount * (paymentSchedule.discountPct / 100))
    : 0;
  const oneTimeAfterSchedule = oneTimeBeforeScheduleDiscount - scheduleDiscount;
  const manualDiscountOneTime = discountPct ? Math.round(oneTimeAfterSchedule * (discountPct / 100)) : 0;
  const oneTimeSubtotal = oneTimeAfterSchedule - manualDiscountOneTime;
  const taxOneTime = taxIncluded ? Math.round(oneTimeSubtotal * IVA_RATE) : 0;
  const totalOneTime = oneTimeSubtotal + taxOneTime;

  // ── Monthly chain: permanencia discount → discretional discount → IVA ──
  const rawMonthly = (maintenanceTier?.monthlyFee ?? 0) + addonsMonthly + communityManagerFee;
  const termDiscount = term.discountPct ? Math.round(rawMonthly * (term.discountPct / 100)) : 0;
  const monthlyAfterTerm = rawMonthly - termDiscount;
  const manualDiscountMonthly = discountPct ? Math.round(monthlyAfterTerm * (discountPct / 100)) : 0;
  const monthlySubtotal = monthlyAfterTerm - manualDiscountMonthly;
  const taxMonthly = taxIncluded ? Math.round(monthlySubtotal * IVA_RATE) : 0;
  const totalMonthly = monthlySubtotal + taxMonthly;

  const renewalApplies = hasWebsiteComponent && !ownsDomain;
  const renewalFee = renewalApplies ? DOMAIN_HOSTING_RENEWAL.annualFee : 0;
  const threeYearValue = totalOneTime + totalMonthly * 36 + renewalFee * 2;

  const installments = useMemo(() => {
    const pcts = paymentSchedule.installments;
    const amounts = pcts.map((inst) => Math.round(totalOneTime * (inst.pct / 100)));
    const sum = amounts.reduce((s, a) => s + a, 0);
    if (amounts.length > 0) amounts[amounts.length - 1] += totalOneTime - sum;
    return pcts.map((inst, i) => ({ label: inst.label, amount: amounts[i] }));
  }, [paymentSchedule, totalOneTime]);

  const marginCostOneTime = Math.round(totalOneTime * (marginCostPct / 100));
  const marginProfitOneTime = totalOneTime - marginCostOneTime;
  const marginPctOneTime = totalOneTime > 0 ? Math.round((marginProfitOneTime / totalOneTime) * 100) : 0;
  const marginCostMonthly = Math.round(totalMonthly * (marginCostPct / 100));
  const marginProfitMonthly = totalMonthly - marginCostMonthly;
  const marginPctMonthly = totalMonthly > 0 ? Math.round((marginProfitMonthly / totalMonthly) * 100) : 0;

  const selectedContact = contacts.find((c) => c.id === contactId);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [
    buildMode, track, baseTierId, pageQty, moduleQty, maintenanceId, communityManagerId,
    termId, paymentScheduleId, taxIncluded, rushDelivery, ownsDomain, discountPct, marginCostPct, clientNotes,
  ]);

  async function handleSaveProposal() {
    if (!contactId) { toast.error("Selecciona un contacto"); return; }
    if (buildMode === "tiers" && !baseTier) { toast.error("Selecciona un plan base"); return; }
    setSaving(true);
    try {
      const features = isScratch
        ? [
            CUSTOM_FOUNDATION.name,
            ...(pageQty > 0 ? [`${pageQty} página${pageQty !== 1 ? "s" : ""} adicional${pageQty !== 1 ? "es" : ""}`] : []),
          ]
        : [...(baseTier?.features ?? [])];
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
      const extras: string[] = [];
      if (term.discountPct > 0) extras.push(`Permanencia ${term.name} (-${term.discountPct}% mensual)`);
      if (paymentSchedule.discountPct) extras.push(`Pago ${paymentSchedule.name} (-${paymentSchedule.discountPct}% único)`);
      else extras.push(`Forma de pago: ${paymentSchedule.name}`);
      if (rushDelivery) extras.push(`Entrega prioritaria (+${RUSH_DELIVERY.surchargePct}%)`);
      if (discountPct > 0) extras.push(`Descuento adicional (-${discountPct}%)`);
      if (taxIncluded) extras.push(`IVA incluido (${IVA_RATE * 100}%)`);
      if (renewalFee > 0) extras.push(`Renovación dominio/hosting: ${fmt(renewalFee)}/año desde año 2`);
      const notes = [
        clientNotes.trim(),
        `Cotización generada con la calculadora — ${modeLabel}. ${extras.join(". ")}. Valor total a 3 años: ${fmt(threeYearValue)}.`,
      ].filter(Boolean).join("\n\n");

      const pricingMeta = {
        termMonths: term.months,
        termName: term.name,
        termDiscountPct: term.discountPct,
        paymentScheduleId: paymentSchedule.id,
        paymentScheduleName: paymentSchedule.name,
        paymentScheduleDiscountPct: paymentSchedule.discountPct ?? 0,
        installments,
        taxIncluded,
        taxRate: IVA_RATE,
        taxOneTime,
        taxMonthly,
        rushDelivery,
        rushFee,
        discountPct,
        ownsDomain,
        renewalFee,
        renewalYears: renewalApplies ? 2 : 0,
        subtotalOneTime: oneTimeSubtotal,
        subtotalMonthly: monthlySubtotal,
        threeYearValue,
      };

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          planName: isScratch ? "Sitio Personalizado" : baseTier!.name,
          oneTimeFee: totalOneTime,
          monthlyFee: totalMonthly,
          features,
          addOns,
          automations: [],
          deliverables,
          notes,
          pricingMeta,
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
      setProposals((prev) => [...prev, { createdAt: Date.now() }]);
      toast.success("Propuesta creada y contacto actualizado");
    } catch {
      toast.error("Error al guardar la propuesta");
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadCsv() {
    const clientLabel = selectedContact ? selectedContact.company || selectedContact.name : "";
    const modeLabel =
      buildMode === "tiers"
        ? track === "website" ? "Sitio Web (por plan)" : "Sistema a Medida"
        : "Sitio 100% Personalizado";

    const rows: string[][] = [];
    rows.push(["OLIWAN Agency — Cotización"]);
    rows.push(["Fecha", new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })]);
    if (clientLabel) rows.push(["Cliente", clientLabel]);
    rows.push(["Tipo", modeLabel]);
    rows.push([]);
    rows.push(["Concepto", "Tipo", "Valor"]);

    if (isScratch) {
      rows.push([CUSTOM_FOUNDATION.name, "Pago único", fmt(CUSTOM_FOUNDATION.oneTimeFee)]);
      if (pageQty > 0) rows.push([`${pageQty} × ${CUSTOM_PAGE_ADDON.name}`, "Pago único", fmt(pageQty * CUSTOM_PAGE_ADDON.oneTimeFee)]);
    } else if (baseTier) {
      rows.push([`Plan ${baseTier.name}`, "Pago único", fmt(baseTier.oneTimeFee)]);
    }
    for (const m of selectedAddonObjects) {
      const qty = getQty(m.id);
      const label = m.unit && qty > 1 ? `${m.name} ×${qty}` : m.name;
      const oneTime = m.oneTimeFee * qty;
      const monthly = (m.monthlyFee ?? 0) * qty;
      if (oneTime > 0) rows.push([label, "Pago único", fmt(oneTime)]);
      if (monthly > 0) rows.push([label, "Mensual", `${fmt(monthly)}/mes`]);
    }
    if (maintenanceTier) rows.push([`Mantenimiento ${maintenanceTier.name}`, "Mensual", `${fmt(maintenanceTier.monthlyFee)}/mes`]);
    if (communityManagerTier) rows.push([`Community Manager ${communityManagerTier.name}`, "Mensual", `${fmt(communityManagerFee)}/mes`]);
    if (rushFee > 0) rows.push([`${RUSH_DELIVERY.name} (+${RUSH_DELIVERY.surchargePct}%)`, "Pago único", fmt(rushFee)]);
    if (scheduleDiscount > 0) rows.push([`Descuento ${paymentSchedule.name}`, "Pago único", `-${fmt(scheduleDiscount)}`]);
    if (termDiscount > 0) rows.push([`Descuento permanencia ${term.name} (${term.discountPct}%)`, "Mensual", `-${fmt(termDiscount)}/mes`]);
    if (discountPct > 0) {
      rows.push([`Descuento adicional (${discountPct}%)`, "Pago único", `-${fmt(manualDiscountOneTime)}`]);
      if (manualDiscountMonthly > 0) rows.push([`Descuento adicional (${discountPct}%)`, "Mensual", `-${fmt(manualDiscountMonthly)}/mes`]);
    }
    if (taxIncluded) {
      rows.push([`IVA (${IVA_RATE * 100}%)`, "Pago único", fmt(taxOneTime)]);
      rows.push([`IVA (${IVA_RATE * 100}%)`, "Mensual", `${fmt(taxMonthly)}/mes`]);
    }
    rows.push([]);
    rows.push(["TOTAL ÚNICO", "", fmt(totalOneTime)]);
    rows.push(["TOTAL MENSUAL", "", totalMonthly > 0 ? `${fmt(totalMonthly)}/mes` : "—"]);
    rows.push([`Permanencia`, "", term.name]);
    rows.push([]);
    rows.push(["Cronograma de pago", "", paymentSchedule.name]);
    for (const inst of installments) rows.push([inst.label, "", fmt(inst.amount)]);
    if (renewalFee > 0) {
      rows.push([]);
      rows.push([DOMAIN_HOSTING_RENEWAL.name, "Anual desde año 2", `${fmt(renewalFee)}/año`]);
    }
    rows.push([]);
    rows.push(["VALOR TOTAL A 3 AÑOS", "", fmt(threeYearValue)]);
    rows.push([]);
    rows.push([`Cotización válida por 30 días · Precios en COP${taxIncluded ? " · IVA incluido" : " · IVA no incluido"}`]);

    const csv = rows.map((r) => r.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cotizacion-oliwan${clientLabel ? "-" + clientLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}-${datePart}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV descargado");
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

  // ── Section content, shared between the two grid layouts ──
  const planSection = (
    <div id="step-plan" className="space-y-3">
      {buildMode === "tiers" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTrackChange("website")}
              className={`border rounded-xl p-3 text-left transition-all cursor-pointer ${track === "website" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40"}`}
            >
              <p className="text-xs font-semibold flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> Sitio Web</p>
            </button>
            <button
              onClick={() => handleTrackChange("custom")}
              className={`border rounded-xl p-3 text-left transition-all cursor-pointer ${track === "custom" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40"}`}
            >
              <p className="text-xs font-semibold flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-primary" /> A Medida</p>
            </button>
          </div>
          <SectionHeader icon={Globe} title="1. Elige el plan base" badge="Pago único" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
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
        </>
      ) : (
        <>
          <SectionHeader icon={Sparkles} title="1. Elige el plan o base" badge="Punto de partida" />
          <div className="space-y-2">
            {customBaseOptions.map((t) => (
              <PlanListItem
                key={t.id}
                selected={baseTierId === t.id}
                onClick={() => handleBaseTierChange(t.id)}
                label={t.name}
                price={fmt(t.oneTimeFee)}
                priceLabel="Pago único"
                sub={t.description}
              />
            ))}
            <PlanListItem
              selected={isScratch}
              onClick={() => { setBaseTierId(SCRATCH_ID); setSavedProposalId(null); }}
              label="Empezar desde cero"
              price=""
              sub="Sin base, configuración completamente personalizada."
              icon={PenLine}
            />
          </div>
          {isScratch && (
            <QuantityCard
              label={CUSTOM_PAGE_ADDON.name}
              description={CUSTOM_PAGE_ADDON.description}
              qty={pageQty}
              unitPrice={CUSTOM_PAGE_ADDON.oneTimeFee}
              onIncrement={() => { setPageQty((q) => q + 1); setSavedProposalId(null); }}
              onDecrement={() => { setPageQty((q) => Math.max(0, q - 1)); setSavedProposalId(null); }}
            />
          )}
        </>
      )}
    </div>
  );

  const modulosSection = (
    <div id="step-modulos" className="space-y-4">
      <SectionHeader icon={Layers} title="2. Añade módulos a la carta" badge="Opcional · solo lo que necesite" />
      {buildMode === "custom" ? (
        <div className="space-y-4">
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
      )}
    </div>
  );

  const personalizacionesSection = (
    <div id="step-personalizaciones" className="space-y-4">
      <SectionHeader icon={CalendarClock} title="3. Personalizaciones" badge="Ajustes adicionales" />

      <Slider label="Margen interno" value={marginCostPct} onChange={setMarginCostPct} hint="Costo estimado como % del precio — nunca se muestra al cliente." />
      <Slider label="Descuento" value={discountPct} onChange={setDiscountPct} max={30} hint="Descuento discrecional sobre el subtotal, único y mensual." />

      <CompactSelect
        label="Mantenimiento mensual"
        value={maintenanceId ?? "none"}
        onChange={(v) => setMaintenanceId(v === "none" ? null : v)}
        options={[
          { value: "none", label: "Sin mantenimiento" },
          ...MAINTENANCE_TIERS.map((t) => ({ value: t.id, label: `${t.name} — ${fmt(t.monthlyFee)}/mes` })),
        ]}
      />
      <CompactSelect
        label="Community Manager"
        value={communityManagerId ?? "none"}
        onChange={(v) => { setCommunityManagerId(v === "none" ? null : v); setSavedProposalId(null); }}
        options={[
          { value: "none", label: "Sin community manager" },
          ...COMMUNITY_MANAGER_TIERS.map((t) => ({ value: t.id, label: `${t.name} — ${fmt(t.monthlyFeeMin)}–${fmt(t.monthlyFeeMax)}/mes` })),
        ]}
      />
      <CompactSelect
        label="Forma de pago preferida"
        value={paymentScheduleId}
        onChange={(v) => { setPaymentScheduleId(v); setSavedProposalId(null); }}
        options={PAYMENT_SCHEDULES.map((p) => ({ value: p.id, label: p.discountPct ? `${p.name} (-${p.discountPct}%)` : p.name }))}
      />
      <CompactSelect
        label="Plazo de permanencia"
        value={termId}
        onChange={(v) => { setTermId(v); setSavedProposalId(null); }}
        options={CONTRACT_TERMS.map((t) => ({ value: t.id, label: t.discountPct > 0 ? `${t.name} (-${t.discountPct}% mensual)` : t.name }))}
      />
      <CompactSelect label="Moneda" value="cop" onChange={() => {}} options={[{ value: "cop", label: "COP — Peso colombiano" }]} />

      <div>
        <label className="text-xs font-medium block mb-1.5">Notas para el cliente (opcional)</label>
        <textarea
          value={clientNotes}
          onChange={(e) => setClientNotes(e.target.value.slice(0, 250))}
          rows={3}
          placeholder="Escribe un mensaje personalizado que verá tu cliente en la propuesta..."
          className="w-full text-sm border rounded-lg px-3 py-2 bg-background resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{clientNotes.length}/250</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <ToggleCard
          checked={rushDelivery}
          onChange={() => { setRushDelivery((v) => !v); setSavedProposalId(null); }}
          label={RUSH_DELIVERY.name}
          description={`+${RUSH_DELIVERY.surchargePct}% sobre el pago único — ${RUSH_DELIVERY.description}`}
        />
        <ToggleCard
          checked={taxIncluded}
          onChange={() => { setTaxIncluded((v) => !v); setSavedProposalId(null); }}
          label={`Incluir IVA (${IVA_RATE * 100}%)`}
          description="Colombia — tarifa general sobre el subtotal, único y mensual"
        />
        {hasWebsiteComponent && (
          <ToggleCard
            checked={ownsDomain}
            onChange={() => { setOwnsDomain((v) => !v); setSavedProposalId(null); }}
            label="Cliente gestiona su propio dominio/hosting"
            description={`Si no, se incluye renovación de ${fmt(DOMAIN_HOSTING_RENEWAL.annualFee)}/año desde el año 2`}
          />
        )}
      </div>

      <div className="border border-primary/30 bg-primary/5 rounded-xl p-3 space-y-1.5">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Propuesta profesional
        </p>
        <p className="text-xs text-muted-foreground">
          Incluye portada personalizada, alcance, condiciones, cronograma y más.
        </p>
        <p className="text-xs font-medium text-green-600 flex items-center gap-1">
          <FileCheck2 className="h-3 w-3" /> Incluido sin costo adicional
        </p>
      </div>
    </div>
  );

  const resumenSection = (
    <div id="step-resumen" className="space-y-4 lg:sticky lg:top-6">
      <div className="border rounded-xl p-4 space-y-3 bg-card">
        <p className="text-sm font-semibold">4. Resumen de la propuesta</p>
        <div className="space-y-1.5">
          {isScratch ? (
            <>
              <SummaryLine label={CUSTOM_FOUNDATION.name} value={fmt(CUSTOM_FOUNDATION.oneTimeFee)} />
              {pageQty > 0 && (
                <SummaryLine label={`${pageQty} × ${CUSTOM_PAGE_ADDON.name}`} value={fmt(pageQty * CUSTOM_PAGE_ADDON.oneTimeFee)} />
              )}
            </>
          ) : (
            baseTier && <SummaryLine label={`Plan ${baseTier.name}`} value={fmt(baseTier.oneTimeFee)} />
          )}
          {selectedAddonObjects.map((m) => {
            const qty = getQty(m.id);
            const oneTime = m.oneTimeFee * qty;
            const monthly = (m.monthlyFee ?? 0) * qty;
            const label = m.unit && qty > 1 ? `${m.name} ×${qty}` : m.name;
            const value = oneTime > 0 && monthly > 0
              ? `${fmt(oneTime)} + ${fmt(monthly)}/mes`
              : monthly > 0 ? `${fmt(monthly)}/mes` : fmt(oneTime);
            return <SummaryLine key={m.id} label={label} value={value} />;
          })}
          {maintenanceTier && <SummaryLine label={`Mantenimiento ${maintenanceTier.name}`} value={`${fmt(maintenanceTier.monthlyFee)}/mes`} />}
          {!maintenanceTier && <SummaryLine label="Mantenimiento" value="—" muted />}
          {communityManagerTier && <SummaryLine label={`Community Manager ${communityManagerTier.name}`} value={`${fmt(communityManagerFee)}/mes`} />}
          {rushFee > 0 && <SummaryLine label={`${RUSH_DELIVERY.name} (+${RUSH_DELIVERY.surchargePct}%)`} value={fmt(rushFee)} />}
          {scheduleDiscount > 0 && <SummaryLine label={`Descuento ${paymentSchedule.name}`} value={`-${fmt(scheduleDiscount)}`} />}
          {termDiscount > 0 && <SummaryLine label={`Descuento permanencia (${term.discountPct}%)`} value={`-${fmt(termDiscount)}/mes`} />}
          {discountPct > 0 && <SummaryLine label={`Descuento adicional (${discountPct}%)`} value={`-${fmt(manualDiscountOneTime)}${manualDiscountMonthly > 0 ? ` / -${fmt(manualDiscountMonthly)}/mes` : ""}`} />}
          {taxIncluded && <SummaryLine label={`IVA (${IVA_RATE * 100}%)`} value={`${fmt(taxOneTime)} + ${fmt(taxMonthly)}/mes`} />}
        </div>
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Total único</span>
            <span className="text-lg font-bold">{fmt(totalOneTime)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Total mensual</span>
            <span className={`text-lg font-bold ${totalMonthly > 0 ? "text-primary" : "text-muted-foreground"}`}>
              {totalMonthly > 0 ? fmt(totalMonthly) : "—"}
            </span>
          </div>
        </div>
        {paymentSchedule.installments.length > 1 && (
          <div className="border-t pt-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-3 w-3" /> Cronograma de pago
            </p>
            {installments.map((inst, i) => <SummaryLine key={i} label={inst.label} value={fmt(inst.amount)} />)}
          </div>
        )}
      </div>

      <div className="border rounded-xl p-4 space-y-2.5 bg-card">
        <div className="flex items-center gap-2.5 text-xs">
          <CalendarClock className="h-3.5 w-3.5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Tiempo estimado de entrega</p>
            <p className="text-muted-foreground">{rushDelivery ? "7 - 10 días hábiles (entrega prioritaria)" : "15 - 20 días hábiles"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <Clock3 className="h-3.5 w-3.5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Validez de la propuesta</p>
            <p className="text-muted-foreground">30 días</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Garantía</p>
            <p className="text-muted-foreground">30 días de soporte incluido</p>
          </div>
        </div>
      </div>

      <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Valor del cliente a 3 años</p>
        </div>
        <p className="text-2xl font-bold text-primary">{fmt(threeYearValue)}</p>
        <p className="text-xs text-muted-foreground">
          {fmt(totalOneTime)} setup + {fmt(totalMonthly)}/mes × 36 meses
          {renewalFee > 0 && ` + ${fmt(renewalFee)}/año renovación dominio/hosting (años 2–3)`} — un cliente
          retenido vale más que una venta única.
        </p>
      </div>

      <div className="border border-dashed rounded-xl p-4 space-y-2 bg-muted/10">
        <button
          onClick={() => setShowMargin((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground cursor-pointer"
        >
          <span className="flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" /> Detalle de margen (solo tú lo ves)</span>
          {showMargin ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showMargin && (
          <div className="space-y-2 pt-1">
            <SummaryLine label="Costo estimado (único)" value={fmt(marginCostOneTime)} muted />
            <SummaryLine label="Margen (único)" value={`${fmt(marginProfitOneTime)} (${marginPctOneTime}%)`} />
            {totalMonthly > 0 && (
              <>
                <SummaryLine label="Costo estimado (mensual)" value={fmt(marginCostMonthly)} muted />
                <SummaryLine label="Margen (mensual)" value={`${fmt(marginProfitMonthly)} (${marginPctMonthly}%)`} />
              </>
            )}
            <p className="text-[10px] text-muted-foreground italic">
              Estimación interna — nunca se incluye en la propuesta del cliente.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <CalculatorHeader
        proposalsCount={proposalsCount}
        monthTrendPct={monthTrendPct}
        contacts={contacts}
        contactId={contactId}
        onContactChange={(id) => { setContactId(id); setSavedProposalId(null); }}
        onSave={handleSaveProposal}
        saving={saving}
        canSave={buildMode !== "tiers" || !!baseTier}
        savedProposalId={savedProposalId}
        onShare={handleShare}
        sharing={sharing}
        onDownloadCsv={handleDownloadCsv}
      />

      <ModeToggle mode={buildMode} onChange={handleBuildModeChange} />

      <Stepper active={activeStep} onSelect={setActiveStep} />

      {buildMode === "tiers" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-4 items-start">
          <div className="space-y-6">
            {planSection}
            {modulosSection}
          </div>
          {personalizacionesSection}
          {resumenSection}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {planSection}
          {modulosSection}
          {personalizacionesSection}
          {resumenSection}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-muted-foreground border-t pt-4">
        <span className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Propuesta 100% personalizada para {selectedContact ? (selectedContact.company || selectedContact.name) : "tu cliente"}
        </span>
        {lastUpdated && (
          <span className="flex items-center gap-1.5">
            Última actualización: {lastUpdated.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}, {lastUpdated.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
        )}
      </div>
    </div>
  );
}
