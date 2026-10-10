/* OilHub service worker. Версия кэша меняется только здесь. */
const V = 'v18'; // v2.22-S1
const APPS = {
  site:  ['./', './index.html', './assets/css/base.css', './assets/css/site.css', './assets/js/config.js', './assets/js/utils.js', './assets/js/i18n.js', './assets/js/api.js', './assets/js/selector-core.js', './assets/js/pwa.js', './assets/js/site.js', './assets/img/products/p01.webp', './assets/img/products/p02.webp', './assets/img/products/p03.webp', './assets/img/products/p04.webp', './assets/img/products/p05.webp', './assets/img/products/p06.webp', './assets/img/products/p09.webp', './assets/img/products/p10.webp', './assets/img/products/p26.webp', './assets/img/products/p27.webp', './manifest-site.webmanifest'],
  admin: ['./admin.html', './assets/css/base.css', './assets/css/shell.css', './assets/css/admin.css', './assets/css/labels.css', './assets/js/config.js', './assets/js/seed.js', './assets/js/utils.js', './assets/js/i18n.js', './assets/js/api.js', './assets/js/pwa.js', './assets/js/scanner.js', './assets/vendor/html5-qrcode-2.3.8.min.js', './assets/vendor/JsBarcode-3.11.6.min.js', './assets/vendor/qrcode-generator-1.4.4.min.js', './assets/js/labels.js', './assets/js/history.js', './assets/js/shell.js', './assets/js/csv.js', './assets/js/remind.js', './assets/js/inventory.js', './assets/js/shifts.js', './assets/js/admin.js', './data/compat-template.csv', './manifest-admin.webmanifest'],
  staff: ['./staff.html', './assets/css/base.css', './assets/css/shell.css', './assets/css/staff.css', './assets/css/labels.css', './assets/js/config.js', './assets/js/utils.js', './assets/js/i18n.js', './assets/js/api.js', './assets/js/selector-core.js', './assets/js/pwa.js', './assets/js/scanner.js', './assets/vendor/html5-qrcode-2.3.8.min.js', './assets/vendor/JsBarcode-3.11.6.min.js', './assets/vendor/qrcode-generator-1.4.4.min.js', './assets/js/labels.js', './assets/js/history.js', './assets/js/shell.js', './assets/js/remind.js', './assets/js/shifts.js', './assets/js/inventory.js', './assets/js/staff.js', './manifest-staff.webmanifest']
};
const OFFLINE = './offline.html';
const name = k => `oilhub-${k}-${V}`;
const API_CACHE = `oilhub-api-${V}`; // v2.21-C3: только публичные GET (public, slots)

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    for (const k of Object.keys(APPS)) {
      const c = await caches.open(name(k));
      // addAll по одному: отсутствующий файл не должен ломать установку
      await Promise.all(APPS[k].concat(OFFLINE).map(u => c.add(u).catch(() => {})));
    }
  })());
});

self.addEventListener('activate', e => {
  const keep = Object.keys(APPS).map(name).concat(API_CACHE); // v2.21-C3
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('oilhub-') && !keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

function appOf(url) {
  const p = new URL(url).pathname;
  if (p.endsWith('/admin.html') || p.endsWith('admin.css') || p.endsWith('admin.js') || p.includes('manifest-admin')) return 'admin';
  if (p.endsWith('/staff.html') || p.endsWith('staff.css') || p.endsWith('staff.js') || p.includes('manifest-staff')) return 'staff';
  return 'site';
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;                      // POST (запись, продажи) никогда не кэшируем
  const u = new URL(r.url);
  if (u.hostname.endsWith('script.google.com') || u.hostname.endsWith('googleusercontent.com')) { // v2.21-C3
    // API: network-first только для публичных данных (action=public, action=slots) без токена. Всё остальное (staff, admin) — только сеть, в кэш не попадает.
    const q = u.searchParams, pub = u.hostname.endsWith('script.google.com') && (q.get('action') === 'public' || q.get('action') === 'slots') && !q.has('token');
    if (!pub) return;
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const chk = res.clone(), keep = res.clone(); chk.json().then(j => { if (j && !j.error) caches.open(API_CACHE).then(c => c.put(r, keep)); }).catch(() => {}); }
      return res;
    }).catch(async () => (await (await caches.open(API_CACHE)).match(r)) || Response.error()));
    return;
  }
  if (u.origin !== location.origin) return;
  const cn = name(appOf(r.url));
  if (r.mode === 'navigate') {                          // страницы: сеть, затем кэш, затем offline.html
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(cn).then(c => c.put(r, cp)); return res; })
      .catch(async () => (await caches.match(r)) || (await caches.match(OFFLINE))));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {   // статика: кэш, затем сеть
    if (res.ok) { const cp = res.clone(); caches.open(cn).then(c => c.put(r, cp)); }
    return res;
  })));
});
