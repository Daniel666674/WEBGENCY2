"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, Lock, Moon, ShieldCheck, Sun, User, BadgeCheck } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Lock, label: "Seguro y encriptado" },
  { icon: ShieldCheck, label: "Datos protegidos" },
  { icon: BadgeCheck, label: "Acceso confiable" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(true);

  function toggle(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
      <button
        type="button"
        onClick={() => toggle(false)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
          !dark ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
        }`}
        aria-label="Tema claro"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => toggle(true)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
          dark ? "bg-[#0d9a8a]/20 text-[#5fd4c2] ring-1 ring-[#0d9a8a]/40" : "text-white/40 hover:text-white/70"
        }`}
        aria-label="Tema oscuro"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}

function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-xl blur-md opacity-70"
        style={{ backgroundColor: "#0d9a8a", animation: "oliwan-pulse 2.8s ease-in-out infinite" }}
      />
      <Image src="/logo.png" alt="OLIWAN" width={size} height={size} className="relative rounded-xl ring-1 ring-white/10" />
    </div>
  );
}

export function LoginScreen({
  authEnabled,
  callbackUrl,
  error,
  onGoogle,
}: {
  authEnabled: boolean;
  callbackUrl: string;
  error?: string;
  onGoogle: () => Promise<void>;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "radial-gradient(120% 90% at 50% 15%, #163832 0%, #0f2420 45%, #081714 100%)",
      }}
    >
      {/* Ambient watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span
          className="select-none whitespace-nowrap font-black tracking-tight opacity-[0.05] text-white"
          style={{ fontSize: "min(22vw, 220px)" }}
        >
          OLIWAN
        </span>
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(60% 40% at 50% 40%, rgba(13,154,138,0.16) 0%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.15]">
        <div className="absolute left-1/2 top-[38%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0d9a8a]" />
        <div className="absolute left-1/2 top-[38%] h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0d9a8a]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-lg font-bold tracking-tight text-white leading-tight">OLIWAN</p>
            <p className="text-[11px] font-semibold tracking-wider" style={{ color: "#5fd4c2" }}>
              REVENUE ENGINE
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Body */}
      <main className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-10 px-6 pb-10 pt-6 md:px-16 md:pb-16 md:pt-4 md:min-h-[calc(100vh-104px)]">
        {/* Left copy — desktop only */}
        <div className="hidden md:flex md:max-w-md flex-col gap-6">
          <div className="space-y-3">
            <h2 className="text-4xl font-black leading-tight tracking-tight text-white">
              IMPULSAMOS
              <br />
              <span style={{ color: "#5fd4c2" }}>TU CRECIMIENTO.</span>
            </h2>
            <p className="text-sm text-white/50 max-w-sm">
              OLIWAN es el motor que transforma tus oportunidades en ingresos reales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-6 rounded-full" style={{ backgroundColor: "#0d9a8a" }} />
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/20" />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-white/40">
                <Icon className="h-3.5 w-3.5" style={{ color: "#5fd4c2" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="relative z-10 w-full md:w-[420px] md:shrink-0 mx-auto">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-6 py-8 sm:px-8 sm:py-10 shadow-2xl shadow-black/40 flex flex-col items-center gap-6">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-70"
                style={{ backgroundColor: "#0d9a8a", animation: "oliwan-pulse 2.8s ease-in-out infinite" }}
              />
              <Image src="/logo.png" alt="OLIWAN" width={84} height={84} className="relative rounded-2xl ring-1 ring-white/10" />
            </div>

            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">Bienvenido de vuelta</h1>
              <p className="text-sm text-white/50">Inicia sesión para continuar en OLIWAN</p>
            </div>

            <div className="w-full flex flex-col items-center gap-3">
              {authEnabled ? (
                <form action={onGoogle} className="w-full">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-white text-black rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                  </button>
                </form>
              ) : (
                <form action="/api/session-login" method="POST" className="w-full flex flex-col gap-4">
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />

                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                      Usuario o correo electrónico
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                      <input
                        type="text"
                        name="username"
                        required
                        autoFocus
                        autoComplete="username"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0d9a8a] focus:border-[#0d9a8a] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        autoComplete="current-password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0d9a8a] focus:border-[#0d9a8a] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-white/50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded accent-[#0d9a8a] cursor-pointer"
                      />
                      Recordarme
                    </label>
                    <span className="font-medium" style={{ color: "#5fd4c2" }}>
                      ¿Olvidaste tu contraseña?
                    </span>
                  </div>

                  {error === "1" && (
                    <p className="text-xs text-red-400 text-center -mb-1">Usuario o contraseña incorrectos</p>
                  )}
                  {error === "config" && (
                    <p className="text-xs text-amber-400 text-center -mb-1">
                      Falta CRM_USERNAME / CRM_PASSWORD / SESSION_SECRET en el servidor
                    </p>
                  )}

                  <button
                    type="submit"
                    className="group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer mt-1"
                    style={{ backgroundColor: "#0d9a8a" }}
                  >
                    Iniciar sesión
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              )}
            </div>

            <div className="hidden md:flex w-full flex-col items-center gap-3 pt-2">
              <div className="w-full h-px bg-white/10" />
              <p className="flex items-center gap-1.5 text-xs text-white/40">
                <Lock className="h-3 w-3" />
                Tu información está{" "}
                <span className="font-semibold" style={{ color: "#5fd4c2" }}>
                  100% protegida
                </span>
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-white/30 mt-6">© {new Date().getFullYear()} OLIWAN Agency</p>
        </div>
      </main>
    </div>
  );
}
