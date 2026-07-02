"use client";

import { LucideIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative rounded-full bg-muted p-4 mb-4">
        <Image
          src="/logo.png"
          alt=""
          width={64}
          height={64}
          className="absolute inset-0 m-auto rounded-full opacity-[0.06]"
        />
        <Icon className="relative h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="cursor-pointer">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
