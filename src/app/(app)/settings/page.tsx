import { SettingsHub } from "@/components/settings/SettingsHub";

export default function SettingsPage() {
  const authEnabled = process.env.AUTH_ENABLED === "true";
  return <SettingsHub authEnabled={authEnabled} />;
}
