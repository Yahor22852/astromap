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

/* --- страна -------------------------------------------------------------

   Страну определяет Cloudflare по адресу, с которого пришёл запрос
   (request.cf.country, двухбуквенный код: PL, US). Сам адрес нигде не
   хранится. Отдельная таблица, а не столбец в visits и steps: у тех
   первичный ключ без страны, и новая таблица проще миграции.
   by_country(day, kind, key, cc, n): kind — visit (key — метка источника)
   или step (key — шаг воронки). XX — страна неизвестна, T1 — Tor. */
var CC_SCHEMA = 'CREATE TABLE IF NOT EXISTS by_country (' +
  'day TEXT NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, cc TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, ' +
  'PRIMARY KEY (day, kind, key, cc))';

function countryOf(request) {
  var cc = String((request.cf && request.cf.country) || '').toUpperCase();
  return /^[A-Z][A-Z0-9]$/.test(cc) ? cc : 'XX';
}

async function addCountry(env, kind, key, cc) {
  await run(env, function () {
    return env.DB.prepare(
      'INSERT INTO by_country (day, kind, key, cc, n) VALUES (?1, ?2, ?3, ?4, 1) ' +
      'ON CONFLICT (day, kind, key, cc) DO UPDATE SET n = n + 1'
    ).bind(today(), kind, key, cc).run();
  }, CC_SCHEMA);
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
  await addCountry(env, 'visit', label, countryOf(request));
  /* Ответ браузеру не нужен: sendBeacon его не читает. CORS-заголовок
     всё равно ставим — на случай отправки через fetch. */
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }
  });
}

/* --- шаги воронки --------------------------------------------------------

   Чтобы видеть, где отваливаются. Воронка шлёт POST /step { step } один раз
   за вкладку на каждый экран, до которого человек дошёл, и на нажатия
   «оплатить»; оплату (paid_m, paid_y) прибавляет сам воркер по Gumroad Ping.
   Таблица steps(day, step, n) — то же устройство, что у visits: день,
   шаг, счётчик. Имена шагов — только из списка ниже, иначе 400: таблицу
   не забить мусором. */
var FUNNEL_STEPS = {
  s1:      'Дата рождения',
  s2:      'Темы карты',
  s3:      'Время и город',
  s4:      'Дата партнёра',
  s5:      'Карта готова',
  s6:      'Пейвол: месяц',
  pay_m:   'Нажали «оплатить» за месяц',
  s7:      'Отказались → годовой план',
  pay_y:   'Нажали «оплатить» за год',
  wallet_m: 'Нажали Apple Pay / Google Pay (месяц)',
  wallet_y: 'Нажали Apple Pay / Google Pay (год)',
  reading: 'Ушли в бесплатное чтение',
  paid_m:  'Оплатили месяц',
  paid_y:  'Оплатили год',

  /* Эксперимент: прежняя воронка ('a', шаги выше) против квиза v2 ('q2').
     Оплаты по вариантам — по метке astro_v на ссылке чекаута, которую
     Gumroad возвращает в Ping (см. gumroadPing). */
  a_paid_m:  'A: оплатили месяц',
  a_paid_y:  'A: оплатили год',
  q2_goal:    'v2: цель',
  q2_ctx:     'v2: контекст цели',
  q2_dob:     'v2: дата рождения',
  q2_sun:     'v2: Солнце',
  q2_tk:      'v2: знает ли время',
  q2_time:    'v2: время',
  q2_place:   'v2: место',
  q2_core:    'v2: основа карты',
  q2_extra:   'v2: доп. темы',
  q2_start:   'v2: с чего начать',
  q2_pask:    'v2: добавить пару?',
  q2_pdate:   'v2: дата пары',
  q2_preview: 'v2: превью',
  q2_bridge:  'v2: небо меняется',
  q2_pay:     'v2: пейвол (месяц)',
  q2_pay_m:   'v2: нажали «оплатить» месяц',
  q2_year:    'v2: годовой план',
  q2_pay_y:   'v2: нажали «оплатить» год',
  q2_reading: 'v2: ушли в бесплатное чтение',
  q2_tk_no:   'v2: время неизвестно',
  q2_pask_no: 'v2: пару пропустили',
  q2_err_date:'v2: дата скорректирована (нет такого дня / будущее)',
  q2_place_nf:'v2: «моего места нет в списке»',
  q2_pv_fail: 'v2: превью не загрузилось',
  q2_pv_tab:  'v2: переключали вкладки превью',
  q2_paid_m:  'v2: оплатили месяц',
  q2_paid_y:  'v2: оплатили год'
};
var STEPS_SCHEMA = 'CREATE TABLE IF NOT EXISTS steps (' +
  'day TEXT NOT NULL, step TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, ' +
  'PRIMARY KEY (day, step))';

async function addStep(env, step) {
  await run(env, function () {
    return env.DB.prepare(
      'INSERT INTO steps (day, step, n) VALUES (?1, ?2, 1) ' +
      'ON CONFLICT (day, step) DO UPDATE SET n = n + 1'
    ).bind(today(), step).run();
  }, STEPS_SCHEMA);
}

