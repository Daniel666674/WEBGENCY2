import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { arsenalItems } from "@/db/schema";
import { verifySession } from "@/lib/sessionToken";

export const dynamic = "force-dynamic";

const now = Math.floor(Date.now() / 1000);

// Deterministic slug IDs → INSERT OR IGNORE on PK = idempotent
const SEED_ITEMS = [
  {
    id: "seed-static-ecom-playbook",
    name: "Static E-commerce Playbook",
    category: "Stack",
    status: "active",
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
Error típico: alguien llena "color" con talla porque no había campo de talla para esa categoría → retrofit full-site.

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
    id: "seed-auto-crm-oliwan",
    name: "Auto-CRM OLIWAN",
    category: "Stack",
    status: "active",
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
Arsenal (este módulo) · Onboarding

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
    id: "seed-github-contents-api",
    name: "GitHub Contents API como CMS",
    category: "Backend",
    status: "active",
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
Lo ingresa el admin una vez, se guarda en localStorage

GOTCHA CRÍTICO
Siempre leer el SHA actual antes de hacer un PUT. Si el SHA no coincide (alguien más editó), GitHub rechaza con 409.

LIMITACIONES
- No escala para múltiples editores simultáneos (race conditions en SHA)
- Repo público = archivos de datos públicos — decidir per-cliente si hacer repo privado
- GitHub API rate limit: 5,000 req/hora con PAT autenticado

ALTERNATIVAS PARA ESCALAR
- PocketBase (self-hosted, liviano, gratuito)
- Turso (usado en el CRM) para proyectos Next.js`,
    notes: null,
  },
  {
    id: "seed-github-actions-ftps",
    name: "GitHub Actions → FTPS Deploy",
    category: "Automation",
    status: "active",
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
Fix: re-trigger el workflow. Empty commit: 'git commit --allow-empty -m "retry deploy"'

CACHE + VERSIONADO (CRÍTICO)
Con .htaccess poniendo max-age=31536000 en CSS/JS/img, CUALQUIER asset que cambie necesita ?v=N.
Un fix "aplicado" pero con asset cacheado = fix invisible para todos los usuarios existentes.

ALTERNATIVA PARA PROYECTOS NEXT.JS
Vercel (gratis para proyectos personales/hobby, $20/mes Pro para custom domains sin límite)`,
    notes: null,
  },
  {
    id: "seed-webhook-lead-capture",
    name: "Webhook → CRM Lead Capture",
    category: "Automation",
    status: "active",
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

CONFIGURACIÓN EN TALLY
Integrations → Webhooks → Event: New submission → URL del endpoint

CONFIGURACIÓN EN SITIO PROPIO (HTML)
fetch('/api/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, phone, source: 'web' })
})

UPSELL
"Cada lead de tu formulario aparece automáticamente aquí, clasificado, con historial."

EXTENSIONES POSIBLES
- Clasificación automática con Claude AI al recibir el lead
- Notificación por email (Resend) al recibir lead caliente
- Asignación automática de etapa de pipeline según fuente`,
    notes: null,
  },
  {
    id: "seed-claude-ai-commands",
    name: "Claude AI Commands (CRM)",
    category: "Automation",
    status: "active",
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
/add-lead          — Describe al prospecto, Claude lo crea en el CRM con campos normalizados
/analyze-pipeline  — Análisis completo del pipeline con recomendaciones
/daily-briefing    — Resumen ejecutivo: follow-ups vencidos, deals hot, actividades del día
/import-contacts   — Importa CSV, Claude normaliza columnas y hace POST /api/import
/setup             — Personalizar el CRM para un nuevo negocio
/connect           — Conectar con Gmail, Calendar, Sheets via MCP

CÓMO FUNCIONA
Los comandos están en .claude/commands/*.md — prompts que le dicen a Claude:
1. Leer el contexto del CRM (API routes)
2. Hacer las operaciones necesarias
3. Confirmar lo que hizo

SIN API KEY: todo el "AI" corre via Claude Code.
CON ANTHROPIC_API_KEY: la web tiene clasificación automática de leads inline.

MCP SERVER
npm run mcp inicia crm-server.ts que expone el CRM como herramientas MCP.
Claude Desktop/Web puede entonces operar el CRM directamente como tool-use agent.

UPSELL PARA CLIENTES
"Tu equipo puede agregar leads y ver el pipeline hablándole a Claude."
Diferenciador real vs cualquier CRM convencional.`,
    notes: null,
  },
  {
    id: "seed-resend-digest",
    name: "Resend Email Digest",
    category: "Automation",
    status: "active",
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
3. Agregar en .env: RESEND_API_KEY=re_xxxx, DIGEST_EMAIL=tu@email.com
4. POST /api/digest → dispara el resumen inmediatamente

AUTOMATIZACIÓN
- Vercel Cron Jobs: { "crons": [{ "path": "/api/digest", "schedule": "0 8 * * *" }] }
- GitHub Actions scheduled (cron: "0 8 * * *" → curl al endpoint)

CONTENIDO DEL EMAIL
- Follow-ups vencidos (con link al contacto)
- Deals calientes (hot leads)
- Actividades del día
- Resumen del pipeline

UPSELL
"Cada mañana a las 8am recibes el estado de tu pipeline en tu email."
Incluir como parte del retainer mensual del CRM.`,
    notes: null,
  },
  {
    id: "seed-turso-libsql",
    name: "Turso (libSQL)",
    category: "Backend",
    status: "active",
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
2. turso db tokens create nombre-db → copiar token
3. Agregar a .env: TURSO_DATABASE_URL=libsql://nombre.turso.io, TURSO_AUTH_TOKEN=eyJ...

INTEGRACIÓN CON DRIZZLE
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
export const db = drizzle(client, { schema })

FREE TIER LÍMITES
500MB storage, 1B row reads/mes, 25M row writes/mes
Para proyectos de agencia con 10-100 clientes: más que suficiente.

GOTCHA DE BUILD
Si TURSO_DATABASE_URL no está disponible en build time, usar fallback:
process.env.TURSO_DATABASE_URL || "file::memory:" para evitar URL_INVALID en build.`,
    notes: null,
  },
  {
    id: "seed-vercel",
    name: "Vercel",
    category: "Backend",
    status: "active",
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
Para TURSO_DATABASE_URL: solo en Production si quieres DB separada por ambiente.

CRON JOBS (Hobby no soporta, Pro sí)
vercel.json: { "crons": [{ "path": "/api/digest", "schedule": "0 8 * * *" }] }

GOTCHA CON TURSO
La URL del DB debe estar en las env vars del proyecto de Vercel.
Sin eso: el build pasa pero las API routes fallan en producción.`,
    notes: null,
  },
  {
    id: "seed-hostinger",
    name: "Hostinger Business Hosting",
    category: "Backend",
    status: "active",
    icon: "🌐",
    description: "Hosting compartido para sitios estáticos de clientes. Soporta PHP + MySQL, SSL gratis, FTP/FTPS, cPanel, backups diarios. ~$3-7/mes. La opción más barata para proyectos e-com.",
    url: "https://hostinger.com",
    tags: JSON.stringify(["hostinger", "hosting", "ftps", "cpanel", "shared-hosting", "ssl", "php"]),
    useCases: JSON.stringify([
      "Sitios estáticos de clientes locales con presupuesto bajo",
      "E-com que eventualmente necesitará PHP para integraciones",
      "Cliente que ya tiene dominio aquí y quiere simplificar",
    ]),
    costCents: 500,
    details: `PLAN RECOMENDADO: Business (~$5-7/mes con dominio incluido)
- Múltiples sitios (útil para gestionar varios clientes en una cuenta)
- 200GB SSD, Backups diarios automáticos, SSL gratis, FTP + FTPS, PHP + MySQL

CONFIGURAR FTP PARA DEPLOY
hPanel → Archivos → Administrador de FTP → Crear cuenta FTP
Host: ftp.dominiocliente.com
Puerto: 21 (FTP) o 990 (FTPS explícito)
Ruta: /public_html/

GOTCHA: FTPS TIMEOUTS
Hostinger ocasionalmente da timeout en la conexión FTPS sin razón de código.
Fix: re-trigger el GitHub Actions workflow.

GESTIÓN MULTI-CLIENTE
Crear UNA cuenta de Hostinger con plan Business y agregar "Additional Websites" por cliente.
Alternativa profesional: cuenta separada por cliente (el cliente la paga, la agencia la gestiona).`,
    notes: "Preferir que el cliente sea el titular de la cuenta de hosting. La agencia maneja via FTP credentials sin acceso de facturación.",
  },
  {
    id: "seed-google-service-account",
    name: "Google Service Account (Analytics)",
    category: "Integration",
    status: "active",
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

ESCALA
Una cuenta de servicio puede tener acceso a TODAS las propiedades de todos los clientes.
El CRM maneja el routing (GA4 Property ID + GSC site URL se guardan por contacto).

SEGURIDAD
El JSON key es tan sensible como una contraseña. NUNCA commitear al repo.
Rotarlo si se compromete: Cloud Console → cuenta de servicio → Agregar key → Borrar key vieja.

GOTCHA
Crear la cuenta NO le da acceso automáticamente. El paso de agregarla a GA4 y GSC es SEPARADO y OBLIGATORIO. Sin ese paso: auth ok, datos: 403.`,
    notes: "Cuenta actual: oliwan-analytics-reader@escena-admin.iam.gserviceaccount.com — tiene acceso a ESCENA BMX.",
  },
  {
    id: "seed-google-oauth",
    name: "Google OAuth (Admin Panel)",
    category: "Integration",
    status: "active",
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

GOTCHA CRÍTICO (pasó en ESCENA)
Dos pasos SEPARADOS e independientes:
- Agregar usuario en Cloud Console → OAuth consent screen → Test users
- Agregar email al ALLOWED_EMAILS array en admin.html
Ambos son requeridos. Sin el primero: error de Google. Sin el segundo: "Acceso denegado".

ALTERNATIVA PARA PROYECTOS NEXT.JS
Auth.js (NextAuth v5) con Google provider — más features, maneja sesiones server-side.`,
    notes: null,
  },
  {
    id: "seed-whatsapp-checkout",
    name: "WhatsApp Checkout",
    category: "Integration",
    status: "active",
    icon: "💬",
    description: "El carrito construye el pedido, el checkout abre WhatsApp con un mensaje pre-llenado. Sin gateway de pagos, sin PCI, funciona en 1 día. Fase 2: gateway real.",
    url: null,
    tags: JSON.stringify(["whatsapp", "checkout", "ecommerce", "no-gateway", "phase-1", "conversion"]),
    useCases: JSON.stringify([
      "Tienda local con volumen bajo-medio que no justifica integrar un gateway",
      "Primer lanzamiento: validar demanda antes de invertir en pagos reales",
      "Negocio donde el dueño prefiere confirmar cada pedido manualmente",
      "Mercado donde WhatsApp es el canal de venta dominante (Colombia, Latam en general)",
    ]),
    costCents: 0,
    details: `IMPLEMENTACIÓN
URL de WhatsApp: https://wa.me/57XXXXXXXXXX?text=MENSAJE_URL_ENCODED
El mensaje se construye en JavaScript con los items del carrito:
"Hola! Quiero hacer este pedido:\n• 2x Casco Fox V1 Talla M - $180,000\nTotal: $180,000"

CARRITO EN LOCALSTORAGE
window.CART_ITEMS = [] — array de { slug, name, qty, price, variant }
Persiste entre páginas y recargas.
Header badge count = CART_ITEMS.reduce((sum, i) => sum + i.qty, 0)

TRUST ISSUES QUE RESOLVER
- Mostrar que es un negocio real (dirección, horarios, Google Maps embed)
- Strip de garantías: envío seguro, producto original, soporte por WhatsApp

UPSELL A FASE 2
Cuando el cliente tenga >50 pedidos/mes:
- Wompi (Colombia): 2.99% + $1,500/transacción
- PayU Latam: más mercados, setup más complejo
Budget estimado para implementar gateway: $500-1,500 adicional.`,
    notes: null,
  },
  {
    id: "seed-wompi-payu",
    name: "Wompi / PayU (Payment Gateway CO)",
    category: "Integration",
    status: "planned",
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
Doc: developers.wompi.co

PAYU
Cubre: Colombia, México, Perú, Chile, Argentina, Brasil, Panamá
Setup más complejo: sandbox + cuenta merchant + validación de negocio

SCOPE PARA COTIZAR ESTA FASE
- Crear cuenta gateway + validación KYC del cliente (~1 semana proceso)
- Integrar widget en checkout del sitio estático
- Manejar estados: pendiente, aprobado, rechazado, reembolsado
Estimado: $500-1,500 adicionales al proyecto base`,
    notes: "Siempre cotizar esto como proyecto separado, no incluirlo en el precio base del e-com.",
  },
  {
    id: "seed-mcp-server",
    name: "MCP Server (CRM)",
    category: "Integration",
    status: "active",
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

HERRAMIENTAS EXPUESTAS (tools MCP)
- list_contacts(filter?, limit?)
- create_contact(name, email, phone, company, source, temperature)
- list_deals(stageId?, contactId?)
- list_activities(contactId?, pending?)
- log_activity(type, description, contactId)
- get_pipeline_stages()

DIFERENCIA CON /add-lead COMMAND
Los comandos .claude/commands/ son prompts que Claude ejecuta via fetch() a las API routes.
El MCP server expone las operaciones como herramientas nativas de Claude Tool Use.
MCP es más potente para agentes; los commands son más simples y no requieren config extra.

UPSELL
"Tu equipo puede actualizar el pipeline hablando con Claude."
Un equipo de ventas que opera el CRM conversacionalmente = genuinamente diferente.`,
    notes: null,
  },
  {
    id: "seed-drizzle-orm",
    name: "Drizzle ORM",
    category: "Tool",
    status: "active",
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

PATRÓN DE USO EN EL CRM
export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

const all = await db.select().from(contacts).all()
const one = await db.select().from(contacts).where(eq(contacts.id, id)).get()
await db.insert(contacts).values({ name: "Daniel" }).returning().get()

IMPORTANTE: TODAS las queries con Turso son async — siempre await.
Si falta el await: retorna una Promise, no el resultado. Bug silencioso.

MIGRACIONES
drizzle-kit push → aplica directo a la DB (OK para dev/staging, cuidado en prod)
En el CRM usamos ensureSchema() con CREATE TABLE IF NOT EXISTS — más simple.`,
    notes: null,
  },
  {
    id: "seed-shadcn-ui",
    name: "shadcn/ui",
    category: "Tool",
    status: "active",
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
Los componentes se agregan con 'npx shadcn@latest add button'.
Quedan en src/components/ui/ — son TUYOS, los modificas sin restricciones.
No hay versiones que "rompan" tu código.

COMPONENTES MÁS USADOS EN EL CRM
Card, CardContent, CardHeader, CardTitle
Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
Input, Label, Textarea, Button, Badge
Separator, Tooltip, Select

TAILWIND V4 NOTA
En Tailwind v4 la config es vía CSS (@theme en globals.css), NO tailwind.config.ts.
Las variables CSS (--primary, --background, etc.) definen el tema.

CUSTOMIZACIÓN DE TEMA
Cambiar --primary en :root { } cambia todos los componentes que usan bg-primary, text-primary, etc.`,
    notes: null,
  },
  {
    id: "seed-recharts",
    name: "Recharts",
    category: "Tool",
    status: "active",
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
XAxis, YAxis — ejes (yAxisId="left"/"right" para dual axis)
Tooltip con content={<CustomComponent>} para tooltips custom

DUAL Y-AXIS (para GSC dashboard: clicks vs impresiones en escalas diferentes)
<YAxis yAxisId="left" /> → <Line yAxisId="left" dataKey="Clics" />
<YAxis yAxisId="right" orientation="right" /> → <Area yAxisId="right" dataKey="Impresiones" />

MINI SPARKLINES (en KPI tiles)
<ComposedChart data={pts} margin={{top:2,right:0,bottom:0,left:0}}>
  <Area type="monotone" dataKey="v" stroke={color} dot={false} isAnimationActive={false} />
</ComposedChart>
isAnimationActive={false} es crucial — evita animaciones raras en re-renders frecuentes.

COLORES DEL TEMA
Oliwan: #0d9a8a (primary teal), #8b5cf6 (purple), #16a34a (green)`,
    notes: null,
  },
  {
    id: "seed-seo-geo-stack",
    name: "SEO + GEO Stack",
    category: "Process",
    status: "active",
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
□ <title> único por página
□ Meta description + Open Graph + Twitter Card
□ sitemap.xml actualizado
□ robots.txt con Sitemap: line
□ JSON-LD structured data en páginas de producto
□ Favicon 48x48px PNG (Google lo usa en search results; 16/32px no alcanza)

CLEAN URLS (.htaccess)
/tienda → tienda.html
/producto/slug → producto/slug.html
Redirect 301 de bare domain a URL canónica

GEO STACK (robots.txt additions para AI crawlers)
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: PerplexityBot
User-agent: ClaudeBot
User-agent: Google-Extended
Allow: /
Disallow: /admin.html

llms.txt (en raíz del sitio):
# [Nombre del negocio]
[Descripción de qué vende, dónde está, cómo contactar]
Contact: [WhatsApp/email]
Sitemap: https://dominio.com/sitemap.xml

LEVER DE REINDEXACIÓN
Google Search Console → URL Inspection → Request Indexing en el homepage después de lanzar.`,
    notes: "Incluir este checklist como parte del entregable de cada proyecto.",
  },
  {
    id: "seed-cache-busting",
    name: "Cache Busting Convention",
    category: "Process",
    status: "active",
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
.htaccess: <FilesMatch "\\.(css|js|jpg)$"> Header set Cache-Control "public, max-age=31536000, immutable"
= el navegador cachea assets por 1 año.
Si subes un nuevo products-data.js al mismo URL → navegadores con cache no lo ven.

LA SOLUCIÓN
<script src="assets/js/products-data.js?v=12"></script>
Al cambiar el archivo: bump el número → nueva URL → cache miss → versión nueva sirve.

QUÉ NECESITA ?v=N
- products-data.js (cambia con cada edit del catálogo)
- sales-log.js (cambia con cada venta)
- cart.js, site-header.css
- product photos (si reusan el mismo filename con fotos nuevas)

PASÓ EN ESCENA BMX: 4 veces por falta de esta convención.
Ahora es obligatorio desde la primera línea de cada proyecto.`,
    notes: null,
  },
  {
    id: "seed-client-ecom-onboarding",
    name: "Onboarding de Cliente E-com",
    category: "Process",
    status: "active",
    icon: "🚀",
    description: "El proceso completo desde deal cerrado hasta sitio live: 20 pasos ordenados por dependencias. Incluye configuraciones de Google Cloud, deploy, SEO, catálogo y entrega.",
    url: null,
    tags: JSON.stringify(["onboarding", "process", "ecommerce", "checklist", "client", "replication"]),
    useCases: JSON.stringify([
      "Cada nuevo cliente de tienda estática — seguir estos pasos en orden",
      "Delegar parte del trabajo a un futuro empleado/freelancer con contexto completo",
      "Estimar tiempo y scope al cotizar un nuevo proyecto de este tipo",
    ]),
    costCents: null,
    details: `CHECKLIST COMPLETO (en orden de dependencias)

PRE-LAUNCH
□ 1. Registrar dominio + contratar hosting (Hostinger Business)
□ 2. Decidir lista de categorías: size-driven vs color-driven vs flat-units — ANTES del data entry
□ 3. Crear Google Cloud project → OAuth consent screen

BUILD
□ 4. Fork del repo base → find-replace: dominio, brand name, colores, WhatsApp, dirección
□ 5. Adaptar _template.html y admin.html para el diseño del cliente
□ 6. .htaccess: cache headers + clean URL rewrites + 301 home canonical
□ 7. Configurar GitHub Actions secrets (FTP_SERVER, FTP_USERNAME, FTP_PASSWORD)

GOOGLE SETUP
□ 8. GA4: crear property para el dominio del cliente
□ 9. Search Console: verificar el dominio (domain property preferida)
□ 10. Generar icon set completo incluyendo 48x48 PNG favicon
□ 11. Agregar cuenta de servicio de la agencia a GA4 + GSC (Viewer)

SEO/GEO
□ 12. robots.txt (GEO crawler allow-list + disallow admin + disallow _template)
□ 13. sitemap.xml inicial
□ 14. llms.txt
□ 15. Cookie consent banner ANTES de agregar gtag.js

DATA + LAUNCH
□ 16. Poblar catálogo real (admin panel o CSV import)
□ 17. Primer deploy → verificar que FTPS funciona
□ 18. Search Console → URL Inspection → Request Indexing en homepage
□ 19. Smoke test: carrito → WhatsApp checkout → link en todos los dispositivos

ENTREGA AL CLIENTE
□ 20. Video walkthrough del admin panel (5-10min, Loom)`,
    notes: "Tiempo estimado: 2-3 semanas para la primera instancia, 1 semana para réplicas del mismo stack.",
  },
  {
    id: "seed-brand-logo-sizing",
    name: "Brand Logo Sizing en Strips",
    category: "Process",
    status: "active",
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
Si aplicas el mismo box width a todos, los wide-aspect logos se comprimen a tamaño ilegible.

LA SOLUCIÓN CORRECTA
1. CROP PRIMERO: cada logo al bounding box del ink (sin whitespace excess en el source file)
2. PADDING UNIFORME PER-AXIS: x% del ancho propio del logo
3. NO usar padding fijo en píxeles si los logos varían mucho de tamaño

CSS APPROACH QUE FUNCIONA
.brand-chip img {
  max-height: 40px;
  max-width: 120px;
  object-fit: contain;
  padding: 4px 8px;
}

EL CASO STACKABLE
En un chip pequeño, un logo de 200x80px con icono arriba y texto abajo → texto ilegible.
Solución: aislar sólo el icono/símbolo para el strip, usar el logo completo en páginas mayores.

PASÓ EN ESCENA: logos Troy Lee Designs (muy wide) vs Oakley (cuadrado) vs Fox Racing (paisaje).`,
    notes: null,
  },
  // ─── NEXUS CRM expansion items ───────────────────────────────────────────
  {
    id: "seed-nextauth-v5",
    name: "NextAuth.js / Auth.js v5",
    category: "Stack",
    status: "active",
    icon: "🔑",
    description: "Auth completo para Next.js: Google OAuth + credenciales propias + sesiones JWT. Multi-provider, RBAC-ready, WebAuthn-compatible. El estándar de facto para apps Next.js con login.",
    url: "https://authjs.dev",
    tags: JSON.stringify(["nextauth", "auth", "oauth", "google", "jwt", "session", "nextjs", "credentials"]),
    useCases: JSON.stringify([
      "Cualquier CRM o admin panel Next.js con múltiples usuarios",
      "App donde el cliente quiere 'Login con Google' para su equipo",
      "Portal con roles: admin puede editar, viewer solo lee",
      "Reemplazar un sistema de login casero con algo production-ready en horas",
    ]),
    costCents: 0,
    details: `SETUP BÁSICO (Next.js App Router)
// src/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }),
    Credentials({
      authorize: async ({ email, password }) => { /* verify */ }
    }),
  ],
  callbacks: {
    session({ session, token }) { session.user.id = token.sub; return session },
  },
})

