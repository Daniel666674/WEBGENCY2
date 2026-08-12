"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Bot,
  Clock,
  CreditCard,
  GitBranch,
  Loader2,
  Mail,
  MessageCircle,
  Plug,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { GithubConnection } from "@/components/settings/GithubConnection";

interface Status {
  connected: boolean;
  detail: string;
}

const INTEGRATIONS: {
  key: string;
  icon: typeof Mail;
  name: string;
  description: string;
  /** Where you go to actually configure it. */
  href?: string;
  /** Configured outside the app — say so instead of linking nowhere. */
  envOnly?: boolean;
}[] = [
  {
    key: "google",
    icon: ShieldCheck,
    name: "Login con Google",
    description: "Cada quien entra con su cuenta, con sus propios permisos.",
    href: "/settings/usuarios",
  },
  {
    key: "email",
    icon: Mail,
    name: "Email",
    description: "Resumen diario y avisos de leads nuevos. Gmail o Resend.",
    href: "/settings/notificaciones",
  },
  {
    key: "whatsapp",
    icon: MessageCircle,
    name: "WhatsApp Business",
    description: "Avisos de pagos vencidos al equipo, vía Meta Cloud API.",
    href: "/settings/automatizaciones",
  },
  {
    key: "payments",
    icon: CreditCard,
    name: "Pasarela de pagos",
    description: "Registra el cobro apenas la pasarela confirma el pago.",
    href: "/settings/automatizaciones",
  },
  {
    key: "github",
    icon: GitBranch,
    name: "GitHub",
    description: "Importar páginas HTML de tus repositorios al builder de demos.",
    href: "#github",
  },
  {
    key: "cron",
    icon: Clock,
    name: "Tareas programadas",
    description: "El motor que corre las automatizaciones cada mañana.",
    href: "/settings/automatizaciones",
  },
  {
    key: "anthropic",
    icon: Bot,
    name: "IA (Anthropic)",
    description: "Clasificación automática de leads dentro de la web.",
    envOnly: true,
  },
  {
    key: "ga4",
    icon: BarChart3,
    name: "Google Analytics 4",
    description: "Sesiones, usuarios y conversiones por sitio de cliente.",
    href: "/clients",
  },
  {
    key: "gsc",
    icon: Search,
    name: "Google Search Console",
    description: "Clics, impresiones y posición promedio por sitio.",
    href: "/clients",
  },
];

export default function IntegracionesPage() {
  const [status, setStatus] = useState<Record<string, Status> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/integrations")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const connected = status ? Object.values(status).filter((s) => s.connected).length : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <SettingsHeader
        icon={Plug}
        title="Integraciones"
        description={
          loading ? "Revisando conexiones..." : `${connected} de ${INTEGRATIONS.length} conectadas.`
        }
      />

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Revisando conexiones...
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {INTEGRATIONS.map((i) => {
            const s = status?.[i.key];
            const body = (
              <CardContent className="flex items-center gap-4 pt-6">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    s?.connected ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <i.icon className={cn("h-5 w-5", s?.connected ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{i.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{i.description}</p>
                  {s?.detail && <p className="text-[11px] text-muted-foreground mt-1">{s.detail}</p>}
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full",
                    s?.connected ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {s?.connected ? "Conectado" : i.envOnly ? "Sin configurar" : "Falta configurar"}
                </span>
              </CardContent>
            );

            return i.href ? (
              <Link key={i.key} href={i.href} className="block">
                <Card className="transition-colors hover:border-primary/40">{body}</Card>
              </Link>
            ) : (
              <Card key={i.key}>{body}</Card>
            );
          })}
        </div>
      )}

      <div id="github" className="scroll-mt-6">
        <GithubConnection />
      </div>

      <p className="text-xs text-muted-foreground">
        Lo que se configura con variables de entorno (IA, proveedor de email, secreto del cron) necesita un
        redeploy para cambiar. El resto se edita desde acá.
      </p>
    </div>
  );
}
