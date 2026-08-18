import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { NotificationChecker } from "@/components/shared/NotificationChecker";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { UserProvider } from "@/context/UserContext";
import { GlitterOverlay } from "@/components/user/GlitterOverlay";
import { HersThemeApplier } from "@/components/user/HersThemeApplier";
// HersWelcomePopup temporarily hidden — re-add <HersWelcomePopup /> below to restore.
// import { HersWelcomePopup } from "@/components/user/HersWelcomePopup";
import { ThemeEngine } from "@/components/shared/ThemeEngine";
import { AppearanceEngine } from "@/components/shared/AppearanceEngine";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PermissionGuard } from "@/components/layout/PermissionGuard";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The real session check for every page under (app).
  //
  // proxy.ts only sees whether a session *cookie exists* — it runs before the
  // database is reachable and cannot tell a real token from an invented one.
  // Without this, anyone could hand-craft that cookie and load the whole CRM.
  if (process.env.AUTH_ENABLED === "true") {
    let session;
    try {
      session = await auth();
    } catch {
      redirect("/login");
    }
    if (!session?.user) redirect("/login");
  }

  return (
    <UserProvider>
      <ThemeEngine />
      <AppearanceEngine />
      <HersThemeApplier />
      <GlitterOverlay />
      {/* <HersWelcomePopup /> — temporarily hidden */}
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <Header />
        <AlertBanner />
        <main className="flex-1 min-w-0 p-4 md:p-6 bg-background overflow-y-auto overflow-x-hidden">
          <PermissionGuard>{children}</PermissionGuard>
        </main>
      </div>
      <NotificationChecker />
    </UserProvider>
  );
}
