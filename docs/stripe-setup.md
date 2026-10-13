# Оплата через Stripe: что настроить

Gumroad из кода убран полностью. Оплата — Stripe Payment Links, вход в продукт —
почта + пароль, который человек придумывает сразу после оплаты. Ниже — всё, что
нужно сделать руками один раз. Сначала всё в **тестовом режиме** Stripe, потом
повторить для боевого.

## Как это работает

```
TikTok (ссылка в профиле) → сразу инструкция «••• → Открыть в браузере»
  ├─ открыл в Safari/Chrome → квиз → «оплатить»
  │     ├─ есть Apple Pay / Google Pay → сразу системное окно оплаты
  │     │     (funnel/js/wallet.js → license-verify, action subscribe)
  │     └─ нет кошелька → Stripe Payment Link (как раньше)
  │           ?client_reference_id=<вариант>_<m|y>_<язык>_<uuid>
  └─ «продолжить в TikTok» → квиз → «оплатить» → снова инструкция,
        ответы и план едут через воркер visits (/handoff), в Safari/Chrome
        одна кнопка «Оплатить через Apple Pay»

Stripe Checkout → оплата (карта / Apple Pay / Google Pay)
  └─ redirect: astromap.me/product/?session_id=cs_…
        гейт: «Оплата прошла — придумайте пароль» → продукт

Вебхук checkout.session.completed
  ├─ license-verify: аккаунт без пароля + письмо «создайте пароль» (Resend)
  └─ visits: paid_m / paid_y и оплаты по вариантам на /stats
```

Доступ проверяется вживую: при каждом входе и раз в сутки воркер спрашивает
Stripe, есть ли у клиента с этой почтой подписка `active` / `trialing` /
`past_due`. Отменил подписку — доступ закрывается в конце оплаченного периода.

## 1. Stripe: товар и цены

1. Product catalog → **Add product** «AstroMap».
2. Две цены, обе **Recurring**: `$7.99` / Monthly и `$29.99` / Yearly.
3. **Налог.** На экранах воронки написано «$7.99 + VAT». Два варианта:
   - включить **Stripe Tax** (Settings → Tax) и у обеих цен поставить
     *Include tax in price → No* (налог сверху) — тогда экран и чекаут
     совпадают;
   - или не собирать налог и убрать «+ VAT» / «plus VAT» из `funnel/js/copy.js`
     и `funnel/js/lang/*.js` (billing: priceLine, yearPrice, disclaimer).

## 2. Stripe: две Payment Links

Payment links → **New** — по одной на каждую цену.

- Вкладка **After payment** → *Don't show confirmation page* → redirect на
  `https://astromap.me/product/?session_id={CHECKOUT_SESSION_ID}`
  (ровно так, с фигурными скобками — Stripe подставит номер сам).
- Если включён Stripe Tax — *Collect tax automatically*.
- Apple Pay и Google Pay на Payment Links работают сами (Settings → Payment
  methods — проверить, что включены).

Скопировать обе ссылки (`https://buy.stripe.com/…`) и вписать в **три файла**:

| Файл | Что |
|---|---|
| `funnel/js/flow.js` | `CHECKOUT_URL` (месяц), `CHECKOUT_URL_YEAR` (год) |
| `funnel/index.html` | в `<head>`, объект `CHECKOUT`: `monthly`, `yearly` |
| `product/js/app.js` | `GATE_CHECKOUT_URL` — месячная ссылка |

Пока ссылки пустые, кнопка оплаты пишет «Оплата ещё не подключена» — так и
задумано.

## 3. Stripe: Customer Portal

Settings → Billing → **Customer portal** → Activate. Разрешить: отмену
подписки, смену карты, историю счетов. Кнопка «Управлять подпиской» в
настройках продукта открывает именно его.

## 4. Resend (письма «создайте пароль» и «сброс»)

1. resend.com → аккаунт → **Domains** → Add `astromap.me` → добавить DNS-записи,
   которые он покажет (там, где управляется DNS домена), дождаться Verified.
2. **API Keys** → Create (Sending access).

## 5. Cloudflare: воркер `astromap-license-verify`

Edit code → вставить `cf-worker/license-verify.js` целиком → Deploy.
Settings → Variables and Secrets:

| Имя | Тип | Значение |
|---|---|---|
| `STRIPE_SECRET_KEY` | Secret | restricted key: Developers → API keys → Create restricted key, права: Customers **Read**, Checkout Sessions **Read**, Subscriptions **Read**, Customer portal **Write** |
| `STRIPE_WEBHOOK_SECRET` | Secret | `whsec_…` из шага 6 (эндпоинт этого воркера) |
| `SESSION_SECRET` | Secret | уже есть; если нет — случайная строка 32+ символа |
| `RESEND_API_KEY` | Secret | ключ из шага 4 |
| `MAIL_FROM` | Text | `AstroMap <hello@astromap.me>` |
| KV `ACCOUNTS` | Binding | уже есть (`astromap-accounts`) |

`GUMROAD_PRODUCT_ID` можно удалить.

## 6. Stripe: вебхуки (два эндпоинта)

Developers → Webhooks → **Add endpoint**, событие только
`checkout.session.completed`:

1. `https://astromap-license-verify.egorrut3030.workers.dev/stripe/webhook`
   → его Signing secret в `STRIPE_WEBHOOK_SECRET` воркера license-verify.
