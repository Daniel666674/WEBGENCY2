// Cotizador de terminal — misma logica de precios que /calculator (src/app/(app)/calculator/page.tsx),
// para que el comando /quote pueda calcular una cotizacion exacta sin ANTHROPIC_API_KEY.
//
// Uso:
//   npx tsx scripts/quote.ts <archivo-input.json>
//   npx tsx scripts/quote.ts - < input.json   (leer desde stdin)
//
// Imprime un JSON con el desglose completo y los campos listos para
// POST /api/proposals (mismo shape que handleSaveProposal en la calculadora).

import { readFileSync } from "fs";
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
  CUSTOM_FOUNDATION,
  CUSTOM_PAGE_ADDON,
  getAgencySuggestions,
  type Track,
} from "@/lib/catalog";

const SCRATCH_ID = "scratch";

interface QuoteInput {
  buildMode?: "tiers" | "custom";
  track?: Track;
  baseTierId?: string; // tier id, or "scratch" when buildMode === "custom"
  pageQty?: number; // solo si baseTierId === "scratch"
  addOns?: { id: string; qty?: number }[];
  maintenanceId?: string | null;
  communityManagerId?: string | null;
  termId?: string; // default: term_mensual
  paymentScheduleId?: string; // default: pago_50_50
  taxIncluded?: boolean;
  rushDelivery?: boolean;
  ownsDomain?: boolean;
  discountPct?: number;
  clientNotes?: string;
  industry?: string; // texto libre para sugerencias (rubro, notas del lead)
}

function fmt(cents: number) {
  return formatCurrency(cents);
}

function readInput(): QuoteInput {
  const arg = process.argv[2];
  if (!arg || arg === "-") {
    const raw = readFileSync(0, "utf-8");
    return JSON.parse(raw || "{}");
  }
  return JSON.parse(readFileSync(arg, "utf-8"));
}

function fail(msg: string): never {
  console.error(JSON.stringify({ error: msg }));
  process.exit(1);
}

const input = readInput();

const buildMode = input.buildMode ?? "tiers";
const track: Track = input.track ?? "website";
const isScratch = buildMode === "custom" && input.baseTierId === SCRATCH_ID;

let baseTier = isScratch ? undefined : BASE_TIERS.find((t) => t.id === input.baseTierId);
if (!isScratch && !baseTier) {
  fail(
    `baseTierId invalido: "${input.baseTierId ?? ""}". Opciones: ${BASE_TIERS.map((t) => t.id).join(", ")}, o "scratch" (con buildMode: "custom")`
  );
}

const pageQty = isScratch ? Math.max(0, input.pageQty ?? 0) : 0;

const requestedAddOns = input.addOns ?? [];
const selectedAddonObjects = requestedAddOns
  .map((a) => {
    const mod = ADDON_MODULES.find((m) => m.id === a.id);
    if (!mod) fail(`addon invalido: "${a.id}". Opciones: ${ADDON_MODULES.map((m) => m.id).join(", ")}`);
    return { mod: mod!, qty: Math.max(1, a.qty ?? 1) };
  })
  .filter((a) => a.qty > 0);

const maintenanceTier = input.maintenanceId
  ? MAINTENANCE_TIERS.find((t) => t.id === input.maintenanceId)
  : undefined;
if (input.maintenanceId && !maintenanceTier) {
  fail(`maintenanceId invalido: "${input.maintenanceId}". Opciones: ${MAINTENANCE_TIERS.map((t) => t.id).join(", ")}`);
}

const communityManagerTier = input.communityManagerId
  ? COMMUNITY_MANAGER_TIERS.find((t) => t.id === input.communityManagerId)
  : undefined;
if (input.communityManagerId && !communityManagerTier) {
  fail(`communityManagerId invalido: "${input.communityManagerId}". Opciones: ${COMMUNITY_MANAGER_TIERS.map((t) => t.id).join(", ")}`);
}
const communityManagerFee = communityManagerTier
  ? Math.round((communityManagerTier.monthlyFeeMin + communityManagerTier.monthlyFeeMax) / 2)
  : 0;

const term = CONTRACT_TERMS.find((t) => t.id === (input.termId ?? "term_mensual")) ?? CONTRACT_TERMS[0];
if (input.termId && !CONTRACT_TERMS.some((t) => t.id === input.termId)) {
  fail(`termId invalido: "${input.termId}". Opciones: ${CONTRACT_TERMS.map((t) => t.id).join(", ")}`);
}

const paymentSchedule =
  PAYMENT_SCHEDULES.find((p) => p.id === (input.paymentScheduleId ?? "pago_50_50")) ?? PAYMENT_SCHEDULES[1];
if (input.paymentScheduleId && !PAYMENT_SCHEDULES.some((p) => p.id === input.paymentScheduleId)) {
  fail(`paymentScheduleId invalido: "${input.paymentScheduleId}". Opciones: ${PAYMENT_SCHEDULES.map((p) => p.id).join(", ")}`);
}

const taxIncluded = !!input.taxIncluded;
const rushDelivery = !!input.rushDelivery;
const ownsDomain = !!input.ownsDomain;
const discountPct = Math.max(0, Math.min(100, input.discountPct ?? 0));
const clientNotes = (input.clientNotes ?? "").trim();

const hasWebsiteComponent = buildMode === "custom" || (buildMode === "tiers" && track === "website");

