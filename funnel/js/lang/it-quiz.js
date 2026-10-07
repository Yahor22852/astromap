/* Italiano — testi del quiz v2. Stessa struttura dell'oggetto inglese in
   js/quiz-copy.js. Si usa il tu; il genere di chi legge non è espresso. */
(function (global) {
  'use strict';
  if (!global.QUIZ_ALL) { return; }

  var Q = {
    phases: ['Il tuo focus', 'Dati di nascita', 'Anteprima'],
    back: 'Indietro',
    cont: 'Continua',
    paidNote: 'AstroMap è un’app in abbonamento. Queste domande sono gratuite: dalle risposte nasce un’anteprima della tua carta.',

    goal: {
      title: 'Cosa vorresti capire meglio adesso?',
      sub: 'Costruiamo la tua carta e ti mostriamo da dove iniziare.',
      note: 'Puoi cambiarlo più tardi.',
      opts: {
        love:  ['Relazioni', 'Bisogni, legame, differenze'],
        money: ['Lavoro e denaro', 'Punti di forza e periodo attuale'],
        calm:  ['Recupero', 'Riposo, ritmo, cicli lunari'],
        self:  ['Me e i miei confini', 'Reazioni e bisogni']
      }
    },

    ctx: {
      title: {
        love: 'Cosa esattamente nelle relazioni?',
        money: 'Cosa esattamente in lavoro e denaro?',
        calm: 'Cosa esattamente nel recupero?',
        self: 'Cosa esattamente su di te?'
      },
      sub: 'Da questo dipende cosa mostra per primo l’anteprima.',
      opts: {
        love:  { needs: 'Capire i miei bisogni', connection: 'Guardare un legame preciso', differences: 'Capire meglio le differenze' },
        money: { strengths: 'Capire i miei punti di forza', period: 'Esplorare il periodo attuale', overview: 'Iniziare da una panoramica della carta' },
        calm:  { cycles: 'Conoscere i cicli lunari', skynow: 'Iniziare dal cielo di oggi', needs: 'Capire meglio i miei bisogni' },
        self:  { reaction: 'Capire come reagisco', needs: 'Esplorare i miei bisogni', overview: 'Iniziare da una panoramica della carta' }
      },
      unsure: 'Non lo so ancora'
    },

    dob: {
      title: 'La tua data di nascita',
      sub: 'Dalla data iniziamo a calcolare la tua carta.',
      day: 'Giorno', month: 'Mese', year: 'Anno',
      pick: 'Gira ogni rotella fino alla tua data.',
      confirm: 'Conferma la data',
      clamped: 'Giorno cambiato in {d}: questo mese ha {n} giorni.',
      future: 'Questa data non è ancora arrivata.'
    },

    sun: {
      eyebrow: 'Primo punto della tua carta',
      part: 'Un punto tra tanti. Non è una descrizione completa di una persona.',
      cta: 'Aggiungi i dettagli della carta'
    },

    tk: {
      title: 'Conosci l’ora di nascita?',
      sub: 'L’ora permette di calcolare l’ascendente e le case. Puoi continuare anche senza.',
      yes: 'Conosco l’ora esatta',
      yesD: 'Per esempio, dal certificato di nascita',
      no: 'Non la so',
      noD: 'Calcoliamo ciò che data e luogo permettono'
    },

    time: {
      title: 'La tua ora di nascita',
      sub: 'Ora locale nel luogo di nascita.',
      hour: 'Ora', minute: 'Minuto', ampm: 'AM / PM',
      pick: 'Gira le rotelle fino alla tua ora.',
      confirm: 'Conferma l’ora',
      unknown: 'Non so l’ora'
    },

    place: {
      title: 'Il tuo luogo di nascita',
      sub: 'Il luogo dà il fuso orario alla tua data di nascita e, insieme all’ora, l’ascendente.',
      label: 'Città o paese di nascita',
      placeholder: 'Inizia a scrivere una città…',
      noMatch: 'Nessun risultato. Prova un’altra grafia, il nome locale o la città grande più vicina.',
      selected: 'Luogo di nascita',
      change: 'Cambia',
      confirm: 'Conferma il luogo',
      notFound: 'Il mio luogo non è nell’elenco',
      nfTitle: 'Scegli la città grande più vicina',
      nfText: 'Nello stesso fuso orario. Usiamo il suo fuso per la tua data, ma non mostriamo l’ascendente né le case: servono il luogo esatto.',
      nfName: 'Il tuo luogo (facoltativo, solo da mostrare)',
      nfBack: 'Torna alla ricerca',
      approx: 'approssimativo: fuso orario di {c}'
    },

    core: {
      title: 'La base della tua carta',
      sub: 'Sole, Luna e ascendente: tre punti da cui parte ogni carta.',
      lead: 'Mostrato per primo per la tua risposta. È un punto di partenza, non una conclusione tratta dalla tua carta.',
      moonRange: 'Senza l’ora, quel giorno la Luna era in uno di due segni: {a} o {b}. Ha cambiato segno durante il giorno.',
      sunRange: 'Senza l’ora, quel giorno il Sole era in uno di due segni: {a} o {b}.',
      noAscTime: 'Serve l’ora di nascita',
      noAscPlace: 'Serve il luogo esatto'
    },

    extra: {
      title: 'Cos’altro includere nella tua panoramica?',
      sub: 'Facoltativo. Da questo dipende l’ordine delle sezioni nell’app.',
      only: 'Per ora solo: {goal}'
    },

    start: {
      title: 'Da dove preferisci iniziare?',
      sub: 'L’app si aprirà qui dopo l’abbonamento. La tua carta natale non cambia, e puoi tornare al cielo di oggi e a qualsiasi data scelta.',
      opts: {
        chart: ['Dalla carta natale', 'Pianeti, case, aspetti'],
        sky:   ['Dal cielo di oggi', 'Cosa è attivo ora per la tua carta'],
        dates: ['Dalle prossime date', 'Fasi lunari, svolte, aspetti esatti']
      }
    },

    pask: {
      title: 'Aggiungere la data di nascita della persona a cui pensi?',
      sub: 'Solo la data. Niente nome, contatti o dettagli sulla relazione.',
      add: 'Aggiungi la sua data',
      skip: 'Continua senza'
    },

    pdate: {
      title: 'La sua data di nascita',
      sub: 'Senza la sua ora di nascita, la sua Luna è approssimativa.',
      confirm: 'Conferma la data'
    },

    load: {
      busy: 'Preparo la tua anteprima…',
      fail: 'L’anteprima non si è caricata. Le risposte sono salvate.',
      retry: 'Riprova',
      skip: 'Continua senza anteprima'
    },

    prev: {
      title: {
        love: 'La tua carta con focus sulle relazioni',
        money: 'La tua carta con focus su lavoro e denaro',
        calm: 'La tua carta con focus sul recupero',
        self: 'La tua carta con focus su di te e i tuoi confini'
      },
      frag: '{theme} · elemento del Sole: {element}',
      fragSrc: 'Interpretazione secondo l’elemento del tuo Sole, dalla libreria di testi di AstroMap.',
      plainTitle: 'Oggi, in parole semplici',
      plainNone: 'Oggi non ci sono aspetti esatti alla tua carta. Il segnale più veloce è la Luna: cambia segno ogni due o tre giorni.',
      details: 'Dettagli',
      tabsLead: 'Lo stesso calcolo dell’app. Tocca le schede.',
      noon: 'Ora di nascita sconosciuta: i punti sono mostrati per le 12:00, quindi la Luna è approssimativa.',
      asp: {
        conjunction: 'Il punto del cielo è sopra un punto della tua carta: il suo tema è accentuato.',
        sextile: 'Un legame facile che funziona quando lo usi.',
        square: 'Tensione tra i due punti: un attrito che chiede una decisione.',
        trine: 'Un legame fluido e naturale tra i due punti.',
        opposition: 'I due punti tirano in direzioni opposte: il compito è l’equilibrio.'
      },
      pairTitle: 'Il tuo Sole e il suo Sole',
      pair: {
        same: 'Stesso elemento ({e}): un ritmo e un modo di reagire simili.',
        fit: 'Elementi che di solito si sostengono: {a} e {b}.',
        diff: 'Elementi diversi: {a} e {b}. Un ritmo diverso, quindi aiuta dire le cose ad alta voce.'
      },
      pairNote: 'Indice del metodo: {n} su una scala 38–96. Un metodo astrologico, non una previsione sulla relazione.'
    },

    bridge: {
      title: 'La carta natale resta. Il cielo si muove.',
      sub: 'Per questo AstroMap è un abbonamento: il calcolo per la tua carta cambia ogni giorno.',
      today: 'Oggi',
      next: 'In arrivo',
      moon: 'Luna: {phase} · {s}',
      moonNext: 'La Luna cambia segno: {s}',
      tight: 'Aspetti esatti alla tua carta: {n}',
      retro: 'Retrogradi ora: {list}',
      first: 'Primo passo consigliato nell’app',
      act: {
        chart: 'Apri la tua carta natale',
        today: 'Guarda il cielo di oggi per la tua carta',
        match: 'Apri la compatibilità',
        moon: 'Apri il calendario lunare'
      },
      appTitle: 'Nell’app puoi',
      app: [
        'Vedere quali transiti sono attivi ora per la tua carta',
        'Ricalcolare tutto per qualsiasi data',
        'Seguire le fasi lunari con un mese di anticipo',
        'Salvare date nella tua linea del tempo'
      ]
    },

    pay: {
      features: 'Per il tuo focus',
      cta: 'Ottieni la tua carta completa',
      key: 'Dopo il pagamento crei qui una password: è il tuo accesso da qualsiasi dispositivo.',
      seeYear: 'Vedi il piano annuale',
      backPrev: 'Torna all’anteprima'
    },

    year: {
      title: 'Piano annuale',
      sub: 'La stessa app, pagata una volta all’anno.',
      renew: 'all\u2019anno, si rinnova automaticamente',
      equiv: 'Circa $2.50 al mese, addebitati come $29.99 una volta all’anno più IVA.',
      cta: 'Ottieni la tua carta completa',
      back: 'Torna al piano mensile',
      backPrev: 'Torna all’anteprima'
    }
  };

  global.QUIZ_ALL.it = Q;
  if (global.LANG === 'it') { global.QUIZ = Q; }
})(typeof window !== 'undefined' ? window : globalThis);
