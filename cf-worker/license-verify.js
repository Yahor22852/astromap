/* license-verify.js — Cloudflare Worker: аккаунты и доступ к продукту через
   Stripe. Имя файла и воркера осталось с времён Gumroad, чтобы не менять
   адрес LICENSE_API в product/js/app.js; внутри Gumroad больше нет.

   КАК ЭТО РАБОТАЕТ
   1. Воронка ведёт на Stripe Payment Link (месяц или год). После оплаты
      Stripe возвращает человека на
        https://astromap.me/product/?session_id={CHECKOUT_SESSION_ID}
   2. Гейт продукта спрашивает здесь claim_info (почта из оплаты) и просит
      придумать пароль → claim. Аккаунт: почта → { хэш пароля, id клиентов
      Stripe }.
   3. Дальше вход по почте и паролю (login) и тихая перепроверка открытой
      сессии раз в сутки (session). Каждая проверка спрашивает Stripe
      заново, есть ли у клиента живая подписка, — состояние подписки здесь
      не хранится.
   4. «Забыли пароль» и «оплатил, но пароль не задал» — одно и то же:
      reset_request отправляет письмо со ссылкой ?reset=<токен> (через
      Resend), reset ставит новый пароль.
   5. Вебхук Stripe (checkout.session.completed) сразу после оплаты шлёт
      такое же письмо «создайте пароль» — на случай, если человек закрыл
      вкладку, не дойдя до гейта.
   6. portal — ссылка в Stripe Customer Portal (отмена, смена карты, чеки).

   ДЕПЛОЙ: вручную через дашборд Cloudflare (Workers & Pages → этот воркер →
   Edit code → вставить файл целиком → Deploy). Settings → Variables:

     STRIPE_SECRET_KEY      Secret. Лучше restricted key (Developers → API
                            keys → Create restricted key) с правами:
                            Customers — Read, Checkout Sessions — Read,
                            Subscriptions — Read, Customer portal — Write.
                            sk_test_… для теста, sk_live_… для продажи.
     STRIPE_WEBHOOK_SECRET  Secret, whsec_… — Developers → Webhooks → Add
                            endpoint: https://<этот воркер>/stripe/webhook,
                            событие checkout.session.completed.
     SESSION_SECRET         Secret, длинная случайная строка (32+ символа).
                            Сменить = разлогинить всех.
     RESEND_API_KEY         Secret, ключ resend.com (домен astromap.me
                            подтверждён в Resend → Domains).
     MAIL_FROM              Обычная переменная, например
                            AstroMap <hello@astromap.me>
     KV namespace ACCOUNTS  Settings → Bindings → KV namespace, имя
                            переменной ACCOUNTS (тот же, что был).

   Вход (POST JSON, поле action):
     claim_info    { sessionId }               → { ok, ready, email, used }
     claim         { sessionId, password }     → доступ
     login         { email, password }         → доступ
     session       { token }                   → доступ
     reset_request { email, lang }             → { ok, sent: true } всегда
     reset_info    { token }                   → { ok, ready, email }
     reset         { token, password }         → доступ
     portal        { token }                   → { ok, url }
   Доступ: { ok: true, active: true, email, plan, token }
       или { ok: true, active: false, reason }
   reason: 'not_found' | 'subscription_ended' | 'no_account' |
     'bad_password' | 'too_many' | 'weak_password' | 'bad_session' |
     'bad_link' | 'session_used' | 'not_paid' | 'not_configured'

   Пароль: PBKDF2-SHA256, 100 000 итераций (потолок WebCrypto в Workers),
   соль 16 байт на аккаунт. Неверных паролей — не больше 10 за 15 минут на
   одну почту, писем сброса — не больше 3 в час. */

var ALLOWED_ORIGIN = 'https://astromap.me';
var SITE = 'https://astromap.me';
var STRIPE_API = 'https://api.stripe.com/v1';
/* Подписка даёт доступ в этих статусах. past_due — Stripe ещё пытается
   списать деньги (Smart Retries); доступ не отбираем, пока он не сдался и
   не перевёл подписку в canceled / unpaid. */
var ACTIVE_STATUSES = { active: 1, trialing: 1, past_due: 1 };

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

