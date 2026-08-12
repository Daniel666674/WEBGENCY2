import { NextRequest, NextResponse } from "next/server";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { getAutomationsConfig, saveAutomationsConfig, RULE_META } from "@/lib/automations";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireApi("settings");
  if (denied) return denied;

  const config = await getAutomationsConfig();
  return NextResponse.json({ config, rules: RULE_META }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  // Automations write to real records on a schedule — who may arm them is a
  // narrower question than who may read the settings page.
  const denied = await requireApi("settings", { ownerOnly: true });
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const saved = await saveAutomationsConfig(body);
  await logAudit(request, "automations_config_update", "settings", "automations_config", {
    masterEnabled: saved.masterEnabled,
    enabledRules: Object.entries(saved.rules)
      .filter(([, r]) => r.enabled)
      .map(([id]) => id),
  });

  return NextResponse.json({ config: saved });
}
