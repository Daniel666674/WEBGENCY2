"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DealCard } from "./DealCard";
import { formatCurrency } from "@/lib/constants";

interface Deal {
  id: string;
  title: string;
  value: number;
  contactName: string | null;
  contactTemperature: string | null;
  probability: number;
}

interface KanbanColumnProps {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
}

export function KanbanColumn({ id, name, color, deals }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col min-w-[280px] w-[280px] rounded-lg bg-muted/50 transition-all duration-200"
      style={
        isOver
          ? { boxShadow: `0 0 0 2px ${color}, 0 8px 24px ${color}33`, backgroundColor: `${color}0d` }
          : undefined
      }
    >
      <div
        className="flex items-center gap-2 p-3 border-b rounded-t-lg"
        style={{ backgroundColor: `${color}14` }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
        />
        <h3 className="text-sm font-semibold flex-1 truncate">{name}</h3>
        <span
          className="text-xs font-medium rounded-full px-2 py-0.5"
          style={{ color, backgroundColor: `${color}1f` }}
        >
          {deals.length}
        </span>
      </div>

      <div className="p-2 text-xs text-muted-foreground text-center border-b font-medium">
        {formatCurrency(totalValue)}
      </div>

      <SortableContext
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto">
          {deals.map((deal) => (
            <DealCard key={deal.id} {...deal} stageColor={color} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