async function stepHit(request, env) {
  if (request.headers.get('Origin') !== ALLOWED_ORIGIN) { return new Response(null, { status: 403 }); }
  if (!env || !env.DB) { return new Response(null, { status: 503 }); }
  var data = {};
  try { data = JSON.parse(await request.text()); } catch (e) { data = {}; }
  var step = String(data.step || '');
  /* Оплату присылает только Gumroad, не страница. */
  if (!FUNNEL_STEPS[step] || /(^|_)paid_/.test(step)) { return new Response(null, { status: 400 }); }
  await addStep(env, step);
  await addCountry(env, 'step', step, countryOf(request));
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } });
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
  /* Новая продажа — шаг воронки «оплатили». Продления подписки
     (is_recurring_charge) и тестовые покупки не считаются. Ping приходит
     на каждую продажу, а не только на оплаченные в окне TikTok, поэтому
     считаем до проверки astro_sid. */
  if (form.get('is_recurring_charge') !== 'true' && form.get('test') !== 'true') {
    var per = /year/i.test(form.get('recurrence') || '') ? 'y' : 'm';
    await addStep(env, 'paid_' + per);
    /* Вариант эксперимента — метка astro_v на ссылке чекаута. Без метки
       (прямая ссылка, старая вкладка) продажа в варианты не попадает. */
    var variant = form.get('url_params[astro_v]') || '';
    if (variant === 'q2' || variant === 'a') { await addStep(env, variant + '_paid_' + per); }
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
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* --- сводка /stats -----------------------------------------------------

   Страница для человека, а не для аналитика. Метки из базы (tiktok, ig,
   google.com, direct) превращаются в каналы с понятным названием и
   пояснением, служебные проверки (test, deploy_check) в итоги не входят,
   а сверху итоги сказаны одной фразой.

   Цвет закреплён за каналом, а не за местом в списке: TikTok синий на
   любом периоде. Восемь цветных каналов — проверенная на дальтонизм
   палитра в этом порядке; всё остальное на графике — серое «Другое»,
   «Без источника» — тёмно-серое. */

var CHANNELS = {
  tiktok:    { name: 'TikTok', hint: 'перешли по ссылке из профиля TikTok', color: 's1' },
  instagram: { name: 'Instagram', hint: 'перешли по ссылке из Instagram', color: 's2' },
  google:    { name: 'Google', hint: 'нашли сайт в поиске Google', color: 's3' },
  yandex:    { name: 'Яндекс', hint: 'нашли сайт в поиске Яндекса', color: 's4' },
  telegram:  { name: 'Telegram', hint: 'перешли по ссылке из Telegram', color: 's5' },
  youtube:   { name: 'YouTube', hint: 'перешли по ссылке с YouTube', color: 's6' },
  vk:        { name: 'ВКонтакте', hint: 'перешли по ссылке из ВКонтакте', color: 's7' },
  facebook:  { name: 'Facebook', hint: 'перешли по ссылке из Facebook', color: 's8' },
  gumroad:   { name: 'Gumroad', hint: 'вернулись на сайт со страницы оплаты Gumroad', color: 'more' },
  other:     { name: 'Прочее', hint: 'за день набралось больше 200 разных меток, лишние сложены сюда', color: 'more' },
  direct:    { name: 'Без источника', hint: 'по ссылке без метки: набрали адрес сами, открыли из закладки, ' +
    'заметок или мессенджера, который не сообщает, откуда человек пришёл. Сюда же попадают ваши собственные заходы', color: 'direct' }
};
/* Порядок снизу вверх в столбике графика и в легенде. */
var SERIES = ['tiktok', 'instagram', 'google', 'yandex', 'telegram', 'youtube', 'vk', 'facebook', 'more', 'direct'];
var SERIES_NAME = { more: 'Другое', direct: 'Без источника' };

/* Метка из ссылки или домен, с которого перешли → канал. Первое
   совпадение выигрывает: «test / check» — служебное, даже если это
   tiktok_test. */
var RULES = [
  ['service',   /^(test|deploy)|check/],
  ['tiktok',    /^(tiktok|tt)$|(^|\.)tiktok\.com$/],
  ['instagram', /^(ig|insta|instagram)$|(^|\.)instagram\.com$/],
  ['google',    /^google$|(^|\.)google\.[a-z.]+$/],
  ['yandex',    /^(yandex|ya)$|(^|\.)(yandex\.[a-z.]+|ya\.ru)$/],
  ['telegram',  /^(tg|telegram)$|^t\.me$|(^|\.)telegram\.org$/],
  ['youtube',   /^(yt|youtube)$|(^|\.)(youtube\.com|youtu\.be)$/],
  ['vk',        /^vk$|(^|\.)vk\.(com|ru)$/],
  ['facebook',  /^(fb|facebook)$|(^|\.)facebook\.com$/],
  ['gumroad',   /(^|\.)gumroad\.com$/],
  ['other',     /^other$/],
  ['direct',    /^direct$/]
];

function channelOf(label) {
  var source = label.split(' / ')[0];
  for (var i = 0; i < RULES.length; i++) {
    if (RULES[i][1].test(source)) {
      var key = RULES[i][0];
      if (key === 'service') { return { key: key }; }
      var c = CHANNELS[key];
      return { key: key, name: c.name, hint: c.hint, color: c.color };
    }
  }
  if (source.indexOf('.') >= 0) {
    return { key: 'site:' + source, name: source, hint: 'перешли со ссылки на этом сайте', color: 'more' };
  }
  return { key: 'tag:' + source, name: source, hint: 'пришли по ссылке с меткой ?src=' + source, color: 'more' };
}

function seriesOf(ch) { return ch.color === 'more' || ch.color === 'direct' ? ch.color : ch.key; }
function seriesName(s) { return SERIES_NAME[s] || CHANNELS[s].name; }
function seriesColor(s) { return CHANNELS[s] ? CHANNELS[s].color : s; }

function plural(n, one, few, many) {
  var a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) { return many; }
  if (b === 1) { return one; }
  if (b >= 2 && b <= 4) { return few; }
  return many;
}
function visitsWord(n) { return plural(n, 'заход', 'захода', 'заходов'); }
function pct(n, all) { return all ? Math.round(n * 100 / all) + '%' : '0%'; }

var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
  'августа', 'сентября', 'октября', 'ноября', 'декабря'];
function dateLong(d) { return parseInt(d.slice(8), 10) + ' ' + MONTHS[parseInt(d.slice(5, 7), 10) - 1]; }
function dateShort(d) { return parseInt(d.slice(8), 10) + ' ' + MONTHS[parseInt(d.slice(5, 7), 10) - 1].slice(0, 3); }

