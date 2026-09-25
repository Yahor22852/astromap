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
var CHECKOUT_URL = 'https://rubyalex5.gumroad.com/l/astromap?wanted=true';
                                  /* подписка: месячный план, $9.99/мес.
                                     ?wanted=true открывает чекаут сразу, минуя
                                     страницу товара — человек уже принял решение
                                     на пейволле, второй экран с той же ценой
                                     только отдаёт его обратно в раздумья. */
var CHECKOUT_URL_YEAR = '';       /* годовой план: в Gumroad такого тира пока
                                     нет, поэтому экран s7 и не показывается —
                                     см. обработчик 'ghost' ниже. Заведёшь тир —
                                     впиши сюда ссылку с ?recurrence=yearly, и
                                     экран вернётся сам, менять больше нечего. */
var TERMS_URL = '';               /* Условия подписки */
var PRIVACY_URL = '';             /* Политика конфиденциальности */

(function () {
  'use strict';

  var C = window.COPY;
  var A = window.Astro;
  /* Один список городов на все языки (см. js/cities.js). Раньше их было два,
     CITIES_PL и CITIES_EN, и человек выбирал из того, что соответствовало
     языку интерфейса, — а сохранялся индекс в списке. Десять языков на двух
     списках не живут вовсе, и от самих списков пришлось отказаться. */
  var FC = window.FunnelCities;
  var W = window.FunnelWheel;
  var PV = window.FunnelPreview;

  var el = function (id) { return document.getElementById(id); };
  var all = function (sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  };
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Градусы: десятичный разделитель — точка только в английском. Во всех
     девяти остальных языках воронки (pl, ru, uk, de, es, fr, it, pt, tr)
     это запятая, поэтому проверка идёт от английского, а не перечислением. */
  function deg(x) {
    var t = x.toFixed(1);
    return (window.LANG === 'en' ? t : t.replace('.', ',')) + '°';
  }

  /* --- состояние ---------------------------------------------------------- */
  var S = {
    screen: 's1',
    dob: { d: null, m: null, y: null },
    themes: [],
    time: { h: null, min: null, known: true },
    city: null,               /* {n, cc, lat, lon, tz} — объект, не индекс */
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
      /* ГОРОД УХОДИТ ОБЪЕКТОМ, и теперь он объектом же и хранится в S.
         Индекса больше нет нигде: он означал позицию в списке, а списков
         было два разных, так что одно число значило разные города — из-за
         этого продукт не получал координат (ни асцендента, ни домов) и
         считал время как UTC+0, а страница разбора меняла человеку место
         рождения при переключении языка.

         cityIdx больше не пишется даже для совместимости: читатели этого
         поля — продукт и reading.js — оба переведены на объект. */
      localStorage.setItem('astromap.funnel', JSON.stringify({
        dob: S.dob,
        themes: S.themes,
        time: S.time,
        city: S.city,
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
    if (id === 's5') { cta.textContent = C.s5.cta; cta.disabled = false; }
    if (id === 's6') {
      cta.textContent = C.paywall.cta;   /* legal-строка ссылается именно на неё */
      cta.disabled = false;
      ghost.textContent = C.notNow;
      ghost.classList.remove('hidden');
    }
    if (id === 's7') {
      /* Экран восстановления теперь один и тот же для всех: отказался от
         месячного — видишь годовой. Главное действие — купить годовой,
         второе — вернуться к месячному. Возврат оставлен намеренно: это не
         промежуточный экран, а выход, без него человек, нажавший «не
         сейчас» по ошибке, оказался бы заперт. */
      cta.textContent = C.recovery.yearCta;
      cta.disabled = false;
      ghost.textContent = C.recovery.backToPlan;
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
  /* Короткие названия месяцев теперь приходят из текстов (C.months), а не
     живут здесь: с десятью языками ветка «en или pl» превращалась бы в
     десятиэтажный тернарник в коде вместо строки в словаре. */
  var monthItems = C.months.map(function (t, i) { return { v: i + 1, t: t }; });
  var thisYear = new Date().getFullYear();

  fill(el('d1'), range(1, 31), C.s1.day);
  fill(el('m1'), monthItems, C.s1.month);
  fill(el('y1'), range(1940, thisYear).reverse(), C.s1.year);
  fill(el('d2'), range(1, 31), C.s1.day);
  fill(el('m2'), monthItems, C.s1.month);
  fill(el('y2'), range(1940, thisYear).reverse(), C.s1.year);
  fill(el('hh'), range(0, 23, true), C.s3.hour);
  fill(el('mm'), range(0, 59, true), C.s3.minute);
  el('city').placeholder = C.s3.cityPlaceholder;
  el('cityManual').textContent = C.s3.cityManual;
  el('cityManualName').placeholder = C.s3.cityManualName;
  el('cityManualName').setAttribute('aria-label', C.s3.cityManualName);
  el('cityManualApply').textContent = C.s3.cityManualApply;
  el('cityManualOffset').setAttribute('aria-label', C.s3.cityManualOffset);
  el('city').setAttribute('aria-label', C.s3.city);
  (function () {
    /* Смещения от UTC-12 до UTC+14 с получасовыми поясами: Индия +5:30,
       Непал +5:45, Чатем +12:45 — без них ручной ввод врал бы на полчаса. */
    var vals = [];
    for (var h = -12; h <= 14; h++) {
      vals.push(h);
      if (h === 3 || h === 4 || h === 5 || h === 6 || h === 9 || h === 10 || h === 12) { vals.push(h + 0.5); }
      if (h === 5) { vals.push(5.75); }
      if (h === 12) { vals.push(12.75); }
    }
    vals.sort(function (a, b) { return a - b; });
    el('cityManualOffset').innerHTML = vals.map(function (v) {
      var sign = v < 0 ? '-' : '+';
      var abs = Math.abs(v);
      var hh = Math.floor(abs);
      var mm = Math.round((abs - hh) * 60);
      return '<option value="' + v + '"' + (v === 0 ? ' selected' : '') + '>UTC' + sign +
        (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + '</option>';
    }).join('');
  })();

  /* восстановление сохранённой даты */
  if (S.dob.d) { el('d1').value = S.dob.d; el('m1').value = S.dob.m; el('y1').value = S.dob.y; }

  /* --- карта, которая собирается ------------------------------------------
     Один код рисует круг на первом и на третьем экране, поэтому это
     буквально одна и та же карта, в которую доезжают точки, а не две
     похожие картинки. На вход идёт то, что УЖЕ посчитано: Солнце — после
     даты, Луна и Асцендент — после времени и места.

     Слот без величины остаётся пустым и объясняет, чего не хватает. Это не
     приём нагнетания: без времени рождения Асцендента действительно не
     существует, и подставить туда правдоподобное число было бы враньём. */
  function mapPoints() {
    var out = [];
    var n = S.natal;
    if (n) {
      out.push({ key: 'sun',  lon: n.sunLon,  short: C.map.sunShort });
      out.push({ key: 'moon', lon: n.moonLon, short: C.map.moonShort });
      if (n.asc) { out.push({ key: 'asc', lon: n.ascLon, short: C.map.ascShort }); }
    } else if (S.sunPreview) {
      out.push({ key: 'sun', lon: S.sunPreview.sunLon, short: C.map.sunShort });
    }
    return out;
  }

  function mapSlots() {
    var n = S.natal, p = S.sunPreview;
    var sun = n ? n.sun : (p ? p.sun : null);
    var fmt = function (sign) { return C.signs[sign.index] + ' ' + deg(sign.degree); };
    return [
      { label: C.map.sun,  value: sun ? fmt(sun) : C.map.waitDate, pending: !sun },
      { label: C.map.moon, value: n ? fmt(n.moon) : C.map.waitTime, pending: !n },
      { label: C.map.asc,  value: (n && n.asc) ? fmt(n.asc)
          : (n ? C.map.noAsc : C.map.waitTime), pending: !(n && n.asc) }
    ];
  }

  /* Текстовое описание круга для тех, кто его не видит: SVG без подписи —
     для скринридера просто «изображение». */
  function mapAria(slots) {
    return slots.filter(function (sl) { return !sl.pending; })
      .map(function (sl) { return sl.label + ' — ' + sl.value; }).join(', ');
  }

  /* legend: на первом экране круг — единственный результат, и подписи нужны
     рядом с ним. На третьем те же значения уже стоят в карточках Луны и
     Асцендента под картой, и вторая их копия — лишний блок и лишняя высота. */
  function drawMap(node, withLegend) {
    if (!node || !W) { return; }
    var slots = mapSlots();
    node.innerHTML = W.render({ points: mapPoints(), signs: C.signs, aria: mapAria(slots) }) +
      (withLegend ? W.legend(slots) : '');
  }

  /* Прокрутка к блоку с поправкой на липкую шапку: scrollIntoView с
     block:'center' на коротком экране заводит верх карты под шапку, и
     первая точка — Солнце — оказывается закрыта ровно в тот момент, когда
     на неё нужно смотреть. */
  function scrollToBlock(node) {
    if (!node) { return; }
    var top = el('top');
    var pad = (top && !top.classList.contains('hidden') ? top.offsetHeight : 0) + 16;
    var y = node.getBoundingClientRect().top + window.pageYOffset - pad;
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
  }

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
    /* Предварительный знак Солнца до выбора города: считаем на полдень UTC.
       Солнце проходит знак за месяц, поэтому пояс на знак почти не влияет, а
       у границы знака экран отдельно просит уточнить (флаг nearCusp). */
    var c = A.chartDateOnly({ y: S.dob.y, m: S.dob.m, d: S.dob.d }, 0);
    S.sunPreview = c;
    el('s1sign').innerHTML = C.signs[c.sun.index] +
      ' <span class="res__deg">' + deg(c.sun.degree) + '</span>';
    el('s1line').textContent = C.sun[c.sun.index];
    el('s1el').textContent = C.s1.elementLabel + ': ' + C.elements[c.sun.element] +
      (c.sun.nearCusp ? ' · ' + C.s3.cuspNote : '');
    drawMap(el('s1map'), true);
    el('s1mapnote').textContent = C.map.firstPoint;
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
    var cityOk = !!S.city;
    if (!cityOk) { return false; }
    if (!S.time.known) { return true; }
    return el('hh').value !== '' && el('mm').value !== '';
  }
  function onTime() {
    S.time.h = el('hh').value === '' ? null : +el('hh').value;
    S.time.min = el('mm').value === '' ? null : +el('mm').value;
    el('cta').disabled = !timeReady();
  }
  ['hh', 'mm'].forEach(function (id) { el(id).addEventListener('change', onTime); });

  /* --- выбор города -------------------------------------------------------
     Поле поиска, а не список: городов 864 на все языки сразу, прокруткой
     такой список не берут. Выбор кладётся в S.city объектом — именно он и
     уходит дальше в продукт.

     Набранный, но не выбранный из подсказок текст городом не считается:
     иначе «Варшава» с опечаткой уехала бы в расчёт как место без координат,
     и человек увидел бы карту не своего рождения, ничего не заподозрив.
     Поэтому любое изменение текста сбрасывает выбор, а кнопка «посчитать»
     снова гаснет. */
  (function bindCityPick() {
    var input = el('city'), menu = el('cityMenu'), wrap = input.closest('.citypick');
    var results = [], active = -1;

    /* ПОЧЕМУ ЭТОТ БЛОК ПЕРЕПИСАН.

       Подсказки закрывались по blur поля с задержкой 120 мс, а выбор ловился
       единственным обработчиком mousedown. На мыши это работает, на телефоне
       разваливается: там первое касание сначала убирает экранную клавиатуру,
       поле теряет фокус — и меню успевает закрыться и очиститься ДО того, как
       палец «доедет» до строки. Замер это подтвердил: через 200 мс после
       потери фокуса в меню ноль строк и hidden=true, то есть касание падало
       в пустоту. Отсюда «иногда не выбирается» и «список пропадает под
       пальцем».

       Теперь закрытие по blur блокируется на время, пока указатель опущен
       внутри меню: раз палец уже в списке, уход фокуса ничего не значит.
       Таймера-гонки больше нет вовсе. */
    var interacting = false;

    function close() {
      if (menu.hidden) { return; }
      menu.hidden = true;
      menu.style.maxHeight = '';
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    }
    function setActive(i) {
      var opts = all('#cityMenu .citypick__opt');
      opts.forEach(function (o, oi) { o.classList.toggle('on', oi === i); });
      active = i;
      if (!opts[i]) { input.removeAttribute('aria-activedescendant'); return; }
      input.setAttribute('aria-activedescendant', opts[i].id);
      /* Подсветка должна быть видна: строк до восьми, высота списка 264px,
         то есть с шестой стрелка уводила выделение за пределы прокрутки. */
      var o = opts[i], mt = menu.scrollTop, mh = menu.clientHeight;
      if (o.offsetTop < mt) { menu.scrollTop = o.offsetTop; }
      else if (o.offsetTop + o.offsetHeight > mt + mh) {
        menu.scrollTop = o.offsetTop + o.offsetHeight - mh;
      }
    }
    function choose(i) {
      var c = results[i];
      if (!c) { return; }
      S.city = FC.toObject(c);
      input.value = FC.label(c);
      close();
      persist();
      el('cta').disabled = !timeReady();
    }
    function render() {
      if (!results.length) {
        menu.innerHTML = '<div class="citypick__empty">' + C.s3.cityNoMatch + '</div>';
      } else {
        menu.innerHTML = results.map(function (c, i) {
          return '<div class="citypick__opt" role="option" id="cityopt-' + i +
            '" data-i="' + i + '">' + FC.label(c) + '</div>';
        }).join('');
      }
      menu.hidden = false;
      menu.scrollTop = 0;
      active = -1;
      input.setAttribute('aria-expanded', 'true');
      input.removeAttribute('aria-activedescendant');
      fitMenu();
    }

    /* Подсказки лежат абсолютом, то есть в высоту страницы не входят: сколько
       бы строк в них ни было, прокрутить к ним нельзя — прокручивать нечего.
       Пока над доком есть место, это незаметно; с открытой клавиатурой
       (замер: окно 360px вместо 780) места не остаётся, и список упирается в
       док. Порядок действий тот же, что у человека: сначала подвинуть экран,
       чтобы поле поднялось, и только если и после этого не помещается —
       ограничить высоту списка, чтобы он прокручивался внутри себя.

       Граница — низ окна, а не верх дока: подсказки теперь рисуются ПОВЕРХ
       дока (см. .scr в flow.css), и перекрыть кнопку на время выбора — это
       нормально, а вот уехать за сгиб нельзя. Нижний предел в 132px — три
       строки: список, в котором видно меньше, бесполезен. */
    function fitMenu() {
      if (menu.hidden) { return; }
      var gap = function () {
        var vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
        return vh - menu.getBoundingClientRect().top - 10;
      };
      menu.style.maxHeight = '';
      /* Именно нарисованная высота, а не scrollHeight: у списка есть штатный
         потолок в 264px из CSS, и растягивать его сверх этого мы не хотим. */
      var need = menu.getBoundingClientRect().height;

      if (gap() < need) {
        var room = Math.max(0, document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
        var by = Math.min(need - gap(), room);
        if (by > 0) { window.scrollBy(0, by); }
      }
      var avail = gap();
      if (avail < need) { menu.style.maxHeight = Math.max(132, avail) + 'px'; }
    }

    /* Открыть подсказки по текущему тексту. Нужно не только при наборе:
       человек, вернувшийся в уже заполненное поле, раньше не видел ничего,
       пока не начинал стирать и вводить заново. */
    function openFor(text) {
      if (FC.norm(text).trim().length < 2) { close(); return; }
      results = FC.search(text, 8);
      /* Выбранный город лежит в поле как «Warsaw, Poland» — с названием
         страны, которого в поиске нет. Поэтому при возврате в заполненное
         поле запрос по всей строке давал ноль и экран сообщал «город не
         найден» под полем с корректно выбранным городом. Отсекаем хвост
         после запятой: формат подписи один на все десять языков. */
      if (!results.length && text.indexOf(',') > 0) {
        results = FC.search(text.slice(0, text.indexOf(',')), 8);
      }
      render();
    }

    /* Обработчик один на всё меню, а не по штуке на строку: список
       пересобирается на каждое нажатие клавиши, и привязка к конкретным
       узлам означала бы, что после перерисовки слушатели висят на
       выброшенных элементах. */
    function optionAt(target) {
      var o = target && target.closest ? target.closest('.citypick__opt') : null;
      return (o && menu.contains(o)) ? +o.getAttribute('data-i') : -1;
    }
    /* На мыши этого достаточно, чтобы фокус вообще не уходил из поля. */
    menu.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    menu.addEventListener('pointerdown', function () { interacting = true; });
    /* Снимаем флаг на уровне документа и в фазе перехвата: палец может
       оторваться уже вне меню (прокрутка списка), и «зависший» флаг тогда
       запретил бы закрытие навсегда. */
    document.addEventListener('pointerup', function () { interacting = false; }, true);
    document.addEventListener('pointercancel', function () { interacting = false; }, true);
    menu.addEventListener('click', function (ev) {
      var i = optionAt(ev.target);
      if (i >= 0) { ev.preventDefault(); choose(i); }
    });

    input.addEventListener('input', function () {
      S.city = null;
      el('cta').disabled = !timeReady();
      openFor(input.value);
    });
    /* Возврат в поле снова показывает подсказки — и по нажатию, и по табу. */
    input.addEventListener('focus', function () { openFor(input.value); });
    input.addEventListener('click', function () { openFor(input.value); });
    input.addEventListener('keydown', function (ev) {
      if (menu.hidden) {
        /* Стрелка вниз на закрытом списке открывает его — обычное поведение
           комбобокса, раньше не работало. */
        if (ev.key === 'ArrowDown') { ev.preventDefault(); openFor(input.value); }
        return;
      }
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        setActive(results.length ? (active + 1) % results.length : -1);
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        setActive(results.length ? (active <= 0 ? results.length - 1 : active - 1) : -1);
      } else if (ev.key === 'Enter') {
        /* preventDefault безусловный: пока список открыт, Enter принадлежит
           ему, а не форме вокруг. Без выделенной строки берём первую —
           раньше Enter просто не делал ничего. */
        ev.preventDefault();
        if (active >= 0) { choose(active); }
        else if (results.length) { choose(0); }
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        close();
      }
    });
    input.addEventListener('blur', function () {
      /* Палец уже в списке — уход фокуса ничего не значит. */
      if (interacting) { return; }
      close();
    });

    /* Экранная клавиатура приходит и уходит уже после того, как список
       открыт: на телефоне это событие resize (а где есть visualViewport —
       ещё и его собственный resize). Без пересчёта список, помещавшийся
       секунду назад, оказывается под доком. */
    window.addEventListener('resize', fitMenu);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitMenu);
    }
    /* Нажатие мимо поля и мимо списка закрывает подсказки. Раньше это
       держалось на одном blur, то есть на предположении, что фокус
       обязательно куда-то уйдёт. */
    document.addEventListener('pointerdown', function (ev) {
      if (menu.hidden) { return; }
      if (wrap && wrap.contains(ev.target)) { return; }
      close();
    });

    /* Города нет в списке. Тогда считаем всё, кроме асцендента: для него
       нужны координаты, а их человек ввести не может — и выдумывать их
       нельзя, это и есть та самая «настоящая астрономическая величина». */
    el('cityManual').addEventListener('click', function () {
      var box = el('cityManualBox');
      box.hidden = !box.hidden;
      if (!box.hidden) { el('cityManualName').focus(); }
    });
    el('cityManualApply').addEventListener('click', function () {
      var name = el('cityManualName').value.trim();
      if (!name) { el('cityManualName').focus(); return; }
      S.city = { n: name, lat: null, lon: null,
                 tz: parseFloat(el('cityManualOffset').value), dst: '' };
      input.value = name;
      el('cityManualBox').hidden = true;
      close();
      persist();
      el('cta').disabled = !timeReady();
      el('s3note').textContent = C.s3.cityManualNote;
      el('s3note').classList.remove('hidden');
    });
  })();

  el('noTime').addEventListener('change', function () {
    S.time.known = !this.checked;
    el('hh').disabled = this.checked;
    el('mm').disabled = this.checked;
    el('s3note').textContent = this.checked ? C.s3.unknownNote : '';
    el('s3note').classList.toggle('hidden', !this.checked);
    el('cta').disabled = !timeReady();
  });

  /* --- расчёт по стадиям ---------------------------------------------------
     Раньше здесь стояла одна строка «Считаю позиции…» и setTimeout на 1100
     мс — то есть выдуманная пауза, за которой ничего не происходило: сам
     расчёт занимает доли миллисекунды.

     Теперь стадий четыре, и каждая делает ровно то, что написано в её
     подписи: переводит местное время рождения в UTC по таймзоне города,
     считает долготу Солнца, считает долготу Луны, считает Асцендент. Работа
     настоящая, но быстрая, поэтому у каждой стадии есть минимальное время
     на экране — иначе подпись невозможно прочитать. Это не имитация работы:
     строка не врёт о том, что происходит, она только держится достаточно
     долго, чтобы её увидели.

     Асцендент считается не всегда: без времени рождения или без координат
     его нет, и стадии для него тоже нет — вместо неё строка о том, почему. */
  var STAGE_MS = 260;

  function stageListHtml(stages) {
    return stages.map(function (st, i) {
      return '<li class="calc__s" data-i="' + i + '"><i class="calc__m"></i>' +
        '<span class="calc__t">' + st + '</span></li>';
    }).join('');
  }

  function runStages(stages, work, done) {
    var box = el('calc');
    box.innerHTML = stageListHtml(stages);
    box.classList.remove('hidden');
    var nodes = all('#calc .calc__s');
    var i = 0;
    (function step() {
      if (i >= stages.length) { done(); return; }
      var node = nodes[i];
      node.classList.add('is-now');
      var t0 = Date.now();
      work[i]();                                   /* настоящая операция */
      var rest = reduced ? 0 : Math.max(0, STAGE_MS - (Date.now() - t0));
      setTimeout(function () {
        node.classList.remove('is-now');
        node.classList.add('is-done');
        i++;
        step();
      }, rest);
    })();
  }

  /* --- Большая тройка ------------------------------------------------------
     Один блок, а не три карточки подряд. Три карточки читаются как три
     независимых результата, а это одна конфигурация: что человек есть, что
     он чувствует и каким его видят. Поэтому у каждой строки есть подпись
     роли — без неё «Телец, Телец, Рак» не складывается ни во что.

     Строка Асцендента остаётся на месте и без него: тройка из двух
     элементов выглядит как поломка, а не как следствие незаполненного поля. */
  function big3Html() {
    var n = S.natal;
    var row = function (key, label, role, sign, text) {
      var head = sign
        ? '<span class="b3__sign">' + C.signs[sign.index] + '</span>' +
          '<span class="b3__deg">' + deg(sign.degree) + '</span>'
        /* Причина отсутствия Асцендента бывает разная, и называть надо ту,
           которая есть: без времени рождения — одно, с временем, но без
           координат (ручной ввод места) — другое. Раньше во втором случае
           здесь стояло «нужно время рождения», хотя время человек указал. */
        : '<span class="b3__none">' +
          (!S.time.known ? C.s3.ascEmptyShort : C.s3.ascEmptyPlace) + '</span>';
      return '<div class="b3__r b3__r--' + key + (sign ? '' : ' b3__r--empty') + '">' +
        '<div class="b3__k">' + label + '</div>' +
        '<div class="b3__v">' + head + '</div>' +
        '<div class="b3__role">' + role + '</div>' +
        (text ? '<p class="b3__t">' + text + '</p>' : '') +
        '</div>';
    };
    return '<p class="b3__lead">' + C.s3.big3Lead + '</p>' +
      row('sun', C.map.sun, C.s3.roleSun, n.sun, C.sun[n.sun.index]) +
      row('moon', C.map.moon, C.s3.roleMoon, n.moon, C.moon[n.moon.index]) +
      row('asc', C.map.asc, C.s3.roleAsc, n.asc, n.asc ? C.asc[n.asc.index] : '');
  }

  function calcChart() {
    var city = S.city;
    var parts = {
      y: S.dob.y, m: S.dob.m, d: S.dob.d,
      h: S.time.known ? S.time.h : 12,
      min: S.time.known ? S.time.min : 0,
      timeKnown: S.time.known
    };
    var willHaveAsc = !!(S.time.known && city &&
      typeof city.lat === 'number' && typeof city.lon === 'number');

    /* Расчёт разобран на те же четыре шага, что подписаны на экране, и
       каждый шаг действительно выполняется на своей стадии. Собрать всё
       одним вызовом A.chart() было бы проще, но тогда подписи описывали бы
       работу, которая уже закончилась до появления первой строки.

       Результат обязан совпадать с A.chart() до последнего знака — это
       проверяется тестом на наборе городов и дат. */
    var jd = null, out = { jd: null, sunLon: null, moonLon: null };
    var stages = [C.s3.stageTz, C.s3.stageSun, C.s3.stageMoon];
    var work = [
      function () {
        var utc = FC.toUTC(parts.y, parts.m, parts.d, parts.h, parts.min, city);
        var dayStart = Date.UTC(parts.y, parts.m - 1, parts.d, 0, 0, 0);
        jd = A.julianDay(parts.y, parts.m, parts.d, (utc.getTime() - dayStart) / 3600000);
        out.jd = jd;
      },
      function () { out.sunLon = A.sunLongitude(jd); out.sun = A.signOf(out.sunLon); },
      function () { out.moonLon = A.moonLongitude(jd); out.moon = A.signOf(out.moonLon); }
    ];
    if (willHaveAsc) {
      stages.push(C.s3.stageAsc);
      work.push(function () {
        out.ascLon = A.ascendant(jd, city.lat, city.lon).asc;
        out.asc = A.signOf(out.ascLon);
      });
    }
    work.push(function () { S.natal = out; });
    stages.push(C.s3.stageDone);

    el('cta').disabled = true;

    runStages(stages, work, function () {
      persist();
      el('calc').classList.add('hidden');
      drawMap(el('s3map'), false);
      el('s3map').classList.remove('hidden');
      el('big3').innerHTML = big3Html();
      el('big3').classList.remove('hidden');
      scrollToBlock(el('s3map'));

      var notes = [];
      if (!willHaveAsc) {
        notes.push(S.time.known ? C.s3.cityManualNote : C.s3.unknownNote);
      }
      if (S.natal.moon.nearCusp || (S.natal.asc && S.natal.asc.nearCusp)) {
        notes.push(C.s3.cuspNote);
      }
      el('s3note').textContent = notes.join(' ');
      el('s3note').classList.toggle('hidden', !notes.length);

      el('cta').textContent = C.ctaNext;
      el('cta').disabled = false;
    });
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
    /* Партнёр без времени рождения: Луну считаем на полдень его дня. Пояс
       берём от города пользователя только если он числовой (ручной ввод);
       для IANA-строки смещение зависит от даты, а тут важна не минута, и
       экран об этом честно предупреждает. */
    var pTz = (S.city && typeof S.city.tz === 'number') ? S.city.tz : 0;
    var p = A.chartDateOnly(S.partner, pTz);
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

  /* --- превью продукта -----------------------------------------------------
     Три раздела продукта на данных этого человека, посчитанные тем же кодом,
     что и сам продукт. Здесь человек впервые видит, что покупает приложение,
     а не текст.

     ЗАПЕРТО НЕ ВСЁ. Запирать всё подряд — приём, от которого продукт
     выглядит дешёвым квизом: непонятно, что там вообще. Видно, ЧТО есть, и
     закрыта глубина: сколько ещё транзитов, список аспектов, даты
     разворотов. */
  var pvData = null, pvTab = 'today';

  var PV_TABS = ['today', 'chart', 'retro'];

  function pvStart() {
    if (!PV || !S.natal || !S.city) { return; }
    PV.ensure(function (ok) {
      if (!ok) { return; }
      pvCompute();
      if (S.screen === 's5') { pvRender(); }
    });
  }

  function pvCompute() {
    if (!PV || pvData || !S.city) { return; }
    var p = { y: S.dob.y, m: S.dob.m, d: S.dob.d,
              h: S.time.known ? S.time.h : 12,
              min: S.time.known ? S.time.min : 0 };
    var utc = FC.toUTC(p.y, p.m, p.d, p.h, p.min, S.city);
    var lat = typeof S.city.lat === 'number' ? S.city.lat : null;
    var lon = typeof S.city.lon === 'number' ? S.city.lon : null;
    try {
      pvData = PV.compute(utc, lat, lon, S.time.known && lat !== null, new Date());
    } catch (e) {
      console.warn('astromap: превью не посчиталось', e);
      pvData = null;
    }
  }

  function pvName(n) { return (C.pv.points[n] || n); }
  function pvCode(n) { return (C.pv.codes[n] || n.slice(0, 2)); }

  function pvToneTag(tone) {
    return '<span class="pv__tone pv__tone--' + tone + '">' + C.pv.tone[tone] + '</span>';
  }

  /* Локализованное число дней: «через 3 дня» собирается из шаблона, а не
     склеивается из слова и цифры — в польском и русском форма зависит от
     числа, и склейка даёт «через 3 дней». */
  function pvInDays(date) {
    var days = Math.max(0, Math.round((date - new Date()) / 86400000));
    if (days === 0) { return C.pv.today; }
    if (days === 1) { return C.pv.tomorrow; }
    return C.pv.inDays.replace('{n}', days);
  }

  function pvTodayHtml(d) {
    var rows = [];
    rows.push('<div class="pv__row"><span class="pv__k">' + C.pv.moonNow + '</span>' +
      '<span class="pv__v">' + C.moonPhase[d.moon.phaseIndex] + ' · ' +
      C.signs[d.moon.sign.index] + '</span></div>');
    rows.push('<div class="pv__row"><span class="pv__k">' + C.pv.illum + '</span>' +
      '<span class="pv__v">' + Math.round(d.moon.illum * 100) + '%</span></div>');
    if (d.signChange) {
      rows.push('<div class="pv__row"><span class="pv__k">' + C.pv.moonShift + '</span>' +
        '<span class="pv__v">' + C.signs[d.signChange.to.index] + ' · ' +
        pvInDays(d.signChange.date) + '</span></div>');
    }

    /* ТЕСНЫЕ, А НЕ ВСЕ. activeTransits отдаёт всё, что попало в орбис
       аспекта, — на обычной карте это под шестьдесят штук, и число «57
       активных» не значит ничего: половина из них в пяти градусах от
       точности и не чувствуется. Берём орбис до трёх градусов — это
       примерно двадцать, и каждый из них действительно тесный. */
    var close = d.transits.filter(function (t) { return t.orb < 3; });

    /* Строка собрана так, чтобы не склонять названия: «Солнце · тригон ·
       Солнце», а чья это точка — подписью ниже. Шаблон вида «в тригоне к
       твоему {точка}» в польском ломается на каждом втором слове: Słońce
       среднего рода, Księżyc мужского, Wenus женского, и одного «Twoim» на
       всех не бывает. */
    var top = close.slice(0, 2).map(function (t) {
      return '<li class="pv__t"><span class="pv__tmain"><b>' + pvName(t.transit) + '</b>' +
        '<span class="pv__asp">' + C.pv.aspects[t.aspect] + '</span>' +
        '<b>' + pvName(t.natal) + '</b></span>' +
        pvToneTag(t.tone) +
        '<span class="pv__tmeta">' + C.pv.fromSky + ' → ' + C.pv.toChart +
        ' · ' + C.pv.orb + ' ' + deg(t.orb) + '</span></li>';
    }).join('');

    var rest = Math.max(0, close.length - 2);
    return '<div class="pv__rows">' + rows.join('') + '</div>' +
      '<h3 class="pv__h3">' + C.pv.activeNow.replace('{n}', close.length) + '</h3>' +
      '<ul class="pv__list">' + top + '</ul>' +
      (rest ? pvLocked(C.pv.lockTransits.replace('{n}', rest)) : '');
  }

  function pvChartHtml(d) {
    var pts = d.natal.points.filter(function (p) { return p.name !== 'Node'; })
      .map(function (p) { return { key: p.name.toLowerCase(), lon: p.lon, short: pvCode(p.name) }; });
    if (d.natal.asc) {
      pts.push({ key: 'asc', lon: d.natal.asc.lon, short: pvCode('ASC') });
      pts.push({ key: 'mc', lon: d.natal.mc.lon, short: pvCode('MC') });
    }
    var aria = pts.map(function (p) { return p.short; }).join(', ');
    /* Считаем то, что нарисовано, а не длину массива points: в нём есть
       Узел, которого на колесе нет, и нет осей, которые есть. Цифра, не
       сходящаяся с картинкой рядом, — первое, за что цепляется глаз. */
    var counts = [
      [C.pv.planets, String(pts.length)],
      [C.pv.aspectsN, String(d.aspects.length)],
      [C.pv.housesN, d.natal.houses ? '12' : C.pv.noHouses]
    ].map(function (r) {
      return '<div class="pv__row"><span class="pv__k">' + r[0] + '</span>' +
        '<span class="pv__v">' + r[1] + '</span></div>';
    }).join('');

    return '<div class="mapbox mapbox--pv">' +
      W.render({ points: pts, signs: C.signs, aria: aria }) + '</div>' +
      '<div class="pv__rows">' + counts + '</div>' +
      pvLocked(C.pv.lockChart);
  }

  function pvRetroHtml(d) {
    if (!d.retro.length) {
      return '<p class="pv__empty">' + C.pv.noRetro + '</p>' + pvLocked(C.pv.lockRetro);
    }
    var list = d.retro.map(function (r) {
      return '<li class="pv__t"><span class="pv__tmain"><b>' + pvName(r.body) + '</b> ' +
        C.pv.inSign.replace('{s}', C.signs[r.sign.index]) + '</span>' +
        '<span class="pv__tmeta">' + C.pv.retroNow + '</span></li>';
    }).join('');
    return '<h3 class="pv__h3">' + C.pv.retroTitle.replace('{n}', d.retro.length) + '</h3>' +
      '<ul class="pv__list">' + list + '</ul>' + pvLocked(C.pv.lockRetro);
  }

  function pvLocked(text) {
    return '<p class="pv__lock"><span class="pv__lockicon" aria-hidden="true"></span>' + text + '</p>';
  }

  function pvRender() {
    var box = el('pv');
    if (!box || !pvData) { return; }
    el('pvH').textContent = C.pv.title;
    el('pvSub').textContent = C.pv.sub;
    el('pvTabs').innerHTML = PV_TABS.map(function (k) {
      return '<button type="button" class="pv__tab' + (k === pvTab ? ' on' : '') +
        '" data-pvtab="' + k + '" role="tab" aria-selected="' + (k === pvTab) + '">' +
        C.pv.tabs[k] + '</button>';
    }).join('');
    var body = pvTab === 'chart' ? pvChartHtml(pvData)
             : pvTab === 'retro' ? pvRetroHtml(pvData)
             : pvTodayHtml(pvData);
    el('pvBody').innerHTML = body;
    box.classList.remove('hidden');
    all('#pvTabs [data-pvtab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-pvtab');
        if (k === pvTab) { return; }
        pvTab = k;
        pvRender();
      });
    });
  }

  /* --- экран 5: сводка --------------------------------------------------- */
  function themeNames() {
    return S.themes.map(function (k) {
      var f = null;
      C.s2.themes.forEach(function (t) { if (t.k === k) { f = t.t; } });
      return f;
    }).filter(Boolean);
  }

  /* Полная карта, когда ядро продукта успело загрузиться, и трёхточечная,
     когда нет: на пятом экране человек должен увидеть максимум того, что
     посчитано, но ждать загрузки ради этого не должен. */
  function fullMapPoints() {
    if (!pvData) { return null; }
    var pts = pvData.natal.points.filter(function (p) { return p.name !== 'Node'; })
      .map(function (p) { return { key: p.name.toLowerCase(), lon: p.lon, short: pvCode(p.name) }; });
    if (pvData.natal.asc) {
      pts.push({ key: 'asc', lon: pvData.natal.asc.lon, short: pvCode('ASC') });
      pts.push({ key: 'mc', lon: pvData.natal.mc.lon, short: pvCode('MC') });
    }
    return pts;
  }

  function drawAssembled(node) {
    if (!node || !W) { return; }
    var pts = fullMapPoints() || mapPoints();
    node.innerHTML = W.render({
      points: pts, signs: C.signs,
      aria: pts.map(function (p) { return p.short; }).join(', ')
    });
  }

  /* --- экран 5: карта собрана ---------------------------------------------
     Раньше здесь была таблица из пяти строк «ключ — значение» — сводка
     формы, которая читается как страница подтверждения заказа. Теперь это
     кульминация: круг, который человек строил четыре экрана, его основа,
     его фокус и небо над картой прямо сейчас.

     Блок «небо сейчас» появляется только если ядро продукта загрузилось:
     выдумывать эти величины нечем, а без них экран остаётся осмысленным. */
  function sumSection(title, body) {
    return '<section class="sum__s"><h2 class="sum__h">' + title + '</h2>' + body + '</section>';
  }

  function coreHtml() {
    var n = S.natal;
    var row = function (label, sign, fallback) {
      return '<div class="sum__core"><span class="sum__ck">' + label + '</span>' +
        '<span class="sum__cv">' + (sign
          ? C.signs[sign.index] + ' <i>' + deg(sign.degree) + '</i>'
          : '<em>' + fallback + '</em>') + '</span></div>';
    };
    return row(C.map.sun, n.sun) + row(C.map.moon, n.moon) +
      row(C.map.asc, n.asc, S.time.known ? C.s3.ascEmptyPlace : C.s3.ascEmptyShort);
  }

  function focusHtml() {
    return '<div class="sum__chips">' + themeNames().map(function (t) {
      return '<span class="sum__chip">' + t + '</span>';
    }).join('') + '</div>';
  }

  function skyNowHtml() {
    if (!pvData) { return ''; }
    var d = pvData;
    var close = d.transits.filter(function (t) { return t.orb < 3; });
    var rows = [
      [C.pv.moonNow, C.moonPhase[d.moon.phaseIndex] + ' · ' + C.signs[d.moon.sign.index]],
      [C.s5.closeNow, String(close.length)]
    ];
    if (d.signChange) {
      rows.push([C.pv.moonShift, C.signs[d.signChange.to.index] + ' · ' + pvInDays(d.signChange.date)]);
    }
    if (d.retro.length) {
      rows.push([C.s5.retroNow, d.retro.map(function (r) { return pvName(r.body); }).join(', ')]);
    }
    return '<div class="pv__rows">' + rows.map(function (r) {
      return '<div class="pv__row"><span class="pv__k">' + r[0] + '</span>' +
        '<span class="pv__v">' + r[1] + '</span></div>';
    }).join('') + '</div><p class="sum__note">' + C.s5.skyNote + '</p>';
  }

  function pairHtml() {
    if (!S.syn) { return ''; }
    var band = bandFor(S.syn.score);
    return '<div class="sum__pair"><span class="sum__pn">' + S.syn.score + '%</span>' +
      '<span class="sum__pt"><b>' + band.t + '</b>' +
      C.signs[S.partnerChart.sun.index] + '</span></div>' +
      '<p class="sum__note">' + C.s4.scoleFoot + '</p>';
  }

  function buildSummary() {
    if (PV && PV.isReady()) { pvCompute(); pvRender(); }
    drawAssembled(el('s5map'));
    var html = sumSection(C.s5.coreTitle, coreHtml()) +
      sumSection(C.s5.focusTitle, focusHtml());
    var sky = skyNowHtml();
    if (sky) { html += sumSection(C.s5.skyTitle, sky); }
    if (S.syn) { html += sumSection(C.s5.pairTitle, pairHtml()); }
    el('sum').innerHTML = html;
  }

  /* --- экран 6: пейволл --------------------------------------------------- */
  /* --- экран 6: пейволл ----------------------------------------------------
     Продаёт доступ к системе, а не текст. Раньше четыре пункта списка
     описывали reading.html — три позиции, выбранные разделы, недельный
     прогноз, разбор пары, — а деньги открывают продукт с восемью разделами.
     Человек платил за одно и получал другое.

     Теперь на экране его карта, его небо и перечень того, что открывается.
     Перечислено только существующее: каждая строка соответствует разделу,
     который в продукте есть и работает. Добавлять сюда что-либо, чего нет,
     нельзя — это и есть обещание, за которое берут деньги. */
  function pwMovesHtml() {
    if (!pvData) { return ''; }
    var d = pvData;
    var close = d.transits.filter(function (t) { return t.orb < 3; });
    var items = [[String(close.length), C.pw.movesAspects]];
    if (d.signChange) {
      items.push([pvInDays(d.signChange.date), C.pw.movesMoon.replace('{s}', C.signs[d.signChange.to.index])]);
    }
    if (d.retro.length) { items.push([String(d.retro.length), C.pw.movesRetro]); }
    return '<h2 class="pw__h">' + C.pw.movesTitle + '</h2>' +
      '<div class="pw__grid">' + items.map(function (i) {
        return '<div class="pw__cell"><span class="pw__n">' + i[0] + '</span>' +
          '<span class="pw__l">' + i[1] + '</span></div>';
      }).join('') + '</div>' +
      '<p class="pw__note">' + C.pw.movesNote + '</p>';
  }

  function buildPaywall() {
    /* Именная строка: их позиции, а не общий заголовок. */
    var n = S.natal;
    var parts = [C.map.sun + ' ' + C.signs[n.sun.index],
                 C.map.moon + ' ' + C.signs[n.moon.index]];
    if (n.asc) { parts.push(C.map.asc + ' ' + C.signs[n.asc.index]); }
    el('pwMe').textContent = parts.join(' · ');
    drawAssembled(el('pwMap'));
    el('pwMoves').innerHTML = pwMovesHtml();

    /* Фокус назван на пейволле, потому что он теперь действительно доезжает
       до продукта: там он решает, что показано первым в «Сегодня» и на какой
       области открывается проводник транзитов. До этого патча такой строки
       здесь быть не могло — вопрос задавался и забывался. */
    el('inc').innerHTML =
      '<p class="pw__focus">' + C.pw.focusLine.replace('{areas}', themeNames().join(' · ')) + '</p>' +
      '<h2 class="pw__h">' + C.pw.opensTitle + '</h2>' +
      C.pw.opens.map(function (o) {
        return '<div class="inc__i"><i class="inc__d"></i><span class="inc__t">' +
          '<b>' + o.t + '</b>' + o.d + '</span></div>';
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
  /* --- экран 7: ответ по существу возражения -------------------------------
     Раньше экран отвечал абзацем на любой из четырёх ответов и в любом
     случае показывал годовой план. Скидка в ответ на «просто смотрю» — это
     не работа с возражением, а давление, и человек это читает именно так.

     Теперь на каждое возражение свой ответ, и годовой план виден только
     тому, кого остановила цена:

       цена        — годовой план с честным пересчётом
       не понимаю  — что именно открывается, списком
       не уверен   — его собственные посчитанные позиции и чем их проверить
       смотрю      — честный выход: бесплатное чтение, карта сохранена

     Ни один путь не заперт: кнопка «назад к плану» остаётся на месте. */
  function rcOpensHtml() {
    return '<ul class="rc__list">' + C.pw.opens.map(function (o) {
      return '<li><b>' + o.t + '</b>' + o.d + '</li>';
    }).join('') + '</ul>';
  }

  function rcProofHtml() {
    var n = S.natal;
    var rows = [[C.map.sun, C.signs[n.sun.index] + ' ' + deg(n.sun.degree)],
                [C.map.moon, C.signs[n.moon.index] + ' ' + deg(n.moon.degree)]];
    if (n.asc) { rows.push([C.map.asc, C.signs[n.asc.index] + ' ' + deg(n.asc.degree)]); }
    return '<div class="pv__rows">' + rows.map(function (r) {
      return '<div class="pv__row"><span class="pv__k">' + r[0] + '</span>' +
        '<span class="pv__v">' + r[1] + '</span></div>';
    }).join('') + '</div>';
  }

  function rcLookHtml() {
    /* Выход, а не ловушка. Ссылка на бесплатное чтение ведёт на настоящую
       страницу разбора — она и так открыта всем, и притворяться, что это
       подарок за отказ, незачем. */
    return '<div class="acts"><a class="rc__go" href="reading.html">' +
      C.recovery.readFree + '</a></div>';
  }

  /* Экран восстановления: годовой план и ничего кроме.

     Раньше здесь стоял опрос «что вас остановило», и от ответа зависело,
     что показать: цена — годовой план, остальное — абзац по существу. Между
     отказом от месячного и годовым предложением был, таким образом, лишний
     шаг. По требованию он убран целиком: отказ ведёт прямо к годовому.

     rcOpensHtml/rcProofHtml/rcLookHtml остались на месте — они собирают
     содержимое из тех же данных и понадобятся, если опрос решат вернуть;
     ни один из них сейчас не вызывается. */
  function buildRecovery() {
    el('onePrice').textContent = C.billing.yearPrice + ' ' + C.billing.yearPeriod;
    el('oneDisc').textContent = C.billing.yearDisclaimer;
    el('legalYear').innerHTML = legalHtml(C.recovery.yearCta);
  }

  /* --- навигация --------------------------------------------------------- */
  el('cta').addEventListener('click', function () {
    if (S.screen === 's1') { go('s2'); return; }
    if (S.screen === 's2') { go('s3'); return; }
    if (S.screen === 's3') {
      if (!S.natal) { calcChart(); }
      else {
        /* Ядро продукта весит около 70 КБ в gzip — грузим его здесь, когда
           карта уже посчитана и человек уходит на следующий экран. К пятому
           экрану загрузка обычно закончена; если нет, сводка показывается
           без превью и оно появляется, когда будет готово. */
        pvStart();
        go('s4');
      }
      return;
    }
    if (S.screen === 's4') { buildSummary(); pvStart(); go('s5'); return; }
    if (S.screen === 's5') { buildPaywall(); go('s6'); return; }
    if (S.screen === 's6') {
      if (CHECKOUT_URL) { window.location.href = CHECKOUT_URL; }
      else { noCheckout('CHECKOUT_URL'); }
      return;
    }
    if (S.screen === 's7') {
      if (CHECKOUT_URL_YEAR) { window.location.href = CHECKOUT_URL_YEAR; }
      else { noCheckout('CHECKOUT_URL_YEAR'); }
    }
  });

  el('ghost').addEventListener('click', function () {
    if (S.screen === 's4') { S.syn = null; buildSummary(); pvStart(); go('s5'); return; }
    if (S.screen === 's6') {
      /* Годового тира в Gumroad нет, значит s7 показывать нельзя: экран
         обещает 29,99 за год и ведёт на кнопку, которой некуда вести. Пока
         CHECKOUT_URL_YEAR пуст, «не сейчас» — это честный выход в бесплатное
         чтение, ровно тот, что описан в README. Впишешь ссылку — вернётся
         прежний путь s6 → s7. */
      if (!CHECKOUT_URL_YEAR) {
        document.dispatchEvent(new CustomEvent('funnel:decline',
          { detail: { from: 's6', to: 'reading', plan: 'monthly' } }));
        window.location.href = 'reading.html';
        return;
      }
      /* Отказ от месячного плана ведёт прямо к годовому. Событие оставлено
         здесь, потому что раньше отказ отслеживался ответом в опросе, а
         опроса больше нет: без этой строки переход s6 → s7 не виден
         аналитике вовсе. */
      document.dispatchEvent(new CustomEvent('funnel:decline',
        { detail: { from: 's6', to: 's7', plan: 'monthly' } }));
      /* Переход выполняется, даже если сборка содержимого упала. Иначе любая
         ошибка внутри buildRecovery (например, недостающий ключ в локали)
         останавливала бы обработчик ДО go(), и снаружи это выглядело бы
         ровно как «кнопка не работает»: экран не меняется, ошибка молча
         уходит в консоль, которой на телефоне никто не видит. */
      try { buildRecovery(); }
      catch (e) { console.error('astromap: не собрался экран годового плана', e); }
      go('s7');
      return;
    }
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
  /* Кнопка с текущим кодом раскрывает список родных названий — десяти
     языкам рядных пилюль не хватит. Устроено так же, как в продукте. */
  (function bindLang() {
    var toggle = el('langToggle'), menu = el('langMenu');
    if (!toggle || !menu) { return; }
    toggle.textContent = window.LANG.toUpperCase();
    function close() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    all('.langmenu__item').forEach(function (b) {
      var code = b.getAttribute('data-lang');
      b.classList.toggle('on', code === window.LANG);
      b.setAttribute('aria-selected', code === window.LANG ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (code === window.LANG) { close(); return; }
        try { localStorage.setItem('astromap.lang', code); } catch (e) {}
        location.reload();
      });
    });
    document.addEventListener('click', function (ev) {
      if (!menu.hidden && !menu.contains(ev.target) && ev.target !== toggle) { close(); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !menu.hidden) { close(); toggle.focus(); }
    });
  })();

  progress('s1');
  dock('s1');
})();
