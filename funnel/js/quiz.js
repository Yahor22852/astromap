/* quiz.js — квиз v2: вариант 'q2' эксперимента против прежней воронки.

   ЧТО ЭТО. Тот же продукт, тот же расчёт, те же цены и та же оплата, но
   другой онбординг: короткие выборы вместо формы, две честные награды по
   дороге (Солнце после даты, основа карты после места), превью продукта на
   данных человека и экран о том, зачем подписка после первого чтения.
   Прежняя воронка (flow.js, экраны s1–s7) остаётся вариантом 'a'.

   ПРАВИЛО ДЛЯ КАЖДОГО ВОПРОСА: ответ меняет маршрут, содержание превью или
   то, что продукт покажет первым. Кому ответ не нужен — того вопроса нет.
   Где какой ответ используется, записано в STEPS ниже, у каждого шага.

   ЧЕСТНОСТЬ. Цель человека — не вывод из карты: на экранах так и сказано.
   Без времени рождения нет асцендента и домов; если Луна (или Солнце) в
   тот день сменила знак, показываются оба знака, а не уверенный полдень.
   Без точного места нет асцендента. Индекс пары — метод, а не прогноз, и
   не используется для давления.

   Общая часть (оплата, TikTok, строка согласия, шаги) — из flow.js через
   window.AstroFlow. Тексты — js/quiz-copy.js и js/lang/<код>-quiz.js;
   знаки, стихии, планеты и биллинг — из COPY, как у прежней воронки. */
