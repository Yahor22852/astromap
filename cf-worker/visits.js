/* visits.js — Cloudflare Worker: счётчик заходов на astromap.me по ссылкам.

   Зачем: понять, сколько людей пришло по какой ссылке (реклама, блогер,
   био в соцсети), без сторонней аналитики, cookies и баннера согласия.
   Воронка при первом открытии вкладки шлёт сюда один «заход» с меткой
   источника из адреса, воркер прибавляет единицу к счётчику дня. Больше
   ничего не хранится: ни IP, ни user-agent, ни идентификатора человека.

   МЕТКИ В ССЫЛКЕ. Источник берётся из адреса, по которому человек пришёл:
     astromap.me/?utm_source=tiktok&utm_campaign=sept_promo
     astromap.me/?src=blogger_anna          — короткая форма, то же самое
   Без меток источником становится домен, с которого перешли (referrer),
   а если его нет — direct. Метки приводятся к нижнему регистру, лишние
   символы выбрасываются, длина — до 40 знаков.

   Второе назначение воркера — передача оплаты из TikTok в настоящий
   браузер (/handoff/put, /handoff/take), см. раздел handoff ниже.

   Деплой — как у license-verify.js и horoscope-ai.js, вручную в дашборде
   Cloudflare. Пошагово — в funnel/README.md, раздел «Счётчик заходов».
   Коротко: воркер astromap-visits с этим кодом, база D1 с привязкой DB,
   секрет STATS_KEY. Таблицу воркер создаёт сам при первом заходе.

   Сводка: https://astromap-visits.<аккаунт>.workers.dev/stats?key=<STATS_KEY>
     &days=30 — сколько дней показать (по умолчанию 30, максимум 90).
     &format=json — то же самое данными, а не таблицей.

   ПОЧЕМУ D1, А НЕ KV. Первая версия держала день в одном ключе KV. KV
   принимает не больше одной записи в секунду в ключ и раздаёт новые
   значения по миру с задержкой до минуты — при рекламном наплыве
   счётчик терял бы заметную долю заходов, а бесплатный лимит KV — 1000
   записей в сутки. В D1 прибавление единицы — один атомарный UPSERT,
   бесплатно до 100 000 записей в сутки.

   Таблица visits(day, label, n): день (UTC), метка «источник / кампания»,
   число заходов. Защита от мусора: принимаются только запросы со
   страницы astromap.me (заголовок Origin), и за день заводится не
   больше MAX_SOURCES_PER_DAY разных меток — остальные складываются в
   «other». Накрутить счётчик руками при желании можно: это счётчик
   заходов, а не биллинг. */

var ALLOWED_ORIGIN = 'https://astromap.me';
var MAX_SOURCES_PER_DAY = 200;

function clean(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '').slice(0, 40);
}

function today() { return new Date().toISOString().slice(0, 10); }

var SCHEMA = 'CREATE TABLE IF NOT EXISTS visits (' +
  'day TEXT NOT NULL, label TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, ' +
  'PRIMARY KEY (day, label))';

/* Запрос к таблице; если её ещё нет (первый заход после деплоя) —
   создаём и повторяем. Так в дашборде не нужно ничего запускать руками. */
async function run(env, fn, schema) {
  try { return await fn(); }
  catch (e) {
    if (!/no such table/i.test(String(e && e.message))) { throw e; }
    await env.DB.exec(schema || SCHEMA);
    return fn();
  }
}

async function hit(request, env) {
  if (request.headers.get('Origin') !== ALLOWED_ORIGIN) {
    return new Response(null, { status: 403 });
  }
  if (!env || !env.DB) { return new Response(null, { status: 503 }); }

  var data = {};
  try { data = JSON.parse(await request.text()); } catch (e) { data = {}; }
  var source = clean(data.source) || 'direct';
  var campaign = clean(data.campaign);
  var label = campaign ? source + ' / ' + campaign : source;
  var day = today();

  await run(env, async function () {
    var known = await env.DB.prepare(
      'SELECT (SELECT COUNT(*) FROM visits WHERE day = ?1) AS labels, ' +
      'EXISTS (SELECT 1 FROM visits WHERE day = ?1 AND label = ?2) AS has'
    ).bind(day, label).first();
    if (!known.has && known.labels >= MAX_SOURCES_PER_DAY) { label = 'other'; }
    await env.DB.prepare(
      'INSERT INTO visits (day, label, n) VALUES (?1, ?2, 1) ' +
      'ON CONFLICT (day, label) DO UPDATE SET n = n + 1'
    ).bind(day, label).run();
  });
  /* Ответ браузеру не нужен: sendBeacon его не читает. CORS-заголовок
     всё равно ставим — на случай отправки через fetch. */
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
  });
}

