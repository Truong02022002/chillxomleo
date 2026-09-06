// Service Worker for xomleo.vn
// Purpose: cache static assets aggressively (1 year) to compensate
// for GitHub Pages 10-minute Cache-Control limit.
// Strategy: stale-while-revalidate for assets, network-first for HTML.

// Doi CACHE_VERSION moi khi bump cache-buster cua CSS/JS: handler 'activate'
// se xoa het cache khong khop prefix, tranh de lai entry cua phien ban cu.
const CACHE_VERSION = 'xomleo-e7c1da6d';
// Truoc day co them STATIC_CACHE rieng, nhung moi duong DOC deu dung RUNTIME_CACHE
// nen 5 asset precache tai ve xong khong ai doc, sau do bi tai lai lan nua.
// Dung chung mot cache de precache thuc su co tac dung.
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
  '/css/site.css?h3678899a',
  '/js/main.min.js?h2f3e3043',
  '/uploads/1775619688243-610230636-img2.webp',
  '/uploads/favicon-32x32.png',
  '/uploads/favicon-16x16.png'
];

const STATIC_PATTERNS = [
  /\/css\//,
  /\/js\//,
  /\/fonts\/.*\.woff2?$/,   // 3 file font self-host, truoc day khong khop pattern nao
  /\/img\/.*\.(webp|jpg|jpeg|png|ico|svg)$/,  // gom 18 trang menu lat gio
  /\/uploads\/.*\.(webp|jpg|jpeg|png|ico|svg|mp4|webm|woff2?)$/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) =>
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

  // Chi xu ly cung origin. Truoc day co whitelist fonts.gstatic.com nhung site da
  // self-host font, va 404.html — file cuoi cung con goi Google Fonts — cung da bo.
  if (url.origin !== location.origin) {
    return;
  }

  // Skip analytics + Google Apps Script (form endpoint)
  if (/googletagmanager|google-analytics|script\.google\.com/.test(req.url)) {
    return;
  }

  const isStatic = STATIC_PATTERNS.some((p) => p.test(url.pathname) || p.test(req.url));

  if (isStatic) {
    // Stale-while-revalidate for static assets
    event.respondWith(staleWhileRevalidate(req, event));
  } else if (req.mode === 'navigate' || req.destination === 'document') {
    // Network-first for HTML — always try fresh, fall back to cache offline
    event.respondWith(networkFirst(req));
  }
});

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((res) => {
    if (res && res.status === 200 && res.type !== 'opaque') {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  }).catch(() => null);

  if (cached) {
    // Giu worker song den khi luot revalidate xong. Khong co waitUntil thi Safari
    // co the huy worker ngay sau khi tra ban cache -> cache khong bao gio duoc lam moi.
    if (event) event.waitUntil(fetchPromise);
    return cached;
  }
  // Khong co ban cache: neu mang hong thi fetchPromise resolve null, ma tra ve
  // undefined/null se bi trinh duyet coi la loi mang. Tra Response 504 cho ro rang.
  const res = await fetchPromise;
  return res || new Response('', { status: 504, statusText: 'Offline' });
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
