import { NextRequest, NextResponse } from "next/server";

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface UnsplashResult {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  user: { name: string };
}

// Stock photo search — Claude/Anthropic has no image-generation capability,
// so this is Unsplash's free API instead. Photographer attribution is
// required by Unsplash's API guidelines and returned alongside each result
// so the picker can surface it.
export async function GET(request: NextRequest) {
  if (!UNSPLASH_KEY) {
    return NextResponse.json(
      { error: "Configura UNSPLASH_ACCESS_KEY para buscar fotos de stock." },
      { status: 400 }
    );
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 200);
  if (!query) return NextResponse.json({ error: "Escribe qué buscar" }, { status: 400 });

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo buscar en Unsplash" }, { status: 502 });
  }

  const data = await res.json();
  const results = (data.results as UnsplashResult[] | undefined ?? []).map((r) => ({
    id: r.id,
    url: r.urls.regular,
    alt: r.alt_description || query,
    credit: r.user.name,
  }));

  return NextResponse.json({ results });
}
