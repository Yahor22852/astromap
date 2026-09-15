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
    notNow: 'Nie teraz',
    computing: 'Liczę pozycje na moment Twoich urodzin…',

    /* Короткие названия месяцев для трёх селектов даты. Полные формы
       («października») не влезают в треть строки на 320px и обрезаются
       посередине, поэтому везде сокращения. Раньше этот массив лежал в
       flow.js с проверкой «en или pl» — с десятью языками так нельзя. */
    months: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
             'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],

    /* Имена для вспомогательных технологий: у role="progressbar",
       role="group" и role="radiogroup" нет видимого заголовка, а без имени
       скринридер объявляет их как безымянные «группа»/«индикатор». */
    a11y: {
      progress: 'Postęp tworzenia mapy',
      themes: 'Działy do wyboru',
      reasons: 'Powód, dla którego jeszcze nie kupujesz'
    },

    /* --------------------------------------------- превью продукта
       Названия планет, аспектов и фаз нужны здесь, потому что превью
       считается кодом продукта, а тексты продукта (500 КБ на десять языков)
       тащить в воронку ради тридцати слов нельзя.

       Коды точек на колесе — двухбуквенные, а не астрологические символы:
       ♀♂♃ есть не во всех шрифтах, и на части машин вместо них пустые
       квадраты. Так же сделано в продукте. */
    pv: {
      title: 'Twoja mapa w AstroMap',
      sub: 'To ta sama mapa, policzona tym samym kodem co w aplikacji. Dotknij, żeby zobaczyć.',
      tabs: { today: 'Dziś', chart: 'Karta', retro: 'Retrogradacje' },
      points: {
        Sun: 'Słońce', Moon: 'Księżyc', Mercury: 'Merkury', Venus: 'Wenus', Mars: 'Mars',
        Jupiter: 'Jowisz', Saturn: 'Saturn', Uranus: 'Uran', Neptune: 'Neptun', Pluto: 'Pluton',
        Node: 'Węzeł', ASC: 'Ascendent', MC: 'MC'
      },
      codes: {
        Sun: 'Sł', Moon: 'Ks', Mercury: 'Me', Venus: 'We', Mars: 'Ma',
        Jupiter: 'Jo', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
        ASC: 'AC', MC: 'MC'
      },
      /* Аспекты существительными в именительном падеже: строка собирается
         как «Słońce · trygon · Słońce», без склонения названий. */
      aspects: {
        conjunction: 'koniunkcja', sextile: 'sekstyl',
        square: 'kwadratura', trine: 'trygon', opposition: 'opozycja'
      },
      tone: { soft: 'łatwy', hard: 'trudny', neutral: 'neutralny' },
      fromSky: 'niebo teraz', toChart: 'Twoja mapa',
      moonNow: 'Księżyc teraz',
      illum: 'Oświetlenie',
      moonShift: 'Zmiana znaku',
      today: 'dziś', tomorrow: 'jutro', inDays: 'za {n} dni',
      orb: 'orbis',
      activeNow: 'Ciasne aspekty teraz: {n}',
      lockTransits: 'Pozostałe {n} wraz z dokładnymi datami szczytu — w aplikacji.',
      planets: 'Punktów na karcie', aspectsN: 'Aspektów w karcie', housesN: 'Domy',
      noHouses: 'brak godziny',
      lockChart: 'Lista aspektów, domy i pozycje na dowolną datę — w aplikacji.',
      retroTitle: 'Retrogradacje teraz: {n}',
      retroNow: 'ruch wsteczny',
      inSign: 'w znaku {s}',
      noRetro: 'W tej chwili żadna planeta nie jest retrogradna.',
      lockRetro: 'Daty zwrotów, cienie i to, którego domu Twojej karty dotyczą — w aplikacji.'
    },

    /* --------------------------------------- карта, которая собирается */
    map: {
      sun: 'Słońce', moon: 'Księżyc', asc: 'Ascendent',
      sunShort: 'Sł', moonShort: 'Ks', ascShort: 'AC',
      waitDate: 'czeka na datę',
      waitTime: 'czeka na godzinę i miejsce',
      noAsc: 'potrzebna godzina urodzenia',
      firstPoint: 'Pierwszy punkt na mapie. Kolejne dwa dołączą, gdy podasz godzinę i miejsce.'
    },

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
      cityPlaceholder: 'Zacznij pisać nazwę miasta…',
      cityNoMatch: 'Nie znaleziono takiego miasta',
      cityManual: 'Nie znajduję swojego miasta',
      cityManualName: 'Nazwa miejsca',
      cityManualOffset: 'Strefa czasowa (UTC)',
      cityManualApply: 'Użyj tego',
      cityManualNote: 'Bez współrzędnych policzę Słońce i Księżyc, ale nie Ascendent — do niego potrzebne jest dokładne miejsce, a zgadywać go nie będę.',
      unknown: 'Nie znam godziny',
      unknownNote: 'Policzę Słońce i Księżyc. Ascendent zostanie pusty — dopiszesz go, gdy znajdziesz godzinę w akcie urodzenia.',
      moonLabel: 'Księżyc',
      ascLabel: 'Ascendent',
      ascEmptyShort: 'brak godziny',
      ascEmptyPlace: 'potrzebne dokładne miejsce',
      /* Подписи стадий расчёта. Каждая обязана соответствовать операции,
         которая идёт в этот момент, — см. calcChart в flow.js. */
      stageTz: 'Ustalam Twoje niebo urodzenia',
      stageSun: 'Liczę Słońce',
      stageMoon: 'Liczę Księżyc',
      stageAsc: 'Szukam Ascendentu',
      stageDone: 'Składam mapę',
      big3Lead: 'Trzy punkty, od których zaczyna się każda mapa. Razem, nie osobno.',
      roleSun: 'kim jesteś w rdzeniu',
      roleMoon: 'jak przeżywasz i czego potrzebujesz',
      roleAsc: 'jak Twoja mapa spotyka świat',
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
      eyebrow: 'Mapa złożona',
      /* Род не выбран намеренно: «zbudowałaś/zbudowałeś» требует знать род,
         а спрашивать его ради грамматики — лишний экран. Формулировка
         говорит о карте, а не о человеке, и работает для всех. */
      title: 'Twoja mapa jest gotowa',
      coreTitle: 'Twój rdzeń',
      focusTitle: 'Twój fokus',
      skyTitle: 'Niebo nad Twoją mapą teraz',
      pairTitle: 'Relacja',
      closeNow: 'Ciasnych aspektów',
      retroNow: 'Retrogradacje',
      skyNote: 'To liczy się na teraz i jutro będzie inne — mapa urodzeniowa zostaje, niebo nad nią się przesuwa.',
      cta: 'Wejdź do swojej mapy',
      ready: 'Poniżej ta sama mapa w aplikacji — dotknij, żeby się rozejrzeć.'
    },

    /* --------------------------------------------- пейволл: что открывается
       КАЖДАЯ СТРОКА — СУЩЕСТВУЮЩИЙ РАЗДЕЛ ПРОДУКТА. Раньше здесь были четыре
       пункта, описывавшие reading.html, а деньги открывают приложение с
       восемью разделами: человек платил за одно, получал другое. Добавлять
       сюда то, чего в продукте нет, нельзя — это обещание, за которое берут
       деньги. */
    pw: {
      focusLine: 'Twój fokus — {areas} — jedzie razem z mapą: w aplikacji decyduje, co pokazujemy najpierw.',
      opensTitle: 'Co się otwiera',
      opens: [
        { t: 'Karta urodzeniowa. ', d: 'Koło, planety, domy, aspekty i bilans żywiołów — z niebem na dowolny dzień w drugim pierścieniu.' },
        { t: 'Niebo wobec Twojej karty. ', d: 'Co jest aktywne teraz, kiedy zaczęło się i kiedy wygaśnie, z datami szczytu co do minuty.' },
        { t: 'Księżyc. ', d: 'Faza, oświetlenie, znak, najbliższy nów i pełnia, cały miesiąc do przodu.' },
        { t: 'Retrogradacje. ', d: 'Kto zawraca i kiedy, okresy cienia i którego domu Twojej karty dotyczą.' },
        { t: 'Zgodność. ', d: 'Wskaźnik synastrii, najsilniejsze kontakty i mapa złożona dwóch osób.' },
        { t: 'Oś czasu. ', d: 'Co ważnego przed Tobą — fazy, zwroty i dokładne aspekty, z możliwością zapisania.' }
      ],
      movesTitle: 'Niebo się przesuwa',
      movesAspects: 'ciasnych aspektów do Twojej karty dziś',
      movesMoon: 'do wejścia Księżyca w znak {s}',
      movesRetro: 'planety w ruchu wstecznym',
      movesNote: 'Wszystkie działy przeliczają się na dowolną datę. Za to jest abonament: mapa urodzeniowa się nie zmienia, niebo nad nią — codziennie.'
    },

    /* ------------------------------------------------ пейволл */
    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Twoja mapa jest gotowa',
      planTitle: 'Plan miesięczny',
      cta: 'Otwórz moją mapę',
      checkoutOff: 'Płatność nie jest jeszcze podłączona. Twoje dane są zapisane — wróć tu za chwilę.',
      /* {cta} подставляется НАДПИСЬЮ ТОЙ КНОПКИ, что стоит на экране.
         Раньше название было вписано в строку буквами: поменяв paywall.cta
         или зайдя на экран годового плана (там кнопка называется иначе),
         получаешь согласие, которое ссылается на несуществующий контрол —
         первое, что разбирают в спорах по автопродлению. */
      legal: 'Klikając „{cta}”, akceptujesz {terms} i {privacy}.',
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
        trust: 'Oto Twoje pozycje, policzone z podanej daty, godziny i miejsca. To ta sama matematyka, z której korzystają efemerydy — sprawdź je w dowolnym kalkulatorze astrologicznym, mają się zgadzać co do dziesiątej części stopnia.',
        what: 'Dostajesz dostęp do aplikacji, w której Twoja mapa łączy się z aktualnym niebem. Konkretnie:',
        look: 'Spokojnie. Mapa zostaje zapisana w tej przeglądarce, a rozbiór poniżej jest darmowy i pełny — nic w nim nie jest zasłonięte.'
      },
      yearTitle: 'Plan roczny \u2014 taniej o 75%',
      yearCta: 'Wybierz plan roczny',
      backToPlan: 'Wróć do planu miesięcznego',
      readFree: 'Otwórz darmowy rozbiór'
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

    moonPhase: ['Nów', 'Przybywający sierp', 'Pierwsza kwadra', 'Przybywający garb',
                'Pełnia', 'Ubywający garb', 'Ostatnia kwadra', 'Ubywający sierp'],

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
    notNow: 'Not now',
    computing: 'Calculating positions for the moment you were born…',

    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    a11y: {
      progress: 'Progress building your map',
      themes: 'Sections to choose from',
      reasons: 'Why you have not bought yet'
    },

    pv: {
      title: 'Your map inside AstroMap',
      sub: 'The same map, calculated by the same code as the app. Tap to look around.',
      tabs: { today: 'Today', chart: 'Chart', retro: 'Retrogrades' },
      points: {
        Sun: 'Sun', Moon: 'Moon', Mercury: 'Mercury', Venus: 'Venus', Mars: 'Mars',
        Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
        Node: 'Lunar Node', ASC: 'Ascendant', MC: 'MC'
      },
      codes: {
        Sun: 'Su', Moon: 'Mo', Mercury: 'Me', Venus: 'Ve', Mars: 'Ma',
        Jupiter: 'Ju', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
        ASC: 'AC', MC: 'MC'
      },
      aspects: {
        conjunction: 'conjunct', sextile: 'sextile',
        square: 'square', trine: 'trine', opposition: 'opposite'
      },
      tone: { soft: 'easy', hard: 'hard', neutral: 'neutral' },
      fromSky: 'sky now', toChart: 'your map',
      moonNow: 'Moon right now',
      illum: 'Illumination',
      moonShift: 'Changes sign',
      today: 'today', tomorrow: 'tomorrow', inDays: 'in {n} days',
      orb: 'orb',
      activeNow: 'Close aspects right now: {n}',
      lockTransits: 'The other {n}, with the exact peak dates, are in the app.',
      planets: 'Points on your chart', aspectsN: 'Aspects in your chart', housesN: 'Houses',
      noHouses: 'no birth time',
      lockChart: 'The aspect list, the houses and any date you choose are in the app.',
      retroTitle: 'Retrograde right now: {n}',
      retroNow: 'moving backwards',
      inSign: 'in {s}',
      noRetro: 'No planet is retrograde at the moment.',
      lockRetro: 'Turn dates, shadow periods and which house of your chart they touch are in the app.'
    },

    map: {
      sun: 'Sun', moon: 'Moon', asc: 'Ascendant',
      sunShort: 'Su', moonShort: 'Mo', ascShort: 'AC',
      waitDate: 'waiting for your date',
      waitTime: 'waiting for time and place',
      noAsc: 'needs a birth time',
      firstPoint: 'The first point on your map. The other two arrive once you add the time and place.'
    },

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
      cityPlaceholder: 'Start typing a city name\u2026',
      cityNoMatch: 'No city found',
      cityManual: 'I can\u2019t find my city',
      cityManualName: 'Place name',
      cityManualOffset: 'Time zone (UTC)',
      cityManualApply: 'Use this',
      cityManualNote: 'Without coordinates I can calculate the Sun and the Moon, but not the Ascendant \u2014 that needs an exact place, and I won\u2019t guess it.',
      unknown: 'I don\u2019t know the time',
      unknownNote: 'I\u2019ll calculate the Sun and the Moon. The Ascendant stays empty until you find the time on your birth certificate.',
      moonLabel: 'Moon',
      ascLabel: 'Ascendant',
      ascEmptyShort: 'no birth time',
      ascEmptyPlace: 'needs an exact place',
      stageTz: 'Locating your birth sky',
      stageSun: 'Calculating the Sun',
      stageMoon: 'Calculating the Moon',
      stageAsc: 'Finding your Ascendant',
      stageDone: 'Assembling your map',
      big3Lead: 'The three points every chart starts from. Together, not separately.',
      roleSun: 'who you are at the core',
      roleMoon: 'how you feel and what you need',
      roleAsc: 'how your chart meets the world',
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
      eyebrow: 'Map assembled',
      title: 'Your map is ready',
      coreTitle: 'Your core',
      focusTitle: 'Your focus',
      skyTitle: 'The sky over your map right now',
      pairTitle: 'Relationship',
      closeNow: 'Close aspects',
      retroNow: 'Retrograde',
      skyNote: 'This is calculated for right now, and tomorrow it is different — the birth map stays, the sky over it moves.',
      cta: 'Step into your map',
      ready: 'Below is that same map inside the app — tap to look around.'
    },

    pw: {
      focusLine: 'Your focus — {areas} — travels with the map: in the app it decides what you see first.',
      opensTitle: 'What opens',
      opens: [
        { t: 'Your birth chart. ', d: 'The wheel, planets, houses, aspects and elemental balance — with the sky of any day in a second ring.' },
        { t: 'The sky against your chart. ', d: 'What is active now, when it began and when it fades, with peak dates down to the minute.' },
        { t: 'The Moon. ', d: 'Phase, illumination, sign, the next new and full Moon, a month ahead.' },
        { t: 'Retrogrades. ', d: 'Who turns and when, the shadow periods, and which house of your chart they touch.' },
        { t: 'Compatibility. ', d: 'The synastry index, the strongest contacts and the composite chart of two people.' },
        { t: 'Your timeline. ', d: 'What is coming — phases, turns and exact aspects, with anything worth keeping saved.' }
      ],
      movesTitle: 'The sky keeps moving',
      movesAspects: 'close aspects to your chart today',
      movesMoon: 'until the Moon enters {s}',
      movesRetro: 'planets moving backwards',
      movesNote: 'Every section recalculates for any date you choose. That is what the subscription is for: your birth chart does not change, the sky over it changes daily.'
    },

    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Your map is ready',
      planTitle: 'Monthly plan',
      cta: 'Unlock my map',
      checkoutOff: 'Payments are not connected yet. Your details are saved — come back in a moment.',
      legal: 'By clicking “{cta}” you accept the {terms} and the {privacy}.',
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
        trust: 'Here are your positions, calculated from the date, time and place you gave. This is the same maths ephemerides use — check them in any astrology calculator and they should agree to within a tenth of a degree.',
        what: 'You get access to the app where your chart meets the current sky. Specifically:',
        look: 'That’s fine. Your map stays saved in this browser, and the reading below is free and complete — nothing in it is covered up.'
      },
      yearTitle: 'Annual plan \u2014 75% cheaper',
      yearCta: 'Get the annual plan',
      backToPlan: 'Back to the monthly plan',
      readFree: 'Open the free reading'
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

    moonPhase: ['New Moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
                'Full Moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'],

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

     В этом файле лежат только английский и польский. Остальные восемь —
     в js/lang/<код>.js, и страница подключает ровно один такой файл:
     14 КБ на латинице, 21 на кириллице. Все десять языков в одном файле
     дали бы около 350 КБ на каждой загрузке воронки, где первая отрисовка
     решает, дойдёт ли человек до второго экрана. Язык, для которого файла
     нет или который не догрузился, молча остаётся английским — воронка
     работает, просто не на своём языке.
     ------------------------------------------------------------------ */
  var LANG = global.ASTROMAP_LANG || 'en';

  global.COPY_ALL = { pl: PL, en: EN };
  global.COPY = global.COPY_ALL[LANG] || EN;
  global.LANG = LANG;
})(typeof window !== 'undefined' ? window : globalThis);
