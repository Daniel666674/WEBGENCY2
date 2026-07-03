"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Package, Zap, FileText, Wallet, CalendarClock,
  TrendingUp, Sparkles, AlertTriangle,
} from "lucide-react";

interface Installment {
  label: string;
  amount: number;
}

interface PricingMeta {
  termMonths?: number;
  termName?: string;
  termDiscountPct?: number;
  paymentScheduleName?: string;
  paymentScheduleDiscountPct?: number;
  installments?: Installment[];
  taxIncluded?: boolean;
  taxRate?: number;
  taxOneTime?: number;
  taxMonthly?: number;
  rushDelivery?: boolean;
  renewalFee?: number;
  renewalYears?: number;
  threeYearValue?: number;
}

interface ProposalData {
  id: string;
  planName: string;
  oneTimeFee: number;
  monthlyFee: number;
  features: string[];
  addOns: string[];
  automations: string[];
  deliverables: string[];
  notes: string | null;
  pricingMeta: PricingMeta;
  validUntil: string | number | null;
  createdAt: string | number;
  viewedAt: string | number | null;
  contact: { name: string; company: string | null; email: string | null } | null;
}

function Section({
  title,
  icon: Icon,
  items,
  color,
}: {
  title: string;
  icon: typeof Package;
  items: string[];
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${color}`}>
        <Icon className="h-4 w-4" /> {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
            <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<ProposalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/p/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Propuesta no encontrada");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7ef] px-4">
        <Image src="/logo.png" alt="OLIWAN" width={64} height={64} className="rounded-xl mb-4 opacity-40" />
        <p className="text-stone-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7ef] gap-4">
        <Image
          src="/spinner-1.png"
          alt="Cargando..."
          width={72}
          height={72}
          className="animate-spin"
          style={{ animationDuration: "1.4s", animationTimingFunction: "linear" }}
        />
        <p className="text-sm text-stone-400">Cargando propuesta...</p>
      </div>
    );
  }

  const clientName = data.contact?.company || data.contact?.name || "Cliente";
  const hasMonthly = data.monthlyFee > 0;
  const hasOneTime = data.oneTimeFee > 0;
  const meta = data.pricingMeta || {};
  const hasInstallments = (meta.installments?.length ?? 0) > 1;

  const validUntilDate = data.validUntil ? new Date(data.validUntil) : null;
  const daysLeft = validUntilDate ? Math.ceil((validUntilDate.getTime() - Date.now()) / 86400000) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  return (
    <div className="min-h-screen bg-[#faf7ef]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a3a35] via-[#194842] to-[#0d9a8a] px-4 py-14">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-2">
            <Image src="/logo.png" alt="OLIWAN" width={18} height={18} className="rounded-sm" />
            OLIWAN Agency
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Propuesta para {clientName}</h1>
          <p className="text-teal-100/80">Plan: {data.planName}</p>
          {meta.rushDelivery && (
            <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-300/40 text-amber-200 text-xs font-semibold px-3 py-1 rounded-full">
              <Sparkles className="h-3 w-3" /> Entrega prioritaria incluida
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6 px-4 -mt-8 pb-12">

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-stone-100 p-8">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {hasOneTime && (
              <div className="text-center">
                <p className="text-sm text-stone-500 mb-1">Inversión inicial</p>
                <p className="text-4xl font-bold text-stone-900">{formatCurrency(data.oneTimeFee)}</p>
                <p className="text-xs text-stone-400 mt-1">
                  COP · pago único{meta.taxIncluded ? " · IVA incluido" : ""}
                </p>
              </div>
            )}
            {hasOneTime && hasMonthly && (
              <div className="hidden sm:block w-px h-16 bg-stone-200" />
            )}
            {hasMonthly && (
              <div className="text-center">
                <p className="text-sm text-stone-500 mb-1">Mantenimiento mensual</p>
                <p className="text-4xl font-bold text-teal-600">{formatCurrency(data.monthlyFee)}</p>
                <p className="text-xs text-stone-400 mt-1">
                  COP · por mes{meta.taxIncluded ? " · IVA incluido" : ""}
                </p>
              </div>
            )}
          </div>

          {(meta.termName || meta.paymentScheduleName) && (
            <div className="flex flex-wrap gap-2 justify-center mt-6 pt-6 border-t border-stone-100">
              {meta.termName && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Permanencia: {meta.termName}
                  {!!meta.termDiscountPct && ` (-${meta.termDiscountPct}% mensual)`}
                </span>
              )}
              {meta.paymentScheduleName && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full">
                  <Wallet className="h-3.5 w-3.5" />
                  Pago: {meta.paymentScheduleName}
                  {!!meta.paymentScheduleDiscountPct && ` (-${meta.paymentScheduleDiscountPct}%)`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Payment schedule */}
        {hasInstallments && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-stone-700 mb-4">
              <Wallet className="h-4 w-4 text-teal-600" /> Cronograma de pago
            </h3>
            <ul className="space-y-2.5">
              {meta.installments!.map((inst, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">{inst.label}</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(inst.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3-year value */}
        {typeof meta.threeYearValue === "number" && meta.threeYearValue > data.oneTimeFee && (
          <div className="bg-teal-50/60 border border-teal-200/60 rounded-2xl p-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-teal-700">
              <TrendingUp className="h-4 w-4" />
              <p className="text-sm font-semibold">Valor de esta alianza a 3 años</p>
            </div>
            <p className="text-3xl font-bold text-teal-700">{formatCurrency(meta.threeYearValue)}</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              No es solo un proyecto — es una relación de largo plazo. Este número refleja lo que construimos
              juntos en 3 años, no solo la inversión inicial.
            </p>
          </div>
        )}

        {/* Content sections */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 space-y-8">
          <Section
            title="Incluido en tu plan"
            icon={CheckCircle2}
            items={data.features}
            color="text-teal-700"
          />
          <Section
            title="Add-ons"
            icon={Package}
            items={data.addOns}
            color="text-stone-700"
          />
          <Section
            title="Automatizaciones"
            icon={Zap}
            items={data.automations}
            color="text-amber-700"
          />
          <Section
            title="Entregables"
            icon={FileText}
            items={data.deliverables}
            color="text-stone-700"
          />
        </div>

        {/* Renewal note */}
        {!!meta.renewalFee && (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-sm text-stone-600">
            A partir del año 2 se renueva el dominio y hosting: {formatCurrency(meta.renewalFee)}/año.
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">Notas adicionales</p>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Validity */}
        {isExpired ? (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Esta propuesta venció el{" "}
              {validUntilDate!.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
              . Contáctanos para una actualización.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="text-xs">Propuesta personalizada</Badge>
            <Badge variant="outline" className="text-xs">
              {validUntilDate
                ? `Válida hasta ${validUntilDate.toLocaleDateString("es-CO", { month: "long", day: "numeric" })} (${daysLeft} días)`
                : "Válida por 30 días"}
            </Badge>
            {data.contact?.email && (
              <Badge variant="outline" className="text-xs">{data.contact.email}</Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 pb-4">
          Generado por OLIWAN Agency · {new Date(data.createdAt).toLocaleDateString("es-CO", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
