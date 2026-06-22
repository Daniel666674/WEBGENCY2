import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "crm.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const stages = db
  .prepare('SELECT id, name FROM pipeline_stages ORDER BY "order"')
  .all() as Array<{ id: string; name: string }>;

const stageMap = new Map(stages.map((s) => [s.name, s.id]));
const propuestaId = stageMap.get("Propuesta") || stages[2].id;
const now = Math.floor(Date.now() / 1000);

const insertContact = db.prepare(
  `INSERT OR IGNORE INTO contacts (id, name, email, phone, company, source, temperature, score, notes, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const insertDeal = db.prepare(
  `INSERT OR IGNORE INTO deals (id, title, value, stage_id, contact_id, expected_close, probability, notes, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const proposals = [
  {
    contact: {
      id: crypto.randomUUID(),
      name: "B-Line Design",
      email: "",
      phone: "",
      company: "B-Line Design",
      source: "otro",
      temperature: "hot",
      score: 75,
      notes: "Propuesta activa. Sitio web + SEO basico + blog + optimizacion movil + GEO.",
    },
    deal: {
      title: "Sitio Web + SEO + Blog + GEO — B-Line Design",
      value: 200000000, // $2,000,000 COP en centavos
      probability: 70,
      notes: "Setup: $2,000,000 COP | Mensualidad: $400,000 COP. Incluye SEO basico, blog, mobile optimization y GEO.",
    },
  },
  {
    contact: {
      id: crypto.randomUUID(),
      name: "Parrashop",
      email: "",
      phone: "",
      company: "Parrashop",
      source: "otro",
      temperature: "hot",
      score: 80,
      notes: "Propuesta activa. Sitio web + marketing con community manager dedicado.",
    },
    deal: {
      title: "Sitio Web + Marketing + Community Manager — Parrashop",
      value: 250000000, // $2,500,000 COP en centavos
      probability: 65,
      notes: "Setup: $2,500,000 COP (unico) | Mensualidad: $1,500,000 COP (marketing incluido + community manager dedicado).",
    },
  },
  {
    contact: {
      id: crypto.randomUUID(),
      name: "Imperium Royal Perfume",
      email: "",
      phone: "",
      company: "Imperium Royal Perfume",
      source: "otro",
      temperature: "hot",
      score: 78,
      notes: "Propuesta activa. Sitio web con SEO avanzado, catalogo de productos.",
    },
    deal: {
      title: "Sitio Web + SEO Avanzado + Catalogo — Imperium Royal Perfume",
      value: 300000000, // $3,000,000 COP en centavos
      probability: 70,
      notes: "Setup: $3,000,000 COP | Mensualidad: $400,000 COP. Incluye SEO avanzado y catalogo de productos.",
    },
  },
  {
    contact: {
      id: crypto.randomUUID(),
      name: "Stike Bike Shop",
      email: "",
      phone: "",
      company: "Stike Bike Shop",
      source: "otro",
      temperature: "hot",
      score: 72,
      notes: "Propuesta activa. Sitio web para tienda de bicicletas.",
    },
    deal: {
      title: "Sitio Web — Stike Bike Shop",
      value: 250000000, // $2,500,000 COP en centavos
      probability: 65,
      notes: "Setup: $2,500,000 COP | Mensualidad: $400,000 COP.",
    },
  },
];

let contactsCreated = 0;
let dealsCreated = 0;

for (const p of proposals) {
  const contactId = p.contact.id;
  insertContact.run(
    contactId,
    p.contact.name,
    p.contact.email,
    p.contact.phone,
    p.contact.company,
    p.contact.source,
    p.contact.temperature,
    p.contact.score,
    p.contact.notes,
    now,
    now
  );
  contactsCreated++;

  const dealId = crypto.randomUUID();
  insertDeal.run(
    dealId,
    p.deal.title,
    p.deal.value,
    propuestaId,
    contactId,
    now + 30 * 86400,
    p.deal.probability,
    p.deal.notes,
    now,
    now
  );
  dealsCreated++;

  console.log(`✓ ${p.contact.name} — deal creado`);
}

console.log(`\nListo: ${contactsCreated} contactos y ${dealsCreated} deals agregados.`);
db.close();
