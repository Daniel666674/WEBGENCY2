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
      ga4: { sessions: number; users: number; conversions: number; bounceRate: number; avgSessionDuration: number; newUsers: number } | null;
    };
    timeseries: { dates: string[]; gscClicks: number[]; gscImpressions: number[]; gscCtr: number[]; gscPosition: number[] } | null;
    topQueries: GscMetricRow[] | null;
    topPages: GscMetricRow[] | null;
    countries: { country: string; clicks: number }[] | null;
    ga4Channels: { channel: string; sessions: number }[] | null;
    ga4Devices: { device: string; sessions: number }[] | null;
    ga4Timeseries: { dates: string[]; sessions: number[]; users: number[] } | null;
    ga4TopPages: { page: string; sessions: number; users: number }[] | null;
  } = {
    connected: true,
    days,
    summary: { gsc: null, ga4: null },
    timeseries: null,
    topQueries: null,
    topPages: null,
    countries: null,
    ga4Channels: null,
    ga4Devices: null,
    ga4Timeseries: null,
    ga4TopPages: null,
  };

  if (config.ga4PropertyId) {
    try {
      const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });
      const property = `properties/${config.ga4PropertyId}`;
      const dateRanges = [{ startDate, endDate }];

      const [summaryReport, channelsReport, devicesReport, ga4TsReport, ga4PagesReport] = await Promise.all([
        analyticsData.properties.runReport({
          property,
          requestBody: {
            dateRanges,
            metrics: [
              { name: "sessions" },
              { name: "activeUsers" },
              { name: "conversions" },
              { name: "bounceRate" },
              { name: "averageSessionDuration" },
              { name: "newUsers" },
            ],
          },
        }),
        analyticsData.properties.runReport({
          property,
          requestBody: {
            dateRanges,
            dimensions: [{ name: "defaultChannelGrouping" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: "8",
          },
        }),
        analyticsData.properties.runReport({
          property,
          requestBody: {
            dateRanges,
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          },
        }),
        analyticsData.properties.runReport({
          property,
          requestBody: {
            dateRanges,
            dimensions: [{ name: "date" }],
            metrics: [{ name: "sessions" }, { name: "activeUsers" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
            limit: String(days),
          },
        }),
        analyticsData.properties.runReport({
          property,
          requestBody: {
            dateRanges,
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "sessions" }, { name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: "10",
          },
        }),
      ]);

      const sv = summaryReport.data.rows?.[0]?.metricValues;
      result.summary.ga4 = {
        sessions: Number(sv?.[0]?.value ?? 0),
        users: Number(sv?.[1]?.value ?? 0),
        conversions: Number(sv?.[2]?.value ?? 0),
        bounceRate: Number(sv?.[3]?.value ?? 0) * 100,
        avgSessionDuration: Number(sv?.[4]?.value ?? 0),
        newUsers: Number(sv?.[5]?.value ?? 0),
      };

      result.ga4Channels = (channelsReport.data.rows ?? []).map((r) => ({
        channel: r.dimensionValues?.[0]?.value ?? "",
        sessions: Number(r.metricValues?.[0]?.value ?? 0),
      }));

      result.ga4Devices = (devicesReport.data.rows ?? []).map((r) => ({
        device: r.dimensionValues?.[0]?.value ?? "",
        sessions: Number(r.metricValues?.[0]?.value ?? 0),
      }));

      const tsRows = ga4TsReport.data.rows ?? [];
      result.ga4Timeseries = {
        dates: tsRows.map((r) => {
          const d = r.dimensionValues?.[0]?.value ?? "";
          return d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
        }),
        sessions: tsRows.map((r) => Number(r.metricValues?.[0]?.value ?? 0)),
        users: tsRows.map((r) => Number(r.metricValues?.[1]?.value ?? 0)),
      };

      result.ga4TopPages = (ga4PagesReport.data.rows ?? []).map((r) => ({
        page: r.dimensionValues?.[0]?.value ?? "",
        sessions: Number(r.metricValues?.[0]?.value ?? 0),
        users: Number(r.metricValues?.[1]?.value ?? 0),
      }));
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
          requestBody: { ...base, dimensions: ["query"], rowLimit: 20 },
        }),
        searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: { ...base, dimensions: ["page"], rowLimit: 20 },
        }),
        searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: { ...base, dimensions: ["country"], rowLimit: 15 },
        }),
      ]);

      const totalsRow = totalsRes.data.rows?.[0];
      result.summary.gsc = {
        clicks: totalsRow?.clicks ?? 0,
        impressions: totalsRow?.impressions ?? 0,
        ctr: (totalsRow?.ctr ?? 0) * 100,
        avgPosition: totalsRow?.position ?? 0,
      };

      const gscTsRows = timeseriesRes.data.rows ?? [];
      result.timeseries = {
        dates: gscTsRows.map((r) => r.keys?.[0] ?? ""),
        gscClicks: gscTsRows.map((r) => r.clicks ?? 0),
        gscImpressions: gscTsRows.map((r) => r.impressions ?? 0),
        gscCtr: gscTsRows.map((r) => (r.ctr ?? 0) * 100),
        gscPosition: gscTsRows.map((r) => r.position ?? 0),
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
