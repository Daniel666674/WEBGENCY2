/**
 * The one place the automation engine's input is assembled.
 *
 * The cron job and the "simulacro" preview must see identical data, or the
 * preview stops being a preview. Keeping the fetch here means a rule that
 * gains a new dependency gets it in both callers at once.
 */

import { db } from "@/db";
import {
  activities,
  contacts,
  deals,
  demoPages,
  pipelineStages,
  projects,
  projectTasks,
  proposals,
} from "@/db/schema";
import type { AutomationInput } from "@/lib/automationEngine";

export async function loadAutomationInput(): Promise<AutomationInput> {
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

  return {
    contacts: allContacts,
    deals: allDeals,
    activities: allActivities,
    proposals: allProposals,
    projects: allProjects,
    tasks: allTasks,
    stages,
    demos: demos.map((d) => ({ ...d, published: !!d.published })),
    now: new Date(),
  };
}
