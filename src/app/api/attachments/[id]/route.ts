import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { attachments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(attachments).where(eq(attachments.id, id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (row.type === "file" && row.fileData) {
      const buffer = Buffer.from(row.fileData, "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": row.mimeType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${row.name}"`,
          "Content-Length": String(buffer.length),
        },
      });
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(attachments).where(eq(attachments.id, id));
    await persistNow();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
