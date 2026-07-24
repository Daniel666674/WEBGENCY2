"use client";

import Link from "next/link";
import { ExternalLink, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_STYLE, STATUS_STYLE, parseTags, type ArsenalItem } from "@/lib/arsenalConfig";
import { cn } from "@/lib/utils";

export function ArsenalCard({ item }: { item: ArsenalItem }) {
  const catStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE["Tool"];
  const statusStyle = STATUS_STYLE[item.status] ?? STATUS_STYLE["active"];
  const tags = parseTags(item.tags);

  return (
    <Link href={`/arsenal/${item.id}`}>
      <Card className="h-full hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group">
        <CardContent className="pt-5 pb-4 px-5 flex flex-col gap-3 h-full">
          {/* Icon + badges row */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-3xl leading-none select-none">{item.icon ?? "🔧"}</span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", catStyle.badge)}>
                {item.category}
              </span>
              <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", statusStyle.badge)}>
                {statusStyle.label}
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="font-bold text-base leading-snug group-hover:text-primary transition-colors">{item.name}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {tags.slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {t}
                </span>
              ))}
              {tags.length > 4 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Footer: cost + url */}
          {(item.costCents || item.url) && (
            <div className="flex items-center gap-3 pt-1 border-t border-border text-xs text-muted-foreground">
              {item.costCents && (
                <span className="flex items-center gap-0.5">
                  <DollarSign className="h-3 w-3" />
                  {(item.costCents / 100).toFixed(0)}/mo
                </span>
              )}
              {item.url && (
                <span className="flex items-center gap-0.5 ml-auto">
                  <ExternalLink className="h-3 w-3" /> Link
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
