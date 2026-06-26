"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/constants";
import { Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  amountCents: number;
  paidAt: Date | number | null;
  note: string | null;
  projectName: string | null;
}

export function PaymentHistory({ clientId }: { clientId: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/payments?clientId=${clientId}`);
    setPayments(await res.json());
  }

  useEffect(() => { load(); }, [clientId]);

  async function addPayment() {
    const cents = Math.round(parseFloat(amount.replace(/,/g, "")) * 100);
    if (!cents || isNaN(cents)) { toast.error("Monto invalido"); return; }
    setSaving(true);
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, amountCents: cents, paidAt: new Date().toISOString(), note }),
      });
      setAmount(""); setNote(""); setShowForm(false);
      toast.success("Pago registrado");
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const total = payments.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total recibido</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(total)}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Registrar pago
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <input
            type="number"
            placeholder="Monto (COP)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-sm border rounded-md px-3 py-1.5 bg-background"
          />
          <input
            type="text"
            placeholder="Nota opcional..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-sm border rounded-md px-3 py-1.5 bg-background"
          />
          <div className="flex gap-2">
            <button
              onClick={addPayment}
              disabled={saving}
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              Guardar
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded-md text-sm text-muted-foreground">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {payments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados</p>
        )}
        {payments.map((p) => {
          const date = p.paidAt ? new Date(p.paidAt) : null;
          return (
            <div key={p.id} className="flex items-center gap-3 p-2.5 border rounded-lg text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{formatCurrency(p.amountCents)}</p>
                {p.note && <p className="text-xs text-muted-foreground truncate">{p.note}</p>}
              </div>
              {date && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {date.toLocaleDateString("es-CO", { month: "short", day: "numeric", year: "2-digit" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
