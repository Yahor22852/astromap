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
  /* opts.transits — массив точек неба на выбранную дату ({name, lon, sign,
     retro}); если он есть, колесо становится двойным: натал внутри, транзиты
     снаружи полосы знаков. opts.txAspects — контакты транзитов с наталом
     (результат Engine.activeTransits); линии рисуются не все подряд, а только
     для выбранной точки, иначе внутренний круг превращается в клубок.

     selected для транзитной точки приходит с префиксом 't:' — так одно поле
     различает «моя Венера» и «Венера на небе сегодня», не заводя второго
     состояния. */
  function render(chart, size, selected, opts) {
    size = size || 520;
    opts = opts || {};
    var tx = opts.transits && opts.transits.length ? opts.transits : null;
    var cx = size / 2, cy = size / 2;

    /* Без транзитов геометрия ровно прежняя — одиночное колесо не должно
       меняться из-за того, что рядом появился режим, которым не пользуются.
       С транзитами полоса знаков уезжает внутрь, освобождая внешнее кольцо. */
    var rOuter   = size * (tx ? 0.485 : 0.47);
    var rTx      = size * 0.448;
    var rSignOut = tx ? size * 0.412 : rOuter;
    var rSign    = size * (tx ? 0.352 : 0.40);
    var rPlanet  = size * (tx ? 0.300 : 0.345);
    var rInner   = size * (tx ? 0.245 : 0.30);

    var base = chart.asc ? chart.asc.lon : 0;
    var toAngle = function (lon) { return 180 + (lon - base); };
    var selName = selected && selected.indexOf('t:') === 0 ? selected.slice(2) : selected;
    var selIsTx = !!(selected && selected.indexOf('t:') === 0);

    /* Колесо — картинка со встроенными кнопками, поэтому role="img" ему не
       годится: он скрыл бы точки от вспомогательных технологий. Даём группе
       имя через <title>, а полный текстовый эквивалент карты — таблица
       позиций под колесом; она же остаётся основным способом выбрать точку
       пальцем, потому что при сжатии SVG до ширины телефона сами кружки
       становятся мельче рекомендованного размера цели. */
    var s = ['<svg viewBox="0 0 ' + size + ' ' + size + '" class="wheel" role="group" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<title>' + ((g.T && g.T.ui && g.T.ui.chartTitle) || 'Chart') + '</title>');

    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rOuter + '" class="w-ring"/>');
    if (tx) {
      s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rSignOut + '" class="w-ring w-ring--thin"/>');
    }
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rSign + '" class="w-ring w-ring--thin"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rInner + '" class="w-ring w-ring--thin"/>');

    /* сектора знаков */
    for (var i = 0; i < 12; i++) {
      var a = toAngle(i * 30);
      var p1 = pol(cx, cy, rSign, a), p2 = pol(cx, cy, rSignOut, a);
      s.push('<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) +
             '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '" class="w-spoke"/>');
      /* Подпись сектора — сокращённое название знака, а не номер: цифра
         1..12 читается как номер дома и путает. */
      var mid = pol(cx, cy, (rSign + rSignOut) / 2, toAngle(i * 30 + 15));
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
      var touches = !selIsTx && selName && (x.a === selName || x.b === selName);
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
        /* diff здесь — угловое расстояние между точками (0..180). Условие
           было записано как «180 - diff < 13», то есть срабатывало на
           точках, стоящих почти НАПРОТИВ друг друга — они и так не
           пересекаются, — и молчало на соседних. Из-за этого планеты в
           пределах градуса рисовались одна поверх другой: видна была
           только верхняя, и кликнуть можно было тоже только по ней.
           Нижняя граница радиуса не даёт скученной группе уехать внутрь
           круга аспектов. */
        var diff = Math.abs(((ang - q.ang + 540) % 360) - 180);
        if (diff < 13) { r = Math.max(rInner * 0.62, Math.min(r, q.r - 26)); }
      });
      placed.push({ ang: ang, r: r });
      var c = pol(cx, cy, r, ang);
      var edge = pol(cx, cy, rSign, ang);
      var isSel = !selIsTx && selName && p.name === selName;
      var cls = 'w-pt' + (isSel ? ' w-pt--sel' : (selected ? ' w-pt--dim' : ''));
      s.push('<g class="' + cls + '" data-point="' + p.name + '" tabindex="0" role="button" aria-label="' +
             pointLabel(p) + '">');
      s.push('<line x1="' + c[0].toFixed(1) + '" y1="' + c[1].toFixed(1) +
             '" x2="' + edge[0].toFixed(1) + '" y2="' + edge[1].toFixed(1) + '" class="w-stem"/>');
      /* Прозрачный круг больше видимого: попасть по планете пальцем легче,
         а рисунок не меняется. Радиус выбран так, чтобы области соседних
         точек не накладывались — расталкивание держит их дальше 26 единиц. */
      s.push('<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) +
             '" r="20" class="w-hit"/>');
      s.push('<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) +
             '" r="13" class="w-dot' + (p.retro ? ' w-dot--r' : '') + '"/>');
      s.push('<text x="' + c[0].toFixed(1) + '" y="' + (c[1] + 4).toFixed(1) +
             '" class="w-code">' + (CODE[p.name] || p.name.slice(0, 2)) + '</text>');
      s.push('</g>');
    });

    /* --- транзитное кольцо ------------------------------------------------
       Точки неба на выбранную дату, снаружи полосы знаков. Рисуются мельче
       натальных и с отдельным классом: это не «ещё десять планет в вашей
       карте», а другой слой, и спутать их нельзя. Расталкивание своё — с
       натальными точками они не пересекаются, а между собой скучиваются
       так же (Меркурий с Солнцем расходятся максимум на 28°). */
    if (tx) {
      var txPlaced = [];
      tx.forEach(function (p) {
        var tAng = toAngle(p.lon);
        var tr = rTx;
        txPlaced.forEach(function (q) {
          var d = Math.abs(((tAng - q.ang + 540) % 360) - 180);
          if (d < 11) { tr = Math.min(tr, q.r - 22); }
        });
        txPlaced.push({ ang: tAng, r: tr });
        var tc = pol(cx, cy, tr, tAng);
        var tEdge = pol(cx, cy, rSignOut, tAng);
        var tSel = selIsTx && p.name === selName;
        var tCls = 'w-tx' + (tSel ? ' w-tx--sel' : (selected ? ' w-tx--dim' : ''));
        /* Подпись обязана называть слой: «Венера в Овне» на внешнем кольце и
           на внутреннем — два разных факта, и без слова «транзит» незрячий
           пользователь их не различит. */
        var txWord = (g.T && g.T.ui && g.T.ui.transitCol) ? g.T.ui.transitCol + ': ' : '';
        s.push('<g class="' + tCls + '" data-txpoint="' + p.name + '" tabindex="0" role="button" aria-label="' +
               txWord + pointLabel(p) + '">');
        s.push('<line x1="' + tc[0].toFixed(1) + '" y1="' + tc[1].toFixed(1) +
               '" x2="' + tEdge[0].toFixed(1) + '" y2="' + tEdge[1].toFixed(1) + '" class="w-stem"/>');
        s.push('<circle cx="' + tc[0].toFixed(1) + '" cy="' + tc[1].toFixed(1) +
               '" r="18" class="w-hit"/>');
        s.push('<circle cx="' + tc[0].toFixed(1) + '" cy="' + tc[1].toFixed(1) +
               '" r="11" class="w-txdot' + (p.retro ? ' w-txdot--r' : '') + '"/>');
        s.push('<text x="' + tc[0].toFixed(1) + '" y="' + (tc[1] + 3.5).toFixed(1) +
               '" class="w-txcode">' + (CODE[p.name] || p.name.slice(0, 2)) + '</text>');
        s.push('</g>');
      });

      /* Контакты транзитов с наталом — только для выбранной точки. Все сразу
         (их бывает за двадцать) превращают внутренний круг в клубок, из
         которого не выудить ни одной линии. */
      if (selName && opts.txAspects) {
        opts.txAspects.forEach(function (a) {
          if (selIsTx ? a.transit !== selName : a.natal !== selName) { return; }
          var tp = null, np = null;
          tx.forEach(function (p) { if (p.name === a.transit) { tp = p; } });
          pts.forEach(function (p) { if (p.name === a.natal) { np = p; } });
          if (!tp || !np) { return; }
          var P = pol(cx, cy, rInner, toAngle(tp.lon));
          var Q = pol(cx, cy, rInner, toAngle(np.lon));
          s.push('<line x1="' + P[0].toFixed(1) + '" y1="' + P[1].toFixed(1) +
                 '" x2="' + Q[0].toFixed(1) + '" y2="' + Q[1].toFixed(1) +
                 '" class="w-txasp" stroke="' + (TONE_COLOR[a.tone] || 'var(--neutral)') +
                 '" opacity="' + Math.max(0.3, 0.9 - a.orb / 12).toFixed(2) + '"/>');
        });
      }
    }

    /* оси ASC-DC и MC-IC */
    if (chart.asc) {
      [[chart.asc.lon, 'AC'], [chart.mc.lon, 'MC']].forEach(function (ax) {
        /* Оси доводим до внешнего края полосы знаков, а не до края колеса:
           в двойном режиме дальше идёт транзитное кольцо, и ось, прочерченная
           сквозь него, перечёркивала бы транзитные точки. */
        var a1 = pol(cx, cy, rInner, toAngle(ax[0]));
        var a2 = pol(cx, cy, rSignOut, toAngle(ax[0]));
        s.push('<line x1="' + a1[0].toFixed(1) + '" y1="' + a1[1].toFixed(1) +
               '" x2="' + a2[0].toFixed(1) + '" y2="' + a2[1].toFixed(1) + '" class="w-axis"/>');
      });
    }

    s.push('</svg>');
    return s.join('');
  }

  g.Wheel = { render: render, CODE: CODE };
})(typeof window !== 'undefined' ? window : globalThis);