/* --- Stripe API ---------------------------------------------------------- */
async function stripe(env, method, path, params) {
  var url = STRIPE_API + path;
  var init = {
    method: method,
    headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY }
  };
  if (params) {
    var form = new URLSearchParams();
    Object.keys(params).forEach(function (k) { form.append(k, params[k]); });
    if (method === 'GET') { url += '?' + form.toString(); }
    else {
      init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      init.body = form.toString();
    }
  }
  var res = await fetch(url, init);
  var data = await res.json();
  if (!res.ok) {
    var err = new Error((data && data.error && data.error.message) || ('stripe ' + res.status));
    err.status = res.status;
    throw err;
  }
  return data;
}

/* Клиенты Stripe с этой почтой. Payment Link заводит нового клиента на
   каждую покупку, поэтому у одной почты их может быть несколько. Фильтр
   Stripe по почте чувствителен к регистру — спрашиваем и как ввели, и
   строчными. */
async function customersByEmail(env, email) {
  var ids = [];
  var variants = [email];
  if (email.toLowerCase() !== email) { variants.push(email.toLowerCase()); }
  for (var i = 0; i < variants.length; i++) {
    var list = await stripe(env, 'GET', '/customers', { email: variants[i], limit: '20' });
    (list.data || []).forEach(function (c) { if (ids.indexOf(c.id) < 0) { ids.push(c.id); } });
  }
  return ids;
}

/* Есть ли живая подписка у кого-то из клиентов. */
async function activeIn(env, customers) {
  var seen = false;
  for (var i = 0; i < customers.length; i++) {
    var list = await stripe(env, 'GET', '/subscriptions',
      { customer: customers[i], status: 'all', limit: '20' });
    var subs = list.data || [];
    if (subs.length) { seen = true; }
    for (var j = 0; j < subs.length; j++) {
      if (ACTIVE_STATUSES[subs[j].status]) {
        var item = subs[j].items && subs[j].items.data && subs[j].items.data[0];
        var interval = item && item.price && item.price.recurring && item.price.recurring.interval;
        return { active: true, plan: interval === 'year' ? 'yearly' : 'monthly', customer: customers[i] };
      }
    }
  }
  return { active: false, seen: seen };
}

/* Живая проверка подписки аккаунта. Сначала по известным клиентам, потом —
   если человек купил заново и у него новый клиент — по почте. */
async function checkSubscription(env, acct) {
  try {
    var known = acct.customers || [];
    var r = await activeIn(env, known);
    if (r.active) { return r; }
    var all = await customersByEmail(env, acct.email);
    var fresh = all.filter(function (id) { return known.indexOf(id) < 0; });
    var seen = r.seen;
    if (fresh.length) {
      acct.customers = known.concat(fresh);
      await addCustomers(env, acct.email, fresh);
      var r2 = await activeIn(env, fresh);
      if (r2.active) { return r2; }
      seen = seen || r2.seen;
    }
    return { active: false, reason: seen ? 'subscription_ended' : 'not_found' };
  } catch (e) {
    return { error: 'upstream_error', status: 502 };
  }
}

/* --- пароли и токены ----------------------------------------------------- */
var PBKDF2_ITER = 100000;          /* больше Workers не разрешают */
var SESSION_TTL_MS = 180 * 24 * 3600 * 1000;
var MAX_FAILS = 10;
var FAIL_WINDOW_S = 15 * 60;
var MIN_PASSWORD = 8;
var CLAIM_WINDOW_MS = 7 * 24 * 3600 * 1000;   /* ссылка с session_id живёт неделю */
var WELCOME_LINK_TTL_S = 7 * 24 * 3600;
var RESET_LINK_TTL_S = 2 * 3600;
var MAX_RESET_MAILS = 3;                       /* в час на одну почту */
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
/* Сравнение без раннего выхода. */
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
function randomToken() { return b64u(crypto.getRandomValues(new Uint8Array(32))); }

/* Токен сессии: полезная нагрузка + подпись HMAC. v — версия пароля:
   после смены пароля старые токены не проходят. */
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
function acctKey(email) { return 'acct:' + String(email).toLowerCase(); }
function failKey(email) { return 'fail:' + String(email).toLowerCase(); }
function mailKey(email) { return 'mail:' + String(email).toLowerCase(); }

async function loadAcct(env, email) { return env.ACCOUNTS.get(acctKey(email), 'json'); }

