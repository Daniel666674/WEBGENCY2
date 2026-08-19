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
  "CREATE TABLE IF NOT EXISTS demo_pages (\n    id TEXT PRIMARY KEY,\n    contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,\n    title TEXT NOT NULL DEFAULT 'Demo',\n    slug TEXT NOT NULL UNIQUE,\n    template TEXT NOT NULL DEFAULT 'editorial',\n    config TEXT NOT NULL DEFAULT '{}',\n    published_config TEXT,\n    published INTEGER NOT NULL DEFAULT 0,\n    published_at INTEGER,\n    version INTEGER NOT NULL DEFAULT 0,\n    views INTEGER NOT NULL DEFAULT 0,\n    created_at INTEGER NOT NULL,\n    updated_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS demo_assets (\n    id TEXT PRIMARY KEY,\n    url TEXT NOT NULL,\n    alt TEXT,\n    kind TEXT NOT NULL DEFAULT 'image',\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS \"authenticators\" (\n\t`credentialID` text NOT NULL,\n\t`userId` text NOT NULL,\n\t`providerAccountId` text NOT NULL,\n\t`credentialPublicKey` text NOT NULL,\n\t`counter` integer NOT NULL,\n\t`credentialDeviceType` text NOT NULL,\n\t`credentialBackedUp` integer NOT NULL,\n\t`transports` text,\n\tPRIMARY KEY(`userId`, `credentialID`),\n\tFOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade\n);",
  "CREATE TABLE IF NOT EXISTS \"contacts\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`email` text,\n\t`phone` text,\n\t`company` text,\n\t`source` text DEFAULT 'otro' NOT NULL,\n\t`temperature` text DEFAULT 'cold' NOT NULL,\n\t`score` integer DEFAULT 0 NOT NULL,\n\t`notes` text,\n\t`mockup_url` text,\n\t`site_url` text,\n\t`signed_date` integer,\n\t`monthly_payment` integer,\n\t`client_status` text DEFAULT 'prospect' NOT NULL,\n\t`next_payment_date` integer,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL\n, automations_suspended INTEGER NOT NULL DEFAULT 0, last_payment_ref TEXT, infra_data TEXT, seo_data TEXT, security_data TEXT, decision_log TEXT NOT NULL DEFAULT '[]', account_health TEXT, inventory_health TEXT, sales_data_notes TEXT, funnel_tracking TEXT);",
  "CREATE TABLE IF NOT EXISTS \"crm_settings\" (\n\t`key` text PRIMARY KEY NOT NULL,\n\t`value` text NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS \"deals\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`title` text NOT NULL,\n\t`value` integer DEFAULT 0 NOT NULL,\n\t`stage_id` text NOT NULL,\n\t`contact_id` text NOT NULL,\n\t`expected_close` integer,\n\t`probability` integer DEFAULT 0 NOT NULL,\n\t`notes` text,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL,\n\tFOREIGN KEY (`stage_id`) REFERENCES `pipeline_stages`(`id`) ON UPDATE no action ON DELETE no action,\n\tFOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action\n);",
  "CREATE TABLE IF NOT EXISTS payments (\n    id TEXT PRIMARY KEY,\n    client_id TEXT NOT NULL REFERENCES contacts(id),\n    project_id TEXT REFERENCES projects(id),\n    amount_cents INTEGER NOT NULL DEFAULT 0,\n    paid_at INTEGER,\n    note TEXT,\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS \"pipeline_stages\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`name` text NOT NULL,\n\t`order` integer NOT NULL,\n\t`color` text DEFAULT '#64748b' NOT NULL,\n\t`is_won` integer DEFAULT false NOT NULL,\n\t`is_lost` integer DEFAULT false NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS project_deliverables (\n    id TEXT PRIMARY KEY,\n    milestone_id TEXT NOT NULL REFERENCES project_milestones(id),\n    description TEXT NOT NULL,\n    file_url TEXT,\n    approved_at INTEGER,\n    approved_by_user_id TEXT REFERENCES users(id),\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS project_milestones (\n    id TEXT PRIMARY KEY,\n    project_id TEXT NOT NULL REFERENCES projects(id),\n    title TEXT NOT NULL,\n    \"order\" INTEGER NOT NULL DEFAULT 0,\n    due_date INTEGER,\n    completed_at INTEGER,\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS project_tasks (\n    id TEXT PRIMARY KEY,\n    project_id TEXT NOT NULL REFERENCES projects(id),\n    type TEXT NOT NULL DEFAULT 'task',\n    title TEXT,\n    description TEXT NOT NULL,\n    assigned_user_id TEXT REFERENCES users(id),\n    status TEXT NOT NULL DEFAULT 'pending',\n    priority TEXT NOT NULL DEFAULT 'media',\n    due_date INTEGER,\n    reminder_at INTEGER,\n    completed_at INTEGER,\n    activity_log TEXT NOT NULL DEFAULT '[]',\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS projects (\n    id TEXT PRIMARY KEY,\n    client_id TEXT REFERENCES contacts(id),\n    name TEXT NOT NULL,\n    status TEXT NOT NULL DEFAULT 'discovery',\n    budget_cents INTEGER NOT NULL DEFAULT 0,\n    start_date INTEGER,\n    deadline INTEGER,\n    mockup_url TEXT,\n    notes TEXT,\n    created_at INTEGER NOT NULL,\n    updated_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS \"proposals\" (\n\t`id` text PRIMARY KEY NOT NULL,\n\t`contact_id` text NOT NULL,\n\t`plan_name` text DEFAULT 'Custom' NOT NULL,\n\t`one_time_fee` integer DEFAULT 0 NOT NULL,\n\t`monthly_fee` integer DEFAULT 0 NOT NULL,\n\t`features` text DEFAULT '[]' NOT NULL,\n\t`add_ons` text DEFAULT '[]' NOT NULL,\n\t`automations` text DEFAULT '[]' NOT NULL,\n\t`deliverables` text DEFAULT '[]' NOT NULL,\n\t`notes` text,\n\t`share_token` text,\n\t`viewed_at` integer,\n\t`created_at` integer NOT NULL,\n\t`updated_at` integer NOT NULL, pricing_meta TEXT NOT NULL DEFAULT '{}', valid_until INTEGER,\n\tFOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action\n);",
  "CREATE TABLE IF NOT EXISTS `sessions` (\n\t`sessionToken` text PRIMARY KEY NOT NULL,\n\t`userId` text NOT NULL,\n\t`expires` integer NOT NULL,\n\tFOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade\n);",
  "CREATE TABLE IF NOT EXISTS users (\n    id TEXT PRIMARY KEY,\n    name TEXT NOT NULL,\n    color TEXT NOT NULL DEFAULT '#0d9a8a',\n    is_hers INTEGER NOT NULL DEFAULT 0,\n    avatar TEXT,\n    created_at INTEGER NOT NULL\n  , email text, email_verified integer, image text, role text NOT NULL DEFAULT 'member', permissions text NOT NULL DEFAULT '[]', last_login_at integer);",
  "CREATE TABLE IF NOT EXISTS allowed_emails (\n    id TEXT PRIMARY KEY,\n    email TEXT NOT NULL UNIQUE,\n    role TEXT NOT NULL DEFAULT 'member',\n    permissions TEXT NOT NULL DEFAULT '[]',\n    invited_by_user_id TEXT REFERENCES users(id),\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS nba_dismissals (\n    id TEXT PRIMARY KEY,\n    action_id TEXT NOT NULL,\n    user_id TEXT REFERENCES users(id),\n    reason TEXT NOT NULL DEFAULT 'done',\n    hidden_until INTEGER NOT NULL,\n    created_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS automation_runs (\n    id TEXT PRIMARY KEY,\n    rule_id TEXT NOT NULL,\n    dedupe_key TEXT NOT NULL,\n    entity_type TEXT,\n    entity_id TEXT,\n    summary TEXT NOT NULL,\n    created_at INTEGER NOT NULL\n  );",
  "CREATE INDEX IF NOT EXISTS automation_runs_dedupe_key ON automation_runs (dedupe_key);",
  "CREATE TABLE IF NOT EXISTS user_appearance (\n  id TEXT PRIMARY KEY,\n  user_id TEXT NOT NULL UNIQUE,\n  config TEXT NOT NULL DEFAULT '{}',\n  updated_at INTEGER NOT NULL\n);",
  "CREATE TABLE IF NOT EXISTS schema_migrations (\n    id TEXT PRIMARY KEY,\n    applied_at INTEGER NOT NULL\n  );",
  "CREATE TABLE IF NOT EXISTS `verificationTokens` (\n\t`identifier` text NOT NULL,\n\t`token` text NOT NULL,\n\t`expires` integer NOT NULL,\n\tPRIMARY KEY(`identifier`, `token`)\n);",
];
/**
 * Idempotent schema bootstrap, awaited once at server boot (see
 * src/instrumentation.ts) before any request is served. In the normal case
 * — a Turso database already populated by scripts/migrate-to-turso.ts —
 * every statement here is a no-op (IF NOT EXISTS). It only does real work
 * against a genuinely fresh, empty Turso database.
 */