/* --- передача оплаты из TikTok в настоящий браузер ---------------------

   Apple Pay и Google Pay во встроенном браузере TikTok недоступны, а его
   «••• → Открыть в браузере» отдаёт Safari исходную ссылку из профиля, без
   ответов квиза. Поэтому по кнопке «Оплатить через Apple Pay» страница в
   TikTok кладёт сюда ответы и план (POST /handoff/put), а та же страница,
   открытая в Safari по ссылке из профиля, забирает их (POST /handoff/take)
   и сразу уходит на чекаут.

   КАК УЗНАЁТСЯ «ТОТ ЖЕ ТЕЛЕФОН». Запись ищется по паре «IP + отпечаток
   устройства». Отпечаток считает страница: экран, плотность пикселей,
   часовой пояс, число ядер, точки касания, платформа — то, что у
   встроенного браузера TikTok и у Safari на одном телефоне совпадает.
   Одного IP мало: через мобильного оператора с одного адреса выходят
   тысячи людей, и чужой заказ с чужой датой рождения достался бы
   случайному человеку. Одного отпечатка тоже мало — одинаковых iPhone
   много. Вместе, да ещё в окне 30 минут, совпадение двух людей —
   практически исключено. IPv6 сравнивается по первым 64 битам: телефон
   меняет вторую половину адреса сам.

   Что хранится: ответы квиза и план, не дольше HANDOFF_TTL_MS, и запись
   удаляется при первом же чтении. IP и отпечаток — только хэшами.

   Если IP в Safari другой (Частный узел iCloud, или одно приложение ходит
   через IPv6, а другое через IPv4), запись не отдаётся, а ответ говорит
   hint: true — «есть ожидающая оплата с таким же устройством». Тогда
   страница показывает кнопку «Продолжить оплату» и берёт ссылку из буфера
   обмена, куда её положила кнопка в TikTok. Сами данные по одному
   отпечатку не отдаются никогда. */
var HANDOFF_TTL_MS = 30 * 60 * 1000;
/* handoff2, а не handoff: у записи появились поля для второго уровня
   сравнения, и новая таблица проще миграции. Старая просто пустеет. */
var HANDOFF_SCHEMA = 'CREATE TABLE IF NOT EXISTS handoff2 (' +
  'id TEXT PRIMARY KEY, fp TEXT NOT NULL, coarse TEXT NOT NULL, token TEXT NOT NULL, ' +
  'plan TEXT NOT NULL, data TEXT NOT NULL, created INTEGER NOT NULL)';

function expandIPv6(ip) {
  var parts = ip.split('::');
  var head = parts[0] ? parts[0].split(':') : [];
  var tail = parts.length > 1 && parts[1] ? parts[1].split(':') : [];
  var fill = [];
  for (var i = head.length + tail.length; i < 8; i++) { fill.push('0'); }
  return head.concat(fill, tail).map(function (h) { return ('0000' + h).slice(-4); });
}

function ipKey(request) {
  var ip = request.headers.get('CF-Connecting-IP') || '';
  if (ip.indexOf(':') >= 0) { return expandIPv6(ip.toLowerCase()).slice(0, 4).join(':'); }
  return ip;
}

async function sha(text) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.prototype.map.call(new Uint8Array(buf), function (b) {
    return ('0' + b.toString(16)).slice(-2);
  }).join('');
}

function jsonReply(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN
    }
  });
}

