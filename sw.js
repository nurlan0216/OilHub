/* OilHub: заменяет старый service worker (этап 44B). Чистит кэши и снимает себя; сеть не перехватывает.
   Файл должен лежать в корне репозитория OilHub под тем же именем, что у старого service worker (обычно sw.js). */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    try { var ks = await caches.keys(); for (var i = 0; i < ks.length; i++) await caches.delete(ks[i]); } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
  })());
});
