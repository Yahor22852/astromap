/* horoscope-ai.js — Cloudflare Worker: прокси между статичным сайтом (GitHub
   Pages) и Groq API. Ключ Groq хранится только здесь как secret (env.GROQ_API_KEY),
   в исходный код сайта не попадает.

   Не деплоится автоматически (сайт статический, Wrangler CI не подключён) —
   вставляется вручную в дашборде Cloudflare (тот же воркер astromap-horoscope-ai,
   Edit code → заменить весь файл целиком → Deploy). Копия здесь — для истории
   и будущих правок.

   Три режима, различаются полем "type" во входном JSON:

   1) Гороскоп (type опущен или "horoscope"):
      Вход:  { lang, period, buckets: { general|love|career|luck: [{transit,natal,aspect,tone}] } }
      Выход: { lang, sections: { general, love, career, luck } }

   2) Быстрая совместимость по знакам (type: "compat"):
      Вход:  { lang, signA, signB }
      Выход: { lang, categories: { general|love|intimacy|trust|communication|work|friendship:
                              { score: number, text: string } } }

   3) Планета в доме карты (type: "house"):
      Вход:  { lang, body, house, sign, aspects: [{natal, aspect, tone}] }
      Выход: { lang, text }

   Во всех случаях модель обязана опираться только на переданные факты — без
   выдумывания дат, аспектов или планет, которых не было во входе.

   ЯЗЫК. Раньше системные промпты существовали только для английского и
   польского, а остальные восемь языков продукта молча получали английский
   текст — и он затирал правильный композиционный текст на родном языке.
   Теперь язык — параметр промпта, а ответ содержит поле lang: клиент
   подменяет текст только если язык совпал с запрошенным. Благодаря этому
   старая версия воркера (без lang в ответе) перестаёт портить перевод сама
   собой, ещё до обновления. */

var ALLOWED_ORIGIN = 'https://astromap.me';
var MODEL = 'openai/gpt-oss-120b';

/* Языки продукта. Название языка подставляется в промпт словами: код вроде
   "uk" модель может принять за что угодно, а "Ukrainian" — нет. */
var LANGS = {
  en: 'English', pl: 'Polish', ru: 'Russian', uk: 'Ukrainian', de: 'German',
  es: 'Spanish', fr: 'French', it: 'Italian', pt: 'Portuguese', tr: 'Turkish'
};
function langOf(body) {
  var l = String(body && body.lang || 'en');
  return LANGS[l] ? l : 'en';
}

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
  return new Response(JSON.stringify(obj), { status: status, headers: headers });
}

async function callGroq(env, systemPrompt, userPrompt, maxTokens) {
  var payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' }
  };

  var resp;
  try {
    resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + env.GROQ_API_KEY
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    return { error: json({ error: 'upstream_unreachable' }, 502) };
  }

  if (!resp.ok) {
    var detail = await resp.text();
    return { error: json({ error: 'upstream_error', status: resp.status, detail: detail.slice(0, 300) }, 502) };
  }

  var data;
  try {
    data = await resp.json();
  } catch (e) {
    return { error: json({ error: 'bad_upstream_json' }, 502) };
  }

  var content = data.choices && data.choices[0] && data.choices[0].message &&
    data.choices[0].message.content;
  var parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    return { error: json({ error: 'unparseable_ai_response' }, 502) };
  }

  return { data: parsed };
}

/* ---------------------------------------------------------- гороскоп ---- */

function hzSystem(langName) {
  return 'You are an astrology copywriter for the AstroMap app. Write short, warm ' +
    'horoscope text ENTIRELY IN ' + langName.toUpperCase() + ' — every sentence must be in ' +
    langName + ', never in English unless ' + langName + ' is English. Base it ONLY on the ' +
    'astrological facts provided below (transit planet, aspect, natal point, tone). Do not ' +
    'invent aspects, planets or dates that are not in the facts. Astrology is descriptive, ' +
    'not predictive: write what a period is traditionally associated with, never what will ' +
    'certainly happen. Return strictly a JSON object with keys "general", "love", "career", ' +
    '"luck" — each value 2-3 sentences of plain text, no markdown.';
}

