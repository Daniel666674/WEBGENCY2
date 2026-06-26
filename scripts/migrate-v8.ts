import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "crm.db"));

const migrations = [
  `ALTER TABLE proposals ADD COLUMN share_token TEXT`,
  `ALTER TABLE proposals ADD COLUMN viewed_at INTEGER`,
];

for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Already exists — idempotent
  }
}

console.log("Migration v8 complete: proposals.share_token + viewed_at ready.");
db.close();
