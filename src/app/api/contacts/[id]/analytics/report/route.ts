import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/db";
import { analyticsProperties, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

// Live GA4 + GSC pull. Returns { connected: false, reason } until:
//   1. AUTH_ENABLED=true and a real Google session exists, and
//   2. the client's GA4 property ID / GSC site URL are configured below.
// This is intentionally honest rather than showing placeholder numbers —
// wire-compatible now, goes live the moment Google OAuth is turned on.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (process.env.AUTH_ENABLED !== "true") {
    return NextResponse.json({ connected: false, reason: "auth_disabled" });
  }

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!session || !userId) {
    return NextResponse.json({ connected: false, reason: "not_signed_in" });
  }

  const config = db
    .select()
    .from(analyticsProperties)
    .where(eq(analyticsProperties.contactId, id))
    .get();

  if (!config?.ga4PropertyId && !config?.gscSiteUrl) {
    return NextResponse.json({ connected: false, reason: "not_configured" });
  }

  const account = db
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

  const result: {
    connected: true;
    ga4: { sessions: number; users: number; conversions: number } | null;
    gsc: { clicks: number; impressions: number; avgPosition: number } | null;
  } = { connected: true, ga4: null, gsc: null };

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (config.ga4PropertyId) {
    try {
      const analyticsData = google.analyticsdata({ version: "v1beta", auth: oauth2Client });
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
      const searchConsole = google.searchconsole({ version: "v1", auth: oauth2Client });
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
