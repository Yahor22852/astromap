/* app.js — оболочка веб-продукта: состояние, роутер, экраны.
   Всё считается в браузере. Данные никуда не отправляются.

   СТЫК С ВОРОНКОЙ: если у продукта ещё нет своего состояния, он забирает
   данные, введённые в воронке (ключ astromap.funnel). Так человек после
   оплаты не вводит дату второй раз. */
(function () {
  'use strict';

  var E = window.Engine, N = window.Numerology, T = window.T, W = window.Wheel;
  var Moon = window.Moon, R = window.Retro, Clock = window.Clock, Tr = window.Transits, TL = window.Timeline;
  var A = window.Astronomy;
  var CITIES_ALL = window.CITIES_ALL, COUNTRY_NAMES = window.COUNTRY_NAMES;
  var TZ = window.TZ;

  var KEY = 'astromap.app';
  /* --- гейт доступа (оплата на Gumroad) -----------------------------------
     Продукт целиком закрыт лицензионным ключом: пока не подтверждён через
     воркер license-verify.js (см. cf-worker/), показывается только #gate —
     #shell со всем приложением остаётся [hidden]. Оба URL ниже пустые до
     настройки: LICENSE_API — обязателен (без него разблокировать нечем),
     GATE_CHECKOUT_URL — необязателен, просто прячет ссылку «ещё нет
     доступа», если её некуда вести. */
  var LICENSE_API = 'https://astromap-license-verify.egorrut3030.workers.dev';
  var GATE_CHECKOUT_URL = 'https://rubyalex5.gumroad.com/l/astromap?wanted=true';
  /* Управление подпиской для тех, у кого доступ уже есть (раздел #settings).
     Это НЕ чекаут: у Gumroad это отдельный адрес, где отменяют и меняют
     карту. Пока пусто, кнопки нет, а вместо неё строка о том, где искать
     ссылку, — мёртвая кнопка «управлять подпиской» хуже её отсутствия. */
  var MANAGE_URL = ''; /* TODO: ссылка на управление подпиской Gumroad */
  var ACCESS_KEY = 'astromap.access';
  var ACCESS_REVALIDATE_MS = 24 * 3600 * 1000; /* не чаще раза в сутки дёргаем воркер повторно на уже открытой сессии */
  /* Обход гейта для разработки: открыть product/?dev=<DEV_WORD> один раз —
     флаг ляжет в localStorage, параметр из адреса уберётся, и дальше продукт
     открывается по обычной ссылке на этом браузере. Снять: ?dev=off.
     Это НЕ защита (весь гейт клиентский и обходится через devtools) — просто
     чтобы не упираться в форму, пока Gumroad и воркер не настроены. */
  var DEV_WORD = 'zodiac-dev-7714';
  var DEV_KEY = 'astromap.dev';
  /* Языки, где принят десятичная запятая вместо точки (все добавленные,
     кроме английского) — используется в fmtDeg(). Локали Intl для дат
     календаря Луны и заголовков (moonLocale()) — свои полные коды. */
  var COMMA_DECIMAL = { pl: 1, ru: 1, uk: 1, de: 1, es: 1, fr: 1, it: 1, pt: 1, tr: 1 };
  var LOCALE_MAP = {
    en: 'en-US', pl: 'pl-PL', ru: 'ru-RU', uk: 'uk-UA', de: 'de-DE',
    es: 'es-ES', fr: 'fr-FR', it: 'it-IT', pt: 'pt-BR', tr: 'tr-TR'
  };
  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  };

  /* --- состояние ---------------------------------------------------------- */
  var S = { profile: null, partner: null, focus: [] };

  /* Области, на которые может указывать фокус. Совпадают с ключами
     AREA_POINTS в transits.js — там же лежат точки карты каждой области. */
  var FOCUS_AREAS = ['love', 'career', 'inner', 'self'];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { S = JSON.parse(raw); return; }
    } catch (e) { console.error('astromap: чтение состояния', e); }
    /* Импорт из воронки — единственный раз, при первом входе после оплаты.
       Воронка кладёт сюда сам объект города {n,lat,lon,tz,dst} (см. flow.js,
       persist()) — раньше передавался только числовой cityIdx, который
       годился только пока у продукта был тот же список городов, что и у
       воронки. После перехода продукта на мировую базу (CITIES_ALL) эти
       индексы разошлись, и импорт молча падал в catch ниже. Города воронки
       используют тот же числовой tz (не IANA-строку) — cityOf() в продукте
       уже понимает оба формата через typeof city.tz. */
    try {
      var f = localStorage.getItem('astromap.funnel');
      if (f) {
        var p = JSON.parse(f);
        if (p && p.dob && p.dob.y) {
          var srcCity = (p.city && typeof p.city.tz !== 'undefined') ? p.city :
            { n: '', lat: null, lon: null, tz: 0, dst: '' };
          S.profile = {
            name: '', y: p.dob.y, m: p.dob.m, d: p.dob.d,
            h: (p.time && p.time.known) ? p.time.h : null,
            min: (p.time && p.time.known) ? p.time.min : null,
            timeKnown: !!(p.time && p.time.known),
            city: srcCity
          };
          /* ФОКУС ИЗ ВОРОНКИ. Темы, которые человек выбирал на втором
             экране, до сих пор сохранялись и не читались здесь ни разу —
             то есть вопрос задавался и забывался. Теперь они приходят сюда
             и влияют на то, что показано первым: в «Сегодня» появляется
             блок по фокусу, а проводник транзитов открывается на нужной
             области. Ключи воронки и области продукта совпадают, кроме
             двух — их и переводим. */
          if (Array.isArray(p.themes) && p.themes.length) {
            S.focus = p.themes.map(function (t) {
              return t === 'money' ? 'career' : (t === 'calm' ? 'inner' : t);
            }).filter(function (t) { return FOCUS_AREAS.indexOf(t) >= 0; });
          }
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
    /* Город хранится объектом, а не индексом (значение переживает и смену
       языка интерфейса, и переход на большую мировую базу CITIES_ALL).
       lat/lon могут отсутствовать (null) — это ручной ввод «не нашёл свой
       город»: считаем планеты по указанному смещению UTC, но не считаем
       Асцендент/дома, для которых нужны реальные координаты (chart() в
       engine.js уже сам пропускает angles(), когда lat не число). Совсем
       старые записи с cityIdx (до перехода на встроенный объект) сослаться
       им больше не на что — уходят на нейтральный UTC+0. */
    if (p.city && typeof p.city.tz !== 'undefined') { return p.city; }
    var c = { n: '', lat: null, lon: null, tz: 0, dst: '' };
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

  /* Поиск станций переехал в retro.js вместе со всем расчётом циклов:
     там же считаются теневые периоды и прогресс, а раздел «Ретрограды»
     берёт всё оттуда. Отдельная копия nextStation() в app.js была бы вторым
     источником тех же дат. */

  /* --- вспомогательная разметка ------------------------------------------- */
  function fmtDeg(x) {
    var t = x.toFixed(2);
    return (COMMA_DECIMAL[window.APP_LANG] ? t.replace('.', ',') : t) + '\u00B0';
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
  /* Оборот -> самостоятельное предложение: заглавная и точка в конце, если
     её нет. Работает и для кириллицы, и для латиницы; языки без заглавных
     букв (в продукте таких нет) toUpperCase просто оставит как есть. */
  function sentence(str) {
    var t = String(str || '').trim();
    if (!t) { return ''; }
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return /[.!?…]$/.test(t) ? t : t + '.';
  }

  /* --- подсказки по терминам ------------------------------------------------
     Орбис, транзит, натал, станция, тень — слова, без которых продукт не
     объяснить, и за которыми новичку пришлось бы уходить в поиск. Подсказка
     открывается на месте.

     Всплывающая панель одна на весь документ и лежит в <body> с position:
     fixed — а не рядом со словом. Внутри карточек и таблиц есть контейнеры
     с overflow, и любая панель, вложенная в разметку раздела, обрезалась бы
     их краем. Отсюда же и доступность: aria-describedby связывает слово с
     панелью, Esc и клик мимо закрывают.

     Термин — это <button>, поэтому размечать им слово внутри другой кнопки
     нельзя: вложенные кнопки — невалидная разметка и ломают клик по строке.
     Поэтому термины стоят только в заголовках и в панели «откуда известно»,
     где строка не является кнопкой целиком. */
  var termPop = null, termOpen = null;

  function termHtml(key, label) {
    return '<button type="button" class="term" data-term="' + key + '">' +
      label + '<span class="term__i" aria-hidden="true">?</span></button>';
  }

  function termEnsurePop() {
    if (termPop) { return termPop; }
    termPop = document.createElement('div');
    termPop.className = 'termpop';
    termPop.id = 'termPop';
    termPop.setAttribute('role', 'tooltip');
    termPop.hidden = true;
    document.body.appendChild(termPop);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { termHide(); }
    });
    document.addEventListener('click', function (ev) {
      if (!termOpen) { return; }
      if (ev.target.closest && (ev.target.closest('.term') || ev.target.closest('.termpop'))) { return; }
      termHide();
    });
    window.addEventListener('resize', termHide);
    /* Раньше здесь тоже стоял termHide: любая прокрутка закрывала пояснение.
       На десктопе это незаметно, на телефоне — ломает функцию целиком. Тап
       по слову почти всегда сопровождается микропрокруткой (инерция пальца,
       сворачивание адресной строки при первом касании), и подсказка гасла
       в тот же кадр, в котором открылась. Теперь она едет за словом и
       закрывается, только когда само слово уходит с экрана. */
    window.addEventListener('scroll', function () {
      if (!termOpen) { return; }
      var r = termOpen.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { termHide(); return; }
      termPlace(termOpen);
    }, true);
    return termPop;
  }

  function termHide() {
    if (!termPop) { return; }
    termPop.hidden = true;
    if (termOpen) {
      termOpen.setAttribute('aria-expanded', 'false');
      termOpen.removeAttribute('aria-describedby');
      termOpen = null;
    }
  }

  function termShow(btn) {
    var key = btn.getAttribute('data-term');
    var text = T.sec.terms[key];
    if (!text) { return; }
    var pop = termEnsurePop();
    pop.textContent = text;
    pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-describedby', 'termPop');
    termOpen = btn;

    termPlace(btn);
  }

  /* Позиционируем под словом и прижимаем к краям окна: у самой границы
     экрана панель иначе уезжает за него. Вынесено из termShow отдельно,
     потому что то же самое нужно на каждой прокрутке. */
  function termPlace(btn) {
    var pop = termPop;
    if (!pop || pop.hidden) { return; }
    var r = btn.getBoundingClientRect();
    var w = Math.min(300, window.innerWidth - 24);
    pop.style.width = w + 'px';
    var left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
    var top = r.bottom + 8;
    if (top + pop.offsetHeight > window.innerHeight - 12) {
      top = Math.max(12, r.top - pop.offsetHeight - 8);
    }
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  function bindTerms(scope) {
    if (!scope) { return; }
    Array.prototype.slice.call(scope.querySelectorAll('[data-term]')).forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (termOpen === b) { termHide(); } else { termHide(); termShow(b); }
      });
    });
  }

  /* --- состояние расчёта ----------------------------------------------------
     Переключение периода гороскопа на «Год» блокирует поток на 600 мс, на
     «Полгода» — на 280 мс: расчёт синхронный, и всё это время интерфейс не
     перерисовывается вовсе — не успевает даже подсветиться нажатая кнопка.
     Показываем, что идёт счёт, и отдаём кадр браузеру, прежде чем считать.

     Два requestAnimationFrame подряд — не суеверие: первый ставит колбэк на
     ближайший кадр, но сама отрисовка происходит после него, поэтому
     запускать блокирующий расчёт нужно со второго. Задержек не добавляем:
     ждём ровно один кадр. */
  function busyHtml() {
    return '<div class="busy" role="status"><span class="busy__dot"></span>' +
      '<span class="busy__dot"></span><span class="busy__dot"></span>' +
      '<span class="busy__t">' + T.sec.calculating + '</span></div>';
  }

  function withBusy(node, work) {
    if (!node) { work(); return; }
    node.innerHTML = busyHtml();
    requestAnimationFrame(function () {
      requestAnimationFrame(work);
    });
  }

  function toneTag(t) {
    return '<span class="tag tag--' + t + '">' + T.toneWord[t] + '</span>';
  }

  /* --- общая панель даты ----------------------------------------------------
     Один элемент управления временем на все разделы: он читает и меняет
     Clock (см. clock.js), а раздел только перерисовывает себя после этого.
     Раньше такая панель жила внутри Ретроградов; Луне понадобилась такая же,
     и второй копии быть не должно.

     data-clockjump принимает метку времени в миллисекундах и переносит на
     точный момент — по нему работают и ключевые даты цикла в Ретроградах, и
     ближайшие фазы в Луне. */
  function localeDate(d) {
    return new Intl.DateTimeFormat(moonLocale(),
      { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  }
  function shortDate(d) {
    var dd = d.getDate(), mm = d.getMonth() + 1;
    return (dd < 10 ? '0' : '') + dd + '.' + (mm < 10 ? '0' : '') + mm;
  }
  function clockTime(d) {
    var h = d.getHours(), mi = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi;
  }

  function dateBarHtml() {
    return '<div class="datebar">' +
      '<button type="button" class="datebar__nav" data-clockstep="-1" aria-label="' +
        esc(T.ui.prevMonth) + '">←</button>' +
      '<span class="datebar__d">' + localeDate(Clock.get()) + '</span>' +
      '<button type="button" class="datebar__nav" data-clockstep="1" aria-label="' +
        esc(T.ui.nextMonth) + '">→</button>' +
      (Clock.isToday() ? '' :
        '<button type="button" class="datebar__today" data-clocktoday="1">' + T.sec.today + '</button>') +
      '</div>';
  }

  /* --- общий персональный слой ---------------------------------------------
     «Где это идёт по моей карте и чего касается» — один и тот же вопрос в
     Ретроградах, в Луне и во всём, что появится дальше. Разметка ответа тоже
     должна быть одна, иначе дом в одном разделе и дом в другом начнут
     выглядеть по-разному без всякой причины.

     Дом показывается только при известном времени рождения; вместо него
     честная строка о том, что дома не рассчитаны, а не выдуманный номер. */
  function personalHtml(body) {
    var c = E.contactsFor(natal, body, Clock.get());
    if (!c) { return ''; }
    var houseHtml = c.house
      ? '<div class="phouse"><span class="phouse__n">' + T.houses[c.house].n + '</span>' +
        '<span class="phouse__t">' + T.houses[c.house].t + '</span></div>'
      : '<p class="pmuted">' + T.sec.houseUnknown + '</p>';

    var asp = c.aspects.slice(0, 4);
    var aspHtml = asp.length ? '<ul class="pasp">' + asp.map(function (a) {
      return '<li class="pasp__i"><button type="button" class="pasp__b" data-gopoint="' + a.natal + '">' +
        '<span class="pasp__main">' + T.aspects[a.aspect] + ' <b>' + pName(a.natal) + '</b></span>' +
        toneTag(a.tone) +
        '<span class="pasp__meta">' + T.sec.orb + ' ' + fmtDeg(a.orb) + ' · ' +
          (a.applying ? T.sec.applying : T.sec.separating) + '</span>' +
        '<span class="pasp__go" aria-hidden="true">›</span></button></li>';
    }).join('') + '</ul>' : '<p class="pmuted">' + T.sec.noContacts + '</p>';

    /* Живой слой просим после отрисовки: сам блок должен появиться сразу,
       а объяснение дописаться, когда придёт. */
    if (c.house) { setTimeout(function () { houseAiEnhance(body, c.house, c.aspects); }, 0); }
    return '<h3 class="pcard__t">' + termHtml('house', T.sec.house) + '</h3>' + houseHtml +
      '<h3 class="pcard__t pcard__t--gap">' + T.sec.contacts + '</h3>' + aspHtml +
      '<div class="acts"><button type="button" class="act" data-gochart="' + body + '">' +
        T.sec.openChart + '</button></div>';
  }

  function personalNeedHtml() {
    return '<p class="p">' + T.sec.needProfile + '</p>' +
      '<a class="btn btn--link" href="#profile">' + T.ui.needBtn + '</a>';
  }

  /* Переходы в карту одинаковы везде, поэтому и обработчик один. Идём через
     адрес, а не через прямое присваивание chartSel: состояние раздела теперь
     живёт в хеше, и ссылка на «карту с выбранной Венерой» должна работать
     и если её просто открыть. */
  function bindGoChart(scope) {
    if (!scope) { return; }
    Array.prototype.slice.call(scope.querySelectorAll('[data-gochart],[data-gopoint]')).forEach(function (b) {
      b.addEventListener('click', function () {
        go('chart', [b.getAttribute('data-gochart') || b.getAttribute('data-gopoint')]);
      });
    });
  }

  /* scope — контейнер раздела, rerender — как он себя перерисовывает.
     Обработчики вешаются на уже отрисованную разметку, поэтому вызывается
     после каждой перерисовки, как и остальные bind*. */
  function bindDateBar(scope, rerender) {
    if (!scope) { return; }
    var each = function (sel, fn) {
      Array.prototype.slice.call(scope.querySelectorAll(sel)).forEach(fn);
    };
    each('[data-clockstep]', function (b) {
      b.addEventListener('click', function () {
        Clock.step(+b.getAttribute('data-clockstep'));
        rerender();
      });
    });
    each('[data-clocktoday]', function (b) {
      b.addEventListener('click', function () { Clock.today(); rerender(); });
    });
    each('[data-clockjump]', function (b) {
      b.addEventListener('click', function () {
        Clock.set(new Date(+b.getAttribute('data-clockjump')));
        rerender();
      });
    });
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
           ' — ' + tp.theme + '. ' + tp.advice;
  }

  /* --- экраны ------------------------------------------------------------- */
  var views = {};

  /* --- Cosmic Now: персональный вход ----------------------------------------
     Экран отвечает на четыре вопроса подряд, а не показывает сводку:
       что происходит       — главный транзит, Луна, ретрограды
       почему это про меня  — дом и натальная точка, которых это касается
       когда изменится      — ближайшая смена, с точным временем
       куда пойти дальше    — каждый пункт ведёт в свой раздел с уже
                              выставленным контекстом

     Пунктов намеренно немного: это вход в продукт, а не приборная панель.
     Индексы дня остались — они единственное, что даёт ощущение «сегодня не
     как вчера» одним взглядом, — но ушли вниз, под то, что кликабельно.

     Считается только дешёвое: сортировка транзитов без обращений к
     эфемеридам, окно — для одного главного, цикл — для одного ретрограда.
     Это вход в приложение, он не имеет права думать полсекунды. */
  function greetKey(d) {
    var h = d.getHours();
    if (h < 5) { return 'greetNight'; }
    if (h < 12) { return 'greetMorning'; }
    if (h < 18) { return 'greetDay'; }
    return 'greetEvening';
  }

  /* Ближайшее событие из тех, что считаются дёшево: смена знака Луны,
     ближайшая главная фаза и точный момент главного транзита. Станции
     планет сюда не идут намеренно — их поиск стоит десятков обращений к
     эфемеридам на тело, а на входном экране это заметно. Они на своём
     месте, в Ретроградах. */
  function cnNextShift(now, leadDetail) {
    var out = [];
    var sc = Moon.nextSignChange(now);
    if (sc) {
      out.push({ at: sc.date, label: T.sec.signChange,
        value: ZODIAC_GLYPHS[sc.to.index] + ' ' + T.signs[sc.to.index],
        go: ['moon'] });
    }
    var q = Moon.quartersFrom(now, 1)[0];
    if (q) {
      out.push({ at: q.date, label: T.moonPhase[q.phaseIndex].n,
        value: ZODIAC_GLYPHS[q.sign.index] + ' ' + T.signs[q.sign.index],
        go: ['moon', Clock.toKey(q.date)] });
    }
    if (leadDetail && leadDetail.nextExact) {
      out.push({ at: leadDetail.nextExact, label: T.sec.exactOn,
        value: pName(leadDetail.transit) + ' ' + T.aspects[leadDetail.aspect] + ' ' + pName(leadDetail.natal),
        go: ['horoscope', txHashKey(leadDetail)] });
    }
    out.sort(function (a, b) { return a.at - b.at; });
    return out[0] || null;
  }

  /* Осталось до момента: часы и минуты, пока счёт идёт на часы, дальше дни.
     «Через 38 ч» читается хуже, чем «через 2 дн.», а «через 0 дн.» — хуже,
     чем «через 4 ч 20 мин». */
  function cnUntil(date, now) {
    var ms = date.getTime() - now.getTime();
    if (ms <= 0) { return ''; }
    if (ms < 36 * 3600000) {
      var h = Math.floor(ms / 3600000), mi = Math.round((ms % 3600000) / 60000);
      return h + ' ' + T.sec.hoursShort + ' ' + mi + ' ' + T.sec.minShort;
    }
    return Math.round(ms / 86400000) + ' ' + T.sec.dayShort;
  }

  function cnTile(opts) {
    var attrs = opts.go
      ? ' data-cngo="' + esc(opts.go.join('/')) + '"' : '';
    return '<button type="button" class="cn-tile"' + attrs + '>' +
      '<span class="cn-tile__l">' + opts.label + '</span>' +
      '<span class="cn-tile__v">' + opts.value + '</span>' +
      (opts.sub ? '<span class="cn-tile__s">' + opts.sub + '</span>' : '') +
      '<span class="cn-tile__go" aria-hidden="true">›</span>' +
      '</button>';
  }

  /* --- фокус ----------------------------------------------------------------
     Темы, выбранные в воронке, доезжают сюда и решают, что показано первым.
     Раньше ответ на этот вопрос сохранялся и не читался нигде — экран
     спрашивал и забывал, а человек это чувствует.

     ВЛИЯНИЕ ЧЕСТНОЕ: ничего не прячется и не выдумывается. В «Сегодня»
     добавляется блок с самыми тесными транзитами к точкам выбранных
     областей, а проводник открывается на первой из них — переключить на
     «все» можно одним нажатием, чипы стоят там же. */
  function focusPoints() {
    var out = [];
    (S.focus || []).forEach(function (k) {
      (Tr.AREA_POINTS[k] || []).forEach(function (p) {
        if (out.indexOf(p) < 0) { out.push(p); }
      });
    });
    return out;
  }

  function focusNames() {
    return (S.focus || []).map(function (k) { return T.sec.filters[k] || k; });
  }

  function focusBlockHtml(now) {
    var pts = focusPoints();
    if (!pts.length) { return ''; }
    var rows = E.activeTransits(natal, now).filter(function (t) {
      return pts.indexOf(t.natal) >= 0;
    }).slice(0, 2);
    if (!rows.length) { return ''; }
    return '<section class="cn-focus">' +
      '<h3 class="cn-focus__h">' + T.sec.focusTitle.replace('{areas}', focusNames().join(' · ')) + '</h3>' +
      rows.map(function (t) {
        var target = natal.byName[t.natal] ||
          (t.natal === 'ASC' ? natal.asc : null) || (t.natal === 'MC' ? natal.mc : null);
        var house = target && target.house;
        return '<button type="button" class="cn-focus__b" data-cngo="horoscope/' +
          esc(t.transit + '-' + t.natal + '-' + t.aspect) + '">' +
          '<span class="cn-focus__p">' + pName(t.transit) + ' ' + T.aspects[t.aspect] + ' ' +
            pName(t.natal) + '</span>' + toneTag(t.tone) +
          '<span class="cn-focus__m">' + T.sec.orb + ' ' + fmtDeg(t.orb) +
            (house ? ' · ' + T.houses[house].n : '') + '</span>' +
          '<span class="cn-focus__go" aria-hidden="true">\u203A</span></button>';
      }).join('') +
      '</section>';
  }

  views.today = function () {
    if (!natal) { return needProfile('needText') + moonCard() + skyNow(); }
    var now = new Date();
    var r = Tr.rank(natal, now);
    var lead = r.lead ? Tr.detail(natal, r.lead, now) : null;

    /* Шапка: приветствие и место. Имя подставляем только если оно есть —
       «Добрый вечер, » с пустотой после запятой выглядит как ошибка. */
    var city = cityOf(S.profile);
    var head = '<header class="cn-head">' +
      '<p class="cn-greet">' + T.sec[greetKey(now)] +
        (S.profile.name ? ', ' + esc(S.profile.name) : '') + '</p>' +
      '<h2 class="cn-title">' + T.sec.skyTitle + '</h2>' +
      '<p class="cn-meta">' + localeDate(now) + (city && city.n ? ' · ' + esc(city.n) : '') + '</p>' +
      '</header>';

    /* Главное: сильнейший транзит с натальным контекстом. Это ровно тот же
       расчёт, что в проводнике, поэтому два экрана не могут разойтись в том,
       что сейчас главное. */
    var main;
    if (lead) {
      var ctx = signName(lead.natalSign) +
        (lead.natalHouse ? ' · ' + T.houses[lead.natalHouse].n + ' — ' + T.houses[lead.natalHouse].t : '');
      main = '<button type="button" class="cn-main" data-cngo="horoscope/' + txHashKey(lead) + '">' +
        '<span class="cn-main__l">' + T.sec.mainNow + '</span>' +
        '<span class="cn-main__h">' + txPair(lead) + toneTag(lead.tone) + '</span>' +
        '<span class="cn-main__ctx">' + ctx + '</span>' +
        '<span class="cn-main__go" aria-hidden="true">›</span>' +
        '</button>';
    } else {
      main = '<div class="cn-main cn-main--empty"><span class="cn-main__l">' + T.sec.mainNow +
        '</span><span class="cn-main__ctx">' + T.ui.noTransits + '</span></div>';
    }
    main += focusBlockHtml(now);
    if (false) {
    }

    /* Луна: фаза, знак и — если известно время рождения — дом карты. */
    var mi = Moon.infoFor(now);
    var moonHouse = E.houseOfSign(natal, mi.sign.index);
    var moonTile = cnTile({
      label: T.sec.moonNow,
      value: T.moonPhase[mi.phaseIndex].n + ' · ' + T.signs[mi.sign.index],
      sub: moonHouse ? T.houses[moonHouse].n + ' — ' + T.houses[moonHouse].t
                     : Math.round(mi.illum * 100) + '% ' + T.ui.illuminated.toLowerCase(),
      go: ['moon']
    });

    /* Ретрограды: сколько и какой сильнее всего задевает карту. Полный цикл
       считаем только для него одного. */
    var st = R.statusAt(now, natal);
    var retro = st.filter(function (x) { return x.retro; });
    var retroTile;
    if (retro.length) {
      var top = retro[0];
      retro.forEach(function (x) { if (x.relevance > top.relevance) { top = x; } });
      var cyc = R.cycleFor(top.body, now);
      retroTile = cnTile({
        label: T.sec.retroNow + ' · ' + retro.length,
        value: pName(top.body),
        sub: cyc ? cyc.daysRemaining + ' ' + T.sec.dayShort + ' · ' + T.sec.remaining : '',
        go: ['retro', top.body]
      });
    } else {
      retroTile = cnTile({ label: T.sec.retroNow, value: '0', sub: T.sec.noneText, go: ['retro'] });
    }

    var shift = cnNextShift(now, lead);
    var shiftTile = shift
      ? cnTile({ label: T.sec.nextShift, value: shift.value,
          sub: shift.label + ' · ' + (cnUntil(shift.at, now) || fmtDate(shift.at)), go: shift.go })
      : cnTile({ label: T.sec.nextShift, value: '—', sub: T.sec.nothingSoon });

    var ix = indices(now);
    var bars = ['mood', 'work', 'love'].map(function (k) {
      var v = ix.values[k];
      return '<div class="bar"><div class="bar__r"><span>' + T.ui[k] +
        '</span><span>' + v + '%</span></div><div class="bar__t"><i style="width:' +
        v + '%"></i></div></div>';
    }).join('');

    return '<div class="cn">' + head + main +
      '<div class="cn-tiles">' + moonTile + retroTile + shiftTile + '</div>' +
      '<div id="cnFeed">' + tlSavedHtml(now) + tlHtml(now) + '</div>' +
      '<section class="cn-idx">' + card(T.ui.indices, bars, T.ui.indicesNote) + '</section>' +
      '</div>';
  };

  /* --- лента ближайших событий и сохранённое ---------------------------------
     Лента живёт на Cosmic Now, а не отдельным разделом: девятый пункт меню
     противоречил бы тому, ради чего затевалась перестройка — бриф прямо
     просит меньше разделов и больше глубины в каждом. Здесь же ей и место:
     вход в продукт отвечает «что сейчас», «что дальше» и «что я отметил».

     События приходят из timeline.js структурой, а не текстом: названия фаз,
     знаков и аспектов лежат в переводах, и собирать из них строки должен
     экран — иначе десять языков пришлось бы тащить в расчётный модуль. */
  var SAVED_KEY = 'astromap.saved';
  var tlRange = 7;

  /* Единая форма события для ленты и для хранилища. Сохранять объекты
     timeline.js как есть нельзя: в них лежат Date и вложенный знак, а из
     localStorage всё вернётся строками. */
  function tlNorm(e) {
    return {
      id: TL.idOf(e), kind: e.kind, at: e.at.getTime(),
      phaseIndex: e.phaseIndex,
      signIndex: e.sign ? e.sign.index : null,
      body: e.body, toRetro: e.toRetro,
      natal: e.natal, aspect: e.aspect, tone: e.tone
    };
  }

  /* Подпись события собирается по виду. Здесь же решается, куда оно ведёт:
     фаза и смена знака — в Луну на свою дату, станция — в Ретрограды к своей
     планете, точный аспект — в проводник с этим транзитом. */
  function tlLabel(n) {
    var sign = (n.signIndex !== null && n.signIndex !== undefined)
      ? ZODIAC_GLYPHS[n.signIndex] + ' ' + T.signs[n.signIndex] : '';
    var at = new Date(n.at);
    if (n.kind === 'moonPhase') {
      return { title: T.moonPhase[n.phaseIndex].n, sub: sign, go: ['moon', Clock.toKey(at)] };
    }
    if (n.kind === 'moonSign') {
      return { title: T.sec.signChange, sub: sign, go: ['moon', Clock.toKey(at)] };
    }
    if (n.kind === 'station') {
      return { title: pName(n.body),
        sub: n.toRetro ? T.sec.kd.stationRetro : T.sec.kd.stationDirect,
        go: ['retro', n.body] };
    }
    /* Подписью аспекта служит дом карты, которого он касается, а не слово
       «точно»: время события и так стоит в первой колонке, а повторённое
       десять раз «точно» не добавляет ничего. Дом отвечает на «почему это
       про меня» — ради этого лента и нужна. */
    var target = natal && (natal.byName[n.natal] ||
      (n.natal === 'ASC' ? natal.asc : null) || (n.natal === 'MC' ? natal.mc : null));
    var house = target && target.house;
    return {
      title: pName(n.body) + ' ' + T.aspects[n.aspect] + ' ' + pName(n.natal),
      sub: house ? T.houses[house].n + ' — ' + T.houses[house].t : '',
      tone: n.tone,
      go: ['horoscope', n.body + '-' + n.natal + '-' + n.aspect]
    };
  }

  function loadSaved() {
    try {
      var raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(function (x) { return x && x.id && x.at; }) : [];
    } catch (e) { return []; }
  }
  function storeSaved(list) {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch (e) { /* игнор */ }
  }
  function toggleSaved(n) {
    var list = loadSaved();
    var at = list.filter(function (x) { return x.id === n.id; });
    if (at.length) {
      storeSaved(list.filter(function (x) { return x.id !== n.id; }));
    } else {
      list.push(n);
      list.sort(function (a, b) { return a.at - b.at; });
      storeSaved(list);
    }
  }

  /* Заголовок дня: «сегодня» и «завтра» словами, остальное датой. Человек
     читает ленту от текущего момента, и две ближайшие ступени опознаются
     быстрее словом, чем числом. */
  function tlDayLabel(d, now) {
    if (sameDay(d, now)) { return T.sec.today; }
    var tomorrow = new Date(now.getTime() + 86400000);
    if (sameDay(d, tomorrow)) { return T.sec.tomorrow; }
    return localeDate(d);
  }

  function tlRowHtml(n, savedIds) {
    var lab = tlLabel(n);
    var at = new Date(n.at);
    var isSaved = savedIds.indexOf(n.id) >= 0;
    return '<li class="tl-row">' +
      '<button type="button" class="tl-row__b" data-cngo="' + esc(lab.go.join('/')) + '">' +
        '<span class="tl-row__t">' + clockTime(at) + '</span>' +
        '<span class="tl-row__m">' +
          '<span class="tl-row__ttl">' + lab.title +
            (lab.tone ? toneTag(lab.tone) : '') + '</span>' +
          (lab.sub ? '<span class="tl-row__sub">' + lab.sub + '</span>' : '') +
        '</span>' +
      '</button>' +
      '<button type="button" class="tl-save' + (isSaved ? ' on' : '') +
        '" data-tlsave="' + esc(n.id) + '" aria-pressed="' + isSaved + '" aria-label="' +
        esc(isSaved ? T.sec.unsaveAct : T.sec.saveAct) + '" title="' +
        esc(isSaved ? T.sec.unsaveAct : T.sec.saveAct) + '">' +
        (isSaved ? '★' : '☆') + '</button>' +
      '</li>';
  }

  function tlSavedHtml(now) {
    var list = loadSaved();
    if (!list.length) { return ''; }
    /* Прошедшее из сохранённого не выбрасываем молча — это данные человека,
       — но опускаем ниже и гасим: список нужен, чтобы смотреть вперёд. */
    var rows = list.map(function (n) {
      var lab = tlLabel(n);
      var at = new Date(n.at);
      var past = at.getTime() < now.getTime();
      return '<li class="tl-row' + (past ? ' tl-row--past' : '') + '">' +
        '<button type="button" class="tl-row__b" data-cngo="' + esc(lab.go.join('/')) + '">' +
          '<span class="tl-row__t">' + fmtDate(at) + '</span>' +
          '<span class="tl-row__m"><span class="tl-row__ttl">' + lab.title + '</span>' +
          (lab.sub ? '<span class="tl-row__sub">' + lab.sub + '</span>' : '') + '</span>' +
        '</button>' +
        '<button type="button" class="tl-save on" data-tlsave="' + esc(n.id) +
          '" aria-label="' + esc(T.sec.unsaveAct) + '" title="' + esc(T.sec.unsaveAct) + '">★</button>' +
        '</li>';
    }).join('');
    return '<section class="tl tl--saved"><h3 class="tl__t">' + T.sec.savedTitle + '</h3>' +
      '<ul class="tl__ul">' + rows + '</ul></section>';
  }

  function tlHtml(now) {
    var events = TL.events(natal, Moon, now, tlRange).map(tlNorm);
    var savedIds = loadSaved().map(function (x) { return x.id; });
    var chips = TL.RANGES.map(function (d) {
      return '<button type="button" class="chip' + (tlRange === d ? ' on' : '') +
        '" aria-pressed="' + (tlRange === d ? 'true' : 'false') +
        '" data-tlrange="' + d + '">' + T.sec['range' + d] + '</button>';
    }).join('');

    return '<section class="tl"><div class="tl__head"><h3 class="tl__t">' + T.sec.upcoming + '</h3>' +
      '<div class="chartchips tl__ranges">' + chips + '</div></div>' +
      /* Список вынесен в отдельный контейнер, чтобы смена диапазона меняла
         только его. Раньше перерисовывался весь блок вместе с кнопками: та
         кнопка, по которой человек только что нажал, на время пересчёта
         исчезала из DOM и возвращалась уже другим узлом. */
      '<div class="tl__body" id="tlBody">' + tlBodyHtml(now, events, savedIds) + '</div></section>';
  }

  function tlBodyHtml(now, events, savedIds) {
    var body = '';
    if (!events.length) {
      body = '<p class="pmuted">' + T.sec.nothingSoon + '</p>';
    } else {
      var lastDay = '';
      body = '<ul class="tl__ul">' + events.map(function (n) {
        var d = new Date(n.at);
        var day = isoDay(d);
        var head = '';
        if (day !== lastDay) {
          lastDay = day;
          head = '<li class="tl-day">' + tlDayLabel(d, now) + '</li>';
        }
        return head + tlRowHtml(n, savedIds);
      }).join('') + '</ul>';
    }
    return body;
  }

  function rerenderTimeline() {
    var host = el('cnFeed');
    if (!host) { return; }
    host.innerHTML = tlSavedHtml(new Date()) + tlHtml(new Date());
    bindToday();
  }

  /* --- выбор диапазона в «Ближайшем» ---------------------------------------
     ЧТО БЫЛО ИЗМЕРЕНО. От тапа до появления подсветки на нажатой кнопке:
     120мс для «30 дней» и 130мс для «90» на десктопном процессоре — и ровно
     столько же до обновления списка. Цифры совпадают не случайно: подсветка
     и список приезжали одной и той же перерисовкой, то есть визуальный отклик
     ждал, пока досчитается TL.events. На процессоре телефона это втрое-впятеро
     дольше, плюс 200мс на transition у .chip и до 300мс, которые браузер
     держит тап при touch-action: auto. Складывается в «кнопка не нажимается».

     ЧТО ТЕПЕРЬ. Три вещи разведены по времени:
       1) подсветка переставляется здесь же, синхронно, без перерисовки —
          браузер рисует её ближайшим кадром;
       2) пересчёт уходит за два кадра, то есть заведомо после того, как
          нажатие отрисовалось;
       3) быстрые переключения 7 → 30 → 90 → 7 не копятся: у каждого выбора
          свой номер, и досчитывается только последний.
     Ничего искусственного не добавлено — ни таймеров, ни заглушек: сам расчёт
     остался прежним, изменился только порядок. */
  var tlSeq = 0;

  function pickRange(d) {
    if (!d || d === tlRange) { return; }
    tlRange = d;

    var view = el('view');
    if (view) {
      Array.prototype.slice.call(view.querySelectorAll('[data-tlrange]')).forEach(function (o) {
        var on = +o.getAttribute('data-tlrange') === d;
        o.classList.toggle('on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    var mySeq = ++tlSeq;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (mySeq !== tlSeq) { return; }  /* уже нажали другой диапазон */
        var host = el('tlBody');
        if (!host) { rerenderTimeline(); return; }
        var now = new Date();
        var events = TL.events(natal, Moon, now, tlRange).map(tlNorm);
        host.innerHTML = tlBodyHtml(now, events, loadSaved().map(function (x) { return x.id; }));
        bindTlBody(host);
      });
    });
  }

  /* Обработчики только внутри списка: кнопки диапазонов живут выше по дереву
     и пересоздания не переживают — навешивать их заново нельзя, иначе после
     каждого переключения на них будет висеть лишний обработчик. */
  function bindTlBody(host) {
    Array.prototype.slice.call(host.querySelectorAll('[data-cngo]')).forEach(function (b) {
      b.addEventListener('click', function () {
        location.hash = '#' + b.getAttribute('data-cngo');
      });
    });
    Array.prototype.slice.call(host.querySelectorAll('[data-tlsave]')).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-tlsave');
        var pool = TL.events(natal, Moon, new Date(), tlRange).map(tlNorm).concat(loadSaved());
        var found = null;
        pool.forEach(function (n) { if (n.id === id && !found) { found = n; } });
        if (found) { toggleSaved(found); rerenderTimeline(); }
      });
    });
  }

  function bindToday() {
    var view = el('view');
    if (!view) { return; }
    Array.prototype.slice.call(view.querySelectorAll('[data-cngo]')).forEach(function (b) {
      b.addEventListener('click', function () {
        location.hash = '#' + b.getAttribute('data-cngo');
      });
    });
    Array.prototype.slice.call(view.querySelectorAll('[data-tlrange]')).forEach(function (b) {
      b.addEventListener('click', function () { pickRange(+b.getAttribute('data-tlrange')); });
    });
    /* Звёздочка ищет событие среди показанных сейчас и среди уже
       сохранённых: убрать отметку должно быть можно и из списка
       сохранённого, где исходного события в ленте может уже не быть. */
    Array.prototype.slice.call(view.querySelectorAll('[data-tlsave]')).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-tlsave');
        var pool = TL.events(natal, Moon, new Date(), tlRange).map(tlNorm).concat(loadSaved());
        var found = null;
        pool.forEach(function (n) { if (n.id === id && !found) { found = n; } });
        if (found) { toggleSaved(found); rerenderTimeline(); }
      });
    });
  }

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
  /* Периоды, расчёт которых не укладывается в один кадр (замерено: полгода
     ~280 мс, год ~610 мс). */
  var HZ_HEAVY = ['halfyear', 'year'];
  var hzPeriod = 'today';
  var chartSel = null;

  /* Период отсчитывается от выбранной даты, а не всегда от «сейчас»: иначе
     перемотка времени меняла бы верхнюю половину раздела и не трогала
     нижнюю, и две части экрана говорили бы о разных днях. */
  function hzPeriodData(key) {
    var p = HZ_PERIODS.filter(function (x) { return x.key === key; })[0] || HZ_PERIODS[0];
    var now = Clock.get();
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
  /* Общий механизм скользящего индикатора для любой .segbar-капсулы:
     сначала использовался только для периодов Гороскопа, теперь и для
     вкладок категорий в быстрой Совместимости (см. positionMcIndicator). */
  function positionSegIndicator(barId, indId, skipAnim) {
    var bar = el(barId), ind = el(indId);
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
    /* На телефоне лента вкладок шире экрана и прокручивается. Выбранная
       вкладка при этом запросто оказывается за краем: обход на 320-414
       находил «Общая» целиком слева за пределами окна — человек видел ленту,
       в которой ни одна вкладка не подсвечена, и не понимал, что открыто.
       Подкручиваем ленту так, чтобы выбранная была видна целиком, с запасом
       в 12 пикселей, — и только если она действительно не видна, иначе
       каждое переключение дёргало бы ленту без нужды. */
    var pad = 12;
    var left = btn.offsetLeft - pad;
    var right = btn.offsetLeft + btn.offsetWidth + pad;
    if (left < bar.scrollLeft) {
      bar.scrollLeft = Math.max(0, left);
    } else if (right > bar.scrollLeft + bar.clientWidth) {
      bar.scrollLeft = right - bar.clientWidth;
    }
  }
  function positionHzIndicator(skipAnim) { positionSegIndicator('segbar', 'segbarInd', skipAnim); }

  /* --- ИИ-озвучка карточек гороскопа ---------------------------------------
     Композиционный текст (transitText) рендерится сразу и служит фолбэком.
     Параллельно уходит запрос к воркеру на Cloudflare (см. cf-worker/), тот
     дергает бесплатный Groq API и возвращает связный текст по тем же фактам
     — если он ответит вовремя, подменяем параграф; если нет (сеть, лимит
     Groq, воркер недоступен) — молча остаёмся на композиционном тексте.
     Кэш в localStorage на календарный день не даёт дёргать API повторно
     при каждом заходе на вкладку. */
  var AI_URL = 'https://astromap-horoscope-ai.egorrut3030.workers.dev';

  /* Воркер долго умел писать только по-английски и по-польски, а lang
     принимал любой — и для остальных восьми языков возвращал английский
     текст, которым мы затирали правильный композиционный перевод. Теперь он
     сообщает, на каком языке написал, и мы принимаем ответ только при
     совпадении. Старая версия воркера поля lang не вернёт — и её ответ
     будет отброшен, то есть перевод перестаёт портиться сам собой, ещё до
     обновления воркера. Английский принимаем и без поля: для него старое
     поведение было верным. */
  function aiLangOk(data, lang) {
    if (!data) { return false; }
    if (data.lang) { return data.lang === lang; }
    return lang === 'en';
  }

  /* --- ИИ-слой поверх темы дома --------------------------------------------
     Композиционный текст (название дома и его тема) рендерится сразу и
     остаётся, если воркер не ответил. Живой слой объясняет конкретное
     сочетание «планета — дом — аспекты» для этого человека и приписывается
     отдельным абзацем, а не подменяет факты. Кэш по языку, планете и дому:
     сочетание меняется редко, дёргать API на каждый рендер незачем. */
  function houseAiEnhance(bodyName, house, aspects) {
    var host = document.querySelector('.phouse');
    if (!host || !house || !AI_URL) { return; }
    var lang = window.APP_LANG || 'en';
    var key = 'hai:' + lang + ':' + bodyName + ':' + house;
    var put = function (text) {
      var h = document.querySelector('.phouse');
      if (!h || h.querySelector('.phouse__ai')) { return; }
      var p = document.createElement('p');
      p.className = 'phouse__ai';
      p.textContent = text;
      h.appendChild(p);
    };
    try {
      var cached = localStorage.getItem(key);
      if (cached) { put(cached); return; }
    } catch (e) {}

    fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'house', lang: lang, body: bodyName, house: house,
        sign: (E.bodyAt(bodyName, Clock.get()).sign.key),
        aspects: (aspects || []).slice(0, 4).map(function (a) {
          return { natal: a.natal, aspect: a.aspect, tone: a.tone };
        })
      })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!aiLangOk(data, lang) || !data.text) { return; }
        try { localStorage.setItem(key, data.text); } catch (e) {}
        put(data.text);
      })
      .catch(function () { /* сеть/лимит — остаёмся на теме дома */ });
  }
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
        if (!aiLangOk(data, lang) || !data.sections) { return; }
        try { localStorage.setItem(cacheKey, JSON.stringify(data.sections)); } catch (e) {}
        applyHzSections(data.sections, mySeq);
      })
      .catch(function () {});
  }

  /* --- совместимость: быстрый выбор знаков ---------------------------------
     Дополняет точный синастрический расчёт ниже (полные данные рождения),
     а не заменяет его: выбираешь два знака Солнца тайлами — как в референсе
     Astroscope — и сразу получаешь ощутимый результат по 7 категориям с
     собственной шкалой и вкладками (тот же .segbar/индикатор, что у периодов
     Гороскопа, через общий positionSegIndicator). Композиционный фолбэк
     (mcFallback) держится на паре таблиц «стихия+стихия» и «качество
     совпадает/нет» —10+2 комбинации вместо 144 готовых текстов на каждую
     пару знаков. Тот же ИИ-воркер (AI_URL), что озвучивает Гороскопа, умеет
     и режим type:'compat' — если он ответит вовремя, подменяем счёт/текст
     точечно (mcApplyCategories), как applyHzSections делает для Гороскопа;
     если нет — молча остаемся на композиционном тексте. */
  var ZODIAC_GLYPHS = ['\u2648', '\u2649', '\u264A', '\u264B', '\u264C', '\u264D',
                       '\u264E', '\u264F', '\u2650', '\u2651', '\u2652', '\u2653'];
  var SIGN_ELEMENT = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water',
                       'fire', 'earth', 'air', 'water'];
  var SIGN_MODE = ['cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable',
                    'cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable'];
  var MC_ELEMENT_BASE = {
    'air-air': 70, 'air-earth': 42, 'air-fire': 82, 'air-water': 48,
    'earth-earth': 75, 'earth-fire': 45, 'earth-water': 80,
    'fire-fire': 78, 'fire-water': 40,
    'water-water': 74
  };
  var MC_CATEGORY_DELTA = {
    general:       { base: 0,  elBonus: 0,  modeBonus: 0 },
    love:          { base: 2,  elBonus: 4,  modeBonus: -2 },
    intimacy:      { base: -3, elBonus: 6,  modeBonus: 0 },
    trust:         { base: 0,  elBonus: 2,  modeBonus: 6 },
    communication: { base: 3,  elBonus: 0,  modeBonus: 4 },
    work:          { base: -2, elBonus: -3, modeBonus: 8 },
    friendship:    { base: 5,  elBonus: 3,  modeBonus: 2 }
  };
  var MC_CATEGORIES = [
    { key: 'general', icon: '\u{1F52E}' },
    { key: 'love', icon: '\u2764\uFE0F' },
    { key: 'intimacy', icon: '\u{1F525}' },
    { key: 'trust', icon: '\u{1F91D}' },
    { key: 'communication', icon: '\u{1F4AC}' },
    { key: 'work', icon: '\u{1F4BC}' },
    { key: 'friendship', icon: '\u{1F31F}' }
  ];

  function mcPairKey(elA, elB) {
    var arr = [elA, elB].sort();
    return arr[0] + '-' + arr[1];
  }
  function mcScore(iA, iB, catKey) {
    var elA = SIGN_ELEMENT[iA], elB = SIGN_ELEMENT[iB];
    var sameMode = SIGN_MODE[iA] === SIGN_MODE[iB];
    var base = MC_ELEMENT_BASE[mcPairKey(elA, elB)];
    var adj = MC_CATEGORY_DELTA[catKey] || MC_CATEGORY_DELTA.general;
    var score = base + adj.base +
      (elA === elB ? adj.elBonus : Math.round(adj.elBonus / 2)) +
      (sameMode ? adj.modeBonus : -Math.round(adj.modeBonus / 2));
    /* небольшая детерминированная вариация — иначе все категории для одной
      пары знаков получили бы один и тот же процент */
    var seed = (iA * 31 + iB * 17 + catKey.length * 7) % 9;
    score += seed - 4;
    return Math.max(5, Math.min(96, Math.round(score)));
  }
  function mcFallbackText(iA, iB) {
    var elA = SIGN_ELEMENT[iA], elB = SIGN_ELEMENT[iB];
    var sameMode = SIGN_MODE[iA] === SIGN_MODE[iB];
    var elText = T.mcElementText[mcPairKey(elA, elB)] || '';
    var modeText = T.mcModeText[sameMode ? 'same' : 'diff'];
    return elText + ' ' + modeText;
  }
  function mcFallback(iA, iB) {
    var text = mcFallbackText(iA, iB);
    var out = {};
    MC_CATEGORIES.forEach(function (c) {
      out[c.key] = { score: mcScore(iA, iB, c.key), text: text, ai: false };
    });
    return out;
  }

  var mcSignA = null, mcSignB = null, mcCat = 'general';
  var mcCategories = null, mcCategoriesKey = null, mcAiSeq = 0;

  function mcEnsureCategories() {
    if (mcSignA == null || mcSignB == null) { mcCategories = null; mcCategoriesKey = null; return; }
    var key = Math.min(mcSignA, mcSignB) + '-' + Math.max(mcSignA, mcSignB);
    if (key !== mcCategoriesKey) {
      mcCategories = mcFallback(mcSignA, mcSignB);
      mcCategoriesKey = key;
      mcAiSeq++; /* новая пара — предыдущий ИИ-запрос (если летит) больше не актуален */
    }
  }

  function mcGridHtml(which, selected) {
    return ZODIAC_GLYPHS.map(function (g, i) {
      return '<button type="button" class="signtile' + (selected === i ? ' on' : '') +
        '" data-which="' + which + '" data-sign="' + i + '">' +
        '<span class="signtile__g">' + g + '</span>' +
        '<span class="signtile__n">' + T.signs[i] + '</span></button>';
    }).join('');
  }

  function mcCardBodyHtml() {
    var c = mcCategories && mcCategories[mcCat];
    if (!c) { return ''; }
    return '<div class="score"><div class="score__n">' + c.score + '%</div>' +
      '<div class="score__b"><i style="width:' + c.score + '%"></i></div></div>' +
      '<p class="p mccard__text">' + c.text +
      (c.ai ? ' <span class="mc-ai-tag">AI</span>' : '') + '</p>';
  }

  function mcResultHtml() {
    if (mcSignA == null || mcSignB == null) {
      return '<p class="empty">' + T.ui.mcChoose + '</p>';
    }
    var tabs = MC_CATEGORIES.map(function (c) {
      var cat = mcCategories && mcCategories[c.key];
      return '<button class="segbar__b' + (mcCat === c.key ? ' on' : '') +
        (cat && cat.ai ? ' mc-ai' : '') + '" data-cat="' + c.key + '">' +
        '<span class="segbar__t">' + c.icon + ' ' +
        T.ui['mc' + c.key.charAt(0).toUpperCase() + c.key.slice(1)] + '</span></button>';
    }).join('');
    return '<div class="mchero"><div class="mchero__signs">' +
      '<span class="mchero__s">' + ZODIAC_GLYPHS[mcSignA] + ' ' + T.signs[mcSignA] + '</span>' +
      '<span class="mchero__x">\u00D7</span>' +
      '<span class="mchero__s">' + ZODIAC_GLYPHS[mcSignB] + ' ' + T.signs[mcSignB] + '</span>' +
      '</div></div>' +
      '<div class="segbar mcsegbar" id="mcSegbar"><span class="segbar__ind" id="mcSegbarInd"></span>' +
      tabs + '</div>' +
      '<div class="mccard" id="mcCardBody">' + mcCardBodyHtml() + '</div>';
  }

  function positionMcIndicator(skipAnim) { positionSegIndicator('mcSegbar', 'mcSegbarInd', skipAnim); }

  function mcApplyCategories(categories, mySeq) {
    if (mySeq !== mcAiSeq || !mcCategories) { return; } /* пара знаков уже сменилась */
    MC_CATEGORIES.forEach(function (c) {
      var incoming = categories[c.key];
      if (!incoming || typeof incoming.score !== 'number' || !incoming.text) { return; }
      mcCategories[c.key] = { score: incoming.score, text: incoming.text, ai: true };
    });
    var result = el('mcResult');
    if (!result) { return; }
    var body = el('mcCardBody');
    if (body) { body.innerHTML = mcCardBodyHtml(); }
    Array.prototype.slice.call(result.querySelectorAll('.segbar__b[data-cat]')).forEach(function (b) {
      var cat = mcCategories[b.getAttribute('data-cat')];
      b.classList.toggle('mc-ai', !!(cat && cat.ai));
    });
  }

  function mcAiEnhance() {
    if (mcSignA == null || mcSignB == null || !AI_URL || AI_URL.indexOf('REPLACE_ME') >= 0) { return; }
    var lang = window.APP_LANG || 'en';
    var lo = Math.min(mcSignA, mcSignB), hi = Math.max(mcSignA, mcSignB);
    var cacheKey = 'mcai:' + lang + ':' + lo + '-' + hi;
    var mySeq = mcAiSeq;
    try {
      var cached = localStorage.getItem(cacheKey);
      if (cached) { mcApplyCategories(JSON.parse(cached), mySeq); return; }
    } catch (e) {}

    fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'compat', lang: lang, signA: T.signs[mcSignA], signB: T.signs[mcSignB] })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!aiLangOk(data, lang) || !data.categories) { return; }
        try { localStorage.setItem(cacheKey, JSON.stringify(data.categories)); } catch (e) {}
        mcApplyCategories(data.categories, mySeq);
      })
      .catch(function () {});
  }

  /* Тайлы знаков не пересоздаются при каждом клике (меняется только класс
     .on), ощутомучики вешаются один раз — в отличие от вкладок
     категорий (bindMcTabs), чьй контейнер #mcResult пересобирается целиком
     при каждой смене пары знаков и должен перепривязываться заново. */
  function bindMcGrid(which) {
    var grid = el('mcGrid' + which);
    if (!grid) { return; }
    Array.prototype.slice.call(grid.querySelectorAll('.signtile')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = +btn.getAttribute('data-sign');
        if (which === 'A') { mcSignA = idx; } else { mcSignB = idx; }
        Array.prototype.slice.call(grid.querySelectorAll('.signtile')).forEach(function (x) {
          x.classList.toggle('on', x === btn);
        });
        mcEnsureCategories();
        var result = el('mcResult');
        if (result) {
          result.innerHTML = mcResultHtml();
          positionMcIndicator(true);
          bindMcTabs();
        }
        mcAiEnhance();
      });
    });
  }

  function bindMcTabs() {
    var result = el('mcResult');
    if (!result) { return; }
    Array.prototype.slice.call(result.querySelectorAll('.segbar__b[data-cat]')).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('on')) { return; }
        mcCat = b.getAttribute('data-cat');
        Array.prototype.slice.call(result.querySelectorAll('.segbar__b[data-cat]')).forEach(function (x) {
          x.classList.toggle('on', x === b);
        });
        positionMcIndicator(false);
        var body = el('mcCardBody');
        if (body) { body.innerHTML = mcCardBodyHtml(); }
      });
    });
  }

  /* --- проводник транзитов --------------------------------------------------
     Раздел отвечал на «что происходит» дважды — связным текстом по сферам и
     таблицей точных дат — и ни разу на «что из этого сильнее всего и когда
     пик». Проводник добавляет именно этот слой и стоит выше текста: сорок
     активных аспектов равнозначным списком не говорят ничего.

     Иерархия: один главный, три рядом, остальное свёрнуто под фильтры. Любой
     транзит из списка можно поднять в главный — это и есть исследование, а
     не просто пролистывание.

     Луна из главных исключена намеренно (см. transits.js): она меняет
     аспекты по нескольку раз в сутки и всегда вытесняла бы то, что держится
     неделями. В общем списке она остаётся. */
  /* Области фокуса идут сразу после «всех»: человек выбирал их сам, и искать
     свою тему в хвосте ряда он не должен. Остальные чипы — в прежнем
     порядке, ни один не пропал. */
  var TX_FILTERS_BASE = ['all', 'soft', 'hard', 'slow', 'love', 'career', 'growth', 'inner', 'self'];
  function txFilters() {
    var f = (S.focus || []).filter(function (k) { return TX_FILTERS_BASE.indexOf(k) >= 0; });
    return ['all'].concat(f, TX_FILTERS_BASE.filter(function (k) {
      return k !== 'all' && f.indexOf(k) < 0;
    }));
  }
  /* Фильтр проводника открывается на первой области фокуса, а не на «всех»:
     человек сказал, что его интересует, и первым должен увидеть именно это.
     Чипы стоят рядом, так что «все» — одно нажатие. */
  var txSel = null, txFilter = 'all', txOpen = false, txWhy = false;
  var txFilterTouched = false;
  function txDefaultFilter() {
    return (S.focus && S.focus.length) ? S.focus[0] : 'all';
  }

  function txKey(r) { return r.transit + '|' + r.natal + '|' + r.aspect; }
  /* Тот же ключ для адресной строки: вертикальная черта в хеше выглядит
     мусором и кодируется в %7C, поэтому разделитель — дефис. Дату он не
     перепутает: она распознаётся раньше, по своей форме. */
  function txHashKey(r) { return r.transit + '-' + r.natal + '-' + r.aspect; }

  function txPair(r) {
    return '<b>' + pName(r.transit) + '</b>' + (r.retro ? ' R' : '') +
      ' <span class="tx-asp">' + T.aspects[r.aspect] + '</span> <b>' + pName(r.natal) + '</b>';
  }

  /* Дата границы окна: если поиск упёрся в предел, честно помечаем, что
     дальше не смотрели, вместо того чтобы выдать предел за настоящий край. */
  function txEdgeDate(d, capped) {
    return (capped ? '≥ ' : '') + fmtDate(d);
  }

  function txWindowHtml(d) {
    var t0 = d.from.getTime(), t1 = d.to.getTime(), span = t1 - t0;
    if (span <= 0) { return ''; }
    var at = function (x) { return Math.max(0, Math.min(100, (x - t0) / span * 100)); };
    var now = at(Clock.get().getTime());
    var marks = d.exacts.map(function (e) {
      return '<span class="twin__ex" style="left:' + at(e.getTime()).toFixed(2) + '%" title="' +
        esc(fmtDate(e)) + '"></span>';
    }).join('');
    return '<div class="twin">' +
      '<div class="twin__bar">' +
        '<span class="twin__fill" style="width:' + now.toFixed(2) + '%"></span>' + marks +
        '<span class="twin__now" style="left:' + now.toFixed(2) + '%"></span>' +
      '</div>' +
      '<div class="twin__ends">' +
        '<span>' + txEdgeDate(d.from, d.fromCapped) + '</span>' +
        '<span>' + txEdgeDate(d.to, d.toCapped) + '</span>' +
      '</div></div>';
  }

  /* Технические детали по запросу: продукт показывает вывод, а любопытный
     должен иметь возможность увидеть, из чего он собран. Шкала силы
     произвольная и годится только для сравнения транзитов между собой —
     так и подписано, чтобы её не читали как вероятность. */
  function txWhyHtml(d) {
    var rows = [
      [termHtml('orb', T.sec.orb), fmtDeg(d.orb) + ' / ' + fmtDeg(d.maxOrb)],
      [T.ui.motion, termHtml(d.applying ? 'applying' : 'separating',
        d.applying ? T.sec.applying : T.sec.separating)],
      [T.sec.windowW, d.days + ' ' + T.sec.dayShort],
      [T.sec.exactCount, String(d.exacts.length)],
      [T.sec.strength, d.strength.toFixed(1)]
    ];
    var list = rows.map(function (r) {
      return '<div class="kv"><span>' + r[0] + '</span><b class="tx-why__v">' + r[1] + '</b></div>';
    }).join('');
    var dates = d.exacts.length
      ? '<p class="note">' + T.sec.exactOn + ': ' + d.exacts.map(fmtDate).join(' · ') + '</p>' : '';
    var triple = d.triple ? '<p class="note">' + T.sec.tripleNote + '</p>' : '';
    return '<div class="tx-why">' + list + dates + triple + '</div>';
  }

  function txHeroHtml(d, isLead) {
    var natalCtx = signName(d.natalSign) +
      (d.natalHouse ? ' · ' + T.houses[d.natalHouse].n : '');
    var transitCtx = signName(d.sign) + (d.house ? ' · ' + T.houses[d.house].n : '');
    var peak = d.nextExact || d.exacts[0] || null;
    return '<section class="tx-hero">' +
      (isLead ? '<span class="tx-hero__badge">' + T.sec.mainNow + '</span>' : '') +
      '<h2 class="tx-hero__h">' + txPair(d) + toneTag(d.tone) + '</h2>' +
      '<div class="tx-hero__ctx">' +
        '<span>' + termHtml('transit', T.sec.transiting) + ' ' + transitCtx + '</span>' +
        '<span>' + termHtml('natal', T.sec.natalW) + ' ' + natalCtx + '</span>' +
      '</div>' +
      txWindowHtml(d) +
      '<div class="tx-hero__meta">' +
        '<span>' + T.sec.orb + ' ' + fmtDeg(d.orb) + '</span>' +
        '<span>' + (d.applying ? T.sec.applying : T.sec.separating) + '</span>' +
        (peak ? '<span>' + T.sec.exactOn + ' ' + fmtDate(peak) + '</span>' : '') +
      '</div>' +
      '<div class="acts">' +
        '<button type="button" class="act" data-txwhy="1" aria-expanded="' + txWhy + '">' +
          T.sec.why + (txWhy ? ' ▴' : ' ▾') + '</button>' +
        '<button type="button" class="act" data-gopoint="' + d.natal + '">' +
          T.sec.openChart + '</button>' +
        (peak ? '<button type="button" class="act" data-clockjump="' + peak.getTime() + '">' +
          T.sec.goPeak + '</button>' : '') +
      '</div>' +
      (txWhy ? txWhyHtml(d) : '') +
      '</section>';
  }

  function txSupportHtml(rows, selKey) {
    if (!rows.length) { return ''; }
    return '<div class="tx-sup">' + rows.map(function (r) {
      return '<button type="button" class="tx-sup__b' + (txKey(r) === selKey ? ' on' : '') +
        '" data-txsel="' + esc(txKey(r)) + '">' +
        '<span class="tx-sup__p">' + txPair(r) + '</span>' +
        '<span class="tx-sup__m">' + T.sec.orb + ' ' + fmtDeg(r.orb) + '</span>' +
        '<span class="tone-dot tone-dot--' + r.tone + '" aria-hidden="true"></span>' +
        '</button>';
    }).join('') + '</div>';
  }

  function txListHtml(all, selKey) {
    var rows = Tr.filterRows(all, txFilter);
    var chips = txFilters().map(function (k) {
      return '<button type="button" class="chip' + (txFilter === k ? ' on' : '') +
        '" data-txfilter="' + k + '">' + T.sec.filters[k] + '</button>';
    }).join('');
    var items = rows.map(function (r) {
      return '<li><button type="button" class="tx-row' + (txKey(r) === selKey ? ' on' : '') +
        '" data-txsel="' + esc(txKey(r)) + '">' +
        '<span class="tone-dot tone-dot--' + r.tone + '" aria-hidden="true"></span>' +
        '<span class="tx-row__p">' + txPair(r) + '</span>' +
        '<span class="tx-row__m">' + fmtDeg(r.orb) + ' · ' +
          (r.applying ? T.sec.applying : T.sec.separating) + '</span>' +
        '<span class="tx-row__go" aria-hidden="true">›</span></button></li>';
    }).join('');
    /* Заголовок свёрнутого списка обязан показывать ДЕЙСТВУЮЩИЙ фильтр.
       Фокус подставляет его при первом входе в раздел, а чипы видны только
       в развёрнутом виде — без этой подписи человек открывал бы список и
       обнаруживал, что часть транзитов куда-то делась, без объяснения. */
    var filterLabel = txFilter === 'all' ? '' :
      ' <i class="tx-list__f">' + T.sec.filters[txFilter] + '</i>';
    return '<section class="tx-list">' +
      '<button type="button" class="tx-list__toggle" data-txopen="1" aria-expanded="' + txOpen + '">' +
        T.sec.allActive + ' <b>' + (txFilter === 'all' ? all.length : rows.length + ' / ' + all.length) +
        '</b>' + filterLabel + ' <span>' +
        (txOpen ? T.sec.collapse : T.sec.showAll) + '</span></button>' +
      (txOpen ? '<div class="chartchips tx-list__chips">' + chips + '</div>' +
        '<ul class="tx-list__ul">' + items + '</ul>' : '') +
      '</section>';
  }

  function txBodyHtml() {
    var date = Clock.get();
    var r = Tr.rank(natal, date);
    if (!r.lead) {
      return '<section class="tx-hero"><p class="empty">' + T.ui.noTransits + '</p></section>';
    }
    var sel = null;
    if (txSel) { r.all.forEach(function (x) { if (txKey(x) === txSel) { sel = x; } }); }
    if (!sel) { sel = r.lead; }
    var d = Tr.detail(natal, sel, date);
    if (!d) { sel = r.lead; d = Tr.detail(natal, sel, date); }
    var selKey = txKey(sel);
    return txHeroHtml(d, selKey === txKey(r.lead)) +
      '<h3 class="tx-sub">' + T.sec.supporting + '</h3>' +
      txSupportHtml(r.support, selKey) +
      txListHtml(r.all, selKey);
  }

  function rerenderTx() {
    var body = el('txBody');
    if (!body) { return; }
    if (txSel) { syncHash('horoscope', [txSel.split('|').join('-')]); }
    body.innerHTML = txBodyHtml();
    bindTx();
    bindTerms(body);
  }

  function bindTx() {
    var body = el('txBody');
    if (!body) { return; }
    var each = function (sel, fn) {
      Array.prototype.slice.call(body.querySelectorAll(sel)).forEach(fn);
    };
    each('[data-txsel]', function (b) {
      b.addEventListener('click', function () {
        txSel = b.getAttribute('data-txsel');
        txWhy = false;            /* другой транзит — детали прежнего не к месту */
        rerenderTx();
      });
    });
    each('[data-txfilter]', function (b) {
      b.addEventListener('click', function () {
        txFilter = b.getAttribute('data-txfilter');
        txFilterTouched = true;
        rerenderTx();
      });
    });
    each('[data-txopen]', function (b) {
      b.addEventListener('click', function () { txOpen = !txOpen; rerenderTx(); });
    });
    each('[data-txwhy]', function (b) {
      b.addEventListener('click', function () { txWhy = !txWhy; rerenderTx(); });
    });
    bindGoChart(body);
    /* Прыжок на дату пика меняет общую дату, поэтому перерисовать нужно и
       нижнюю половину раздела — периоды считаются от той же даты. */
    bindDateBar(body, function () { rerenderTx(); rerenderHzPeriod(); });
  }

  function rerenderHzPeriod() {
    var body = el('hzBody');
    if (!body) { return; }
    body.innerHTML = hzContentHtml();
    bindHzRows();
    hzAiEnhance(hzPeriod);
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
    return '<div class="tx-page">' +
      dateBarHtml() +
      '<div class="tx" id="txBody">' + txBodyHtml() + '</div>' +
      '<h3 class="tx-sub tx-sub--period">' + T.sec.forecast + '</h3>' +
      '<div class="hzhead"><div class="segbar" id="segbar">' +
        '<span class="segbar__ind" id="segbarInd"></span>' + tabs + '</div></div>' +
      '<div class="hzquick" id="hzquick">' + quick + '</div>' +
      '<div class="hz" id="hzBody">' + hzContentHtml() + '</div>' +
      '</div>';
  };

  /* --- вкладка Chart: интерактивное колесо -------------------------------
     Один источник состояния (chartSel — имя выбранной точки: планета,
     Node, ASC или MC) -> колесо, чипы-легенда, обе таблицы и карточка
     интерпретации перерисовываются из него, тем же приёмом, что уже
     используют #hzBody (периоды Гороскопа) и #moonBody (календарь Луны):
     клик меняет только chartSel и перерисовывает #chartBody, без полного
     route() и без сброса скролла/шапки. */
  function chartPts() {
    return natal.points.concat(natal.asc ? [natal.asc, natal.mc] : []);
  }
  function chartFind(pts, name) {
    var out = null;
    pts.forEach(function (p) { if (p.name === name) { out = p; } });
    return out;
  }

  function chartChipsHtml(pts) {
    return '<div class="chartchips">' + pts.map(function (p) {
      return '<button type="button" class="chip' + (p.name === chartSel ? ' on' : '') +
        '" data-point="' + p.name + '">' + pName(p.name) + ' ' +
        ZODIAC_GLYPHS[p.sign.index] + '</button>';
    }).join('') + '</div>';
  }

  function chartPositionsHtml(pts) {
    var rows = pts.map(function (p) {
      return '<tr class="rowpt' + (p.name === chartSel ? ' rowpt--sel' : '') +
        '" data-point="' + p.name + '">' +
        '<td>' + pName(p.name) + '</td><td>' + signName(p.sign) + '</td><td>' +
        fmtDeg(p.sign.degree) + '</td><td>' + (p.house || '—') + '</td><td>' +
        (p.speed ? p.speed.toFixed(3) : '—') + '</td><td>' +
        (p.retro ? '<span class="tag tag--hard">R</span>' : '') + '</td></tr>';
    }).join('');
    return '<div class="tw"><table><thead><tr><th>' + T.ui.point + '</th><th>' +
      T.ui.sign + '</th><th>' + T.ui.deg + '</th><th>' + T.ui.house + '</th><th>' +
      T.ui.motion + '</th><th>' + T.ui.retroCol + '</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>';
  }

  function chartAspectsHtml() {
    var rows = E.chartAspects(natal).slice(0, 16).map(function (x) {
      return '<tr class="rowpt' + (x.a === chartSel ? ' rowpt--sel' : '') +
        '" data-point="' + x.a + '">' +
        '<td>' + pName(x.a) + '</td><td>' + T.aspects[x.data.aspect] + '</td><td>' +
        pName(x.b) + '</td><td>' + fmtDeg(x.data.orb) + '</td><td>' +
        toneTag(x.data.tone) + '</td></tr>';
    }).join('');
    return '<div class="tw"><table><thead><tr><th>A</th><th>' + T.ui.aspects +
      '</th><th>B</th><th>' + T.ui.orb + '</th><th>' + T.ui.tone +
      '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* --- баланс стихий и крестов ---------------------------------------------

     Раньше здесь стояла таблица из семи голых чисел: «Огонь 3, Земля 4…».
     Число точек в стихии само по себе не говорит ничего — непонятно ни от
     чего оно считается, ни много это или мало, ни что с этим делать. Хуже
     того, подсчёт «в лоб» считал Плутон наравне с Солнцем, а Плутон стоит в
     одном знаке двадцать лет: у целого поколения выходил один и тот же
     «портрет».

     Теперь считаем взвешенно (веса и причина — в engine.js, balance) и
     показываем три вещи вместо одной: долю каждой стихии полосой, что из
     этого следует словами, и открытую методику — по каким весам посчитано и
     что меняется без времени рождения. Методика в <details>: тем, кто хочет
     проверить, она нужна целиком, остальным — не мешает. */
  function balGroupHtml(kind, pct, names, top, low) {
    var keys = Object.keys(pct);
    var rows = keys.map(function (k) {
      var v = pct[k];
      var isTop = top.indexOf(k) >= 0;
      var isLow = low === k;
      return '<div class="bal__row' + (isTop ? ' bal__row--top' : '') +
        (isLow ? ' bal__row--low' : '') + '">' +
        '<span class="bal__n">' + names[k] + '</span>' +
        '<span class="bal__bar"><i style="width:' + v + '%"></i></span>' +
        '<span class="bal__p">' + Math.round(v) + '%</span>' +
        '</div>';
    }).join('');
    return '<div class="bal__g" role="img" aria-label="' +
      esc(T.ui[kind === 'el' ? 'elements' : 'modes'] + ': ' +
        keys.map(function (k) { return names[k] + ' ' + Math.round(pct[k]) + '%'; }).join(', ')) +
      '">' + rows + '</div>';
  }

  /* Словесный вывод. Ничья обрабатывается отдельно: назвать одну из двух
     равных стихий ведущей — значит придумать человеку акцент, которого в
     карте нет. Дефицит называется только если доля ниже половины равномерной
     (порог считает engine.js), иначе говорим, что перекоса нет. */
  function balSayHtml(top, low, texts, names, evenText) {
    var out = [];
    if (top.length === 1) {
      out.push(sentence(texts[top[0]].lead));
    } else if (top.length === 2) {
      out.push(sentence(T.bal.tie2.replace('{a}', names[top[0]]).replace('{b}', names[top[1]])));
    } else {
      out.push(sentence(T.bal.tieMany));
    }
    out.push(low ? sentence(texts[low].low) : sentence(evenText));
    return '<p class="p">' + out.join(' ') + '</p>';
  }

  function balanceHtml(ch) {
    var b = ch.balance;
    var method = T.bal.method.replace('{n}', b.total) +
      (b.withAngles ? '' : ' ' + T.bal.noAngles);
    return '<div class="bal">' +
      '<div class="bal__h">' + T.ui.elements + '</div>' +
      balGroupHtml('el', b.pct.elements, T.elements, b.top.element, b.low.element) +
      balSayHtml(b.top.element, b.low.element, T.bal.el, T.elements, T.bal.evenEl) +
      '<div class="bal__h">' + T.ui.modes + '</div>' +
      balGroupHtml('mo', b.pct.modes, T.modes, b.top.mode, b.low.mode) +
      balSayHtml(b.top.mode, b.low.mode, T.bal.mo, T.modes, T.bal.evenMo) +
      '<details class="bal__m"><summary>' + T.bal.how + '</summary>' +
      '<p class="note">' + method + '</p></details>' +
      '</div>';
  }

  function chartBalanceHtml() { return balanceHtml(natal); }

  /* Карточка выбранной точки: T.nPoint покрывает все точки, включая ASC/MC;
     T.planetElement — только 10 планет + Node (глубже про стихию знака),
     для ASC/MC добавки просто нет — показываем один общий смысл точки. */
  /* Инспектор выбранной точки. На десктопе стоит справа от колеса и не
     уезжает при прокрутке — раньше правая половина экрана на этой вкладке
     просто пустовала, а детали лежали отдельной карточкой под колесом.

     Четыре слоя, сверху вниз: что это за точка, где она в карте, с чем
     связана внутри карты, что её задевает снаружи прямо сейчас. Последние
     два кликабельны — отсюда начинаются переходы вглубь. */
  function chartInspectorHtml(pts) {
    var p = chartFind(pts, chartSel);
    if (!p) { return ''; }
    /* T.nPoint — оборот, а не предложение: в транзитах он стоит в середине
       фразы («...поддерживает ваше ощущение себя»). Отдельной строкой в
       инспекторе его надо оформить — иначе два фрагмента склеиваются без
       точки и со строчной буквы посреди абзаца. */
    var txt = sentence(T.nPoint[p.name] || '');
    var extra = T.planetElement[p.name] && T.planetElement[p.name][p.sign.element];

    var houseHtml = p.house
      ? '<div class="phouse"><span class="phouse__n">' + T.houses[p.house].n + '</span>' +
        '<span class="phouse__t">' + T.houses[p.house].t + '</span></div>'
      : '';

    /* Аспекты именно этой точки: chartAspects отдаёт пары, поэтому берём и
       те, где точка стоит второй, и разворачиваем к ней. */
    var own = [];
    E.chartAspects(natal).forEach(function (x) {
      if (x.a === p.name) { own.push({ other: x.b, data: x.data }); }
      else if (x.b === p.name) { own.push({ other: x.a, data: x.data }); }
    });
    own.sort(function (x, y) { return x.data.orb - y.data.orb; });
    var aspHtml = own.length ? '<ul class="pasp">' + own.slice(0, 6).map(function (a) {
      return '<li class="pasp__i"><button type="button" class="pasp__b" data-point="' + a.other + '">' +
        '<span class="pasp__main">' + T.aspects[a.data.aspect] + ' <b>' + pName(a.other) + '</b></span>' +
        toneTag(a.data.tone) +
        '<span class="pasp__meta">' + T.sec.orb + ' ' + fmtDeg(a.data.orb) + '</span>' +
        '<span class="pasp__go" aria-hidden="true">›</span></button></li>';
    }).join('') + '</ul>' : '<p class="pmuted">' + T.sec.noAspectsOf + '</p>';

    /* Что задевает эту точку снаружи прямо сейчас — связь карты с текущим
       небом, которой на вкладке не было вовсе. Каждая строка ведёт в
       проводник транзитов с этим транзитом уже выбранным. */
    var tr = E.activeTransits(natal, Clock.get()).filter(function (t) {
      return t.natal === p.name;
    }).slice(0, 4);
    var trHtml = tr.length ? '<ul class="pasp">' + tr.map(function (t) {
      return '<li class="pasp__i"><button type="button" class="pasp__b" data-cngo="horoscope/' +
        esc(t.transit + '-' + t.natal + '-' + t.aspect) + '">' +
        '<span class="pasp__main"><b>' + pName(t.transit) + '</b> ' + T.aspects[t.aspect] + '</span>' +
        toneTag(t.tone) +
        '<span class="pasp__meta">' + T.sec.orb + ' ' + fmtDeg(t.orb) + '</span>' +
        '<span class="pasp__go" aria-hidden="true">›</span></button></li>';
    }).join('') + '</ul>' : '<p class="pmuted">' + T.sec.noContacts + '</p>';

    return '<aside class="insp" id="chartInsp">' +
      '<div class="insp__head"><span class="insp__icon">' + ZODIAC_GLYPHS[p.sign.index] + '</span>' +
        '<div><div class="insp__title">' + pName(p.name) + '</div>' +
        '<div class="insp__sub">' + signName(p.sign) + ' ' + fmtDeg(p.sign.degree) +
        (p.retro ? ' · R' : '') + '</div></div></div>' +
      (houseHtml ? '<div class="insp__sec">' + houseHtml + '</div>' : '') +
      '<p class="insp__text">' + txt + (extra ? ' ' + extra : '') + '</p>' +
      '<div class="insp__sec"><h3 class="pcard__t">' + termHtml('aspect', T.sec.aspectsOf) + '</h3>' + aspHtml + '</div>' +
      '<div class="insp__sec"><h3 class="pcard__t">' + termHtml('transit', T.sec.transitsTo) + '</h3>' + trHtml + '</div>' +
      '</aside>';
  }

  /* --- двойное колесо: натал + небо на выбранную дату ------------------------

     Карта была единственным разделом, который не слушал общие часы: она
     всегда показывала натал и никогда — небо. То есть раздел, где у человека
     нарисована его карта, ничего не знал о том, что происходит с ней прямо
     сейчас, хотя весь остальной продукт про это и говорит.

     Теперь снаружи полосы знаков идёт второе кольцо — положения тел на дату
     из Clock, той же панелью перемотки, что в Луне и Ретроградах. Транзитную
     точку можно выбрать так же, как натальную, и инспектор покажет, чего она
     касается в карте и когда аспект точен.

     Режим выключается: кому нужен чистый натал, тот его получает, и это
     состояние живёт вместе с выбранной точкой в адресе. */
  var chartTx = true;

  function chartTxPoints(date) {
    return E.BODIES.map(function (b) { return E.bodyAt(b, date); });
  }

  function chartModeHtml() {
    return '<div class="chartmode" role="group" aria-label="' + esc(T.sec.wheelMode) + '">' +
      '<button type="button" class="chartmode__b' + (chartTx ? '' : ' on') +
        '" data-chartmode="natal" aria-pressed="' + (!chartTx) + '">' + T.sec.modeNatal + '</button>' +
      '<button type="button" class="chartmode__b' + (chartTx ? ' on' : '') +
        '" data-chartmode="transit" aria-pressed="' + chartTx + '">' + T.sec.modeTransit + '</button>' +
      '</div>';
  }

  function chartTxChipsHtml(txPts) {
    return '<div class="chartchips chartchips--tx">' +
      '<span class="chartchips__lab">' + T.ui.transitCol + '</span>' +
      txPts.map(function (p) {
        return '<button type="button" class="chip chip--tx' +
          (chartSel === 't:' + p.name ? ' on' : '') + '" data-txpoint="' + p.name + '">' +
          pName(p.name) + ' ' + ZODIAC_GLYPHS[p.sign.index] +
          (p.retro ? ' <span class="chip__r">R</span>' : '') + '</button>';
      }).join('') + '</div>';
  }

  /* --- подсказка при первом входе ------------------------------------------
     Одна фраза, один раз, на одном экране. Нажатие по точке на колесе —
     единственное неочевидное действие в продукте: колесо выглядит картинкой,
     и без подсказки половина функциональности карты остаётся ненайденной.

     Показывается до первого осознанного действия и больше никогда: флаг
     ложится в localStorage и при выборе точки, и при нажатии на крестик. Ни
     карусели, ни шагов, ни затемнения экрана — подсказка ничего не
     перекрывает и ничему не мешает. На десктопе не показывается вовсе: там
     курсор меняется на указатель при наведении, и это уже ответ. */
  var HINT_KEY = 'astromap.hints';

  function hintSeen(name) {
    try {
      var h = JSON.parse(localStorage.getItem(HINT_KEY) || '{}');
      return !!h[name];
    } catch (e) { return true; }   /* нет доступа к хранилищу — не навязываемся */
  }
  function hintDismiss(name) {
    try {
      var h = JSON.parse(localStorage.getItem(HINT_KEY) || '{}');
      h[name] = 1;
      localStorage.setItem(HINT_KEY, JSON.stringify(h));
    } catch (e) { /* игнор */ }
    var node = document.querySelector('.hint[data-hint="' + name + '"]');
    if (!node) { return; }
    /* Снимаем и пометку на блоке колеса, иначе колесо останется ужатым на
       высоту подсказки, которой уже нет. */
    var box = node.closest('.wheelbox--hint');
    if (box) { box.classList.remove('wheelbox--hint'); }
    node.remove();
  }
  function hintHtml(name, text) {
    if (hintSeen(name)) { return ''; }
    return '<div class="hint" data-hint="' + name + '" role="status">' +
      '<span class="hint__t">' + esc(text) + '</span>' +
      '<button type="button" class="hint__x" data-hintx="' + name + '" aria-label="' +
        esc(T.ui.hintHide) + '">✕</button></div>';
  }

  /* Подсказка живёт внутри блока колеса, между самим колесом и лентой чипов:
     там она указывает ровно на то, о чём говорит, и не сдвигает ничего
     важного. */
  function hintChart() {
    return hintHtml('chartTap', T.ui.hintChart);
  }

  function chartBodyHtml() {
    var pts = chartPts();
    var date = Clock.get();
    var txPts = chartTx ? chartTxPoints(date) : null;
    /* Тела те же, что нарисованы на кольце. По умолчанию activeTransits
       берёт ещё и Узел — он оказался бы в списке контактов точкой, которой
       на колесе нет, и кликнуть по ней было бы некуда. */
    var txAsp = chartTx ? E.activeTransits(natal, date, { bodies: E.BODIES }) : null;

    /* Выбор мог остаться с прошлой отрисовки и указывать в выключенное
       кольцо — тогда возвращаемся на первую натальную точку, а не рисуем
       инспектор в пустоту. */
    var selIsTx = chartSel && chartSel.indexOf('t:') === 0;
    if (selIsTx && !chartTx) { chartSel = pts[0].name; selIsTx = false; }
    if (!chartSel || (!selIsTx && !chartFind(pts, chartSel))) { chartSel = pts[0].name; selIsTx = false; }

    /* Подсказка занимает высоту внутри блока колеса, а высота колеса на
       телефоне посчитана от остатка экрана: без пометки блок стал бы на
       полсотни пикселей выше, и верхушка шторки — тот самый признак, что
       ниже есть содержимое, — уехала бы за сгиб ровно в тот единственный
       заход, когда человек видит подсказку. Класс позволяет CSS вычесть её
       высоту из колеса, и расклад остаётся прежним. */
    var hint = hintChart();

    return (chartTx ? dateBarHtml() : '') + chartModeHtml() +
      '<div class="chart-pane">' +
        '<div class="wheelbox' + (hint ? ' wheelbox--hint' : '') + '">' +
          W.render(natal, 620, chartSel, { transits: txPts, txAspects: txAsp }) +
          hint +
          chartChipsHtml(pts) +
          (txPts ? chartTxChipsHtml(txPts) : '') + '</div>' +
        (selIsTx ? chartTxInspectorHtml(txPts, txAsp) : chartInspectorHtml(pts)) +
      '</div>' +
      (natal.asc ? '' : card(null, '<p class="empty">' + T.ui.timeMissing + '</p>')) +
      '<div class="chart-tables">' +
        card(T.ui.positions, chartPositionsHtml(pts)) +
        card(T.ui.balance, chartBalanceHtml()) +
        card(T.ui.aspects, chartAspectsHtml()) +
      '</div>';
  }

  /* Инспектор транзитной точки. Отвечает на другой вопрос, чем натальный:
     не «что это за точка в вас», а «что она сейчас делает с вашей картой».
     Поэтому вместо трактовки знака — дом, в который она идёт, список
     контактов с наталом и, для ближайшего из них, точная дата: она уже
     считается в transits.js, и без неё «квадрат к Солнцу» — факт без срока. */
  function chartTxInspectorHtml(txPts, txAsp) {
    var name = chartSel.slice(2);
    var p = null;
    txPts.forEach(function (x) { if (x.name === name) { p = x; } });
    if (!p) { return ''; }

    var house = natal.asc ? E.houseOfSign(natal, p.sign.index) : null;
    var houseHtml = house
      ? '<div class="phouse"><span class="phouse__n">' + T.houses[house].n + '</span>' +
        '<span class="phouse__t">' + T.houses[house].t + '</span></div>'
      : '<p class="pmuted">' + T.sec.houseUnknown + '</p>';

    var own = txAsp.filter(function (a) { return a.transit === name; })
      .sort(function (a, b) { return a.orb - b.orb; }).slice(0, 6);

    var aspHtml = own.length ? '<ul class="pasp">' + own.map(function (a) {
      return '<li class="pasp__i"><button type="button" class="pasp__b" data-point="' + a.natal + '">' +
        '<span class="pasp__main">' + T.aspects[a.aspect] + ' <b>' + pName(a.natal) + '</b></span>' +
        toneTag(a.tone) +
        '<span class="pasp__meta">' + T.sec.orb + ' ' + fmtDeg(a.orb) + ' · ' +
          (a.applying ? T.sec.applying : T.sec.separating) + '</span>' +
        '<span class="pasp__go" aria-hidden="true">›</span></button></li>';
    }).join('') + '</ul>' : '<p class="pmuted">' + T.sec.noContacts + '</p>';

    /* Точные даты ближайшего контакта. Считаются только для одного, самого
       тесного: Transits.detail прогоняет поиск границ и точных моментов по
       шагам, и на шести аспектах сразу это заметно подвешивает отрисовку.
       Аспект без срока — факт, с которым нечего делать: «квадрат к Солнцу»
       без даты не отличается от «квадрат когда-нибудь». */
    var exactHtml = '';
    if (own.length) {
      var top = own[0];
      var d = Tr.detail(natal, top, Clock.get());
      if (d && d.exacts && d.exacts.length) {
        exactHtml = '<div class="insp__sec"><h3 class="pcard__t">' + T.ui.exactDates + '</h3>' +
          '<p class="pmuted">' + pName(top.transit) + ' ' + T.aspects[top.aspect] + ' ' +
          pName(top.natal) + '</p>' +
          (d.triple ? '<p class="pmuted">' + T.sec.tripleNote + '</p>' : '') +
          '<ul class="tx-exact">' +
          d.exacts.slice(0, 3).map(function (m) {
            return '<li>' + fmtDateTime(m) + '</li>';
          }).join('') + '</ul></div>';
      }
    }

    return '<aside class="insp insp--tx" id="chartInsp">' +
      '<div class="insp__head"><span class="insp__icon">' + ZODIAC_GLYPHS[p.sign.index] + '</span>' +
        '<div><div class="insp__title">' + pName(p.name) +
          ' <span class="insp__badge">' + T.ui.transitCol + '</span></div>' +
        '<div class="insp__sub">' + signName(p.sign) + ' ' + fmtDeg(p.sign.degree) +
        (p.retro ? ' · R' : '') + '</div></div></div>' +
      '<div class="insp__sec">' + houseHtml + '</div>' +
      '<div class="insp__sec"><h3 class="pcard__t">' + termHtml('transit', T.sec.txTouches) + '</h3>' + aspHtml + '</div>' +
      exactHtml +
      '</aside>';
  }

  function rerenderChart() {
    var body = el('chartBody');
    if (!body) { return; }
    body.innerHTML = chartBodyHtml();
    /* Адрес правим ПОСЛЕ отрисовки: при выключении транзитного кольца
       chartBodyHtml сбрасывает выбор с транзитной точки на натальную, и
       адрес, записанный заранее, остался бы ссылаться на 't:Mars', которого
       на экране уже нет. */
    syncHash('chart', [chartSel, chartTx && !Clock.isToday() ? Clock.toKey() : null]);
    body.classList.remove('fade-in');
    void body.offsetWidth;
    body.classList.add('fade-in');
    bindChart();
    bindTerms(body);
  }

  function bindChart() {
    var body = el('chartBody');
    if (!body) { return; }
    function select(name) {
      if (!name) { return; }
      /* Любой осознанный тап по точке — уже ответ на вопрос, который задаёт
         подсказка, поэтому гасим её до проверки «а не та же ли это точка»:
         повторный тап по выбранной планете тоже означает, что человек понял,
         как это работает. */
      hintDismiss('chartTap');
      if (name === chartSel) { return; }
      chartSel = name;
      rerenderChart();
    }
    /* Крестик закрывает подсказку, ничего не перерисовывая: hintDismiss сам
       убирает узел из DOM и ставит флаг, чтобы она не вернулась. */
    Array.prototype.slice.call(body.querySelectorAll('[data-hintx]')).forEach(function (b) {
      b.addEventListener('click', function () {
        hintDismiss(b.getAttribute('data-hintx'));
      });
    });
    Array.prototype.slice.call(body.querySelectorAll('[data-point]')).forEach(function (node) {
      node.addEventListener('click', function () { select(node.getAttribute('data-point')); });
    });
    /* <g role="button"> в SVG не активируется Enter/Space нативно, как это
       делает <button> (чипы) — добавляем клавиатурную активацию вручную. */
    Array.prototype.slice.call(body.querySelectorAll('[data-cngo]')).forEach(function (b) {
      b.addEventListener('click', function () {
        location.hash = '#' + b.getAttribute('data-cngo');
      });
    });
    Array.prototype.slice.call(body.querySelectorAll('.w-pt')).forEach(function (grp) {
      grp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
          ev.preventDefault();
          select(grp.getAttribute('data-point'));
        }
      });
    });

    /* Транзитные точки — то же самое, но выбор помечается префиксом 't:',
       чтобы одно поле chartSel различало натальную Венеру и сегодняшнюю. */
    Array.prototype.slice.call(body.querySelectorAll('[data-txpoint]')).forEach(function (node) {
      node.addEventListener('click', function () {
        select('t:' + node.getAttribute('data-txpoint'));
      });
      if (node.classList.contains('w-tx')) {
        node.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
            ev.preventDefault();
            select('t:' + node.getAttribute('data-txpoint'));
          }
        });
      }
    });

    Array.prototype.slice.call(body.querySelectorAll('[data-chartmode]')).forEach(function (b) {
      b.addEventListener('click', function () {
        var want = b.getAttribute('data-chartmode') === 'transit';
        if (want === chartTx) { return; }
        chartTx = want;
        /* Тяжёлый шаг: включение кольца считает десять положений тел и все
           контакты с наталом. Показываем счёт, иначе нажатие выглядит как
           подвисшая кнопка. */
        withBusy(body, rerenderChart);
      });
    });

    /* Панель перемотки даты — та же, что в Луне и Ретроградах. */
    bindDateBar(body, function () { withBusy(body, rerenderChart); });
  }

  views.chart = function () {
    if (!natal) { return needProfile('needText') + skyNow(); }
    return '<div class="chartbody" id="chartBody">' + chartBodyHtml() + '</div>';
  };

  views.match = function () {
    /* Быстрый выбор по знакам не требует данных рождения — доступен всегда.
       Если натальные карты уже посчитаны, подставляем реальные знаки Солнца
       по умолчанию, чтобы блок не выглядел пустым при первом заходе. */
    if (mcSignA == null && natal && natal.byName && natal.byName.Sun) {
      mcSignA = natal.byName.Sun.sign.index;
    }
    if (mcSignB == null && partnerChart && partnerChart.byName && partnerChart.byName.Sun) {
      mcSignB = partnerChart.byName.Sun.sign.index;
    }
    mcEnsureCategories();
    var quick = cardWide(T.ui.mcTitle,
      '<p class="p mcnote">' + T.ui.mcNote + '</p>' +
      '<div class="mcpick">' +
        '<div class="mcpick__col"><div class="mcpick__l">' + T.ui.mcPickA + '</div>' +
          '<div class="signgrid" id="mcGridA">' + mcGridHtml('A', mcSignA) + '</div></div>' +
        '<div class="mcpick__col"><div class="mcpick__l">' + T.ui.mcPickB + '</div>' +
          '<div class="signgrid" id="mcGridB">' + mcGridHtml('B', mcSignB) + '</div></div>' +
      '</div>' +
      '<div id="mcResult">' + mcResultHtml() + '</div>');

    if (!natal) {
      return quick + needProfile('needTextMatch') +
        card(T.ui.matchIntro, '<p class="p">' + T.ui.matchIntroText + '</p>');
    }
    var form = personForm('partner', S.partner);
    if (!partnerChart) {
      return quick + card(T.ui.partnerTitle,
          '<p class="p">' + T.ui.needTextMatch.replace(/^[^.]*\.\s*/, '') + '</p>' + form) +
        card(T.ui.matchIntro, '<p class="p">' + T.ui.matchIntroText + '</p>');
    }
    var syn = E.synastry(natal, partnerChart);
    var comp = E.composite(natal, partnerChart);

    /* Сильнейшие контакты были таблицей, из которой никуда нельзя было
       перейти: раздел знал, что Луна человека связана с Венерой партнёра, и
       не давал посмотреть эту Луну в карте. Теперь каждая строка ведёт к
       СВОЕЙ точке (колонка A — точка владельца профиля). */
    var hitsHtml = '<ul class="pasp">' + syn.top.map(function (h) {
      return '<li class="pasp__i"><button type="button" class="pasp__b" data-gopoint="' + h.a + '">' +
        '<span class="pasp__main"><b>' + pName(h.a) + '</b> ' + T.aspects[h.aspect] +
        ' ' + pName(h.b) + '</span>' + toneTag(h.tone) +
        '<span class="pasp__meta">' + T.sec.orb + ' ' + fmtDeg(h.orb) + '</span>' +
        '<span class="pasp__go" aria-hidden="true">›</span></button></li>';
    }).join('') + '</ul>';
    var cpts = comp.points.concat(comp.asc ? [comp.asc, comp.mc] : []).map(function (p) {
      return [pName(p.name), signName(p.sign), fmtDeg(p.sign.degree)];
    });

    return quick + card(T.ui.index,
        '<div class="score"><div class="score__n">' + syn.score + '%</div>' +
        '<div class="score__b"><i style="width:' + syn.score + '%"></i></div></div>',
        T.ui.indexNote) +
      card(T.ui.strongest, hitsHtml) +
      card(T.ui.composite, table([T.ui.point, T.ui.sign, T.ui.deg], cpts),
           T.ui.compositeNote) +
      card(T.ui.partnerTitle, form);
  };

  /* Числа считались всегда «на сегодня» и были единственным разделом, не
     замечавшим выбранную дату. Личный день, месяц и год — величины
     календарные, и если в остальном продукте человек листает время, здесь
     оно тоже должно листаться: иначе два раздела на одном экране говорят о
     разных днях. Ядро нумерологии уже принимает дату параметром — менять
     там ничего не пришлось. */
  function numbersBodyHtml() {
    var n = N.full(S.profile, Clock.get());
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

    return card(T.ui.numbersTitle, core, (S.profile.name ? '' : T.ui.nameNeeded)) +
      card(T.ui.pYear, cycles);
  }

  /* Перерисовываем страницу целиком, а не только карточки: панель даты
     живёт над ними и сама показывает выбранный день — при обновлении одних
     карточек личный день менялся, а подпись на панели оставалась вчерашней. */
  function rerenderNumbers() {
    var page = el('numPage');
    if (!page) { return; }
    page.innerHTML = dateBarHtml() + '<div class="numbody" id="numBody">' + numbersBodyHtml() + '</div>';
    bindDateBar(page, rerenderNumbers);
  }

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
    return '<div class="numpage" id="numPage">' + dateBarHtml() +
      '<div class="numbody" id="numBody">' + numbersBodyHtml() + '</div></div>';
  };

  /* --- страница «Фаза Луны»: интерактивный лунный календарь --------------
     Один источник состояния (дата в Clock) -> вся остальная разметка
     пересчитывается из него: герой, бейдж освещённости, знак, карточка
     интерпретации и советы дня (см. ТЗ п.11). Клик по дню календаря или
     смена месяца перерисовывают только #moonBody — без полного route()
     и без сброса скролла/шапки, тем же приёмом, что уже использует
     переключатель периодов Гороскопа (#hzBody). */
  function moonLocale() { return LOCALE_MAP[window.APP_LANG] || 'en-US'; }

  function moonWeekdayLabels() {
    var fmt = new Intl.DateTimeFormat(moonLocale(), { weekday: 'short' });
    var out = [];
    for (var i = 0; i < 7; i++) { out.push(fmt.format(new Date(2023, 0, 2 + i))); } /* 2.01.2023 — понедельник */
    return out;
  }
  function moonMonthName(year, month) {
    return new Intl.DateTimeFormat(moonLocale(), { month: 'long' }).format(new Date(year, month, 1));
  }
  function moonHeroDateStr(date) {
    return new Intl.DateTimeFormat(moonLocale(),
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function isoDay(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* Видимый месяц календаря — отдельное состояние от выбранной даты: листать
     месяцы можно, не теряя выбранный день, герой и советы остаются на нём.
     Сама выбранная дата теперь общая на продукт и живёт в Clock, поэтому
     переход отсюда в Ретрограды (и обратно) сохраняет день. */
  var moonViewY = null, moonViewM = null;
  function moonEnsureState() {
    var d = Clock.get();
    if (moonViewY === null) { moonViewY = d.getFullYear(); moonViewM = d.getMonth(); }
  }
  /* После прыжка по дате (панель, фаза, кнопка «сегодня») календарь должен
     показывать месяц выбранного дня — иначе выделенной ячейки не видно. */
  function moonSyncMonth() {
    var d = Clock.get();
    moonViewY = d.getFullYear(); moonViewM = d.getMonth();
  }

  /* Заголовок «Фаза Луны сегодня» верен только для сегодняшнего дня: с тех
     пор как дату можно перематывать, для любого другого дня он врал бы. Для
     остальных дней заголовком становится сама дата, а дублировавшая её
     строка сверху убрана — дату теперь показывает панель. */
  function moonHeroHtml(info) {
    return '<div class="mp-hero">' +
      '<h2 class="mp-title">' +
        (Clock.isToday() ? T.ui.moonHeroTitle : moonHeroDateStr(info.date)) + '</h2>' +
      '<div class="mp-moon">' + Moon.moonHtml(300, info.illum, info.waxing, 'hero') +
        '<span class="mp-illum"><b>' + Math.round(info.illum * 100) + '%</b> ' + T.ui.illuminated + '</span>' +
      '</div>' +
      '<span class="mp-zodiac">' + ZODIAC_GLYPHS[info.sign.index] + ' ' + T.signs[info.sign.index] + '</span>' +
      '</div>';
  }

  function moonCalHtml() {
    var cells = Moon.monthGrid(moonViewY, moonViewM);
    var wd = moonWeekdayLabels().map(function (w) {
      return '<span class="mp-cal__wd">' + w + '</span>';
    }).join('');
    var today = new Date();
    var grid = cells.map(function (c) {
      var cls = 'mp-cal__cell';
      if (!c.inMonth) { cls += ' mp-cal__cell--out'; }
      if (sameDay(c.date, today)) { cls += ' mp-cal__cell--today'; }
      var sel = sameDay(c.date, Clock.get());
      if (sel) { cls += ' mp-cal__cell--sel'; }
      var ph = T.moonPhase[c.info.phaseIndex];
      var label = c.date.getDate() + ' ' + moonMonthName(c.date.getFullYear(), c.date.getMonth()) +
        ', ' + ph.n + ', ' + Math.round(c.info.illum * 100) + '% ' + T.ui.illuminated.toLowerCase();
      return '<button type="button" class="' + cls + '" data-iso="' + isoDay(c.date) +
        '" aria-label="' + esc(label) + '" aria-pressed="' + sel + '">' +
        Moon.moonHtml(34, c.info.illum, c.info.waxing, 'cal') +
        '<span class="mp-cal__num">' + c.date.getDate() + '</span></button>';
    }).join('');
    return '<div class="mp-cal">' +
      '<div class="mp-cal__head">' +
        '<button type="button" class="mp-cal__nav" data-nav="-1" aria-label="' + T.ui.prevMonth + '">←</button>' +
        '<span class="mp-cal__title"><b>' + moonMonthName(moonViewY, moonViewM) + '</b> <span class="mp-cal__yr">' + moonViewY + '</span></span>' +
        '<button type="button" class="mp-cal__nav" data-nav="1" aria-label="' + T.ui.nextMonth + '">→</button>' +
      '</div>' +
      '<div class="mp-cal__grid">' + wd + grid + '</div>' +
      '</div>';
  }

  function moonSignHtml(info) {
    return '<div class="mp-sign">' +
      '<div class="mp-sign__head"><span class="mp-sign__icon">' + ZODIAC_GLYPHS[info.sign.index] + '</span>' +
      '<h3 class="mp-sign__title">' + T.ui.moonInSign + ' ' + T.signsLoc[info.sign.index] + '</h3></div>' +
      '<p class="mp-sign__text">' + (T.moonSignText[info.sign.key] || '') + '</p>' +
      '</div>';
  }

  function moonAdviceHtml(info) {
    var items = Moon.adviceFor(info.sign, info.bucket).map(function (a) {
      var meta = T.moonAdvice[a.key];
      var arrow = a.status === 'favorable' ? '↑ ' : a.status === 'unfavorable' ? '↓ ' : '— ';
      return '<article class="mp-adv mp-adv--' + a.status + '">' +
        '<span class="mp-adv__icon">' + a.icon + '</span>' +
        '<span class="mp-adv__body"><span class="mp-adv__title">' + meta.title + '</span>' +
        '<span class="mp-adv__desc">' + meta.desc + '</span></span>' +
        '<span class="mp-adv__status mp-adv__status--' + a.status + '">' + arrow + T.moonStatus[a.status] + '</span>' +
        '</article>';
    }).join('');
    return '<div class="mp-advice"><h2 class="mp-advice__title">' + T.ui.dailyAdviceTitle + '</h2>' + items + '</div>';
  }

  /* Ближайшая смена знака — единственное место в продукте, где важно время
     суток, поэтому здесь и обратный отсчёт. Считаем от «сейчас», когда
     выбран сегодняшний день, и от самой даты во всех остальных случаях:
     иначе для выбранного дня в прошлом отсчёт был бы отрицательным. */
  function moonNextHtml() {
    var base = Clock.isToday() ? new Date() : Clock.get();
    var sc = Moon.nextSignChange(base);
    if (!sc) { return ''; }
    var left = '';
    if (Clock.isToday()) {
      var ms = sc.date.getTime() - Date.now();
      if (ms > 0) {
        var h = Math.floor(ms / 3600000), mi = Math.round((ms % 3600000) / 60000);
        left = '<span class="mp-next__in">' + h + ' ' + T.sec.hoursShort + ' ' +
               mi + ' ' + T.sec.minShort + '</span>';
      }
    }
    return '<div class="mp-next">' +
      '<span class="mp-next__l">' + T.sec.signChange + '</span>' +
      '<span class="mp-next__v">' + ZODIAC_GLYPHS[sc.to.index] + ' ' + T.signs[sc.to.index] +
        ' · ' + shortDate(sc.date) + ', ' + clockTime(sc.date) + '</span>' + left +
      '</div>';
  }

  /* Четыре ближайшие главные фазы с точным временем. Каждая кликабельна и
     переносит на свой момент — это и есть «перемотка» лунного месяца. */
  function moonPhasesHtml() {
    var list = Moon.quartersFrom(Clock.get(), 4);
    if (!list.length) { return ''; }
    var items = list.map(function (q) {
      var ph = T.moonPhase[q.phaseIndex];
      return '<button type="button" class="mp-ph" data-clockjump="' + q.date.getTime() + '">' +
        Moon.moonHtml(38, q.illum, q.quarter < 2, 'cal') +
        '<span class="mp-ph__n">' + ph.n + '</span>' +
        '<span class="mp-ph__d">' + shortDate(q.date) + ', ' + clockTime(q.date) + '</span>' +
        '<span class="mp-ph__s">' + ZODIAC_GLYPHS[q.sign.index] + ' ' + T.signs[q.sign.index] + '</span>' +
        '</button>';
    }).join('');
    return '<section class="mp-phases"><h3 class="mp-phases__t">' + T.sec.upcomingPhases + '</h3>' +
      '<div class="mp-phases__row">' + items + '</div></section>';
  }

  function moonMeHtml() {
    return '<section class="mp-me"><h3 class="mp-me__t">' + T.sec.moonAndYou + '</h3>' +
      (natal ? personalHtml('Moon') : personalNeedHtml()) + '</section>';
  }

  function moonBodyHtml() {
    moonEnsureState();
    var info = Moon.infoFor(Clock.get());
    return dateBarHtml() + moonHeroHtml(info) + moonNextHtml() + moonPhasesHtml() +
      moonCalHtml() + moonMeHtml() + moonSignHtml(info) + moonAdviceHtml(info);
  }

  function rerenderMoon() {
    var body = el('moonBody');
    if (!body) { return; }
    syncHash('moon', [Clock.isToday() ? null : Clock.toKey()]);
    body.innerHTML = moonBodyHtml();
    body.classList.remove('fade-in');
    void body.offsetWidth;
    body.classList.add('fade-in');
    bindMoonBody();
    bindTerms(body);
  }

  function bindMoonBody() {
    var body = el('moonBody');
    if (!body) { return; }
    bindDateBar(body, function () { moonSyncMonth(); rerenderMoon(); });
    bindGoChart(body);
    Array.prototype.slice.call(body.querySelectorAll('.mp-cal__cell')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.dataset.iso.split('-').map(Number);
        Clock.set(new Date(p[0], p[1] - 1, p[2], 12, 0, 0, 0));
        moonSyncMonth();
        rerenderMoon();
      });
    });
    Array.prototype.slice.call(body.querySelectorAll('.mp-cal__nav')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        moonViewM += (+btn.dataset.nav);
        if (moonViewM < 0) { moonViewM = 11; moonViewY -= 1; }
        if (moonViewM > 11) { moonViewM = 0; moonViewY += 1; }
        rerenderMoon();
      });
    });
  }

  views.moon = function () {
    return '<div class="mp-page" id="moonBody">' + moonBodyHtml() + '</div>';
  };

  /* --- Ретрограды: проводник по циклам -------------------------------------
     Раздел собран вокруг трёх слоёв, а не вокруг списка планет:
       1. событие   — «Сатурн ретрограден в Рыбах», шкала цикла
       2. личное    — дом карты и текущие аспекты к натальным точкам
       3. смысл     — с чем период традиционно связывают, с фильтром по сфере

     Состояние раздела — планета и сфера; дата общая на продукт и живёт в
     Clock. Любое из трёх перерисовывает только #rxBody, без route() и без
     сброса скролла — тем же приёмом, что #moonBody и #chartBody. */
  var RX_AREAS = ['overview', 'love', 'career', 'money', 'communication', 'energy', 'inner'];
  var rxBody = null, rxArea = 'overview';

  /* Главная планета раздела: при заполненном профиле — та, что сильнее всего
     задевает карту, иначе самая быстрая (её цикл ближе и нагляднее). Ретро-
     градные всегда приоритетнее идущих прямо. */
  function rxDefaultBody(st) {
    var retro = st.filter(function (s) { return s.retro; });
    var pool = retro.length ? retro : st;
    var best = null;
    pool.forEach(function (s) {
      if (!best) { best = s; return; }
      if (natal && (s.relevance || best.relevance)) {
        if (s.relevance > best.relevance) { best = s; }
      } else if (Math.abs(s.speed) > Math.abs(best.speed)) { best = s; }
    });
    return best ? best.body : R.BODIES[0];
  }

  function rxEnsureState(st) {
    var known = st.some(function (s) { return s.body === rxBody; });
    if (!known) { rxBody = rxDefaultBody(st); }
  }

  /* Шкала цикла: предтень — ретроград — послетень в реальных пропорциях,
     с маркером выбранной даты. Если тень не посчиталась (краевой случай у
     границы поиска), шкалы просто нет — рисовать её по выдуманным границам
     нельзя. */
  function rxTimelineHtml(c) {
    if (!c.shadowStart || !c.shadowEnd) { return ''; }
    var t0 = c.shadowStart.getTime(), t1 = c.shadowEnd.getTime();
    var span = t1 - t0;
    if (span <= 0) { return ''; }
    var at = function (d) { return (d.getTime() - t0) / span * 100; };
    var r0 = at(c.stationRetro), r1 = at(c.stationDirect);
    var raw = (Clock.get().getTime() - t0) / span * 100;
    var now = Math.max(0, Math.min(100, raw));
    var outside = raw < -0.5 || raw > 100.5;

    var seg = function (from, to, kind, label) {
      return '<span class="rx-tl__seg rx-tl__seg--' + kind + '" style="left:' +
        from.toFixed(2) + '%;width:' + (to - from).toFixed(2) + '%" title="' + esc(label) + '"></span>';
    };
    var tick = function (pos, d) {
      return '<span class="rx-tl__tick" style="left:' + pos.toFixed(2) + '%">' +
        shortDate(d) + '</span>';
    };

    return '<div class="rx-tl">' +
      '<div class="rx-tl__bar">' +
        seg(0, r0, 'pre', T.sec.phase.pre) +
        seg(r0, r1, 'retro', T.sec.phase.retro) +
        seg(r1, 100, 'post', T.sec.phase.post) +
        '<span class="rx-tl__now' + (outside ? ' rx-tl__now--out' : '') +
          '" style="left:' + now.toFixed(2) + '%">' +
          '<span class="rx-tl__nowlabel">' + (Clock.isToday() ? T.sec.today : shortDate(Clock.get())) +
        '</span></span>' +
      '</div>' +
      '<div class="rx-tl__ticks">' + tick(0, c.shadowStart) + tick(r0, c.stationRetro) +
        tick(r1, c.stationDirect) + tick(100, c.shadowEnd) + '</div>' +
      '<div class="rx-tl__legend">' +
        '<span class="rx-tl__lg rx-tl__lg--pre">' + termHtml('shadow', T.sec.phase.pre) + '</span>' +
        '<span class="rx-tl__lg rx-tl__lg--retro">' + termHtml('retrograde', T.sec.phase.retro) + '</span>' +
        '<span class="rx-tl__lg rx-tl__lg--post">' + termHtml('shadow', T.sec.phase.post) + '</span>' +
      '</div></div>';
  }

  /* Счётчик под шкалой зависит от фазы: внутри ретрограда осмысленно
     «прошло / осталось», до него — «до разворота», в послетени — сколько
     осталось до конца тени. Показывать «осталось 0» в предтени было бы
     формально верно и при этом бессмысленно. */
  function rxCountersHtml(c) {
    var items = [];
    if (c.phase === 'retro') {
      items.push([T.sec.elapsed, c.daysElapsed]);
      items.push([T.sec.remaining, c.daysRemaining]);
    } else if (c.phase === 'pre' || c.phase === 'upcoming') {
      items.push([T.sec.untilRetro, c.daysUntilRetro]);
      items.push([T.sec.cycle, c.retroDays]);
    } else if (c.phase === 'post' && c.shadowEnd) {
      var left = Math.max(0, Math.round((c.shadowEnd.getTime() - Clock.get().getTime()) / 86400000));
      items.push([T.sec.remaining, left]);
      items.push([T.sec.cycle, c.retroDays]);
    }
    if (!items.length) { return ''; }
    return '<div class="rx-counts">' + items.map(function (it) {
      return '<span class="rx-count"><b>' + it[1] + '</b> <span>' + T.sec.dayShort +
        ' \u00b7 ' + it[0] + '</span></span>';
    }).join('') + '</div>';
  }

  function rxPickerHtml(st) {
    return '<div class="rx-pick" role="tablist" aria-label="' + esc(T.sec.pickPlanet) + '">' +
      st.map(function (s) {
        var state = s.retro ? 'retro' : 'direct';
        return '<button type="button" class="rx-pick__b' + (s.body === rxBody ? ' on' : '') +
          '" role="tab" aria-selected="' + (s.body === rxBody) + '" data-rxbody="' + s.body + '">' +
          '<span class="rx-pick__dot rx-pick__dot--' + state + '" aria-hidden="true"></span>' +
          '<span class="rx-pick__n">' + pName(s.body) + '</span>' +
          (s.retro ? '<span class="rx-pick__r">R</span>' : '') +
          '</button>';
      }).join('') + '</div>';
  }

  /* Слой 2 — личное. Разметка общая для всех разделов, см. personalHtml(). */
  function rxPersonalHtml(s) {
    if (!natal) {
      return '<section class="rx-card rx-card--need">' + personalNeedHtml() + '</section>';
    }
    return '<section class="rx-card">' + personalHtml(s.body) + '</section>';
  }

  /* Слой 3 — смысл. Собственный текст планеты (T.retro) показываем только
     когда она действительно идёт назад; в тени и до цикла честнее объяснить
     фазу, а не пересказывать ретроградную характеристику. */
  function rxMeaningHtml(s, c) {
    var tabs = RX_AREAS.map(function (k) {
      return '<button type="button" class="segbar__b' + (rxArea === k ? ' on' : '') +
        '" data-rxarea="' + k + '"><span class="segbar__t">' + T.sec.areas[k] + '</span></button>';
    }).join('');
    var body = '<p class="p">' + T.sec.phaseNote[c.phase] + '</p>';
    if (s.retro && T.retro[s.body]) { body += '<p class="p">' + T.retro[s.body] + '</p>'; }
    body += '<p class="p">' + T.sec.areaText[rxArea] + '</p>';
    return '<section class="rx-card">' +
      '<h3 class="pcard__t">' + T.sec.meaning + '</h3>' +
      '<div class="segbar rx-segbar" id="rxSegbar"><span class="segbar__ind" id="rxSegbarInd"></span>' +
        tabs + '</div>' +
      '<div class="rx-mean" id="rxMean">' + body + '</div>' +
      '<p class="note">' + T.sec.traditionNote + '</p>' +
      '</section>';
  }

  function rxDatesHtml(c) {
    var rows = R.keyDates(c).map(function (k) {
      var isPast = k.date.getTime() < Clock.get().getTime();
      return '<li class="rx-date' + (isPast ? ' rx-date--past' : '') + '">' +
        '<button type="button" class="rx-date__b" data-clockjump="' + k.date.getTime() + '">' +
        '<span class="rx-date__d">' + fmtDate(k.date) + '</span>' +
        '<span class="rx-date__l">' + T.sec.kd[k.key] + '</span>' +
        '<span class="rx-date__go" aria-hidden="true">\u203a</span></button></li>';
    }).join('');
    return '<section class="rx-card"><h3 class="pcard__t">' + termHtml('station', T.sec.keyDates) + '</h3>' +
      '<ul class="rx-dates">' + rows + '</ul></section>';
  }

  function rxSummaryHtml(st) {
    var retro = st.filter(function (s) { return s.retro; });
    if (!retro.length) {
      var next = R.nextRetrograde(Clock.get());
      return '<section class="rx-sum rx-sum--none">' +
        '<h2 class="rx-sum__h">' + T.sec.noneTitle + '</h2>' +
        '<p class="rx-sum__p">' + T.sec.noneText +
          (next ? ' ' + T.sec.nextIs + ': <b>' + pName(next.body) + '</b>, ' +
            fmtDate(next.stationRetro) + '.' : '') + '</p></section>';
    }
    var lead = null;
    retro.forEach(function (s) {
      if (!lead || (natal ? s.relevance > lead.relevance : Math.abs(s.speed) > Math.abs(lead.speed))) { lead = s; }
    });
    return '<section class="rx-sum">' +
      '<div class="rx-sum__count"><b>' + retro.length + '</b><span>' + T.sec.retroNow + '</span></div>' +
      '<div class="rx-sum__lead"><span>' + (natal ? T.sec.mostRelevant : T.sec.mostRelevantNoChart) +
        '</span><b>' + pName(lead.body) + '</b></div>' +
      '</section>';
  }

  function rxBodyHtml() {
    var st = R.statusAt(Clock.get(), natal);
    rxEnsureState(st);
    var s = null;
    st.forEach(function (x) { if (x.body === rxBody) { s = x; } });
    var c = R.cycleFor(rxBody, Clock.get());

    var hero;
    if (c) {
      hero = '<section class="rx-hero">' +
        '<p class="rx-hero__eyebrow">' + T.sec.phase[c.phase] + '</p>' +
        '<h2 class="rx-hero__h">' + pName(s.body) + ' <span class="rx-hero__sign">' +
          T.sec.inSign + ' ' + signName(s.sign) + '</span></h2>' +
        rxCountersHtml(c) + rxTimelineHtml(c) +
        '</section>';
    } else {
      hero = '<section class="rx-hero"><h2 class="rx-hero__h">' + pName(s.body) + '</h2>' +
        '<p class="pmuted">' + T.ui.noRetro + '</p></section>';
    }

    return dateBarHtml() + rxSummaryHtml(st) + rxPickerHtml(st) + hero +
      '<div class="rx-cols">' + rxPersonalHtml(s) +
      (c ? rxMeaningHtml(s, c) + rxDatesHtml(c) : '') + '</div>';
  }

  function rerenderRetro() {
    var body = el('rxBody');
    if (!body) { return; }
    syncHash('retro', [rxBody, Clock.isToday() ? null : Clock.toKey()]);
    body.innerHTML = rxBodyHtml();
    body.classList.remove('fade-in');
    void body.offsetWidth;
    body.classList.add('fade-in');
    positionSegIndicator('rxSegbar', 'rxSegbarInd', true);
    bindRetro();
    bindTerms(body);
  }

  function bindRetro() {
    var body = el('rxBody');
    if (!body) { return; }
    var pick = function (sel, fn) {
      Array.prototype.slice.call(body.querySelectorAll(sel)).forEach(fn);
    };
    pick('[data-rxbody]', function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('data-rxbody') === rxBody) { return; }
        rxBody = b.getAttribute('data-rxbody');
        rerenderRetro();
      });
    });
    bindDateBar(body, rerenderRetro);
    /* Смена сферы меняет только текст — перерисовывать весь раздел незачем,
       иначе скользящий индикатор дёрнется вместо анимации. */
    pick('[data-rxarea]', function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('on')) { return; }
        rxArea = b.getAttribute('data-rxarea');
        pick('[data-rxarea]', function (x) { x.classList.toggle('on', x === b); });
        positionSegIndicator('rxSegbar', 'rxSegbarInd', false);
        var st = R.statusAt(Clock.get(), natal), s = null;
        st.forEach(function (x) { if (x.body === rxBody) { s = x; } });
        var c = R.cycleFor(rxBody, Clock.get());
        var mean = el('rxMean');
        if (mean && c && s) {
          var html = '<p class="p">' + T.sec.phaseNote[c.phase] + '</p>';
          if (s.retro && T.retro[s.body]) { html += '<p class="p">' + T.retro[s.body] + '</p>'; }
          html += '<p class="p">' + T.sec.areaText[rxArea] + '</p>';
          mean.innerHTML = html;
        }
      });
    });
    bindGoChart(body);
  }

  views.retro = function () {
    return '<div class="rx" id="rxBody">' + rxBodyHtml() + '</div>';
  };

  /* --- поиск города: один общий список на все языки интерфейса -----------
     CITIES_ALL — плоские кортежи [name, countryCode, lat, lon, tz] (см.
     cities.js), отсортированы по населению по убыванию, так что при поиске
     самые крупные совпадения естественным образом идут первыми без
     отдельной сортировки на каждый запрос. */
  var CITY_NORM = null;
  function cityNorm(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function cityBuildIndex() {
    if (CITY_NORM) { return; }
    CITY_NORM = CITIES_ALL.map(function (c) { return cityNorm(c[0]); });
  }
  /* c — либо кортеж CITIES_ALL, либо уже сохранённый объект профиля
     {n, cc?, lat, lon, tz, dst?} — обеим формам нужна одна и та же подпись
     «Город, Страна» и в списке подсказок, и в поле при повторном открытии
     формы. */
  function cityLabelOf(c) {
    if (!c) { return ''; }
    if (Array.isArray(c)) {
      return c[0] + (c[1] ? ', ' + (COUNTRY_NAMES[c[1]] || c[1]) : '');
    }
    return (c.n || '') + (c.cc ? ', ' + (COUNTRY_NAMES[c.cc] || c.cc) : '');
  }
  function citySearch(q) {
    cityBuildIndex();
    var nq = cityNorm(q);
    if (nq.length < 2) { return []; }
    var pre = [], sub = [];
    for (var i = 0; i < CITIES_ALL.length; i++) {
      var at = CITY_NORM[i].indexOf(nq);
      if (at === 0) {
        pre.push(CITIES_ALL[i]);
        if (pre.length >= 30) { break; }
      } else if (at > 0 && sub.length < 30) {
        sub.push(CITIES_ALL[i]);
      }
    }
    return pre.concat(sub).slice(0, 30);
  }
  function cityOffsetOptions(sel) {
    var out = [];
    for (var h = -12; h <= 14; h += 0.5) {
      var sign = h < 0 ? '−' : '+';
      var ah = Math.abs(h), hh = Math.floor(ah), mm = Math.round((ah - hh) * 60);
      var label = 'UTC' + sign + (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
      out.push('<option value="' + h + '"' + (h === sel ? ' selected' : '') + '>' + label + '</option>');
    }
    return out.join('');
  }

  function personForm(kind, p) {
    p = p || {};
    var curCity = p.city || null;
    var curLabel = cityLabelOf(curCity);
    var manualPrefill = (curCity && (curCity.lat === null || curCity.lat === undefined)) ? (curCity.n || '') : '';
    var manualOffsetSel = (curCity && typeof curCity.tz === 'number') ? curCity.tz : 0;
    var cityField =
      '<div class="f citypick">' +
        '<span>' + T.ui.city + '</span>' +
        '<input type="text" class="citypick__input" autocomplete="off" role="combobox" ' +
          'aria-expanded="false" aria-autocomplete="list" aria-label="' + esc(T.ui.city) + '" ' +
          'placeholder="' + esc(T.ui.cityPlaceholder) + '" value="' + esc(curLabel) + '">' +
        '<input type="hidden" name="cityJson" value="' + esc(curCity ? JSON.stringify(curCity) : '') + '">' +
        '<div class="citypick__menu" role="listbox" hidden></div>' +
        '<button type="button" class="citypick__manualtoggle">' + T.ui.cityManual + '</button>' +
        '<div class="citypick__manualbox" hidden>' +
          '<input type="text" class="citypick__manualname" autocomplete="off" ' +
            'placeholder="' + esc(T.ui.cityManualName) + '" aria-label="' + esc(T.ui.cityManualName) + '" ' +
            'value="' + esc(manualPrefill) + '">' +
          '<select class="citypick__manualoffset" aria-label="' + esc(T.ui.cityManualOffset) + '">' +
            cityOffsetOptions(manualOffsetSel) + '</select>' +
          '<button type="button" class="citypick__manualapply">' + T.ui.cityManualApply + '</button>' +
        '</div>' +
      '</div>';
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
      cityField +
      '<button class="btn" type="submit">' +
        (kind === 'partner' ? T.ui.partnerAdd : T.ui.save) + '</button>' +
      '</form>';
  }

  /* Клик/Enter по подсказке, ручной ввод смещения — всё меняет только
     скрытое поле cityJson, которое читает обработчик submit ниже; сама
     форма остаётся обычной, без отдельного состояния вроде chartSel. */
  function bindCityPick() {
    Array.prototype.slice.call(document.querySelectorAll('.citypick')).forEach(function (wrap) {
      var input = wrap.querySelector('.citypick__input');
      var hidden = wrap.querySelector('input[name="cityJson"]');
      var menu = wrap.querySelector('.citypick__menu');
      var manualToggle = wrap.querySelector('.citypick__manualtoggle');
      var manualBox = wrap.querySelector('.citypick__manualbox');
      var manualName = wrap.querySelector('.citypick__manualname');
      var manualOffset = wrap.querySelector('.citypick__manualoffset');
      var manualApply = wrap.querySelector('.citypick__manualapply');
      var results = [], active = -1;

      function closeMenu() {
        menu.hidden = true; menu.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        active = -1;
      }
      function setActive(i) {
        var opts = Array.prototype.slice.call(menu.querySelectorAll('.citypick__opt'));
        opts.forEach(function (o, oi) { o.classList.toggle('on', oi === i); });
        active = i;
        if (opts[i]) { input.setAttribute('aria-activedescendant', opts[i].id); }
      }
      function selectResult(i) {
        var c = results[i];
        if (!c) { return; }
        input.value = cityLabelOf(c);
        hidden.value = JSON.stringify({ n: c[0], cc: c[1], lat: c[2], lon: c[3], tz: c[4] });
        closeMenu();
      }
      function renderMenu() {
        if (!results.length) {
          menu.innerHTML = '<div class="citypick__empty">' + T.ui.cityNoMatch + '</div>';
        } else {
          menu.innerHTML = results.map(function (c, i) {
            return '<div class="citypick__opt" role="option" id="cityopt-' + i + '" data-idx="' + i + '">' +
              esc(cityLabelOf(c)) + '</div>';
          }).join('');
          Array.prototype.slice.call(menu.querySelectorAll('.citypick__opt')).forEach(function (opt) {
            opt.addEventListener('mousedown', function (ev) {
              ev.preventDefault(); /* не терять фокус раньше клика по подсказке */
              selectResult(+opt.getAttribute('data-idx'));
            });
          });
        }
        menu.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      }
      input.addEventListener('input', function () {
        hidden.value = '';
        results = citySearch(input.value);
        if (!results.length && cityNorm(input.value).length < 2) { closeMenu(); return; }
        renderMenu();
      });
      input.addEventListener('keydown', function (ev) {
        if (menu.hidden) { return; }
        if (ev.key === 'ArrowDown') { ev.preventDefault(); setActive(Math.min(active + 1, results.length - 1)); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); setActive(Math.max(active - 1, 0)); }
        else if (ev.key === 'Enter') { if (active >= 0) { ev.preventDefault(); selectResult(active); } }
        else if (ev.key === 'Escape') { closeMenu(); }
      });
      input.addEventListener('blur', function () { setTimeout(closeMenu, 120); });

      manualToggle.addEventListener('click', function () { manualBox.hidden = !manualBox.hidden; });
      manualApply.addEventListener('click', function () {
        var name = manualName.value.trim();
        if (!name) { manualName.focus(); return; }
        hidden.value = JSON.stringify({ n: name, lat: null, lon: null, tz: parseFloat(manualOffset.value), dst: '' });
        input.value = name;
        closeMenu();
        manualBox.hidden = true;
      });
    });
  }

  /* --- профиль --------------------------------------------------------------

     Это первый экран продукта: без данных роутер открывает именно его, и
     после оплаты человек попадает сюда же. Раньше здесь была форма и три
     строки «Солнце — Телец», то есть самый слабый экран приложения стоял на
     входе и выглядел как страница настроек.

     Теперь это опорная точка: кто вы по карте (большая тройка с градусом и
     домом, каждая ведёт в колесо), чем карта наполнена (баланс стихий),
     какими данными это посчитано и что с этими данными можно сделать. Форма
     остаётся, но убирается под кнопку — она нужна раз, а экран открывают
     много раз. */
  function bigThreeHtml() {
    var items = [
      { name: 'Sun', p: natal.byName.Sun },
      { name: 'Moon', p: natal.byName.Moon },
      { name: 'ASC', p: natal.asc }
    ];
    var cells = items.map(function (it) {
      if (!it.p) {
        /* Без времени рождения асцендента нет. Молча пропустить нельзя:
           «большая тройка» из двух элементов читается как поломка, а не как
           следствие незаполненного поля. */
        return '<div class="big3__i big3__i--empty">' +
          '<div class="big3__k">' + pName('ASC') + '</div>' +
          '<div class="big3__v">—</div>' +
          '<div class="big3__d">' + T.bal.ascNeedsTime + '</div></div>';
      }
      var house = it.p.house || (natal.asc ? E.houseOfSign(natal, it.p.sign.index) : null);
      return '<button type="button" class="big3__i" data-gopoint="' + it.name + '">' +
        '<div class="big3__k">' + pName(it.name) + '</div>' +
        '<div class="big3__v">' + signName(it.p.sign) + '</div>' +
        '<div class="big3__d">' + fmtDeg(it.p.sign.degree) +
          (house ? ' · ' + T.houses[house].n : '') +
          (it.p.retro ? ' · R' : '') + '</div></button>';
    }).join('');
    return '<div class="big3">' + cells + '</div>' +
      '<p class="note">' + T.bal.big3Note + '</p>';
  }

  function birthLineHtml() {
    var p = S.profile;
    var city = cityOf(p);
    var date = new Date(p.y, p.m - 1, p.d);
    var time = p.timeKnown
      ? ((p.h < 10 ? '0' : '') + p.h + ':' + (p.min < 10 ? '0' : '') + p.min)
      : T.ui.noTime;
    return '<div class="kv"><span>' + T.ui.date + '</span><b>' + fmtDate(date) + '</b></div>' +
      '<div class="kv"><span>' + T.ui.time + '</span><b>' + esc(time) + '</b></div>' +
      '<div class="kv"><span>' + T.ui.city + '</span><b>' +
        esc(city.n || T.bal.cityUnset) + '</b></div>';
  }

  views.profile = function () {
    if (!S.profile) {
      var getList = '<ul class="list">' + T.ui.getList.map(function (x) {
        return '<li>' + x + '</li>';
      }).join('') + '</ul>';
      return card(T.ui.profileTitle,
          '<p class="p">' + T.ui.profileIntro + '</p>' + personForm('profile', null)) +
        card(T.ui.whatYouGet, getList) +
        skyNow();
    }

    var name = (S.profile.name || '').trim();
    var head = '<p class="p">' + (name ? esc(name) + ' — ' : '') +
      T.bal.mapIntro + '</p>' + bigThreeHtml();

    /* Форма спрятана, но лежит в разметке: так она не перестраивается при
       каждом открытии, а автозаполнение города продолжает работать — bind()
       вешает обработчики один раз на весь экран. */
    var data = birthLineHtml() +
      '<button type="button" class="btn btn--ghost" id="profEdit" aria-expanded="false" ' +
        'aria-controls="profForm">' + T.bal.edit + '</button>' +
      '<div id="profForm" hidden>' + personForm('profile', S.profile) + '</div>';

    var manage =
      '<p class="p">' + T.bal.dataNote + '</p>' +
      '<div class="acts">' +
        '<button type="button" class="act" id="profExport">' + T.bal.exportBtn + '</button>' +
        '<button type="button" class="act act--warn" id="profClear" data-armed="0">' +
          T.bal.clearBtn + '</button>' +
      '</div>';

    /* Первая карточка без заголовка: «Профиль» уже написано в h1 страницы
       прямо над ней, и два одинаковых слова подряд читаются как недоделка —
       та же причина, по которой Cosmic Now прячет общий заголовок. */
    /* Фокус редактируется здесь, а не только приходит из воронки: человек
       мог выбрать темы полгода назад, и запирать его в том выборе навсегда
       — это тот же вопрос, который спрашивают и забывают, только наоборот. */
    var focus = '<p class="p">' + T.sec.focusIntro + '</p>' +
      '<div class="foc" role="group" aria-label="' + esc(T.sec.focusTitleShort) + '">' +
      FOCUS_AREAS.map(function (k) {
        var on = (S.focus || []).indexOf(k) >= 0;
        return '<button type="button" class="foc__b' + (on ? ' on' : '') +
          '" data-focus="' + k + '" aria-pressed="' + on + '">' + T.sec.filters[k] + '</button>';
      }).join('') + '</div>' +
      '<p class="note">' + T.sec.focusNote + '</p>';

    return card('', head) +
      card(T.sec.focusTitleShort, focus) +
      card(T.ui.balance, balanceHtml(natal)) +
      card(T.bal.birthData, data,
        S.profile.timeKnown ? '' : T.ui.timeMissing) +
      card(T.bal.yourData, manage);
  };

  /* Открыть форму, выгрузить данные, стереть их. Стирание в два нажатия, а
     не через confirm(): модальное окно браузера выглядит как ошибка сайта, а
     здесь это обычное действие, которое человек должен успеть передумать. */
  function bindProfile() {
    Array.prototype.slice.call(document.querySelectorAll('[data-focus]')).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-focus');
        var list = (S.focus || []).slice();
        var i = list.indexOf(k);
        if (i >= 0) { list.splice(i, 1); } else { list.push(k); }
        S.focus = list;
        save();
        txFilterTouched = false;      /* новый фокус снова задаёт фильтр */
        route();
      });
    });
    var edit = el('profEdit'), form = el('profForm');
    if (edit && form) {
      edit.addEventListener('click', function () {
        var open = form.hidden;
        form.hidden = !open;
        edit.setAttribute('aria-expanded', open ? 'true' : 'false');
        edit.textContent = open ? T.bal.editClose : T.bal.edit;
        if (open) { var i = form.querySelector('input'); if (i) { i.focus(); } }
      });
    }
    var exp = el('profExport');
    if (exp) {
      exp.addEventListener('click', function () {
        /* Выгружаем всё, что продукт о человеке хранит, а не только профиль:
           иначе «выгрузить данные» — неправда, сохранённые события остались
           бы только в этом браузере. */
        var saved = [];
        try { saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch (e) { /* игнор */ }
        var bundle = {
          exportedAt: new Date().toISOString(),
          lang: window.APP_LANG,
          profile: S.profile, partner: S.partner, saved: saved
        };
        var blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'astromap-profile.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      });
    }
    var clr = el('profClear');
    if (clr) {
      clr.addEventListener('click', function () {
        if (clr.getAttribute('data-armed') !== '1') {
          clr.setAttribute('data-armed', '1');
          clr.textContent = T.bal.clearSure;
          setTimeout(function () {
            if (!clr.isConnected) { return; }
            clr.setAttribute('data-armed', '0');
            clr.textContent = T.bal.clearBtn;
          }, 5000);
          return;
        }
        /* Стираем и ключ воронки: иначе следующая загрузка увидит его и
           импортирует обратно ровно то, что человек только что удалил. */
        S = { profile: null, partner: null };
        try {
          localStorage.removeItem(KEY);
          localStorage.removeItem(SAVED_KEY);
          localStorage.removeItem('astromap.funnel');
        } catch (e) { /* приватный режим */ }
        recalc();
        route();
      });
    }
  }

  /* --- настройки: доступ и подписка -----------------------------------------

     До этого раздела ключ можно было ввести ровно один раз — на гейте — и
     после этого он исчезал из интерфейса навсегда. Нельзя было ни увидеть,
     на какую почту открыт доступ, ни выйти на чужом компьютере, ни
     проверить, жива ли подписка, ни сменить ключ, не чистя localStorage
     руками. Для продукта по подписке это дыра, а не мелочь.

     Ключ показывается замаскированным, с последними четырьмя знаками:
     этого хватает, чтобы сверить его с письмом, и недостаточно, чтобы его
     подсмотрели через плечо. Полностью — по кнопке.

     Выход в два нажатия, как удаление данных в профиле: он запирает
     продукт до повторного ввода ключа, и случайное касание не должно этого
     делать. Данные карты при этом не трогаются — они к лицензии
     отношения не имеют. */
  function maskKey(k) {
    var s = String(k || '');
    if (s.length <= 4) { return s; }
    return new Array(Math.min(s.length - 4, 20) + 1).join('•') + s.slice(-4);
  }

  var setKeyShown = false;

  views.settings = function () {
    var blocks = [];

    if (devBypassActive()) {
      blocks.push(card(T.set.devTitle,
        '<p class="p">' + T.set.devText + '</p>' +
        '<div class="acts"><button type="button" class="act act--warn" id="setDevOff">' +
          T.set.devOff + '</button></div>'));
    }

    if (!LICENSE_API) {
      blocks.push(card(T.set.gateOffTitle,
        '<p class="p">' + T.set.gateOffText + '</p>'));
    }

    var a = loadAccess();
    if (a && a.email && a.licenseKey) {
      var checked = a.verifiedAt ? fmtDateTime(new Date(a.verifiedAt)) : T.set.checkedNever;
      var body =
        '<div class="kv"><span>' + T.set.emailLabel + '</span><b class="set__mono">' +
          esc(a.email) + '</b></div>' +
        '<div class="kv"><span>' + T.set.keyLabel + '</span><b class="set__mono" id="setKey">' +
          esc(setKeyShown ? a.licenseKey : maskKey(a.licenseKey)) + '</b></div>' +
        '<div class="kv"><span>' + T.set.checkedLabel + '</span><b>' + checked + '</b></div>' +
        '<p class="set__status" id="setStatus" role="status" aria-live="polite" hidden></p>' +
        '<div class="acts">' +
          '<button type="button" class="act" id="setReveal" aria-pressed="' + setKeyShown + '">' +
            (setKeyShown ? T.set.keyHide : T.set.keyShow) + '</button>' +
          '<button type="button" class="act" id="setCheck">' + T.set.checkNow + '</button>' +
          (MANAGE_URL
            ? '<a class="act" href="' + MANAGE_URL + '" target="_blank" rel="noopener">' +
              T.set.manage + '</a>'
            : '') +
          '<button type="button" class="act act--warn" id="setOut" data-armed="0">' +
            T.set.signOut + '</button>' +
        '</div>' +
        (MANAGE_URL ? '' : '<p class="note">' + T.set.manageOff + '</p>') +
        '<p class="note">' + T.set.signOutNote + '</p>';
      blocks.push(card(T.set.accessTitle, body, T.set.privacyNote));
    } else if (!devBypassActive() && LICENSE_API) {
      /* «Ключа нет» имеет смысл только когда гейт включён. При пустом
         LICENSE_API карточка выше уже всё объяснила, и вторая строка о том,
         что ключа нет, звучала бы как поломка. */
      blocks.push(card(T.set.accessTitle, '<p class="empty">' + T.set.noAccess + '</p>'));
    }

    return blocks.join('');
  };

  function bindSettings() {
    var dev = el('setDevOff');
    if (dev) {
      dev.addEventListener('click', function () {
        try { localStorage.removeItem(DEV_KEY); } catch (e) { /* игнор */ }
        location.reload();
      });
    }

    var reveal = el('setReveal');
    if (reveal) {
      reveal.addEventListener('click', function () { setKeyShown = !setKeyShown; route(); });
    }

    var check = el('setCheck');
    if (check) {
      check.addEventListener('click', function () {
        var a = loadAccess();
        if (!a) { return; }
        check.disabled = true;
        setSetStatus(T.ui.gateChecking, false);
        verifyAccess(a.email, a.licenseKey).then(function (res) {
          check.disabled = false;
          if (res && res.ok && res.active) {
            saveAccess({ email: a.email, licenseKey: a.licenseKey, verifiedAt: Date.now() });
            route();
            setSetStatus(T.set.checkOk, false);
          } else if (res && res.ok && res.active === false) {
            /* Подписка кончилась — тот же путь, что у фоновой перепроверки:
               запираем обратно на гейт, а не оставляем открытый продукт с
               грустной надписью. */
            clearAccess();
            showGateOnly(gateErrorText(res.reason));
          } else {
            setSetStatus(T.ui.gateErrorInvalid, true);
          }
        }).catch(function () {
          check.disabled = false;
          setSetStatus(T.ui.gateErrorNetwork, true);
        });
      });
    }

    var out = el('setOut');
    if (out) {
      out.addEventListener('click', function () {
        if (out.getAttribute('data-armed') !== '1') {
          out.setAttribute('data-armed', '1');
          out.textContent = T.set.signOutSure;
          setTimeout(function () {
            if (!out.isConnected) { return; }
            out.setAttribute('data-armed', '0');
            out.textContent = T.set.signOut;
          }, 5000);
          return;
        }
        clearAccess();
        showGateOnly();
      });
    }
  }

  function setSetStatus(text, isError) {
    var st = el('setStatus');
    if (!st) { return; }
    st.hidden = !text;
    st.textContent = text || '';
    st.classList.toggle('set__status--error', !!isError);
  }

  /* --- роутер ------------------------------------------------------------- */
  var ORDER = ['today', 'horoscope', 'chart', 'match', 'numbers', 'moon', 'retro', 'profile',
               'settings'];

  /* --- мобильная навигация -------------------------------------------------
     Девять разделов сведены в пять вкладок нижней панели. Это единственное
     место, где задана группировка: и подсветка активной вкладки, и лента
     поднавигации внутри группы читают отсюда, поэтому разойтись они не
     могут. Порядок разделов внутри группы — порядок в ленте.

     Ни один раздел не спрятан и ни одного нового не добавлено: те же девять
     адресов, те же хеши, те же глубокие ссылки. Меняется только то, как до
     них дотянуться пальцем. */
  var TABS = [
    { key: 'today',   views: ['today'] },
    { key: 'match',   views: ['match'] },
    { key: 'sky',     views: ['horoscope', 'moon', 'retro'] },
    { key: 'more',    views: ['chart', 'numbers'] },
    { key: 'profile', views: ['profile', 'settings'] }
  ];

  function tabOf(view) {
    for (var i = 0; i < TABS.length; i++) {
      if (TABS[i].views.indexOf(view) >= 0) { return TABS[i]; }
    }
    return null;
  }

  /* Заголовок раздела для ленты поднавигации. У настроек своего пункта в
     T.ui.nav нет — это служебный экран, его название лежит в T.set.title. */
  function viewLabel(view) {
    if (view === 'settings') { return T.set.title; }
    return T.ui.nav[view] || view;
  }

  /* Подписи вкладок ставятся один раз при старте и переставляются при смене
     языка — тем же способом, что и остальной интерфейс. */
  /* Подпись вкладки берётся из T.ui.tab, если там для неё есть короткий
     вариант, и только потом из общего T.ui.nav. Нужно это ровно для одного
     пункта: «Совместимость» в семи языках из десяти шире ячейки нижней
     панели (замер на 320px: ru 80px, pt 79, es 74 при ячейке в 60) и
     обрезалась бы многоточием — на самой важной вкладке это недопустимо.
     В самом разделе и в капсуле на десктопе название остаётся полным. */
  function fillTabLabels() {
    var short = T.ui.tab || {};
    Array.prototype.slice.call(document.querySelectorAll('[data-tabl]')).forEach(function (s) {
      var k = s.getAttribute('data-tabl');
      s.textContent = short[k] || T.ui.nav[k] || k;
    });
  }

  /* Подсветка активной вкладки и сборка ленты внутри группы. Вызывается из
     route() на каждом переходе, в том числе при переходе по ссылке из
     карточки — поэтому вкладка всегда соответствует тому, что на экране,
     а не тому, по чему last нажали. */
  function syncTabs(view) {
    var active = tabOf(view);
    Array.prototype.slice.call(document.querySelectorAll('.tab')).forEach(function (a) {
      var on = active && a.getAttribute('data-tab') === active.key;
      a.classList.toggle('on', !!on);
      a.setAttribute('aria-current', on ? 'page' : 'false');
    });

    var sub = el('subnav');
    if (!sub) { return; }
    /* Лента нужна только там, где внутри вкладки есть выбор. На «Сегодня» и
       «Карте» её нет вовсе — пустая полоса занимала бы высоту и обещала
       переключение, которого нет. */
    if (!active || active.views.length < 2) { sub.hidden = true; sub.innerHTML = ''; return; }
    sub.innerHTML = active.views.map(function (v) {
      return '<a class="subnav__i' + (v === view ? ' on' : '') + '" href="#' + v + '"' +
        (v === view ? ' aria-current="page"' : '') + '>' + esc(viewLabel(v)) + '</a>';
    }).join('');
    sub.hidden = false;
  }

  /* --- адрес раздела с состоянием ------------------------------------------
     Хеш теперь не только имя раздела, но и то, что в нём выбрано:

       #chart/Venus            карта с выбранной Венерой
       #retro/Mercury          Ретрограды с выбранным Меркурием
       #moon/2026-09-26        Луна на день полнолуния
       #retro/Mercury/2026-10-24  и то, и другое

     Порядок хвостов не важен: дата узнаётся по форме YYYY-MM-DD, всё
     остальное считается выбранной точкой. Благодаря этому переход между
     разделами передаёт контекст, а ссылку можно просто открыть — раньше
     кросс-переход работал только изнутри, подменой переменной.

     Смена состояния внутри раздела правит адрес через replaceState: обычное
     присваивание location.hash дало бы hashchange и полную перерисовку
     раздела поверх той, которую он уже сделал сам. */
  function parseHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    var parts = raw.split('/').filter(function (x) { return x !== ''; });
    return { name: parts[0] || '', args: parts.slice(1) };
  }

  function go(name, args) {
    location.hash = '#' + [name].concat(args || []).join('/');
  }

  function syncHash(name, args) {
    var next = '#' + [name].concat((args || []).filter(Boolean)).join('/');
    if (location.hash === next) { return; }
    try { history.replaceState(null, '', next); } catch (e) { /* игнор */ }
  }

  /* Раскладывает хвосты адреса по состоянию разделов. Точка проверяется по
     списку известных имён: мусор в адресе не должен выбирать несуществующую
     планету и ронять раздел. */
  var POINT_NAMES = E.BODIES.concat(['Node', 'ASC', 'MC']);
  var ASPECT_KEYS = E.ASPECTS.map(function (a) { return a.key; });
  function applyHashState(name, args) {
    args.forEach(function (a) {
      if (Clock.isKey(a)) {
        var d = Clock.fromKey(a);
        if (d) { Clock.set(d); moonSyncMonth(); }
        return;
      }
      if (name === 'horoscope' && a.indexOf('-') > 0) {
        var p = a.split('-');
        if (p.length === 3 && POINT_NAMES.indexOf(p[0]) >= 0 &&
            POINT_NAMES.indexOf(p[1]) >= 0 && ASPECT_KEYS.indexOf(p[2]) >= 0) {
          txSel = p.join('|');
        }
        return;
      }
      /* На Карте точка может быть транзитной — 't:Mars'. Проверяем имя без
         префикса, иначе ссылка на транзитную точку молча отбрасывалась бы
         как мусор и открывала бы карту с натальным Солнцем. */
      if (name === 'chart' && a.indexOf('t:') === 0) {
        if (POINT_NAMES.indexOf(a.slice(2)) >= 0) { chartSel = a; chartTx = true; }
        return;
      }
      if (POINT_NAMES.indexOf(a) < 0) { return; }
      if (name === 'chart') { chartSel = a; }
      if (name === 'retro' && R.BODIES.indexOf(a) >= 0) { rxBody = a; }
    });
  }

  function route() {
    /* Без данных открываем профиль: остальные экраны без него не считаются. */
    var fallback = S.profile ? 'today' : 'profile';
    var parsed = parseHash();
    var h = parsed.name || fallback;
    if (ORDER.indexOf(h) < 0) { h = fallback; }
    applyHashState(h, parsed.args);
    /* Фокус задаёт фильтр ДО отрисовки раздела: если сделать это после,
       первый кадр рисуется со старым фильтром, а подпись под ним — с новым,
       и в заголовке списка стоит одна область, а в чипах отмечена другая.
       Один раз за сессию; дальше человек управляет фильтром сам. */
    if (h === 'horoscope' && !txFilterTouched) { txFilter = txDefaultFilter(); }
    document.querySelectorAll('.nav__i').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('href') === '#' + h);
    });
    /* Шестерёнка живёт вне .nav, поэтому подсвечивается отдельно — иначе на
       открытых настройках ни один пункт навигации не был бы активным, и
       человек не понимал бы, где находится. */
    var gear = el('gear');
    if (gear) {
      gear.classList.toggle('on', h === 'settings');
      gear.setAttribute('aria-current', h === 'settings' ? 'page' : 'false');
    }
    /* Нижняя панель и лента внутри группы. На десктопе оба элемента скрыты
       стилями, поэтому вызов безвреден и ветвления по ширине здесь нет:
       раскладку решает CSS, а не JS. */
    syncTabs(h);
    /* У Cosmic Now своя шапка с приветствием и датой, поэтому общий
       заголовок раздела на нём лишний — два заголовка подряд читаются как
       недоделка. Без профиля экран показывает обычные карточки, и заголовок
       снова нужен. */
    var ownHead = (h === 'today' && !!natal);
    var head = document.querySelector('.head');
    if (head) { head.hidden = ownHead; }
    /* У настроек нет пункта в T.ui.nav — это не раздел астрологии, а
       служебный экран за шестерёнкой, и заголовок у него свой. */
    el('title').textContent = ownHead ? ''
      : (h === 'settings' ? T.set.title : (T.ui[h + 'Title'] || T.ui.nav[h]));
    var view = el('view');
    view.innerHTML = views[h]();
    /* Страница Луны — узкая центрированная колонка, не двухколоночный грид
       остальных разделов (см. .view--moon в app.css). */
    view.classList.toggle('view--moon', h === 'moon');
    /* Ретрограды — своя раскладка: шкала и сводка идут во всю ширину, а
       карточки ниже раскладываются в две колонки только на десктопе. */
    view.classList.toggle('view--rx', h === 'retro');
    /* Гороскоп тоже вышел из общей двухколоночной сетки: сверху проводник
       во всю ширину, ниже — прежние карточки периода со своей сеткой. */
    view.classList.toggle('view--tx', h === 'horoscope');
    /* Cosmic Now — одна колонка: это вход, а не сетка карточек. */
    view.classList.toggle('view--cn', h === 'today');
    /* Карта: колесо и инспектор в два столбца, таблицы под ними. */
    view.classList.toggle('view--chart', h === 'chart');
    /* Класс на .main, а не на .view: заголовок раздела — сосед .view, а не
       его потомок, и скрыть его правилом изнутри нельзя. На телефоне на
       экране карты он прячется (см. .main--chart в app.css). */
    var mainEl = document.querySelector('.main');
    if (mainEl) { mainEl.classList.toggle('main--chart', h === 'chart'); }
    view.classList.toggle('view--num', h === 'numbers' && !!S.profile);
    /* Профиль и настройки — одна колонка: страница про одного человека и
       служебный экран, а не сетка равноправных модулей. */
    view.classList.toggle('view--prof', (h === 'profile' && !!S.profile) || h === 'settings');
    /* Перезапуск CSS-анимации: снять класс, форсировать reflow, вернуть класс.
       Без чтения offsetWidth браузер схлопнёт снятие+возврат в один кадр. */
    view.classList.remove('fade-in');
    void view.offsetWidth;
    view.classList.add('fade-in');
    /* Досыпаем состояние в адрес сразу после первой отрисовки: до неё раздел
       ещё не выбрал планету/точку по умолчанию, а после — ссылку уже можно
       копировать, не трогая ничего руками. */
    var dateArg = Clock.isToday() ? null : Clock.toKey();
    if (h === 'retro') { syncHash('retro', [rxBody, dateArg]); }
    if (h === 'moon') { syncHash('moon', [dateArg]); }
    if (h === 'chart') { syncHash('chart', [chartSel, chartTx ? dateArg : null]); }
    if (h === 'horoscope' && txSel) { syncHash('horoscope', [txSel.split('|').join('-')]); }
    if (h === 'retro') { positionSegIndicator('rxSegbar', 'rxSegbarInd', true); }
    if (h === 'horoscope') { positionHzIndicator(true); hzAiEnhance(hzPeriod); }
    if (h === 'match') { positionMcIndicator(true); if (mcSignA != null && mcSignB != null) { mcAiEnhance(); } }
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
          city: (function () {
            if (f.cityJson && f.cityJson.value) {
              try { return JSON.parse(f.cityJson.value); } catch (e) { /* игнор */ }
            }
            return ((kind === 'profile' ? S.profile : S.partner) || {}).city;
          })()
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

    bindMcGrid('A');
    bindMcGrid('B');
    bindMcTabs();
    bindMoonBody();
    bindChart();
    bindRetro();
    bindTx();
    bindToday();
    bindDateBar(el('numPage'), rerenderNumbers);
    bindGoChart(el('view'));
    bindTerms(document.getElementById('view'));
    bindCityPick();
    bindProfile();
    bindSettings();

    Array.prototype.slice.call(document.querySelectorAll('[data-period]')).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('on')) { return; }
        hzPeriod = b.dataset.period;
        Array.prototype.slice.call(document.querySelectorAll('[data-period]')).forEach(function (x) {
          x.classList.toggle('on', x === b);
        });
        positionHzIndicator(false);
        var body = el('hzBody');
        /* Полгода и год считаются сотнями миллисекунд — показываем счёт.
           Неделя и месяц укладываются в кадр, там мигание было бы хуже
           самого ожидания. */
        var heavy = HZ_HEAVY.indexOf(hzPeriod) >= 0;
        var draw = function () {
          if (body) {
            body.innerHTML = hzContentHtml();
            body.classList.remove('fade-in');
            void body.offsetWidth;
            body.classList.add('fade-in');
          }
          bindHzRows();
          hzAiEnhance(hzPeriod);
        };
        if (heavy) { withBusy(body, draw); } else { draw(); }
      });
    });
  }

  /* --- старт ---------------------------------------------------------------
     Раньше это был просто хвост IIFE, выполнявшийся сразу при загрузке
     скрипта. Теперь всё завёрнуто в startApp() и запускается только после
     initAccessGate() — либо сразу (в кэше уже есть подтверждённый доступ),
     либо по успешной отправке формы в #gate. */
  /* Подстановка переводов в статическую разметку. Вынесено из startApp(),
     потому что гейт рисуется ДО запуска приложения: пока этот проход жил
     внутри startApp(), у #gate оставались пустыми заголовок, подписи полей
     и кнопка — до гейта переводы просто не доходили. */
  function applyStaticTexts() {
    document.querySelectorAll('[data-t]').forEach(function (n) {
      var path = n.getAttribute('data-t').split('.');
      var v = path.reduce(function (o, k) { return o ? o[k] : null; }, T);
      if (typeof v === 'string') { n.textContent = v; }
    });
    /* У шестерёнки нет видимой подписи — значит нужна невидимая, иначе
       скринридер объявит «ссылка» и ничего больше. Заодно title для мыши. */
    var gear = el('gear');
    if (gear) {
      gear.setAttribute('aria-label', T.set.nav);
      gear.setAttribute('title', T.set.nav);
    }
  }

  function startApp() {
    load();
    recalc();

    applyStaticTexts();
    fillTabLabels();
    el('disc').textContent = T.ui.disclaimer;

    /* Переключатель языка: кнопка с текущим кодом раскрывает список всех
       поддерживаемых языков (их родные названия — см. #langMenu в index.html).
       Перезагружаем страницу вместо горячей замены: тексты и список городов
       подставляются на старте, и точечная подмена оставила бы часть экрана
       на прежнем языке. Хеш сохраняется. */
    (function () {
      var toggle = el('langToggle'), menu = el('langMenu');
      if (!toggle || !menu) { return; }
      toggle.textContent = String(window.APP_LANG || 'en').toUpperCase();
      function closeLangMenu() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
      toggle.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var open = toggle.getAttribute('aria-expanded') === 'true';
        if (open) { closeLangMenu(); return; }
        menu.hidden = false; toggle.setAttribute('aria-expanded', 'true');
      });
      document.addEventListener('click', function (ev) {
        if (!menu.hidden && ev.target !== toggle && !menu.contains(ev.target)) { closeLangMenu(); }
      });
      Array.prototype.slice.call(menu.querySelectorAll('.langmenu__item')).forEach(function (b) {
        b.classList.toggle('on', b.dataset.lang === window.APP_LANG);
        b.addEventListener('click', function () {
          closeLangMenu();
          if (b.dataset.lang === window.APP_LANG) { return; }
          try { localStorage.setItem('astromap.lang', b.dataset.lang); } catch (e) {}
          location.reload();
        });
      });
    })();

    /* Мобильное меню: капсула навигации сворачивается в гамбургер ниже 900px
       (см. media-запрос в app.css). Пункты те же .nav__i, что и в капсуле —
       router выше уже переключает .on сразу на обоих наборах. */
    (function () {
      var burger = el('burger'), menu = el('mnav');
      if (!burger || !menu) { return; }
      /* Пока меню открыто, страница под ним не прокручивается. Без этого
         на телефоне палец, промахнувшийся мимо пункта, уводил ленту разделов
         вниз — меню оставалось висеть над уехавшим содержимым, и было
         непонятно, что вообще произошло. */
      function close() {
        menu.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }
      burger.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var open = burger.getAttribute('aria-expanded') === 'true';
        if (open) { close(); return; }
        menu.hidden = false;
        burger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-open');
      });
      Array.prototype.slice.call(menu.querySelectorAll('.nav__i')).forEach(function (a) {
        a.addEventListener('click', close);
      });
      /* Тап мимо меню и Escape закрывают его. Раньше единственным способом
         было попасть обратно в гамбургер — цель в 42 пикселя в углу экрана. */
      document.addEventListener('click', function (ev) {
        if (menu.hidden) { return; }
        if (ev.target.closest && (ev.target.closest('#mnav') || ev.target.closest('#burger'))) { return; }
        close();
      });
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && !menu.hidden) { close(); burger.focus(); }
      });
      window.addEventListener('hashchange', close);
    })();

    /* На ресайзе переизмеряем ширину/позицию активной кнопки периода —
       .segbar не пересоздаётся при resize, но её кнопки могут менять размер. */
    window.addEventListener('resize', function () {
      if (location.hash === '#horoscope') { positionHzIndicator(true); }
      if (location.hash === '#match') { positionMcIndicator(true); }
    });

    window.addEventListener('hashchange', route);
    route();
  }

  /* --- гейт доступа: чтение/запись состояния, живая проверка, форма -------- */
  function loadAccess() {
    try { return JSON.parse(localStorage.getItem(ACCESS_KEY) || 'null'); } catch (e) { return null; }
  }
  function saveAccess(a) {
    try { localStorage.setItem(ACCESS_KEY, JSON.stringify(a)); } catch (e) { /* игнор */ }
  }
  function clearAccess() {
    try { localStorage.removeItem(ACCESS_KEY); } catch (e) { /* игнор */ }
  }
  /* Живой запрос к воркеру при каждой (ре)проверке — никакого состояния
     подписки нигде не кэшируется на сервере, поэтому отменённая/просроченная
     подписка отражается сразу на следующей проверке, без вебхуков. */
  function verifyAccess(email, licenseKey) {
    return fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, licenseKey: licenseKey })
    }).then(function (r) { return r.json(); });
  }
  function gateErrorText(reason) {
    if (reason === 'subscription_ended' || reason === 'refunded' || reason === 'disputed') {
      return T.ui.gateErrorInactive;
    }
    return T.ui.gateErrorInvalid;
  }
  function setGateStatus(text, isError) {
    var st = el('gateStatus');
    if (!st) { return; }
    if (!text) { st.hidden = true; st.textContent = ''; return; }
    st.hidden = false; st.textContent = text;
    st.classList.toggle('gate__status--error', !!isError);
  }
  function showShell() {
    var gate = el('gate'), shell = el('shell');
    if (gate) { gate.hidden = true; }
    if (shell) { shell.hidden = false; }
  }
  function showGateOnly(message) {
    var gate = el('gate'), shell = el('shell');
    if (shell) { shell.hidden = true; }
    if (gate) { gate.hidden = false; }
    if (message) { setGateStatus(message, true); }
  }
  function bindGate() {
    var form = el('gateForm');
    if (!form) { return; }
    var buyLink = el('gateBuy');
    if (buyLink) {
      if (GATE_CHECKOUT_URL) { buyLink.href = GATE_CHECKOUT_URL; buyLink.hidden = false; }
      else { buyLink.hidden = true; }
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = form.gateEmail.value.trim();
      var licenseKey = form.gateLicense.value.trim();
      if (!email || !licenseKey) { return; }
      var submitBtn = el('gateSubmit');
      if (submitBtn) { submitBtn.disabled = true; }
      setGateStatus(T.ui.gateChecking, false);
      verifyAccess(email, licenseKey).then(function (res) {
        if (submitBtn) { submitBtn.disabled = false; }
        if (res && res.ok && res.active) {
          saveAccess({ email: email, licenseKey: licenseKey, verifiedAt: Date.now() });
          setGateStatus('', false);
          showShell();
          startApp();
        } else {
          setGateStatus(gateErrorText(res && res.reason), true);
        }
      }).catch(function () {
        if (submitBtn) { submitBtn.disabled = false; }
        setGateStatus(T.ui.gateErrorNetwork, true);
      });
    });
  }
  /* Раз в сутки на уже открытой сессии тихо перепроверяем ключ в фоне: если
     Gumroad теперь говорит active:false явно (не сетевая ошибка) — запираем
     обратно на #gate. Сетевую ошибку игнорируем: не отбираем уже открытый
     доступ из-за обрыва связи, следующий заход попробует снова. */
  function revalidateInBackground(access) {
    verifyAccess(access.email, access.licenseKey).then(function (res) {
      if (res && res.ok && res.active) {
        saveAccess({ email: access.email, licenseKey: access.licenseKey, verifiedAt: Date.now() });
      } else if (res && res.ok && res.active === false) {
        clearAccess();
        showGateOnly(gateErrorText(res.reason));
      }
    }).catch(function () { /* оффлайн/сеть — молчим, ничего не меняем */ });
  }
  /* Читает ?dev= из адреса, запоминает/снимает флаг и вычищает параметр из
     истории, чтобы он не болтался в ссылке и не попал в закладки/шаринг.
     Возвращает: открыт ли продукт по dev-обходу. */
  function devBypassActive() {
    var param = null;
    try { param = new URLSearchParams(window.location.search).get('dev'); } catch (e) {}
    if (param !== null) {
      try {
        if (param === DEV_WORD) { localStorage.setItem(DEV_KEY, '1'); }
        else if (param === 'off') { localStorage.removeItem(DEV_KEY); }
      } catch (e) {}
      try {
        var u = new URL(window.location.href);
        u.searchParams.delete('dev');
        window.history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
      } catch (e) {}
    }
    try { return localStorage.getItem(DEV_KEY) === '1'; } catch (e) { return false; }
  }

  function initAccessGate() {
    applyStaticTexts();
    if (devBypassActive()) {
      showShell();
      startApp();
      return;
    }
    /* ГЕЙТ БЕЗ ВОРКЕРА НЕ ЗАЩИЩАЕТ, А ЛОМАЕТ. Пока LICENSE_API пуст,
       проверять ключ нечем: verifyAccess ушёл бы fetch'ем в пустую строку и
       упал, то есть форма не принимала бы НИКАКОЙ ключ, включая настоящий.
       Значит, она не отделяла покупателей от чужих — она не пускала никого,
       и единственным входом оставался dev-обход, живущий в localStorage
       одного браузера.

       Поэтому при пустом LICENSE_API продукт открывается. Это осознанный
       размен: пока воркера нет, продукт доступен любому, кто знает адрес.
       Как только URL вписан, гейт включается сам — ни здесь, ни где-либо
       ещё править для этого ничего не нужно. Раздел настроек показывает
       это состояние открытым текстом, чтобы про него нельзя было забыть. */
    if (!LICENSE_API) {
      console.warn('astromap: LICENSE_API не задан в js/app.js — гейт выключен, ' +
        'продукт открыт всем. Впишите URL воркера license-verify.js, и гейт включится сам.');
      showShell();
      startApp();
      return;
    }
    bindGate();
    var access = loadAccess();
    if (access && access.email && access.licenseKey) {
      showShell();
      startApp();
      if (Date.now() - (access.verifiedAt || 0) > ACCESS_REVALIDATE_MS) {
        revalidateInBackground(access);
      }
    } else {
      showGateOnly();
    }
  }

  initAccessGate();
})();