/* Три уровня, от точного к осторожному:

   1. IP + полный отпечаток совпали — данные отдаются сразу, страница
      уходит на чекаут.
   2. Совпали только IP и грубый отпечаток (тип телефона + часовой пояс) —
      потому что Safari 26 по умолчанию искажает часть характеристик
      устройства (Advanced Fingerprinting Protection), и полный отпечаток
      из TikTok с ним не сходится. Данные НЕ отдаются: ответ — confirm и
      одноразовый token, страница показывает «Заверши оплату, начатую в
      TikTok», и только по нажатию забирает запись (/handoff/claim, снова
      с проверкой IP и грубого отпечатка). Если таких записей с этого IP
      несколько — неясно, чья, и не отдаётся ничего.
   3. Совпал только полный отпечаток, IP другой — hint: страница
      предлагает взять ссылку из буфера обмена.

   /handoff/whoami — для отладочной страницы ?fpdebug: семейство адреса и
   короткий хэш, по которым видно, одинаковый ли IP у TikTok и Safari. */
async function handoff(request, env, action) {
  if (request.headers.get('Origin') !== ALLOWED_ORIGIN) { return jsonReply({ ok: false }, 403); }
  if (!env || !env.DB) { return jsonReply({ ok: false, reason: 'not_configured' }, 503); }
  var ip = ipKey(request);
  if (action === 'whoami') {
    return jsonReply({ ok: true, family: ip.indexOf(':') >= 0 ? 'IPv6' : 'IPv4', tag: (await sha('tag|' + ip)).slice(0, 10) });
  }
  var body = {};
  try { body = JSON.parse(await request.text()); } catch (e) { body = {}; }
  var fp = String(body.fp || ''), coarse = String(body.coarse || '');
  if (!fp || fp.length > 300 || !coarse || coarse.length > 120) { return jsonReply({ ok: false }, 400); }
  var fpHash = await sha('fp|' + fp);
  var id = await sha(ip + '|' + fp);
  var coarseHash = await sha(ip + '|coarse|' + coarse);
  var now = Date.now(), since = now - HANDOFF_TTL_MS;

  if (action === 'put') {
    var plan = body.plan === 'yearly' ? 'yearly' : (body.plan === 'monthly' ? 'monthly' : '');
    var data = typeof body.data === 'string' ? body.data : '';
    if (!plan || !data || data.length > 6000) { return jsonReply({ ok: false }, 400); }
    var token = crypto.randomUUID();
    await run(env, async function () {
      await env.DB.prepare('DELETE FROM handoff2 WHERE created < ?1').bind(since).run();
      await env.DB.prepare(
        'INSERT INTO handoff2 (id, fp, coarse, token, plan, data, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ' +
        'ON CONFLICT (id) DO UPDATE SET fp = ?2, coarse = ?3, token = ?4, plan = ?5, data = ?6, created = ?7'
      ).bind(id, fpHash, coarseHash, token, plan, data, now).run();
    }, HANDOFF_SCHEMA);
    return jsonReply({ ok: true });
  }

  if (action === 'claim') {
    var t = String(body.token || '');
    var claimed = await run(env, function () {
      return env.DB.prepare('SELECT id, plan, data FROM handoff2 WHERE token = ?1 AND coarse = ?2 AND created >= ?3')
        .bind(t, coarseHash, since).first();
    }, HANDOFF_SCHEMA);
    if (!claimed) { return jsonReply({ ok: false }); }
    await env.DB.prepare('DELETE FROM handoff2 WHERE id = ?1').bind(claimed.id).run();
    return jsonReply({ ok: true, plan: claimed.plan, data: claimed.data });
  }

  /* take */
  var row = await run(env, function () {
    return env.DB.prepare('SELECT plan, data FROM handoff2 WHERE id = ?1 AND created >= ?2')
      .bind(id, since).first();
  }, HANDOFF_SCHEMA);
  if (row) {
    await env.DB.prepare('DELETE FROM handoff2 WHERE id = ?1').bind(id).run();
    return jsonReply({ ok: true, plan: row.plan, data: row.data });
  }
  var near = await env.DB.prepare('SELECT token FROM handoff2 WHERE coarse = ?1 AND created >= ?2 LIMIT 2')
    .bind(coarseHash, since).all();
  var list = (near && near.results) || [];
  if (list.length === 1) { return jsonReply({ ok: false, confirm: true, token: list[0].token }); }
  var hint = await env.DB.prepare('SELECT 1 AS x FROM handoff2 WHERE fp = ?1 AND created >= ?2 LIMIT 1')
    .bind(fpHash, since).first();
  return jsonReply({ ok: false, hint: !!hint });
}

