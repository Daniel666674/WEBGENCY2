"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import type { BusinessProfile } from "@/lib/businessConfig";

/**
 * Your own company's profile — editable.
 *
 * This page used to render a read-only dump of the static
 * public/crm-config.json and tell you to go run a Claude Code command to
 * change anything. The profile now lives in the database and feeds the daily
 * digest header, currency and timezone.
 */

type Field = { key: keyof BusinessProfile; label: string; placeholder?: string; wide?: boolean };

const IDENTITY: Field[] = [
  { key: "name", label: "Nombre comercial", placeholder: "OLIWAN" },
  { key: "legalName", label: "Razón social", placeholder: "OLIWAN S.A.S." },
  { key: "taxId", label: "NIT / Tax ID", placeholder: "900.123.456-7" },
  { key: "tagline", label: "Frase / posicionamiento", placeholder: "Sitios que venden", wide: true },
];

const CONTACT: Field[] = [
  { key: "email", label: "Email de contacto", placeholder: "hola@oliwan.com" },
  { key: "phone", label: "Teléfono", placeholder: "+57 300 111 2233" },
  { key: "website", label: "Sitio web", placeholder: "https://oliwan.com" },
  { key: "address", label: "Dirección", placeholder: "Bogotá, Colombia", wide: true },
];

const INDUSTRIES = ["marketing", "tecnologia", "diseno", "consultoria", "educacion", "salud", "retail", "inmobiliaria", "general"];
const TYPES = [
  { value: "agency", label: "Agencia" },
  { value: "services", label: "Servicios" },
  { value: "products", label: "Productos" },
  { value: "saas", label: "SaaS" },
  { value: "other", label: "Otro" },
];
const CURRENCIES = ["COP", "USD", "MXN", "EUR", "ARS", "CLP", "PEN"];
const TIMEZONES = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "Europe/Madrid",
];

export default function NegocioPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/business")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .catch(() => toast.error("No se pudo cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  function patch(fields: Partial<BusinessProfile>) {
    setProfile((p) => (p ? { ...p, ...fields } : p));
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setProfile(await res.json());
      toast.success("Perfil del negocio guardado");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const input = "text-sm border rounded-lg px-3 py-2 bg-background w-full";

  function textFields(fields: Field[]) {
    if (!profile) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f.key} className={`flex flex-col gap-1 ${f.wide ? "sm:col-span-2" : ""}`}>
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <input
              value={(profile[f.key] as string) ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => patch({ [f.key]: e.target.value } as Partial<BusinessProfile>)}
              className={input}
            />
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Briefcase} title="Negocio" description="Los datos de tu empresa, no los de tus clientes." />

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </CardContent>
        </Card>
      ) : !profile ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">No se pudo cargar el perfil.</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identidad</CardTitle>
            </CardHeader>
            <CardContent>{textFields(IDENTITY)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacto</CardTitle>
            </CardHeader>
            <CardContent>{textFields(CONTACT)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operación</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Tipo de negocio</span>
                <select value={profile.type} onChange={(e) => patch({ type: e.target.value })} className={input}>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Industria</span>
                <select value={profile.industry} onChange={(e) => patch({ industry: e.target.value })} className={input}>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i} className="capitalize">{i}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Tamaño del equipo</span>
                <input
                  value={profile.teamSize}
                  onChange={(e) => patch({ teamSize: e.target.value })}
                  placeholder="2"
                  className={input}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Moneda</span>
                <select value={profile.currency} onChange={(e) => patch({ currency: e.target.value })} className={input}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Zona horaria</span>
                <select value={profile.timezone} onChange={(e) => patch({ timezone: e.target.value })} className={input}>
                  {TIMEZONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Idioma</span>
                <select
                  value={profile.language}
                  onChange={(e) => patch({ language: e.target.value as "es" | "en" })}
                  className={input}
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </label>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar"}
            </button>
            <p className="text-xs text-muted-foreground">
              El nombre y la zona horaria se usan en el resumen diario por email.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
