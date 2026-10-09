/* selector-core.js: общая логика подбора масла (сайт и касса). Без DOM и без запросов к сети.
   Подключается после utils.js и i18n.js (norm, appr, isOn, t берутся оттуда: это глобальные const, не свойства window). Глобальный объект OilSel.
   Правило сопоставления: допуски товара содержат ВСЕ требуемые допуски автомобиля,
   вязкость (SAE) совпадает. Если точных вариантов нет, показываются частичные (совпала часть допусков
   и вязкость), и на каждой такой карточке стоит подпись «уточните у специалиста» (selector.askExpert).
   Данные об автомобилях не зашиты: источник только лист Compat. Пустой Compat не вызывает ошибок.
   A4: топливо хранится кодом (petrol|diesel|hybrid|lpg), на экране показывается через t('compat.fuel.*'). */
(function (g) {
  'use strict';
  var FUELS = ['petrol', 'diesel', 'hybrid', 'lpg'];
  var SPEC_GROUPS = ['ACEA', 'API', 'ILSAC'];
  var tr = function (k, p) { return typeof t === 'function' ? t(k, p) : k; };
  var yNow = function () { return new Date().getFullYear(); };
  var uniq = function (a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); };

  /* Допуски товара содержат требуемый допуск (без учёта регистра, пробелов, дефисов) */
  function has(p, req) {
    var r = norm(req);
    return appr(p).some(function (a) { return norm(a) === r; });
  }

  /* products: массив товаров (берутся только активные). reqs: массив допусков. sae: вязкость или ''. */
  function match(products, reqs, sae) {
    reqs = reqs || [];
    var out = (products || []).filter(function (p) { return !p.hasOwnProperty('active') || isOn(p.active); }).map(function (p) {
      var okS = !sae || norm(p.sae) === norm(sae);
      var m = reqs.filter(function (r) { return has(p, r); });
      return { p: p, m: m, okS: okS, exact: okS && reqs.length > 0 && m.length === reqs.length };
    });
    var ex = out.filter(function (x) { return x.exact; });
    if (ex.length) return { exact: true, list: ex };
    var part = out.filter(function (x) { return x.m.length > 0 && x.okS; }).sort(function (a, b) { return b.m.length - a.m.length; });
    return { exact: false, list: part };
  }

  /* только вязкость, без допусков (вкладка «по допуску» с одним SAE) */
  function bySae(products, sae) {
    return { exact: true, list: (products || []).filter(function (p) { return norm(p.sae) === norm(sae); }).map(function (p) { return { p: p, m: [], okS: true, exact: true }; }) };
  }

  function fuelLabel(f) { return FUELS.indexOf(f) >= 0 ? tr('compat.fuel.' + f) : f; }
  /* ключ двигателя «двигатель · код топлива» остаётся значением списка; переводится только подпись */
  function engKey(c) { return c.engine + (c.fuel ? ' · ' + c.fuel : ''); }
  function engLabel(k) { var m = /^(.*) · ([^·]+)$/.exec(k); return m ? m[1] + ' · ' + fuelLabel(m[2]) : k; }

  var inYear = function (c, y) { return !y || ((+c.year_from || 0) <= +y && (+c.year_to || 9999) >= +y); };

  function brands(C) { return uniq((C || []).map(function (c) { return c.brand; }).filter(Boolean)).sort(); }
  function models(C, b) { return uniq((C || []).filter(function (c) { return c.brand === b; }).map(function (c) { return c.model; }).filter(Boolean)).sort(); }
  function rowsOf(C, b, m) { return (C || []).filter(function (c) { return c.brand === b && c.model === m; }); }
  function years(C, b, m) {
    var ys = [];
    rowsOf(C, b, m).forEach(function (c) {
      for (var y = +c.year_from || 0; y <= (+c.year_to || yNow()); y++) if (y > 1980 && ys.indexOf(y) < 0) ys.push(y);
    });
    return ys.sort(function (a, b2) { return b2 - a; });
  }
  function engines(C, b, m, y) { return uniq(rowsOf(C, b, m).filter(function (c) { return inYear(c, y); }).map(engKey)); }
  function findCar(C, b, m, y, e) { return rowsOf(C, b, m).filter(function (c) { return engKey(c) === e && inYear(c, y); })[0] || null; }
  function reqsOf(c) { return String(c && c.spec_required || '').split(';').map(function (x) { return x.trim(); }).filter(Boolean); }
  function carText(s) { return [s.b, s.m, s.y, engLabel(s.e)].join(' '); }

  /* Состояние каскада марка → модель → год → двигатель.
     state: empty (Compat пуст) | pick (выбор не закончен) | nocar (нет данных или нет допусков) | ok */
  function resolve(C, s, products) {
    if (!C || !C.length) return { state: 'empty' };
    if (!(s.b && s.m && s.y && s.e)) return { state: s.b && s.m && !rowsOf(C, s.b, s.m).length ? 'nocar' : 'pick' };
    var car = findCar(C, s.b, s.m, s.y, s.e), reqs = reqsOf(car);
    if (!car || !reqs.length) return { state: 'nocar' };
    return { state: 'ok', car: car, reqs: reqs, sae: car.sae || '', result: match(products, reqs, car.sae), text: carText(s) };
  }

  /* группы допусков для вкладки «по допуску» и список вязкостей */
  function specGroups(products) {
    var all = uniq((products || []).reduce(function (a, p) { return a.concat(appr(p)); }, [])), grp = {};
    all.forEach(function (a) { var k = a.split(' ')[0]; (grp[k] = grp[k] || []).push(a); });
    var saes = uniq((products || []).map(function (p) { return p.sae; }).filter(function (x) { return /\d+W/i.test(x); }));
    var oem = Object.keys(grp).filter(function (k) { return SPEC_GROUPS.indexOf(k) < 0; }).reduce(function (a, k) { return a.concat(grp[k]); }, []);
    return { grp: grp, saes: saes, oem: oem, std: SPEC_GROUPS.filter(function (k) { return grp[k]; }) };
  }

  g.OilSel = { FUELS: FUELS, has: has, match: match, bySae: bySae, fuelLabel: fuelLabel, engKey: engKey, engLabel: engLabel,
    brands: brands, models: models, years: years, engines: engines, findCar: findCar, reqsOf: reqsOf, carText: carText,
    resolve: resolve, specGroups: specGroups };
})(typeof window !== 'undefined' ? window : globalThis);
