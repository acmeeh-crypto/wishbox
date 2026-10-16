// 소원함 시즌2 - Service Worker (PWA)
const CACHE_NAME = 'wishapp-v16';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './space.js',
  './minigame_icon.png',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './wishbox_logo.png',
  './wishbox_transparent.png',
  './wishbox.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  // Skip cross-origin (Supabase API etc.)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Static images and fonts: Cache-first
  const isStaticImage = /\.(png|jpg|jpeg|gif|svg|woff2?|ico)(\?.*)?$/i.test(url.pathname);

  if (isStaticImage) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML, CSS, JS: Network-first with Cache fallback (ensures fresh updates immediately)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
