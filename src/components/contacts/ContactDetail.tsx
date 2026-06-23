"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ContactForm } from "./ContactForm";
import { ActivityForm } from "@/components/activities/ActivityForm";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  FileText,
  Clock,
  Users,
  Pencil,
  Trash2,
  Plus,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  Globe,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeDate, cleanPhoneForWhatsApp, CLIENT_STATUS_CONFIG } from "@/lib/constants";
import { ACTIVITY_TYPE_CONFIG, SOURCE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import type { Temperature, ActivityType, LeadSource, ClientStatus } from "@/types";

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  follow_up: Clock,
};

interface ContactDetailClientProps {
  contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    source: string;
    temperature: string;
    score: number;
    notes: string | null;
    mockupUrl: string | null;
    siteUrl: string | null;
    signedDate: number | Date | null;
    monthlyPayment: number | null;
    clientStatus: string;
    nextPaymentDate: number | Date | null;
    createdAt: number | Date;
  };
  deals: Array<{
    id: string;
    title: string;
    value: number;
    probability: number;
    stageName: string | null;
    stageColor: string | null;
    createdAt: number | Date;
  }>;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    scheduledAt: number | Date | null;
    completedAt: number | Date | null;
    createdAt: number | Date;
  }>;
}

export function ContactDetailClient({
  contact,
  deals,
  activities,
}: ContactDetailClientProps) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const statusConfig = CLIENT_STATUS_CONFIG[(contact.clientStatus || "prospect") as ClientStatus];

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success("Copiado");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Estas seguro de eliminar este contacto? Esta accion no se puede deshacer.")) {
      return;
    }
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Contacto eliminado");
      router.push("/contacts");
    } catch {
      toast.error("Error al eliminar el contacto");
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Error");
      toast.success("Actividad completada");
      router.refresh();
    } catch {
      toast.error("Error al completar la actividad");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contacts")} className="cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <StatusBadge temperature={contact.temperature as Temperature} />
            <Badge style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color, border: `1px solid ${statusConfig.color}30` }}>
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Score: {contact.score}/100 &middot; {SOURCE_LABELS[contact.source as LeadSource] || contact.source}
            {contact.company && <> &middot; {contact.company}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)} className="cursor-pointer">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="cursor-pointer text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </div>
      </div>

      {/* URLs bar */}
      {(contact.mockupUrl || contact.siteUrl) && (
        <div className="flex gap-3">
          {contact.mockupUrl && (
            <a href={contact.mockupUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-sm hover:bg-muted/50 transition-colors cursor-pointer">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>Mockup</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          )}
          {contact.siteUrl && (
            <a href={contact.siteUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-sm hover:bg-muted/50 transition-colors cursor-pointer">
              <Globe className="h-4 w-4 text-primary" />
              <span>Sitio Web</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" className="cursor-pointer">Info</TabsTrigger>
          <TabsTrigger value="deals" className="cursor-pointer">Deals ({deals.length})</TabsTrigger>
          <TabsTrigger value="activities" className="cursor-pointer">Actividades ({activities.length})</TabsTrigger>
          <TabsTrigger value="payments" className="cursor-pointer">Pagos</TabsTrigger>
        </TabsList>

        {/* INFO TAB */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex-1 truncate">{contact.email}</a>
                    <button onClick={() => handleCopy(contact.email!, "email")} className="p-1 rounded hover:bg-muted cursor-pointer">
                      {copiedField === "email" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1">{contact.phone}</span>
                    <div className="flex items-center gap-1">
                      <a href={`https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-green-50 cursor-pointer">
                        <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                      </a>
                      <a href={`tel:${contact.phone}`} className="p-1 rounded hover:bg-blue-50 cursor-pointer">
                        <Phone className="h-3.5 w-3.5 text-blue-600" />
                      </a>
                      <button onClick={() => handleCopy(contact.phone!, "phone")} className="p-1 rounded hover:bg-muted cursor-pointer">
                        {copiedField === "phone" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
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
                {contact.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{contact.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                {contact.signedDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fecha de firma</span>
                    <span>{formatDate(contact.signedDate)}</span>
                  </div>
                )}
                {contact.monthlyPayment && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pago mensual</span>
                    <span className="font-semibold text-primary">{formatCurrency(contact.monthlyPayment)}</span>
                  </div>
                )}
                {contact.nextPaymentDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Proximo pago</span>
                    <span>{formatDate(contact.nextPaymentDate)}</span>
                  </div>
                )}
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
          </div>
        </TabsContent>

        {/* DEALS TAB */}
        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deals ({deals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin deals</p>
              ) : (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/deals/${deal.id}`)}>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-semibold text-primary">{formatCurrency(deal.value)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                          <Badge variant="outline" style={{ borderColor: deal.stageColor || undefined, color: deal.stageColor || undefined }}>
                            {deal.stageName}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITIES TAB */}
        <TabsContent value="activities">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Actividades ({activities.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowActivityForm(true)} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-1" /> Registrar
              </Button>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actividades. Registra una llamada, email o nota.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const Icon = activityIcons[activity.type] || FileText;
                    const config = ACTIVITY_TYPE_CONFIG[activity.type as ActivityType];
                    const isPending = !activity.completedAt && activity.scheduledAt;
                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className="rounded-full bg-muted p-2 h-fit shrink-0">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{config?.label || activity.type}</Badge>
                            {isPending && (
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-600 cursor-pointer"
                                onClick={() => handleCompleteActivity(activity.id)}>
                                Completar
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pago Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contact.monthlyPayment ? formatCurrency(contact.monthlyPayment) : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Fecha de Firma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contact.signedDate ? formatDate(contact.signedDate) : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Proximo Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contact.nextPaymentDate ? formatDate(contact.nextPaymentDate) : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deal values summary */}
          {deals.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Deals Asociados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{deal.title}</span>
                      <span className="text-sm font-semibold">{formatCurrency(deal.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(deals.reduce((s, d) => s + d.value, 0))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ContactForm
        open={showEditForm}
        onClose={() => { setShowEditForm(false); router.refresh(); }}
        initialData={{
          id: contact.id,
          name: contact.name,
          email: contact.email || "",
          phone: contact.phone || "",
          company: contact.company || "",
          source: contact.source,
          temperature: contact.temperature as "cold" | "warm" | "hot",
          notes: contact.notes || "",
          mockupUrl: contact.mockupUrl || "",
          siteUrl: contact.siteUrl || "",
          clientStatus: (contact.clientStatus || "prospect") as ClientStatus,
          monthlyPayment: contact.monthlyPayment ? String(contact.monthlyPayment / 100) : "",
        }}
      />

      <ActivityForm
        open={showActivityForm}
        onClose={() => { setShowActivityForm(false); router.refresh(); }}
        preselectedContactId={contact.id}
      />
    </div>
  );
}