// Columns added after project_tasks already shipped — CREATE TABLE IF NOT
// EXISTS above only helps a genuinely fresh database, so existing ones need
// these ALTER statements. "duplicate column" failures (already applied) are
// expected and swallowed the same way as the TABLES loop above.
const COLUMN_MIGRATIONS = [
  "ALTER TABLE project_tasks ADD COLUMN title TEXT",
  "ALTER TABLE project_tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'media'",
  "ALTER TABLE project_tasks ADD COLUMN reminder_at INTEGER",
  "ALTER TABLE project_tasks ADD COLUMN activity_log TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE project_tasks ADD COLUMN created_by_user_id TEXT REFERENCES users(id)",
  "ALTER TABLE project_tasks ADD COLUMN assigned_user_ids TEXT NOT NULL DEFAULT '[]'",
  // demo_pages gained a draft/published split and optimistic concurrency
  // after the table already shipped.
  "ALTER TABLE demo_pages ADD COLUMN published_config TEXT",
  "ALTER TABLE demo_pages ADD COLUMN published_at INTEGER",
  "ALTER TABLE demo_pages ADD COLUMN version INTEGER NOT NULL DEFAULT 0",
  // users predates the permissions model.
  "ALTER TABLE users ADD COLUMN permissions TEXT NOT NULL DEFAULT '[]'",
  // users predates tracking when someone last actually signed in.
  "ALTER TABLE users ADD COLUMN last_login_at INTEGER",
  // demo_pages predates view tracking.
  "ALTER TABLE demo_pages ADD COLUMN views INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE audit_logs ADD COLUMN ip_address TEXT",
  "ALTER TABLE audit_logs ADD COLUMN user_agent TEXT",
  "ALTER TABLE demo_pages ADD COLUMN config_backup TEXT",
];

