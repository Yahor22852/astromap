/* Português — тексты разбора. Структура повторяет английский объект в
   js/reading-copy.js ключ в ключ. */
(function (global) {
  'use strict';

  if (!global.READING_ALL) { return; }

  var R = {
    ui: {
      title: 'Seu mapa',
      forWhom: 'Leitura para {date}, {city}',
      secPositions: 'Suas três posições',
      secThemes: 'Suas seções',
      secWeek: 'Esta semana',
      secPair: 'Compatibilidade',
      sun: 'Sol', moon: 'Lua', asc: 'Ascendente',
      noAsc: 'Ascendente não calculado — a hora de nascimento não foi informada.',
      weekRange: 'Semana de {from} a {to}',
      weekMoon: 'A Lua da semana',
      weekSun: 'O Sol diante da sua posição',
      recalc: 'Este capítulo se recalcula toda semana a partir das posições do momento.',
      pairScore: 'Índice de compatibilidade',
      pairStrongest: 'O aspecto mais forte entre vocês',
      pairFoot: 'Um índice em escala de 38 a 96 a partir dos aspectos de Sol e Lua entre vocês. Método astrológico, não previsão.',
      noPair: 'Você não acrescentou uma segunda pessoa. Volte ao formulário para calcular a compatibilidade.',
      empty: 'Nenhum mapa salvo neste navegador. Preencha o formulário de novo.',
      back: 'Voltar ao formulário',
      goTitle: 'Isto é a fotografia de um dia',
      goText: 'Acima estão o seu mapa natal e o céu desta semana. O mapa não vai mudar; o céu sobre ele muda todo dia. No AstroMap essas mesmas posições se recalculam para qualquer data que você escolher: trânsitos com suas janelas e datas de pico, a Lua, os retrógrados, sua linha do tempo e a roda completa com as casas.',
      goCta: 'Abrir o AstroMap',
      disclaimer: 'Este conteúdo tem caráter de entretenimento e não substitui a orientação de um profissional.'
    },

    sun: [
      'Seu Sol funciona como um motor dando partida: a decisão chega antes de você ter pensado até o fim. Você começa bem e sofre na etapa em que só resta aguentar. A força está no primeiro movimento, não na décima semana.',
      'Seu Sol não aceita o ritmo de ninguém. Você precisa de tempo para decidir e depois não revisa — por isso ganha onde os outros desistem em um mês. O preço: você fica em coisas que acabaram faz tempo.',
      'Seu Sol pensa mais rápido do que fala, então a frase raramente termina onde começou. Estímulo novo é oxigênio para você, e o tédio pesa mais que o cansaço.',
      'Seu Sol lê o clima de uma sala desde a porta e leva aquilo consigo. Daí o cansaço sem causa clara. Proximidade, para você, é condição para trabalhar, não prêmio por ter trabalhado.',
      'Seu Sol precisa de plateia, e não por vaidade: você precisa que o que faz tenha testemunha e sentido. Sem isso, até o bom trabalho soa oco.',
      'Seu Sol enxerga o detalhe que estraga o conjunto e não consegue mais desenxergar. Por isso você raramente dá algo por terminado, e mais raramente ainda por bom o bastante.',
      'Seu Sol conta o conforto de todo mundo antes do próprio. Você chama isso de paz, mas em geral é a sua própria decisão adiada.',
      'Seu Sol não faz nada pela metade. Você entra inteiro ou não entra — e isso inclui ir embora. Aquilo te dá uma profundidade que os outros não têm, e um preço que você paga sozinho.',
      'Seu Sol responde à dificuldade com movimento: uma viagem, um plano, outra direção. Às vezes é coragem, às vezes é fuga, e a diferença só aparece depois.',
      'Seu Sol constrói devagar e nos próprios termos. Em dez anos você faz o que os outros adiam a vida inteira, mas trata o descanso como algo que precisa ser merecido.',
      'Seu Sol guarda distância por instinto, não por frieza. Você precisa de um espaço onde ninguém te organize, e só a partir dali se aproxima.',
      'Seu Sol absorve as emoções em volta com tanta precisão que é fácil perder o momento em que elas deixaram de ser suas. Daí a necessidade de silêncio depois das pessoas.'
    ],

    moon: [
      'Sua Lua reage na hora: estoura e logo depois fica claro. Você não segura a raiva por muito tempo e isso te protege. O problema começa quando a outra pessoa precisa de calma em vez de conversa.',
      'Sua Lua se acalma pelo corpo: comida, uma coberta, um lugar conhecido, o mesmo ritual. Mudança sem aviso te custa mais do que você admite.',
      'Sua Lua digere o que sente falando. Enquanto não contou, você não sabe direito o que sente. Silêncio dentro de uma relação soa como alarme.',
      'Sua Lua lembra de uma mágoa até a frase e o tom. Você perdoa, mas não apaga — por isso conversas antigas voltam dentro de brigas novas.',
      'Sua Lua precisa que alguém note que piorou para você. Você raramente pede de frente; mais costuma mostrar e esperar a pergunta.',
      'Sua Lua arruma em vez de chorar. Limpeza, listas, um plano. Funciona no curto prazo e arquiva a emoção para depois, quase sempre no pior momento.',
      'Sua Lua não consegue ficar com raiva na frente das pessoas. Você guarda a raiva para quando está sozinho, e ali ela vira ruminação em vez de conversa.',
      'Sua Lua desconfia da calma. Mesmo numa semana boa você procura a pegadinha, porque assim o momento em que algo de fato quebra pesa menos.',
      'Sua Lua trata a tristeza planejando: uma viagem, um curso, uma direção. Mesmo que você nunca vá, o plano já baixa a pressão.',
      'Sua Lua tem vergonha de pedir ajuda. Você prefere fazer o triplo do trabalho a dizer que não está dando conta — e depois fica com raiva de todo mundo ao mesmo tempo.',
      'Sua Lua analisa a emoção em vez de senti-la. Eficaz até o momento em que a emoção chega assim mesmo, mais tarde e mais forte.',
      'Sua Lua não tem fronteira entre o seu humor e o de outra pessoa. Por isso, depois de um dia entre gente, o que você precisa é de silêncio e não de mais um encontro.'
    ],

    asc: [
      'As pessoas veem alguém prestes a decidir algo, mesmo no meio da dúvida. A responsabilidade chega até você antes de você pedir.',
      'Você passa uma impressão de calma e de coisa cara. Isso abre portas e também faz com que ninguém pergunte se você precisa de ajuda.',
      'Você parece leve e disponível, então um desconhecido se abre em dez minutos. Às vezes você sai dessas conversas mais cansado do que ele.',
      'Você tem cara de quem vai resolver, então perguntam a você primeiro. Dizer não te custa mais do que a própria tarefa.',
      'Você entra e a temperatura da sala muda. Isso não desliga, nem no dia em que você queria passar despercebido.',
      'Você parece competente, então acaba segurando o trabalho dos outros. E em geral entrega, o que fecha o ciclo direitinho.',
      'Presumem que você vai concordar, e em geral acertam. Sua educação é lida como falta de opinião, e não é.',
      'Você parece saber mais do que diz. Para alguns isso intimida; para o resto, é motivo para confiar.',
      'Você parece alguém prestes a ir embora, mesmo quando fica. Por isso perguntam mais dos seus planos do que de como você está.',
      'Leem você como mais velho e mais sério do que é. No trabalho ajuda, e torna a leveza mais difícil.',
      'Veem alguém à parte: simpático, mas não inteiramente presente. Chegar perto exige iniciativa do outro lado.',
      'Leem seu rosto como um convite, inclusive quando não é. Daí os mal-entendidos do começo.'
    ],

    themes: {
      love: {
        t: 'Amor e relações',
        fire: 'No amor você precisa de ritmo e de honestidade direta. Cautela te entedia, e é justamente a cautela que salva relações em que os dois andam rápido.',
        earth: 'No amor você conta repetição, não declarações. Confiança leva meses para ser construída e exatamente o mesmo tempo para ser reconstruída depois de uma decepção.',
        air: 'No amor você precisa de conversa mais do que de gestos. O silêncio soa como alarme, embora para a outra pessoa muitas vezes signifique só calma.',
        water: 'No amor você sente a outra pessoa antes que ela se entenda. Fique de olho no ponto em que cuidar começa a substituir o estar junto.'
      },
      money: {
        t: 'Trabalho e dinheiro',
        fire: 'No trabalho você é melhor no começo: projeto novo, crise, prazo. A rotina te queima mais rápido que a sobrecarga.',
        earth: 'No trabalho sua vantagem é a resistência. Você ganha ao longo dos anos, mas precisa aprender a dizer seu preço antes que outra pessoa diga.',
        air: 'No trabalho você ganha por contatos e por aprender rápido. O risco principal: dez direções abertas e nenhuma fechada.',
        water: 'No trabalho quem te guia é o sentido, não a planilha. Você lê bem as pessoas, então negocia melhor do que imagina — desde que não ceda primeiro.'
      },
      calm: {
        t: 'Descanso e sono',
        fire: 'Quem te recupera é o movimento, não ficar deitado. Treino, estrada e cansaço físico fazem mais pelo seu sono do que uma noite livre.',
        earth: 'Quem te recupera são o ritmo e o ambiente conhecido. Seu sono quebra no caos do planejamento, não na quantidade de trabalho.',
        air: 'Quem te recupera é calar a cabeça, não o corpo. Sem cortar a entrada de estímulo você fica deitado, cansado, pensando.',
        water: 'Quem te recupera é a solidão depois das pessoas, e a água: um banho, uma piscina, uma caminhada à beira do rio. Sem isso você carrega emoção alheia a semana inteira.'
      },
      self: {
        t: 'Eu e meus limites',
        fire: 'Seu limite quebra onde você confunde rapidez com concordância. Antes de dizer sim, dê a si mesmo um dia.',
        earth: 'Seu limite quebra onde você fica tempo demais para não recomeçar do zero. Ficar pode custar mais do que mudar.',
        air: 'Seu limite quebra onde você se explica por mais tempo do que o assunto durou. Uma frase mais curta costuma bastar.',
        water: 'Seu limite quebra onde você toma a emoção do outro como tarefa sua. Compaixão não te obriga a consertar.'
      }
    },

    transitMoon: [
      'A Lua em Áries acelera as reações. Boa semana para começar, ruim para mandar mensagem no calor da hora.',
      'A Lua em Touro baixa o ritmo. O corpo pede regularidade: dormir, comer e uma noite tranquila ganham de qualquer plano.',
      'A Lua em Gêmeos te inunda de estímulo. Falar sai fácil, concentrar não — deixe as tarefas curtas.',
      'A Lua em Câncer aumenta a sensibilidade. Conversas sobre o que é próximo saem mais fáceis que de costume.',
      'A Lua em Leão quer plateia. Bom momento para mostrar trabalho pronto, ruim para brigar por atenção.',
      'A Lua em Virgem arruma. Boa semana para fechar pontas soltas, ruim para se julgar.',
      'A Lua em Libra procura equilíbrio. Reconciliar sai mais fácil; decidir com clareza, mais difícil.',
      'A Lua em Escorpião aprofunda tudo. Conversa de verdade sim, mensagem impulsiva não.',
      'A Lua em Sagitário abre o horizonte. Planejar uma viagem ou um curso faz mais pelo seu humor do que descansar em casa.',
      'A Lua em Capricórnio esfria as emoções. Bom momento para burocracia, fraco para falar de sentimento.',
      'A Lua em Aquário dá distância. Você vai ver sua situação de fora — use isso para decidir.',
      'A Lua em Peixes borra os contornos. Descanso e sono importam mais que produtividade.'
    ],

    transitAspect: {
      conjunction: 'O Sol volta à sua posição de nascimento. É uma semana para começar, não para fazer balanço.',
      semisquare: 'Atrito pequeno entre o que você quer e o que a semana pede. Nada grande, mas desgasta.',
      sextile: 'Ângulo favorável: as coisas saem mais fáceis se você der o primeiro passo. Sozinhas não acontecem.',
      square: 'Tensão entre seus planos e as circunstâncias. Semana para corrigir a rota, não para forçar.',
      trine: 'A configuração mais confortável do ciclo. Gaste com o que você adia há meses.',
      quincunx: 'Alguma coisa não encaixa e é difícil de nomear. Bom momento para organizar coisas pequenas.',
      opposition: 'Oposição cheia: você vê sua situação do outro lado. O confronto pode servir sem virar briga.'
    },

    pairAspect: {
      conjunction: 'As luzes de vocês estão no mesmo lugar: vocês se entendem sem explicar e repetem os mesmos erros.',
      semisquare: 'Atrito pequeno e repetido. Não quebra a relação, mas volta nas mesmas situações.',
      sextile: 'Facilidade que exige iniciativa. Esse par funciona enquanto alguém propuser primeiro.',
      square: 'A configuração mais dura e a que mais faz crescer. Atrai e ensina, e cobra.',
      trine: 'Combinação natural de ritmo. Um risco só: com tanta facilidade, ninguém trabalha a relação.',
      quincunx: 'Necessidade constante de ajuste. Funciona com casais que gostam de falar do que existe entre eles.',
      opposition: 'Pontas opostas do mesmo eixo. Atração forte e negociação permanente.'
    }
  };

  global.READING_ALL.pt = R;
  if (global.LANG === 'pt') { global.READING = R; }
})(typeof window !== 'undefined' ? window : globalThis);
