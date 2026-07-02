"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Copy, Webhook, Clock } from "lucide-react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/SettingsHeader";

export default function AutomatizacionesPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Zap} title="Automatizaciones" description="Webhooks y flujos automaticos del CRM." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4" /> Webhook de leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Recibe leads automaticamente desde formularios, landing pages, o cualquier herramienta que soporte webhooks.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted p-2 rounded font-mono truncate">
                POST {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/webhook
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhook`);
                  toast.success("URL copiada");
                }}
                className="p-2 rounded hover:bg-muted cursor-pointer"
                title="Copiar URL"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-xs font-mono">
              <p className="text-muted-foreground mb-1">Ejemplo:</p>
              <p>curl -X POST {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/webhook \</p>
              <p className="pl-4">-H &quot;Content-Type: application/json&quot; \</p>
              <p className="pl-4">-d &apos;{`{"name":"Juan","email":"j@test.com","phone":"555-1234"}`}&apos;</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Soporta campos en espanol e ingles: name/nombre, email/correo, phone/telefono, company/empresa, notes/notas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Motor de automatizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Próximamente: recordatorios automaticos de seguimiento, digest diario programado y reglas de negocio
            (ej. mover un contacto a &quot;enfriando&quot; tras 14 dias sin actividad) corriendo en el servidor,
            no solo mientras el CRM esta abierto en el navegador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
