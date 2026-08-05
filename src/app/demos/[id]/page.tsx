import { notFound } from "next/navigation";
import { db } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DemoBuilder } from "@/components/demos/DemoBuilder";
import { getTemplate } from "@/lib/demo/templates";
import type { DemoConfig } from "@/lib/demo/types";

export default async function DemoBuilderPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const row = await db.select().from(demoPages).where(eq(demoPages.id, id)).get();
  if (!row) notFound();

  let config: DemoConfig;
  try {
    const parsed = JSON.parse(row.config || "{}");
    config = parsed?.sections?.length ? parsed : getTemplate(row.template).defaults();
  } catch {
    config = getTemplate(row.template).defaults();
  }

  return (
    <DemoBuilder
      demoId={row.id}
      initialConfig={config}
      initialTitle={row.title}
      initialPublished={row.published}
      initialVersion={row.version}
      slug={row.slug}
      isNew={isNew === "1"}
    />
  );
}
