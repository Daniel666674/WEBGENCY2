import path from "path";
import { createClient } from "@libsql/client";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch { /* assume env already set */ }

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL no configurado");
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function uuid() {
  return crypto.randomUUID();
}

const now = Math.floor(Date.now() / 1000);

const items = [
  // ── STACK ────────────────────────────────────────────────────────────────────

  {
    id: uuid(), name: "Static E-commerce Playbook", category: "Stack", status: "active",
    icon: "🛒",
    description: "Blueprint completo para tiendas estáticas: HTML/CSS/JS puro + GitHub como CMS + FTPS deploy. Sin Shopify, sin cuotas mensuales. Battle-tested en ESCENA BMX.",
    url: "https://escenabmx.com",
    tags: JSON.stringify(["static", "ecommerce", "html", "github", "hostinger", "ftps", "no-platform-fee"]),
    useCases: JSON.stringify([
      "Cliente con tienda física quiere presencia digital sin pagar $30-80/mes de Shopify",
      "Nicho de producto local: bikes, ropa, accesorios, artesanías",
      "Cliente que quiere control total del código sin dependencia de plataforma",
      "Proyecto donde el SEO y velocidad son críticos desde el primer día",
      "Primer proyecto e-com: bajo riesgo, costo mínimo, se puede escalar a Shopify después",
    ]),
    costCents: null,
    details: `ARQUITECTURA CORE
- index.html, tienda.html, producto/_template.html, blog/, admin.html
- window.ESCENA_PRODUCTS = [...] como fuente de verdad del catálogo (JS global, no JSON — carga sin CORS)
- GitHub Contents API como backend: admin.html escribe archivos directamente al repo via PAT
- GitHub Actions → FTPS → Hostinger para deploy automático en cada push a main
- WhatsApp checkout por defecto al lanzar (Phase 1), gateway real como scope separado (Phase 2)

MODELO DE DATOS POR PRODUCTO
{ n, brand, cat, spec, price, sku, img, imgs[], slug, units, sizes[], colors[], tag, promo, draft }
REGLA CRÍTICA: decidir ANTES del data entry cuáles categorías son size-driven vs color-driven vs flat-units.
Lookup table SIZE_CATEGORIES en admin.html. Error típico: alguien llena "color" con talla porque no había campo de talla para esa categoría → retrofit full-site.

DEPLOY Y CACHÉ (el gotcha #1)
.htaccess: HTML con no-cache, CSS/JS/img con max-age=31536000 immutable.
TODO asset mutable necesita ?v=N en su URL — BUMPEARLO en cada cambio.
Sin esto, un "fix" no llega a nadie que ya tiene el archivo cacheado. Pasó 4 veces en ESCENA.
FTPS transient timeouts: si el deploy falla con "Error: Timeout (control socket)", es del lado de Hostinger, no del código. Re-trigger workflow.

CHECKLIST DE REPLICACIÓN (12 pasos)
1. Registrar dominio + Hostinger Business (SSL activo, PHP+MySQL disponible aunque no se use)
2. Fork repo → find-replace dominio, brand, colores, WhatsApp, dirección
3. Decidir lista de categorías + tipo (size/color/flat) ANTES del data entry
4. Adaptar _template.html + genPage() del admin para el diseño del nuevo cliente
5. Configurar GitHub Actions secrets (FTPS host, user, pass)
6. .htaccess cache headers + clean URL rewrites
7. Google Cloud project + OAuth consent screen (testing mode, allow-list corto)
8. Hardcodear allow-list de emails admin en admin.html
9. Crear GA4 property + verificar Search Console (domain property preferida)
10. Generar icon set completo incluyendo 48x48 PNG favicon (Google lo requiere)
11. robots.txt + sitemap.xml + llms.txt
12. Cookie consent banner ANTES de conectar gtag.js

UPSELL NATURAL
Phase 1 (este stack): $X,XXX setup
Phase 2 → gateway de pago real (Wompi/PayU para CO): $XXX adicional
Phase 3 → backend real + user accounts: replatform completo, quote separado`,
    notes: "Base del negocio de e-com de la agencia. Cada cliente nuevo debería empezar aquí antes de hablar de Shopify.",
  },

  {
    id: uuid(), name: "Auto-CRM OLIWAN", category: "Stack", status: "active",
    icon: "🧠",
    description: "El CRM que usamos. Next.js 16 + Turso + Drizzle ORM + shadcn/ui + Tailwind v4. Multi-tenant listo, se puede replicar para otros clientes que necesiten CRM propio.",
    url: null,
    tags: JSON.stringify(["nextjs", "turso", "drizzle", "shadcn", "tailwind", "crm", "typescript"]),
    useCases: JSON.stringify([
      "Agencia que necesita su propio CRM sin pagar HubSpot ($800+/mes)",
      "Cliente que quiere un CRM interno customizado para su industria",
      "Equipo de ventas pequeño (2-10 personas) que vive en WhatsApp y necesita seguimiento",
      "Negocio con pipeline de ventas complejo que no encaja en tools genéricos",
    ]),
    costCents: null,
    details: `STACK TÉCNICO
Next.js 16 (App Router) · React 19 · TypeScript strict
Turso (libSQL/SQLite hosted) + Drizzle ORM async
shadcn/ui + Tailwind CSS v4 (config via CSS, no tailwind.config.ts)
@dnd-kit (kanban drag-drop) · Recharts (charts) · date-fns · react-hook-form + zod

ARQUITECTURA
- App Router: src/app/(app)/ para páginas autenticadas
- API routes: src/app/api/
- DB schema: src/db/schema.ts + Drizzle migrations
- Auth: cookie session firmada con HMAC (SESSION_SECRET) — no Auth.js dependency para el login básico
- MCP server: mcp/crm-server.ts — expone el CRM como herramientas para Claude Desktop/Web

MÓDULOS ACTUALES
Pipeline kanban · Contactos/Leads · Deals · Actividades · Revenue · Forecast
Clientes activos · Proyectos · Tareas · Solicitudes · Entregables
Propuestas (PDF-ready) · Calculadora de precios · Analytics (GA4+GSC live)
Arsenal (este módulo) · Planner · Onboarding

VALORES MONETARIOS: siempre en centavos (integer). Usar formatCurrency() para mostrar.
IDIOMA UI: Español por defecto.
FECHAS: date-fns + Turso almacena timestamps como integer.

REPLICACIÓN PARA CLIENTES
1. Fork del repo
2. Nueva Turso DB para ese cliente
3. Cambiar branding (logo, colores, nombre)
4. Activar/desactivar módulos según necesidad
5. Deploy en Vercel (gratis tier funciona para 1-2 usuarios)
Precio sugerido: $500-1,500 setup + $50-100/mes retainer de mantenimiento

UPSELL
- Módulos custom (ej: módulo de facturas, inventario, tickets de soporte)
- Integración con su herramienta existente via MCP o webhook
- Training + documentación: $XXX adicional`,
    notes: "No compartir el repo privado directamente. Si se vende a cliente, hacer fork limpio sin historial de la agencia.",
  },

  {
    id: uuid(), name: "GitHub Contents API como CMS", category: "Backend", status: "active",
    icon: "🐙",
    description: "GitHub como base de datos y CMS serverless. El admin panel escribe archivos JS/HTML directamente al repo via API con un PAT. Sin DB, sin servidor, con historial de versiones gratis.",
    url: "https://docs.github.com/en/rest/repos/contents",
    tags: JSON.stringify(["github", "api", "serverless", "cms", "no-database", "pat"]),
    useCases: JSON.stringify([
      "Tienda estática donde el cliente quiere editar su catálogo sin tocar código",
      "Admin panel interno para un sitio de marketing con contenido que cambia poco",
      "Proyecto donde el cliente no tiene presupuesto para DB hosting ni backend",
      "Cualquier sitio donde el historial de cambios al contenido tiene valor",
    ]),
    costCents: 0,
    details: `CÓMO FUNCIONA
1. Admin panel (admin.html) hace GET al archivo actual: ghGetFile(path)
2. Modifica el objeto JS en memoria
3. Hace PUT con el nuevo contenido + SHA del archivo actual: ghPutFile(path, content, sha)
4. Cada cambio = un commit en el repo → historial gratis, rollback trivial

ENDPOINTS CLAVE
GET  /repos/{owner}/{repo}/contents/{path}  → lee archivo + SHA actual
PUT  /repos/{owner}/{repo}/contents/{path}  → escribe (requiere SHA para updates)

AUTENTICACIÓN
Personal Access Token (PAT) con scope: contents:write
Lo ingresa el admin una vez, se guarda en localStorage (no IdealSec pero OK para uso personal)
Future: moverlo server-side (cualquier backend pequeño) para no exponer el PAT al cliente

GOTCHA CRÍTICO
Siempre leer el SHA actual antes de hacer un PUT. Si el SHA no coincide (alguien más editó), GitHub rechaza con 409. Manejar este caso si hay múltiples editores simultáneos (en proyectos pequeños raro, pero posible).

LIMITACIONES QUE IMPORTAN
- No escala para múltiples editores simultáneos (race conditions en SHA)
- Repo público = archivos de datos públicos (incluyendo sales-log con revenue real) — decidir per-cliente si hacer repo privado
- GitHub API rate limit: 5,000 req/hora con PAT autenticado, más que suficiente para uso de admin panel
- Si el repo es privado, los archivos estáticos no se pueden servir directamente al público sin un paso adicional (CDN, proxy)

ALTERNATIVAS PARA ESCALAR
- PocketBase (self-hosted, liviano, gratuito)
- Turso (usado en el CRM) para proyectos Next.js
- Supabase Free tier para proyectos con más queries`,
    notes: null,
  },

  // ── AUTOMATIONS ──────────────────────────────────────────────────────────────

  {
    id: uuid(), name: "GitHub Actions → FTPS Deploy", category: "Automation", status: "active",
    icon: "⚙️",
    description: "CI/CD para sitios estáticos en hosting compartido (Hostinger, cPanel). Push a main → deploy automático vía FTPS. Sin Vercel, sin Netlify, funciona con cualquier hosting.",
    url: "https://github.com/SamKirkland/FTP-Deploy-Action",
    tags: JSON.stringify(["github-actions", "ftps", "ci-cd", "hostinger", "deploy", "automation"]),
    useCases: JSON.stringify([
      "Cliente con hosting compartido ya pagado (Hostinger, GoDaddy, etc.)",
      "Sitio estático que necesita deploy automático sin costo adicional de Vercel/Netlify",
      "Cliente no técnico que necesita que su sitio se actualice solo al hacer cambios",
    ]),
    costCents: 0,
    details: `WORKFLOW (.github/workflows/deploy.yml)
on: push to main
steps: checkout → FTP-Deploy-Action (SamKirkland)

VARIABLES SECRETAS EN GITHUB REPO SETTINGS
FTP_SERVER: ftp.dominiodelcliente.com
FTP_USERNAME: usuario@dominiodelcliente.com
FTP_PASSWORD: la_contrasena

EXCLUIR DEL DEPLOY
server-dir: /public_html/
exclude: |
  **/.git*
  **/.github/**
  **/node_modules/**
  **/*.md

GOTCHA CONOCIDO
Hostinger FTPS ocasionalmente da "Error: Timeout (control socket)" sin razón de código.
Fix: re-trigger el workflow. Si pasa frecuente, revisar logs del job ANTES de asumir bug.
Workaround: un empty commit ("git commit --allow-empty -m 'retry deploy'") re-triggerea sin cambios de código.

CACHE + VERSIONADO (CRÍTICO)
Con .htaccess poniendo max-age=31536000 en CSS/JS/img, CUALQUIER asset que cambie necesita ?v=N.
Convención obligatoria: bump la versión en el HTML cada vez que cambies el archivo referenciado.
Un fix "aplicado" pero con asset cacheado = fix invisible para todos los usuarios existentes.

ALTERNATIVA PARA PROYECTOS NEXT.JS
Vercel (gratis para proyectos personales/hobby, $20/mes Pro para custom domains sin límite)
Se configura sólo conectando el repo de GitHub.`,
    notes: null,
  },

  {
    id: uuid(), name: "Webhook → CRM Lead Capture", category: "Automation", status: "active",
    icon: "🪝",
    description: "Cualquier formulario externo (Typeform, Tally, Google Forms, sitio del cliente) envía leads directo al CRM via POST /api/webhook. El contacto aparece automáticamente.",
    url: null,
    tags: JSON.stringify(["webhook", "typeform", "tally", "lead-capture", "automation", "crm", "api"]),
    useCases: JSON.stringify([
      "Formulario de contacto del sitio del cliente → CRM sin intervención manual",
      "Typeform de lead magnet → contacto automático en pipeline",
      "Landing page de ads → lead en CRM en tiempo real",
      "Cualquier herramienta no-code que soporte webhooks salientes (Tally, Fillout, etc.)",
    ]),
    costCents: 0,
    details: `ENDPOINT: POST /api/webhook
Acepta: name, email, phone, company, source, notes (+ cualquier campo extra en metadata)
Crea contacto automáticamente con temperatura "cold" y score 0

CONFIGURACIÓN EN TYPEFORM
Connects → Webhooks → URL: https://tu-crm.vercel.app/api/webhook
Mapear: respondent_field_xxxx → name, email, etc. (depende de los campos del form)

CONFIGURACIÓN EN TALLY
Integrations → Webhooks → Event: New submission → URL del endpoint
Tally envía todos los campos como key-value plano → el endpoint los mapea

CONFIGURACIÓN EN SITIO PROPIO (HTML)
fetch('/api/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, phone, source: 'web' })
})

UPSELL
Esta automatización sola justifica el CRM para un cliente:
"Cada lead de tu formulario aparece automáticamente aquí, clasificado, con historial."
Se puede cobrar como parte del setup + retainer de la herramienta.

EXTENSIONES POSIBLES
- Clasificación automática con Claude AI al recibir el lead
- Notificación por email (Resend) al recibir lead caliente
- Asignación automática de etapa de pipeline según fuente`,
    notes: null,
  },

  {
    id: uuid(), name: "Claude AI Commands (CRM)", category: "Automation", status: "active",
    icon: "🤖",
    description: "Comandos conversacionales de Claude Code que operan el CRM: /add-lead, /analyze-pipeline, /daily-briefing, /import-contacts. Claude lee y escribe en el CRM vía las API routes.",
    url: null,
    tags: JSON.stringify(["claude", "ai", "automation", "commands", "crm", "mcp", "agentic"]),
    useCases: JSON.stringify([
      "Agregar un lead describiendo al prospecto en lenguaje natural en vez de llenar formulario",
      "Análisis de pipeline con recomendaciones accionables en segundos",
      "Briefing ejecutivo diario: follow-ups pendientes, deals calientes, prioridades",
      "Importar CSV de contactos con normalización y deduplicación automática",
    ]),
    costCents: null,
    details: `COMANDOS DISPONIBLES
/add-lead      — Describe al prospecto, Claude lo crea en el CRM con campos normalizados
/analyze-pipeline — Análisis completo del pipeline con recomendaciones
/daily-briefing   — Resumen ejecutivo: follow-ups vencidos, deals hot, actividades del día
/import-contacts  — Importa CSV, Claude normaliza columnas y hace POST /api/import
/setup            — Personalizar el CRM para un nuevo negocio
/connect          — Conectar con Gmail, Calendar, Sheets via MCP

CÓMO FUNCIONA
Los comandos están en .claude/commands/*.md — son prompts que le dicen a Claude:
1. Leer el contexto del CRM (API routes)
2. Hacer las operaciones necesarias
3. Confirmar lo que hizo

SIN API KEY: todo el "AI" corre via Claude Code (el developer tool). El usuario escribe /add-lead, Claude ejecuta las API calls.
CON ANTHROPIC_API_KEY: la web tiene clasificación automática de leads inline.

MCP SERVER
npm run mcp inicia crm-server.ts que expone el CRM como herramientas MCP.
Claude Desktop/Web puede entonces operar el CRM directamente como un tool-use agent.
Config en claude_desktop_config.json:
{ "mcpServers": { "auto-crm": { "command": "npx", "args": ["tsx", "/ruta/mcp/crm-server.ts"] } } }

UPSELL PARA CLIENTES
"Tu equipo puede agregar leads y ver el pipeline hablándole a Claude."
Esto es diferenciador vs cualquier CRM convencional.
Se puede vender como "AI-powered CRM setup" con un premium de $XXX sobre el setup base.`,
    notes: null,
  },

  {
    id: uuid(), name: "Resend Email Digest", category: "Automation", status: "active",
    icon: "📧",
    description: "Resumen diario del CRM enviado por email vía Resend. Incluye follow-ups pendientes, deals calientes y actividades del día. Free tier: 3,000 emails/mes.",
    url: "https://resend.com",
    tags: JSON.stringify(["resend", "email", "automation", "digest", "notifications"]),
    useCases: JSON.stringify([
      "Recibir briefing diario del pipeline sin tener que abrir el CRM cada mañana",
      "Notificación de nuevos leads recibidos via webhook",
      "Recordatorio automático de follow-ups vencidos",
    ]),
    costCents: 0,
    details: `SETUP
1. Crear cuenta en resend.com (gratis: 3,000 emails/mes, 100/día)
2. Verificar dominio o usar onboarding@resend.dev como remitente
3. Agregar en .env: RESEND_API_KEY=re_xxxx, DIGEST_EMAIL=tu@email.com, DIGEST_FROM=noreply@tudominio.com
4. POST /api/digest → dispara el resumen inmediatamente

AUTOMATIZACIÓN
Para envío automático diario se puede usar:
- Vercel Cron Jobs (en vercel.json): { "crons": [{ "path": "/api/digest", "schedule": "0 8 * * *" }] }
- GitHub Actions scheduled (workflow con cron: "0 8 * * *" → curl al endpoint)
- n8n/Make con HTTP request a la hora configurada

CONTENIDO DEL EMAIL
- Follow-ups vencidos (con link al contacto)
- Deals calientes (hot leads)
- Actividades del día
- Resumen del pipeline

UPSELL
Para clientes que tienen el CRM: incluir Resend digest en el retainer mensual.
"Cada mañana a las 8am recibes el estado de tu pipeline en tu email."`,
    notes: null,
  },

  // ── BACKEND ──────────────────────────────────────────────────────────────────

  {
    id: uuid(), name: "Turso (libSQL)", category: "Backend", status: "active",
    icon: "🦭",
    description: "Base de datos SQLite hosted. Compatible con Vercel serverless, siempre disponible, sin fricción de archivos locales. $0/mes en Free tier para 1 DB + 500MB.",
    url: "https://turso.tech",
    tags: JSON.stringify(["turso", "libsql", "sqlite", "database", "serverless", "hosted"]),
    useCases: JSON.stringify([
      "Cualquier proyecto Next.js en Vercel que necesite DB persistente sin pagar $20+/mes",
      "CRM o admin panel con pocos usuarios simultáneos (< 50 req/s)",
      "Proyecto donde SQLite es suficiente y no se necesita escala horizontal",
    ]),
    costCents: 0,
    details: `SETUP RÁPIDO
1. turso.tech → crear cuenta → crear DB
2. turso db create nombre-db
3. turso db tokens create nombre-db → copiar token
4. Agregar a .env: TURSO_DATABASE_URL=libsql://nombre.turso.io, TURSO_AUTH_TOKEN=eyJ...

INTEGRACIÓN CON DRIZZLE
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
export const db = drizzle(client, { schema })

DIFERENCIA VS SQLITE LOCAL EN VERCEL
SQLite local en /tmp: se resetea entre deploys, sin persistencia real.
Turso: siempre disponible, mismo SQL, mismo Drizzle — cero cambio de código al migrar.

FREE TIER LÍMITES
500MB storage, 1B row reads/mes, 25M row writes/mes
Para proyectos de agencia con 10-100 clientes: más que suficiente.

GOTCHA DE BUILD
Si TURSO_DATABASE_URL no está disponible en build time (Vercel no la tiene en el paso de compilación), usar fallback: process.env.TURSO_DATABASE_URL || "file::memory:" para evitar URL_INVALID en build.

ALTERNATIVAS
PlanetScale (MySQL serverless, mejor para escala grande)
Supabase (PostgreSQL + auth + storage, más features, más complejo)
Neon (PostgreSQL serverless, muy similar a Turso en pricing)`,
    notes: null,
  },

  {
    id: uuid(), name: "Vercel", category: "Backend", status: "active",
    icon: "▲",
    description: "Deploy de Next.js con cero config. Preview automático por PR, dominio custom gratis, edge functions, cron jobs. Free para hobby, $20/mes Pro para uso comercial.",
    url: "https://vercel.com",
    tags: JSON.stringify(["vercel", "hosting", "nextjs", "serverless", "deploy", "cdn"]),
    useCases: JSON.stringify([
      "Cualquier proyecto Next.js: CRM, landing, e-com con backend",
      "Preview deployments para mostrar trabajo al cliente antes de ir live",
      "Proyectos donde el cliente quiere dominio propio sin gestionar servidor",
    ]),
    costCents: 2000,
    details: `TIERS
Hobby: gratis, sin límite de proyectos, 1 persona, dominio .vercel.app o custom
Pro: $20/mes, múltiples miembros del equipo, sin límite de bandwidth, analytics incluidos

SETUP BÁSICO
1. vercel.com → conectar repo de GitHub
2. Deploy automático en cada push a main
3. Preview deployment en cada PR (URL única por PR)
4. Agregar dominio custom: Settings → Domains → apunta CNAME en tu DNS

VARIABLES DE ENTORNO
Settings → Environment Variables → separar entre Production/Preview/Development
Para TURSO_DATABASE_URL y similares: solo en Production si quieres DB separada por ambiente.

CRON JOBS (Hobby no soporta, Pro sí)
vercel.json: { "crons": [{ "path": "/api/digest", "schedule": "0 8 * * *" }] }

GOTCHA CON TURSO
La URL del DB debe estar en las env vars del proyecto de Vercel (no solo en .env.local local).
Sin eso: el build pasa pero las API routes fallan en producción con "not configured".

ALTERNATIVAS
Railway ($5/mes, también soporta contenedores Docker — mejor si necesitas workers o crons pesados)
Fly.io (más control, VPS-like pero managed)
VPS propio (Docker Compose, ver CLAUDE.md §Despliegue)`,
    notes: null,
  },

  // ── INTEGRATIONS ─────────────────────────────────────────────────────────────

  {
    id: uuid(), name: "Google Service Account (Analytics)", category: "Integration", status: "active",
    icon: "📊",
    description: "Acceso server-to-server a GA4 + Search Console sin login del usuario. La cuenta de servicio se agrega como Viewer en la propiedad del cliente. Un solo JSON key para todos los clientes.",
    url: "https://console.cloud.google.com",
    tags: JSON.stringify(["google", "ga4", "search-console", "service-account", "analytics", "api"]),
    useCases: JSON.stringify([
      "CRM que muestra métricas vivas de GA4 + GSC de cada cliente en su ficha de contacto",
      "Dashboard de agencia con datos de múltiples clientes sin que ninguno tenga que autorizar OAuth",
      "Reportes automáticos de SEO para clientes sin intervención humana",
    ]),
    costCents: 0,
    details: `SETUP (una sola vez)
1. Google Cloud Console → nuevo proyecto (ej: "oliwan-analytics")
2. Habilitar: Analytics Data API + Google Search Console API
3. IAM → Cuentas de servicio → Crear → descargar JSON key
4. Email de la cuenta: oliwan-analytics-reader@proyecto.iam.gserviceaccount.com

PARA CADA CLIENTE NUEVO
GA4: Admin → Property Access Management → Agregar usuario → email de la cuenta → Viewer
GSC: Settings → Users and permissions → Add user → email → Full

CONFIGURACIÓN EN CRM
Env var: GOOGLE_SERVICE_ACCOUNT_KEY=<JSON completo del key, en una sola línea>
El JSON ya tiene \n en private_key — pegar tal cual en Vercel env vars.
El CRM ya tiene getServiceAccountAuth() en src/lib/googleAnalytics.ts

ESCALA
Una cuenta de servicio puede tener acceso a TODAS las propiedades de todos los clientes.
Cada cliente solo necesita agregar el email una vez. El CRM maneja el routing (GA4 Property ID + GSC site URL se guardan por contacto en analytics_properties table).

SEGURIDAD
El JSON key es tan sensible como una contraseña. NUNCA commitear al repo.
Rotarlo si se compromete: Cloud Console → cuenta de servicio → Agregar key → Borrar key vieja.

GOTCHA
Crear la cuenta NO le da acceso automáticamente. El paso de agregarla a GA4 y GSC es SEPARADO y OBLIGATORIO. Sin ese paso: auth ok, datos: 403.`,
    notes: "Cuenta actual: oliwan-analytics-reader@escena-admin.iam.gserviceaccount.com — tiene acceso a ESCENA BMX.",
  },

  {
    id: uuid(), name: "Google OAuth (Admin Panel)", category: "Integration", status: "active",
    icon: "🔐",
    description: "Login gate client-side para admin panels estáticos. Google Identity Services SDK + email allow-list en admin.html. Sin servidor, sin Auth.js, funciona en cualquier hosting.",
    url: "https://developers.google.com/identity",
    tags: JSON.stringify(["google-oauth", "auth", "admin", "static-site", "identity", "gcp"]),
    useCases: JSON.stringify([
      "Admin panel estático que solo puede acceder el dueño del negocio y el equipo de la agencia",
      "Sitio donde no hay backend para manejar sesiones",
      "Prototipo rápido donde se necesita auth sin setup complejo",
    ]),
    costCents: 0,
    details: `CÓMO FUNCIONA
1. Google Identity Services SDK carga en admin.html
2. Usuario hace click en "Iniciar sesión con Google"
3. Google retorna un ID token (JWT) con el email del usuario
4. JavaScript verifica que el email esté en el array ALLOWED_EMAILS
5. Si pasa: acceso al panel. Si no: "Acceso denegado".

SETUP EN GOOGLE CLOUD
1. Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized JavaScript origins: https://tudominio.com + http://localhost:3000
4. No se necesita "Authorized redirect URIs" para el flujo de ID token

GOTCHA CRÍTICO (pasó en ESCENA)
Dos pasos SEPARADOS e independientes:
- Agregar usuario en Cloud Console → OAuth consent screen → Test users (para que pueda autenticarse con Google)
- Agregar email al ALLOWED_EMAILS array en admin.html (para que tenga acceso al panel)
Ambos son requeridos. Sin el primero: error de Google. Sin el segundo: "Acceso denegado" aunque Google autenticó ok.

ACCESO A GA4/GSC DESDE EL PANEL
El admin panel puede pedir scopes adicionales en el login:
google.accounts.oauth2.initTokenClient({ scope: 'analytics.readonly webmasters.readonly' })
Esto da acceso a los datos del usuario logueado SIN cuenta de servicio.
Solo sirve dentro del admin panel; para un sistema externo (como el CRM), usar Service Account.

ALTERNATIVA PARA PROYECTOS NEXT.JS
Auth.js (NextAuth v5) con Google provider — más features, maneja sesiones server-side.`,
    notes: null,
  },

  {
    id: uuid(), name: "WhatsApp Checkout", category: "Integration", status: "active",
    icon: "💬",
    description: "El carrito construye el pedido, el checkout abre WhatsApp con un mensaje pre-llenado. Sin gateway de pagos, sin PCI, funciona en 1 día. Fase 2: gateway real.",
    url: null,
    tags: JSON.stringify(["whatsapp", "checkout", "ecommerce", "no-gateway", "phase-1", "conversion"]),
    useCases: JSON.stringify([
      "Tienda local con volumen bajo-medio que no justifica integrar un gateway",
      "Primer lanzamiento: validar demanda antes de invertir en pagos reales",
      "Negocio donde el dueño prefiere confirmar cada pedido manualmente (customizaciones, tallas, stock)",
      "Mercado donde WhatsApp es el canal de venta dominante (Colombia, Latam en general)",
    ]),
    costCents: 0,
    details: `IMPLEMENTACIÓN
URL de WhatsApp: https://wa.me/57XXXXXXXXXX?text=MENSAJE_URL_ENCODED
El mensaje se construye en JavaScript con los items del carrito:
"Hola! Quiero hacer este pedido:\n• 2x Casco Fox V1 Talla M - $180,000\n• 1x Guantes Troy Lee XS - $65,000\nTotal: $245,000"

CARRITO EN LOCALSTORAGE
window.CART_ITEMS = [] — array de { slug, name, qty, price, variant }
Persiste entre páginas y recargas
Header badge count = CART_ITEMS.reduce((sum, i) => sum + i.qty, 0)
Qty steppers capeados al stock real del producto (leer de ESCENA_PRODUCTS)

TRUST ISSUES QUE RESOLVER
- Mostrar que es un negocio real (dirección, horarios, Google Maps embed)
- Strip de "garantías": envío seguro, producto original, soporte por WhatsApp
- No inventar un sistema de tracking si no existe — mejor: "Pregunta por tu pedido: [WA link]"

UPSELL A FASE 2
Cuando el cliente tenga >50 pedidos/mes, el argumento para un gateway real es fácil:
- Wompi (Colombia): fácil integración, acepta PSE + tarjetas, 2.99% + $1,500/transacción
- PayU Latam: más mercados, setup más complejo
- Stripe: si vende a clientes en USD
Budget estimado para implementar gateway: $XXX adicional como proyecto separado.`,
    notes: null,
  },

  {
    id: uuid(), name: "Wompi / PayU (Payment Gateway CO)", category: "Integration", status: "planned",
    icon: "💳",
    description: "Gateway de pagos para Colombia: PSE, tarjetas, Nequi. Fase 2 natural después de WhatsApp checkout. Wompi es el más fácil de integrar. PayU para más mercados Latam.",
    url: "https://wompi.com",
    tags: JSON.stringify(["wompi", "payu", "payments", "colombia", "pse", "ecommerce", "phase-2"]),
    useCases: JSON.stringify([
      "Tienda con >50 pedidos/mes donde el proceso manual de WhatsApp se vuelve cuello de botella",
      "Cliente que quiere automatizar pagos y reducir tiempo en atención de pedidos",
      "Expansión a clientes internacionales (PayU cubre más de Latam)",
    ]),
    costCents: null,
    details: `WOMPI
Tasa: 2.99% + $1,500 COP por transacción aprobada
Métodos: PSE, tarjetas débito/crédito, Nequi, Bancolombia QR
Setup: crear cuenta en wompi.com → generar public key + private key
Integración: widget embebido (fácil) o API directa (más control)
Doc: developers.wompi.co

PAYU
Cubre: Colombia, México, Perú, Chile, Argentina, Brasil, Panamá
Setup más complejo: sandbox + cuenta merchant + validación de negocio
Mejor si el cliente ya piensa en expandirse regionalmente

SCOPE PARA COTIZAR ESTA FASE
- Crear cuenta gateway + validación KYC del cliente (~1 semana proceso)
- Integrar widget en checkout del sitio estático (si es HTML puro, más sencillo con widget)
- Si Next.js: usar webhooks de confirmación de pago → actualizar stock automáticamente
- Pruebas con tarjetas de prueba
- Manejar estados: pendiente, aprobado, rechazado, reembolsado
Estimado: $500-1,500 adicionales al proyecto base dependiendo de complejidad`,
    notes: "Siempre cotizar esto como proyecto separado, no incluirlo en el precio base del e-com. El cliente debe entender que los pagos reales son una fase distinta.",
  },

  // ── TOOLS ────────────────────────────────────────────────────────────────────

  {
    id: uuid(), name: "Drizzle ORM", category: "Tool", status: "active",
    icon: "🏋️",
    description: "ORM TypeScript type-safe para SQL. Compatible con Turso/libSQL, SQLite, PostgreSQL, MySQL. Queries con autocompletado, sin magic strings, migraciones declarativas.",
    url: "https://orm.drizzle.team",
    tags: JSON.stringify(["drizzle", "orm", "typescript", "sql", "turso", "sqlite", "type-safe"]),
    useCases: JSON.stringify([
      "Cualquier proyecto Next.js/Node que necesite acceso a DB con seguridad de tipos",
      "Migración de SQL puro a código mantenible sin overhead de un ORM pesado",
    ]),
    costCents: 0,
    details: `DIFERENCIA VS PRISMA
Drizzle es más liviano, sin Prisma engine binario, funciona mejor en Vercel Edge/serverless.
Query builder explícito (similar a SQL) vs Prisma que abstrae más.
Para proyectos pequeños-medianos con equipo de 1-3 personas: Drizzle gana en simplicidad.

PATRON DE USO EN EL CRM
// schema.ts
export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// uso
const all = await db.select().from(contacts).all()
const one = await db.select().from(contacts).where(eq(contacts.id, id)).get()
await db.insert(contacts).values({ name: "Daniel" }).returning().get()
await db.update(contacts).set({ name: "nuevo" }).where(eq(contacts.id, id)).returning().get()

IMPORTANTE: TODAS las queries con Turso son async — siempre await.
Si falta el await: retorna una Promise, no el resultado. Bug silencioso.

MIGRACIONES
drizzle-kit generate → genera SQL de migración
drizzle-kit push → aplica directo a la DB (OK para dev/staging, cuidado en prod)
En el CRM usamos ensureSchema() con CREATE TABLE IF NOT EXISTS — más simple para el uso case.`,
    notes: null,
  },

  {
    id: uuid(), name: "shadcn/ui", category: "Tool", status: "active",
    icon: "🎨",
    description: "Componentes UI para React/Next.js: no es una librería instalada, los componentes se copian al proyecto. Basado en Radix UI + Tailwind. 100% customizable.",
    url: "https://ui.shadcn.com",
    tags: JSON.stringify(["shadcn", "ui", "react", "radix", "tailwind", "components", "design-system"]),
    useCases: JSON.stringify([
      "Cualquier proyecto Next.js donde se necesita UI consistente rápido sin diseñar desde cero",
      "Admin panels, dashboards, CRMs internos",
    ]),
    costCents: 0,
    details: `POR QUÉ NO ES UNA LIBRERÍA NORMAL
Los componentes se agregan al proyecto con 'npx shadcn@latest add button'.
Quedan en src/components/ui/ — son TUYOS, los modificas sin restricciones.
No hay versiones que "rompan" tu código — una vez copiado, es tu código.

COMPONENTES MÁS USADOS EN EL CRM
Card, CardContent, CardHeader, CardTitle
Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
Input, Label, Textarea, Button, Badge
Separator, Tooltip, TooltipContent, TooltipTrigger
Select (Radix-based, fullscreen en mobile si no se configura modal:false)

TAILWIND V4 NOTA
En Tailwind v4 la config es vía CSS (@theme en globals.css), NO tailwind.config.ts.
shadcn se integra via @import "shadcn/tailwind.css" en globals.css.
Las variables CSS (--primary, --background, etc.) definen el tema.

CUSTOMIZACIÓN DE TEMA
Cambiar --primary en :root { } cambia todos los componentes que usan bg-primary, text-primary, etc.
Para temas por usuario/contexto: cambiar las CSS variables en JavaScript (document.documentElement.style.setProperty)`,
    notes: null,
  },

  {
    id: uuid(), name: "Recharts", category: "Tool", status: "active",
    icon: "📈",
    description: "Librería de charts para React. Usada en el CRM para pipeline charts, analytics dashboard (GSC trend, sparklines). Declarativa, responsive, composable.",
    url: "https://recharts.org",
    tags: JSON.stringify(["recharts", "charts", "react", "data-viz", "dashboard"]),
    useCases: JSON.stringify([
      "Dashboard de analytics en CRM o admin panel",
      "Reportes visuales para cliente (revenue, pipeline, SEO trends)",
    ]),
    costCents: 0,
    details: `COMPONENTES CLAVE USADOS EN EL CRM
ResponsiveContainer — siempre envolver charts para que sean responsive
ComposedChart — combina Line + Area + Bar en un solo chart
LineChart, AreaChart, BarChart — charts simples
XAxis, YAxis — ejes (yAxisId="left"/"right" para dual axis)
Tooltip — con content={<CustomComponent>} para tooltips custom
CartesianGrid, Area, Line, Bar, Cell

DUAL Y-AXIS (para GSC dashboard: clicks vs impresiones en escalas diferentes)
<YAxis yAxisId="left" /> → <Line yAxisId="left" dataKey="Clics" />
<YAxis yAxisId="right" orientation="right" /> → <Area yAxisId="right" dataKey="Impresiones" />

MINI SPARKLINES (en KPI tiles)
<ComposedChart data={pts} margin={{top:2,right:0,bottom:0,left:0}}>
  <Area type="monotone" dataKey="v" stroke={color} dot={false} isAnimationActive={false} />
</ComposedChart>
isAnimationActive={false} es crucial para sparklines — evita animaciones raras en re-renders frecuentes.

COLORES DEL TEMA
Leer de CSS variables en el JS: getComputedStyle(document.documentElement).getPropertyValue('--primary')
O hardcodear los valores del tema: #0d9a8a (primary teal), #8b5cf6 (purple), #16a34a (green)`,
    notes: null,
  },

  // ── PROCESS ──────────────────────────────────────────────────────────────────

  {
    id: uuid(), name: "SEO + GEO Stack", category: "Process", status: "active",
    icon: "🔍",
    description: "El stack de SEO/GEO que va en TODOS los proyectos: canonical, sitemap, robots.txt con GEO crawlers, JSON-LD, meta tags, favicon 48px, llms.txt. Battle-tested en ESCENA BMX.",
    url: null,
    tags: JSON.stringify(["seo", "geo", "robots", "sitemap", "json-ld", "structured-data", "llms-txt", "crawlers"]),
    useCases: JSON.stringify([
      "Cualquier sitio nuevo — esto va incluido por defecto en el scope de cada proyecto",
      "Auditoría SEO de sitio existente del cliente",
      "Sitio que quiere aparecer como fuente en respuestas de ChatGPT/Perplexity/Claude",
    ]),
    costCents: 0,
    details: `CHECKLIST SEO BÁSICO (va en TODOS los proyectos)
□ <link rel="canonical"> en cada página
□ <title> único por página (no templated genérico)
□ Meta description + Open Graph + Twitter Card en cada página
□ sitemap.xml actualizado (admin panel lo hace automático en proyectos e-com)
□ robots.txt con Sitemap: line
□ JSON-LD structured data en páginas de producto (Product, Organization)
□ Imágenes comprimidas + lazy-load + width/height explícitos (evitar layout shift)
□ Favicon 48x48px PNG declarado con <link rel="icon" sizes="48x48"> (Google lo usa en search results; 16/32px no alcanza)

CLEAN URLS (.htaccess)
/tienda → tienda.html
/producto/slug → producto/slug.html
Redirect 301 de bare domain a URL canónica (evita duplicate content en / y /home y /index.html)

GEO STACK (robots.txt additions para AI crawlers)
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: PerplexityBot
User-agent: ClaudeBot
User-agent: Claude-Web
User-agent: Google-Extended
Allow: /
Disallow: /admin.html
Disallow: /producto/_template.html

llms.txt (en raíz del sitio):
# [Nombre del negocio]
[Descripción de qué vende, dónde está, cómo contactar]
Contact: [WhatsApp/email]
Sitemap: https://dominio.com/sitemap.xml

LEVER DE REINDEXACIÓN
Google Search Console → URL Inspection → Request Indexing en el homepage después de lanzar o cambios grandes.
Tarda horas-días, no es instantáneo — pero es el único lever disponible para acelerar el recrawl.`,
    notes: "Incluir este checklist como parte del entregable de cada proyecto. Cobrar como parte del setup, no como extra.",
  },

  {
    id: uuid(), name: "Cache Busting Convention", category: "Process", status: "active",
    icon: "💥",
    description: "Convención OBLIGATORIA para sitios estáticos con cache largo: cada asset mutable lleva ?v=N en su URL, bumpeado en cada cambio. Omitirlo = fixes invisibles para usuarios existentes.",
    url: null,
    tags: JSON.stringify(["cache", "static-site", "htaccess", "versioning", "deploy", "convention"]),
    useCases: JSON.stringify([
      "Cualquier sitio estático con .htaccess cache-control max-age largo",
      "Evitar el bug de 'arreglé el código pero el cliente sigue viendo el error'",
    ]),
    costCents: 0,
    details: `EL PROBLEMA
.htaccess: <FilesMatch "\.(css|js|jpg)$"> Header set Cache-Control "public, max-age=31536000, immutable"
= el navegador cachea assets por 1 año.
Si subes un nuevo products-data.js al mismo URL → navegadores con cache no lo ven.
Resultado: "ya arreglé el bug" → el cliente sigue viendo el bug → desconfianza.

LA SOLUCIÓN
Cada referencia a un asset mutable en HTML usa query string:
<script src="assets/js/products-data.js?v=12"></script>
Al cambiar el archivo: bump el número → nueva URL → cache miss → versión nueva sirve.

QUÉ NECESITA ?v=N
- products-data.js (cambia con cada edit del catálogo)
- sales-log.js (cambia con cada venta)
- cart.js, site-header.css (cambia con cada fix/feature)
- product photos (si reusan el mismo filename con fotos nuevas)
- logos del brand strip

QUÉ NO NECESITA ?v=N
- Assets que NUNCA cambian de contenido una vez subidos (imágenes con nombre único incluye slug+hash)
- Archivos cuya URL ya es única por naturaleza

REGLA PRÁCTICA
Si el archivo puede cambiar en el futuro, SIEMPRE poner ?v=N desde el primer día.
Es más fácil que hacer un retrofit cuando ya hay usuarios con cache.

PASÓ EN ESCENA BMX: 4 veces por falta de esta convención (brand logos, header CSS, cart.js, product photos).
Ahora es obligatorio desde la primera línea de cada proyecto.`,
    notes: null,
  },

  {
    id: uuid(), name: "Onboarding de Cliente E-com", category: "Process", status: "active",
    icon: "🚀",
    description: "El proceso completo desde deal cerrado hasta sitio live: 12 pasos ordenados por dependencias. Incluye configuraciones de Google Cloud, deploy, SEO, catálogo y entrega.",
    url: null,
    tags: JSON.stringify(["onboarding", "process", "ecommerce", "checklist", "client", "replication"]),
    useCases: JSON.stringify([
      "Cada nuevo cliente de tienda estática — seguir estos pasos en orden",
      "Delegar parte del trabajo a un futuro empleado/freelancer con contexto completo",
      "Estimar tiempo y scope al cotizar un nuevo proyecto de este tipo",
    ]),
    costCents: null,
    details: `CHECKLIST COMPLETO (en orden de dependencias)

PRE-LAUNCH (antes de tocar código)
□ 1. Registrar dominio + contratar hosting (Hostinger Business: SSL activo, cPanel, backup diario)
□ 2. Decidir lista de categorías del catálogo y cuáles son size-driven vs color-driven vs flat-units — ANTES del data entry. Cambiar esto después es un retrofit.
□ 3. Crear Google Cloud project → OAuth consent screen (Testing mode) → agregar emails del admin allow-list

BUILD
□ 4. Fork del repo base → find-replace: dominio, brand name, colores, fuentes, WhatsApp number, dirección
□ 5. Adaptar _template.html y admin.html → genPage() para el diseño del cliente
□ 6. .htaccess: cache headers + clean URL rewrites + 301 home canonical
□ 7. Configurar GitHub Actions secrets (FTP_SERVER, FTP_USERNAME, FTP_PASSWORD)

GOOGLE SETUP
□ 8. GA4: crear property para el dominio del cliente
□ 9. Search Console: verificar el dominio (domain property preferida sobre URL-prefix)
□ 10. Generar icon set completo incluyendo 48×48 PNG favicon, linking en TODOS los HTML

SEO/GEO
□ 11. robots.txt (GEO crawler allow-list + disallow admin + disallow _template)
□ 12. sitemap.xml inicial
□ 13. llms.txt
□ 14. Cookie consent banner ANTES de agregar gtag.js

DATA + LAUNCH
□ 15. Poblar catálogo real (admin panel o CSV import)
□ 16. Primer deploy → verificar que FTPS funciona
□ 17. Search Console → URL Inspection → Request Indexing en homepage
□ 18. Smoke test: carrito → WhatsApp checkout → link en todos los dispositivos

ENTREGA AL CLIENTE
□ 19. Video walkthrough del admin panel (5-10min, Loom)
□ 20. Documento: cómo agregar productos, cómo ver analytics, a quién escribir para soporte`,
    notes: "Tiempo estimado: 2-3 semanas para la primera instancia, 1 semana para réplicas del mismo stack.",
  },

  {
    id: uuid(), name: "Brand Logo Sizing en Strips", category: "Process", status: "active",
    icon: "🎯",
    description: "Cómo hacer que logos de diferentes formatos (cuadrado, paisaje, portrait) se vean uniformes en un strip de marcas. Error común que aplasta logos wide. Battle-tested en ESCENA.",
    url: null,
    tags: JSON.stringify(["design", "logos", "brand-strip", "css", "ux", "ecommerce"]),
    useCases: JSON.stringify([
      "Tienda que muestra logos de marcas que maneja (Nike, Fox, Troy Lee, etc.)",
      "Cualquier página con un grid de logos de partners/clientes",
    ]),
    costCents: 0,
    details: `EL PROBLEMA
Logo strip con logos de diferentes aspect ratios: algunos cuadrados, algunos 3:1, algunos 1:2.
Si aplicas el mismo box width a todos, los wide-aspect logos se comprimen a tamaño ilegible mientras los cuadrados se ven bien.

LA SOLUCIÓN CORRECTA
1. CROP PRIMERO: cada logo al bounding box del ink (sin whitespace excess en el source file)
2. PADDING UNIFORME PER-AXIS: x% del ancho propio del logo (no del max width del contenedor) + y% del alto propio
3. NO usar padding fijo en píxeles si los logos varían mucho de tamaño

CSS APPROACH QUE FUNCIONA
.brand-chip img {
  max-height: 40px;   /* control de alto máximo */
  max-width: 120px;   /* control de ancho máximo */
  object-fit: contain;
  padding: 4px 8px;   /* padding relativo al contenedor, no al logo */
}

EL CASO STACKABLE (logos con icono + wordmark stacked en una imagen)
En un chip pequeño, un logo de 200×80px con icono arriba y texto abajo → texto ilegible.
Solución: aislar sólo el icono/símbolo para el strip, usar el logo completo en páginas de mayor tamaño (footer, acerca de).

PASÓ EN ESCENA: logos de marcas tipo Troy Lee Designs (muy wide) vs Oakley (más cuadrado) vs Fox Racing (paisaje moderado) todos en el mismo strip. Solución: crop + max-height normalizado + padding relativo.`,
    notes: null,
  },

  {
    id: uuid(), name: "Hostinger Business Hosting", category: "Backend", status: "active",
    icon: "🌐",
    description: "Hosting compartido para sitios estáticos de clientes. Soporta PHP + MySQL, SSL gratis, FTP/FTPS, cPanel, backups diarios. ~$3-7/mes. La opción más barata para proyectos e-com.",
    url: "https://hostinger.com",
    tags: JSON.stringify(["hostinger", "hosting", "ftps", "cpanel", "shared-hosting", "ssl", "php"]),
    useCases: JSON.stringify([
      "Sitios estáticos de clientes locales con presupuesto bajo",
      "E-com que eventualmente necesitará PHP para integraciones (formularios, gateway, etc.)",
      "Cliente que ya tiene dominio aquí y quiere simplificar",
    ]),
    costCents: 500,
    details: `PLAN RECOMENDADO: Business (~$5-7/mes con dominio incluido)
- Múltiples sitios (útil para gestionar varios clientes en una cuenta)
- 200GB SSD
- Backups diarios automáticos
- SSL gratis (Let's Encrypt via hPanel)
- FTP + FTPS para deploy vía GitHub Actions
- PHP + MySQL disponible aunque el sitio sea estático (útil para Phase 2 si se agrega backend)
- cPanel / hPanel para gestión

CONFIGURAR FTP PARA DEPLOY
hPanel → Archivos → Administrador de FTP → Crear cuenta FTP
Host: ftp.dominiocliente.com (o IP del servidor)
Puerto: 21 (FTP) o 990 (FTPS explícito)
Ruta: /public_html/ (docroot del dominio principal)

GOTCHA: FTPS TIMEOUTS
Hostinger ocasionalmente da timeout en la conexión FTPS sin razón de código.
Fix: re-trigger el GitHub Actions workflow. No es un bug del código.
Si pasa frecuentemente: contactar soporte de Hostinger o probar horarios de deploy con menos carga.

ALTERNATIVAS
- SiteGround: más caro (~$15/mes) pero soporte más confiable y mejor performance
- Vercel: para proyectos Next.js (gratis para hobby, $20/mes Pro) — preferido si no hay necesidad de FTP/PHP
- Netlify: similar a Vercel para sites estáticos

GESTIÓN MULTI-CLIENTE
Crear UNA cuenta de Hostinger con plan Business y agregar "Additional Websites" por cliente.
Más barato que una cuenta por cliente. Cuidado: si la cuenta se compromete, afecta a todos.
Alternativa profesional: cuenta separada por cliente (el cliente la paga, la agencia la gestiona).`,
    notes: "Preferir que el cliente sea el titular de la cuenta de hosting. La agencia maneja via FTP credentials sin acceso de facturación.",
  },

  {
    id: uuid(), name: "MCP Server (CRM)", category: "Integration", status: "active",
    icon: "🔌",
    description: "El CRM expuesto como servidor MCP para Claude Desktop y Claude Web. Permite a Claude leer y escribir contactos, deals, actividades — sin tocar el UI.",
    url: null,
    tags: JSON.stringify(["mcp", "claude", "ai", "integration", "crm", "api", "automation"]),
    useCases: JSON.stringify([
      "Operar el CRM conversacionalmente desde Claude Desktop sin abrir el browser",
      "Agentes de AI que necesitan datos del CRM como contexto para sus respuestas",
      "Automatizaciones que leen/escriben en el CRM sin intervención humana",
    ]),
    costCents: 0,
    details: `CONFIGURACIÓN
En ~/.claude/claude_desktop_config.json:
{
  "mcpServers": {
    "auto-crm": {
      "command": "npx",
      "args": ["tsx", "/ruta/al/proyecto/mcp/crm-server.ts"]
    }
  }
}

También disponible via: npm run mcp (inicia el servidor localmente)

HERRAMIENTAS EXPUESTAS (tools MCP)
- list_contacts(filter?, limit?)
- get_contact(id)
- create_contact(name, email, phone, company, source, temperature)
- update_contact(id, fields)
- list_deals(stageId?, contactId?)
- create_deal(title, value, stageId, contactId)
- list_activities(contactId?, pending?)
- log_activity(type, description, contactId)
- get_pipeline_stages()

CASOS DE USO CON CLAUDE
"¿Qué follow-ups tengo pendientes para hoy?" → Claude llama list_activities con pending:true
"Agrega un nuevo lead: Juan García, CEO de TechCo, me lo refirió María" → Claude llama create_contact
"¿Cuál es el valor total del pipeline?" → Claude llama list_deals y suma los valores

DIFERENCIA CON /add-lead COMMAND
Los comandos .claude/commands/ son prompts que Claude ejecuta via fetch() a las API routes.
El MCP server es diferente: expone las operaciones como herramientas nativas de Claude Tool Use.
MCP es más potente para agentes; los commands son más simples y no requieren configuración extra.

UPSELL
Vender como "CRM con voz" o "CRM operado por AI" a clientes que quieran diferenciarse.
Un equipo de ventas que puede actualizar el pipeline hablando con Claude = genuinamente diferente.`,
    notes: null,
  },

  {
    id: uuid(), name: "Cookie Consent + GDPR/Ley 1581", category: "Process", status: "active",
    icon: "🍪",
    description: "Banner de consentimiento propio: bloquea gtag.js hasta que el usuario acepta. Requerido antes de activar GA4. Self-built en 50 líneas, sin CMP externo costoso.",
    url: null,
    tags: JSON.stringify(["gdpr", "cookies", "ley-1581", "compliance", "ga4", "privacy", "consent"]),
    useCases: JSON.stringify([
      "Cualquier sitio que use GA4, Meta Pixel, o cualquier tracking — esto va ANTES de conectar gtag.js",
      "Clientes que venden a Colombia, UE, o cualquier mercado con regulación de privacidad",
      "Evitar multas + buildar confianza con usuarios",
    ]),
    costCents: 0,
    details: `IMPLEMENTACIÓN (50-70 líneas, no se necesita librería externa)

1. HTML: banner sticky en el bottom de la página
<div id="cookie-banner" style="display:none">
  <p>Usamos cookies para mejorar tu experiencia y analíticas. <a href="/privacidad">Más info</a></p>
  <button onclick="acceptCookies()">Aceptar</button>
  <button onclick="declineCookies()">Rechazar</button>
</div>

2. JAVASCRIPT:
function initConsent() {
  const consent = localStorage.getItem('cookie-consent')
  if (consent === 'accepted') { loadGA4(); return; }
  if (consent === 'declined') return;
  document.getElementById('cookie-banner').style.display = 'block'
}
function acceptCookies() {
  localStorage.setItem('cookie-consent', 'accepted')
  document.getElementById('cookie-banner').style.display = 'none'
  loadGA4()
}
function declineCookies() {
  localStorage.setItem('cookie-consent', 'declined')
  document.getElementById('cookie-banner').style.display = 'none'
}
function loadGA4() {
  const s = document.createElement('script')
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX'
  document.head.appendChild(s)
  // ... gtag init
}

3. En todos los HTML antes de gtag.js:
<script>initConsent()</script>  <!-- llama primero para checar consentimiento -->

COLOMBIA: Ley 1581 de 2012 + Decreto 1377 de 2013 — Habeas Data
Aplica si recoges datos personales de colombianos. El consentimiento debe ser:
- Previo, expreso e informado
- Para finalidades específicas
Guardar log de quién consintió + cuándo es buena práctica aunque no estrictamente requerido por la ley para analytics básicos.

IMPORTANTE: construir el banner ANTES de agregar cualquier tracking al sitio. Retrofitear después es más trabajo.`,
    notes: null,
  },

];

async function main() {
  console.log(`Seeding ${items.length} Arsenal items...`);

  for (const item of items) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO arsenal_items
        (id, name, category, status, icon, description, url, tags, use_cases, cost_cents, details, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        item.id, item.name, item.category, item.status, item.icon,
        item.description ?? null, item.url ?? null,
        item.tags, item.useCases,
        item.costCents ?? null,
        item.details ?? null, item.notes ?? null,
        now, now,
      ],
    });
    console.log(`  ✓ ${item.icon} ${item.name} [${item.category}]`);
  }

  console.log("\nArsenal seeded successfully.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
