/**
 * Email canonicalization for the access allowlist.
 *
 * Gmail ignores dots and everything after a "+" in the local part, so
 * juan.perez@gmail.com, juanperez@gmail.com and juanperez+crm@gmail.com are
 * one mailbox and one person. The allowlist compares strings, so inviting a
 * teammate in a form Google doesn't report back locks them out of an account
 * that is genuinely theirs — and the failure looks identical to "not
 * invited", which makes it miserable to debug.
 *
 * Only Gmail is normalized. Other providers may legitimately treat dots or
 * plus-tags as distinct addresses, and silently merging two real mailboxes
 * into one allowlist entry would be a security bug, not a convenience.
 */

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/** Lowercased and trimmed. The form shown in the UI. */
export function cleanEmail(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

/**
 * The comparison key for an address. Two addresses that reach the same
 * mailbox produce the same key.
 */
export function canonicalEmail(raw: string | null | undefined): string {
  const email = cleanEmail(raw);
  const at = email.lastIndexOf("@");
  if (at < 1) return email;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!GMAIL_DOMAINS.has(domain)) return email;

  const base = local.split("+")[0].replace(/\./g, "");
  // googlemail.com is an alias of gmail.com — fold both onto one key.
  return base ? `${base}@gmail.com` : email;
}

/** True when both addresses reach the same mailbox. */
export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  const ca = canonicalEmail(a);
  return !!ca && ca === canonicalEmail(b);
}
