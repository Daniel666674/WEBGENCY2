"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Loader2, Mail, Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingToggle } from "@/components/settings/SettingToggle";
import { NotificationToggle } from "@/components/shared/NotificationToggle";
import type { NotificationConfig } from "@/lib/notificationConfig";

/**
 * Notification settings that reach past the browser tab.
 *
 * The only control here used to be a browser-notification toggle that worked
 * exclusively while the CRM was open. Everything scheduled — who the daily
 * digest goes to, whether WhatsApp alerts fire — was hardcoded in env vars.
 */
export default function NotificacionesPage() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [envFallback, setEnvFallback] = useState<string | null>(null);
  const [providerConfigured, setProviderConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setConfig(d.config);
        setEnvFallback(d.envFallback);
        setProviderConfigured(d.providerConfigured);
      })
      .catch(() => toast.error("No se pudo cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  function patch(fields: Partial<NotificationConfig>) {
    setConfig((c) => (c ? { ...c, ...fields } : c));
  }

  function addRecipient() {
    const email = draft.trim().toLowerCase();
    if (!config) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Email inválido");
    if (config.digestRecipients.includes(email)) return toast.error("Ya está en la lista");
    patch({ digestRecipients: [...config.digestRecipients, email] });
    setDraft("");
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { config: fresh } = await res.json();
      setConfig(fresh);
      toast.success("Notificaciones guardadas");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Bell} title="Notificaciones" description="Cómo y cuándo el CRM les avisa." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">En el navegador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NotificationToggle />
          <p className="text-xs text-muted-foreground">
            Avisa de seguimientos vencidos. Se verifica cada 5 minutos, pero solo mientras el CRM está abierto —
            para lo que llega sin tener el CRM abierto, está el resumen diario de abajo.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </CardContent>
        </Card>
      ) : !config ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">No se pudo cargar la configuración.</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> Resumen diario por email
              </CardTitle>
              <SettingToggle checked={config.digestEnabled} onChange={(v) => patch({ digestEnabled: v })} />
            </CardHeader>
            <CardContent className="space-y-4">
              {!providerConfigured && (
                <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Falta configurar un proveedor de email (GMAIL_APP_PASSWORD o RESEND_API_KEY). Hasta entonces el
                  resumen no se envía aunque esté activado.
                </p>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Destinatarios</p>
                {config.digestRecipients.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {envFallback
                      ? `Sin destinatarios acá, el resumen va a ${envFallback} (definido en el servidor).`
                      : "No hay destinatarios ni valor por defecto en el servidor — nadie recibe el resumen."}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {config.digestRecipients.map((email) => (
                      <div key={email} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
                        <span className="flex-1 text-sm truncate">{email}</span>
                        <button
                          onClick={() =>
                            patch({ digestRecipients: config.digestRecipients.filter((e) => e !== email) })
                          }
                          className="p-1 rounded text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Quitar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
                    placeholder="daniela@ejemplo.com"
                    className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background"
                  />
                  <button
                    onClick={addRecipient}
                    disabled={!draft.trim()}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </button>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <SettingToggle
                  checked={config.includeAutomationSummary}
                  onChange={(v) => patch({ includeAutomationSummary: v })}
                  label="Incluir lo que hicieron las automatizaciones"
                  hint="Al final del email, la lista de lo que el CRM hizo solo esa mañana."
                />
                <SettingToggle
                  checked={config.skipWeekends}
                  onChange={(v) => patch({ skipWeekends: v })}
                  label="No enviar sábados ni domingos"
                />
              </div>

              <p className="text-xs text-muted-foreground border-t pt-3">
                El resumen sale todos los días a las 12:00 UTC (7:00 en Bogotá). Para cambiar la hora, editá el cron
                en <code>vercel.json</code>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Otros avisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingToggle
                checked={config.whatsappAlerts}
                onChange={(v) => patch({ whatsappAlerts: v })}
                label="WhatsApp por pagos vencidos"
                hint="Requiere WhatsApp configurado en Automatizaciones."
              />
              <SettingToggle
                checked={config.notifyOnNewLead}
                onChange={(v) => patch({ notifyOnNewLead: v })}
                label="Email al llegar un lead nuevo"
                hint="Para los leads que entran por el webhook de formularios."
              />
            </CardContent>
          </Card>

          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </>
      )}
    </div>
  );
}
