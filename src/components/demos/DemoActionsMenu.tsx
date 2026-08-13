"use client";

import { MoreVertical, FileEdit, ExternalLink, Copy, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { DemoRow } from "./types";

export function DemoActionsMenu({
  demo, duplicating, onDuplicate, onDelete,
}: {
  demo: DemoRow;
  duplicating: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem render={<a href={`/demos/${demo.id}`} />}>
          <FileEdit className="h-3.5 w-3.5" /> Editar
        </DropdownMenuItem>
        {demo.published && (
          <DropdownMenuItem render={<a href={`/demo/${demo.slug}`} target="_blank" rel="noopener noreferrer" />}>
            <ExternalLink className="h-3.5 w-3.5" /> Ver publicado
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onDuplicate} disabled={duplicating}>
          {duplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />} Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
