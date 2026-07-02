"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Briefcase } from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import type { CrmConfig } from "@/types";

export default function NegocioPage() {
  const [config, setConfig] = useState<CrmConfig | null>(null);

  useEffect(() => {
    fetch("/crm-config.json")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Briefcase} title="Negocio" description="Informacion y preferencias de tu negocio." />

      <Card>
        <CardContent className="space-y-3 pt-6">
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
                <span>{config.preferences.language === "es" ? "Espanol" : "Ingles"}</span>
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
    </div>
  );
}