// src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from "@/auth"

PROTEGER RUTAS (middleware.ts)
export { auth as middleware } from "@/auth"
export const config = { matcher: ["/app/:path*"] }

ENV VARS REQUERIDAS
AUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

DB ADAPTER
Con @auth/drizzle-adapter: los users/sessions/accounts se guardan en Turso automáticamente.
Sin adapter: sesiones JWT stateless (más simple, sin tabla sessions).

RBAC PATTERN
Agregar campo role en DB → exponer en token → verificar en cada ruta:
const session = await auth(); if (session.user.role !== "admin") return 401`,
    notes: "Preferir JWT stateless (sin adapter) para proyectos pequeños. Agregar adapter solo si el cliente necesita invalidar sesiones activas.",
  },
  {
    id: "seed-webauthn-passkeys",
    name: "WebAuthn / Passkeys (Biometric Login)",
    category: "Integration",
    status: "testing",
    icon: "👆",
    description: "Login con Face ID / huella digital en el browser. FIDO2/WebAuthn: el usuario registra su dispositivo una vez, luego inicia sesión sin contraseña. Funciona en Chrome, Safari, Edge.",
    url: "https://webauthn.io",
    tags: JSON.stringify(["webauthn", "passkeys", "fido2", "biometric", "passwordless", "security", "faceid"]),
    useCases: JSON.stringify([
      "App interna del cliente donde el equipo inicia sesión diariamente — elimina contraseñas débiles",
      "CRM enterprise donde la seguridad biométrica es un diferenciador de venta",
      "Portal de clientes donde quieren 'magia': un toque y adentro",
    ]),
    costCents: 0,
    details: `FLUJO COMPLETO
