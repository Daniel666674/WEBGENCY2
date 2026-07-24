"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AccountHealthCard } from "./AccountHealthCard";
import { Mail, Phone, Building2, Calendar, MessageCircle, Copy, Check } from "lucide-react";
import { formatCurrency, formatDate, cleanPhoneForWhatsApp, CLIENT_STATUS_CONFIG, SOURCE_LABELS } from "@/lib/constants";
import type { Temperature, LeadSource, ClientStatus, AccountHealth } from "@/types";

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
    createdAt: number | Date;
    accountHealth: AccountHealth | null;
  };
  copiedField: string | null;
  onCopy: (value: string, field: string) => void;
}

export function ContactInfoTab({ contact, copiedField, onCopy }: ContactInfoTabProps) {
  const statusConfig = CLIENT_STATUS_CONFIG[(contact.clientStatus || "prospect") as ClientStatus];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Contact info + Notes */}
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

      {/* Right: Commercial status + Account health */}
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

        {contact.clientStatus === "active_client" && (
          <AccountHealthCard contactId={contact.id} accountHealth={contact.accountHealth} />
        )}
      </div>
    </div>
  );
}
