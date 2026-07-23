import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/db";
import { analyticsProperties, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getServiceAccountAuth } from "@/lib/googleAnalytics";

// Live GA4 + GSC pull. Two ways to authenticate, tried in this order:
//   1. A Google SERVICE ACCOUNT (GOOGLE_SERVICE_ACCOUNT_KEY) — preferred for
//      an agency showing a client's numbers: no per-user Google sign-in, no
//      AUTH_ENABLED, just grant the service account read access to the
//      client's GA4 property + Search Console site once.
//   2. Interactive Google OAuth — the logged-in CRM user's own Google token
//      (needs AUTH_ENABLED=true and a Google session).
// Returns { connected: false, reason } with a specific reason otherwise, so
// the UI can tell the user exactly what's missing rather than show fake data.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const config = await db
    .select()
    .from(analyticsProperties)
    .where(eq(analyticsProperties.contactId, id))
    .get();

  if (!config?.ga4PropertyId && !config?.gscSiteUrl) {
    return NextResponse.json({ connected: false, reason: "not_configured" });
  }

  // Resolve a Google auth client — service account first, OAuth as fallback.
  // Typed off the `google` namespace's own auth classes (not the top-level
  // google-auth-library copy) so it stays assignable to the API constructors
  // and avoids the dual-package type mismatch.
  let authClient:
    | NonNullable<ReturnType<typeof getServiceAccountAuth>>
    | InstanceType<typeof google.auth.OAuth2>;
  const serviceAccountAuth = getServiceAccountAuth();
  if (serviceAccountAuth) {
    authClient = serviceAccountAuth;
  } else {
    if (process.env.AUTH_ENABLED !== "true") {
      return NextResponse.json({ connected: false, reason: "auth_disabled" });
    }
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!session || !userId) {
      return NextResponse.json({ connected: false, reason: "not_signed_in" });
    }
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .get();
    if (!account?.refresh_token) {
      return NextResponse.json({ connected: false, reason: "no_google_token" });
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: account.refresh_token });
    authClient = oauth2Client;
  }

  const result: {
    connected: true;
    ga4: { sessions: number; users: number; conversions: number } | null;
    gsc: { clicks: number; impressions: number; avgPosition: number } | null;
  } = { connected: true, ga4: null, gsc: null };

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (config.ga4PropertyId) {
    try {
      const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });
      const report = await analyticsData.properties.runReport({
        property: `properties/${config.ga4PropertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }],
        },
      });
      const row = report.data.rows?.[0]?.metricValues;
      result.ga4 = {
        sessions: Number(row?.[0]?.value ?? 0),
        users: Number(row?.[1]?.value ?? 0),
        conversions: Number(row?.[2]?.value ?? 0),
      };
    } catch (e) {
      return NextResponse.json({
        connected: false,
        reason: "ga4_error",
        detail: e instanceof Error ? e.message : "Unknown",
      });
    }
  }

  if (config.gscSiteUrl) {
    try {
      const searchConsole = google.searchconsole({ version: "v1", auth: authClient });
      const report = await searchConsole.searchanalytics.query({
        siteUrl: config.gscSiteUrl,
        requestBody: { startDate, endDate, dimensions: [] },
      });
      const row = report.data.rows?.[0];
      result.gsc = {
        clicks: row?.clicks ?? 0,
        impressions: row?.impressions ?? 0,
        avgPosition: row?.position ?? 0,
      };
    } catch (e) {
      return NextResponse.json({
        connected: false,
        reason: "gsc_error",
        detail: e instanceof Error ? e.message : "Unknown",
      });
    }
  }

  return NextResponse.json(result);
}