var STATS_CSS = [
  ':root{color-scheme:light;--bg:#f6f6f4;--card:#fff;--ink:#0b0b0b;--ink2:#52514e;--muted:#8a8984;--line:#e6e5e0;',
  '--s1:#2a78d6;--s2:#eb6834;--s3:#1baf7a;--s4:#eda100;--s5:#e87ba4;--s6:#008300;--s7:#4a3aa7;--s8:#e34948;',
  '--more:#bdbcb5;--direct:#6f6e69}',
  '@media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#121211;--card:#1a1a19;--ink:#fff;--ink2:#c3c2b7;',
  '--muted:#8f8e88;--line:#2e2e2b;--s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#c98500;--s5:#d55181;--s6:#008300;',
  '--s7:#9085e9;--s8:#e66767;--more:#5d5c58;--direct:#a3a29b}}',
  '*{box-sizing:border-box}',
  'body{font:16px/1.45 -apple-system,system-ui,"Segoe UI",sans-serif;margin:0;color:var(--ink);background:var(--bg)}',
  'main{max-width:760px;margin:0 auto;padding:20px 16px 48px}',
  'h1{font-size:22px;margin:0 0 4px}h2{font-size:18px;margin:0 0 4px}',
  '.sub{color:var(--ink2);margin:0 0 14px;font-size:15px}',
  '.period{display:flex;gap:6px;margin:14px 0 18px}',
  '.period a{padding:6px 12px;border-radius:999px;border:1px solid var(--line);color:var(--ink2);text-decoration:none;font-size:14px;background:var(--card)}',
  '.period a.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}',
  '.lead{font-size:18px;line-height:1.5;background:var(--card);border-radius:14px;padding:16px 18px;margin:0 0 14px;border:1px solid var(--line)}',
  '.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:0 0 26px}',
  '.tile{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}',
  '.tile .k{font-size:14px;color:var(--ink2)}.tile .v{font-size:32px;font-weight:650;line-height:1.15;margin:4px 0 2px;font-variant-numeric:tabular-nums}',
  '.tile .s{font-size:13px;color:var(--muted)}',
  'section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:0 0 16px}',
  '.src{padding:12px 0;border-top:1px solid var(--line)}.src:first-of-type{border-top:0}',
  '.row{display:flex;justify-content:space-between;align-items:baseline;gap:12px}',
  '.name{font-weight:600;display:flex;align-items:center;gap:8px}',
  '.dot{width:10px;height:10px;border-radius:3px;flex:none}',
  '.num{font-variant-numeric:tabular-nums;white-space:nowrap}.num b{font-size:18px}.num span{color:var(--muted);margin-left:6px;font-size:14px}',
  '.hint{font-size:13px;color:var(--ink2);margin:2px 0 6px 18px}',
  '.bar{height:6px;border-radius:0 4px 4px 0;margin-left:18px}',
  '.part{display:flex;justify-content:space-between;font-size:14px;color:var(--ink2);margin:4px 0 0 18px}',
  '.note{font-size:13px;color:var(--muted);margin:12px 0 0}',
  '.legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--ink2);margin:8px 0 12px}',
  '.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}',
  '.bars{display:flex;align-items:flex-end;gap:4px;height:190px;border-bottom:1px solid var(--line)}',
  '.col{flex:1 1 0;max-width:56px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;',
  'background:none;border:0;padding:0 0 1px;cursor:pointer;font:inherit;color:inherit;min-width:0}',
  '.col .n{font-size:12px;color:var(--ink2);text-align:center;margin-bottom:3px;font-variant-numeric:tabular-nums}',
  '.stack{display:flex;flex-direction:column-reverse;gap:2px;border-radius:4px 4px 0 0;overflow:hidden}',
  '.stack div{min-height:2px}',
  '.bars.pick .col:not(.on){opacity:.4}',
  '.col:focus-visible{outline:2px solid var(--s1);outline-offset:2px}',
  '.xl{display:flex;gap:4px;font-size:12px;color:var(--muted);margin-top:4px}',
  '.xl span{flex:1 1 0;max-width:56px;text-align:center;white-space:nowrap;overflow:visible;min-width:0}',
  '.readout{margin-top:14px;padding:12px 14px;border-radius:10px;background:var(--bg);font-size:15px;min-height:48px}',
  '.readout .chips{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:4px;color:var(--ink2);font-size:14px}',
  'table{border-collapse:collapse;width:100%;font-size:14px;margin-top:10px}',
  'td,th{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}',
  'th{color:var(--ink2);font-weight:500}td.r,th.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}',
  'details summary{cursor:pointer;color:var(--ink2);font-size:15px}',
  '.faq dt{font-weight:600;margin-top:12px}.faq dd{margin:2px 0 0;color:var(--ink2);font-size:15px}',
  'code{background:var(--bg);padding:1px 5px;border-radius:5px;font-size:14px;word-break:break-all}',
  '.empty{color:var(--ink2)}',
  'h3{font-size:15px;color:var(--ink2);font-weight:600;margin:18px 0 0;text-transform:uppercase;letter-spacing:.04em}',
  '.drop{color:var(--s8);font-weight:650}',
  'section .lead{background:var(--bg);font-size:16px}',
  'section .tiles{margin:12px 0 14px}',
  '.src.opt .name{font-weight:500;color:var(--ink2)}',
  '.old{margin:0 0 16px}.old>summary{padding:14px 18px;background:var(--card);border:1px solid var(--line);border-radius:14px;list-style:none}',
  '.old>summary::-webkit-details-marker{display:none}.old>summary::before{content:"▸ ";color:var(--muted)}',
  '.old[open]>summary::before{content:"▾ "}.old[open]>summary{margin-bottom:12px}'
].join('');

/* Подпись под графиком: какой день выбран и из чего он сложился.
   Наведение мышью, касание на телефоне и Tab с клавиатуры. */
