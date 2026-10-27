const SHELL = "preincarnation-shell-v1";
/** The document at / holds the 320×240 canvas. This list is that shell, not the save. */
const URLS = ["/", "/manifest.webmanifest", "/favicon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== SHELL).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) return;
  const shell = URLS.includes(url.pathname);
  const art = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/game/");
  if (!shell && !art) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && (shell || art)) {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
