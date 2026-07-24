"use client";

import { useRouter } from "next/navigation";
import { Phone, MessageCircle, Mail, MoreHorizontal, Star, Building2, Eye, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ContactAvatar } from "@/components/contacts/ContactAvatar";
import { formatCurrency, formatRelativeDate, cleanPhoneForWhatsApp, SOURCE_LABELS } from "@/lib/constants";
import type { Contact, Temperature, LeadSource } from "@/types";

interface ContactsMobileListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export function ContactsMobileList({ contacts, onEdit, onDelete }: ContactsMobileListProps) {
  const router = useRouter();

  if (contacts.length === 0) {
    return (
      <p className="md:hidden text-center py-10 text-sm text-muted-foreground">
        Sin resultados para esta busqueda o filtro.
      </p>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="rounded-xl border bg-card p-4 space-y-3 cursor-pointer"
          onClick={() => router.push(`/contacts/${contact.id}`)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ContactAvatar name={contact.name} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{contact.name}</p>
                  <StatusBadge temperature={contact.temperature as Temperature} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground truncate">{contact.email || "Sin email"}</p>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/contacts/${contact.id}`)} className="cursor-pointer">
                    <Eye className="h-4 w-4" /> Ver detalle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(contact)} className="cursor-pointer">
                    <Pencil className="h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(contact)} variant="destructive" className="cursor-pointer">
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {contact.company || SOURCE_LABELS[contact.source as LeadSource] || contact.source}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground font-medium">{contact.score}</span>/100
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-primary">
              {contact.monthlyPayment ? `${formatCurrency(contact.monthlyPayment)}/mes` : ""}
            </span>
            <span className="text-muted-foreground">Actividad {formatRelativeDate(contact.updatedAt)}</span>
          </div>

          <div
            className="flex items-center gap-2 pt-2 border-t text-xs font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={contact.phone ? `tel:${contact.phone}` : undefined}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-green-600 aria-disabled:opacity-40 aria-disabled:pointer-events-none"
              aria-disabled={!contact.phone}
            >
              <Phone className="h-3.5 w-3.5" /> Llamar
            </a>
            <a
              href={contact.phone ? `https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-green-600 aria-disabled:opacity-40 aria-disabled:pointer-events-none"
              aria-disabled={!contact.phone}
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <a
              href={contact.email ? `mailto:${contact.email}` : undefined}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-primary aria-disabled:opacity-40 aria-disabled:pointer-events-none"
              aria-disabled={!contact.email}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
