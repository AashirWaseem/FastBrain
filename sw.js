/* Service worker: keeps a copy of the app on the device so it opens and runs with no internet.
   Bump VERSION whenever app files change so phones pick up the update. */
const VERSION = 'fastbrain-v4';
const FILES = [
  './', './index.html', './manifest.json', './css/app.css',
  './js/util.js', './js/ui.js', './js/pages.js', './js/data/words.js',
  './js/games/nback.js', './js/games/cwm.js', './js/games/mmath.js',
  './js/games/corsi.js', './js/games/span.js', './js/games/pasat.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first (so updates arrive when online), falling back to the saved copy offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
