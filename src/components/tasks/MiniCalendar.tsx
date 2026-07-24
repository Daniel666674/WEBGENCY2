"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

interface MiniCalendarProps {
  markedDays: Set<number>; // day timestamps (start of day) that have tasks due
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}

export function MiniCalendar({ markedDays, selectedDay, onSelectDay }: MiniCalendarProps) {
  const [cursor, setCursor] = useState(() => new Date());
  const today = startOfDay(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; inMonth: boolean; ts: number }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({ day, inMonth: false, ts: startOfDay(new Date(year, month - 1, day)) });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true, ts: startOfDay(new Date(year, month, day)) });
  }
  while (cells.length % 7 !== 0) {
    const day = cells.length - (startWeekday + daysInMonth) + 1;
    cells.push({ day, inMonth: false, ts: startOfDay(new Date(year, month + 1, day)) });
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold">{MONTH_LABELS[month]} {year}</p>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {DAY_LABELS.map((d) => (
          <span key={d} className="text-[10px] font-medium text-muted-foreground">{d}</span>
        ))}
        {cells.map((c, i) => {
          const isToday = c.ts === today;
          const isSelected = c.ts === selectedDay;
          const hasMark = markedDays.has(c.ts);
          return (
            <button
              key={i}
              onClick={() => onSelectDay(isSelected ? null : c.ts)}
              className={cn(
                "relative h-7 w-7 mx-auto flex items-center justify-center rounded-full text-xs transition-colors cursor-pointer",
                !c.inMonth && "text-muted-foreground/40",
                c.inMonth && !isSelected && "text-foreground hover:bg-muted",
                isToday && !isSelected && "border border-primary",
                isSelected && "bg-primary text-primary-foreground font-semibold"
              )}
            >
              {c.day}
              {hasMark && !isSelected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
