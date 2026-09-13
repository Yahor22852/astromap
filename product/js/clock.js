/* clock.js — общий контекст времени продукта.

   Астрология вся про время, но до этого модуля дату можно было поменять
   ровно в одном месте — в календаре Луны, и эта дата никуда дальше не
   уходила. Здесь она одна на весь продукт: перешёл из Ретроградов на 4
   октября, открыл Луну — Луна показывает 4 октября, а не «сегодня».

   Модуль намеренно крошечный и без подписок. Подписки были бы уместны,
   если бы несколько разделов жили на экране одновременно, но раздел всегда
   ровно один: он читает дату при отрисовке и перерисовывает себя сам.
   Заводить ради этого механизм наблюдателей — лишняя конструкция, которую
   потом пришлось бы поддерживать.

   Время суток сохраняется: шаг на день двигает дату, не обнуляя часы, а
   прыжок на точную дату станции или фазы сохраняет её момент целиком —
   иначе «Луна входит в Скорпион в 18:42» превратилось бы в полночь. */
(function (g) {
  'use strict';

  var DAY = 86400000;
  var current = new Date();

  function get() { return current; }

  function set(d) {
    if (d instanceof Date && !isNaN(d.getTime())) { current = d; }
    return current;
  }

  function step(days) {
    current = new Date(current.getTime() + days * DAY);
    return current;
  }

  function today() { current = new Date(); return current; }

  function isToday() {
    var n = new Date();
    return current.getFullYear() === n.getFullYear() &&
           current.getMonth() === n.getMonth() &&
           current.getDate() === n.getDate();
  }

  /* Формат для адресной строки. Локальная дата, а не toISOString(): тот
     переводит в UTC и для вечера по восточную сторону от Гринвича вернул бы
     уже следующий день — ссылка открывалась бы не на тот день, который
     видел человек. */
  function toKey(d) {
    d = d || current;
    var m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
  }

  var KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  function isKey(s) { return KEY_RE.test(String(s)); }

  /* Разбирает YYYY-MM-DD в полдень локального времени. Полдень, а не
     полночь: у дат из адресной строки нет времени суток, а полночь стоит
     на самой границе — любой сдвиг на часы уводит расчёт на соседние
     сутки. С полудня запас в двенадцать часов в обе стороны. */
  function fromKey(s) {
    var m = KEY_RE.exec(String(s));
    if (!m) { return null; }
    var d = new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  g.Clock = {
    get: get, set: set, step: step, today: today, isToday: isToday,
    toKey: toKey, fromKey: fromKey, isKey: isKey
  };
})(typeof window !== 'undefined' ? window : globalThis);
