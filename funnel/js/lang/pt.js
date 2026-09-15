/* Português — строки интерфейса воронки.
   Структура повторяет английский объект в js/copy.js ключ в ключ.
   Биллинг и юридические строки сюда не переводятся — см. ниже. */
(function (global) {
  'use strict';

  var EN = global.COPY_ALL && global.COPY_ALL.en;
  if (!EN) { return; }

  var C = {
    brand: 'AstroMap App',
    progress: 'Seu mapa',                /* ≤ 14 знаков */
    ctaNext: 'Continuar',
    ctaCalc: 'Calcular meu mapa',
    ctaSummary: 'Ver o resumo',
    notNow: 'Agora não',
    computing: 'Calculando as posições do momento em que você nasceu…',

    months: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
             'jul', 'ago', 'set', 'out', 'nov', 'dez'],

    a11y: {
      progress: 'Progresso da montagem do seu mapa',
      themes: 'Seções para escolher',
      reasons: 'Por que você ainda não comprou'
    },

    pv: {
      title: 'Seu mapa dentro do AstroMap',
      sub: 'O mesmo mapa, calculado pelo mesmo código do aplicativo. Toque para explorar.',
      tabs: { today: 'Hoje', chart: 'Mapa', retro: 'Retrógrados' },
      points: {
        Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercúrio', Venus: 'Vênus', Mars: 'Marte',
        Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutão',
        Node: 'Nodo lunar', ASC: 'Ascendente', MC: 'MC'
      },
      codes: {
        Sun: 'So', Moon: 'Lu', Mercury: 'Me', Venus: 'Vê', Mars: 'Ma',
        Jupiter: 'Jú', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
        ASC: 'AC', MC: 'MC'
      },
      aspects: {
        conjunction: 'conjunção', sextile: 'sextil',
        square: 'quadratura', trine: 'trígono', opposition: 'oposição'
      },
      tone: { soft: 'fácil', hard: 'difícil', neutral: 'neutro' },
      fromSky: 'céu agora', toChart: 'seu mapa',
      moonNow: 'A Lua neste momento',
      illum: 'Iluminação',
      moonShift: 'Muda de signo',
      today: 'hoje', tomorrow: 'amanhã', inDays: 'em {n} dias',
      orb: 'orbe',
      activeNow: 'Aspectos fechados neste momento: {n}',
      lockTransits: 'Os outros {n}, com as datas exatas de pico, estão no aplicativo.',
      planets: 'Pontos do seu mapa', aspectsN: 'Aspectos do seu mapa', housesN: 'Casas',
      noHouses: 'sem hora de nascimento',
      lockChart: 'A lista de aspectos, as casas e qualquer data que você escolher estão no aplicativo.',
      retroTitle: 'Retrógrados neste momento: {n}',
      retroNow: 'anda para trás',
      inSign: 'em {s}',
      noRetro: 'Nenhum planeta está retrógrado neste momento.',
      lockRetro: 'As datas de estação, os períodos de sombra e a casa do seu mapa que eles tocam estão no aplicativo.'
    },

    map: {
      sun: 'Sol', moon: 'Lua', asc: 'Ascendente',
      sunShort: 'So', moonShort: 'Lu', ascShort: 'AC',
      waitDate: 'esperando sua data',
      waitTime: 'esperando hora e lugar',
      noAsc: 'precisa da hora de nascimento',
      firstPoint: 'O primeiro ponto do seu mapa. Os outros dois chegam assim que você acrescentar hora e lugar.'
    },

    s1: {
      eyebrow: 'Comece por uma data',
      title: 'Quando você nasceu?',
      day: 'Dia', month: 'Mês', year: 'Ano',
      resultLabel: 'Seu Sol',
      elementLabel: 'Elemento'
    },

    s2: {
      eyebrow: 'Escolha 2 ou 3',
      title: 'O que entra no seu mapa?',
      hint: 'Essas seções vão aparecer na sua leitura.',
      themes: [
        { k: 'love',  t: 'Amor e relações',      d: 'Quem combina com você, e por quê' },
        { k: 'money', t: 'Trabalho e dinheiro',  d: 'Para onde vai o seu impulso natural' },
        { k: 'calm',  t: 'Descanso e sono',      d: 'O que de fato te recupera' },
        { k: 'self',  t: 'Eu e meus limites',    d: 'Onde você entrega demais' }
      ]
    },

    s3: {
      eyebrow: 'O passo que importa',
      title: 'Hora e lugar de nascimento',
      hint: 'Sem a hora não há Ascendente — e o Ascendente é a primeira impressão que você causa.',
      hour: 'Hora', minute: 'Minuto', city: 'Cidade',
      cityPlaceholder: 'Comece a digitar a cidade…',
      cityNoMatch: 'Nenhuma cidade encontrada',
      cityManual: 'Não encontro minha cidade',
      cityManualName: 'Nome do lugar',
      cityManualOffset: 'Fuso horário (UTC)',
      cityManualApply: 'Usar este',
      cityManualNote: 'Sem coordenadas dá para calcular o Sol e a Lua, mas não o Ascendente — ele exige um lugar exato, e eu não chuto.',
      unknown: 'Não sei a hora',
      unknownNote: 'Vou calcular o Sol e a Lua. O Ascendente fica vazio até você achar a hora na certidão de nascimento.',
      moonLabel: 'Lua',
      ascLabel: 'Ascendente',
      ascEmptyShort: 'sem hora',
      ascEmptyPlace: 'precisa de lugar exato',
      stageTz: 'Localizando o céu do seu nascimento',
      stageSun: 'Calculando o Sol',
      stageMoon: 'Calculando a Lua',
      stageAsc: 'Procurando seu Ascendente',
      stageDone: 'Montando seu mapa',
      big3Lead: 'Os três pontos por onde todo mapa começa. Juntos, não separados.',
      roleSun: 'quem você é no núcleo',
      roleMoon: 'como você sente e do que precisa',
      roleAsc: 'como seu mapa encontra o mundo',
      cuspNote: 'Seu luminar está bem na fronteira de um signo — numa posição dessas, o minuto exato importa.'
    },

    s4: {
      eyebrow: 'Última pergunta',
      title: 'Vamos olhar uma relação',
      hint: 'A data de nascimento da pessoa em que você está pensando. Sem a hora eu calculo ao meio-dia, então a Lua dela pode ser aproximada.',
      skip: 'Pular esta etapa',
      scoreLabel: 'Índice de compatibilidade',
      scoleFoot: 'Um índice em escala de 38 a 96, montado a partir dos aspectos de Sol e Lua entre vocês. Método astrológico, não previsão.',
      bands: [
        { min: 0,  t: 'Trabalho duro no longo prazo', d: 'A atração existe, mas o dia a dia vai custar mais do que vocês dois esperam.' },
        { min: 55, t: 'Funciona se vocês falarem',    d: 'Nada aqui é automático. A chance é real se vocês disserem as coisas com clareza.' },
        { min: 70, t: 'Um par forte',                 d: 'As Luas de vocês seguem o mesmo ritmo. É o que os outros descrevem como calmo.' },
        { min: 84, t: 'Uma ligação rara',             d: 'Um aspecto tão exato é incomum. O resto é só o que vocês fizerem com ele.' }
      ]
    },

    s5: {
      eyebrow: 'Mapa montado',
      title: 'Seu mapa está pronto',
      coreTitle: 'Seu núcleo',
      focusTitle: 'Seu foco',
      skyTitle: 'O céu sobre o seu mapa neste momento',
      pairTitle: 'Relação',
      closeNow: 'Aspectos fechados',
      retroNow: 'Retrógrados',
      skyNote: 'Isto é calculado para agora, e amanhã é outro — o mapa de nascimento fica, o céu sobre ele se move.',
      cta: 'Entrar no seu mapa',
      ready: 'Abaixo, esse mesmo mapa dentro do aplicativo — toque para explorar.'
    },

    pw: {
      focusLine: 'Seu foco — {areas} — viaja junto com o mapa: no aplicativo é ele que decide o que você vê primeiro.',
      opensTitle: 'O que se abre',
      opens: [
        { t: 'Seu mapa natal. ', d: 'A roda, os planetas, as casas, os aspectos e o equilíbrio dos elementos — com o céu de qualquer dia num segundo anel.' },
        { t: 'O céu contra o seu mapa. ', d: 'O que está ativo agora, quando começou e quando se desfaz, com os picos ao minuto.' },
        { t: 'A Lua. ', d: 'Fase, iluminação, signo, as próximas Luas nova e cheia, um mês adiante.' },
        { t: 'Os retrógrados. ', d: 'Quem vira e quando, os períodos de sombra e qual casa do seu mapa eles tocam.' },
        { t: 'A compatibilidade. ', d: 'O índice de sinastria, os contatos mais fortes e o mapa composto de duas pessoas.' },
        { t: 'Sua linha do tempo. ', d: 'O que vem — fases, estações e aspectos exatos, com tudo o que vale a pena guardado.' }
      ],
      movesTitle: 'O céu continua se movendo',
      movesAspects: 'aspectos fechados ao seu mapa hoje',
      movesMoon: 'até a Lua passar para o signo {s}',
      movesRetro: 'planetas andando para trás',
      movesNote: 'Cada seção se recalcula para a data que você escolher. É para isso que serve a assinatura: seu mapa natal não muda, o céu sobre ele muda todo dia.'
    },

    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Seu mapa está pronto',
      planTitle: 'Plano mensal',
      cta: 'Liberar meu mapa',
      checkoutOff: 'Os pagamentos ainda não estão ligados. Seus dados foram salvos — volte daqui a pouco.'
    },

    recovery: {
      title: 'Sua leitura já está calculada',
      sub: 'Aqui vai o primeiro parágrafo. O resto espera na sua conta.',
      surveyTitle: 'O que te travou?',
      survey: [
        { k: 'price', t: 'Caro demais' },
        { k: 'trust', t: 'Não sei se funciona' },
        { k: 'what',  t: 'Não ficou claro o que eu recebo' },
        { k: 'look',  t: 'Só estou olhando' }
      ],
      answers: {
        trust: 'Aqui estão suas posições, calculadas a partir da data, da hora e do lugar que você deu. É a mesma matemática das efemérides — confira em qualquer calculadora astrológica, a diferença deve caber em um décimo de grau.',
        what: 'Você recebe acesso ao aplicativo onde o seu mapa encontra o céu do momento. Na prática:',
        look: 'Tudo bem. Seu mapa continua salvo neste navegador, e a leitura abaixo é gratuita e completa — nada nela está encoberto.'
      },
      yearCta: 'Assinar o plano anual',
      backToPlan: 'Voltar ao plano mensal',
      readFree: 'Abrir a leitura gratuita'
    },

    moonPhase: ['Lua nova', 'Crescente côncava', 'Quarto crescente', 'Crescente gibosa',
                'Lua cheia', 'Minguante gibosa', 'Quarto minguante', 'Minguante côncava'],

    signs: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
            'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'],
    signsIn: ['em Áries', 'em Touro', 'em Gêmeos', 'em Câncer', 'em Leão', 'em Virgem',
              'em Libra', 'em Escorpião', 'em Sagitário', 'em Capricórnio',
              'em Aquário', 'em Peixes'],
    elements: { fire: 'Fogo', earth: 'Terra', air: 'Ar', water: 'Água' },

    sun: [
      'Você se move primeiro e pergunta depois. Sua força é começar, não manter.',
      'Você detesta que apressem o seu ritmo. Devagar, mas até o fim.',
      'Você pensa mais rápido do que fala, então a frase raramente termina onde começou.',
      'Você lê o clima de uma sala antes de todo mundo. Daí o cansaço sem explicação.',
      'Você precisa de plateia, não por vaidade, mas para que aquilo tenha peso.',
      'Você enxerga o detalhe que estraga o conjunto. O preço: nada parece terminado.',
      'Você põe o conforto de todos antes do seu e chama isso de paz.',
      'Você não faz nada pela metade. Inteiro, ou nada — inclusive ir embora.',
      'Sua resposta à dificuldade é movimento, não conversa. Às vezes é fuga.',
      'Você reconstrói tudo do zero, se lhe derem dez anos para isso.',
      'Você mantém distância por instinto, não por frieza.',
      'Você absorve o que os outros sentem e perde o momento em que aquilo deixou de ser seu.'
    ],
    moon: [
      'Suas emoções são curtas e quentes. Estoura, e depois fica claro.',
      'Sempre as mesmas coisas te acalmam: comida, uma coberta, um cômodo conhecido.',
      'Você fala para digerir uma emoção. O silêncio te deixa inquieto.',
      'Você guarda cada mágoa, até a frase exata.',
      'Você precisa que alguém note que piorou para você.',
      'Em vez de chorar, você arruma. O corpo como caminho através do medo.',
      'Você não consegue ficar com raiva na frente de ninguém. Isso espera você ficar sozinho.',
      'Você desconfia da calma. Fica procurando onde está a pegadinha.',
      'Você trata a tristeza planejando uma viagem, mesmo uma que nunca vai fazer.',
      'Pedir ajuda te constrange. Prefere fazer o triplo do trabalho.',
      'Você analisa a emoção em vez de senti-la. Eficaz, até certo ponto.',
      'Não existe fronteira entre o seu humor e o de outra pessoa.'
    ],
    asc: [
      'As pessoas veem alguém prestes a decidir algo. Mesmo no meio da dúvida.',
      'Você passa uma impressão de calma e de coisa cara. É o que chega primeiro.',
      'Você parece leve e disponível — por isso desconhecidos se abrem com você.',
      'Você tem cara de quem vai resolver. Perguntam a você primeiro.',
      'Você entra e a temperatura da sala muda. Isso não desliga.',
      'Você parece competente, então acaba segurando o trabalho dos outros.',
      'Presumem que você vai concordar. Em geral acertam.',
      'Você parece saber mais do que diz. Isso pode intimidar.',
      'Você parece alguém prestes a ir embora. Mesmo quando fica.',
      'Leem você como mais velho e mais sério do que é. Sempre foi assim.',
      'Veem alguém à parte. Simpático, mas não inteiramente presente.',
      'Leem seu rosto como um convite. Muitas vezes sem razão.'
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

  global.COPY_ALL.pt = C;
  if (global.LANG === 'pt') { global.COPY = C; }
})(typeof window !== 'undefined' ? window : globalThis);
