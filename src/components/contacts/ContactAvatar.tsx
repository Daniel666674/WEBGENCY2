import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function ContactAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const dims = size === "xl" ? "h-20 w-20 text-2xl" : size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", dims)}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
