"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

type SparkleAnim = "appear" | "drift" | "twinkle";
type SparkleShape = "star" | "diamond" | "dot" | "cross";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  shape: SparkleShape;
  anim: SparkleAnim;
  driftX: number;
}

const COLORS = [
  "rgba(255, 182, 213, 0.9)",   // hot pink
  "rgba(255, 215, 0, 0.85)",    // gold
  "rgba(232, 121, 160, 0.9)",   // rose
  "rgba(255, 255, 255, 0.95)",  // white
  "rgba(210, 170, 230, 0.85)",  // lavender
  "rgba(255, 200, 220, 0.9)",   // light pink
  "rgba(255, 240, 150, 0.8)",   // light gold
];

const SHAPES: SparkleShape[] = ["star", "diamond", "dot", "cross"];
const ANIMS: SparkleAnim[] = ["appear", "appear", "appear", "drift", "drift", "twinkle"];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function generate(count: number): Sparkle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: rand(4, 22),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: rand(0, 7),
    duration: rand(2.5, 7),
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    anim: ANIMS[Math.floor(Math.random() * ANIMS.length)],
    driftX: rand(-60, 60),
  }));
}

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ filter: `drop-shadow(0 0 ${size * 0.3}px ${color})` }}>
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </svg>
  );
}

function Diamond({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ filter: `drop-shadow(0 0 ${size * 0.25}px ${color})` }}>
      <polygon points="12,1 23,12 12,23 1,12" />
    </svg>
  );
}

function Cross({ size, color }: { size: number; color: string }) {
  const t = size / 3;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ filter: `drop-shadow(0 0 ${size * 0.3}px ${color})` }}>
      <rect x="9" y="2" width="6" height="20" rx="2" />
      <rect x="2" y="9" width="20" height="6" rx="2" />
    </svg>
  );
}

function SparkleEl({ s }: { s: Sparkle }) {
  const animName =
    s.anim === "drift" ? "glitter-drift" :
    s.anim === "twinkle" ? "glitter-twinkle" :
    "glitter-appear";

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${s.x}%`,
    top: `${s.y}%`,
    animation: `${animName} ${s.duration}s ${s.delay}s ease-in-out infinite`,
    ...(s.anim === "drift" ? { "--drift-x": `${s.driftX}px` } as React.CSSProperties : {}),
  };

  const shape =
    s.shape === "star" ? <Star size={s.size} color={s.color} /> :
    s.shape === "diamond" ? <Diamond size={s.size} color={s.color} /> :
    s.shape === "cross" ? <Cross size={s.size} color={s.color} /> :
    <div style={{ width: s.size * 0.55, height: s.size * 0.55, borderRadius: "50%", backgroundColor: s.color, boxShadow: `0 0 ${s.size * 0.4}px ${s.color}` }} />;

  return <div style={style}>{shape}</div>;
}

export function GlitterOverlay() {
  const { activeUser } = useUser();
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSparkles(generate(55));
  }, []);

  useEffect(() => {
    if (!activeUser?.isHers || !mounted) return;
    const id = setInterval(() => {
      setSparkles((prev) =>
        prev.map((s) =>
          Math.random() > 0.55
            ? { ...s, x: Math.random() * 100, y: Math.random() * 100, color: COLORS[Math.floor(Math.random() * COLORS.length)], size: rand(4, 22) }
            : s
        )
      );
    }, 2500);
    return () => clearInterval(id);
  }, [activeUser?.isHers, mounted]);

  if (!mounted || !activeUser?.isHers) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
      {sparkles.map((s) => <SparkleEl key={s.id} s={s} />)}
    </div>
  );
}
