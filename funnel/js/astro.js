/* astro.js — расчётное ядро воронки AstroMap App.
   Никаких зависимостей, никакой сети. Всё считается в браузере.

   Точность (проверено на контрольных датах, см. README):
   - Солнце: ~0.01° (низкоточная формула Meeus/USNO)
   - Луна:   ~0.3°  (усечённый ряд ELP2000, 8 главных членов)
   - Асцендент: ~0.1° при корректном часовом поясе
   Для определения знака этого хватает с запасом, кроме случаев,
   когда светило стоит в пределах ~0.5° от границы знака —
   такие случаи помечаются флагом .nearCusp.
*/
(function (global) {
  'use strict';

  var DEG = Math.PI / 180;

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function sind(x) { return Math.sin(x * DEG); }
  function cosd(x) { return Math.cos(x * DEG); }
  function tand(x) { return Math.tan(x * DEG); }

  /* --- Юлианская дата из UTC-компонентов --------------------------------- */
  function julianDay(y, m, d, hUT) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);          // григорианский календарь
    return Math.floor(365.25 * (y + 4716)) +
           Math.floor(30.6001 * (m + 1)) +
           d + hUT / 24 + B - 1524.5;
  }

  /* --- Часовые пояса ------------------------------------------------------
     Правила DST заданы приближённо и только для двух регионов.
     Для рождений до 1980-х возможна ошибка в 1 час — сказано в README. */
  function lastSunday(y, monthIdx) {                    // monthIdx: 0..11
    var d = new Date(Date.UTC(y, monthIdx + 1, 0));     // последний день месяца
    return d.getUTCDate() - d.getUTCDay();
  }
  function nthSunday(y, monthIdx, n) {
    var first = new Date(Date.UTC(y, monthIdx, 1)).getUTCDay();
    return 1 + ((7 - first) % 7) + (n - 1) * 7;
  }

  function dstOffset(rule, y, m, d) {                   // m: 1..12
    if (rule === 'eu') {
      if (m < 3 || m > 10) return 0;
      if (m > 3 && m < 10) return 1;
      if (m === 3) return d >= lastSunday(y, 2) ? 1 : 0;
      return d < lastSunday(y, 9) ? 1 : 0;
    }
    if (rule === 'us') {
      if (y >= 2007) {
        if (m < 3 || m > 11) return 0;
        if (m > 3 && m < 11) return 1;
        if (m === 3) return d >= nthSunday(y, 2, 2) ? 1 : 0;
        return d < nthSunday(y, 10, 1) ? 1 : 0;
      }
      if (m < 4 || m > 10) return 0;
      if (m > 4 && m < 10) return 1;
      if (m === 4) return d >= nthSunday(y, 3, 1) ? 1 : 0;
      return d < lastSunday(y, 9) ? 1 : 0;
    }
    if (rule === 'south') {                             // южное полушарие, EU-подобное
      if (m > 4 && m < 10) return 0;
      return 1;
    }
    return 0;
  }

  /* Смещение города на дату рождения. ДВА формата city.tz, как и в продукте:
     строка — имя таймзоны IANA ('Europe/Warsaw'), тогда считает движок из
     cities.js через Intl и браузерную базу, а значит верно для любого года;
     число — старое базовое смещение плюс ручное правило DST, оно осталось
     ради ручного ввода «не нашёл свой город» и уже сохранённых анкет. */
  function utcHours(dateParts, city) {
    var FC = global.FunnelCities;
    if (city && typeof city.tz === 'string' && FC) {
      var utc = FC.toUTC(dateParts.y, dateParts.m, dateParts.d,
                         dateParts.h, dateParts.min, city);
      /* Приводим к «часам UT того же календарного дня»: julianDay ниже ждёт
         именно это, а переход через полночь учитывается дробной частью. */
      var dayStart = Date.UTC(dateParts.y, dateParts.m - 1, dateParts.d, 0, 0, 0);
      return (utc.getTime() - dayStart) / 3600000;
    }
    var off = city.tz + dstOffset(city.dst, dateParts.y, dateParts.m, dateParts.d);
    return dateParts.h + dateParts.min / 60 - off;
  }

  /* --- Солнце ------------------------------------------------------------ */
  function sunLongitude(jd) {
    var n = jd - 2451545.0;
    var L = norm360(280.460 + 0.9856474 * n);
    var g = norm360(357.528 + 0.9856003 * n);
    return norm360(L + 1.915 * sind(g) + 0.020 * sind(2 * g));
  }

  /* --- Луна (усечённый ряд) ---------------------------------------------- */
  function moonLongitude(jd) {
    var T = (jd - 2451545.0) / 36525;
    var Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
    var D  = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
    var M  = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
    var Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
    var F  = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T);

    var dl = 6.288774 * sind(Mp)
           + 1.274027 * sind(2 * D - Mp)
           + 0.658314 * sind(2 * D)
           + 0.213618 * sind(2 * Mp)
           - 0.185116 * sind(M)
           - 0.114332 * sind(2 * F)
           + 0.058793 * sind(2 * D - 2 * Mp)
           + 0.057066 * sind(2 * D - M - Mp)
           + 0.053322 * sind(2 * D + Mp)
           + 0.045758 * sind(2 * D - M)
           - 0.040923 * sind(M - Mp)
           - 0.034720 * sind(D)
           - 0.030383 * sind(M + Mp);
    return norm360(Lp + dl);
  }

  /* --- Асцендент --------------------------------------------------------- */
  function obliquity(jd) {
    var T = (jd - 2451545.0) / 36525;
    return 23.439291 - 0.0130042 * T;
  }

  function ascendant(jd, latDeg, lonDeg) {
    var gmst = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0));
    var lst  = norm360(gmst + lonDeg);            // восточная долгота положительна
    var eps  = obliquity(jd);
    var x = cosd(lst);
    var y = -(sind(eps) * tand(latDeg) + cosd(eps) * sind(lst));
    return { asc: norm360(Math.atan2(x, y) / DEG), lst: lst };
  }

  /* --- Знаки ------------------------------------------------------------- */
  var SIGN_KEYS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
                   'libra', 'scorpio', 'sagittarius', 'capricorn',
                   'aquarius', 'pisces'];
  var ELEMENTS = ['fire', 'earth', 'air', 'water',
                  'fire', 'earth', 'air', 'water',
                  'fire', 'earth', 'air', 'water'];

  function signOf(lon) {
    var idx = Math.floor(norm360(lon) / 30);
    var deg = norm360(lon) - idx * 30;
    return {
      index: idx,
      key: SIGN_KEYS[idx],
      element: ELEMENTS[idx],
      degree: deg,
      nearCusp: deg < 0.7 || deg > 29.3
    };
  }

  /* --- Совместимость -----------------------------------------------------
     Детерминированная формула по угловому расстоянию Солнц и Лун.
     Это астрологическая методика (аспекты), а не измерение —
     так и подписано на экране. Одинаковый вход всегда даёт один результат. */
  var ASPECTS = [
    { a: 0,   w: 84, name: 'conjunction' },
    { a: 45,  w: 62, name: 'semisquare' },
    { a: 60,  w: 90, name: 'sextile' },
    { a: 90,  w: 55, name: 'square' },
    { a: 120, w: 97, name: 'trine' },
    { a: 150, w: 67, name: 'quincunx' },
    { a: 180, w: 73, name: 'opposition' }
  ];
  var NEUTRAL = 70;      // нет аспекта в орбисе — связь ни лёгкая, ни трудная
  var MAX_ORB = 9;

  function aspectScore(a, b) {
    var d = Math.abs(norm360(a - b));
    if (d > 180) d = 360 - d;
    var best = null, bestOrb = 1e9;
    for (var i = 0; i < ASPECTS.length; i++) {
      var orb = Math.abs(d - ASPECTS[i].a);
      if (orb < bestOrb) { bestOrb = orb; best = ASPECTS[i]; }
    }
    // чем точнее аспект, тем сильнее он тянет оценку от нейтральной
    var k = Math.max(0, 1 - bestOrb / MAX_ORB);
    return {
      score: Math.round(NEUTRAL + (best.w - NEUTRAL) * k),
      aspect: best.name,
      orb: bestOrb,
      exact: bestOrb <= 3
    };
  }

  function synastry(aSunLon, aMoonLon, bSunLon, bMoonLon) {
    var s = aspectScore(aSunLon, bSunLon);
    var m = aspectScore(aMoonLon, bMoonLon);
    var eA = ELEMENTS[Math.floor(norm360(aSunLon) / 30)];
    var eB = ELEMENTS[Math.floor(norm360(bSunLon) / 30)];
    var eScore = eA === eB ? 100
      : ((eA === 'fire' && eB === 'air') || (eA === 'air' && eB === 'fire') ||
         (eA === 'earth' && eB === 'water') || (eA === 'water' && eB === 'earth')) ? 88 : 60;
    // кросс-аспекты Солнце-Луна: в синастрии это основа, без них разброс плоский
    var x1 = aspectScore(aSunLon, bMoonLon);
    var x2 = aspectScore(aMoonLon, bSunLon);
    var raw = s.score * 0.25 + m.score * 0.25 +
              x1.score * 0.20 + x2.score * 0.20 + eScore * 0.10;
    /* raw — средневзвешенная оценка аспектов. Усреднение четырёх факторов
       математически сжимает результат к середине: практический диапазон
       raw = 62..88. Показываем нормализованный индекс на шкале 38..96.
       Это ШКАЛА, а не вероятность — так и подписано на экране (copy.js).
       Меняешь веса выше — пересчитай границы RAW_LO / RAW_HI. */
    var RAW_LO = 62, RAW_HI = 88, OUT_LO = 38, OUT_HI = 96;
    var idx = (raw - RAW_LO) / (RAW_HI - RAW_LO) * (OUT_HI - OUT_LO) + OUT_LO;
    idx = Math.max(OUT_LO, Math.min(OUT_HI, Math.round(idx)));

    // самый сильный аспект пары — им объясняем результат словами
    var all = [
      { k: 'sunSun', d: s }, { k: 'moonMoon', d: m },
      { k: 'sunMoon', d: x1 }, { k: 'moonSun', d: x2 }
    ].sort(function (p, q) { return p.d.orb - q.d.orb; });

    return {
      score: idx,
      raw: Math.round(raw * 10) / 10,
      strongest: all[0],
      sun: s,
      moon: m,
      cross: [x1, x2],
      elements: [eA, eB]
    };
  }

  /* --- Полный расчёт ----------------------------------------------------- */
  function chart(parts, city) {
    var hUT = utcHours(parts, city);
    var jd = julianDay(parts.y, parts.m, parts.d, hUT);
    var out = {
      jd: jd,
      sunLon: sunLongitude(jd),
      moonLon: moonLongitude(jd)
    };
    out.sun = signOf(out.sunLon);
    out.moon = signOf(out.moonLon);
    /* Асцендент требует РЕАЛЬНЫХ координат. При ручном вводе места lat/lon
       равны null, и раньше они уходили в формулу как есть: tand(null) даёт
       ноль, функция возвращает конечное число, и на экране появлялся
       уверенный асцендент, посчитанный из ничего. Это ровно тот случай,
       когда выдуманная величина выглядит как настоящая, поэтому проверка
       явная: нет координат — нет асцендента. */
    if (parts.timeKnown && city && typeof city.lat === 'number' && typeof city.lon === 'number') {
      var a = ascendant(jd, city.lat, city.lon);
      out.ascLon = a.asc;
      out.asc = signOf(a.asc);
    }
    return out;
  }

  /* Только по дате: Солнце точно, Луна на 12:00 местного (± пол знака) */
  function chartDateOnly(parts, tzGuess) {
    var jd = julianDay(parts.y, parts.m, parts.d, 12 - (tzGuess || 0));
    var o = { jd: jd, sunLon: sunLongitude(jd), moonLon: moonLongitude(jd) };
    o.sun = signOf(o.sunLon);
    o.moon = signOf(o.moonLon);
    return o;
  }

  /* --- Транзиты для недельного прогноза ---------------------------------
     Что делает подписка каждую неделю: пересчитывает положение Солнца и Луны
     на текущую неделю относительно натальной карты. */
  function weekTransits(natal, now) {
    var jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1,
                       now.getUTCDate(), now.getUTCHours());
    var tSun = sunLongitude(jd), tMoon = moonLongitude(jd);
    return {
      sunHouseShift: signOf(tSun),
      moonSign: signOf(tMoon),
      sunToNatalSun: aspectScore(tSun, natal.sunLon),
      moonToNatalMoon: aspectScore(tMoon, natal.moonLon)
    };
  }

  /* Города переехали в js/cities.js: один список на все десять языков,
     собранный из того же датасета, что у продукта. Прежние CITIES_PL и
     CITIES_EN удалены — это были два коротких списка разного состава и
     порядка, и хранившийся рядом индекс означал в них разные города. */

  global.Astro = {
    julianDay: julianDay,
    sunLongitude: sunLongitude,
    moonLongitude: moonLongitude,
    ascendant: ascendant,
    signOf: signOf,
    chart: chart,
    chartDateOnly: chartDateOnly,
    synastry: synastry,
    weekTransits: weekTransits,
    dstOffset: dstOffset,
    SIGN_KEYS: SIGN_KEYS,
    ELEMENTS: ELEMENTS
  };
})(typeof window !== 'undefined' ? window : globalThis);