REGISTRO:
1. POST /api/auth/webauthn/register-options → retorna challenge + opciones del servidor
2. Cliente: navigator.credentials.create({ publicKey: options }) → crea credential en dispositivo
3. POST /api/auth/webauthn/register-verify → verifica y guarda credential en DB

LOGIN:
1. POST /api/auth/webauthn/authenticate-options → challenge nuevo
2. Cliente: navigator.credentials.get({ publicKey: options }) → firma con biometría
3. POST /api/auth/webauthn/authenticate-verify → verifica firma → crea sesión

LIBRERÍA RECOMENDADA
@simplewebauthn/server (Node) + @simplewebauthn/browser (cliente)
npm install @simplewebauthn/server @simplewebauthn/browser

DB: tabla webauthn_credentials
{ id, userId, credentialId (base64url), publicKey, counter, deviceType, backedUp, transports[] }

CONSIDERACIONES
- Solo funciona en HTTPS (localhost también está permitido para dev)
- El usuario DEBE tener un login regular también como fallback (dispositivo perdido)
- Chrome/Safari/Edge soportan passkeys; Firefox tiene soporte parcial
- "Synced passkeys" (iCloud Keychain / Google Password Manager) funcionan cross-device

UPSELL
"Tu equipo inicia sesión con la huella del celular — sin recordar contraseñas, sin phishing posible."`,
    notes: null,
  },
  {
    id: "seed-api-tokens-rbac",
    name: "API Tokens + RBAC",
    category: "Backend",
    status: "active",
    icon: "🪪",
    description: "Sistema de tokens Bearer para que apps externas accedan al CRM via API. RBAC con roles admin/member/viewer — cada rol controla qué puede leer o escribir.",
    url: null,
    tags: JSON.stringify(["api-tokens", "bearer", "rbac", "roles", "auth", "access-control", "security"]),
    useCases: JSON.stringify([
      "Integrar el CRM con herramientas externas (n8n, Make, Zapier, scripts propios)",
      "Dar acceso de lectura a un dashboard externo sin exponer credenciales",
      "Equipo de ventas con miembros que solo ven sus propios leads (viewer role)",
    ]),
    costCents: 0,
    details: `API TOKEN PATTERN
