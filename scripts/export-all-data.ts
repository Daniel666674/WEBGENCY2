// Exporta TODOS los datos de clientes de la CRM a archivos locales — para
// respaldo o para migrar a otra plataforma. El export de la UI (/api/export)
// solo cubre contacts y deals; este script cubre todo lo demas (actividades,
// propuestas, proyectos, pagos, demos, analitica) para que nada quede atras.
//
// Uso:
//   npx tsx scripts/export-all-data.ts [carpeta-destino]
//
// Requiere TURSO_DATABASE_URL / TURSO_AUTH_TOKEN en el entorno (.env.local),
// igual que `npm run dev` o `npm run seed`.

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { db } from "@/db";
import {
  contacts,
  deals,
  pipelineStages,
  activities,
  proposals,
  attachments,
  projects,
  projectMilestones,
  projectDeliverables,
  projectTasks,
  payments,
  analyticsProperties,
  demoPages,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const outDir = process.argv[2] || `export-${new Date().toISOString().slice(0, 10)}`;
const excludeContact = process.argv[3]; // Optional: exclude a contact by name (e.g., "Escenabmx")
mkdirSync(outDir, { recursive: true });

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (value instanceof Date) str = value.toISOString();
  else if (typeof value === "object") str = JSON.stringify(value);
  else str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    writeFileSync(join(outDir, filename), "");
    console.log(`  ${filename}: 0 filas`);
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ];
  writeFileSync(join(outDir, filename), "﻿" + lines.join("\n"));
  console.log(`  ${filename}: ${rows.length} filas`);
}

function writeJSON(filename: string, data: unknown) {
  writeFileSync(join(outDir, filename), JSON.stringify(data, null, 2));
}

