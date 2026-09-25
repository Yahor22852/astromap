/* license-verify.js — Cloudflare Worker: проверка доступа к продукту через
   лицензионный ключ Gumroad. Продукт (сайт на GitHub Pages, статика) не может
   сам дёрнуть api.gumroad.com/v2/licenses/verify из браузера — этот эндпоинт
   не отдаёт CORS-заголовки для произвольных источников — поэтому запрос идёт
   через этот воркер (server-to-server, CORS тут ни при чём).

   Деплой: как и horoscope-ai.js — вручную через дашборд Cloudflare (Workers &
   Pages → создать воркер (или новую версию этого же) → Edit code → вставить
   этот файл целиком → Deploy). Настроить в Settings → Variables на воркере:

     GUMROAD_PRODUCT_ID   — id продукта. Планов два — месячный и годовой, и
                            в Gumroad это ДВА РАЗНЫХ ТОВАРА, а не варианты
                            одного, поэтому id здесь тоже два, через запятую:

                              qLndV2lFwurLl79UmoyYvA==,St67olO1UeR0aAiRSBakxw==

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
   has officially ended, not... at the time cancellation is requested»). */

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

  var productIds = String((env && env.GUMROAD_PRODUCT_ID) || '')
    .split(',')
    .map(function (x) { return x.trim(); })
    .filter(function (x) { return x.length > 0; });
  if (!productIds.length) {
    return json({ ok: false, reason: 'not_configured' }, 500);
  }

  /* Ключ принадлежит ровно одному товару, а товаров у нас два — месячный и
     годовой. Какому именно, снаружи не видно: в ключе этого не записано, а
     спрашивать человека, что он покупал, значит перекладывать на него нашу
     бухгалтерию. Поэтому спрашиваем Gumroad по каждому id, пока не совпадёт.

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
      return json({ ok: false, reason: 'upstream_error' }, 502);
    }

    var data;
    try { data = await upstream.json(); } catch (e) { return json({ ok: false, reason: 'upstream_error' }, 502); }

    /* success:false здесь значит «не этот товар», а не «плохой ключ»: у
       Gumroad нет способа спросить «чей это ключ», есть только «принадлежит
       ли он вот этому товару». Поэтому идём к следующему id молча, и
       'not_found' отдаём, только когда кончились все. */
    if (data && data.success === true && data.purchase) {
      purchase = data.purchase;
      break;
    }
  }

  if (!purchase) {
    return json({ ok: true, active: false, reason: 'not_found' });
  }

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
