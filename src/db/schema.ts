import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const contacts = sqliteTable("contacts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  source: text("source").notNull().default("otro"),
  temperature: text("temperature").notNull().default("cold"),
  score: integer("score").notNull().default(0),
  notes: text("notes"),
  // Agency fields
  mockupUrl: text("mockup_url"),
  siteUrl: text("site_url"),
  signedDate: integer("signed_date", { mode: "timestamp" }),
  monthlyPayment: integer("monthly_payment"),
  clientStatus: text("client_status").notNull().default("prospect"),
  nextPaymentDate: integer("next_payment_date", { mode: "timestamp" }),
  automationsSuspended: integer("automations_suspended").notNull().default(0),
  lastPaymentRef: text("last_payment_ref"),
  // Post-close account depth (JSON-serialized, parsed at the API layer —
  // same convention as proposals.features etc.). All nullable/optional so
  // existing rows and the read path never break.
  infraData: text("infra_data"),
  seoData: text("seo_data"),
  securityData: text("security_data"),
  decisionLog: text("decision_log").notNull().default("[]"),
  accountHealth: text("account_health"),
  inventoryHealth: text("inventory_health"),
  salesDataNotes: text("sales_data_notes"),
  funnelTracking: text("funnel_tracking"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pipelineStages = sqliteTable("pipeline_stages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull().default("#64748b"),
  isWon: integer("is_won", { mode: "boolean" }).notNull().default(false),
  isLost: integer("is_lost", { mode: "boolean" }).notNull().default(false),
});

export const deals = sqliteTable("deals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  value: integer("value").notNull().default(0),
  stageId: text("stage_id")
    .notNull()
    .references(() => pipelineStages.id),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  expectedClose: integer("expected_close", { mode: "timestamp" }),
  probability: integer("probability").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const proposals = sqliteTable("proposals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  planName: text("plan_name").notNull().default("Custom"),
  oneTimeFee: integer("one_time_fee").notNull().default(0),
  monthlyFee: integer("monthly_fee").notNull().default(0),
  features: text("features").notNull().default("[]"),
  addOns: text("add_ons").notNull().default("[]"),
  automations: text("automations").notNull().default("[]"),
  deliverables: text("deliverables").notNull().default("[]"),
  notes: text("notes"),
  pricingMeta: text("pricing_meta").notNull().default("{}"),
  validUntil: integer("valid_until", { mode: "timestamp" }),
  shareToken: text("share_token"),
  viewedAt: integer("viewed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const activities = sqliteTable("activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(),
  description: text("description").notNull(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  dealId: text("deal_id").references(() => deals.id),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  assignedUserId: text("assigned_user_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const attachments = sqliteTable("attachments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text("contact_id").references(() => contacts.id),
  proposalId: text("proposal_id").references(() => proposals.id),
  projectId: text("project_id").references(() => projects.id),
  name: text("name").notNull(),
  // "file" | "link" | "api" | "doc"
  type: text("type").notNull().default("link"),
  url: text("url"),
  fileData: text("file_data"),
  mimeType: text("mime_type"),
  size: integer("size"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  color: text("color").notNull().default("#0d9a8a"),
  isHers: integer("is_hers", { mode: "boolean" }).notNull().default(false),
  avatar: text("avatar"),
  // Auth.js required columns (DrizzleAdapter)
  email: text("email").unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  role: text("role").notNull().default("member"), // "owner" | "member"
  // JSON array of nav-section keys this user can see/use — see
  // NAV_SECTION_KEYS in src/lib/permissions.ts. Ignored for role="owner",
  // who always has full access. Set from allowed_emails.permissions at
  // sign-in and kept in sync with it from there on.
  permissions: text("permissions").notNull().default("[]"),
  // Stamped from Auth.js's `signIn` event — a real completed sign-in, not
  // every session refresh (that would fire on nearly every request). Null
  // means invited but never signed in yet.
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Google-OAuth allowlist, managed from Settings > Usuarios instead of an
// env var — the owner can add/remove/repermission up to N real people
// without a redeploy. Auth.js creates the matching `users` row on first
// sign-in; this table is the thing that decides whether that sign-in is
// allowed at all, and what role/permissions it gets.
export const allowedEmails = sqliteTable("allowed_emails", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(), // stored lowercased
  role: text("role").notNull().default("member"), // "owner" | "member"
  permissions: text("permissions").notNull().default("[]"), // JSON array of nav-section keys
  invitedByUserId: text("invited_by_user_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --- Auth.js (NextAuth v5) required tables — DrizzleAdapter + WebAuthn ---

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// WebAuthn credentials (Face ID / Touch ID) — same table shape Auth.js's WebAuthn provider expects
export const authenticators = sqliteTable(
  "authenticators",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: integer("credentialBackedUp", { mode: "boolean" }).notNull(),
    transports: text("transports"),
  },
  (authr) => [primaryKey({ columns: [authr.userId, authr.credentialID] })]
);

export const crmSettings = sqliteTable("crm_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => contacts.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("discovery"), // discovery|design|dev|launched|paused
  budgetCents: integer("budget_cents").notNull().default(0),
  startDate: integer("start_date", { mode: "timestamp" }),
  deadline: integer("deadline", { mode: "timestamp" }),
  mockupUrl: text("mockup_url"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectMilestones = sqliteTable("project_milestones", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  dueDate: integer("due_date", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectDeliverables = sqliteTable("project_deliverables", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  milestoneId: text("milestone_id")
    .notNull()
    .references(() => projectMilestones.id),
  description: text("description").notNull(),
  fileUrl: text("file_url"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  approvedByUserId: text("approved_by_user_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const payments = sqliteTable("payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => contacts.id),
  projectId: text("project_id").references(() => projects.id),
  amountCents: integer("amount_cents").notNull().default(0),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectTasks = sqliteTable("project_tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  type: text("type").notNull().default("task"), // "task" | "solicitud"
  title: text("title"),
  description: text("description").notNull(),
  assignedUserId: text("assigned_user_id").references(() => users.id),
  assignedUserIds: text("assigned_user_ids").notNull().default("[]"),
  createdByUserId: text("created_by_user_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // "pending" | "in_progress" | "in_review" | "done"
  priority: text("priority").notNull().default("media"), // "alta" | "media" | "baja"
  dueDate: integer("due_date", { mode: "timestamp" }),
  reminderAt: integer("reminder_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  activityLog: text("activity_log").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  meta: text("meta"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const arsenalItems = sqliteTable("arsenal_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  category: text("category").notNull().default("Tool"),
  status: text("status").notNull().default("active"),
  icon: text("icon").default("🔧"),
  description: text("description"),
  url: text("url"),
  tags: text("tags").notNull().default("[]"),
  useCases: text("use_cases").notNull().default("[]"),
  costCents: integer("cost_cents"),
  details: text("details"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const demoPages = sqliteTable("demo_pages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Demo"),
  slug: text("slug").notNull().unique(),
  template: text("template").notNull().default("editorial"),
  // Full builder state (brand, fonts, ordered sections with content + media).
  // JSON-serialized, same convention as proposals.features.
  // `config` is the working draft the builder reads and autosaves into.
  // `publishedConfig` is the frozen snapshot /demo/[slug] serves, so editing
  // a live demo never mutates what the client is looking at — Publish is an
  // explicit copy from one to the other.
  config: text("config").notNull().default("{}"),
  publishedConfig: text("published_config"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  // Bumped on every accepted write. The builder sends the version it loaded;
  // a mismatch means another tab (or an out-of-order autosave) already wrote,
  // so the stale request is rejected instead of silently clobbering.
  version: integer("version").notNull().default(0),
  // Incremented on every real visit to the published /demo/[slug] page —
  // never on a builder preview or an unpublished page, since those aren't a
  // prospect looking at the site.
  views: integer("views").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const demoAssets = sqliteTable("demo_assets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  url: text("url").notNull(),
  alt: text("alt"),
  kind: text("kind").notNull().default("image"), // "image" | "video"
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const analyticsProperties = sqliteTable("analytics_properties", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text("contact_id")
    .notNull()
    .unique()
    .references(() => contacts.id, { onDelete: "cascade" }),
  ga4PropertyId: text("ga4_property_id"),
  ga4MeasurementId: text("ga4_measurement_id"),
  gscSiteUrl: text("gsc_site_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Actions the user has dealt with, so the NBA list stops re-proposing them.
 *
 * Every dismissal expires. A permanent hide would rot the list: action ids
 * are derived from the entity ("hot-<contactId>"), so silencing one forever
 * would also silence the same contact going cold again next quarter, which
 * is exactly when you would want to know.
 */
export const nbaDismissals = sqliteTable("nba_dismissals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  actionId: text("action_id").notNull(),
  userId: text("user_id").references(() => users.id),
  // "done" | "not_relevant" | "snooze"
  reason: text("reason").notNull().default("done"),
  /** Hidden until this moment; after it the action can surface again. */
  hiddenUntil: integer("hidden_until", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Ledger of every action the automation engine has actually taken.
 *
 * This is what makes a daily job safe to run daily. The engine re-evaluates
 * the same rules against the same data every morning, so without a record of
 * what it already did, "propuesta sin abrir hace 3 días" would create a new
 * follow-up every single day until someone opened it. Each action carries a
 * stable `dedupeKey` (rule + entity); the engine skips any key it already
 * wrote inside that rule's cooldown window.
 *
 * It doubles as the audit trail: automations act on their own, so being able
 * to answer "why does this task exist and who created it?" is not optional.
 */
export const automationRuns = sqliteTable("automation_runs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ruleId: text("rule_id").notNull(),
  dedupeKey: text("dedupe_key").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  /** Human-readable line for the run log in Settings. */
  summary: text("summary").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
