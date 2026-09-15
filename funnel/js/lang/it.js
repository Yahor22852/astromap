/* Italiano — строки интерфейса воронки.
   Структура повторяет английский объект в js/copy.js ключ в ключ.
   Биллинг и юридические строки сюда не переводятся — см. ниже. */
(function (global) {
  'use strict';

  var EN = global.COPY_ALL && global.COPY_ALL.en;
  if (!EN) { return; }

  var C = {
    brand: 'AstroMap App',
    progress: 'La tua mappa',            /* ≤ 14 знаков */
    ctaNext: 'Continua',
    ctaCalc: 'Calcola la mia mappa',
    ctaSummary: 'Vedi il riepilogo',
    notNow: 'Non ora',
    computing: 'Sto calcolando le posizioni del momento in cui sei nato…',

    months: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu',
             'lug', 'ago', 'set', 'ott', 'nov', 'dic'],

    a11y: {
      progress: 'Avanzamento della costruzione della mappa',
      themes: 'Sezioni da scegliere',
      reasons: 'Perché non hai ancora acquistato'
    },

    pv: {
      title: 'La tua mappa dentro AstroMap',
      sub: 'La stessa mappa, calcolata con lo stesso codice dell’app. Tocca per guardarti intorno.',
      tabs: { today: 'Oggi', chart: 'Carta', retro: 'Retrogradi' },
      points: {
        Sun: 'Sole', Moon: 'Luna', Mercury: 'Mercurio', Venus: 'Venere', Mars: 'Marte',
        Jupiter: 'Giove', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Nettuno', Pluto: 'Plutone',
        Node: 'Nodo lunare', ASC: 'Ascendente', MC: 'MC'
      },
      codes: {
        Sun: 'So', Moon: 'Lu', Mercury: 'Me', Venus: 'Ve', Mars: 'Ma',
        Jupiter: 'Gi', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
        ASC: 'AC', MC: 'MC'
      },
      aspects: {
        conjunction: 'congiunzione', sextile: 'sestile',
        square: 'quadrato', trine: 'trigono', opposition: 'opposizione'
      },
      tone: { soft: 'facile', hard: 'difficile', neutral: 'neutro' },
      fromSky: 'cielo adesso', toChart: 'la tua mappa',
      moonNow: 'La Luna in questo momento',
      illum: 'Illuminazione',
      moonShift: 'Cambia segno',
      today: 'oggi', tomorrow: 'domani', inDays: 'tra {n} giorni',
      orb: 'orbita',
      activeNow: 'Aspetti stretti in questo momento: {n}',
      lockTransits: 'Gli altri {n}, con le date esatte di picco, sono nell’app.',
      planets: 'Punti della tua carta', aspectsN: 'Aspetti della tua carta', housesN: 'Case',
      noHouses: 'manca l’ora di nascita',
      lockChart: 'La lista degli aspetti, le case e qualsiasi data tu scelga sono nell’app.',
      retroTitle: 'Retrogradi in questo momento: {n}',
      retroNow: 'va all’indietro',
      inSign: 'in {s}',
      noRetro: 'In questo momento nessun pianeta è retrogrado.',
      lockRetro: 'Le date di stazionamento, i periodi d’ombra e la casa toccata sono nell’app.'
    },

    map: {
      sun: 'Sole', moon: 'Luna', asc: 'Ascendente',
      sunShort: 'So', moonShort: 'Lu', ascShort: 'AC',
      waitDate: 'in attesa della data',
      waitTime: 'in attesa di ora e luogo',
      noAsc: 'serve l’ora di nascita',
      firstPoint: 'Il primo punto della tua mappa. Gli altri due arrivano appena aggiungi ora e luogo.'
    },

    s1: {
      eyebrow: 'Si parte da una data',
      title: 'Quando sei nato?',
      day: 'Giorno', month: 'Mese', year: 'Anno',
      resultLabel: 'Il tuo Sole',
      elementLabel: 'Elemento'
    },

    s2: {
      eyebrow: 'Scegline 2 o 3',
      title: 'Cosa entra nella tua mappa?',
      hint: 'Queste sezioni compariranno nella tua lettura.',
      themes: [
        { k: 'love',  t: 'Amore e relazioni',   d: 'Chi ti si addice, e perché' },
        { k: 'money', t: 'Lavoro e denaro',     d: 'Dove ti porta la spinta naturale' },
        { k: 'calm',  t: 'Riposo e sonno',      d: 'Cosa ti rimette davvero in sesto' },
        { k: 'self',  t: 'Io e i miei limiti',  d: 'Dove dai via troppo' }
      ]
    },

    s3: {
      eyebrow: 'Il passaggio che conta',
      title: 'Ora e luogo di nascita',
      hint: 'Senza l’ora non c’è Ascendente — e l’Ascendente è la prima impressione che fai.',
      hour: 'Ora', minute: 'Minuto', city: 'Città',
      cityPlaceholder: 'Scrivi il nome della città…',
      cityNoMatch: 'Nessuna città trovata',
      cityManual: 'Non trovo la mia città',
      cityManualName: 'Nome del luogo',
      cityManualOffset: 'Fuso orario (UTC)',
      cityManualApply: 'Usa questo',
      cityManualNote: 'Senza coordinate posso calcolare Sole e Luna, ma non l’Ascendente — serve un luogo preciso, e non lo tiro a indovinare.',
      unknown: 'Non so l’ora',
      unknownNote: 'Calcolo Sole e Luna. L’Ascendente resta vuoto finché non trovi l’ora sul certificato di nascita.',
      moonLabel: 'Luna',
      ascLabel: 'Ascendente',
      ascEmptyShort: 'manca l’ora',
      ascEmptyPlace: 'serve un luogo preciso',
      stageTz: 'Individuo il cielo della tua nascita',
      stageSun: 'Calcolo il Sole',
      stageMoon: 'Calcolo la Luna',
      stageAsc: 'Cerco il tuo Ascendente',
      stageDone: 'Monto la tua mappa',
      big3Lead: 'I tre punti da cui comincia ogni carta. Insieme, non separati.',
      roleSun: 'chi sei nel nucleo',
      roleMoon: 'come senti e cosa ti serve',
      roleAsc: 'come la tua carta incontra il mondo',
      cuspNote: 'Il tuo luminare sta esattamente sul confine di un segno — a questa posizione il minuto esatto conta.'
    },

    s4: {
      eyebrow: 'Ultima domanda',
      title: 'Guardiamo una relazione',
      hint: 'La data di nascita della persona a cui stai pensando. Senza l’ora calcolo a mezzogiorno, quindi la sua Luna può essere approssimativa.',
      skip: 'Salta questo passaggio',
      scoreLabel: 'Indice di compatibilità',
      scoleFoot: 'Un indice su scala da 38 a 96, costruito sugli aspetti di Sole e Luna fra voi. Metodo astrologico, non una previsione.',
      bands: [
        { min: 0,  t: 'Lavoro duro nel tempo',    d: 'L’attrazione c’è, ma la vita di tutti i giorni vi costerà più di quanto pensiate.' },
        { min: 55, t: 'Funziona se ne parlate',   d: 'Qui niente è automatico. La possibilità è reale se vi dite le cose in chiaro.' },
        { min: 70, t: 'Una coppia solida',        d: 'Le vostre Lune tengono lo stesso ritmo. È quella che da fuori chiamano tranquilla.' },
        { min: 84, t: 'Un legame raro',           d: 'Un aspetto così esatto è poco comune. Il resto è solo quello che ne fate.' }
      ]
    },

    s5: {
      eyebrow: 'Mappa montata',
      title: 'La tua mappa è pronta',
      coreTitle: 'Il tuo nucleo',
      focusTitle: 'Il tuo focus',
      skyTitle: 'Il cielo sopra la tua mappa in questo momento',
      pairTitle: 'Relazione',
      closeNow: 'Aspetti stretti',
      retroNow: 'Retrogradi',
      skyNote: 'Questo è calcolato per adesso, e domani è diverso — la carta di nascita resta, il cielo sopra si muove.',
      cta: 'Entra nella tua mappa',
      ready: 'Qui sotto la stessa mappa dentro l’app — tocca per guardarti intorno.'
    },

    pw: {
      focusLine: 'Il tuo focus — {areas} — viaggia con la mappa: nell’app decide cosa vedi per primo.',
      opensTitle: 'Cosa si apre',
      opens: [
        { t: 'La tua carta di nascita. ', d: 'La ruota, i pianeti, le case, gli aspetti e l’equilibrio degli elementi — con il cielo di un giorno qualsiasi in un secondo anello.' },
        { t: 'Il cielo contro la tua carta. ', d: 'Cosa è attivo adesso, quando è iniziato e quando svanisce, con i picchi al minuto.' },
        { t: 'La Luna. ', d: 'Fase, illuminazione, segno, prossime Luna nuova e piena, un mese in anticipo.' },
        { t: 'I retrogradi. ', d: 'Chi si ferma e quando, i periodi d’ombra e quale casa della tua carta toccano.' },
        { t: 'La compatibilità. ', d: 'L’indice di sinastria, i contatti più forti e la carta composita di due persone.' },
        { t: 'La tua linea del tempo. ', d: 'Cosa arriva — fasi, stazionamenti e aspetti esatti, con tutto ciò che vale salvato.' }
      ],
      movesTitle: 'Il cielo continua a muoversi',
      movesAspects: 'aspetti stretti alla tua carta oggi',
      movesMoon: 'prima che la Luna passi nel segno {s}',
      movesRetro: 'pianeti che vanno all’indietro',
      movesNote: 'Ogni sezione si ricalcola per la data che scegli. È per questo che serve l’abbonamento: la tua carta di nascita non cambia, il cielo sopra cambia ogni giorno.'
    },

    paywall: {
      eyebrow: 'AstroMap App',
      title: 'La tua mappa è pronta',
      planTitle: 'Piano mensile',
      cta: 'Sblocca la mia mappa',
      checkoutOff: 'I pagamenti non sono ancora collegati. I tuoi dati sono salvati — torna fra poco.'
    },

    recovery: {
      title: 'La tua lettura è già calcolata',
      sub: 'Qui c’è il primo paragrafo. Il resto aspetta nel tuo account.',
      surveyTitle: 'Cosa ti ha fermato?',
      survey: [
        { k: 'price', t: 'Troppo caro' },
        { k: 'trust', t: 'Non so se funziona' },
        { k: 'what',  t: 'Non è chiaro cosa ottengo' },
        { k: 'look',  t: 'Sto solo guardando' }
      ],
      answers: {
        trust: 'Ecco le tue posizioni, calcolate da data, ora e luogo che hai dato. È la stessa matematica delle effemeridi — verificale in un qualsiasi calcolatore astrologico, dovrebbero coincidere entro un decimo di grado.',
        what: 'Ottieni l’accesso all’app dove la tua carta incontra il cielo del momento. Nello specifico:',
        look: 'Va benissimo. La tua mappa resta salvata in questo browser, e la lettura qui sotto è gratuita e completa — non c’è niente di coperto.'
      },
      yearCta: 'Prendi il piano annuale',
      backToPlan: 'Torna al piano mensile',
      readFree: 'Apri la lettura gratuita'
    },

    moonPhase: ['Luna nuova', 'Falce crescente', 'Primo quarto', 'Gibbosa crescente',
                'Luna piena', 'Gibbosa calante', 'Ultimo quarto', 'Falce calante'],

    signs: ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine',
            'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'],
    signsIn: ['in Ariete', 'in Toro', 'in Gemelli', 'in Cancro', 'in Leone', 'in Vergine',
              'in Bilancia', 'in Scorpione', 'in Sagittario', 'in Capricorno',
              'in Acquario', 'in Pesci'],
    elements: { fire: 'Fuoco', earth: 'Terra', air: 'Aria', water: 'Acqua' },

    sun: [
      'Ti muovi prima e chiedi dopo. La tua forza è cominciare, non mantenere.',
      'Odi che ti mettano fretta sul ritmo. Piano, ma fino in fondo.',
      'Pensi più veloce di quanto parli, così una frase finisce di rado dove è iniziata.',
      'Leggi l’umore di una stanza prima di chiunque altro. Da lì la stanchezza senza spiegazione.',
      'Ti serve un pubblico, non per vanità ma perché una cosa conti davvero.',
      'Noti il dettaglio che rovina l’insieme. Il prezzo: niente sembra finito.',
      'Metti la comodità di tutti prima della tua e la chiami pace.',
      'Non fai niente a metà. Dentro fino in fondo, o niente — andarsene compreso.',
      'La tua risposta alla difficoltà è il movimento, non la conversazione. A volte è fuga.',
      'Ricostruiresti tutto da zero, se ti lasciassero dieci anni per farlo.',
      'Tieni le distanze per istinto, non per freddezza.',
      'Assorbi le emozioni degli altri e ti sfugge il momento in cui hanno smesso di essere tue.'
    ],
    moon: [
      'Le tue emozioni sono corte e calde. Esplode, poi è chiaro.',
      'Ti calmano sempre le stesse cose: il cibo, una coperta, una stanza familiare.',
      'Parli per digerire un’emozione. Il silenzio ti mette a disagio.',
      'Ricordi ogni torto, fino alla frase esatta.',
      'Hai bisogno che qualcuno noti che per te è peggiorata.',
      'Invece di piangere metti in ordine. Il corpo come strada attraverso la paura.',
      'Non riesci ad arrabbiarti davanti a nessuno. Aspetta che tu sia solo.',
      'Diffidi della calma. Cerchi dove sta la fregatura.',
      'Curi la tristezza pianificando un viaggio, anche uno che non farai mai.',
      'Chiedere aiuto ti imbarazza. Preferisci fare il triplo del lavoro.',
      'Analizzi un’emozione invece di sentirla. Efficace, fino a un certo punto.',
      'Fra il tuo umore e quello di un altro non c’è confine.'
    ],
    asc: [
      'Si vede qualcuno sul punto di decidere. Anche a metà dell’esitazione.',
      'Dai un’impressione di calma e di cosa costosa. È quello che arriva per primo.',
      'Sembri leggero e disponibile — per questo gli sconosciuti si confidano.',
      'Sembri uno che se ne occuperà. Lo chiedono prima a te.',
      'Entri e la temperatura della stanza si sposta. Non si spegne.',
      'Sembri competente, così finisci per reggere il lavoro degli altri.',
      'Danno per scontato che sarai d’accordo. Di solito hanno ragione.',
      'Sembri sapere più di quello che dici. Può intimidire.',
      'Sembri uno sul punto di andarsene. Anche quando resti.',
      'Ti leggono più grande e più serio di quanto sei. È sempre stato così.',
      'Vedono qualcuno a parte. Simpatico, ma non del tutto presente.',
      'Leggono la tua faccia come un invito. Spesso a torto.'
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

  global.COPY_ALL.it = C;
  if (global.LANG === 'it') { global.COPY = C; }
})(typeof window !== 'undefined' ? window : globalThis);
