import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { NotificationToggle } from "@/components/shared/NotificationToggle";

export default function NotificacionesPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SettingsHeader icon={Bell} title="Notificaciones" description="Configura como y cuando recibes avisos." />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <NotificationToggle />
          <p className="text-xs text-muted-foreground">
            Las notificaciones te avisan cuando tienes seguimientos vencidos. Se verifican cada 5 minutos mientras el CRM esta abierto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
