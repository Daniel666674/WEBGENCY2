import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Turso (libSQL) is the single source of truth for every environment — dev,
// Vercel, or a VPS. It's wire-compatible with SQLite (same schema.ts, same
// SQL), but it's a real always-on remote database, so none of the ephemeral-
// filesystem problems that plagued the old local-SQLite-on-Vercel setup
// apply here: there's no /tmp copy, no per-instance staleness, and no
// separate "mirror this file to Blob" step — a write is durable the moment
// the query resolves.
// Fall back to an in-memory URL during `next build` so the module loads
// without throwing when TURSO_DATABASE_URL isn't available in the build
// environment. Actual DB calls only happen at runtime (routes are
// force-dynamic; instrumentation only runs on server start).
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file::memory:",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const TABLES = [
  "CREATE TABLE IF NOT EXISTS `accounts` (\n\t`userId` text NOT NULL,\n\t`type` text NOT NULL,\n\t`provider` text NOT NULL,\n\t`providerAccountId` text NOT NULL,\n\t`refresh_token` text,\n\t`access_token` text,\n\t`expires_at` integer,\n\t`token_type` text,\n\t`scope` text,\n\t`id_token` text,\n\t`session_state` text,\n\tPRIMARY KEY(`provider`, `providerAccountId`),\n\tFOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade\n);",
  "CREATE TABLE IF NOT EXISTS \"activities\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`type` text NOT NULL,\n\t`description` text NOT NULL,\n\t`contact_id` text NOT NULL,\n\t`deal_id` text,\n\t`scheduled_at` integer,\n\t`completed_at` integer,\n\t`assigned_user_id` text,\n\t`created_at` integer NOT NULL,\n\tFOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action\n);",
  "CREATE TABLE IF NOT EXISTS arsenal_items (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  category TEXT NOT NULL DEFAULT 'Tool',\n  status TEXT NOT NULL DEFAULT 'active',\n  icon TEXT DEFAULT '🔧',\n  description TEXT,\n  url TEXT,\n  tags TEXT NOT NULL DEFAULT '[]',\n  use_cases TEXT NOT NULL DEFAULT '[]',\n  cost_cents INTEGER,\n  details TEXT,\n  notes TEXT,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS analytics_properties (\n  id TEXT PRIMARY KEY,\n  contact_id TEXT NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,\n  ga4_property_id TEXT,\n  ga4_measurement_id TEXT,\n  gsc_site_url TEXT,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS \"attachments\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`contact_id` text,\n\t`proposal_id` text,\n\t`project_id` text,\n\t`name` text NOT NULL,\n\t`type` text DEFAULT 'link' NOT NULL,\n\t`url` text,\n\t`file_data` text,\n\t`mime_type` text,\n\t`size` integer,\n\t`created_at` integer NOT NULL,\n\tFOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action\n);",
  "CREATE TABLE IF NOT EXISTS audit_logs (\n    id TEXT PRIMARY KEY,\n    user_id TEXT REFERENCES users(id),\n    action TEXT NOT NULL,\n    resource_type TEXT NOT NULL,\n    resource_id TEXT NOT NULL,\n    meta TEXT,\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS \"authenticators\" (\n\t`credentialID` text NOT NULL,\n\t`userId` text NOT NULL,\n\t`providerAccountId` text NOT NULL,\n\t`credentialPublicKey` text NOT NULL,\n\t`counter` integer NOT NULL,\n\t`credentialDeviceType` text NOT NULL,\n\t`credentialBackedUp` integer NOT NULL,\n\t`transports` text,\n\tPRIMARY KEY(`userId`, `credentialID`),\n\tFOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade\n);",
  "CREATE TABLE IF NOT EXISTS \"contacts\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`email` text,\n\t`phone` text,\n\t`company` text,\n\t`source` text DEFAULT 'otro' NOT NULL,\n\t`temperature` text DEFAULT 'cold' NOT NULL,\n\t`score` integer DEFAULT 0 NOT NULL,\n\t`notes` text,\n\t`mockup_url` text,\n\t`site_url` text,\n\t`signed_date` integer,\n\t`monthly_payment` integer,\n\t`client_status` text DEFAULT 'prospect' NOT NULL,\n\t`next_payment_date` integer,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL\n, automations_suspended INTEGER NOT NULL DEFAULT 0, last_payment_ref TEXT, infra_data TEXT, seo_data TEXT, security_data TEXT, decision_log TEXT NOT NULL DEFAULT '[]', account_health TEXT, inventory_health TEXT, sales_data_notes TEXT, funnel_tracking TEXT);",
  "CREATE TABLE IF NOT EXISTS \"crm_settings\" (\n\t`key` text PRIMARY KEY NOT NULL,\n\t`value` text NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS \"deals\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`title` text NOT NULL,\n\t`value` integer DEFAULT 0 NOT NULL,\n\t`stage_id` text NOT NULL,\n\t`contact_id` text NOT NULL,\n\t`expected_close` integer,\n\t`probability` integer DEFAULT 0 NOT NULL,\n\t`notes` text,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`stage_id`) REFERENCES `pipeline_stages`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action\n);",
  "CREATE TABLE IF NOT EXISTS payments (\n    id TEXT PRIMARY KEY,\n    client_id TEXT NOT NULL REFERENCES contacts(id),\n    project_id TEXT REFERENCES projects(id),\n    amount_cents INTEGER NOT NULL DEFAULT 0,\n    paid_at INTEGER,\n    note TEXT,\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS \"pipeline_stages\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`order` integer NOT NULL,\n\t`color` text DEFAULT '#64748b' NOT NULL,\n\t`is_won` integer DEFAULT false NOT NULL,\n\t`is_lost` integer DEFAULT false NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS project_deliverables (\n    id TEXT PRIMARY KEY,\n    milestone_id TEXT NOT NULL REFERENCES project_milestones(id),\n    description TEXT NOT NULL,\n    file_url TEXT,\n    approved_at INTEGER,\n    approved_by_user_id TEXT REFERENCES users(id),\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS project_milestones (\n    id TEXT PRIMARY KEY,\n    project_id TEXT NOT NULL REFERENCES projects(id),\n    title TEXT NOT NULL,\n    \"order\" INTEGER NOT NULL DEFAULT 0,\n    due_date INTEGER,\n    completed_at INTEGER,\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS project_tasks (\n    id TEXT PRIMARY KEY,\n    project_id TEXT NOT NULL REFERENCES projects(id),\n    type TEXT NOT NULL DEFAULT 'task',\n    description TEXT NOT NULL,\n    assigned_user_id TEXT REFERENCES users(id),\n    status TEXT NOT NULL DEFAULT 'pending',\n    due_date INTEGER,\n    completed_at INTEGER,\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS projects (\n    id TEXT PRIMARY KEY,\n    client_id TEXT REFERENCES contacts(id),\n    name TEXT NOT NULL,\n    status TEXT NOT NULL DEFAULT 'discovery',\n    budget_cents INTEGER NOT NULL DEFAULT 0,\n    start_date INTEGER,\n    deadline INTEGER,\n    mockup_url TEXT,\n    notes TEXT,\n    created_at INTEGER NOT NULL,\n    updated_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS \"proposals\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`contact_id` text NOT NULL,\n\t`plan_name` text DEFAULT 'Custom' NOT NULL,\n\t`one_time_fee` integer DEFAULT 0 NOT NULL,\n\t`monthly_fee` integer DEFAULT 0 NOT NULL,\n\t`features` text DEFAULT '[]' NOT NULL,\n\t`add_ons` text DEFAULT '[]' NOT NULL,\n\t`automations` text DEFAULT '[]' NOT NULL,\n\t`deliverables` text DEFAULT '[]' NOT NULL,\n\t`notes` text,\n\t`share_token` text,\n\t`viewed_at` integer,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL, pricing_meta TEXT NOT NULL DEFAULT '{}', valid_until INTEGER,\n\tFOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action\n);",
  "CREATE TABLE IF NOT EXISTS `sessions` (\n\t`sessionToken` text PRIMARY KEY NOT NULL,\n\t`userId` text NOT NULL,\n\t`expires` integer NOT NULL,\n\tFOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade\n);",
  "CREATE TABLE IF NOT EXISTS users (\n    id TEXT PRIMARY KEY,\n    name TEXT NOT NULL,\n    color TEXT NOT NULL DEFAULT '#0d9a8a',\n    is_hers INTEGER NOT NULL DEFAULT 0,\n    avatar TEXT,\n    created_at INTEGER NOT NULL\n  , email text, email_verified integer, image text, role text NOT NULL DEFAULT 'member');",
  "CREATE TABLE IF NOT EXISTS `verificationTokens` (\n\t`identifier` text NOT NULL,\n\t`token` text NOT NULL,\n\t`expires` integer NOT NULL,\n\tPRIMARY KEY(`identifier`, `token`)\n);",
];
/**
 * Idempotent schema bootstrap, awaited once at server boot (see
 * src/instrumentation.ts) before any request is served. In the normal case
 * — a Turso database already populated by scripts/migrate-to-turso.ts —
 * every statement here is a no-op (IF NOT EXISTS). It only does real work
 * against a genuinely fresh, empty Turso database.
 */
