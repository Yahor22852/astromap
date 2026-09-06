/* numerology.js — нумерология. Чистая арифметика, никаких эфемерид.
   Система пифагорейская: буквы A-I = 1-9, J-R = 1-9, S-Z = 1-8.

   Правила, которые легко перепутать и которые здесь зафиксированы:
   - мастер-числа 11, 22, 33 НЕ сворачиваются до однозначного;
   - кармические долги 13, 14, 16, 19 фиксируются на промежуточной сумме,
     до финального сворачивания;
   - число жизненного пути считается сворачиванием дня, месяца и года
     по отдельности, затем их суммы. Это даёт тот же результат, что
     сворачивание всех цифр подряд, кроме случаев с мастер-числами,
     где методы расходятся — здесь выбран раздельный.
*/
(function (g) {
  'use strict';

  var LETTER = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
  };
  var VOWELS = 'AEIOU';
  /* Польские и другие диакритики приводим к базовой латинице. */
  var FOLD = {
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O',
    'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z', 'Ä': 'A', 'Ö': 'O', 'Ü': 'U',
    'É': 'E', 'È': 'E', 'Á': 'A', 'Í': 'I', 'Ú': 'U', 'Ñ': 'N', 'Ç': 'C'
  };
  var MASTERS = [11, 22, 33];
  var KARMIC = [13, 14, 16, 19];

  function fold(s) {
    return (s || '').toUpperCase().split('').map(function (ch) {
      return FOLD[ch] || ch;
    }).join('');
  }

  function digits(n) {
    return String(n).split('').reduce(function (a, d) { return a + (+d || 0); }, 0);
  }

  /* Сворачивание с остановкой на мастер-числах. */
  function reduce(n, keepMaster) {
    var steps = [n];
    while (n > 9) {
      if (keepMaster !== false && MASTERS.indexOf(n) >= 0) { break; }
      n = digits(n);
      steps.push(n);
    }
    return { value: n, steps: steps };
  }

  function karmicIn(steps) {
    return steps.filter(function (s) { return KARMIC.indexOf(s) >= 0; });
  }

  /* --- дата рождения ------------------------------------------------------ */
  function lifePath(y, m, d) {
    var rd = reduce(d), rm = reduce(m), ry = reduce(digits(y));
    var sum = rd.value + rm.value + ry.value;
    var r = reduce(sum);
    return {
      value: r.value,
      parts: { day: rd.value, month: rm.value, year: ry.value },
      sum: sum,
      karmic: karmicIn([d, m].concat(rd.steps, rm.steps, ry.steps, r.steps)),
      master: MASTERS.indexOf(r.value) >= 0
    };
  }

  function birthday(d) {
    var r = reduce(d);
    return { value: r.value, raw: d, master: MASTERS.indexOf(r.value) >= 0 };
  }

  /* --- имя ----------------------------------------------------------------- */
  function nameSum(name, filter) {
    var s = fold(name).replace(/[^A-Z]/g, '');
    var total = 0, used = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      var isVowel = VOWELS.indexOf(ch) >= 0;
      if (filter === 'vowels' && !isVowel) { continue; }
      if (filter === 'consonants' && isVowel) { continue; }
      if (LETTER[ch]) { total += LETTER[ch]; used++; }
    }
    return { total: total, letters: used };
  }

  function expression(name) {              /* число судьбы / выражения */
    var s = nameSum(name);
    if (!s.letters) { return null; }
    var r = reduce(s.total);
    return { value: r.value, sum: s.total, karmic: karmicIn(r.steps),
             master: MASTERS.indexOf(r.value) >= 0 };
  }
  function soulUrge(name) {                /* число души: гласные */
    var s = nameSum(name, 'vowels');
    if (!s.letters) { return null; }
    var r = reduce(s.total);
    return { value: r.value, sum: s.total, karmic: karmicIn(r.steps) };
  }
  function personality(name) {             /* число личности: согласные */
    var s = nameSum(name, 'consonants');
    if (!s.letters) { return null; }
    var r = reduce(s.total);
    return { value: r.value, sum: s.total, karmic: karmicIn(r.steps) };
  }
  function maturity(lp, ex) {
    if (!ex) { return null; }
    var r = reduce(lp.value + ex.value);
    return { value: r.value, sum: lp.value + ex.value };
  }

  /* --- личные циклы -------------------------------------------------------
     Личный год считается от дня и месяца рождения плюс текущий год.
     Он меняется в день рождения, а не 1 января — это учтено. */
  function personalYear(y, m, d, now) {
    var ref = now.getUTCFullYear();
    var bdayPassed = (now.getUTCMonth() + 1 > m) ||
                     (now.getUTCMonth() + 1 === m && now.getUTCDate() >= d);
    var year = bdayPassed ? ref : ref - 1;
    var r = reduce(reduce(d).value + reduce(m).value + reduce(digits(year)).value);
    return { value: r.value, cycleYear: year };
  }
  function personalMonth(py, now) {
    var r = reduce(py.value + reduce(now.getUTCMonth() + 1).value);
    return { value: r.value };
  }
  function personalDay(pm, now) {
    var r = reduce(pm.value + reduce(now.getUTCDate()).value);
    return { value: r.value };
  }

  function full(profile, now) {
    now = now || new Date();
    var y = profile.y, m = profile.m, d = profile.d;
    var lp = lifePath(y, m, d);
    var ex = expression(profile.name);
    var py = personalYear(y, m, d, now);
    var pm = personalMonth(py, now);
    return {
      lifePath: lp,
      birthday: birthday(d),
      expression: ex,
      soul: soulUrge(profile.name),
      personality: personality(profile.name),
      maturity: maturity(lp, ex),
      personalYear: py,
      personalMonth: pm,
      personalDay: personalDay(pm, now)
    };
  }

  g.Numerology = {
    lifePath: lifePath, birthday: birthday, expression: expression,
    soulUrge: soulUrge, personality: personality, maturity: maturity,
    personalYear: personalYear, personalMonth: personalMonth,
    personalDay: personalDay, reduce: reduce, full: full,
    MASTERS: MASTERS, KARMIC: KARMIC
  };
})(typeof window !== 'undefined' ? window : globalThis);
