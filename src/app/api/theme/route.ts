import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { DEFAULT_CONFIG, type ThemeConfig } from "@/lib/theme";
import { eq } from "drizzle-orm";
import { requireApi } from "@/lib/apiAuth";

const KEY = "theme_config";

export async function GET() {
  // Read is open to any signed-in user: the theme drives every page's colors,
  // so gating it behind "settings" would leave members with an unstyled app.
  const denied = await requireApi();
  if (denied) return denied;

  try {
    const rows = await db.select().from(crmSettings).where(eq(crmSettings.key, KEY)).all();
    if (rows.length === 0) {
      return NextResponse.json(DEFAULT_CONFIG);
    }
    const stored = JSON.parse(rows[0].value) as Partial<ThemeConfig>;
    return NextResponse.json({
      ...DEFAULT_CONFIG,
      ...stored,
      danielDark: { ...DEFAULT_CONFIG.danielDark, ...stored.danielDark },
    });
  } catch {
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

export async function PUT(req: Request) {
  const denied = await requireApi("settings");
  if (denied) return denied;


  try {
    const body = await req.json() as ThemeConfig;
    const value = JSON.stringify(body);
    await db.insert(crmSettings)
      .values({ key: KEY, value })
      .onConflictDoUpdate({ target: crmSettings.key, set: { value } })
      .run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
