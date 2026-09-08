/* app.js — оболочка веб-продукта: состояние, роутер, экраны.
   Всё считается в браузере. Данные никуда не отправляются.

   СТЫК С ВОРОНКОЙ: если у продукта ещё нет своего состояния, он забирает
   данные, введённые в воронке (ключ astromap.funnel). Так человек после
   оплаты не вводит дату второй раз. */
(function () {
  'use strict';

  var E = window.Engine, N = window.Numerology, T = window.T, W = window.Wheel;
  var A = window.Astronomy;
  var CITIES = (window.APP_LANG === 'pl') ? window.CITIES.pl : window.CITIES.en;
  var TZ = window.TZ;

  var KEY = 'astromap.app';
  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  };

  /* --- состояние ---------------------------------------------------------- */
  var S = { profile: null, partner: null };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { S = JSON.parse(raw); return; }
    } catch (e) { console.error('astromap: чтение состояния', e); }
    /* Импорт из воронки — единственный раз, при первом входе после оплаты. */
    try {
      var f = localStorage.getItem('astromap.funnel');
      if (f) {
        var p = JSON.parse(f);
        if (p && p.dob && p.dob.y) {
          /* Город берём из того списка, на котором работала воронка: индексы
             в польском и английском списках разные. */
          var srcList = (p.lang === 'pl') ? window.CITIES.pl : window.CITIES.en;
          var srcCity = srcList[(p.cityIdx === null || p.cityIdx === undefined) ? 0 : p.cityIdx]
                        || srcList[0];
          S.profile = {
            name: '', y: p.dob.y, m: p.dob.m, d: p.dob.d,
            h: (p.time && p.time.known) ? p.time.h : null,
            min: (p.time && p.time.known) ? p.time.min : null,
            timeKnown: !!(p.time && p.time.known),
            city: srcCity
          };
          if (p.partner && p.partner.y) {
            S.partner = { name: '', y: p.partner.y, m: p.partner.m, d: p.partner.d,
                          h: null, min: null, timeKnown: false, city: srcCity };
          }
          save();
        }
      }
    } catch (e2) { console.error('astromap: импорт из воронки', e2); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* игнор */ }
  }

  /* --- расчёт ------------------------------------------------------------- */
  function cityOf(p) {
    /* Город хранится объектом, а не индексом: индекс зависел бы от языка,
       и переключение EN/PL меняло бы место рождения. Старые записи с
       cityIdx мигрируем на объект при первом чтении. */
    if (p.city && typeof p.city.lat === 'number') { return p.city; }
    var c = CITIES[p.cityIdx] || CITIES[0];
    p.city = c; delete p.cityIdx; save();
    return c;
  }

  function chartOf(p) {
    if (!p) { return null; }
    var city = cityOf(p);
    var utc = TZ.toUTC(p.y, p.m, p.d, p.timeKnown ? p.h : 12,
                       p.timeKnown ? p.min : 0, city);
    return E.chart(utc, city.lat, city.lon, { timeKnown: p.timeKnown });
  }

  var natal = null, partnerChart = null;

  function recalc() {
    natal = chartOf(S.profile);
    partnerChart = chartOf(S.partner);
  }

  /* --- индексы дня --------------------------------------------------------
     Считаются из тона активных транзитов к профильным точкам.
     Формула документирована здесь, чтобы её можно было оспорить:
       50 + сумма(вес_тона * близость * вес_точки/10), обрезка 5..95.
     Это индекс на понятной шкале, а не вероятность. */
  var INDEX_TARGETS = {
    mood: ['Moon', 'Sun'],
    work: ['MC', 'Saturn', 'Mars', 'Sun'],
    love: ['Venus', 'Moon', 'ASC']
  };
  var TONE_W = { soft: 9, neutral: 4, hard: -9 };

  function indices(date) {
    var act = E.activeTransits(natal, date);
    var out = {};
    Object.keys(INDEX_TARGETS).forEach(function (k) {
      var set = INDEX_TARGETS[k], v = 50;
      act.forEach(function (t) {
        if (set.indexOf(t.natal) < 0) { return; }
        var closeness = Math.max(0.2, 1 - t.orb / 10);
        v += (TONE_W[t.tone] || 0) * closeness * (t.applying ? 1 : 0.7);
      });
      out[k] = Math.max(5, Math.min(95, Math.round(v)));
    });
    return { values: out, transits: act };
  }

  /* --- Луна --------------------------------------------------------------- */
  function moonInfo(date) {
    var phaseAngle = A.MoonPhase(date);                 /* 0..360 */
    var idx = Math.floor(((phaseAngle + 22.5) % 360) / 45);
    var illum = A.Illumination('Moon', date).phase_fraction;
    var lon = E.bodyAt('Moon', date);
    var nextNew = A.SearchMoonPhase(0, date, 40);
    var nextFull = A.SearchMoonPhase(180, date, 40);
    return {
      angle: phaseAngle, phaseIndex: idx, illum: illum, sign: lon.sign,
      nextNew: nextNew ? nextNew.date : null,
      nextFull: nextFull ? nextFull.date : null
    };
  }

  function moonMonth(from) {
    var rows = [];
    for (var i = 0; i < 30; i++) {
      var d = new Date(from.getTime() + i * 86400000);
      var ph = A.MoonPhase(d);
      rows.push({
        date: d,
        phaseIndex: Math.floor(((ph + 22.5) % 360) / 45),
        illum: A.Illumination('Moon', d).phase_fraction,
        sign: E.bodyAt('Moon', d).sign
      });
    }
    return rows;
  }

  /* --- ретрограды и станции ----------------------------------------------
     Станцию ищем сканированием знака скорости по дням и уточняем делением. */
  var RETRO_BODIES = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
                      'Uranus', 'Neptune', 'Pluto'];

  function nextStation(body, from) {
    var step = 86400000;
    var prev = E.bodyAt(body, from).speed;
    for (var i = 1; i <= 400; i++) {
      var d = new Date(from.getTime() + i * step);
      var sp = E.bodyAt(body, d).speed;
      if ((prev < 0) !== (sp < 0)) {
        var a = from.getTime() + (i - 1) * step, b = d.getTime();
        for (var k = 0; k < 24; k++) {
          var m = (a + b) / 2;
          if ((E.bodyAt(body, new Date(a)).speed < 0) ===
              (E.bodyAt(body, new Date(m)).speed < 0)) { a = m; } else { b = m; }
        }
        return { date: new Date((a + b) / 2), toRetro: sp < 0 };
      }
      prev = sp;
    }
    return null;
  }

  /* --- вспомогательная разметка ------------------------------------------- */
  function fmtDeg(x) {
    var t = x.toFixed(2);
    return (window.APP_LANG === 'pl' ? t.replace('.', ',') : t) + '\u00B0';
  }
  function fmtDate(d) {
    var dd = d.getDate(), mm = d.getMonth() + 1;
    return (dd < 10 ? '0' : '') + dd + '.' + (mm < 10 ? '0' : '') + mm + '.' + d.getFullYear();
  }
  function fmtDateTime(d) {
    var h = d.getHours(), mi = d.getMinutes();
    return fmtDate(d) + ' ' + (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi;
  }
  function signName(s) { return T.signs[s.index]; }
  function pName(n) { return T.planets[n] || n; }

  function card(title, body, note) {
    return '<section class="card">' +
      (title ? '<h2 class="card__t">' + title + '</h2>' : '') + body +
      (note ? '<p class="note">' + note + '</p>' : '') + '</section>';
  }
  function cardWide(title, body, note) {
    return card(title, body, note).replace('class="card"', 'class="card card--wide"');
  }
  function table(head, rows) {
    return '<div class="tw"><table><thead><tr>' +
      head.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r) {
        return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function toneTag(t) {
    return '<span class="tag tag--' + t + '">' + T.toneWord[t] + '</span>';
  }

  /* Экран без данных не должен быть пустым: объясняем, что нужно, даём
     кнопку прямо в профиль и добавляем карточку, которая считается без
     персональных данных. */
  function needProfile(textKey) {
    return cardWide(T.ui.needTitle,
      '<p class="p">' + (T.ui[textKey] || T.ui.needText) + '</p>' +
      '<a class="btn btn--link" href="#profile">' + T.ui.needBtn + '</a>');
  }

  /* Небо на текущий момент. Не зависит от карты человека. */
  function skyNow() {
    var now = new Date();
    var rows = E.BODIES.concat(['Node']).map(function (b) {
      var p = E.bodyAt(b, now);
      return [pName(b), signName(p.sign), fmtDeg(p.sign.degree),
              p.retro ? '<span class="tag tag--hard">R</span>' : ''];
    });
    return card(T.ui.skyNow,
      table([T.ui.point, T.ui.sign, T.ui.deg, T.ui.retroCol], rows),
      T.ui.skyNote);
  }

  function moonCard() {
    var m = moonInfo(new Date());
    var ph = T.moonPhase[m.phaseIndex];
    return card(T.ui.moonTitle,
      '<div class="kv"><span>' + T.ui.phase + '</span><b>' + ph.n + '</b></div>' +
      '<div class="kv"><span>' + T.ui.illum + '</span><b>' +
        Math.round(m.illum * 100) + '%</b></div>' +
      '<div class="kv"><span>' + T.ui.moonSign + '</span><b>' + signName(m.sign) +
        ' ' + fmtDeg(m.sign.degree) + '</b></div>' +
      '<p class="p">' + ph.t + '</p>');
  }

  /* Композиционный текст транзита. */
  function transitText(t) {
    var tp = T.tPlanet[t.transit];
    if (!tp) { return ''; }
    return tp.subj + ' ' + T.tone[t.tone] + ' ' + T.nPoint[t.natal] +
           ' \u2014 ' + tp.theme + '. ' + tp.advice;
  }

  /* --- экраны ------------------------------------------------------------- */
  var views = {};

  views.today = function () {
    if (!natal) { return needProfile('needText') + moonCard() + skyNow(); }
    var now = new Date();
    var ix = indices(now);
    var m = moonInfo(now);
    var ph = T.moonPhase[m.phaseIndex];

    var bars = ['mood', 'work', 'love'].map(function (k) {
      var v = ix.values[k];
      return '<div class="bar"><div class="bar__r"><span>' + T.ui[k] +
        '</span><span>' + v + '%</span></div><div class="bar__t"><i style="width:' +
        v + '%"></i></div></div>';
    }).join('');

    var top = ix.transits.slice(0, 6).map(function (t) {
      return '<article class="tr"><div class="tr__h"><span class="tr__s"><b>' +
        pName(t.transit) + (t.retro ? ' R' : '') + '</b> ' + T.aspects[t.aspect] +
        ' <b>' + pName(t.natal) + '</b>' + toneTag(t.tone) + '</span>' +
        '<span class="tr__o">' + T.ui.orb + ' ' + fmtDeg(t.orb) + '</span></div>' +
        '<p class="tr__t">' + transitText(t) + '</p></article>';
    }).join('') || '<p class="empty">' + T.ui.noTransits + '</p>';

    return card(T.ui.indices, bars, T.ui.indicesNote) +
      card(T.ui.moonTitle,
        '<div class="kv"><span>' + T.ui.phase + '</span><b>' + ph.n + '</b></div>' +
        '<div class="kv"><span>' + T.ui.illum + '</span><b>' +
          Math.round(m.illum * 100) + '%</b></div>' +
        '<div class="kv"><span>' + T.ui.moonSign + '</span><b>' + signName(m.sign) +
          ' ' + fmtDeg(m.sign.degree) + '</b></div>' +
        '<p class="p">' + ph.t + '</p>') +
      cardWide(T.ui.activeTransits, top);
  };

  /* --- гороскоп: 6 периодов, читаемых как в референсе Astroscope ----------
     Переключатель периодов — «капсула» со скользящим градиентным индикатором
     (см. .segbar в app.css). Индикатор — постоянный DOM-узел: при клике по
     периоду мы не пересоздаём панель целиком (как делает route() для смены
     экрана), а двигаем этот же узел через inline-style, чтобы transition
     реально анимировал скольжение, а не перерисовывался мгновенно. */
  var HZ_FAST = ['Moon', 'Sun', 'Mercury', 'Venus', 'Mars'];
  var HZ_MED  = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  var HZ_SLOW = ['Sun', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  var HZ_PERIODS = [
    { key: 'today',    days: 1,   offset: 0, bodies: HZ_FAST, stepHours: 2 },
    { key: 'tomorrow', days: 1,   offset: 1, bodies: HZ_FAST, stepHours: 2 },
    { key: 'week',     days: 7,   offset: 0, bodies: HZ_MED,  stepHours: 12 },
    { key: 'month',    days: 31,  offset: 0, bodies: HZ_MED,  stepHours: 12 },
    { key: 'halfyear', days: 183, offset: 0, bodies: HZ_SLOW, stepHours: 24 },
    { key: 'year',     days: 365, offset: 0, bodies: HZ_SLOW, stepHours: 24 }
  ];
  /* Натальная точка -> раздел. Каждая точка ровно в одном разделе; всё, что
     не перечислено явно, попадает в «Общий обзор». */
  var HZ_CAT = { Venus: 'love', Saturn: 'career', MC: 'career', Mars: 'career',
                 Jupiter: 'luck', Node: 'luck' };
  var HZ_SECTIONS = [
    { key: 'general', icon: '✨' },
    { key: 'love', icon: '💕' },
    { key: 'career', icon: '💼' },
    { key: 'luck', icon: '🍀' }
  ];
  var hzPeriod = 'today';

  function hzPeriodData(key) {
    var p = HZ_PERIODS.filter(function (x) { return x.key === key; })[0] || HZ_PERIODS[0];
    var now = new Date();
    var from = new Date(now.getTime() + (p.offset || 0) * 86400000);
    var to = new Date(from.getTime() + p.days * 86400000);
    return E.transitEvents(natal, from, to, { bodies: p.bodies, stepHours: p.stepHours });
  }

  function hzContentHtml() {
    var ev = hzPeriodData(hzPeriod);
    var buckets = { general: [], love: [], career: [], luck: [] };
    ev.forEach(function (e) { buckets[HZ_CAT[e.natal] || 'general'].push(e); });
    hzLastBuckets = buckets;

    var cards = HZ_SECTIONS.map(function (s) {
      var list = buckets[s.key].slice(0, 3);
      var text = list.length
        ? list.map(function (e) {
            return transitText({ transit: e.transit, natal: e.natal, tone: e.tone });
          }).join(' ')
        : T.ui.hzQuiet;
      return '<article class="card hzcard hzcard--' + s.key + '" id="hz-' + s.key + '" data-section="' + s.key + '">' +
        '<div class="hzcard__h"><span class="hzcard__i">' + s.icon + '</span><h3 class="hzcard__t">' +
        T.ui['hz' + s.key.charAt(0).toUpperCase() + s.key.slice(1)] +
        '</h3></div><p class="p hzcard__text">' + text + '</p></article>';
    }).join('');

    return cards + cardWide(T.ui.exactDates, hzDatesHtml(ev));
  }

  /* Таблица точных дат — та же информация, что раньше, но строки кликабельны:
     разворачивают то же связное предложение (transitText), что уже есть в
     карточках выше, вместо сухих значений колонок. */
  function hzDatesHtml(ev) {
    var rows = ev.slice(0, 40);
    if (!rows.length) { return '<p class="empty">' + T.ui.noTransits + '</p>'; }
    var head = '<tr><th class="hzrow__chevCol"></th><th>' + T.ui.dateCol + '</th><th>' +
      T.ui.transitCol + '</th><th>' + T.ui.aspects + '</th><th>' + T.ui.point + '</th><th>' +
      T.ui.tone + '</th></tr>';
    var body = rows.map(function (e, i) {
      var main = '<tr class="hzrow" data-idx="' + i + '">' +
        '<td class="hzrow__chev">›</td>' +
        '<td>' + fmtDateTime(e.exactAt) + '</td>' +
        '<td>' + pName(e.transit) + '</td>' +
        '<td>' + T.aspects[e.aspect] + '</td>' +
        '<td>' + pName(e.natal) + '</td>' +
        '<td>' + toneTag(e.tone) + '</td></tr>';
      var detail = '<tr class="hzrow__d" data-idx="' + i + '" hidden><td colspan="6"><p class="p">' +
        transitText({ transit: e.transit, natal: e.natal, tone: e.tone }) + '</p></td></tr>';
      return main + detail;
    }).join('');
    return '<div class="tw"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
  }

  /* Разворачивает/сворачивает строку с транзитом в таблице точных дат. */
  function bindHzRows() {
    var body = el('hzBody');
    if (!body) { return; }
    Array.prototype.slice.call(body.querySelectorAll('.hzrow')).forEach(function (tr) {
      tr.addEventListener('click', function () {
        var idx = tr.getAttribute('data-idx');
        var d = body.querySelector('.hzrow__d[data-idx="' + idx + '"]');
        if (!d) { return; }
        d.hidden = !d.hidden;
        tr.classList.toggle('hzrow--open', !d.hidden);
      });
    });
  }

  /* Позиционирует скользящий индикатор под активной кнопкой периода.
     skipAnim=true — мгновенно (первый рендер экрана), иначе — с transition
     (клик по другому периоду на уже отрисованной панели). */
  function positionHzIndicator(skipAnim) {
    var bar = el('segbar'), ind = el('segbarInd');
    if (!bar || !ind) { return; }
    var btn = bar.querySelector('.segbar__b.on');
    if (!btn) { return; }
    if (skipAnim) { ind.style.transition = 'none'; }
    ind.style.width = btn.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
    if (skipAnim) {
      void ind.offsetWidth;
      ind.style.transition = '';
    }
  }

  /* --- ИИ-озвучка карточек гороскопа ---------------------------------------
     Композиционный текст (transitText) рендерится сразу и служит фолбэком.
     Параллельно уходит запрос к воркеру на Cloudflare (см. cf-worker/), тот
     дергает бесплатный Groq API и возвращает связный текст по тем же фактам
     — если он ответит вовремя, подменяем параграф; если нет (сеть, лимит
     Groq, воркер недоступен) — молча остаёмся на композиционном тексте.
     Кэш в localStorage на календарный день не даёт дёргать API повторно
     при каждом заходе на вкладку. */
  var AI_URL = 'https://astromap-horoscope-ai.egorrut3030.workers.dev';
  var hzLastBuckets = null;
  var hzAiSeq = 0;

  function hzCacheKey(period, lang) {
    var d = new Date();
    return 'hzai:' + lang + ':' + period + ':' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function applyHzSections(sections, mySeq) {
    if (mySeq !== hzAiSeq) { return; } /* пользователь уже переключил период/экран */
    var body = el('hzBody');
    if (!body) { return; }
    ['general', 'love', 'career', 'luck'].forEach(function (k) {
      if (!sections[k]) { return; }
      var card = body.querySelector('.hzcard[data-section="' + k + '"]');
      if (!card) { return; }
      var p = card.querySelector('.hzcard__text');
      if (p) { p.textContent = sections[k]; }
      card.classList.add('hzcard--ai');
    });
  }

  function hzAiEnhance(period) {
    if (!hzLastBuckets || !AI_URL || AI_URL.indexOf('REPLACE_ME') >= 0) { return; }
    var lang = window.APP_LANG || 'en';
    var cacheKey = hzCacheKey(period, lang);
    var mySeq = ++hzAiSeq;
    try {
      var cached = localStorage.getItem(cacheKey);
      if (cached) { applyHzSections(JSON.parse(cached), mySeq); return; }
    } catch (e) {}

    var payload = { lang: lang, period: period, buckets: {} };
    ['general', 'love', 'career', 'luck'].forEach(function (k) {
      payload.buckets[k] = hzLastBuckets[k].slice(0, 3).map(function (e) {
        return { transit: e.transit, natal: e.natal, aspect: e.aspect, tone: e.tone };
      });
    });

    fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.sections) { return; }
        try { localStorage.setItem(cacheKey, JSON.stringify(data.sections)); } catch (e) {}
        applyHzSections(data.sections, mySeq);
      })
      .catch(function () {});
  }

  views.horoscope = function () {
    if (!natal) { return needProfile('needText') + skyNow() + moonCard(); }
    var tabs = HZ_PERIODS.map(function (p) {
      return '<button class="segbar__b' + (hzPeriod === p.key ? ' on' : '') +
        '" data-period="' + p.key + '"><span class="segbar__t">' +
        T.ui.period[p.key] + '</span></button>';
    }).join('');
    var quick = HZ_SECTIONS.map(function (s) {
      return '<a href="#hz-' + s.key + '" class="hzquick__b" data-jump="hz-' + s.key + '">' +
        '<span class="hzquick__i">' + s.icon + '</span>' +
        T.ui['hz' + s.key.charAt(0).toUpperCase() + s.key.slice(1)] + '</a>';
    }).join('');
    return '<div class="hzhead card--wide"><div class="segbar" id="segbar">' +
      '<span class="segbar__ind" id="segbarInd"></span>' + tabs + '</div></div>' +
      '<div class="hzquick card--wide" id="hzquick">' + quick + '</div>' +
      '<div class="hz card--wide" id="hzBody">' + hzContentHtml() + '</div>';
  };

  views.chart = function () {
    if (!natal) { return needProfile('needText') + skyNow(); }
    var pts = natal.points.concat(natal.asc ? [natal.asc, natal.mc] : []);
    var rows = pts.map(function (p) {
      return [pName(p.name), signName(p.sign), fmtDeg(p.sign.degree),
              p.house || '\u2014',
              p.speed ? p.speed.toFixed(3) : '\u2014',
              p.retro ? '<span class="tag tag--hard">R</span>' : ''];
    });
    var asp = E.chartAspects(natal).slice(0, 16).map(function (x) {
      return [pName(x.a), T.aspects[x.data.aspect], pName(x.b),
              fmtDeg(x.data.orb), toneTag(x.data.tone)];
    });
    var b = natal.balance;
    var bal = '<div class="cols2">' +
      '<div><div class="card__t2">' + T.ui.elements + '</div>' +
        Object.keys(b.elements).map(function (k) {
          return '<div class="kv"><span>' + T.elements[k] + '</span><b>' +
            b.elements[k] + '</b></div>';
        }).join('') + '</div>' +
      '<div><div class="card__t2">' + T.ui.modes + '</div>' +
        Object.keys(b.modes).map(function (k) {
          return '<div class="kv"><span>' + T.modes[k] + '</span><b>' +
            b.modes[k] + '</b></div>';
        }).join('') + '</div></div>';

    var reads = ['Sun', 'Moon', 'Venus', 'Mars', 'Saturn'].map(function (k) {
      var p = natal.byName[k];
      if (!p) { return ''; }
      var txt = T.planetElement[k] && T.planetElement[k][p.sign.element];
      if (!txt) { return ''; }
      return '<article class="tr"><div class="tr__h"><span class="tr__s"><b>' +
        pName(k) + '</b> ' + signName(p.sign) + '</span></div><p class="tr__t">' +
        txt + '</p></article>';
    }).join('');

    return '<div class="wheelbox">' + W.render(natal, 520) + '</div>' +
      (natal.asc ? '' : card(null, '<p class="empty">' + T.ui.timeMissing + '</p>')) +
      card(T.ui.positions, table([T.ui.point, T.ui.sign, T.ui.deg, T.ui.house,
                                  T.ui.motion, T.ui.retroCol], rows)) +
      card(T.ui.balance, bal) +
      card(null, reads) +
      card(T.ui.aspects, table(['A', T.ui.aspects, 'B', T.ui.orb, T.ui.tone], asp));
  };

  views.match = function () {
    if (!natal) {
      return needProfile('needTextMatch') +
        card(T.ui.matchIntro, '<p class="p">' + T.ui.matchIntroText + '</p>');
    }
    var form = personForm('partner', S.partner);
    if (!partnerChart) {
      return card(T.ui.partnerTitle,
          '<p class="p">' + T.ui.needTextMatch.replace(/^[^.]*\.\s*/, '') + '</p>' + form) +
        card(T.ui.matchIntro, '<p class="p">' + T.ui.matchIntroText + '</p>');
    }
    var syn = E.synastry(natal, partnerChart);
    var comp = E.composite(natal, partnerChart);

    var hits = syn.top.map(function (h) {
      return [pName(h.a), T.aspects[h.aspect], pName(h.b), fmtDeg(h.orb),
              toneTag(h.tone), h.importance];
    });
    var cpts = comp.points.concat(comp.asc ? [comp.asc, comp.mc] : []).map(function (p) {
      return [pName(p.name), signName(p.sign), fmtDeg(p.sign.degree)];
    });

    return card(T.ui.index,
        '<div class="score"><div class="score__n">' + syn.score + '%</div>' +
        '<div class="score__b"><i style="width:' + syn.score + '%"></i></div></div>',
        T.ui.indexNote) +
      card(T.ui.strongest, table(['A', T.ui.aspects, 'B', T.ui.orb, T.ui.tone,
                                  T.ui.weight], hits)) +
      card(T.ui.composite, table([T.ui.point, T.ui.sign, T.ui.deg], cpts),
           T.ui.compositeNote) +
      card(T.ui.partnerTitle, form);
  };

  views.numbers = function () {
    if (!S.profile) {
      /* Справочник значений вместо пустоты: он не требует данных человека
         и объясняет, что вообще будет посчитано. */
      var ref = Object.keys(T.numbers).map(function (k) {
        return '<article class="num num--sm"><div class="num__v">' + k + '</div>' +
          '<div class="num__c"><p class="num__t">' + T.numbers[k] + '</p></div></article>';
      }).join('');
      return needProfile('needTextNum') + cardWide(T.ui.numbersRef, ref);
    }
    var n = N.full(S.profile, new Date());
    function block(key, label, obj) {
      if (!obj) { return ''; }
      var v = obj.value;
      var extra = '';
      if (obj.master) { extra += '<span class="tag tag--soft">' + T.ui.master + '</span>'; }
      (obj.karmic || []).forEach(function (k) {
        extra += '<span class="tag tag--hard">' + T.ui.karmic + ' ' + k + '</span>';
      });
      return '<article class="num"><div class="num__v">' + v + '</div>' +
        '<div class="num__c"><div class="num__l">' + label + ' ' + extra + '</div>' +
        '<p class="num__d">' + (T.numCategory[key] || '') + '</p>' +
        '<p class="num__t">' + (T.numbers[v] || '') + '</p>' +
        ((obj.karmic || []).map(function (k) {
          return '<p class="num__k">' + (T.karmicText[k] || '') + '</p>';
        }).join('')) + '</div></article>';
    }
    var core = block('lifePath', T.ui.lifePath, n.lifePath) +
      block('birthday', T.ui.birthdayN, n.birthday) +
      block('expression', T.ui.expression, n.expression) +
      block('soul', T.ui.soul, n.soul) +
      block('personality', T.ui.personalityN, n.personality) +
      block('maturity', T.ui.maturity, n.maturity);
    var cycles = block('personalYear', T.ui.pYear, n.personalYear) +
      block('personalMonth', T.ui.pMonth, n.personalMonth) +
      block('personalDay', T.ui.pDay, n.personalDay);

    return card(T.ui.numbersTitle, core,
        (S.profile.name ? '' : T.ui.nameNeeded)) +
      card(T.ui.pYear, cycles);
  };

  views.moon = function () {
    var now = new Date();
    var m = moonInfo(now);
    var rows = moonMonth(now).map(function (r) {
      return [fmtDate(r.date), T.moonPhase[r.phaseIndex].n,
              Math.round(r.illum * 100) + '%',
              signName(r.sign) + ' ' + fmtDeg(r.sign.degree)];
    });
    return card(T.ui.moonTitle,
        '<div class="kv"><span>' + T.ui.phase + '</span><b>' +
          T.moonPhase[m.phaseIndex].n + '</b></div>' +
        '<div class="kv"><span>' + T.ui.nextNew + '</span><b>' +
          (m.nextNew ? fmtDateTime(m.nextNew) : '\u2014') + '</b></div>' +
        '<div class="kv"><span>' + T.ui.nextFull + '</span><b>' +
          (m.nextFull ? fmtDateTime(m.nextFull) : '\u2014') + '</b></div>' +
        '<p class="p">' + T.moonPhase[m.phaseIndex].t + '</p>') +
      card(null, table([T.ui.dateCol, T.ui.phase, T.ui.illum, T.ui.moonSign], rows));
  };

  views.retro = function () {
    var now = new Date();
    var cur = [], soon = [];
    RETRO_BODIES.forEach(function (b) {
      var p = E.bodyAt(b, now);
      var st = nextStation(b, now);
      if (p.retro) {
        cur.push('<article class="tr"><div class="tr__h"><span class="tr__s"><b>' +
          pName(b) + '</b>' + toneTag('hard') + '</span><span class="tr__o">' +
          (st ? T.ui.stationing + ': ' + fmtDate(st.date) + ' \u2192 ' + T.ui.direct : '') +
          '</span></div><p class="tr__t">' + (T.retro[b] || '') + '</p></article>');
      } else if (st) {
        soon.push([pName(b), fmtDate(st.date),
                   st.toRetro ? T.ui.retrograde : T.ui.direct]);
      }
    });
    return card(T.ui.retroTitle, cur.join('') ||
        '<p class="empty">' + T.ui.noRetro + '</p>') +
      card(T.ui.stationing, table([T.ui.point, T.ui.dateCol, T.ui.motion], soon));
  };

  function personForm(kind, p) {
    p = p || {};
    var cur = (p.city && p.city.n) || (CITIES[p.cityIdx] && CITIES[p.cityIdx].n) || '';
    var known = CITIES.some(function (c) { return c.n === cur; });
    var cityOpts = (known || !cur ? '' :
        '<option value="-1" selected>' + esc(cur) + '</option>') +
      CITIES.map(function (c, i) {
        return '<option value="' + i + '"' +
          (c.n === cur ? ' selected' : '') + '>' + esc(c.n) + '</option>';
      }).join('');
    return '<form class="form" data-kind="' + kind + '">' +
      '<label class="f"><span>' + T.ui.partnerName + '</span>' +
        '<input name="name" value="' + esc(p.name || '') + '" autocomplete="off"></label>' +
      '<label class="f"><span>' + T.ui.date + '</span>' +
        '<input name="date" type="date" value="' + (p.y ?
          p.y + '-' + (p.m < 10 ? '0' : '') + p.m + '-' + (p.d < 10 ? '0' : '') + p.d : '') +
        '"></label>' +
      '<label class="f"><span>' + T.ui.time + '</span>' +
        '<input name="time" type="time" value="' + (p.timeKnown ?
          ((p.h < 10 ? '0' : '') + p.h + ':' + (p.min < 10 ? '0' : '') + p.min) : '') +
        '"></label>' +
      '<label class="f"><span>' + T.ui.city + '</span>' +
        '<select name="city">' + cityOpts + '</select></label>' +
      '<button class="btn" type="submit">' +
        (kind === 'partner' ? T.ui.partnerAdd : T.ui.save) + '</button>' +
      '</form>';
  }

  views.profile = function () {
    var body = '<p class="p">' + T.ui.profileIntro + '</p>' +
               personForm('profile', S.profile);
    var info = '';
    if (natal) {
      info = '<div class="kv"><span>' + T.ui.sign + '</span><b>' +
        signName(natal.byName.Sun.sign) + '</b></div>' +
        '<div class="kv"><span>' + T.planets.Moon + '</span><b>' +
        signName(natal.byName.Moon.sign) + '</b></div>' +
        (natal.asc ? '<div class="kv"><span>' + T.planets.ASC + '</span><b>' +
          signName(natal.asc.sign) + '</b></div>' : '');
    }
    var getList = '<ul class="list">' + T.ui.getList.map(function (x) {
      return '<li>' + x + '</li>';
    }).join('') + '</ul>';

    return card(T.ui.profileTitle, body,
        S.profile && !S.profile.timeKnown ? T.ui.timeMissing : '') +
      (info ? card(T.ui.positions, info) : card(T.ui.whatYouGet, getList)) +
      (S.profile ? '' : skyNow());
  };

  /* --- роутер ------------------------------------------------------------- */
  var ORDER = ['today', 'horoscope', 'chart', 'match', 'numbers', 'moon', 'retro', 'profile'];

  function route() {
    /* Без данных открываем профиль: остальные экраны без него не считаются. */
    var fallback = S.profile ? 'today' : 'profile';
    var h = (location.hash || ('#' + fallback)).slice(1);
    if (ORDER.indexOf(h) < 0) { h = fallback; }
    document.querySelectorAll('.nav__i').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('href') === '#' + h);
    });
    el('title').textContent = T.ui[h + 'Title'] || T.ui.nav[h];
    var view = el('view');
    view.innerHTML = views[h]();
    /* Перезапуск CSS-анимации: снять класс, форсировать reflow, вернуть класс.
       Без чтения offsetWidth браузер схлопнёт снятие+возврат в один кадр. */
    view.classList.remove('fade-in');
    void view.offsetWidth;
    view.classList.add('fade-in');
    if (h === 'horoscope') { positionHzIndicator(true); hzAiEnhance(hzPeriod); }
    window.scrollTo(0, 0);
    bind();
  }

  function bind() {
    var f = document.querySelector('.form');
    if (f) {
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var kind = f.dataset.kind;
        var dv = f.date.value, tv = f.time.value;
        if (!dv) { return; }
        var dp = dv.split('-').map(Number);
        var tp = tv ? tv.split(':').map(Number) : null;
        var obj = {
          name: f.name.value.trim(),
          y: dp[0], m: dp[1], d: dp[2],
          h: tp ? tp[0] : null, min: tp ? tp[1] : null,
          timeKnown: !!tp,
          /* -1 = город из другого языкового списка, оставляем прежний объект */
          city: (+f.city.value >= 0)
            ? CITIES[+f.city.value]
            : ((kind === 'profile' ? S.profile : S.partner) || {}).city
        };
        var first = (kind === 'profile') && !S.profile;
        if (kind === 'profile') { S.profile = obj; } else { S.partner = obj; }
        save(); recalc();
        /* Первое сохранение профиля — сразу показываем, что получилось. */
        if (first) { location.hash = '#today'; } else { route(); }
      });
    }
    Array.prototype.slice.call(document.querySelectorAll('.hzquick__b')).forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var target = document.getElementById(a.getAttribute('data-jump'));
        if (!target) { return; }
        var y = target.getBoundingClientRect().top + window.pageYOffset - 96;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
    bindHzRows();

    Array.prototype.slice.call(document.querySelectorAll('[data-period]')).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('on')) { return; }
        hzPeriod = b.dataset.period;
        Array.prototype.slice.call(document.querySelectorAll('[data-period]')).forEach(function (x) {
          x.classList.toggle('on', x === b);
        });
        positionHzIndicator(false);
        var body = el('hzBody');
        if (body) {
          body.innerHTML = hzContentHtml();
          body.classList.remove('fade-in');
          void body.offsetWidth;
          body.classList.add('fade-in');
        }
        bindHzRows();
        hzAiEnhance(hzPeriod);
      });
    });
  }

  /* --- старт -------------------------------------------------------------- */
  load();
  recalc();

  document.querySelectorAll('[data-t]').forEach(function (n) {
    var path = n.getAttribute('data-t').split('.');
    var v = path.reduce(function (o, k) { return o ? o[k] : null; }, T);
    if (typeof v === 'string') { n.textContent = v; }
  });
  el('disc').textContent = T.ui.disclaimer;

  /* Переключатель языка. Перезагружаем страницу вместо горячей замены:
     тексты и список городов подставляются на старте, и точечная подмена
     оставила бы часть экрана на прежнем языке. Хеш сохраняется. */
  Array.prototype.slice.call(document.querySelectorAll('.lang__b')).forEach(function (b) {
    b.classList.toggle('on', b.dataset.lang === window.APP_LANG);
    b.addEventListener('click', function () {
      if (b.dataset.lang === window.APP_LANG) { return; }
      try { localStorage.setItem('astromap.lang', b.dataset.lang); } catch (e) {}
      location.reload();
    });
  });

  /* Мобильное меню: капсула навигации сворачивается в гамбургер ниже 900px
     (см. media-запрос в app.css). Пункты те же .nav__i, что и в капсуле —
     router выше уже переключает .on сразу на обоих наборах. */
  (function () {
    var burger = el('burger'), menu = el('mnav');
    if (!burger || !menu) { return; }
    function close() {
      menu.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      if (open) { close(); return; }
      menu.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
    });
    Array.prototype.slice.call(menu.querySelectorAll('.nav__i')).forEach(function (a) {
      a.addEventListener('click', close);
    });
    window.addEventListener('hashchange', close);
  })();

  /* На ресайзе переизмеряем ширину/позицию активной кнопки периода —
     .segbar не пересоздаётся при resize, но её кнопки могут менять размер. */
  window.addEventListener('resize', function () {
    if (location.hash === '#horoscope') { positionHzIndicator(true); }
  });

  window.addEventListener('hashchange', route);
  route();
})();
