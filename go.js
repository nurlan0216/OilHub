/* OilHub: старый адрес nurlan0216.github.io/OilHub/ переехал на https://oilhub.kz (этап 44B).
   Страница перенаправляет на новый адрес. Если на этом устройстве остались неотправленные офлайн-продажи старой кассы,
   автоперехода нет: сначала предупреждение (данные браузера не удаляются никогда). Внешних скриптов нет. */
(function (root) {
  'use strict';
  var NEW = 'https://oilhub.kz';

  /** Куда вести: старые staff.html и admin.html на /staff и /admin, всё остальное на главную; ?запрос и #якорь сохраняются. */
  function target(path, search, hash) {
    var f = String(path || '/').replace(/\/+$/, '').split('/').pop().toLowerCase();
    var to = '/';
    if (f === 'staff.html' || f === 'staff') to = '/staff';
    else if (f === 'admin.html' || f === 'admin') to = '/admin';
    return NEW + to + String(search || '') + String(hash || '');
  }

  /** Число неотправленных продаж в очереди кассы (ключи oh_staff_queue*). Нечитаемое хранилище или мусор дают 0. */
  function pending(storage) {
    var n = 0;
    try {
      for (var i = 0; i < storage.length; i++) {
        var k = storage.key(i);
        if (k && k.indexOf('oh_staff_queue') === 0) {
          var v = JSON.parse(storage.getItem(k));
          if (Array.isArray(v)) n += v.length;
          else if (v && typeof v === 'object') n += Object.keys(v).length;
        }
      }
    } catch (e) { return 0; }
    return n;
  }

  /** Убрать старый service worker и кэши (не трогает localStorage). */
  function cleanup(win) {
    try {
      if (win.navigator && win.navigator.serviceWorker && win.navigator.serviceWorker.getRegistrations) {
        win.navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); });
      }
      if (win.caches && win.caches.keys) {
        win.caches.keys().then(function (ks) { ks.forEach(function (k) { win.caches.delete(k); }); });
      }
    } catch (e) { /* не страшно */ }
  }

  function run(win) {
    var loc = win.location;
    var to = target(loc.pathname, loc.search, loc.hash);
    var link = win.document.getElementById('go');
    if (link) link.setAttribute('href', to);
    cleanup(win);
    var n = 0;
    try { n = pending(win.localStorage); } catch (e) { n = 0; }
    if (n > 0) {
      var w = win.document.getElementById('warn');
      if (w) {
        w.hidden = false;
        var c = win.document.getElementById('cnt');
        if (c) c.textContent = String(n);
      }
      return { to: to, pending: n, redirected: false };
    }
    loc.replace(to);
    return { to: to, pending: 0, redirected: true };
  }

  var api = { target: target, pending: pending, run: run, NEW: NEW };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.OHGO = api; if (root.document) run(root); }
})(typeof window !== 'undefined' ? window : this);
