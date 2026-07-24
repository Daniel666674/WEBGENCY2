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
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { cleanPhoneForWhatsApp, CLIENT_STATUS_CONFIG, SOURCE_LABELS } from "@/lib/constants";
import type { Temperature, LeadSource, ClientStatus } from "@/types";

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
  };
  onEdit: () => void;
  onDelete: () => void;
  onRegister: () => void;
}

export function ContactDetailHeader({ contact, onEdit, onDelete, onRegister }: ContactDetailHeaderProps) {
  const router = useRouter();
  const statusConfig = CLIENT_STATUS_CONFIG[(contact.clientStatus || "prospect") as ClientStatus];

  return (
    <div className="space-y-4">
      {/* Top bar: back + desktop actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.push("/contacts")} className="cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="hidden sm:flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="cursor-pointer">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="cursor-pointer text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </div>
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg border cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
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
            Score {contact.score}/100 · {SOURCE_LABELS[contact.source as LeadSource] || contact.source}
            {contact.company && <> · {contact.company}</>}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs hover:bg-muted transition-colors">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs hover:bg-muted transition-colors">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {contact.email}
              </a>
            )}
            {contact.siteUrl && (
              <a href={contact.siteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs hover:bg-muted transition-colors">
                <Globe className="h-3 w-3 text-muted-foreground" /> Sitio web
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}
            {contact.mockupUrl && (
              <a href={contact.mockupUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs hover:bg-muted transition-colors">
                <Globe className="h-3 w-3 text-primary" /> Mockup
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile hero: centered */}
      <div className="sm:hidden flex flex-col items-center gap-3 pt-2">
        <div className="relative">
          <ContactAvatar name={contact.name} size="xl" />
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
        </div>
        <Badge
          style={{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
            borderColor: `${statusConfig.color}40`,
          }}
        >
          {statusConfig.label}
        </Badge>
        <div className="text-center">
          <h1 className="text-xl font-bold">{contact.name}</h1>
          {contact.email && <p className="text-sm text-muted-foreground mt-0.5">{contact.email}</p>}
          {contact.company && <p className="text-xs text-muted-foreground">{contact.company}</p>}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge temperature={contact.temperature as Temperature} size="sm" />
          <span className="text-sm font-semibold">{contact.score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Quick actions: 5-col grid on mobile, row on desktop */}
      <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-row sm:gap-2">
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
        <QuickAction
          onClick={onRegister}
          icon={<Calendar className="h-4 w-4" />}
          label="Registrar"
          color="text-foreground"
        />
        <QuickAction
          onClick={onEdit}
          icon={<Pencil className="h-4 w-4" />}
          label="Editar"
          color="text-muted-foreground"
          className="sm:hidden"
        />
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
  className = "",
}: {
  href?: string;
  target?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  disabled?: boolean;
  className?: string;
}) {
  const base = `flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-3 sm:py-1.5 sm:px-3 rounded-xl border bg-card text-xs font-medium transition-colors ${color} ${disabled ? "opacity-40 pointer-events-none" : "hover:bg-muted cursor-pointer"} ${className}`.trim();

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
