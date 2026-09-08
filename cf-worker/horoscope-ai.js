/* horoscope-ai.js — Cloudflare Worker: прокси между статичным сайтом (GitHub
   Pages) и Groq API. Ключ Groq хранится только здесь как secret (env.GROQ_API_KEY),
   в исходный код сайта не попадает.

   Не деплоится автоматически (сайт статический, Wrangler CI не подключён) —
   вставляется вручную в дашборде Cloudflare (Workers & Pages → Create → вставить
   этот файл → Deploy), см. инструкцию в переписке. Копия здесь — для истории
   и будущих правок.

   Вход (POST, JSON): { lang: 'en'|'pl', period: string,
     buckets: { general|love|career|luck: [{transit, natal, aspect, tone}, ...] } }
   Выход: { sections: { general, love, career, luck } } — по 2-3 предложения
   на каждый раздел, ТОЛЬКО на основе присланных фактов (транзит/аспект/точка/тон),
   без выдумывания новых аспектов. */

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

var SYS_EN = 'You are an astrology copywriter for the AstroMap app. Write short, warm ' +
  'horoscope text in English, based ONLY on the astrological facts provided below ' +
  '(transit planet, aspect, natal point, tone). Do not invent aspects, planets or ' +
  'dates that are not in the facts. Return strictly a JSON object with keys ' +
  '"general", "love", "career", "luck" — each value 2-3 sentences of plain text, ' +
  'no markdown.';

var SYS_PL = 'Jesteś redaktorem astrologicznym aplikacji AstroMap. Piszesz krótkie, ' +
  'ciepłe teksty horoskopu po polsku, WYŁĄCZNIE na podstawie podanych niżej faktów ' +
  'astrologicznych (tranzytująca planeta, aspekt, punkt natalny, ton). Nie wymyślaj ' +
  'aspektów, planet ani dat spoza faktów. Zwróć wyłącznie obiekt JSON z kluczami ' +
  '"general", "love", "career", "luck" — każda wartość to 2-3 zdania zwykłego ' +
  'tekstu, bez markdown.';

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

    var payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: lang === 'pl' ? SYS_PL : SYS_EN },
        { role: 'user', content: 'Period: ' + period + '\nFacts:\n' + factLines.join('\n') }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    };

    var aiResp;
    try {
      aiResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + env.GROQ_API_KEY
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return json({ error: 'upstream_unreachable' }, 502);
    }

    if (!aiResp.ok) {
      var detail = await aiResp.text();
      return json({ error: 'upstream_error', status: aiResp.status, detail: detail.slice(0, 300) }, 502);
    }

    var data;
    try {
      data = await aiResp.json();
    } catch (e) {
      return json({ error: 'bad_upstream_json' }, 502);
    }

    var content = data.choices && data.choices[0] && data.choices[0].message &&
      data.choices[0].message.content;
    var sections;
    try {
      sections = JSON.parse(content);
    } catch (e) {
      return json({ error: 'unparseable_ai_response' }, 502);
    }

    return json({ sections: sections }, 200);
  }
};
