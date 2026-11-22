var CACHE = 'blackghosthisab-v30';
var CORE = ['./index.html', './assets/manifest.webmanifest', './assets/icon-192.png', './assets/icon-512.png', './assets/qrcode.min.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var isNav = e.request.mode === 'navigate' || e.request.url.indexOf('index.html') >= 0;
  if (isNav) {
    /* v24: the app shell is NETWORK-FIRST — the first load after an update
       shows the NEW version (v23's cache-first showed the old one first).
       The cache is only the offline fallback, so offline working is kept. */
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.status === 200 && e.request.url.indexOf(self.location.origin) === 0) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) { return hit || caches.match('../index.html'); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.status === 200 && e.request.url.indexOf(self.location.origin) === 0) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