/* --- оплата внутри окна в TikTok: как странице узнать, что она прошла ---

   После оплаты в окне (iframe) Gumroad пытается увести ВСЮ страницу на
   страницу доступа, браузер это без нажатия не пускает, и в окне остаётся
   «Sorry, something went wrong». Поэтому страница узнаёт об оплате сама:

   - к ссылке чекаута в окне добавлен одноразовый номер astro_sid (UUID,
     его знает только эта страница);
   - Gumroad Ping (Gumroad → Settings → Advanced → Ping endpoint =
     https://astromap-visits.<аккаунт>.workers.dev/gumroad/ping) присылает
     о продаже почту, лицензионный ключ и параметры ссылки — среди них
     url_params[astro_sid];
   - страница раз в несколько секунд спрашивает POST /purchase/status
     { sid } и, получив paid, закрывает окно и предлагает войти с уже
     вписанными почтой и ключом.

   Подписи у Gumroad Ping нет. Поддельный ping с чужим sid ничего не даёт:
   sid знает только открывшая его страница, а ключ всё равно проверяет
   license-verify при входе. Если задан GUMROAD_SELLER_ID, ping от другого
   продавца отбрасывается. Записи живут PURCHASE_TTL_MS. */
var PURCHASE_TTL_MS = 2 * 3600 * 1000;
var PURCHASE_SCHEMA = 'CREATE TABLE IF NOT EXISTS purchase (' +
  'sid TEXT PRIMARY KEY, email TEXT NOT NULL, license TEXT NOT NULL, created INTEGER NOT NULL)';

async function gumroadPing(request, env) {
  if (!env || !env.DB) { return new Response('not configured', { status: 503 }); }
  var form = new URLSearchParams(await request.text());
  if (env.GUMROAD_SELLER_ID && form.get('seller_id') !== env.GUMROAD_SELLER_ID) {
    return new Response('ok');
  }
  var sid = form.get('url_params[astro_sid]') || '';
  if (!/^[0-9a-f-]{20,64}$/i.test(sid)) { return new Response('ok'); }
  var email = String(form.get('email') || '').slice(0, 200);
  var license = String(form.get('license_key') || '').slice(0, 100);
  var now = Date.now();
  await run(env, async function () {
    await env.DB.prepare('DELETE FROM purchase WHERE created < ?1').bind(now - PURCHASE_TTL_MS).run();
    await env.DB.prepare(
      'INSERT INTO purchase (sid, email, license, created) VALUES (?1, ?2, ?3, ?4) ' +
      'ON CONFLICT (sid) DO UPDATE SET email = ?2, license = ?3, created = ?4'
    ).bind(sid, email, license, now).run();
  }, PURCHASE_SCHEMA);
  return new Response('ok');
}

