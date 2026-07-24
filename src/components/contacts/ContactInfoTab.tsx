"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AccountHealthCard } from "./AccountHealthCard";
import {
  Building2,
  Globe,
  FileText,
  Calendar,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Phone,
  Mail,
  Users,
  Clock,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  CLIENT_STATUS_CONFIG,
  SOURCE_LABELS,
  ACTIVITY_TYPE_CONFIG,
} from "@/lib/constants";
import type { Temperature, LeadSource, ClientStatus, AccountHealth, ActivityType } from "@/types";

const ACTIVITY_STYLE: Record<string, { icon: typeof Phone; classes: string }> = {
  call: { icon: Phone, classes: "bg-green-500/10 text-green-600" },
  email: { icon: Mail, classes: "bg-orange-500/10 text-orange-600" },
  meeting: { icon: Users, classes: "bg-primary/10 text-primary" },
  note: { icon: FileText, classes: "bg-blue-500/10 text-blue-600" },
  follow_up: { icon: Clock, classes: "bg-amber-500/10 text-amber-600" },
};

const DEAL_ICON_COLORS = ["bg-primary/10 text-primary", "bg-orange-500/10 text-orange-600"];

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

interface ContactInfoTabProps {
  contact: {
    id: string;
    company: string | null;
    source: string;
    temperature: string;
    score: number;
    notes: string | null;
    clientStatus: string;
    siteUrl: string | null;
    signedDate: number | Date | null;
    monthlyPayment: number | null;
    nextPaymentDate: number | Date | null;
    createdAt: number | Date;
    accountHealth: AccountHealth | null;
  };
  deals: Array<{
    id: string;
    title: string;
    value: number;
    probability: number;
    stageName: string | null;
    stageColor: string | null;
  }>;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: number | Date;
    assignedUserName: string | null;
  }>;
  onViewDeals: () => void;
  onViewActivity: () => void;
}

export function ContactInfoTab({ contact, deals, activities, onViewDeals, onViewActivity }: ContactInfoTabProps) {
  const statusConfig = CLIENT_STATUS_CONFIG[(contact.clientStatus || "prospect") as ClientStatus];
  const recentActivities = activities.slice(0, 4);
  const isActiveClient = contact.clientStatus === "active_client";

  return (
    <div className="space-y-4">
      {/* Desktop: 2x2 card grid */}
      <div className="hidden lg:grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Empresa" value={contact.company || "—"} />
            <Row label="Creado el" value={formatDateTime(contact.createdAt)} />
            <Row label="Fuente" value={SOURCE_LABELS[contact.source as LeadSource] || contact.source} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado Comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}>{statusConfig.label}</Badge>
            </div>
            {contact.signedDate && <Row label="Fecha de firma" value={formatDate(contact.signedDate)} />}
            {contact.monthlyPayment ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pago mensual</span>
                <span className="font-semibold text-primary">{formatCurrency(contact.monthlyPayment)}</span>
              </div>
            ) : null}
            {contact.nextPaymentDate && <Row label="Próximo pago" value={formatDate(contact.nextPaymentDate)} />}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Temperatura</span>
              <StatusBadge temperature={contact.temperature as Temperature} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Score</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${contact.score}%` }} />
                </div>
                <span className="text-xs font-medium">{contact.score}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isActiveClient ? (
          <AccountHealthCard contactId={contact.id} accountHealth={contact.accountHealth} />
        ) : (
          <div className="hidden lg:block" />
        )}

        <Card className={isActiveClient ? "" : "lg:col-span-2"}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
            {activities.length > 0 && (
              <button onClick={onViewActivity} className="text-xs font-medium text-primary hover:underline cursor-pointer">
                Ver toda la actividad →
              </button>
            )}
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad registrada todavia.</p>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const style = ACTIVITY_STYLE[activity.type] || ACTIVITY_STYLE.note;
                  const Icon = style.icon;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${style.classes}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(activity.createdAt)}
                          {activity.assignedUserName && <> · por {activity.assignedUserName}</>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop: full-width notes */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle className="text-base">Notas Internas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{contact.notes || "Sin notas registradas."}</p>
        </CardContent>
      </Card>

      {/* Mobile: Resumen row-list */}
      <div className="lg:hidden space-y-4">
        <div>
          <h2 className="text-base font-semibold">Resumen</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Información general del contacto y su empresa.</p>
        </div>

        <div className="rounded-xl border bg-card divide-y">
          {contact.company && (
            <SummaryRow icon={Building2} iconClasses="bg-red-500/10 text-red-600" label="Empresa" value={contact.company} />
          )}
          {contact.siteUrl && (
            <a href={contact.siteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4" />
              </div>
              <span className="flex-1 text-sm text-muted-foreground">Sitio web</span>
              <span className="text-sm font-medium text-primary truncate max-w-[45%]">{stripProtocol(contact.siteUrl)}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </a>
          )}
          {contact.notes && (
            <SummaryRow icon={FileText} iconClasses="bg-primary/10 text-primary" label="Notas" value={contact.notes} wrap />
          )}
          {!contact.company && !contact.siteUrl && !contact.notes && (
            <p className="p-3.5 text-sm text-muted-foreground">Sin informacion adicional registrada.</p>
          )}
        </div>

        {deals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Deals activos ({deals.length})</h3>
              <button onClick={onViewDeals} className="text-xs font-medium text-primary cursor-pointer">
                Ver todos
              </button>
            </div>
            <div className="rounded-xl border bg-card divide-y">
              {deals.map((deal, i) => (
                <div key={deal.id} className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${DEAL_ICON_COLORS[i % 2]}`}>
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{deal.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{deal.stageName}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-semibold">{formatCurrency(deal.value)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-11">
                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${deal.probability}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{deal.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Actividad reciente</h3>
              <button onClick={onViewActivity} className="text-xs font-medium text-primary cursor-pointer">
                Ver toda
              </button>
            </div>
            <div className="rounded-xl border bg-card divide-y">
              {recentActivities.map((activity) => {
                const style = ACTIVITY_STYLE[activity.type] || ACTIVITY_STYLE.note;
                const Icon = style.icon;
                return (
                  <button key={activity.id} onClick={onViewActivity} className="flex items-center gap-3 p-3.5 w-full text-left cursor-pointer">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${style.classes}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {ACTIVITY_TYPE_CONFIG[activity.type as ActivityType]?.label || activity.type} realizada
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.assignedUserName ? `${activity.assignedUserName} · ` : ""}
                        {formatRelativeDate(activity.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isActiveClient && <AccountHealthCard contactId={contact.id} accountHealth={contact.accountHealth} />}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas Internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{contact.notes || "Sin notas registradas."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  iconClasses,
  label,
  value,
  wrap,
}: {
  icon: typeof Building2;
  iconClasses: string;
  label: string;
  value: string;
  wrap?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconClasses}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm text-muted-foreground shrink-0 pt-1.5 w-20">{label}</span>
      <span className={`flex-1 text-sm font-medium text-right pt-1.5 ${wrap ? "" : "truncate"}`}>{value}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1.5" />
    </div>
  );
}
