"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ContactAvatar } from "./ContactAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Pencil,
  Trash2,
  Calendar,
  Building2,
  Star,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { cleanPhoneForWhatsApp, formatDate, formatCurrency, CLIENT_STATUS_CONFIG, SOURCE_LABELS, ACTIVITY_TYPE_CONFIG } from "@/lib/constants";
import { toast } from "sonner";
import type { Temperature, LeadSource, ClientStatus, ActivityType } from "@/types";

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

interface ContactDetailHeaderProps {
  contact: {
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    source: string;
    temperature: string;
    score: number;
    clientStatus: string;
    mockupUrl: string | null;
    siteUrl: string | null;
    signedDate: number | Date | null;
    createdAt: number | Date;
  };
  deals: Array<{ value: number; probability: number }>;
  activities: Array<{ type: string; createdAt: number | Date }>;
  onEdit: () => void;
  onDelete: () => void;
  onRegister: () => void;
}

export function ContactDetailHeader({ contact, deals, activities, onEdit, onDelete, onRegister }: ContactDetailHeaderProps) {
  const router = useRouter();
  const statusConfig = CLIENT_STATUS_CONFIG[(contact.clientStatus || "prospect") as ClientStatus];

  const infoBarItems = [
    contact.siteUrl && { icon: Globe, label: "Sitio Web", value: stripProtocol(contact.siteUrl), href: contact.siteUrl, external: true },
    contact.phone && { icon: Phone, label: "Teléfono", value: contact.phone, href: `tel:${contact.phone}` },
    contact.email && { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.mockupUrl && { icon: Globe, label: "Mockup", value: stripProtocol(contact.mockupUrl), href: contact.mockupUrl, external: true },
  ].filter(Boolean) as { icon: typeof Globe; label: string; value: string; href: string; external?: boolean }[];

  const pipelineTotal = deals.reduce((s, d) => s + d.value, 0);
  const pipelineProgress = deals.length ? Math.round(deals.reduce((s, d) => s + d.probability, 0) / deals.length) : 0;
  const lastActivity = activities[0];

  const handleCopyEmail = async () => {
    if (!contact.email) return;
    try {
      await navigator.clipboard.writeText(contact.email);
      toast.success("Copiado");
    } catch {
      toast.error("Error al copiar");
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop top bar */}
      <div className="hidden sm:flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contacts")} className="cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="cursor-pointer">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="cursor-pointer text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="sm:hidden flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contacts")} className="cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="px-2 py-1.5 text-sm font-medium text-primary cursor-pointer">
            Editar
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} variant="destructive" className="cursor-pointer">
                <Trash2 className="h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop hero: horizontal */}
      <div className="hidden sm:flex items-start gap-5">
        <ContactAvatar name={contact.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <StatusBadge temperature={contact.temperature as Temperature} />
            <Badge
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
                borderColor: `${statusConfig.color}40`,
              }}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Score: {contact.score}/100 · {SOURCE_LABELS[contact.source as LeadSource] || contact.source}
            {contact.company && <> · {contact.company}</>}
          </p>
        </div>
      </div>

      {/* Mobile hero: left-aligned */}
      <div className="sm:hidden pt-1">
        <div className="relative w-fit">
          <ContactAvatar name={contact.name} size="xl" />
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
        </div>
        <div className="mt-3 space-y-1.5">
          <Badge
            style={{
              backgroundColor: statusConfig.bgColor,
              color: statusConfig.color,
              borderColor: `${statusConfig.color}40`,
            }}
          >
            {statusConfig.label}
          </Badge>
          <h1 className="text-xl font-bold">{contact.name}</h1>
          {contact.email && (
            <button onClick={handleCopyEmail} className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
              <span className="truncate">{contact.email}</span>
              <Copy className="h-3 w-3 shrink-0" />
            </button>
          )}
          {contact.company && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">{contact.score}/100</span>
            <span className="text-muted-foreground">Score</span>
          </div>
        </div>
      </div>

      {/* Info bar: desktop only */}
      {infoBarItems.length > 0 && (
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl border bg-card p-4">
          {infoBarItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="flex items-start gap-2.5 group"
            >
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-primary transition-colors">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.value}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Quick actions: mobile only, 5-col grid */}
      <div className="grid grid-cols-5 gap-2 sm:hidden">
        <QuickAction
          href={contact.phone ? `tel:${contact.phone}` : undefined}
          icon={<Phone className="h-4 w-4" />}
          label="Llamar"
          color="text-green-600"
          disabled={!contact.phone}
        />
        <QuickAction
          href={contact.phone ? `https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}` : undefined}
          target="_blank"
          icon={<MessageCircle className="h-4 w-4" />}
          label="WhatsApp"
          color="text-green-600"
          disabled={!contact.phone}
        />
        <QuickAction
          href={contact.email ? `mailto:${contact.email}` : undefined}
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          color="text-primary"
          disabled={!contact.email}
        />
        <QuickAction onClick={onRegister} icon={<Calendar className="h-4 w-4" />} label="Agendar" color="text-foreground" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl border bg-card text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
            <span>Más</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Pencil className="h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} variant="destructive" className="cursor-pointer">
              <Trash2 className="h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stat tiles: mobile only */}
      <div className="sm:hidden flex divide-x rounded-xl border bg-card overflow-hidden">
        <div className="flex-1 p-3 min-w-0">
          <p className="text-xs text-muted-foreground">Pipeline</p>
          <p className="text-sm font-bold text-primary truncate">{formatCurrency(pipelineTotal)}</p>
          {deals.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${pipelineProgress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{pipelineProgress}%</span>
            </div>
          )}
        </div>
        <div className="flex-1 p-3 min-w-0">
          <p className="text-xs text-muted-foreground">Estado</p>
          <Badge
            className="mt-0.5"
            style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color, borderColor: `${statusConfig.color}40` }}
          >
            {statusConfig.label}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-1 truncate">Desde {formatDate(contact.signedDate ?? contact.createdAt)}</p>
        </div>
        <div className="flex-1 p-3 min-w-0">
          <p className="text-xs text-muted-foreground">Último contacto</p>
          {lastActivity ? (
            <>
              <p className="text-sm font-medium truncate">{formatDate(lastActivity.createdAt)}</p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                {ACTIVITY_TYPE_CONFIG[lastActivity.type as ActivityType]?.label || lastActivity.type}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">Sin actividad</p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  target,
  onClick,
  icon,
  label,
  color,
  disabled,
}: {
  href?: string;
  target?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  disabled?: boolean;
}) {
  const base = `flex flex-col items-center justify-center gap-1 py-3 rounded-xl border bg-card text-xs font-medium transition-colors ${color} ${disabled ? "opacity-40 pointer-events-none" : "hover:bg-muted cursor-pointer"}`;

  if (href) {
    return (
      <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className={base}>
        {icon}
        <span>{label}</span>
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
