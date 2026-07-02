import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth, signIn } from "@/auth";
import { ArrowRight } from "lucide-react";

const DEMO_COOKIE = "oliwan-demo-session";
const DEMO_COOKIE_MAX_AGE = 60 * 60 * 8; // 8h

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const authEnabled = process.env.AUTH_ENABLED === "true";

  if (authEnabled) {
    const session = await auth();
    if (session) redirect(callbackUrl || "/");
  } else {
    const cookieStore = await cookies();
    if (cookieStore.get(DEMO_COOKIE)) redirect(callbackUrl || "/");
  }

  async function enterDemo() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE, "1", { maxAge: DEMO_COOKIE_MAX_AGE, path: "/" });
    redirect(callbackUrl || "/");
  }

  async function enterWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl || "/" });
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 15%, #163832 0%, #0f2420 45%, #081714 100%)",
      }}
    >
      {/* Ambient decoration — oversized, faint, slowly rotating dog silhouette, dead-centered behind the card */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
        <Image
          src="/spinner-1.png"
          alt=""
          width={900}
          height={900}
          className="animate-spin"
          style={{ animationDuration: "60s", animationTimingFunction: "linear" }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 40%, rgba(13,154,138,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-8 py-10 shadow-2xl shadow-black/40 flex flex-col items-center gap-7">
          {/* Logo with glow ring */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-70"
              style={{ backgroundColor: "#0d9a8a", animation: "oliwan-pulse 2.8s ease-in-out infinite" }}
            />
            <Image
              src="/logo.png"
              alt="OLIWAN"
              width={88}
              height={88}
              className="relative rounded-2xl ring-1 ring-white/10"
            />
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">OLIWAN</h1>
            <p className="text-sm font-medium" style={{ color: "#5fd4c2" }}>Revenue Engine</p>
          </div>

          <div className="w-full h-px bg-white/10" />

          <div className="w-full flex flex-col items-center gap-3">
            {authEnabled ? (
              <form action={enterWithGoogle} className="w-full">
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
              <>
                <form action={enterDemo} className="w-full">
                  <button
                    type="submit"
                    className="group w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                    style={{ backgroundColor: "#0d9a8a" }}
                  >
                    Entrar al CRM
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
                <p className="text-[11px] text-white/40 text-center leading-relaxed">
                  Modo demo — el login con Google se activará cuando<br />se configuren las credenciales reales.
                </p>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-white/30 mt-6">
          © {new Date().getFullYear()} OLIWAN Agency
        </p>
      </div>
    </div>
  );
}