2. `https://astromap-visits.egorrut3030.workers.dev/stripe/webhook`
   → его Signing secret в `STRIPE_WEBHOOK_SECRET` воркера visits.

## 7. Cloudflare: воркер `astromap-visits`

Edit code → вставить `cf-worker/visits.js` целиком → Deploy. Добавить
`STRIPE_WEBHOOK_SECRET` (Secret, шаг 6.2). `GUMROAD_SELLER_ID` можно удалить.
Тестовые оплаты (test mode) в статистику не попадают — это нормально.

## 8. Проверка в тестовом режиме

1. Тестовые Payment Links (`https://buy.stripe.com/test_…`) — во все три файла,
   `sk_test_…` и тестовые `whsec_…` — в воркеры.
2. Пройти квиз → оплатить картой `4242 4242 4242 4242`, любая дата в будущем,
   любой CVC.
3. Должно вернуть на `/product/` с формой «Оплата прошла — придумайте пароль»,
   почта уже вписана. Задать пароль → продукт открылся.
4. Письмо «Доступ к AstroMap готов» пришло на почту (Resend → Emails).
5. Выйти (Настройки → Выйти) → войти по почте и паролю.
6. «Первый раз здесь или забыли пароль?» → письмо со ссылкой → новый пароль.
7. Настройки → «Управлять подпиской» → отменить подписку в портале → «Проверить
   сейчас» (после конца периода, или отменить «immediately» в дашборде Stripe)
   → гейт закрывается.
8. В TikTok (или `localStorage.setItem('astromap.qa.inapp','1')` в консоли)
   инструкция «••• → Открыть в браузере» встречает сразу на входе; после
   «Продолжить в TikTok» её же показывает кнопка оплаты. `?nogate` в адресе
   отключает инструкцию на входе.

## 8а. Apple Pay в одно касание (без страницы Stripe Checkout)

Кнопка на пейволле сразу открывает окно Apple Pay (iPhone, Safari на Mac)
или Google Pay (Android). Пока не сделаны шаги ниже, `STRIPE_PK` пустой и
всё работает через Payment Links, как раньше — выкатывать можно в любом
порядке, но **ключ в `wallet.js` вписывать последним**.

1. **Домен для Apple Pay.** Stripe → Settings → Payment methods → **Payment
   method domains** → Add `astromap.me`. Если Stripe попросит файл
   `apple-developer-merchantid-domain-association` — положить его в
   `funnel/.well-known/` и выложить, затем нажать Verify. Apple Pay и
   Google Pay в Settings → Payment methods должны быть включены.
2. **ID цен.** Product catalog → AstroMap → у каждой цены скопировать
   `price_…`.
3. **Воркер `astromap-license-verify`**: вставить новый
   `cf-worker/license-verify.js` → Deploy. Variables:
   `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` (Text, `price_…`).
   Restricted key: добавить права **Customers — Write, Subscriptions —
   Write, PaymentMethods — Write, Invoices — Read, PaymentIntents — Read**
   (или создать новый ключ с ними и заменить `STRIPE_SECRET_KEY`).
4. **Воркер `astromap-visits`**: вставить новый `cf-worker/visits.js` →
   Deploy. Вебхук этого воркера (Developers → Webhooks →
   …/astromap-visits…/stripe/webhook) → **Add events → `invoice.paid`** —
   по нему считаются оплаты через Apple Pay (в Checkout вебхука нет).
5. **`funnel/js/wallet.js`**, начало файла: `STRIPE_PK` = publishable key
   (`pk_live_…`, Developers → API keys), `STRIPE_COUNTRY` — страна
   аккаунта Stripe (две буквы). `WALLET_PRICES` — суммы в центах, как в
   Stripe (799 и 2999).
6. Проверка: на iPhone в Safari пройти квиз → «оплатить» → должно сразу
   всплыть окно Apple Pay с суммой и «подписка, ежемесячно». После оплаты —
   `/product/?session_id=sub_…` и форма «придумайте пароль», письмо
   «Доступ к AstroMap готов». В тестовом режиме — `pk_test_…`, `sk_test_…`
   и тестовые `price_…`; в тестовом режиме Apple Pay берёт карту из
   Wallet, но денег не списывает.

Налог: окно Apple Pay показывает ровно `WALLET_PRICES`. Если в Stripe налог
считается сверху, сумма в окне и списание разойдутся — для Apple Pay цены
лучше сделать с налогом внутри (Include tax in price → Yes) и убрать
«+ VAT» из текстов. `STRIPE_AUTOMATIC_TAX=1` у воркера включает Stripe Tax
и для этих подписок.

На `/stats` новый блок «Из TikTok в браузер»: сколько увидели инструкцию
на входе (`tt_gate`), сколько открыли ссылку уже в браузере (`tt_open`),
сколько остались в TikTok (`tt_stay`), и воронка окна Apple Pay — открыли
окно / оплатили / закрыли.

## 9. Боевой режим

Повторить шаги 2, 5, 6 в Live mode: боевые ссылки в три файла, `sk_live_…` /
restricted live key и боевые `whsec_…` в воркеры. Ссылка в профиле TikTok
должна оставаться `https://astromap.me/?src=tiktok` — на ней держится передача
оплаты из TikTok в браузер.

## 10. Gumroad

После запуска — снять товар с продажи и отключить Ping. Действующие подписчики
Gumroad в продукт больше не войдут (их старый вход гейт стирает): им стоит
написать и предложить оформить подписку заново, отменив Gumroad.
