"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/constants";
import { FileText, DollarSign } from "lucide-react";

interface Proposal {
  id: string;
  contactId: string;
  planName: string;
  oneTimeFee: number;
  monthlyFee: number;
  features: string[];
  addOns: string[];
  automations: string[];
  deliverables: string[];
  notes: string | null;
  createdAt: string | number;
}

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/proposals").then((r) => r.json()), new Promise((r) => setTimeout(r, 700))])
      .then(([data]) => {
        setProposals(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalOneTime = proposals.reduce((s, p) => s + p.oneTimeFee, 0);
  const totalMonthly = proposals.reduce((s, p) => s + p.monthlyFee, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Propuestas</h1>
        <p className="text-muted-foreground">Todas las propuestas enviadas a clientes</p>
      </div>

      {loading ? (
        <DogSpinnerPage label="Cargando propuestas..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Total Propuestas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{proposals.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Setup Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalOneTime)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> MRR Potencial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(totalMonthly)}</div>
              </CardContent>
            </Card>
          </div>

          {proposals.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-sm text-muted-foreground text-center">
                  No hay propuestas. Crea una desde el detalle de un contacto.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => (
                <Card key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/contacts/${p.contactId}`)}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{p.planName}</p>
                          <Badge variant="outline">{p.features.length} features</Badge>
                          {p.addOns.length > 0 && (
                            <Badge variant="secondary">{p.addOns.length} add-ons</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Creada {formatDate(p.createdAt as number)}
                          {p.notes && ` — ${p.notes.slice(0, 60)}...`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(p.oneTimeFee)}</p>
                        <p className="text-xs text-muted-foreground">
                          + {formatCurrency(p.monthlyFee)}/mes
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
