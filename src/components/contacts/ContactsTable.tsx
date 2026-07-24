"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContactForm } from "@/components/contacts/ContactForm";
import { ContactsDesktopTable } from "@/components/contacts/ContactsDesktopTable";
import { ContactsMobileList } from "@/components/contacts/ContactsMobileList";
import { Search, Users, Download, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "sonner";
import { SOURCE_LABELS } from "@/lib/constants";
import type { Contact, Temperature, LeadSource, ClientStatus } from "@/types";

const TEMP_TABS = ["", "hot", "warm", "cold"] as const;
const TEMP_LABELS: Record<(typeof TEMP_TABS)[number], string> = {
  "": "Todos",
  hot: "Caliente",
  warm: "Tibio",
  cold: "Frio",
};
const PAGE_SIZES = [10, 25, 50];

interface ContactsTableProps {
  contacts: Contact[];
  onRefresh: () => void;
}

export function ContactsTable({ contacts, onRefresh }: ContactsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterTemp, setFilterTemp] = useState<Temperature | "">("");
  const [filterSource, setFilterSource] = useState<LeadSource | "">("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, filterTemp, filterSource]);

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No hay contactos"
        description="Agrega tu primer contacto para comenzar a gestionar tu pipeline de ventas."
        actionLabel="Agregar contacto"
        onAction={() => router.push("/contacts?new=true")}
      />
    );
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q);
    const matchesTemp = !filterTemp || c.temperature === filterTemp;
    const matchesSource = !filterSource || c.source === filterSource;
    return matchesSearch && matchesTemp && matchesSource;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const activeExtraFilters = filterSource ? 1 : 0;

  async function handleDelete(contact: Contact) {
    if (!confirm(`Estas seguro de eliminar a ${contact.name}? Esta accion no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Contacto eliminado");
      onRefresh();
    } catch {
      toast.error("Error al eliminar el contacto");
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMP_TABS.map((temp) => (
            <button
              key={temp}
              onClick={() => setFilterTemp(temp)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                filterTemp === temp
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {TEMP_LABELS[temp]}
            </button>
          ))}

          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="cursor-pointer relative">
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Filtros
                  {activeExtraFilters > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {activeExtraFilters}
                    </span>
                  )}
                </Button>
              }
            />
            <PopoverContent align="end" className="w-64">
              <p className="text-xs font-medium text-muted-foreground mb-1">Fuente</p>
              <Select value={filterSource || "all"} onValueChange={(v) => setFilterSource(v === "all" ? "" : (v as LeadSource))}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  {(Object.keys(SOURCE_LABELS) as LeadSource[]).map((src) => (
                    <SelectItem key={src} value={src}>
                      {SOURCE_LABELS[src]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterSource && (
                <button
                  onClick={() => setFilterSource("")}
                  className="text-xs text-primary mt-2 cursor-pointer hover:underline"
                >
                  Limpiar filtro
                </button>
              )}
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={() => window.open("/api/export?type=contacts")} className="cursor-pointer">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      <ContactsDesktopTable contacts={paged} onEdit={setEditingContact} onDelete={handleDelete} />
      <ContactsMobileList contacts={paged} onEdit={setEditingContact} onDelete={handleDelete} />

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          Mostrando {paged.length} de {filtered.length} contactos
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" disabled={safePage <= 1} onClick={() => setPage(1)} className="cursor-pointer">
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground">
              {safePage}
            </span>
            <Button variant="outline" size="icon-sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={safePage >= totalPages} onClick={() => setPage(totalPages)} className="cursor-pointer">
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Select value={String(perPage)} onValueChange={(v) => v && setPerPage(Number(v))}>
            <SelectTrigger size="sm" className="cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} por pagina
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ContactForm
        key={editingContact?.id ?? "new"}
        open={!!editingContact}
        onClose={() => {
          setEditingContact(null);
          onRefresh();
        }}
        initialData={
          editingContact
            ? {
                id: editingContact.id,
                name: editingContact.name,
                email: editingContact.email || "",
                phone: editingContact.phone || "",
                company: editingContact.company || "",
                source: editingContact.source,
                temperature: editingContact.temperature as "cold" | "warm" | "hot",
                notes: editingContact.notes || "",
                mockupUrl: editingContact.mockupUrl || "",
                siteUrl: editingContact.siteUrl || "",
                clientStatus: (editingContact.clientStatus || "prospect") as ClientStatus,
                monthlyPayment: editingContact.monthlyPayment ? String(editingContact.monthlyPayment / 100) : "",
              }
            : undefined
        }
      />
    </div>
  );
}
