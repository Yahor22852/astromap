/* quiz-copy.js — тексты квиза v2 (эксперимент против прежней воронки).

   Здесь только английский: он же запасной для любой строки, которой нет в
   языковом файле. Остальные девять языков — js/lang/<код>-quiz.js, страница
   подключает ровно один (см. index.html). Структура у всех одна и та же —
   ключ в ключ, это проверяет build.py.

   Цены здесь не живут: суммы берутся из COPY.billing (copy.js и
   js/lang/<код>.js), чтобы у одной цены был один источник. Плейсхолдер
   {price} в CTA подставляется оттуда же.

   Правила те же, что у остальных локалей: род читателя нигде не выражен,
   {s}/{e}/{a}/{b} — названия знаков и стихий в именительном падеже, {n} —
   число, и фразы построены так, чтобы форма слов от него не зависела. */
(function (global) {
  'use strict';

  var EN = {
    phases: ['Your focus', 'Birth details', 'Preview'],
    back: 'Back',
    cont: 'Continue',
    paidNote: 'AstroMap is a subscription app. These questions are free: they build a preview of your map.',

    goal: {
      title: 'What would you like to understand better right now?',
      sub: 'We will build your map and show you where to start.',
      note: 'You can change this later.',
      opts: {
        love:  ['Relationships', 'Needs, connection, differences'],
        money: ['Work and money', 'Strengths and the current period'],
        calm:  ['Recovery', 'Rest, rhythm, lunar cycles'],
        self:  ['Myself and my boundaries', 'Reactions and needs']
      }
    },

    ctx: {
      title: {
        love: 'What about relationships?',
        money: 'What about work and money?',
        calm: 'What about recovery?',
        self: 'What about yourself?'
      },
      sub: 'This decides what your preview shows first.',
      opts: {
        love:  { needs: 'Understand my own needs', connection: 'Look at a specific connection', differences: 'Understand differences better' },
        money: { strengths: 'Understand my strengths', period: 'Explore the current period', overview: 'Start with a chart overview' },
        calm:  { cycles: 'Explore lunar cycles', skynow: 'Start with the sky today', needs: 'Understand my needs better' },
        self:  { reaction: 'Understand how I react', needs: 'Explore my needs', overview: 'Start with a chart overview' }
      },
      unsure: 'Not sure yet'
    },

    dob: {
      title: 'Your date of birth',
      sub: 'We start calculating your map from the date.',
      day: 'Day', month: 'Month', year: 'Year',
      decades: 'Jump to a decade',
      pick: 'Turn each wheel to your date.',
      confirm: 'Confirm date',
      clamped: 'Day changed to {d}: this month has {n} days.',
      future: 'This date has not happened yet.'
    },

    sun: {
      eyebrow: 'First point of your map',
      part: 'One point of many. It is not a full description of you.',
      cta: 'Add chart details'
    },

    tk: {
      title: 'Do you know your birth time?',
      sub: 'Time lets us calculate the Ascendant and houses. You can continue without it.',
      yes: 'I know the exact time',
      yesD: 'For example, from a birth certificate',
      no: 'I don’t know',
      noD: 'We’ll calculate what the date and place allow'
    },

    time: {
      title: 'Your time of birth',
      sub: 'Local time at the place of birth.',
      hour: 'Hour', minute: 'Minute', ampm: 'AM / PM',
      pick: 'Turn the wheels to your time.',
      confirm: 'Confirm time',
      unknown: 'I don’t know the time'
    },

    place: {
      title: 'Your place of birth',
      sub: 'The place gives the time zone on your birth date and, together with the time, the Ascendant.',
      label: 'Town or city of birth',
      placeholder: 'Start typing a city…',
      noMatch: 'Nothing found. Try another spelling, the local name or the nearest larger city.',
      selected: 'Place of birth',
      change: 'Change',
      confirm: 'Confirm place',
      notFound: 'My place is not on the list',
      nfTitle: 'Choose the nearest larger city',
      nfText: 'In the same time zone. We use its time zone for your date but do not show the Ascendant and houses: they need your exact place.',
      nfName: 'Your place (optional, only for display)',
      nfBack: 'Back to search',
      approx: 'approximate: time zone of {c}'
    },

    core: {
      title: 'The basis of your map',
      sub: 'Sun, Moon and Ascendant: three points every map starts with.',
      lead: 'Shown first because of your answer. It is where we start, not a conclusion drawn from your chart.',
      moonRange: 'Without the time, the Moon that day was in one of two signs: {a} or {b}. It changed sign during the day.',
      sunRange: 'Without the time, the Sun that day was in one of two signs: {a} or {b}.',
      noAscTime: 'Needs the birth time',
      noAscPlace: 'Needs the exact place'
    },

    extra: {
      title: 'What else should your overview include?',
      sub: 'Optional. This sets the order of sections in the app.',
      only: 'Only this for now: {goal}'
    },

    start: {
      title: 'Where would you like to start?',
      sub: 'The app opens here after you subscribe. Your birth map stays the same, and you can come back to today’s sky and to any date you pick.',
      opts: {
        chart: ['Birth chart', 'Planets, houses, aspects'],
        sky:   ['Sky today', 'What is active for your map now'],
        dates: ['Upcoming dates', 'Moon phases, turning points, exact aspects']
      }
    },

    pask: {
      title: 'Add the birth date of the person you are thinking about?',
      sub: 'Only the date. No name, no contacts, no details about the relationship.',
      add: 'Add their date',
      skip: 'Continue without it'
    },

    pdate: {
      title: 'Their date of birth',
      sub: 'Without their birth time, their Moon is approximate.',
      confirm: 'Confirm date'
    },

    load: {
      busy: 'Preparing your preview…',
      fail: 'The preview did not load. Your answers are saved.',
      retry: 'Try again',
      skip: 'Continue without the preview'
    },

    prev: {
      title: {
        love: 'Your map with a focus on relationships',
        money: 'Your map with a focus on work and money',
        calm: 'Your map with a focus on recovery',
        self: 'Your map with a focus on you and your boundaries'
      },
      frag: '{theme} · Sun element: {element}',
      fragSrc: 'Interpretation for the element of your Sun, from the AstroMap text library.',
      plainTitle: 'Today, in plain words',
      plainNone: 'No exact aspects to your map today. The Moon is the fastest signal: it changes sign every two or three days.',
      details: 'Details',
      tabsLead: 'The same calculation as in the app. Tap the tabs.',
      noon: 'Birth time unknown: points are shown for 12:00, so the Moon is approximate.',
      asp: {
        conjunction: 'The point in the sky stands on a point of your map: its theme is emphasised.',
        sextile: 'An easy link that works when you use it.',
        square: 'Tension between the two points: friction that asks for a decision.',
        trine: 'A smooth, natural link between the two points.',
        opposition: 'The two points pull in opposite directions: the task is balance.'
      },
      pairTitle: 'Your Sun and their Sun',
      pair: {
        same: 'Same element ({e}): a similar pace and way of reacting.',
        fit: 'Elements that usually support each other: {a} and {b}.',
        diff: 'Different elements: {a} and {b}. A different pace, so it helps to say things out loud.'
      },
      pairNote: 'Method index: {n} on a 38–96 scale. An astrological method, not a forecast about the relationship.'
    },

    bridge: {
      title: 'Your birth map stays. The sky moves.',
      sub: 'That is why AstroMap is a subscription: the calculation for your map changes every day.',
      today: 'Today',
      next: 'Coming up',
      moon: 'Moon: {phase} · {s}',
      moonNext: 'The Moon changes sign: {s}',
      tight: 'Exact aspects to your map: {n}',
      retro: 'Retrograde now: {list}',
      first: 'Suggested first step in the app',
      act: {
        chart: 'Open your birth chart',
        today: 'Look at today’s sky for your map',
        match: 'Open compatibility',
        moon: 'Open the Moon calendar'
      },
      appTitle: 'In the app you can',
      app: [
        'See which transits are active for your map now',
        'Recalculate everything for any date you pick',
        'Follow Moon phases a month ahead',
        'Save dates to your timeline'
      ]
    },

    pay: {
      features: 'For your focus',
      cta: 'Get your full map',
      key: 'After payment Gumroad emails you a license key. Enter it once and set a password.',
      seeYear: 'See the annual plan',
      backPrev: 'Back to the preview'
    },

    year: {
      title: 'Annual plan',
      sub: 'The same app, paid once a year.',
      renew: 'per year, renews automatically',
      equiv: 'About $2.50 a month, charged as $29.99 once a year plus VAT.',
      cta: 'Get your full map',
      back: 'Back to the monthly plan',
      backPrev: 'Back to the preview',
      free: 'Read the free overview'
    }
  };

  global.QUIZ_ALL = { en: EN };
  global.QUIZ = EN;
})(typeof window !== 'undefined' ? window : globalThis);
