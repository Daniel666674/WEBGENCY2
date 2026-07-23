import { db, checkpointDb } from "../src/db";
import { contacts, analyticsProperties } from "../src/db/schema";
import { eq } from "drizzle-orm";
import type { InfraData, SecurityData, AccountHealth, DecisionLogEntry } from "../src/types";

const CONTACT_ID = "a6a99a16-c706-4e18-a031-b913f656d98b"; // ESCENA Bike Shop

const existing = await db.select().from(contacts).where(eq(contacts.id, CONTACT_ID)).get();
if (!existing) throw new Error("ESCENA Bike Shop contact not found");

const currentInfra: InfraData = JSON.parse(existing.infraData!);
const currentSecurity: SecurityData = JSON.parse(existing.securityData!);
const currentHealth: AccountHealth = JSON.parse(existing.accountHealth!);
const currentLog: DecisionLogEntry[] = JSON.parse(existing.decisionLog);

const infraData: InfraData = {
  ...currentInfra,
  techStack: ["Static HTML/CSS/JS", "PHP (still planned — see Seguridad notes on auth)"],
  deploymentPipeline:
    "GitHub Actions → Hostinger FTPS (live). Auto-deploys to escenabmx.com's real docroot on every push to main. No longer GitHub Pages.",
  thirdPartyIntegrations: [
    "WhatsApp Business (573107630504)",
    "Google OAuth (live — admin login identity gate, client-side Google Identity Services)",
    "GA4 (live — property 546141145, consent-gated)",
    "GSC (live — wired into admin Analíticas tab)",
  ],
};

const securityData: SecurityData = {
  ...currentSecurity,
  authMethod:
    "Google OAuth identity gate (live, client-side, allow-listed emails) sits in front of admin.html → GitHub PAT in browser storage still used for the actual publish/commit step (server-side PHP session migration, which would remove the PAT entirely, is still planned/not built).",
  complianceStatus: currentSecurity.complianceStatus
    ? { ...currentSecurity.complianceStatus, cookieConsentLive: true }
    : { privacyPolicyPublished: false, cookieConsentLive: true, applicableLaw: "" },
};

const accountHealth: AccountHealth = {
  ...currentHealth,
  currentBlockers: [
    "Two products (Casco TSG Dawn Blanco, Casco TSG Evolution Negro) need a talla added via admin before their pages can republish — validateCatalog() now requires it for the cascos category.",
    'Privacy policy page still not written (cookie banner "leer más" link points at a stub).',
  ],
};

// Condensed to the actual decisions with reasoning behind them, per the
// Bitácora's purpose — not a changelog of every fix from this window.
const newEntries: DecisionLogEntry[] = [
  {
    date: "2026-07-21",
    decision: "Kept internal Categoria/Marca/SKU metadata in JSON-LD for search engines but hid it from the human-visible product page",
    reasoning: "SEO structured data still wants it for search engines; customers don't need to see internal taxonomy — same data, two audiences.",
  },
  {
    date: "2026-07-20",
    decision: "Fixed the 1-year immutable static-asset cache problem with `?v=` cache-busting on logo/script URLs instead of shortening the cache header",
    reasoning: ".htaccess's aggressive caching is otherwise a real performance win worth keeping, so cache-busting per-asset was chosen over weakening the site-wide cache policy.",
  },
  {
    date: "2026-07-20",
    decision: "Escaped product data (name/brand/spec) in storefront card renderers",
    reasoning: "Defense-in-depth — no known exploit, but user-editable admin data was being interpolated unescaped into HTML; the fix was cheap enough not to defer it.",
  },
  {
    date: "2026-07-19",
    decision: "Shipped Admin Google OAuth as a client-side identity gate rather than a full server-side PHP session",
    reasoning: "The full server-side session migration (removing the GitHub PAT from browser storage entirely) is a bigger PHP-backend build that isn't ready yet; the client-side Google Identity Services gate ships the actual security win (allow-listed admin login) now without blocking on that larger rewrite.",
  },
  {
    date: "2026-07-19",
    decision: "Wired real GA4 (property 546141145) + Search Console data into the admin Analiticas tab",
    reasoning: "Replaces hardcoded demo numbers with the client's actual live traffic data.",
  },
  {
    date: "2026-07-19",
    decision: 'Removed the "100% Original" authenticity claim from homepage copy',
    reasoning: "Unverifiable claim with real legal exposure for a small retailer — cut rather than risk it.",
  },
];

const decisionLog = [...newEntries, ...currentLog];

await db.update(contacts)
  .set({
    infraData: JSON.stringify(infraData),
    securityData: JSON.stringify(securityData),
    accountHealth: JSON.stringify(accountHealth),
    decisionLog: JSON.stringify(decisionLog),
    updatedAt: new Date(),
  })
  .where(eq(contacts.id, CONTACT_ID))
  .run();

// Analytics tab (live GA4/GSC connection config — separate from seoData snapshot)
const existingAnalytics = await db
  .select({ id: analyticsProperties.id })
  .from(analyticsProperties)
  .where(eq(analyticsProperties.contactId, CONTACT_ID))
  .get();

const now = new Date();
if (existingAnalytics) {
  await db.update(analyticsProperties)
    .set({ ga4PropertyId: "546141145", gscSiteUrl: "https://escenabmx.com/", updatedAt: now })
    .where(eq(analyticsProperties.contactId, CONTACT_ID))
    .run();
} else {
  await db.insert(analyticsProperties)
    .values({
      contactId: CONTACT_ID,
      ga4PropertyId: "546141145",
      gscSiteUrl: "https://escenabmx.com/",
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

checkpointDb();
console.log("ESCENA Bike Shop updated: infra, seguridad, salud de cuenta, analytics, bitacora.");
