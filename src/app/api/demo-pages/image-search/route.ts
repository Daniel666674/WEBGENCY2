import { NextRequest, NextResponse } from "next/server";
import { requireApi } from "@/lib/apiAuth";

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface UnsplashResult {
  id?: string;
  urls?: { regular?: string };
  alt_description?: string | null;
  user?: { name?: string };
}

// Stock photo search — Claude/Anthropic has no image-generation capability,
// so this is Unsplash's free API instead. Photographer attribution is
// required by Unsplash's API guidelines and returned alongside each result
// so the picker can surface it.
export async function GET(request: NextRequest) {
  const denied = await requireApi("demos");
  if (denied) return denied;

  if (!UNSPLASH_KEY) {
    return NextResponse.json(
      { error: "Configura UNSPLASH_ACCESS_KEY para buscar fotos de stock." },
      { status: 400 }
    );
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 200);
  if (!query) return NextResponse.json({ error: "Escribe qué buscar" }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    );

    if (!res.ok) {
      // Unsplash returns 401 on a bad/revoked key and 403 once the free
      // tier's rate limit is hit — surface that distinction rather than a
      // blanket "search failed" that hides what actually needs fixing.
      const msg =
        res.status === 401 ? "La clave de Unsplash no es válida."
        : res.status === 403 ? "Se alcanzó el límite de búsquedas de Unsplash por ahora. Intenta en un momento."
        : "No se pudo buscar en Unsplash.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await res.json();
    // Individual results can legitimately lack a URL or attribution — a
    // moderated/deleted photo still shows up in older search indexes — so
    // each field is optional-checked and short-circuited rather than
    // trusted, and any candidate missing its image URL is dropped instead
    // of producing a broken picker tile.
    const rawResults = Array.isArray(data?.results) ? (data.results as UnsplashResult[]) : [];
    const results = rawResults
      .filter((r): r is UnsplashResult & { id: string; urls: { regular: string } } => !!r.id && !!r.urls?.regular)
      .map((r) => ({
        id: r.id,
        url: r.urls.regular,
        alt: r.alt_description || query,
        credit: r.user?.name || "Unsplash",
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "No se pudo buscar en Unsplash." }, { status: 502 });
  }
}
