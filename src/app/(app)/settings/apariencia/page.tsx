"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Palette, Moon, Sun, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import {
  DEFAULT_CONFIG,
  HER_PURPLE_PRESETS,
  THEME_PRESETS,
  type ThemeConfig,
  type ThemeColors,
  type DarkOverride,
} from "@/lib/theme";
import { reloadThemeConfig } from "@/components/shared/ThemeEngine";

export default function AparienciaPage() {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => r.json())
      .then(setTheme)
      .catch(() => {});
  }, []);

  async function saveTheme(config?: ThemeConfig) {
    const toSave = config ?? theme;
    setSaving(true);
    try {
      await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      if (config) setTheme(config);
      reloadThemeConfig();
      window.dispatchEvent(new Event("theme-updated"));
      toast.success("Tema guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(config: ThemeConfig) {
    saveTheme(config);
  }

  function resetToDefault() {
    saveTheme(DEFAULT_CONFIG);
  }

  function setDay(patch: Partial<ThemeColors>) {
    setTheme((t) => ({ ...t, day: { ...t.day, ...patch } }));
  }

  function setNight(patch: Partial<ThemeColors>) {
    setTheme((t) => ({ ...t, night: { ...t.night, ...patch } }));
  }

  function setDanielDark(patch: Partial<DarkOverride>) {
    setTheme((t) => ({ ...t, danielDark: { ...t.danielDark, ...patch } }));
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Palette} title="Apariencia" description="Elige un tema predefinido o personaliza cada color." />

      {/* Presets */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm font-semibold mb-1">Temas predefinidos</p>
            <p className="text-xs text-muted-foreground">Un clic aplica y guarda el tema completo — puedes ajustarlo después.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.config)}
                disabled={saving}
                className="flex flex-col items-start gap-2 p-3 rounded-xl border hover:border-primary hover:bg-accent transition-all text-left cursor-pointer disabled:opacity-50 group"
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className="w-5 h-5 rounded-full shrink-0 ring-1 ring-black/10"
                    style={{ backgroundColor: preset.swatch }}
                  />
                  <span className="text-sm font-medium truncate">{preset.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">{preset.description}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={resetToDefault}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar tema original
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Custom fine-tuning */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <p className="text-sm font-semibold">Personalización avanzada</p>

          {/* Switch hour */}
          <div className="flex items-center gap-4">
            <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Hora de cambio automático</p>
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
              <span className="text-sm font-semibold">Tema de Día</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ColorPicker label="Fondo" value={theme.day.background} onChange={(v) => setDay({ background: v })} />
              <ColorPicker label="Color primario" value={theme.day.primary} onChange={(v) => setDay({ primary: v })} />
              <ColorPicker label="Sidebar" value={theme.day.sidebar} onChange={(v) => setDay({ sidebar: v })} />
              <ColorPicker label="Tarjetas" value={theme.day.card} onChange={(v) => setDay({ card: v })} />
              <ColorPicker label="Muted" value={theme.day.muted} onChange={(v) => setDay({ muted: v })} />
              <ColorPicker label="Bordes" value={theme.day.border} onChange={(v) => setDay({ border: v })} />
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
              <ColorPicker label="Fondo" value={theme.night.background} onChange={(v) => setNight({ background: v })} />
              <ColorPicker label="Color primario" value={theme.night.primary} onChange={(v) => setNight({ primary: v })} />
              <ColorPicker label="Sidebar" value={theme.night.sidebar} onChange={(v) => setNight({ sidebar: v })} />
              <ColorPicker label="Tarjetas" value={theme.night.card} onChange={(v) => setNight({ card: v })} />
              <ColorPicker label="Muted" value={theme.night.muted} onChange={(v) => setNight({ muted: v })} />
              <ColorPicker label="Bordes" value={theme.night.border} onChange={(v) => setNight({ border: v })} />
            </div>
          </div>

          <Separator />

          {/* Her purple */}
          <div>
            <p className="text-sm font-semibold mb-1">Morado de Daniela (noche)</p>
            <p className="text-xs text-muted-foreground mb-3">Color primario para el perfil de Daniela en modo nocturno</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {HER_PURPLE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setTheme((t) => ({ ...t, herNightPrimary: p.value }))}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: theme.herNightPrimary === p.value ? p.value : "transparent",
                    borderColor: p.value,
                    color: theme.herNightPrimary === p.value ? "#fff" : p.value,
                  }}
                >
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.value }} />
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

          <Separator />

          {/* Daniel dark mode */}
          <div>
            <p className="text-sm font-semibold mb-1">Modo oscuro de Daniel</p>
            <p className="text-xs text-muted-foreground mb-3">
              Reemplaza los fondos claros por oscuros — el color primario y el sidebar no cambian
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ColorPicker label="Fondo" value={theme.danielDark.background} onChange={(v) => setDanielDark({ background: v })} />
              <ColorPicker label="Texto" value={theme.danielDark.foreground} onChange={(v) => setDanielDark({ foreground: v })} />
              <ColorPicker label="Tarjetas" value={theme.danielDark.card} onChange={(v) => setDanielDark({ card: v })} />
              <ColorPicker label="Muted" value={theme.danielDark.muted} onChange={(v) => setDanielDark({ muted: v })} />
              <ColorPicker label="Bordes" value={theme.danielDark.border} onChange={(v) => setDanielDark({ border: v })} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => saveTheme()}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer hover:opacity-90 transition-opacity"
            >
              {saving ? "Guardando..." : "Guardar personalización"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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