const addonsOneTime = selectedAddonObjects.reduce((s, { mod, qty }) => s + mod.oneTimeFee * qty, 0);
const addonsMonthly = selectedAddonObjects.reduce((s, { mod, qty }) => s + (mod.monthlyFee ?? 0) * qty, 0);

const baseOneTime = isScratch
  ? CUSTOM_FOUNDATION.oneTimeFee + pageQty * CUSTOM_PAGE_ADDON.oneTimeFee
  : baseTier?.oneTimeFee ?? 0;

// ── Cadena de pago unico: recargo por prioridad → descuento por forma de pago → descuento discrecional → IVA ──
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

// ── Cadena mensual: descuento por permanencia → descuento discrecional → IVA ──
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

const installments = (() => {
  const pcts = paymentSchedule.installments;
  const amounts = pcts.map((inst) => Math.round(totalOneTime * (inst.pct / 100)));
  const sum = amounts.reduce((s, a) => s + a, 0);
  if (amounts.length > 0) amounts[amounts.length - 1] += totalOneTime - sum;
  return pcts.map((inst, i) => ({ label: inst.label, amount: amounts[i], amountFmt: fmt(amounts[i]) }));
})();

// ── Campos listos para POST /api/proposals — mismo formato que handleSaveProposal en la calculadora ──
const features = isScratch
  ? [
      CUSTOM_FOUNDATION.name,
      ...(pageQty > 0 ? [`${pageQty} página${pageQty !== 1 ? "s" : ""} adicional${pageQty !== 1 ? "es" : ""}`] : []),
    ]
  : [...(baseTier?.features ?? [])];

const addOnsFormatted = selectedAddonObjects.map(({ mod, qty }) => {
  const qtyLabel = mod.unit && qty > 1 ? ` x${qty}` : "";
  const oneTime = mod.oneTimeFee * qty;
  const monthly = (mod.monthlyFee ?? 0) * qty;
  if (oneTime > 0 && monthly > 0) return `${mod.name}${qtyLabel} — ${fmt(oneTime)} + ${fmt(monthly)}/mes`;
  if (monthly > 0) return `${mod.name}${qtyLabel} — ${fmt(monthly)}/mes`;
  return `${mod.name}${qtyLabel} — ${fmt(oneTime)}`;
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
    ? track === "website"
      ? "Sitio Web (por plan)"
      : "Sistema a Medida"
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
  clientNotes,
  `Cotización generada con /quote (terminal) — ${modeLabel}. ${extras.join(". ")}. Valor total a 3 años: ${fmt(threeYearValue)}.`,
]
  .filter(Boolean)
  .join("\n\n");

const pricingMeta = {
  termMonths: term.months,
  termName: term.name,
  termDiscountPct: term.discountPct,
  paymentScheduleId: paymentSchedule.id,
  paymentScheduleName: paymentSchedule.name,
  paymentScheduleDiscountPct: paymentSchedule.discountPct ?? 0,
  installments: installments.map(({ label, amount }) => ({ label, amount })),
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

const suggestions = getAgencySuggestions({
  industry: input.industry,
  notes: clientNotes,
  currentPlan: baseTier?.name,
});

const output = {
  resumen: {
    plan: isScratch ? "Sitio Personalizado" : baseTier!.name,
    modo: modeLabel,
    baseOneTime: { cents: baseOneTime, fmt: fmt(baseOneTime) },
    addonsOneTime: { cents: addonsOneTime, fmt: fmt(addonsOneTime) },
    addonsMonthly: { cents: addonsMonthly, fmt: fmt(addonsMonthly) },
    rushFee: { cents: rushFee, fmt: fmt(rushFee) },
    scheduleDiscount: { cents: scheduleDiscount, fmt: fmt(scheduleDiscount) },
    manualDiscountOneTime: { cents: manualDiscountOneTime, fmt: fmt(manualDiscountOneTime) },
    taxOneTime: { cents: taxOneTime, fmt: fmt(taxOneTime) },
    totalOneTime: { cents: totalOneTime, fmt: fmt(totalOneTime) },
    maintenanceMonthly: { cents: maintenanceTier?.monthlyFee ?? 0, fmt: fmt(maintenanceTier?.monthlyFee ?? 0) },
    communityManagerMonthly: { cents: communityManagerFee, fmt: fmt(communityManagerFee) },
    termDiscount: { cents: termDiscount, fmt: fmt(termDiscount) },
    manualDiscountMonthly: { cents: manualDiscountMonthly, fmt: fmt(manualDiscountMonthly) },
    taxMonthly: { cents: taxMonthly, fmt: fmt(taxMonthly) },
    totalMonthly: { cents: totalMonthly, fmt: fmt(totalMonthly) },
    renewalFee: { cents: renewalFee, fmt: fmt(renewalFee) },
    threeYearValue: { cents: threeYearValue, fmt: fmt(threeYearValue) },
    installments,
  },
  suggestions,
  // Body listo para: curl -X POST http://localhost:3000/api/proposals -d '<proposalPayload>'
  // (agregar "contactId" antes de enviarlo)
  proposalPayload: {
    planName: isScratch ? "Sitio Personalizado" : baseTier!.name,
    oneTimeFee: totalOneTime,
    monthlyFee: totalMonthly,
    features,
    addOns: addOnsFormatted,
    automations: [],
    deliverables,
    notes,
    pricingMeta,
  },
};

console.log(JSON.stringify(output, null, 2));
