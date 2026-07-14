import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "crm.db"));

// --- New contacts columns: infra, SEO, security, decision log, account
// health, and the sales/inventory/funnel extension to Pagos/Analiticas.
// All nullable JSON-TEXT (or plain TEXT for freeform notes), matching the
// existing convention (see proposals.features etc.) — additive only, no
// existing column is touched.
const migrations = [
  `ALTER TABLE contacts ADD COLUMN infra_data TEXT`,
  `ALTER TABLE contacts ADD COLUMN seo_data TEXT`,
  `ALTER TABLE contacts ADD COLUMN security_data TEXT`,
  `ALTER TABLE contacts ADD COLUMN decision_log TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE contacts ADD COLUMN account_health TEXT`,
  `ALTER TABLE contacts ADD COLUMN inventory_health TEXT`,
  `ALTER TABLE contacts ADD COLUMN sales_data_notes TEXT`,
  `ALTER TABLE contacts ADD COLUMN funnel_tracking TEXT`,
];

for (const sql of migrations) {
  try {
    db.prepare(sql).run();
    console.log(`✓ ${sql.slice(0, 60)}...`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate column name")) {
      console.log(`  (skip — already applied)`);
    } else {
      console.error(`✗ ${msg}`);
    }
  }
}

// --- Data fix: a past script wrote Date.now() (milliseconds) directly into
// integer columns that Drizzle's `mode: "timestamp"` treats as SECONDS.
// Reading it back does `new Date(value * 1000)`, so a millisecond value
// stored where seconds were expected renders ~1000x too far in the future
// (this is the "18 jun 58470" bug). Any stored value >= 1e12 can only be
// this corruption — a legitimate seconds-scale timestamp never reaches
// 1e12 (that would be the year 33658). Dividing by 1000 recovers the
// originally-intended timestamp.
const TIMESTAMP_COLUMNS: Array<[string, string[]]> = [
  ["contacts", ["created_at", "updated_at", "signed_date", "next_payment_date"]],
  ["deals", ["expected_close", "created_at", "updated_at"]],
  ["proposals", ["valid_until", "viewed_at", "created_at", "updated_at"]],
  ["activities", ["scheduled_at", "completed_at", "created_at"]],
  ["users", ["created_at"]],
  ["projects", ["start_date", "deadline", "created_at", "updated_at"]],
  ["project_tasks", ["due_date", "completed_at", "created_at"]],
  ["project_milestones", ["due_date", "completed_at", "created_at"]],
  ["project_deliverables", ["approved_at", "created_at"]],
  ["payments", ["paid_at", "created_at"]],
  ["audit_logs", ["created_at"]],
  ["analytics_properties", ["created_at", "updated_at"]],
];

let totalFixed = 0;
for (const [table, columns] of TIMESTAMP_COLUMNS) {
  const tableExists = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
    .get(table);
  if (!tableExists) continue;

  for (const col of columns) {
    try {
      const result = db
        .prepare(`UPDATE ${table} SET ${col} = ${col} / 1000 WHERE ${col} >= 1000000000000`)
        .run();
      if (result.changes > 0) {
        console.log(`  fixed ${result.changes} row(s) in ${table}.${col}`);
        totalFixed += result.changes;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${table}.${col}: ${msg}`);
    }
  }
}

console.log(`\nMigration v11 complete: new contact fields ready, ${totalFixed} corrupted timestamp(s) fixed.`);
db.close();
