import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/db";
import { analyticsProperties, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getServiceAccountAuth } from "@/lib/googleAnalytics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rawDays = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const days = [7, 28, 30, 90].includes(rawDays) ? rawDays : 30;

  const config = await db
    .select()
    .from(analyticsProperties)
    .where(eq(analyticsProperties.contactId, id))
    .get();

  if (!config?.ga4PropertyId && !config?.gscSiteUrl) {
    return NextResponse.json({ connected: false, reason: "not_configured" });
  }

  type AuthClient =
    | NonNullable<ReturnType<typeof getServiceAccountAuth>>
    | InstanceType<typeof google.auth.OAuth2>;

  let authClient: AuthClient;
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

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  type GscMetricRow = { query?: string; page?: string; country?: string; clicks: number; impressions: number; ctr: number; position: number };
  const result: {
    connected: true;
    days: number;
    summary: {
      gsc: { clicks: number; impressions: number; ctr: number; avgPosition: number } | null;
      ga4: { sessions: number; users: number; conversions: number } | null;
    };
    timeseries: { dates: string[]; gscClicks: number[]; gscImpressions: number[]; gscCtr: number[]; gscPosition: number[] } | null;
    topQueries: GscMetricRow[] | null;
    topPages: GscMetricRow[] | null;
    countries: { country: string; clicks: number }[] | null;
  } = {
    connected: true,
    days,
    summary: { gsc: null, ga4: null },
    timeseries: null,
    topQueries: null,
    topPages: null,
    countries: null,
  };

  if (config.ga4PropertyId) {
    try {
      const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });
      const [summaryReport] = await Promise.all([
        analyticsData.properties.runReport({
          property: `properties/${config.ga4PropertyId}`,
          requestBody: {
            dateRanges: [{ startDate, endDate }],
            metrics: [
              { name: "sessions" },
              { name: "activeUsers" },
              { name: "conversions" },
            ],
          },
        }),
      ]);
      const row = summaryReport.data.rows?.[0]?.metricValues;
      result.summary.ga4 = {
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
      const siteUrl = config.gscSiteUrl;
      const base = { startDate, endDate };

      const [totalsRes, timeseriesRes, queriesRes, pagesRes, countriesRes] = await Promise.all([
        searchConsole.searchanalytics.query({ siteUrl, requestBody: base }),
        searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: { ...base, dimensions: ["date"], rowLimit: 90 },
        }),
        searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: { ...base, dimensions: ["query"], rowLimit: 10 },
        }),
        searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: { ...base, dimensions: ["page"], rowLimit: 10 },
        }),
        searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: { ...base, dimensions: ["country"], rowLimit: 10 },
        }),
      ]);

      const totalsRow = totalsRes.data.rows?.[0];
      result.summary.gsc = {
        clicks: totalsRow?.clicks ?? 0,
        impressions: totalsRow?.impressions ?? 0,
        ctr: (totalsRow?.ctr ?? 0) * 100,
        avgPosition: totalsRow?.position ?? 0,
      };

      const tsRows = timeseriesRes.data.rows ?? [];
      result.timeseries = {
        dates: tsRows.map((r) => r.keys?.[0] ?? ""),
        gscClicks: tsRows.map((r) => r.clicks ?? 0),
        gscImpressions: tsRows.map((r) => r.impressions ?? 0),
        gscCtr: tsRows.map((r) => (r.ctr ?? 0) * 100),
        gscPosition: tsRows.map((r) => r.position ?? 0),
      };

      result.topQueries = (queriesRes.data.rows ?? []).map((r) => ({
        query: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: (r.ctr ?? 0) * 100,
        position: r.position ?? 0,
      }));

      result.topPages = (pagesRes.data.rows ?? []).map((r) => ({
        page: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: (r.ctr ?? 0) * 100,
        position: r.position ?? 0,
      }));

      result.countries = (countriesRes.data.rows ?? []).map((r) => ({
        country: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
      }));
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
