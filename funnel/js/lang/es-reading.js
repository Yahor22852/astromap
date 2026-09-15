/* Español — тексты разбора. Структура повторяет английский объект в
   js/reading-copy.js ключ в ключ. */
(function (global) {
  'use strict';

  if (!global.READING_ALL) { return; }

  var R = {
    ui: {
      title: 'Tu mapa',
      forWhom: 'Lectura para {date}, {city}',
      secPositions: 'Tus tres posiciones',
      secThemes: 'Tus secciones',
      secWeek: 'Esta semana',
      secPair: 'Compatibilidad',
      sun: 'Sol', moon: 'Luna', asc: 'Ascendente',
      noAsc: 'Ascendente sin calcular: no diste la hora de nacimiento.',
      weekRange: 'Semana del {from} al {to}',
      weekMoon: 'La Luna de la semana',
      weekSun: 'El Sol frente a tu posición',
      recalc: 'Este capítulo se recalcula cada semana con las posiciones del momento.',
      pairScore: 'Índice de compatibilidad',
      pairStrongest: 'El aspecto más fuerte entre ustedes',
      pairFoot: 'Un índice en escala de 38 a 96 a partir de los aspectos de Sol y Luna entre ambos. Método astrológico, no un pronóstico.',
      noPair: 'No añadiste una segunda persona. Vuelve al formulario para calcular la compatibilidad.',
      empty: 'No hay ningún mapa guardado en este navegador. Rellena el formulario otra vez.',
      back: 'Volver al formulario',
      goTitle: 'Esto es la foto de un solo día',
      goText: 'Arriba tienes tu carta natal y el cielo de esta semana. La carta no va a cambiar; el cielo sobre ella cambia cada día. En AstroMap esas mismas posiciones se recalculan para la fecha que elijas: tránsitos con sus ventanas y fechas de pico, la Luna, las retrogradaciones, tu línea de tiempo y la rueda completa con las casas.',
      goCta: 'Abrir AstroMap',
      disclaimer: 'Este contenido tiene fines de entretenimiento y no sustituye el consejo de un profesional.'
    },

    sun: [
      'Tu Sol funciona como un motor al arrancar: la decisión aterriza antes de haberla pensado. Empiezas bien y te cuesta la etapa en la que solo hay que aguantar. La fuerza está en el primer movimiento, no en la décima semana.',
      'Tu Sol no acepta el ritmo de nadie más. Necesitas tiempo para decidir y después no lo revisas, por eso ganas donde otros abandonan al mes. El precio: te quedas en cosas que terminaron hace tiempo.',
      'Tu Sol piensa más rápido de lo que habla, así que la frase rara vez termina donde empezó. El estímulo nuevo es oxígeno para ti, y el aburrimiento pesa más que el cansancio.',
      'Tu Sol lee el ánimo de una sala desde la puerta y se lo lleva puesto. De ahí el cansancio sin causa clara. La cercanía es para ti una condición para trabajar, no un premio por hacerlo.',
      'Tu Sol necesita público, y no por vanidad: necesitas que lo que haces tenga testigo y sentido. Sin eso, hasta el buen trabajo suena hueco.',
      'Tu Sol ve el detalle que arruina el conjunto y ya no puede dejar de verlo. Por eso rara vez das algo por terminado, y menos aún por suficientemente bueno.',
      'Tu Sol cuenta la comodidad de todos los demás antes que la propia. Lo llamas paz, pero más a menudo es tu propia decisión aplazada.',
      'Tu Sol no hace nada a medias. Entras del todo o no entras, y eso incluye irse. Eso te da una profundidad que otros no tienen y un precio que pagas a solas.',
      'Tu Sol responde a la dificultad con movimiento: un viaje, un plan, otra dirección. A veces es valor y a veces es huida, y la diferencia solo se ve después.',
      'Tu Sol construye despacio y en sus propios términos. Harás en diez años lo que otros aplazan de por vida, pero tratas el descanso como algo que hay que merecer.',
      'Tu Sol guarda distancia por instinto, no por frialdad. Necesitas un espacio donde nadie te ordene, y solo desde ahí te acercas.',
      'Tu Sol absorbe lo que sienten los demás con tanta precisión que es fácil perderse el momento en que eso dejó de ser tuyo. De ahí la necesidad de silencio después de la gente.'
    ],

    moon: [
      'Tu Luna reacciona al instante: estalla y enseguida se aclara. No sostienes el enfado mucho tiempo y eso te protege. El problema empieza cuando la otra persona necesita calma en vez de conversación.',
      'Tu Luna se calma por el cuerpo: comida, una manta, un sitio conocido, el mismo ritual. Un cambio sin aviso te cuesta más de lo que estás dispuesto a admitir.',
      'Tu Luna digiere lo que siente hablándolo. Hasta que no lo has contado, no sabes del todo qué sientes. El silencio dentro de una relación te suena a alarma.',
      'Tu Luna recuerda una herida hasta la frase y el tono. Perdonas, pero no borras, y por eso vuelven conversaciones viejas dentro de discusiones nuevas.',
      'Tu Luna necesita que alguien note que la cosa empeoró para ti. Rara vez lo pides de frente; más bien lo muestras y esperas la pregunta.',
      'Tu Luna ordena en lugar de llorar. Limpiar, listas, un plan. Funciona a corto plazo y archiva la emoción para después, casi siempre en el peor momento.',
      'Tu Luna no sabe enfadarse delante de nadie. Guardas el enfado para cuando estás a solas, y allí se convierte en darle vueltas en vez de en conversación.',
      'Tu Luna desconfía de la calma. Incluso en una buena semana buscas dónde está la trampa, porque así se lleva mejor el momento en que algo se rompe de verdad.',
      'Tu Luna trata la tristeza planificando: un viaje, un curso, una dirección. Aunque nunca vayas, el plan ya baja la presión.',
      'Tu Luna se avergüenza de pedir ayuda. Prefieres hacer el triple de trabajo antes que decir que no puedes, y después te enfadas con todo el mundo a la vez.',
      'Tu Luna analiza la emoción en lugar de sentirla. Eficaz hasta que la emoción llega igual, más tarde y más fuerte.',
      'Tu Luna no tiene frontera entre tu ánimo y el de otra persona. Por eso, después de un día entre gente, lo que necesitas es silencio y no otra cita.'
    ],

    asc: [
      'La gente ve a alguien a punto de decidir algo, incluso en plena duda. La responsabilidad te llega antes de pedirla.',
      'Das una impresión de calma y de algo caro. Eso abre puertas y también hace que nadie pregunte si necesitas ayuda.',
      'Pareces ligero y disponible, así que un desconocido se confía contigo en diez minutos. A veces sales de esas charlas más cansado que la otra persona.',
      'Tienes cara de que te vas a encargar, así que te preguntan primero a ti. Decir que no te cuesta más que la propia tarea.',
      'Entras y la temperatura de la sala cambia. Eso no se apaga, ni siquiera el día en que quieres pasar inadvertido.',
      'Pareces competente, así que acabas sosteniendo el trabajo de otros. Y normalmente lo entregas, con lo cual el círculo se cierra solo.',
      'La gente da por hecho que vas a estar de acuerdo, y suele acertar. Tu educación se lee como falta de opinión, y no lo es.',
      'Pareces saber más de lo que dices. A algunos eso les intimida; al resto les da motivos para confiar en ti.',
      'Pareces alguien a punto de marcharse, incluso cuando te quedas. Por eso te preguntan por tus planes más que por cómo estás.',
      'Se te lee mayor y más serio de lo que eres. Ayuda en el trabajo y vuelve más difícil la ligereza.',
      'Ven a alguien aparte: cae bien, pero no está del todo presente. Acercarse exige iniciativa del otro lado.',
      'Tu cara se lee como una invitación, también cuando no lo es. De ahí los malentendidos del principio.'
    ],

    themes: {
      love: {
        t: 'Amor y relaciones',
        fire: 'En el amor necesitas ritmo y honestidad directa. La prudencia te aburre, y resulta que la prudencia es justo lo que salva las relaciones donde los dos van rápido.',
        earth: 'En el amor cuentas la repetición, no las declaraciones. La confianza tarda meses en construirse y exactamente lo mismo en reconstruirse tras un fallo.',
        air: 'En el amor necesitas conversación más que gestos. El silencio te suena a alarma, aunque para la otra persona muchas veces solo signifique calma.',
        water: 'En el amor entiendes a la otra persona antes de que ella se entienda. Vigila el punto en el que cuidar empieza a sustituir a estar juntos.'
      },
      money: {
        t: 'Trabajo y dinero',
        fire: 'En el trabajo eres mejor al principio: un proyecto nuevo, una crisis, una fecha límite. La rutina te quema más rápido que la sobrecarga.',
        earth: 'En el trabajo tu ventaja es la resistencia. Ganas a lo largo de los años, pero tienes que aprender a decir tu precio antes de que lo diga otro.',
        air: 'En el trabajo ganas por contactos y por aprender rápido. El riesgo principal: diez direcciones abiertas y ninguna cerrada.',
        water: 'En el trabajo te guía el sentido, no una hoja de cálculo. Lees bien a la gente, así que negocias mejor de lo que crees, siempre que no cedas tú primero.'
      },
      calm: {
        t: 'Descanso y sueño',
        fire: 'Te recupera el movimiento, no estar tumbado. Entrenar, la carretera y el cansancio físico hacen más por tu sueño que una tarde libre.',
        earth: 'Te recuperan el ritmo y el entorno conocido. Tu sueño se rompe por el caos en el plan, no por la cantidad de trabajo.',
        air: 'Te recupera callar la cabeza, no el cuerpo. Sin cortar la entrada de estímulos te quedas ahí, cansado y pensando.',
        water: 'Te recuperan la soledad después de la gente y el agua: un baño, una piscina, un paseo junto al río. Sin eso cargas emociones ajenas toda la semana.'
      },
      self: {
        t: 'Yo y mis límites',
        fire: 'Tu límite se rompe donde confundes rapidez con acuerdo. Antes de decir que sí, date un día.',
        earth: 'Tu límite se rompe donde te quedas demasiado para no empezar de cero. Quedarse puede costar más que cambiar.',
        air: 'Tu límite se rompe donde te explicas durante más tiempo del que duró el asunto. Una frase más corta suele bastar.',
        water: 'Tu límite se rompe donde tomas la emoción de otro como una tarea tuya. La compasión no te obliga a arreglarla.'
      }
    },

    transitMoon: [
      'La Luna en Aries acelera las reacciones. Buena semana para empezar, mala para mandar mensajes en caliente.',
      'La Luna en Tauro baja el ritmo. El cuerpo pide rutina: dormir, comer y una tarde tranquila le ganan a cualquier plan.',
      'La Luna en Géminis te inunda de estímulos. Hablar sale fácil, concentrarse no: deja las tareas cortas.',
      'La Luna en Cáncer sube la sensibilidad. Las conversaciones sobre lo cercano salen más fáciles que de costumbre.',
      'La Luna en Leo quiere público. Buen momento para enseñar trabajo terminado, malo para pelearse por atención.',
      'La Luna en Virgo ordena. Buena semana para cerrar cabos sueltos, mala para juzgarte a ti mismo.',
      'La Luna en Libra busca equilibrio. Reconciliarse sale más fácil; decidir con claridad, más difícil.',
      'La Luna en Escorpio lo hace todo más hondo. Conversaciones de verdad sí, mensajes impulsivos no.',
      'La Luna en Sagitario abre el horizonte. Planear un viaje o un curso hace más por tu ánimo que descansar en casa.',
      'La Luna en Capricornio enfría las emociones. Buen momento para trámites, flojo para hablar de sentimientos.',
      'La Luna en Acuario te da distancia. Vas a ver tu situación desde fuera: aprovéchalo para decidir.',
      'La Luna en Piscis difumina los bordes. Descansar y dormir importan más que rendir.'
    ],

    transitAspect: {
      conjunction: 'El Sol vuelve a tu posición de nacimiento. Es una semana para empezar, no para hacer balance.',
      semisquare: 'Roce pequeño entre lo que quieres y lo que pide la semana. Nada grande, pero desgasta.',
      sextile: 'Ángulo favorable: las cosas salen más fáciles si das tú el primer paso. Solas no van a pasar.',
      square: 'Tensión entre tus planes y las circunstancias. Semana para corregir el rumbo, no para forzarlo.',
      trine: 'La configuración más cómoda del ciclo. Gástala en lo que llevas meses aplazando.',
      quincunx: 'Algo no encaja y cuesta ponerle nombre. Buen momento para ordenar cosas pequeñas.',
      opposition: 'Oposición plena: ves tu situación desde el otro lado. La confrontación puede servir sin convertirse en pelea.'
    },

    pairAspect: {
      conjunction: 'Sus luces están en el mismo sitio: se entienden sin explicarse y repiten los mismos errores.',
      semisquare: 'Roce pequeño y repetido. No rompe la relación, pero vuelve en las mismas situaciones.',
      sextile: 'Facilidad que pide iniciativa. Esta pareja funciona mientras alguien proponga primero.',
      square: 'La configuración más dura y la que más hace crecer. Atrae y enseña, y cuesta.',
      trine: 'Coincidencia natural de ritmo. Un solo riesgo: con tanta facilidad, nadie trabaja la relación.',
      quincunx: 'Necesidad constante de ajustarse. Funciona en parejas a las que les gusta hablar de lo que hay entre ellas.',
      opposition: 'Extremos opuestos del mismo eje. Atracción fuerte y una negociación permanente.'
    }
  };

  global.READING_ALL.es = R;
  if (global.LANG === 'es') { global.READING = R; }
})(typeof window !== 'undefined' ? window : globalThis);
