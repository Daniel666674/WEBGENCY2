import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "crm.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    contact_id TEXT REFERENCES contacts(id),
    proposal_id TEXT REFERENCES proposals(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'link',
    url TEXT,
    file_data TEXT,
    mime_type TEXT,
    size INTEGER,
    created_at INTEGER NOT NULL
  );
`);

console.log("Migration v3 complete: attachments table created.");
db.close();