var STATS_JS = [
  '(function(){',
  'var D=JSON.parse(document.getElementById("days-data").textContent);',
  'var bars=document.querySelector(".bars"),out=document.getElementById("readout");',
  'if(!bars){return;}',
  'function show(i,pick){var d=D[i];',
  'bars.querySelectorAll(".col").forEach(function(c){c.classList.toggle("on",+c.dataset.i===i);});',
  'bars.classList.toggle("pick",!!pick);',
  'out.innerHTML="<b>"+d.t+"</b> — "+d.n+" "+d.w+(d.p.length?"<div class=chips>"+d.p.map(function(p){',
  'return "<span><i class=dot style=\\"display:inline-block;background:var(--"+p[2]+");margin-right:6px\\"></i>"+p[0]+": "+p[1]+"</span>";',
  '}).join("")+"</div>":"");}',
  'bars.addEventListener("pointerover",function(e){var c=e.target.closest(".col");if(c){show(+c.dataset.i,true);}});',
  'bars.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"){show(D.length-1,false);}});',
  'bars.addEventListener("focusin",function(e){var c=e.target.closest(".col");if(c){show(+c.dataset.i,true);}});',
  'bars.addEventListener("click",function(e){var c=e.target.closest(".col");if(c){show(+c.dataset.i,true);}});',
  'show(D.length-1,false);',
  /* День в базе — по UTC. Говорим, во сколько он начинается у смотрящего. */
  'var off=-new Date().getTimezoneOffset(),tz=document.getElementById("tz");',
  'if(tz&&off){var h=((off/60)%24+24)%24,m=Math.abs(off%60);',
  'tz.textContent="Сутки здесь считаются по Гринвичу (UTC): по вашему времени «день» начинается в "+',
  '(""+Math.floor(h)).padStart(2,"0")+":"+(""+m).padStart(2,"0")+" и заканчивается в это же время на следующий день.";}',
  '})();'
].join('');

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

  var stepRes = await run(env, function () {
    return env.DB.prepare('SELECT step, SUM(n) AS n, MIN(day) AS since FROM steps WHERE day >= ?1 GROUP BY step')
      .bind(dates[dates.length - 1]).all();
  }, STEPS_SCHEMA);
  var funnel = { since: null };
  Object.keys(FUNNEL_STEPS).forEach(function (k) { funnel[k] = 0; });
  (stepRes.results || []).forEach(function (r) {
    if (!(r.step in FUNNEL_STEPS)) { return; }
    funnel[r.step] = r.n;
    if (!funnel.since || r.since < funnel.since) { funnel.since = r.since; }
  });

  var ccRes = await run(env, function () {
    return env.DB.prepare('SELECT kind, key, cc, SUM(n) AS n, MIN(day) AS since FROM by_country ' +
      'WHERE day >= ?1 GROUP BY kind, key, cc').bind(dates[dates.length - 1]).all();
  }, CC_SCHEMA);
  var countries = {}, ccSince = null;
  (ccRes.results || []).forEach(function (r) {
    var c = countries[r.cc] = countries[r.cc] || { cc: r.cc, visits: 0, sources: {}, steps: emptySteps() };
    if (r.kind === 'visit') {
      if (channelOf(r.key).key === 'service') { return; }
      c.visits += r.n;
      c.sources[r.key] = (c.sources[r.key] || 0) + r.n;
    } else if (r.key in FUNNEL_STEPS) {
      c.steps[r.key] += r.n;
    }
    if (!ccSince || r.since < ccSince) { ccSince = r.since; }
  });
  var byCountry = Object.keys(countries).map(function (k) { return countries[k]; })
    .filter(function (c) { return c.visits || c.steps.s1 || c.steps.q2_goal; })
    .sort(function (a, b) { return (b.visits + b.steps.s1 + b.steps.q2_goal) - (a.visits + a.steps.s1 + a.steps.q2_goal); });

  if (url.searchParams.get('format') === 'json') {
    return new Response(JSON.stringify({ days: days, total: all, bySource: bySource, byDay: rows, funnel: funnel,
      byCountry: byCountry, countriesSince: ccSince }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
  return new Response(statsPage(url, days, rows, bySource, funnel, byCountry, ccSince), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

/* Кампании канала; если часть заходов была без кампании — отдельной строкой,
   чтобы подстроки складывались в число канала. */
function partsOf(c) {
  if (!c.parts.length) { return []; }
  var rest = c.visits - c.parts.reduce(function (s, p) { return s + p.visits; }, 0);
  var parts = c.parts.slice().sort(function (a, b) { return b.visits - a.visits; });
  return rest ? parts.concat({ name: 'без кампании', visits: rest, plain: true }) : parts;
}

/* «Где отваливаются»: шаги онбординга и пейвола, у каждого — сколько
   дошло, доля от первого экрана и сколько потеряно по дороге с
   предыдущего шага. Самая большая потеря онбординга — красным и фразой
   сверху. */
function emptySteps() {
  var o = {};
  Object.keys(FUNNEL_STEPS).forEach(function (k) { o[k] = 0; });
  return o;
}

/* Название страны по-русски и флаг из двух букв кода. */
var CC_NAMES = null;
try { CC_NAMES = new Intl.DisplayNames(['ru'], { type: 'region' }); } catch (e) { CC_NAMES = null; }
function countryName(cc) {
  if (cc === 'XX') { return 'Страна не определилась'; }
  if (cc === 'T1') { return 'Через Tor'; }
  var n = cc;
  try { n = (CC_NAMES && CC_NAMES.of(cc)) || cc; } catch (e) { n = cc; }
  return n;
}
function countryFlag(cc) {
  if (!/^[A-Z]{2}$/.test(cc) || cc === 'XX') { return ''; }
  return String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65) + ' ';
}

/* Где онбординг теряет больше всего: переход с наибольшей долей ушедших. */
var ONB_STEPS = ['s1', 's2', 's3', 's4', 's5', 's6'];
function worstDrop(f) {
  var worst = null;
  for (var i = 1; i < ONB_STEPS.length; i++) {
    var a = f[ONB_STEPS[i - 1]], lost = Math.max(0, a - f[ONB_STEPS[i]]);
    if (a && lost && (!worst || lost / a > worst.share)) {
      worst = { from: ONB_STEPS[i - 1], to: ONB_STEPS[i], a: a, lost: lost, share: lost / a };
    }
  }
  return worst;
}

/* Сколько заходов страны пришло по каждому каналу — подпись под страной. */
function countryChannels(c) {
  var by = {};
  Object.keys(c.sources).forEach(function (label) {
    var ch = channelOf(label), name = ch.name;
    var campaign = label.split(' / ')[1];
    if (ch.key === 'tiktok' && campaign) { name = 'TikTok «' + campaign + '»'; }
    by[name] = (by[name] || 0) + c.sources[label];
  });
  return Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).slice(0, 4)
    .map(function (k) { return esc(k) + ' — ' + by[k]; }).join(', ');
}

function countriesSection(byCountry, since) {
  var list = byCountry.filter(function (c) { return c.visits; });
  var all = list.reduce(function (s, c) { return s + c.visits; }, 0);
  var head = '<section><h2>Из каких стран</h2>';
  if (!all) {
    return head + '<p class="empty">Страны пока не приходили — они считаются с момента, как обновлён воркер.</p></section>';
  }
  var max = list[0].visits;
  return head + '<p class="sub">Заходы на сайт по стране' + (since ? ', с ' + dateLong(since) : '') +
    '. Страну определяет Cloudflare по адресу подключения; через VPN это будет страна VPN.</p>' +
    list.slice(0, 12).map(function (c) {
      return '<div class="src"><div class="row"><div class="name">' + countryFlag(c.cc) + esc(countryName(c.cc)) + '</div>' +
        '<div class="num"><b>' + c.visits + '</b><span>' + pct(c.visits, all) + '</span></div></div>' +
        '<div class="hint">' + countryChannels(c) + '</div>' +
        '<div class="bar" style="width:calc((100% - 18px) * ' + (c.visits / max).toFixed(3) + ');background:var(--s1)"></div></div>';
    }).join('') +
    (list.length > 12 ? (function () {
      var rest = list.slice(12).reduce(function (s, c) { return s + c.visits; }, 0);
      return '<p class="note">Ещё ' + (list.length - 12) + ' ' + plural(list.length - 12, 'страна', 'страны', 'стран') +
        ' — ' + rest + ' ' + visitsWord(rest) + '.</p>';
    })() : '') +
    '</section>';
}

/* Воронка по странам одной таблицей: где какая страна теряет больше всего. */
function countryFunnelTable(byCountry, key, days, cc) {
  var list = byCountry.filter(function (c) { return c.steps.s1; }).slice(0, 10);
  if (!list.length) { return ''; }
  return '<h3>По странам</h3><table><tr><th>Страна</th><th class="r">Открыли</th><th class="r">До пейвола</th>' +
    '<th class="r">«Оплатить»</th><th>Где больше всего уходят</th></tr>' +
    list.map(function (c) {
      var f = c.steps, w = worstDrop(f), pay = f.pay_m + f.pay_y;
      return '<tr><td><a href="?key=' + key + '&days=' + days + '&cc=' + c.cc + '"' + (c.cc === cc ? ' style="font-weight:650"' : '') + '>' +
        countryFlag(c.cc) + esc(countryName(c.cc)) + '</a></td>' +
        '<td class="r">' + f.s1 + '</td><td class="r">' + f.s6 + ' <span style="color:var(--muted)">' + pct(f.s6, f.s1) + '</span></td>' +
        '<td class="r">' + pay + '</td>' +
        '<td>' + (w ? esc(FUNNEL_STEPS[w.from]) + ' → ' + esc(FUNNEL_STEPS[w.to]) + ': <span class="drop">−' + pct(w.lost, w.a) + '</span>' : '—') +
        '</td></tr>';
    }).join('') + '</table>' +
    '<p class="note">Нажмите на страну — воронка выше покажется только по ней.</p>';
}

function funnelSection(f, opt) {
  opt = opt || {};
  var top = f.s1;
  var countries = (opt.byCountry || []).filter(function (c) { return c.steps.s1; });
  var chips = countries.length ? '<nav class="period" style="flex-wrap:wrap;margin:10px 0 4px">' +
    '<a href="?key=' + opt.key + '&days=' + opt.days + '"' + (opt.cc ? '' : ' class="on"') + '>Все страны</a>' +
    countries.slice(0, 6).map(function (c) {
      return '<a href="?key=' + opt.key + '&days=' + opt.days + '&cc=' + c.cc + '"' + (c.cc === opt.cc ? ' class="on"' : '') + '>' +
        countryFlag(c.cc) + esc(countryName(c.cc)) + '</a>';
    }).join('') + '</nav>' : '';
  var head = '<section id="funnel"><h2>Где отваливаются' + (opt.cc ? ': ' + countryFlag(opt.cc) + esc(countryName(opt.cc)) : '') +
    '</h2>' + chips;
  if (!top) {
    return head + '<p class="empty">Шаги воронки пока не приходили. Они считаются с момента, ' +
      'как обновлённая воронка выложена на astromap.me, — откройте сайт и пройдите пару экранов, ' +
      'чтобы проверить.</p></section>';
  }
  var worst = worstDrop(f);
  var payN = f.pay_m + f.pay_y, paidN = f.paid_m + f.paid_y;

  function row(k, n, prev, opts) {
    opts = opts || {};
    var lost = prev != null ? Math.max(0, prev - n) : 0;
    var isWorst = worst && worst.to === k && worst.lost;
    return '<div class="src"><div class="row"><div class="name">' + esc(opts.name || FUNNEL_STEPS[k]) + '</div>' +
      '<div class="num"><b>' + n + '</b><span>' + pct(n, top) + ' от начала</span></div></div>' +
      (opts.hint ? '<div class="hint">' + opts.hint + '</div>' : '') +
      '<div class="bar" style="width:calc((100% - 18px) * ' + Math.min(1, n / top).toFixed(3) + ');background:var(--' +
        (opts.color || 's1') + ')"></div>' +
      (prev != null ? '<div class="part"><span>' + (opts.lostLabel || 'ушли на этом шаге') + '</span><span' +
        (isWorst ? ' class="drop"' : '') + '>' + (lost ? '−' + lost + ' (' + pct(lost, prev) + ')' : '0') + '</span></div>' : '') +
      '</div>';
  }

  var lead = '';
  if (worst && worst.lost) {
    lead = 'Больше всего теряется между шагами «' + esc(FUNNEL_STEPS[worst.from]) + '» и «' + esc(FUNNEL_STEPS[worst.to]) +
      '»: из ' + worst.a + ' дальше не пошли <b>' + worst.lost + '</b> (' + pct(worst.lost, worst.a) + '). ';
  }
  if (f.s6) {
    lead += 'До пейвола дошли ' + f.s6 + ' из ' + top + ' (' + pct(f.s6, top) + '), «оплатить» нажали ' + payN +
      (opt.cc ? '.' : ', оплатили <b>' + paidN + '</b>.');
  }

  return head +
    '<p class="sub">Сколько вкладок дошло до каждого экрана' + (f.since ? ', с ' + dateLong(f.since) : '') +
      '. Один человек — один раз на шаг, даже если вернулся назад или сменил язык.</p>' +
    (lead ? '<p class="lead">' + lead + '</p>' : '') +
    '<h3>Онбординг</h3>' +
    row('s1', f.s1, null, { hint: 'открыли первый экран воронки' }) +
    row('s2', f.s2, f.s1) +
    row('s3', f.s3, f.s2) +
    row('s4', f.s4, f.s3, { hint: 'карта посчитана, спрашиваем дату партнёра (можно пропустить)' }) +
    row('s5', f.s5, f.s4) +
    '<h3>Пейвол</h3>' +
    row('s6', f.s6, f.s5, { color: 's2' }) +
    row('pay_m', f.pay_m, f.s6, { color: 's2', lostLabel: 'не нажали' }) +
    row('s7', f.s7, f.s6, { color: 's4', hint: 'нажали «не сейчас» на месячном — показали годовой', lostLabel: 'не отказывались' }) +
    row('pay_y', f.pay_y, f.s7, { color: 's4', lostLabel: 'не нажали' }) +
    row('wallet', f.wallet_m + f.wallet_y, null, { name: 'Нажали Apple Pay / Google Pay', color: 's2',
      hint: 'кнопка в окне оплаты внутри TikTok, уводит оплату в Safari/Chrome: месяц — ' + f.wallet_m + ', год — ' + f.wallet_y }) +
    row('reading', f.reading, null, { color: 'more', hint: 'ссылка на бесплатный разбор вместо покупки' }) +
    (opt.cc ? '<p class="note">Оплаты по странам не видны: о продаже сообщает Gumroad, а не страница, ' +
      'и страну покупателя он не передаёт. Сколько оплатили всего — в «Все страны».</p>' :
    row('paid', paidN, payN, { name: 'Оплатили', color: 's3', lostLabel: 'нажали «оплатить», но не оплатили',
      hint: 'по уведомлению Gumroad, без продлений: месяц — ' + f.paid_m + ', год — ' + f.paid_y }) +
    '<p class="note">«Оплатили» приходит от Gumroad и включает тех, кто оплатил по старой вкладке или прямой ссылке, ' +
      'поэтому в первые дни может быть больше нажатий. Шаг «Дата партнёра» засчитывается, даже если его пропустили.</p>') +
    countryFunnelTable(countries, opt.key, opt.days, opt.cc) +
    '</section>';
}

/* --- КВИЗ v2: основная воронка -----------------------------------------
   Шаг засчитывается, когда вкладка ОТКРЫЛА экран (один раз на вкладку),
   поэтому «ушли» на шаге — это открыли предыдущий экран и не открыли
   этот. Необязательные экраны (время, пара) видят не все: в потери они не
   входят, а следующий обязательный шаг сравнивается с предыдущим
   обязательным. */
var QUIZ_PHASES = [
  { title: 'Фокус', steps: [
    { k: 'q2_goal', name: 'Начали квиз', hint: 'открыли первый экран — выбор цели' },
    { k: 'q2_ctx', name: 'Уточнение цели' } ] },
  { title: 'Данные рождения', steps: [
    { k: 'q2_dob', name: 'Дата рождения' },
    { k: 'q2_sun', name: 'Увидели своё Солнце', hint: 'первый результат после даты' },
    { k: 'q2_tk', name: 'Знают ли время рождения' },
    { k: 'q2_time', name: 'Время рождения', opt: 'только тем, кто знает время' },
    { k: 'q2_place', name: 'Место рождения' },
    { k: 'q2_core', name: 'Основа карты', hint: 'Солнце, Луна, асцендент' } ] },
  { title: 'Превью', steps: [
    { k: 'q2_extra', name: 'Дополнительные темы' },
    { k: 'q2_start', name: 'С чего начать' },
    { k: 'q2_pask', name: 'Предложили добавить пару', opt: 'только «Отношения → конкретная связь»' },
    { k: 'q2_pdate', name: 'Дата пары', opt: 'только тем, кто решил добавить' },
    { k: 'q2_preview', name: 'Превью карты' },
    { k: 'q2_bridge', name: '«Карта остаётся, небо меняется»' } ] },
  { title: 'Оплата', steps: [
    { k: 'q2_pay', name: 'Пейвол', hint: 'месячный план' },
    { k: 'q2_pay_m', name: 'Нажали «оплатить» — месяц', opt: 'из открывших пейвол', base: 'q2_pay', color: 's2' },
    { k: 'q2_year', name: 'Открыли годовой план', opt: 'из открывших пейвол', base: 'q2_pay', color: 's4' },
    { k: 'q2_pay_y', name: 'Нажали «оплатить» — год', opt: 'из открывших годовой план', base: 'q2_year', color: 's4' },
    { k: 'wallet', name: 'Нажали Apple Pay / Google Pay', opt: 'кнопка в окне оплаты внутри TikTok', base: 'q2_payclicks', color: 's2' },
    { k: 'q2_reading', name: 'Ушли в бесплатный обзор', opt: 'ссылка на годовом плане', color: 'more' } ] }
];

function quizSection(f, opt) {
  opt = opt || {};
  f = Object.assign({}, f);
  f.wallet = (f.wallet_m || 0) + (f.wallet_y || 0);
  f.q2_payclicks = (f.q2_pay_m || 0) + (f.q2_pay_y || 0);
  f.q2_paid = (f.q2_paid_m || 0) + (f.q2_paid_y || 0);
  var top = f.q2_goal;
  var countries = (opt.byCountry || []).filter(function (c) { return c.steps.q2_goal; });
  var chips = countries.length ? '<nav class="period" style="flex-wrap:wrap;margin:10px 0 4px">' +
    '<a href="?key=' + opt.key + '&days=' + opt.days + '"' + (opt.cc ? '' : ' class="on"') + '>Все страны</a>' +
    countries.slice(0, 6).map(function (c) {
      return '<a href="?key=' + opt.key + '&days=' + opt.days + '&cc=' + c.cc + '"' + (c.cc === opt.cc ? ' class="on"' : '') + '>' +
        countryFlag(c.cc) + esc(countryName(c.cc)) + '</a>';
    }).join('') + '</nav>' : '';
  var head = '<section id="quiz"><h2>Квиз: где отваливаются' +
    (opt.cc ? ': ' + countryFlag(opt.cc) + esc(countryName(opt.cc)) : '') + '</h2>' + chips;
  if (!top) {
    return head + '<p class="empty">Квиз ещё никто не начинал за этот период' + (opt.cc ? ' из этой страны' : '') +
      '. Шаги считаются с момента выкладки квиза; тестовые проходы (?src=test, localhost) не считаются.</p></section>';
  }

  /* Обязательные шаги подряд — для потерь и самого большого отвала. */
  var main = [];
  QUIZ_PHASES.forEach(function (ph) { ph.steps.forEach(function (st) { if (!st.opt) { main.push(st); } }); });
  var prevOf = {}, worst = null;
  for (var i = 1; i < main.length; i++) {
    prevOf[main[i].k] = main[i - 1];
    var a = f[main[i - 1].k], lost = Math.max(0, a - f[main[i].k]);
    if (a && lost && (!worst || lost / a > worst.share)) {
      worst = { from: main[i - 1], to: main[i], a: a, lost: lost, share: lost / a };
    }
  }

  var paid = (f.q2_paid_m || 0) + (f.q2_paid_y || 0);
  var allPaid = (f.paid_m || 0) + (f.paid_y || 0);
  var clicks = f.q2_payclicks;
  var tiles = '<div class="tiles qt">' +
    '<div class="tile"><div class="k">Начали квиз</div><div class="v">' + top + '</div>' +
      '<div class="s">вкладок открыли первый экран</div></div>' +
    '<div class="tile"><div class="k">Дошли до оплаты</div><div class="v">' + pct(f.q2_pay, top) + '</div>' +
      '<div class="s">' + f.q2_pay + ' из ' + top + '</div></div>' +
    (opt.cc
      ? '<div class="tile"><div class="k">Нажали «оплатить»</div><div class="v">' + clicks + '</div>' +
        '<div class="s">оплаты по странам не видны</div></div>'
      : '<div class="tile"><div class="k">Оплатили</div><div class="v">' + paid + '</div>' +
        '<div class="s">' + clicks + ' ' + plural(clicks, 'нажатие', 'нажатия', 'нажатий') + ' «оплатить»' +
        (allPaid > paid ? '; всего в Gumroad ' + allPaid : '') + '</div></div>') +
    '</div>';

  var lead = '';
  if (worst) {
    lead = 'Больше всего уходят между экранами «' + esc(worst.from.name) + '» и «' + esc(worst.to.name) +
      '»: из ' + worst.a + ' дальше не пошли <b>' + worst.lost + '</b> (' + pct(worst.lost, worst.a) + ').';
  }

  function row(st) {
    var n = f[st.k] || 0;
    var base = st.base ? f[st.base] : top;
    var p = prevOf[st.k];
    var lost = p ? Math.max(0, f[p.k] - n) : 0;
    var isWorst = worst && worst.to.k === st.k;
    var share = st.base ? pct(n, base) + ' ' + (st.base === 'q2_pay' ? 'от пейвола' : st.base === 'q2_year' ? 'от годового' : 'от нажавших') :
      pct(n, top) + ' от начала';
    return '<div class="src' + (st.opt ? ' opt' : '') + '"><div class="row"><div class="name">' + esc(st.name) + '</div>' +
      '<div class="num"><b>' + n + '</b><span>' + share + '</span></div></div>' +
      (st.opt || st.hint ? '<div class="hint">' + esc(st.opt || st.hint) + '</div>' : '') +
      '<div class="bar" style="width:calc((100% - 18px) * ' + Math.min(1, base ? n / base : 0).toFixed(3) +
        ');background:var(--' + (st.color || (st.opt ? 'more' : 's1')) + ')"></div>' +
      (p ? '<div class="part"><span>не пошли дальше</span><span' + (isWorst ? ' class="drop"' : '') + '>' +
        (lost ? '−' + lost + ' (' + pct(lost, f[p.k]) + ')' : '0') + '</span></div>' : '') +
      '</div>';
  }

  var body = QUIZ_PHASES.map(function (ph) {
    return '<h3>' + esc(ph.title) + '</h3>' + ph.steps.map(row).join('');
  }).join('');
  if (!opt.cc) {
    body += row({ k: 'q2_paid', name: 'Оплатили', hint: 'по уведомлению Gumroad, без продлений и тестовых: месяц — ' +
      (f.q2_paid_m || 0) + ', год — ' + (f.q2_paid_y || 0), base: 'q2_payclicks', color: 's3' });
  }

  var sig = [
    ['Не знают время рождения', f.q2_tk_no, f.q2_tk, 'от ответивших на вопрос о времени'],
    ['Пару пропустили', f.q2_pask_no, f.q2_pask, 'от тех, кому предложили'],
    ['Выбрали «моего места нет в списке»', f.q2_place_nf, f.q2_place, 'от открывших экран места'],
    ['Дата скорректирована', f.q2_err_date, f.q2_dob, '31 февраля, будущая дата и т.п.'],
    ['Превью не загрузилось', f.q2_pv_fail, f.q2_preview, 'сбой загрузки расчёта'],
    ['Переключали вкладки превью', f.q2_pv_tab, f.q2_preview, 'интерес к превью']
  ];
  var signals = '<h3>Сигналы</h3><table>' + sig.map(function (r) {
    return '<tr><td>' + esc(r[0]) + '<div class="hint" style="margin-left:0">' + esc(r[3]) + '</div></td>' +
      '<td class="r"><b>' + (r[1] || 0) + '</b> <span style="color:var(--muted)">' + pct(r[1] || 0, r[2]) + '</span></td></tr>';
  }).join('') + '</table>';

  var ctable = '';
  var list = countries.slice(0, 10);
  if (list.length) {
    ctable = '<h3>По странам</h3><table><tr><th>Страна</th><th class="r">Начали</th><th class="r">До пейвола</th>' +
      '<th class="r">«Оплатить»</th></tr>' + list.map(function (c) {
        var g = c.steps;
        return '<tr><td><a href="?key=' + opt.key + '&days=' + opt.days + '&cc=' + c.cc + '"' +
          (c.cc === opt.cc ? ' style="font-weight:650"' : '') + '>' + countryFlag(c.cc) + esc(countryName(c.cc)) + '</a></td>' +
          '<td class="r">' + g.q2_goal + '</td><td class="r">' + g.q2_pay + ' <span style="color:var(--muted)">' +
          pct(g.q2_pay, g.q2_goal) + '</span></td><td class="r">' + (g.q2_pay_m + g.q2_pay_y) + '</td></tr>';
      }).join('') + '</table>';
  }

  return head +
    '<p class="sub">Сколько вкладок открыли каждый экран квиза' + (f.since ? ', с ' + dateLong(f.since) : '') +
      '. Вернувшийся назад или сменивший язык считается один раз.</p>' +
    tiles + (lead ? '<p class="lead">' + lead + '</p>' : '') + body + signals + ctable +
    '<p class="note">Числа — вкладки, а не люди: переход из TikTok в Safari даёт две вкладки. ' +
      'На малых числах доли сильно прыгают от одного человека.</p></section>';
}

/* Прежняя воронка рядом с квизом — «до/после», а не тест: за это время
   меняются трафик и креативы. */
function oldCompare(f) {
  if (!f.q2_goal || !f.s1) { return ''; }
  var line = function (name, a, b, base1, base2) {
    return '<tr><td>' + esc(name) + '</td><td class="r">' + a + ' <span style="color:var(--muted)">' + pct(a, base1) +
      '</span></td><td class="r">' + b + ' <span style="color:var(--muted)">' + pct(b, base2) + '</span></td></tr>';
  };
  return '<section><h2>Квиз и прежняя воронка</h2><p class="sub">Сравнение «до/после», не A/B-тест. ' +
    'Доли — от старта своей воронки.</p><table><tr><th></th><th class="r">Прежняя</th><th class="r">Квиз</th></tr>' +
    line('Начали', f.s1, f.q2_goal, f.s1, f.q2_goal) +
    line('Дошли до пейвола', f.s6, f.q2_pay, f.s1, f.q2_goal) +
    line('Нажали «оплатить»', f.pay_m + f.pay_y, f.q2_pay_m + f.q2_pay_y, f.s1, f.q2_goal) +
    line('Оплатили (по метке)', f.a_paid_m + f.a_paid_y, f.q2_paid_m + f.q2_paid_y, f.s1, f.q2_goal) +
    '</table></section>';
}

function statsPage(url, days, rows, bySource, funnel, byCountry, ccSince) {
  var key = encodeURIComponent(url.searchParams.get('key'));
  /* ?cc=PL — воронка только по этой стране. Шаги по странам считаются
     позже общих (с обновления воркера), поэтому «Все страны» берёт общую
     таблицу steps, а страна — by_country. */
  var cc = String(url.searchParams.get('cc') || '').toUpperCase();
  var ccRow = byCountry.filter(function (c) { return c.cc === cc; })[0];
  if (!ccRow) { cc = ''; }
  var ccFunnel = ccRow ? Object.assign({ since: ccSince }, ccRow.steps) : funnel;

  /* Каналы за период, внутри — кампании (?utm_campaign=) и домены. */
  var channels = {}, service = [], real = 0;
  bySource.forEach(function (r) {
    var ch = channelOf(r.source);
    if (ch.key === 'service') { service.push(r); return; }
    real += r.visits;
    var c = channels[ch.key] = channels[ch.key] || { ch: ch, visits: 0, parts: [] };
    c.visits += r.visits;
    var campaign = r.source.split(' / ')[1];
    if (campaign) { c.parts.push({ name: campaign, visits: r.visits }); }
  });
  var list = Object.keys(channels).map(function (k) { return channels[k]; })
    .sort(function (a, b) { return b.visits - a.visits; });

  /* Дни: rows идут от сегодня назад; переворачиваем и отрезаем пустые дни
     до первого захода — до запуска счётчика смотреть не на что. */
  var series = {};
  var daysList = rows.slice().reverse().map(function (r) {
    var by = {}, n = 0;
    Object.keys(r.sources).forEach(function (label) {
      var ch = channelOf(label);
      if (ch.key === 'service') { return; }
      var s = seriesOf(ch);
      by[s] = (by[s] || 0) + r.sources[label];
      n += r.sources[label];
      series[s] = true;
    });
    return { date: r.date, n: n, by: by };
  });
  var first = 0;
  while (first < daysList.length - 1 && !daysList[first].n) { first++; }
  daysList = daysList.slice(first);
  var started = first > 0 && real > 0;

  var today = rows[0], yesterday = rows[1];
  var todayN = daysList.length ? daysList[daysList.length - 1].n : 0;
  var yesterdayN = daysList.length > 1 ? daysList[daysList.length - 2].n : 0;
  var week = daysList.slice(-7), weekN = week.reduce(function (s, d) { return s + d.n; }, 0);
  var tiktok = channels.tiktok ? channels.tiktok.visits : 0;
  var since = daysList.length ? daysList[0].date : today.date;

  function label(d) {
    if (d === today.date) { return 'Сегодня'; }
    if (yesterday && d === yesterday.date) { return 'Вчера'; }
    return dateLong(d);
  }

  /* Главное одной-двумя фразами. */
  var lead;
  if (!real) {
    lead = 'За этот период заходов на сайт не было.';
  } else {
    lead = (started ? 'С ' + dateLong(since) : 'За последние ' + days + ' ' + plural(days, 'день', 'дня', 'дней')) +
      ' сайт открыли <b>' + real + '</b> ' + plural(real, 'раз', 'раза', 'раз') + '.';
    var top = list.filter(function (c) { return c.ch.key !== 'direct'; })[0];
    if (top) {
      lead += ' Больше всего пришло из <b>' + esc(top.ch.name) + '</b> — ' + top.visits + ' (' + pct(top.visits, real) + ').';
    }
    if (channels.direct && channels.direct.visits * 5 >= real) {
      lead += ' Ещё ' + channels.direct.visits + ' (' + pct(channels.direct.visits, real) + ') — без источника: ' +
        'по ним не видно, откуда человек пришёл (подробнее внизу).';
    }
    lead += ' Сегодня — ' + todayN + ' ' + visitsWord(todayN) + '.';
  }

  var html = '<!doctype html><html lang="ru"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex">' +
    '<title>AstroMap: заходы и воронка</title><style>' + STATS_CSS + '</style><main>' +
    '<h1>Сколько людей заходит на astromap.me</h1>' +
    '<p class="sub">Считается каждое открытие сайта по любой ссылке. Обновите страницу, чтобы увидеть свежие цифры.</p>' +
    '<nav class="period">' + [7, 30, 90].map(function (d) {
      return '<a href="?key=' + key + '&days=' + d + (cc ? '&cc=' + cc : '') + '"' + (d === days ? ' class="on"' : '') + '>' + d + ' ' +
        plural(d, 'день', 'дня', 'дней') + '</a>';
    }).join('') + '</nav>' +
    '<p class="lead">' + lead + '</p>' +
    '<div class="tiles">' +
      '<div class="tile"><div class="k">Сегодня</div><div class="v">' + todayN + '</div>' +
        '<div class="s">вчера было ' + yesterdayN + '</div></div>' +
      '<div class="tile"><div class="k">За последние 7 дней</div><div class="v">' + weekN + '</div>' +
        '<div class="s">в среднем ' + Math.round(weekN / Math.max(1, week.length)) + ' в день</div></div>' +
      '<div class="tile"><div class="k">Из TikTok</div><div class="v">' + pct(tiktok, real) + '</div>' +
        '<div class="s">' + tiktok + ' из ' + real + ' ' + visitsWord(real) + ' за период</div></div>' +
    '</div>';

  /* Квиз — основная воронка, прежняя — свёрнутым архивом ниже. */
  html += quizSection(ccFunnel, { cc: cc, byCountry: byCountry, key: key, days: days });

  /* Откуда приходят. */
  var maxV = list.length ? list[0].visits : 1;
  html += '<section><h2>Откуда приходят</h2>' +
    '<p class="sub">Сколько раз открыли сайт по каждой ссылке за выбранный период.</p>' +
    (list.length ? list.map(function (c) {
      var color = 'var(--' + c.ch.color + ')';
      return '<div class="src"><div class="row"><div class="name"><span class="dot" style="background:' + color + '"></span>' +
        esc(c.ch.name) + '</div><div class="num"><b>' + c.visits + '</b><span>' + pct(c.visits, real) + '</span></div></div>' +
        '<div class="hint">' + esc(c.ch.hint) + '</div>' +
        '<div class="bar" style="width:calc((100% - 18px) * ' + (c.visits / maxV).toFixed(3) + ');background:' + color + '"></div>' +
        partsOf(c).map(function (p) {
          return '<div class="part"><span>' + (p.plain ? p.name : 'кампания «' + esc(p.name) + '»') + '</span><span>' + p.visits + '</span></div>';
        }).join('') + '</div>';
    }).join('') : '<p class="empty">Пока пусто.</p>') +
    (service.length ? '<p class="note">Не считаются — это ваши проверки: ' + service.map(function (r) {
      return esc(r.source) + ' (' + r.visits + ')';
    }).join(', ') + '.</p>' : '') +
    '</section>';

  html += countriesSection(byCountry, ccSince);
  html += '<details class="old"' + (ccFunnel.q2_goal ? '' : ' open') + '><summary>Прежняя воронка (до квиза) — ' +
    ccFunnel.s1 + ' ' + plural(ccFunnel.s1, 'старт', 'старта', 'стартов') + ' за период</summary>' +
    funnelSection(ccFunnel, { cc: cc, byCountry: byCountry, key: key, days: days }) +
    (cc ? '' : oldCompare(funnel)) + '</details>';

  /* По дням: столбики, разбитые по каналам. */
  var maxDay = daysList.reduce(function (m, d) { return Math.max(m, d.n); }, 0) || 1;
  var present = SERIES.filter(function (s) { return series[s]; });
  var few = daysList.length <= 14, step = Math.ceil(daysList.length / 8);
  var dayData = daysList.map(function (d) {
    return {
      t: label(d.date), n: d.n, w: visitsWord(d.n),
      p: present.filter(function (s) { return d.by[s]; }).map(function (s) {
        return [seriesName(s), d.by[s], seriesColor(s)];
      })
    };
  });
  html += '<section><h2>По дням</h2>' +
    (started ? '<p class="sub">Начиная с ' + dateLong(since) + ' — раньше заходов не было.</p>' : '') +
    '<div class="legend">' + present.map(function (s) {
      return '<span><i style="background:var(--' + seriesColor(s) + ')"></i>' + esc(seriesName(s)) + '</span>';
    }).join('') + '</div>' +
    '<div class="bars">' + daysList.map(function (d, i) {
      var h = d.n ? Math.max(3, Math.round(d.n / maxDay * 160)) : 0;
      return '<button class="col" data-i="' + i + '" aria-label="' + esc(label(d.date)) + ': ' + d.n + ' ' + visitsWord(d.n) + '">' +
        (few ? '<span class="n">' + d.n + '</span>' : '') +
        '<span class="stack" style="height:' + h + 'px">' + present.filter(function (s) { return d.by[s]; }).map(function (s) {
          return '<div style="flex:' + d.by[s] + ' 0 0;background:var(--' + seriesColor(s) + ')"></div>';
        }).join('') + '</span></button>';
    }).join('') + '</div>' +
    '<div class="xl">' + daysList.map(function (d, i) {
      var show = few || i % step === 0 || i === daysList.length - 1;
      return '<span>' + (show ? (d.date === today.date ? 'сегодня' : dateShort(d.date)) : '') + '</span>';
    }).join('') + '</div>' +
    '<div class="readout" id="readout" aria-live="polite"></div>' +
    '<details style="margin-top:14px"><summary>Таблица по дням</summary><table><tr><th>День</th>' +
      '<th class="r">Заходов</th><th>Откуда</th></tr>' +
      dayData.slice().reverse().map(function (d) {
        return '<tr><td>' + esc(d.t) + '</td><td class="r">' + d.n + '</td><td>' +
          d.p.map(function (p) { return esc(p[0]) + ' — ' + p[1]; }).join(', ') + '</td></tr>';
      }).join('') + '</table></details>' +
    '<script type="application/json" id="days-data">' + JSON.stringify(dayData).replace(/</g, '\\u003c') + '</script>' +
    '</section>';

  /* Как читать. */
  html += '<section><h2>Как это читать</h2><dl class="faq">' +
    '<dt>Заход — это не человек</dt><dd>Заход — это одно открытие сайта в новой вкладке. Если один человек открыл ' +
      'ссылку два раза, будет 2 захода. Обновление страницы и смена языка новым заходом не считаются. ' +
      'Человек, который из TikTok переходит в Safari, чтобы оплатить через Apple Pay, считается дважды.</dd>' +
    '<dt>«Без источника» — откуда это?</dt><dd>Так помечается заход по ссылке без метки: адрес набрали руками, ' +
      'скопировали, открыли из заметок, закладок или мессенджера (Telegram и WhatsApp часто не сообщают, ' +
      'откуда переход). Ваши собственные открытия сайта тоже попадают сюда.</dd>' +
    '<dt>Как узнать, сколько пришло из нового места</dt><dd>Добавьте к ссылке метку <code>?src=…</code> — ' +
      'и на этой странице появится отдельная строка. Например: <code>astromap.me/?src=instagram</code>, ' +
      '<code>astromap.me/?src=telegram</code>, <code>astromap.me/?src=blogger_anna</code>.</dd>' +
    '<dt>Ссылка в TikTok</dt><dd>В профиле TikTok должна стоять <code>astromap.me/?src=tiktok</code> — ' +
      'не меняйте её, на ней держится оплата через Apple Pay из TikTok. Если аккаунтов несколько, ' +
      'можно различать их хвостиком: <code>astromap.me/?src=tiktok&amp;utm_campaign=acc2</code> — ' +
      'под TikTok появится строка «кампания acc2».</dd>' +
    '<dt>Когда начинается день</dt><dd id="tz">Сутки здесь считаются по Гринвичу (UTC).</dd>' +
    '</dl></section>' +
    '<script>' + STATS_JS + '</script></main></html>';
  return html;
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
    if (request.method === 'POST' && url.pathname === '/step') { return stepHit(request, env); }
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
