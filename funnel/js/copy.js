/* copy.js — ВСЕ ТЕКСТЫ ВОРОНКИ. Править только здесь.
   Одна строка = одно место в интерфейсе. Ниже в комментариях бюджет по ширине:
   при 375px ширина контентного блока = 327px.

   Переключение языка: константа LANG в конце файла ('pl' | 'en').
   Цены и биллинг-тексты — в блоке billing. Меняешь цену в одном месте —
   меняй и в disclaimer: они специально не собираются автоматически,
   чтобы нельзя было случайно оставить рассинхрон.
*/
(function (global) {
  'use strict';

  var PL = {
    brand: 'AstroMap App',
    progress: 'Twoja mapa',            /* ≤ 14 знаков */
    ctaNext: 'Dalej',
    ctaCalc: 'Policz moją mapę',
    ctaSummary: 'Zobacz podsumowanie',
    ctaPaywall: 'Kontynuuj',           /* ВАЖНО: на эту кнопку ссылается legal-строка */
    notNow: 'Nie teraz',
    computing: 'Liczę pozycje na moment Twoich urodzin…',

    /* ------------------------------------------------ экран 1: дата */
    s1: {
      eyebrow: 'Zacznijmy od jednej daty',
      title: 'Kiedy się urodziłaś lub urodziłeś?',   /* ≤ 44 знака, иначе 3 строки */
      day: 'Dzień', month: 'Miesiąc', year: 'Rok',
      resultLabel: 'Twoje Słońce',
      elementLabel: 'Żywioł'
    },

    /* ------------------------------------------------ экран 2: темы */
    s2: {
      eyebrow: 'Wybierz od 2 do 3',
      title: 'Co ma być w Twojej mapie?',
      hint: 'Te działy pojawią się w Twoim rozbiorze.',
      themes: [
        { k: 'love',   t: 'Miłość i relacje',    d: 'Kto do Ciebie pasuje i dlaczego' },
        { k: 'money',  t: 'Kariera i pieniądze', d: 'Gdzie masz naturalną siłę' },
        { k: 'calm',   t: 'Spokój i sen',        d: 'Co Cię realnie regeneruje' },
        { k: 'self',   t: 'Ja i moje granice',   d: 'Gdzie oddajesz za dużo' }
      ]
    },

    /* ------------------------------------------------ экран 3: время и место */
    s3: {
      eyebrow: 'Najważniejszy krok',
      title: 'Godzina i miejsce urodzenia',
      hint: 'Bez godziny nie da się policzyć Ascendentu — to on odpowiada za pierwsze wrażenie, jakie robisz.',
      hour: 'Godzina', minute: 'Minuta', city: 'Miasto',
      unknown: 'Nie znam godziny',
      unknownNote: 'Policzę Słońce i Księżyc. Ascendent zostanie pusty — dopiszesz go, gdy znajdziesz godzinę w akcie urodzenia.',
      moonLabel: 'Księżyc',
      ascLabel: 'Ascendent',
      cuspNote: 'Twoje światło stoi na granicy znaku — przy tak dokładnej pozycji warto sprawdzić godzinę co do minuty.'
    },

    /* ------------------------------------------------ экран 4: партнёр */
    s4: {
      eyebrow: 'Ostatnie pytanie',
      title: 'Sprawdźmy jedną relację',
      hint: 'Data urodzenia osoby, która Cię interesuje. Bez godziny wynik liczę na południe — dlatego Księżyc partnera może być przybliżony.',
      skip: 'Pomiń ten krok',
      scoreLabel: 'Wskaźnik zgodności',
      scoleFoot: 'Indeks w skali 38–96, liczony z aspektów Słońca i Księżyca obu osób. To metoda astrologiczna, nie prognoza.',
      bands: [
        { min: 0,  t: 'Trudna para na dłużej', d: 'Przyciąganie jest, ale codzienność będzie kosztować oboje więcej niż myślicie.' },
        { min: 55, t: 'Działa, jeśli rozmawiacie', d: 'Nie ma tu automatycznej łatwości — jest za to realna szansa, jeśli mówicie sobie rzeczy wprost.' },
        { min: 70, t: 'Mocna para', d: 'Wasze Księżyce trzymają ten sam rytm. To ten typ relacji, którą inni nazywają spokojną.' },
        { min: 84, t: 'Rzadkie połączenie', d: 'Aspekt tak dokładny trafia się rzadko. Reszta zależy tylko od tego, co z tym zrobicie.' }
      ]
    },

    /* ------------------------------------------------ экран 5: сводка */
    s5: {
      eyebrow: 'Twoja mapa jest gotowa',
      title: 'To zbudowałaś w cztery kroki',
      titleM: 'To zbudowałeś w cztery kroki',
      sun: 'Słońce', moon: 'Księżyc', asc: 'Ascendent',
      ascEmpty: 'brak godziny',
      themesLabel: 'Twoje działy',
      pairLabel: 'Relacja',
      ready: 'Pełny rozbiór tych pozycji jest policzony i czeka.'
    },

    /* ------------------------------------------------ пейволл */
    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Odbierz pełną mapę',
      /* Список ОБЯЗАН совпадать с тем, что показал онбординг. Не добавлять
         сюда функций, которых нет: чат с астrologiem, pushe, домы i aspekty. */
      includes: [
        'Pełny rozbiór Słońca, Księżyca i Ascendentu — Twoje pozycje, nie opis znaku',
        'Wybrane przez Ciebie działy: {themes}',
        'Prognoza na tydzień z tranzytów — przeliczana od nowa co tydzień',
        'Rozbiór zgodności z osobą, którą podałaś lub podałeś'
      ],
      includesNoPair: 'Rozbiór zgodności — dodasz osobę w każdej chwili',
      planTitle: 'Plan miesięczny',
      cta: 'Kontynuuj',
      legal: 'Klikając „Kontynuuj”, akceptujesz {terms} i {privacy}.',
      privacyInline: 'Politykę prywatności',
      terms: 'Warunki subskrypcji',
      privacy: 'Polityka prywatności'
    },

    /* ------------------------------------------------ recovery */
    recovery: {
      title: 'Twój rozbiór jest już policzony',
      sub: 'Poniżej pierwszy akapit. Reszta czeka na Twoim koncie.',
      surveyTitle: 'Co Cię zatrzymało?',
      survey: [
        { k: 'price', t: 'Za drogo' },
        { k: 'trust', t: 'Nie wiem, czy to działa' },
        { k: 'what',  t: 'Nie rozumiem, co dostanę' },
        { k: 'look',  t: 'Tylko się rozglądam' }
      ],
      answers: {
        price: 'Plan roczny kosztuje 119,99 zł zamiast 479,88 zł, które wychodzą przy płaceniu co miesiąc. To 10 zł miesięcznie.',
        trust: 'Pozycje na ekranie policzyliśmy z Twojej daty i godziny — to ta sama matematyka, z której korzystają efemerydy. Możesz je sprawdzić w dowolnym kalkulatorze.',
        what: 'Dostajesz rozbiór trzech policzonych pozycji, wybrane działy, prognozę tygodniową z tranzytów i rozbiór zgodności. Nic poza tym.',
        look: 'Spokojnie. Twoja mapa zostaje zapisana w tej przeglądarce — wrócisz do niej z tego samego linku.'
      },
      yearTitle: 'Plan roczny \u2014 taniej o 75%',
      yearCta: 'Wybierz plan roczny'
    },

    /* ------------------------------------------------ биллинг */
    billing: {
      /* Модель: месячная подписка без вводного периода.
         ЦЕНА В ЗЛОТЫХ — пересчёт с 9,99 USD, а не отдельно установленная цена.
         Перед запуском поставь ту сумму, которую реально списывает платёжка,
         и приведи disclaimer в соответствие: расхождение цифр здесь и на
         checkout — это спор по автопродлению, а не мелкая неточность. */
      price: '39,99 zł',
      period: 'miesięcznie',
      priceLine: '39,99 zł',
      renewLine: 'miesięcznie, odnawia się automatycznie',
      /* Все обязательные элементы на месте: цена, период, автопродление,
         дедлайн отмены, способ отмены. Вводного периода в этой модели нет,
         поэтому и формулировки про его окончание нет. */
      disclaimer: 'Subskrypcja kosztuje 39,99 zł miesięcznie i odnawia się automatycznie co miesiąc, o ile nie anulujesz jej co najmniej 24 godziny przed końcem bieżącego okresu rozliczeniowego. Anulujesz w każdej chwili w ustawieniach konta — zobacz Warunki subskrypcji.',
      /* Годовой план на recovery-экране. Скидка считается из цен, которые
         человек видит на экране: 119,99 / (39,99 x 12 = 479,88) = 25%,
         то есть 75% экономии. Меняешь любую из двух цен — пересчитай процент
         в yearTitle и в answers.price, иначе на экране будет неверная цифра. */
      yearPrice: '119,99 zł',
      yearPeriod: 'rocznie',
      yearDisclaimer: 'Plan roczny kosztuje 119,99 zł i odnawia się automatycznie co rok, o ile nie anulujesz go co najmniej 24 godziny przed końcem bieżącego okresu. Przy planie miesięcznym rok kosztuje 479,88 zł. Anulujesz w każdej chwili w ustawieniach konta \u2014 zobacz Warunki subskrypcji.'
    },

    signs: ['Baran', 'Byk', 'Bliźnięta', 'Rak', 'Lew', 'Panna',
            'Waga', 'Skorpion', 'Strzelec', 'Koziorożec', 'Wodnik', 'Ryby'],
    signsIn: ['w Baranie', 'w Byku', 'w Bliźniętach', 'w Raku', 'w Lwie', 'w Pannie',
              'w Wadze', 'w Skorpionie', 'w Strzelcu', 'w Koziorożcu',
              'w Wodniku', 'w Rybach'],
    elements: { fire: 'Ogień', earth: 'Ziemia', air: 'Powietrze', water: 'Woda' },

    /* Солнце: кто ты по сути. ≤ 100 знаков */
    sun: [
      'Ruszasz pierwsza i pytasz później. Twoja siła to start, nie utrzymywanie.',
      'Nie lubisz, gdy ktoś przyspiesza Twoje tempo. Wolno, ale do końca.',
      'Myślisz szybciej, niż mówisz, więc rzadko kończysz zdanie tam, gdzie zaczęłaś.',
      'Czujesz nastroje w pokoju przed wszystkimi. Dlatego bywasz zmęczona bez powodu.',
      'Potrzebujesz widowni, ale nie z próżności — z potrzeby, żeby coś znaczyło.',
      'Widzisz szczegół, który psuje całość. Cena: rzadko uznajesz coś za skończone.',
      'Wybierasz komfort wszystkich zamiast swojego i nazywasz to spokojem.',
      'Nie robisz nic po trochu. Albo w pełni, albo wcale — także w odejściu.',
      'Twoja odpowiedź na trudność to ruch, nie rozmowa. Czasem to ucieczka.',
      'Zbudujesz wszystko od zera, jeśli dasz sobie na to dziesięć lat.',
      'Trzymasz dystans nie z chłodu, a z instynktu samoobrony.',
      'Wchłaniasz emocje innych i nie zauważasz, kiedy przestały być Twoje.'
    ],
    /* Луна: как ты чувствуешь. ≤ 100 знаков */
    moon: [
      'Emocje masz krótkie i gwałtowne. Wybuch, a potem czysto.',
      'Uspokaja Cię to samo co zawsze: jedzenie, koc, znane miejsce.',
      'Gadasz, żeby przetrawić uczucie. Cisza Cię niepokoi.',
      'Pamiętasz każdą krzywdę z dokładnością do zdania.',
      'Potrzebujesz, żeby ktoś zauważył, że jest Ci gorzej.',
      'Zamiast płakać — porządkujesz. Ciało jako sposób na lęk.',
      'Nie umiesz być zła przy kimś. Odkładasz to na później i sama.',
      'Nie ufasz spokojowi. Sprawdzasz, gdzie jest haczyk.',
      'Smutek leczysz planowaniem wyjazdu, nawet gdy nie jedziesz.',
      'Wstyd Ci prosić o pomoc. Wolisz zrobić trzy razy więcej.',
      'Analizujesz uczucie zamiast go poczuć. Skuteczne do czasu.',
      'Nie masz granicy między swoim nastrojem a cudzym.'
    ],
    /* Асцендент: как тебя видят. ≤ 100 знаков */
    asc: [
      'Ludzie widzą kogoś, kto zaraz coś zdecyduje. Nawet gdy się wahasz.',
      'Robisz wrażenie osoby spokojnej i drogiej. To pierwsze, co widzą.',
      'Wydajesz się lekka i dostępna — dlatego zwierzają Ci się obcy.',
      'Wyglądasz na kogoś, kto zaopiekuje. Ludzie proszą Cię pierwszą.',
      'Wchodzisz i temperatura pokoju się zmienia. Nie da się tego wyłączyć.',
      'Wyglądasz na osobę kompetentną, więc dostajesz cudzą pracę.',
      'Ludzie zakładają, że się zgodzisz. Zwykle mają rację.',
      'Robisz wrażenie kogoś, kto wie więcej, niż mówi. Bywa onieśmielające.',
      'Wyglądasz na kogoś, kto zaraz wyjdzie. Nawet gdy zostajesz.',
      'Wydajesz się starsza i poważniejsza, niż jesteś. Zawsze tak było.',
      'Widzą kogoś osobnego. Sympatycznego, ale nie do końca obecnego.',
      'Twój wyraz twarzy czytają jako zaproszenie. Często mylnie.'
    ]
  };

  var EN = {
    brand: 'AstroMap App',
    progress: 'Your map',
    ctaNext: 'Continue',
    ctaCalc: 'Calculate my map',
    ctaSummary: 'See the summary',
    ctaPaywall: 'Continue',
    notNow: 'Not now',
    computing: 'Calculating positions for the moment you were born…',

    s1: {
      eyebrow: 'Start with one date',
      title: 'When were you born?',
      day: 'Day', month: 'Month', year: 'Year',
      resultLabel: 'Your Sun',
      elementLabel: 'Element'
    },

    s2: {
      eyebrow: 'Pick 2 or 3',
      title: 'What goes into your map?',
      hint: 'These sections will appear in your reading.',
      themes: [
        { k: 'love',  t: 'Love and relationships', d: 'Who fits you, and why' },
        { k: 'money', t: 'Work and money',         d: 'Where your natural pull is' },
        { k: 'calm',  t: 'Rest and sleep',         d: 'What actually restores you' },
        { k: 'self',  t: 'Me and my limits',       d: 'Where you give away too much' }
      ]
    },

    s3: {
      eyebrow: 'The step that matters',
      title: 'Birth time and place',
      hint: 'Without a time there is no Ascendant — and the Ascendant is the first impression you make.',
      hour: 'Hour', minute: 'Minute', city: 'City',
      unknown: 'I don\u2019t know the time',
      unknownNote: 'I\u2019ll calculate the Sun and the Moon. The Ascendant stays empty until you find the time on your birth certificate.',
      moonLabel: 'Moon',
      ascLabel: 'Ascendant',
      cuspNote: 'Your light sits right on a sign boundary — with a position this close, the exact minute matters.'
    },

    s4: {
      eyebrow: 'Last question',
      title: 'Let\u2019s check one relationship',
      hint: 'The birth date of the person you have in mind. With no time given I calculate for midday, so their Moon may be approximate.',
      skip: 'Skip this step',
      scoreLabel: 'Compatibility index',
      scoleFoot: 'An index on a 38–96 scale, built from Sun and Moon aspects between you. This is astrological method, not a forecast.',
      bands: [
        { min: 0,  t: 'Hard work long term', d: 'The pull is there, but daily life will cost you both more than you expect.' },
        { min: 55, t: 'Works if you talk',  d: 'Nothing here is automatic. There is a real chance if you say things plainly.' },
        { min: 70, t: 'A strong pair',      d: 'Your Moons keep the same rhythm. This is the kind others describe as calm.' },
        { min: 84, t: 'A rare connection',  d: 'An aspect this exact is uncommon. The rest is only what you do with it.' }
      ]
    },

    s5: {
      eyebrow: 'Your map is ready',
      title: 'This is what you built in four steps',
      titleM: 'This is what you built in four steps',
      sun: 'Sun', moon: 'Moon', asc: 'Ascendant',
      ascEmpty: 'no birth time',
      themesLabel: 'Your sections',
      pairLabel: 'Relationship',
      ready: 'The full reading of these positions is calculated and waiting.'
    },

    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Get your full map',
      includes: [
        'A full reading of your Sun, Moon and Ascendant — your positions, not a sign description',
        'The sections you chose: {themes}',
        'A weekly forecast from transits — recalculated every week',
        'The compatibility reading for the person you entered'
      ],
      includesNoPair: 'Compatibility reading — add a person any time',
      planTitle: 'Monthly plan',
      cta: 'Continue',
      legal: 'By clicking “Continue” you accept the {terms} and the {privacy}.',
      privacyInline: 'Privacy Policy',
      terms: 'Subscription Terms',
      privacy: 'Privacy Policy'
    },

    recovery: {
      title: 'Your reading is already calculated',
      sub: 'Here is the first paragraph. The rest is waiting in your account.',
      surveyTitle: 'What stopped you?',
      survey: [
        { k: 'price', t: 'Too expensive' },
        { k: 'trust', t: 'Not sure it works' },
        { k: 'what',  t: 'Unclear what I get' },
        { k: 'look',  t: 'Just looking' }
      ],
      answers: {
        price: 'The annual plan is $29.99 instead of the $119.88 a year adds up to when paying monthly. That is $2.50 a month.',
        trust: 'The positions on screen came from your own date and time — the same maths ephemerides use. Check them in any calculator.',
        what: 'You get a reading of three calculated positions, your chosen sections, a weekly transit forecast and the compatibility reading. Nothing beyond that.',
        look: 'That\u2019s fine. Your map stays saved in this browser — the same link brings you back to it.'
      },
      yearTitle: 'Annual plan \u2014 75% cheaper',
      yearCta: 'Get the annual plan'
    },

    billing: {
      price: '$9.99',
      period: 'per month',
      priceLine: '$9.99',
      renewLine: 'per month, renews automatically',
      disclaimer: 'The subscription is $9.99 per month and renews automatically each month unless you cancel at least 24 hours before the end of the current billing period. Cancel anytime in your account settings — see our Subscription Terms.',
      yearPrice: '$29.99',
      yearPeriod: 'per year',
      yearDisclaimer: 'The annual plan is $29.99 and renews automatically every year unless you cancel at least 24 hours before the end of the current period. Paying monthly, a year costs $119.88. Cancel anytime in your account settings \u2014 see our Subscription Terms.'
    },

    signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    signsIn: ['in Aries', 'in Taurus', 'in Gemini', 'in Cancer', 'in Leo', 'in Virgo',
              'in Libra', 'in Scorpio', 'in Sagittarius', 'in Capricorn',
              'in Aquarius', 'in Pisces'],
    elements: { fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water' },

    sun: [
      'You move first and ask later. Your strength is starting, not maintaining.',
      'You hate having your pace rushed. Slowly, but all the way through.',
      'You think faster than you speak, so sentences rarely end where they began.',
      'You read the mood of a room before anyone else. Hence the unexplained tiredness.',
      'You need an audience, not from vanity but to make something matter.',
      'You spot the detail that ruins the whole. The cost: nothing feels finished.',
      'You pick everyone else\u2019s comfort over your own and call it peace.',
      'You do nothing by halves. All the way in, or not at all — leaving included.',
      'Your answer to difficulty is movement, not conversation. Sometimes it\u2019s escape.',
      'You will build the whole thing from zero, given ten years to do it.',
      'You keep your distance out of instinct, not coldness.',
      'You absorb other people\u2019s feelings and miss the moment they stopped being yours.'
    ],
    moon: [
      'Your feelings run short and hot. It bursts, then it\u2019s clear.',
      'The same things calm you every time: food, a blanket, a familiar room.',
      'You talk to digest a feeling. Silence makes you uneasy.',
      'You remember every slight, down to the sentence.',
      'You need someone to notice that things got worse for you.',
      'Instead of crying you tidy. The body as a way through fear.',
      'You can\u2019t be angry in front of anyone. It waits until you\u2019re alone.',
      'You distrust calm. You look for where the catch is.',
      'You treat sadness by planning a trip, even one you never take.',
      'Asking for help embarrasses you. You\u2019d rather do three times the work.',
      'You analyse a feeling instead of feeling it. Effective, up to a point.',
      'There is no border between your mood and someone else\u2019s.'
    ],
    asc: [
      'People see someone about to decide something. Even mid-hesitation.',
      'You come across as calm and expensive. That lands first.',
      'You seem light and available — which is why strangers confide in you.',
      'You look like someone who will take care of it. You get asked first.',
      'You walk in and the temperature of the room shifts. It doesn\u2019t switch off.',
      'You look competent, so you end up holding other people\u2019s work.',
      'People assume you\u2019ll agree. Usually they\u2019re right.',
      'You seem to know more than you say. It can be intimidating.',
      'You look like someone about to leave. Even when you stay.',
      'You read as older and more serious than you are. Always have.',
      'They see someone separate. Likeable, but not entirely present.',
      'People read your face as an invitation. Often wrongly.'
    ]
  };

  /* ------------------------------------------------------------------
     ЯЗЫК ВОРОНКИ. Дефолт — английский. Значение приходит из бутстрапа
     в index.html (window.ASTROMAP_LANG), который читает выбор человека
     из localStorage. Здесь ничего править не нужно.
     ------------------------------------------------------------------ */
  var LANG = (global.ASTROMAP_LANG === 'pl') ? 'pl' : 'en';

  global.COPY = LANG === 'en' ? EN : PL;
  global.COPY_ALL = { pl: PL, en: EN };
  global.LANG = LANG;
})(typeof window !== 'undefined' ? window : globalThis);
