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

   Деплой — как у license-verify.js и horoscope-ai.js, вручную в дашборде
   Cloudflare:
     1. Workers & Pages → Create → Worker, имя astromap-visits (тогда адрес
        совпадёт с VISITS_URL в funnel/index.html; другое имя — поправь там).
        Edit code → вставить этот файл целиком → Deploy.
     2. Workers & Pages → KV → Create namespace (например astromap-visits).
        В воркере Settings → Bindings → Add → KV namespace,
        Variable name: VISITS.
     3. Settings → Variables → Add, тип Secret: STATS_KEY — любой длинный
        пароль. Им открывается сводка.

   Сводка: https://astromap-visits.<аккаунт>.workers.dev/stats?key=<STATS_KEY>
     &days=30 — сколько дней показать (по умолчанию 30, максимум 90).
     &format=json — то же самое данными, а не таблицей.

   Хранение: один ключ KV на день, day:YYYY-MM-DD → { "tiktok / sept_promo": 12,
   ... }, живёт 400 дней. KV не умеет атомарный инкремент, поэтому два
   захода в одну и ту же миллисекунду могут засчитаться как один. Для
   сравнения ссылок между собой это не важно; для точного счёта на большом
   трафике нужен Durable Object или Analytics Engine.

   Защита от мусора: принимаются только запросы со страницы astromap.me
   (заголовок Origin), и за день сохраняется не больше MAX_SOURCES_PER_DAY
   разных меток — остальные складываются в «other». Накрутить счётчик
   руками при желании можно: это счётчик заходов, а не биллинг. */

var ALLOWED_ORIGIN = 'https://astromap.me';
var MAX_SOURCES_PER_DAY = 200;
var DAY_TTL_S = 400 * 24 * 3600;

function clean(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '').slice(0, 40);
}

function today() { return new Date().toISOString().slice(0, 10); }

async function hit(request, env) {
  if (request.headers.get('Origin') !== ALLOWED_ORIGIN) {
    return new Response(null, { status: 403 });
  }
  if (!env || !env.VISITS) { return new Response(null, { status: 503 }); }

  var data = {};
  try { data = JSON.parse(await request.text()); } catch (e) { data = {}; }
  var source = clean(data.source) || 'direct';
  var campaign = clean(data.campaign);
  var label = campaign ? source + ' / ' + campaign : source;

  var key = 'day:' + today();
  var counts = (await env.VISITS.get(key, 'json')) || {};
  if (!(label in counts) && Object.keys(counts).length >= MAX_SOURCES_PER_DAY) {
    label = 'other';
  }
  counts[label] = (counts[label] || 0) + 1;
  await env.VISITS.put(key, JSON.stringify(counts), { expirationTtl: DAY_TTL_S });
  /* Ответ браузеру не нужен: sendBeacon его не читает. CORS-заголовок
     всё равно ставим — на случай отправки через fetch. */
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
  });
}

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function stats(url, env) {
  if (!env || !env.VISITS || !env.STATS_KEY) {
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
  var perDay = await Promise.all(dates.map(function (d) { return env.VISITS.get('day:' + d, 'json'); }));

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
    if (request.method === 'GET' && url.pathname === '/stats') { return stats(url, env); }
    return new Response('not found', { status: 404 });
  }
};
