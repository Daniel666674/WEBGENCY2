import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { after } from "next/server";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const SOURCE_DB = path.join(process.cwd(), "data", "crm.db");

// On Vercel the filesystem is read-only except /tmp.
// Copy the committed DB to /tmp so SQLite can write WAL/SHM files.
const IS_VERCEL = !!process.env.VERCEL;
const DB_PATH = IS_VERCEL ? "/tmp/crm.db" : SOURCE_DB;

if (IS_VERCEL) {
  if (!fs.existsSync(DB_PATH) && fs.existsSync(SOURCE_DB)) {
    fs.copyFileSync(SOURCE_DB, DB_PATH);
  }
} else {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function createDatabase(): Database.Database {
  const db = new Database(DB_PATH, { timeout: 15000 });

  // Set pragmas individually with error handling
  try {
    db.pragma("journal_mode = WAL");
  } catch {
    // WAL mode might already be set by another process
  }

  try {
    db.pragma("busy_timeout = 15000");
  } catch {
    // Ignore if can't set
  }

  try {
    db.pragma("foreign_keys = ON");
  } catch {
    // Ignore
  }

  return db;
}

function initTables(db: Database.Database): void {
  // Each CREATE TABLE is its own statement to minimize lock time
  const tables = [
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      source TEXT NOT NULL DEFAULT 'otro',
      temperature TEXT NOT NULL DEFAULT 'cold',
      score INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS pipeline_stages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT '#64748b',
      is_won INTEGER NOT NULL DEFAULT 0,
      is_lost INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      expected_close INTEGER,
      probability INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      contact_id TEXT NOT NULL REFERENCES contacts(id),
      deal_id TEXT REFERENCES deals(id),
      scheduled_at INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS crm_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
  ];

  for (const sql of tables) {
    try {
      db.exec(sql);
    } catch {
      // Table might already exist or DB is locked - safe to continue
    }
  }
}

function seedDefaultStages(db: Database.Database): void {
  try {
    const result = db
      .prepare("SELECT COUNT(*) as count FROM pipeline_stages")
      .get() as { count: number } | undefined;

    if (!result || result.count > 0) return;

    const defaultStages = [
      { name: "Prospecto", order: 1, color: "#64748b", isWon: 0, isLost: 0 },
      { name: "Contactado", order: 2, color: "#2563eb", isWon: 0, isLost: 0 },
      { name: "Propuesta", order: 3, color: "#8b5cf6", isWon: 0, isLost: 0 },
      { name: "Negociacion", order: 4, color: "#ea580c", isWon: 0, isLost: 0 },
      { name: "Cerrado Ganado", order: 5, color: "#16a34a", isWon: 1, isLost: 0 },
      { name: "Cerrado Perdido", order: 6, color: "#dc2626", isWon: 0, isLost: 1 },
    ];

    const insert = db.prepare(
      `INSERT OR IGNORE INTO pipeline_stages (id, name, "order", color, is_won, is_lost) VALUES (?, ?, ?, ?, ?, ?)`
    );

    const seedAll = db.transaction(() => {
      for (const stage of defaultStages) {
        insert.run(
          crypto.randomUUID(),
          stage.name,
          stage.order,
          stage.color,
          stage.isWon,
          stage.isLost
        );
      }
    });

    seedAll();
  } catch {
    // Seeding can fail if another worker is doing it — that's fine
  }
}

const sqlite = createDatabase();
initTables(sqlite);
seedDefaultStages(sqlite);

// On Vercel, mirror every write to Blob storage so demo data survives cold
// starts (see src/lib/dbPersist.ts). Wraps prepare() so any statement whose
// run() mutates data schedules a re-upload of the DB file.
//
// The upload MUST be scheduled via next/server's after() rather than fired
// and forgotten: Vercel freezes a serverless function's execution the
// moment its HTTP response is sent, so a bare `.then()` chain routinely got
// killed mid-upload before ever reaching Blob — data appeared to save (the
// response came back fine) but never actually persisted. after() is the
// platform-supported way to keep the function alive until this finishes.
// No-op locally (no VERCEL env, no after() call, nothing changes).
if (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
  const persist = () => {
    import("@/lib/dbPersist")
      .then(({ uploadDbToBlob }) =>
        uploadDbToBlob(() => {
          try {
            sqlite.pragma("wal_checkpoint(TRUNCATE)");
          } catch {}
        })
      )
      .catch(() => {});
  };

  const MUTATING = /^\s*(insert|update|delete|replace)\b/i;
  const originalPrepare = sqlite.prepare.bind(sqlite);
  sqlite.prepare = ((source: string) => {
    const stmt = originalPrepare(source);
    if (MUTATING.test(source)) {
      const originalRun = stmt.run.bind(stmt);
      stmt.run = ((...args: unknown[]) => {
        const result = originalRun(...(args as Parameters<typeof originalRun>));
        try {
          after(persist); // must be called synchronously within the request for AsyncLocalStorage to track it
        } catch {
          persist(); // called outside a request scope (e.g. a script) — best effort
        }
        return result;
      }) as typeof stmt.run;
    }
    return stmt;
  }) as typeof sqlite.prepare;
}

export const db = drizzle(sqlite, { schema });
