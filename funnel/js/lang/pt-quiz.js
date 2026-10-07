/* Português — textos do quiz v2. Mesma estrutura do objeto inglês em
   js/quiz-copy.js. Tratamento por você/tu neutro; sem marcar o género. */
(function (global) {
  'use strict';
  if (!global.QUIZ_ALL) { return; }

  var Q = {
    phases: ['Seu foco', 'Dados de nascimento', 'Prévia'],
    back: 'Voltar',
    cont: 'Continuar',
    paidNote: 'O AstroMap é um app por assinatura. Estas perguntas são gratuitas: com as respostas montamos uma prévia do seu mapa.',

    goal: {
      title: 'O que você gostaria de entender melhor agora?',
      sub: 'Vamos montar seu mapa e mostrar por onde começar.',
      note: 'Dá para mudar depois.',
      opts: {
        love:  ['Relacionamentos', 'Necessidades, vínculo, diferenças'],
        money: ['Trabalho e dinheiro', 'Pontos fortes e o período atual'],
        calm:  ['Recuperação', 'Descanso, ritmo, ciclos da Lua'],
        self:  ['Eu e meus limites', 'Reações e necessidades']
      }
    },

    ctx: {
      title: {
        love: 'O que exatamente nos relacionamentos?',
        money: 'O que exatamente em trabalho e dinheiro?',
        calm: 'O que exatamente na recuperação?',
        self: 'O que exatamente sobre você?'
      },
      sub: 'Disso depende o que a prévia mostra primeiro.',
      opts: {
        love:  { needs: 'Entender minhas próprias necessidades', connection: 'Olhar um vínculo específico', differences: 'Entender melhor as diferenças' },
        money: { strengths: 'Entender meus pontos fortes', period: 'Explorar o período atual', overview: 'Começar por uma visão geral do mapa' },
        calm:  { cycles: 'Conhecer os ciclos da Lua', skynow: 'Começar pelo céu de hoje', needs: 'Entender melhor minhas necessidades' },
        self:  { reaction: 'Entender como eu reajo', needs: 'Explorar minhas necessidades', overview: 'Começar por uma visão geral do mapa' }
      },
      unsure: 'Ainda não sei'
    },

    dob: {
      title: 'Sua data de nascimento',
      sub: 'Com a data começamos a calcular seu mapa.',
      day: 'Dia', month: 'Mês', year: 'Ano',
      pick: 'Gire cada roda até a sua data.',
      confirm: 'Confirmar data',
      clamped: 'Dia alterado para {d}: este mês tem {n} dias.',
      future: 'Esta data ainda não chegou.'
    },

    sun: {
      eyebrow: 'Primeiro ponto do seu mapa',
      part: 'Um ponto entre muitos. Não é uma descrição completa de uma pessoa.',
      cta: 'Adicionar detalhes do mapa'
    },

    tk: {
      title: 'Você sabe sua hora de nascimento?',
      sub: 'A hora permite calcular o ascendente e as casas. Dá para continuar sem ela.',
      yes: 'Sei a hora exata',
      yesD: 'Por exemplo, pela certidão de nascimento',
      no: 'Não sei',
      noD: 'Calculamos o que a data e o lugar permitem'
    },

    time: {
      title: 'Sua hora de nascimento',
      sub: 'Hora local no lugar de nascimento.',
      hour: 'Hora', minute: 'Minuto', ampm: 'AM / PM',
      pick: 'Gire as rodas até a sua hora.',
      confirm: 'Confirmar hora',
      unknown: 'Não sei a hora'
    },

    place: {
      title: 'Seu lugar de nascimento',
      sub: 'O lugar define o fuso horário na sua data de nascimento e, junto com a hora, o ascendente.',
      label: 'Cidade ou localidade de nascimento',
      placeholder: 'Comece a digitar uma cidade…',
      noMatch: 'Nada encontrado. Tente outra grafia, o nome local ou a cidade grande mais próxima.',
      selected: 'Lugar de nascimento',
      change: 'Alterar',
      confirm: 'Confirmar lugar',
      notFound: 'Meu lugar não está na lista',
      nfTitle: 'Escolha a cidade grande mais próxima',
      nfText: 'No mesmo fuso horário. Usamos o fuso dela para a sua data, mas não mostramos o ascendente nem as casas: eles precisam do lugar exato.',
      nfName: 'Seu lugar (opcional, só para exibir)',
      nfBack: 'Voltar à busca',
      approx: 'aproximado: fuso horário de {c}'
    },

    core: {
      title: 'A base do seu mapa',
      sub: 'Sol, Lua e ascendente: três pontos com que todo mapa começa.',
      lead: 'Mostrado primeiro por causa da sua resposta. É um ponto de partida, não uma conclusão tirada do seu mapa.',
      moonRange: 'Sem a hora, naquele dia a Lua esteve em um de dois signos: {a} ou {b}. Ela mudou de signo durante o dia.',
      sunRange: 'Sem a hora, naquele dia o Sol esteve em um de dois signos: {a} ou {b}.',
      noAscTime: 'Precisa da hora de nascimento',
      noAscPlace: 'Precisa do lugar exato'
    },

    extra: {
      title: 'O que mais incluir na sua visão geral?',
      sub: 'Opcional. Disso depende a ordem das seções no app.',
      only: 'Por enquanto só: {goal}'
    },

    start: {
      title: 'Por onde prefere começar?',
      sub: 'O app abre aqui depois da assinatura. Seu mapa natal não muda, e dá para voltar ao céu de hoje e a qualquer data escolhida.',
      opts: {
        chart: ['Pelo mapa natal', 'Planetas, casas, aspectos'],
        sky:   ['Pelo céu de hoje', 'O que está ativo agora para o seu mapa'],
        dates: ['Pelas próximas datas', 'Fases da Lua, viradas, aspectos exatos']
      }
    },

    pask: {
      title: 'Adicionar a data de nascimento da pessoa em quem você pensa?',
      sub: 'Só a data. Sem nome, sem contatos, sem detalhes da relação.',
      add: 'Adicionar a data',
      skip: 'Continuar sem ela'
    },

    pdate: {
      title: 'Data de nascimento da pessoa',
      sub: 'Sem a hora de nascimento, a Lua dessa pessoa é aproximada.',
      confirm: 'Confirmar data'
    },

    load: {
      busy: 'Preparando sua prévia…',
      fail: 'A prévia não carregou. Suas respostas estão salvas.',
      retry: 'Tentar de novo',
      skip: 'Continuar sem a prévia'
    },

    prev: {
      title: {
        love: 'Seu mapa com foco em relacionamentos',
        money: 'Seu mapa com foco em trabalho e dinheiro',
        calm: 'Seu mapa com foco em recuperação',
        self: 'Seu mapa com foco em você e seus limites'
      },
      frag: '{theme} · elemento do Sol: {element}',
      fragSrc: 'Interpretação pelo elemento do seu Sol, da biblioteca de textos do AstroMap.',
      plainTitle: 'Hoje, em palavras simples',
      plainNone: 'Hoje não há aspectos exatos ao seu mapa. O sinal mais rápido é a Lua: ela muda de signo a cada dois ou três dias.',
      details: 'Detalhes',
      tabsLead: 'O mesmo cálculo do app. Toque nas abas.',
      noon: 'Hora de nascimento desconhecida: os pontos aparecem para 12:00, então a Lua é aproximada.',
      asp: {
        conjunction: 'O ponto do céu está sobre um ponto do seu mapa: o tema dele fica em destaque.',
        sextile: 'Uma ligação fácil que funciona quando você a usa.',
        square: 'Tensão entre os dois pontos: um atrito que pede uma decisão.',
        trine: 'Uma ligação fluida e natural entre os dois pontos.',
        opposition: 'Os dois pontos puxam para lados opostos: a tarefa é o equilíbrio.'
      },
      pairTitle: 'Seu Sol e o Sol da pessoa',
      pair: {
        same: 'Mesmo elemento ({e}): ritmo e jeito de reagir parecidos.',
        fit: 'Elementos que costumam se apoiar: {a} e {b}.',
        diff: 'Elementos diferentes: {a} e {b}. Um ritmo diferente, então ajuda dizer as coisas em voz alta.'
      },
      pairNote: 'Índice do método: {n} numa escala de 38–96. Um método astrológico, não uma previsão sobre a relação.'
    },

    bridge: {
      title: 'Seu mapa natal fica. O céu se move.',
      sub: 'Por isso o AstroMap é uma assinatura: o cálculo para o seu mapa muda todos os dias.',
      today: 'Hoje',
      next: 'Em breve',
      moon: 'Lua: {phase} · {s}',
      moonNext: 'A Lua muda de signo: {s}',
      tight: 'Aspectos exatos ao seu mapa: {n}',
      retro: 'Retrógrados agora: {list}',
      first: 'Primeiro passo sugerido no app',
      act: {
        chart: 'Abrir seu mapa natal',
        today: 'Ver o céu de hoje para o seu mapa',
        match: 'Abrir compatibilidade',
        moon: 'Abrir o calendário lunar'
      },
      appTitle: 'No app você pode',
      app: [
        'Ver quais trânsitos estão ativos agora para o seu mapa',
        'Recalcular tudo para qualquer data escolhida',
        'Acompanhar as fases da Lua com um mês de antecedência',
        'Salvar datas na sua linha do tempo'
      ]
    },

    pay: {
      features: 'Para o seu foco',
      cta: 'Receber meu mapa completo',
      key: 'Depois do pagamento, você cria uma senha aqui mesmo — é o seu acesso em qualquer dispositivo.',
      seeYear: 'Ver o plano anual',
      backPrev: 'Voltar à prévia'
    },

    year: {
      title: 'Plano anual',
      sub: 'O mesmo app, pago uma vez por ano.',
      renew: 'por ano, renova automaticamente',
      equiv: 'Cerca de $2.50 por mês, cobrados como $29.99 uma vez por ano mais IVA.',
      cta: 'Receber meu mapa completo',
      back: 'Voltar ao plano mensal',
      backPrev: 'Voltar à prévia'
    }
  };

  global.QUIZ_ALL.pt = Q;
  if (global.LANG === 'pt') { global.QUIZ = Q; }
})(typeof window !== 'undefined' ? window : globalThis);
