import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { NotificationChecker } from "@/components/shared/NotificationChecker";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { UserProvider } from "@/context/UserContext";
import { GlitterOverlay } from "@/components/user/GlitterOverlay";
import { HersThemeApplier } from "@/components/user/HersThemeApplier";
import { ThemeEngine } from "@/components/shared/ThemeEngine";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ThemeEngine />
      <HersThemeApplier />
      <GlitterOverlay />
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <Header />
        <AlertBanner />
        <main className="flex-1 p-4 md:p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
      <NotificationChecker />
    </UserProvider>
  );
}
