/* reading.js — страница разбора, которую человек видит после оплаты.
   Ничего не отправляет на сервер: карта пересобирается в браузере из тех же
   данных, что человек ввёл в воронке (localStorage, ключ astromap.funnel).

   ДОСТУП. Проверки оплаты здесь нет — статике нечем её проверить. Пока это
   осознанный компромисс: адрес не угадать. Когда пойдут деньги, ставим webhook,
   он выдаёт токен, и страница пускает только с токеном. См. README.
*/
(function () {
  'use strict';

  var A = window.Astro;
  var C = window.COPY;
  var R = window.READING;
  var U = R.ui;

  var el = function (id) { return document.getElementById(id); };

  function deg(x) {
    var t = x.toFixed(1);
    return (window.LANG === 'pl' ? t.replace('.', ',') : t) + '\u00B0';
  }

  /* --- состояние из воронки ---------------------------------------------- */
  var S = null;
  try {
    var raw = localStorage.getItem('astromap.funnel');
    if (raw) { S = JSON.parse(raw); }
  } catch (e) { S = null; }

  function showEmpty() {
    el('emptyTitle').textContent = U.title;
    el('emptyText').textContent = U.empty;
    el('emptyBack').textContent = U.back;
    el('empty').classList.remove('hidden');
  }

  if (!S || !S.dob || !S.dob.y) { showEmpty(); return; }

  /* --- пересборка карты ---------------------------------------------------
     Город — сохранённый объект с координатами. Списков городов на языке
     интерфейса больше нет вовсе (см. js/cities.js): раньше здесь брался
     индекс в списке ТЕКУЩЕГО языка, хотя выбирали из списка ТОГО, на котором
     человек проходил воронку, и одного переключения EN/PL хватало, чтобы
     разбор пересчитался на другой город в другом поясе.

     Анкеты, сохранённые до этого перехода, приходят без объекта. Считать их
     по выдуманному городу нельзя — показываем пустой экран с просьбой
     заполнить заново, это честнее чужой карты. */
  var city = (S.city && typeof S.city.tz !== 'undefined') ? S.city : null;
  if (!city) { showEmpty(); return; }
  var time = S.time || { known: false, h: null, min: null };
  var natal = A.chart({
    y: S.dob.y, m: S.dob.m, d: S.dob.d,
    h: time.known ? time.h : 12,
    min: time.known ? time.min : 0,
    timeKnown: !!time.known
  }, city);

  el('report').classList.remove('hidden');
  el('rTitle').textContent = U.title;

  var dateStr = S.dob.d + '.' + (S.dob.m < 10 ? '0' : '') + S.dob.m + '.' + S.dob.y
    + (time.known
        ? ', ' + (time.h < 10 ? '0' : '') + time.h + ':' + (time.min < 10 ? '0' : '') + time.min
        : '');
  el('rMeta').textContent = U.forWhom
    .replace('{date}', dateStr)
    .replace('{city}', city.n);

  /* --- 1. три позиции ----------------------------------------------------- */
  el('hPositions').textContent = U.secPositions;

  function posCard(label, sign, text) {
    var d = document.createElement('div');
    d.className = 'pos';
    d.innerHTML = '<div class="pos__k"></div><div class="pos__v"></div><p class="pos__t"></p>';
    d.querySelector('.pos__k').textContent = label;
    d.querySelector('.pos__v').innerHTML = C.signs[sign.index] +
      ' <span>' + deg(sign.degree) + '</span>';
    d.querySelector('.pos__t').textContent = text;
    return d;
  }

  var pos = el('positions');
  pos.appendChild(posCard(U.sun, natal.sun, R.sun[natal.sun.index]));
  pos.appendChild(posCard(U.moon, natal.moon, R.moon[natal.moon.index]));
  if (natal.asc) {
    pos.appendChild(posCard(U.asc, natal.asc, R.asc[natal.asc.index]));
  } else {
    var no = document.createElement('p');
    no.className = 'rd__note';
    no.textContent = U.noAsc;
    pos.appendChild(no);
  }

  /* --- 2. выбранные разделы ----------------------------------------------
     Текст подбирается по стихии Солнца: четыре варианта на каждый раздел. */
  el('hThemes').textContent = U.secThemes;
  var themes = (S.themes && S.themes.length) ? S.themes : ['love', 'self'];
  var elemKey = natal.sun.element;
  var thBox = el('themes');
  themes.forEach(function (k) {
    var t = R.themes[k];
    if (!t) { return; }
    var d = document.createElement('div');
    d.className = 'th';
    d.innerHTML = '<div class="th__t"></div><p class="th__b"></p>';
    d.querySelector('.th__t').textContent = t.t;
    d.querySelector('.th__b').textContent = t[elemKey];
    thBox.appendChild(d);
  });

  /* --- 3. неделя ---------------------------------------------------------
     Считается на текущую дату, поэтому раздел действительно другой
     каждую неделю — это то, за что человек платит подписку. */
  el('hWeek').textContent = U.secWeek;

  var now = new Date();
  var dow = (now.getDay() + 6) % 7;                 // 0 = понедельник
  var mon = new Date(now.getTime() - dow * 86400000);
  var sun = new Date(mon.getTime() + 6 * 86400000);
  function fmt(d) {
    return d.getDate() + '.' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
  }
  el('weekRange').textContent = U.weekRange
    .replace('{from}', fmt(mon)).replace('{to}', fmt(sun));

  var tr = A.weekTransits(natal, now);
  var wk = el('week');

  function wkBlock(label, text) {
    var d = document.createElement('div');
    d.className = 'wk';
    d.innerHTML = '<div class="wk__k"></div><p class="wk__t"></p>';
    d.querySelector('.wk__k').textContent = label;
    d.querySelector('.wk__t').textContent = text;
    return d;
  }

  wk.appendChild(wkBlock(U.weekMoon, R.transitMoon[tr.moonSign.index]));
  wk.appendChild(wkBlock(U.weekSun,
    R.transitAspect[tr.sunToNatalSun.aspect] || R.transitAspect.quincunx));
  el('weekNote').textContent = U.recalc;

  /* --- 4. пара ------------------------------------------------------------ */
  el('hPair').textContent = U.secPair;
  var pr = el('pair');

  if (S.partner && S.partner.y) {
    /* Луна партнёра считается на полдень, и часовой пояс тут нужен только
       как грубая поправка. city.tz бывает строкой IANA — арифметика с ней
       дала бы NaN и уронила бы весь раздел, поэтому берём её только когда
       это число (ручной ввод города). */
    var pTz = (typeof city.tz === 'number') ? city.tz : 0;
    var p = A.chartDateOnly(S.partner, pTz);
    var syn = A.synastry(natal.sunLon, natal.moonLon, p.sunLon, p.moonLon);
    var band = C.s4.bands[0];
    C.s4.bands.forEach(function (b) { if (syn.score >= b.min) { band = b; } });

    var row = document.createElement('div');
    row.className = 'pr';
    row.innerHTML = '<div class="pr__n"></div><div class="pr__c">' +
      '<div class="pr__k"></div><div class="pr__t"></div></div>';
    row.querySelector('.pr__n').textContent = syn.score + '%';
    row.querySelector('.pr__k').textContent = U.pairScore;
    row.querySelector('.pr__t').textContent = band.t;
    pr.appendChild(row);

    var d1 = document.createElement('p');
    d1.className = 'pr__d';
    d1.textContent = band.d;
    pr.appendChild(d1);

    /* Отдельный лейбл обязателен: сильнейший аспект — один фактор из четырёх,
       и без подписи он читается как противоречие общему проценту. */
    var strongest = syn.strongest && syn.strongest.d ? syn.strongest.d.aspect : null;
    if (strongest && R.pairAspect[strongest]) {
      var w = document.createElement('div');
      w.className = 'wk';
      w.innerHTML = '<div class="wk__k"></div><p class="wk__t"></p>';
      w.querySelector('.wk__k').textContent = U.pairStrongest;
      w.querySelector('.wk__t').textContent = R.pairAspect[strongest];
      pr.appendChild(w);
    }

    var f = document.createElement('p');
    f.className = 'pr__foot';
    f.textContent = U.pairFoot;
    pr.appendChild(f);
  } else {
    var n2 = document.createElement('p');
    n2.className = 'rd__note';
    n2.textContent = U.noPair;
    pr.appendChild(n2);
  }

  /* Меню языков — то же, что в воронке: десять названий списком. */
  (function bindLang() {
    var toggle = el('langToggle'), menu = el('langMenu');
    if (!toggle || !menu) { return; }
    toggle.textContent = window.LANG.toUpperCase();
    function close() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    Array.prototype.slice.call(menu.querySelectorAll('.langmenu__item')).forEach(function (b) {
      var code = b.getAttribute('data-lang');
      b.classList.toggle('on', code === window.LANG);
      b.setAttribute('aria-selected', code === window.LANG ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (code === window.LANG) { close(); return; }
        try { localStorage.setItem('astromap.lang', code); } catch (e) {}
        location.reload();
      });
    });
    document.addEventListener('click', function (ev) {
      if (!menu.hidden && !menu.contains(ev.target) && ev.target !== toggle) { close(); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !menu.hidden) { close(); toggle.focus(); }
    });
  })();

  el('disc').textContent = U.disclaimer;
})();
