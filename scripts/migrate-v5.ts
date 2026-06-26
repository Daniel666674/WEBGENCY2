import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "crm.db"));

const migrations = [
  // Projects
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES contacts(id),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'discovery',
    budget_cents INTEGER NOT NULL DEFAULT 0,
    start_date INTEGER,
    deadline INTEGER,
    mockup_url TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // Milestones
  `CREATE TABLE IF NOT EXISTS project_milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    due_date INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL
  )`,

  // Deliverables
  `CREATE TABLE IF NOT EXISTS project_deliverables (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL REFERENCES project_milestones(id),
    description TEXT NOT NULL,
    file_url TEXT,
    approved_at INTEGER,
    approved_by_user_id TEXT REFERENCES users(id),
    created_at INTEGER NOT NULL
  )`,

  // Payments
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES contacts(id),
    project_id TEXT REFERENCES projects(id),
    amount_cents INTEGER NOT NULL DEFAULT 0,
    paid_at INTEGER,
    note TEXT,
    created_at INTEGER NOT NULL
  )`,

  // Audit logs
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    meta TEXT,
    created_at INTEGER NOT NULL
  )`,

  // Add assigned_user_id to activities
  `ALTER TABLE activities ADD COLUMN assigned_user_id TEXT REFERENCES users(id)`,

  // Add agency fields to contacts if missing
  `ALTER TABLE contacts ADD COLUMN mockup_url TEXT`,
  `ALTER TABLE contacts ADD COLUMN site_url TEXT`,
  `ALTER TABLE contacts ADD COLUMN signed_date INTEGER`,
  `ALTER TABLE contacts ADD COLUMN monthly_payment INTEGER`,
  `ALTER TABLE contacts ADD COLUMN client_status TEXT NOT NULL DEFAULT 'prospect'`,
  `ALTER TABLE contacts ADD COLUMN next_payment_date INTEGER`,
];

for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Already exists — idempotent
  }
}

console.log("Migration v5 complete: projects, milestones, deliverables, payments, audit_logs.");
db.close();
