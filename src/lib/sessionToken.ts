// Signs the session cookie so the login gate is a real one, not just a
// cookie whose presence anyone can fake. proxy.ts previously only checked
// `request.cookies.has("oliwan-demo-session")` — true/false, no value
// check — so anyone who read this open-source file and knew the cookie
// name could bypass the login page entirely with a raw HTTP request
// (`curl -H "Cookie: oliwan-demo-session=1"`), no password needed. Browser
// httpOnly only stops JS from reading/setting cookies; it does nothing
// against a hand-crafted request.
//
// Fix: the cookie value is `${expiresAt}.${hmacHex}`, signed with a
// server-only secret (SESSION_SECRET). Middleware recomputes the HMAC and
// only accepts a match — a value can't be forged without the secret, and
// it self-expires. Uses Web Crypto (crypto.subtle) so the exact same code
// runs in both the Node login route and the Edge middleware.

const encoder = new TextEncoder();

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signSession(secret: string, expiresAtSeconds: number): Promise<string> {
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(String(expiresAtSeconds)));
  return `${expiresAtSeconds}.${toHex(sig)}`;
}

export async function verifySession(secret: string, cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex === -1) return false;
  const expiresAtRaw = cookieValue.slice(0, dotIndex);
  const givenSig = cookieValue.slice(dotIndex + 1);
  const expiresAtSeconds = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAtSeconds) || expiresAtSeconds < Date.now() / 1000) return false;

  const key = await getKey(secret);
  const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(expiresAtRaw));
  const expectedHex = toHex(expectedSig);

  // Constant-time compare — bail out early only after checking full length
  if (givenSig.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= givenSig.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

/** Constant-time string compare for the username/password check itself. */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = encoder;
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  // Length differs → definitely not equal, but still do a fixed amount of
  // work so failure doesn't return measurably faster.
  const maxLen = Math.max(aBytes.length, bBytes.length, 32);
  let diff = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}
