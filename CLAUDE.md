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
| `/api/pipeline/stages` | GET, POST, PUT, DELETE | CRUD de etapas (DELETE exige `?moveTo=` si la etapa tiene deals) |
| `/api/automations/run` | GET, POST | Historial del motor; ejecutar (`{"dryRun":true}` por defecto) |
| `/api/settings/automations` | GET, PUT | Reglas del motor de automatizaciones |
| `/api/settings/business` | GET, PUT | Perfil de tu propia empresa |
| `/api/settings/notifications` | GET, PUT | Destinatarios y canales de aviso |
| `/api/settings/integrations` | GET | Estado real de cada integracion (solo booleanos, nunca secretos) |
| `/api/cron/daily` | GET | Corre automatizaciones + envia el resumen. Requiere `CRON_SECRET` |
| `/api/demo-pages/import` | POST | HTML → demo editable (`dryRun: true` por defecto: analiza sin guardar) |
| `/api/settings/github` | GET, PUT, DELETE | Token de GitHub. El GET nunca devuelve el token |
| `/api/integrations/github` | GET | `?action=repos\|files\|file` para el importador de demos |

## Configuracion del negocio

El archivo `crm-config.json` (raiz del proyecto) tiene la configuracion personalizada.
Se genera con `/setup` y se modifica con `/customize`.

El archivo en `public/crm-config.json` es la copia por defecto (template).

La configuracion que se edita desde la app vive en la tabla `crm_settings` (key/value), no en
archivos — asi se cambia sin redeploy. Claves actuales: `business_profile`, `automations_config`,
`notification_config`, `payment_automation_config`.

## Motor de automatizaciones

`src/lib/automations.ts` (config) + `src/lib/automationEngine.ts` (planificar y aplicar).
Corre una vez al dia desde `/api/cron/daily` y se configura en Settings > Automatizaciones.

- **Planificar es una funcion pura** — sin escrituras. El mismo codigo alimenta el simulacro
  ("Probar") y la corrida real, asi que la vista previa muestra exactamente lo que va a pasar.
- **Cada accion lleva una `dedupeKey` estable** (regla + entidad) y se registra en `automation_runs`.
  Una accion cuya clave ya se escribio dentro del `cooldownDays` de su regla se omite — por eso
  correr el job dos veces la misma manana no duplica nada.
- **Nada es destructivo**: el motor crea trabajo y baja la temperatura de un lead. Nunca borra,
  nunca cierra un deal, nunca le escribe directo al cliente.
- Reglas que solo avisan (`notifyOnly`) no escriben registros; devuelven texto para que el cron
  lo entregue por email o WhatsApp.

Al agregar una regla nueva: definirla en `RULE_META` + `DEFAULT_RULES` (`automations.ts`) y
emitir su accion en `planAutomations()`. `normalizeConfig()` hace que una regla nueva llegue
activada en instalaciones existentes en vez de faltar.

## Importador de HTML (demos)

`src/lib/demo/import/` convierte una pagina HTML en un `DemoConfig` editable. Se usa desde
Demos > Importar HTML, con dos entradas: subir un `.html` o elegirlo de un repo de GitHub.

Pipeline, cuatro pasos puros sin efectos secundarios:

1. `parse.ts` — corta el body en bloques y **mide** cada uno (titulos, parrafos, imagenes,
   links, grupos repetidos). Las mediciones son por forma, nunca por nombres de clase: una
   grilla de tres tarjetas se detecta igual venga de `<section>` semanticas, de div-soup con
   Tailwind, o de tablas.
2. `classify.ts` — bloque → `SectionType`. Reglas ordenadas por que tan distintiva es su
   evidencia; la primera que coincide gana.
3. `extract.ts` — bloque → campos de la `Section`. **Trunca a los limites del schema**, porque
   validate.ts *rechaza* strings largos en vez de recortarlos.
4. `index.ts` — arma marca, nav, footer y el config final.

Tres invariantes que hay que mantener al tocarlo:

- **Nada se descarta en silencio.** La ultima regla de `classify.ts` no tiene condicion y
  devuelve `columns` (texto libre). Un bloque mal clasificado le cuesta al usuario cambiar un
  dropdown; un bloque perdido le cuesta contenido que quiza no note que falta.
- **El importador no tiene responsabilidades de seguridad.** Puede emitir un href
  `javascript:` que encontro en el original; `validateDemoConfig()` lo descarta igual que si
  lo hubieran tipeado a mano. Por eso esta funcion no agrega superficie de ataque a
  `/demo/[slug]`.
- **Toda medicion de texto usa `visibleText()`**, no `.text`. El parser concatena sin espacios,
  asi que `<p>12</p><p>años</p>` sale como `"12años"` y rompe cualquier regla que cuente
  palabras o mire el primer token.

Para agregar una heuristica: sumar la regla en `classifyBlock()` (antes del catch-all) y su
caso en el `switch` de `extractSection()`. Conviene probar contra los tres tipos de HTML —
semantico, div-soup y hostil — antes de darla por buena.

GitHub se conecta con un **fine-grained PAT** (`Contents: read`) guardado en `crm_settings`,
no con OAuth: la identidad de la app es Google via NextAuth, y esto es una credencial de
integracion. El token nunca vuelve al cliente — `GET /api/settings/github` devuelve solo
`{ configured, hint }`. Conectarlo es `ownerOnly`; **usarlo** (listar repos, leer un archivo)
lo puede hacer cualquiera del equipo, igual que el resto de Demos.

El importador soporta sitios completos, no solo una pagina: `src/lib/demo/import/multipage.ts`
mapea varios archivos a `DemoConfig.pages` y reescribe los enlaces entre ellos (incluidas las
anclas, que `NavLink.page` no puede expresar). `normalizePath()` colapsa una URL a algo con
forma de path de repo antes de derivar el slug, asi que un import por URL y uno por GitHub
producen la misma forma.

**Paletas reales**: los colores casi nunca estan en el HTML — viven en una hoja de estilos
enlazada. `parseSource()` solo mira declaraciones `:root`/`:host` (nunca una regla de
componente 400 lineas abajo, que seria un override local, no la paleta del sitio), y el
picker de GitHub descarga esas hojas con el mismo token antes de importar.

**Sitios armados con JavaScript** (categorias, header, footer que un archivo estatico no
muestra) necesitan `src/lib/demo/import/headless.ts`: renderiza la pagina en Chromium real
antes de parsearla, asi el importador ve el DOM que ve un visitante. Es lo que resuelve la
pestaña "Desde una URL" del dialogo — la via correcta para un sitio publicado, a diferencia
de leer el archivo crudo del repo. `parseSource()` detecta los contenedores que un script
llena en runtime (marcados con id/class, vacios en el archivo que se parseo) y lo dice
explicito en el reporte en vez de dejar que la seccion salga vacia sin explicacion.

## Permisos siempre concedidos

`ALWAYS_GRANTED` en `src/lib/permissions.ts` lista las paginas que cualquier usuario logueado
abre, sin importar lo que tenga guardado. Hoy: `demos`.

Se chequea antes de los permisos guardados dentro de `hasPermission()`, asi que alcanza al
Sidebar, al `PermissionGuard` y a las 13 rutas de API de demos desde un solo lugar. Agregar una
pagina aca es una decision de producto ("esto es espacio de trabajo compartido"), no una
comodidad: dinero, cuentas de clientes y configuracion siguen cerrados.

`PermissionPicker` las muestra tildadas y bloqueadas — un checkbox que se puede destildar pero
no cambia nada es peor que no tenerlo.

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
