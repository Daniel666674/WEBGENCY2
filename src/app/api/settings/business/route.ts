import { NextRequest, NextResponse } from "next/server";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { getBusinessProfile, saveBusinessProfile } from "@/lib/businessConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireApi("settings_negocio");
  if (denied) return denied;

  return NextResponse.json(await getBusinessProfile(), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  const denied = await requireApi("settings_negocio", { ownerOnly: true });
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const saved = await saveBusinessProfile(body);
  await logAudit(request, "business_profile_update", "settings", "business_profile", { name: saved.name });

  return NextResponse.json(saved);
}
