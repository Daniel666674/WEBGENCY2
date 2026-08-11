import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { nbaDismissals } from "@/db/schema";
import { requireApi, currentApiUser } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/**
 * How long each kind of dismissal hides an action.
 *
 * Nothing hides forever. Action ids are derived from the entity, so a
 * permanent dismissal would also silence the same contact going cold again
 * six months from now — precisely when you'd want to hear about it. "Done"
 * is short because if the situation really was resolved, the rule stops
 * matching on its own and the timer never matters.
 */
const HIDE_DAYS: Record<string, number> = {
  done: 7,
  not_relevant: 30,
  snooze: 1,
  snooze_week: 7,
};

export async function POST(request: NextRequest) {
  const denied = await requireApi();
  if (denied) return denied;

  let body: { actionId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const actionId = (body.actionId ?? "").trim();
  if (!actionId) return NextResponse.json({ error: "Falta actionId" }, { status: 400 });

  const reason = body.reason && body.reason in HIDE_DAYS ? body.reason : "done";
  const hiddenUntil = new Date(Date.now() + HIDE_DAYS[reason] * 86_400_000);
  const user = await currentApiUser();

  await db
    .insert(nbaDismissals)
    .values({ actionId, reason, hiddenUntil, userId: user?.id ?? null })
    .run();

  return NextResponse.json({ ok: true, hiddenUntil });
}
