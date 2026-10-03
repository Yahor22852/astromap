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
/* Те же две ссылки продублированы в <head> index.html (передача из
   встроенного браузера TikTok) — меняешь здесь, меняй и там. */
var CHECKOUT_URL = 'https://astromap.gumroad.com/l/astromap?monthly=true&wanted=true';
                                  /* подписка: месячный план, $9.99/мес.
                                     ?wanted=true открывает чекаут сразу, минуя
                                     страницу товара — человек уже принял решение
                                     на пейволле, второй экран с той же ценой
                                     только отдаёт его обратно в раздумья. */
var CHECKOUT_URL_YEAR = 'https://astromap.gumroad.com/l/astromap?yearly=true&wanted=true';
                                  /* годовой план, $29.99/год с автопродлением.
                                     Это НЕ отдельный товар, а вариант списания
                                     того же membership-товара (тир Full access):
                                     ?monthly=true / ?yearly=true выбирают
                                     периодичность. Отдельным товаром его делать
                                     нельзя: ?wanted=true кладёт товар в
                                     серверную корзину Gumroad, и два разных
                                     товара там складываются — человек платит
                                     за оба плана сразу. Один товар в корзине
                                     лежит одной позицией, и повторный заход
                                     лишь переключает её периодичность. */
var TERMS_URL = 'https://docs.google.com/document/d/1GuEKF2tU3MG_ZUZqJnA7B27-OxGCoWB95aGkWyI8u9I/edit?usp=sharing';
                                  /* Terms of Use (Google Docs) */
var PRIVACY_URL = 'https://docs.google.com/document/d/1J_HDyOfxye2w8JvKNG8ytiDkBXFHsuDFKQYHbj4ALh0/edit?usp=sharing';
                                  /* Privacy Policy (Google Docs) */
var SUPPORT_EMAIL = 'hello@astromap.me';
                                  /* Те же три значения лежат в начале
                                     product/js/app.js — меняешь здесь,
                                     меняй и там. */