/* Аккаунт (если его нет — без пароля) + клиенты Stripe в список. Читаем
   запись прямо перед записью и меняем только список клиентов: поля пароля
   здесь не трогаются никогда. */
async function addCustomers(env, email, customers) {
  var acct = await loadAcct(env, email);
  var now = new Date().toISOString();
  if (!acct) { acct = { email: email, customers: [], v: 0, createdAt: now }; }
  acct.customers = acct.customers || [];
  var changed = false;
  (customers || []).forEach(function (c) {
    if (c && acct.customers.indexOf(c) < 0) { acct.customers.push(c); changed = true; }
  });
  if (changed || !acct.updatedAt) {
    acct.updatedAt = now;
    await env.ACCOUNTS.put(acctKey(email), JSON.stringify(acct));
  }
  return acct;
}
async function upsertAccount(env, email, customer) { return addCustomers(env, email, customer ? [customer] : []); }

async function setPassword(env, acct, password) {
  var salt = crypto.getRandomValues(new Uint8Array(16));
  acct.salt = b64u(salt);
  acct.iter = PBKDF2_ITER;
  acct.hash = b64u(await hashPassword(password, salt, PBKDF2_ITER));
  acct.v = (acct.v || 0) + 1;
  acct.updatedAt = new Date().toISOString();
  await env.ACCOUNTS.put(acctKey(acct.email), JSON.stringify(acct));
  await env.ACCOUNTS.delete(failKey(acct.email));
}

async function granted(env, acct, sub) {
  return json({ ok: true, active: true, email: acct.email, plan: sub.plan || null,
    token: await makeToken(env, acct) });
}
function denied(reason) { return json({ ok: true, active: false, reason: reason }); }
function subFail(res) {
  if (res.error) { return json({ ok: false, reason: res.error }, res.status || 502); }
  return denied(res.reason);
}
async function grantIfActive(env, acct) {
  var sub = await checkSubscription(env, acct);
  if (!sub.active) { return subFail(sub); }
  return granted(env, acct, sub);
}

