/* horoscope-ai.js — Cloudflare Worker: прокси между статичным сайтом (GitHub
   Pages) и Groq API. Ключ Groq хранится только здесь как secret (env.GROQ_API_KEY),
   в исходный код сайта не попадает.

   Не деплоится автоматически (сайт статический, Wrangler CI не подключён) —
   вставляется вручную в дашборде Cloudflare (тот же воркер astromap-horoscope-ai,
   Edit code → заменить весь файл целиком → Deploy). Копия здесь — для истории
   и будущих правок.

   Два режима, различаются полем "type" во входном JSON:

   1) Гороскоп (type опущен или "horoscope"):
      Вход:  { lang, period, buckets: { general|love|career|luck: [{transit,natal,aspect,tone}] } }
      Выход: { sections: { general, love, career, luck } }

   2) Быстрая совместимость по знакам (type: "compat"):
      Вход:  { lang, signA, signB }
      Выход: { categories: { general|love|intimacy|trust|communication|work|friendship:
                              { score: number, text: string } } }

   В обоих случаях модель обязана опираться только на переданные факты (гороскоп)
   или на общепринятую астрологию стихий/качеств знаков (совместимость) — без
   выдумывания дат, аспектов или планет, которых не было во входе. */

var ALLOWED_ORIGIN = 'https://yahor22852.github.io';
var MODEL = 'openai/gpt-oss-120b';

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

var HZ_SYS_EN = 'You are an astrology copywriter for the AstroMap app. Write short, warm ' +
  'horoscope text in English, based ONLY on the astrological facts provided below ' +
  '(transit planet, aspect, natal point, tone). Do not invent aspects, planets or ' +
  'dates that are not in the facts. Return strictly a JSON object with keys ' +
  '"general", "love", "career", "luck" — each value 2-3 sentences of plain text, ' +
  'no markdown.';

var HZ_SYS_PL = 'Jesteś redaktorem astrologicznym aplikacji AstroMap. Piszesz krótkie, ' +
  'ciepłe teksty horoskopu po polsku, WYŁĄCZNIE na podstawie podanych niżej faktów ' +
  'astrologicznych (tranzytująca planeta, aspekt, punkt natalny, ton). Nie wymyślaj ' +
  'aspektów, planet ani dat spoza faktów. Zwróć wyłącznie obiekt JSON z kluczami ' +
  '"general", "love", "career", "luck" — każda wartość to 2-3 zdania zwykłego ' +
  'tekstu, bez markdown.';

async function handleHoroscope(env, body) {
  var lang = body.lang === 'pl' ? 'pl' : 'en';
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
    lang === 'pl' ? HZ_SYS_PL : HZ_SYS_EN,
    'Period: ' + period + '\nFacts:\n' + factLines.join('\n'),
    500
  );
  if (result.error) { return result.error; }
  return json({ sections: result.data }, 200);
}

/* ------------------------------------------------- быстрая совместимость */

var MC_CATS = ['general', 'love', 'intimacy', 'trust', 'communication', 'work', 'friendship'];

var MC_SYS_EN = 'You are an astrology compatibility writer for the AstroMap app. Given two ' +
  'Sun signs, produce realistic compatibility scores and short descriptions based on ' +
  'traditional element (fire/earth/air/water) and modality (cardinal/fixed/mutable) ' +
  'compatibility between the signs. Return strictly a JSON object with key "categories", ' +
  'an object with exactly these keys: "general", "love", "intimacy", "trust", ' +
  '"communication", "work", "friendship". Each value is an object ' +
  '{"score": <integer 5-96>, "text": "<2-3 sentences, plain text, no markdown>"}. ' +
  'Vary the score sensibly per category (do not repeat the same number everywhere).';

var MC_SYS_PL = 'Jesteś astrologicznym redaktorem zgodności aplikacji AstroMap. Dla dwóch ' +
  'znaków Słońca podajesz realistyczne wyniki zgodności i krótkie opisy, oparte na ' +
  'tradycyjnej zgodności żywiołów (ogień/ziemia/powietrze/woda) i krzyży ' +
  '(kardynalny/stały/zmienny) między znakami. Zwróć wyłącznie obiekt JSON z kluczem ' +
  '"categories" — obiektem z dokładnie tymi kluczami: "general", "love", "intimacy", ' +
  '"trust", "communication", "work", "friendship". Każda wartość to obiekt ' +
  '{"score": <liczba całkowita 5-96>, "text": "<2-3 zdania zwykłego tekstu, bez markdown>"}. ' +
  'Różnicuj wynik sensownie między kategoriami (nie powtarzaj tej samej liczby wszędzie).';

async function handleCompat(env, body) {
  var lang = body.lang === 'pl' ? 'pl' : 'en';
  var signA = String(body.signA || '').slice(0, 20);
  var signB = String(body.signB || '').slice(0, 20);
  if (!signA || !signB) {
    return json({ error: 'no_data' }, 400);
  }

  var result = await callGroq(
    env,
    lang === 'pl' ? MC_SYS_PL : MC_SYS_EN,
    'Sign A: ' + signA + '\nSign B: ' + signB,
    800
  );
  if (result.error) { return result.error; }

  var categories = result.data && result.data.categories;
  if (!categories) {
    return json({ error: 'unparseable_ai_response' }, 502);
  }
  return json({ categories: categories }, 200);
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
    return handleHoroscope(env, body);
  }
};
