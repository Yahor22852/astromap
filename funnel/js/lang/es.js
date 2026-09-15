/* Español — строки интерфейса воронки.
   Структура повторяет английский объект в js/copy.js ключ в ключ.
   Биллинг и юридические строки сюда не переводятся — см. ниже. */
(function (global) {
  'use strict';

  var EN = global.COPY_ALL && global.COPY_ALL.en;
  if (!EN) { return; }

  var C = {
    brand: 'AstroMap App',
    progress: 'Tu mapa',                 /* ≤ 14 знаков */
    ctaNext: 'Continuar',
    ctaCalc: 'Calcular mi mapa',
    ctaSummary: 'Ver el resumen',
    notNow: 'Ahora no',
    computing: 'Calculando las posiciones del momento en que naciste…',

    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
             'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],

    a11y: {
      progress: 'Avance en la creación de tu mapa',
      themes: 'Secciones para elegir',
      reasons: 'Por qué aún no compras'
    },

    pv: {
      title: 'Tu mapa dentro de AstroMap',
      sub: 'El mismo mapa, calculado con el mismo código que la app. Toca para explorar.',
      tabs: { today: 'Hoy', chart: 'Carta', retro: 'Retrógrados' },
      points: {
        Sun: 'Sol', Moon: 'Luna', Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte',
        Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Neptuno', Pluto: 'Plutón',
        Node: 'Nodo lunar', ASC: 'Ascendente', MC: 'MC'
      },
      codes: {
        Sun: 'So', Moon: 'Lu', Mercury: 'Me', Venus: 'Ve', Mars: 'Ma',
        Jupiter: 'Ju', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
        ASC: 'AC', MC: 'MC'
      },
      /* Аспекты существительными: строка собирается как
         «Sol · trígono · Luna», без согласования названий. */
      aspects: {
        conjunction: 'conjunción', sextile: 'sextil',
        square: 'cuadratura', trine: 'trígono', opposition: 'oposición'
      },
      tone: { soft: 'fácil', hard: 'difícil', neutral: 'neutro' },
      fromSky: 'cielo ahora', toChart: 'tu mapa',
      moonNow: 'La Luna ahora',
      illum: 'Iluminación',
      moonShift: 'Cambia de signo',
      today: 'hoy', tomorrow: 'mañana', inDays: 'en {n} días',
      orb: 'orbe',
      activeNow: 'Aspectos estrechos ahora: {n}',
      lockTransits: 'Los otros {n}, con las fechas exactas de pico, están en la app.',
      planets: 'Puntos en tu carta', aspectsN: 'Aspectos en tu carta', housesN: 'Casas',
      noHouses: 'sin hora de nacimiento',
      lockChart: 'La lista de aspectos, las casas y cualquier fecha que elijas están en la app.',
      retroTitle: 'Retrógrados ahora: {n}',
      retroNow: 'movimiento retrógrado',
      inSign: 'en {s}',
      noRetro: 'Ahora mismo ningún planeta está retrógrado.',
      lockRetro: 'Las fechas de los giros, los periodos de sombra y la casa de tu carta que tocan están en la app.'
    },

    map: {
      sun: 'Sol', moon: 'Luna', asc: 'Ascendente',
      sunShort: 'So', moonShort: 'Lu', ascShort: 'AC',
      waitDate: 'esperando tu fecha',
      waitTime: 'esperando hora y lugar',
      noAsc: 'hace falta la hora',
      firstPoint: 'El primer punto de tu mapa. Los otros dos llegan cuando añadas la hora y el lugar.'
    },

    s1: {
      eyebrow: 'Empecemos por una fecha',
      title: '¿Cuándo naciste?',
      day: 'Día', month: 'Mes', year: 'Año',
      resultLabel: 'Tu Sol',
      elementLabel: 'Elemento'
    },

    s2: {
      eyebrow: 'Elige 2 o 3',
      title: '¿Qué entra en tu mapa?',
      hint: 'Estas secciones aparecerán en tu lectura.',
      themes: [
        { k: 'love',  t: 'Amor y relaciones', d: 'Quién encaja contigo y por qué' },
        { k: 'money', t: 'Trabajo y dinero',  d: 'Dónde está tu fuerza natural' },
        { k: 'calm',  t: 'Descanso y sueño',  d: 'Qué te repone de verdad' },
        { k: 'self',  t: 'Yo y mis límites',  d: 'Dónde das de más' }
      ]
    },

    s3: {
      eyebrow: 'El paso que importa',
      title: 'Hora y lugar de nacimiento',
      hint: 'Sin la hora no hay Ascendente, y el Ascendente es la primera impresión que dejas.',
      hour: 'Hora', minute: 'Minuto', city: 'Ciudad',
      cityPlaceholder: 'Escribe el nombre de una ciudad…',
      cityNoMatch: 'No se encontró la ciudad',
      cityManual: 'No encuentro mi ciudad',
      cityManualName: 'Nombre del lugar',
      cityManualOffset: 'Zona horaria (UTC)',
      cityManualApply: 'Usar esto',
      cityManualNote: 'Sin coordenadas puedo calcular el Sol y la Luna, pero no el Ascendente: para eso hace falta el lugar exacto, y no lo voy a adivinar.',
      unknown: 'No sé la hora',
      unknownNote: 'Calcularé el Sol y la Luna. El Ascendente queda vacío hasta que encuentres la hora en tu certificado de nacimiento.',
      moonLabel: 'Luna',
      ascLabel: 'Ascendente',
      ascEmptyShort: 'sin hora de nacimiento',
      ascEmptyPlace: 'hace falta el lugar exacto',
      stageTz: 'Ubicando el cielo de tu nacimiento',
      stageSun: 'Calculando el Sol',
      stageMoon: 'Calculando la Luna',
      stageAsc: 'Buscando tu Ascendente',
      stageDone: 'Componiendo tu mapa',
      big3Lead: 'Los tres puntos con los que empieza cualquier carta. Juntos, no por separado.',
      roleSun: 'quién eres en el fondo',
      roleMoon: 'cómo sientes y qué necesitas',
      roleAsc: 'cómo tu carta se presenta ante el mundo',
      cuspNote: 'Tu luz cae justo en el límite entre dos signos: con una posición así de ajustada, el minuto exacto importa.'
    },

    s4: {
      eyebrow: 'Última pregunta',
      title: 'Veamos una relación',
      hint: 'La fecha de nacimiento de la persona en la que piensas. Sin hora calculo a mediodía, así que su Luna puede ser aproximada.',
      skip: 'Saltar este paso',
      scoreLabel: 'Índice de compatibilidad',
      scoleFoot: 'Un índice en una escala de 38 a 96, construido a partir de los aspectos entre el Sol y la Luna de ambos. Es método astrológico, no un pronóstico.',
      bands: [
        { min: 0,  t: 'Difícil a largo plazo',      d: 'La atracción existe, pero el día a día va a costar a los dos más de lo que parece.' },
        { min: 55, t: 'Funciona si hay diálogo',    d: 'Aquí nada es automático. Hay una posibilidad real si las cosas se dicen claras.' },
        { min: 70, t: 'Una pareja sólida',          d: 'Las dos Lunas llevan el mismo ritmo. Es el tipo de relación que desde fuera se describe como tranquila.' },
        { min: 84, t: 'Una conexión rara',          d: 'Un aspecto así de exacto no es frecuente. El resto depende solo de lo que se haga con él.' }
      ]
    },

    s5: {
      eyebrow: 'Mapa completo',
      title: 'Tu mapa está listo',
      coreTitle: 'Tu núcleo',
      focusTitle: 'Tu enfoque',
      skyTitle: 'El cielo sobre tu mapa ahora',
      pairTitle: 'Relación',
      closeNow: 'Aspectos estrechos',
      retroNow: 'Retrógrados',
      skyNote: 'Esto está calculado para ahora mismo y mañana será distinto: el mapa de nacimiento se queda, el cielo sobre él se mueve.',
      cta: 'Entra en tu mapa',
      ready: 'Abajo está ese mismo mapa dentro de la app: toca para explorar.'
    },

    pw: {
      focusLine: 'Tu enfoque —{areas}— viaja con el mapa: en la app decide qué ves primero.',
      opensTitle: 'Qué se abre',
      opens: [
        { t: 'Tu carta natal. ', d: 'La rueda, los planetas, las casas, los aspectos y el balance de elementos, con el cielo de cualquier día en un segundo anillo.' },
        { t: 'El cielo sobre tu carta. ', d: 'Lo que está activo ahora, cuándo empezó y cuándo se apaga, con las fechas de pico al minuto.' },
        { t: 'La Luna. ', d: 'Fase, iluminación, signo, la próxima luna nueva y la próxima llena, un mes por delante.' },
        { t: 'Retrógrados. ', d: 'Quién gira y cuándo, los periodos de sombra y qué casa de tu carta tocan.' },
        { t: 'Compatibilidad. ', d: 'El índice de sinastría, los contactos más fuertes y la carta compuesta de dos personas.' },
        { t: 'Tu línea de tiempo. ', d: 'Lo que viene: fases, giros y aspectos exactos, con la opción de guardar lo que valga la pena.' }
      ],
      movesTitle: 'El cielo no se detiene',
      movesAspects: 'aspectos estrechos a tu carta hoy',
      movesMoon: 'hasta que la Luna entre en {s}',
      movesRetro: 'planetas en movimiento retrógrado',
      movesNote: 'Cada sección se recalcula para la fecha que elijas. Para eso es la suscripción: tu carta natal no cambia, el cielo sobre ella cambia todos los días.'
    },

    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Tu mapa está listo',
      planTitle: 'Plan mensual',
      cta: 'Desbloquear mi mapa',
      checkoutOff: 'Los pagos aún no están conectados. Tus datos quedan guardados: vuelve en un momento.'
    },

    recovery: {
      title: 'Tu lectura ya está calculada',
      sub: 'Este es el primer párrafo. El resto te espera en tu cuenta.',
      surveyTitle: '¿Qué te detuvo?',
      survey: [
        { k: 'price', t: 'Demasiado caro' },
        { k: 'trust', t: 'Dudo que funcione' },
        { k: 'what',  t: 'No queda claro qué recibo' },
        { k: 'look',  t: 'Solo estoy mirando' }
      ],
      answers: {
        trust: 'Estas son tus posiciones, calculadas con la fecha, la hora y el lugar que diste. Son las mismas matemáticas de las efemérides: compruébalas en cualquier calculadora astrológica y deberían coincidir con una décima de grado.',
        what: 'Obtienes acceso a la app donde tu carta se cruza con el cielo actual. En concreto:',
        look: 'Está bien. Tu mapa queda guardado en este navegador y la lectura de abajo es gratuita y completa: no hay nada tapado.'
      },
      yearCta: 'Elegir el plan anual',
      backToPlan: 'Volver al plan mensual',
      readFree: 'Abrir la lectura gratis'
    },

    moonPhase: ['Luna nueva', 'Luna creciente', 'Cuarto creciente', 'Gibosa creciente',
                'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Luna menguante'],

    signs: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo',
            'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
    signsIn: ['en Aries', 'en Tauro', 'en Géminis', 'en Cáncer', 'en Leo', 'en Virgo',
              'en Libra', 'en Escorpio', 'en Sagitario', 'en Capricornio',
              'en Acuario', 'en Piscis'],
    elements: { fire: 'Fuego', earth: 'Tierra', air: 'Aire', water: 'Agua' },

    sun: [
      'Primero te mueves y luego preguntas. Tu fuerza está en empezar, no en sostener.',
      'No soportas que alguien acelere tu ritmo. Despacio, pero hasta el final.',
      'Piensas más rápido de lo que hablas, así que tus frases casi nunca terminan donde empezaron.',
      'Captas el ánimo de una sala antes que nadie. De ahí el cansancio sin explicación.',
      'Necesitas público, no por vanidad, sino para que lo que haces signifique algo.',
      'Ves el detalle que arruina el conjunto. El precio: nada te parece terminado.',
      'Eliges la comodidad de los demás antes que la tuya y a eso lo llamas paz.',
      'No haces nada a medias. O entras del todo o no entras, y eso incluye irte.',
      'Tu respuesta a lo difícil es moverte, no hablarlo. A veces es huida.',
      'Lo construyes entero desde cero, aunque te lleve diez años.',
      'Guardas distancia por instinto, no por frialdad.',
      'Absorbes lo que sienten los demás y se te pasa el momento en que dejó de ser tuyo.'
    ],
    moon: [
      'Sientes corto y fuerte. Estalla y después queda el aire limpio.',
      'Siempre te calma lo mismo: comer, una manta, una habitación conocida.',
      'Hablas para digerir lo que sientes. El silencio te inquieta.',
      'Recuerdas cada desaire, hasta la frase exacta.',
      'Necesitas que alguien note que la cosa se te puso más difícil.',
      'En vez de llorar, ordenas. El cuerpo como salida del miedo.',
      'No puedes mostrar rabia delante de nadie. Espera a que estés a solas.',
      'Desconfías de la calma. Buscas dónde está la trampa.',
      'Curas la tristeza planeando un viaje, aunque nunca lo hagas.',
      'Te da vergüenza pedir ayuda. Prefieres hacer el triple de trabajo.',
      'Analizas lo que sientes en vez de sentirlo. Funciona, hasta cierto punto.',
      'No hay frontera entre tu ánimo y el de otra persona.'
    ],
    asc: [
      'La gente ve a alguien a punto de decidir algo. Incluso en plena duda.',
      'Das una imagen de calma y de algo caro. Eso llega primero.',
      'Transmites ligereza y disponibilidad, y por eso los desconocidos te cuentan su vida.',
      'Pareces alguien que se va a hacer cargo. Te preguntan a ti primero.',
      'Entras y cambia la temperatura de la sala. Eso no se apaga.',
      'Das imagen de competencia, así que acabas cargando con el trabajo de otros.',
      'La gente da por hecho que vas a decir que sí. Casi siempre acierta.',
      'Parece que sabes más de lo que dices. Eso puede intimidar.',
      'Pareces alguien a punto de irse. Incluso cuando te quedas.',
      'Se te lee con más edad y más seriedad de la que tienes. Siempre ha sido así.',
      'Ven a alguien aparte. Alguien que cae bien, pero no está del todo presente.',
      'La gente lee tu cara como una invitación. Muchas veces se equivoca.'
    ]
  };

  /* Цена, условия списания и согласие с документами остаются английскими
     намеренно: это не текст интерфейса, а обязательства перед человеком,
     и машинный перевод суммы, срока отмены или ссылки на условия —
     это то, что разбирают в спорах по автопродлению. Их пишет юрист под
     каждый рынок, вместе с валютой. */
  C.billing = EN.billing;
  C.paywall.legal = EN.paywall.legal;
  C.paywall.terms = EN.paywall.terms;
  C.paywall.privacy = EN.paywall.privacy;
  C.paywall.privacyInline = EN.paywall.privacyInline;
  C.recovery.yearTitle = EN.recovery.yearTitle;
  C.recovery.answers.price = EN.recovery.answers.price;

  global.COPY_ALL.es = C;
  if (global.LANG === 'es') { global.COPY = C; }
})(typeof window !== 'undefined' ? window : globalThis);
