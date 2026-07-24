import { db } from "@/db";
import { contacts, deals, activities, pipelineStages, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ContactDetailClient } from "@/components/contacts/ContactDetail";
import { parseContactJsonFields } from "@/lib/contactJsonFields";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rawContact = await db.select().from(contacts).where(eq(contacts.id, id)).get();
  if (!rawContact) notFound();
  const contact = parseContactJsonFields(rawContact);

  const contactDeals = await db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stageId: deals.stageId,
      probability: deals.probability,
      createdAt: deals.createdAt,
      stageName: pipelineStages.name,
      stageColor: pipelineStages.color,
    })
    .from(deals)
    .leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
    .where(eq(deals.contactId, id))
    .all();

  const contactActivities = await db
    .select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      scheduledAt: activities.scheduledAt,
      completedAt: activities.completedAt,
      createdAt: activities.createdAt,
      assignedUserName: users.name,
      assignedUserColor: users.color,
    })
    .from(activities)
    .leftJoin(users, eq(activities.assignedUserId, users.id))
    .where(eq(activities.contactId, id))
    .orderBy(desc(activities.createdAt))
    .all();

  return (
    <ContactDetailClient
      contact={contact as Parameters<typeof ContactDetailClient>[0]["contact"]}
      deals={contactDeals as Parameters<typeof ContactDetailClient>[0]["deals"]}
      activities={contactActivities as Parameters<typeof ContactDetailClient>[0]["activities"]}
    />
  );
}
