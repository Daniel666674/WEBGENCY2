"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { Heart, X } from "lucide-react";

const PHOTOS = [
  { src: "/hers/hers-1.webp", alt: "Nosotros" },
  { src: "/hers/hers-2.webp", alt: "Nosotros" },
  { src: "/hers/hers-3.webp", alt: "Perrito" },
  { src: "/hers/hers-4.webp", alt: "Los perritos" },
];

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
        className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl p-8 text-center shadow-2xl border border-white/20"
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
        <p className="text-sm text-purple-100/90 leading-relaxed mb-3 whitespace-pre-wrap text-left">
          Buenos dias para la mujer mas hermosa del mundo y la mejor mama perruna que existe! Tambien para los
          dos perritos mas guapos del mundo que hacen muy feliz al amor de mi vida,
        </p>
        <p className="text-sm text-purple-100/90 leading-relaxed mb-6 whitespace-pre-wrap text-left">
          Me encantas mi princesa y no imaginas las ganas que tengo de verte yaaa y darte muchisimos besitos
        </p>
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {PHOTOS.map((photo) => (
            <div key={photo.src} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/25">
              <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="(max-width: 640px) 45vw, 240px" />
            </div>
          ))}
        </div>
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