/* --- письма (Resend) ----------------------------------------------------- */
var MAIL = {
  en: { wS: 'Your AstroMap access is ready', wH: 'Welcome to AstroMap', wP: 'Your subscription is active. Create a password to open your chart — after that you log in with this email and password on any device.', wB: 'Create password',
        rS: 'Reset your AstroMap password', rH: 'New password', rP: 'Tap the button to choose a new password. The link works for 2 hours.', rB: 'Choose new password',
        f: 'If you didn’t request this, just ignore this email.' },
  pl: { wS: 'Twój dostęp do AstroMap jest gotowy', wH: 'Witaj w AstroMap', wP: 'Subskrypcja jest aktywna. Utwórz hasło, aby otworzyć swoją mapę — potem logujesz się tym e-mailem i hasłem na każdym urządzeniu.', wB: 'Utwórz hasło',
        rS: 'Reset hasła AstroMap', rH: 'Nowe hasło', rP: 'Stuknij przycisk, aby ustawić nowe hasło. Link działa 2 godziny.', rB: 'Ustaw nowe hasło',
        f: 'Jeśli to nie Ty, po prostu zignoruj tę wiadomość.' },
  ru: { wS: 'Доступ к AstroMap готов', wH: 'Добро пожаловать в AstroMap', wP: 'Подписка активна. Придумайте пароль, чтобы открыть свою карту, — дальше вход по этой почте и паролю с любого устройства.', wB: 'Создать пароль',
        rS: 'Сброс пароля AstroMap', rH: 'Новый пароль', rP: 'Нажмите кнопку, чтобы задать новый пароль. Ссылка работает 2 часа.', rB: 'Задать новый пароль',
        f: 'Если это были не вы, просто проигнорируйте письмо.' },
  uk: { wS: 'Доступ до AstroMap готовий', wH: 'Ласкаво просимо до AstroMap', wP: 'Підписка активна. Придумайте пароль, щоб відкрити свою карту, — далі вхід за цією поштою і паролем з будь-якого пристрою.', wB: 'Створити пароль',
        rS: 'Скидання пароля AstroMap', rH: 'Новий пароль', rP: 'Натисніть кнопку, щоб задати новий пароль. Посилання діє 2 години.', rB: 'Задати новий пароль',
        f: 'Якщо це були не ви, просто проігноруйте лист.' },
  de: { wS: 'Dein AstroMap-Zugang ist bereit', wH: 'Willkommen bei AstroMap', wP: 'Dein Abo ist aktiv. Lege ein Passwort fest, um dein Horoskop zu öffnen — danach meldest du dich auf jedem Gerät mit dieser E-Mail und dem Passwort an.', wB: 'Passwort festlegen',
        rS: 'AstroMap-Passwort zurücksetzen', rH: 'Neues Passwort', rP: 'Tippe auf den Button, um ein neues Passwort festzulegen. Der Link gilt 2 Stunden.', rB: 'Neues Passwort festlegen',
        f: 'Wenn du das nicht warst, ignoriere diese E-Mail einfach.' },
  es: { wS: 'Tu acceso a AstroMap está listo', wH: 'Bienvenido a AstroMap', wP: 'Tu suscripción está activa. Crea una contraseña para abrir tu carta; después entras con este email y tu contraseña en cualquier dispositivo.', wB: 'Crear contraseña',
        rS: 'Restablece tu contraseña de AstroMap', rH: 'Nueva contraseña', rP: 'Pulsa el botón para elegir una nueva contraseña. El enlace funciona 2 horas.', rB: 'Elegir nueva contraseña',
        f: 'Si no lo pediste tú, ignora este email.' },
  fr: { wS: 'Votre accès AstroMap est prêt', wH: 'Bienvenue sur AstroMap', wP: 'Votre abonnement est actif. Créez un mot de passe pour ouvrir votre thème — ensuite, vous vous connectez avec cet email et ce mot de passe sur tous vos appareils.', wB: 'Créer un mot de passe',
        rS: 'Réinitialisez votre mot de passe AstroMap', rH: 'Nouveau mot de passe', rP: 'Appuyez sur le bouton pour choisir un nouveau mot de passe. Le lien est valable 2 heures.', rB: 'Choisir un nouveau mot de passe',
        f: 'Si ce n’était pas vous, ignorez simplement cet email.' },
  it: { wS: 'Il tuo accesso ad AstroMap è pronto', wH: 'Benvenuto in AstroMap', wP: 'L’abbonamento è attivo. Crea una password per aprire il tuo tema: poi accedi con questa email e la password su qualsiasi dispositivo.', wB: 'Crea password',
        rS: 'Reimposta la password di AstroMap', rH: 'Nuova password', rP: 'Tocca il pulsante per scegliere una nuova password. Il link vale 2 ore.', rB: 'Scegli nuova password',
        f: 'Se non sei stato tu, ignora questa email.' },
  pt: { wS: 'Seu acesso ao AstroMap está pronto', wH: 'Boas-vindas ao AstroMap', wP: 'Sua assinatura está ativa. Crie uma senha para abrir seu mapa — depois, entre com este email e a senha em qualquer dispositivo.', wB: 'Criar senha',
        rS: 'Redefina sua senha do AstroMap', rH: 'Nova senha', rP: 'Toque no botão para escolher uma nova senha. O link vale por 2 horas.', rB: 'Escolher nova senha',
        f: 'Se não foi você, ignore este email.' },
  tr: { wS: 'AstroMap erişiminiz hazır', wH: 'AstroMap’e hoş geldiniz', wP: 'Aboneliğiniz aktif. Haritanızı açmak için bir şifre oluşturun — sonra her cihazdan bu e-posta ve şifreyle giriş yaparsınız.', wB: 'Şifre oluştur',
        rS: 'AstroMap şifrenizi sıfırlayın', rH: 'Yeni şifre', rP: 'Yeni bir şifre seçmek için düğmeye dokunun. Bağlantı 2 saat geçerlidir.', rB: 'Yeni şifre seç',
        f: 'Bunu siz istemediyseniz bu e-postayı yok sayın.' }
};

function htmlEsc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
  });
}

