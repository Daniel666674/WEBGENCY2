import type { NextRequest } from "next/server";

interface Entry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Entry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  request: NextRequest,
  opts: { key: string; windowMs: number; max: number }
): { ok: boolean; remaining: number } {
  const now = Date.now();
  cleanup(now);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const bucketKey = `${opts.key}:${ip}`;

  let entry = buckets.get(bucketKey);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(bucketKey, entry);
  }

  entry.count++;
  const remaining = Math.max(0, opts.max - entry.count);
  return { ok: entry.count <= opts.max, remaining };
}