async function main() {
  console.log(`Exportando a ./${outDir}/ ...\n`);
  if (excludeContact) {
    console.log(`  (Excluyendo contacto: "${excludeContact}")\n`);
  }

  // ── Contactos (incluye campos de agencia que /api/export no trae) ──
  let allContacts = await db.select().from(contacts).all();
  if (excludeContact) {
    allContacts = allContacts.filter((c) => c.name !== excludeContact);
  }

  writeCSV(
    "contacts.csv",
    allContacts.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      source: c.source,
      temperature: c.temperature,
      score: c.score,
      notes: c.notes,
      clientStatus: c.clientStatus,
      mockupUrl: c.mockupUrl,
      siteUrl: c.siteUrl,
      signedDate: c.signedDate,
      monthlyPaymentCents: c.monthlyPayment,
      nextPaymentDate: c.nextPaymentDate,
      lastPaymentRef: c.lastPaymentRef,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  );

  // ── Pipeline y deals ──
  const allStages = await db.select().from(pipelineStages).all();
  writeCSV("pipeline_stages.csv", allStages);

  const stageById = new Map(allStages.map((s) => [s.id, s.name]));
  const contactById = new Map(allContacts.map((c) => [c.id, c.name]));
  const includedContactIds = new Set(allContacts.map((c) => c.id));

  let allDeals = await db.select().from(deals).all();
  if (excludeContact) {
    allDeals = allDeals.filter((d) => includedContactIds.has(d.contactId));
  }
  writeCSV(
    "deals.csv",
    allDeals.map((d) => ({
      id: d.id,
      title: d.title,
      valueCents: d.value,
      stage: stageById.get(d.stageId) || d.stageId,
      contact: contactById.get(d.contactId) || d.contactId,
      contactId: d.contactId,
      probability: d.probability,
      expectedClose: d.expectedClose,
      notes: d.notes,
      createdAt: d.createdAt,
    }))
  );

  // ── Actividades ──
  let allActivities = await db.select().from(activities).all();
  if (excludeContact) {
    allActivities = allActivities.filter((a) => includedContactIds.has(a.contactId));
  }
  writeCSV(
    "activities.csv",
    allActivities.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      contact: contactById.get(a.contactId) || a.contactId,
      contactId: a.contactId,
      dealId: a.dealId,
      scheduledAt: a.scheduledAt,
      completedAt: a.completedAt,
      createdAt: a.createdAt,
    }))
  );

  // ── Propuestas (con campos JSON expandidos — mejor guardarlas como JSON) ──
  let allProposals = await db.select().from(proposals).all();
  if (excludeContact) {
    allProposals = allProposals.filter((p) => includedContactIds.has(p.contactId));
  }
  writeJSON(
    "proposals.json",
    allProposals.map((p) => ({
      ...p,
      contact: contactById.get(p.contactId) || p.contactId,
      features: JSON.parse(p.features || "[]"),
      addOns: JSON.parse(p.addOns || "[]"),
      automations: JSON.parse(p.automations || "[]"),
      deliverables: JSON.parse(p.deliverables || "[]"),
      pricingMeta: JSON.parse(p.pricingMeta || "{}"),
    }))
  );
  console.log(`  proposals.json: ${allProposals.length} filas`);

  // ── Proyectos activos (con hitos, entregables y tareas anidados) ──
  let allProjects = await db.select().from(projects).all();
  if (excludeContact) {
    allProjects = allProjects.filter((p) => !p.clientId || includedContactIds.has(p.clientId));
  }

  const allProjectIds = new Set(allProjects.map((p) => p.id));
  let milestones = await db.select().from(projectMilestones).all();
  let deliverables = await db.select().from(projectDeliverables).all();
  let tasks = await db.select().from(projectTasks).all();

  if (excludeContact) {
    milestones = milestones.filter((m) => allProjectIds.has(m.projectId));
    deliverables = deliverables.filter((d) => allProjectIds.has(d.projectId) || milestones.some((m) => m.id === d.milestoneId));
    tasks = tasks.filter((t) => allProjectIds.has(t.projectId));
  }

  const projectsFull = allProjects.map((proj) => {
    const projMilestones = milestones.filter((m) => m.projectId === proj.id);
    return {
      ...proj,
      client: proj.clientId ? contactById.get(proj.clientId) || proj.clientId : null,
      milestones: projMilestones.map((m) => ({
        ...m,
        deliverables: deliverables.filter((d) => d.milestoneId === m.id),
      })),
      tasks: tasks.filter((t) => t.projectId === proj.id).map((t) => ({
        ...t,
        assignedUserIds: JSON.parse(t.assignedUserIds || "[]"),
        activityLog: JSON.parse(t.activityLog || "[]"),
      })),
    };
  });
  writeJSON("projects.json", projectsFull);
  console.log(`  projects.json: ${allProjects.length} proyectos (con hitos/entregables/tareas anidados)`);

  // ── Pagos ──
  let allPayments = await db.select().from(payments).all();
  if (excludeContact) {
    allPayments = allPayments.filter((p) => includedContactIds.has(p.clientId));
  }
  writeCSV(
    "payments.csv",
    allPayments.map((p) => ({
      id: p.id,
      client: contactById.get(p.clientId) || p.clientId,
      clientId: p.clientId,
      projectId: p.projectId,
      amountCents: p.amountCents,
      paidAt: p.paidAt,
      note: p.note,
      createdAt: p.createdAt,
    }))
  );

  // ── Adjuntos (metadata solamente — sin el contenido base64 de fileData) ──
  let allAttachments = await db.select().from(attachments).all();
  if (excludeContact) {
    allAttachments = allAttachments.filter((a) =>
      !a.contactId || includedContactIds.has(a.contactId)
    );
  }
  writeCSV(
    "attachments.csv",
    allAttachments.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      url: a.url,
      mimeType: a.mimeType,
      sizeBytes: a.size,
      contactId: a.contactId,
      proposalId: a.proposalId,
      projectId: a.projectId,
      createdAt: a.createdAt,
      hasInlineFileData: !!a.fileData,
    }))
  );

  // ── Analitica conectada por cliente ──
  let allAnalytics = await db.select().from(analyticsProperties).all();
  if (excludeContact) {
    allAnalytics = allAnalytics.filter((a) => includedContactIds.has(a.contactId));
  }
  writeCSV(
    "analytics_properties.csv",
    allAnalytics.map((a) => ({
      ...a,
      client: contactById.get(a.contactId) || a.contactId,
    }))
  );

  // ── Demos (metadata + config completo, sin publishedConfig para no duplicar) ──
  let allDemos = await db.select().from(demoPages).all();
  if (excludeContact) {
    allDemos = allDemos.filter((d) => !d.contactId || includedContactIds.has(d.contactId));
  }
  writeJSON(
    "demo_pages.json",
    allDemos.map((d) => ({
      id: d.id,
      contact: d.contactId ? contactById.get(d.contactId) || d.contactId : null,
      title: d.title,
      slug: d.slug,
      template: d.template,
      published: d.published,
      publishedAt: d.publishedAt,
      views: d.views,
      config: JSON.parse(d.config || "{}"),
      createdAt: d.createdAt,
    }))
  );
  console.log(`  demo_pages.json: ${allDemos.length} demos`);

  console.log(`\nListo. Todo en ./${outDir}/`);
  console.log("contacts.csv / deals.csv / activities.csv / payments.csv / attachments.csv /");
  console.log("pipeline_stages.csv / analytics_properties.csv se importan directo en casi");
  console.log("cualquier CRM (HubSpot, Pipedrive, Zoho, Salesforce, monday.com...).");
  console.log("proposals.json / projects.json / demo_pages.json son mas ricos que un CSV");
  console.log("plano (tienen listas y objetos anidados) — sirven como respaldo completo y");
  console.log("como fuente para mapear campos a mano si la CRM destino los necesita.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
