# CLAUDE.md — Auto-CRM

> Este es un CRM completo que se personaliza a cada negocio.
> Cuando un usuario abre este proyecto con Claude Code, tu trabajo es ayudarle a configurarlo,
> usarlo, y expandirlo segun sus necesidades. La app (Next.js) corre donde el usuario la despliegue;
> los datos viven en una base de datos Turso (libSQL) hospedada, siempre disponible — no en un
> archivo local.

## Inicio rapido para el usuario

Si es la primera vez que el usuario abre el proyecto, guialo con estos pasos:

1. `npm install` — Instalar dependencias
2. Crear una base de datos en https://turso.tech y poner `TURSO_DATABASE_URL` /
   `TURSO_AUTH_TOKEN` en `.env.local` (ver `.env.example`)
3. `npm run dev` — Iniciar servidor en http://localhost:3000 (crea el schema solo en el primer arranque)
4. `npm run seed` — (Opcional) datos demo
5. Ejecutar `/setup` para personalizar el CRM a su negocio

## Comandos

```bash
npm run dev          # Servidor de desarrollo (http://localhost:3000)
npm run build        # Build de produccion
npm start            # Servidor de produccion
npm run seed         # Datos demo (contra la base Turso configurada)
npm run lint         # ESLint
npm run mcp          # Iniciar servidor MCP (para Claude Desktop/Web)
```

## Comandos interactivos disponibles

| Comando | Que hace |
|---------|----------|
| `/setup` | Personalizar CRM: pipeline, fuentes de leads, industria, idioma, tema |
| `/add-lead` | Agregar un lead conversacionalmente — describe al prospecto y se crea automaticamente |
| `/analyze-pipeline` | Analisis completo del pipeline con recomendaciones accionables |
| `/daily-briefing` | Resumen ejecutivo del dia: follow-ups, deals calientes, prioridades |
| `/import-contacts` | Importar contactos desde un archivo CSV |
| `/customize` | Cambiar configuracion sin reiniciar todo |
| `/connect` | Conectar CRM con Gmail, Calendar, Sheets, WhatsApp via MCP |
| `/digest` | Enviar resumen diario por email (requiere Resend) |

## Arquitectura

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Turso (libSQL) + Drizzle ORM · @dnd-kit (kanban)

**Base de datos hospedada**: Turso (libSQL, compatible con SQLite) via `@libsql/client` +
`drizzle-orm/libsql`. El cliente Drizzle es asincrono (a diferencia del driver local anterior) —
toda llamada `db.select()/insert()/update()/delete()...get()/.all()/.run()` requiere `await`.
El schema se crea solo (`ensureSchema()` en `src/instrumentation.ts`) al arrancar el servidor.

**Alias**: `@/*` → `./src/*`

### Directorios clave

- `src/app/` — Paginas y API routes (App Router)
- `src/components/` — Componentes React organizados por feature
- `src/db/` — Schema Drizzle, cliente DB (Turso/libSQL), seeder
- `src/lib/` — Utilidades: claude.ts (AI), scoring.ts, constants.ts
- `src/types/` — TypeScript types para entidades CRM
- `.claude/commands/` — Comandos interactivos (los de la tabla arriba)
- `mcp/` — Servidor MCP para integracion con Claude Desktop/Web
- `scripts/` — Scripts de inicializacion y utilidades

### Modelo de datos

- **Contacts**: Leads con temperatura (frio/tibio/caliente), score, fuente, historial
- **Deals**: Oportunidades de venta con valor (en centavos), etapa, probabilidad
- **Activities**: Interacciones (llamada/email/reunion/nota/follow-up) con fechas
- **Pipeline Stages**: Etapas configurables del pipeline de ventas
- **CRM Settings**: Configuracion key-value

### API Routes

