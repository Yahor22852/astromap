/* license-verify.js — Cloudflare Worker: проверка доступа к продукту через
   лицензионный ключ Gumroad. Продукт (сайт на GitHub Pages, статика) не может
   сам дёрнуть api.gumroad.com/v2/licenses/verify из браузера — этот эндпоинт
   не отдаёт CORS-заголовки для произвольных источников — поэтому запрос идёт
   через этот воркер (server-to-server, CORS тут ни при чём).

   Деплой: как и horoscope-ai.js — вручную через дашборд Cloudflare (Workers &
   Pages → создать воркер (или новую версию этого же) → Edit code → вставить
   этот файл целиком → Deploy). Настроить в Settings → Variables на воркере:

     GUMROAD_PRODUCT_ID   — id продукта (блок с лицензионными ключами на
                            Content-вкладке продукта в Gumroad показывает его
                            же; либо поле "id" в ответе GET /v2/products)

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
   has officially ended, not... at the time cancellation is requested»). */

var ALLOWED_ORIGIN = 'https://yahor22852.github.io';
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

async function handle(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return json({ ok: false, reason: 'method_not_allowed' }, 405);
  }

  var body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, reason: 'bad_json' }, 400); }

  var email = (body && typeof body.email === 'string') ? body.email.trim() : '';
  var licenseKey = (body && typeof body.licenseKey === 'string') ? body.licenseKey.trim() : '';
  if (!email || !licenseKey) {
    return json({ ok: false, reason: 'missing_fields' }, 400);
  }

  var productId = env && env.GUMROAD_PRODUCT_ID;
  if (!productId) {
    return json({ ok: false, reason: 'not_configured' }, 500);
  }

  var form = new URLSearchParams();
  form.set('product_id', productId);
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
    return json({ ok: false, reason: 'upstream_error' }, 502);
  }

  var data;
  try { data = await upstream.json(); } catch (e) { return json({ ok: false, reason: 'upstream_error' }, 502); }

  if (!data || data.success !== true || !data.purchase) {
    return json({ ok: true, active: false, reason: 'not_found' });
  }

  var purchase = data.purchase;

  if (purchase.email && String(purchase.email).trim().toLowerCase() !== email.toLowerCase()) {
    return json({ ok: true, active: false, reason: 'email_mismatch' });
  }
  if (purchase.refunded) { return json({ ok: true, active: false, reason: 'refunded' }); }
  if (purchase.disputed) { return json({ ok: true, active: false, reason: 'disputed' }); }
  if (purchase.chargebacked) { return json({ ok: true, active: false, reason: 'refunded' }); }
  /* subscription_ended_at — единственное поле, означающее «доступ должен
     закончиться прямо сейчас». subscription_cancelled_at может стоять, пока
     оплаченный период ещё не закончился — это ожидаемо, доступ остаётся. */
  if (purchase.subscription_ended_at) { return json({ ok: true, active: false, reason: 'subscription_ended' }); }

  return json({ ok: true, active: true, email: purchase.email || email });
}

export default {
  async fetch(request, env) {
    return handle(request, env);
  }
};
