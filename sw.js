// オフライン動作用 Service Worker。index.html はネットワーク優先（更新を拾う）、
// ハッシュ付き資産とフォントはキャッシュ優先。
const VERSION = 'v1';
const CACHE = 'invoice-local-' + VERSION;
const PRECACHE = ['./', './index.html', './manifest.webmanifest', './NotoSansJP-Regular.otf'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isHtml = req.mode === 'navigate' || req.url.endsWith('/') || req.url.endsWith('index.html');
  if (isHtml) {
    e.respondWith(fetch(req).then(res => { caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
    return res;
  })));
});
