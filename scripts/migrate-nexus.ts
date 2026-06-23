import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "crm.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

console.log("Running NEXUS migration...");

const migrations = [
  `ALTER TABLE contacts ADD COLUMN mockup_url TEXT`,
  `ALTER TABLE contacts ADD COLUMN site_url TEXT`,
  `ALTER TABLE contacts ADD COLUMN signed_date INTEGER`,
  `ALTER TABLE contacts ADD COLUMN monthly_payment INTEGER`,
  `ALTER TABLE contacts ADD COLUMN client_status TEXT NOT NULL DEFAULT 'prospect'`,
  `ALTER TABLE contacts ADD COLUMN next_payment_date INTEGER`,
  `CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    plan_name TEXT NOT NULL DEFAULT 'Custom',
    one_time_fee INTEGER NOT NULL DEFAULT 0,
    monthly_fee INTEGER NOT NULL DEFAULT 0,
    features TEXT NOT NULL DEFAULT '[]',
    add_ons TEXT NOT NULL DEFAULT '[]',
    automations TEXT NOT NULL DEFAULT '[]',
    deliverables TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
];

for (const sql of migrations) {
  try {
    db.prepare(sql).run();
    console.log(`✓ ${sql.slice(0, 60)}...`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate column name") || msg.includes("already exists")) {
      console.log(`  (skip — already applied)`);
    } else {
      console.error(`✗ ${msg}`);
    }
  }
}

console.log("\nNEXUS migration complete.");
db.close();
