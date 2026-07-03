import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "crm.db"));

const migrations = [
  `ALTER TABLE proposals ADD COLUMN pricing_meta TEXT NOT NULL DEFAULT '{}'`,
  `ALTER TABLE proposals ADD COLUMN valid_until INTEGER`,
];

for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Already exists — idempotent
  }
}

console.log("Migration v9 complete: proposals.pricing_meta + valid_until ready.");
db.close();
