"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    fetch("/api/revenue")
      .then((r) => r.json())
      .then((data) => {
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Clientes Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> MRR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(mrr)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> ARR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(mrr * 12)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Todos los Clientes Activos</CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay clientes activos. Cambia el status de un contacto a &quot;Cliente activo&quot; para verlo aqui.
                </p>
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
