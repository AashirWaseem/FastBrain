/* Service worker: keeps a copy of the app on the device so it opens and runs with no internet.
   Bump VERSION whenever app files change so phones pick up the update. */
const VERSION = 'fastbrain-v7';
const FILES = [
  './', './index.html', './manifest.json', './css/app.css',
  './js/util.js', './js/ui.js', './js/pages.js', './js/data/words.js',
  './js/games/nback.js', './js/games/cwm.js', './js/games/mmath.js',
  './js/games/corsi.js', './js/games/span.js', './js/games/pasat.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version never stores stale files
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first so updates arrive when online, but give up after a few seconds on a weak
// connection and use the saved copy. Only page loads fall back to index.html.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const network = fetch(req).then(res => {
      if (res.ok) e.waitUntil(cache.put(req, res.clone()));
      return res;
    });
    const timeout = new Promise(resolve => setTimeout(resolve, isPage ? 3000 : 5000, null));
    try {
      const res = await Promise.race([network, timeout]);
      if (res) return res;
    } catch (err) { /* offline */ }
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    if (isPage) return (await cache.match('./index.html')) || Response.error();
    // nothing saved: keep waiting for the network (or fail like a normal request)
    return network.catch(() => Response.error());
  })());
});
