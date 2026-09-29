/* license-verify.js — Cloudflare Worker: проверка доступа к продукту через
   лицензионный ключ Gumroad. Продукт (сайт на GitHub Pages, статика) не может
   сам дёрнуть api.gumroad.com/v2/licenses/verify из браузера — этот эндпоинт
   не отдаёт CORS-заголовки для произвольных источников — поэтому запрос идёт
   через этот воркер (server-to-server, CORS тут ни при чём).

   Деплой: как и horoscope-ai.js — вручную через дашборд Cloudflare (Workers &
   Pages → создать воркер (или новую версию этого же) → Edit code → вставить
   этот файл целиком → Deploy). Настроить в Settings → Variables на воркере:

     GUMROAD_PRODUCT_ID   — id продукта. Месячный и годовой планы — это
                            ОДИН membership-товар с двумя вариантами списания
                            (monthly и yearly), поэтому id один:

                              qLndV2lFwurLl79UmoyYvA==

                            Раньше годовой был отдельным товаром, и это
                            ломало чекаут: ?wanted=true складывал оба товара
                            в серверную корзину Gumroad. Не заводить планы
                            отдельными товарами. Список через запятую воркер
                            по-прежнему понимает — на случай второго продукта.

                            Порядок значения не имеет. Ключ проверяется по
                            каждому id по очереди, доступ открывает первое
                            совпадение. Один id тоже работает — тогда это
                            просто список из одного элемента.

                            Где взять: блок с лицензионными ключами на
                            странице товара в Gumroad показывает его же; либо
                            поле "id" в ответе GET /v2/products.

                            ЗАБЫТЬ ДОБАВИТЬ СЮДА НОВЫЙ ТОВАР — это тихая
                            поломка: человек платит, получает ключ, и гейт
                            говорит ему «не найдено». Заводишь план — правишь
                            эту переменную в тот же заход.

   Меняется только если сменится домен продукта — ALLOWED_ORIGIN ниже.

   Вход:  POST { email, licenseKey }
   Выход: { ok: true, active: bool, email, reason }
          reason (только когда active=false): 'not_found' | 'email_mismatch' |
            'refunded' | 'disputed' | 'subscription_ended' | 'not_configured'

   Модель доступа: живая проверка при каждом заходе (см. product/js/app.js,
   ACCESS_REVALIDATE_MS) — состояние подписки нигде не кэшируется на сервере,
   поэтому воркер не хранит вообще ничего (ни KV, ни webhook от Gumroad не
   нужны). Что именно «закрывает» доступ: subscription_ended_at — а не
   subscription_cancelled_at, который отмечает только сам факт запроса на
   отмену, но подписка остаётся активной до конца оплаченного периода (см.
   Gumroad Ping docs: subscription_ended шлётся «at the time the subscription
   has officially ended, not... at the time cancellation is requested»).

   АККАУНТЫ: ПОЧТА + ПАРОЛЬ
   Ключ вводится один раз — при активации, вместе с новым паролем. Дальше
   вход по почте и паролю. Для этого воркеру нужно хранилище, и это
   единственное, что он хранит: почта → { хэш пароля, лицензионный ключ }.
   Состояние подписки по-прежнему не хранится — каждый вход и каждая
   перепроверка спрашивают Gumroad заново по сохранённому ключу.

   Что настроить в дашборде Cloudflare (кроме GUMROAD_PRODUCT_ID):

     KV namespace ACCOUNTS  — Workers & Pages → KV → Create namespace
                              (любое имя, например astromap-accounts), затем
                              в воркере Settings → Bindings → Add → KV
                              namespace, Variable name: ACCOUNTS.
     SESSION_SECRET         — Settings → Variables → тип Secret, длинная
                              случайная строка (32+ символа). Ею подписываются
                              токены сессий. Сменить её = разлогинить всех.

   Без ACCOUNTS или SESSION_SECRET вход по паролю отвечает not_configured, а
   старая проверка «почта + ключ» (без action) продолжает работать.

   Вход:  POST { action, ... }
     action: 'activate' { email, licenseKey, password }
               Проверяет ключ в Gumroad, ставит пароль (создаёт аккаунт или
               перезаписывает пароль — это же и «забыл пароль»: владелец
               ключа вправе сменить пароль). Старые сессии после смены
               пароля перестают действовать.
     action: 'login'    { email, password }
     action: 'session'  { token }  — перепроверка уже открытой сессии.
     без action         { email, licenseKey } — старая проверка, как была.
                        Её используют браузеры, где вошли до появления паролей.

   Выход для activate / login / session:
     { ok: true, active: true, email, licenseKey, token }
     { ok: true, active: false, reason }
     reason дополнительно: 'no_account' | 'bad_password' | 'too_many' |
       'weak_password' | 'bad_session'

   Пароль: PBKDF2-SHA256, 100 000 итераций (потолок WebCrypto в Workers),
   соль 16 байт на аккаунт. Неверных паролей — не больше 10 за 15 минут
   на одну почту, дальше too_many. */

