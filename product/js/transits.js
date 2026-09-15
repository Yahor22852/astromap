/* transits.js — транзит как отрезок времени, а не как строка в таблице.

   Раздел «Гороскоп» до этого показывал транзиты двумя способами: связным
   текстом по четырём сферам и таблицей точных дат. Оба отвечают на вопрос
   «что происходит», но ни один — на «насколько это сильно сейчас, когда
   пик и сколько это продлится». Здесь считается именно это.

   ОКНО. Аспект существует не в момент, а пока расхождение с точным углом
   меньше орбиса. Границы окна ищем сканированием наружу от выбранной даты,
   пока орбис не выйдет за предел, и уточняем делением пополам.

   ТОЧНОСТЬ БЫВАЕТ ТРОЙНОЙ. У медленной планеты внутри окна укладывается
   ретроградная петля, и аспект становится точным три раза: на прямом ходу,
   на попятном и снова на прямом. Это не курьёз, а главное, что нужно знать
   про долгий транзит, поэтому ищем ВСЕ моменты точности внутри окна, а не
   ближайший. Если их несколько — раздел так и говорит.

   ШАГ СКАНА. Привязан к скорости тела: Луна проходит свой орбис за часы,
   Плутон — за месяцы. Один общий шаг означал бы либо промах по Луне, либо
   тысячи лишних вызовов эфемерид на Плутоне.

   СИЛА. Не выдуманный «процент влияния», а две честные величины: вес пары
   точек (тот же, что во всём продукте) и близость к точному аспекту.
   Перемножаются, чтобы можно было отсортировать; шкала произвольная и
   годится только для сравнения транзитов между собой. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.Transits = factory(root.Engine);
  }
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';

  var HOUR = 3600000, DAY = 86400000;

  /* Шаг скана и предел поиска окна, в часах и днях. Предел не астрономия, а
     здравый смысл: транзит Плутона к точке карты тянется больше года, и
     показывать его окно целиком бессмысленно — важно, что он идёт весь
     обозримый период. */
  var SCAN = {
    Moon:    { stepH: 1,   limitD: 3 },
    Sun:     { stepH: 6,   limitD: 20 },
    Mercury: { stepH: 6,   limitD: 40 },
    Venus:   { stepH: 6,   limitD: 40 },
    Mars:    { stepH: 12,  limitD: 90 },
    Jupiter: { stepH: 24,  limitD: 200 },
    Saturn:  { stepH: 24,  limitD: 300 },
    Uranus:  { stepH: 48,  limitD: 420 },
    Neptune: { stepH: 48,  limitD: 420 },
    Pluto:   { stepH: 48,  limitD: 500 },
    Node:    { stepH: 24,  limitD: 200 }
  };

  var ASPECT_ANGLE = {};
  E.ASPECTS.forEach(function (a) { ASPECT_ANGLE[a.key] = a.angle; });

  /* Знаковый орбис: насколько тело НЕ ДОШЛО (минус) или УЖЕ ПРОШЛО (плюс)
     точный угол. Знак здесь — рабочий инструмент: момент точности ищется по
     его смене, а не по минимуму.

     БЫЛО: separation(lon, natalLon) - angle. separation возвращает 0..180 и
     всегда положительна, поэтому для соединения (угол 0) выражение никогда
     не опускалось ниже нуля, а для оппозиции (угол 180) никогда не
     поднималось выше. Смены знака не происходило НИ РАЗУ — и точные даты
     для соединений и оппозиций не находились нигде в продукте: ни в
     проводнике транзитов, ни на шкале, ни в «Сегодня». А это два самых
     сильных аспекта: «Сатурн соединение вашего Солнца» показывался как
     событие без единой даты.

     СТАЛО: знаковая разница до ближайшей из двух точек аспекта (+angle и
     -angle). Для соединения обе совпадают и дают обычную знаковую разницу
     долгот, для оппозиции тоже (±180 — одна и та же точка), для остальных
     аспектов выбирается та сторона, с которой тело подходит. Ветки
     переключаются на полпути между +angle и -angle, то есть при орбисе
     порядка тридцати градусов, — окно поиска туда не достаёт (maxOrb ≤ 10),
     так что ложной смены знака это дать не может. */
  function norm180(d) {
    d = ((d % 360) + 540) % 360 - 180;
    return d;
  }

  function orbAt(body, natalLon, angle, ms) {
    var lon = E.bodyAt(body, new Date(ms)).lon;
    var d = norm180(lon - natalLon);
    var e1 = norm180(d - angle);
    var e2 = norm180(d + angle);
    return Math.abs(e1) <= Math.abs(e2) ? e1 : e2;
  }

  function bisectExact(body, natalLon, angle, a, b) {
    var sa = orbAt(body, natalLon, angle, a) < 0;
    for (var i = 0; i < 34; i++) {
      var m = (a + b) / 2;
      if ((orbAt(body, natalLon, angle, m) < 0) === sa) { a = m; } else { b = m; }
    }
    return new Date((a + b) / 2);
  }

  /* Граница окна: ближайший момент, где |орбис| становится больше maxOrb.
     dir: -1 назад, +1 вперёд. Возвращает {date, capped} — capped значит, что
     предел поиска достигнут раньше границы, то есть транзит шире окна и
     дату его начала/конца мы честно не знаем. */
  function edge(body, natalLon, angle, from, dir, maxOrb, scan) {
    var step = scan.stepH * HOUR * dir;
    var limit = scan.limitD * DAY;
    var prev = from;
    for (var k = 1; k * scan.stepH * HOUR <= limit; k++) {
      var t = from + k * step;
      if (Math.abs(orbAt(body, natalLon, angle, t)) > maxOrb) {
        var lo = Math.min(prev, t), hi = Math.max(prev, t);
        for (var i = 0; i < 26; i++) {
          var m = (lo + hi) / 2;
          if (Math.abs(orbAt(body, natalLon, angle, m)) > maxOrb) {
            if (dir > 0) { hi = m; } else { lo = m; }
          } else {
            if (dir > 0) { lo = m; } else { hi = m; }
          }
        }
        return { date: new Date((lo + hi) / 2), capped: false };
      }
      prev = t;
    }
    return { date: new Date(from + limit * dir), capped: true };
  }

  /* Все моменты точности внутри окна. Сканируем с тем же шагом и ловим смену
     знака разности с точным углом. */
  function exactMoments(body, natalLon, angle, fromMs, toMs, scan) {
    var step = scan.stepH * HOUR;
    var out = [];
    var prevT = fromMs, prev = orbAt(body, natalLon, angle, fromMs);
    for (var t = fromMs + step; t <= toMs; t += step) {
      var cur = orbAt(body, natalLon, angle, t);
      if ((prev < 0) !== (cur < 0)) { out.push(bisectExact(body, natalLon, angle, prevT, t)); }
      prevT = t; prev = cur;
    }
    return out;
  }

  var cache = {};
  function key(t, date) {
    return t.transit + '|' + t.natal + '|' + t.aspect + '|' +
      date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  }

  /* t — запись из E.activeTransits(). Возвращает описание транзита как
     отрезка: границы окна, моменты точности, доля пройденного и сила. */
  function detail(natal, t, date) {
    var k = key(t, date);
    if (cache[k]) { return cache[k]; }

    var target = t.natalPoint || natal.byName[t.natal] ||
      (natal.asc && t.natal === 'ASC' ? natal.asc : null) ||
      (natal.mc && t.natal === 'MC' ? natal.mc : null);
    if (!target) { return null; }

    var angle = ASPECT_ANGLE[t.aspect];
    var scan = SCAN[t.transit] || SCAN.Jupiter;
    var maxOrb = maxOrbFor(t);
    var now = date.getTime();

    var a = edge(t.transit, target.lon, angle, now, -1, maxOrb, scan);
    var b = edge(t.transit, target.lon, angle, now, 1, maxOrb, scan);
    var exacts = exactMoments(t.transit, target.lon, angle, a.date.getTime(), b.date.getTime(), scan);

    var span = b.date.getTime() - a.date.getTime();
    var out = {
      transit: t.transit, natal: t.natal, aspect: t.aspect, tone: t.tone,
      orb: t.orb, applying: t.applying, retro: t.retro,
      house: E.houseOfSign(natal, E.bodyAt(t.transit, date).sign.index),
      sign: E.bodyAt(t.transit, date).sign,
      natalSign: target.sign,
      natalHouse: target.house || null,
      from: a.date, to: b.date,
      fromCapped: a.capped, toCapped: b.capped,
      exacts: exacts,
      nextExact: exacts.filter(function (d) { return d.getTime() >= now; })[0] || null,
      triple: exacts.length > 2,
      progress: span > 0 ? Math.max(0, Math.min(1, (now - a.date.getTime()) / span)) : 0,
      days: Math.max(1, Math.round(span / DAY)),
      maxOrb: maxOrb,
      strength: typeof t.strength === 'number' ? t.strength : strengthOf(t, maxOrb)
    };
    cache[k] = out;
    return out;
  }

  /* Орбис пары берём тот же, что использует findAspect: базовый орбис
     аспекта плюс два градуса, если участвует светило. Дублировать его
     значения нельзя — разойдутся с ядром, поэтому читаем из E.ASPECTS. */
  function maxOrbFor(t) {
    var base = 8;
    E.ASPECTS.forEach(function (a) { if (a.key === t.aspect) { base = a.orb; } });
    var lum = t.transit === 'Sun' || t.transit === 'Moon' ||
              t.natal === 'Sun' || t.natal === 'Moon';
    return base + (lum ? 2 : 0);
  }

  /* Шкала произвольная и нужна только для сравнения транзитов между собой:
     вес пары точек, умноженный на близость к точному аспекту. Сходящийся
     аспект переживается сильнее расходящегося — тот же коэффициент, что в
     индексах дня.

     t.weight из activeTransits — это уже вес пары МИНУС орбис, поэтому орбис
     прибавляем обратно: иначе он учитывался бы дважды, один раз вычитанием,
     второй — через closeness. */
  function strengthOf(t, maxOrb) {
    var closeness = Math.max(0, 1 - t.orb / maxOrb);
    return (t.weight + t.orb) * closeness * (t.applying ? 1 : 0.85);
  }

  /* Дешёвая запись транзита: всё, что нужно списку и сортировке, без единого
     дополнительного обращения к эфемеридам. Окно и моменты точности считает
     только detail() — и только для тех транзитов, которые действительно
     показываются развёрнуто. На активной карте их бывает за сорок, и считать
     окно каждому означало бы полсекунды на открытие раздела. */
  function brief(natal, t) {
    var maxOrb = maxOrbFor(t);
    return {
      transit: t.transit, natal: t.natal, aspect: t.aspect, tone: t.tone,
      orb: t.orb, applying: t.applying, retro: t.retro,
      maxOrb: maxOrb, strength: strengthOf(t, maxOrb),
      natalPoint: natal.byName[t.natal] ||
        (t.natal === 'ASC' ? natal.asc : null) ||
        (t.natal === 'MC' ? natal.mc : null)
    };
  }

  /* --- разбор на главный / поддерживающие / остальное -----------------------
     Иерархия важнее полноты: тридцать равнозначных карточек не говорят
     ничего. Луну из главных исключаем намеренно — она меняет аспекты по
     несколько раз в сутки и всегда была бы «главным транзитом дня»,
     вытесняя то, что действительно держится неделями. В общем списке она
     остаётся. */
  function rank(natal, date, opts) {
    opts = opts || {};
    var rows = E.activeTransits(natal, date)
      .map(function (t) { return brief(natal, t); })
      .filter(function (r) { return !!r.natalPoint; });

    rows.sort(function (x, y) { return y.strength - x.strength; });

    var lead = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].transit !== 'Moon') { lead = rows[i]; break; }
    }
    if (!lead && rows.length) { lead = rows[0]; }

    var rest = rows.filter(function (r) { return r !== lead; });
    return {
      lead: lead,
      support: rest.slice(0, opts.support || 3),
      all: rows
    };
  }

  /* Фильтры списка. Сферы жизни определяются натальной точкой, к которой
     идёт транзит: это единственная привязка, которую данные действительно
     поддерживают — приписывать транзиту «сферу» по самой транзитной планете
     значило бы выдумывать. */
  /* Области карты для фильтра транзитов. self добавлена под тему «я и мои
     границы» из воронки: Солнце — что человек есть, Асцендент — как он
     входит в комнату, Сатурн — где проходит граница. Остальные три уже
     были и совпадают с темами воронки один в один. */
  var AREA_POINTS = {
    love:      ['Venus', 'Moon', 'ASC'],
    career:    ['MC', 'Saturn', 'Mars', 'Sun'],
    growth:    ['Jupiter', 'Node', 'Uranus'],
    inner:     ['Moon', 'Neptune', 'Pluto', 'Mercury'],
    self:      ['Sun', 'ASC', 'Saturn']
  };

  function filterRows(rows, filter) {
    if (!filter || filter === 'all') { return rows; }
    if (filter === 'hard') { return rows.filter(function (r) { return r.tone === 'hard'; }); }
    if (filter === 'soft') { return rows.filter(function (r) { return r.tone === 'soft'; }); }
    if (filter === 'slow') {
      return rows.filter(function (r) {
        return ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].indexOf(r.transit) >= 0;
      });
    }
    var set = AREA_POINTS[filter];
    if (!set) { return rows; }
    return rows.filter(function (r) { return set.indexOf(r.natal) >= 0; });
  }

  return {
    detail: detail, brief: brief, rank: rank, filterRows: filterRows,
    AREA_POINTS: AREA_POINTS
  };
});
