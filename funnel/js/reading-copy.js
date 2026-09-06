/* reading-copy.js — ВСЕ ТЕКСТЫ РАЗБОРА. Править только здесь.
   Структура одинаковая для pl и en: меняешь LANG в copy.js — меняется и разбор.

   Порядок знаков везде один и тот же и совпадает с Astro.SIGN_KEYS:
   Baran, Byk, Bliźnięta, Rak, Lew, Panna, Waga, Skorpion, Strzelec,
   Koziorożec, Wodnik, Ryby.
*/
(function (global) {
  'use strict';

  var PL = {
    ui: {
      title: 'Twoja mapa',
      forWhom: 'Rozbiór dla daty {date}, {city}',
      secPositions: 'Twoje trzy pozycje',
      secThemes: 'Twoje działy',
      secWeek: 'Ten tydzień',
      secPair: 'Zgodność',
      sun: 'Słońce', moon: 'Księżyc', asc: 'Ascendent',
      noAsc: 'Ascendent nie policzony — nie podałeś godziny urodzenia.',
      weekRange: 'Tydzień {from} — {to}',
      weekMoon: 'Księżyc tygodnia',
      weekSun: 'Słońce wobec Twojej pozycji',
      recalc: 'Ten rozdział przelicza się od nowa co tydzień z aktualnych pozycji.',
      pairScore: 'Wskaźnik zgodności',
      pairStrongest: 'Najsilniejszy aspekt między Wami',
      pairFoot: 'Indeks w skali 38–96 z aspektów Słońca i Księżyca obu osób. Metoda astrologiczna, nie prognoza.',
      noPair: 'Nie dodałeś drugiej osoby. Wróć do formularza, żeby policzyć zgodność.',
      empty: 'Nie znaleziono zapisanej mapy w tej przeglądarce. Wypełnij formularz od nowa.',
      back: 'Wróć do formularza',
      disclaimer: 'Treść ma charakter rozrywkowy i nie zastępuje porady specjalisty.'
    },

    sun: [
      'Twoje Słońce działa jak start silnika: decyzja zapada, zanim zdążysz ją przemyśleć. Dobrze zaczynasz i źle znosisz etap, na którym trzeba już tylko wytrwać. Siła jest w pierwszym ruchu, nie w dziesiątym tygodniu.',
      'Twoje Słońce nie znosi cudzego tempa. Potrzebujesz czasu na decyzję i potem jej nie zmieniasz — dlatego wygrywasz tam, gdzie inni rezygnują po miesiącu. Cena: zostajesz w rzeczach, które dawno się skończyły.',
      'Twoje Słońce myśli szybciej, niż mówi, więc zdanie rzadko kończy się tam, gdzie się zaczęło. Nowe bodźce są Ci potrzebne jak tlen, a nuda działa mocniej niż zmęczenie.',
      'Twoje Słońce czyta nastrój pokoju od progu i bierze go na siebie. Stąd zmęczenie bez wyraźnego powodu. Bliskość jest u Ciebie warunkiem działania, a nie nagrodą za nie.',
      'Twoje Słońce potrzebuje widowni, ale nie z próżności — potrzebujesz, żeby to, co robisz, miało świadka i znaczenie. Bez tego nawet dobra praca wydaje się pusta.',
      'Twoje Słońce widzi szczegół, który psuje całość, i nie potrafi go nie widzieć. Dlatego rzadko uznajesz coś za skończone, a jeszcze rzadziej za wystarczająco dobre.',
      'Twoje Słońce liczy komfort wszystkich w pokoju, zanim policzy własny. Nazywasz to spokojem, ale częściej jest to odkładanie własnej decyzji na później.',
      'Twoje Słońce nie robi rzeczy na pół. Wchodzisz całkowicie albo wcale — także w odejście. To daje głębię, której inni nie mają, i cenę, którą płacisz sam.',
      'Twoje Słońce odpowiada na trudność ruchem: wyjazdem, planem, nowym kierunkiem. Czasem to odwaga, czasem ucieczka, a różnicę widać dopiero po fakcie.',
      'Twoje Słońce buduje wolno i na własnych warunkach. Zrobisz w dziesięć lat to, co inni odkładają całe życie, ale odpoczynek traktujesz jak coś, na co trzeba zasłużyć.',
      'Twoje Słońce trzyma dystans nie z chłodu, tylko z instynktu. Potrzebujesz przestrzeni, w której nikt Cię nie ustawia, i dopiero z niej podchodzisz blisko.',
      'Twoje Słońce wchłania emocje otoczenia tak dokładnie, że łatwo przegapić moment, w którym przestały być Twoje. Stąd potrzeba ciszy po ludziach.'
    ],

    moon: [
      'Twój Księżyc reaguje natychmiast: wybuch, a potem czysto. Nie dusisz złości długo i to Cię chroni. Problem zaczyna się, gdy druga strona potrzebuje ciszy zamiast rozmowy.',
      'Twój Księżyc uspokaja się przez ciało: jedzenie, koc, znane miejsce, ten sam rytuał. Zmiana bez uprzedzenia kosztuje Cię więcej, niż jesteś skłonny przyznać.',
      'Twój Księżyc trawi uczucie przez mówienie. Dopóki nie opowiesz, nie wiesz dokładnie, co czujesz. Cisza w relacji działa na Ciebie jak alarm.',
      'Twój Księżyc pamięta krzywdę z dokładnością do zdania i intonacji. Wybaczasz, ale nie kasujesz — dlatego stare rozmowy wracają w nowych kłótniach.',
      'Twój Księżyc potrzebuje, żeby ktoś zauważył, że jest Ci gorzej. Rzadko prosisz wprost, częściej pokazujesz to gestem i czekasz, aż ktoś zapyta.',
      'Twój Księżyc zamiast płakać — porządkuje. Sprzątanie, listy, plan. Działa krótkoterminowo i odkłada emocję na później, zwykle na najgorszy możliwy moment.',
      'Twój Księżyc nie umie być zły przy ludziach. Odkładasz złość na czas sam na sam, gdzie zamienia się w rozmyślanie zamiast rozmowy.',
      'Twój Księżyc nie ufa spokojowi. Nawet w dobrym tygodniu szukasz haczyka, bo tak łatwiej znieść moment, w którym coś faktycznie pęknie.',
      'Twój Księżyc leczy smutek planowaniem: wyjazd, kurs, kierunek. Nawet jeśli nigdzie nie jedziesz, sam plan realnie obniża napięcie.',
      'Twój Księżyc wstydzi się prosić o pomoc. Wolisz zrobić trzy razy więcej, niż powiedzieć, że nie dajesz rady — a potem masz o to żal do wszystkich naraz.',
      'Twój Księżyc analizuje uczucie, zamiast je poczuć. Skuteczne do momentu, w którym emocja i tak przychodzi, tylko z opóźnieniem i mocniej.',
      'Twój Księżyc nie ma granicy między Twoim nastrojem a cudzym. Dlatego po dniu wśród ludzi potrzebujesz ciszy, a nie kolejnego spotkania.'
    ],

    asc: [
      'Ludzie widzą kogoś, kto zaraz podejmie decyzję, nawet gdy się wahasz. Dlatego odpowiedzialność trafia do Ciebie szybciej, niż o nią prosisz.',
      'Robisz wrażenie osoby spokojnej i kosztownej. To otwiera drzwi, ale sprawia też, że rzadko ktoś pyta, czy potrzebujesz pomocy.',
      'Wydajesz się lekki i dostępny, więc obcy zwierzają Ci się po dziesięciu minutach. Bywa, że wychodzisz z takiej rozmowy bardziej zmęczony niż druga strona.',
      'Wyglądasz na kogoś, kto się zaopiekuje, i ludzie proszą Cię pierwszego. Powiedzenie „nie” kosztuje Cię więcej niż samo zadanie.',
      'Wchodzisz i temperatura pokoju się zmienia. Tego nie da się wyłączyć nawet w dniu, w którym chcesz być niewidzialny.',
      'Wyglądasz na kompetentnego, więc dostajesz cudzą pracę. Zwykle ją dowozisz, co tylko domyka ten cykl.',
      'Ludzie zakładają, że się zgodzisz, i zwykle mają rację. Twoja uprzejmość bywa czytana jako brak własnego zdania, choć nim nie jest.',
      'Robisz wrażenie kogoś, kto wie więcej, niż mówi. Część ludzi to onieśmiela, reszta uznaje za powód, żeby Ci zaufać.',
      'Wyglądasz na kogoś, kto zaraz wyjdzie, nawet gdy zostajesz. Dlatego bliscy częściej pytają o Twoje plany niż o Twoje samopoczucie.',
      'Wydajesz się starszy i poważniejszy, niż jesteś. Ułatwia to pracę i utrudnia bycie po prostu lekkim.',
      'Widzą kogoś osobnego: sympatycznego, ale nie do końca obecnego. Zbliżenie wymaga inicjatywy od drugiej strony.',
      'Twój wyraz twarzy bywa czytany jako zaproszenie, także wtedy, gdy nim nie jest. Stąd nieporozumienia na starcie znajomości.'
    ],

    themes: {
      love: {
        t: 'Miłość i relacje',
        fire: 'W miłości potrzebujesz tempa i szczerości wprost. Ostrożność Cię nudzi, ale to właśnie ona ratuje związki, w których obie strony są szybkie.',
        earth: 'W miłości liczysz nie deklaracje, tylko powtarzalność. Zaufanie budujesz miesiącami i dokładnie tyle samo trwa jego odbudowa po jednym zawodzie.',
        air: 'W miłości potrzebujesz rozmowy bardziej niż gestów. Cisza jest dla Ciebie sygnałem alarmowym, choć u drugiej strony często oznacza po prostu spokój.',
        water: 'W miłości czujesz drugą osobę szybciej, niż ona rozumie samą siebie. Uważaj na moment, w którym opiekowanie zaczyna zastępować bycie razem.'
      },
      money: {
        t: 'Kariera i pieniądze',
        fire: 'W pracy jesteś najlepszy na starcie: nowy projekt, kryzys, termin. Rutyna wypala Cię szybciej niż przeciążenie.',
        earth: 'W pracy Twoją przewagą jest wytrwałość. Wygrywasz w perspektywie lat, ale musisz nauczyć się nazywać swoją cenę, zanim zrobi to ktoś inny.',
        air: 'W pracy zarabiasz na kontaktach i szybkim uczeniu się. Największe ryzyko: dziesięć rozpoczętych kierunków i żaden domknięty.',
        water: 'W pracy prowadzi Cię sens, nie tabela. Świetnie czytasz ludzi, więc negocjacje idą Ci lepiej, niż sądzisz — o ile nie oddasz swojej części pierwszy.'
      },
      calm: {
        t: 'Spokój i sen',
        fire: 'Regeneruje Cię ruch, nie leżenie. Trening, droga i fizyczne zmęczenie robią dla Twojego snu więcej niż wolny wieczór.',
        earth: 'Regeneruje Cię rytm i znane otoczenie. Twój sen psuje się od chaosu w planach, nie od ilości pracy.',
        air: 'Regeneruje Cię wyciszenie głowy, nie ciała. Bez odciętych bodźców leżysz zmęczony i dalej myślisz.',
        water: 'Regeneruje Cię samotność po ludziach i woda: kąpiel, basen, spacer nad rzeką. Bez tego nosisz cudze emocje przez cały tydzień.'
      },
      self: {
        t: 'Ja i moje granice',
        fire: 'Twoja granica pęka tam, gdzie mylisz szybkość ze zgodą. Zanim powiesz „tak”, daj sobie jedną dobę.',
        earth: 'Twoja granica pęka tam, gdzie zostajesz za długo, żeby nie zaczynać od nowa. Koszt trwania bywa wyższy niż koszt zmiany.',
        air: 'Twoja granica pęka tam, gdzie tłumaczysz się dłużej, niż trwała sama sprawa. Krótsze zdanie zwykle wystarcza.',
        water: 'Twoja granica pęka tam, gdzie cudze emocje bierzesz jako zadanie. Współczucie nie zobowiązuje Cię do naprawiania.'
      }
    },

    transitMoon: [
      'Księżyc w Baranie przyspiesza reakcje. Dobry tydzień na rozpoczęcie, zły na wysyłanie wiadomości w emocjach.',
      'Księżyc w Byku zwalnia tempo. Ciało domaga się rytmu: sen, jedzenie i spokojny wieczór dadzą więcej niż plan.',
      'Księżyc w Bliźniętach sypie bodźcami. Łatwiej o rozmowę, trudniej o skupienie — rób rzeczy krótkie.',
      'Księżyc w Raku podnosi wrażliwość. Rozmowy o sprawach bliskich pójdą łatwiej niż zwykle.',
      'Księżyc we Lwie chce widowni. Dobry moment, żeby pokazać zrobioną pracę, gorszy na spory o uwagę.',
      'Księżyc w Pannie porządkuje. Dobry tydzień na domykanie zaległości, zły na ocenianie siebie.',
      'Księżyc w Wadze szuka równowagi. Łatwiej o pojednanie, trudniej o jednoznaczną decyzję.',
      'Księżyc w Skorpionie pogłębia wszystko. Prawdziwe rozmowy tak, impulsywne wiadomości nie.',
      'Księżyc w Strzelcu otwiera horyzont. Plan wyjazdu albo kurs zrobią dla nastroju więcej niż odpoczynek w domu.',
      'Księżyc w Koziorożcu chłodzi emocje. Dobry moment na sprawy formalne, słaby na rozmowy o uczuciach.',
      'Księżyc w Wodniku daje dystans. Zobaczysz swoją sytuację z zewnątrz — wykorzystaj to na decyzję.',
      'Księżyc w Rybach rozmywa granice. Odpoczynek i sen ważniejsze niż produktywność.'
    ],

    transitAspect: {
      conjunction: 'Słońce wraca na Twoją pozycję urodzeniową. To tydzień startu, nie podsumowań.',
      semisquare: 'Drobne tarcie między tym, czego chcesz, a tym, czego wymaga tydzień. Nic wielkiego, ale męczy.',
      sextile: 'Sprzyjający kąt: sprawy idą łatwiej, jeśli zrobisz pierwszy ruch. Same się nie wydarzą.',
      square: 'Napięcie między Twoimi planami a okolicznościami. Tydzień na korektę kursu, nie na forsowanie.',
      trine: 'Najłatwiejszy układ w całym cyklu. Wykorzystaj go na to, co odkładasz od miesięcy.',
      quincunx: 'Coś nie pasuje, choć trudno wskazać co. Dobry moment na uporządkowanie drobiazgów.',
      opposition: 'Pełna opozycja: widzisz swoją sytuację z drugiej strony. Konfrontacja bywa potrzebna, ale nie musi być awanturą.'
    },

    pairAspect: {
      conjunction: 'Wasze światła stoją w tym samym miejscu — rozumiecie się bez tłumaczenia i powielacie te same błędy.',
      semisquare: 'Drobne, powtarzalne tarcie. Nie rozbija relacji, ale wraca w tych samych sytuacjach.',
      sextile: 'Łatwość, która wymaga inicjatywy. Ta para działa, dopóki ktoś proponuje pierwszy.',
      square: 'Najtrudniejszy i zarazem najbardziej rozwojowy układ. Przyciąga i uczy, ale kosztuje.',
      trine: 'Naturalna zgodność rytmu. Ryzyko jest jedno: przy takiej łatwości nikt nie pracuje nad relacją.',
      quincunx: 'Ciągła konieczność dostrajania się. Działa u par, które lubią rozmawiać o tym, co między nimi.',
      opposition: 'Przeciwne bieguny tej samej osi. Silne przyciąganie i stała potrzeba negocjacji.'
    }
  };

  var EN = {
    ui: {
      title: 'Your map',
      forWhom: 'Reading for {date}, {city}',
      secPositions: 'Your three positions',
      secThemes: 'Your sections',
      secWeek: 'This week',
      secPair: 'Compatibility',
      sun: 'Sun', moon: 'Moon', asc: 'Ascendant',
      noAsc: 'Ascendant not calculated — no birth time was given.',
      weekRange: 'Week of {from} — {to}',
      weekMoon: 'Moon of the week',
      weekSun: 'Sun against your position',
      recalc: 'This chapter recalculates every week from the current positions.',
      pairScore: 'Compatibility index',
      pairStrongest: 'The strongest aspect between you',
      pairFoot: 'An index on a 38–96 scale from Sun and Moon aspects between you. Astrological method, not a forecast.',
      noPair: 'You didn\u2019t add a second person. Go back to the form to calculate compatibility.',
      empty: 'No saved map found in this browser. Please fill in the form again.',
      back: 'Back to the form',
      disclaimer: 'This content is for entertainment and does not replace professional advice.'
    },

    sun: [
      'Your Sun works like an engine starting: the decision lands before you have thought it through. You begin well and struggle with the stage where you only have to endure. The strength is in the first move, not the tenth week.',
      'Your Sun refuses anyone else\u2019s tempo. You need time to decide and then you don\u2019t revisit it — which is why you win where others quit after a month. The cost: you stay in things that ended long ago.',
      'Your Sun thinks faster than it speaks, so a sentence rarely ends where it started. New input is oxygen to you, and boredom hits harder than exhaustion.',
      'Your Sun reads the mood of a room from the doorway and takes it on. Hence the tiredness with no clear cause. For you closeness is a condition of working, not a reward for it.',
      'Your Sun needs an audience, but not from vanity — you need what you do to have a witness and a meaning. Without that, even good work feels hollow.',
      'Your Sun sees the detail that ruins the whole and cannot unsee it. So you rarely call anything finished, and even more rarely good enough.',
      'Your Sun counts everyone else\u2019s comfort in the room before its own. You call it peace, but more often it is your own decision, postponed.',
      'Your Sun does nothing by halves. You go all the way in or not at all — leaving included. That gives you a depth others lack, and a price you pay alone.',
      'Your Sun answers difficulty with movement: a trip, a plan, a new direction. Sometimes that is courage, sometimes escape, and the difference is only clear afterwards.',
      'Your Sun builds slowly and on its own terms. You will do in ten years what others postpone for life, but you treat rest as something to be earned.',
      'Your Sun keeps distance out of instinct, not coldness. You need a space where nobody arranges you, and only from there do you come close.',
      'Your Sun absorbs the feelings around it so precisely that it is easy to miss the moment they stopped being yours. Hence the need for silence after people.'
    ],

    moon: [
      'Your Moon reacts instantly: it bursts, then it\u2019s clear. You don\u2019t hold anger long and that protects you. The trouble starts when the other person needs quiet instead of talk.',
      'Your Moon settles through the body: food, a blanket, a known place, the same ritual. Change without warning costs you more than you\u2019re willing to admit.',
      'Your Moon digests feeling by speaking. Until you\u2019ve told it, you don\u2019t quite know what you feel. Silence in a relationship reads to you as an alarm.',
      'Your Moon remembers a hurt down to the sentence and the tone. You forgive but you don\u2019t delete — which is why old conversations return inside new arguments.',
      'Your Moon needs someone to notice that things got worse for you. You rarely ask outright; more often you show it and wait for the question.',
      'Your Moon tidies instead of crying. Cleaning, lists, a plan. It works short term and files the emotion away for later, usually the worst possible moment.',
      'Your Moon can\u2019t be angry in front of people. You save the anger for when you\u2019re alone, where it turns into rumination instead of conversation.',
      'Your Moon distrusts calm. Even in a good week you look for the catch, because it\u2019s easier to bear the moment something actually breaks.',
      'Your Moon treats sadness by planning: a trip, a course, a direction. Even if you never go, the plan itself lowers the pressure.',
      'Your Moon is ashamed to ask for help. You\u2019d rather do three times the work than say you can\u2019t cope — and then resent everyone at once.',
      'Your Moon analyses a feeling instead of feeling it. Effective right up until the emotion arrives anyway, later and stronger.',
      'Your Moon has no border between your mood and someone else\u2019s. That is why after a day among people you need silence, not another meeting.'
    ],

    asc: [
      'People see someone about to decide something, even mid-hesitation. Responsibility reaches you faster than you ask for it.',
      'You come across as calm and expensive. It opens doors, and it also means nobody asks whether you need help.',
      'You seem light and available, so strangers confide in you within ten minutes. Sometimes you leave those conversations more tired than they do.',
      'You look like someone who will take care of it, so you get asked first. Saying no costs you more than the task itself.',
      'You walk in and the temperature of the room shifts. It doesn\u2019t switch off, not even on the day you want to be invisible.',
      'You look competent, so you end up holding other people\u2019s work. You usually deliver it, which closes the loop neatly.',
      'People assume you\u2019ll agree, and usually they\u2019re right. Your politeness gets read as having no opinion, which it isn\u2019t.',
      'You seem to know more than you say. Some find that intimidating; the rest take it as a reason to trust you.',
      'You look like someone about to leave, even when you stay. So people ask about your plans more often than how you are.',
      'You read as older and more serious than you are. It helps at work and makes lightness harder.',
      'They see someone separate: likeable, but not entirely present. Getting closer takes initiative from the other side.',
      'Your face gets read as an invitation, including when it isn\u2019t. Hence the misunderstandings early on.'
    ],

    themes: {
      love: {
        t: 'Love and relationships',
        fire: 'In love you need pace and plain honesty. Caution bores you, and yet caution is exactly what saves relationships where both people move fast.',
        earth: 'In love you count repetition, not declarations. Trust takes you months to build and precisely as long to rebuild after one letdown.',
        air: 'In love you need conversation more than gestures. Silence reads to you as an alarm, though for the other person it often just means calm.',
        water: 'In love you feel the other person faster than they understand themselves. Watch the point where caretaking starts replacing being together.'
      },
      money: {
        t: 'Work and money',
        fire: 'At work you are best at the start: a new project, a crisis, a deadline. Routine burns you out faster than overload.',
        earth: 'At work your advantage is endurance. You win across years, but you have to learn to name your price before someone else names it.',
        air: 'At work you earn through contacts and fast learning. The main risk: ten directions started and none closed.',
        water: 'At work meaning leads you, not a spreadsheet. You read people well, so negotiations go better than you think — provided you don\u2019t concede first.'
      },
      calm: {
        t: 'Rest and sleep',
        fire: 'Movement restores you, not lying down. Training, the road and physical tiredness do more for your sleep than a free evening.',
        earth: 'Rhythm and familiar surroundings restore you. Your sleep breaks from chaos in the plan, not from the amount of work.',
        air: 'Quieting the head restores you, not the body. Without cutting off input you lie there tired and keep thinking.',
        water: 'Solitude after people restores you, and water: a bath, a pool, a walk by a river. Without it you carry other people\u2019s feelings all week.'
      },
      self: {
        t: 'Me and my limits',
        fire: 'Your boundary breaks where you confuse speed with agreement. Before you say yes, give yourself one day.',
        earth: 'Your boundary breaks where you stay too long to avoid starting over. The cost of staying can exceed the cost of change.',
        air: 'Your boundary breaks where you explain yourself for longer than the matter lasted. A shorter sentence is usually enough.',
        water: 'Your boundary breaks where you take someone else\u2019s emotion as a task. Compassion does not oblige you to fix it.'
      }
    },

    transitMoon: [
      'The Moon in Aries speeds up reactions. A good week to begin, a bad one to send messages in the heat.',
      'The Moon in Taurus slows the tempo. The body asks for rhythm: sleep, food and a quiet evening beat any plan.',
      'The Moon in Gemini floods you with input. Conversation comes easily, focus doesn\u2019t — keep tasks short.',
      'The Moon in Cancer raises sensitivity. Conversations about close matters go easier than usual.',
      'The Moon in Leo wants an audience. A good moment to show finished work, a poor one for fights over attention.',
      'The Moon in Virgo tidies. A good week for closing loose ends, a bad one for judging yourself.',
      'The Moon in Libra looks for balance. Reconciliation comes easier, a clear decision harder.',
      'The Moon in Scorpio deepens everything. Real conversations yes, impulsive messages no.',
      'The Moon in Sagittarius opens the horizon. Planning a trip or a course does more for your mood than resting at home.',
      'The Moon in Capricorn cools the emotions. A good moment for formalities, a weak one for talks about feelings.',
      'The Moon in Aquarius grants distance. You\u2019ll see your situation from outside — use it to decide.',
      'The Moon in Pisces blurs the edges. Rest and sleep matter more than productivity.'
    ],

    transitAspect: {
      conjunction: 'The Sun returns to your birth position. This is a week for starting, not summarising.',
      semisquare: 'Small friction between what you want and what the week demands. Nothing large, but wearing.',
      sextile: 'A favourable angle: things go easier if you make the first move. They won\u2019t happen by themselves.',
      square: 'Tension between your plans and the circumstances. A week for correcting course, not forcing it.',
      trine: 'The easiest configuration in the cycle. Spend it on what you\u2019ve postponed for months.',
      quincunx: 'Something doesn\u2019t fit and it\u2019s hard to name. A good moment for tidying small things.',
      opposition: 'Full opposition: you see your situation from the other side. Confrontation can be useful without being a row.'
    },

    pairAspect: {
      conjunction: 'Your lights sit in the same place — you understand each other without explaining, and repeat the same mistakes.',
      semisquare: 'Small, repeating friction. It won\u2019t break the relationship, but it returns in the same situations.',
      sextile: 'Ease that requires initiative. This pair works as long as somebody offers first.',
      square: 'The hardest and the most developmental configuration. It attracts and it teaches, and it costs.',
      trine: 'A natural match of rhythm. One risk only: with that much ease, nobody works on the relationship.',
      quincunx: 'A constant need to adjust. It works for couples who like talking about what\u2019s between them.',
      opposition: 'Opposite ends of the same axis. Strong pull and a permanent need to negotiate.'
    }
  };

  global.READING = (global.LANG === 'en') ? EN : PL;
})(typeof window !== 'undefined' ? window : globalThis);
