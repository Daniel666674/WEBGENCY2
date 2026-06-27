import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { NotificationChecker } from "@/components/shared/NotificationChecker";
import { AlertBanner } from "@/components/shared/AlertBanner";
import { UserProvider } from "@/context/UserContext";
import { GlitterOverlay } from "@/components/user/GlitterOverlay";
import { HersThemeApplier } from "@/components/user/HersThemeApplier";
import { ThemeEngine } from "@/components/shared/ThemeEngine";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OLIWAN - Revenue Engine",
  description:
    "CRM de alto impacto para agencias digitales. Pipeline, propuestas, clientes activos y revenue en un solo lugar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OLIWAN",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        <TooltipProvider>
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
            <Toaster />
            <NotificationChecker />
          </UserProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
