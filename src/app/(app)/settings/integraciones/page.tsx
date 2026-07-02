import { Card, CardContent } from "@/components/ui/card";
import { Plug, Mail, MessageCircle, BarChart3, Search } from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";

const INTEGRATIONS = [
  {
    icon: Mail,
    name: "Gmail",
    description: "Enviar y recibir correos de clientes directamente desde el CRM.",
  },
  {
    icon: MessageCircle,
    name: "WhatsApp Business",
    description: "Mensajes de WhatsApp con tu numero de negocio, dentro de cada contacto.",
  },
  {
    icon: BarChart3,
    name: "Google Analytics 4",
    description: "Metricas de sesiones, usuarios y conversiones por cliente.",
  },
  {
    icon: Search,
    name: "Google Search Console",
    description: "Clics, impresiones y posicion promedio por sitio de cliente.",
  },
];

export default function IntegracionesPage() {
  const authEnabled = process.env.AUTH_ENABLED === "true";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <SettingsHeader icon={Plug} title="Integraciones" description="Conecta Google, WhatsApp y mas herramientas." />

      <div className="space-y-3">
        {INTEGRATIONS.map((i) => (
          <Card key={i.name}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <i.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{i.description}</p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                {authEnabled ? "Configurando" : "Próximamente"}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        La plomeria ya esta lista (login con Google, tablas y endpoints) — falta activar credenciales reales de
        Google Workspace, y para WhatsApp completar la verificacion de negocio con Meta.
      </p>
    </div>
  );
}
