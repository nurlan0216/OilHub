# Локальные библиотеки с фиксированной версией. CDN не используется; файлы лежат в проекте и входят в офлайн-кэш (sw.js).
# Версию не менять «на месте»: новая версия = новый файл с новой цифрой в имени, правка путей в admin.html, staff.html, sw.js, scanner.js и подъём V в sw.js.

html5-qrcode-2.3.8.min.js
  Название:  html5-qrcode
  Версия:    2.3.8
  Лицензия:  Apache-2.0
  Источник:  https://github.com/mebjas/html5-qrcode
  Для чего:  сканер камеры (EAN-13, EAN-8, UPC, Code128, Code39, QR). Грузится по требованию из assets/js/scanner.js. Файл scanner.js не менять.

JsBarcode-3.11.6.min.js
  Название:  JsBarcode
  Версия:    3.11.6 (npm: jsbarcode@3.11.6, файл dist/JsBarcode.all.min.js, без правок)
  Лицензия:  MIT, (c) Johan Lindell
  Источник:  https://github.com/lindell/JsBarcode
  Для чего:  штрихкоды Code128 и EAN-13 для этикеток (этап G3). Вызывается только из assets/js/labels.js, глобальная функция JsBarcode.

qrcode-generator-1.4.4.min.js
  Название:  qrcode-generator
  Версия:    1.4.4 (npm: qrcode-generator@1.4.4, файл qrcode.js)
  Лицензия:  MIT, (c) 2009 Kazuhiko Arase
  Источник:  https://github.com/kazuhikoarase/qrcode-generator
  Для чего:  QR-коды для этикеток (этап G3). Вызывается только из assets/js/labels.js, глобальная функция qrcode.
  Примечание: в npm-пакете нет готового .min.js, поэтому qrcode.js сжат terser 5 (-c -m) без изменения логики; сверху добавлена строка с названием, версией и лицензией.

# Как обновить: скачать нужную версию через npm в отдельную временную папку (npm i jsbarcode@X qrcode-generator@Y), скопировать в проект только .min.js, обновить этот файл.
