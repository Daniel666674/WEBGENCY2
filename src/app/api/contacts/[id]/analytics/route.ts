import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsProperties } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = db
    .select()
    .from(analyticsProperties)
    .where(eq(analyticsProperties.contactId, id))
    .get();

  return NextResponse.json(
    row ?? { contactId: id, ga4PropertyId: null, ga4MeasurementId: null, gscSiteUrl: null }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const { ga4PropertyId, ga4MeasurementId, gscSiteUrl } = body;

  const existing = db
    .select({ id: analyticsProperties.id })
    .from(analyticsProperties)
    .where(eq(analyticsProperties.contactId, id))
    .get();

  const now = new Date();

  if (existing) {
    const result = db
      .update(analyticsProperties)
      .set({
        ga4PropertyId: ga4PropertyId || null,
        ga4MeasurementId: ga4MeasurementId || null,
        gscSiteUrl: gscSiteUrl || null,
        updatedAt: now,
      })
      .where(eq(analyticsProperties.contactId, id))
      .returning()
      .get();
    return NextResponse.json(result);
  }

  const result = db
    .insert(analyticsProperties)
    .values({
      contactId: id,
      ga4PropertyId: ga4PropertyId || null,
      ga4MeasurementId: ga4MeasurementId || null,
      gscSiteUrl: gscSiteUrl || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