Generación: crypto.randomBytes(32).toString('hex') → hash con bcrypt/SHA-256 antes de guardar
DB: tabla api_tokens { id, userId, name, tokenHash, lastUsedAt, expiresAt, scopes[] }
Validación middleware:
const token = req.headers.authorization?.replace('Bearer ', '')
const hash = hashToken(token)
const record = await db.select().from(apiTokens).where(eq(apiTokens.tokenHash, hash)).get()
if (!record || record.expiresAt < Date.now()) return 401

SCOPES SUGERIDOS
contacts:read, contacts:write, deals:read, deals:write, analytics:read

RBAC ROLES
admin   → todo: leer/escribir, configurar, invitar usuarios
member  → leer/escribir contactos, deals, actividades (solo los propios si multi-tenant)
viewer  → solo lectura, sin acceso a config ni datos de otros usuarios

IMPLEMENTACIÓN EN RUTAS
function requireRole(role: "admin" | "member" | "viewer") {
  return async (req: NextRequest) => {
    const session = await auth()
    if (!session) return 401
    if (roleLevel[session.user.role] < roleLevel[role]) return 403
  }
}

UPSELL
"Conecta tu CRM con cualquier herramienta: genera un token de API y listo.
Sin contraseñas compartidas, con scopes específicos por integración."`,
    notes: null,
  },
  {
    id: "seed-email-engine-brevo",
    name: "Email Engine (Brevo / SMTP)",
    category: "Integration",
    status: "active",
    icon: "📨",
    description: "Stack completo de email: envío transaccional + marketing via Brevo (ex-Sendinblue) o SMTP propio. Templates con variables, firmas por usuario, pixel de tracking, unsubscribe compliant.",
    url: "https://brevo.com",
    tags: JSON.stringify(["brevo", "sendinblue", "smtp", "email", "transactional", "marketing", "templates", "tracking"]),
    useCases: JSON.stringify([
      "CRM que envía emails de seguimiento directamente desde la ficha del contacto",
      "Notificaciones automáticas: nuevo lead, deal cerrado, follow-up vencido",
      "Newsletter o campaña de email a una lista de clientes",
      "Confirmación de pedido para tiendas e-com (transaccional)",
    ]),
    costCents: 0,
    details: `BREVO FREE TIER: 300 emails/día, sin límite de contactos. Suficiente para start.

SETUP (SMTP)
SMTP Host: smtp-relay.brevo.com, Port: 587, TLS
Usuario: tu_email@brevo.com
Contraseña: API key de Brevo (Settings → SMTP & API)
Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

TEMPLATE SYSTEM
const render = (template: string, vars: Record<string, string>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
// render("Hola {{name}}, tu deal está en {{stage}}", { name: "Daniel", stage: "Propuesta" })

EMAIL LAYOUT
Un wrapper HTML con logo + colores de la agencia que envuelve cada mensaje.
Todos los emails se ven consistentes sin repetir HTML.

OPEN TRACKING (pixel)
<img src="https://tu-crm.vercel.app/api/email/track/open?id={{emailId}}" width="1" height="1" style="display:none">
GET /api/email/track/open?id=xxx → marca email como abierto + registra timestamp + IP

CLICK TRACKING
Reemplazar cada URL en el cuerpo del email:
href="https://tu-crm.vercel.app/api/email/track/click?id={{emailId}}&url=ENCODED_URL"
GET → registra click → redirect 302 a la URL original

UNSUBSCRIBE (CAN-SPAM obligatorio)
Link en footer: /api/email/unsubscribe?token=HMAC(contactId)
Marca al contacto con unsubscribed: true → excluir de futuros envíos automáticamente

FIRMAS POR USUARIO
DB: tabla signatures { userId, html } — se append al body antes de enviar`,
    notes: "Brevo para transaccional/marketing. Resend para digest simple del CRM. No mezclar los dos en el mismo proyecto sin una capa de abstracción.",
  },
  {
    id: "seed-email-sequences-drip",
    name: "Email Sequences / Drip Campaigns",
    category: "Automation",
    status: "active",
    icon: "🌊",
    description: "Secuencias multi-paso: enroll un contacto → recibe email Day 1, task Day 3, email Day 7 automáticamente. Motor de secuencias con pasos email + tarea + espera.",
    url: null,
    tags: JSON.stringify(["sequences", "drip", "email", "automation", "outreach", "nurturing", "crm"]),
    useCases: JSON.stringify([
      "Prospect nuevo → secuencia de 5 emails de nurturing automáticos",
      "Deal cerrado → secuencia de onboarding al cliente (email bienvenida, links, checklist)",
      "Lead frío → reactivación automática a los 30/60/90 días",
      "Post-propuesta: recordatorio automático a los 3 días si no hay respuesta",
    ]),
    costCents: 0,
    details: `MODELO DE DATOS
sequences { id, name, description, status }
sequence_steps { id, sequenceId, order, type (email|task|wait), delayDays, subject, body, taskDescription }
sequence_enrollments { id, sequenceId, contactId, enrolledAt, currentStep, status (active|paused|completed) }

MOTOR DE EJECUCIÓN
Cron diario: consulta enrollments activos donde nextStepAt <= now()
Por cada enrollment: ejecutar el paso actual (enviar email o crear tarea)
Calcular nextStepAt = now + step.delayDays, avanzar currentStep
Si no hay más pasos: enrollment.status = 'completed'

TEMPLATE DEFAULTS (pre-built)
1. Secuencia de bienvenida (5 pasos, 14 días)
2. Seguimiento post-propuesta (3 emails, 7 días)
3. Reactivación de lead frío (3 emails, 60 días)
4. Onboarding nuevo cliente (4 pasos, 7 días)

ENROLLMENT API
POST /api/sequences/:id/enroll → { contactId, startDate? }
DELETE /api/sequences/:id/enrollments/:enrollmentId → unenroll (cancelar secuencia)

UPSELL
"Cuando alguien llena el formulario, empieza a recibir emails automáticos el día 1, 3, 7 y 14.
Tu equipo solo habla con los que respondieron. Los demás siguen en la secuencia."`,
    notes: null,
  },
  {
    id: "seed-google-calendar-api",
    name: "Google Calendar API",
    category: "Integration",
    status: "active",
    icon: "📅",
    description: "Sync bidireccional con Google Calendar: crear reuniones desde el CRM, ver el calendario del vendedor en la vista de deals. OAuth del usuario + service account para lectura.",
    url: "https://developers.google.com/calendar",
    tags: JSON.stringify(["google-calendar", "calendar", "meetings", "sync", "oauth", "google-workspace"]),
    useCases: JSON.stringify([
      "Agendar una reunión con un prospect directamente desde su ficha en el CRM",
      "Ver en el pipeline cuáles deals tienen reunión agendada esta semana",
      "CRM de consultoría donde las reuniones son el principal touchpoint con el cliente",
    ]),
    costCents: 0,
    details: `AUTH (dos opciones)
OAuth del usuario: el vendedor conecta su Google account → CRM puede crear/leer sus eventos
Service account: solo lectura, sin que el usuario tenga que autorizar cada vez

SCOPES NECESARIOS
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly

CREAR EVENTO DESDE CRM
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
body: {
  summary: "Reunión con [Nombre del prospecto]",
  start: { dateTime: "2025-07-30T10:00:00-05:00" },
  end:   { dateTime: "2025-07-30T11:00:00-05:00" },
  attendees: [{ email: "prospecto@empresa.com" }],
  conferenceData: { createRequest: { requestId: uuid } } // Google Meet automático
}

LISTAR EVENTOS DEL VENDEDOR
GET /calendars/primary/events?timeMin=...&timeMax=...&singleEvents=true&orderBy=startTime

GOTCHA: TOKEN REFRESH
Los access_token duran 1h. Guardar refresh_token (encriptado) en DB.
Antes de cada llamada verificar expiración y refrescar si es necesario.

UPSELL
"Agenda reuniones directamente desde el CRM, con Google Meet incluido.
El evento aparece en el calendario del cliente y del vendedor automáticamente."`,
    notes: null,
  },
  {
    id: "seed-web-push-notifications",
    name: "Web Push Notifications",
    category: "Integration",
    status: "active",
    icon: "🔔",
    description: "Notificaciones push en el browser (o dispositivo) sin instalar app. El usuario acepta una vez → recibe alertas aunque el CRM esté cerrado. Powered by web-push + VAPID keys.",
    url: "https://web.dev/push-notifications/",
    tags: JSON.stringify(["push-notifications", "web-push", "vapid", "pwa", "alerts", "real-time"]),
    useCases: JSON.stringify([
      "Alerta inmediata cuando llega un nuevo lead por webhook",
      "Recordatorio de follow-up en el momento exacto que vence",
      "Notificación cuando un deal cambia de etapa (p.ej. cliente aceptó propuesta)",
      "Alertas de deals en riesgo: 'X lleva 14 días sin actividad'",
    ]),
    costCents: 0,
    details: `SETUP (3 pasos)
1. Generar VAPID keys (una sola vez):
   npx web-push generate-vapid-keys
   Env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_MAILTO

2. Suscribir al usuario (cliente):
   const reg = await navigator.serviceWorker.register('/sw.js')
   const sub = await reg.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: VAPID_PUBLIC_KEY
   })
   await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub) })
   DB: tabla push_subscriptions { userId, endpoint, auth, p256dh }

3. Enviar notificación (servidor):
   import webpush from 'web-push'
   webpush.setVapidDetails('mailto:tu@email.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
   await webpush.sendNotification(subscription, JSON.stringify({ title, body, url }))

SERVICE WORKER (public/sw.js)
self.addEventListener('push', e => {
  const data = e.data.json()
  self.registration.showNotification(data.title, { body: data.body, icon: '/icon-192.png', data: { url: data.url } })
})
self.addEventListener('notificationclick', e => { e.notification.close(); clients.openWindow(e.notification.data.url) })

INTEGRACIÓN CON EL CRM
Llamar notify(userId, { title, body, url }) desde triggers (nuevo lead, vencimiento, etc.)
notify() busca la suscripción del usuario en DB y hace webpush.sendNotification()`,
    notes: null,
  },
  {
    id: "seed-automation-triggers",
    name: "Automation Triggers + Workflow Engine",
    category: "Automation",
    status: "active",
    icon: "⚡",
    description: "Motor de reglas event-driven: 'cuando X pasa, hacer Y'. Disparadores: lead_created, deal_moved, activity_logged, score_changed. Acciones: enviar email, crear tarea, mover etapa, notificar.",
    url: null,
    tags: JSON.stringify(["automation", "triggers", "workflows", "rules-engine", "event-driven", "crm", "no-code"]),
    useCases: JSON.stringify([
      "Lead llega via webhook → clasificar automáticamente → asignar a vendedor → crear follow-up → notificar",
      "Deal llega a 'Propuesta' → crear tarea de seguimiento a 3 días automáticamente",
      "Score de lead sube a 80 → mover a pipeline principal + notificar al equipo",
      "Deal lleva 7 días sin actividad → tarea de re-engagement automática",
    ]),
    costCents: 0,
    details: `MODELO
automations { id, name, trigger (event name), conditions (JSON), actions (JSON), enabled }
TRIGGERS: lead_created | deal_moved | deal_created | activity_logged | score_changed | time_based

ESTRUCTURA DE REGLA
{
  trigger: "deal_moved",
  conditions: [{ field: "stage.name", op: "eq", value: "Propuesta" }],
  actions: [
    { type: "create_task", params: { description: "Seguimiento propuesta", daysFromNow: 3 } },
    { type: "send_email", params: { templateId: "proposal_sent", to: "{{contact.email}}" } },
    { type: "notify", params: { userId: "{{deal.ownerId}}", message: "Propuesta enviada a {{contact.name}}" } }
  ]
}

ORQUESTADOR
async function dispatch(event: string, payload: unknown) {
  const rules = await db.select().from(automations).where(and(eq(automations.trigger, event), eq(automations.enabled, true))).all()
  for (const rule of rules) {
    if (evaluateConditions(rule.conditions, payload)) {
      await executeActions(rule.actions, payload)
    }
  }
}
// Llamar desde: api/contacts (al crear), api/deals (al mover etapa), etc.

QUIET HOURS
No disparar automaciones de email/WhatsApp entre 9pm y 8am (configurable por cliente).
Check: const h = new Date().getHours(); if (h < 8 || h > 21) queue for later

PLANTILLAS DEFAULT
1. Nuevo lead → asignar + crear follow-up (3 días)
2. Deal en Propuesta → task seguimiento (3 días)
3. Deal cerrado ganado → email de bienvenida al cliente
4. Inactividad 7 días → task de re-engagement`,
    notes: null,
  },
  {
    id: "seed-docker-vps",
    name: "Docker + VPS Self-Hosted",
    category: "Backend",
    status: "active",
    icon: "🐳",
    description: "Deploy de apps Next.js en VPS (DigitalOcean, Hetzner, Contabo) con Docker + docker-compose. Caddy como reverse proxy con TLS automático. Control total, sin dependencia de Vercel.",
    url: "https://docs.docker.com",
    tags: JSON.stringify(["docker", "vps", "self-hosted", "docker-compose", "caddy", "nginx", "digitalocean", "hetzner"]),
    useCases: JSON.stringify([
      "Cliente que requiere que sus datos estén en su propio servidor (compliance, regulación)",
      "App con carga constante donde Vercel serverless es más caro que un VPS fijo",
      "CRM con muchos usuarios simultáneos: VPS predecible vs Vercel por request",
      "App que requiere WebSockets, workers o procesos persistentes (no serverless-compatible)",
    ]),
    costCents: 600,
    details: `INFRAESTRUCTURA MÍNIMA
VPS: Hetzner CX22 (2 vCPU, 4GB RAM, 40GB SSD) — €4.35/mes en Europa
Dominio: Namecheap o el registrador del cliente
DNS: apuntar A record del dominio a la IP del VPS

DOCKER COMPOSE (producción)
services:
  app:
    build: .
    restart: unless-stopped
    environment:
      - TURSO_DATABASE_URL
      - TURSO_AUTH_TOKEN
      - SESSION_SECRET
    ports:
      - "3000:3000"
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data

CADDYFILE (TLS automático Let's Encrypt)
tudominio.com {
  reverse_proxy app:3000
}

DOCKERFILE (Next.js standalone)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]

SETUP EN EL VPS (una vez)
curl -fsSL https://get.docker.com | sh
git clone repo → cp .env.example .env → editar .env
docker compose up -d --build

ACTUALIZACIONES
git pull && docker compose up -d --build
(zero-downtime si se agrega health check en compose)`,
    notes: "Precio referencia cliente: $30-50/mes en el retainer cubre VPS + gestión del servidor. Alternativamente el cliente puede tener el VPS a su nombre.",
  },
  {
    id: "seed-dndkit-kanban",
    name: "@dnd-kit — Drag & Drop Kanban",
    category: "Tool",
    status: "active",
    icon: "🧩",
    description: "Librería de drag-and-drop accesible para React. Usada en el pipeline kanban del CRM. Soporta multi-touch, keyboard navigation, sortable lists y grids. Más liviana que react-beautiful-dnd.",
    url: "https://dndkit.com",
    tags: JSON.stringify(["dnd-kit", "drag-drop", "kanban", "sortable", "react", "accessibility", "pipeline"]),
    useCases: JSON.stringify([
      "Pipeline de ventas con columnas drag-and-drop (mover deal entre etapas)",
      "Board de tareas tipo Trello para gestión de proyectos",
      "Reordenar elementos de una lista: pasos de una secuencia, orden de productos",
    ]),
    costCents: 0,
    details: `INSTALACIÓN
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

ESTRUCTURA BÁSICA (pipeline kanban)
<DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
  {stages.map(stage => (
    <KanbanColumn key={stage.id} stage={stage} deals={dealsByStage[stage.id]} />
  ))}
</DndContext>

COLUMNA CON DROPPABLE
import { useDroppable } from '@dnd-kit/core'
const { setNodeRef } = useDroppable({ id: stage.id })
return <div ref={setNodeRef}>{deals.map(d => <DealCard key={d.id} deal={d} />)}</div>

CARD DRAGGABLE
import { useDraggable } from '@dnd-kit/core'
const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: deal.id })
const style = { transform: CSS.Translate.toString(transform) }
return <div ref={setNodeRef} style={style} {...listeners} {...attributes}>{deal.title}</div>

HANDLE DRAG END
function handleDragEnd({ active, over }: DragEndEvent) {
  if (!over || active.id === over.id) return
  const dealId = active.id as string
  const newStageId = over.id as string
  // PATCH /api/deals/:dealId → { stageId: newStageId }
}

POR QUÉ NO react-beautiful-dnd
RBD está en modo mantenimiento (no soporta React 18+ nativamente).
@dnd-kit es más moderno, más pequeño, y accesible por defecto.`,
    notes: null,
  },
  {
    id: "seed-cmdk-palette",
    name: "cmdk — Command Palette (Cmd+K)",
    category: "Tool",
    status: "active",
    icon: "⌨️",
    description: "Command palette estilo Linear/Notion para cualquier app React. Cmd+K abre búsqueda global: contactos, deals, acciones rápidas. Instala en minutos, se adapta al design system.",
    url: "https://cmdk.paco.me",
    tags: JSON.stringify(["cmdk", "command-palette", "keyboard", "search", "ux", "productivity", "react"]),
    useCases: JSON.stringify([
      "CRM o admin panel con mucho contenido: acceso rápido a cualquier contacto/deal sin navegar",
      "Power users que viven en teclado: acelerador de flujo de trabajo",
      "App donde la búsqueda cruzada (contactos + deals + actividades) tiene valor real",
    ]),
    costCents: 0,
    details: `INSTALACIÓN
npm install cmdk

IMPLEMENTACIÓN BÁSICA
import { Command } from 'cmdk'

function CommandPalette({ open, onClose }) {
  return (
    <Command.Dialog open={open} onOpenChange={onClose} label="Búsqueda global">
      <Command.Input placeholder="Buscar contactos, deals, acciones..." />
      <Command.List>
        <Command.Empty>Sin resultados.</Command.Empty>
        <Command.Group heading="Contactos">
          {contacts.map(c => (
            <Command.Item key={c.id} onSelect={() => { router.push('/contacts/' + c.id); onClose() }}>
              {c.name} — {c.company}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Acciones">
          <Command.Item onSelect={() => setShowNewDeal(true)}>Nuevo deal</Command.Item>
          <Command.Item onSelect={() => setShowNewContact(true)}>Nuevo contacto</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

ACTIVAR CON CMD+K
useEffect(() => {
  const down = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(v => !v) } }
  window.addEventListener('keydown', down)
  return () => window.removeEventListener('keydown', down)
}, [])

SEARCH IMPLEMENTATION
Filtrar en cliente para listas pequeñas (<1000 items).
Para datasets grandes: debounce + fetch /api/search?q=query`,
    notes: null,
  },
  {
    id: "seed-client-portal",
    name: "Client Portal (White-Label)",
    category: "Stack",
    status: "planned",
    icon: "🪟",
    description: "Portal web privado para que el cliente vea sus métricas, entregables y estado del proyecto — sin acceso al CRM interno. Token-autenticado, configurable por cliente, brandeable.",
    url: null,
    tags: JSON.stringify(["portal", "client", "white-label", "dashboard", "deliverables", "b2b", "upsell"]),
    useCases: JSON.stringify([
      "Agencia que quiere dar transparencia a clientes sin que accedan al CRM completo",
      "Cliente de retainer mensual que quiere ver el progreso de sus proyectos activos",
      "Servicio de SEO/analítica: cliente ve sus propios números en su portal branded",
    ]),
    costCents: null,
    details: `ARQUITECTURA
Cada portal tiene un token único (UUID) → URL: https://crm.agencia.com/portal/[token]
El token autentica sin contraseña (link magic) o se combina con un PIN simple.

CONFIGURACIÓN (por cliente)
portal_configs { id, contactId, token, brandName, primaryColor, logoUrl, modules[], shareUrl }
modules: ["metrics", "deliverables", "invoices", "project_status", "documents"]

DATA SOURCES
Cada módulo activo consulta la data del contacto en el CRM:
GET /api/portal-live/[token]/metrics → GA4 + GSC del cliente (si está configurado)
GET /api/portal-live/[token]/deliverables → lista de entregables aprobados/pendientes
GET /api/portal-live/[token]/invoices → pagos registrados

CUSTOMIZACIÓN
primaryColor desde la config → CSS variables en el portal → branding del cliente
Logo de la agencia o del cliente según la configuración

SEGURIDAD
El token es un UUID v4 — no adivinable por fuerza bruta en escala práctica
Rate limiting en el endpoint: max 60 req/hora por token
Para datos sensibles: agregar PIN adicional o expiración del token

UPSELL
"Tu cliente puede ver su dashboard en tiempo real — GA4, proyectos activos, documentos.
Sin que tenga que pedirte reportes cada semana."
Precio sugerido: $3,000-5,000 setup por implementación + incluir en retainer Pro`,
    notes: "No construir este portal en el mismo repo del CRM interno — riesgo de cross-tenant data leak. App separada o middleware de aislamiento claro.",
  },
  {
    id: "seed-nba-engine",
    name: "NBA Engine (Next Best Action)",
    category: "Automation",
    status: "active",
    icon: "🎯",
    description: "Motor de IA que recomienda la siguiente acción óptima para cada deal/contacto: 'Llama hoy', 'Envía propuesta', 'Tiempo de cerrar'. Basado en señales del pipeline, tiempo y score.",
    url: null,
    tags: JSON.stringify(["nba", "next-best-action", "ai", "recommendations", "crm", "sales-intelligence"]),
    useCases: JSON.stringify([
      "Vendedor con 30 deals activos — saber en cuál concentrarse primero cada mañana",
      "Deal estancado en la misma etapa por 2 semanas — alerta proactiva de intervención",
      "Lead recién llegado con score alto — acción inmediata antes de que enfríe",
    ]),
    costCents: null,
    details: `SEÑALES DE INPUT
- Días sin actividad (cuánto tiempo sin contacto con este deal)
- Stage velocity (cuánto tiempo lleva en la etapa actual vs promedio histórico)
- Lead score / temperatura (hot/warm/cold)
- Expected close date (¿ya pasó?)
- Probability (deals alta prob. que llevan mucho sin actividad = urgente)
- Último tipo de actividad (email vs llamada vs reunión)

LÓGICA DE RECOMENDACIONES (rule-based o AI)

RULE-BASED (sin API key, gratuito):
if (daysSinceActivity > 7 && stage.name === "Propuesta") return { action: "call", priority: "high", reason: "7 días sin respuesta a la propuesta" }
if (expectedClose < today && !isLost) return { action: "close_or_push", priority: "urgent" }
if (score > 80 && daysSinceActivity < 1) return { action: "send_proposal", priority: "high" }

AI-BASED (con ANTHROPIC_API_KEY):
Prompt: "Deal context: [stage, value, days_stale, last_activity, contact_history].
Recommend the single best next action with a 1-sentence reason. Output JSON: { action, priority, reason }"

VISUALIZACIÓN
- Card en la ficha del contacto: "🎯 Acción recomendada: Llama hoy. Lleva 5 días sin respuesta a tu email."
- Dashboard widget: top 5 acciones del día ordenadas por prioridad
- Badge en el kanban card del deal cuando hay una acción urgente

UPSELL
"Cada mañana, el CRM te dice exactamente en qué trabajar primero. Como tener un gerente de ventas 24/7."`,
    notes: null,
  },
  {
    id: "seed-gdpr-audit-trail",
    name: "GDPR + Audit Trail",
    category: "Process",
    status: "active",
    icon: "📋",
    description: "Pack de compliance: right to erasure, data portability export, audit log de cada acción, registro de aceptación de políticas. Ley 1581/2012 Colombia + GDPR compatible.",
    url: null,
    tags: JSON.stringify(["gdpr", "compliance", "audit", "privacy", "ley-1581", "erasure", "data-portability", "security"]),
    useCases: JSON.stringify([
      "App que maneja datos personales de terceros — obligatorio por Ley 1581 en Colombia",
      "Cliente de sector salud, financiero o legal donde el audit trail es requerido",
      "Agencia que vende a empresas medianas/grandes con dept. legal que revisa contratos",
    ]),
    costCents: 0,
    details: `1. AUDIT LOG (quién hizo qué y cuándo)
DB: tabla audit_logs { id, userId, action, resourceType, resourceId, meta(JSON), createdAt }
Registrar en: creación, edición y eliminación de contactos/deals + cambios de rol + exports.
async function audit(userId, action, resourceType, resourceId, meta?) {
  await db.insert(auditLogs).values({ id: uuid(), userId, action, resourceType, resourceId, meta: JSON.stringify(meta ?? {}), createdAt: new Date() })
}

2. RIGHT TO ERASURE (Art. 17 GDPR / Ley 1581)
DELETE /api/contacts/:id/delete-gdpr
- Anonimiza datos personales (name→"[Eliminado]", email→null, phone→null)
- NO borra el registro (mantiene el id y actividades para integridad referencial)
- Registra en audit log: action="gdpr_erasure", by=userId

3. DATA PORTABILITY (Art. 20 GDPR)
GET /api/contacts/:id/export-data → JSON con todos los datos del contacto:
{ contact, deals, activities, emails, notes, attachments_list }
Entregar en máximo 30 días cuando el titular lo solicite.

4. POLICY ACCEPTANCE
DB: tabla policy_acceptances { userId, policyVersion, acceptedAt, ipAddress }
Al actualizar T&C: incrementar versión → forzar re-aceptación en próximo login.

5. DATA RETENTION
Configurable: "eliminar contactos sin actividad por más de X meses"
Cron mensual que identifica y anonimiza registros que cumplieron la retención.

UPSELL
"Cumplimiento de Ley 1581 incluido: si un cliente pide que borres sus datos, lo hacemos en un clic con registro completo del proceso."`,
    notes: null,
  },
  {
    id: "seed-revenue-intelligence",
    name: "Revenue Intelligence Stack",
    category: "Tool",
    status: "active",
    icon: "💰",
    description: "Módulo analítico encima del CRM: forecasting por etapa y probabilidad, win/loss analysis, deal health scoring, pipeline velocity, radar de deals en riesgo. No requiere herramienta externa.",
    url: null,
    tags: JSON.stringify(["revenue", "forecasting", "win-loss", "pipeline-health", "deal-health", "analytics", "crm", "revops"]),
    useCases: JSON.stringify([
      "Director de ventas que quiere forecast mensual preciso sin hojas de cálculo manuales",
      "Equipo con alto volumen de deals: identificar cuáles van a cerrar vs cuáles están perdidos",
      "Review mensual con el cliente sobre salud del pipeline y revenue proyectado",
    ]),
    costCents: 0,
    details: `COMPONENTES DEL STACK

1. FORECASTING (weighted pipeline)
Forecast = SUM(deal.value * deal.probability / 100) por período de cierre
Separar en: committed (prob > 70%), upside (40-70%), pipeline (< 40%)

2. DEAL HEALTH SCORE (0-100)
Señales negativas (restan puntos):
- Días sin actividad > 7 (-10/semana extra)
- Expected close ya pasó (-20)
- Mismo stage > 14 días (-15)
- Solo un tipo de actividad (solo emails, nunca llamadas) (-10)
Señales positivas:
- Email response received (+15)
- Meeting scheduled (+20)
- Propuesta vista por el cliente (+25)

3. WIN/LOSS ANALYSIS
Al cerrar un deal (ganado o perdido): registrar close_reason
Calcular por período: win_rate = ganados/(ganados+perdidos)
Agrupar por fuente, industria, tamaño de deal, vendedor, etapa donde se perdió
"El 60% de los deals perdidos se perdieron en etapa Propuesta — revisemos el pitch"

4. PIPELINE VELOCITY
velocity = (deals × win_rate × avg_deal_value) / avg_sales_cycle_days
Métrica única que mide qué tan rápido convierte la máquina de ventas.

5. RADAR (DEALS EN RIESGO)
Query: deals WHERE (daysSinceActivity > 10 OR expectedClose < today+7) AND status='active'
Dashboard: lista priorizada de deals que necesitan atención inmediata

UPSELL
"Forecast del mes siguiente, salud de cada deal, y alertas proactivas antes de perder oportunidades.
Reemplaza el Excel de seguimiento del director de ventas."`,
    notes: null,
  },
  {
    id: "seed-gmail-api",
    name: "Gmail API (Send + Reply Tracking)",
    category: "Integration",
    status: "testing",
    icon: "📥",
    description: "Enviar emails desde la cuenta Gmail del usuario + detectar replies automáticamente. Cuando el prospect responde, el CRM lo registra como actividad. OAuth del usuario requerido.",
    url: "https://developers.google.com/gmail",
    tags: JSON.stringify(["gmail", "google", "email", "reply-tracking", "oauth", "outreach", "inbox"]),
    useCases: JSON.stringify([
      "Vendedor que quiere que sus emails de outreach salgan de su propia cuenta Gmail",
      "Detectar automáticamente cuando un prospect responde → log de actividad sin intervención manual",
      "Sincronizar historial de emails pasados con la ficha del contacto en el CRM",
    ]),
    costCents: 0,
    details: `SCOPES NECESARIOS
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly

ENVIAR EMAIL VÍA GMAIL API
const raw = Buffer.from(
  'To: prospect@empresa.com\r\nSubject: Seguimiento\r\nContent-Type: text/html\r\n\r\n' + body
).toString('base64url')
await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })

REPLY DETECTION (polling)
Cada X minutos: buscar emails con label:INBOX newer_than:1d
GET /gmail/v1/users/me/messages?q=in:inbox newer_than:1d
Para cada mensaje nuevo: verificar si el threadId ya existe en el CRM
Si es un reply a un email enviado desde el CRM → log actividad tipo "email_reply"

ALTERNATIVA A POLLING: Gmail Push Notifications (Pub/Sub)
Más eficiente: Google notifica vía webhook cuando llega email nuevo al inbox.
Setup: Cloud Pub/Sub → Cloud Push → /api/webhooks/gmail-push
(más complejo de configurar, mejor para volúmenes altos)

CONSIDERACIONES
- El OAuth token del usuario expira en 1h — guardar y refrescar el refresh_token
- No guardar el contenido del email en el CRM si es sensible — solo subject + metadata
- Verificar que el usuario haya conectado su Google account antes de llamar a Gmail API

UPSELL
"Todos tus emails de ventas y las respuestas de los prospectos aparecen automáticamente en el CRM.
Sin copiar y pegar, sin perder historial."`,
    notes: null,
  },
  {
    id: "seed-marketing-attribution",
    name: "Marketing Attribution + Funnel",
    category: "Automation",
    status: "planned",
    icon: "📣",
    description: "Seguimiento de la fuente que genera cada lead y revenue: first-touch, last-touch y multi-touch. Funnel desde awareness → conversión con datos reales de ads + CRM.",
    url: null,
    tags: JSON.stringify(["attribution", "marketing", "funnel", "roi", "campaigns", "ads", "first-touch", "revenue"]),
    useCases: JSON.stringify([
      "Agencia de marketing que necesita demostrar ROI: '$1 invertido en Google Ads generó $X en deals'",
      "Cliente que corre ads en Meta + Google y no sabe cuál canal genera más clientes",
      "Equipo que quiere saber en qué etapa del funnel se pierden más leads",
    ]),
    costCents: null,
    details: `MODELO DE ATRIBUCIÓN

FIRST-TOUCH: 100% del crédito al primer canal que trajo al lead
LAST-TOUCH: 100% al último canal antes de cerrar
MULTI-TOUCH LINEAR: distribuye equitativamente entre todos los touchpoints

IMPLEMENTACIÓN BASIC
Al crear un contacto: guardar utm_source, utm_medium, utm_campaign en la DB
(Si viene de webhook de Typeform: el formulario puede incluir los UTMs de la URL)
Al cerrar un deal: asociar deal.value a los UTMs del contacto → revenue por fuente

FUNNEL VISUALIZATION
Etapas del funnel (configurable por cliente):
Awareness (impresiones) → Consideration (clics) → Lead (contacto creado) → SQL (calificado) → Closed Won

Métricas por etapa:
- Conversion rate: leads → SQL, SQL → Closed Won
- Avg time in stage
- Revenue por fuente (si ad spend se registra)

INTEGRACIÓN CON AD PLATFORMS (opcional)
Google Ads API: traer spend + impresiones + clics por campaña
Meta Ads API: idem
Calcular CPL (costo por lead), ROAS (return on ad spend) si se conectan las fuentes

CAMPAÑAS
campaigns { id, name, channel (google|meta|linkedin|email|organic), spend_cents, startDate, endDate }
campaign_contacts { campaignId, contactId, touchType (first|last|assisted) }

UPSELL
"Sabes exactamente qué canal de marketing genera más clientes — no más presupuesto a ciegas.
La agencia se convierte en un partner de revenue, no solo de contenido."`,
    notes: null,
  },

  // ─── Original items continue ───────────────────────────────────────────────
  {
    id: "seed-cookie-consent",
    name: "Cookie Consent + GDPR/Ley 1581",
    category: "Process",
    status: "active",
    icon: "🍪",
    description: "Banner de consentimiento propio: bloquea gtag.js hasta que el usuario acepta. Requerido antes de activar GA4. Self-built en 50 líneas, sin CMP externo costoso.",
    url: null,
    tags: JSON.stringify(["gdpr", "cookies", "ley-1581", "compliance", "ga4", "privacy", "consent"]),
    useCases: JSON.stringify([
      "Cualquier sitio que use GA4, Meta Pixel, o cualquier tracking — va ANTES de conectar gtag.js",
      "Clientes que venden a Colombia, UE, o cualquier mercado con regulación de privacidad",
      "Evitar multas + buildar confianza con usuarios",
    ]),
    costCents: 0,
    details: `IMPLEMENTACIÓN (50-70 líneas, no se necesita librería externa)

HTML: banner sticky en el bottom de la página
<div id="cookie-banner" style="display:none">
  <p>Usamos cookies para mejorar tu experiencia. <a href="/privacidad">Más info</a></p>
  <button onclick="acceptCookies()">Aceptar</button>
  <button onclick="declineCookies()">Rechazar</button>
</div>

JAVASCRIPT:
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
function loadGA4() {
  const s = document.createElement('script')
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX'
  document.head.appendChild(s)
}

En todos los HTML antes de gtag.js:
<script>initConsent()</script>

COLOMBIA: Ley 1581 de 2012 + Decreto 1377 de 2013 — Habeas Data
IMPORTANTE: construir el banner ANTES de agregar cualquier tracking al sitio.`,
    notes: null,
  },
];

export async function POST() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const jar = await cookies();
  const cookieVal = jar.get("oliwan-demo-session")?.value;
  const ok = await verifySession(secret, cookieVal);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let inserted = 0;
  let skipped = 0;

  const createdAt = new Date(now * 1000);

  for (const item of SEED_ITEMS) {
    const result = await db.insert(arsenalItems).values({
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status,
      icon: item.icon,
      description: item.description ?? null,
      url: ("url" in item ? item.url : null) ?? null,
      tags: item.tags,
      useCases: item.useCases,
      costCents: ("costCents" in item ? item.costCents : null) ?? null,
      details: item.details ?? null,
      notes: ("notes" in item ? item.notes : null) ?? null,
      createdAt,
      updatedAt: createdAt,
    }).onConflictDoNothing().run();
    if (result.rowsAffected > 0) inserted++;
    else skipped++;
  }

  return NextResponse.json({ inserted, skipped, total: SEED_ITEMS.length });
}