async function sendLinkMail(env, email, kind, lang) {
  if (!env.RESEND_API_KEY) { return false; }
  var L = MAIL[lang] || MAIL.en;
  var token = randomToken();
  await env.ACCOUNTS.put('rst:' + token, String(email).toLowerCase(),
    { expirationTtl: kind === 'welcome' ? WELCOME_LINK_TTL_S : RESET_LINK_TTL_S });
  var link = SITE + '/product/?reset=' + token;
  var w = kind === 'welcome';
  var subject = w ? L.wS : L.rS;
  var head = w ? L.wH : L.rH;
  var para = w ? L.wP : L.rP;
  var btn = w ? L.wB : L.rB;
  var html =
    '<div style="background:#140418;padding:40px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">' +
      '<div style="max-width:460px;margin:0 auto;background:#1c0f26;border:1px solid #3a2448;border-radius:20px;padding:32px 28px;color:#fff6fb">' +
        '<div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#f8d3ec;margin-bottom:18px">AstroMap</div>' +
        '<h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;font-weight:700;color:#fff6fb">' + htmlEsc(head) + '</h1>' +
        '<p style="margin:0 0 26px;font-size:16px;line-height:1.5;color:#e6d6e2">' + htmlEsc(para) + '</p>' +
        '<a href="' + link + '" style="display:inline-block;padding:15px 26px;border-radius:999px;background:#f8d3ec;color:#2a0f2e;' +
          'font-size:16px;font-weight:700;text-decoration:none">' + htmlEsc(btn) + '</a>' +
        '<p style="margin:26px 0 0;font-size:13px;line-height:1.5;color:#a993a5">' + htmlEsc(L.f) + '</p>' +
      '</div>' +
    '</div>';
  var text = head + '\n\n' + para + '\n\n' + btn + ': ' + link + '\n\n' + L.f;
  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM || 'AstroMap <hello@astromap.me>', to: [email],
      subject: subject, html: html, text: text })
  });
  return res.ok;
}

/* client_reference_id из воронки: <вариант>_<m|y>_<язык>_<uuid>. */
function parseRef(ref) {
  var p = String(ref || '').split('_');
  return { variant: p[0] || '', plan: p[1] || '', lang: /^[a-z]{2}$/.test(p[2] || '') ? p[2] : 'en' };
}

/* --- действия ------------------------------------------------------------ */
function strField(body, k) { return typeof body[k] === 'string' ? body[k].trim() : ''; }

async function getPaidSession(env, sessionId) {
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) { return null; }
  try {
    var s = await stripe(env, 'GET', '/checkout/sessions/' + sessionId);
    var paid = s.status === 'complete' &&
      (s.payment_status === 'paid' || s.payment_status === 'no_payment_required');
    var email = (s.customer_details && s.customer_details.email) || s.customer_email || '';
    return { paid: paid, email: email, customer: typeof s.customer === 'string' ? s.customer : (s.customer && s.customer.id),
      created: (s.created || 0) * 1000, ref: s.client_reference_id };
  } catch (e) { return null; }
}

async function handleClaimInfo(env, body) {
  var sessionId = strField(body, 'sessionId');
  var s = await getPaidSession(env, sessionId);
  if (!s) { return denied('bad_link'); }
  if (!s.paid) { return json({ ok: true, ready: false }); }
  var used = !!(await env.ACCOUNTS.get('used:' + sessionId));
  var acct = s.email ? await loadAcct(env, s.email) : null;
  return json({ ok: true, ready: true, email: s.email, used: used || !!(acct && acct.hash) });
}

async function handleClaim(env, body) {
  var sessionId = strField(body, 'sessionId');
  var password = typeof body.password === 'string' ? body.password : '';
  if (!sessionId || !password) { return json({ ok: false, reason: 'missing_fields' }, 400); }
  if (password.length < MIN_PASSWORD) { return denied('weak_password'); }
  var s = await getPaidSession(env, sessionId);
  if (!s) { return denied('bad_link'); }
  if (!s.paid || !s.email) { return denied('not_paid'); }
  /* Ссылка с session_id — разовая: тот, кому она попадётся позже (история
     браузера, пересланный адрес), пароль уже не сменит. */
  if (await env.ACCOUNTS.get('used:' + sessionId)) { return denied('session_used'); }
  if (Date.now() - s.created > CLAIM_WINDOW_MS) { return denied('session_used'); }
  /* Почту на чекауте Stripe не подтверждает. Если у этой почты пароль уже
     есть, оплата его не перезаписывает — иначе любой, купив подписку на
     чужой адрес, забрал бы чужой аккаунт. Вернувшемуся покупателю хватит
     входа по старому паролю (новую подписку проверка найдёт по почте), а
     забывшему — ссылки на почту. */
  var existing = await loadAcct(env, s.email);
  if (existing && existing.hash) { return denied('session_used'); }
  var acct = await upsertAccount(env, s.email, s.customer);
  await setPassword(env, acct, password);
  await env.ACCOUNTS.put('used:' + sessionId, '1', { expirationTtl: 30 * 24 * 3600 });
  return grantIfActive(env, acct);
}

