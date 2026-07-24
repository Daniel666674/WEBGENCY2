"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Lock, ArrowRight, CheckCircle, Upload, X } from "lucide-react";

const COLOR_PRESETS = [
  { label: "Teal", value: "#0d9a8a" },
  { label: "Purpura", value: "#a855f7" },
  { label: "Violeta", value: "#7c3aed" },
  { label: "Fucsia", value: "#c026d3" },
  { label: "Rosa", value: "#e879a0" },
  { label: "Azul", value: "#2563eb" },
  { label: "Ambar", value: "#f59e0b" },
];

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <JoinForm />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "radial-gradient(120% 90% at 50% 15%, #2d0a4e 0%, #1a0a35 45%, #0d0720 100%)" }}
    >
      <p className="text-white/60 text-sm">Cargando...</p>
    </div>
  );
}

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [initialName, setInitialName] = useState("Daniela");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [color, setColor] = useState("#a855f7");
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setChecking(false);
      return;
    }
    fetch(`/api/daniela-invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) {
          setInvalid(true);
        } else if (data.user) {
          setInitialName(data.user.name ?? "Daniela");
          setName(data.user.name ?? "");
          setColor(data.user.color ?? "#a855f7");
          setAvatarEmoji(data.user.avatar ?? "");
        } else {
          setName("Daniela");
        }
      })
      .catch(() => setInvalid(true))
      .finally(() => setChecking(false));
  }, [token]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Escribe tu nombre"); return; }
    if (!username.trim()) { setError("Elige un nombre de usuario"); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/setup/daniela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          color,
          avatar: avatarEmoji.trim() || name.trim()[0],
          ...(image ? { image } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal");
      } else {
        setDone(true);
      }
    } catch {
      setError("Error de conexión — inténtalo de nuevo");
    } finally {
      setSaving(false);
    }
  }

  const avatarDisplay = image ? (
    <img src={image} alt="Tu foto" className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
  ) : (
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20"
      style={{ backgroundColor: color }}
    >
      {avatarEmoji || name[0] || "?"}
    </div>
  );

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background: "radial-gradient(120% 90% at 50% 15%, #2d0a4e 0%, #1a0a35 45%, #0d0720 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 40%, rgba(168,85,247,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-8 py-10 shadow-2xl shadow-black/40 flex flex-col items-center gap-7">
          {/* Logo */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-70"
              style={{ backgroundColor: "#a855f7" }}
            />
            <Image src="/logo.png" alt="OLIWAN" width={72} height={72} className="relative rounded-2xl ring-1 ring-white/10" />
          </div>

          {checking ? (
            <p className="text-white/60 text-sm">Validando tu acceso...</p>
          ) : invalid ? (
            <div className="text-center space-y-3">
              <p className="text-white font-semibold text-lg">Link no válido</p>
              <p className="text-white/60 text-sm">
                Este link expiró o ya fue usado. Pídele a Daniel un nuevo link desde Configuración → Usuarios.
              </p>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-purple-400 mx-auto" />
              <div>
                <p className="text-white font-bold text-lg">Listo, {name.split(" ")[0]}!</p>
                <p className="text-white/60 text-sm mt-1">Tu acceso está configurado.</p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
                style={{ backgroundColor: "#a855f7" }}
              >
                <Lock className="h-3.5 w-3.5" />
                Ir al login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold text-white">Hola, {initialName.split(" ")[0]} ✨</h1>
                <p className="text-sm" style={{ color: "#c4b5fd" }}>
                  Configura tu acceso a OLIWAN — es tuyo.
                </p>
              </div>

              <div className="w-full h-px bg-white/10" />

              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                {/* Avatar preview + photo upload */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {avatarDisplay}
                    {image && (
                      <button
                        type="button"
                        onClick={() => { setImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-white/70 text-xs hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Upload className="h-3 w-3" /> Foto
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/50 font-medium">Tu nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Daniela García"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Avatar emoji */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/50 font-medium">Iniciales o emoji (opcional)</label>
                  <input
                    type="text"
                    value={avatarEmoji}
                    onChange={(e) => setAvatarEmoji(e.target.value.slice(0, 2))}
                    placeholder="DG"
                    maxLength={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Color */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/50 font-medium">Tu color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setColor(p.value)}
                        title={p.label}
                        className="w-8 h-8 rounded-full border-2 transition-all cursor-pointer"
                        style={{
                          backgroundColor: p.value,
                          borderColor: color === p.value ? "white" : "transparent",
                          transform: color === p.value ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                    <label
                      title="Color libre"
                      className="w-8 h-8 rounded-full border-2 border-white/30 overflow-hidden cursor-pointer relative"
                    >
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="w-full h-px bg-white/10" />

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/50 font-medium">Nombre de usuario (para login)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    autoComplete="username"
                    placeholder="daniela"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/50 font-medium">Contraseña (mínimo 8 caracteres)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/50 font-medium">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer mt-1 disabled:opacity-50"
                  style={{ backgroundColor: "#a855f7" }}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {saving ? "Guardando..." : "Crear mi acceso"}
                  {!saving && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-[11px] text-white/30 mt-6">© {new Date().getFullYear()} OLIWAN Agency</p>
      </div>
    </div>
  );
}
