import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "crm.db"));

const migrations = [
  `ALTER TABLE contacts ADD COLUMN automations_suspended INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE contacts ADD COLUMN last_payment_ref TEXT`,
];

for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Already exists — idempotent
  }
}

console.log("Migration v10 complete: contacts.automations_suspended + last_payment_ref ready.");
db.close();
