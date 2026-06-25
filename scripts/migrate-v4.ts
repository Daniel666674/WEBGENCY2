import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";

const db = new Database(path.join(process.cwd(), "data", "crm.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#0d9a8a',
    is_hers INTEGER NOT NULL DEFAULT 0,
    avatar TEXT,
    created_at INTEGER NOT NULL
  );
`);

const existing = db.prepare("SELECT COUNT(*) as cnt FROM users").get() as { cnt: number };
if (existing.cnt === 0) {
  const now = Date.now();
  db.prepare(`INSERT INTO users (id, name, color, is_hers, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), "Daniel", "#0d9a8a", 0, "D", now);
  db.prepare(`INSERT INTO users (id, name, color, is_hers, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), "Mi Amor", "#e879a0", 1, "♡", now);
  console.log("Seeded 2 users.");
}

console.log("Migration v4 complete: users table ready.");
db.close();
