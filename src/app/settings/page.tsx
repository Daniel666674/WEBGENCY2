"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  Kanban,
  Terminal,
  Zap,
  Webhook,
  Bell,
  Copy,
  Palette,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationToggle } from "@/components/shared/NotificationToggle";
import type { CrmConfig } from "@/types";
import {
  DEFAULT_CONFIG,
  HER_PURPLE_PRESETS,
  type ThemeConfig,
  type ThemeColors,
} from "@/lib/theme";
import { reloadThemeConfig } from "@/components/shared/ThemeEngine";

export default function SettingsPage() {
  const [config, setConfig] = useState<CrmConfig | null>(null);
  const [stages, setStages] = useState<
    Array<{ id: string; name: string; color: string; order: number }>
  >([]);
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/crm-config.json")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});

    fetch("/api/pipeline")
      .then((r) => r.json())
      .then(setStages);

    fetch("/api/theme")
      .then((r) => r.json())
      .then(setTheme)
      .catch(() => {});
  }, []);

  async function saveTheme() {
    setSaving(true);
    try {
      await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      reloadThemeConfig();
      // Trigger ThemeEngine re-apply
      window.dispatchEvent(new Event("theme-updated"));
      toast.success("Tema guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function setDay(patch: Partial<ThemeColors>) {
    setTheme((t) => ({ ...t, day: { ...t.day, ...patch } }));
  }

  function setNight(patch: Partial<ThemeColors>) {
    setTheme((t) => ({ ...t, night: { ...t.night, ...patch } }));
  }

  const commands = [
    { name: "/setup", description: "Configurar CRM para tu negocio" },
    { name: "/add-lead", description: "Agregar un lead de forma conversacional" },
    { name: "/analyze-pipeline", description: "Analizar pipeline y obtener recomendaciones" },
    { name: "/daily-briefing", description: "Resumen diario de ventas" },
    { name: "/import-contacts", description: "Importar contactos desde CSV" },
    { name: "/customize", description: "Re-personalizar tu CRM" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Configuracion del CRM y comandos disponibles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {config ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="capitalize">{config.business.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Industria</span>
                  <span className="capitalize">{config.business.industry}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Equipo</span>
                  <span>{config.business.teamSize}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Idioma</span>
                  <span>
                    {config.preferences.language === "es" ? "Espanol" : "Ingles"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tema</span>
                  <span className="capitalize">{config.preferences.theme}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ejecuta <code>/setup</code> en Claude Code para configurar tu negocio.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pipeline stages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              Etapas del Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm flex-1">{stage.name}</span>
                  <Badge variant="outline" className="text-xs">
                    #{stage.order}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Usa <code>/customize</code> en Claude Code para modificar las etapas.
            </p>
          </CardContent>
        </Card>

        {/* ── Colores & Tema ───────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colores & Tema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Switch hour */}
            <div className="flex items-center gap-4">
              <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Hora de cambio automatico</p>
                <p className="text-xs text-muted-foreground">Cambia al tema nocturno a esta hora</p>
              </div>
              <select
                value={theme.switchHour}
                onChange={(e) => setTheme((t) => ({ ...t, switchHour: Number(e.target.value) }))}
                className="text-sm border rounded-md px-2 py-1 bg-background"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>

            <Separator />

            {/* Day theme */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">Tema de Dia</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ColorPicker
                  label="Fondo"
                  value={theme.day.background}
                  onChange={(v) => setDay({ background: v })}
                />
                <ColorPicker
                  label="Color primario"
                  value={theme.day.primary}
                  onChange={(v) => setDay({ primary: v })}
                />
                <ColorPicker
                  label="Sidebar"
                  value={theme.day.sidebar}
                  onChange={(v) => setDay({ sidebar: v })}
                />
                <ColorPicker
                  label="Tarjetas"
                  value={theme.day.card}
                  onChange={(v) => setDay({ card: v })}
                />
                <ColorPicker
                  label="Muted"
                  value={theme.day.muted}
                  onChange={(v) => setDay({ muted: v })}
                />
                <ColorPicker
                  label="Bordes"
                  value={theme.day.border}
                  onChange={(v) => setDay({ border: v })}
                />
              </div>
            </div>

            <Separator />

            {/* Night theme */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Moon className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-semibold">Tema de Noche</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ColorPicker
                  label="Fondo"
                  value={theme.night.background}
                  onChange={(v) => setNight({ background: v })}
                />
                <ColorPicker
                  label="Color primario"
                  value={theme.night.primary}
                  onChange={(v) => setNight({ primary: v })}
                />
                <ColorPicker
                  label="Sidebar"
                  value={theme.night.sidebar}
                  onChange={(v) => setNight({ sidebar: v })}
                />
                <ColorPicker
                  label="Tarjetas"
                  value={theme.night.card}
                  onChange={(v) => setNight({ card: v })}
                />
                <ColorPicker
                  label="Muted"
                  value={theme.night.muted}
                  onChange={(v) => setNight({ muted: v })}
                />
                <ColorPicker
                  label="Bordes"
                  value={theme.night.border}
                  onChange={(v) => setNight({ border: v })}
                />
              </div>
            </div>

            <Separator />

            {/* Her purple presets */}
            <div>
              <p className="text-sm font-semibold mb-1">Morado de Mi Amor (noche)</p>
              <p className="text-xs text-muted-foreground mb-3">Color primario para el perfil de ella en modo nocturno</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {HER_PURPLE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setTheme((t) => ({ ...t, herNightPrimary: p.value }))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                    style={{
                      backgroundColor: theme.herNightPrimary === p.value ? p.value : "transparent",
                      borderColor: p.value,
                      color: theme.herNightPrimary === p.value ? "#fff" : p.value,
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: p.value }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
              <ColorPicker
                label="O elige un color libre"
                value={theme.herNightPrimary}
                onChange={(v) => setTheme((t) => ({ ...t, herNightPrimary: v }))}
              />
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={saveTheme}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Guardando..." : "Guardar tema"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Webhook config */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhook
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

        {/* Notifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <NotificationToggle />
            <p className="text-xs text-muted-foreground">
              Las notificaciones te avisan cuando tienes seguimientos vencidos. Se verifican cada 5 minutos mientras el CRM esta abierto.
            </p>
          </CardContent>
        </Card>

        {/* Claude Code commands */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Comandos de Claude Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Estos comandos estan disponibles cuando abres el proyecto en Claude Code.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commands.map((cmd) => (
                <div key={cmd.name} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <code className="text-sm font-semibold">{cmd.name}</code>
                    <p className="text-xs text-muted-foreground mt-0.5">{cmd.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 cursor-pointer">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 rounded-lg border overflow-hidden shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none p-0 bg-transparent"
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{value}</span>
      </div>
    </label>
  );
}
