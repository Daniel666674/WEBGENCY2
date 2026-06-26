import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { proposals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existing = db.select().from(proposals).where(eq(proposals.id, id)).get();
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Reuse existing token or generate new one
    const token = existing.shareToken ?? crypto.randomUUID().replace(/-/g, "");

    if (!existing.shareToken) {
      db.update(proposals)
        .set({ shareToken: token })
        .where(eq(proposals.id, id))
        .run();
    }

    return NextResponse.json({ token });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
