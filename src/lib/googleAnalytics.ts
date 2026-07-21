import { google } from "googleapis";

// Read-only scopes for GA4 (Analytics Data API) + Search Console.
const READ_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

/**
 * Preferred auth for pulling a client's analytics into the CRM: a Google
 * service account. Unlike the interactive OAuth flow, this needs no
 * AUTH_ENABLED, no per-user Google sign-in, and no redirect URIs — the
 * service account is granted read access to the client's GA4 property and
 * Search Console site once, and the CRM's own login already gates the route.
 *
 * Set GOOGLE_SERVICE_ACCOUNT_KEY to the full JSON key (the file Google Cloud
 * hands you when you create the key), as a single-line string. Returns null
 * when it isn't configured or is malformed, so the caller falls back to the
 * OAuth path.
 */
export function getServiceAccountAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!credentials.client_email || !credentials.private_key) return null;
  return new google.auth.GoogleAuth({ credentials, scopes: READ_SCOPES });
}
