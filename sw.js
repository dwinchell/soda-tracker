// Caches the app shell so the app opens offline. Supabase API calls are never cached.
const CACHE = 'soda-v2';
const APP_FILES = [
  './', './index.html', './styles.css', './app.js', './store.js', './remote.js', './streak.js', './config.js', './cat.js', './messages.js', './achievements.js', './celebrate.js', './celebrate-ui.js',
  './vendor/supabase.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return; // never cache API/auth
  if (url.origin === location.origin) { // app files: network first (3 s), then cache
    e.respondWith(Promise.race([fetch(req), timeout(3000)]).then((r) => {
      if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone()));
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
  }
});
