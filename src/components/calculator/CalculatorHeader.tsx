"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calculator, ChevronDown, FileText, TrendingUp, Check, Share2, Download } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  company: string | null;
}

interface CalculatorHeaderProps {
  proposalsCount: number;
  monthTrendPct: number | null;
  contacts: Contact[];
  contactId: string;
  onContactChange: (id: string) => void;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
  savedProposalId: string | null;
  onShare: () => void;
  sharing: boolean;
  onDownloadCsv: () => void;
}

export function CalculatorHeader({
  proposalsCount, monthTrendPct, contacts, contactId, onContactChange,
  onSave, saving, canSave, savedProposalId, onShare, sharing, onDownloadCsv,
}: CalculatorHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calculadora de Propuestas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Construye la propuesta perfecta y mira el precio en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/proposals")} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-1.5" /> Ver propuestas guardadas
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button className="cursor-pointer">
                  <Calculator className="h-4 w-4 mr-1.5" /> Presentar propuesta <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                </Button>
              }
            />
            <PopoverContent align="end" className="w-72 space-y-3">
              <p className="text-sm font-semibold">Presentar propuesta</p>
              <select
                value={contactId}
                onChange={(e) => onContactChange(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background cursor-pointer"
              >
                <option value="">Selecciona un contacto...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.company ? `${c.company} — ${c.name}` : c.name}</option>
                ))}
              </select>

              {!savedProposalId ? (
                <Button onClick={onSave} disabled={saving || !canSave} className="w-full cursor-pointer">
                  {saving ? "Guardando..." : "Guardar propuesta"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Propuesta guardada
                  </p>
                  <Button variant="outline" onClick={onShare} disabled={sharing} className="w-full cursor-pointer">
                    <Share2 className="h-3.5 w-3.5 mr-1.5" /> {sharing ? "Generando..." : "Compartir enlace"}
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={onDownloadCsv} className="w-full cursor-pointer">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Descargar cotización (CSV)
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" />
          {proposalsCount} propuesta{proposalsCount !== 1 ? "s" : ""} guardada{proposalsCount !== 1 ? "s" : ""}
        </span>
        {monthTrendPct !== null && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="h-3 w-3" /> {monthTrendPct > 0 ? "+" : ""}{monthTrendPct}% este mes
          </span>
        )}
      </div>
    </div>
  );
}