// Backfills that must run after COLUMN_MIGRATIONS. Idempotent by
// construction — each only touches rows still holding the pre-migration
// value, so re-running on an already-migrated database is a no-op.
// Each entry runs at most once ever, tracked by id in `schema_migrations`.
// A value-based guard ("only touch rows still holding the old value") is not
// enough for the permissions backfill: '[]' is also what a legitimately
// revoked user looks like, so re-running it on every boot would hand full
// access — Config tab included — back to someone the owner had just locked
// out.
const DATA_MIGRATIONS: { id: string; sql: string }[] = [
  {
    // Demos published before the split have no snapshot; seed it from the
    // working config so their public URL keeps serving the same page.
    id: "2025-demo-pages-published-config-backfill",
    sql: "UPDATE demo_pages SET published_config = config WHERE published = 1 AND published_config IS NULL",
  },
  {
    // Every user created before the permissions model existed had unrestricted
    // access by default (there was nothing to restrict). Backfill them to full
    // access rather than silently locking them out the moment the new
    // permissions column defaults to '[]'.
    id: "2025-users-permissions-initial-backfill",
    sql: "UPDATE users SET permissions = '[\"principal\",\"revenue\",\"cuentas\",\"negocios\",\"arsenal\",\"config\"]' WHERE permissions = '[]'",
  },
  {
    id: "2026-project-tasks-assigned-user-ids-backfill",
    sql: "UPDATE project_tasks SET assigned_user_ids = '[\"' || assigned_user_id || '\"' || ']' WHERE assigned_user_id IS NOT NULL AND assigned_user_ids = '[]'",
  },
];

