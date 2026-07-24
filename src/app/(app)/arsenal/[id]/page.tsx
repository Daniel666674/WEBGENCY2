import { db } from "@/db";
import { arsenalItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArsenalDetail } from "@/components/arsenal/ArsenalDetail";

export const dynamic = "force-dynamic";

export default async function ArsenalItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.select().from(arsenalItems).where(eq(arsenalItems.id, id)).get();
  if (!item) notFound();

  return (
    <ArsenalDetail
      item={{
        ...item,
        icon: item.icon ?? "🔧",
        description: item.description ?? null,
        url: item.url ?? null,
        tags: item.tags ?? "[]",
        useCases: item.useCases ?? "[]",
        costCents: item.costCents ?? null,
        details: item.details ?? null,
        notes: item.notes ?? null,
      }}
    />
  );
}
