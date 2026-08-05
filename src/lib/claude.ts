import Anthropic from "@anthropic-ai/sdk";
import type { Temperature, ActivityType } from "@/types";

const apiKey = process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!apiKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function isAIEnabled(): boolean {
  return !!apiKey;
}

interface ClassifyResult {
  temperature: Temperature;
  score: number;
  nextAction: string;
  reasoning: string;
}

export async function classifyLead(
  contactInfo: {
    name: string;
    company?: string;
    source?: string;
    notes?: string;
  },
  interactionHistory: Array<{
    type: ActivityType;
    description: string;
    date: string;
  }>
): Promise<ClassifyResult> {
  const anthropic = getClient();
  if (!anthropic) {
    return {
      temperature: "cold",
      score: 25,
      nextAction: "Enviar email de introduccion",
      reasoning: "Clasificacion por defecto (sin API key configurada)",
    };
  }

  const historyText = interactionHistory
    .map((i) => `- ${i.date}: [${i.type}] ${i.description}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Analiza este lead y clasifica su temperatura. Responde SOLO con JSON valido.

Contacto:
- Nombre: ${contactInfo.name}
- Empresa: ${contactInfo.company || "No especificada"}
- Fuente: ${contactInfo.source || "No especificada"}
- Notas: ${contactInfo.notes || "Sin notas"}

Historial de interacciones:
${historyText || "Sin interacciones registradas"}

Responde con este formato JSON exacto:
{
  "temperature": "cold" | "warm" | "hot",
  "score": <numero 0-100>,
  "nextAction": "<siguiente accion recomendada en espanol>",
  "reasoning": "<razon de la clasificacion en espanol>"
}`,
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ClassifyResult;
    }
  } catch {
    // Fall through to default
  }

  return {
    temperature: "cold",
    score: 25,
    nextAction: "Revisar manualmente",
    reasoning: "No se pudo analizar la respuesta de la IA",
  };
}

export type RewriteTone = "shorter" | "punchier" | "formal" | "casual";

const TONE_INSTRUCTIONS: Record<RewriteTone, string> = {
  shorter: "Hazlo mas corto y directo, sin perder el sentido.",
  punchier: "Hazlo mas contundente y persuasivo, tipo copy de venta.",
  formal: "Hazlo mas formal y profesional.",
  casual: "Hazlo mas cercano y conversacional.",
};

/**
 * Rewrites a single piece of website copy. Returns the original text
 * unchanged (never throws) when no API key is configured, so callers can
 * always render the result without a separate "AI unavailable" branch.
 */
export async function rewriteCopy(text: string, tone: RewriteTone): Promise<string> {
  const anthropic = getClient();
  if (!anthropic || !text.trim()) return text;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Reescribe este texto de un sitio web en espanol. ${TONE_INSTRUCTIONS[tone]}
No agregues comillas, explicaciones ni texto adicional — responde SOLO con el texto reescrito.
Mantén aproximadamente la misma longitud salvo que se pida "mas corto".

Texto original:
${text}`,
      },
    ],
  });

  const out = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  return out || text;
}
