/* engine.js — расчётное ядро продукта AstroMap.
   Работает и в браузере, и в node. Эфемериды: astronomy-engine (MIT),
   сверена с примером 47.a у Meeus — расхождение 0.013°.

   Что умеет:
   - карта на момент: 10 тел + средний лунный узел, долгота, скорость, ретроградность
   - аспекты внутри карты и между двумя картами, с орбисами
   - поиск точных транзитов в интервале дат (день / неделя / месяц)
   - синастрия: кросс-аспекты и индекс
   - композит: карта средних точек

   Чего НЕ умеет и почему:
   - Хирон и малые тела: их нет в astronomy-engine без дополнительных данных
   - дома Плацидуса: итеративная формула требует сверки с эталоном, до этого
     отдаётся только знаковая система (whole sign), которая считается однозначно
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../vendor/astronomy.node.js'));
  } else {
    root.Engine = factory(root.Astronomy);
  }
})(typeof self !== 'undefined' ? self : this, function (Astronomy) {
  'use strict';

  var DEG = Math.PI / 180;
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function sind(x) { return Math.sin(x * DEG); }
  function cosd(x) { return Math.cos(x * DEG); }
  function tand(x) { return Math.tan(x * DEG); }

  var SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
               'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  var ELEMENTS = ['fire', 'earth', 'air', 'water', 'fire', 'earth',
                  'air', 'water', 'fire', 'earth', 'air', 'water'];
  var MODES = ['cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable',
               'cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable'];

  var BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
                'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

  /* Вес точки: определяет, какие транзиты показывать первыми. */
  var WEIGHT = {
    Sun: 10, Moon: 9, Mercury: 6, Venus: 7, Mars: 7,
    Jupiter: 8, Saturn: 9, Uranus: 7, Neptune: 6, Pluto: 7, Node: 5
  };

  /* Скорость: по ней решаем, что показывать в дне, а что в месяце. */
  var FAST = { Moon: 1, Sun: 1, Mercury: 1, Venus: 1, Mars: 1 };

  function signOf(lon) {
    var l = norm360(lon);
    var i = Math.floor(l / 30);
    return {
      index: i, key: SIGNS[i], element: ELEMENTS[i], mode: MODES[i],
      degree: l - i * 30
    };
  }

  /* --- средний лунный узел (формула, astronomy-engine его не отдаёт) ------ */
  function meanNode(date) {
    var jd = 2440587.5 + date.getTime() / 86400000;
    var T = (jd - 2451545.0) / 36525;
    return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
  }

  function eclipticLon(body, date) {
    var v = Astronomy.GeoVector(body, date, true);
    return norm360(Astronomy.Ecliptic(v).elon);
  }

  /* --- положение тела со скоростью ---------------------------------------- */
  function bodyAt(body, date) {
    var lon, lon2;
    var dt = 3600000;                       // час вперёд — для скорости
    if (body === 'Node') {
      lon = meanNode(date);
      lon2 = meanNode(new Date(date.getTime() + dt));
    } else {
      lon = eclipticLon(body, date);
      lon2 = eclipticLon(body, new Date(date.getTime() + dt));
    }
    var d = lon2 - lon;
    if (d > 180) { d -= 360; }
    if (d < -180) { d += 360; }
    var speed = d * 24;                      // градусов в сутки
    return {
      name: body,
      lon: lon,
      speed: speed,
      retro: speed < 0,
      sign: signOf(lon),
      weight: WEIGHT[body] || 5
    };
  }

  /* --- угловые точки ------------------------------------------------------ */
  function obliquity(date) {
    var jd = 2440587.5 + date.getTime() / 86400000;
    var T = (jd - 2451545.0) / 36525;
    return 23.439291 - 0.0130042 * T;
  }

  function angles(date, lat, lon) {
    var jd = 2440587.5 + date.getTime() / 86400000;
    var gmst = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0));
    var lst = norm360(gmst + lon);
    var eps = obliquity(date);

    var asc = norm360(Math.atan2(cosd(lst),
      -(sind(eps) * tand(lat) + cosd(eps) * sind(lst))) / DEG);
    var mc = norm360(Math.atan2(tand(lst), cosd(eps)) / DEG);
    /* atan2 даёт МС в диапазоне ±90 от LST — приводим к правильной четверти */
    if (Math.abs(norm360(mc - lst)) > 90 && Math.abs(norm360(lst - mc)) > 90) {
      mc = norm360(mc + 180);
    }
    return { asc: asc, mc: mc, lst: lst, eps: eps };
  }

  /* --- карта -------------------------------------------------------------- */
  function chart(date, lat, lon, opts) {
    opts = opts || {};
    var points = BODIES.map(function (b) { return bodyAt(b, date); });
    points.push(bodyAt('Node', date));

    var out = { date: date, points: points, byName: {} };
    points.forEach(function (p) { out.byName[p.name] = p; });

    if (opts.timeKnown !== false && lat !== null && lat !== undefined) {
      var a = angles(date, lat, lon);
      out.asc = { name: 'ASC', lon: a.asc, sign: signOf(a.asc), speed: 0,
                  retro: false, weight: 9 };
      out.mc = { name: 'MC', lon: a.mc, sign: signOf(a.mc), speed: 0,
                 retro: false, weight: 8 };
      /* Дома знаковой системы: 1-й дом = знак асцендента целиком. */
      out.houseSystem = 'whole-sign';
      out.houses = [];
      var startSign = out.asc.sign.index;
      for (var i = 0; i < 12; i++) {
        out.houses.push({ n: i + 1, sign: SIGNS[(startSign + i) % 12],
                          lon: ((startSign + i) % 12) * 30 });
      }
      points.forEach(function (p) {
        p.house = ((p.sign.index - startSign + 12) % 12) + 1;
      });
    }

    out.balance = balance(points, out.asc, out.mc);
    return out;
  }

  /* --- баланс стихий и крестов ---------------------------------------------

     ВЕСА, А НЕ ПОДСЧЁТ ТОЧЕК. Простой подсчёт «сколько планет в огне»
     приравнивает Солнце к Плутону, и это ломает смысл: Уран, Нептун и Плутон
     проходят знак за 7–20 лет, так что у всех, кто родился в одно
     десятилетие, эти три точки стоят в одних и тех же знаках. Считая их
     наравне, получаем «портрет», общий для целого поколения, — то есть
     ничего личного. Поэтому вес падает по мере того, как точка становится
     общей для многих:

       Солнце, Луна, Асцендент — 3   что человек есть, что чувствует,
                                     как входит в комнату; ASC вообще
                                     меняется каждые две минуты
       Меркурий, Венера, Марс  — 2   личные планеты, знак меняется за недели
       MC                      — 2   угол, но менее личный, чем ASC
       Юпитер, Сатурн          — 1.5 социальные, знак за год-два
       Уран, Нептун, Плутон    — 1   поколенческие

     Узел исключён: это не тело, а точка пересечения орбит, и в раскладе по
     стихиям традиционно не участвует.

     БЕЗ ВРЕМЕНИ РОЖДЕНИЯ асцендента и MC нет, и из суммы уходит 5 весов из
     23 — больше пятой части. Результат остаётся осмысленным, но это уже
     другой расклад, и экран обязан об этом сказать: withAngles говорит,
     учтены углы или нет.

     Проценты считаются от фактической суммы весов, поэтому складываются в
     100 и с углами, и без них.

     «Не хватает» — не любой минимум, а доля меньше половины равномерной:
     при четырёх стихиях равномерно — 25%, порог 12.5%. Иначе у совершенно
     ровной карты одна стихия всё равно объявлялась бы дефицитной только
     потому, что оказалась на десятую долю процента ниже прочих. */
  var BAL_W = {
    Sun: 3, Moon: 3, ASC: 3, MC: 2,
    Mercury: 2, Venus: 2, Mars: 2,
    Jupiter: 1.5, Saturn: 1.5,
    Uranus: 1, Neptune: 1, Pluto: 1
  };

  function balance(points, asc, mc) {
    var counts = { elements: { fire: 0, earth: 0, air: 0, water: 0 },
                   modes: { cardinal: 0, fixed: 0, mutable: 0 } };
    var w = { elements: { fire: 0, earth: 0, air: 0, water: 0 },
              modes: { cardinal: 0, fixed: 0, mutable: 0 } };
    var total = 0;

    var all = points.slice();
    if (asc) { all.push(asc); }
    if (mc) { all.push(mc); }

    all.forEach(function (p) {
      var weight = BAL_W[p.name];
      if (!weight) { return; }                    /* Node и всё незнакомое */
      counts.elements[p.sign.element] += 1;
      counts.modes[p.sign.mode] += 1;
      w.elements[p.sign.element] += weight;
      w.modes[p.sign.mode] += weight;
      total += weight;
    });

    function pct(obj) {
      var out = {};
      Object.keys(obj).forEach(function (k) {
        out[k] = total ? Math.round(obj[k] / total * 1000) / 10 : 0;
      });
      return out;
    }
    /* Ничья — не деталь, а другой ответ. Земля 34.8% и вода 34.8% — это не
       «земная карта», и называть одну из них ведущей только потому, что она
       раньше в объекте, значит придумать человеку акцент, которого нет.
       Возвращаем список: один ключ — ведущая стихия, два и больше — поровну. */
    function top(obj) {
      var best = Object.keys(obj).reduce(function (a, b) {
        return obj[b] > obj[a] ? b : a;
      });
      return Object.keys(obj).filter(function (k) { return obj[k] === obj[best]; });
    }
    /* Порог дефицита — половина равномерной доли: 12.5% для стихий (их
       четыре), 16.7% для крестов (их три). */
    function low(obj, n) {
      var k = Object.keys(obj).reduce(function (a, b) {
        return obj[b] < obj[a] ? b : a;
      });
      return obj[k] < 100 / n / 2 ? k : null;
    }

    var p = { elements: pct(w.elements), modes: pct(w.modes) };
    return {
      counts: counts,
      weighted: w,
      pct: p,
      total: total,
      withAngles: !!asc,
      /* top.element / top.mode — массивы: длина 1 = ведущая, больше = поровну */
      top: { element: top(p.elements), mode: top(p.modes) },
      low: { element: low(p.elements, 4), mode: low(p.modes, 3) }
    };
  }

  /* --- аспекты ------------------------------------------------------------ */
  var ASPECTS = [
    { key: 'conjunction', angle: 0,   orb: 8, tone: 'neutral' },
    { key: 'sextile',     angle: 60,  orb: 5, tone: 'soft' },
    { key: 'square',      angle: 90,  orb: 7, tone: 'hard' },
    { key: 'trine',       angle: 120, orb: 7, tone: 'soft' },
    { key: 'opposition',  angle: 180, orb: 8, tone: 'hard' }
  ];
  /* Светила получают более широкий орбис — стандартная практика. */
  function orbFor(asp, a, b) {
    var lum = (a === 'Sun' || a === 'Moon' || b === 'Sun' || b === 'Moon');
    return asp.orb + (lum ? 2 : 0);
  }

  function separation(l1, l2) {
    var d = Math.abs(norm360(l1 - l2));
    return d > 180 ? 360 - d : d;
  }

  function findAspect(p1, p2) {
    var sep = separation(p1.lon, p2.lon);
    for (var i = 0; i < ASPECTS.length; i++) {
      var a = ASPECTS[i];
      var orb = Math.abs(sep - a.angle);
      if (orb <= orbFor(a, p1.name, p2.name)) {
        return {
          aspect: a.key, tone: a.tone, orb: orb, exact: orb < 1,
          applying: isApplying(p1, p2, sep, a.angle)
        };
      }
    }
    return null;
  }

  /* Сходящийся аспект (applying) переживается сильнее расходящегося. */
  function isApplying(p1, p2, sep, target) {
    var rel = (p1.speed || 0) - (p2.speed || 0);
    var d1 = norm360(p1.lon - p2.lon);
    var closing = (d1 <= 180) ? -rel : rel;
    return (sep > target) ? closing < 0 : closing > 0;
  }

  function chartAspects(ch) {
    var pts = ch.points.slice();
    if (ch.asc) { pts.push(ch.asc, ch.mc); }
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var a = findAspect(pts[i], pts[j]);
        if (a) {
          out.push({ a: pts[i].name, b: pts[j].name, data: a,
                     weight: pts[i].weight + pts[j].weight });
        }
      }
    }
    return out.sort(function (x, y) { return y.weight - x.weight || x.data.orb - y.data.orb; });
  }

  /* --- транзиты -----------------------------------------------------------
     Ищем моменты, когда транзитная планета образует точный аспект к натальной
     точке внутри интервала. Скан по сетке + уточнение делением пополам. */
  function transitEvents(natal, from, to, opts) {
    opts = opts || {};
    var bodies = opts.bodies || BODIES.concat(['Node']);
    var targets = natal.points.slice();
    if (natal.asc) { targets.push(natal.asc, natal.mc); }

    var stepMs = opts.stepHours ? opts.stepHours * 3600000 : 6 * 3600000;
    var events = [];

    /* lon(b, ms) зависит только от тела и момента времени, а не от того,
       с какой натальной точкой или аспектом мы его сейчас сравниваем —
       раньше оно пересчитывалось заново на каждую пару (target, aspect),
       то есть по ~targets.length*ASPECTS.length (обычно 50-65) раз больше,
       чем нужно. На полгода/год это давало по 1-2 секунды синхронного
       счёта на эфемеридах и подвисание вкладки. Считаем путь тела один раз
       и переиспользуем для всех целей/аспектов. */
    bodies.forEach(function (b) {
      var times = [], lons = [];
      for (var ms = from.getTime(); ms <= to.getTime(); ms += stepMs) {
        var d = new Date(ms);
        times.push(d);
        lons.push((b === 'Node') ? meanNode(d) : eclipticLon(b, d));
      }

      targets.forEach(function (t) {
        ASPECTS.forEach(function (asp) {
          var prev = null, prevT = null;
          for (var i = 0; i < times.length; i++) {
            var d2 = times[i], lon = lons[i];
            var diff = separation(lon, t.lon) - asp.angle;
            if (prev !== null && ((prev < 0 && diff >= 0) || (prev > 0 && diff <= 0))) {
              var exact = refine(b, t.lon, asp.angle, prevT, d2);
              events.push({
                transit: b, natal: t.name, aspect: asp.key, tone: asp.tone,
                exactAt: exact,
                weight: (WEIGHT[b] || 5) + (t.weight || 5),
                slow: !FAST[b]
              });
            }
            prev = diff; prevT = d2;
          }
        });
      });
    });

    return events.sort(function (x, y) { return x.exactAt - y.exactAt; });
  }

  function refine(body, targetLon, angle, t0, t1) {
    var a = t0.getTime(), b = t1.getTime();
    for (var i = 0; i < 30; i++) {
      var m = (a + b) / 2;
      var d0 = separation((body === 'Node') ? meanNode(new Date(a)) :
        eclipticLon(body, new Date(a)), targetLon) - angle;
      var dm = separation((body === 'Node') ? meanNode(new Date(m)) :
        eclipticLon(body, new Date(m)), targetLon) - angle;
      if ((d0 < 0) === (dm < 0)) { a = m; } else { b = m; }
    }
    return new Date((a + b) / 2);
  }

  /* Активные транзиты «сейчас»: аспекты в орбисе на конкретный момент. */
  function activeTransits(natal, date, opts) {
    opts = opts || {};
    var bodies = opts.bodies || BODIES.concat(['Node']);
    var targets = natal.points.slice();
    if (natal.asc) { targets.push(natal.asc, natal.mc); }
    var out = [];
    bodies.forEach(function (b) {
      var p = bodyAt(b, date);
      targets.forEach(function (t) {
        var a = findAspect(p, t);
        if (a) {
          out.push({
            transit: b, natal: t.name, aspect: a.aspect, tone: a.tone,
            orb: a.orb, applying: a.applying, retro: p.retro,
            weight: (WEIGHT[b] || 5) + (t.weight || 5) - a.orb
          });
        }
      });
    });
    return out.sort(function (x, y) { return y.weight - x.weight; });
  }

  /* --- привязка транзитной точки к натальной карте -------------------------
     Один вопрос, который задаёт каждый раздел продукта: где сейчас идёт это
     тело относительно карты человека и чего оно касается. Раньше ответ
     собирался отдельно в каждом разделе; теперь он один.

     Дом считается только при известном времени рождения: без асцендента
     домов нет, и подставить их нечем — возвращаем null, а раздел сам решает,
     что показать вместо. Дома знаковые (whole-sign), как и во всей карте,
     поэтому дом равен смещению знака от знака асцендента. */
  function houseOfSign(natal, signIndex) {
    if (!natal || !natal.asc) { return null; }
    return ((signIndex - natal.asc.sign.index + 12) % 12) + 1;
  }

  /* Аспекты транзитного тела ко всем точкам карты, отсортированные так, что
     первым идёт самый весомый: вес точки минус орбис — тот же принцип, что
     в activeTransits(), чтобы разделы не расходились в том, какой контакт
     считать главным. */
  function contactsFor(natal, body, date) {
    if (!natal) { return null; }
    var p = bodyAt(body, date);
    var targets = natal.points.slice();
    if (natal.asc) { targets.push(natal.asc, natal.mc); }
    var aspects = [];
    targets.forEach(function (t) {
      if (t.name === body) { return; }        /* транзит к самому себе не контакт */
      var a = findAspect(p, t);
      if (!a) { return; }
      aspects.push({
        natal: t.name, aspect: a.aspect, tone: a.tone, orb: a.orb,
        applying: a.applying, weight: (t.weight || 5) - a.orb
      });
    });
    aspects.sort(function (x, y) { return y.weight - x.weight; });
    return { point: p, sign: p.sign, house: houseOfSign(natal, p.sign.index), aspects: aspects };
  }

  /* --- синастрия ----------------------------------------------------------
     Две отдельные величины, их нельзя складывать:
     IMPORTANCE — насколько пара планет вообще важна для отношений;
     VALENCE    — насколько контакт лёгкий или трудный.
     Ошибка, которую здесь легко сделать: прибавить бонус за важность к оценке
     тона. Тогда квадрат Солнце-Солнце даёт плюс, потому что пара важная.
     Важность умножает вес аспекта, тон задаёт знак. */
  var PAIR_IMPORTANCE = {
    'Moon|Sun': 8, 'Moon|Moon': 6, 'Mars|Venus': 8, 'Sun|Venus': 5,
    'Moon|Venus': 5, 'Sun|Sun': 4, 'Venus|Venus': 4, 'Mars|Moon': 4,
    'ASC|Sun': 5, 'ASC|Moon': 4, 'ASC|Venus': 4, 'MC|Sun': 3,
    'Saturn|Sun': 5, 'Moon|Saturn': 5, 'Saturn|Venus': 4, 'Mars|Saturn': 4,
    'Pluto|Sun': 4, 'Pluto|Venus': 4, 'Moon|Neptune': 3, 'Jupiter|Sun': 3
  };
  /* Контакты с Сатурном тяжелее своего аспекта, с Юпитером — легче. */
  var PAIR_VALENCE = {
    'Saturn|Sun': -0.25, 'Moon|Saturn': -0.35, 'Saturn|Venus': -0.3,
    'Mars|Saturn': -0.3, 'Jupiter|Sun': 0.2, 'Jupiter|Moon': 0.2,
    'Jupiter|Venus': 0.2, 'Mars|Mars': -0.15, 'Neptune|Venus': -0.1
  };
  function pairKey(a, b) { return [a, b].sort().join('|'); }

  var TONE_SCORE = { soft: 1, neutral: 0.5, hard: -0.5 };

  function synastry(chA, chB) {
    var A = chA.points.concat(chA.asc ? [chA.asc, chA.mc] : []);
    var B = chB.points.concat(chB.asc ? [chB.asc, chB.mc] : []);
    var hits = [];

    A.forEach(function (p) {
      B.forEach(function (q) {
        var a = findAspect(p, q);
        if (!a) { return; }
        var k = pairKey(p.name, q.name);
        var importance = 6 + (PAIR_IMPORTANCE[k] || 0);
        var valence = TONE_SCORE[a.tone] + (PAIR_VALENCE[k] || 0);
        var closeness = Math.max(0.25, 1 - a.orb / 10);
        var w = importance * closeness;
        hits.push({
          a: p.name, b: q.name, aspect: a.aspect, tone: a.tone, orb: a.orb,
          importance: importance, valence: Math.round(valence * 100) / 100,
          w: w, score: w * valence, weight: w
        });
      });
    });

    /* Индекс считаем не по всем попаданиям, а по двенадцати сильнейшим:
       усреднение по пятидесяти аспектам математически стягивает результат
       к середине, и все пары получают 56-62%. Астролог тоже читает главные
       контакты, а не все подряд. */
    hits.sort(function (x, y) { return y.w - x.w; });
    var top = hits.slice(0, 12);
    var sw = 0, ss = 0;
    top.forEach(function (h) { sw += h.w; ss += h.score; });
    var avg = sw ? ss / sw : 0;                 /* тон-взвешенное среднее */

    /* Практический диапазон avg на выборке: -0.35..0.95. Меняешь веса выше —
       пересчитай границы, иначе индекс упрётся в потолок или в пол. */
    var LO = -0.35, HI = 0.95, OUT_LO = 38, OUT_HI = 96;
    var idx = (avg - LO) / (HI - LO) * (OUT_HI - OUT_LO) + OUT_LO;
    idx = Math.max(OUT_LO, Math.min(OUT_HI, Math.round(idx)));

    return { score: idx, avg: Math.round(avg * 1000) / 1000,
             hits: hits, top: hits.slice(0, 8), counted: top.length };
  }

  /* --- композит: карта средних точек -------------------------------------- */
  function midpoint(l1, l2) {
    var d = norm360(l2 - l1);
    if (d > 180) { d -= 360; }
    return norm360(l1 + d / 2);
  }

  function composite(chA, chB) {
    var out = { points: [], byName: {} };
    BODIES.concat(['Node']).forEach(function (b) {
      var p = chA.byName[b], q = chB.byName[b];
      if (!p || !q) { return; }
      var lon = midpoint(p.lon, q.lon);
      var pt = { name: b, lon: lon, sign: signOf(lon), speed: 0, retro: false,
                 weight: WEIGHT[b] || 5 };
      out.points.push(pt);
      out.byName[b] = pt;
    });
    if (chA.asc && chB.asc) {
      var al = midpoint(chA.asc.lon, chB.asc.lon);
      var ml = midpoint(chA.mc.lon, chB.mc.lon);
      out.asc = { name: 'ASC', lon: al, sign: signOf(al), weight: 9 };
      out.mc = { name: 'MC', lon: ml, sign: signOf(ml), weight: 8 };
    }
    out.aspects = chartAspects(out);
    out.balance = balance(out.points, out.asc, out.mc);
    return out;
  }

  return {
    SIGNS: SIGNS, ELEMENTS: ELEMENTS, MODES: MODES, BODIES: BODIES,
    ASPECTS: ASPECTS,
    signOf: signOf, bodyAt: bodyAt, angles: angles, chart: chart,
    chartAspects: chartAspects, findAspect: findAspect, separation: separation,
    transitEvents: transitEvents, activeTransits: activeTransits,
    houseOfSign: houseOfSign, contactsFor: contactsFor,
    synastry: synastry, composite: composite, midpoint: midpoint,
    meanNode: meanNode, balance: balance, BAL_W: BAL_W
  };
});