async function handleHoroscope(env, body) {
  var lang = langOf(body);
  var period = String(body.period || 'today').slice(0, 20);
  var buckets = body.buckets || {};

  var factLines = [];
  ['general', 'love', 'career', 'luck'].forEach(function (key) {
    var list = Array.isArray(buckets[key]) ? buckets[key].slice(0, 3) : [];
    list.forEach(function (e) {
      factLines.push(key + ': transiting ' + e.transit + ' ' + e.aspect +
        ' natal ' + e.natal + ' (' + e.tone + ')');
    });
  });
  if (!factLines.length) {
    return json({ error: 'no_data' }, 400);
  }

  var result = await callGroq(
    env,
    hzSystem(LANGS[lang]),
    'Period: ' + period + '\nFacts:\n' + factLines.join('\n'),
    500
  );
  if (result.error) { return result.error; }
  return json({ lang: lang, sections: result.data }, 200);
}

/* ------------------------------------------------- быстрая совместимость */

var MC_CATS = ['general', 'love', 'intimacy', 'trust', 'communication', 'work', 'friendship'];

function mcSystem(langName) {
  return 'You are an astrology compatibility writer for the AstroMap app. Write ENTIRELY IN ' +
    langName.toUpperCase() + ' — every sentence must be in ' + langName + '. Given two Sun ' +
    'signs, produce realistic compatibility scores and short descriptions based on ' +
    'traditional element (fire/earth/air/water) and modality (cardinal/fixed/mutable) ' +
    'compatibility between the signs. Return strictly a JSON object with key "categories", ' +
    'an object with exactly these keys: "general", "love", "intimacy", "trust", ' +
    '"communication", "work", "friendship". Each value is an object ' +
    '{"score": <integer 5-96>, "text": "<2-3 sentences, plain text, no markdown>"}. ' +
    'Vary the score sensibly per category (do not repeat the same number everywhere).';
}

async function handleCompat(env, body) {
  var lang = langOf(body);
  var signA = String(body.signA || '').slice(0, 20);
  var signB = String(body.signB || '').slice(0, 20);
  if (!signA || !signB) {
    return json({ error: 'no_data' }, 400);
  }

  var result = await callGroq(
    env,
    mcSystem(LANGS[lang]),
    'Sign A: ' + signA + '\nSign B: ' + signB,
    800
  );
  if (result.error) { return result.error; }

  var categories = result.data && result.data.categories;
  if (!categories) {
    return json({ error: 'unparseable_ai_response' }, 502);
  }
  return json({ lang: lang, categories: categories }, 200);
}

/* ------------------------------------------------ планета в доме карты --- */

function houseSystem(langName) {
  return 'You are an astrology writer for the AstroMap app. Write ENTIRELY IN ' +
    langName.toUpperCase() + ' — every sentence must be in ' + langName + '. You are given one ' +
    'transiting planet, the house of the person\'s chart it is currently crossing, the sign ' +
    'it is in, and its current aspects to their natal points. Explain in 2-3 sentences what ' +
    'this combination is traditionally associated with FOR THIS PERSON, referring to the ' +
    'house by what it governs. Use only the given facts: do not invent aspects, planets, ' +
    'houses or dates. Astrology is a language of description, not prediction — write what ' +
    'the period may emphasise or what one may notice, never what will certainly happen. ' +
    'Return strictly a JSON object: {"text": "<2-3 sentences, plain text, no markdown>"}.';
}

async function handleHouse(env, body) {
  var lang = langOf(body);
  var planet = String(body.body || '').slice(0, 20);
  var house = parseInt(body.house, 10);
  var sign = String(body.sign || '').slice(0, 20);
  if (!planet || !(house >= 1 && house <= 12)) {
    return json({ error: 'no_data' }, 400);
  }
  var aspects = Array.isArray(body.aspects) ? body.aspects.slice(0, 4) : [];
  var lines = aspects.map(function (a) {
    return '- ' + a.aspect + ' to natal ' + a.natal + ' (' + a.tone + ')';
  });

  var result = await callGroq(
    env,
    houseSystem(LANGS[lang]),
    'Transiting planet: ' + planet + '\nSign: ' + sign + '\nHouse of the chart: ' + house +
      '\nAspects to natal points:\n' + (lines.length ? lines.join('\n') : '(none)'),
    300
  );
  if (result.error) { return result.error; }
  var text = result.data && result.data.text;
  if (!text) { return json({ error: 'unparseable_ai_response' }, 502); }
  return json({ lang: lang, text: String(text) }, 200);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405);
    }

    var body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: 'bad_json' }, 400);
    }

    if (body.type === 'compat') {
      return handleCompat(env, body);
    }
    if (body.type === 'house') {
      return handleHouse(env, body);
    }
    return handleHoroscope(env, body);
  }
};
