/* wallet.js — оплата в одно касание: по кнопке на пейволле сразу
   всплывает системное окно Apple Pay (iPhone, Mac в Safari) или Google Pay
   (Android, Chrome), без перехода на страницу Stripe Checkout.

   Как устроено. Stripe.js (Payment Request API) заранее, пока человек
   смотрит превью и пейволл, готовит два запроса — месяц и год — и узнаёт,
   есть ли на устройстве кошелёк. Окно Apple Pay браузер открывает только
   в ответ на нажатие, поэтому pay() вызывается прямо из обработчика кнопки
   и показывает окно синхронно. Подтвердил оплату Face ID — Stripe отдаёт
   платёжный метод (pm_…), воркер license-verify (action subscribe) заводит
   клиента и подписку на этот метод, и страница уходит на
   product/?session_id=<sub_…> — тот же гейт «придумайте пароль», что после
   Stripe Checkout.

   Кошелька нет (Chrome без карт, старый браузер), Stripe.js не загрузился
   или STRIPE_PK пуст — pay() возвращает false, и кнопка, как раньше, ведёт
   на Stripe Checkout (Payment Link). Внутри TikTok этот модуль не работает
   вовсе: там Apple Pay недоступен, человек сначала уходит в браузер.

   Настройка — docs/stripe-setup.md, раздел «Apple Pay в одно касание». */
var STRIPE_PK = 'pk_live_51UNVi70oxMEGhVt9r2m3QuFaihYlijxqSkuNm7CAem9etCFZBecc4UAgF1TggkCRtOVzTobWNrBN81Gclvy6zm7L00hgjltg1Z';                 /* pk_live_… (Developers → API keys → Publishable key).
                                       Пусто — окна Apple Pay нет, работает Stripe Checkout. */
var STRIPE_COUNTRY = 'PL';          /* страна аккаунта Stripe, две буквы (Settings → Business details) */
/* Суммы в окне Apple Pay — в центах. Должны совпадать с ценами в Stripe
   (STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY у воркера) и с copy.js:
   списывает воркер по цене из Stripe, а окно лишь показывает сумму. */
var WALLET_PRICES = { monthly: 799, yearly: 2999 };
var WALLET_CURRENCY = 'usd';
var PAY_API = 'https://astromap-license-verify.egorrut3030.workers.dev';

(function () {
  'use strict';
  var stripe = null, loading = null, prepared = null;
  var req = {}, ready = {}, ctx = null, busy = false;
  var kind = '';

  function enabled() { return !!STRIPE_PK && !window.ASTROMAP_INAPP && !window.ASTROMAP_FRAMED; }

  function loadStripe() {
    if (loading) { return loading; }
    loading = new Promise(function (resolve, reject) {
      if (window.Stripe) { resolve(window.Stripe); return; }
      var s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.async = true;
      s.onload = function () { if (window.Stripe) { resolve(window.Stripe); } else { reject(new Error('no Stripe')); } };
      s.onerror = function () { loading = null; reject(new Error('stripe.js failed')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function makeRequest(plan, label) {
    var amount = WALLET_PRICES[plan];
    var base = {
      country: STRIPE_COUNTRY,
      currency: WALLET_CURRENCY,
      total: { label: label, amount: amount },
      requestPayerEmail: true,
      /* Только системные кошельки: Link и сохранённые в браузере карты
         открывают не окно Apple/Google Pay, а свою форму. */
      disableWallets: ['link', 'browserCard']
    };
    /* В окне Apple Pay — «подписка, каждый месяц / год» и где ей управлять. */
    try {
      return stripe.paymentRequest(Object.assign({}, base, { applePay: { recurringPaymentRequest: {
        paymentDescription: label,
        managementURL: 'https://astromap.me/product/',
        regularBilling: {
          amount: amount, label: label,
          recurringPaymentIntervalUnit: plan === 'yearly' ? 'year' : 'month',
          recurringPaymentIntervalCount: 1
        }
      } } }));
    } catch (e) {
      return stripe.paymentRequest(base);
    }
  }

  /* Готовит оба запроса и узнаёт, есть ли кошелёк. Повторные вызовы
     возвращают то же обещание. labels — подписи строки «итого» в окне. */
  function prepare(labels) {
    if (!enabled()) { return Promise.resolve(ready); }
    if (prepared) { return prepared; }
    prepared = loadStripe().then(function (S) {
      stripe = stripe || S(STRIPE_PK);
      return Promise.all(['monthly', 'yearly'].map(function (plan) {
        var pr = makeRequest(plan, (labels && labels[plan]) || 'AstroMap');
        req[plan] = pr;
        pr.on('paymentmethod', function (ev) { onPaymentMethod(plan, ev); });
        pr.on('cancel', function () {
          var c = ctx;
          if (busy) { return; }
          ctx = null;
          if (c && c.onCancel) { c.onCancel(plan); }
        });
        return pr.canMakePayment().then(function (r) {
          ready[plan] = !!(r && (r.applePay || r.googlePay));
          if (r && r.applePay) { kind = 'Apple Pay'; } else if (r && r.googlePay && !kind) { kind = 'Google Pay'; }
        });
      }));
    }).then(function () { return ready; }).catch(function () { prepared = null; return ready; });
    return prepared;
  }

  function post(body, timeoutMs) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 25000) : null;
    return fetch(PAY_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.json(); }).finally(function () { if (timer) { clearTimeout(timer); } });
  }

  /* Окно Apple Pay ждёт ответа (крутит индикатор), пока воркер заводит
     подписку. 3-D Secure для Apple Pay почти не бывает, но если банк его
     требует — окно закрывается успехом, а подтверждение показывает Stripe. */
  function onPaymentMethod(plan, ev) {
    var c = ctx || {};
    var completed = false;
    var complete = function (status) {
      if (completed) { return; }
      completed = true;
      try { ev.complete(status); } catch (e) {}
    };
    busy = true;
    post({
      action: 'subscribe', plan: plan, paymentMethod: ev.paymentMethod && ev.paymentMethod.id,
      email: ev.payerEmail || '', ref: c.ref || ''
    }).then(function (r) {
      if (r && r.ok && r.status === 'active') { complete('success'); return r; }
      if (r && r.ok && r.status === 'requires_action' && r.clientSecret) {
        complete('success');
        return stripe.confirmCardPayment(r.clientSecret).then(function (res) {
          if (res && res.error) { throw new Error('requires_action_failed'); }
          return post({ action: 'subscribe_check', subscription: r.subscription }).then(function (r2) {
            if (r2 && r2.ok && r2.status === 'active') { return r2; }
            throw new Error('not_active');
          });
        });
      }
      complete('fail');
      throw new Error((r && r.reason) || 'failed');
    }).then(function (r) {
      busy = false; ctx = null;
      if (c.onSuccess) { c.onSuccess(r.subscription, plan); }
    }).catch(function (e) {
      complete('fail');
      busy = false; ctx = null;
      if (c.onFail) { c.onFail((e && e.message) || 'failed', plan); }
    });
  }

  /* Показывает окно, если кошелёк готов. Вызывать прямо из обработчика
     нажатия. false — окна не будет, ведите на Stripe Checkout. */
  function pay(plan, c) {
    if (!enabled() || busy || !ready[plan] || !req[plan]) { return false; }
    ctx = c || {};
    try { req[plan].show(); } catch (e) { ctx = null; return false; }
    return true;
  }

  window.AstroWallet = {
    enabled: enabled,
    prepare: prepare,
    pay: pay,
    ready: function (plan) { return enabled() && !!ready[plan]; },
    kind: function () { return kind; }
  };
})();
