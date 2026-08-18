import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, activities, crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getNotificationConfig } from "@/lib/notificationConfig";
import { getBusinessProfile } from "@/lib/businessConfig";
import { sendMail } from "@/lib/mailer";
import { timingSafeEqual } from "@/lib/sessionToken";

// Field name mapping: common variations → standard field
const FIELD_MAP: Record<string, string> = {
  // Name
  name: "name",
  nombre: "name",
  full_name: "name",
  fullname: "name",
  first_name: "name",
  nombre_completo: "name",
  // Email
  email: "email",
  correo: "email",
  email_address: "email",
  correo_electronico: "email",
  // Phone
  phone: "phone",
  telefono: "phone",
  phone_number: "phone",
  cel: "phone",
  celular: "phone",
  whatsapp: "phone",
  movil: "phone",
  // Company
  company: "company",
  empresa: "company",
  company_name: "company",
  negocio: "company",
  organizacion: "company",
  // Notes
  notes: "notes",
  notas: "notes",
  message: "notes",
  mensaje: "notes",
  comments: "notes",
  comentarios: "notes",
  descripcion: "notes",
};

function extractFields(
  payload: Record<string, unknown>
): Record<string, string> {
  // Handle Typeform-style nested data
  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : payload;

  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "string" && typeof value !== "number") continue;
    const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, "_");
    const mappedField = FIELD_MAP[normalizedKey];
    if (mappedField && !result[mappedField]) {
      result[mappedField] = String(value).trim();
    }
  }

  // Handle "first_name + last_name" pattern
  if (!result.name) {
    const firstName =
      data.first_name || data.nombre || data.firstName || data.primer_nombre;
    const lastName =
      data.last_name || data.apellido || data.lastName || data.apellidos;
    if (firstName) {
      result.name = [firstName, lastName].filter(Boolean).join(" ").trim();
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  // Auth check: if a webhook secret is stored, require it in the header
  const stored = await db
    .select()
    .from(crmSettings)
    .where(eq(crmSettings.key, "webhook_secret"))
    .get();

  if (stored) {
    const secretHeader = request.headers.get("x-webhook-secret") ?? "";
    if (!secretHeader || !timingSafeEqual(secretHeader, stored.value)) {
      return NextResponse.json(
        { error: "Secret invalido o faltante" },
        { status: 401 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Webhook no configurado — define un webhook_secret en Settings" },
      { status: 403 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const fields = extractFields(payload);

  if (!fields.name) {
    return NextResponse.json(
      {
        error: "Campo 'name' o 'nombre' es requerido",
        received: Object.keys(payload),
        hint: "Campos soportados: name, nombre, full_name, email, correo, phone, telefono, company, empresa, notes, notas, message",
      },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const contact = await db
      .insert(contacts)
      .values({
        name: fields.name,
        email: fields.email || null,
        phone: fields.phone || null,
        company: fields.company || null,
        source: "webhook",
        temperature: "cold",
        score: 0,
        notes: fields.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    // Log activity for the new lead
    await db.insert(activities)
      .values({
        type: "note",
        description: `Lead recibido via webhook${fields.company ? ` (${fields.company})` : ""}`,
        contactId: contact.id,
        createdAt: now,
      })
      .run();

    // A lead that arrives at 11pm shouldn't wait for the 7am digest. Failures
    // here are swallowed on purpose — the lead is already saved, and losing
    // the notification is not a reason to hand the form a 500 and have it
    // retry into a duplicate.
    try {
      const notifications = await getNotificationConfig();
      if (notifications.notifyOnNewLead) {
        const business = await getBusinessProfile();
        await sendMail(
          `Lead nuevo: ${contact.name}`,
          `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;padding:24px;">
            <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0d9a8a;font-weight:600;">${business.name}</p>
            <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">Lead nuevo</h1>
            <p style="margin:0 0 6px;font-size:15px;"><strong>${contact.name}</strong></p>
            ${contact.company ? `<p style="margin:0 0 4px;font-size:14px;color:#374151;">${contact.company}</p>` : ""}
            ${contact.email ? `<p style="margin:0 0 4px;font-size:14px;color:#374151;">${contact.email}</p>` : ""}
            ${contact.phone ? `<p style="margin:0 0 4px;font-size:14px;color:#374151;">${contact.phone}</p>` : ""}
            ${contact.notes ? `<p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">${contact.notes}</p>` : ""}
          </div>`,
          notifications.digestRecipients
        );
      }
    } catch {
      // Notification is best-effort; the lead is what matters.
    }

    return NextResponse.json(
      {
        success: true,
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          source: contact.source,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: `Error al crear contacto: ${error instanceof Error ? error.message : "Unknown"}`,
      },
      { status: 500 }
    );
  }
}
