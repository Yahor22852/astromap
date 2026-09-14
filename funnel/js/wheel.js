/* wheel.js — карта воронки, которая собирается по ходу флоу.

   ЗАЧЕМ ОНА. Воронка и раньше считала настоящие позиции, но показывала их
   строчками текста: «Твоё Солнце — Телец 23,0°». Строчка сообщает факт и
   ничего не обещает. Круг с точками обещает: видно, что объектов будет
   больше, видно пустые места, и понятно, что человек собирает предмет, а не
   отвечает на вопросы.

   ПОКАЗЫВАЕМ ТОЛЬКО ПОСЧИТАННОЕ. Точка появляется на круге ровно тогда,
   когда для неё есть настоящая величина: Солнце — после даты, Луна и
   Асцендент — после времени и места. Ненайденное место не даёт координат,
   значит нет и Асцендента: его слот остаётся пустым с подписью, а не
   заполняется правдоподобной выдумкой.

   ПУСТЫЕ СЛОТЫ — ЧАСТЬ СМЫСЛА. Они и создают ожидание: на первом экране
   виден один объект из трёх, и дальше понятно, что будет дальше.

   Модуль ничего не знает о состоянии воронки и о языке: на вход идут
   посчитанные точки и уже переведённые подписи, на выходе — строка SVG.
*/
(function (g) {
  'use strict';

  var SIZE = 200;
  var CX = SIZE / 2, CY = SIZE / 2;
  var R_OUT = 92;          /* внешняя окружность */
  var R_SIGN = 76;         /* внутренняя граница полосы знаков */
  var R_PT = 58;           /* радиус, на котором стоят точки */
  var DEG = Math.PI / 180;

  function pol(r, ang) {
    var a = ang * DEG;
    return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  /* points: [{ key, lon, label, short }] — только те, что уже посчитаны.
     slots:  [{ key, short, pending }] — все три в постоянном порядке.
     signs:  массив из 12 названий знаков на языке интерфейса.
     Колесо разворачивается так, чтобы Асцендент смотрел влево — как принято
     в традиции. Пока Асцендента нет, влево смотрит 0° Овна. */
  function render(opts) {
    opts = opts || {};
    var points = opts.points || [];
    var signs = opts.signs || [];
    var base = 0;
    points.forEach(function (p) { if (p.key === 'asc') { base = p.lon; } });
    var toAngle = function (lon) { return 180 + (lon - base); };

    var s = ['<svg class="fw" viewBox="0 0 ' + SIZE + ' ' + SIZE +
             '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
             esc(opts.aria || '') + '">'];

    s.push('<circle class="fw__ring" cx="' + CX + '" cy="' + CY + '" r="' + R_OUT + '"/>');
    s.push('<circle class="fw__ring fw__ring--thin" cx="' + CX + '" cy="' + CY + '" r="' + R_SIGN + '"/>');

    /* Двенадцать секторов знаков: они есть всегда, даже когда точек ещё нет.
       Пустой размеченный круг читается как «здесь будет карта», а голый —
       как украшение. */
    for (var i = 0; i < 12; i++) {
      var a = toAngle(i * 30);
      var p1 = pol(R_SIGN, a), p2 = pol(R_OUT, a);
      s.push('<line class="fw__spoke" x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) +
             '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '"/>');
      var mid = pol((R_SIGN + R_OUT) / 2, toAngle(i * 30 + 15));
      var name = signs[i] ? signs[i].slice(0, 3) : '';
      s.push('<text class="fw__sign" x="' + mid[0].toFixed(1) + '" y="' + (mid[1] + 3).toFixed(1) +
             '">' + esc(name) + '</text>');
    }

    /* Ось Асцендента: появляется только вместе с ним и объясняет поворот
       круга — иначе непонятно, почему карта стоит именно так. */
    points.forEach(function (p) {
      if (p.key !== 'asc') { return; }
      var a1 = pol(0, toAngle(p.lon)), a2 = pol(R_SIGN, toAngle(p.lon));
      s.push('<line class="fw__axis" x1="' + a1[0].toFixed(1) + '" y1="' + a1[1].toFixed(1) +
             '" x2="' + a2[0].toFixed(1) + '" y2="' + a2[1].toFixed(1) + '"/>');
    });

    /* Точки. Скучивание разводим по радиусу: Солнце и Луна в один день
       могут стоять в градусе друг от друга, и без этого видна была бы одна. */
    var placed = [];
    points.forEach(function (p) {
      var ang = toAngle(p.lon), r = R_PT;
      placed.forEach(function (q) {
        var diff = Math.abs(((ang - q.ang + 540) % 360) - 180);
        if (diff < 16) { r = Math.min(r, q.r - 19); }
      });
      placed.push({ ang: ang, r: r });
      var c = pol(r, ang), edge = pol(R_SIGN, ang);
      s.push('<g class="fw__pt fw__pt--' + esc(p.key) + '">');
      s.push('<line class="fw__stem" x1="' + c[0].toFixed(1) + '" y1="' + c[1].toFixed(1) +
             '" x2="' + edge[0].toFixed(1) + '" y2="' + edge[1].toFixed(1) + '"/>');
      s.push('<circle class="fw__dot" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="13"/>');
      s.push('<text class="fw__code" x="' + c[0].toFixed(1) + '" y="' + (c[1] + 4).toFixed(1) +
             '">' + esc(p.short) + '</text>');
      s.push('</g>');
    });

    s.push('</svg>');
    return s.join('');
  }

  /* Легенда под кругом: три слота в постоянном порядке. Заполненный слот
     показывает знак и градус, пустой — что для него нужно. Это и есть
     «чего ещё не хватает», сказанное без давления. */
  function legend(slots) {
    return '<div class="fwleg">' + (slots || []).map(function (sl) {
      return '<div class="fwleg__i' + (sl.pending ? ' fwleg__i--wait' : '') + '">' +
        '<span class="fwleg__k">' + esc(sl.label) + '</span>' +
        '<span class="fwleg__v">' + esc(sl.value) + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  g.FunnelWheel = { render: render, legend: legend };
})(typeof window !== 'undefined' ? window : globalThis);
