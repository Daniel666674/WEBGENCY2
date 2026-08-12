import { NextRequest, NextResponse } from "next/server";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { clearGithubConfig, getGithubStatus, saveGithubConfig } from "@/lib/github";

export const dynamic = "force-dynamic";

/**
 * Status only — the token itself never crosses back to the browser.
 *
 * The payment-automation settings do return their secrets to the client as
 * password fields; that pattern is not copied here. A repo-read token is worth
 * more than a webhook signing secret, and "the UI needs to show something" is
 * satisfied by a masked hint.
 */
export async function GET() {
  const denied = await requireApi("settings");
  if (denied) return denied;

  return NextResponse.json(await getGithubStatus(), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  const denied = await requireApi("settings", { ownerOnly: true });
  if (denied) return denied;

  let body: { token?: string; defaultRepo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const status = await saveGithubConfig(body);
  await logAudit(request, "github_config_update", "settings", "github_config", {
    configured: status.configured,
    tokenChanged: !!body.token?.trim(),
  });

  return NextResponse.json(status);
}

export async function DELETE(request: NextRequest) {
  const denied = await requireApi("settings", { ownerOnly: true });
  if (denied) return denied;

  await clearGithubConfig();
  await logAudit(request, "github_config_delete", "settings", "github_config", {});
  return NextResponse.json({ ok: true });
}