(function () {
  'use strict';

  /* Страница уже уходит на чекаут (передача из TikTok, см. <head>):
     ничего не рисуем и, главное, ничего не пишем в хранилище. */
  if (window.ASTROMAP_HANDOFF || window.ASTROMAP_FRAMED) { return; }

  var C = window.COPY;
  var A = window.Astro;
  /* Вариант эксперимента (см. <head> index.html): 'a' — эта воронка,
     'q2' — квиз v2 из js/quiz.js. В варианте q2 экраны s1–s5 здесь не
     открываются, а общая часть — оплата, TikTok, язык, шаги — отдаётся
     квизу через window.AstroFlow в конце файла. */
  var V2 = window.ASTROMAP_VARIANT === 'q2';
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

  /* Отметка «ушёл на оплату». По ней следующий заход на astromap.me ведёт
     не в квиз, а на гейт продукта в режиме «ключ пришёл на почту» (см.
     скрипт в <head> index.html и paidModeRequested() в product/js/app.js).
     Гейт стирает отметку после успешного входа. sessionStorage — метка этой
     вкладки: возврат «Назад» с чекаута на гейт не уводит. */
  function markCheckout(plan) {
    try {
      localStorage.setItem('astromap.checkout', JSON.stringify({ plan: plan, at: Date.now() }));
      sessionStorage.setItem('astromap.checkoutTab', '1');
    } catch (e) { /* приватный режим — без отметки, гейт просто в обычном режиме */ }
  }

  /* --- оплата из встроенного браузера TikTok --------------------------
     TikTok не пускает свой браузер на платёжные страницы: переход на
     gumroad.com заканчивался его экраном «Открой ссылку в своём браузере».
     Оттуда два выхода, и оба плохие: «••• → Открыть в браузере» отдаёт
     Safari ИСХОДНУЮ ссылку из профиля (проверено на телефоне — ни подмена
     адреса, ни перезагрузка на другом адресе её не меняют), то есть
     человек начинает квиз заново; а схемы x-safari-https:// и intent://
     TikTok глушит молча.

     Поэтому внутри TikTok чекаут открывается не переходом, а окном поверх
     страницы — тем же iframe, которым пользуется официальный overlay
     Gumroad (gumroad.js: тот же адрес товара с overlay=true). TikTok
     блокирует переходы всей страницы, а не содержимое iframe; заголовков,
     запрещающих встраивание, Gumroad не ставит. Человек остаётся на
     astromap.me, и его ответы — тоже.

     Если окно всё же не загрузится, внизу запасной путь: «Скопировать
     ссылку». В ней ответы квиза (?go=<план>&h=...), и открытая в
     Safari/Chrome она восстанавливает их и сразу ведёт на чекаут — это
     делает скрипт в <head> index.html. */
  function handoffUrl(plan) {
    var f = null;
    try { f = JSON.parse(localStorage.getItem('astromap.funnel') || 'null'); } catch (e) { f = null; }
    var json = JSON.stringify({ f: f, l: window.LANG });
    var bytes = new TextEncoder().encode(json), bin = '';
    for (var i = 0; i < bytes.length; i++) { bin += String.fromCharCode(bytes[i]); }
    var h = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return location.origin + location.pathname + '?go=' + plan + '&h=' + h;
  }

  /* Apple Pay на iPhone, Google Pay на остальных — название кнопки и
     инструкции. Внутри TikTok недоступны оба (см. README), кнопка ведёт в
     настоящий браузер. */
  var WALLET = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? 'Apple Pay' : 'Google Pay';
  var HANDOFF_API = 'https://astromap-visits.egorrut3030.workers.dev';
  /* Проверка без деплоя: localStorage astromap.qa.api — адрес локального
     воркера. Принимается только http://localhost, чтобы чужая страница не
     могла подменить адрес и увести ответы квиза. */
  try {
    var qaApi = localStorage.getItem('astromap.qa.api');
    if (qaApi && /^http:\/\/localhost:\d+$/.test(qaApi)) { HANDOFF_API = qaApi; }
  } catch (e) {}

  /* Отпечаток устройства для передачи оплаты: то, что у встроенного
     браузера TikTok и у Safari/Chrome на одном телефоне совпадает. Не
     язык (TikTok подставляет свой), не модель из user-agent (Chrome на
     Android её прячет). Подробно — в cf-worker/visits.js, раздел handoff. */
  function deviceFp() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var sw = Math.min(screen.width, screen.height), sh = Math.max(screen.width, screen.height);
    return [WALLET, sw + 'x' + sh, window.devicePixelRatio || 1, screen.colorDepth || 0, tz,
      navigator.hardwareConcurrency || 0, navigator.maxTouchPoints || 0].join('|');
  }

  /* Грубый отпечаток — то, что Safari 26 со своей защитой от отпечатков
     (Advanced Fingerprinting Protection, включена по умолчанию) не
     искажает: тип телефона и часовой пояс. По нему одному данные не
     отдаются — только кнопка «Продолжить оплату» (см. воркер). */
  function coarseFp() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    return WALLET + '|' + tz;
  }

  function handoffData() {
    var f = null;
    try { f = JSON.parse(localStorage.getItem('astromap.funnel') || 'null'); } catch (e) { f = null; }
    return JSON.stringify({ f: f, l: window.LANG });
  }

  function apiPost(path, body, timeoutMs) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 4000) : null;
    return fetch(HANDOFF_API + path, {
      method: 'POST', body: JSON.stringify(body), keepalive: true,
      headers: { 'Content-Type': 'text/plain' }, signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.json(); }).finally(function () { if (timer) { clearTimeout(timer); } });
  }

  /* --- шаги воронки для сводки /stats -----------------------------------
     Каждый шаг уходит в воркер один раз за вкладку (sessionStorage): смена
     языка и «Назад» с чекаута его не повторяют, поэтому число на шаге —
     это вкладки, дошедшие до него, а не нажатия. Отправляется только имя
     шага — ни ответов, ни идентификатора. Список шагов закреплён в
     воркере (FUNNEL_STEPS), чужое имя он отбросит. */
  function track(step) {
    try {
      if (window.ASTROMAP_LEAVING) { return; }
      /* Тестовые проходы (?src=test…, localhost — см. <head>) в шаги не
         попадают: раньше заходы с ними сводка отбрасывала, а шаги нет, и
         проверочный проход смешивался с живыми людьми. */
      if (window.ASTROMAP_TEST) { return; }
      var seen = JSON.parse(sessionStorage.getItem('astromap.steps') || '[]');
      if (seen.indexOf(step) >= 0) { return; }
      seen.push(step);
      sessionStorage.setItem('astromap.steps', JSON.stringify(seen));
      var blob = new Blob([JSON.stringify({ step: step })], { type: 'text/plain' });
      var u = HANDOFF_API + '/step';
      if (!(navigator.sendBeacon && navigator.sendBeacon(u, blob))) {
        fetch(u, { method: 'POST', body: blob, keepalive: true, mode: 'no-cors' }).catch(function () {});
      }
    } catch (e) { /* приватный режим — без счётчика */ }
  }

  function openEmbeddedCheckout(plan, url) {
    var T = C.paywall.inapp || window.COPY_ALL.en.paywall.inapp;
    markCheckout(plan);
    var old = el('paybox');
    if (old) { old.parentNode.removeChild(old); }
    var box = document.createElement('div');
    box.id = 'paybox';
    box.className = 'paybox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML =
      '<div class="paybox__bar">' +
        '<button type="button" class="paybox__close" id="payClose"></button>' +
      '</div>' +
      '<div class="paybox__walletrow">' +
        '<button type="button" class="paybox__wallet" id="payWallet"></button>' +
      '</div>' +
      '<div class="paybox__frame">' +
        '<div class="paybox__spin" id="paySpin" aria-hidden="true"></div>' +
        '<iframe id="payFrame" title="Gumroad checkout" allow="payment *"></iframe>' +
      '</div>' +
      '<div class="paybox__help"><a class="paybox__paid" id="payPaid" href="product/?paid=1"></a></div>';
    document.body.appendChild(box);
    document.body.style.overflow = 'hidden';
    el('payClose').textContent = '← ' + T.close;
    /* Кнопка в виде настоящих Apple Pay / Google Pay: на iPhone логотип —
       системный символ U+F8FF, его рисует сама iOS тем же шрифтом, что и в
       родной кнопке; на Android — цветная «G». Надпись не переводится, как
       и у оригинальных кнопок; для скринридера — подпись на языке воронки. */
    el('payWallet').innerHTML = WALLET === 'Apple Pay'
      ? '<span class="paybox__apple" aria-hidden="true">\uF8FF</span><span aria-hidden="true">Pay</span>'
      : '<svg class="paybox__g" viewBox="0 0 48 48" aria-hidden="true">' +
          '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
          '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
          '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
          '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
        '</svg><span aria-hidden="true">Pay</span>';
    el('payWallet').setAttribute('aria-label', T.wallet.replace('{w}', WALLET));
    el('payPaid').textContent = T.paid;
    var frame = el('payFrame');
    /* «Continue shopping» и подобные ссылки Gumroad ведут туда, откуда
       пришёл покупатель, — на astromap.me, и открывают его ВНУТРИ окна:
       воронка оказывалась вложенной сама в себя, док и шапка наезжали друг
       на друга. Чужой (gumroad.com) документ прочитать нельзя — обращение к
       его адресу бросает исключение; если адрес читается, значит, в окне
       уже наш сайт, и окно закрывается: человек и так на нужной странице. */
    frame.addEventListener('load', function () {
      el('paySpin').hidden = true;
      var ours = false, path = '';
      try {
        ours = frame.contentWindow.location.origin === location.origin;
        path = frame.contentWindow.location.pathname;
      } catch (e) { ours = false; }
      if (!ours) { return; }
      closePaybox();
      /* Ссылка из квитанции после оплаты ведёт в продукт. Перейти туда сами
         мы не можем — TikTok блокирует переходы без нажатия, — поэтому
         крупная кнопка: переход по нажатию он пропускает. */
      /* Адрес — явно с ?paid=1: продукт к моменту load уже стёр его из
         своей адресной строки, а без него гейт не в режиме «ключ на почте». */
      if (/^\/product\//.test(path)) { showAccessButton('product/?paid=1'); }
    });
    window.addEventListener('message', function onMsg(ev) {
      if (ev.origin !== location.origin || ev.data !== 'astromap:close-pay') { return; }
      window.removeEventListener('message', onMsg);
      closePaybox();
    });
    function showAccessButton(target) {
      var bar = document.createElement('div');
      bar.className = 'ttcont';
      bar.innerHTML = '<a class="cta ttcont__b"></a>';
      var link = bar.querySelector('a');
      link.href = target;
      link.textContent = T.paid;
      document.body.appendChild(bar);
      link.focus();
    }
    function closePaybox() {
      var b = el('paybox');
      if (b) { b.parentNode.removeChild(b); }
      document.body.style.overflow = '';
    }
    /* Одноразовый номер покупки: Gumroad вернёт его в Ping (url_params), и
       воркер по нему скажет этой странице «оплачено» — см. watchPurchase. */
    var sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, function () { return (Math.random() * 16 | 0).toString(16); });
    frame.src = withVariant(url) + '&overlay=true&astro_sid=' + sid;
    watchPurchase(sid);

    el('payWallet').addEventListener('click', function () { startWalletHandoff(plan); });
    el('payClose').addEventListener('click', function () {
      closePaybox();
      el('cta').focus();
    });
    el('payClose').focus();
    document.dispatchEvent(new CustomEvent('funnel:inapp', { detail: { plan: plan } }));
  }

  /* После оплаты в окне Gumroad пытается увести всю страницу на страницу
     доступа; без нажатия браузер это блокирует, и в окне остаётся «Sorry,
     something went wrong». Поэтому спрашиваем воркер, пришёл ли от Gumroad
     Ping с нашим номером покупки, — раз в 3 секунды, пока страница открыта,
     но не дольше 30 минут. Окно оплаты можно и закрыть: если оплата прошла
     в нём, экран «Оплата прошла» всё равно появится. */
  var purchaseTimer = null;
  function watchPurchase(sid) {
    if (purchaseTimer) { clearInterval(purchaseTimer); }
    var started = Date.now(), busy = false, finished = false;
    var check = function () {
      if (finished) { return; }
      if (Date.now() - started > 30 * 60 * 1000) { clearInterval(purchaseTimer); return; }
      if (busy) { return; }
      busy = true;
      apiPost('/purchase/status', { sid: sid }, 5000).then(function (r) {
        busy = false;
        if (!r || !r.paid || finished) { return; }
        finished = true;
        clearInterval(purchaseTimer);
        purchaseDone(r);
      }).catch(function () { busy = false; });
    };
    purchaseTimer = setInterval(check, 3000);
    /* Вернулся на страницу (например, из почты) — проверяем сразу. */
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { check(); } });
  }

  function purchaseDone(r) {
    var T = C.paywall.inapp || window.COPY_ALL.en.paywall.inapp;
    try {
      /* Продукт подставит их в форму входа (product/js/app.js, showGateOnly). */
      localStorage.setItem('astromap.prefill', JSON.stringify({
        email: r.email || '', licenseKey: r.licenseKey || '', at: Date.now()
      }));
    } catch (e) {}
    document.dispatchEvent(new CustomEvent('funnel:purchase', { detail: { inapp: true } }));
    var box = el('paybox');
    if (box) { box.parentNode.removeChild(box); }
    var help = el('walletHelp');
    if (help) { help.parentNode.removeChild(help); }
    document.body.style.overflow = '';
    var d = document.createElement('div');
    d.className = 'whelp whelp--done';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="whelp__card"><h2 class="whelp__t"></h2><p class="whelp__p"></p>' +
      '<a class="cta whelp__ok" href="product/?paid=1"></a></div>';
    document.body.appendChild(d);
    d.querySelector('.whelp__t').textContent = T.doneTitle;
    d.querySelector('.whelp__p').textContent = T.doneText;
    var go = d.querySelector('.whelp__ok');
    go.textContent = T.doneBtn;
    go.focus();
  }

  /* Кнопка «Оплатить через Apple Pay» внутри TikTok. Три вещи сразу, пока
     у нас есть нажатие: ссылка с ответами — в буфер обмена (запасной путь,
     если в браузере окажется другой IP), ответы и план — на воркер, и
     крупная инструкция, как открыть страницу в браузере. Ждать ответа
     воркера инструкция не ждёт: пока человек жмёт «•••», запрос успеет. */
  function startWalletHandoff(plan) {
    var T = C.paywall.inapp || window.COPY_ALL.en.paywall.inapp;
    var link = handoffUrl(plan);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).catch(function () { fallbackCopy(link); });
      } else { fallbackCopy(link); }
    } catch (e) { fallbackCopy(link); }
    apiPost('/handoff/put', { fp: deviceFp(), coarse: coarseFp(), plan: plan, data: handoffData() })
      .catch(function () { /* остаётся буфер обмена */ });
    document.dispatchEvent(new CustomEvent('funnel:wallet', { detail: { plan: plan, wallet: WALLET } }));

    var old = el('walletHelp');
    if (old) { old.parentNode.removeChild(old); }
    var h = document.createElement('div');
    h.id = 'walletHelp';
    h.className = 'whelp';
    h.setAttribute('role', 'dialog');
    h.setAttribute('aria-modal', 'true');
    h.setAttribute('aria-labelledby', 'whelpT');
    h.innerHTML =
      '<div class="whelp__arrow" aria-hidden="true"><span>•••</span>↗</div>' +
      '<div class="whelp__card">' +
        '<h2 class="whelp__t" id="whelpT"></h2>' +
        '<ol class="whelp__steps">' +
          '<li><b>1</b><span id="whelp1"></span></li>' +
          '<li><b>2</b><span id="whelp2"></span></li>' +
          '<li><b>3</b><span id="whelp3"></span></li>' +
        '</ol>' +
        '<button type="button" class="cta whelp__ok" id="whelpOk"></button>' +
      '</div>';
    document.body.appendChild(h);
    el('whelpT').textContent = T.wTitle.replace('{w}', WALLET);
    el('whelp1').textContent = T.wStep1;
    el('whelp2').textContent = T.wStep2;
    el('whelp3').textContent = T.wStep3;
    el('whelpOk').textContent = T.wOk;
    el('whelpOk').addEventListener('click', function () { h.parentNode.removeChild(h); });
    el('whelpOk').focus();
  }

  /* Тот же человек открыл ссылку из профиля в Safari/Chrome. Спрашиваем
     воркер: есть ожидающая оплата с этого телефона — восстанавливаем
     ответы и уходим на чекаут; есть только с этого устройства, но с
     другим IP — предлагаем кнопку, которая возьмёт ссылку из буфера;
     нет ничего — обычная воронка (и отложенная переадресация купивших). */
  function arrivalFromTikTok() {
    var T = C.paywall.inapp || window.COPY_ALL.en.paywall.inapp;
    var done = false;
    var fallback = function () {
      if (done) { return; }
      done = true;
      if (window.ASTROMAP_PAID_REDIRECT) { window.ASTROMAP_PAID_REDIRECT(); }
      if (V2) { if (window.AstroQuiz) { window.AstroQuiz.trackCurrent(); } }
      else if (S.screen === 's1') { track('s1'); }
    };
    var checked = false;
    try { checked = sessionStorage.getItem('astromap.tt.checked') === '1'; sessionStorage.setItem('astromap.tt.checked', '1'); } catch (e) {}
    if (checked) {
      try { localStorage.setItem('astromap.dbg.take', JSON.stringify({ at: new Date().toISOString().slice(11, 19), result: 'skipped: already checked in this tab' })); } catch (e) {}
      fallback(); return;
    }

    var note = function (what) {
      try {
        localStorage.setItem('astromap.dbg.take', JSON.stringify({
          at: new Date().toISOString().slice(11, 19), result: what, fp: deviceFp()
        }));
      } catch (e) {}
    };
    apiPost('/handoff/take', { fp: deviceFp(), coarse: coarseFp() }, 3500).then(function (r) {
      note(r ? (r.ok ? 'match' : r.confirm ? 'confirm' : r.hint ? 'hint (other IP)' : 'nothing found') : 'empty reply');
      if (done) { return; }
      if (r && r.ok && (r.plan === 'monthly' || r.plan === 'yearly')) {
        done = true;
        finishHandoff(r, T);
        return;
      }
      if (r && r.confirm && r.token) { done = true; showConfirmBanner(T, r.token); return; }
      if (r && r.hint) { done = true; showContinueBanner(T); return; }
      fallback();
    }).catch(function (e) { note('request failed: ' + (e && e.name)); fallback(); });
  }

  function finishHandoff(r, T) {
    var data = null;
    try { data = JSON.parse(r.data); } catch (e) { data = null; }
    try {
      if (data && data.f && data.f.dob && data.f.dob.y) {
        localStorage.setItem('astromap.funnel', JSON.stringify(data.f));
      }
      if (data && typeof data.l === 'string' && /^[a-z]{2}$/.test(data.l)) {
        localStorage.setItem('astromap.lang', data.l);
      }
    } catch (e) {}
    showOpening(T.opening);
    markCheckout(r.plan);
    /* Вариант — тот, в котором человек проходил квиз в TikTok (он едет в
       ответах), а не тот, что выпал этому браузеру. */
    var v = data && data.f && data.f.v === 'q2' ? 'q2' : 'a';
    location.replace(withVariant(r.plan === 'yearly' ? CHECKOUT_URL_YEAR : CHECKOUT_URL, v));
  }

  /* Совпали IP и грубый отпечаток: запись почти наверняка этого человека,
     но данные отдаём только по нажатию — так чужой заказ случайному
     человеку с тем же IP сам не откроется. */
  function showConfirmBanner(T, token) {
    var b = document.createElement('div');
    b.className = 'ttcont';
    b.innerHTML = '<p class="ttcont__t"></p><button type="button" class="cta ttcont__b"></button>';
    document.body.appendChild(b);
    b.querySelector('.ttcont__t').textContent = T.cont;
    var btn = b.querySelector('.ttcont__b');
    btn.textContent = T.contBtn;
    btn.addEventListener('click', function () {
      btn.disabled = true;
      apiPost('/handoff/claim', { fp: deviceFp(), coarse: coarseFp(), token: token }, 5000).then(function (r) {
        if (r && r.ok && (r.plan === 'monthly' || r.plan === 'yearly')) { finishHandoff(r, T); return; }
        b.parentNode.removeChild(b);
        if (window.ASTROMAP_PAID_REDIRECT) { window.ASTROMAP_PAID_REDIRECT(); }
      }).catch(function () { btn.disabled = false; });
    });
  }

  /* astromap.me/?fpdebug — что страница видит в этом браузере: открыть в
     TikTok и в Safari и сравнить. Строки отпечатков — в открытом виде,
     IP — только семейство и короткий хэш с воркера. */
  function fpDebug() {
    var box = document.createElement('pre');
    box.style.cssText = 'position:fixed;inset:auto 8px 8px 8px;z-index:99;max-height:60vh;overflow:auto;' +
      'padding:12px;margin:0;border-radius:12px;background:#fff;color:#000;font:12px/1.45 ui-monospace,Menlo,monospace;' +
      'white-space:pre-wrap;word-break:break-all;box-shadow:0 10px 30px rgba(0,0,0,.5)';
    var lines = [
      'in-app (TikTok etc): ' + !!window.ASTROMAP_INAPP,
      'src=tiktok in URL:   ' + /[?&]src=tiktok(&|$)/.test(location.search),
      'wallet:              ' + WALLET,
      'fp:      ' + deviceFp(),
      'coarse:  ' + coarseFp(),
      'UA: ' + navigator.userAgent,
      '— last handoff check (this browser):',
      '  ' + (localStorage.getItem('astromap.dbg.take') || 'none'),
      '— last landings (this browser):',
      '  ' + (localStorage.getItem('astromap.dbg.landings') || 'none').replace(/\},\{/g, '},\n  {'),
      'IP: …'
    ];
    box.textContent = lines.join('\n');
    document.body.appendChild(box);
    apiPost('/handoff/whoami', {}, 4000).then(function (r) {
      lines[lines.length - 1] = 'IP: ' + (r && r.ok ? r.family + ' #' + r.tag : 'нет ответа');
      box.textContent = lines.join('\n');
    }).catch(function () {
      lines[lines.length - 1] = 'IP: воркер не ответил';
      box.textContent = lines.join('\n');
    });
  }

  function showOpening(text) {
    var o = document.createElement('div');
    o.className = 'whelp whelp--busy';
    o.innerHTML = '<div class="whelp__card"><div class="paybox__spin paybox__spin--light"></div><p class="whelp__busy"></p></div>';
    document.body.appendChild(o);
    o.querySelector('.whelp__busy').textContent = text;
  }

  function showContinueBanner(T) {
    var b = document.createElement('div');
    b.className = 'ttcont';
    b.innerHTML = '<p class="ttcont__t"></p><button type="button" class="cta ttcont__b"></button>';
    document.body.appendChild(b);
    b.querySelector('.ttcont__t').textContent = T.cont;
    var btn = b.querySelector('.ttcont__b');
    btn.textContent = T.contBtn;
    btn.addEventListener('click', function () {
      if (!navigator.clipboard || !navigator.clipboard.readText) { b.parentNode.removeChild(b); return; }
      navigator.clipboard.readText().then(function (text) {
        var u = null;
        try { u = new URL(String(text).trim()); } catch (e) { u = null; }
        var ok = u && u.origin === location.origin && /^(monthly|yearly)$/.test(u.searchParams.get('go') || '') &&
          u.searchParams.get('h');
        if (ok) { location.href = location.pathname + u.search; return; }
        b.parentNode.removeChild(b);
      }).catch(function () { b.parentNode.removeChild(b); });
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* Метка варианта на ссылке чекаута. Gumroad возвращает параметры ссылки
     в Ping как url_params[...] (так же доезжает astro_sid), и воркер по
     astro_v раскладывает оплаты по вариантам эксперимента. На сумму, товар
     и условия метка не влияет. */
  function withVariant(url, v) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'astro_v=' + (v || (V2 ? 'q2' : 'a'));
  }

  /* Единая точка ухода на оплату. */
  function goCheckout(plan, url) {
    if (window.ASTROMAP_INAPP) { openEmbeddedCheckout(plan, url); return; }
    markCheckout(plan);
    window.location.href = withVariant(url);
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
    track(id);
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

  /* --- несуществующие и будущие даты --------------------------------------
     Селект дня всегда предлагал 1–31, и 31 февраля 1990 уходило в расчёт:
     Date.UTC молча нормализует его в 3 марта, и экран уверенно показывал
     «Рыбы 12,6°» для дня, которого не было. Теперь дни, которых нет в
     выбранном месяце, и даты позже сегодняшней в селектах выключены, а уже
     выбранный несуществующий день сбрасывается — без тихой подмены на
     соседнее число, человек выбирает день сам. */
  function daysIn(y, m) { return new Date(Date.UTC(y || 2000, m, 0)).getUTCDate(); }
  function dateValid(o) {
    if (!(o.d && o.m && o.y)) { return false; }
    if (o.d > daysIn(o.y, o.m)) { return false; }
    var now = new Date();
    return Date.UTC(o.y, o.m - 1, o.d) <= Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  }
  function syncDateSelects(dId, mId, yId) {
    var y = +el(yId).value || null, m = +el(mId).value || null;
    var now = new Date(), curY = now.getFullYear();
    var max = m ? daysIn(y || 2000, m) : 31;
    all('#' + mId + ' option').forEach(function (o) {
      o.disabled = !!(o.value && y === curY && +o.value > now.getMonth() + 1);
    });
    all('#' + dId + ' option').forEach(function (o) {
      var d = +o.value;
      o.disabled = !!(o.value && (d > max ||
        (y === curY && m === now.getMonth() + 1 && d > now.getDate())));
    });
    [dId, mId].forEach(function (id) {
      var s = el(id), opt = s.options[s.selectedIndex];
      if (opt && opt.disabled) { s.value = ''; }
    });
  }

  /* --- экран 1 ----------------------------------------------------------- */
  function dobReady() { return dateValid(S.dob); }

  /* restoring === true — вызов при загрузке страницы, а не выбор даты.
     Тогда сохранённое не перезаписываем: в S на старте восстановлены
     только дата и темы, и persist() стёр бы из хранилища время, город и
     партнёра. Из-за этого вернувшийся позже человек приносил в продукт
     карту без места рождения, а передача из TikTok теряла их до ухода
     на чекаут. */
  function onDob(restoring) {
    syncDateSelects('d1', 'm1', 'y1');
    S.dob = {
      d: +el('d1').value || null,
      m: +el('m1').value || null,
      y: +el('y1').value || null
    };
    if (!dobReady()) { el('s1res').classList.add('hidden'); el('cta').disabled = true; return; }
    if (restoring !== true) { persist(); }
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
  if (dobReady()) { onDob(true); }

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
  /* Карта посчитана, а человек меняет город или время. Раньше S.natal
     оставалась прежней: кнопка уже говорила «Дальше», и на следующие экраны,
     в сводку, пейволл и продукт уезжала карта для СТАРЫХ места и времени.
     Теперь любое изменение входных данных стирает расчёт и всё, что из него
     выведено (совместимость, превью), и кнопка снова предлагает посчитать. */
  function resetChart() {
    if (!S.natal) { return; }
    S.natal = null;
    S.syn = null;
    pvData = null;
    el('s3map').classList.add('hidden');
    el('big3').classList.add('hidden');
    el('big3').innerHTML = '';
    el('scoreBox').classList.add('hidden');
    el('cta').textContent = C.ctaCalc;
    persist();
  }

  function onTime() {
    S.time.h = el('hh').value === '' ? null : +el('hh').value;
    S.time.min = el('mm').value === '' ? null : +el('mm').value;
    resetChart();
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
      resetChart();
      S.city = FC.toObject(c);
      input.value = FC.label(c);
      close();
      dropLift();
      persist();
      el('cta').disabled = !timeReady();
    }
    function render() {
      if (!results.length) {
        menu.innerHTML = '<div class="citypick__empty">' + C.s3.cityNoMatch + '</div>';
      } else {
        /* Город и страна раздельно: название слева, страна приглушённо
           справа. Одной строкой «Mostoles, Spain» длинные названия
           переносились как попало, и столбик выглядел рваным. */
        menu.innerHTML = results.map(function (c, i) {
          var lab = FC.label(c), cut = lab.indexOf(', ');
          var name = cut > 0 ? lab.slice(0, cut) : lab;
          var land = cut > 0 ? lab.slice(cut + 2) : '';
          return '<div class="citypick__opt" role="option" id="cityopt-' + i +
            '" data-i="' + i + '"><span class="citypick__name">' + name + '</span>' +
            (land ? '<span class="citypick__land">' + land + '</span>' : '') + '</div>';
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
    /* КЛАВИАТУРА, О КОТОРОЙ БРАУЗЕР НЕ СООБЩАЕТ. Встроенный браузер TikTok
       на Android кладёт клавиатуру поверх страницы: окно не уменьшается,
       visualViewport тоже, и поле к себе браузер не прокручивает — поле
       города и подсказки оказывались под клавиатурой. Признак такого случая —
       видимая высота почти во весь экран, когда в поле стоит курсор. Тогда
       считаем видимой верхние KB_SHARE экрана и поднимаем поле под шапку
       сами; чтобы было куда прокрутить, на время ввода снизу добавляется
       место (body.kb-lift в flow.css). */
    var COARSE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    var KB_SHARE = 0.52;
    function keyboardHidden() {
      if (!COARSE) { return false; }
      var h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
      return h > (screen.height || h) * 0.72;
    }
    /* Поднять поле под шапку. Один раз мало — видео с Android (TikTok)
       показало, что браузер, пока выезжает клавиатура, сам подтягивает
       поле к её верхней кромке и тем отменяет наш подъём, а подсказки
       остаются под клавиатурой. Поэтому поднимаем несколько раз за время
       анимации клавиатуры и при каждом изменении размера окна, пока курсор
       в поле: последнее слово остаётся за нами. */
    var liftOn = null, liftTimers = [];
    function headerBottom() {
      var head = el('top');
      return head && !head.classList.contains('hidden') ? head.getBoundingClientRect().bottom : 0;
    }
    function doLift(field) {
      var y = field.getBoundingClientRect().top + window.pageYOffset - (headerBottom() + 12);
      if (Math.abs(field.getBoundingClientRect().top - (headerBottom() + 12)) > 4) {
        window.scrollTo(0, Math.max(0, y));
      }
    }
    function liftField(field) {
      if (!COARSE) { return; }
      liftOn = field;
      document.body.classList.add('kb-lift');
      liftTimers.forEach(clearTimeout);
      liftTimers = [0, 120, 300, 550, 900, 1400].map(function (t) {
        return setTimeout(function () {
          if (liftOn === field && document.activeElement === field) { doLift(field); fitMenu(); }
        }, t);
      });
    }
    function dropLift() {
      liftOn = null;
      liftTimers.forEach(clearTimeout);
      liftTimers = [];
      document.body.classList.remove('kb-lift');
    }
    function onViewportChange() {
      if (liftOn && document.activeElement === liftOn) { doLift(liftOn); }
      fitMenu();
    }
    window.astromapLiftField = liftField;
    window.astromapDropLift = dropLift;

    function fitMenu() {
      if (menu.hidden) { return; }
      var gap = function () {
        var vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
        if (document.activeElement === input && keyboardHidden()) { vh = window.innerHeight * KB_SHARE; }
        return vh - menu.getBoundingClientRect().top - 10;
      };
      menu.style.maxHeight = '';
      menu.classList.remove('citypick__menu--up');
      /* Именно нарисованная высота, а не scrollHeight: у списка есть штатный
         потолок в 264px из CSS, и растягивать его сверх этого мы не хотим. */
      var need = menu.getBoundingClientRect().height;

      /* Поле уже поднято под шапку (liftField) — страницу не трогаем:
         прокрутка вниз ради списка отменяла подъём, и поле уезжало под
         шапку или за экран. Дальше — только высота списка или список над
         полем. */
      if (!liftOn && gap() < need) {
        var room = Math.max(0, document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
        var by = Math.min(need - gap(), room);
        if (by > 0) { window.scrollBy(0, by); }
      }
      var avail = gap();
      /* Под полем всё равно тесно (клавиатура, о которой браузер не
         сообщил, или страницу некуда прокрутить) — открываем список НАД
         полем, если там места больше. */
      var above = input.getBoundingClientRect().top - headerBottom() - 12;
      if (avail < Math.min(need, 160) && above > avail) {
        menu.classList.add('citypick__menu--up');
        menu.style.maxHeight = Math.max(96, Math.min(264, above)) + 'px';
        return;
      }
      menu.classList.remove('citypick__menu--up');
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

    /* ТОЧНОЕ СОВПАДЕНИЕ ЗАСЧИТЫВАЕТСЯ ПРЯМО ПРИ НАБОРЕ. Раньше — только
       по blur, а на iPhone тап по пустому месту или по выключенной кнопке
       фокус с поля не снимает: человек вписал «Barysaw, Belarus», клавиатура
       убрана, а кнопка так и стоит серой. Подсказки при этом остаются
       открытыми — можно выбрать другой город с тем же названием. */
    input.addEventListener('input', function () {
      S.city = null;
      resetChart();
      openFor(input.value);
      pickExact(false);
      el('cta').disabled = !timeReady();
    });
    /* Возврат в поле снова показывает подсказки — и по нажатию, и по табу. */
    input.addEventListener('focus', function () { liftField(input); openFor(input.value); });
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
    /* Город вписан руками, но строка в подсказках не нажата. Раньше кнопка
       так и оставалась выключенной: человек видел в поле «Barysaw, Belarus»
       и не понимал, чего от него хотят. Если набранное ТОЧНО совпадает с
       городом из списка — с подписью страны или без, — это и есть выбор.
       Опечатки по-прежнему не проходят: нужно полное совпадение названия. */
    /* Вызывается и при наборе, и при уходе из поля. При наборе (rewrite
       false) текст в поле не трогаем — иначе курсор прыгал бы в конец
       посреди слова; подпись со страной ставится, когда человек уходит. */
    function pickExact(rewrite) {
      if (S.city) {
        if (rewrite && S.city.cc) { input.value = FC.label([S.city.n, S.city.cc]); }
        return;
      }
      var text = FC.norm(input.value).trim();
      if (text.length < 2) { return; }
      /* С запятой — это «город, страна», и совпасть должна вся строка:
         иначе «Barysaw, Poland» засчитывался бы как Борисов в Беларуси.
         Без запятой — точное название города; тёзок много, берём самый
         крупный, как Enter в подсказках. */
      var comma = input.value.indexOf(',');
      var found = FC.search(comma > 0 ? input.value.slice(0, comma) : input.value, 8);
      var best = null;
      for (var i = 0; i < found.length && !best; i++) {
        var name = comma > 0 ? FC.label(found[i]) : found[i][0];
        if (FC.norm(name).trim() === text) { best = found[i]; }
      }
      if (!best) { return; }
      S.city = FC.toObject(best);
      if (rewrite) { input.value = FC.label(best); }
      persist();
      el('cta').disabled = !timeReady();
    }

    input.addEventListener('blur', function () {
      /* Палец уже в списке — уход фокуса ничего не значит. */
      if (interacting) { return; }
      close();
      pickExact(true);
      dropLift();
    });

    /* Экранная клавиатура приходит и уходит уже после того, как список
       открыт: на телефоне это событие resize (а где есть visualViewport —
       ещё и его собственный resize). Без пересчёта список, помещавшийся
       секунду назад, оказывается под доком. */
    window.addEventListener('resize', onViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onViewportChange);
    }
    /* Нажатие мимо поля и мимо списка закрывает подсказки. Раньше это
       держалось на одном blur, то есть на предположении, что фокус
       обязательно куда-то уйдёт. */
    document.addEventListener('pointerdown', function (ev) {
      if (menu.hidden) { return; }
      if (wrap && wrap.contains(ev.target)) { return; }
      close();
      pickExact(true);
    });

    /* Города нет в списке. Тогда считаем всё, кроме асцендента: для него
       нужны координаты, а их человек ввести не может — и выдумывать их
       нельзя, это и есть та самая «настоящая астрономическая величина». */
    /* РУЧНОЙ ВВОД ПРИНИМАЕТСЯ СРАЗУ. Раньше место считалось заданным только
       после кнопки «Use»: человек вписывал название, жал на главную кнопку —
       а она выключена, и никакой подсказки почему. Теперь каждое изменение
       названия или пояса сразу кладёт место в S.city, и главная кнопка
       загорается; «Use» и Enter остаются, чтобы свернуть блок. */
    function manualCity() {
      var name = el('cityManualName').value.trim();
      if (!name) { return null; }
      return { n: name, lat: null, lon: null,
               tz: parseFloat(el('cityManualOffset').value), dst: '' };
    }
    function syncManual() {
      resetChart();
      S.city = manualCity();
      if (S.city) { input.value = S.city.n; }
      persist();
      el('cta').disabled = !timeReady();
      el('s3note').textContent = S.city ? C.s3.cityManualNote : '';
      el('s3note').classList.toggle('hidden', !S.city);
    }
    el('cityManual').addEventListener('click', function () {
      var box = el('cityManualBox');
      box.hidden = !box.hidden;
      if (box.hidden) { return; }
      /* Название, уже набранное в поиске, переносим в ручное поле: вводить
         его второй раз — ровно то место, где человек и застревал. */
      var typed = input.value.trim();
      if (!S.city && typed && !el('cityManualName').value.trim()) {
        el('cityManualName').value = typed;
        close();
        syncManual();
      }
      el('cityManualName').focus();
    });
    el('cityManualName').addEventListener('input', syncManual);
    el('cityManualName').addEventListener('focus', function () { liftField(el('cityManualName')); });
    el('cityManualName').addEventListener('blur', dropLift);
    el('cityManualOffset').addEventListener('change', function () {
      if (el('cityManualName').value.trim()) { syncManual(); }
    });
    function applyManual() {
      if (!manualCity()) { el('cityManualName').focus(); return; }
      syncManual();
      el('cityManualBox').hidden = true;
      close();
      el('cityManualName').blur();
    }
    el('cityManualApply').addEventListener('click', applyManual);
    el('cityManualName').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); applyManual(); }
    });
  })();

  el('noTime').addEventListener('change', function () {
    S.time.known = !this.checked;
    resetChart();
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
      showChart();
      scrollToBlock(el('s3map'));
    });
  }

  /* Результат третьего экрана по уже посчитанной S.natal. Отдельно от
     calcChart, потому что после смены языка карта не пересчитывается
     заново со стадиями, а просто рисуется на новом языке. */
  function showChart() {
    drawMap(el('s3map'), false);
    el('s3map').classList.remove('hidden');
    el('big3').innerHTML = big3Html();
    el('big3').classList.remove('hidden');

    var notes = [];
    if (!S.natal.asc) {
      notes.push(S.time.known ? C.s3.cityManualNote : C.s3.unknownNote);
    }
    if (S.natal.moon.nearCusp || (S.natal.asc && S.natal.asc.nearCusp)) {
      notes.push(C.s3.cuspNote);
    }
    el('s3note').textContent = notes.join(' ');
    el('s3note').classList.toggle('hidden', !notes.length);

    el('cta').textContent = C.ctaNext;
    el('cta').disabled = false;
  }

  /* --- экран 4: совместимость -------------------------------------------- */
  function bandFor(score) {
    var band = C.s4.bands[0];
    C.s4.bands.forEach(function (b) { if (score >= b.min) { band = b; } });
    return band;
  }

  function onPartner() {
    syncDateSelects('d2', 'm2', 'y2');
    S.partner = {
      d: +el('d2').value || null,
      m: +el('m2').value || null,
      y: +el('y2').value || null
    };
    if (!dateValid(S.partner)) {
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
      /* Сводка целиком, а не только превью: раздел «небо сейчас» тоже
         строится из pvData. Если ядро догрузилось уже после того, как
         сводка нарисована (медленная сеть, возврат после смены языка),
         раньше этот раздел так и не появлялся. */
      if (S.screen === 's5') { buildSummary(); }
      if (S.screen === 's6') { el('pwMoves').innerHTML = pwMovesHtml(); }
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

    el('planPrice').innerHTML = priceHtml(C.billing.priceLine);
    el('planAfter').textContent = C.billing.renewLine;
    el('planDisc').innerHTML = discHtml(C.billing.disclaimer);

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
  /* Дисклеймер подписки кончается ссылкой «see our {terms}»: название
     документа в тексте становится ссылкой, а под ним — адрес поддержки. */
  function discHtml(text) {
    var esc = function (t) {
      return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var html = esc(text).replace('{terms}', TERMS_URL
      ? '<a href="' + TERMS_URL + '" target="_blank" rel="noopener">' + esc(C.paywall.terms) + '</a>'
      : esc(C.paywall.terms));
    if (SUPPORT_EMAIL) {
      html += ' ' + esc(C.billing.support).replace('{email}',
        '<a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a>');
    }
    return html;
  }

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
  /* «$9.99 + VAT» → сумма крупно, «+ VAT» (и хвост вроде «per year») —
     отдельной мелкой подписью, см. .price__tax в flow.css. Делим по первому
     « + »: формат цены один во всех языках. Строки из COPY, но всё равно
     экранируем — это innerHTML. */
  function priceHtml(line, tail) {
    var esc = function (t) {
      return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var cut = line.indexOf(' + ');
    var amount = cut > 0 ? line.slice(0, cut) : line;
    var tax = (cut > 0 ? line.slice(cut + 1) : '') + (tail ? ' ' + tail : '');
    return esc(amount) + (tax.trim() ? '<span class="price__tax">' + esc(tax.trim()) + '</span>' : '');
  }

  function buildRecovery() {
    el('onePrice').innerHTML = priceHtml(C.billing.yearPrice, C.billing.yearPeriod);
    el('oneDisc').innerHTML = discHtml(C.billing.yearDisclaimer);
    el('legalYear').innerHTML = legalHtml(C.recovery.yearCta);
  }

  /* --- навигация --------------------------------------------------------- */
  el('cta').addEventListener('click', function () {
    if (V2) { return; }   /* у квиза свой обработчик */
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
      /* Нажатие считаем здесь, а не в goCheckout: туда же приходит
         продолжение оплаты из TikTok в Safari, и нажатие посчиталось бы
         дважды. */
      track('pay_m');
      if (CHECKOUT_URL) { goCheckout('monthly', CHECKOUT_URL); }
      else { noCheckout('CHECKOUT_URL'); }
      return;
    }
    if (S.screen === 's7') {
      track('pay_y');
      if (CHECKOUT_URL_YEAR) { goCheckout('yearly', CHECKOUT_URL_YEAR); }
      else { noCheckout('CHECKOUT_URL_YEAR'); }
    }
  });

  el('ghost').addEventListener('click', function () {
    if (V2) { return; }
    if (S.screen === 's4') { S.syn = null; buildSummary(); pvStart(); go('s5'); return; }
    if (S.screen === 's6') {
      /* Страховка на случай, если годовой товар снимут с продажи: экран s7
         обещает цену и ведёт на кнопку оплаты, поэтому показывать его с
         пустым CHECKOUT_URL_YEAR нельзя — это кнопка, которой некуда вести.
         Пусто — «не сейчас» ведёт в бесплатное чтение, честный выход из
         README. Ссылка на месте — работает обычный путь s6 → s7. */
      if (!CHECKOUT_URL_YEAR) {
        document.dispatchEvent(new CustomEvent('funnel:decline',
          { detail: { from: 's6', to: 'reading', plan: 'monthly' } }));
        track('reading');
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
    /* Пейвол собираем заново: после смены языка на s7 страница
       перезагружается прямо на s7, и s6 в этой загрузке не собирался —
       «назад к месячному» открывал пустую карточку без цены и условий. */
    if (S.screen === 's7') { buildPaywall(); go('s6'); return; }
  });

  /* Ссылка «прочитать бесплатно» на экране годового плана — тоже выход из
     воронки, и в сводке он должен быть виден. */
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.rc__go')) { track('reading'); }
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
        saveResume();
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

  /* --- возврат на тот же шаг после смены языка ----------------------------
     Язык меняется перезагрузкой (тексты подставляются один раз на старте),
     а после перезагрузки воронка всегда открывалась с первого экрана: из
     localStorage возвращались только дата и темы. Человек, сменивший язык на
     третьем шаге или на пейволле, проходил всё заново.

     Теперь перед перезагрузкой состояние и открытый экран кладутся в
     sessionStorage — метка живёт в этой вкладке и читается один раз, так что
     обычный повторный заход по-прежнему начинается с начала. Экран
     собирается теми же функциями, что и при обычном переходе на него. */
  function saveResume() {
    try {
      sessionStorage.setItem('astromap.resume', JSON.stringify({
        screen: S.screen, time: S.time, city: S.city,
        natal: S.natal, partner: S.partner, syn: S.syn
      }));
    } catch (e) { /* приватный режим — просто начнём с начала */ }
  }

  function resume() {
    var r = null;
    try {
      r = JSON.parse(sessionStorage.getItem('astromap.resume') || 'null');
      sessionStorage.removeItem('astromap.resume');
    } catch (e) { r = null; }
    if (!r || !r.screen || r.screen === 's1' || !dobReady()) { return false; }
    /* Экран, до которого нельзя дойти без предыдущих ответов, не
       восстанавливаем — лучше начать с начала, чем показать пустой. */
    if (S.themes.length < 2 && r.screen !== 's2') { return false; }
    if (['s4', 's5', 's6', 's7'].indexOf(r.screen) >= 0 && !r.natal) { return false; }

    if (r.time) {
      S.time = r.time;
      el('noTime').checked = !S.time.known;
      el('hh').disabled = el('mm').disabled = !S.time.known;
      if (S.time.h !== null) { el('hh').value = S.time.h; }
      if (S.time.min !== null) { el('mm').value = S.time.min; }
      if (!S.time.known) {
        el('s3note').textContent = C.s3.unknownNote;
        el('s3note').classList.remove('hidden');
      }
    }
    if (r.city) {
      S.city = r.city;
      /* Подпись города — на новом языке: страну берём из словаря заново. */
      el('city').value = S.city.cc ? FC.label([S.city.n, S.city.cc]) : S.city.n;
      if (typeof S.city.lat !== 'number') {
        el('s3note').textContent = C.s3.cityManualNote;
        el('s3note').classList.remove('hidden');
      }
    }
    if (r.natal) { S.natal = r.natal; showChart(); }
    /* Совместимость пересчитываем, только если её не пропустили: «пропустить»
       на s4 обнуляет S.syn, но дату партнёра в полях оставляет. */
    if (r.partner && r.partner.d && r.partner.m && r.partner.y &&
        (r.syn || r.screen === 's4')) {
      el('d2').value = r.partner.d; el('m2').value = r.partner.m; el('y2').value = r.partner.y;
      onPartner();
    } else {
      S.syn = null;
    }

    if (S.natal) { pvStart(); }
    if (r.screen === 's5') { buildSummary(); }
    if (r.screen === 's6') { buildPaywall(); }
    if (r.screen === 's7') { buildRecovery(); }
    go(r.screen);
    return true;
  }

  /* --- общая часть для квиза v2 -----------------------------------------
     Квиз (js/quiz.js) не дублирует оплату, передачу из TikTok, расчётные
     помощники и строку согласия: берёт их отсюда. Всё остальное у него своё,
     и экраны s1–s7 в его варианте не открываются вовсе. */
  window.AstroFlow = {
    v2: V2, track: track, deg: deg, goCheckout: goCheckout, noCheckout: noCheckout,
    checkoutUrl: CHECKOUT_URL, checkoutUrlYear: CHECKOUT_URL_YEAR,
    legalHtml: legalHtml, discHtml: discHtml, priceHtml: priceHtml,
    daysIn: daysIn, dateValid: dateValid
  };

  if (V2) {
    /* Экраны прежней воронки закрыты сразу, до первой отрисовки: s1
       активен в разметке, и без этого он мелькнул бы перед квизом. */
    all('.scr').forEach(function (s) { s.classList.remove('is-active'); });
  } else if (!resume()) {
    progress('s1');
    dock('s1');
    /* Первый экран открыт без go(). Пришедший из TikTok в Safari считается,
       только когда выяснилось, что он не продолжает оплату, начатую в
       TikTok (fallback в arrivalFromTikTok): тот человек уже посчитан. */
    if (!window.ASTROMAP_TT_ARRIVAL) { track('s1'); }
  }

  if (window.ASTROMAP_TT_ARRIVAL) { arrivalFromTikTok(); }
  if (/[?&]fpdebug(=|&|$)/.test(location.search)) { fpDebug(); }
})();
