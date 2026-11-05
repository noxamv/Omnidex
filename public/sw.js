const VERSION = 'v3';
const SHELL = `omnidex-shell-${VERSION}`;
const IMAGES = `omnidex-img-${VERSION}`;
const MAX_IMAGES = 200;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.add('/offline')).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![SHELL, IMAGES].includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.endsWith('supabase.co') || url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/track')) return;

  if (url.pathname === '/api/proxy' || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(req);
        const net = fetch(req).then((res) => {
          if (res.ok) { cache.put(req, res.clone()); trim(IMAGES, MAX_IMAGES); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/offline')));
  }
});
