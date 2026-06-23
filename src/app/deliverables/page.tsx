"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/constants";
import { Package, Check, Clock } from "lucide-react";

interface Proposal {
  id: string;
  contactId: string;
  planName: string;
  deliverables: string[];
  createdAt: string | number;
}

export default function DeliverablesPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proposals")
      .then((r) => r.json())
      .then((data) => {
        setProposals(data.filter((p: Proposal) => p.deliverables.length > 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allDeliverables = proposals.flatMap((p) =>
    p.deliverables.map((d) => ({ text: d, proposalId: p.id, contactId: p.contactId, plan: p.planName }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entregables</h1>
        <p className="text-muted-foreground">Seguimiento de deliverables por propuesta</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> Total Entregables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allDeliverables.length}</div>
                <p className="text-xs text-muted-foreground">En {proposals.length} propuestas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Propuestas con Entregables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{proposals.length}</div>
              </CardContent>
            </Card>
          </div>

          {proposals.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-sm text-muted-foreground text-center">
                  No hay entregables. Agrega deliverables a las propuestas desde el detalle de un contacto.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((p) => (
                <Card key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/contacts/${p.contactId}`)}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{p.planName}</CardTitle>
                    <Badge variant="outline">{formatDate(p.createdAt as number)}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {p.deliverables.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-muted-foreground" />
                          <span>{d}</span>
                        </div>
                      ))}
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
