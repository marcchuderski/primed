// Primed service worker (roadmap 7.3): caches the app shell only, never API data (docs/ARCHITECTURE.md).
// Placeholders are filled in at build time by tools/pwa.ts.
const VERSION = '__PRIMED_VERSION__';
const PRECACHE = __PRIMED_PRECACHE__;
const CACHE = `primed-shell-${VERSION}`;
const SHELL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([SHELL, ...PRECACHE]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith('primed-shell-') && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }
  const url = new URL(request.url);
  // Same origin only; the API is never touched, so no user data ends up in Cache Storage.
  if (url.origin !== self.location.origin || url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    return;
  }
  if (request.mode === 'navigate') {
    // Network first: a deploy is visible immediately; the cached shell only answers offline.
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then((cache) => cache.match(SHELL))));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/pwa/')) {
    // Hashed or versioned files: cache first.
    event.respondWith(
      caches
        .open(CACHE)
        .then((cache) => cache.match(request))
        .then((hit) => hit ?? fetch(request)),
    );
  }
});
