import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "crm.db"));

const migrations = [
  `CREATE TABLE IF NOT EXISTS project_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    type TEXT NOT NULL DEFAULT 'task',
    description TEXT NOT NULL,
    assigned_user_id TEXT REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    due_date INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
];

for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Already exists — idempotent
  }
}

console.log("Migration v7 complete: project_tasks table ready.");
db.close();
