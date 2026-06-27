import Image from "next/image";

interface DogSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DogSpinner({ size = "md", className = "" }: DogSpinnerProps) {
  const px = size === "sm" ? 32 : size === "md" ? 56 : 96;
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Image
        src="/spinner-1.svg"
        alt="Cargando..."
        width={px}
        height={px}
        className="animate-spin"
        style={{ animationDuration: "1.4s", animationTimingFunction: "linear" }}
      />
    </div>
  );
}

export function DogSpinnerPage({ label }: { label?: string }) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
      <Image
        src="/spinner-1.svg"
        alt="Cargando..."
        width={88}
        height={88}
        className="animate-spin"
        style={{ animationDuration: "1.4s", animationTimingFunction: "linear" }}
      />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

export function DogSpinnerInline() {
  return (
    <Image
      src="/spinner-2.svg"
      alt="..."
      width={20}
      height={20}
      className="animate-spin inline-block"
      style={{ animationDuration: "1s", animationTimingFunction: "linear" }}
    />
  );
}
