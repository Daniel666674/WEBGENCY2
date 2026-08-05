import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoPages, contacts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { getTemplate } from "@/lib/demo/templates";

function slugify(s: string): string {
  return (s || "demo")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "demo";
}

export async function GET(request: NextRequest) {
  const contactId = new URL(request.url).searchParams.get("contactId");

  const base = db
    .select({
      id: demoPages.id,
      contactId: demoPages.contactId,
      title: demoPages.title,
      slug: demoPages.slug,
      template: demoPages.template,
      published: demoPages.published,
      createdAt: demoPages.createdAt,
      updatedAt: demoPages.updatedAt,
      contactName: contacts.name,
    })
    .from(demoPages)
    .leftJoin(contacts, eq(demoPages.contactId, contacts.id));

  const rows = contactId
    ? await base.where(eq(demoPages.contactId, contactId)).orderBy(desc(demoPages.updatedAt)).all()
    : await base.orderBy(desc(demoPages.updatedAt)).all();

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const { title, contactId, template } = body;
  const tpl = getTemplate(template || "editorial");
  const config = tpl.defaults();
  config.brand.name = title || "Nuevo Demo";

  // Unique slug — append a short suffix if the base is taken.
  const baseSlug = slugify(title);
  let slug = baseSlug;
  for (let i = 0; i < 6; i++) {
    const clash = await db.select({ id: demoPages.id }).from(demoPages).where(eq(demoPages.slug, slug)).get();
    if (!clash) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const now = new Date();
  const result = await db
    .insert(demoPages)
    .values({
      contactId: contactId || null,
      title: title || "Nuevo Demo",
      slug,
      template: tpl.id,
      config: JSON.stringify(config),
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  await persistNow();
  await logAudit(request, "create", "demo", result.id, { title: result.title });
  return NextResponse.json({ ...result, config }, { status: 201 });
}
