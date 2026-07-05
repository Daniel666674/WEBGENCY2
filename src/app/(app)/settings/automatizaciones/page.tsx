"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Copy, Webhook, Clock, CreditCard, MessageCircle, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import type { PaymentAutomationConfig } from "@/lib/paymentAutomation";

const EMPTY_CONFIG: PaymentAutomationConfig = {
  gatewayProvider: "",
  gatewayWebhookSecret: "",
  whatsappToken: "",
  whatsappPhoneNumberId: "",
  whatsappNotifyNumbers: "",
  whatsappTemplateName: "payment_confirmation",
};

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full",
        configured ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      )}
    >
      {configured ? "Configurado" : "Falta configurar"}
    </span>
  );
}

export default function AutomatizacionesPage() {
  const [config, setConfig] = useState<PaymentAutomationConfig>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/settings/payment-automation")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function patch(fields: Partial<PaymentAutomationConfig>) {
    setConfig((c) => ({ ...c, ...fields }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/payment-automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuracion guardada");
      const fresh = await fetch("/api/settings/payment-automation").then((r) => r.json());
      setConfig(fresh);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function testWhatsapp() {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/payment-automation/test-whatsapp", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Fallo el envio de prueba");
        return;
      }
      const failed = body.results?.filter((r: { ok: boolean }) => !r.ok) ?? [];
      if (failed.length > 0) {
        toast.error(`Fallo para: ${failed.map((f: { to: string; error?: string }) => `${f.to} (${f.error})`).join(", ")}`);
      } else {
        toast.success("Mensaje de prueba enviado a todos los numeros");
      }
    } catch {
      toast.error("Error al enviar la prueba");
    } finally {
      setTesting(false);
    }
  }

  const gatewayConfigured = !!(config.gatewayProvider && config.gatewayWebhookSecret);
  const whatsappConfigured = !!(config.whatsappToken && config.whatsappPhoneNumberId && config.whatsappNotifyNumbers);
  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/payments/webhook`;

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

      {/* Payment automation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Cobro de mensualidad + confirmacion por WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Cuando la pasarela confirma un pago, el CRM registra el pago, verifica la regla de 48h antes del
            vencimiento, y te avisa a ti y a Daniela por WhatsApp. Un chequeo periodico separado suspende las
            automatizaciones de un cliente si nunca llega a pagar a tiempo.
          </p>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <>
              {/* Gateway */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Pasarela de pagos</p>
                  <StatusBadge configured={gatewayConfigured} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Proveedor</span>
                    <select
                      value={config.gatewayProvider}
                      onChange={(e) => patch({ gatewayProvider: e.target.value as PaymentAutomationConfig["gatewayProvider"] })}
                      className="text-sm border rounded-lg px-3 py-2 bg-background"
                    >
                      <option value="">Sin configurar</option>
                      <option value="wompi">Wompi</option>
                      <option value="bold">Bold</option>
                      <option value="payu">PayU</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Webhook secret</span>
                    <input
                      type="password"
                      value={config.gatewayWebhookSecret}
                      onChange={(e) => patch({ gatewayWebhookSecret: e.target.value })}
                      placeholder="secreto de firma del webhook"
                      className="text-sm border rounded-lg px-3 py-2 bg-background"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted p-2 rounded font-mono truncate">POST {webhookUrl}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL copiada"); }}
                    className="p-2 rounded hover:bg-muted cursor-pointer"
                    title="Copiar URL"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                {config.gatewayProvider && config.gatewayProvider !== "wompi" && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                    Verificacion de firma para {config.gatewayProvider} aun no implementada — el webhook rechazara
                    todo hasta confirmar el formato real que envia {config.gatewayProvider} y completar el codigo.
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp (Meta Cloud API)
                  </p>
                  <StatusBadge configured={whatsappConfigured} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Token de acceso</span>
                    <input
                      type="password"
                      value={config.whatsappToken}
                      onChange={(e) => patch({ whatsappToken: e.target.value })}
                      placeholder="EAAG..."
                      className="text-sm border rounded-lg px-3 py-2 bg-background"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Phone Number ID</span>
                    <input
                      value={config.whatsappPhoneNumberId}
                      onChange={(e) => patch({ whatsappPhoneNumberId: e.target.value })}
                      placeholder="1234567890"
                      className="text-sm border rounded-lg px-3 py-2 bg-background"
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Numeros a notificar (Daniel, Daniela) — separados por coma, formato E.164</span>
                    <input
                      value={config.whatsappNotifyNumbers}
                      onChange={(e) => patch({ whatsappNotifyNumbers: e.target.value })}
                      placeholder="+573001112233,+573004445566"
                      className="text-sm border rounded-lg px-3 py-2 bg-background"
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Nombre de la plantilla aprobada en Meta Business Manager</span>
                    <input
                      value={config.whatsappTemplateName}
                      onChange={(e) => patch({ whatsappTemplateName: e.target.value })}
                      placeholder="payment_confirmation"
                      className="text-sm border rounded-lg px-3 py-2 bg-background"
                    />
                  </label>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  Los mensajes proactivos (fuera de una conversacion que el destinatario inicio en las ultimas 24h)
                  necesitan una plantilla pre-aprobada en Meta Business Manager — un mensaje de texto libre
                  fallara.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={testWhatsapp}
                  disabled={testing || !whatsappConfigured}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" /> {testing ? "Enviando..." : "Enviar mensaje de prueba"}
                </button>
                {gatewayConfigured && whatsappConfigured && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Todo listo
                  </span>
                )}
              </div>
            </>
          )}
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
