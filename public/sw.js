const CACHE_NAME = "oliwan-shell-v3";
const SHELL_ASSETS = [
  "/manifest.json",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/spinner-1.png",
  "/spinner-2.png",
];

// True when this worker is replacing an already-active worker (i.e. a new
// deploy), as opposed to the very first install on a fresh visit. Used to
// force-reload open tabs only when there was actually an old version to
// replace — never on first install, so there's no reload loop.
let isUpdate = false;

self.addEventListener("install", (event) => {
  isUpdate = Boolean(self.registration.active);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();

      // A new worker just took over from an older one. Any open tab is still
      // running the previous deploy's HTML/JS in memory, so navigate each one
      // to reload it onto fresh assets. This runs inside the NEW worker — which
      // the browser fetches automatically on the next visit — so it works even
      // if every cached page from the old deploy has no update logic of its own.
      // Guarded by isUpdate so a first-ever install never triggers a reload.
      if (isUpdate) {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          client.navigate(client.url);
        }
      }
    })()
  );
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
