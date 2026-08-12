import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals, pipelineStages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Editing the pipeline in place.
 *
 * The existing PUT /api/pipeline could only *replace* the whole stage list,
 * and refused outright when any deal existed — which is every real CRM after
 * week one. So in practice the pipeline was frozen at whatever `/setup`
 * created. These handlers edit stage by stage, and deleting one requires
 * saying where its deals go, so no deal is ever orphaned.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

async function listStages() {
  return db.select().from(pipelineStages).orderBy(asc(pipelineStages.order)).all();
}

export async function GET() {
  const denied = await requireApi("pipeline");
  if (denied) return denied;

  const stages = await listStages();
  const allDeals = await db.select({ stageId: deals.stageId }).from(deals).all();
  const counts = allDeals.reduce<Record<string, number>>((acc, d) => {
    acc[d.stageId] = (acc[d.stageId] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json(
    stages.map((s) => ({ ...s, dealCount: counts[s.id] ?? 0 })),
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  const denied = await requireApi("settings");
  if (denied) return denied;

  let body: { name?: string; color?: string; isWon?: boolean; isLost?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "La etapa necesita un nombre" }, { status: 400 });

  const existing = await listStages();
  if (existing.length >= 20) {
    return NextResponse.json({ error: "Máximo 20 etapas" }, { status: 400 });
  }

  const created = await db
    .insert(pipelineStages)
    .values({
      name: name.slice(0, 60),
      color: HEX.test(body.color ?? "") ? body.color! : "#64748b",
      order: (existing.at(-1)?.order ?? 0) + 1,
      isWon: !!body.isWon,
      isLost: !!body.isLost,
    })
    .returning()
    .get();

  await logAudit(request, "pipeline_stage_create", "pipeline_stage", created.id, { name: created.name });
  return NextResponse.json(created, { status: 201 });
}

/** Bulk in-place update: rename, recolor, reorder, retag won/lost. */
export async function PUT(request: NextRequest) {
  const denied = await requireApi("settings");
  if (denied) return denied;

  let body: { stages?: Array<{ id: string; name: string; color: string; order: number; isWon: boolean; isLost: boolean }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }
  if (!Array.isArray(body.stages) || body.stages.length === 0) {
    return NextResponse.json({ error: "Falta la lista de etapas" }, { status: 400 });
  }

  const known = new Set((await listStages()).map((s) => s.id));
  for (const s of body.stages) {
    if (!known.has(s.id)) continue;
    const name = (s.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Toda etapa necesita un nombre" }, { status: 400 });

    await db
      .update(pipelineStages)
      .set({
        name: name.slice(0, 60),
        color: HEX.test(s.color ?? "") ? s.color : "#64748b",
        order: Number.isFinite(s.order) ? Math.floor(s.order) : 0,
        // A stage cannot be both the win and the loss — won takes precedence.
        isWon: !!s.isWon,
        isLost: s.isWon ? false : !!s.isLost,
      })
      .where(eq(pipelineStages.id, s.id))
      .run();
  }

  await logAudit(request, "pipeline_stage_update", "pipeline_stage", "bulk", { count: body.stages.length });
  return NextResponse.json(await listStages());
}

/** Delete a stage. Any deals in it must be given a new home first. */
export async function DELETE(request: NextRequest) {
  const denied = await requireApi("settings");
  if (denied) return denied;

  const id = request.nextUrl.searchParams.get("id");
  const moveTo = request.nextUrl.searchParams.get("moveTo");
  if (!id) return NextResponse.json({ error: "Falta el id de la etapa" }, { status: 400 });

  const stages = await listStages();
  if (stages.length <= 1) {
    return NextResponse.json({ error: "El pipeline necesita al menos una etapa" }, { status: 400 });
  }
  const stage = stages.find((s) => s.id === id);
  if (!stage) return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });

  const inStage = await db.select({ id: deals.id }).from(deals).where(eq(deals.stageId, id)).all();
  if (inStage.length > 0) {
    if (!moveTo || moveTo === id || !stages.some((s) => s.id === moveTo)) {
      return NextResponse.json(
        { error: `"${stage.name}" tiene ${inStage.length} deal(s). Elegí a qué etapa moverlos.`, dealCount: inStage.length },
        { status: 409 }
      );
    }
    await db.update(deals).set({ stageId: moveTo, updatedAt: new Date() }).where(eq(deals.stageId, id)).run();
  }

  await db.delete(pipelineStages).where(eq(pipelineStages.id, id)).run();
  await logAudit(request, "pipeline_stage_delete", "pipeline_stage", id, {
    name: stage.name,
    movedDeals: inStage.length,
    movedTo: moveTo,
  });

  return NextResponse.json({ ok: true, moved: inStage.length });
}