async function purchaseStatus(request, env) {
  if (request.headers.get('Origin') !== ALLOWED_ORIGIN) { return jsonReply({ ok: false }, 403); }
  if (!env || !env.DB) { return jsonReply({ ok: false, reason: 'not_configured' }, 503); }
  var body = {};
  try { body = JSON.parse(await request.text()); } catch (e) { body = {}; }
  var sid = String(body.sid || '');
  if (!/^[0-9a-f-]{20,64}$/i.test(sid)) { return jsonReply({ ok: false }, 400); }
  var row = await run(env, function () {
    return env.DB.prepare('SELECT email, license FROM purchase WHERE sid = ?1 AND created >= ?2')
      .bind(sid, Date.now() - PURCHASE_TTL_MS).first();
  }, PURCHASE_SCHEMA);
  if (!row) { return jsonReply({ ok: true, paid: false }); }
  return jsonReply({ ok: true, paid: true, email: row.email, licenseKey: row.license });
}

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function stats(url, env) {
  if (!env || !env.DB || !env.STATS_KEY) {
    return new Response('not configured', { status: 503 });
  }
  if (url.searchParams.get('key') !== env.STATS_KEY) {
    return new Response('forbidden', { status: 403 });
  }
  var days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  var dates = [];
  for (var i = 0; i < days; i++) {
    dates.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  var res = await run(env, function () {
    return env.DB.prepare('SELECT day, label, n FROM visits WHERE day >= ?1')
      .bind(dates[dates.length - 1]).all();
  });
  var byDate = {};
  (res.results || []).forEach(function (r) {
    (byDate[r.day] = byDate[r.day] || {})[r.label] = r.n;
  });
  var perDay = dates.map(function (d) { return byDate[d]; });

  var total = {}, rows = [];
  dates.forEach(function (d, i) {
    var c = perDay[i] || {};
    var sum = 0;
    Object.keys(c).forEach(function (k) { total[k] = (total[k] || 0) + c[k]; sum += c[k]; });
    rows.push({ date: d, total: sum, sources: c });
  });
  var bySource = Object.keys(total).map(function (k) { return { source: k, visits: total[k] }; })
    .sort(function (a, b) { return b.visits - a.visits; });
  var all = bySource.reduce(function (s, r) { return s + r.visits; }, 0);

  if (url.searchParams.get('format') === 'json') {
    return new Response(JSON.stringify({ days: days, total: all, bySource: bySource, byDay: rows }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  var html = '<!doctype html><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>AstroMap visits</title><style>' +
    'body{font:15px/1.4 -apple-system,system-ui,sans-serif;margin:24px;color:#111;background:#fff}' +
    'table{border-collapse:collapse;margin:8px 0 28px}td,th{padding:6px 12px;border-bottom:1px solid #ddd;text-align:left}' +
    'td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}h2{font-size:16px;margin:0}' +
    '@media(prefers-color-scheme:dark){body{background:#111;color:#eee}td,th{border-color:#333}}' +
    '</style>' +
    '<h1>Заходы за ' + days + ' дн.: ' + all + '</h1>' +
    '<h2>По источникам</h2><table><tr><th>Источник / кампания</th><th class="n">Заходов</th></tr>' +
    bySource.map(function (r) {
      return '<tr><td>' + esc(r.source) + '</td><td class="n">' + r.visits + '</td></tr>';
    }).join('') + '</table>' +
    '<h2>По дням</h2><table><tr><th>Дата</th><th class="n">Всего</th><th>Источники</th></tr>' +
    rows.filter(function (r) { return r.total; }).map(function (r) {
      var parts = Object.keys(r.sources).sort(function (a, b) { return r.sources[b] - r.sources[a]; })
        .map(function (k) { return esc(k) + ': ' + r.sources[k]; }).join(', ');
      return '<tr><td>' + r.date + '</td><td class="n">' + r.total + '</td><td>' + parts + '</td></tr>';
    }).join('') + '</table>';
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      } });
    }
    if (request.method === 'POST' && url.pathname === '/hit') { return hit(request, env); }
    if (request.method === 'POST' && url.pathname === '/handoff/put') { return handoff(request, env, 'put'); }
    if (request.method === 'POST' && url.pathname === '/handoff/take') { return handoff(request, env, 'take'); }
    if (request.method === 'POST' && url.pathname === '/handoff/claim') { return handoff(request, env, 'claim'); }
    if (request.method === 'POST' && url.pathname === '/gumroad/ping') { return gumroadPing(request, env); }
    if (request.method === 'POST' && url.pathname === '/purchase/status') { return purchaseStatus(request, env); }
    if (request.method === 'POST' && url.pathname === '/handoff/whoami') { return handoff(request, env, 'whoami'); }
    if (request.method === 'GET' && url.pathname === '/stats') { return stats(url, env); }
    return new Response('not found', { status: 404 });
  }
};
