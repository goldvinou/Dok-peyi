/* ============================================================
   DOK'PÉYI — Service Worker  (sw.js)
   Cache-first for static assets, network-first for API calls.
   ============================================================ */

const CACHE = 'dok-v1';
const PRECACHE = [
  '/',
  '/service.html',
  '/legales.html',
  '/tokens.css',
  '/styles.css',
  '/service.css',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() => {
      self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
      );
    })
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Never intercept API calls or Firebase
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firebase')) return;

  // Network-first for navigation (always fresh HTML)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, images, fonts)
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      });
    })
  );
});
