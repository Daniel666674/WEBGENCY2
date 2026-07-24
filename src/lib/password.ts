// PBKDF2 password hashing via Web Crypto API.
// No external dependencies — runs in Node 18+ and Edge runtimes.

const ITERATIONS = 100_000;
const KEY_LEN_BITS = 256;

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

async function importKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
}

export async function hashPassword(password: string): Promise<string> {
  const saltBuf = new ArrayBuffer(16);
  crypto.getRandomValues(new Uint8Array(saltBuf));
  const key = await importKey(password);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBuf, iterations: ITERATIONS },
    key,
    KEY_LEN_BITS
  );
  return `${toBase64(saltBuf)}:${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;
  const saltBuf = fromBase64(saltB64);
  const expected = new Uint8Array(fromBase64(hashB64));
  const key = await importKey(password);
  const hash = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: saltBuf, iterations: ITERATIONS },
      key,
      KEY_LEN_BITS
    )
  );
  if (hash.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash[i] ^ expected[i];
  return diff === 0;
}