/**
 * Merges duplicate `users` rows sharing the same email, then creates a unique
 * index so Auth.js can never produce duplicates again. Run-once, gated by
 * `schema_migrations`.
 *
 * For each duplicated email, the "canonical" row is the one linked by the
 * `accounts` table (i.e., the one Auth.js currently signs into). All FK
 * references from duplicate rows are repointed to the canonical id, then the
 * duplicates are deleted.
 */
async function deduplicateUsers(): Promise<void> {
  const MIGRATION_ID = "2026-users-deduplicate-email";
  try {
    const { rows: done } = await client.execute({
      sql: "SELECT 1 FROM schema_migrations WHERE id = ?",
      args: [MIGRATION_ID],
    });
    if (done.length > 0) return;

    // Find emails that appear more than once.
    const { rows: dupes } = await client.execute(
      "SELECT LOWER(email) AS email FROM users WHERE email IS NOT NULL GROUP BY LOWER(email) HAVING COUNT(*) > 1"
    );
    if (dupes.length === 0) {
      // No duplicates — just add the unique index and mark done.
      try {
        await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
      } catch { /* index already exists */ }
      await client.execute({
        sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
        args: [MIGRATION_ID, Date.now()],
      });
      return;
    }

    // Tables that reference users(id) — update FKs from duplicate to canonical.
    const FK_TABLES: [string, string][] = [
      ["sessions", "userId"],
      ["accounts", "userId"],
      ["activities", "assigned_user_id"],
      ["project_tasks", "assigned_user_id"],
      ["project_tasks", "created_by_user_id"],
      ["audit_logs", "user_id"],
      ["nba_dismissals", "user_id"],
      ["allowed_emails", "invited_by_user_id"],
      ["project_deliverables", "approved_by_user_id"],
      ["authenticators", "userId"],
    ];

    for (const dupe of dupes) {
      const email = dupe.email as string;
      // Get all user rows for this email, ordered so we can pick the canonical one.
      const { rows: userRows } = await client.execute({
        sql: "SELECT id FROM users WHERE LOWER(email) = ? ORDER BY created_at ASC",
        args: [email],
      });
      if (userRows.length < 2) continue;

      const allIds = userRows.map((r) => r.id as string);

      // The canonical user is the one with an `accounts` link (the one Auth.js signs into).
      let canonicalId: string | null = null;
      for (const uid of allIds) {
        const { rows: accts } = await client.execute({
          sql: "SELECT 1 FROM accounts WHERE userId = ? LIMIT 1",
          args: [uid],
        });
        if (accts.length > 0) { canonicalId = uid; break; }
      }
      // If none has an account link, keep the first (oldest) row.
      if (!canonicalId) canonicalId = allIds[0];

      const duplicateIds = allIds.filter((id) => id !== canonicalId);

      for (const dupId of duplicateIds) {
        // Repoint all FK references.
        for (const [table, column] of FK_TABLES) {
          try {
            await client.execute({
              sql: `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
              args: [canonicalId, dupId],
            });
          } catch { /* table may not exist */ }
        }
        // Also update assigned_user_ids JSON arrays in project_tasks.
        try {
          await client.execute({
            sql: "UPDATE project_tasks SET assigned_user_ids = REPLACE(assigned_user_ids, ?, ?) WHERE assigned_user_ids LIKE '%' || ? || '%'",
            args: [dupId, canonicalId, dupId],
          });
        } catch { /* column may not exist */ }

        // Delete the duplicate user row.
        await client.execute({ sql: "DELETE FROM users WHERE id = ?", args: [dupId] });
      }
    }

    // Now that duplicates are gone, add the unique index.
    try {
      await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    } catch { /* index already exists */ }

    await client.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: [MIGRATION_ID, Date.now()],
    });
    console.log(`[ensureSchema] deduplicated ${dupes.length} email(s) in users table`);
  } catch (err) {
    console.error("[ensureSchema] user deduplication failed:", err);
  }
}

async function cleanupTasksAndUsers(): Promise<void> {
  const MIGRATION_ID = "2026-cleanup-tasks-and-users";
  try {
    const { rows: done } = await client.execute({
      sql: "SELECT 1 FROM schema_migrations WHERE id = ?",
      args: [MIGRATION_ID],
    });
    if (done.length > 0) return;

    // Delete all project tasks.
    const { rowsAffected: tasksDeleted } = await client.execute("DELETE FROM project_tasks");

    // Find which user IDs are linked by the accounts table (canonical).
    const { rows: acctRows } = await client.execute("SELECT DISTINCT userId FROM accounts");
    const linkedIds = new Set(acctRows.map((r) => r.userId as string));

    // Get all users grouped by email — keep only the canonical one per email.
    const { rows: allUsers } = await client.execute(
      "SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC"
    );
    const canonical = new Map<string, { id: string; email: string }>();
    const toDelete: string[] = [];

    for (const u of allUsers) {
      const key = ((u.email as string) ?? (u.id as string)).toLowerCase();
      const existing = canonical.get(key);
      if (!existing) {
        canonical.set(key, { id: u.id as string, email: u.email as string });
      } else if (linkedIds.has(u.id as string) && !linkedIds.has(existing.id)) {
        toDelete.push(existing.id);
        canonical.set(key, { id: u.id as string, email: u.email as string });
      } else {
        toDelete.push(u.id as string);
      }
    }

    for (const uid of toDelete) {
      const email = allUsers.find((u) => u.id === uid)?.email as string | undefined;
      const canon = email ? canonical.get(email.toLowerCase()) : null;
      if (canon) {
        const fks: [string, string][] = [
          ["sessions", "userId"],
          ["audit_logs", "user_id"],
          ["nba_dismissals", "user_id"],
          ["allowed_emails", "invited_by_user_id"],
          ["project_deliverables", "approved_by_user_id"],
        ];
        for (const [table, col] of fks) {
          try {
            await client.execute({ sql: `UPDATE ${table} SET ${col} = ? WHERE ${col} = ?`, args: [canon.id, uid] });
          } catch { /* table may not exist */ }
        }
      }
      try { await client.execute({ sql: "DELETE FROM sessions WHERE userId = ?", args: [uid] }); } catch {}
      await client.execute({ sql: "DELETE FROM users WHERE id = ?", args: [uid] });
    }

    await client.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: [MIGRATION_ID, Date.now()],
    });

    console.log(`[ensureSchema] cleanup: deleted ${tasksDeleted} tasks, removed ${toDelete.length} duplicate users`);
  } catch (err) {
    console.error("[ensureSchema] cleanup failed:", err);
  }
}

async function fixDemoCascadeDelete(): Promise<void> {
  const MIGRATION_ID = "2026-demo-pages-set-null-on-delete";
  try {
    const { rows: done } = await client.execute({
      sql: "SELECT 1 FROM schema_migrations WHERE id = ?",
      args: [MIGRATION_ID],
    });
    if (done.length > 0) return;

    await client.execute("CREATE TABLE IF NOT EXISTS demo_pages_new (\n    id TEXT PRIMARY KEY,\n    contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,\n    title TEXT NOT NULL DEFAULT 'Demo',\n    slug TEXT NOT NULL UNIQUE,\n    template TEXT NOT NULL DEFAULT 'editorial',\n    config TEXT NOT NULL DEFAULT '{}',\n    published_config TEXT,\n    published INTEGER NOT NULL DEFAULT 0,\n    published_at INTEGER,\n    version INTEGER NOT NULL DEFAULT 0,\n    views INTEGER NOT NULL DEFAULT 0,\n    created_at INTEGER NOT NULL,\n    updated_at INTEGER NOT NULL\n  )");
    await client.execute("INSERT INTO demo_pages_new SELECT * FROM demo_pages");
    await client.execute("DROP TABLE demo_pages");
    await client.execute("ALTER TABLE demo_pages_new RENAME TO demo_pages");

    await client.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      args: [MIGRATION_ID, Date.now()],
    });
    console.log("[ensureSchema] fixed demo_pages FK: CASCADE → SET NULL");
  } catch (err) {
    console.error("[ensureSchema] demo_pages FK migration failed:", err);
  }
}

export async function ensureSchema(): Promise<void> {
  for (const sql of TABLES) {
    try {
      await client.execute(sql);
    } catch {
      // Table already exists with a slightly different history, or a
      // concurrent boot created it first — safe to continue either way.
    }
  }

  for (const sql of COLUMN_MIGRATIONS) {
    try {
      await client.execute(sql);
    } catch {
      // Column already exists — safe to continue.
    }
  }

  // Run-once data migrations. The marker row is written only after the
  // statement succeeds, so a migration that failed against a partially
  // migrated database gets retried on the next boot instead of being
  // recorded as done.
  for (const { id, sql } of DATA_MIGRATIONS) {
    try {
      const { rows } = await client.execute({
        sql: "SELECT 1 FROM schema_migrations WHERE id = ?",
        args: [id],
      });
      if (rows.length > 0) continue;

      await client.execute(sql);
      await client.execute({
        sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
        args: [id, Date.now()],
      });
    } catch {
      // Target column may not exist yet on a partially-migrated database.
    }
  }

  await fixDemoCascadeDelete();

  // Merge duplicate users and enforce a unique index on email.
  await deduplicateUsers();

  // One-time cleanup: wipe all tasks and confirm only canonical users remain.
  await cleanupTasksAndUsers();

  // One-time bootstrap of the DB-backed allowlist from the legacy env vars
  // (ALLOWED_EMAILS / OWNER_EMAIL / HER_EMAIL), so an existing deployment
  // upgrading to the permissions model doesn't lock its own owner out —
  // the row that would have been positionally assigned "owner" before
  // becomes the real owner row here. No-ops once any row exists, so it's
  // safe to leave in permanently rather than a real migration script.
  try {
    const { rows: allowedRows } = await client.execute("SELECT COUNT(*) as count FROM allowed_emails");
    if (Number(allowedRows[0]?.count ?? 0) === 0) {
      const legacyList = (process.env.ALLOWED_EMAILS ?? "")
        .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
      const ownerEmail = (process.env.OWNER_EMAIL ?? legacyList[0] ?? "").toLowerCase();
      const herEmail = (process.env.HER_EMAIL ?? legacyList[1] ?? "").toLowerCase();
      const allSections = ["principal", "revenue", "cuentas", "negocios", "arsenal", "config"];
      // Every pre-existing user had unrestricted access (there was no
      // gating at all before this feature) — bootstrap preserves that so
      // upgrading never silently takes tabs away from someone who already
      // had them. Restricting access is something the owner does
      // afterward, deliberately, from Settings > Usuarios.
      for (const email of legacyList) {
        if (!email) continue;
        const isOwner = email === ownerEmail;
        void herEmail; // isHers no longer drives role/permissions — legacy positional hack retired
        await client.execute({
          sql: "INSERT OR IGNORE INTO allowed_emails (id, email, role, permissions, created_at) VALUES (?, ?, ?, ?, ?)",
          args: [crypto.randomUUID(), email, isOwner ? "owner" : "member", JSON.stringify(allSections), Date.now()],
        });
      }
    }
  } catch {
    // allowed_emails may not exist yet on a partially-migrated database —
    // the COLUMN_MIGRATIONS/TABLES passes above already tolerate that same
    // race, so this bootstrap simply retries on the next boot.
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
export { client as rawClient };
