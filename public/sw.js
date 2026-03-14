// Photo Healthy Service Worker
const CACHE_VERSION = 'ph-v' + Date.now();

self.addEventListener('install', (event) => {
  // Skip waiting — activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches on activate
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache: API calls, uploads, PHP files
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.php') ||
    url.pathname.startsWith('/uploads/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation (HTML) — always network first, fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // JS bundles and assets — cache first (they have content-hash names)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
