/* Español — textos del quiz v2. Misma estructura que el objeto inglés de
   js/quiz-copy.js. Trato de tú; sin marcar el género de quien lee. */
(function (global) {
  'use strict';
  if (!global.QUIZ_ALL) { return; }

  var Q = {
    phases: ['Tu enfoque', 'Datos de nacimiento', 'Vista previa'],
    back: 'Atrás',
    cont: 'Continuar',
    paidNote: 'AstroMap es una app de suscripción. Estas preguntas son gratis: con tus respuestas se arma una vista previa de tu carta.',

    goal: {
      title: '¿Qué te gustaría entender mejor ahora?',
      sub: 'Armaremos tu carta y te mostraremos por dónde empezar.',
      note: 'Puedes cambiarlo más tarde.',
      opts: {
        love:  ['Relaciones', 'Necesidades, vínculo, diferencias'],
        money: ['Trabajo y dinero', 'Fortalezas y el periodo actual'],
        calm:  ['Recuperación', 'Descanso, ritmo, ciclos lunares'],
        self:  ['A mí y mis límites', 'Reacciones y necesidades']
      }
    },

    ctx: {
      title: {
        love: '¿Qué exactamente en las relaciones?',
        money: '¿Qué exactamente en trabajo y dinero?',
        calm: '¿Qué exactamente en la recuperación?',
        self: '¿Qué exactamente sobre ti?'
      },
      sub: 'De esto depende lo que la vista previa muestra primero.',
      opts: {
        love:  { needs: 'Entender mis propias necesidades', connection: 'Mirar un vínculo concreto', differences: 'Entender mejor las diferencias' },
        money: { strengths: 'Entender mis fortalezas', period: 'Explorar el periodo actual', overview: 'Empezar con un resumen de la carta' },
        calm:  { cycles: 'Conocer los ciclos lunares', skynow: 'Empezar con el cielo de hoy', needs: 'Entender mejor mis necesidades' },
        self:  { reaction: 'Entender cómo reacciono', needs: 'Explorar mis necesidades', overview: 'Empezar con un resumen de la carta' }
      },
      unsure: 'Aún no lo sé'
    },

    dob: {
      title: 'Tu fecha de nacimiento',
      sub: 'Con la fecha empezamos a calcular tu carta.',
      day: 'Día', month: 'Mes', year: 'Año',
      decades: 'Ir a una década',
      pick: 'Gira cada rueda hasta tu fecha.',
      confirm: 'Confirmar fecha',
      clamped: 'Día cambiado a {d}: este mes tiene {n} días.',
      future: 'Esta fecha todavía no ha llegado.'
    },

    sun: {
      eyebrow: 'Primer punto de tu carta',
      part: 'Un punto entre muchos. No es una descripción completa de una persona.',
      cta: 'Añadir detalles de la carta'
    },

    tk: {
      title: '¿Sabes tu hora de nacimiento?',
      sub: 'La hora permite calcular el ascendente y las casas. Puedes seguir sin ella.',
      yes: 'Sé la hora exacta',
      yesD: 'Por ejemplo, del acta de nacimiento',
      no: 'No la sé',
      noD: 'Calcularemos lo que permiten la fecha y el lugar'
    },

    time: {
      title: 'Tu hora de nacimiento',
      sub: 'Hora local en el lugar de nacimiento.',
      hour: 'Hora', minute: 'Minuto', ampm: 'AM / PM',
      pick: 'Gira las ruedas hasta tu hora.',
      confirm: 'Confirmar hora',
      unknown: 'No sé la hora'
    },

    place: {
      title: 'Tu lugar de nacimiento',
      sub: 'El lugar fija la zona horaria en tu fecha de nacimiento y, junto con la hora, el ascendente.',
      label: 'Ciudad o localidad de nacimiento',
      placeholder: 'Empieza a escribir una ciudad…',
      noMatch: 'No se encontró nada. Prueba otra grafía, el nombre local o la ciudad grande más cercana.',
      selected: 'Lugar de nacimiento',
      change: 'Cambiar',
      confirm: 'Confirmar lugar',
      notFound: 'Mi lugar no está en la lista',
      nfTitle: 'Elige la ciudad grande más cercana',
      nfText: 'En la misma zona horaria. Usaremos su zona horaria para tu fecha, pero no mostraremos el ascendente ni las casas: necesitan tu lugar exacto.',
      nfName: 'Tu lugar (opcional, solo para mostrarlo)',
      nfBack: 'Volver a la búsqueda',
      approx: 'aproximado: zona horaria de {c}'
    },

    core: {
      title: 'La base de tu carta',
      sub: 'Sol, Luna y ascendente: tres puntos con los que empieza cualquier carta.',
      lead: 'Se muestra primero por tu respuesta. Es un punto de partida, no una conclusión sacada de tu carta.',
      moonRange: 'Sin la hora, ese día la Luna estuvo en uno de dos signos: {a} o {b}. Cambió de signo durante el día.',
      sunRange: 'Sin la hora, ese día el Sol estuvo en uno de dos signos: {a} o {b}.',
      noAscTime: 'Necesita la hora de nacimiento',
      noAscPlace: 'Necesita el lugar exacto'
    },

    extra: {
      title: '¿Qué más incluir en tu resumen?',
      sub: 'Opcional. De esto depende el orden de las secciones en la app.',
      only: 'Por ahora solo: {goal}'
    },

    start: {
      title: '¿Por dónde prefieres empezar?',
      sub: 'La app se abrirá aquí después de suscribirte. Tu carta natal no cambia, y puedes volver al cielo de hoy y a cualquier fecha que elijas.',
      opts: {
        chart: ['Por la carta natal', 'Planetas, casas, aspectos'],
        sky:   ['Por el cielo de hoy', 'Qué está activo ahora para tu carta'],
        dates: ['Por las próximas fechas', 'Fases lunares, giros, aspectos exactos']
      }
    },

    pask: {
      title: '¿Añadir la fecha de nacimiento de la persona en la que piensas?',
      sub: 'Solo la fecha. Sin nombre, sin contactos, sin detalles de la relación.',
      add: 'Añadir su fecha',
      skip: 'Continuar sin ella'
    },

    pdate: {
      title: 'Su fecha de nacimiento',
      sub: 'Sin su hora de nacimiento, su Luna es aproximada.',
      confirm: 'Confirmar fecha'
    },

    load: {
      busy: 'Preparando tu vista previa…',
      fail: 'La vista previa no se cargó. Tus respuestas están guardadas.',
      retry: 'Intentar de nuevo',
      skip: 'Continuar sin la vista previa'
    },

    prev: {
      title: {
        love: 'Tu carta con enfoque en las relaciones',
        money: 'Tu carta con enfoque en el trabajo y el dinero',
        calm: 'Tu carta con enfoque en la recuperación',
        self: 'Tu carta con enfoque en ti y tus límites'
      },
      frag: '{theme} · elemento del Sol: {element}',
      fragSrc: 'Interpretación según el elemento de tu Sol, de la biblioteca de textos de AstroMap.',
      plainTitle: 'Hoy, en palabras sencillas',
      plainNone: 'Hoy no hay aspectos exactos a tu carta. La señal más rápida es la Luna: cambia de signo cada dos o tres días.',
      details: 'Detalles',
      tabsLead: 'El mismo cálculo que en la app. Toca las pestañas.',
      noon: 'Hora de nacimiento desconocida: los puntos se muestran para las 12:00, así que la Luna es aproximada.',
      asp: {
        conjunction: 'El punto del cielo está sobre un punto de tu carta: su tema se intensifica.',
        sextile: 'Un vínculo fácil que funciona cuando lo usas.',
        square: 'Tensión entre los dos puntos: una fricción que pide una decisión.',
        trine: 'Un vínculo fluido y natural entre los dos puntos.',
        opposition: 'Los dos puntos tiran en direcciones opuestas: la tarea es el equilibrio.'
      },
      pairTitle: 'Tu Sol y su Sol',
      pair: {
        same: 'Mismo elemento ({e}): un ritmo y una forma de reaccionar parecidos.',
        fit: 'Elementos que suelen apoyarse: {a} y {b}.',
        diff: 'Elementos distintos: {a} y {b}. Un ritmo diferente, así que ayuda decir las cosas en voz alta.'
      },
      pairNote: 'Índice del método: {n} en una escala de 38–96. Un método astrológico, no un pronóstico sobre la relación.'
    },

    bridge: {
      title: 'Tu carta natal se queda. El cielo se mueve.',
      sub: 'Por eso AstroMap es una suscripción: el cálculo para tu carta cambia cada día.',
      today: 'Hoy',
      next: 'Próximamente',
      moon: 'Luna: {phase} · {s}',
      moonNext: 'La Luna cambia de signo: {s}',
      tight: 'Aspectos exactos a tu carta: {n}',
      retro: 'Retrógrados ahora: {list}',
      first: 'Primer paso sugerido en la app',
      act: {
        chart: 'Abrir tu carta natal',
        today: 'Ver el cielo de hoy para tu carta',
        match: 'Abrir compatibilidad',
        moon: 'Abrir el calendario lunar'
      },
      appTitle: 'En la app puedes',
      app: [
        'Ver qué tránsitos están activos ahora para tu carta',
        'Recalcular todo para cualquier fecha que elijas',
        'Seguir las fases lunares con un mes de antelación',
        'Guardar fechas en tu línea de tiempo'
      ]
    },

    pay: {
      features: 'Para tu enfoque',
      cta: 'Obtén tu carta completa',
      key: 'Tras el pago, Gumroad te envía por correo una clave de licencia. La introduces una vez y creas una contraseña.',
      seeYear: 'Ver el plan anual',
      backPrev: 'Volver a la vista previa'
    },

    year: {
      title: 'Plan anual',
      sub: 'La misma app, con un pago al año.',
      renew: 'al año, se renueva automáticamente',
      equiv: 'Unos $2.50 al mes, cobrados como $29.99 una vez al año más IVA.',
      cta: 'Obtén tu carta completa',
      back: 'Volver al plan mensual',
      backPrev: 'Volver a la vista previa'
    }
  };

  global.QUIZ_ALL.es = Q;
  if (global.LANG === 'es') { global.QUIZ = Q; }
})(typeof window !== 'undefined' ? window : globalThis);
