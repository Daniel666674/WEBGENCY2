const CACHE_NAME = "oliwan-shell-v2";
const SHELL_ASSETS = [
  "/manifest.json",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/spinner-1.png",
  "/spinner-2.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Only ever serve the small precached static shell (icons/manifest) from cache.
// Everything else — HTML documents, JS chunks, CSS, API data — is fetched from
// the network with the browser HTTP cache bypassed, so a fresh deploy is picked
// up immediately and stale assets are never served. A CRM must never render
// stale contact/deal/proposal data, and a stale JS chunk means a stale UI.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin === self.location.origin && SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Network-first, bypassing the HTTP cache for same-origin app assets so a new
  // deployment's HTML + chunks are always fetched fresh. Fall back to any cached
  // copy only when the network is unavailable (offline).
  const bypassHttpCache = url.origin === self.location.origin;
  event.respondWith(
    fetch(bypassHttpCache ? new Request(request, { cache: "reload" }) : request).catch(
      () => caches.match(request)
    )
  );
});
