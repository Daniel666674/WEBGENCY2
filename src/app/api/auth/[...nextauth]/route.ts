import { handlers } from "@/auth";
import { ensureSchema } from "@/db";
import type { NextRequest } from "next/server";

let ready: Promise<void> | null = null;
function ensureReady() {
  if (!ready) ready = ensureSchema().catch(() => {});
  return ready;
}

export async function GET(req: NextRequest) {
  await ensureReady();
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  await ensureReady();
  return handlers.POST(req);
}
