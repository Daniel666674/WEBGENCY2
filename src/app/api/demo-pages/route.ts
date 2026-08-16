import { NextRequest, NextResponse } from "next/server";
import { db, persistNow } from "@/db";
import { demoPages, contacts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { getTemplate } from "@/lib/demo/templates";
import { uniqueSlug } from "@/lib/demo/slug";
import { requireApi } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const contactId = new URL(request.url).searchParams.get("contactId");

  const base = db
    .select({
      id: demoPages.id,
      contactId: demoPages.contactId,
      title: demoPages.title,
      slug: demoPages.slug,
      template: demoPages.template,
      published: demoPages.published,
      views: demoPages.views,
      createdAt: demoPages.createdAt,
      updatedAt: demoPages.updatedAt,
      contactName: contacts.name,
      contactCompany: contacts.company,
    })
    .from(demoPages)
    .leftJoin(contacts, eq(demoPages.contactId, contacts.id));

  const rows = contactId
    ? await base.where(eq(demoPages.contactId, contactId)).orderBy(desc(demoPages.updatedAt)).all()
    : await base.orderBy(desc(demoPages.updatedAt)).all();

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const denied = await requireApi("demos");
  if (denied) return denied;

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

  const id = crypto.randomUUID();
  const slug = await uniqueSlug(title, id);

  const now = new Date();
  const result = await db
    .insert(demoPages)
    .values({
      id,
      contactId: contactId || null,
      title: title || "Nuevo Demo",
      slug,
      template: tpl.id,
      config: JSON.stringify(config),
      published: false,
      version: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  await persistNow();
  await logAudit(request, "create", "demo", result.id, { title: result.title });
  return NextResponse.json({ ...result, config }, { status: 201 });
}
