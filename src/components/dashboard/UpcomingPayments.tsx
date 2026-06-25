"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";

interface PaymentItem {
  id: string;
  name: string;
  company: string | null;
  monthlyPayment: number;
  nextPaymentDate: number;
  daysUntil: number;
}

interface UpcomingPaymentsProps {
  payments: PaymentItem[];
  totalThisMonth: number;
}

export function UpcomingPayments({ payments, totalThisMonth }: UpcomingPaymentsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Cobros Próximos
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Este mes:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(totalThisMonth)}
          </span>
        </p>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay cobros programados
          </p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const isOverdue = p.daysUntil < 0;
              const isUrgent = p.daysUntil >= 0 && p.daysUntil <= 3;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors
                    ${isOverdue ? "border-red-200 bg-red-50/50" : isUrgent ? "border-amber-200 bg-amber-50/50" : "border-border"}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOverdue ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    ) : (
                      <div className={`h-2 w-2 rounded-full shrink-0 ${isUrgent ? "bg-amber-500" : "bg-green-500"}`} />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isOverdue
                          ? `Vencido hace ${Math.abs(p.daysUntil)} días`
                          : p.daysUntil === 0
                          ? "Hoy"
                          : `En ${p.daysUntil} días`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(p.monthlyPayment)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(p.nextPaymentDate)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
