import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectDeliverables, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { description, fileUrl, approved, approvedByUserId } = body;

    db.update(projectDeliverables)
      .set({
        ...(description !== undefined && { description }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(approved === true && {
          approvedAt: new Date(),
          approvedByUserId: approvedByUserId || null,
        }),
        ...(approved === false && { approvedAt: null, approvedByUserId: null }),
      })
      .where(eq(projectDeliverables.id, id))
      .run();

    if (approved === true && approvedByUserId) {
      db.insert(auditLogs)
        .values({
          userId: approvedByUserId,
          action: "deliverable_approved",
          resourceType: "deliverable",
          resourceId: id,
          meta: null,
          createdAt: new Date(),
        })
        .run();
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    db.delete(projectDeliverables).where(eq(projectDeliverables.id, id)).run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
