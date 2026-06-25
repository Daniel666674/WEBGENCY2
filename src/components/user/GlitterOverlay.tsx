"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  shape: "star" | "dot" | "diamond";
}

const COLORS = [
  "rgba(255, 192, 203, 0.75)", // pink
  "rgba(255, 215, 0, 0.65)",   // gold
  "rgba(232, 121, 160, 0.7)",  // rose
  "rgba(255, 255, 255, 0.8)",  // white
  "rgba(200, 162, 200, 0.65)", // lavender
];

function generateSparkles(count: number): Sparkle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 6,
    duration: 3 + Math.random() * 4,
    shape: (["star", "dot", "diamond"] as const)[Math.floor(Math.random() * 3)],
  }));
}

function StarShape({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </svg>
  );
}

function DiamondShape({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 22,12 12,22 2,12" />
    </svg>
  );
}

export function GlitterOverlay() {
  const { activeUser } = useUser();
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSparkles(generateSparkles(22));
  }, []);

  // Re-randomize sparkle positions periodically so they feel alive
  useEffect(() => {
    if (!activeUser?.isHers || !mounted) return;
    const interval = setInterval(() => {
      setSparkles((prev) =>
        prev.map((s) =>
          Math.random() > 0.6
            ? {
                ...s,
                x: Math.random() * 100,
                y: Math.random() * 100,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
              }
            : s
        )
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [activeUser?.isHers, mounted]);

  if (!mounted || !activeUser?.isHers) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            animation: `glitter-appear ${s.duration}s ${s.delay}s ease-in-out infinite`,
          }}
        >
          {s.shape === "star" ? (
            <StarShape size={s.size} color={s.color} />
          ) : s.shape === "diamond" ? (
            <DiamondShape size={s.size} color={s.color} />
          ) : (
            <div
              style={{
                width: s.size * 0.5,
                height: s.size * 0.5,
                borderRadius: "50%",
                backgroundColor: s.color,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
