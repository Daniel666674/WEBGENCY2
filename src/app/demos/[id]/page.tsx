import { notFound } from "next/navigation";
import { db } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DemoBuilder } from "@/components/demos/DemoBuilder";
import { getTemplate } from "@/lib/demo/templates";
import { validateDemoConfig } from "@/lib/demo/validate";
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

  // A demo with every section removed from its home page is a real, valid
  // state (the user is mid-rebuild) — it must load as-is, not be mistaken
  // for "no config was ever saved" and replaced wholesale. Only fall back to
  // fresh template defaults when the stored JSON is genuinely missing or
  // fails structural validation (corrupt row, pre-validation legacy data).
  let config: DemoConfig;
  try {
    const parsed = JSON.parse(row.config || "{}");
    const result = validateDemoConfig(parsed);
    config = result.ok ? result.config : getTemplate(row.template).defaults();
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
