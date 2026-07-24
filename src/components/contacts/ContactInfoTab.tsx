"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AccountHealthCard } from "./AccountHealthCard";
import {
  Building2,
  FileText,
  Calendar,
  ChevronRight,
  DollarSign,
  Phone,
  Mail,
  Users,
  Clock,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  cleanPhoneForWhatsApp,
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

interface ContactInfoTabProps {
  contact: {
    id: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    source: string;
    temperature: string;
    score: number;
    notes: string | null;
    clientStatus: string;
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
  copiedField: string | null;
  onCopy: (value: string, field: string) => void;
  onViewDeals: () => void;
  onViewActivity: () => void;
}

export function ContactInfoTab({ contact, deals, activities, copiedField, onCopy, onViewDeals, onViewActivity }: ContactInfoTabProps) {
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

      {/* Mobile: original stacked layout */}
      <div className="lg:hidden grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex-1 truncate">
                    {contact.email}
                  </a>
                  <button onClick={() => onCopy(contact.email!, "email")} className="p-1 rounded hover:bg-muted cursor-pointer">
                    {copiedField === "email" ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1">{contact.phone}</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-muted cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                    </a>
                    <a href={`tel:${contact.phone}`} className="p-1 rounded hover:bg-muted cursor-pointer">
                      <Phone className="h-3.5 w-3.5 text-blue-600" />
                    </a>
                    <button onClick={() => onCopy(contact.phone!, "phone")} className="p-1 rounded hover:bg-muted cursor-pointer">
                      {copiedField === "phone" ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Creado {formatDate(contact.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {contact.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{contact.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado Comercial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Temperatura</span>
                <StatusBadge temperature={contact.temperature as Temperature} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fuente</span>
                <span>{SOURCE_LABELS[contact.source as LeadSource] || contact.source}</span>
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
              {contact.signedDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fecha de firma</span>
                  <span>{formatDate(contact.signedDate)}</span>
                </div>
              )}
              {contact.monthlyPayment ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pago mensual</span>
                  <span className="font-semibold text-primary">{formatCurrency(contact.monthlyPayment)}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {isActiveClient && <AccountHealthCard contactId={contact.id} accountHealth={contact.accountHealth} />}
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
