// Service Worker for xomleo.vn
// Purpose: cache static assets aggressively (1 year) to compensate
// for GitHub Pages 10-minute Cache-Control limit.
// Strategy: stale-while-revalidate for assets, network-first for HTML.

// Doi CACHE_VERSION moi khi bump cache-buster cua CSS/JS: handler 'activate'
// se xoa het cache khong khop prefix, tranh de lai entry cua phien ban cu.
const CACHE_VERSION = 'xomleo-c0a4eb66';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
  '/css/style.css?ha899ef71',
  '/css/tailwind-output.css?h5a7f4e6a',
  '/js/main.min.js?h743c455d',
  '/uploads/1775619688243-610230636-img2.webp',
  '/uploads/favicon-32x32.png',
  '/uploads/favicon-16x16.png'
];

const STATIC_PATTERNS = [
  /\/css\//,
  /\/js\//,
  /\/uploads\/.*\.(webp|jpg|jpeg|png|ico|svg|mp4|webm|woff2?)$/,
  /^https:\/\/fonts\.gstatic\.com\//
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip cross-origin except whitelisted (Google Fonts CSS is GET, not cached here)
  if (url.origin !== location.origin && !/^https:\/\/fonts\.gstatic\.com\//.test(req.url)) {
    return;
  }

  // Skip analytics + Google Apps Script (form endpoint)
  if (/googletagmanager|google-analytics|script\.google\.com/.test(req.url)) {
    return;
  }

  const isStatic = STATIC_PATTERNS.some((p) => p.test(url.pathname) || p.test(req.url));

  if (isStatic) {
    // Stale-while-revalidate for static assets
    event.respondWith(staleWhileRevalidate(req));
  } else if (req.mode === 'navigate' || req.destination === 'document') {
    // Network-first for HTML — always try fresh, fall back to cache offline
    event.respondWith(networkFirst(req));
  }
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((res) => {
    if (res && res.status === 200 && res.type !== 'opaque') {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw e;
  }
}
