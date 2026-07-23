#!/usr/bin/env npx tsx
/**
 * One-time data migration: copies every row from the local SQLite file
 * (data/crm.db) into the Turso database configured via TURSO_DATABASE_URL /
 * TURSO_AUTH_TOKEN in .env.local.
 *
 * Run once, after `ensureSchema()` has created the tables on Turso (that
 * happens automatically on server boot, or run `npx tsx -e
 * "import('./src/db').then(m=>m.ensureSchema())"` first if you want it done
 * ahead of time).
 *
 * Usage:
 *   npx tsx scripts/migrate-to-turso.ts
 *
 * Reads raw rows via better-sqlite3 (no Drizzle mapping) and re-inserts them
 * via @libsql/client with the exact same column names/values, so integer
 * timestamps, JSON-blob text columns, and NULLs all round-trip unchanged.
 * INSERT OR IGNORE makes re-runs safe (won't duplicate already-migrated rows).
 */

import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import path from "path";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  // .env.local not found — assume TURSO_DATABASE_URL/TURSO_AUTH_TOKEN are
  // already in the environment (e.g. exported in the shell, or in CI).
}

const DB_PATH = path.join(process.cwd(), "data", "crm.db");

// Parent tables before the tables that reference them via FOREIGN KEY.
const TABLE_ORDER = [
  "users",
  "pipeline_stages",
  "contacts",
  "crm_settings",
  "accounts",
  "sessions",
  "verificationTokens",
  "authenticators",
  "deals",
  "activities",
  "projects",
  "project_milestones",
  "project_deliverables",
  "project_tasks",
  "proposals",
  "payments",
  "attachments",
  "audit_logs",
  "analytics_properties",
];

async function main() {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL no esta configurado (revisa .env.local)");
  }

  // Imported dynamically (inside main(), not at module top-level) so:
  // (a) it evaluates after loadEnvFile() above has set the env vars — its
  //     own createClient() call in ../src/db needs them already set, and
  // (b) top-level await isn't available here (tsx transforms this file as
  //     CJS since the project has no "type": "module" in package.json).
  const { ensureSchema } = await import("../src/db");

  console.log("Creando el schema en Turso si hace falta...");
  await ensureSchema();

  const sqlite = new Database(DB_PATH, { readonly: true });
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const existingTables = new Set(
    sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r) => (r as { name: string }).name)
  );

  const summary: Record<string, number> = {};

  for (const table of TABLE_ORDER) {
    if (!existingTables.has(table)) {
      console.log(`- ${table}: no existe en data/crm.db, saltando`);
      continue;
    }

    const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
    if (rows.length === 0) {
      console.log(`- ${table}: 0 filas`);
      summary[table] = 0;
      continue;
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => "?").join(", ");
    const quotedColumns = columns.map((c) => `"${c}"`).join(", ");
    const sql = `INSERT OR IGNORE INTO "${table}" (${quotedColumns}) VALUES (${placeholders})`;

    let migrated = 0;
    for (const row of rows) {
      const args = columns.map((c) => row[c]);
      await turso.execute({ sql, args: args as (string | number | null | bigint | Uint8Array)[] });
      migrated++;
    }

    console.log(`- ${table}: ${migrated} filas migradas`);
    summary[table] = migrated;
  }

  sqlite.close();
  turso.close();

  console.log("\nMigracion completa.");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error("FALLO la migracion:", e);
  process.exit(1);
});
