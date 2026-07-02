"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/constants";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Temperature } from "@/types";

interface DealCardProps {
  id: string;
  title: string;
  value: number;
  contactName: string | null;
  contactTemperature: string | null;
  probability: number;
  stageColor?: string;
  isOverlay?: boolean;
}

export function DealCard({
  id,
  title,
  value,
  contactName,
  contactTemperature,
  probability,
  stageColor,
  isOverlay = false,
}: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderLeft: stageColor ? `3px solid ${stageColor}` : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all",
        isOverlay
          ? "shadow-2xl rotate-3 scale-105 cursor-grabbing"
          : "hover:shadow-md"
      )}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(value)}
          </span>
          {contactTemperature && (
            <StatusBadge
              temperature={contactTemperature as Temperature}
              size="sm"
            />
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{contactName || "Sin contacto"}</span>
          <span>{probability}%</span>
        </div>
      </div>
    </Card>
  );
}
