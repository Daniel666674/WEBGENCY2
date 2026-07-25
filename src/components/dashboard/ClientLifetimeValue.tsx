import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";

interface ClientLifetimeValueProps {
  avgSetupFee: number;
  avgMonthlyFee: number;
  months: number;
}

export function ClientLifetimeValue({ avgSetupFee, avgMonthlyFee, months }: ClientLifetimeValueProps) {
  const total = avgSetupFee + avgMonthlyFee * months;
  const years = Math.round(months / 12);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardContent className="flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/15 p-3 shrink-0">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Valor del cliente a {years} años
            </p>
            <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(total)}</p>
            <p className="text-xs text-muted-foreground mt-2 max-w-xl">
              {formatCurrency(avgSetupFee)} setup promedio + {formatCurrency(avgMonthlyFee)}/mes ×{" "}
              {months} meses — un cliente retenido vale más que una venta única.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
