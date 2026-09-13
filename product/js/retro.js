/* retro.js — циклы ретроградного движения: расчёты, без DOM и без состояния
   приложения. Отделено от app.js по образцу moon.js: чистые функции
   (тело, дата) -> данные, которые экран только раскладывает по разметке.

   Что здесь считается и почему именно так:

   СТАНЦИИ. Момент разворота — смена знака скорости. Ищем сканированием по
   дням и уточняем делением пополам, как это уже делал nextStation() в
   app.js; здесь то же самое, но в обе стороны от даты, потому что для
   идущего прямо сейчас ретрограда начало цикла лежит в прошлом.

   ТЕНЕВЫЕ ПЕРИОДЫ. Предтень — отрезок до станции, когда планета впервые
   проходит ту долготу, на которой позже развернётся обратно к прямому
   движению. Послетень — после станции директ, пока планета не вернётся на
   долготу, где она разворачивалась в ретроград. Дальше границы ищутся не
   сканированием, а делением пополам: между станциями движение по долготе
   монотонно, поэтому разность (долгота - цель) меняет знак ровно один раз.
   Это на порядок дешевле плотного скана — важно, потому что у внешних
   планет тень тянется почти на год.

   ГРАНИЦЫ ПОИСКА. Ретроградные дуги известны по продолжительности
   (Меркурий ~3 недели, Плутон ~5 месяцев), поэтому сканировать 400 дней в
   обе стороны незачем: RETRO_SPAN задаёт запас на тело, и поиск станции
   обрывается раньше.

   КЭШ. Один цикл — это десятки вызовов эфемерид, а экран перерисовывается
   на каждый клик по планете или фильтру. Кэшируем по «тело + календарный
   день»: внутри суток ответ не меняется настолько, чтобы это было видно на
   шкале в днях. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.Retro = factory(root.Engine);
  }
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';

  var DAY = 86400000;

  /* Тела, которые вообще бывают ретроградными с точки зрения продукта.
     Солнце и Луна не разворачиваются, узел движется попятно всегда — для
     них понятие цикла не определено, поэтому их здесь нет. */
  var BODIES = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
                'Uranus', 'Neptune', 'Pluto'];

  /* Две РАЗНЫЕ величины, которые легко перепутать — и на этом сначала
     потерялись Меркурий с Марсом.

     RETRO_SPAN — длительность самой ретроградной дуги. Ею ограничен поиск
     назад (начало идущего сейчас ретрограда) и окно, в котором ищутся
     границы тени.

     LOOKAHEAD — насколько далеко вперёд может лежать СЛЕДУЮЩИЙ разворот,
     когда тело идёт прямо и вне тени. Это совсем другой порядок: дуга
     Меркурия три недели, а между его ретроградами около четырёх месяцев;
     Марс разворачивается раз в двадцать шесть месяцев. С границей по
     RETRO_SPAN поиск до них просто не дотягивался и цикл выпадал. */
  var RETRO_SPAN = {
    Mercury: 40, Venus: 70, Mars: 110, Jupiter: 160,
    Saturn: 180, Uranus: 200, Neptune: 200, Pluto: 210
  };
  var LOOKAHEAD = {
    Mercury: 200, Venus: 700, Mars: 900, Jupiter: 450,
    Saturn: 420, Uranus: 420, Neptune: 420, Pluto: 420
  };
  /* Шаг скана 3 суток безопасен для всех тел: самая короткая ретроградная
     дуга — меркурианская, около 21 дня, то есть внутрь любой дуги попадёт
     минимум семь точек и перешагнуть сразу оба разворота невозможно.
     Точный момент всё равно уточняется делением пополам. */
  var SCAN_STEP = 3;

  function speedAt(body, ms) { return E.bodyAt(body, new Date(ms)).speed; }
  function lonAt(body, ms) { return E.bodyAt(body, new Date(ms)).lon; }

  function bisectSpeedFlip(body, a, b) {
    var negA = speedAt(body, a) < 0;
    for (var i = 0; i < 26; i++) {
      var m = (a + b) / 2;
      if ((speedAt(body, m) < 0) === negA) { a = m; } else { b = m; }
    }
    return new Date((a + b) / 2);
  }

  /* dir: +1 вперёд, -1 назад. spanDays — как далеко искать. Возвращает
     {date, toRetro} ближайшей станции или null, если в пределах запаса её
     нет. toRetro описывает движение ПОСЛЕ станции по ходу времени,
     независимо от направления поиска: при поиске назад «после» — это точка,
     с которой мы пришли, то есть prev. */
  function findStation(body, from, dir, spanDays) {
    var step = SCAN_STEP * DAY * dir;
    var span = spanDays * DAY;
    var t0 = from.getTime();
    var prev = speedAt(body, t0);
    for (var k = 1; k * Math.abs(step) <= span; k++) {
      var t = t0 + k * step;
      var sp = speedAt(body, t);
      if ((prev < 0) !== (sp < 0)) {
        var lo = Math.min(t0 + (k - 1) * step, t), hi = Math.max(t0 + (k - 1) * step, t);
        var d = bisectSpeedFlip(body, lo, hi);
        /* После станции по времени планета движется так, как на более
           поздней из двух точек скана. */
        var after = (dir > 0) ? sp : prev;
        return { date: d, toRetro: after < 0 };
      }
      prev = sp;
    }
    return null;
  }

  /* Момент, когда тело проходит заданную долготу, на монотонном отрезке
     [aMs, bMs]. Работает по знаку разности с учётом перехода через 0°:
     сравниваем не сами долготы, а кратчайшее смещение от цели. */
  function signedGap(body, ms, targetLon) {
    var d = (lonAt(body, ms) - targetLon) % 360;
    if (d > 180) { d -= 360; }
    if (d < -180) { d += 360; }
    return d;
  }

  function crossingTime(body, aMs, bMs, targetLon) {
    var ga = signedGap(body, aMs, targetLon), gb = signedGap(body, bMs, targetLon);
    if (ga === 0) { return new Date(aMs); }
    if ((ga < 0) === (gb < 0)) { return null; }   /* на отрезке пересечения нет */
    for (var i = 0; i < 40; i++) {
      var m = (aMs + bMs) / 2;
      if ((signedGap(body, m, targetLon) < 0) === (ga < 0)) { aMs = m; } else { bMs = m; }
    }
    return new Date((aMs + bMs) / 2);
  }

  /* --- цикл целиком --------------------------------------------------------
     Возвращает описание ретроградного цикла, в котором находится дата, либо
     ближайшего будущего, если сейчас тело идёт прямо и вне тени.

     phase: 'pre' | 'retro' | 'post' | 'upcoming'
       pre      — предтень: планета уже в тени, но ещё идёт прямо
       retro    — собственно попятное движение
       post     — послетень: идёт прямо, но по уже пройденному участку
       upcoming — ближайший ретроград ещё впереди, тень не началась */
  var cache = {};
  function cacheKey(body, date) {
    return body + ':' + date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  }

  function cycleFor(body, date) {
    var key = cacheKey(body, date);
    if (cache[key]) { return cache[key]; }
    var out = computeCycle(body, date);
    cache[key] = out;
    return out;
  }

  /* Собирает цикл по паре станций и считает границы тени. */
  function buildCycle(body, stationRetro, stationDirect, date, retroNow) {
    var span = RETRO_SPAN[body] || 200;
    var lonRetro = lonAt(body, stationRetro.getTime());
    var lonDirect = lonAt(body, stationDirect.getTime());

    /* Предтень: до станции ретроград планета шла прямо и когда-то прошла
       долготу будущей станции директ. */
    var shadowStart = crossingTime(body, stationRetro.getTime() - span * DAY,
                                   stationRetro.getTime(), lonDirect);
    /* Послетень: после станции директ планета возвращается на долготу, где
       разворачивалась в ретроград. */
    var shadowEnd = crossingTime(body, stationDirect.getTime(),
                                 stationDirect.getTime() + span * DAY, lonRetro);

    var t = date.getTime();
    var phase;
    if (t >= stationRetro.getTime() && t <= stationDirect.getTime()) { phase = 'retro'; }
    else if (shadowStart && t >= shadowStart.getTime() && t < stationRetro.getTime()) { phase = 'pre'; }
    else if (shadowEnd && t > stationDirect.getTime() && t <= shadowEnd.getTime()) { phase = 'post'; }
    else { phase = 'upcoming'; }

    var arc = stationDirect.getTime() - stationRetro.getTime();
    var elapsed = Math.max(0, Math.min(arc, t - stationRetro.getTime()));

    return {
      body: body,
      retroNow: retroNow,
      phase: phase,
      stationRetro: stationRetro,
      stationDirect: stationDirect,
      shadowStart: shadowStart,
      shadowEnd: shadowEnd,
      signRetro: E.signOf(lonRetro),
      signDirect: E.signOf(lonDirect),
      retroDays: Math.round(arc / DAY),
      daysElapsed: Math.round(elapsed / DAY),
      daysRemaining: Math.max(0, Math.round((stationDirect.getTime() - t) / DAY)),
      daysUntilRetro: Math.max(0, Math.round((stationRetro.getTime() - t) / DAY)),
      progress: arc > 0 ? elapsed / arc : 0
    };
  }

  function computeCycle(body, date) {
    var retroNow = E.bodyAt(body, date).retro;
    var backSpan = RETRO_SPAN[body] || 200;

    if (retroNow) {
      /* Внутри ретрограда обе станции рядом: начало позади, конец впереди. */
      var back = findStation(body, date, -1, backSpan);
      var fwd = findStation(body, date, 1, backSpan);
      if (!back || !fwd) { return null; }
      return buildCycle(body, back.date, fwd.date, date, true);
    }

    /* Тело идёт прямо. Сначала проверяем, не тянется ли ещё послетень
       предыдущего цикла: станция директ тогда лежит позади, и показывать
       надо именно тот цикл, а не следующий — иначе фаза 'post' не
       наступала бы никогда. */
    var prev = findStation(body, date, -1, backSpan);
    if (prev && !prev.toRetro) {
      var prevRetro = findStation(body, new Date(prev.date.getTime() - DAY), -1, backSpan);
      if (prevRetro) {
        var prevCycle = buildCycle(body, prevRetro.date, prev.date, date, false);
        if (prevCycle.phase === 'post') { return prevCycle; }
      }
    }

    /* Иначе строим ближайший будущий цикл: он же покрывает предтень. */
    var next = findStation(body, date, 1, LOOKAHEAD[body] || 420);
    if (!next || !next.toRetro) { return null; }
    var end = findStation(body, new Date(next.date.getTime() + DAY), 1, backSpan);
    if (!end) { return null; }
    return buildCycle(body, next.date, end.date, date, false);
  }

  /* Персональная привязка переехала в engine.contactsFor(): тот же вопрос —
     дом и контакты с картой — задаёт и раздел Луны, и всё, что появится
     дальше, поэтому ответ должен быть один на продукт.

     Насколько цикл важен лично: сумма веса натальных контактов. Нужна, чтобы
     из нескольких одновременных ретроградов выбрать один главный, а не
     показывать их равнозначным списком. Без карты возвращаем 0 — тогда
     экран честно сортирует по скорости тела, а не делает вид, что знает
     личную значимость. */
  function relevance(personal) {
    if (!personal || !personal.aspects.length) { return 0; }
    return personal.aspects.slice(0, 3).reduce(function (s, a) {
      return s + Math.max(0, a.weight) * (a.applying ? 1.2 : 1);
    }, 0);
  }

  /* Дешёвая сводка по всем телам: только положение, ретроградность и личная
     значимость. Полный цикл тут СОЗНАТЕЛЬНО не считается — он стоит десятков
     вызовов эфемерид на тело, а экрану при первой отрисовке нужны лишь
     состояния для чипов и выбор главной планеты. Цикл считается отдельно и
     только для выбранной (cycleFor), поэтому открытие раздела не упирается
     в полсекунды расчётов. */
  function statusAt(date, natal) {
    return BODIES.map(function (b) {
      var p = E.bodyAt(b, date);
      var pers = E.contactsFor(natal, b, date);
      return {
        body: b, retro: p.retro, sign: p.sign, speed: p.speed,
        personal: pers, relevance: relevance(pers)
      };
    });
  }

  /* Ближайший будущий разворот в ретроград. Через cycleFor это делать нельзя:
     тело, идущее прямо внутри послетени, вернёт ПРОШЛЫЙ цикл (это и есть его
     текущая фаза), и его stationRetro лежит в прошлом — состояние «сейчас
     никто не ретрограден» тогда показывало бы дату годичной давности как
     ближайшую. Поэтому ищем станцию вперёд напрямую. */
  function nextTurnRetro(body, date) {
    var st = findStation(body, date, 1, LOOKAHEAD[body] || 420);
    return (st && st.toRetro) ? st.date : null;
  }

  function nextRetrograde(date) {
    var best = null;
    BODIES.forEach(function (b) {
      if (E.bodyAt(b, date).retro) { return; }
      var d = nextTurnRetro(b, date);
      if (!d) { return; }
      if (!best || d < best.stationRetro) { best = { body: b, stationRetro: d }; }
    });
    return best;
  }

  /* Ключевые даты цикла в хронологическом порядке. Сюда попадает только то,
     что действительно посчитано: если тень не нашлась (краевой случай у
     границы запаса поиска), строки просто не будет — выдумывать дату нельзя. */
  function keyDates(cycle) {
    var out = [];
    if (cycle.shadowStart) { out.push({ key: 'shadowStart', date: cycle.shadowStart }); }
    out.push({ key: 'stationRetro', date: cycle.stationRetro });
    out.push({ key: 'stationDirect', date: cycle.stationDirect });
    if (cycle.shadowEnd) { out.push({ key: 'shadowEnd', date: cycle.shadowEnd }); }
    return out.sort(function (a, b) { return a.date - b.date; });
  }

  return {
    BODIES: BODIES,
    cycleFor: cycleFor,
    relevance: relevance,
    statusAt: statusAt,
    nextTurnRetro: nextTurnRetro,
    nextRetrograde: nextRetrograde,
    keyDates: keyDates
  };
});