async function handleLogin(env, body) {
  var email = strField(body, 'email');
  var password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) { return json({ ok: false, reason: 'missing_fields' }, 400); }

  var fails = parseInt(await env.ACCOUNTS.get(failKey(email)) || '0', 10);
  if (fails >= MAX_FAILS) { return denied('too_many'); }

  var acct = await loadAcct(env, email);
  if (!acct || !acct.hash) { return denied('no_account'); }

  var hash = await hashPassword(password, unb64u(acct.salt), acct.iter || PBKDF2_ITER);
  if (!sameBytes(hash, unb64u(acct.hash))) {
    await env.ACCOUNTS.put(failKey(email), String(fails + 1), { expirationTtl: FAIL_WINDOW_S });
    return denied('bad_password');
  }
  if (fails) { await env.ACCOUNTS.delete(failKey(email)); }
  return grantIfActive(env, acct);
}

async function sessionAcct(env, token) {
  var data = await readToken(env, token);
  if (!data) { return null; }
  var acct = await loadAcct(env, data.e);
  if (!acct || acct.v !== data.v) { return null; }
  return acct;
}

async function handleSession(env, body) {
  var acct = await sessionAcct(env, body.token);
  if (!acct) { return denied('bad_session'); }
  return grantIfActive(env, acct);
}

async function handleResetRequest(env, body) {
  var email = strField(body, 'email');
  var lang = strField(body, 'lang');
  if (!email || email.indexOf('@') < 1) { return json({ ok: false, reason: 'missing_fields' }, 400); }
  if (!env.RESEND_API_KEY) { return json({ ok: false, reason: 'not_configured' }, 500); }

  var sent = parseInt(await env.ACCOUNTS.get(mailKey(email)) || '0', 10);
  /* Ответ одинаковый, есть аккаунт или нет: по нему нельзя узнать, кто
     подписан. Лимит тоже молчит. */
  if (sent >= MAX_RESET_MAILS) { return json({ ok: true, sent: true }); }

  await env.ACCOUNTS.put(mailKey(email), String(sent + 1), { expirationTtl: 3600 });
  var acct = await loadAcct(env, email);
  if (!acct) {
    /* Оплатил, но аккаунта ещё нет (вебхук не дошёл, вкладку закрыл):
       ищем подписку в Stripe по почте. */
    try {
      var ids = await customersByEmail(env, email);
      var r = await activeIn(env, ids);
      if (r.active) { acct = await addCustomers(env, email, ids); }
    } catch (e) { return json({ ok: false, reason: 'upstream_error' }, 502); }
  }
  if (acct) {
    await sendLinkMail(env, acct.email, acct.hash ? 'reset' : 'welcome', lang);
  }
  return json({ ok: true, sent: true });
}

async function handleReset(env, body) {
  var token = strField(body, 'token');
  var password = typeof body.password === 'string' ? body.password : '';
  if (!token || !password) { return json({ ok: false, reason: 'missing_fields' }, 400); }
  if (password.length < MIN_PASSWORD) { return denied('weak_password'); }
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) { return denied('bad_link'); }
  var email = await env.ACCOUNTS.get('rst:' + token);
  if (!email) { return denied('bad_link'); }
  /* Письмо «создайте пароль» из вебхука приходит раньше, чем заведён
     аккаунт: заводим его здесь, клиентов Stripe найдёт проверка по почте. */
  var acct = await addCustomers(env, email, []);
  await setPassword(env, acct, password);
  await env.ACCOUNTS.delete('rst:' + token);
  return grantIfActive(env, acct);
}

/* Почта для формы на странице ?reset= — чтобы человек видел, для какого
   адреса задаёт пароль, и менеджер паролей сохранил пару правильно. */
async function handleResetInfo(env, body) {
  var token = strField(body, 'token');
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) { return denied('bad_link'); }
  var email = await env.ACCOUNTS.get('rst:' + token);
  if (!email) { return denied('bad_link'); }
  var acct = await loadAcct(env, email);
  return json({ ok: true, ready: true, email: acct ? acct.email : email });
}

