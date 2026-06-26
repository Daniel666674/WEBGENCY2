import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectDeliverables } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const rows = db
      .select()
      .from(projectDeliverables)
      .where(eq(projectDeliverables.milestoneId, id))
      .all();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: milestoneId } = await params;
  try {
    const { description, fileUrl } = await req.json();
    if (!description) return NextResponse.json({ error: "Descripcion requerida" }, { status: 400 });

    const result = db
      .insert(projectDeliverables)
      .values({
        milestoneId,
        description,
        fileUrl: fileUrl || null,
        createdAt: new Date(),
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
