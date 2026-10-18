const CACHE_NAME = 'omnidex-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER intercept Next.js static assets, stylesheets, chunks, or external APIs
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.js') ||
    url.hostname.includes('supabase.co') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Network-first strategy for pages
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
