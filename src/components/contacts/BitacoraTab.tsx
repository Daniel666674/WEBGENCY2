"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/constants";
import type { DecisionLogEntry } from "@/types";

export function BitacoraTab({ contactId, initialLog }: { contactId: string; initialLog: DecisionLogEntry[] }) {
  const router = useRouter();
  const [log, setLog] = useState<DecisionLogEntry[]>(initialLog);
  const [saving, setSaving] = useState(false);
  const [decision, setDecision] = useState("");
  const [reasoning, setReasoning] = useState("");

  const persist = async (next: DecisionLogEntry[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionLog: next }),
      });
      if (!res.ok) throw new Error();
      setLog(next);
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!decision.trim()) {
      toast.error("La decision es requerida");
      return;
    }
    const entry: DecisionLogEntry = {
      date: new Date().toISOString().slice(0, 10),
      decision: decision.trim(),
      reasoning: reasoning.trim(),
    };
    persist([entry, ...log]).then(() => {
      toast.success("Decision registrada");
      setDecision("");
      setReasoning("");
    });
  };

  const handleDelete = (index: number) => {
    persist(log.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Registrar Decision
          </CardTitle>
          <p className="text-xs text-muted-foreground">Captura por que se tomo una decision de arquitectura — evita relitigar algo ya resuelto.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Decision</Label>
            <Input value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="Que se decidio" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Razonamiento</Label>
            <Textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="Por que se decidio asi, que alternativas se descartaron" className="mt-1" />
          </div>
          <Button onClick={handleAdd} disabled={saving} size="sm" className="cursor-pointer">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Guardando..." : "Agregar a la bitacora"}
          </Button>
        </CardContent>
      </Card>

      {log.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sin decisiones registradas todavia.</p>
      ) : (
        <div className="space-y-3">
          {log.map((entry, i) => (
            <Card key={i}>
              <CardContent className="py-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{formatDate(entry.date ? new Date(entry.date) : null)}</p>
                    <p className="text-sm font-medium mt-0.5">{entry.decision}</p>
                    {entry.reasoning && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{entry.reasoning}</p>}
                  </div>
                  <button onClick={() => handleDelete(i)} className="cursor-pointer text-destructive shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
