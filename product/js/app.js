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

  var fcRange = 'week';
  views.forecast = function () {
    if (!natal) { return needProfile('needText') + skyNow() + moonCard(); }
    var now = new Date();
    var days = fcRange === 'day' ? 1 : (fcRange === 'week' ? 7 : 31);
    var bodies = fcRange === 'day'
      ? ['Moon', 'Sun', 'Mercury', 'Venus', 'Mars']
      : ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    var ev = E.transitEvents(natal, now, new Date(now.getTime() + days * 86400000),
      { bodies: bodies, stepHours: fcRange === 'day' ? 2 : 12 });

    var tabs = ['day', 'week', 'month'].map(function (k) {
      return '<button class="chip' + (fcRange === k ? ' on' : '') +
        '" data-range="' + k + '">' + T.ui[k] + '</button>';
    }).join('');

    var rows = ev.slice(0, 40).map(function (e) {
      return [fmtDateTime(e.exactAt), pName(e.transit), T.aspects[e.aspect],
              pName(e.natal), toneTag(e.tone)];
    });

    var body = '<div class="chips">' + tabs + '</div>' +
      (rows.length
        ? table([T.ui.dateCol, T.ui.transitCol, T.ui.aspects, T.ui.point, T.ui.tone], rows)
        : '<p class="empty">' + T.ui.noTransits + '</p>');

    var detail = ev.slice(0, 4).map(function (e) {
      return '<article class="tr"><div class="tr__h"><span class="tr__s"><b>' +
        fmtDate(e.exactAt) + '</b> &middot; ' + pName(e.transit) + ' ' +
        T.aspects[e.aspect] + ' ' + pName(e.natal) + '</span></div><p class="tr__t">' +
        transitText({ transit: e.transit, natal: e.natal, tone: e.tone }) +
        '</p></article>';
    }).join('');

    return card(T.ui.exactDates, body) + (detail ? card(null, detail) : '');
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
  var ORDER = ['today', 'forecast', 'chart', 'match', 'numbers', 'moon', 'retro', 'profile'];

  function route() {
    /* Без данных открываем профиль: остальные экраны без него не считаются. */
    var fallback = S.profile ? 'today' : 'profile';
    var h = (location.hash || ('#' + fallback)).slice(1);
    if (ORDER.indexOf(h) < 0) { h = fallback; }
    document.querySelectorAll('.nav__i').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('href') === '#' + h);
    });
    el('title').textContent = T.ui[h + 'Title'] || T.ui.nav[h];
    el('view').innerHTML = views[h]();
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
    Array.prototype.slice.call(document.querySelectorAll('[data-range]')).forEach(function (b) {
      b.addEventListener('click', function () { fcRange = b.dataset.range; route(); });
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

  window.addEventListener('hashchange', route);
  route();
})();