var ALLOWED_ORIGIN = 'https://astromap.me';
var GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function json(obj, status) {
  var headers = corsHeaders();
  headers['Content-Type'] = 'application/json';
  return new Response(JSON.stringify(obj), { status: status || 200, headers: headers });
}

/* Проверка ключа в Gumroad по всем id товара. Возвращает
   { active: true, email } или { active: false, reason } или { error }. */
async function checkLicense(env, email, licenseKey) {
  var productIds = String((env && env.GUMROAD_PRODUCT_ID) || '')
    .split(',')
    .map(function (x) { return x.trim(); })
    .filter(function (x) { return x.length > 0; });
  if (!productIds.length) { return { error: 'not_configured', status: 500 }; }

  /* Ключ принадлежит ровно одному товару. Какому именно, снаружи не видно:
     в ключе этого не записано, а спрашивать человека, что он покупал, значит
     перекладывать на него нашу бухгалтерию. Поэтому спрашиваем Gumroad по
     каждому id, пока не совпадёт.

     Запросы идут ПОСЛЕДОВАТЕЛЬНО, а не параллельно: совпадение почти всегда
     находится на первом id, и второй запрос тогда не нужен вовсе. */
  var purchase = null;
  for (var i = 0; i < productIds.length; i++) {
    var form = new URLSearchParams();
    form.set('product_id', productIds[i]);
    form.set('license_key', licenseKey);
    form.set('increment_uses_count', 'false'); /* ре-проверки при каждом заходе не должны тратить лимит использований лицензии */

    var upstream;
    try {
      upstream = await fetch(GUMROAD_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      });
    } catch (e) {
      return { error: 'upstream_error', status: 502 };
    }

    var data;
    try { data = await upstream.json(); } catch (e) { return { error: 'upstream_error', status: 502 }; }

    /* success:false здесь значит «не этот товар», а не «плохой ключ»: у
       Gumroad нет способа спросить «чей это ключ», есть только «принадлежит
       ли он вот этому товару». Поэтому идём к следующему id молча, и
       'not_found' отдаём, только когда кончились все. */
    if (data && data.success === true && data.purchase) {
      purchase = data.purchase;
      break;
    }
  }

  if (!purchase) { return { active: false, reason: 'not_found' }; }
  if (purchase.email && String(purchase.email).trim().toLowerCase() !== email.toLowerCase()) {
    return { active: false, reason: 'email_mismatch' };
  }
  if (purchase.refunded) { return { active: false, reason: 'refunded' }; }
  if (purchase.disputed) { return { active: false, reason: 'disputed' }; }
  if (purchase.chargebacked) { return { active: false, reason: 'refunded' }; }
  /* subscription_ended_at — единственное поле, означающее «доступ должен
     закончиться прямо сейчас». subscription_cancelled_at может стоять, пока
     оплаченный период ещё не закончился — это ожидаемо, доступ остаётся. */
  if (purchase.subscription_ended_at) { return { active: false, reason: 'subscription_ended' }; }
  return { active: true, email: purchase.email || email };
}

/* --- аккаунты ------------------------------------------------------------ */
var PBKDF2_ITER = 100000;          /* больше Workers не разрешают */
var SESSION_TTL_MS = 180 * 24 * 3600 * 1000;
var MAX_FAILS = 10;
var FAIL_WINDOW_S = 15 * 60;
var MIN_PASSWORD = 8;
var enc = new TextEncoder();

function b64u(bytes) {
  var bin = '';
  var arr = new Uint8Array(bytes);
  for (var i = 0; i < arr.length; i++) { bin += String.fromCharCode(arr[i]); }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(str) {
  var s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) { s += '='; }
  var bin = atob(s);
  var out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) { out[i] = bin.charCodeAt(i); }
  return out;
}
/* Сравнение без раннего выхода: время не зависит от того, на каком байте
   нашлось расхождение. */
