/* demo.js — только для страницы проверки. В продукте этот файл не участвует. */
(function () {
  'use strict';

  var E = window.Engine;
  var CITIES = window.CITIES.pl;
  var TZ = window.TZ;
  var el = function (id) { return document.getElementById(id); };

  var NAMES = {
    Sun: 'Słońce', Moon: 'Księżyc', Mercury: 'Merkury', Venus: 'Wenus',
    Mars: 'Mars', Jupiter: 'Jowisz', Saturn: 'Saturn', Uranus: 'Uran',
    Neptune: 'Neptun', Pluto: 'Pluton', Node: 'Węzeł', ASC: 'ASC', MC: 'MC'
  };
  var SIGN_PL = {
    aries: 'Baran', taurus: 'Byk', gemini: 'Bliźnięta', cancer: 'Rak',
    leo: 'Lew', virgo: 'Panna', libra: 'Waga', scorpio: 'Skorpion',
    sagittarius: 'Strzelec', capricorn: 'Koziorożec', aquarius: 'Wodnik',
    pisces: 'Ryby'
  };
  var ASP_PL = {
    conjunction: 'koniunkcja', sextile: 'seksytl', square: 'kwadratura',
    trine: 'trygon', opposition: 'opozycja'
  };

  [el('c1'), el('c2')].forEach(function (sel) {
    CITIES.forEach(function (c, i) {
      var o = document.createElement('option');
      o.value = i; o.textContent = c.n;
      sel.appendChild(o);
    });
  });
  el('c2').value = 1;

  function deg(x) { return x.toFixed(2).replace('.', ',') + '\u00B0'; }

  function readForm(dId, tId, cId) {
    var dv = el(dId).value, tv = el(tId).value;
    if (!dv) { return null; }
    var p = dv.split('-').map(Number);
    var t = (tv || '12:00').split(':').map(Number);
    var city = CITIES[+el(cId).value];
    return {
      utc: TZ.toUTC(p[0], p[1], p[2], t[0], t[1], city),
      city: city,
      timeKnown: !!tv
    };
  }

  function table(head, rows) {
    var h = '<table><tr>' + head.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr>';
    h += rows.map(function (r) {
      return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
    }).join('');
    return h + '</table>';
  }

  function toneCls(t) { return '<span class="' + t + '">' + t + '</span>'; }

  function run() {
    var a = readForm('d1', 't1', 'c1');
    if (!a) { return; }
    var b = readForm('d2', 't2', 'c2');
    var out = [];

    var chA = E.chart(a.utc, a.city.lat, a.city.lon, { timeKnown: a.timeKnown });

    out.push('<h2>Karta &mdash; ' + a.utc.toISOString().slice(0, 16).replace('T', ' ') + ' UTC, ' + a.city.n + '</h2>');
    out.push(table(['Punkt', 'Znak', 'Stopień', 'Dom', 'Ruch', 'Retro'],
      chA.points.map(function (p) {
        return [NAMES[p.name] || p.name, SIGN_PL[p.sign.key], deg(p.sign.degree),
                p.house || '\u2014',
                p.speed.toFixed(3) + '\u00B0/d',
                p.retro ? '<span class="hard">R</span>' : ''];
      }).concat(chA.asc ? [
        ['ASC', SIGN_PL[chA.asc.sign.key], deg(chA.asc.sign.degree), '1', '\u2014', ''],
        ['MC', SIGN_PL[chA.mc.sign.key], deg(chA.mc.sign.degree), '10', '\u2014', '']
      ] : [])));

    out.push('<h2>Aspekty w karcie</h2>');
    out.push(table(['A', 'Aspekt', 'B', 'Orbis', 'Ton'],
      E.chartAspects(chA).slice(0, 12).map(function (x) {
        return [NAMES[x.a] || x.a, ASP_PL[x.data.aspect], NAMES[x.b] || x.b,
                deg(x.data.orb), toneCls(x.data.tone)];
      })));

    var now = new Date();
    out.push('<h2>Tranzyty aktywne dzisiaj</h2>');
    out.push(table(['Tranzyt', 'Aspekt', 'Do punktu', 'Orbis', 'Ton', 'Faza'],
      E.activeTransits(chA, now).slice(0, 10).map(function (t) {
        return [(NAMES[t.transit] || t.transit) + (t.retro ? ' R' : ''),
                ASP_PL[t.aspect], NAMES[t.natal] || t.natal, deg(t.orb),
                toneCls(t.tone), t.applying ? 'narasta' : 'słabnie'];
      })));

    var to = new Date(now.getTime() + 30 * 86400000);
    var ev = E.transitEvents(chA, now, to,
      { bodies: ['Sun', 'Venus', 'Mars', 'Jupiter', 'Saturn'], stepHours: 12 });
    out.push('<h2>Dokładne tranzyty &mdash; najbliższe 30 dni</h2>');
    out.push(table(['Data', 'Tranzyt', 'Aspekt', 'Do punktu', 'Ton'],
      ev.slice(0, 14).map(function (e) {
        return [e.exactAt.toISOString().slice(0, 16).replace('T', ' '),
                NAMES[e.transit] || e.transit, ASP_PL[e.aspect],
                NAMES[e.natal] || e.natal, toneCls(e.tone)];
      })));

    if (b) {
      var chB = E.chart(b.utc, b.city.lat, b.city.lon, { timeKnown: b.timeKnown });
      var syn = E.synastry(chA, chB);
      out.push('<h2>Synastria</h2>');
      out.push('<p class="big">' + syn.score + '%</p>');
      out.push('<p class="note">Indeks z dwunastu najsilniejszych kontaktów. Ton-ważona średnia: ' + syn.avg + '. Wszystkich aspektów: ' + syn.hits.length + '.</p>');
      out.push(table(['A', 'Aspekt', 'B', 'Orbis', 'Ton', 'Waga pary'],
        syn.top.map(function (h) {
          return [NAMES[h.a] || h.a, ASP_PL[h.aspect], NAMES[h.b] || h.b,
                  deg(h.orb), toneCls(h.tone), h.importance];
        })));

      var comp = E.composite(chA, chB);
      out.push('<h2>Composite &mdash; karta punktów środkowych</h2>');
      out.push(table(['Punkt', 'Znak', 'Stopień'],
        comp.points.map(function (p) {
          return [NAMES[p.name] || p.name, SIGN_PL[p.sign.key], deg(p.sign.degree)];
        }).concat(comp.asc ? [['ASC', SIGN_PL[comp.asc.sign.key], deg(comp.asc.sign.degree)]] : [])));
    }

    el('out').innerHTML = out.join('');
  }

  el('go').addEventListener('click', run);
  run();
})();