| Endpoint | Metodos | Descripcion |
|----------|---------|-------------|
| `/api/contacts` | GET, POST | Listar (con busqueda/filtro) y crear contactos |
| `/api/contacts/[id]` | GET, PUT, DELETE | CRUD individual de contacto |
| `/api/deals` | GET, POST | Listar y crear deals |
| `/api/deals/[id]` | GET, PUT, DELETE | CRUD individual de deal |
| `/api/activities` | GET, POST | Listar y registrar actividades |
| `/api/activities/[id]` | PUT, DELETE | Completar o eliminar actividad |
| `/api/pipeline` | GET, PUT | Pipeline completo; mover deals entre etapas |
| `/api/classify` | POST | Clasificar lead (IA o reglas) |
| `/api/followups` | GET | Follow-ups pendientes (vencidos, hoy, proximos) |
| `/api/import` | POST | Importacion masiva de contactos |
| `/api/webhook` | POST | Recibir leads de formularios externos (Typeform, Tally, etc.) |
| `/api/export` | GET | Exportar contactos o deals como CSV (?type=contacts o deals) |
| `/api/digest` | POST | Enviar resumen diario por email (requiere RESEND_API_KEY) |

## Configuracion del negocio

El archivo `crm-config.json` (raiz del proyecto) tiene la configuracion personalizada.
Se genera con `/setup` y se modifica con `/customize`.

El archivo en `public/crm-config.json` es la copia por defecto (template).

## Reglas de codigo

- **Idioma UI**: Espanol por defecto. Soporte bilingue con `const t = { en: {...}, es: {...} }`
- **Max ~300 lineas por componente**. Dividir si crece mas
- **No emojis como iconos** — usar Lucide React (SVG)
- **Valores monetarios**: Centavos (integer). Usar `formatCurrency()` para mostrar
- **Fechas**: `date-fns` para formateo. Turso/SQLite almacena como integer timestamps
- **Forms**: react-hook-form + zod
- **Drag & drop**: @dnd-kit (NO react-beautiful-dnd)
- **Estilos**: Tailwind CSS v4 (config via CSS, no tailwind.config.ts)

## Modos de IA

1. **Terminal Mode** (default, sin API key): Toda la IA via tus comandos de Claude Code.
   El usuario describe lo que necesita, tu lees/escribes datos via `curl` a los API routes.

2. **API Mode** (opcional): Si el usuario pone `ANTHROPIC_API_KEY` en `.env.local`,
   la web tiene clasificacion automatica de leads inline.

3. **MCP Mode**: El usuario puede conectar Claude Desktop/Web al CRM via el servidor MCP.
   Config: `npm run mcp` o agregar a `claude_desktop_config.json`.

**Sin API key, el CRM funciona 100%.** La IA es un extra, no un requisito.

## Despliegue

### Local (desarrollo)
```bash
npm run dev
```

### Local (produccion)
```bash
npm run build && npm start  # puerto 3000
```

### Docker (VPS)
```bash
cp .env.example .env      # completar CRM_USERNAME / CRM_PASSWORD / SESSION_SECRET / TURSO_* — REQUERIDOS
docker compose up -d --build
```
Sin esas variables el login queda cerrado para todos (falla cerrado, no abierto) o el server no
puede conectarse a la base de datos.

**HTTPS es obligatorio para poder iniciar sesion**: la cookie de sesion tiene el flag
`Secure`, que el navegador ignora por completo sobre `http://` plano — sin TLS el login
entra en loop infinito de vuelta a `/login`. Con un dominio ya apuntando al VPS:
```bash
cp Caddyfile.example Caddyfile   # editar el dominio adentro
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```
Esto agrega Caddy como reverse proxy con TLS automatico (Let's Encrypt) y deja de exponer
el puerto 3000 directamente al host.

Los datos viven en Turso (hospedado), no en el filesystem del contenedor — sobreviven a
reinicios, redeploys, y funcionan igual en Docker/VPS que en Vercel/serverless, sin necesidad
de bind mounts ni mirroring a Blob.

### MCP (Claude Desktop/Web)
Agregar a `~/.claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "auto-crm": {
      "command": "npx",
      "args": ["tsx", "/ruta/al/proyecto/mcp/crm-server.ts"]
    }
  }
}
```

## Variables de entorno

- `TURSO_DATABASE_URL` — **Requerido**. URL de la base de datos Turso (`libsql://...`)
- `TURSO_AUTH_TOKEN` — **Requerido**. Auth token de esa base de datos
- `ANTHROPIC_API_KEY` — Opcional. Para IA en la interfaz web (clasificacion de leads)
- `RESEND_API_KEY` — Opcional. Para enviar digest diario por email (resend.com, gratis)
- `DIGEST_EMAIL` — Opcional. Email donde recibir el digest
- `DIGEST_FROM` — Opcional. Email remitente del digest (default: onboarding@resend.dev)
