/* moon.js — данные и визуализация страницы «Фаза Луны».
   Отделено от app.js: чистые функции даты -> данные (fazа, освещённость,
   знак, советы дня) и рендер диска в SVG, без обращения к состоянию
   приложения (S, natal). Опирается на глобалы Astronomy (astronomy-engine)
   и Engine — они уже загружены раньше в app.html. Тексты и заголовки
   категорий советов остаются в texts.js — этот файл только считает. */
(function (g) {
  'use strict';

  var A = g.Astronomy, E = g.Engine;

  /* --- фаза и знак Луны на дату -------------------------------------------
     phaseIndex 0..7 — та же сетка из 8 фаз, что уже используется в app.js
     (T.moonPhase): 0 нов, 1 растущий серп, 2 первая четверть, 3 растущий
     горб, 4 полнолуние, 5 убывающий горб, 6 последняя четверть, 7 убывающий
     серп. bucket — укрупнённая версия из 4 значений, нужна только для
     подбора совета дня (moonAdvice). */
  function phaseBucketOf(idx) {
    if (idx === 0) { return 'new'; }
    if (idx <= 3) { return 'waxing'; }
    if (idx === 4) { return 'full'; }
    return 'waning';
  }

  function infoFor(date) {
    var angle = A.MoonPhase(date);                       /* 0..360, 0 = новолуние */
    var idx = Math.floor(((angle + 22.5) % 360) / 45);
    var illum = A.Illumination('Moon', date).phase_fraction;
    var sign = E.bodyAt('Moon', date).sign;               /* {index,key,element,mode,degree} */
    return {
      date: date, angle: angle, phaseIndex: idx, bucket: phaseBucketOf(idx),
      illum: illum, waxing: angle < 180, sign: sign
    };
  }

  /* --- сетка месяца, понедельник первым, с кэшем по «год-месяц» -----------
     Кэш экономит пересчёт при возврате на уже открытый месяц (навигация
     назад-вперёд по календарю не должна каждый раз гонять астрономию по
     42 датам заново). */
  var monthCache = {};
  function monthGrid(year, month /* 0-based */) {
    var key = year + '-' + month;
    var hit = monthCache[key];
    if (hit) { return hit; }

    var first = new Date(year, month, 1);
    var firstWeekday = (first.getDay() + 6) % 7;          /* пн=0 .. вс=6 */
    var gridStart = new Date(year, month, 1 - firstWeekday);
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    var cells = [];
    for (var i = 0; i < totalCells; i++) {
      var d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      cells.push({ date: d, inMonth: d.getMonth() === month, info: infoFor(d) });
    }
    monthCache[key] = cells;
    return cells;
  }

  /* --- рендер диска Луны ---------------------------------------------------
     Геометрия проверена численно (площадь освещённой «линзы» равна illum *
     площадь круга при любом illum от 0 до 1, шаг 0.05): дуга обода —
     фиксированный полукруг радиуса r; дуга терминатора — эллипс с
     rx = r*|1-2k|, сторона выпуклости меняется на границе серп/горб
     (k<0.5 против k>0.5), а сторона обода — на растущей/убывающей (waxing).
     Один и тот же рендер используется и для большой Луны в hero, и для
     мини-иконок в календаре — только размер меняется. */
  function discSvg(size, illum, waxing) {
    var r = size / 2;
    var k = Math.max(0, Math.min(1, illum));
    var rF = r.toFixed(2);
    var top = rF + ',0', bottom = rF + ',' + (2 * r).toFixed(2);

    var lune;
    if (k <= 0.004) {
      lune = '';
    } else if (k >= 0.996) {
      lune = '<circle cx="' + rF + '" cy="' + rF + '" r="' + rF + '" fill="var(--moon-light)"/>';
    } else {
      var rx = (r * Math.abs(1 - 2 * k)).toFixed(2);
      var outerSweep = waxing ? 1 : 0;
      var innerSweep = waxing ? (k < 0.5 ? 1 : 0) : (k < 0.5 ? 0 : 1);
      lune = '<path d="M ' + top + ' A ' + rF + ' ' + rF + ' 0 0 ' + outerSweep + ' ' + bottom +
        ' A ' + rx + ' ' + rF + ' 0 0 ' + innerSweep + ' ' + top + ' Z" fill="var(--moon-light)"/>';
    }

    return '<svg class="moonv" viewBox="0 0 ' + size + ' ' + size + '" width="' + size +
      '" height="' + size + '" aria-hidden="true">' +
      '<circle cx="' + rF + '" cy="' + rF + '" r="' + rF + '" fill="var(--moon-dark)"/>' +
      lune + '</svg>';
  }

  /* mod: 'hero' | 'cal' | '' — управляет только CSS-модификатором обёртки
     (размер общего свечения), геометрия диска не зависит от контекста. */
  function moonHtml(size, illum, waxing, mod) {
    var k = Math.max(0, Math.min(1, illum));
    var cls = 'moonv-wrap' + (mod ? ' moonv-wrap--' + mod : '') +
      (k >= 0.55 ? ' moonv-wrap--glow' : '');
    return '<span class="' + cls + '">' + discSvg(size, k, waxing) + '</span>';
  }

  /* --- советы дня -----------------------------------------------------------
     Детерминированное правило от стихии знака Луны (fire/earth/air/water) и
     укрупнённой фазы (new/waxing/full/waning) — не рандом: тот же день даёт
     тот же результат, дата меняется -> статусы пересчитываются. Заголовки
     и описания категорий — в texts.js (T.moonAdvice), иконки — язык-
     независимые эмодзи, поэтому живут здесь. */
  var ORDER = ['cleaning', 'selfcare', 'spirituality', 'beauty', 'business', 'career',
    'creativity', 'family', 'health', 'love', 'rest', 'traveling', 'bigDecisions',
    'communication', 'learning'];

  var ICONS = {
    cleaning: '🧹', selfcare: '🧘', spirituality: '🔮',
    beauty: '💅', business: '💼', career: '📈',
    creativity: '🎨', family: '🏡', health: '🩺',
    love: '💗', rest: '😴', traveling: '✈️',
    bigDecisions: '🧭', communication: '💬', learning: '📚'
  };

  var RULES = {
    cleaning:      { fav: ['earth', 'water'], favPhase: 'waning', unf: ['fire'],  unfPhase: 'waxing' },
    selfcare:      { fav: ['water'],          favPhase: 'full',   unf: ['air'],   unfPhase: 'new' },
    spirituality:  { fav: ['water'],          favPhase: 'full',   unf: ['earth'], unfPhase: 'new' },
    beauty:        { fav: ['earth', 'air'],   favPhase: 'waxing', unf: [],        unfPhase: 'waning' },
    business:      { fav: ['earth', 'fire'],  favPhase: 'waxing', unf: ['water'], unfPhase: 'waning' },
    career:        { fav: ['earth', 'fire'],  favPhase: 'full',   unf: ['water'], unfPhase: 'waning' },
    creativity:    { fav: ['fire', 'water'],  favPhase: 'full',   unf: ['earth'], unfPhase: 'new' },
    family:        { fav: ['water'],          favPhase: 'full',   unf: ['fire'],  unfPhase: 'new' },
    health:        { fav: ['earth'],          favPhase: 'waning', unf: ['fire'],  unfPhase: 'full' },
    love:          { fav: ['water', 'earth'], favPhase: 'full',   unf: [],        unfPhase: 'waning' },
    rest:          { fav: ['water', 'earth'], favPhase: 'waning', unf: ['fire'],  unfPhase: 'waxing' },
    traveling:     { fav: ['fire', 'air'],    favPhase: 'waxing', unf: ['water'], unfPhase: 'new' },
    bigDecisions:  { fav: ['fire', 'earth'],  favPhase: 'waxing', unf: ['air'],   unfPhase: 'new' },
    communication: { fav: ['air'],            favPhase: 'waxing', unf: ['water'], unfPhase: 'new' },
    learning:      { fav: ['air', 'fire'],    favPhase: 'waxing', unf: ['water'], unfPhase: 'waning' }
  };

  function statusFor(key, element, bucket) {
    var r = RULES[key];
    if (!r) { return 'neutral'; }
    var score = 0;
    if (r.fav.indexOf(element) >= 0) { score += 1; }
    if (r.favPhase === bucket) { score += 1; }
    if (r.unf.indexOf(element) >= 0) { score -= 1; }
    if (r.unfPhase === bucket) { score -= 1; }
    if (score >= 1) { return 'favorable'; }
    if (score <= -1) { return 'unfavorable'; }
    return 'neutral';
  }

  function adviceFor(sign, bucket) {
    return ORDER.map(function (key) {
      return { key: key, icon: ICONS[key], status: statusFor(key, sign.element, bucket) };
    });
  }

  g.Moon = {
    infoFor: infoFor, monthGrid: monthGrid, moonHtml: moonHtml,
    adviceFor: adviceFor, adviceOrder: ORDER, phaseBucketOf: phaseBucketOf
  };
})(typeof window !== 'undefined' ? window : globalThis);
