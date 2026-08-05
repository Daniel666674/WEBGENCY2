import { UserProvider } from "@/context/UserContext";
import { ThemeEngine } from "@/components/shared/ThemeEngine";

/**
 * The builder lives outside the (app) layout on purpose: it needs the whole
 * viewport, and the CRM sidebar's 10px hover strip sits exactly where the
 * builder's own left rail is, so it kept opening over the canvas.
 *
 * UserProvider + ThemeEngine are still mounted so the editor chrome picks up
 * the user's theme — everything else (Sidebar, Header, banners) is dropped.
 * Auth is unaffected: src/proxy.ts matches /demos/* either way.
 */
export default function DemoBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ThemeEngine />
      {children}
    </UserProvider>
  );
}
