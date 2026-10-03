/* Deutsch — Texte des Quiz v2. Gleiche Struktur wie das englische Objekt in
   js/quiz-copy.js. Anrede: du. */
(function (global) {
  'use strict';
  if (!global.QUIZ_ALL) { return; }

  var Q = {
    phases: ['Dein Fokus', 'Geburtsdaten', 'Vorschau'],
    back: 'Zurück',
    cont: 'Weiter',
    paidNote: 'AstroMap ist eine Abo-App. Diese Fragen sind kostenlos: Aus den Antworten entsteht eine Vorschau deiner Karte.',

    goal: {
      title: 'Was möchtest du gerade besser verstehen?',
      sub: 'Wir erstellen deine Karte und zeigen dir, wo du anfangen kannst.',
      note: 'Du kannst das später ändern.',
      opts: {
        love:  ['Beziehungen', 'Bedürfnisse, Verbindung, Unterschiede'],
        money: ['Arbeit und Geld', 'Stärken und die aktuelle Phase'],
        calm:  ['Erholung', 'Ruhe, Rhythmus, Mondzyklen'],
        self:  ['Mich und meine Grenzen', 'Reaktionen und Bedürfnisse']
      }
    },

    ctx: {
      title: {
        love: 'Was genau bei Beziehungen?',
        money: 'Was genau bei Arbeit und Geld?',
        calm: 'Was genau bei Erholung?',
        self: 'Was genau über dich?'
      },
      sub: 'Davon hängt ab, was die Vorschau zuerst zeigt.',
      opts: {
        love:  { needs: 'Meine eigenen Bedürfnisse verstehen', connection: 'Eine bestimmte Verbindung ansehen', differences: 'Unterschiede besser verstehen' },
        money: { strengths: 'Meine Stärken verstehen', period: 'Die aktuelle Phase erkunden', overview: 'Mit einem Überblick der Karte beginnen' },
        calm:  { cycles: 'Mondzyklen kennenlernen', skynow: 'Mit dem heutigen Himmel beginnen', needs: 'Meine Bedürfnisse besser verstehen' },
        self:  { reaction: 'Verstehen, wie ich reagiere', needs: 'Meine Bedürfnisse erkunden', overview: 'Mit einem Überblick der Karte beginnen' }
      },
      unsure: 'Weiß ich noch nicht'
    },

    dob: {
      title: 'Dein Geburtsdatum',
      sub: 'Mit dem Datum beginnen wir, deine Karte zu berechnen.',
      day: 'Tag', month: 'Monat', year: 'Jahr',
      decades: 'Zu einem Jahrzehnt springen',
      pick: 'Dreh jedes Rad auf dein Datum.',
      confirm: 'Datum bestätigen',
      clamped: 'Tag auf {d} geändert: Dieser Monat hat {n} Tage.',
      future: 'Dieses Datum liegt in der Zukunft.'
    },

    sun: {
      eyebrow: 'Erster Punkt deiner Karte',
      part: 'Ein Punkt von vielen. Keine vollständige Beschreibung eines Menschen.',
      cta: 'Details zur Karte hinzufügen'
    },

    tk: {
      title: 'Kennst du deine Geburtszeit?',
      sub: 'Mit der Uhrzeit lassen sich Aszendent und Häuser berechnen. Du kannst auch ohne sie weitermachen.',
      yes: 'Ich kenne die genaue Zeit',
      yesD: 'Zum Beispiel aus der Geburtsurkunde',
      no: 'Weiß ich nicht',
      noD: 'Wir berechnen, was Datum und Ort hergeben'
    },

    time: {
      title: 'Deine Geburtszeit',
      sub: 'Ortszeit am Geburtsort.',
      hour: 'Stunde', minute: 'Minute', ampm: 'AM / PM',
      pick: 'Dreh die Räder auf deine Uhrzeit.',
      confirm: 'Uhrzeit bestätigen',
      unknown: 'Ich kenne die Uhrzeit nicht'
    },

    place: {
      title: 'Dein Geburtsort',
      sub: 'Der Ort bestimmt die Zeitzone an deinem Geburtstag und zusammen mit der Uhrzeit den Aszendenten.',
      label: 'Geburtsort',
      placeholder: 'Stadt eingeben…',
      noMatch: 'Nichts gefunden. Versuch eine andere Schreibweise, den lokalen Namen oder die nächste größere Stadt.',
      selected: 'Geburtsort',
      change: 'Ändern',
      confirm: 'Ort bestätigen',
      notFound: 'Mein Ort ist nicht in der Liste',
      nfTitle: 'Wähl die nächste größere Stadt',
      nfText: 'In derselben Zeitzone. Wir nutzen ihre Zeitzone für dein Datum, zeigen aber keinen Aszendenten und keine Häuser: Dafür braucht es den genauen Ort.',
      nfName: 'Dein Ort (optional, nur zur Anzeige)',
      nfBack: 'Zurück zur Suche',
      approx: 'ungefähr: Zeitzone von {c}'
    },

    core: {
      title: 'Die Basis deiner Karte',
      sub: 'Sonne, Mond und Aszendent: drei Punkte, mit denen jede Karte beginnt.',
      lead: 'Wegen deiner Antwort zuerst gezeigt. Ein Startpunkt, keine Schlussfolgerung aus deiner Karte.',
      moonRange: 'Ohne Uhrzeit stand der Mond an diesem Tag in einem von zwei Zeichen: {a} oder {b}. Er hat im Lauf des Tages das Zeichen gewechselt.',
      sunRange: 'Ohne Uhrzeit stand die Sonne an diesem Tag in einem von zwei Zeichen: {a} oder {b}.',
      noAscTime: 'Braucht die Geburtszeit',
      noAscPlace: 'Braucht den genauen Ort'
    },

    extra: {
      title: 'Was soll dein Überblick noch enthalten?',
      sub: 'Optional. Davon hängt die Reihenfolge der Bereiche in der App ab.',
      only: 'Vorerst nur: {goal}'
    },

    start: {
      title: 'Womit möchtest du anfangen?',
      sub: 'Nach dem Abschluss öffnet sich die App hier. Deine Geburtskarte bleibt gleich, und zum heutigen Himmel und zu jedem gewählten Datum kannst du zurückkehren.',
      opts: {
        chart: ['Mit der Geburtskarte', 'Planeten, Häuser, Aspekte'],
        sky:   ['Mit dem Himmel heute', 'Was gerade für deine Karte aktiv ist'],
        dates: ['Mit den nächsten Daten', 'Mondphasen, Wendepunkte, exakte Aspekte']
      }
    },

    pask: {
      title: 'Das Geburtsdatum der Person hinzufügen, an die du denkst?',
      sub: 'Nur das Datum. Kein Name, keine Kontakte, keine Details zur Beziehung.',
      add: 'Ihr Datum hinzufügen',
      skip: 'Ohne weitermachen'
    },

    pdate: {
      title: 'Geburtsdatum der Person',
      sub: 'Ohne ihre Geburtszeit ist ihr Mond ungefähr.',
      confirm: 'Datum bestätigen'
    },

    load: {
      busy: 'Vorschau wird vorbereitet…',
      fail: 'Die Vorschau wurde nicht geladen. Deine Antworten sind gespeichert.',
      retry: 'Erneut versuchen',
      skip: 'Ohne Vorschau weiter'
    },

    prev: {
      title: {
        love: 'Deine Karte mit Fokus auf Beziehungen',
        money: 'Deine Karte mit Fokus auf Arbeit und Geld',
        calm: 'Deine Karte mit Fokus auf Erholung',
        self: 'Deine Karte mit Fokus auf dich und deine Grenzen'
      },
      frag: '{theme} · Element der Sonne: {element}',
      fragSrc: 'Deutung nach dem Element deiner Sonne, aus der Textbibliothek von AstroMap.',
      plainTitle: 'Heute in einfachen Worten',
      plainNone: 'Heute gibt es keine exakten Aspekte zu deiner Karte. Das schnellste Signal ist der Mond: Er wechselt alle zwei, drei Tage das Zeichen.',
      details: 'Details',
      tabsLead: 'Dieselbe Berechnung wie in der App. Tippe auf die Tabs.',
      noon: 'Geburtszeit unbekannt: Punkte für 12:00 gezeigt, der Mond ist daher ungefähr.',
      asp: {
        conjunction: 'Der Punkt am Himmel steht auf einem Punkt deiner Karte: sein Thema wird betont.',
        sextile: 'Eine leichte Verbindung, die wirkt, wenn du sie nutzt.',
        square: 'Spannung zwischen den beiden Punkten: Reibung, die eine Entscheidung verlangt.',
        trine: 'Eine fließende, natürliche Verbindung der beiden Punkte.',
        opposition: 'Die beiden Punkte ziehen in entgegengesetzte Richtungen: Die Aufgabe ist Balance.'
      },
      pairTitle: 'Deine Sonne und ihre Sonne',
      pair: {
        same: 'Dasselbe Element ({e}): ein ähnliches Tempo und eine ähnliche Art zu reagieren.',
        fit: 'Elemente, die sich meist gegenseitig stützen: {a} und {b}.',
        diff: 'Verschiedene Elemente: {a} und {b}. Ein anderes Tempo, darum hilft es, Dinge laut auszusprechen.'
      },
      pairNote: 'Index der Methode: {n} auf einer Skala von 38–96. Eine astrologische Methode, keine Prognose über die Beziehung.'
    },

    bridge: {
      title: 'Deine Geburtskarte bleibt. Der Himmel bewegt sich.',
      sub: 'Darum ist AstroMap ein Abo: Die Berechnung für deine Karte ändert sich jeden Tag.',
      today: 'Heute',
      next: 'Demnächst',
      moon: 'Mond: {phase} · {s}',
      moonNext: 'Der Mond wechselt das Zeichen: {s}',
      tight: 'Exakte Aspekte zu deiner Karte: {n}',
      retro: 'Gerade rückläufig: {list}',
      first: 'Erster Schritt in der App',
      act: {
        chart: 'Geburtskarte öffnen',
        today: 'Den heutigen Himmel für deine Karte ansehen',
        match: 'Kompatibilität öffnen',
        moon: 'Mondkalender öffnen'
      },
      appTitle: 'In der App kannst du',
      app: [
        'sehen, welche Transite gerade für deine Karte aktiv sind',
        'alles für ein beliebiges Datum neu berechnen',
        'die Mondphasen einen Monat im Voraus verfolgen',
        'Daten in deiner Zeitleiste speichern'
      ]
    },

    pay: {
      features: 'Für deinen Fokus',
      cta: 'Deine vollständige Karte holen',
      key: 'Nach der Zahlung schickt Gumroad dir einen Lizenzschlüssel per E-Mail. Du gibst ihn einmal ein und legst ein Passwort fest.',
      seeYear: 'Jahresplan ansehen',
      backPrev: 'Zurück zur Vorschau'
    },

    year: {
      title: 'Jahresplan',
      sub: 'Dieselbe App, einmal im Jahr bezahlt.',
      renew: 'pro Jahr, verlängert sich automatisch',
      equiv: 'Etwa $2.50 pro Monat, abgebucht als $29.99 einmal im Jahr zzgl. MwSt.',
      cta: 'Deine vollständige Karte holen',
      back: 'Zurück zum Monatsplan',
      backPrev: 'Zurück zur Vorschau'
    }
  };

  global.QUIZ_ALL.de = Q;
  if (global.LANG === 'de') { global.QUIZ = Q; }
})(typeof window !== 'undefined' ? window : globalThis);
