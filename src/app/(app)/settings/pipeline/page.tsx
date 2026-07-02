"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kanban } from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";

export default function PipelinePage() {
  const [stages, setStages] = useState<Array<{ id: string; name: string; color: string; order: number }>>([]);

  useEffect(() => {
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then(setStages);
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Kanban} title="Pipeline" description="Etapas de tu pipeline de ventas." />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                <span className="text-sm flex-1">{stage.name}</span>
                <Badge variant="outline" className="text-xs">#{stage.order}</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Usa <code>/customize</code> en Claude Code para modificar las etapas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
