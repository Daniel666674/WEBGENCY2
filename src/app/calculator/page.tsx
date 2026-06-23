"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { AGENCY_PLANS } from "@/lib/catalog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, DollarSign, TrendingUp, Calendar } from "lucide-react";

export default function CalculatorPage() {
  const [numClients, setNumClients] = useState(5);
  const [selectedPlan, setSelectedPlan] = useState("Estandar");
  const [customSetup, setCustomSetup] = useState("");
  const [customMonthly, setCustomMonthly] = useState("");

  const plan = AGENCY_PLANS.find((p) => p.name === selectedPlan);
  const setupFee = customSetup ? parseFloat(customSetup) * 100 : plan?.oneTimeFee || 0;
  const monthlyFee = customMonthly ? parseFloat(customMonthly) * 100 : plan?.monthlyFee || 0;

  const totalSetup = setupFee * numClients;
  const mrr = monthlyFee * numClients;
  const arr = mrr * 12;

  const months3 = totalSetup + mrr * 3;
  const months6 = totalSetup + mrr * 6;
  const months12 = totalSetup + mrr * 12;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calculadora de Revenue</h1>
        <p className="text-muted-foreground">Proyecta ingresos segun tu plan y numero de clientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Configuracion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Plan base</Label>
              <Select value={selectedPlan} onValueChange={(v) => { if (v) { setSelectedPlan(v); setCustomSetup(""); setCustomMonthly(""); } }}>
                <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGENCY_PLANS.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {plan && (
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Numero de clientes</Label>
              <Input
                type="number"
                value={numClients}
                onChange={(e) => setNumClients(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Setup fee por cliente (COP)</Label>
              <Input
                type="number"
                placeholder={plan ? String(plan.oneTimeFee / 100) : "0"}
                value={customSetup}
                onChange={(e) => setCustomSetup(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(setupFee)} por cliente
              </p>
            </div>

            <div className="space-y-2">
              <Label>Mensualidad por cliente (COP)</Label>
              <Input
                type="number"
                placeholder={plan ? String(plan.monthlyFee / 100) : "0"}
                value={customMonthly}
                onChange={(e) => setCustomMonthly(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(monthlyFee)} por cliente/mes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Setup Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(totalSetup)}</div>
                <p className="text-xs text-muted-foreground">{numClients} clientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-primary">{formatCurrency(mrr)}</div>
                <p className="text-xs text-muted-foreground">Ingreso mensual</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">ARR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(arr)}</div>
                <p className="text-xs text-muted-foreground">Ingreso anual</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Avg Revenue/Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(monthlyFee)}</div>
                <p className="text-xs text-muted-foreground">Por mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Proyecciones de Ingreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "3 meses", value: months3, months: 3 },
                  { label: "6 meses", value: months6, months: 6 },
                  { label: "12 meses", value: months12, months: 12 },
                ].map((proj) => (
                  <div key={proj.label} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{proj.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Setup + {proj.months} meses de recurrencia
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-primary">{formatCurrency(proj.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan features */}
          {plan && plan.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Incluido en {plan.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {plan.features.map((f) => (
                    <Badge key={f} variant="secondary">{f}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
