"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactForm } from "./ContactForm";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { AttachmentsTab } from "./AttachmentsTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { InfraestructuraTab } from "./InfraestructuraTab";
import { SeoTab } from "./SeoTab";
import { SeguridadTab } from "./SeguridadTab";
import { BitacoraTab } from "./BitacoraTab";
import { SalesHealthCard } from "./SalesHealthCard";
import { ContactDetailHeader } from "./ContactDetailHeader";
import { ContactInfoTab } from "./ContactInfoTab";
import { FileText, Clock, Phone, Mail, Users, Plus } from "lucide-react";
import { formatCurrency, formatDate, formatRelativeDate, ACTIVITY_TYPE_CONFIG } from "@/lib/constants";
import { toast } from "sonner";
import type {
  ActivityType,
  ClientStatus,
  InfraData,
  SeoData,
  SecurityData,
  DecisionLogEntry,
  AccountHealth,
  InventoryHealth,
} from "@/types";

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
    infraData: InfraData | null;
    seoData: SeoData | null;
    securityData: SecurityData | null;
    decisionLog: DecisionLogEntry[];
    accountHealth: AccountHealth | null;
    inventoryHealth: InventoryHealth | null;
    salesDataNotes: string | null;
    funnelTracking: string | null;
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
    assignedUserName: string | null;
    assignedUserColor: string | null;
  }>;
}

export function ContactDetailClient({ contact, deals, activities }: ContactDetailClientProps) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const handleDelete = async () => {
    if (!confirm("Estas seguro de eliminar este contacto? Esta accion no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
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
      if (!res.ok) throw new Error();
      toast.success("Actividad completada");
      router.refresh();
    } catch {
      toast.error("Error al completar la actividad");
    }
  };

  return (
    <div className="space-y-6">
      <ContactDetailHeader
        contact={contact}
        deals={deals}
        activities={activities}
        onEdit={() => setShowEditForm(true)}
        onDelete={handleDelete}
        onRegister={() => setShowActivityForm(true)}
      />

      <Tabs value={activeTab} onValueChange={(v) => typeof v === "string" && setActiveTab(v)} className="space-y-4">
        <TabsList variant="line">
          <TabsTrigger value="info" className="cursor-pointer">
            <span className="sm:hidden">Resumen</span>
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="deals" className="cursor-pointer">Deals ({deals.length})</TabsTrigger>
          <TabsTrigger value="activities" className="cursor-pointer">Actividades ({activities.length})</TabsTrigger>
          <TabsTrigger value="payments" className="cursor-pointer">Pagos</TabsTrigger>
          <TabsTrigger value="analytics" className="cursor-pointer">Analiticas</TabsTrigger>
          <TabsTrigger value="attachments" className="cursor-pointer">Archivos</TabsTrigger>
          <TabsTrigger value="infra" className="cursor-pointer">Infraestructura</TabsTrigger>
          <TabsTrigger value="seo" className="cursor-pointer">SEO</TabsTrigger>
          <TabsTrigger value="security" className="cursor-pointer">Seguridad</TabsTrigger>
          <TabsTrigger value="bitacora" className="cursor-pointer">Bitacora</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ContactInfoTab
            contact={contact}
            deals={deals}
            activities={activities}
            onViewDeals={() => setActiveTab("deals")}
            onViewActivity={() => setActiveTab("activities")}
          />
        </TabsContent>

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
                    <div
                      key={deal.id}
                      className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/deals/${deal.id}`)}
                    >
                      <p className="text-sm font-medium">{deal.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-semibold text-primary">{formatCurrency(deal.value)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                          <Badge
                            variant="outline"
                            style={{ borderColor: deal.stageColor || undefined, color: deal.stageColor || undefined }}
                          >
                            {deal.stageName}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${deal.probability}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                              <Badge
                                variant="outline"
                                className="text-xs text-orange-600 border-orange-600 cursor-pointer"
                                onClick={() => handleCompleteActivity(activity.id)}
                              >
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

        <TabsContent value="payments">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                <div className="text-2xl font-bold">{contact.signedDate ? formatDate(contact.signedDate) : "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Proximo Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contact.nextPaymentDate ? formatDate(contact.nextPaymentDate) : "—"}</div>
              </CardContent>
            </Card>
          </div>
          {deals.length > 0 && (
            <Card className="mb-6">
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
          <SalesHealthCard
            contactId={contact.id}
            salesDataNotes={contact.salesDataNotes}
            inventoryHealth={contact.inventoryHealth}
            funnelTracking={contact.funnelTracking}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab contactId={contact.id} />
        </TabsContent>

        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Archivos y Enlaces</CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentsTab contactId={contact.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infra">
          <InfraestructuraTab contactId={contact.id} initialData={contact.infraData} />
        </TabsContent>

        <TabsContent value="seo">
          <SeoTab contactId={contact.id} initialData={contact.seoData} />
        </TabsContent>

        <TabsContent value="security">
          <SeguridadTab contactId={contact.id} initialData={contact.securityData} />
        </TabsContent>

        <TabsContent value="bitacora">
          <BitacoraTab contactId={contact.id} initialLog={contact.decisionLog} />
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
