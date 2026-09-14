/* flow.js — состояние и логика воронки.
   Тексты не здесь, а в copy.js. Цены — там же, в блоке billing.

   ССЫЛКИ. Впиши URL ниже. Пока строка пустая, кнопка не ведёт никуда и
   говорит об этом — так видно, что интеграция не подключена, а не что она
   сломалась. Сообщение при этом пользовательское и на языке воронки:
   раньше здесь выводилась отладочная строка по-русски с номером строки в
   исходнике — её увидел бы покупатель, если выкатить без ссылки.

   ЮРИДИЧЕСКИЕ ДОКУМЕНТЫ. Дисклеймер подписки ссылается на «Условия
   подписки» и «Политику конфиденциальности»; раньше обе ссылки вели на
   якоря #terms и #privacy, которых на странице нет. Документы, на которые
   ссылается согласие при списании денег, обязаны существовать и
   открываться — пока URL не заданы, названия выводятся текстом без ссылки,
   а в консоль идёт предупреждение. */
var CHECKOUT_URL = '';            /* подписка: месячный план */
var CHECKOUT_URL_YEAR = '';       /* годовой план на recovery-экране */
var TERMS_URL = '';               /* Условия подписки */
var PRIVACY_URL = '';             /* Политика конфиденциальности */

(function () {
  'use strict';

  var C = window.COPY;
  var A = window.Astro;
  var CITIES = window.LANG === 'en' ? A.CITIES_EN : A.CITIES_PL;

  var el = function (id) { return document.getElementById(id); };
  var all = function (sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  };
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Градусы: в польском десятичный разделитель — запятая. */
  function deg(x) {
    var t = x.toFixed(1);
    return (window.LANG === 'pl' ? t.replace('.', ',') : t) + '°';
  }

  /* --- состояние ---------------------------------------------------------- */
  var S = {
    screen: 's1',
    dob: { d: null, m: null, y: null },
    themes: [],
    time: { h: null, min: null, known: true },
    cityIdx: 0,
    natal: null,
    partner: { d: null, m: null, y: null },
    syn: null
  };

  try {
    var saved = localStorage.getItem('astromap.funnel');
    if (saved) { var p = JSON.parse(saved); if (p && p.dob) { S.dob = p.dob; S.themes = p.themes || []; } }
  } catch (e) { /* приватный режим — просто работаем без сохранения */ }

  /* Сохраняем всё, что нужно странице разбора после оплаты:
     она пересобирает карту из тех же данных, ничего не пересылая на сервер. */
  function persist() {
    try {
      /* ГОРОД УХОДИТ ОБЪЕКТОМ. Раньше сюда клался только cityIdx — индекс в
         списке городов самой воронки. Продукт ждёт объект {n,lat,lon,tz} и,
         не найдя его, подставлял пустой город: координат нет — значит нет
         ни асцендента, ни домов (0 вместо 12), а время считалось как UTC+0
         вместо настоящего пояса, что сдвигает всю карту. То есть у каждого,
         кто приходил из воронки, персональный слой продукта — дом Луны,
         дом ретрограда, дом транзита — не работал вовсе.

         Индекс сам по себе и не мог сработать: списки городов у польской и
         английской версии разные, так что одно и то же число означает
         разные города. cityIdx оставлен рядом — на нём держится страница
         разбора внутри самой воронки. */
      var cityObj = CITIES[S.cityIdx || 0];
      localStorage.setItem('astromap.funnel', JSON.stringify({
        dob: S.dob,
        themes: S.themes,
        time: S.time,
        cityIdx: S.cityIdx,
        city: cityObj ? { n: cityObj.n, lat: cityObj.lat, lon: cityObj.lon,
                          tz: cityObj.tz, dst: cityObj.dst || '' } : null,
        partner: S.partner,
        lang: window.LANG,
        savedAt: new Date().toISOString()
      }));
    } catch (e) { /* приватный режим — просто без сохранения */ }
  }

  /* Оплата не подключена: пользователю — фраза на языке воронки,
     разработчику — точное имя константы в консоли. Отладочный текст на
     экране покупателя недопустим, тем более на третьем языке. */
  function noCheckout(which) {
    /* Сообщение ставим на ТОТ экран, который сейчас открыт: пейволл и экран
       годового плана — разные секции, и заметка, лежащая в скрытой секции,
       просто не видна — кнопка выглядит сломанной молча. */
    var note = document.querySelector('.scr.is-active .checkout-note');
    if (note) {
      note.textContent = C.paywall.checkoutOff;
      note.classList.remove('hidden');
    }
    console.warn('astromap: ' + which + ' не заполнен в js/flow.js — кнопка оплаты никуда не ведёт.');
  }

  /* --- подстановка статических строк по data-t --------------------------- */
  function pick(path) {
    return path.split('.').reduce(function (o, k) { return o ? o[k] : null; }, C);
  }
  all('[data-t]').forEach(function (n) {
    var v = pick(n.getAttribute('data-t'));
    if (typeof v === 'string') { n.textContent = v; }
  });
  /* Имена ролям, у которых нет видимого заголовка. Полоса прогресса, набор
     плиток и набор чипов объявлялись скринридером безымянными — «индикатор»,
     «группа», «группа переключателей», — и понять по ним, о чём речь,
     невозможно. Имена лежат в переводах, поэтому проставляются здесь, а не
     атрибутом в разметке. */
  all('[data-tlabel]').forEach(function (n) {
    var v = pick(n.getAttribute('data-tlabel'));
    if (typeof v === 'string') { n.setAttribute('aria-label', v); }
  });
  document.documentElement.lang = window.LANG;

  /* --- прогресс ----------------------------------------------------------
     Процент и сегменты обязаны двигаться вместе: полоса, которая стоит,
     пока цифра растёт, читается как «зависло».

     Раньше число зажжённых сегментов считалось как ceil(pct / 20), и на
     пяти экранах это давало 1, 2, 4, 5, 5. Третий сегмент не загорался
     никогда, а на последнем шаге — самом важном, прямо перед ценой —
     полоса не двигалась вовсе: 85% и 100% дают одинаковые пять.

     Теперь сегмент = порядковый номер экрана: шагов ровно столько же,
     сколько сегментов, так что каждое нажатие видно. Проценты остаются
     подписью состояния («Твоя карта 65%»), а не счётчиком шагов — счётчик
     человек читает как «сколько ещё терпеть». */
  var ORDER = ['s1', 's2', 's3', 's4', 's5'];
  var PCT = { s1: 15, s2: 35, s3: 65, s4: 85, s5: 100 };

  function progress(scr) {
    var top = el('top');
    var step = ORDER.indexOf(scr);
    if (step < 0) { top.classList.add('hidden'); return; }
    top.classList.remove('hidden');
    var v = PCT[scr];
    el('pct').textContent = C.progress + ' ' + v + '%';
    el('bar').setAttribute('aria-valuenow', v);
    all('.bar__seg').forEach(function (seg, i) {
      seg.classList.toggle('is-on', i <= step);
    });
  }

  /* --- переключение экранов ---------------------------------------------- */
  function go(id) {
    S.screen = id;
    all('.scr').forEach(function (s) { s.classList.toggle('is-active', s.id === id); });
    progress(id);
    window.scrollTo(0, 0);
    dock(id);
  }

  function dock(id) {
    var cta = el('cta'), ghost = el('ghost');
    ghost.classList.add('hidden');
    cta.classList.remove('hidden');
    if (id === 's1') { cta.textContent = C.ctaNext; cta.disabled = !dobReady(); }
    if (id === 's2') { cta.textContent = C.ctaNext; cta.disabled = S.themes.length < 2; }
    if (id === 's3') {
      cta.textContent = S.natal ? C.ctaNext : C.ctaCalc;
      cta.disabled = !timeReady();
    }
    if (id === 's4') {
      cta.textContent = C.ctaSummary;
      cta.disabled = !S.syn;
      ghost.textContent = C.s4.skip;
      ghost.classList.remove('hidden');
    }
    if (id === 's5') { cta.textContent = C.paywall.title; cta.disabled = false; }
    if (id === 's6') {
      cta.textContent = C.paywall.cta;   /* legal-строка ссылается именно на неё */
      cta.disabled = false;
      ghost.textContent = C.notNow;
      ghost.classList.remove('hidden');
    }
    if (id === 's7') {
      cta.textContent = C.recovery.yearCta;
      cta.disabled = false;
      ghost.textContent = C.paywall.planTitle + ' · ' + C.billing.priceLine;
      ghost.classList.remove('hidden');
    }
  }

  /* --- селекты ----------------------------------------------------------- */
  function fill(sel, items, placeholder) {
    var o = document.createElement('option');
    o.value = ''; o.textContent = placeholder || '—';
    sel.appendChild(o);
    items.forEach(function (it) {
      var op = document.createElement('option');
      op.value = it.v; op.textContent = it.t;
      sel.appendChild(op);
    });
  }
  function range(a, b, pad) {
    var out = [];
    for (var i = a; i <= b; i++) {
      out.push({ v: i, t: pad && i < 10 ? '0' + i : String(i) });
    }
    return out;
  }
  /* Короткие формы: полные названия («października») не влезают в треть
     строки на 320px и обрезаются посередине. */
  var MONTHS = window.LANG === 'en'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
       'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  var monthItems = MONTHS.map(function (t, i) { return { v: i + 1, t: t }; });
  var thisYear = new Date().getFullYear();

  fill(el('d1'), range(1, 31), C.s1.day);
  fill(el('m1'), monthItems, C.s1.month);
  fill(el('y1'), range(1940, thisYear).reverse(), C.s1.year);
  fill(el('d2'), range(1, 31), C.s1.day);
  fill(el('m2'), monthItems, C.s1.month);
  fill(el('y2'), range(1940, thisYear).reverse(), C.s1.year);
  fill(el('hh'), range(0, 23, true), C.s3.hour);
  fill(el('mm'), range(0, 59, true), C.s3.minute);
  fill(el('city'), CITIES.map(function (c, i) { return { v: i, t: c.n }; }), C.s3.city);

  /* восстановление сохранённой даты */
  if (S.dob.d) { el('d1').value = S.dob.d; el('m1').value = S.dob.m; el('y1').value = S.dob.y; }

  /* --- экран 1 ----------------------------------------------------------- */
  function dobReady() { return !!(S.dob.d && S.dob.m && S.dob.y); }

  function onDob() {
    S.dob = {
      d: +el('d1').value || null,
      m: +el('m1').value || null,
      y: +el('y1').value || null
    };
    if (!dobReady()) { el('s1res').classList.add('hidden'); el('cta').disabled = true; return; }
    persist();
    /* Знак Солнца по дате: расчёт настоящий, не таблица диапазонов. */
    var tz = CITIES[0].tz;
    var c = A.chartDateOnly({ y: S.dob.y, m: S.dob.m, d: S.dob.d }, tz);
    S.sunPreview = c;
    el('s1sign').innerHTML = C.signs[c.sun.index] +
      ' <span class="res__deg">' + deg(c.sun.degree) + '</span>';
    el('s1line').textContent = C.sun[c.sun.index];
    el('s1el').textContent = C.s1.elementLabel + ': ' + C.elements[c.sun.element] +
      (c.sun.nearCusp ? ' · ' + C.s3.cuspNote : '');
    el('s1res').classList.remove('hidden');
    el('cta').disabled = false;
  }
  ['d1', 'm1', 'y1'].forEach(function (id) { el(id).addEventListener('change', onDob); });
  if (dobReady()) { onDob(); }

  /* --- экран 2: темы ------------------------------------------------------
     Ответ влияет дальше: список тем идёт в сводку (s5) и во вторую строку
     пейволла (paywall.includes[1], подстановка {themes}). */
  C.s2.themes.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'tile';
    b.type = 'button';
    b.setAttribute('role', 'checkbox');
    b.setAttribute('aria-checked', S.themes.indexOf(t.k) >= 0 ? 'true' : 'false');
    b.dataset.k = t.k;
    b.innerHTML = '<span class="tile__t"></span><span class="tile__d"></span>';
    b.querySelector('.tile__t').textContent = t.t;
    b.querySelector('.tile__d').textContent = t.d;
    b.addEventListener('click', function () {
      var i = S.themes.indexOf(t.k);
      if (i >= 0) { S.themes.splice(i, 1); }
      else if (S.themes.length < 3) { S.themes.push(t.k); }
      else { return; }
      b.setAttribute('aria-checked', S.themes.indexOf(t.k) >= 0 ? 'true' : 'false');
      el('cta').disabled = S.themes.length < 2;
      persist();
      document.dispatchEvent(new CustomEvent('funnel:answer',
        { detail: { step: 's2', themes: S.themes.slice() } }));
    });
    el('tiles').appendChild(b);
  });

  /* --- экран 3: время и место -------------------------------------------- */
  function timeReady() {
    var cityOk = el('city').value !== '';
    if (!cityOk) { return false; }
    if (!S.time.known) { return true; }
    return el('hh').value !== '' && el('mm').value !== '';
  }
  function onTime() {
    S.time.h = el('hh').value === '' ? null : +el('hh').value;
    S.time.min = el('mm').value === '' ? null : +el('mm').value;
    S.cityIdx = el('city').value === '' ? null : +el('city').value;
    el('cta').disabled = !timeReady();
  }
  ['hh', 'mm', 'city'].forEach(function (id) { el(id).addEventListener('change', onTime); });

  el('noTime').addEventListener('change', function () {
    S.time.known = !this.checked;
    el('hh').disabled = this.checked;
    el('mm').disabled = this.checked;
    el('s3note').textContent = this.checked ? C.s3.unknownNote : '';
    el('s3note').classList.toggle('hidden', !this.checked);
    el('cta').disabled = !timeReady();
  });

  function type(node, text, done) {
    if (reduced) { node.textContent = text; if (done) { done(); } return; }
    node.textContent = '';
    var i = 0;
    (function step() {
      node.textContent = text.slice(0, ++i);
      if (i < text.length) { setTimeout(step, 14); }
      else if (done) { done(); }
    })();
  }

  function calcChart() {
    var city = CITIES[S.cityIdx];
    var parts = {
      y: S.dob.y, m: S.dob.m, d: S.dob.d,
      h: S.time.known ? S.time.h : 12,
      min: S.time.known ? S.time.min : 0,
      timeKnown: S.time.known
    };
    S.natal = A.chart(parts, city);
    persist();

    el('calc').classList.remove('hidden');
    el('cta').disabled = true;

    setTimeout(function () {
      el('calc').classList.add('hidden');
      var m = S.natal.moon;
      el('moonSign').innerHTML = C.signs[m.index] +
        ' <span class="res__deg">' + deg(m.degree) + '</span>';
      el('moonBox').classList.remove('hidden');
      el('moonBox').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      type(el('moonLine'), C.moon[m.index], function () {
        if (S.natal.asc) {
          var a = S.natal.asc;
          el('ascSign').innerHTML = C.signs[a.index] +
            ' <span class="res__deg">' + deg(a.degree) + '</span>';
          el('ascBox').classList.remove('hidden');
          el('ascBox').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
          type(el('ascLine'), C.asc[a.index]);
        }
        if ((S.natal.moon.nearCusp) || (S.natal.asc && S.natal.asc.nearCusp)) {
          el('s3note').textContent = C.s3.cuspNote;
          el('s3note').classList.remove('hidden');
        }
        el('cta').textContent = C.ctaNext;
        el('cta').disabled = false;
      });
    }, reduced ? 100 : 1100);
  }

  /* --- экран 4: совместимость -------------------------------------------- */
  function bandFor(score) {
    var band = C.s4.bands[0];
    C.s4.bands.forEach(function (b) { if (score >= b.min) { band = b; } });
    return band;
  }

  function onPartner() {
    S.partner = {
      d: +el('d2').value || null,
      m: +el('m2').value || null,
      y: +el('y2').value || null
    };
    if (!(S.partner.d && S.partner.m && S.partner.y)) {
      el('scoreBox').classList.add('hidden');
      el('cta').disabled = true;
      return;
    }
    var city = CITIES[S.cityIdx || 0];
    var p = A.chartDateOnly(S.partner, city.tz);
    S.syn = A.synastry(S.natal.sunLon, S.natal.moonLon, p.sunLon, p.moonLon);
    S.partnerChart = p;
    persist();

    var band = bandFor(S.syn.score);

    el('scoreBox').classList.remove('hidden');
    el('scoreT').textContent = band.t;
    el('scoreD').textContent = band.d;
    el('scoreFill').style.width = S.syn.score + '%';

    var n = 0, target = S.syn.score;
    if (reduced) { el('scoreNum').textContent = target + '%'; }
    else {
      (function tick() {
        n += Math.max(1, Math.round((target - n) / 6));
        if (n >= target) { n = target; }
        el('scoreNum').textContent = n + '%';
        if (n < target) { setTimeout(tick, 26); }
      })();
    }
    el('cta').disabled = false;
  }
  ['d2', 'm2', 'y2'].forEach(function (id) { el(id).addEventListener('change', onPartner); });

  /* --- экран 5: сводка --------------------------------------------------- */
  function themeNames() {
    return S.themes.map(function (k) {
      var f = null;
      C.s2.themes.forEach(function (t) { if (t.k === k) { f = t.t; } });
      return f;
    }).filter(Boolean);
  }

  function buildSummary() {
    var rows = [
      [C.s5.sun, C.signs[S.natal.sun.index] + ' ' + deg(S.natal.sun.degree)],
      [C.s5.moon, C.signs[S.natal.moon.index] + ' ' + deg(S.natal.moon.degree)],
      [C.s5.asc, S.natal.asc
        ? C.signs[S.natal.asc.index] + ' ' + deg(S.natal.asc.degree)
        : '<small>' + C.s5.ascEmpty + '</small>'],
      [C.s5.themesLabel, themeNames().join(', ')]
    ];
    if (S.syn) {
      rows.push([C.s5.pairLabel,
        C.signs[S.partnerChart.sun.index] + ' · ' + S.syn.score + '%']);
    }
    el('sum').innerHTML = rows.map(function (r) {
      return '<div class="sum__row"><span class="sum__k">' + r[0] +
             '</span><span class="sum__v">' + r[1] + '</span></div>';
    }).join('');
  }

  /* --- экран 6: пейволл --------------------------------------------------- */
  function buildPaywall() {
    var list = C.paywall.includes.slice();
    list[1] = list[1].replace('{themes}', themeNames().join(', '));
    if (!S.syn) { list[3] = C.paywall.includesNoPair; }
    el('inc').innerHTML = list.map(function (t) {
      return '<div class="inc__i"><i class="inc__d"></i><span class="inc__t">' + t + '</span></div>';
    }).join('');

    el('planPrice').textContent = C.billing.priceLine;
    el('planAfter').textContent = C.billing.renewLine;
    el('planDisc').textContent = C.billing.disclaimer;

    el('legal').innerHTML = legalHtml(C.paywall.cta);
  }

  /* Строка согласия. Собирается из надписи той кнопки, которая реально стоит
     на этом экране: на пейволле это «Kontynuuj», на экране годового плана —
     «Wybierz plan roczny». Согласие, ссылающееся на кнопку, которой на экране
     нет, — прямой риск при разборе спора по автопродлению.

     Ссылки-заглушки: реальных документов пока нет. См. README, п. «Что не
     размещено». Ссылка на несуществующий документ хуже, чем его отсутствие:
     человек жмёт, ничего не происходит, а согласие формально уже дано —
     поэтому пока URL пуст, выводим название текстом, без <a>. */
  function legalHtml(ctaLabel) {
    var docLink = function (url, label) {
      return url ? '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>' : label;
    };
    if (!TERMS_URL || !PRIVACY_URL) {
      console.warn('astromap: TERMS_URL/PRIVACY_URL не заданы в js/flow.js — ' +
        'дисклеймер подписки ссылается на документы, которых нет.');
    }
    return C.paywall.legal
      .replace('{cta}', ctaLabel)
      .replace('{terms}', docLink(TERMS_URL, C.paywall.terms))
      .replace('{privacy}', docLink(PRIVACY_URL, C.paywall.privacyInline));
  }

  /* --- экран 7: recovery -------------------------------------------------- */
  function buildRecovery() {
    /* Показываем НАСТОЯЩИЙ текст, посчитанный для этого человека:
       первый абзац открыт, остальное под блюром. */
    var open = C.sun[S.natal.sun.index];
    var hid = C.moon[S.natal.moon.index] + ' ' +
              (S.natal.asc ? C.asc[S.natal.asc.index] + ' ' : '') +
              (S.syn ? bandFor(S.syn.score).d : '');
    el('revealed').textContent = open;
    el('hiddenTxt').textContent = hid;
    el('onePrice').textContent = C.billing.yearPrice + ' ' + C.billing.yearPeriod;
    el('oneDisc').textContent = C.billing.yearDisclaimer;
    /* Экран годового плана — такая же покупка, как пейволл, и до сих пор был
       единственным экраном со списанием без строки согласия вообще. */
    el('legalYear').innerHTML = legalHtml(C.recovery.yearCta);

    if (el('chips').children.length) { return; }
    C.recovery.survey.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.textContent = s.t;
      b.addEventListener('click', function () {
        all('.chip').forEach(function (c) { c.setAttribute('aria-checked', 'false'); });
        b.setAttribute('aria-checked', 'true');
        el('answer').textContent = C.recovery.answers[s.k];
        document.dispatchEvent(new CustomEvent('funnel:answer',
          { detail: { step: 's7', reason: s.k } }));
      });
      el('chips').appendChild(b);
    });
  }

  /* --- навигация --------------------------------------------------------- */
  el('cta').addEventListener('click', function () {
    if (S.screen === 's1') { go('s2'); return; }
    if (S.screen === 's2') { go('s3'); return; }
    if (S.screen === 's3') {
      if (!S.natal) { calcChart(); } else { go('s4'); }
      return;
    }
    if (S.screen === 's4') { buildSummary(); go('s5'); return; }
    if (S.screen === 's5') { buildPaywall(); go('s6'); return; }
    if (S.screen === 's6') {
      if (CHECKOUT_URL) { window.location.href = CHECKOUT_URL; }
      else { noCheckout('CHECKOUT_URL'); }
      return;
    }
    if (S.screen === 's7') {
      /* Раньше здесь на экран покупателя выводилась отладочная строка
         по-русски с номером строки в исходнике — на третьем языке, которого
         в воронке нет. Тот же noCheckout, что и на пейволле. */
      if (CHECKOUT_URL_YEAR) { window.location.href = CHECKOUT_URL_YEAR; }
      else { noCheckout('CHECKOUT_URL_YEAR'); }
    }
  });

  el('ghost').addEventListener('click', function () {
    if (S.screen === 's4') { S.syn = null; buildSummary(); go('s5'); return; }
    if (S.screen === 's6') { buildRecovery(); go('s7'); return; }
    if (S.screen === 's7') { go('s6'); return; }
  });

  /* Стрелки перемещают фокус по плиткам, но не отправляют экран. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') { return; }
    var items = all('.scr.is-active .tile, .scr.is-active .chip');
    if (!items.length) { return; }
    var i = items.indexOf(document.activeElement);
    if (i < 0) { return; }
    e.preventDefault();
    var next = e.key === 'ArrowDown' ? (i + 1) % items.length
                                     : (i - 1 + items.length) % items.length;
    items[next].focus();
  });

  /* Переключатель языка: перезагружаем страницу, потому что тексты
     подставляются один раз на старте. Введённая дата не теряется —
     она уже в localStorage. */
  /* Продукт умеет десять языков, воронка — два. Если в общем ключе стоит,
     например, 'ru', copy.js отдаёт английский; подсветить надо именно EN,
     иначе ни одна кнопка не активна и переключатель выглядит сломанным. */
  all('.lang__b').forEach(function (b) {
    b.classList.toggle('on', b.getAttribute('data-lang') === window.LANG);
    b.addEventListener('click', function () {
      if (b.getAttribute('data-lang') === window.LANG) { return; }
      try { localStorage.setItem('astromap.lang', b.getAttribute('data-lang')); } catch (e) {}
      location.reload();
    });
  });

  progress('s1');
  dock('s1');
})();
