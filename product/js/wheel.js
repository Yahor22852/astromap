/* wheel.js — колесо натальной карты в SVG.
   Знаки планет намеренно подписаны двухбуквенными кодами, а не астрологическими
   символами Unicode: символы ♈♉♊ есть далеко не во всех шрифтах, и на части
   машин вместо них будут пустые квадраты. Коды читаются везде.

   Интерактивность (вкладка Chart, см. app.js): каждая точка — <g class="w-pt"
   data-point="Sun" tabindex="0" role="button">, клик/Enter/Space по ней
   выбирает точку (chartSel в app.js), колесо перерисовывается с этим же
   selected — совпадающая точка получает модификатор --sel (крупнее, свечение),
   остальные --dim (гаснут), связанные аспекты подсвечиваются тем же приёмом.
   Сам wheel.js остаётся чистой функцией chart+size+selected -> строка SVG,
   ничего не знает о состоянии приложения. */
(function (g) {
  'use strict';

  var CODE = {
    Sun: 'Su', Moon: 'Mo', Mercury: 'Me', Venus: 'Ve', Mars: 'Ma',
    Jupiter: 'Ju', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
    Node: 'Nd', ASC: 'AC', MC: 'MC'
  };
  var TONE_COLOR = { soft: 'var(--soft)', hard: 'var(--hard)', neutral: 'var(--neutral)' };

  function pol(cx, cy, r, angDeg) {
    var a = angDeg * Math.PI / 180;
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  }

  function pointLabel(p) {
    var pname = (g.T && g.T.planets && g.T.planets[p.name]) || p.name;
    var sname = (g.T && g.T.signs) ? g.T.signs[p.sign.index] : '';
    return pname + ' ' + sname + ' ' + Math.round(p.sign.degree) + '°' + (p.retro ? ' R' : '');
  }

  /* Колесо разворачиваем так, чтобы Ascendent смотрел влево — как принято
     в астрологической традиции. Без времени рождения на левом краю 0° Barana.
     selected — имя точки (Sun/Moon/.../ASC/MC) или null/undefined —
     подсвечивает эту точку и её аспекты, гасит остальные. */
  function render(chart, size, selected) {
    size = size || 520;
    var cx = size / 2, cy = size / 2;
    var rOuter = size * 0.47, rSign = size * 0.40, rPlanet = size * 0.345,
        rInner = size * 0.30;
    var base = chart.asc ? chart.asc.lon : 0;
    var toAngle = function (lon) { return 180 + (lon - base); };

    var s = ['<svg viewBox="0 0 ' + size + ' ' + size + '" class="wheel" xmlns="http://www.w3.org/2000/svg">'];

    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rOuter + '" class="w-ring"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rSign + '" class="w-ring w-ring--thin"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rInner + '" class="w-ring w-ring--thin"/>');

    /* сектора знаков */
    for (var i = 0; i < 12; i++) {
      var a = toAngle(i * 30);
      var p1 = pol(cx, cy, rSign, a), p2 = pol(cx, cy, rOuter, a);
      s.push('<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) +
             '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '" class="w-spoke"/>');
      /* Подпись сектора — сокращённое название знака, а не номер: цифра
         1..12 читается как номер дома и путает. */
      var mid = pol(cx, cy, (rSign + rOuter) / 2, toAngle(i * 30 + 15));
      var label = (g.T && g.T.signs) ? g.T.signs[i].slice(0, 3) : String(i + 1);
      s.push('<text x="' + mid[0].toFixed(1) + '" y="' + (mid[1] + 4).toFixed(1) +
             '" class="w-sign">' + label + '</text>');
    }

    /* градусные штрихи по 5° */
    for (var d = 0; d < 360; d += 5) {
      var len = (d % 30 === 0) ? 0 : (d % 10 === 0 ? 6 : 3);
      if (!len) { continue; }
      var q1 = pol(cx, cy, rSign, toAngle(d)), q2 = pol(cx, cy, rSign - len, toAngle(d));
      s.push('<line x1="' + q1[0].toFixed(1) + '" y1="' + q1[1].toFixed(1) +
             '" x2="' + q2[0].toFixed(1) + '" y2="' + q2[1].toFixed(1) + '" class="w-tick"/>');
    }

    /* аспекты внутри — data-a/data-b позволяют app.js/CSS подсветить те,
       что касаются выбранной точки, отдельным проходом не нужно: класс
       решается тут же, зная selected. */
    var pts = chart.points.concat(chart.asc ? [chart.asc, chart.mc] : []);
    var asp = (g.Engine ? g.Engine.chartAspects(chart) : []);
    asp.forEach(function (x) {
      var pa = null, pb = null;
      pts.forEach(function (p) {
        if (p.name === x.a) { pa = p; }
        if (p.name === x.b) { pb = p; }
      });
      if (!pa || !pb) { return; }
      var A = pol(cx, cy, rInner, toAngle(pa.lon));
      var B = pol(cx, cy, rInner, toAngle(pb.lon));
      var touches = selected && (x.a === selected || x.b === selected);
      var cls = 'w-asp' + (touches ? ' w-asp--sel' : (selected ? ' w-asp--dim' : ''));
      s.push('<line x1="' + A[0].toFixed(1) + '" y1="' + A[1].toFixed(1) +
             '" x2="' + B[0].toFixed(1) + '" y2="' + B[1].toFixed(1) +
             '" class="' + cls + '" data-a="' + x.a + '" data-b="' + x.b + '" stroke="' +
             (TONE_COLOR[x.data.tone] || 'var(--neutral)') +
             '" opacity="' + Math.max(0.18, 0.75 - x.data.orb / 14).toFixed(2) + '"/>');
    });

    /* планеты; при скучивании разносим по радиусу. Каждая точка — кликабельная
       группа <g data-point="Name">, а не голые circle/text, чтобы у неё была
       одна цель для клика/фокуса и общий модификатор --sel/--dim. */
    var placed = [];
    pts.forEach(function (p) {
      var ang = toAngle(p.lon);
      var r = rPlanet;
      placed.forEach(function (q) {
        var diff = Math.abs(((ang - q.ang + 540) % 360) - 180);
        if (180 - diff < 13) { r = Math.min(r, q.r - 25); }
      });
      placed.push({ ang: ang, r: r });
      var c = pol(cx, cy, r, ang);
      var edge = pol(cx, cy, rSign, ang);
      var isSel = selected && p.name === selected;
      var cls = 'w-pt' + (isSel ? ' w-pt--sel' : (selected ? ' w-pt--dim' : ''));
      s.push('<g class="' + cls + '" data-point="' + p.name + '" tabindex="0" role="button" aria-label="' +
             pointLabel(p) + '">');
      s.push('<line x1="' + c[0].toFixed(1) + '" y1="' + c[1].toFixed(1) +
             '" x2="' + edge[0].toFixed(1) + '" y2="' + edge[1].toFixed(1) + '" class="w-stem"/>');
      s.push('<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) +
             '" r="13" class="w-dot' + (p.retro ? ' w-dot--r' : '') + '"/>');
      s.push('<text x="' + c[0].toFixed(1) + '" y="' + (c[1] + 4).toFixed(1) +
             '" class="w-code">' + (CODE[p.name] || p.name.slice(0, 2)) + '</text>');
      s.push('</g>');
    });

    /* оси ASC-DC и MC-IC */
    if (chart.asc) {
      [[chart.asc.lon, 'AC'], [chart.mc.lon, 'MC']].forEach(function (ax) {
        var a1 = pol(cx, cy, rInner, toAngle(ax[0]));
        var a2 = pol(cx, cy, rOuter, toAngle(ax[0]));
        s.push('<line x1="' + a1[0].toFixed(1) + '" y1="' + a1[1].toFixed(1) +
               '" x2="' + a2[0].toFixed(1) + '" y2="' + a2[1].toFixed(1) + '" class="w-axis"/>');
      });
    }

    s.push('</svg>');
    return s.join('');
  }

  g.Wheel = { render: render, CODE: CODE };
})(typeof window !== 'undefined' ? window : globalThis);
