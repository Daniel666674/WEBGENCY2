"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DogSpinnerPage } from "@/components/shared/DogSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, CLIENT_STATUS_CONFIG } from "@/lib/constants";
import { UserCheck, DollarSign, Calendar } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatTile } from "@/components/shared/StatTile";
import type { ClientStatus } from "@/types";

interface Client {
  id: string;
  name: string;
  company: string | null;
  monthlyPayment: number | null;
  signedDate: number | Date | null;
  nextPaymentDate: number | Date | null;
  clientStatus: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/revenue").then((r) => r.json()), new Promise((r) => setTimeout(r, 1800))])
      .then(([data]) => {
        setClients(data.activeClients || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const mrr = clients.reduce((s, c) => s + (c.monthlyPayment || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes Activos</h1>
        <p className="text-muted-foreground">Gestion de cuentas y pagos recurrentes</p>
      </div>

      {loading ? (
        <DogSpinnerPage label="Cargando clientes..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile icon={UserCheck} label="Clientes Activos" value={clients.length} color="green" />
            <StatTile icon={DollarSign} label="MRR" value={formatCurrency(mrr)} color="primary" highlight />
            <StatTile icon={Calendar} label="ARR" value={formatCurrency(mrr * 12)} color="purple" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Todos los Clientes Activos</CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="Sin clientes activos"
                  description='Cambia el status de un contacto a "Cliente activo" para verlo aqui.'
                />
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Pago Mensual</TableHead>
                        <TableHead className="hidden md:table-cell">Fecha Firma</TableHead>
                        <TableHead className="hidden md:table-cell">Proximo Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow
                          key={client.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/contacts/${client.id}`)}
                        >
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.company || "—"}</TableCell>
                          <TableCell className="font-semibold text-primary">
                            {client.monthlyPayment ? formatCurrency(client.monthlyPayment) : "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {client.signedDate ? formatDate(client.signedDate) : "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {client.nextPaymentDate ? formatDate(client.nextPaymentDate) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
