import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals, activities, proposals, projects, projectTasks, pipelineStages, demoPages } from "@/db/schema";
import { requireApi } from "@/lib/apiAuth";
import { computeNextBestActions } from "@/lib/nba";

export const dynamic = "force-dynamic";

/**
 * The ranked "what should I do right now" list.
 *
 * Open to any signed-in user rather than gated behind a section: it is a
 * cross-cutting view of the whole business, and the actions themselves link
 * into pages the permission system already guards.
 */
export async function GET(request: NextRequest) {
  const denied = await requireApi();
  if (denied) return denied;

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 12)));

  const [allContacts, allDeals, allActivities, allProposals, allProjects, allTasks, stages, demos] =
    await Promise.all([
      db.select().from(contacts).all(),
      db.select().from(deals).all(),
      db.select().from(activities).all(),
      db.select().from(proposals).all(),
      db.select().from(projects).all(),
      db.select().from(projectTasks).all(),
      db.select().from(pipelineStages).all(),
      db
        .select({
          id: demoPages.id,
          title: demoPages.title,
          contactId: demoPages.contactId,
          published: demoPages.published,
          publishedAt: demoPages.publishedAt,
        })
        .from(demoPages)
        .all(),
    ]);

  const actions = computeNextBestActions({
    contacts: allContacts,
    deals: allDeals,
    activities: allActivities,
    proposals: allProposals,
    projects: allProjects,
    tasks: allTasks,
    stages,
    demos: demos.map((d) => ({ ...d, published: !!d.published })),
  });

  return NextResponse.json(
    { total: actions.length, actions: actions.slice(0, limit) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
