import { db } from "@/db";
import { demoPages } from "@/db/schema";
import { eq } from "drizzle-orm";

export function slugify(s: string): string {
  return (
    (s || "demo")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "demo"
  );
}

/**
 * A readable slug when possible, falling back to something guaranteed unique.
 * Shared by demo creation and demo duplication so both follow the same rule.
 */
export async function uniqueSlug(title: string, seedId: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  for (let i = 0; i < 6; i++) {
    const clash = await db.select({ id: demoPages.id }).from(demoPages).where(eq(demoPages.slug, slug)).get();
    if (!clash) return slug;
    slug = i === 5 ? `${base}-${seedId.slice(0, 8)}` : `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}
