/**
 * Minimal GitHub read client for importing HTML pages.
 *
 * Authenticated with a fine-grained personal access token (`Contents: read`)
 * stored in crm_settings, not with OAuth. Three reasons:
 *
 *  - It is the pattern the rest of the CRM's integrations already use
 *    (paymentAutomation, businessConfig): edited from Settings, no redeploy.
 *  - Identity here is Google via NextAuth. A second OAuth provider would
 *    muddle "who is signed in" with "what can the app read".
 *  - No callback route, no refresh cycle, and it works with private repos.
 *
 * The token never leaves the server. `getGithubStatus()` is what the UI gets:
 * a boolean and a masked hint.
 */

import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_KEY = "github_config";
const API = "https://api.github.com";

export interface GithubConfig {
  token: string;
  /** Remembered between imports so the picker opens where you left off. */
  defaultRepo: string;
}

export interface GithubStatus {
  configured: boolean;
  /** Last four characters only — enough to tell two tokens apart. */
  hint: string;
  defaultRepo: string;
}

export class GithubError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function getGithubConfig(): Promise<GithubConfig> {
  const row = await db.select().from(crmSettings).where(eq(crmSettings.key, SETTINGS_KEY)).get();
  if (!row) return { token: "", defaultRepo: "" };
  try {
    const parsed = JSON.parse(row.value);
    return {
      token: typeof parsed.token === "string" ? parsed.token : "",
      defaultRepo: typeof parsed.defaultRepo === "string" ? parsed.defaultRepo : "",
    };
  } catch {
    return { token: "", defaultRepo: "" };
  }
}

export async function saveGithubConfig(config: Partial<GithubConfig>): Promise<GithubStatus> {
  const current = await getGithubConfig();
  // An empty token means "leave it alone" — the UI never receives the current
  // one, so it cannot send it back on an unrelated save.
  const next: GithubConfig = {
    token: typeof config.token === "string" && config.token.trim() ? config.token.trim() : current.token,
    defaultRepo: typeof config.defaultRepo === "string" ? config.defaultRepo.trim().slice(0, 200) : current.defaultRepo,
  };
  await db
    .insert(crmSettings)
    .values({ key: SETTINGS_KEY, value: JSON.stringify(next) })
    .onConflictDoUpdate({ target: crmSettings.key, set: { value: JSON.stringify(next) } })
    .run();
  return statusOf(next);
}

export async function clearGithubConfig(): Promise<void> {
  await db.delete(crmSettings).where(eq(crmSettings.key, SETTINGS_KEY)).run();
}

export function statusOf(config: GithubConfig): GithubStatus {
  return {
    configured: !!config.token,
    hint: config.token ? `••••${config.token.slice(-4)}` : "",
    defaultRepo: config.defaultRepo,
  };
}

export async function getGithubStatus(): Promise<GithubStatus> {
  return statusOf(await getGithubConfig());
}

/** GitHub's own errors are opaque. These are the ones people actually hit. */
function explain(status: number, body: string): string {
  if (status === 401) return "El token de GitHub no es válido o ya venció. Generá uno nuevo en Settings > Integraciones.";
  if (status === 403) {
    return /rate limit/i.test(body)
      ? "GitHub está limitando las peticiones. Esperá un minuto y volvé a intentar."
      : "El token no tiene permiso para leer esto. Revisá que incluya 'Contents: read' para este repositorio.";
  }
  if (status === 404) return "No encontramos eso en GitHub. Puede que el repositorio no exista o que el token no tenga acceso.";
  if (status === 409) return "El repositorio está vacío.";
  return `GitHub respondió ${status}.`;
}

async function gh(path: string, token: string, accept = "application/vnd.github+json"): Promise<Response> {
  if (!token) throw new GithubError("Falta conectar GitHub. Configuralo en Settings > Integraciones.", 400);

  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "oliwan-crm",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new GithubError(explain(res.status, await res.text()), res.status);
  return res;
}

export interface RepoRef {
  fullName: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
}

export async function listRepos(token: string): Promise<RepoRef[]> {
  const res = await gh("/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member", token);
  const rows = (await res.json()) as {
    full_name: string;
    private: boolean;
    default_branch: string;
    pushed_at: string;
  }[];
  return rows.map((r) => ({
    fullName: r.full_name,
    private: r.private,
    defaultBranch: r.default_branch,
    updatedAt: r.pushed_at,
  }));
}

export interface RepoFile {
  path: string;
  size: number;
}

/**
 * Every .html file in the repo, in one request.
 *
 * The recursive tree API beats walking the Contents API directory by
 * directory — one call instead of one per folder, which matters on a repo
 * with any real structure.
 */
export async function listHtmlFiles(token: string, repo: string, ref: string): Promise<RepoFile[]> {
  const res = await gh(`/repos/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`, token);
  const body = (await res.json()) as { tree?: { path: string; type: string; size?: number }[]; truncated?: boolean };

  return (body.tree ?? [])
    .filter((n) => n.type === "blob" && /\.html?$/i.test(n.path))
    .filter((n) => !/(?:^|\/)(?:node_modules|dist|build|\.next|coverage)\//.test(n.path))
    .map((n) => ({ path: n.path, size: n.size ?? 0 }))
    .sort((a, b) => {
      // index.html first — it is the page people mean by default.
      const ai = /(?:^|\/)index\.html?$/i.test(a.path) ? 0 : 1;
      const bi = /(?:^|\/)index\.html?$/i.test(b.path) ? 0 : 1;
      return ai - bi || a.path.localeCompare(b.path);
    })
    .slice(0, 300);
}

export interface FetchedFile {
  content: string;
  /** Base for resolving the page's relative image and link URLs. */
  rawBaseUrl: string;
}

export async function getFile(token: string, repo: string, path: string, ref: string): Promise<FetchedFile> {
  const res = await gh(
    `/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`,
    token,
    "application/vnd.github.raw"
  );
  const content = await res.text();
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
  return {
    content,
    rawBaseUrl: `https://raw.githubusercontent.com/${repo}/${ref}/${dir}`,
  };
}
