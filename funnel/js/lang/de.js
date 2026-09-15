/* Deutsch — строки интерфейса воронки.
   Структура повторяет английский объект в js/copy.js ключ в ключ.
   Биллинг и юридические строки сюда не переводятся — см. ниже. */
(function (global) {
  'use strict';

  var EN = global.COPY_ALL && global.COPY_ALL.en;
  if (!EN) { return; }

  var C = {
    brand: 'AstroMap App',
    progress: 'Deine Karte',             /* ≤ 14 знаков */
    ctaNext: 'Weiter',
    ctaCalc: 'Meine Karte berechnen',
    ctaSummary: 'Zusammenfassung ansehen',
    notNow: 'Nicht jetzt',
    computing: 'Ich berechne die Positionen für den Moment deiner Geburt…',

    months: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
             'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],

    a11y: {
      progress: 'Fortschritt beim Aufbau deiner Karte',
      themes: 'Bereiche zur Auswahl',
      reasons: 'Warum du noch nicht gekauft hast'
    },

    pv: {
      title: 'Deine Karte in AstroMap',
      sub: 'Dieselbe Karte, berechnet mit demselben Code wie die App. Tippe, um dich umzusehen.',
      tabs: { today: 'Heute', chart: 'Karte', retro: 'Rückläufe' },
      points: {
        Sun: 'Sonne', Moon: 'Mond', Mercury: 'Merkur', Venus: 'Venus', Mars: 'Mars',
        Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptun', Pluto: 'Pluto',
        Node: 'Mondknoten', ASC: 'Aszendent', MC: 'MC'
      },
      codes: {
        Sun: 'So', Moon: 'Mo', Mercury: 'Me', Venus: 'Ve', Mars: 'Ma',
        Jupiter: 'Ju', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
        ASC: 'AC', MC: 'MC'
      },
      aspects: {
        conjunction: 'Konjunktion', sextile: 'Sextil',
        square: 'Quadrat', trine: 'Trigon', opposition: 'Opposition'
      },
      tone: { soft: 'leicht', hard: 'schwer', neutral: 'neutral' },
      fromSky: 'Himmel jetzt', toChart: 'deine Karte',
      moonNow: 'Mond gerade jetzt',
      illum: 'Beleuchtung',
      moonShift: 'Wechselt das Zeichen',
      today: 'heute', tomorrow: 'morgen', inDays: 'in {n} Tagen',
      orb: 'Orbis',
      activeNow: 'Enge Aspekte gerade jetzt: {n}',
      lockTransits: 'Die übrigen {n}, mit den genauen Höhepunkten, stehen in der App.',
      planets: 'Punkte in deiner Karte', aspectsN: 'Aspekte in deiner Karte', housesN: 'Häuser',
      noHouses: 'keine Geburtszeit',
      lockChart: 'Die Aspektliste, die Häuser und jedes beliebige Datum stehen in der App.',
      retroTitle: 'Gerade rückläufig: {n}',
      retroNow: 'läuft rückwärts',
      inSign: 'in {s}',
      noRetro: 'Im Moment ist kein Planet rückläufig.',
      lockRetro: 'Wendedaten, Schattenphasen und das betroffene Haus deiner Karte stehen in der App.'
    },

    map: {
      sun: 'Sonne', moon: 'Mond', asc: 'Aszendent',
      sunShort: 'So', moonShort: 'Mo', ascShort: 'AC',
      waitDate: 'wartet auf dein Datum',
      waitTime: 'wartet auf Zeit und Ort',
      noAsc: 'braucht eine Geburtszeit',
      firstPoint: 'Der erste Punkt deiner Karte. Die beiden anderen kommen, sobald Zeit und Ort dazukommen.'
    },

    s1: {
      eyebrow: 'Beginne mit einem Datum',
      title: 'Wann bist du geboren?',
      day: 'Tag', month: 'Monat', year: 'Jahr',
      resultLabel: 'Deine Sonne',
      elementLabel: 'Element'
    },

    s2: {
      eyebrow: 'Wähle 2 oder 3',
      title: 'Was gehört in deine Karte?',
      hint: 'Diese Bereiche tauchen in deiner Auswertung auf.',
      themes: [
        { k: 'love',  t: 'Liebe und Beziehungen', d: 'Wer zu dir passt und warum' },
        { k: 'money', t: 'Arbeit und Geld',       d: 'Wohin es dich von selbst zieht' },
        { k: 'calm',  t: 'Ruhe und Schlaf',       d: 'Was dich wirklich auflädt' },
        { k: 'self',  t: 'Ich und meine Grenzen', d: 'Wo du zu viel abgibst' }
      ]
    },

    s3: {
      eyebrow: 'Der Schritt, auf den es ankommt',
      title: 'Geburtszeit und Geburtsort',
      hint: 'Ohne Zeit gibt es keinen Aszendenten — und der Aszendent ist der erste Eindruck, den du machst.',
      hour: 'Stunde', minute: 'Minute', city: 'Stadt',
      cityPlaceholder: 'Stadtnamen eintippen…',
      cityNoMatch: 'Keine Stadt gefunden',
      cityManual: 'Meine Stadt ist nicht dabei',
      cityManualName: 'Name des Ortes',
      cityManualOffset: 'Zeitzone (UTC)',
      cityManualApply: 'Übernehmen',
      cityManualNote: 'Ohne Koordinaten kann ich Sonne und Mond berechnen, den Aszendenten nicht — der braucht einen genauen Ort, und den rate ich nicht.',
      unknown: 'Ich kenne die Zeit nicht',
      unknownNote: 'Ich berechne Sonne und Mond. Der Aszendent bleibt leer, bis du die Zeit in deiner Geburtsurkunde findest.',
      moonLabel: 'Mond',
      ascLabel: 'Aszendent',
      ascEmptyShort: 'keine Geburtszeit',
      ascEmptyPlace: 'braucht einen genauen Ort',
      stageTz: 'Ich suche deinen Geburtshimmel',
      stageSun: 'Ich berechne die Sonne',
      stageMoon: 'Ich berechne den Mond',
      stageAsc: 'Ich finde deinen Aszendenten',
      stageDone: 'Ich setze deine Karte zusammen',
      big3Lead: 'Die drei Punkte, mit denen jede Karte anfängt. Zusammen, nicht einzeln.',
      roleSun: 'wer du im Kern bist',
      roleMoon: 'wie du fühlst und was du brauchst',
      roleAsc: 'wie deine Karte auf die Welt trifft',
      cuspNote: 'Dein Licht steht genau auf einer Zeichengrenze — bei dieser Position zählt die genaue Minute.'
    },

    s4: {
      eyebrow: 'Letzte Frage',
      title: 'Sehen wir uns eine Beziehung an',
      hint: 'Das Geburtsdatum der Person, an die du denkst. Ohne Uhrzeit rechne ich mit Mittag, der Mond kann also ungefähr sein.',
      skip: 'Schritt überspringen',
      scoreLabel: 'Kompatibilitätsindex',
      scoleFoot: 'Ein Index auf einer Skala von 38 bis 96, gebildet aus den Sonne- und Mondaspekten zwischen euch. Astrologische Methode, keine Prognose.',
      bands: [
        { min: 0,  t: 'Langfristig harte Arbeit', d: 'Die Anziehung ist da, aber der Alltag kostet euch beide mehr, als ihr erwartet.' },
        { min: 55, t: 'Klappt, wenn ihr redet',   d: 'Nichts davon läuft von allein. Die Chance ist echt, wenn ihr Dinge klar aussprecht.' },
        { min: 70, t: 'Ein starkes Paar',         d: 'Eure Monde halten denselben Rhythmus. So etwas nennen andere von außen ruhig.' },
        { min: 84, t: 'Eine seltene Verbindung',  d: 'Ein so exakter Aspekt kommt selten vor. Der Rest ist nur, was ihr daraus macht.' }
      ]
    },

    s5: {
      eyebrow: 'Karte steht',
      title: 'Deine Karte ist fertig',
      coreTitle: 'Dein Kern',
      focusTitle: 'Dein Fokus',
      skyTitle: 'Der Himmel über deiner Karte gerade jetzt',
      pairTitle: 'Beziehung',
      closeNow: 'Enge Aspekte',
      retroNow: 'Rückläufig',
      skyNote: 'Das ist für diesen Moment gerechnet und morgen anders — die Geburtskarte bleibt, der Himmel darüber zieht weiter.',
      cta: 'In deine Karte gehen',
      ready: 'Unten dieselbe Karte in der App — tippe, um dich umzusehen.'
    },

    pw: {
      focusLine: 'Dein Fokus — {areas} — wandert mit der Karte: in der App entscheidet er, was du zuerst siehst.',
      opensTitle: 'Was sich öffnet',
      opens: [
        { t: 'Deine Geburtskarte. ', d: 'Rad, Planeten, Häuser, Aspekte und Elementebalance — mit dem Himmel eines beliebigen Tages im zweiten Ring.' },
        { t: 'Der Himmel gegen deine Karte. ', d: 'Was jetzt aktiv ist, wann es begann und wann es abklingt, mit Höhepunkten auf die Minute genau.' },
        { t: 'Der Mond. ', d: 'Phase, Beleuchtung, Zeichen, der nächste Neu- und Vollmond, einen Monat voraus.' },
        { t: 'Rückläufe. ', d: 'Wer wann wendet, die Schattenphasen und welches Haus deiner Karte sie berühren.' },
        { t: 'Kompatibilität. ', d: 'Der Synastrie-Index, die stärksten Kontakte und die Composite-Karte zweier Menschen.' },
        { t: 'Deine Zeitleiste. ', d: 'Was kommt — Phasen, Wenden und exakte Aspekte, mit allem Aufhebenswerten gespeichert.' }
      ],
      movesTitle: 'Der Himmel zieht weiter',
      movesAspects: 'enge Aspekte zu deiner Karte heute',
      movesMoon: 'bis der Mond ins Zeichen {s} wechselt',
      movesRetro: 'Planeten laufen rückwärts',
      movesNote: 'Jeder Bereich rechnet sich für jedes Datum neu, das du wählst. Dafür ist das Abo da: deine Geburtskarte ändert sich nicht, der Himmel darüber täglich.'
    },

    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Deine Karte ist fertig',
      planTitle: 'Monatsplan',
      cta: 'Meine Karte freischalten',
      checkoutOff: 'Zahlungen sind noch nicht angebunden. Deine Angaben sind gespeichert — komm gleich wieder.'
    },

    recovery: {
      title: 'Deine Auswertung ist schon berechnet',
      sub: 'Hier der erste Absatz. Der Rest wartet in deinem Konto.',
      surveyTitle: 'Was hat dich gestoppt?',
      survey: [
        { k: 'price', t: 'Zu teuer' },
        { k: 'trust', t: 'Nicht sicher, ob es stimmt' },
        { k: 'what',  t: 'Unklar, was ich bekomme' },
        { k: 'look',  t: 'Schaue nur' }
      ],
      answers: {
        trust: 'Hier sind deine Positionen, berechnet aus Datum, Zeit und Ort, die du angegeben hast. Das ist dieselbe Mathematik, mit der Ephemeriden arbeiten — prüf sie in einem beliebigen Astrologie-Rechner nach, sie sollten auf ein Zehntelgrad übereinstimmen.',
        what: 'Du bekommst Zugang zur App, in der deine Karte auf den aktuellen Himmel trifft. Konkret:',
        look: 'Völlig in Ordnung. Deine Karte bleibt in diesem Browser gespeichert, und die Auswertung unten ist gratis und vollständig — nichts darin ist abgedeckt.'
      },
      yearCta: 'Jahresplan nehmen',
      backToPlan: 'Zurück zum Monatsplan',
      readFree: 'Gratis-Auswertung öffnen'
    },

    moonPhase: ['Neumond', 'Zunehmende Sichel', 'Erstes Viertel', 'Zunehmender Mond',
                'Vollmond', 'Abnehmender Mond', 'Letztes Viertel', 'Abnehmende Sichel'],

    signs: ['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
            'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'],
    signsIn: ['im Widder', 'im Stier', 'in den Zwillingen', 'im Krebs', 'im Löwen', 'in der Jungfrau',
              'in der Waage', 'im Skorpion', 'im Schützen', 'im Steinbock',
              'im Wassermann', 'in den Fischen'],
    elements: { fire: 'Feuer', earth: 'Erde', air: 'Luft', water: 'Wasser' },

    sun: [
      'Du gehst zuerst los und fragst danach. Deine Stärke ist der Anfang, nicht das Durchhalten.',
      'Du hasst es, wenn man dein Tempo antreibt. Langsam, aber bis ganz zum Ende.',
      'Du denkst schneller, als du sprichst, deshalb endet ein Satz selten dort, wo er anfing.',
      'Du liest die Stimmung im Raum vor allen anderen. Daher die Müdigkeit ohne Grund.',
      'Du brauchst Publikum, nicht aus Eitelkeit, sondern damit etwas zählt.',
      'Du siehst das Detail, das das Ganze ruiniert. Der Preis: nichts fühlt sich fertig an.',
      'Du stellst die Bequemlichkeit aller anderen über deine und nennst es Frieden.',
      'Du machst nichts halb. Ganz rein oder gar nicht — Gehen eingeschlossen.',
      'Deine Antwort auf Schwierigkeit ist Bewegung, nicht Gespräch. Manchmal ist es Flucht.',
      'Du baust das Ganze bei null auf, wenn man dir zehn Jahre dafür lässt.',
      'Du hältst Abstand aus Instinkt, nicht aus Kälte.',
      'Du saugst die Gefühle anderer auf und verpasst den Moment, in dem sie aufhörten, deine zu sein.'
    ],
    moon: [
      'Deine Gefühle sind kurz und heiß. Es knallt, dann ist es klar.',
      'Dich beruhigt jedes Mal dasselbe: Essen, eine Decke, ein vertrauter Raum.',
      'Du redest, um ein Gefühl zu verdauen. Stille macht dich unruhig.',
      'Du erinnerst dich an jede Kränkung, bis auf den Satz genau.',
      'Du brauchst jemanden, der merkt, dass es dir schlechter geht.',
      'Statt zu weinen, räumst du auf. Der Körper als Weg durch die Angst.',
      'Du kannst vor niemandem wütend sein. Das wartet, bis du allein bist.',
      'Du misstraust der Ruhe. Du suchst, wo der Haken ist.',
      'Du behandelst Traurigkeit, indem du eine Reise planst, auch eine, die nie stattfindet.',
      'Um Hilfe zu bitten ist dir peinlich. Lieber machst du die dreifache Arbeit.',
      'Du analysierst ein Gefühl, statt es zu fühlen. Wirksam, bis zu einem Punkt.',
      'Zwischen deiner Stimmung und der eines anderen gibt es keine Grenze.'
    ],
    asc: [
      'Man sieht jemanden, der gleich etwas entscheidet. Auch mitten im Zögern.',
      'Du wirkst ruhig und teuer. Das kommt als Erstes an.',
      'Du wirkst leicht und verfügbar — deshalb vertrauen sich dir Fremde an.',
      'Du siehst aus wie jemand, der sich darum kümmert. Man fragt dich zuerst.',
      'Du kommst rein und die Temperatur im Raum verschiebt sich. Das lässt sich nicht abschalten.',
      'Du wirkst kompetent, also bleibt die Arbeit anderer bei dir hängen.',
      'Man geht davon aus, dass du zustimmst. Meistens zu Recht.',
      'Du scheinst mehr zu wissen, als du sagst. Das kann einschüchtern.',
      'Du siehst aus wie jemand, der gleich geht. Auch wenn du bleibst.',
      'Du wirkst älter und ernster, als du bist. Das war immer so.',
      'Man sieht jemanden für sich. Sympathisch, aber nicht ganz da.',
      'Dein Gesicht wird als Einladung gelesen. Oft zu Unrecht.'
    ]
  };

  /* Цена, условия списания и согласие с документами остаются английскими
     намеренно: это не текст интерфейса, а обязательства перед человеком,
     и машинный перевод суммы, срока отмены или ссылки на условия — это то,
     что разбирают в спорах по автопродлению. Их пишет юрист под каждый
     рынок, вместе с валютой. */
  C.billing = EN.billing;
  C.paywall.legal = EN.paywall.legal;
  C.paywall.terms = EN.paywall.terms;
  C.paywall.privacy = EN.paywall.privacy;
  C.paywall.privacyInline = EN.paywall.privacyInline;
  C.recovery.yearTitle = EN.recovery.yearTitle;
  C.recovery.answers.price = EN.recovery.answers.price;

  global.COPY_ALL.de = C;
  if (global.LANG === 'de') { global.COPY = C; }
})(typeof window !== 'undefined' ? window : globalThis);
