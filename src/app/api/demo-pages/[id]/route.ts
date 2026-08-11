import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoPages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { validateDemoConfig } from "@/lib/demo/validate";
import { requireApi } from "@/lib/apiAuth";

function parseRow(row: typeof demoPages.$inferSelect) {
  let config = {};
  try { config = JSON.parse(row.config || "{}"); } catch { config = {}; }
  return { ...row, config };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const { id } = await params;
  const row = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(parseRow(row));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const existing = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Optimistic concurrency. The builder round-trips the version it loaded;
  // if the row moved on since then another writer got there first, so we
  // refuse rather than overwrite their work. Clients that don't send a
  // version opt out (used by simple toggles that can't conflict badly).
  if (body.version !== undefined && Number(body.version) !== existing.version) {
    return NextResponse.json(
      {
        error: "Este demo fue modificado en otra pestaña. Recarga para ver los cambios más recientes.",
        code: "version_conflict",
        currentVersion: existing.version,
        current: parseRow(existing),
      },
      { status: 409 }
    );
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.config !== undefined) {
    const result = validateDemoConfig(body.config);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: "invalid_config" }, { status: 400 });
    }
    updateData.config = JSON.stringify(result.config);
  }

  if (body.title !== undefined) updateData.title = String(body.title).slice(0, 200);
  if (body.contactId !== undefined) updateData.contactId = body.contactId || null;
  if (body.template !== undefined) updateData.template = String(body.template).slice(0, 40);

  // Publishing snapshots whatever the draft holds right now into the copy
  // the public route serves. Unpublishing only flips the flag — the snapshot
  // is kept so re-publishing restores the exact same page.
  if (body.publish === true) {
    updateData.publishedConfig = (updateData.config as string | undefined) ?? existing.config;
    updateData.published = true;
    updateData.publishedAt = new Date();
  } else if (body.publish === false) {
    updateData.published = false;
  }

  updateData.version = existing.version + 1;

  // Guarding the UPDATE on the version we validated closes the race between
  // the SELECT above and this write.
  const result = await db
    .update(demoPages)
    .set(updateData)
    .where(and(eq(demoPages.id, id), eq(demoPages.version, existing.version)))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json(
      { error: "Escritura simultánea detectada. Intenta de nuevo.", code: "version_conflict" },
      { status: 409 }
    );
  }

  await persistNow();
  if (body.publish !== undefined) {
    await logAudit(request, body.publish ? "publish" : "unpublish", "demo", id, { title: result.title });
  } else {
    await logAudit(request, "update", "demo", id, { title: result.title });
  }
  return NextResponse.json(parseRow(result));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const { id } = await params;
  const existing = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  await db.delete(demoPages).where(eq(demoPages.id, id)).run();
  await persistNow();
  await logAudit(req, "delete", "demo", id, { title: existing?.title });
  return NextResponse.json({ success: true });
}
