import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { attachments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const proposalId = searchParams.get("proposalId");
    const projectId = searchParams.get("projectId");

    const conditions = [];
    if (contactId) conditions.push(eq(attachments.contactId, contactId));
    if (proposalId) conditions.push(eq(attachments.proposalId, proposalId));
    if (projectId) conditions.push(eq(attachments.projectId, projectId));

    const cols = {
      id: attachments.id,
      contactId: attachments.contactId,
      proposalId: attachments.proposalId,
      projectId: attachments.projectId,
      name: attachments.name,
      type: attachments.type,
      url: attachments.url,
      mimeType: attachments.mimeType,
      size: attachments.size,
      createdAt: attachments.createdAt,
    };

    const rows = conditions.length
      ? await db.select(cols).from(attachments).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : await db.select(cols).from(attachments);

    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error fetching attachments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const contactId = form.get("contactId") as string | null;
      const proposalId = form.get("proposalId") as string | null;
      const projectId = form.get("projectId") as string | null;

      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
      if (file.size > 10 * 1024 * 1024)
        return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });

      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const [row] = await db.insert(attachments).values({
        contactId: contactId || undefined,
        proposalId: proposalId || undefined,
        projectId: projectId || undefined,
        name: file.name,
        type: "file",
        fileData: base64,
        mimeType: file.type,
        size: file.size,
      }).returning();

      await persistNow();
      return NextResponse.json(row, { status: 201 });
    }

    // JSON body for links / API endpoints
    const body = await req.json();
    const { contactId, proposalId, projectId, name, type = "link", url } = body;

    if (!name || !url) return NextResponse.json({ error: "name and url required" }, { status: 400 });

    const [row] = await db.insert(attachments).values({
      contactId: contactId || undefined,
      proposalId: proposalId || undefined,
      projectId: projectId || undefined,
      name,
      type,
      url,
    }).returning();

    await persistNow();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error creating attachment" }, { status: 500 });
  }
}
