"use client";

import { useRef, useState, useEffect } from "react";

const IFRAME_W = 1280;
const IFRAME_H = 800;

export function DemoThumbnail({
  demoId,
  className = "",
}: {
  demoId: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) setScale(width / IFRAME_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-muted ${className}`}>
      <iframe
        src={`/api/demo-pages/${demoId}/preview`}
        title="Preview"
        loading="lazy"
        sandbox="allow-same-origin"
        className="pointer-events-none select-none border-0"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${IFRAME_W}px`,
          height: `${IFRAME_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      )}
    </div>
  );
}
