/* preview.js — превью продукта внутри воронки.

   ЗАЧЕМ. Главная проблема из аудита: продукт невидим до оплаты. В воронке не
   было ни одного его элемента, и узнать, что покупаешь приложение, а не
   текст, было негде. Здесь человек трогает три раздела на СВОИХ данных до
   того, как увидит цену.

   ОТКУДА ЦИФРЫ. Не из упрощённых копий расчётов, написанных для воронки, а
   из того же кода, которым считает продукт: engine.js, moon.js, retro.js и
   эфемериды astronomy-engine грузятся отсюда лениво. Поэтому цифра в превью
   и цифра после оплаты не могут разойтись — это буквально один расчёт.
   Собственных упрощённых версий тех же величин в воронке нет и не будет:
   второй источник правды гарантированно разъезжается с первым.

   ПОЧЕМУ ЛЕНИВО. Ядро весит около 70 КБ в gzip. Для верха воронки это
   дорого: первые экраны открывают люди, которые ещё ничего не решили.
   Загрузка стартует на четвёртом экране, когда человек уже ввёл дату, время
   и место, — к пятому она обычно закончена, а если нет, экран показывает
   сводку и ждёт, ничего не блокируя.

   ЕСЛИ НЕ ЗАГРУЗИЛОСЬ. Превью просто не появляется. Воронка работает как
   раньше: ни один шаг от этого модуля не зависит. */
(function (g) {
  'use strict';

  /* Пути до продукта разные в репозитории и в собранном сайте: build.py
     кладёт воронку в корень, а продукт в /product/. При открытии файла
     двойным кликом из репозитория продукт лежит на уровень выше. Пробуем
     оба варианта: первый же успешно загруженный скрипт фиксирует базу. */
  var BASES = ['product/', '../product/'];
  var FILES = [
    'vendor/astronomy.browser.min.js',
    'js/engine.js',
    'js/moon.js',
    'js/retro.js'
  ];

  var state = 'idle';          /* idle | loading | ready | failed */
  var waiting = [];

  function addScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;          /* порядок важен: engine ждёт Astronomy */
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error(src)); };
      document.head.appendChild(s);
    });
  }

  function loadFrom(base) {
    return FILES.reduce(function (chain, f) {
      return chain.then(function () { return addScript(base + f); });
    }, Promise.resolve());
  }

  function ensure(cb) {
    if (state === 'ready') { cb(true); return; }
    if (state === 'failed') { cb(false); return; }
    if (cb) { waiting.push(cb); }
    if (state === 'loading') { return; }
    state = 'loading';

    var done = function (ok) {
      state = ok ? 'ready' : 'failed';
      var list = waiting; waiting = [];
      list.forEach(function (fn) { fn(ok); });
    };

    if (typeof Promise === 'undefined') { done(false); return; }
    loadFrom(BASES[0])
      .catch(function () { return loadFrom(BASES[1]); })
      .then(function () { done(!!(g.Engine && g.Moon && g.Retro && g.Astronomy)); })
      .catch(function () {
        console.warn('astromap: расчётное ядро продукта не загрузилось — превью не показываем');
        done(false);
      });
  }

  /* --- сборка данных превью ------------------------------------------------
     Ничего не форматирует и не переводит: отдаёт величины, а строки собирает
     экран. Так же устроены модули продукта — иначе десять языков пришлось бы
     тащить сюда. */
  function compute(utcDate, lat, lon, timeKnown, now) {
    var E = g.Engine, M = g.Moon, R = g.Retro;
    if (!E || !M || !R) { return null; }
    now = now || new Date();

    var natal = E.chart(utcDate, lat, lon, { timeKnown: timeKnown });
    var transits = E.activeTransits(natal, now);
    var moon = M.infoFor(now);
    var nextQuarter = M.quartersFrom(now, 1)[0] || null;
    var signChange = M.nextSignChange(now);
    var retro = R.statusAt(now).filter(function (x) { return x.retro; });

    /* Дом транзитной Луны считается только при известном времени рождения:
       без асцендента домов нет, и подставить их нечем. */
    var moonHouse = natal.asc ? E.houseOfSign(natal, moon.sign.index) : null;

    return {
      natal: natal,
      aspects: E.chartAspects(natal),
      transits: transits,
      moon: moon,
      moonHouse: moonHouse,
      nextQuarter: nextQuarter,
      signChange: signChange,
      retro: retro
    };
  }

  g.FunnelPreview = { ensure: ensure, compute: compute, isReady: function () { return state === 'ready'; } };
})(typeof window !== 'undefined' ? window : globalThis);
