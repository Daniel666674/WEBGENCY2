import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { BUILTIN_PRESETS, type CustomPreset } from "@/lib/appearance";

export const dynamic = "force-dynamic";

const KEY = "org_theme_presets";

/**
 * GET — list all available presets (builtin + org-custom).
 * Any signed-in user can read presets.
 */
export async function GET() {
  const denied = await requireApi();
  if (denied) return denied;

  let orgPresets: CustomPreset[] = [];
  try {
    const row = await db
      .select()
      .from(crmSettings)
      .where(eq(crmSettings.key, KEY))
      .get();
    if (row) orgPresets = JSON.parse(row.value) as CustomPreset[];
  } catch { /* no org presets yet */ }

  return NextResponse.json({
    builtin: BUILTIN_PRESETS,
    org: orgPresets,
  }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * PUT — save org-level custom presets (owner only).
 * Replaces the entire org preset list.
 */
export async function PUT(request: NextRequest) {
  const denied = await requireApi("settings", { ownerOnly: true });
  if (denied) return denied;

  let body: { presets: CustomPreset[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  if (!Array.isArray(body.presets)) {
    return NextResponse.json({ error: "presets debe ser un array" }, { status: 400 });
  }

  if (body.presets.length > 50) {
    return NextResponse.json({ error: "Maximo 50 presets organizacionales" }, { status: 400 });
  }

  const value = JSON.stringify(body.presets);
  if (value.length > 131_072) {
    return NextResponse.json({ error: "Presets exceden 128KB" }, { status: 400 });
  }

  await db
    .insert(crmSettings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: crmSettings.key, set: { value } })
    .run();

  await logAudit(request, "org_presets_update", "settings", "org_theme_presets", {
    count: body.presets.length,
  });

  return NextResponse.json({ ok: true });
}
