"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ContactAvatar } from "@/components/contacts/ContactAvatar";
import { ContactRowActions } from "@/components/contacts/ContactRowActions";
import { formatDate, formatRelativeDate, SOURCE_LABELS } from "@/lib/constants";
import type { Contact, Temperature, LeadSource } from "@/types";

interface ContactsDesktopTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export function ContactsDesktopTable({ contacts, onEdit, onDelete }: ContactsDesktopTableProps) {
  const router = useRouter();

  return (
    <div className="hidden md:block rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contacto</TableHead>
            <TableHead className="hidden lg:table-cell">Empresa</TableHead>
            <TableHead className="hidden xl:table-cell">Fuente</TableHead>
            <TableHead>Temperatura</TableHead>
            <TableHead className="hidden lg:table-cell">Score</TableHead>
            <TableHead className="hidden xl:table-cell">Ultima actividad</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                Sin resultados para esta busqueda o filtro.
              </TableCell>
            </TableRow>
          )}
          {contacts.map((contact) => (
            <TableRow
              key={contact.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/contacts/${contact.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <ContactAvatar name={contact.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{contact.email || "Sin email"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{contact.company || "-"}</TableCell>
              <TableCell className="hidden xl:table-cell text-sm">
                {SOURCE_LABELS[contact.source as LeadSource] || contact.source}
              </TableCell>
              <TableCell>
                <StatusBadge temperature={contact.temperature as Temperature} size="sm" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${contact.score}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{contact.score}</span>
                </div>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <p className="text-sm">{formatDate(contact.updatedAt)}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeDate(contact.updatedAt)}</p>
              </TableCell>
              <TableCell className="text-right">
                <ContactRowActions
                  contact={contact}
                  onView={() => router.push(`/contacts/${contact.id}`)}
                  onEdit={() => onEdit(contact)}
                  onDelete={() => onDelete(contact)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
