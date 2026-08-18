import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userAppearance } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireApi, currentApiUser } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import {
  DEFAULT_APPEARANCE,
  validateAppearance,
  type UserAppearance,
} from "@/lib/appearance";

export const dynamic = "force-dynamic";

async function getUserId(request: NextRequest): Promise<string | null> {
  const user = await currentApiUser();
  if (user?.id) return user.id;

  // Legacy mode: derive a stable ID from the login-as cookie so each
  // persona gets their own appearance even without OAuth user rows.
  const loginAs = request.cookies.get("oliwan-login-as")?.value;
  return loginAs === "hers" ? "__legacy_hers" : "__legacy_his";
}

/**
 * GET — read the calling user's appearance config.
 *
 * Falls back to the org-wide `theme_config` in crm_settings (for backward
 * compat with the old global theme), then to the compiled defaults.
 */
export async function GET(request: NextRequest) {
  const denied = await requireApi();
  if (denied) return denied;

  const userId = await getUserId(request);
  if (!userId) return NextResponse.json(DEFAULT_APPEARANCE);

  try {
    const row = await db
      .select()
      .from(userAppearance)
      .where(eq(userAppearance.userId, userId))
      .get();

    if (!row) {
      return NextResponse.json(DEFAULT_APPEARANCE, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const stored = JSON.parse(row.config) as Partial<UserAppearance>;
    const merged: UserAppearance = {
      ...DEFAULT_APPEARANCE,
      ...stored,
      colorTokens: stored.colorTokens
        ? {
            light: {
              ...DEFAULT_APPEARANCE.colorTokens.light,
              ...stored.colorTokens.light,
              backgrounds: { ...DEFAULT_APPEARANCE.colorTokens.light.backgrounds, ...stored.colorTokens?.light?.backgrounds },
              text: { ...DEFAULT_APPEARANCE.colorTokens.light.text, ...stored.colorTokens?.light?.text },
              borders: { ...DEFAULT_APPEARANCE.colorTokens.light.borders, ...stored.colorTokens?.light?.borders },
              states: { ...DEFAULT_APPEARANCE.colorTokens.light.states, ...stored.colorTokens?.light?.states },
              accents: { ...DEFAULT_APPEARANCE.colorTokens.light.accents, ...stored.colorTokens?.light?.accents },
            },
            dark: {
              ...DEFAULT_APPEARANCE.colorTokens.dark,
              ...stored.colorTokens.dark,
              backgrounds: { ...DEFAULT_APPEARANCE.colorTokens.dark.backgrounds, ...stored.colorTokens?.dark?.backgrounds },
              text: { ...DEFAULT_APPEARANCE.colorTokens.dark.text, ...stored.colorTokens?.dark?.text },
              borders: { ...DEFAULT_APPEARANCE.colorTokens.dark.borders, ...stored.colorTokens?.dark?.borders },
              states: { ...DEFAULT_APPEARANCE.colorTokens.dark.states, ...stored.colorTokens?.dark?.states },
              accents: { ...DEFAULT_APPEARANCE.colorTokens.dark.accents, ...stored.colorTokens?.dark?.accents },
            },
          }
        : DEFAULT_APPEARANCE.colorTokens,
      typography: { ...DEFAULT_APPEARANCE.typography, ...stored.typography },
      density: { ...DEFAULT_APPEARANCE.density, ...stored.density },
      form: { ...DEFAULT_APPEARANCE.form, ...stored.form },
      motion: { ...DEFAULT_APPEARANCE.motion, ...stored.motion },
      schedule: { ...DEFAULT_APPEARANCE.schedule, ...stored.schedule },
      customPresets: stored.customPresets ?? [],
    };

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(DEFAULT_APPEARANCE);
  }
}

/**
 * PUT — save the calling user's appearance config.
 *
 * Every user can save their own appearance — no permission check beyond
 * being signed in. The config is validated server-side (hex colors, bounds).
 */
export async function PUT(request: NextRequest) {
  const denied = await requireApi();
  if (denied) return denied;

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "No se pudo identificar el usuario" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const validation = validateAppearance(body);
  if (!validation.ok) {
    return NextResponse.json({ error: "Configuracion invalida", details: validation.errors }, { status: 400 });
  }

  const config = validation.config!;
  const value = JSON.stringify(config);

  try {
    await db
      .insert(userAppearance)
      .values({
        userId,
        config: value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userAppearance.userId,
        set: { config: value, updatedAt: new Date() },
      })
      .run();

    await logAudit(request, "appearance_update", "user_appearance", userId, {
      themeMode: config.themeMode,
      activePresetId: config.activePresetId,
      accentColor: config.accentColor,
    });

    return NextResponse.json({ ok: true, config });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/**
 * DELETE — reset the calling user's appearance to defaults.
 */
export async function DELETE(request: NextRequest) {
  const denied = await requireApi();
  if (denied) return denied;

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "No se pudo identificar el usuario" }, { status: 401 });
  }

  try {
    await db
      .delete(userAppearance)
      .where(eq(userAppearance.userId, userId))
      .run();

    await logAudit(request, "appearance_reset", "user_appearance", userId, {});

    return NextResponse.json({ ok: true, config: DEFAULT_APPEARANCE });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