async function handlePortal(env, body) {
  var acct = await sessionAcct(env, body.token);
  if (!acct) { return denied('bad_session'); }
  var sub = await checkSubscription(env, acct);
  var known = acct.customers || [];
  var customer = sub.customer || known[known.length - 1];
  if (!customer) { return denied('not_found'); }
  try {
    var p = await stripe(env, 'POST', '/billing_portal/sessions',
      { customer: customer, return_url: SITE + '/product/#settings' });
    return json({ ok: true, url: p.url });
  } catch (e) {
    return json({ ok: false, reason: 'upstream_error' }, 502);
  }
}

/* --- вебхук Stripe ------------------------------------------------------- */
/* Подпись: заголовок Stripe-Signature «t=<время>,v1=<hex>», где hex —
   HMAC-SHA256(секрет вебхука, "<t>.<сырое тело>"). Старше 5 минут — нет. */
async function verifyStripeSignature(secret, header, raw) {
  var t = null, sigs = [];
  String(header || '').split(',').forEach(function (part) {
    var kv = part.split('=');
    if (kv[0] === 't') { t = kv[1]; }
    if (kv[0] === 'v1') { sigs.push(kv[1]); }
  });
  if (!t || !sigs.length) { return false; }
  if (Math.abs(Date.now() / 1000 - parseInt(t, 10)) > 300) { return false; }
  var mac = await hmac(secret, t + '.' + raw);
  var hex = Array.prototype.map.call(mac, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  return sigs.some(function (s) { return sameBytes(enc.encode(s), enc.encode(hex)); });
}

async function handleWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.ACCOUNTS) { return new Response('not configured', { status: 503 }); }
  var raw = await request.text();
  var ok = await verifyStripeSignature(env.STRIPE_WEBHOOK_SECRET, request.headers.get('Stripe-Signature'), raw);
  if (!ok) { return new Response('bad signature', { status: 400 }); }
  var event;
  try { event = JSON.parse(raw); } catch (e) { return new Response('bad json', { status: 400 }); }
  if (event.type === 'checkout.session.completed') {
    var s = event.data && event.data.object;
    var email = s && ((s.customer_details && s.customer_details.email) || s.customer_email);
    /* Вебхук аккаунты не пишет — только письмо «создайте пароль», если
       пароля у этой почты ещё нет. Запись аккаунта отсюда могла бы
       затереть пароль, заданный на сайте секундой раньше (KV раздаёт
       изменения с задержкой, а Stripe повторяет вебхуки). Аккаунт заведут
       claim / reset / reset_request. */
    if (email && (!s.mode || s.mode === 'subscription')) {
      var acct = await loadAcct(env, email);
      if (!acct || !acct.hash) {
        try { await sendLinkMail(env, (acct && acct.email) || email, 'welcome', parseRef(s.client_reference_id).lang); } catch (e) {}
      }
    }
  }
  return new Response('ok');
}

/* --- маршрутизация -------------------------------------------------------- */
async function handle(request, env) {
  var url = new URL(request.url);
  if (request.method === 'POST' && url.pathname === '/stripe/webhook') {
    return handleWebhook(request, env);
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return json({ ok: false, reason: 'method_not_allowed' }, 405);
  }
  if (!env || !env.ACCOUNTS || !env.SESSION_SECRET || !env.STRIPE_SECRET_KEY) {
    return json({ ok: false, reason: 'not_configured' }, 500);
  }

  var body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, reason: 'bad_json' }, 400); }
  if (!body || typeof body !== 'object') { return json({ ok: false, reason: 'bad_json' }, 400); }

  switch (body.action) {
    case 'claim_info': return handleClaimInfo(env, body);
    case 'claim': return handleClaim(env, body);
    case 'login': return handleLogin(env, body);
    case 'session': return handleSession(env, body);
    case 'reset_request': return handleResetRequest(env, body);
    case 'reset_info': return handleResetInfo(env, body);
    case 'reset': return handleReset(env, body);
    case 'portal': return handlePortal(env, body);
    default: return json({ ok: false, reason: 'unknown_action' }, 400);
  }
}

export default {
  async fetch(request, env) {
    return handle(request, env);
  }
};
