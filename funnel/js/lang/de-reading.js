/* Deutsch — тексты разбора. Структура повторяет английский объект в
   js/reading-copy.js ключ в ключ. */
(function (global) {
  'use strict';

  if (!global.READING_ALL) { return; }

  var R = {
    ui: {
      title: 'Deine Karte',
      forWhom: 'Auswertung für {date}, {city}',
      secPositions: 'Deine drei Positionen',
      secThemes: 'Deine Bereiche',
      secWeek: 'Diese Woche',
      secPair: 'Kompatibilität',
      sun: 'Sonne', moon: 'Mond', asc: 'Aszendent',
      noAsc: 'Aszendent nicht berechnet — es wurde keine Geburtszeit angegeben.',
      weekRange: 'Woche vom {from} bis {to}',
      weekMoon: 'Der Mond der Woche',
      weekSun: 'Die Sonne gegen deine Position',
      recalc: 'Dieses Kapitel rechnet sich jede Woche aus den aktuellen Positionen neu.',
      pairScore: 'Kompatibilitätsindex',
      pairStrongest: 'Der stärkste Aspekt zwischen euch',
      pairFoot: 'Ein Index auf einer Skala von 38 bis 96 aus den Sonne- und Mondaspekten zwischen euch. Astrologische Methode, keine Prognose.',
      noPair: 'Du hast keine zweite Person angegeben. Geh zurück zum Formular, um die Kompatibilität zu berechnen.',
      empty: 'In diesem Browser ist keine Karte gespeichert. Füll das Formular bitte noch einmal aus.',
      back: 'Zurück zum Formular',
      goTitle: 'Das ist die Aufnahme eines Tages',
      goText: 'Oben stehen deine Geburtskarte und der Himmel dieser Woche. Die Karte ändert sich nicht, der Himmel darüber jeden Tag. In AstroMap rechnen sich dieselben Positionen für jedes Datum neu, das du wählst: Transite mit ihren Fenstern und Höhepunkten, der Mond, die Rückläufe, deine Zeitleiste und das volle Rad mit den Häusern.',
      goCta: 'AstroMap öffnen',
      disclaimer: 'Dieser Inhalt dient der Unterhaltung und ersetzt keine fachliche Beratung.'
    },

    sun: [
      'Deine Sonne arbeitet wie ein anspringender Motor: die Entscheidung ist da, bevor du sie zu Ende gedacht hast. Du fängst gut an und tust dich schwer mit der Phase, in der man nur noch durchhalten muss. Die Kraft liegt im ersten Zug, nicht in der zehnten Woche.',
      'Deine Sonne lässt sich von niemandes Tempo vorschreiben. Du brauchst Zeit für eine Entscheidung und rührst sie danach nicht mehr an — deshalb gewinnst du dort, wo andere nach einem Monat aufgeben. Der Preis: du bleibst in Dingen, die längst zu Ende sind.',
      'Deine Sonne denkt schneller, als sie spricht, deshalb endet ein Satz selten dort, wo er anfing. Neuer Input ist Sauerstoff für dich, und Langeweile trifft härter als Erschöpfung.',
      'Deine Sonne liest die Stimmung eines Raums von der Tür aus und nimmt sie auf sich. Daher die Müdigkeit ohne klaren Grund. Nähe ist für dich eine Bedingung fürs Arbeiten, keine Belohnung dafür.',
      'Deine Sonne braucht Publikum, aber nicht aus Eitelkeit — du brauchst für das, was du tust, einen Zeugen und einen Sinn. Ohne das klingt selbst gute Arbeit hohl.',
      'Deine Sonne sieht das Detail, das das Ganze ruiniert, und kann es nicht mehr übersehen. Deshalb nennst du selten etwas fertig und noch seltener gut genug.',
      'Deine Sonne zählt die Bequemlichkeit aller anderen im Raum vor der eigenen. Du nennst es Frieden, aber öfter ist es deine eigene, aufgeschobene Entscheidung.',
      'Deine Sonne macht nichts halb. Du gehst ganz hinein oder gar nicht — Gehen eingeschlossen. Das gibt dir eine Tiefe, die anderen fehlt, und einen Preis, den du allein zahlst.',
      'Deine Sonne beantwortet Schwierigkeiten mit Bewegung: eine Reise, ein Plan, eine neue Richtung. Manchmal ist das Mut, manchmal Flucht, und der Unterschied zeigt sich erst hinterher.',
      'Deine Sonne baut langsam und nach eigenen Regeln. Du schaffst in zehn Jahren, was andere ein Leben lang aufschieben, aber du behandelst Ruhe als etwas, das man sich verdienen muss.',
      'Deine Sonne hält Abstand aus Instinkt, nicht aus Kälte. Du brauchst einen Raum, in dem dich niemand sortiert, und erst von dort aus kommst du näher.',
      'Deine Sonne nimmt die Gefühle ringsum so genau auf, dass der Moment leicht zu verpassen ist, in dem sie aufhörten, deine zu sein. Daher das Bedürfnis nach Stille nach Menschen.'
    ],

    moon: [
      'Dein Mond reagiert sofort: es knallt, dann ist es klar. Du hältst Ärger nicht lange, und das schützt dich. Schwierig wird es, wenn der andere Ruhe braucht statt Reden.',
      'Dein Mond beruhigt sich über den Körper: Essen, eine Decke, ein bekannter Ort, dasselbe Ritual. Eine Veränderung ohne Vorwarnung kostet dich mehr, als du zugeben willst.',
      'Dein Mond verdaut Gefühle im Sprechen. Bis du es erzählt hast, weißt du nicht genau, was du fühlst. Stille in einer Beziehung klingt für dich wie ein Alarm.',
      'Dein Mond erinnert sich an eine Verletzung bis auf den Satz und den Ton. Du verzeihst, aber du löschst nicht — deshalb kehren alte Gespräche in neuen Streitigkeiten zurück.',
      'Dein Mond braucht jemanden, der merkt, dass es dir schlechter geht. Du fragst selten direkt; öfter zeigst du es und wartest auf die Frage.',
      'Dein Mond räumt auf, statt zu weinen. Putzen, Listen, ein Plan. Kurzfristig wirkt das und legt das Gefühl für später ab, meist für den denkbar schlechtesten Moment.',
      'Dein Mond kann vor Menschen nicht wütend sein. Du hebst die Wut für das Alleinsein auf, und dort wird aus ihr Grübeln statt ein Gespräch.',
      'Dein Mond misstraut der Ruhe. Selbst in einer guten Woche suchst du den Haken, weil sich der Moment, in dem wirklich etwas bricht, so leichter tragen lässt.',
      'Dein Mond behandelt Traurigkeit mit Planen: eine Reise, ein Kurs, eine Richtung. Selbst wenn du nie fährst, senkt der Plan schon den Druck.',
      'Deinem Mond ist es peinlich, um Hilfe zu bitten. Lieber machst du die dreifache Arbeit, als zu sagen, dass du nicht mehr kannst — und bist danach auf alle gleichzeitig wütend.',
      'Dein Mond analysiert ein Gefühl, statt es zu fühlen. Wirksam genau bis zu dem Moment, in dem das Gefühl trotzdem kommt, später und stärker.',
      'Dein Mond kennt keine Grenze zwischen deiner Stimmung und der eines anderen. Deshalb brauchst du nach einem Tag unter Menschen Stille und keine weitere Verabredung.'
    ],

    asc: [
      'Man sieht jemanden, der gleich etwas entscheidet, auch mitten im Zögern. Verantwortung erreicht dich schneller, als du darum bittest.',
      'Du wirkst ruhig und teuer. Das öffnet Türen und sorgt auch dafür, dass niemand fragt, ob du Hilfe brauchst.',
      'Du wirkst leicht und verfügbar, deshalb vertrauen sich dir Fremde in zehn Minuten an. Manchmal gehst du müder aus solchen Gesprächen als sie.',
      'Du siehst aus wie jemand, der das regelt, deshalb fragt man zuerst dich. Nein zu sagen kostet dich mehr als die Aufgabe selbst.',
      'Du kommst rein und die Temperatur im Raum verschiebt sich. Das lässt sich nicht abschalten, auch nicht an dem Tag, an dem du unsichtbar sein willst.',
      'Du wirkst kompetent, also bleibt die Arbeit anderer bei dir hängen. Meistens lieferst du sie auch ab, womit sich der Kreis sauber schließt.',
      'Man geht davon aus, dass du zustimmst, und meistens stimmt das. Deine Höflichkeit wird als fehlende Meinung gelesen, was sie nicht ist.',
      'Du scheinst mehr zu wissen, als du sagst. Manche schüchtert das ein, der Rest nimmt es als Grund, dir zu vertrauen.',
      'Du siehst aus wie jemand, der gleich geht, auch wenn du bleibst. Deshalb fragt man dich öfter nach deinen Plänen als danach, wie es dir geht.',
      'Du wirkst älter und ernster, als du bist. Bei der Arbeit hilft das, die Leichtigkeit macht es schwerer.',
      'Man sieht jemanden für sich: sympathisch, aber nicht ganz da. Näher zu kommen verlangt Initiative von der anderen Seite.',
      'Dein Gesicht wird als Einladung gelesen, auch wenn es keine ist. Daher die Missverständnisse am Anfang.'
    ],

    themes: {
      love: {
        t: 'Liebe und Beziehungen',
        fire: 'In der Liebe brauchst du Tempo und klare Ehrlichkeit. Vorsicht langweilt dich, und ausgerechnet Vorsicht rettet Beziehungen, in denen beide schnell unterwegs sind.',
        earth: 'In der Liebe zählst du Wiederholung, keine Erklärungen. Vertrauen braucht bei dir Monate und nach einer Enttäuschung genau noch einmal so lange.',
        air: 'In der Liebe brauchst du Gespräch mehr als Gesten. Stille klingt für dich nach Alarm, während sie für den anderen oft nur Ruhe heißt.',
        water: 'In der Liebe spürst du den anderen schneller, als er sich selbst versteht. Achte auf den Punkt, an dem Fürsorge das Zusammensein ersetzt.'
      },
      money: {
        t: 'Arbeit und Geld',
        fire: 'Bei der Arbeit bist du am Anfang am besten: ein neues Projekt, eine Krise, eine Deadline. Routine brennt dich schneller aus als Überlastung.',
        earth: 'Bei der Arbeit ist Ausdauer dein Vorteil. Du gewinnst über Jahre, musst aber lernen, deinen Preis zu nennen, bevor ihn jemand anderes nennt.',
        air: 'Bei der Arbeit verdienst du über Kontakte und schnelles Lernen. Das Hauptrisiko: zehn Richtungen angefangen und keine abgeschlossen.',
        water: 'Bei der Arbeit führt dich Sinn, keine Tabelle. Du liest Menschen gut, deshalb laufen Verhandlungen besser, als du denkst — solange du nicht zuerst nachgibst.'
      },
      calm: {
        t: 'Ruhe und Schlaf',
        fire: 'Dich erholt Bewegung, nicht Liegen. Training, die Straße und körperliche Müdigkeit tun für deinen Schlaf mehr als ein freier Abend.',
        earth: 'Dich erholen Rhythmus und vertraute Umgebung. Dein Schlaf bricht am Chaos im Plan, nicht an der Menge Arbeit.',
        air: 'Dich erholt es, den Kopf leise zu stellen, nicht den Körper. Ohne den Zustrom abzuschneiden liegst du müde da und denkst weiter.',
        water: 'Dich erholen Alleinsein nach Menschen und Wasser: ein Bad, ein Becken, ein Weg am Fluss. Ohne das trägst du fremde Gefühle die ganze Woche.'
      },
      self: {
        t: 'Ich und meine Grenzen',
        fire: 'Deine Grenze bricht dort, wo du Schnelligkeit mit Zustimmung verwechselst. Gib dir einen Tag, bevor du Ja sagst.',
        earth: 'Deine Grenze bricht dort, wo du zu lange bleibst, um nicht neu anfangen zu müssen. Bleiben kann teurer sein als wechseln.',
        air: 'Deine Grenze bricht dort, wo du dich länger erklärst, als die Sache gedauert hat. Ein kürzerer Satz reicht meistens.',
        water: 'Deine Grenze bricht dort, wo du das Gefühl eines anderen als Aufgabe nimmst. Mitgefühl verpflichtet dich nicht, es zu reparieren.'
      }
    },

    transitMoon: [
      'Der Mond im Widder beschleunigt die Reaktionen. Gute Woche zum Anfangen, schlechte für Nachrichten im Affekt.',
      'Der Mond im Stier drosselt das Tempo. Der Körper verlangt Rhythmus: Schlaf, Essen und ein ruhiger Abend schlagen jeden Plan.',
      'Der Mond in den Zwillingen überschwemmt dich mit Input. Reden geht leicht, Konzentration nicht — halte Aufgaben kurz.',
      'Der Mond im Krebs hebt die Empfindlichkeit. Gespräche über Nahes gehen leichter als sonst.',
      'Der Mond im Löwen will Publikum. Guter Moment, fertige Arbeit zu zeigen, schlechter für Streit um Aufmerksamkeit.',
      'Der Mond in der Jungfrau räumt auf. Gute Woche, um lose Enden zu schließen, schlechte, um über dich selbst zu urteilen.',
      'Der Mond in der Waage sucht Balance. Versöhnung fällt leichter, eine klare Entscheidung schwerer.',
      'Der Mond im Skorpion vertieft alles. Echte Gespräche ja, impulsive Nachrichten nein.',
      'Der Mond im Schützen öffnet den Horizont. Eine Reise oder einen Kurs zu planen tut deiner Stimmung mehr als Ausruhen zu Hause.',
      'Der Mond im Steinbock kühlt die Gefühle ab. Guter Moment für Formalitäten, schwacher für Gespräche über Gefühle.',
      'Der Mond im Wassermann schenkt Abstand. Du siehst deine Lage von außen — nutz das zum Entscheiden.',
      'Der Mond in den Fischen verwischt die Kanten. Ruhe und Schlaf zählen mehr als Produktivität.'
    ],

    transitAspect: {
      conjunction: 'Die Sonne kehrt an deine Geburtsposition zurück. Das ist eine Woche zum Anfangen, nicht zum Bilanzieren.',
      semisquare: 'Kleine Reibung zwischen dem, was du willst, und dem, was die Woche verlangt. Nichts Großes, aber zermürbend.',
      sextile: 'Günstiger Winkel: es geht leichter, wenn du den ersten Schritt machst. Von allein passiert nichts.',
      square: 'Spannung zwischen deinen Plänen und den Umständen. Eine Woche zum Kurskorrigieren, nicht zum Erzwingen.',
      trine: 'Die leichteste Konstellation im Zyklus. Verbrauch sie für das, was du seit Monaten aufschiebst.',
      quincunx: 'Etwas passt nicht und lässt sich schwer benennen. Guter Moment, Kleinigkeiten zu ordnen.',
      opposition: 'Volle Opposition: du siehst deine Lage von der anderen Seite. Eine Auseinandersetzung kann nützen, ohne Streit zu werden.'
    },

    pairAspect: {
      conjunction: 'Eure Lichter stehen am selben Ort — ihr versteht euch ohne Erklärung und wiederholt dieselben Fehler.',
      semisquare: 'Kleine, wiederkehrende Reibung. Sie zerbricht die Beziehung nicht, kommt aber in denselben Situationen zurück.',
      sextile: 'Leichtigkeit, die Initiative verlangt. Dieses Paar funktioniert, solange jemand zuerst vorschlägt.',
      square: 'Die härteste und die entwicklungsreichste Konstellation. Sie zieht an und sie lehrt, und sie kostet.',
      trine: 'Natürliche Übereinstimmung im Rhythmus. Nur ein Risiko: bei so viel Leichtigkeit arbeitet niemand an der Beziehung.',
      quincunx: 'Ständiges Nachjustieren. Funktioniert bei Paaren, die gern über das reden, was zwischen ihnen ist.',
      opposition: 'Entgegengesetzte Enden derselben Achse. Starker Zug und ein dauerndes Verhandeln.'
    }
  };

  global.READING_ALL.de = R;
  if (global.LANG === 'de') { global.READING = R; }
})(typeof window !== 'undefined' ? window : globalThis);
