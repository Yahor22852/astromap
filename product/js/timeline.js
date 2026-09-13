/* timeline.js — что важного произойдёт в ближайшие дни.

   Собирает в одну ленту события четырёх видов, каждое из которых уже умеет
   считать какой-то модуль: фазы Луны и смены её знака (moon.js), развороты
   планет (retro.js), точные аспекты к натальным точкам (engine.js). Здесь
   только сведение и отбор.

   Модуль возвращает ДАННЫЕ, а не готовый текст: названия фаз, знаков и
   аспектов живут в переводах, и собирать из них строки должен экран. Иначе
   десять языков пришлось бы тащить сюда.

   ОТБОР ВАЖНЕЕ ПОЛНОТЫ. За девяносто дней Луна сменит знак тридцать шесть
   раз, а точных аспектов наберётся под сотню. Лента из сотни строк — это
   не таймлайн, а лог. Поэтому смены знака Луны попадают только в недельный
   вид (там их три и они действительно ориентир), а аспекты отбираются по
   весу пары точек.

   СТОИМОСТЬ. Диапазон задаёт и набор тел, и шаг поиска: на неделе есть
   смысл ловить быстрые планеты с шагом в шесть часов, на трёх месяцах —
   только медленные с суточным шагом. Иначе экран, на котором лента живёт,
   начинает думать секунду. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'), require('./retro.js'));
  } else {
    root.Timeline = factory(root.Engine, root.Retro);
  }
})(typeof self !== 'undefined' ? self : this, function (E, R) {
  'use strict';

  var DAY = 86400000;

  /* Набор тел и шаг поиска точных аспектов по длине диапазона. Луна не
     участвует нигде: её аспекты меняются по нескольку раз в сутки и
     затопили бы ленту, а её собственные события — фазы и смены знака —
     приходят отдельными видами. */
  var PLAN = {
    7:  { bodies: ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'], stepHours: 6,  moonSigns: true,  maxAspects: 10 },
    30: { bodies: ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'], stepHours: 12, moonSigns: false, maxAspects: 12 },
    90: { bodies: ['Sun', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'], stepHours: 24, moonSigns: false, maxAspects: 14 }
  };

  var cache = {};

  function events(natal, Moon, from, days) {
    var plan = PLAN[days] || PLAN[7];
    var key = days + ':' + from.getFullYear() + '-' + from.getMonth() + '-' + from.getDate();
    if (cache[key]) { return cache[key]; }

    var to = new Date(from.getTime() + days * DAY);
    var out = [];

    /* Главные фазы. Берём с запасом по количеству и режем по дате: сколько
       их поместится в диапазон, заранее неизвестно. */
    var quarters = Moon.quartersFrom(from, Math.ceil(days / 7) + 2);
    quarters.forEach(function (q) {
      if (q.date > to) { return; }
      out.push({ kind: 'moonPhase', at: q.date, phaseIndex: q.phaseIndex, sign: q.sign });
    });

    if (plan.moonSigns) {
      var cur = from;
      for (var i = 0; i < 24; i++) {
        var sc = Moon.nextSignChange(cur);
        if (!sc || sc.date > to) { break; }
        out.push({ kind: 'moonSign', at: sc.date, sign: sc.to });
        cur = new Date(sc.date.getTime() + 3600000);   /* час вперёд, чтобы не найти ту же границу снова */
      }
    }

    R.stationsIn(from, to).forEach(function (s) {
      out.push({ kind: 'station', at: s.date, body: s.body, toRetro: s.toRetro });
    });

    if (natal) {
      var ev = E.transitEvents(natal, from, to, { bodies: plan.bodies, stepHours: plan.stepHours });
      ev.sort(function (a, b) { return b.weight - a.weight; });
      ev.slice(0, plan.maxAspects).forEach(function (e) {
        out.push({
          kind: 'aspect', at: e.exactAt, body: e.transit, natal: e.natal,
          aspect: e.aspect, tone: e.tone, weight: e.weight
        });
      });
    }

    out.sort(function (a, b) { return a.at - b.at; });
    cache[key] = out;
    return out;
  }

  /* Устойчивый идентификатор события — по нему работает «сохранённое».
     Строится из вида и содержания, а не из даты целиком: момент фазы,
     посчитанный сегодня и через месяц, может разойтись на секунды, и
     сохранённое событие переставало бы узнаваться. Дня достаточно. */
  function idOf(e) {
    var d = e.at;
    var day = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (e.kind === 'moonPhase') { return 'mp:' + day + ':' + e.phaseIndex; }
    if (e.kind === 'moonSign') { return 'ms:' + day + ':' + e.sign.key; }
    if (e.kind === 'station') { return 'st:' + day + ':' + e.body; }
    return 'as:' + day + ':' + e.body + ':' + e.natal + ':' + e.aspect;
  }

  return { events: events, idOf: idOf, RANGES: [7, 30, 90] };
});
