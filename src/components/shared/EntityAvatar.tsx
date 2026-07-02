import { cn } from "@/lib/utils";

interface EntityAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-9 h-9 text-sm",
  md: "w-12 h-12 text-lg",
  lg: "w-16 h-16 text-2xl",
};

export function EntityAvatar({ name, size = "md", className }: EntityAvatarProps) {
  const letter = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center font-bold text-white",
        SIZE_MAP[size],
        className
      )}
      style={{
        background: "linear-gradient(135deg, #0d9a8a, #1a3a35)",
      }}
    >
      {letter}
    </div>
  );
}
