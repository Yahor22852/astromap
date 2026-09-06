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

  function utcHours(dateParts, city) {
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
    if (parts.timeKnown && city) {
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

  /* --- Города -----------------------------------------------------------
     tz — базовое смещение без DST; dst — правило ('eu' | 'us' | 'south' | '')
     Координаты округлены до 0.01° (~1 км), для асцендента этого достаточно. */
  var CITIES_PL = [
    { n: 'Warszawa',       lat: 52.23, lon: 21.01, tz: 1, dst: 'eu' },
    { n: 'Kraków',         lat: 50.06, lon: 19.94, tz: 1, dst: 'eu' },
    { n: 'Łódź',           lat: 51.76, lon: 19.46, tz: 1, dst: 'eu' },
    { n: 'Wrocław',        lat: 51.11, lon: 17.04, tz: 1, dst: 'eu' },
    { n: 'Poznań',         lat: 52.41, lon: 16.93, tz: 1, dst: 'eu' },
    { n: 'Gdańsk',         lat: 54.35, lon: 18.65, tz: 1, dst: 'eu' },
    { n: 'Gdynia',         lat: 54.52, lon: 18.53, tz: 1, dst: 'eu' },
    { n: 'Szczecin',       lat: 53.43, lon: 14.55, tz: 1, dst: 'eu' },
    { n: 'Bydgoszcz',      lat: 53.12, lon: 18.01, tz: 1, dst: 'eu' },
    { n: 'Lublin',         lat: 51.25, lon: 22.57, tz: 1, dst: 'eu' },
    { n: 'Białystok',      lat: 53.13, lon: 23.16, tz: 1, dst: 'eu' },
    { n: 'Katowice',       lat: 50.26, lon: 19.02, tz: 1, dst: 'eu' },
    { n: 'Gliwice',        lat: 50.29, lon: 18.67, tz: 1, dst: 'eu' },
    { n: 'Zabrze',         lat: 50.32, lon: 18.79, tz: 1, dst: 'eu' },
    { n: 'Sosnowiec',      lat: 50.28, lon: 19.13, tz: 1, dst: 'eu' },
    { n: 'Częstochowa',    lat: 50.81, lon: 19.12, tz: 1, dst: 'eu' },
    { n: 'Radom',          lat: 51.40, lon: 21.15, tz: 1, dst: 'eu' },
    { n: 'Toruń',          lat: 53.01, lon: 18.60, tz: 1, dst: 'eu' },
    { n: 'Kielce',         lat: 50.87, lon: 20.63, tz: 1, dst: 'eu' },
    { n: 'Rzeszów',        lat: 50.04, lon: 22.00, tz: 1, dst: 'eu' },
    { n: 'Olsztyn',        lat: 53.78, lon: 20.49, tz: 1, dst: 'eu' },
    { n: 'Zielona Góra',   lat: 51.94, lon: 15.51, tz: 1, dst: 'eu' },
    { n: 'Opole',          lat: 50.67, lon: 17.93, tz: 1, dst: 'eu' },
    { n: 'Rybnik',         lat: 50.09, lon: 18.55, tz: 1, dst: 'eu' },
    { n: 'Tychy',          lat: 50.13, lon: 18.99, tz: 1, dst: 'eu' },
    { n: 'Bielsko-Biała',  lat: 49.82, lon: 19.04, tz: 1, dst: 'eu' },
    { n: 'Płock',          lat: 52.55, lon: 19.71, tz: 1, dst: 'eu' },
    { n: 'Elbląg',         lat: 54.16, lon: 19.40, tz: 1, dst: 'eu' },
    { n: 'Koszalin',       lat: 54.19, lon: 16.18, tz: 1, dst: 'eu' },
    { n: 'Legnica',        lat: 51.21, lon: 16.16, tz: 1, dst: 'eu' },
    { n: 'Nowy Sącz',      lat: 49.62, lon: 20.70, tz: 1, dst: 'eu' },
    { n: 'Lubin',          lat: 51.40, lon: 16.20, tz: 1, dst: 'eu' },
    { n: 'Inne miasto w Polsce', lat: 52.00, lon: 19.00, tz: 1, dst: 'eu' }
  ];

  var CITIES_EN = [
    { n: 'London',        lat: 51.51, lon: -0.13,   tz: 0,  dst: 'eu' },
    { n: 'Manchester',    lat: 53.48, lon: -2.24,   tz: 0,  dst: 'eu' },
    { n: 'Dublin',        lat: 53.35, lon: -6.26,   tz: 0,  dst: 'eu' },
    { n: 'New York',      lat: 40.71, lon: -74.01,  tz: -5, dst: 'us' },
    { n: 'Los Angeles',   lat: 34.05, lon: -118.24, tz: -8, dst: 'us' },
    { n: 'Chicago',       lat: 41.88, lon: -87.63,  tz: -6, dst: 'us' },
    { n: 'Houston',       lat: 29.76, lon: -95.37,  tz: -6, dst: 'us' },
    { n: 'Miami',         lat: 25.76, lon: -80.19,  tz: -5, dst: 'us' },
    { n: 'Toronto',       lat: 43.65, lon: -79.38,  tz: -5, dst: 'us' },
    { n: 'Vancouver',     lat: 49.28, lon: -123.12, tz: -8, dst: 'us' },
    { n: 'Berlin',        lat: 52.52, lon: 13.40,   tz: 1,  dst: 'eu' },
    { n: 'Paris',         lat: 48.86, lon: 2.35,    tz: 1,  dst: 'eu' },
    { n: 'Madrid',        lat: 40.42, lon: -3.70,   tz: 1,  dst: 'eu' },
    { n: 'Rome',          lat: 41.90, lon: 12.50,   tz: 1,  dst: 'eu' },
    { n: 'Amsterdam',     lat: 52.37, lon: 4.90,    tz: 1,  dst: 'eu' },
    { n: 'Warsaw',        lat: 52.23, lon: 21.01,   tz: 1,  dst: 'eu' },
    { n: 'Stockholm',     lat: 59.33, lon: 18.07,   tz: 1,  dst: 'eu' },
    { n: 'Istanbul',      lat: 41.01, lon: 28.98,   tz: 3,  dst: '' },
    { n: 'Dubai',         lat: 25.20, lon: 55.27,   tz: 4,  dst: '' },
    { n: 'Mumbai',        lat: 19.08, lon: 72.88,   tz: 5.5, dst: '' },
    { n: 'Singapore',     lat: 1.35,  lon: 103.82,  tz: 8,  dst: '' },
    { n: 'Manila',        lat: 14.60, lon: 120.98,  tz: 8,  dst: '' },
    { n: 'Tokyo',         lat: 35.68, lon: 139.69,  tz: 9,  dst: '' },
    { n: 'Sydney',        lat: -33.87, lon: 151.21, tz: 10, dst: 'south' },
    { n: 'Melbourne',     lat: -37.81, lon: 144.96, tz: 10, dst: 'south' },
    { n: 'Auckland',      lat: -36.85, lon: 174.76, tz: 12, dst: 'south' },
    { n: 'Johannesburg',  lat: -26.20, lon: 28.05,  tz: 2,  dst: '' },
    { n: 'Lagos',         lat: 6.52,  lon: 3.38,    tz: 1,  dst: '' },
    { n: 'Mexico City',   lat: 19.43, lon: -99.13,  tz: -6, dst: '' },
    { n: 'São Paulo',     lat: -23.55, lon: -46.63, tz: -3, dst: '' },
    { n: 'Buenos Aires',  lat: -34.60, lon: -58.38, tz: -3, dst: '' },
    { n: 'Other city',    lat: 51.51, lon: -0.13,   tz: 0,  dst: 'eu' }
  ];

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
    ELEMENTS: ELEMENTS,
    CITIES_PL: CITIES_PL,
    CITIES_EN: CITIES_EN
  };
})(typeof window !== 'undefined' ? window : globalThis);
