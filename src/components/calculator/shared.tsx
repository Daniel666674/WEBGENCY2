"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import { Check, ChevronDown, ChevronUp, Info, Minus, Plus } from "lucide-react";

function fmt(cents: number) {
  return formatCurrency(cents);
}

export function SectionHeader({ icon: Icon, title, badge }: { icon: typeof Info; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold">{title}</h2>
      {badge && (
        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </div>
  );
}

export function PlanCard({
  selected, onClick, label, price, priceLabel, sub, features, sourceLabel, accent,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  price: string;
  priceLabel?: string;
  sub?: string;
  features: string[];
  sourceLabel?: string;
  accent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-xl p-3.5 cursor-pointer transition-all select-none relative",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20",
        accent && "border-amber-400/60"
      )}
    >
      {accent && (
        <span className="absolute -top-2 right-3 text-[10px] bg-amber-400 text-white px-2 py-0.5 rounded-full font-semibold">
          Recomendado
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-primary">{price}</p>
          {priceLabel && <p className="text-[10px] text-muted-foreground">{priceLabel}</p>}
        </div>
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {selected && (features.length > 0 || sourceLabel) && (
        <div className="mt-2 pt-2 border-t">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? "Ocultar" : "Ver"} incluido
          </button>
          {open && (
            <>
              <ul className="mt-2 space-y-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {sourceLabel && (
                <p className="mt-2 text-[10px] text-muted-foreground italic flex items-start gap-1">
                  <Info className="h-3 w-3 shrink-0 mt-0.5" /> {sourceLabel}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Compact radio-style row — used for "Sitio 100% personalizado" mode's plan/base
// list, where cards would take up too much of the shared 4-column row.
export function PlanListItem({
  selected, onClick, label, price, priceLabel, sub, icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  price: string;
  priceLabel?: string;
  sub?: string;
  icon?: typeof Info;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-xl p-3 cursor-pointer transition-all select-none flex items-start gap-2.5",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20"
      )}
    >
      <div
        className={cn(
          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          selected ? "border-primary" : "border-muted-foreground/40"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium flex items-center gap-1.5">
            {Icon && <Icon className="h-3.5 w-3.5 text-primary shrink-0" />}
            {label}
          </span>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-primary">{price}</p>
            {priceLabel && <p className="text-[9px] text-muted-foreground">{priceLabel}</p>}
          </div>
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function ModuleRow({
  qty, onToggle, onIncrement, onDecrement, name, description, oneTimeFee, monthlyFee, estimated, unit,
}: {
  qty: number;
  onToggle?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  name: string;
  description: string;
  oneTimeFee: number;
  monthlyFee?: number;
  estimated?: boolean;
  unit?: string;
}) {
  const selected = qty > 0;
  const multiplier = unit ? Math.max(qty, 1) : 1;

  return (
    <div
      onClick={unit ? undefined : onToggle}
      className={cn(
        "border rounded-xl p-3 transition-all select-none flex items-start gap-3",
        !unit && "cursor-pointer",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20"
      )}
    >
      {unit ? (
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onDecrement?.(); }}
            disabled={qty === 0}
            className="w-5 h-5 rounded-md border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors cursor-pointer"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-xs font-semibold">{qty}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onIncrement?.(); }}
            className="w-5 h-5 rounded-md border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            selected ? "bg-primary border-primary" : "border-muted-foreground/40"
          )}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{name}</p>
          <div className="text-right shrink-0">
            {oneTimeFee > 0 ? (
              <p className="text-sm font-bold text-primary">
                {fmt(oneTimeFee * multiplier)}
                {unit && <span className="text-[10px] font-normal text-muted-foreground"> ({fmt(oneTimeFee)}/{unit})</span>}
              </p>
            ) : (
              <p className="text-sm font-bold text-primary">{fmt(monthlyFee ?? 0)}<span className="text-[10px] font-normal text-muted-foreground">/mes</span></p>
            )}
            {oneTimeFee > 0 && monthlyFee !== undefined && monthlyFee > 0 && (
              <p className="text-[10px] text-muted-foreground">+ {fmt(monthlyFee * multiplier)}/mes</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {estimated && (
          <span className="inline-block mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Precio estimado
          </span>
        )}
      </div>
    </div>
  );
}

export function QuantityCard({
  label, description, qty, unitPrice, onIncrement, onDecrement,
}: {
  label: string;
  description: string;
  qty: number;
  unitPrice: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="border rounded-xl p-3.5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{fmt(unitPrice)} c/u</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onDecrement}
          disabled={qty === 0}
          className="w-7 h-7 rounded-md border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors cursor-pointer"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-bold">{qty}</span>
        <button
          onClick={onIncrement}
          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ToggleCard({
  checked, onChange, label, description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <div
      onClick={onChange}
      className={cn(
        "border rounded-xl p-3 cursor-pointer transition-all select-none flex items-start gap-3",
        checked ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/20"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          checked ? "bg-primary border-primary" : "border-muted-foreground/40"
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function SummaryLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-2", muted && "opacity-60")}>
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      <span className="text-xs font-semibold shrink-0">{value}</span>
    </div>
  );
}

export function Slider({
  label, value, onChange, min = 0, max = 100, suffix = "%", hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium flex items-center gap-1">
          {label}
          {hint && (
            <span className="text-muted-foreground" title={hint}>
              <Info className="h-3 w-3" />
            </span>
          )}
        </label>
        <span className="text-xs font-bold text-primary">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
    </div>
  );
}

export function CompactSelect<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full text-sm border rounded-lg px-3 py-2 bg-background cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