(function () {
  'use strict';

  var F = window.AstroFlow;
  if (!F || !F.v2) { return; }

  var C = window.COPY;
  var EN_C = window.COPY_ALL.en;
  var A = window.Astro;
  var FC = window.FunnelCities;
  var W = window.FunnelWheel;
  var PV = window.FunnelPreview;
  var LANG = window.LANG;
  var Q = merge(window.QUIZ_ALL.en, window.QUIZ || {});

  var el = function (id) { return document.getElementById(id); };
  var all = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
  /* Подстановка {ключей}. Значения экранируются: часть приходит из данных
     (название места, введённое человеком). */
  function fmt(t, map) {
    return esc(t).replace(/\{(\w+)\}/g, function (m, k) {
      return map && map[k] != null ? map[k] : m;
    });
  }
  /* Строка языкового файла, которой нет, берётся из английского, а не
     показывается как undefined. */
  function merge(base, over) {
    if (Array.isArray(base)) { return Array.isArray(over) && over.length === base.length ? over : base; }
    if (!base || typeof base !== 'object') { return over != null ? over : base; }
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = merge(base[k], over ? over[k] : undefined); });
    return out;
  }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOCALE = ({ en: 'en-GB', pl: 'pl-PL', ru: 'ru-RU', uk: 'uk-UA', de: 'de-DE', es: 'es-ES',
                  fr: 'fr-FR', it: 'it-IT', pt: 'pt-BR', tr: 'tr-TR' })[LANG] || 'en-GB';
  var THEMES = ['love', 'money', 'calm', 'self'];

  /* --- контексты целей ----------------------------------------------------
     lead — какая из трёх точек показана первой на экране «Основа карты»
     (с подписью, что это из-за ответа, а не из карты); tab — вкладка превью
     по умолчанию, если человек не выбрал стартовый раздел; act — какой
     раздел продукта предложен первым шагом на экране «Небо меняется»;
     pair — ответ открывает ветку с датой второго человека. */
  var CTX = {
    love:  { needs: { lead: 'moon', tab: 'chart', act: 'chart' },
             connection: { lead: 'sun', tab: 'today', act: 'match', pair: true },
             differences: { lead: 'moon', tab: 'chart', act: 'match' } },
    money: { strengths: { lead: 'sun', tab: 'chart', act: 'chart' },
             period: { lead: 'sun', tab: 'today', act: 'today' },
             overview: { lead: 'sun', tab: 'chart', act: 'chart' } },
    calm:  { cycles: { lead: 'moon', tab: 'today', act: 'moon' },
             skynow: { lead: 'moon', tab: 'today', act: 'today' },
             needs: { lead: 'moon', tab: 'chart', act: 'chart' } },
    self:  { reaction: { lead: 'moon', tab: 'chart', act: 'chart' },
             needs: { lead: 'moon', tab: 'chart', act: 'chart' },
             overview: { lead: 'sun', tab: 'chart', act: 'chart' } }
  };
  var CTX_UNSURE = { lead: 'sun', tab: 'today', act: 'today' };
  function ctxInfo() {
    var g = CTX[st.goal] || {};
    return g[st.ctx] || CTX_UNSURE;
  }
  /* Стартовый раздел → вкладка превью. «Ближайшие даты» в превью — это
     смена знака Луной во вкладке «Сегодня»; в продукте — лента «Что
     впереди» на том же экране (product/js/app.js, startView). */
  var START_TAB = { chart: 'chart', sky: 'today', dates: 'today' };
  /* Разделы продукта на пейволле (индексы в COPY.pw.opens): 0 карта,
     1 небо против карты, 2 Луна, 3 ретрограды, 4 совместимость, 5 лента. */
  var GOAL_OPENS = { love: [0, 4, 1], money: [1, 5, 0], calm: [2, 1, 5], self: [0, 1, 2] };

  /* --- состояние ----------------------------------------------------------
     Хранится в том же astromap.funnel, что и у прежней воронки, и в той же
     форме: dob, themes, time, city, partner — их читают продукт (импорт
     после оплаты), reading.html и передача из TikTok. Новые поля добавлены
     рядом и прежним читателям не мешают. */
  var st = {
    v: 'q2', goal: null, ctx: null, extra: [], extraDone: false, start: null,
    dob: { d: null, m: null, y: null }, dobOk: false,
    tk: null, time: { h: null, min: null, known: false },
    city: null, pWant: null, partner: { d: null, m: null, y: null }, partnerOk: false
  };
  (function load() {
    try {
      var p = JSON.parse(localStorage.getItem('astromap.funnel') || 'null');
      if (!p) { return; }
      if (p.dob && F.dateValid(p.dob)) { st.dob = p.dob; st.dobOk = true; }
      if (p.v !== 'q2') { return; }   /* ответы прежней воронки — только дата */
      ['goal', 'ctx', 'start', 'tk', 'pWant'].forEach(function (k) { if (p[k] != null) { st[k] = p[k]; } });
      if (Array.isArray(p.extra)) { st.extra = p.extra; st.extraDone = !!p.extraDone; }
      if (p.time && st.tk === 'yes' && p.time.h != null) { st.time = p.time; }
      if (p.city && p.city.tz != null) { st.city = p.city; }
      if (p.partner && F.dateValid(p.partner)) { st.partner = p.partner; st.partnerOk = true; }
    } catch (e) { /* приватный режим — без восстановления */ }
  })();

  function themes() {
    if (!st.goal) { return []; }
    return [st.goal].concat(st.extra.filter(function (k) { return k !== st.goal; }));
  }
  function pairOn() { return !!ctxInfo().pair && st.goal === 'love'; }

  function persist() {
    try {
      var known = st.tk === 'yes' && st.time.h != null;
      localStorage.setItem('astromap.funnel', JSON.stringify({
        v: 'q2',
        dob: st.dobOk ? st.dob : { d: null, m: null, y: null },
        themes: themes(),
        time: { h: known ? st.time.h : null, min: known ? st.time.min : null, known: known },
        city: st.city,
        /* Дата второго человека уходит в продукт, только если ветка открыта
           ответом и дату действительно добавили. */
        partner: (pairOn() && st.pWant === 'yes' && st.partnerOk) ? st.partner : { d: null, m: null, y: null },
        goal: st.goal, ctx: st.ctx, extra: st.extra, extraDone: st.extraDone,
        start: st.start, tk: st.tk, pWant: st.pWant,
        lang: LANG, savedAt: new Date().toISOString()
      }));
    } catch (e) { /* приватный режим */ }
  }

  /* --- расчёт -------------------------------------------------------------
     Те же шаги, что calcChart в flow.js: местное время → UTC по таймзоне
     места на дату рождения → Солнце, Луна, асцендент. Время неизвестно —
     считаем на полдень, но наружу полдень как факт не выдаём: см. ranges. */
  var natalCache = null, natalKey = '';
  function natalKeyNow() {
    return JSON.stringify([st.dob, st.tk, st.time, st.city && [st.city.n, st.city.tz, st.city.lat]]);
  }
  function chartAt(h, min) {
    var c = st.city, d = st.dob;
    var utc = FC.toUTC(d.y, d.m, d.d, h, min, c);
    var dayStart = Date.UTC(d.y, d.m - 1, d.d, 0, 0, 0);
    var jd = A.julianDay(d.y, d.m, d.d, (utc.getTime() - dayStart) / 3600000);
    var out = { utc: utc, jd: jd };
    out.sunLon = A.sunLongitude(jd); out.sun = A.signOf(out.sunLon);
    out.moonLon = A.moonLongitude(jd); out.moon = A.signOf(out.moonLon);
    return out;
  }
  function natal() {
    if (!st.dobOk || !st.city) { return null; }
    var key = natalKeyNow();
    if (natalCache && key === natalKey) { return natalCache; }
    var known = st.tk === 'yes' && st.time.h != null;
    var out = chartAt(known ? st.time.h : 12, known ? st.time.min : 0);
    out.known = known;
    if (known && typeof st.city.lat === 'number' && typeof st.city.lon === 'number') {
      out.ascLon = A.ascendant(out.jd, st.city.lat, st.city.lon).asc;
      out.asc = A.signOf(out.ascLon);
    }
    if (!known) {
      /* Без времени: где были Луна и Солнце в начале и в конце этого дня
         по местному времени. Сменили знак — показываем оба. */
      var a = chartAt(0, 0), b = chartAt(23, 59);
      if (a.moon.index !== b.moon.index) { out.moonRange = [a.moon.index, b.moon.index]; }
      if (a.sun.index !== b.sun.index) { out.sunRange = [a.sun.index, b.sun.index]; }
    }
    natalCache = out; natalKey = key;
    return out;
  }
  /* Любое изменение даты, времени или места стирает всё выведенное из них. */
  function invalidate() { natalCache = null; pvCache = null; pvKey = ''; }

  /* --- превью продукта: ядро расчёта и тексты интерпретаций ------------
     Ядро продукта (preview.js) и библиотека текстов (reading-copy.js —
     та же, что у бесплатного чтения) грузятся лениво, после места рождения:
     первые экраны остаются лёгкими. */
  var readingState = 'idle';
  function loadReading(cb) {
    if (readingState === 'ready') { cb(true); return; }
    var files = ['js/reading-copy.js'];
    if (LANG !== 'en' && LANG !== 'pl') { files.push('js/lang/' + LANG + '-reading.js'); }
    readingState = 'loading';
    (function next(i) {
      if (i >= files.length) { readingState = window.READING ? 'ready' : 'failed'; cb(readingState === 'ready'); return; }
      var s = document.createElement('script');
      s.src = files[i]; s.async = false;
      s.onload = function () { next(i + 1); };
      s.onerror = function () { readingState = 'failed'; cb(false); };
      document.head.appendChild(s);
    })(0);
  }
  var pvCache = null, pvKey = '';
  function pvData() {
    if (!PV || !PV.isReady()) { return null; }
    var n = natal();
    if (!n) { return null; }
    var key = natalKeyNow();
    if (pvCache && pvKey === key) { return pvCache; }
    var lat = typeof st.city.lat === 'number' ? st.city.lat : null;
    var lon = typeof st.city.lon === 'number' ? st.city.lon : null;
    try { pvCache = PV.compute(n.utc, lat, lon, n.known && lat !== null, new Date()); }
    catch (e) { console.warn('astromap: превью не посчиталось', e); pvCache = null; }
    pvKey = key;
    return pvCache;
  }
  var assetsState = 'idle', assetsWaiting = [];
  function ensureAssets(cb, retry) {
    if (assetsState === 'ready') { if (cb) { cb(true); } return; }
    if (cb) { assetsWaiting.push(cb); }
    if (assetsState === 'loading') { return; }
    assetsState = 'loading';
    var left = 2, ok = true;
    var done = function (r) {
      ok = ok && r;
      if (--left) { return; }
      assetsState = ok ? 'ready' : 'failed';
      var list = assetsWaiting; assetsWaiting = [];
      list.forEach(function (fn) { fn(ok); });
    };
    if (retry && readingState === 'failed') { readingState = 'idle'; }
    loadReading(done);
    if (!PV) { done(false); return; }
    (retry && PV.retry ? PV.retry : PV.ensure)(done);
  }

  /* --- шаги ---------------------------------------------------------------
     phase — фаза в шапке (0 фокус, 1 данные рождения, 2 превью, 3 оплата).
     when — шаг на маршруте; пока ответа, который его убирает, нет, шаг
     считается стоящим на маршруте: так прогресс при ветвлении растёт, а не
     откатывается. done — ответ на шаге есть и годится. */
  var ORDER = ['goal', 'ctx', 'dob', 'sun', 'tk', 'time', 'place', 'core',
               'extra', 'start', 'pask', 'pdate', 'preview', 'bridge', 'pay', 'year'];
  var STEPS = {
    goal:    { phase: 0, done: function () { return !!st.goal; } },
    ctx:     { phase: 0, done: function () { return !!st.ctx; } },
    dob:     { phase: 1, done: function () { return st.dobOk; } },
    sun:     { phase: 1, done: function () { return st.dobOk; } },
    tk:      { phase: 1, done: function () { return !!st.tk; } },
    time:    { phase: 1, when: function () { return st.tk !== 'no'; },
               done: function () { return st.tk === 'no' || st.time.h != null; } },
    place:   { phase: 1, done: function () { return !!st.city; } },
    core:    { phase: 1, done: function () { return !!natal(); } },
    extra:   { phase: 2, done: function () { return st.extraDone; } },
    start:   { phase: 2, done: function () { return !!st.start; } },
    pask:    { phase: 2, when: pairOn, done: function () { return !!st.pWant; } },
    pdate:   { phase: 2, when: function () { return pairOn() && st.pWant !== 'no'; },
               done: function () { return st.partnerOk; } },
    preview: { phase: 2, done: function () { return true; } },
    bridge:  { phase: 2, done: function () { return true; } },
    pay:     { phase: 3, done: function () { return true; } },
    year:    { phase: 3, offRoute: true, done: function () { return true; } }
  };
  function route() {
    return ORDER.filter(function (id) {
      var s = STEPS[id];
      return !s.offRoute && (!s.when || s.when());
    });
  }
  function nextOf(id) {
    var r = route(), i = r.indexOf(id);
    return i >= 0 ? r[i + 1] : null;
  }
  function prevOf(id) {
    if (id === 'year') { return 'pay'; }
    var r = route(), i = r.indexOf(id);
    return i > 0 ? r[i - 1] : null;
  }
  /* Куда можно попасть сразу (после перезагрузки или смены языка): на
     запрошенный шаг, если все предыдущие отвечены, иначе на первый
     неотвеченный. */
  function reachable(target) {
    var r = route().concat(target === 'year' ? ['year'] : []);
    for (var i = 0; i < r.length; i++) {
      if (r[i] === target) { return target; }
      if (!STEPS[r[i]].done()) { return r[i]; }
    }
    return 'goal';
  }

  /* --- каркас экранов ------------------------------------------------------ */
  var main = document.querySelector('main');
  var cur = null, lastShow = 0;

  function section(id) {
    var s = el('q-' + id);
    if (!s) {
      s = document.createElement('section');
      s.className = 'scr q';
      s.id = 'q-' + id;
      s.setAttribute('aria-labelledby', 'q-' + id + '-h');
      main.appendChild(s);
    }
    return s;
  }
  function head(id, h1, sub, eyebrow) {
    return (eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + '</p>' : '') +
      '<h1 class="h1" id="q-' + id + '-h" tabindex="-1">' + esc(h1) + '</h1>' +
      (sub ? '<p class="hint">' + esc(sub) + '</p>' : '');
  }

  var cta = el('cta'), ghost = el('ghost'), back = el('qBack');
  /* Строка условий под кнопкой оплаты: сумма с НДС и автопродление видны
     там, где принимается решение, даже если полный текст условий ниже
     сгиба. На остальных шагах её нет. */
  var dockNote = document.createElement('p');
  dockNote.className = 'q-docknote hidden';
  cta.parentNode.insertBefore(dockNote, cta.nextSibling);
  function dock(label, enabled, ghostLabel, note) {
    dockNote.textContent = note || '';
    dockNote.classList.toggle('hidden', !note);
    cta.classList.remove('hidden');
    cta.textContent = label;
    cta.disabled = !enabled;
    ghost.classList.toggle('hidden', !ghostLabel);
    if (ghostLabel) { ghost.textContent = ghostLabel; }
  }

  /* Шапка: назад, фазы, прогресс по реальному маршруту. Прогресс — доля
     пройденных шагов маршрута, а не «готовность расчёта». */
  function header(id) {
    var top = el('top'), bar = el('bar'), pct = el('pct');
    top.classList.remove('hidden');
    var prev = prevOf(id);
    back.classList.toggle('hidden', !prev);
    back.setAttribute('aria-label', Q.back);
    back.textContent = '←';
    var phase = STEPS[id].phase;
    if (phase > 2) { bar.classList.add('hidden'); pct.textContent = ''; return; }
    bar.classList.remove('hidden');
    var r = route().filter(function (x) { return STEPS[x].phase <= 2; });
    var i = r.indexOf(id);
    var overall = Math.round(100 * Math.max(0, i) / Math.max(1, r.length - 1));
    bar.setAttribute('aria-valuenow', overall);
    bar.setAttribute('aria-valuetext', Q.phases[phase] + ', ' + overall + '%');
    bar.innerHTML = [0, 1, 2].map(function (p) {
      var steps = r.filter(function (x) { return STEPS[x].phase === p; });
      var k = steps.indexOf(id);
      var fill = p < phase ? 100 : p > phase ? 0 : Math.round(100 * (k + 1) / steps.length);
      return '<i class="bar__seg q-seg' + (p === phase ? ' is-now' : '') + '"><b style="width:' + fill + '%"></b></i>';
    }).join('');
    pct.textContent = Q.phases[phase];
  }

  /* Показ шага. Шаги трекаются по первому показу во вкладке (track
     дедуплицирует), поэтому возврат назад не прибавляет «дошедших». */
  function show(id, opts) {
    opts = opts || {};
    if (!STEPS[id]) { id = 'goal'; }
    cur = id;
    lastShow = Date.now();
    try { sessionStorage.setItem('astromap.q2.step', id); } catch (e) {}
    var s = section(id);
    RENDER[id](s);
    all('.scr').forEach(function (x) { x.classList.toggle('is-active', x === s); });
    header(id);
    if (!opts.silent) { window.scrollTo(0, 0); }
    /* Фокус на заголовок нового шага: скринридер объявляет, где человек,
       а клавиатура начинает с начала экрана. */
    if (!opts.noFocus) {
      var h = el('q-' + id + '-h');
      if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    }
    /* Пришедший из TikTok в Safari считается, только когда выяснилось, что
       он не продолжает оплату (flow.js, arrivalFromTikTok → trackCurrent). */
    if (!opts.noTrack) { F.track('q2_' + id); }
  }
  function go(id) { show(id); }

  /* --- карточки ----------------------------------------------------------- */
  function cards(name, items, selected, multi) {
    return '<div class="tiles q-cards" role="' + (multi ? 'group' : 'radiogroup') +
      '" aria-labelledby="q-' + name + '-h">' + items.map(function (it) {
      var on = multi ? selected.indexOf(it.k) >= 0 : selected === it.k;
      return '<button type="button" class="tile" role="' + (multi ? 'checkbox' : 'radio') +
        '" aria-checked="' + on + '" data-k="' + esc(it.k) + '"' +
        (!multi ? ' tabindex="' + (on || (!selected && it === items[0]) ? '0' : '-1') + '"' : '') + '>' +
        '<span class="tile__t">' + esc(it.t) + '</span>' +
        (it.d ? '<span class="tile__d">' + esc(it.d) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function bindCards(root, onPick) {
    all('.q-cards .tile', root).forEach(function (b) {
      b.addEventListener('click', function () { onPick(b.getAttribute('data-k'), b); });
    });
  }

  /* --- барабан ------------------------------------------------------------
     Колонка с прокруткой и привязкой к строке (scroll-snap). Значение
     фиксируется, когда прокрутка остановилась, а не на каждом кадре —
     расчёты не дёргаются десятки раз в секунду. Положение по умолчанию —
     не ответ: колонка «не тронута», пока её не прокрутили, не нажали
     строку или не тронули стрелками. Для клавиатуры и скринридера это
     spinbutton: стрелки, PageUp/PageDown, Home/End. */
  var ROW = 44;
  function Wheel(opts) {
    var w = { value: opts.value, touched: opts.value != null, items: [] };
    var root = document.createElement('div');
    root.className = 'wheel' + (w.touched ? '' : ' wheel--unset');
    root.innerHTML = '<div class="wheel__lab">' + esc(opts.label) + '</div>' +
      '<div class="wheel__win" tabindex="0" role="spinbutton" aria-label="' + esc(opts.label) + '">' +
      '<div class="wheel__list"></div><i class="wheel__mark" aria-hidden="true"></i></div>';
    var win = root.querySelector('.wheel__win'), list = root.querySelector('.wheel__list');
    var timer = null, user = false;
    /* Значение фиксирует только жест человека: прокрутка кодом (начальное
       положение, прыжок к десятилетию) ответом не считается. */
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (t) {
      list.addEventListener(t, function () { user = true; }, { passive: true });
    });

    function idxOf(v) {
      for (var i = 0; i < w.items.length; i++) { if (w.items[i].v === v) { return i; } }
      return -1;
    }
    function aria() {
      var i = idxOf(w.value);
      if (w.touched && i >= 0) {
        win.setAttribute('aria-valuenow', String(w.value));
        win.setAttribute('aria-valuetext', w.items[i].t);
      } else {
        win.removeAttribute('aria-valuenow');
        win.setAttribute('aria-valuetext', '—');
      }
      all('.wheel__it', list).forEach(function (n, k) { n.classList.toggle('on', k === i); });
    }
    /* Колонка строится до вставки в страницу и на скрытом ещё экране —
       там прокрутка не применяется, поэтому положение ставится в
       следующем кадре, когда экран уже показан. */
    function scrollTo(i, smooth) {
      var apply = function () { list.scrollTo({ top: i * ROW, behavior: smooth && !reduced ? 'smooth' : 'auto' }); };
      if (smooth && list.isConnected && list.offsetParent) { apply(); }
      else { requestAnimationFrame(apply); }
    }
    function nearestEnabled(i) {
      for (var d = 0; d < w.items.length; d++) {
        if (w.items[i - d] && !w.items[i - d].off) { return i - d; }
        if (w.items[i + d] && !w.items[i + d].off) { return i + d; }
      }
      return -1;
    }
    function commit(i, smooth) {
      i = nearestEnabled(Math.max(0, Math.min(w.items.length - 1, i)));
      if (i < 0) { return; }
      var changed = w.value !== w.items[i].v || !w.touched;
      w.value = w.items[i].v;
      w.touched = true;
      root.classList.remove('wheel--unset');
      scrollTo(i, smooth);
      aria();
      if (changed && opts.onChange) { opts.onChange(w.value); }
    }
    list.addEventListener('scroll', function () {
      if (!user) { return; }
      clearTimeout(timer);
      timer = setTimeout(function () { user = false; commit(Math.round(list.scrollTop / ROW), true); }, 120);
    }, { passive: true });
    list.addEventListener('click', function (ev) {
      var it = ev.target.closest ? ev.target.closest('.wheel__it') : null;
      if (!it || it.classList.contains('off')) { return; }
      commit(+it.getAttribute('data-i'), true);
    });
    win.addEventListener('keydown', function (ev) {
      var i = idxOf(w.value), n = w.items.length;
      if (i < 0) { i = Math.round(list.scrollTop / ROW); }
      var step = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 }[ev.key];
      if (step != null) { ev.preventDefault(); commit(i + step, true); return; }
      if (ev.key === 'Home') { ev.preventDefault(); commit(0, true); }
      if (ev.key === 'End') { ev.preventDefault(); commit(n - 1, true); }
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); commit(i, true); }
    });

    w.root = root;
    /* Новый набор строк (дни месяца, AM/PM). Выбранное значение остаётся,
       если оно всё ещё есть и доступно; иначе — ближайшее доступное, и
       об этом сообщает вызывающий (onClamp). */
    w.setItems = function (items, fallbackIdx) {
      w.items = items;
      list.innerHTML = items.map(function (it, k) {
        return '<div class="wheel__it' + (it.off ? ' off' : '') + '" data-i="' + k + '" aria-hidden="true">' +
          esc(it.t) + '</div>';
      }).join('');
      var i = idxOf(w.value);
      if (w.touched && (i < 0 || items[i].off)) {
        var j = nearestEnabled(i < 0 ? items.length - 1 : i);
        var old = w.value;
        w.value = j >= 0 ? items[j].v : null;
        i = j;
        if (opts.onClamp && w.value !== old) { opts.onClamp(w.value, old); }
      }
      if (i < 0) { i = fallbackIdx || 0; }
      scrollTo(i, false);
      aria();
    };
    w.jump = function (v) {
      var i = idxOf(v);
      if (i >= 0) { scrollTo(i, true); }
    };
    return w;
  }

  /* --- выбор даты ---------------------------------------------------------
     Три колонки в порядке локали (день-месяц-год, месяц-день-год, год-
     месяц-день), над годом — быстрый переход по десятилетиям. Дней столько,
     сколько в выбранном месяце и году; будущие дни, месяцы и годы
     выключены. Дата считается введённой, только когда тронуты все три
     колонки и человек нажал «Подтвердить». */
  var YEAR_MIN = 1900;
  function partsOrder() {
    try {
      return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
        .formatToParts(new Date(2000, 10, 22)).map(function (p) { return p.type; })
        .filter(function (t) { return t === 'day' || t === 'month' || t === 'year'; });
    } catch (e) { return ['day', 'month', 'year']; }
  }
  function DatePicker(init, onState) {
    var now = new Date(), Y = now.getFullYear();
    var val = { d: init && init.d, m: init && init.m, y: init && init.y };
    var box = document.createElement('div');
    box.className = 'dpick';
    var note = document.createElement('p');
    note.className = 'q-note';
    note.setAttribute('aria-live', 'polite');
    var readout = document.createElement('div');
    readout.className = 'q-readout';
    readout.setAttribute('aria-hidden', 'true');

    function maxDay() { return F.daysIn(val.y || 2000, val.m || 1); }
    function dayItems() {
      var max = val.m ? maxDay() : 31, out = [];
      for (var d = 1; d <= 31; d++) {
        var future = val.y === Y && val.m === now.getMonth() + 1 && d > now.getDate();
        out.push({ v: d, t: String(d), off: d > max || future });
      }
      return out;
    }
    function monthItems() {
      return C.months.map(function (t, i) {
        return { v: i + 1, t: t, off: val.y === Y && i > now.getMonth() };
      });
    }
    function yearItems() {
      var out = [];
      for (var y = Y; y >= YEAR_MIN; y--) { out.push({ v: y, t: String(y) }); }
      return out;
    }
    var wheels = {};
    function sync() {
      val.d = wheels.day && wheels.day.touched ? wheels.day.value : null;
      val.m = wheels.month && wheels.month.touched ? wheels.month.value : null;
      val.y = wheels.year && wheels.year.touched ? wheels.year.value : null;
    }
    function refresh() {
      sync();
      wheels.month.setItems(monthItems(), 0);
      sync();
      wheels.day.setItems(dayItems(), 0);
      state();
    }
    function state() {
      sync();
      var ok = F.dateValid(val);
      var mName = val.m ? C.months[val.m - 1] : '—';
      var parts = { day: val.d || '—', month: mName, year: val.y || '—' };
      readout.textContent = partsOrder().map(function (t) { return parts[t]; }).join(' ');
      readout.classList.toggle('is-set', ok);
      onState(ok ? { d: val.d, m: val.m, y: val.y } : null);
    }
    wheels.day = Wheel({ label: Q.dob.day, value: val.d, onChange: function () { note.textContent = ''; state(); },
      onClamp: function (v, old) {
        var futureOnly = old <= maxDay();
        note.textContent = futureOnly ? Q.dob.future : fmt(Q.dob.clamped, { d: v, n: maxDay() });
        F.track('q2_err_date');
      } });
    wheels.month = Wheel({ label: Q.dob.month, value: val.m, onChange: function () { refresh(); },
      onClamp: function () { note.textContent = Q.dob.future; } });
    wheels.year = Wheel({ label: Q.dob.year, value: val.y, onChange: function () { refresh(); } });

    var cols = document.createElement('div');
    cols.className = 'dpick__cols';
    partsOrder().forEach(function (t) { cols.appendChild(wheels[t].root); });
    wheels.year.root.classList.add('wheel--year');

    /* Десятилетия: прыжок прокрутки, а не выбор года — колонка остаётся
       «не тронутой», пока человек не остановит её на своём годе. */
    var dec = document.createElement('div');
    dec.className = 'dpick__dec';
    dec.setAttribute('role', 'group');
    dec.setAttribute('aria-label', Q.dob.decades);
    var decs = [];
    for (var d0 = Math.floor(Y / 10) * 10; d0 >= 1940; d0 -= 10) { decs.push(d0); }
    dec.innerHTML = decs.map(function (d) {
      return '<button type="button" class="chip q-dec" data-y="' + d + '">' + d + '</button>';
    }).join('');
    dec.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('.q-dec') : null;
      if (!b) { return; }
      wheels.year.jump(Math.min(Y, +b.getAttribute('data-y') + (+b.getAttribute('data-y') === Math.floor(Y / 10) * 10 ? 0 : 5)));
    });

    var hint = document.createElement('p');
    hint.className = 'q-pick';
    hint.textContent = Q.dob.pick;
    box.appendChild(readout);
    box.appendChild(hint);
    box.appendChild(cols);
    box.appendChild(dec);
    box.appendChild(note);

    wheels.year.setItems(yearItems(), Y - 1995);
    refresh();
    return box;
  }

  /* --- выбор времени ------------------------------------------------------
     Часы и минуты, 12 или 24 часа по локали. Минуты 00–59 без округления.
     00:00 — обычное время; «неизвестно» хранится отдельно (tk = 'no'),
     полдень как ответ не сохраняется никогда. */
  function hour12() {
    try {
      var hc = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric' }).resolvedOptions().hourCycle;
      return hc === 'h12' || hc === 'h11';
    } catch (e) { return false; }
  }
  function TimePicker(init, onState) {
    var h12 = hour12();
    var box = document.createElement('div');
    box.className = 'dpick';
    var readout = document.createElement('div');
    readout.className = 'q-readout';
    readout.setAttribute('aria-hidden', 'true');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var hh = init && init.h != null ? init.h : null, mm = init && init.min != null ? init.min : null;
    var w = {};
    function state() {
      var ok = w.h.touched && w.m.touched && (!h12 || w.ap.touched);
      var H = null;
      if (w.h.touched) {
        H = w.h.value;
        if (h12) { H = (H % 12) + (w.ap.touched && w.ap.value === 'pm' ? 12 : 0); }
      }
      var M = w.m.touched ? w.m.value : null;
      readout.textContent = (w.h.touched ? (h12 ? String(w.h.value) : pad(H)) : '—') + ':' +
        (M != null ? pad(M) : '—') + (h12 ? ' ' + (w.ap.touched ? w.ap.value.toUpperCase() : '—') : '');
      readout.classList.toggle('is-set', ok);
      onState(ok ? { h: H, min: M } : null);
    }
    var hItems = [];
    if (h12) { for (var i = 1; i <= 12; i++) { hItems.push({ v: i, t: String(i) }); } }
    else { for (var j = 0; j < 24; j++) { hItems.push({ v: j, t: pad(j) }); } }
    var mItems = [];
    for (var k = 0; k < 60; k++) { mItems.push({ v: k, t: pad(k) }); }
    var hInit = hh == null ? null : (h12 ? ((hh % 12) || 12) : hh);
    w.h = Wheel({ label: Q.time.hour, value: hInit, onChange: state });
    w.m = Wheel({ label: Q.time.minute, value: mm, onChange: state });
    var cols = document.createElement('div');
    cols.className = 'dpick__cols';
    cols.appendChild(w.h.root);
    cols.appendChild(w.m.root);
    if (h12) {
      w.ap = Wheel({ label: Q.time.ampm, value: hh == null ? null : (hh >= 12 ? 'pm' : 'am'), onChange: state });
      cols.appendChild(w.ap.root);
      w.ap.setItems([{ v: 'am', t: 'AM' }, { v: 'pm', t: 'PM' }], 0);
    }
    w.h.setItems(hItems, h12 ? 11 : 12);
    w.m.setItems(mItems, 0);
    var hint = document.createElement('p');
    hint.className = 'q-pick';
    hint.textContent = Q.time.pick;
    box.appendChild(readout);
    box.appendChild(hint);
    box.appendChild(cols);
    state();
    return box;
  }

  /* --- общие куски вывода ------------------------------------------------- */
  function signName(s) { return C.signs[s.index]; }
  function point(key, label, role, sign, opts) {
    opts = opts || {};
    var v = opts.range
      ? '<span class="b3__sign">' + esc(C.signs[opts.range[0]]) + ' / ' + esc(C.signs[opts.range[1]]) + '</span>'
      : sign ? '<span class="b3__sign">' + esc(signName(sign)) + '</span>' +
               '<span class="b3__deg">' + F.deg(sign.degree) + '</span>'
             : '<span class="b3__none">' + esc(opts.none) + '</span>';
    return '<div class="q-pt' + (opts.lead ? ' q-pt--lead' : '') + (sign || opts.range ? '' : ' q-pt--empty') + '">' +
      '<div class="b3__k">' + esc(label) + '</div><div class="b3__v">' + v + '</div>' +
      '<div class="b3__role">' + esc(role) + '</div>' +
      (opts.text ? '<p class="b3__t">' + esc(opts.text) + '</p>' : '') +
      (opts.note ? '<p class="q-note">' + esc(opts.note) + '</p>' : '') + '</div>';
  }
  function meLine(n) {
    var parts = [C.map.sun + ' ' + (n.sunRange ? C.signs[n.sunRange[0]] + '/' + C.signs[n.sunRange[1]] : signName(n.sun)),
                 C.map.moon + ' ' + (n.moonRange ? C.signs[n.moonRange[0]] + '/' + C.signs[n.moonRange[1]] : signName(n.moon))];
    if (n.asc) { parts.push(C.map.asc + ' ' + signName(n.asc)); }
    return parts.join(' · ');
  }
  function smallWheel(n, d) {
    var pts = [];
    if (d && d.natal) {
      d.natal.points.forEach(function (p) {
        if (p.name !== 'Node') { pts.push({ key: p.name.toLowerCase(), lon: p.lon, short: C.pv.codes[p.name] || p.name.slice(0, 2) }); }
      });
      if (d.natal.asc) { pts.push({ key: 'asc', lon: d.natal.asc.lon, short: C.pv.codes.ASC }); }
    } else {
      pts.push({ key: 'sun', lon: n.sunLon, short: C.map.sunShort });
      /* Луна, сменившая знак в тот день, точкой не рисуется: точка была бы
         полуднем, выданным за факт. */
      if (!n.moonRange) { pts.push({ key: 'moon', lon: n.moonLon, short: C.map.moonShort }); }
      if (n.asc) { pts.push({ key: 'asc', lon: n.ascLon, short: C.map.ascShort }); }
    }
    return W.render({ points: pts, signs: C.signs, aria: meLine(n) });
  }
  function inDays(date) {
    var days = Math.max(0, Math.round((date - new Date()) / 86400000));
    if (days === 0) { return C.pv.today; }
    if (days === 1) { return C.pv.tomorrow; }
    return C.pv.inDays.replace('{n}', days);
  }
  function tight(d) { return d.transits.filter(function (t) { return t.orb < 3; }); }

  /* --- экраны -------------------------------------------------------------- */
  var RENDER = {};
  var pending = {};   /* выбор на экране до подтверждения (дата, время) */

  /* 1. Основная цель. Используется: тема №1 в продукте (что первым в
     «Сегодня» и фильтр проводника транзитов), заголовок превью, текст
     интерпретации, разделы на пейволле, набор вариантов на шаге 2. */
  RENDER.goal = function (s) {
    s.innerHTML = head('goal', Q.goal.title, Q.goal.sub) +
      cards('goal', THEMES.map(function (k) { return { k: k, t: Q.goal.opts[k][0], d: Q.goal.opts[k][1] }; }), st.goal) +
      '<p class="q-note">' + esc(Q.goal.note) + '</p>' +
      '<p class="q-paid">' + esc(Q.paidNote) + '</p>' +
      '<p class="signin"><span>' + esc(C.access.s1Q) + '</span> <a href="product/">' + esc(C.access.s1Link) + '</a></p>';
    bindCards(s, function (k) {
      if (st.goal !== k) {
        st.goal = k; st.ctx = null; st.pWant = null;
        st.extra = st.extra.filter(function (x) { return x !== k; });
        persist();
      }
      RENDER.goal(s);
      var b = s.querySelector('.tile[data-k="' + k + '"]');
      if (b) { b.focus(); }
      dock(Q.cont, true);
    });
    dock(Q.cont, !!st.goal);
  };

  /* 2. Контекст цели. Используется: первая точка на «Основе карты», вкладка
     превью по умолчанию, первый шаг в продукте, ветка с датой второго
     человека (только «конкретная связь»). */
  RENDER.ctx = function (s) {
    var opts = Q.ctx.opts[st.goal] || {};
    var items = Object.keys(opts).map(function (k) { return { k: k, t: opts[k] }; });
    items.push({ k: 'unsure', t: Q.ctx.unsure });
    s.innerHTML = head('ctx', Q.ctx.title[st.goal] || '', Q.ctx.sub) + cards('ctx', items, st.ctx);
    bindCards(s, function (k) {
      st.ctx = k;
      if (!pairOn()) { st.pWant = null; }
      persist();
      RENDER.ctx(s);
      var b = s.querySelector('.tile[data-k="' + k + '"]');
      if (b) { b.focus(); }
    });
    dock(Q.cont, !!st.ctx);
  };

  /* 3. Дата рождения. */
  RENDER.dob = function (s) {
    s.innerHTML = head('dob', Q.dob.title, Q.dob.sub);
    pending.dob = st.dobOk ? st.dob : null;
    s.appendChild(DatePicker(st.dobOk ? st.dob : null, function (v) {
      pending.dob = v;
      cta.disabled = !v;
    }));
    dock(Q.dob.confirm, !!pending.dob);
  };

  /* 4. Первая награда: Солнце по дате. Считается на полдень UTC — знак по
     дате почти всегда однозначен, а у границы знака экран это говорит. */
  RENDER.sun = function (s) {
    var c = A.chartDateOnly({ y: st.dob.y, m: st.dob.m, d: st.dob.d }, 0);
    s.innerHTML = head('sun', C.s1.resultLabel, null, Q.sun.eyebrow) +
      '<div class="res">' +
        '<div class="mapbox">' + W.render({ points: [{ key: 'sun', lon: c.sunLon, short: C.map.sunShort }],
          signs: C.signs, aria: C.map.sun + ' — ' + signName(c.sun) }) + '</div>' +
        '<div class="res__val">' + esc(signName(c.sun)) + ' <span class="res__deg">' + F.deg(c.sun.degree) + '</span></div>' +
        '<div class="res__txt">' + esc(C.sun[c.sun.index]) + '</div>' +
        '<div class="res__meta">' + esc(C.s1.elementLabel + ': ' + C.elements[c.sun.element]) +
          (c.sun.nearCusp ? ' · ' + esc(C.s3.cuspNote) : '') + '</div>' +
      '</div>' +
      '<p class="q-note">' + esc(Q.sun.part) + '</p>';
    dock(Q.sun.cta, true);
  };

  /* 5. Знает ли время. Используется: маршрут (шаг времени), асцендент и
     дома, пометки неопределённости. */
  RENDER.tk = function (s) {
    s.innerHTML = head('tk', Q.tk.title, Q.tk.sub) +
      cards('tk', [{ k: 'yes', t: Q.tk.yes, d: Q.tk.yesD }, { k: 'no', t: Q.tk.no, d: Q.tk.noD }], st.tk);
    bindCards(s, function (k) {
      if (st.tk !== k) { st.tk = k; invalidate(); persist(); }
      RENDER.tk(s);
      var b = s.querySelector('.tile[data-k="' + k + '"]');
      if (b) { b.focus(); }
      header('tk');
    });
    dock(Q.cont, !!st.tk);
  };

  /* 6. Время — только если знает. */
  RENDER.time = function (s) {
    s.innerHTML = head('time', Q.time.title, Q.time.sub);
    pending.time = st.time.h != null ? { h: st.time.h, min: st.time.min } : null;
    s.appendChild(TimePicker(pending.time, function (v) { pending.time = v; cta.disabled = !v; }));
    var u = document.createElement('button');
    u.type = 'button';
    u.className = 'q-link';
    u.textContent = Q.time.unknown;
    u.addEventListener('click', function () {
      st.tk = 'no'; st.time = { h: null, min: null, known: false };
      invalidate(); persist();
      F.track('q2_tk_no');
      go('place');
    });
    s.appendChild(u);
    dock(Q.time.confirm, !!pending.time);
  };

  /* 7. Место. Поиск по 864 городам воронки (кириллица, диакритика, местные
     названия — cities.js). Выбирается строка результата, а не набранный
     текст: она даёт координаты и IANA-таймзону, по которой смещение на дату
     рождения считается с летним временем той эпохи. Геолокацию не
     спрашиваем: текущее место — не место рождения. */
  var placeMode = 'search';
  RENDER.place = function (s) {
    var c = st.city;
    var html = head('place', Q.place.title, Q.place.sub);
    if (c) {
      html += '<div class="q-chosen"><div><div class="b3__k">' + esc(Q.place.selected) + '</div>' +
        '<div class="q-chosen__n">' + esc(c.approx ? c.n : FC.label([c.n, c.cc])) + '</div>' +
        (c.approx ? '<div class="q-note">' + fmt(Q.place.approx, { c: esc(c.approx) }) + '</div>' : '') +
        '</div><button type="button" class="q-link" id="qPlaceChange">' + esc(Q.place.change) + '</button></div>';
      s.innerHTML = html;
      el('qPlaceChange').addEventListener('click', function () {
        st.city = null; invalidate(); persist(); placeMode = 'search'; RENDER.place(s);
        var i = el('qCity'); if (i) { i.focus(); }
      });
      dock(Q.place.confirm, true);
      return;
    }
    var nf = placeMode === 'nf';
    html += (nf ? '<div class="q-nf"><h2 class="pv__h">' + esc(Q.place.nfTitle) + '</h2><p class="hint">' +
        esc(Q.place.nfText) + '</p><label class="field__lab" for="qNfName">' + esc(Q.place.nfName) + '</label>' +
        '<input type="text" id="qNfName" class="citypick__input" autocomplete="off"></div>' : '') +
      '<label class="field__lab" for="qCity">' + esc(nf ? Q.place.nfTitle : Q.place.label) + '</label>' +
      '<input type="text" id="qCity" class="citypick__input" autocomplete="off" spellcheck="false" ' +
        'role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="qCityList" placeholder="' +
        esc(Q.place.placeholder) + '">' +
      '<ul class="q-results" id="qCityList" role="listbox" aria-label="' + esc(Q.place.label) + '"></ul>' +
      '<p class="q-note" id="qCityMsg" aria-live="polite"></p>' +
      '<button type="button" class="q-link" id="qNf">' + esc(nf ? Q.place.nfBack : Q.place.notFound) + '</button>';
    s.innerHTML = html;
    var input = el('qCity'), listEl = el('qCityList'), msg = el('qCityMsg');
    var results = [], active = -1, token = 0, t = null;
    function draw() {
      listEl.innerHTML = results.map(function (r, i) {
        return '<li role="option" id="qco-' + i + '" class="q-res' + (i === active ? ' on' : '') +
          '" aria-selected="' + (i === active) + '" data-i="' + i + '"><span class="citypick__name">' + esc(r[0]) +
          '</span><span class="citypick__land">' + esc(FC.COUNTRY_NAMES[r[1]] || r[1]) + '</span></li>';
      }).join('');
      input.setAttribute('aria-expanded', results.length ? 'true' : 'false');
      if (active >= 0) { input.setAttribute('aria-activedescendant', 'qco-' + active); }
      else { input.removeAttribute('aria-activedescendant'); }
    }
    function search() {
      var my = ++token, q = input.value;
      clearTimeout(t);
      t = setTimeout(function () {
        if (my !== token) { return; }   /* устаревший запрос не перекрывает новый */
        var n = FC.norm(q).trim();
        results = n.length >= 2 ? FC.search(q, 8) : [];
        active = -1;
        msg.textContent = n.length >= 2 && !results.length ? Q.place.noMatch : '';
        draw();
      }, 120);
    }
    function choose(i) {
      var r = results[i];
      if (!r) { return; }
      if (nf) {
        var typed = (el('qNfName').value || '').trim().slice(0, 60);
        st.city = { n: typed || r[0], cc: r[1], lat: null, lon: null, tz: r[4], approx: r[0] };
      } else {
        st.city = FC.toObject(r);
      }
      if (window.astromapDropLift) { window.astromapDropLift(); }
      invalidate(); persist();
      RENDER.place(s);
      var b = el('qPlaceChange'); if (b) { b.focus(); }
    }
    input.addEventListener('input', search);
    input.addEventListener('focus', function () { if (window.astromapLiftField) { window.astromapLiftField(input); } });
    input.addEventListener('blur', function () { if (window.astromapDropLift) { window.astromapDropLift(); } });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown' && results.length) { ev.preventDefault(); active = (active + 1) % results.length; draw(); }
      else if (ev.key === 'ArrowUp' && results.length) { ev.preventDefault(); active = active <= 0 ? results.length - 1 : active - 1; draw(); }
      else if (ev.key === 'Enter') { ev.preventDefault(); if (results.length) { choose(active >= 0 ? active : 0); } }
      else if (ev.key === 'Escape') { results = []; active = -1; draw(); }
    });
    listEl.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    listEl.addEventListener('click', function (ev) {
      var li = ev.target.closest ? ev.target.closest('.q-res') : null;
      if (li) { choose(+li.getAttribute('data-i')); }
    });
    el('qNf').addEventListener('click', function () {
      placeMode = nf ? 'search' : 'nf';
      if (!nf) { F.track('q2_place_nf'); }
      RENDER.place(s);
      var f = el(nf ? 'qCity' : 'qNfName'); if (f) { f.focus(); }
    });
    dock(Q.place.confirm, false);
  };

  /* 8. Вторая награда: основа карты. Первой стоит точка из ответа на шаге 2
     с подписью, что порядок — из ответа, а не из карты. */
  RENDER.core = function (s) {
    var n = natal();
    if (!n) { s.innerHTML = ''; return; }
    var lead = ctxInfo().lead;
    var noAsc = !n.known ? Q.core.noAscTime : Q.core.noAscPlace;
    var sun = point('sun', C.map.sun, C.s3.roleSun, n.sunRange ? null : n.sun, {
      lead: lead === 'sun', range: n.sunRange,
      text: n.sunRange ? '' : C.sun[n.sun.index],
      note: n.sunRange ? fmt(Q.core.sunRange, { a: C.signs[n.sunRange[0]], b: C.signs[n.sunRange[1]] }) :
        (n.sun.nearCusp ? C.s3.cuspNote : '') });
    var moon = point('moon', C.map.moon, C.s3.roleMoon, n.moonRange ? null : n.moon, {
      lead: lead === 'moon', range: n.moonRange,
      text: n.moonRange ? '' : C.moon[n.moon.index],
      note: n.moonRange ? fmt(Q.core.moonRange, { a: C.signs[n.moonRange[0]], b: C.signs[n.moonRange[1]] }) :
        (n.moon.nearCusp ? C.s3.cuspNote : '') });
    var asc = point('asc', C.map.asc, C.s3.roleAsc, n.asc, {
      none: noAsc, text: n.asc ? C.asc[n.asc.index] : '', note: n.asc && n.asc.nearCusp ? C.s3.cuspNote : '' });
    s.innerHTML = head('core', Q.core.title, Q.core.sub) +
      '<div class="mapbox">' + smallWheel(n) + '</div>' +
      '<p class="q-note q-note--lead">' + esc(Q.core.lead) + '</p>' +
      '<div class="q-core">' + (lead === 'moon' ? moon + sun : sun + moon) + asc + '</div>';
    /* Ядро продукта и тексты — сейчас, пока человек читает: к превью они
       обычно уже на месте. */
    ensureAssets();
    dock(Q.cont, true);
  };

  /* 9. Дополнительные интересы. Используется: темы 2–4 в продукте (порядок
     областей), дополнительные абзацы в превью. Не обязателен. */
  RENDER.extra = function (s) {
    var others = THEMES.filter(function (k) { return k !== st.goal; });
    var only = st.extraDone && !st.extra.length;
    var items = others.map(function (k) { return { k: k, t: Q.goal.opts[k][0], d: Q.goal.opts[k][1] }; });
    items.push({ k: 'only', t: Q.extra.only.replace('{goal}', Q.goal.opts[st.goal][0]) });
    s.innerHTML = head('extra', Q.extra.title, Q.extra.sub) +
      cards('extra', items, only ? ['only'] : st.extra, true);
    bindCards(s, function (k) {
      if (k === 'only') { st.extra = []; st.extraDone = true; }
      else {
        var i = st.extra.indexOf(k);
        if (i >= 0) { st.extra.splice(i, 1); } else { st.extra.push(k); }
        st.extraDone = !!st.extra.length;
      }
      persist();
      RENDER.extra(s);
      var b = s.querySelector('.tile[data-k="' + k + '"]');
      if (b) { b.focus(); }
    });
    dock(Q.cont, true);
  };

  /* 10. С чего начать. Используется: вкладка превью по умолчанию и раздел,
     на котором продукт откроется после первого входа (startView). */
  RENDER.start = function (s) {
    var o = Q.start.opts;
    s.innerHTML = head('start', Q.start.title, Q.start.sub) +
      cards('start', ['chart', 'sky', 'dates'].map(function (k) { return { k: k, t: o[k][0], d: o[k][1] }; }), st.start);
    bindCards(s, function (k) {
      st.start = k; pvTab = null; persist(); RENDER.start(s);
      var b = s.querySelector('.tile[data-k="' + k + '"]'); if (b) { b.focus(); }
    });
    dock(Q.cont, !!st.start);
  };

  /* Ветка пары: только «Отношения» → «Посмотреть конкретную связь». */
  RENDER.pask = function (s) {
    s.innerHTML = head('pask', Q.pask.title, Q.pask.sub) +
      cards('pask', [{ k: 'yes', t: Q.pask.add }, { k: 'no', t: Q.pask.skip }], st.pWant);
    bindCards(s, function (k) {
      st.pWant = k; persist(); RENDER.pask(s); header('pask');
      var b = s.querySelector('.tile[data-k="' + k + '"]'); if (b) { b.focus(); }
    });
    dock(Q.cont, !!st.pWant);
  };
  RENDER.pdate = function (s) {
    s.innerHTML = head('pdate', Q.pdate.title, Q.pdate.sub);
    pending.partner = st.partnerOk ? st.partner : null;
    s.appendChild(DatePicker(pending.partner, function (v) { pending.partner = v; cta.disabled = !v; }));
    dock(Q.pdate.confirm, !!pending.partner);
  };

  /* 11–12. Превью. Сначала законченный фрагмент (абзац из библиотеки
     текстов по стихии Солнца — тот же, что в бесплатном чтении), потом
     один аспект неба простыми словами, потом вкладки продукта на данных
     человека. Пока ядро грузится — короткое состояние загрузки, при сбое —
     повтор или продолжение без превью; ответы при этом не теряются. */
  var pvTab = null;
  RENDER.preview = function (s) {
    var n = natal();
    if (!n) { return; }
    if (assetsState !== 'ready') {
      var failed = assetsState === 'failed';
      s.innerHTML = head('preview', Q.prev.title[st.goal], null) +
        '<div class="q-load" role="status">' + (failed
          ? '<p>' + esc(Q.load.fail) + '</p><button type="button" class="q-link" id="qRetry">' + esc(Q.load.retry) + '</button>'
          : '<div class="paybox__spin paybox__spin--light"></div><p>' + esc(Q.load.busy) + '</p>') + '</div>';
      if (failed) {
        F.track('q2_pv_fail');
        el('qRetry').addEventListener('click', function () {
          ensureAssets(function () { if (cur === 'preview') { RENDER.preview(s); } }, true);
          RENDER.preview(s);
        });
        dock(Q.load.skip, true);
      } else {
        dock(Q.cont, false);
        ensureAssets(function () { if (cur === 'preview') { RENDER.preview(s); header('preview'); } });
      }
      return;
    }
    var d = pvData(), R = window.READING;
    var el0 = n.sun.element;
    var frag = R && R.themes && R.themes[st.goal] ? R.themes[st.goal] : null;
    var html = head('preview', Q.prev.title[st.goal], null) +
      '<p class="pw__me">' + esc(meLine(n)) + '</p>';
    if (frag && !n.sunRange) {
      html += '<section class="q-card"><div class="b3__k">' + fmt(Q.prev.frag, { theme: esc(frag.t), element: esc(C.elements[el0]) }) +
        '</div><p class="q-frag">' + esc(frag[el0]) + '</p><p class="q-note">' + esc(Q.prev.fragSrc) + '</p>';
      /* Остальные выбранные темы — свёрнутыми: ответ на шаге 9 виден здесь. */
      st.extra.forEach(function (k) {
        if (R.themes[k]) {
          html += '<details class="q-more"><summary>' + esc(R.themes[k].t) + '</summary><p>' + esc(R.themes[k][el0]) + '</p></details>';
        }
      });
      html += '</section>';
    }
    if (d) {
      var tt = tight(d)[0];
      html += '<section class="q-card"><h2 class="pv__h">' + esc(Q.prev.plainTitle) + '</h2>' + (tt
        ? '<p class="q-asp"><b>' + esc(C.pv.points[tt.transit] || tt.transit) + '</b> ' + esc(C.pv.aspects[tt.aspect]) +
          ' <b>' + esc(C.pv.points[tt.natal] || tt.natal) + '</b></p><p class="q-frag">' + esc(Q.prev.asp[tt.aspect] || '') + '</p>' +
          '<details class="q-more"><summary>' + esc(Q.prev.details) + '</summary><p>' + esc(C.pv.fromSky) + ' → ' +
          esc(C.pv.toChart) + ' · ' + esc(C.pv.orb) + ' ' + F.deg(tt.orb) + ' · ' + esc(C.pv.tone[tt.tone]) + '</p></details>'
        : '<p class="q-frag">' + esc(Q.prev.plainNone) + '</p>') + '</section>';
      if (!pvTab) { pvTab = st.start ? START_TAB[st.start] : ctxInfo().tab; }
      html += '<section class="pv" id="qPv"><h2 class="pv__h">' + esc(C.pv.title) + '</h2>' +
        '<p class="pv__sub">' + esc(Q.prev.tabsLead) + '</p><div class="pv__tabs" role="tablist">' +
        ['today', 'chart', 'retro'].map(function (k) {
          return '<button type="button" class="pv__tab' + (k === pvTab ? ' on' : '') + '" role="tab" aria-selected="' +
            (k === pvTab) + '" data-pvtab="' + k + '">' + esc(C.pv.tabs[k]) + '</button>';
        }).join('') + '</div><div class="pv__body" role="tabpanel">' + tabHtml(n, d, pvTab) + '</div>' +
        (!n.known ? '<p class="q-note">' + esc(Q.prev.noon) + '</p>' : '') + '</section>';
    }
    if (pairOn() && st.pWant === 'yes' && st.partnerOk) { html += pairHtml(n); }
    s.innerHTML = html;
    all('[data-pvtab]', s).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-pvtab');
        if (k === pvTab) { return; }
        pvTab = k;
        F.track('q2_pv_tab');
        RENDER.preview(s);
        var nb = s.querySelector('[data-pvtab="' + k + '"]'); if (nb) { nb.focus(); }
      });
    });
    dock(Q.cont, true);
  };

  /* Вкладки — те же три раздела, что в прежнем превью, теми же строками
     COPY.pv: цифры и подписи совпадают с продуктом. */
  function tabHtml(n, d, tab) {
    var row = function (k, v) {
      return '<div class="pv__row"><span class="pv__k">' + esc(k) + '</span><span class="pv__v">' + esc(v) + '</span></div>';
    };
    var lock = function (t) { return '<p class="pv__lock"><span class="pv__lockicon" aria-hidden="true"></span>' + esc(t) + '</p>'; };
    if (tab === 'chart') {
      return '<div class="mapbox mapbox--pv">' + smallWheel(n, d) + '</div><div class="pv__rows">' +
        row(C.pv.planets, String(d.natal.points.filter(function (p) { return p.name !== 'Node'; }).length + (d.natal.asc ? 2 : 0))) +
        row(C.pv.aspectsN, String(d.aspects.length)) +
        row(C.pv.housesN, d.natal.houses ? '12' : C.pv.noHouses) + '</div>' + lock(C.pv.lockChart);
    }
    if (tab === 'retro') {
      if (!d.retro.length) { return '<p class="pv__empty">' + esc(C.pv.noRetro) + '</p>' + lock(C.pv.lockRetro); }
      return '<h3 class="pv__h3">' + esc(C.pv.retroTitle.replace('{n}', d.retro.length)) + '</h3><ul class="pv__list">' +
        d.retro.map(function (r) {
          return '<li class="pv__t"><span class="pv__tmain"><b>' + esc(C.pv.points[r.body] || r.body) + '</b> ' +
            esc(C.pv.inSign.replace('{s}', C.signs[r.sign.index])) + '</span><span class="pv__tmeta">' + esc(C.pv.retroNow) + '</span></li>';
        }).join('') + '</ul>' + lock(C.pv.lockRetro);
    }
    var close = tight(d);
    var rows = row(C.pv.moonNow, C.moonPhase[d.moon.phaseIndex] + ' · ' + C.signs[d.moon.sign.index]) +
      row(C.pv.illum, Math.round(d.moon.illum * 100) + '%') +
      (d.signChange ? row(C.pv.moonShift, C.signs[d.signChange.to.index] + ' · ' + inDays(d.signChange.date)) : '');
    var list = close.slice(0, 2).map(function (t) {
      return '<li class="pv__t"><span class="pv__tmain"><b>' + esc(C.pv.points[t.transit] || t.transit) + '</b>' +
        '<span class="pv__asp">' + esc(C.pv.aspects[t.aspect]) + '</span><b>' + esc(C.pv.points[t.natal] || t.natal) + '</b></span>' +
        '<span class="pv__tone pv__tone--' + t.tone + '">' + esc(C.pv.tone[t.tone]) + '</span></li>';
    }).join('');
    var rest = Math.max(0, close.length - 2);
    return '<div class="pv__rows">' + rows + '</div><h3 class="pv__h3">' + esc(C.pv.activeNow.replace('{n}', close.length)) +
      '</h3><ul class="pv__list">' + list + '</ul>' + (rest ? lock(C.pv.lockTransits.replace('{n}', rest)) : '');
  }

  /* Пара: стихии двух Солнц словами и индекс метода мелко, без ярлыков
     вроде «трудная пара». Индекс считается тем же synastry(), что и в
     прежней воронке; Луна второго человека — на полдень. */
  var ELEM_FIT = { fire: 'air', air: 'fire', earth: 'water', water: 'earth' };
  function pairHtml(n) {
    var tz = (st.city && typeof st.city.tz === 'number') ? st.city.tz : 0;
    var p = A.chartDateOnly(st.partner, tz);
    var syn = A.synastry(n.sunLon, n.moonLon, p.sunLon, p.moonLon);
    var a = n.sun.element, b = p.sun.element;
    var txt = a === b ? fmt(Q.prev.pair.same, { e: esc(C.elements[a]) })
      : ELEM_FIT[a] === b ? fmt(Q.prev.pair.fit, { a: esc(C.elements[a]), b: esc(C.elements[b]) })
      : fmt(Q.prev.pair.diff, { a: esc(C.elements[a]), b: esc(C.elements[b]) });
    return '<section class="q-card"><h2 class="pv__h">' + esc(Q.prev.pairTitle) + '</h2>' +
      '<p class="q-asp"><b>' + esc(signName(n.sun)) + '</b> · <b>' + esc(signName(p.sun)) + '</b></p>' +
      '<p class="q-frag">' + txt + '</p><p class="q-note">' + fmt(Q.prev.pairNote, { n: syn.score }) + '</p>' +
      '<p class="q-note">' + esc(Q.pdate.sub) + '</p></section>';
  }

  /* 13. Мост к повторной ценности: что меняется (небо), что нет (карта),
     что в продукте можно делать возвращаясь, и первый шаг по ответу. */
  RENDER.bridge = function (s) {
    var n = natal(), d = pvData();
    var today = [], next = [];
    if (d) {
      today.push(fmt(Q.bridge.moon, { phase: esc(C.moonPhase[d.moon.phaseIndex]), s: esc(C.signs[d.moon.sign.index]) }));
      today.push(fmt(Q.bridge.tight, { n: tight(d).length }));
      if (d.retro.length) {
        today.push(fmt(Q.bridge.retro, { list: esc(d.retro.map(function (r) { return C.pv.points[r.body] || r.body; }).join(', ')) }));
      }
      if (d.signChange) {
        next.push(fmt(Q.bridge.moonNext, { s: esc(C.signs[d.signChange.to.index]) }) + ' · ' + esc(inDays(d.signChange.date)));
      }
    }
    var li = function (arr) { return '<ul class="q-list">' + arr.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; };
    s.innerHTML = head('bridge', Q.bridge.title, Q.bridge.sub) +
      '<div class="mapbox mapbox--pw">' + smallWheel(n, d) + '</div>' +
      (today.length ? '<section class="q-card"><h2 class="pv__h">' + esc(Q.bridge.today) + '</h2>' + li(today) + '</section>' : '') +
      (next.length ? '<section class="q-card"><h2 class="pv__h">' + esc(Q.bridge.next) + '</h2>' + li(next) + '</section>' : '') +
      '<section class="q-card"><h2 class="pv__h">' + esc(Q.bridge.first) + '</h2><p class="q-frag">' +
        esc(Q.bridge.act[st.start === 'chart' ? 'chart' : (st.start ? 'today' : ctxInfo().act)]) + '</p></section>' +
      '<section class="q-card"><h2 class="pv__h">' + esc(Q.bridge.appTitle) + '</h2>' +
        li(Q.bridge.app.map(esc)) + '</section>';
    dock(Q.cont, true);
  };

  /* 14. Пейвол. Порядок: персональный заголовок → 2–3 раздела продукта для
     фокуса → компактная карта → тариф и условия рядом с кнопкой → ключ.
     Цена, период, НДС, автопродление и отмена — те же строки COPY.billing,
     что у прежней воронки. «Не сейчас» называется тем, что делает:
     «Посмотреть годовой план». */
  function priceOf(line) { var i = line.indexOf(' + '); return i > 0 ? line.slice(0, i) : line; }
  function payCta() { return Q.pay.cta.replace('{price}', priceOf(C.billing.priceLine)); }
  function yearCta() { return Q.year.cta.replace('{price}', priceOf(C.billing.yearPrice)); }
  RENDER.pay = function (s) {
    var n = natal();
    var opens = (GOAL_OPENS[st.goal] || [0, 1, 2]).map(function (i) { return C.pw.opens[i]; });
    s.innerHTML = '<p class="eyebrow">' + esc(C.paywall.eyebrow) + '</p>' +
      '<h1 class="h1" id="q-pay-h" tabindex="-1">' + esc(Q.prev.title[st.goal]) + '</h1>' +
      '<p class="pw__me">' + esc(meLine(n)) + '</p>' +
      '<h2 class="pw__h">' + esc(Q.pay.features) + '</h2><div class="inc">' + opens.map(function (o) {
        return '<div class="inc__i"><i class="inc__d"></i><span class="inc__t"><b>' + esc(o.t) + '</b>' + esc(o.d) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="mapbox mapbox--pw">' + smallWheel(n, pvData()) + '</div>' +
      '<div class="plan"><div class="plan__t">' + esc(C.paywall.planTitle) + '</div>' +
        '<div class="plan__p">' + F.priceHtml(C.billing.priceLine) + '</div>' +
        '<div class="plan__after">' + esc(C.billing.renewLine) + '</div>' +
        '<p class="disc">' + F.discHtml(C.billing.disclaimer) + '</p>' +
        '<p class="legal">' + F.legalHtml(payCta()) + '</p>' +
        '<p class="legal checkout-note hidden"></p></div>' +
      '<p class="q-note">' + esc(Q.pay.key) + '</p>' +
      '<button type="button" class="q-link" data-goto="preview">' + esc(Q.pay.backPrev) + '</button>' +
      '<p class="signin"><span>' + esc(C.access.paidQ) + '</span> <a href="product/">' + esc(C.access.paidLink) + '</a></p>';
    dock(payCta(), true, Q.pay.seeYear, C.billing.priceLine + ' \u00B7 ' + C.billing.renewLine);
  };
  RENDER.year = function (s) {
    s.innerHTML = '<p class="eyebrow">' + esc(C.paywall.eyebrow) + '</p>' +
      head('year', Q.year.title, Q.year.sub) +
      '<div class="alt"><div class="alt__t">' + esc(C.recovery.yearTitle) + '</div>' +
        '<div class="alt__p">' + F.priceHtml(C.billing.yearPrice, C.billing.yearPeriod) + '</div>' +
        '<p class="plan__after">' + esc(Q.year.equiv) + '</p>' +
        '<p class="disc">' + F.discHtml(C.billing.yearDisclaimer) + '</p>' +
        '<p class="legal">' + F.legalHtml(yearCta()) + '</p>' +
        '<p class="legal checkout-note hidden"></p></div>' +
      '<p class="q-note">' + esc(Q.pay.key) + '</p>' +
      '<div class="q-links"><button type="button" class="q-link" data-goto="preview">' + esc(Q.year.backPrev) + '</button>' +
      '<a class="q-link" id="qFree" href="reading.html">' + esc(Q.year.free) + '</a></div>' +
      '<p class="signin"><span>' + esc(C.access.paidQ) + '</span> <a href="product/">' + esc(C.access.paidLink) + '</a></p>';
    el('qFree').addEventListener('click', function () { F.track('q2_reading'); });
    dock(yearCta(), true, Q.year.back, C.billing.yearPrice + ' \u00B7 ' + Q.year.renew);
  };

  /* --- переходы -------------------------------------------------------------
     Двойное нажатие: второе нажатие в первые 350 мс после смены экрана
     игнорируется — иначе один «двойной тап» проходил бы два шага. */
  cta.addEventListener('click', function () {
    if (!cur || Date.now() - lastShow < 350) { return; }
    var id = cur;
    if (id === 'dob') {
      if (!pending.dob) { return; }
      var changed = JSON.stringify(pending.dob) !== JSON.stringify(st.dob) || !st.dobOk;
      st.dob = pending.dob; st.dobOk = true;
      if (changed) { invalidate(); }
      persist();
    }
    if (id === 'time') {
      if (!pending.time) { return; }
      st.time = { h: pending.time.h, min: pending.time.min, known: true };
      invalidate(); persist();
    }
    if (id === 'tk' && st.tk === 'no') {
      st.time = { h: null, min: null, known: false }; invalidate(); persist();
      F.track('q2_tk_no');
    }
    if (id === 'pask' && st.pWant === 'no') { persist(); F.track('q2_pask_no'); }
    if (id === 'pdate') {
      if (!pending.partner) { return; }
      st.partner = pending.partner; st.partnerOk = true; persist();
    }
    if (id === 'extra' && !st.extraDone) { st.extraDone = true; persist(); }
    if (id === 'preview' && assetsState === 'failed') { /* «продолжить без превью» */ }
    if (id === 'pay') {
      F.track('q2_pay_m');
      if (F.checkoutUrl) { F.goCheckout('monthly', F.checkoutUrl); } else { F.noCheckout('CHECKOUT_URL'); }
      return;
    }
    if (id === 'year') {
      F.track('q2_pay_y');
      if (F.checkoutUrlYear) { F.goCheckout('yearly', F.checkoutUrlYear); } else { F.noCheckout('CHECKOUT_URL_YEAR'); }
      return;
    }
    if (!STEPS[id].done()) { return; }
    var nx = nextOf(id);
    if (nx) { go(nx); }
  });
  ghost.addEventListener('click', function () {
    if (cur === 'pay') {
      if (!F.checkoutUrlYear) { F.track('q2_reading'); location.href = 'reading.html'; return; }
      go('year'); return;
    }
    if (cur === 'year') { go('pay'); }
  });
  back.addEventListener('click', function () {
    var p = prevOf(cur);
    if (p) { go(p); }
  });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('[data-goto]') : null;
    if (b && cur) { go(b.getAttribute('data-goto')); }
  });
  /* Стрелки внутри группы карточек с одним выбором: фокус ходит по
     карточкам (общий обработчик в flow.js), выбор — Пробелом/Enter. */

  /* --- старт ----------------------------------------------------------------
     Перезагрузка и смена языка возвращают на тот же шаг (sessionStorage
     этой вкладки). Новая вкладка начинает с начала, но прежние ответы уже
     отмечены. */
  var want = 'goal';
  try { want = sessionStorage.getItem('astromap.q2.step') || 'goal'; } catch (e) {}
  window.AstroQuiz = { trackCurrent: function () { if (cur) { F.track('q2_' + cur); } } };
  show(reachable(want), { noFocus: true, noTrack: !!window.ASTROMAP_TT_ARRIVAL });
  if (cur === 'preview' || cur === 'bridge' || cur === 'pay' || cur === 'year') {
    ensureAssets(function () { if (cur) { RENDER[cur](section(cur)); } });
  }
})();
