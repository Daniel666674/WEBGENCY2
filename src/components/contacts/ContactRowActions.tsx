"use client";

import { MessageCircle, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cleanPhoneForWhatsApp } from "@/lib/constants";
import type { Contact } from "@/types";

interface ContactRowActionsProps {
  contact: Contact;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactRowActions({ contact, onView, onEdit, onDelete }: ContactRowActionsProps) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={!contact.phone}
        className="cursor-pointer disabled:cursor-not-allowed"
        onClick={() =>
          contact.phone &&
          window.open(`https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}`, "_blank")
        }
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-3.5 w-3.5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" className="cursor-pointer" />}>
          <MoreVertical className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView} className="cursor-pointer">
            <Eye className="h-4 w-4" /> Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Pencil className="h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} variant="destructive" className="cursor-pointer">
            <Trash2 className="h-4 w-4" /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
