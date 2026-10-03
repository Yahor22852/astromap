/* Polski — teksty quizu v2. Struktura klucz w klucz jak angielski obiekt w
   js/quiz-copy.js. Nowe teksty są napisane bez rodzaju gramatycznego
   czytelnika (reszta polskiej lejki nadal ma formy żeńskie — patrz README). */
(function (global) {
  'use strict';
  if (!global.QUIZ_ALL) { return; }

  var Q = {
    phases: ['Twój fokus', 'Dane urodzenia', 'Podgląd'],
    back: 'Wstecz',
    cont: 'Dalej',
    paidNote: 'AstroMap to aplikacja w subskrypcji. Te pytania są bezpłatne: z odpowiedzi powstaje podgląd Twojej mapy.',

    goal: {
      title: 'Co chcesz teraz lepiej zrozumieć?',
      sub: 'Złożymy Twoją mapę i pokażemy, od czego zacząć.',
      note: 'Możesz to zmienić później.',
      opts: {
        love:  ['Relacje', 'Potrzeby, więź, różnice'],
        money: ['Praca i pieniądze', 'Mocne strony i obecny okres'],
        calm:  ['Regeneracja', 'Odpoczynek, rytm, cykle Księżyca'],
        self:  ['Siebie i swoje granice', 'Reakcje i potrzeby']
      }
    },

    ctx: {
      title: {
        love: 'Co dokładnie w relacjach?',
        money: 'Co dokładnie w pracy i pieniądzach?',
        calm: 'Co dokładnie w regeneracji?',
        self: 'Co dokładnie o sobie?'
      },
      sub: 'Od odpowiedzi zależy, co podgląd pokaże najpierw.',
      opts: {
        love:  { needs: 'Zrozumieć swoje potrzeby', connection: 'Spojrzeć na konkretną relację', differences: 'Lepiej rozumieć różnice' },
        money: { strengths: 'Zrozumieć swoje mocne strony', period: 'Zbadać obecny okres', overview: 'Zacząć od przeglądu mapy' },
        calm:  { cycles: 'Poznać cykle Księżyca', skynow: 'Zacząć od dzisiejszego nieba', needs: 'Lepiej zrozumieć swoje potrzeby' },
        self:  { reaction: 'Zrozumieć swoją reakcję', needs: 'Zbadać potrzeby', overview: 'Zacząć od przeglądu mapy' }
      },
      unsure: 'Jeszcze nie wiem'
    },

    dob: {
      title: 'Data Twoich urodzin',
      sub: 'Od daty zaczynamy liczyć Twoją mapę.',
      day: 'Dzień', month: 'Miesiąc', year: 'Rok',
      decades: 'Przejdź do dekady',
      pick: 'Przewiń każdy bęben do swojej daty.',
      confirm: 'Potwierdź datę',
      clamped: 'Dzień zmieniony na {d}: ten miesiąc ma dni: {n}.',
      future: 'Ta data jeszcze nie nadeszła.'
    },

    sun: {
      eyebrow: 'Pierwszy punkt Twojej mapy',
      part: 'Jeden punkt z wielu. To nie jest pełny opis człowieka.',
      cta: 'Dodaj szczegóły mapy'
    },

    tk: {
      title: 'Znasz godzinę urodzenia?',
      sub: 'Godzina pozwala policzyć Ascendent i domy. Można kontynuować bez niej.',
      yes: 'Znam dokładną godzinę',
      yesD: 'Na przykład z aktu urodzenia',
      no: 'Nie znam',
      noD: 'Policzymy to, na co pozwalają data i miejsce'
    },

    time: {
      title: 'Godzina urodzenia',
      sub: 'Czas lokalny w miejscu urodzenia.',
      hour: 'Godzina', minute: 'Minuta', ampm: 'AM / PM',
      pick: 'Przewiń bębny do swojej godziny.',
      confirm: 'Potwierdź godzinę',
      unknown: 'Nie znam godziny'
    },

    place: {
      title: 'Miejsce urodzenia',
      sub: 'Miejsce wyznacza strefę czasową w dniu urodzenia, a razem z godziną — Ascendent.',
      label: 'Miasto lub miejscowość urodzenia',
      placeholder: 'Zacznij wpisywać miasto…',
      noMatch: 'Nic nie znaleziono. Spróbuj innej pisowni, lokalnej nazwy albo najbliższego większego miasta.',
      selected: 'Miejsce urodzenia',
      change: 'Zmień',
      confirm: 'Potwierdź miejsce',
      notFound: 'Mojego miejsca nie ma na liście',
      nfTitle: 'Wybierz najbliższe większe miasto',
      nfText: 'W tej samej strefie czasowej. Użyjemy jego strefy dla Twojej daty, ale nie pokażemy Ascendentu ani domów: potrzebują dokładnego miejsca.',
      nfName: 'Twoje miejsce (opcjonalnie, tylko do podpisu)',
      nfBack: 'Wróć do wyszukiwania',
      approx: 'w przybliżeniu: strefa czasowa miasta {c}'
    },

    core: {
      title: 'Podstawa Twojej mapy',
      sub: 'Słońce, Księżyc i Ascendent: trzy punkty, od których zaczyna się każda mapa.',
      lead: 'Pokazane najpierw z powodu Twojej odpowiedzi. To punkt startu, a nie wniosek z Twojej mapy.',
      moonRange: 'Bez godziny Księżyc tego dnia był w jednym z dwóch znaków: {a} lub {b}. Zmienił znak w ciągu dnia.',
      sunRange: 'Bez godziny Słońce tego dnia było w jednym z dwóch znaków: {a} lub {b}.',
      noAscTime: 'Potrzebna godzina urodzenia',
      noAscPlace: 'Potrzebne dokładne miejsce'
    },

    extra: {
      title: 'Co jeszcze dodać do przeglądu?',
      sub: 'Opcjonalnie. Od wyboru zależy kolejność działów w aplikacji.',
      only: 'Na razie tylko: {goal}'
    },

    start: {
      title: 'Od czego wygodniej zacząć?',
      sub: 'Aplikacja otworzy się tutaj po subskrypcji. Mapa urodzeniowa się nie zmienia, a do dzisiejszego nieba i wybranych dat można wracać.',
      opts: {
        chart: ['Od mapy urodzeniowej', 'Planety, domy, aspekty'],
        sky:   ['Od dzisiejszego nieba', 'Co jest teraz aktywne dla Twojej mapy'],
        dates: ['Od najbliższych dat', 'Fazy Księżyca, zwroty, dokładne aspekty']
      }
    },

    pask: {
      title: 'Dodać datę urodzenia osoby, o której myślisz?',
      sub: 'Tylko data. Bez imienia, kontaktów i szczegółów relacji.',
      add: 'Dodaj datę tej osoby',
      skip: 'Kontynuuj bez niej'
    },

    pdate: {
      title: 'Data urodzenia tej osoby',
      sub: 'Bez godziny urodzenia jej Księżyc jest przybliżony.',
      confirm: 'Potwierdź datę'
    },

    load: {
      busy: 'Przygotowuję podgląd…',
      fail: 'Podgląd się nie załadował. Odpowiedzi są zapisane.',
      retry: 'Spróbuj ponownie',
      skip: 'Kontynuuj bez podglądu'
    },

    prev: {
      title: {
        love: 'Twoja mapa z fokusem na relacje',
        money: 'Twoja mapa z fokusem na pracę i pieniądze',
        calm: 'Twoja mapa z fokusem na regenerację',
        self: 'Twoja mapa z fokusem na Ciebie i Twoje granice'
      },
      frag: '{theme} · żywioł Słońca: {element}',
      fragSrc: 'Interpretacja według żywiołu Twojego Słońca z biblioteki tekstów AstroMap.',
      plainTitle: 'Dziś prostymi słowami',
      plainNone: 'Dziś nie ma dokładnych aspektów do Twojej mapy. Najszybszy sygnał to Księżyc: zmienia znak co dwa, trzy dni.',
      details: 'Szczegóły',
      tabsLead: 'To samo liczenie co w aplikacji. Dotknij zakładek.',
      noon: 'Godzina urodzenia nieznana: punkty pokazane na 12:00, więc Księżyc jest przybliżony.',
      asp: {
        conjunction: 'Punkt nieba stoi na punkcie Twojej mapy: jego temat jest wzmocniony.',
        sextile: 'Łatwe połączenie, które działa, gdy z niego skorzystasz.',
        square: 'Napięcie między dwoma punktami: tarcie, które prosi o decyzję.',
        trine: 'Gładkie, naturalne połączenie dwóch punktów.',
        opposition: 'Dwa punkty ciągną w przeciwne strony: zadaniem jest równowaga.'
      },
      pairTitle: 'Twoje Słońce i Słońce tej osoby',
      pair: {
        same: 'Ten sam żywioł ({e}): podobne tempo i sposób reagowania.',
        fit: 'Żywioły, które zwykle się wspierają: {a} i {b}.',
        diff: 'Różne żywioły: {a} i {b}. Inne tempo, więc pomaga mówić rzeczy na głos.'
      },
      pairNote: 'Indeks metody: {n} w skali 38–96. Metoda astrologiczna, nie prognoza dotycząca relacji.'
    },

    bridge: {
      title: 'Mapa urodzeniowa zostaje. Niebo się zmienia.',
      sub: 'Dlatego AstroMap to subskrypcja: wyliczenia dla Twojej mapy zmieniają się każdego dnia.',
      today: 'Dziś',
      next: 'Przed Tobą',
      moon: 'Księżyc: {phase} · {s}',
      moonNext: 'Księżyc zmienia znak: {s}',
      tight: 'Dokładnych aspektów do Twojej mapy: {n}',
      retro: 'Teraz w retrogradacji: {list}',
      first: 'Pierwszy krok w aplikacji',
      act: {
        chart: 'Otwórz mapę urodzeniową',
        today: 'Zobacz dzisiejsze niebo dla swojej mapy',
        match: 'Otwórz zgodność',
        moon: 'Otwórz kalendarz Księżyca'
      },
      appTitle: 'W aplikacji możesz',
      app: [
        'Widzieć, które tranzyty są teraz aktywne dla Twojej mapy',
        'Przeliczyć wszystko na dowolną wybraną datę',
        'Śledzić fazy Księżyca miesiąc do przodu',
        'Zapisywać daty na swojej osi czasu'
      ]
    },

    pay: {
      features: 'Dla Twojego fokusu',
      cta: 'Odbierz pełną mapę',
      key: 'Po płatności Gumroad wyśle klucz licencyjny e-mailem. Wpisujesz go raz i ustawiasz hasło.',
      seeYear: 'Zobacz plan roczny',
      backPrev: 'Wróć do podglądu'
    },

    year: {
      title: 'Plan roczny',
      sub: 'Ta sama aplikacja, płatność raz w roku.',
      renew: 'rocznie, odnawia się automatycznie',
      equiv: 'Około $2.50 miesięcznie, pobierane jako $29.99 raz w roku plus VAT.',
      cta: 'Odbierz pełną mapę',
      back: 'Wróć do planu miesięcznego',
      backPrev: 'Wróć do podglądu'
    }
  };

  global.QUIZ_ALL.pl = Q;
  if (global.LANG === 'pl') { global.QUIZ = Q; }
})(typeof window !== 'undefined' ? window : globalThis);
