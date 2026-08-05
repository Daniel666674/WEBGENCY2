import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { uniqueSlug } from "@/lib/demo/slug";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  if (!source) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const newId = crypto.randomUUID();
  const title = `${source.title} (copia)`;
  const slug = await uniqueSlug(title, newId);
  const now = new Date();

  const result = await db
    .insert(demoPages)
    .values({
      id: newId,
      contactId: source.contactId,
      title,
      slug,
      template: source.template,
      config: source.config,
      // A duplicate is always a fresh draft — never inherits publish state
      // or the published snapshot, so it can't accidentally go live.
      publishedConfig: null,
      published: false,
      publishedAt: null,
      version: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  await persistNow();
  await logAudit(request, "create", "demo", result.id, { title: result.title, duplicatedFrom: id });
  return NextResponse.json(result, { status: 201 });
}
