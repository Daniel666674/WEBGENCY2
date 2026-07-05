"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Heart, X } from "lucide-react";

export function HersWelcomePopup() {
  const { activeUser } = useUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (activeUser?.isHers) setOpen(true);
  }, [activeUser?.isHers]);

  function close() {
    setOpen(false);
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
          Hola mi vida preciosa, solo pasaba a decirte que te extraño mucho y espero que hoy te sientas un poquito mejor 

          Nunca olvides que eres la mejor parte de mi vida y que estoy muy orgulloso de ti. 

          Descansa mucho por que cuando nos veamos te debo un monton de besitos y abrazos para hacerte sentir mejor 

          Te amo muchisimo 
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