function sameBytes(a, b) {
  if (a.length !== b.length) { return false; }
  var d = 0;
  for (var i = 0; i < a.length; i++) { d |= a[i] ^ b[i]; }
  return d === 0;
}
async function hashPassword(password, salt, iter) {
  var key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  var bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iter }, key, 256);
  return new Uint8Array(bits);
}
async function hmac(secret, data) {
  var key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
/* Токен сессии: полезная нагрузка + подпись HMAC. Хранить сессии не нужно:
   подпись доказывает, что токен выдали мы, а v — версия пароля: после
   смены пароля старые токены не проходят. */
async function makeToken(env, acct) {
  var payload = b64u(enc.encode(JSON.stringify({ e: acct.email, v: acct.v, x: Date.now() + SESSION_TTL_MS })));
  return payload + '.' + b64u(await hmac(env.SESSION_SECRET, payload));
}
async function readToken(env, token) {
  var parts = String(token || '').split('.');
  if (parts.length !== 2) { return null; }
  var expected = await hmac(env.SESSION_SECRET, parts[0]);
  var got;
  try { got = unb64u(parts[1]); } catch (e) { return null; }
  if (!sameBytes(expected, got)) { return null; }
  var data;
  try { data = JSON.parse(new TextDecoder().decode(unb64u(parts[0]))); } catch (e) { return null; }
  if (!data || !data.e || !data.x || data.x < Date.now()) { return null; }
  return data;
}
function acctKey(email) { return 'acct:' + email.toLowerCase(); }
function failKey(email) { return 'fail:' + email.toLowerCase(); }

async function granted(env, acct) {
  return json({ ok: true, active: true, email: acct.email, licenseKey: acct.licenseKey,
    token: await makeToken(env, acct) });
}
function denied(reason) { return json({ ok: true, active: false, reason: reason }); }
function licenseFail(res) {
  if (res.error) { return json({ ok: false, reason: res.error }, res.status || 502); }
  return denied(res.reason);
}

async function handleActivate(env, body) {
  var email = typeof body.email === 'string' ? body.email.trim() : '';
  var licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
  var password = typeof body.password === 'string' ? body.password : '';
  if (!email || !licenseKey || !password) { return json({ ok: false, reason: 'missing_fields' }, 400); }
  if (password.length < MIN_PASSWORD) { return denied('weak_password'); }

  var lic = await checkLicense(env, email, licenseKey);
  if (!lic.active) { return licenseFail(lic); }

  var prev = await env.ACCOUNTS.get(acctKey(email), 'json');
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var acct = {
    email: lic.email,
    licenseKey: licenseKey,
    salt: b64u(salt),
    iter: PBKDF2_ITER,
    hash: b64u(await hashPassword(password, salt, PBKDF2_ITER)),
    v: prev && prev.v ? prev.v + 1 : 1,
    createdAt: prev && prev.createdAt ? prev.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await env.ACCOUNTS.put(acctKey(email), JSON.stringify(acct));
  await env.ACCOUNTS.delete(failKey(email));
  return granted(env, acct);
}

async function handleLogin(env, body) {
  var email = typeof body.email === 'string' ? body.email.trim() : '';
  var password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) { return json({ ok: false, reason: 'missing_fields' }, 400); }

  var fails = parseInt(await env.ACCOUNTS.get(failKey(email)) || '0', 10);
  if (fails >= MAX_FAILS) { return denied('too_many'); }

  var acct = await env.ACCOUNTS.get(acctKey(email), 'json');
  if (!acct) { return denied('no_account'); }

  var hash = await hashPassword(password, unb64u(acct.salt), acct.iter || PBKDF2_ITER);
  if (!sameBytes(hash, unb64u(acct.hash))) {
    await env.ACCOUNTS.put(failKey(email), String(fails + 1), { expirationTtl: FAIL_WINDOW_S });
    return denied('bad_password');
  }
  if (fails) { await env.ACCOUNTS.delete(failKey(email)); }

  var lic = await checkLicense(env, acct.email, acct.licenseKey);
  if (!lic.active) { return licenseFail(lic); }
  return granted(env, acct);
}

async function handleSession(env, body) {
  var data = await readToken(env, body.token);
  if (!data) { return denied('bad_session'); }
  var acct = await env.ACCOUNTS.get(acctKey(data.e), 'json');
  if (!acct || acct.v !== data.v) { return denied('bad_session'); }
  var lic = await checkLicense(env, acct.email, acct.licenseKey);
  if (!lic.active) { return licenseFail(lic); }
  return granted(env, acct);
}

async function handle(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return json({ ok: false, reason: 'method_not_allowed' }, 405);
  }

  var body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, reason: 'bad_json' }, 400); }
  if (!body || typeof body !== 'object') { return json({ ok: false, reason: 'bad_json' }, 400); }

  var action = body.action;
  if (action === 'activate' || action === 'login' || action === 'session') {
    if (!env || !env.ACCOUNTS || !env.SESSION_SECRET) {
      return json({ ok: false, reason: 'not_configured' }, 500);
    }
    if (action === 'activate') { return handleActivate(env, body); }
    if (action === 'login') { return handleLogin(env, body); }
    return handleSession(env, body);
  }

  /* Старая проверка «почта + ключ», без аккаунта. */
  var email = typeof body.email === 'string' ? body.email.trim() : '';
  var licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
  if (!email || !licenseKey) {
    return json({ ok: false, reason: 'missing_fields' }, 400);
  }
  var lic = await checkLicense(env, email, licenseKey);
  if (lic.error) { return json({ ok: false, reason: lic.error }, lic.status || 502); }
  if (!lic.active) { return denied(lic.reason); }
  return json({ ok: true, active: true, email: lic.email });
}

export default {
  async fetch(request, env) {
    return handle(request, env);
  }
};
