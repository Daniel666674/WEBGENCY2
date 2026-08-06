import { NextRequest, NextResponse } from "next/server";
import { rewriteCopy, isAIEnabled, type RewriteTone } from "@/lib/claude";
import { sanitizeRich } from "@/lib/demo/validate";

const TONES: RewriteTone[] = ["shorter", "punchier", "formal", "casual"];

export async function POST(request: NextRequest) {
  if (!isAIEnabled()) {
    return NextResponse.json(
      { error: "Configura ANTHROPIC_API_KEY para usar la reescritura con IA." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.slice(0, 4000) : "";
  const tone = TONES.includes(body.tone) ? (body.tone as RewriteTone) : "punchier";
  // Whether the target field stores constrained HTML (heading/subheading/
  // body) or plain text (eyebrow/ctaText/items.price). Only rich fields get
  // run through the HTML sanitizer — a plain field would double-escape
  // (validate.ts already escapes plain text at write time via the schema).
  const rich = body.rich === true;
  if (!text.trim()) return NextResponse.json({ error: "Texto vacio" }, { status: 400 });

  // The model is asked to return plain text; sanitizing rich results
  // defensively still closes the gap since this lands in a field that
  // renders on a public page.
  try {
    const out = await rewriteCopy(text, tone);
    return NextResponse.json({ text: rich ? sanitizeRich(out) : out });
  } catch (err) {
    // Anthropic's SDK throws on network failure, rate limits, and auth
    // errors alike — none of that should surface as a raw 500 to a builder
    // that's just trying to reword a sentence.
    const status = err instanceof Error && "status" in err ? Number((err as { status?: number }).status) : undefined;
    const message =
      status === 429 ? "Demasiadas solicitudes de IA por ahora. Intenta en un momento."
      : status === 401 ? "La clave de Anthropic no es válida."
      : "No se pudo reescribir el texto.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
