"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/constants";
import { WEBSITE_PLANS, CHATBOT_PLANS, MAINTENANCE_PLANS, EXTRAS_CATALOG } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import {
  Calculator, Globe, MessageCircle, Wrench, Star,
  Check, TrendingUp, Users, ChevronDown, ChevronUp, Gift,
} from "lucide-react";

type WebsiteId = "basico" | "estandar" | "avanzado" | "custom" | null;
type ChatbotId = "esencial" | "profesional" | "premium" | null;
type MaintenanceId = "soporte" | "remota" | "completa" | null;

function fmt(cents: number) { return formatCurrency(cents); }
function fmtRange(a: number, b?: number) {
  return b ? `${fmt(a)} – ${fmt(b)}` : fmt(a);
}

function PlanCard({
  selected, onClick, label, price, priceLabel, sub, features, accent,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  price: string;
  priceLabel?: string;
  sub?: string;
  features: string[];
  accent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-xl p-3.5 cursor-pointer transition-all select-none relative",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-primary/40 hover:bg-muted/20",
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
      {selected && features.length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? "Ocultar" : "Ver"} incluido
          </button>
          {open && (
            <ul className="mt-2 space-y-1">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge }: {
  icon: typeof Globe;
  title: string;
  badge?: string;
}) {
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

export default function CalculatorPage() {
  const [websiteId, setWebsiteId] = useState<WebsiteId>("estandar");
  const [chatbotId, setChatbotId] = useState<ChatbotId>(null);
  const [maintenanceId, setMaintenanceId] = useState<MaintenanceId>(null);
  const [extraPages, setExtraPages] = useState(0);
  const [extraUrgencias, setExtraUrgencias] = useState(0);
  const [numClients, setNumClients] = useState(3);
  const [customOneTime, setCustomOneTime] = useState("");

  const websitePlan = WEBSITE_PLANS.find((p) => p.id === websiteId);
  const chatbotPlan = CHATBOT_PLANS.find((p) => p.id === chatbotId);
  const maintenancePlan = MAINTENANCE_PLANS.find((p) => p.id === maintenanceId);

  // One-time fees
  const websiteOneTime = websiteId === "custom"
    ? (parseFloat(customOneTime) || 0) * 100
    : (websitePlan?.oneTimeFee ?? 0);
  const chatbotOneTime = chatbotPlan?.oneTimeFee ?? 0;
  const pagesOneTime = extraPages * EXTRAS_CATALOG[0].oneTimeFee;
  const urgenciasOneTime = extraUrgencias * EXTRAS_CATALOG[1].oneTimeFee;
  const totalOneTime = websiteOneTime + chatbotOneTime + pagesOneTime + urgenciasOneTime;

  // Monthly fees
  const chatbotMonthly = chatbotPlan?.monthlyFee ?? 0;
  const maintenanceMonthly = maintenancePlan?.monthlyFee ?? 0;
  const totalMonthly = chatbotMonthly + maintenanceMonthly;

  // Revenue projections (per client)
  const mrr = totalMonthly * numClients;
  const setupTotal = totalOneTime * numClients;

  const cortesia = websiteOneTime >= 250000000; // ≥ $2,500,000

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          Calculadora de Propuestas
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Construye el paquete, ve el precio total y proyecta tu revenue
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── Left: builder ── */}
        <div className="space-y-6">

          {/* 1. Website Plan */}
          <div className="space-y-3">
            <SectionHeader icon={Globe} title="Plan de Sitio Web" badge="Pago único" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEBSITE_PLANS.map((p) => (
                <PlanCard
                  key={p.id}
                  selected={websiteId === p.id}
                  onClick={() => setWebsiteId(p.id as WebsiteId)}
                  label={p.name}
                  price={fmt(p.oneTimeFee)}
                  features={p.features}
                  accent={p.id === "estandar"}
                />
              ))}
              <PlanCard
                selected={websiteId === "custom"}
                onClick={() => setWebsiteId("custom")}
                label="Custom"
                price={customOneTime ? fmt(parseFloat(customOneTime) * 100) : "A cotizar"}
                features={[]}
                sub="Precio personalizado"
              />
            </div>
            {websiteId === "custom" && (
              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">Precio único (COP)</label>
                  <input
                    type="number"
                    value={customOneTime}
                    onChange={(e) => setCustomOneTime(e.target.value)}
                    placeholder="Ej: 4000000"
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Chatbot */}
          <div className="space-y-3">
            <SectionHeader icon={MessageCircle} title="Chatbot WhatsApp" badge="Opcional · único + mensual" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <PlanCard
                selected={chatbotId === null}
                onClick={() => setChatbotId(null)}
                label="Sin chatbot"
                price="—"
                features={[]}
                sub="No incluir automatización"
              />
              {CHATBOT_PLANS.map((p) => (
                <PlanCard
                  key={p.id}
                  selected={chatbotId === p.id}
                  onClick={() => setChatbotId(p.id as ChatbotId)}
                  label={p.name}
                  price={`${fmt(p.oneTimeFee)} único`}
                  priceLabel={`+ ${fmt(p.monthlyFee)} / mes`}
                  features={p.features}
                />
              ))}
            </div>
          </div>

          {/* 3. Mantenimiento */}
          <div className="space-y-3">
            <SectionHeader icon={Wrench} title="Mantenimiento / Marketing" badge="Opcional · mensual" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <PlanCard
                selected={maintenanceId === null}
                onClick={() => setMaintenanceId(null)}
                label="Sin mantenimiento"
                price="—"
                features={[]}
                sub="El cliente gestiona solo"
              />
              {MAINTENANCE_PLANS.map((p) => (
                <PlanCard
                  key={p.id}
                  selected={maintenanceId === p.id}
                  onClick={() => setMaintenanceId(p.id as MaintenanceId)}
                  label={p.name}
                  price={fmtRange(p.monthlyFee, p.monthlyFeeMax)}
                  priceLabel="/ mes"
                  features={p.features}
                />
              ))}
            </div>
          </div>

          {/* 4. Extras */}
          <div className="space-y-3">
            <SectionHeader icon={Star} title="Extras" badge="Fuera del plan" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border rounded-xl p-3.5 space-y-2">
                <p className="text-sm font-medium">Páginas adicionales</p>
                <p className="text-xs text-muted-foreground">$150.000 c/u según complejidad</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExtraPages(Math.max(0, extraPages - 1))}
                    className="w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center hover:bg-muted"
                  >–</button>
                  <span className="text-sm font-semibold w-6 text-center">{extraPages}</span>
                  <button
                    onClick={() => setExtraPages(extraPages + 1)}
                    className="w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center hover:bg-muted"
                  >+</button>
                  {extraPages > 0 && (
                    <span className="text-xs text-primary font-medium">{fmt(pagesOneTime)}</span>
                  )}
                </div>
              </div>
              <div className="border rounded-xl p-3.5 space-y-2">
                <p className="text-sm font-medium">Urgencias fuera de horario</p>
                <p className="text-xs text-muted-foreground">$60.000 / intervención</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExtraUrgencias(Math.max(0, extraUrgencias - 1))}
                    className="w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center hover:bg-muted"
                  >–</button>
                  <span className="text-sm font-semibold w-6 text-center">{extraUrgencias}</span>
                  <button
                    onClick={() => setExtraUrgencias(extraUrgencias + 1)}
                    className="w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center hover:bg-muted"
                  >+</button>
                  {extraUrgencias > 0 && (
                    <span className="text-xs text-primary font-medium">{fmt(urgenciasOneTime)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cortesía */}
          {cortesia && (
            <div className="border border-amber-300 bg-amber-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                <Gift className="h-4 w-4" />
                Cortesía exclusiva incluida
              </p>
              <ul className="space-y-1.5 text-xs text-amber-700">
                <li className="flex items-start gap-1.5">
                  <Check className="h-3 w-3 mt-0.5 shrink-0" />
                  Campaña WhatsApp de reactivación (hasta 100 clientes)
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3 w-3 mt-0.5 shrink-0" />
                  Campaña de venta cruzada por familia / categoría
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="h-3 w-3 mt-0.5 shrink-0" />
                  Sets y combos estratégicos con copy y visual
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* ── Right: summary + projections ── */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Package summary */}
          <div className="border rounded-xl p-4 space-y-3 bg-card">
            <p className="text-sm font-semibold">Resumen del paquete</p>

            <div className="space-y-1.5">
              {websiteId && (
                <SummaryLine
                  label={websiteId === "custom" ? "Sitio custom" : `Sitio ${websitePlan?.name}`}
                  value={websiteOneTime > 0 ? fmt(websiteOneTime) : "—"}
                  sub="Pago único"
                />
              )}
              {chatbotPlan && (
                <>
                  <SummaryLine label={`Chatbot ${chatbotPlan.name}`} value={fmt(chatbotOneTime)} sub="Único" />
                  <SummaryLine label="" value={fmt(chatbotMonthly)} sub="/mes" muted />
                </>
              )}
              {maintenancePlan && (
                <SummaryLine
                  label={maintenancePlan.name}
                  value={fmtRange(maintenancePlan.monthlyFee, maintenancePlan.monthlyFeeMax)}
                  sub="/mes"
                />
              )}
              {extraPages > 0 && (
                <SummaryLine label={`${extraPages} página${extraPages > 1 ? "s" : ""} adicional${extraPages > 1 ? "es" : ""}`} value={fmt(pagesOneTime)} sub="Único" />
              )}
              {extraUrgencias > 0 && (
                <SummaryLine label={`${extraUrgencias} urgencia${extraUrgencias > 1 ? "s" : ""}`} value={fmt(urgenciasOneTime)} sub="Único" />
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

          {/* Revenue projector */}
          <div className="border rounded-xl p-4 space-y-4 bg-card">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Proyección de Revenue</p>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="number"
                value={numClients}
                min={1}
                onChange={(e) => setNumClients(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-sm border rounded-lg px-2 py-1.5 bg-background text-center font-semibold"
              />
              <span className="text-xs text-muted-foreground">clientes con este paquete</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Setup total</span>
                <span className="font-semibold">{fmt(setupTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">MRR</span>
                <span className="font-semibold text-primary">{mrr > 0 ? fmt(mrr) : "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ARR</span>
                <span className="font-semibold">{mrr > 0 ? fmt(mrr * 12) : "—"}</span>
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              {[
                { label: "3 meses", value: setupTotal + mrr * 3 },
                { label: "6 meses", value: setupTotal + mrr * 6 },
                { label: "12 meses", value: setupTotal + mrr * 12 },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold text-primary">{fmt(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryLine({
  label, value, sub, muted,
}: {
  label: string;
  value: string;
  sub?: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-2", muted && "opacity-60")}>
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      <span className="text-xs font-semibold shrink-0">
        {value}
        {sub && <span className="text-muted-foreground font-normal ml-0.5">{sub}</span>}
      </span>
    </div>
  );
}