export async function ensureSchema(): Promise<void> {
  for (const sql of TABLES) {
    try {
      await client.execute(sql);
    } catch {
      // Table already exists with a slightly different history, or a
      // concurrent boot created it first — safe to continue either way.
    }
  }

  const { rows } = await client.execute("SELECT COUNT(*) as count FROM pipeline_stages");
  const count = Number(rows[0]?.count ?? 0);
  if (count > 0) return;

  const defaultStages = [
    { name: "Prospecto", order: 1, color: "#64748b", isWon: 0, isLost: 0 },
    { name: "Contactado", order: 2, color: "#2563eb", isWon: 0, isLost: 0 },
    { name: "Propuesta", order: 3, color: "#8b5cf6", isWon: 0, isLost: 0 },
    { name: "Negociacion", order: 4, color: "#ea580c", isWon: 0, isLost: 0 },
    { name: "Cerrado Ganado", order: 5, color: "#16a34a", isWon: 1, isLost: 0 },
    { name: "Cerrado Perdido", order: 6, color: "#dc2626", isWon: 0, isLost: 1 },
  ];
  for (const stage of defaultStages) {
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO pipeline_stages (id, name, "order", color, is_won, is_lost) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), stage.name, stage.order, stage.color, stage.isWon, stage.isLost],
      });
    } catch {
      // Seeding can race with another boot — fine either way.
    }
  }
}

/**
 * Legacy no-ops kept so the ~15 API routes that already call these don't
 * need to be touched. Turso commits a write the moment the query resolves —
 * there's no separate "now mirror it somewhere durable" step to perform,
 * unlike the old local-SQLite-on-Vercel setup this replaced.
 */
export function checkpointDb(): void {}
export async function persistNow(): Promise<void> {}

export const db = drizzle(client, { schema });
