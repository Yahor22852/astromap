/* Italiano — тексты разбора. Структура повторяет английский объект в
   js/reading-copy.js ключ в ключ. */
(function (global) {
  'use strict';

  if (!global.READING_ALL) { return; }

  var R = {
    ui: {
      title: 'La tua mappa',
      forWhom: 'Lettura per {date}, {city}',
      secPositions: 'Le tue tre posizioni',
      secThemes: 'Le tue sezioni',
      secWeek: 'Questa settimana',
      secPair: 'Compatibilità',
      sun: 'Sole', moon: 'Luna', asc: 'Ascendente',
      noAsc: 'Ascendente non calcolato: non è stata indicata l’ora di nascita.',
      weekRange: 'Settimana dal {from} al {to}',
      weekMoon: 'La Luna della settimana',
      weekSun: 'Il Sole rispetto alla tua posizione',
      recalc: 'Questo capitolo si ricalcola ogni settimana sulle posizioni del momento.',
      pairScore: 'Indice di compatibilità',
      pairStrongest: 'L’aspetto più forte fra voi',
      pairFoot: 'Un indice su scala da 38 a 96 dagli aspetti di Sole e Luna fra voi. Metodo astrologico, non una previsione.',
      noPair: 'Non hai aggiunto una seconda persona. Torna al modulo per calcolare la compatibilità.',
      empty: 'In questo browser non c’è nessuna mappa salvata. Compila di nuovo il modulo.',
      back: 'Torna al modulo',
      goTitle: 'Questa è la fotografia di un giorno',
      goText: 'Sopra ci sono la tua carta di nascita e il cielo di questa settimana. La carta non cambierà; il cielo sopra di essa cambia ogni giorno. In AstroMap quelle stesse posizioni si ricalcolano per qualsiasi data scegli: transiti con le loro finestre e le date di picco, la Luna, i retrogradi, la tua linea del tempo e la ruota completa con le case.',
      goCta: 'Apri AstroMap',
      disclaimer: 'Il contenuto ha finalità di intrattenimento e non sostituisce il parere di un professionista.'
    },

    sun: [
      'Il tuo Sole funziona come un motore che parte: la decisione arriva prima che tu l’abbia pensata fino in fondo. Cominci bene e soffri la fase in cui resta solo da resistere. La forza è nella prima mossa, non nella decima settimana.',
      'Il tuo Sole non accetta il tempo di nessun altro. Ti serve tempo per decidere e poi non ci torni sopra — per questo vinci dove altri mollano dopo un mese. Il prezzo: resti dentro cose finite da un pezzo.',
      'Il tuo Sole pensa più veloce di quanto parli, così una frase finisce di rado dove è iniziata. Lo stimolo nuovo è ossigeno, e la noia pesa più della stanchezza.',
      'Il tuo Sole legge l’umore di una stanza dalla porta e se lo porta addosso. Da lì la stanchezza senza una causa chiara. La vicinanza per te è una condizione per lavorare, non un premio.',
      'Il tuo Sole ha bisogno di pubblico, ma non per vanità: ti serve che quello che fai abbia un testimone e un senso. Senza, anche il lavoro buono suona vuoto.',
      'Il tuo Sole vede il dettaglio che rovina l’insieme e non riesce più a non vederlo. Per questo dichiari di rado una cosa finita, e ancora più di rado abbastanza buona.',
      'Il tuo Sole conta la comodità di tutti gli altri prima della propria. La chiami pace, ma più spesso è una tua decisione rimandata.',
      'Il tuo Sole non fa niente a metà. Entri fino in fondo o non entri — andarsene compreso. Ti dà una profondità che altri non hanno, e un prezzo che paghi da solo.',
      'Il tuo Sole risponde alla difficoltà con il movimento: un viaggio, un piano, un’altra direzione. A volte è coraggio, a volte è fuga, e la differenza si vede solo dopo.',
      'Il tuo Sole costruisce piano e alle proprie condizioni. In dieci anni farai quello che altri rimandano per tutta la vita, ma tratti il riposo come qualcosa da meritare.',
      'Il tuo Sole tiene le distanze per istinto, non per freddezza. Ti serve uno spazio dove nessuno ti sistemi, e solo da lì ti avvicini.',
      'Il tuo Sole assorbe le emozioni intorno con tanta precisione che è facile perdere il momento in cui hanno smesso di essere tue. Da lì il bisogno di silenzio dopo le persone.'
    ],

    moon: [
      'La tua Luna reagisce all’istante: esplode, e subito dopo è chiaro. Non tieni a lungo la rabbia e questo ti protegge. Il problema comincia quando l’altro ha bisogno di calma e non di parole.',
      'La tua Luna si calma attraverso il corpo: cibo, una coperta, un posto conosciuto, lo stesso rituale. Un cambiamento senza preavviso ti costa più di quanto ammetti.',
      'La tua Luna digerisce l’emozione parlandola. Finché non l’hai raccontata, non sai bene cosa senti. Il silenzio dentro una relazione ti suona come un allarme.',
      'La tua Luna ricorda una ferita fino alla frase e al tono. Perdoni ma non cancelli — per questo vecchie conversazioni tornano dentro discussioni nuove.',
      'La tua Luna ha bisogno che qualcuno noti che per te è peggiorata. Di rado lo chiedi apertamente; più spesso lo mostri e aspetti la domanda.',
      'La tua Luna mette in ordine invece di piangere. Pulire, liste, un piano. Funziona sul momento e archivia l’emozione per dopo, di solito nel peggiore momento possibile.',
      'La tua Luna non sa arrabbiarsi davanti alla gente. Tieni la rabbia per quando sei solo, e lì diventa rimuginare invece che conversazione.',
      'La tua Luna diffida della calma. Anche in una settimana buona cerchi la fregatura, perché così il momento in cui qualcosa si rompe davvero pesa meno.',
      'La tua Luna cura la tristezza pianificando: un viaggio, un corso, una direzione. Anche se non parti mai, il piano già abbassa la pressione.',
      'La tua Luna si vergogna di chiedere aiuto. Preferisci fare il triplo del lavoro piuttosto che dire che non ce la fai — e poi ce l’hai con tutti insieme.',
      'La tua Luna analizza un’emozione invece di sentirla. Efficace fino al momento in cui l’emozione arriva lo stesso, più tardi e più forte.',
      'La tua Luna non ha confine fra il tuo umore e quello di un altro. Per questo dopo una giornata fra le persone ti serve silenzio, non un altro appuntamento.'
    ],

    asc: [
      'Si vede qualcuno sul punto di decidere, anche a metà dell’esitazione. La responsabilità ti raggiunge prima che tu la chieda.',
      'Dai un’impressione di calma e di cosa costosa. Apre porte, e fa anche sì che nessuno chieda se ti serve aiuto.',
      'Sembri leggero e disponibile, così uno sconosciuto si confida in dieci minuti. A volte esci da quelle conversazioni più stanco di lui.',
      'Sembri uno che se ne occuperà, così lo chiedono prima a te. Dire di no ti costa più del compito stesso.',
      'Entri e la temperatura della stanza si sposta. Non si spegne, nemmeno il giorno in cui vorresti passare inosservato.',
      'Sembri competente, così finisci per reggere il lavoro degli altri. E di solito lo consegni, il che chiude il cerchio per bene.',
      'Danno per scontato che sarai d’accordo, e di solito hanno ragione. La tua educazione viene letta come assenza di opinione, e non lo è.',
      'Sembri sapere più di quello che dici. Qualcuno lo trova intimidatorio; gli altri ci vedono un motivo per fidarsi.',
      'Sembri uno sul punto di andarsene, anche quando resti. Per questo ti chiedono dei tuoi piani più spesso di come stai.',
      'Ti leggono più grande e più serio di quanto sei. Al lavoro aiuta, e rende più difficile la leggerezza.',
      'Vedono qualcuno a parte: simpatico, ma non del tutto presente. Avvicinarsi richiede iniziativa dall’altra parte.',
      'La tua faccia viene letta come un invito, anche quando non lo è. Da lì i malintesi dell’inizio.'
    ],

    themes: {
      love: {
        t: 'Amore e relazioni',
        fire: 'In amore ti servono ritmo e onestà diretta. La prudenza ti annoia, e proprio la prudenza è quello che salva le relazioni in cui entrambi vanno veloci.',
        earth: 'In amore conti la ripetizione, non le dichiarazioni. La fiducia ti prende mesi da costruire e altrettanti da ricostruire dopo una delusione.',
        air: 'In amore ti serve la conversazione più dei gesti. Il silenzio ti suona come un allarme, mentre per l’altro spesso significa solo calma.',
        water: 'In amore senti l’altro prima che si capisca da solo. Tieni d’occhio il punto in cui prendersi cura inizia a sostituire lo stare insieme.'
      },
      money: {
        t: 'Lavoro e denaro',
        fire: 'Al lavoro sei migliore all’inizio: un progetto nuovo, una crisi, una scadenza. La routine ti brucia più in fretta del sovraccarico.',
        earth: 'Al lavoro il tuo vantaggio è la resistenza. Vinci sugli anni, ma devi imparare a dire il tuo prezzo prima che lo dica qualcun altro.',
        air: 'Al lavoro guadagni con i contatti e la velocità di apprendimento. Il rischio principale: dieci direzioni aperte e nessuna chiusa.',
        water: 'Al lavoro ti guida il senso, non un foglio di calcolo. Leggi bene le persone, quindi le trattative vanno meglio di quanto pensi — a patto di non cedere per primo.'
      },
      calm: {
        t: 'Riposo e sonno',
        fire: 'Ti rimette in sesto il movimento, non lo stare sdraiato. Allenarsi, la strada e la stanchezza fisica fanno per il tuo sonno più di una serata libera.',
        earth: 'Ti rimettono in sesto il ritmo e l’ambiente familiare. Il tuo sonno si rompe sul caos nel programma, non sulla quantità di lavoro.',
        air: 'Ti rimette in sesto zittire la testa, non il corpo. Senza tagliare gli stimoli resti lì, stanco, a pensare.',
        water: 'Ti rimettono in sesto la solitudine dopo le persone e l’acqua: un bagno, una piscina, una passeggiata lungo un fiume. Senza, porti addosso emozioni altrui tutta la settimana.'
      },
      self: {
        t: 'Io e i miei limiti',
        fire: 'Il tuo limite si rompe dove confondi la velocità con l’accordo. Prima di dire di sì, datti un giorno.',
        earth: 'Il tuo limite si rompe dove resti troppo a lungo per non ricominciare da capo. Restare può costare più che cambiare.',
        air: 'Il tuo limite si rompe dove ti spieghi più a lungo di quanto la questione sia durata. Di solito basta una frase più corta.',
        water: 'Il tuo limite si rompe dove prendi l’emozione di un altro come un compito tuo. La compassione non ti obbliga a ripararla.'
      }
    },

    transitMoon: [
      'La Luna in Ariete accelera le reazioni. Settimana buona per cominciare, pessima per mandare messaggi a caldo.',
      'La Luna in Toro rallenta il ritmo. Il corpo chiede regolarità: dormire, mangiare e una sera tranquilla battono qualsiasi piano.',
      'La Luna in Gemelli ti inonda di stimoli. Parlare viene facile, concentrarsi no: tieni i compiti corti.',
      'La Luna in Cancro alza la sensibilità. Le conversazioni sulle cose vicine vengono più facili del solito.',
      'La Luna in Leone vuole pubblico. Buon momento per mostrare un lavoro finito, pessimo per litigare sull’attenzione.',
      'La Luna in Vergine mette in ordine. Settimana buona per chiudere le cose in sospeso, pessima per giudicarti.',
      'La Luna in Bilancia cerca equilibrio. Riconciliarsi viene più facile, decidere con chiarezza più difficile.',
      'La Luna in Scorpione rende tutto più profondo. Conversazioni vere sì, messaggi impulsivi no.',
      'La Luna in Sagittario apre l’orizzonte. Pianificare un viaggio o un corso fa per il tuo umore più del riposo a casa.',
      'La Luna in Capricorno raffredda le emozioni. Buon momento per le pratiche, debole per parlare di sentimenti.',
      'La Luna in Acquario regala distanza. Vedrai la tua situazione da fuori — usalo per decidere.',
      'La Luna in Pesci sfuma i contorni. Riposo e sonno contano più della produttività.'
    ],

    transitAspect: {
      conjunction: 'Il Sole torna alla tua posizione di nascita. È una settimana per cominciare, non per fare bilanci.',
      semisquare: 'Piccolo attrito fra quello che vuoi e quello che la settimana chiede. Niente di grande, ma logora.',
      sextile: 'Angolo favorevole: le cose vengono più facili se fai tu la prima mossa. Da sole non succedono.',
      square: 'Tensione fra i tuoi piani e le circostanze. Settimana per correggere la rotta, non per forzarla.',
      trine: 'La configurazione più comoda del ciclo. Spendila su quello che rimandi da mesi.',
      quincunx: 'Qualcosa non torna ed è difficile dargli un nome. Buon momento per sistemare le cose piccole.',
      opposition: 'Opposizione piena: vedi la tua situazione dall’altra parte. Il confronto può servire senza diventare una lite.'
    },

    pairAspect: {
      conjunction: 'Le vostre luci stanno nello stesso punto: vi capite senza spiegarvi e ripetete gli stessi errori.',
      semisquare: 'Attrito piccolo e ricorrente. Non rompe la relazione, ma torna nelle stesse situazioni.',
      sextile: 'Una facilità che chiede iniziativa. Questa coppia funziona finché qualcuno propone per primo.',
      square: 'La configurazione più dura e quella che fa crescere di più. Attrae e insegna, e costa.',
      trine: 'Corrispondenza naturale di ritmo. Un solo rischio: con tanta facilità, nessuno lavora sulla relazione.',
      quincunx: 'Bisogno costante di aggiustare il tiro. Funziona per le coppie a cui piace parlare di quello che c’è fra loro.',
      opposition: 'Estremi opposti dello stesso asse. Attrazione forte e una trattativa permanente.'
    }
  };

  global.READING_ALL.it = R;
  if (global.LANG === 'it') { global.READING = R; }
})(typeof window !== 'undefined' ? window : globalThis);
