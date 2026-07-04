"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Heart, X } from "lucide-react";

const STORAGE_KEY = "oliwan-hers-welcome-seen";

export function HersWelcomePopup() {
  const { activeUser } = useUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!activeUser?.isHers) return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, [activeUser?.isHers]);

  function close() {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-md w-full rounded-3xl p-8 text-center shadow-2xl border border-white/20"
        style={{ background: "linear-gradient(145deg, #2d1b69, #7c3aed 60%, #c026d3)" }}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
          <Heart className="h-7 w-7 text-pink-200 fill-pink-200" />
        </div>
        <h2 className="text-xl font-bold text-white mb-4">Para ti ♡</h2>
        <p className="text-sm text-purple-100/90 leading-relaxed mb-6 whitespace-pre-wrap text-left">
          Mi vida hermosa, quiero disculparme por todas las molestias que he generado, solo que me da tanto
          miedo perderte y nunca habia sentido algo asi por alguien que no se como reccionar, quiero que sepas
          que te amo demsiado y quiero que toda mi vida de ahora en adelante sea contigo a mi lado, me haces muy
          feliz y solo quiero ser la mejor persona para ti, eres una mujer maravillosa en todas las maneras y
          quiero que seas mi compañera por toda la vida, que siempre seas mi princesa y siempre ser el mejor
          duo, siempre poder darte muchos besotes y siempre mirar esos ojitos hermosos que me enamoran mas cada
          dia.
        </p>
        <button
          onClick={close}
          className="px-6 py-2 rounded-full bg-white text-purple-700 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          ♡
        </button>
      </div>
    </div>
  );
}
