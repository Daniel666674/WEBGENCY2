#!/usr/bin/env npx tsx
/**
 * Temporary diagnostic: replays the exact queries + derived-prop construction
 * from src/app/(app)/page.tsx against the real Turso data, then JSON.stringifies
 * each Client-Component prop bundle the way React's flight serializer does — so
 * whatever row/shape is triggering "Cannot read properties of undefined
 * (reading 'color')" on the deployed dashboard shows up here with full detail.
 *
 * Runs in CI (GitHub Actions can reach Turso); delete after diagnosis.
 */
import path from "path";
try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {}

async function main() {
  const { db } = await import("../src/db");
  const {
    contacts,
    deals,
    pipelineStages,
    projects,
    projectMilestones,
    activities,
  } = await import("../src/db/schema");
  const { eq, asc, desc } = await import("drizzle-orm");

  const allContacts = await db.select().from(contacts).all();
  const allDeals = await db.select().from(deals).all();
  const stages = await db.select().from(pipelineStages).orderBy(asc(pipelineStages.order)).all();

  console.log("COUNTS:", {
    contacts: allContacts.length,
    deals: allDeals.length,
    stages: stages.length,
  });

  console.log("\n=== RAW STAGES ===");
  for (const s of stages) {
    console.log(JSON.stringify({ id: s.id, name: s.name, order: s.order, color: s.color, isWon: s.isWon, isLost: s.isLost }));
  }

  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      deadline: projects.deadline,
      clientId: projects.clientId,
      clientName: contacts.name,
    })
    .from(projects)
    .leftJoin(contacts, eq(projects.clientId, contacts.id))
    .all();

  console.log("\n=== RAW PROJECTS ===");
  for (const p of allProjects) console.log(JSON.stringify(p));

  const allMilestones = await db
    .select({ id: projectMilestones.id, projectId: projectMilestones.projectId, completedAt: projectMilestones.completedAt })
    .from(projectMilestones)
    .all();

  const recentActivities = await db
    .select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      contactName: contacts.name,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .leftJoin(contacts, eq(activities.contactId, contacts.id))
    .orderBy(desc(activities.createdAt))
    .limit(6)
    .all();

  // Derive every prop bundle exactly as page.tsx does, each in its own
  // try/catch + stringify so the failing one is unambiguous.
  const bundles: Record<string, () => unknown> = {
    pipelineData: () =>
      stages
        .filter((s) => !s.isLost)
        .map((stage) => ({
          name: stage.name,
          count: allDeals.filter((d) => d.stageId === stage.id).length,
          value: allDeals.filter((d) => d.stageId === stage.id).reduce((sum, d) => sum + d.value, 0),
          color: stage.color ?? "#64748b",
        })),
    hotLeads: () =>
      allContacts
        .filter((c) => (c.score >= 50 || c.temperature === "hot") && c.clientStatus !== "active_client")
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((c) => ({
          id: c.id, name: c.name, company: c.company, source: c.source,
          temperature: c.temperature, score: c.score, mockupUrl: c.mockupUrl,
          siteUrl: c.siteUrl, clientStatus: c.clientStatus,
        })),
    activeProjects: () =>
      allProjects
        .filter((p) => p.status !== "launched" && p.status !== "paused")
        .map((p) => {
          const ms = allMilestones.filter((m) => m.projectId === p.id);
          return {
            ...p,
            deadline: p.deadline ? (p.deadline as unknown as Date).getTime?.() ?? Number(p.deadline) : null,
            milestonesTotal: ms.length,
            milestonesCompleted: ms.filter((m) => m.completedAt !== null).length,
          };
        })
        .slice(0, 6),
    recentActivities: () => recentActivities,
  };

  for (const [name, build] of Object.entries(bundles)) {
    try {
      const val = build();
      const json = JSON.stringify(val);
      console.log(`\n[OK] ${name}: ${Array.isArray(val) ? val.length : "?"} items, ${json.length} bytes`);
    } catch (e) {
      console.log(`\n[FAIL] ${name}:`, e instanceof Error ? e.stack : e);
    }
  }

  console.log("\nDONE");
}

main().catch((e) => {
  console.error("DIAGNOSTIC FAILED:", e);
  process.exit(1);
});
