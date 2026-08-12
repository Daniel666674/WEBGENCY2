import { NextRequest, NextResponse } from "next/server";
import { requireApi } from "@/lib/apiAuth";
import { GithubError, getFile, getGithubConfig, listHtmlFiles, listRepos } from "@/lib/github";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Browsing a repo for HTML pages, in one route.
 *
 * `?action=repos|files|file` rather than three sibling routes: they share the
 * same auth check, the same config load and the same error translation, and
 * splitting them would triple that boilerplate for no gain.
 *
 * Gated on "demos" — this exists to feed the demo importer, so whoever may
 * build demos may browse for one. Storing the token stays owner-only.
 */
export async function GET(request: NextRequest) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const action = params.get("action") ?? "repos";
  const { token } = await getGithubConfig();

  if (!token) {
    return NextResponse.json(
      { error: "GitHub no está conectado. Un owner puede conectarlo en Settings > Integraciones." },
      { status: 428 }
    );
  }

  try {
    if (action === "repos") {
      return NextResponse.json({ repos: await listRepos(token) }, { headers: { "Cache-Control": "no-store" } });
    }

    const repo = params.get("repo") ?? "";
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
      return NextResponse.json({ error: "Repositorio inválido" }, { status: 400 });
    }
    const ref = params.get("ref") || "HEAD";

    if (action === "files") {
      return NextResponse.json(
        { files: await listHtmlFiles(token, repo, ref) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "file") {
      const path = params.get("path") ?? "";
      if (!path || path.includes("..")) {
        return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
      }
      const file = await getFile(token, repo, path, ref);
      return NextResponse.json(file, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (e) {
    if (e instanceof GithubError) {
      return NextResponse.json({ error: e.message }, { status: e.status === 400 ? 428 : 502 });
    }
    return NextResponse.json({ error: "No pudimos hablar con GitHub." }, { status: 502 });
  }
}
