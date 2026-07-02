import { Card, CardContent } from "@/components/ui/card";
import { Terminal, Zap } from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";

const commands = [
  { name: "/setup", description: "Configurar CRM para tu negocio" },
  { name: "/add-lead", description: "Agregar un lead de forma conversacional" },
  { name: "/analyze-pipeline", description: "Analizar pipeline y obtener recomendaciones" },
  { name: "/daily-briefing", description: "Resumen diario de ventas" },
  { name: "/import-contacts", description: "Importar contactos desde CSV" },
  { name: "/customize", description: "Re-personalizar tu CRM" },
];

export default function ComandosPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Terminal} title="Comandos" description="Comandos de Claude Code disponibles en el proyecto." />

      <Card>
        <CardContent className="pt-6">
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
  );
}
