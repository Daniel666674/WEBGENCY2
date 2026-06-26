import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "crm.db"));

const migrations = [
  `ALTER TABLE attachments ADD COLUMN project_id TEXT REFERENCES projects(id)`,
];

for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Already exists — idempotent
  }
}

console.log("Migration v6 complete: attachments.project_id added.");
db.close();
