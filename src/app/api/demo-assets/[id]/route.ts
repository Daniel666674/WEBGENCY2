import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoAssets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(demoAssets).where(eq(demoAssets.id, id)).run();
  await persistNow();
  return NextResponse.json({ success: true });
}
