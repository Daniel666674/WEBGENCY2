import { db, checkpointDb } from "../src/db";
import { contacts } from "../src/db/schema";
import { eq } from "drizzle-orm";
import type {
  InfraData,
  SeoData,
  SecurityData,
  DecisionLogEntry,
  AccountHealth,
  InventoryHealth,
} from "../src/types";

const CONTACT_ID = "a6a99a16-c706-4e18-a031-b913f656d98b"; // ESCENA Bike Shop

const infraData: InfraData = {
  hostingProvider: "Hostinger",
  hostingPlan: "Business Web Hosting (PHP+MySQL, SSL/CDN/malware protection active, daily backups, 50GB disk/600K inodes)",
  domainRegistrar: "Hostinger",
  dnsStatus: null,
  techStack: ["Static HTML/CSS/JS", "PHP (planned backend)", "GitHub Pages (current, migrating off)"],
  accessMap: [],
  deploymentPipeline: "Currently GitHub Pages auto-deploy from main; migrating to GitHub Actions → Hostinger SFTP hybrid",
  thirdPartyIntegrations: ["WhatsApp Business (573107630504)", "Google OAuth (planned)", "GA4 (planned)", "GSC (planned)"],
};

const seoData: SeoData = {
  indexingStatus: "Not yet indexed — domain never actually resolved until now (hardcoded canonical was wrong, pointed at an unregistered domain)",
  sitemapCoverage: { total: 126, indexed: 112, gaps: "14 frame/marco products missing pages entirely" },
  structuredDataCompleteness: "Strong on homepage (BikeStore, WebSite, FAQPage JSON-LD); tienda/armar-bmx pages missing ItemList/HowTo schema",
  ga4Metrics: null,
  gscMetrics: null,
  openContentGaps: [
    "~13% of 126 products have thin/empty spec text",
    "3 products with fully empty spec produce broken meta descriptions",
    "No GA4/GSC verification live yet",
  ],
};

const securityData: SecurityData = {
  authMethod: "GitHub PAT in browser storage (current) → Google OAuth + server-side PHP session (planned)",
  adminAllowlist: [],
  lastSecurityReviewDate: null,
  knownGaps: [
    { description: "No CDN/WAF (Cloudflare recommended, not added)", severity: "medium", dateFound: null },
    { description: "Custom PHP rate limiter — homegrown, no external audit", severity: "medium", dateFound: null },
    { description: "No monitoring/alerting on failed-login/abuse patterns", severity: "medium", dateFound: null },
  ],
  complianceStatus: {
    privacyPolicyPublished: false,
    cookieConsentLive: false,
    applicableLaw: "Colombia Ley 1581 (Habeas Data) — WhatsApp checkout collects names/phone numbers",
  },
  sslExpiry: null,
  lastBackupVerified: null,
  overallSecurityRating: "7/10 for realistic small-business threat model — strong identity layer (Google OAuth) once built, gaps in network-layer DDoS protection and monitoring",
};

const decisionLog: DecisionLogEntry[] = [
  {
    date: "2026-07-11",
    decision: "Chose hybrid (keep GitHub git history + migrate hosting to Hostinger) over full Hostinger-only rebuild",
    reasoning: "Preserves audit trail/rollback, less new code, still gets the Google OAuth security win without a bigger rewrite.",
  },
  {
    date: "2026-07-11",
    decision: "Chose SQLite over MySQL for sessions/rate-limit counters",
    reasoning: "Sufficient at this scale, fewer secrets to manage.",
  },
  {
    date: "2026-07-11",
    decision: "Chose GA4 over a cookie-free analytics alternative per owner preference",
    reasoning: "Direct consequence: cookie consent banner became a hard requirement, not optional.",
  },
  {
    date: "2026-07-11",
    decision: "Scoped OAuth to openid/email/profile/analytics.readonly/webmasters.readonly only",
    reasoning: "Avoids Google's app-verification review process by staying in Testing mode with a short allow-list, keeps the November deadline intact.",
  },
  {
    date: "2026-07-11",
    decision: "Domain bug caught by cross-checking a Hostinger dashboard screenshot against the codebase's hardcoded canonical URLs",
    reasoning: "Real domain is escenabmx.com, code had escenabikeshop.com (never registered) everywhere.",
  },
];

const accountHealth: AccountHealth = {
  engagementLevel: "high (technical owner, fast decision-maker, prefers critical/honest assessment over reassurance)",
  churnRisk: "low",
  currentBlockers: [
    "Waiting on owner to create Google Cloud OAuth project + Client ID",
    "Waiting on Hostinger deploy credentials (API token or SFTP)",
    "Waiting on DNS/domain confirmation",
  ],
  identifiedUpsells: [
    { description: "Read-only stats API connecting ESCENA's backend to this same agency CRM for client reporting", pitched: false },
  ],
};

// inventoryHealth's schema shape is {lowStockCount, outOfStockCount} — actual
// current counts weren't given, only a description of the mechanism, so this
// stays null (accurate: "not a real number yet") rather than fabricating 0/0.
// The descriptive text goes into salesDataNotes instead, where it's still
// visible on the Pagos tab.
const inventoryHealth: InventoryHealth | null = null;

const salesDataNotes =
  "126-product catalog, real-time stock enforcement via `units` field, admin KPIs for low-stock (1-3 units) and out-of-stock counts. " +
  "Sales log system just shipped — manual 'Registrar venta' entry per WhatsApp order since there's no payment gateway; feeds real revenue/order-count/top-product KPIs replacing previously-fake demo numbers.";

const funnelTracking =
  "No conversion tracking yet — WhatsApp checkout has no trackable 'purchase complete' event, needs custom GA4 events on cart-add and 'Pedir por WhatsApp' clicks. Flagged gap, not yet built.";

db.update(contacts)
  .set({
    infraData: JSON.stringify(infraData),
    seoData: JSON.stringify(seoData),
    securityData: JSON.stringify(securityData),
    decisionLog: JSON.stringify(decisionLog),
    accountHealth: JSON.stringify(accountHealth),
    inventoryHealth: inventoryHealth ? JSON.stringify(inventoryHealth) : null,
    salesDataNotes,
    funnelTracking,
    updatedAt: new Date(),
  })
  .where(eq(contacts.id, CONTACT_ID))
  .run();

checkpointDb();
console.log("ESCENA Bike Shop account-depth data populated.");
