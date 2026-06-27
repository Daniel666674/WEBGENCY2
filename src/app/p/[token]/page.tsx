"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package, Zap, FileText } from "lucide-react";

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
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <Image src="/logo.svg" alt="OLIWAN" width={64} height={64} className="rounded-xl mb-4 opacity-40" />
        <p className="text-gray-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Image
          src="/spinner-1.svg"
          alt="Cargando..."
          width={72}
          height={72}
          className="animate-spin"
          style={{ animationDuration: "1.4s", animationTimingFunction: "linear" }}
        />
        <p className="text-sm text-gray-400">Cargando propuesta...</p>
      </div>
    );
  }

  const clientName = data.contact?.company || data.contact?.name || "Cliente";
  const hasMonthly = data.monthlyFee > 0;
  const hasOneTime = data.oneTimeFee > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Image src="/logo.svg" alt="OLIWAN" width={18} height={18} className="rounded-sm" />
            OLIWAN Agency
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Propuesta para {clientName}</h1>
          <p className="text-gray-500">Plan: {data.planName}</p>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {hasOneTime && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Inversión inicial</p>
                <p className="text-4xl font-bold text-gray-900">{formatCurrency(data.oneTimeFee)}</p>
                <p className="text-xs text-gray-400 mt-1">COP · pago único</p>
              </div>
            )}
            {hasOneTime && hasMonthly && (
              <div className="hidden sm:block w-px h-16 bg-gray-200" />
            )}
            {hasMonthly && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Mantenimiento mensual</p>
                <p className="text-4xl font-bold text-blue-600">{formatCurrency(data.monthlyFee)}</p>
                <p className="text-xs text-gray-400 mt-1">COP · por mes</p>
              </div>
            )}
          </div>
        </div>

        {/* Content sections */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          <Section
            title="Incluido en tu plan"
            icon={CheckCircle2}
            items={data.features}
            color="text-gray-700"
          />
          <Section
            title="Add-ons"
            icon={Package}
            items={data.addOns}
            color="text-blue-700"
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
            color="text-purple-700"
          />
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">Notas adicionales</p>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="text-xs">Propuesta personalizada</Badge>
          <Badge variant="outline" className="text-xs">Válida por 30 días</Badge>
          {data.contact?.email && (
            <Badge variant="outline" className="text-xs">{data.contact.email}</Badge>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-8">
          Generado por OLIWAN Agency · {new Date(data.createdAt).toLocaleDateString("es-CO", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
