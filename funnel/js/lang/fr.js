/* Français — строки интерфейса воронки.
   Структура повторяет английский объект в js/copy.js ключ в ключ.
   Биллинг и юридические строки сюда не переводятся — см. ниже. */
(function (global) {
  'use strict';

  var EN = global.COPY_ALL && global.COPY_ALL.en;
  if (!EN) { return; }

  var C = {
    brand: 'AstroMap App',
    progress: 'Ta carte',                /* ≤ 14 знаков */
    ctaNext: 'Continuer',
    ctaCalc: 'Calculer ma carte',
    ctaSummary: 'Voir le récapitulatif',
    notNow: 'Pas maintenant',
    computing: 'Je calcule les positions à l’instant de ta naissance…',

    months: ['janv', 'févr', 'mars', 'avr', 'mai', 'juin',
             'juil', 'août', 'sept', 'oct', 'nov', 'déc'],

    a11y: {
      progress: 'Avancement de la construction de ta carte',
      themes: 'Domaines à choisir',
      reasons: 'Pourquoi tu n’as pas encore acheté'
    },

    pv: {
      title: 'Ta carte dans AstroMap',
      sub: 'La même carte, calculée par le même code que l’application. Touche pour explorer.',
      tabs: { today: 'Aujourd’hui', chart: 'Carte', retro: 'Rétrogrades' },
      points: {
        Sun: 'Soleil', Moon: 'Lune', Mercury: 'Mercure', Venus: 'Vénus', Mars: 'Mars',
        Jupiter: 'Jupiter', Saturn: 'Saturne', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluton',
        Node: 'Nœud lunaire', ASC: 'Ascendant', MC: 'MC'
      },
      codes: {
        Sun: 'So', Moon: 'Lu', Mercury: 'Me', Venus: 'Vé', Mars: 'Ma',
        Jupiter: 'Ju', Saturn: 'Sa', Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
        ASC: 'AS', MC: 'MC'
      },
      aspects: {
        conjunction: 'conjonction', sextile: 'sextile',
        square: 'carré', trine: 'trigone', opposition: 'opposition'
      },
      tone: { soft: 'facile', hard: 'difficile', neutral: 'neutre' },
      fromSky: 'ciel du moment', toChart: 'ta carte',
      moonNow: 'La Lune en ce moment',
      illum: 'Illumination',
      moonShift: 'Change de signe',
      today: 'aujourd’hui', tomorrow: 'demain', inDays: 'dans {n} jours',
      orb: 'orbe',
      activeNow: 'Aspects serrés en ce moment : {n}',
      lockTransits: 'Les {n} autres, avec les dates de pic exactes, sont dans l’application.',
      planets: 'Points de ta carte', aspectsN: 'Aspects de ta carte', housesN: 'Maisons',
      noHouses: 'pas d’heure de naissance',
      lockChart: 'La liste des aspects, les maisons et la date de ton choix sont dans l’application.',
      retroTitle: 'Rétrogrades en ce moment : {n}',
      retroNow: 'recule',
      inSign: 'en {s}',
      noRetro: 'Aucune planète n’est rétrograde en ce moment.',
      lockRetro: 'Les dates de station, les périodes d’ombre et la maison touchée sont dans l’application.'
    },

    map: {
      sun: 'Soleil', moon: 'Lune', asc: 'Ascendant',
      sunShort: 'So', moonShort: 'Lu', ascShort: 'AS',
      waitDate: 'en attente de ta date',
      waitTime: 'en attente de l’heure et du lieu',
      noAsc: 'demande une heure de naissance',
      firstPoint: 'Le premier point de ta carte. Les deux autres arrivent dès que tu ajoutes l’heure et le lieu.'
    },

    s1: {
      eyebrow: 'Commence par une date',
      title: 'Quand es-tu né ?',
      day: 'Jour', month: 'Mois', year: 'Année',
      resultLabel: 'Ton Soleil',
      elementLabel: 'Élément'
    },

    s2: {
      eyebrow: 'Choisis-en 2 ou 3',
      title: 'Qu’est-ce qui entre dans ta carte ?',
      hint: 'Ces domaines apparaîtront dans ta lecture.',
      themes: [
        { k: 'love',  t: 'Amour et relations',  d: 'Qui te correspond, et pourquoi' },
        { k: 'money', t: 'Travail et argent',   d: 'Là où ça tire naturellement' },
        { k: 'calm',  t: 'Repos et sommeil',    d: 'Ce qui te recharge vraiment' },
        { k: 'self',  t: 'Moi et mes limites',  d: 'Là où tu donnes trop' }
      ]
    },

    s3: {
      eyebrow: 'L’étape qui compte',
      title: 'Heure et lieu de naissance',
      hint: 'Sans heure, pas d’Ascendant — et l’Ascendant, c’est la première impression que tu donnes.',
      hour: 'Heure', minute: 'Minute', city: 'Ville',
      cityPlaceholder: 'Tape un nom de ville…',
      cityNoMatch: 'Aucune ville trouvée',
      cityManual: 'Je ne trouve pas ma ville',
      cityManualName: 'Nom du lieu',
      cityManualOffset: 'Fuseau horaire (UTC)',
      cityManualApply: 'Utiliser',
      cityManualNote: 'Sans coordonnées je peux calculer le Soleil et la Lune, mais pas l’Ascendant — il demande un lieu exact, et je ne le devine pas.',
      unknown: 'Je ne connais pas l’heure',
      unknownNote: 'Je calcule le Soleil et la Lune. L’Ascendant reste vide tant que tu n’as pas retrouvé l’heure sur ton acte de naissance.',
      moonLabel: 'Lune',
      ascLabel: 'Ascendant',
      ascEmptyShort: 'pas d’heure',
      ascEmptyPlace: 'demande un lieu exact',
      stageTz: 'Je situe ton ciel de naissance',
      stageSun: 'Je calcule le Soleil',
      stageMoon: 'Je calcule la Lune',
      stageAsc: 'Je cherche ton Ascendant',
      stageDone: 'J’assemble ta carte',
      big3Lead: 'Les trois points par lesquels commence toute carte. Ensemble, pas séparément.',
      roleSun: 'qui tu es au fond',
      roleMoon: 'comment tu ressens et ce qu’il te faut',
      roleAsc: 'comment ta carte rencontre le monde',
      cuspNote: 'Ton luminaire est pile sur une limite de signe — à cette position, la minute exacte compte.'
    },

    s4: {
      eyebrow: 'Dernière question',
      title: 'Regardons une relation',
      hint: 'La date de naissance de la personne à laquelle tu penses. Sans heure je calcule à midi, sa Lune peut donc être approximative.',
      skip: 'Passer cette étape',
      scoreLabel: 'Indice de compatibilité',
      scoleFoot: 'Un indice sur une échelle de 38 à 96, construit à partir des aspects Soleil-Lune entre vous. Méthode astrologique, pas une prévision.',
      bands: [
        { min: 0,  t: 'Du travail sur la durée', d: 'L’attirance est là, mais le quotidien vous coûtera à tous les deux plus que prévu.' },
        { min: 55, t: 'Ça marche si vous parlez', d: 'Rien ici n’est automatique. La chance est réelle si vous dites les choses simplement.' },
        { min: 70, t: 'Un couple solide',        d: 'Vos Lunes tiennent le même rythme. C’est ce que les autres décrivent comme calme.' },
        { min: 84, t: 'Un lien rare',            d: 'Un aspect aussi exact est peu fréquent. Le reste, c’est seulement ce que vous en faites.' }
      ]
    },

    s5: {
      eyebrow: 'Carte assemblée',
      title: 'Ta carte est prête',
      coreTitle: 'Ton noyau',
      focusTitle: 'Ton focus',
      skyTitle: 'Le ciel au-dessus de ta carte en ce moment',
      pairTitle: 'Relation',
      closeNow: 'Aspects serrés',
      retroNow: 'Rétrogrades',
      skyNote: 'Ceci est calculé pour l’instant présent, et demain ce sera autre chose — la carte de naissance reste, le ciel au-dessus avance.',
      cta: 'Entrer dans ta carte',
      ready: 'Ci-dessous, cette même carte dans l’application — touche pour explorer.'
    },

    pw: {
      focusLine: 'Ton focus — {areas} — voyage avec la carte : dans l’application, c’est lui qui décide de ce que tu vois en premier.',
      opensTitle: 'Ce qui s’ouvre',
      opens: [
        { t: 'Ta carte de naissance. ', d: 'La roue, les planètes, les maisons, les aspects et l’équilibre des éléments — avec le ciel de n’importe quel jour sur un second anneau.' },
        { t: 'Le ciel face à ta carte. ', d: 'Ce qui est actif maintenant, quand ça a commencé et quand ça retombe, avec les pics à la minute près.' },
        { t: 'La Lune. ', d: 'Phase, illumination, signe, prochaines nouvelle et pleine Lune, un mois à l’avance.' },
        { t: 'Les rétrogrades. ', d: 'Qui tourne et quand, les périodes d’ombre, et quelle maison de ta carte elles touchent.' },
        { t: 'La compatibilité. ', d: 'L’indice de synastrie, les contacts les plus forts et le thème composite de deux personnes.' },
        { t: 'Ta frise. ', d: 'Ce qui arrive — phases, stations et aspects exacts, avec tout ce qui mérite d’être gardé enregistré.' }
      ],
      movesTitle: 'Le ciel continue d’avancer',
      movesAspects: 'aspects serrés à ta carte aujourd’hui',
      movesMoon: 'avant que la Lune passe au signe {s}',
      movesRetro: 'planètes qui reculent',
      movesNote: 'Chaque section se recalcule pour la date de ton choix. C’est à ça que sert l’abonnement : ta carte de naissance ne change pas, le ciel au-dessus change tous les jours.'
    },

    paywall: {
      eyebrow: 'AstroMap App',
      title: 'Ta carte est prête',
      planTitle: 'Formule mensuelle',
      cta: 'Débloquer ma carte',
      checkoutOff: 'Les paiements ne sont pas encore branchés. Tes données sont enregistrées — reviens dans un instant.'
    },

    recovery: {
      title: 'Ta lecture est déjà calculée',
      sub: 'Voici le premier paragraphe. Le reste attend dans ton compte.',
      surveyTitle: 'Qu’est-ce qui t’a arrêté ?',
      survey: [
        { k: 'price', t: 'Trop cher' },
        { k: 'trust', t: 'Pas sûr que ça marche' },
        { k: 'what',  t: 'Pas clair ce que j’obtiens' },
        { k: 'look',  t: 'Je regarde, c’est tout' }
      ],
      answers: {
        trust: 'Voici tes positions, calculées à partir de la date, de l’heure et du lieu que tu as donnés. C’est le même calcul que celui des éphémérides — vérifie-les dans n’importe quel calculateur astrologique, l’écart devrait tenir dans le dixième de degré.',
        what: 'Tu obtiens l’accès à l’application où ta carte rencontre le ciel du moment. Concrètement :',
        look: 'C’est très bien. Ta carte reste enregistrée dans ce navigateur, et la lecture ci-dessous est gratuite et complète — rien n’y est masqué.'
      },
      yearCta: 'Prendre la formule annuelle',
      backToPlan: 'Revenir au mensuel',
      readFree: 'Ouvrir la lecture gratuite'
    },

    moonPhase: ['Nouvelle Lune', 'Premier croissant', 'Premier quartier', 'Lune gibbeuse croissante',
                'Pleine Lune', 'Lune gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant'],

    signs: ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge',
            'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'],
    signsIn: ['en Bélier', 'en Taureau', 'en Gémeaux', 'en Cancer', 'en Lion', 'en Vierge',
              'en Balance', 'en Scorpion', 'en Sagittaire', 'en Capricorne',
              'en Verseau', 'en Poissons'],
    elements: { fire: 'Feu', earth: 'Terre', air: 'Air', water: 'Eau' },

    sun: [
      'Tu avances d’abord et tu demandes après. Ta force, c’est de commencer, pas de tenir.',
      'Tu détestes qu’on presse ton rythme. Lentement, mais jusqu’au bout.',
      'Tu penses plus vite que tu ne parles, donc une phrase finit rarement là où elle commence.',
      'Tu lis l’ambiance d’une pièce avant tout le monde. D’où la fatigue sans raison.',
      'Il te faut un public, pas par vanité, mais pour que la chose compte.',
      'Tu repères le détail qui abîme l’ensemble. Le prix : rien ne semble fini.',
      'Tu fais passer le confort de tous avant le tien et tu appelles ça la paix.',
      'Tu ne fais rien à moitié. À fond, ou pas du tout — partir compris.',
      'Ta réponse à la difficulté, c’est le mouvement, pas la conversation. Parfois c’est la fuite.',
      'Tu reconstruiras l’ensemble depuis zéro, si on te laisse dix ans.',
      'Tu gardes tes distances par instinct, pas par froideur.',
      'Tu absorbes les émotions des autres et tu rates le moment où elles ont cessé d’être les tiennes.'
    ],
    moon: [
      'Tes émotions sont courtes et brûlantes. Ça éclate, puis c’est clair.',
      'Ce sont toujours les mêmes choses qui te calment : manger, un plaid, une pièce familière.',
      'Tu parles pour digérer une émotion. Le silence te met mal à l’aise.',
      'Tu retiens chaque vexation, jusqu’à la phrase exacte.',
      'Tu as besoin que quelqu’un remarque que ça va moins bien pour toi.',
      'Au lieu de pleurer, tu ranges. Le corps comme chemin à travers la peur.',
      'Tu ne peux pas être en colère devant quelqu’un. Ça attend que tu sois seul.',
      'Tu te méfies du calme. Tu cherches où est le piège.',
      'Tu soignes la tristesse en planifiant un voyage, même un voyage jamais fait.',
      'Demander de l’aide te gêne. Tu préfères faire trois fois le travail.',
      'Tu analyses une émotion au lieu de la ressentir. Efficace, jusqu’à un certain point.',
      'Il n’y a pas de frontière entre ton humeur et celle des autres.'
    ],
    asc: [
      'On voit quelqu’un sur le point de décider. Même en pleine hésitation.',
      'Tu donnes une impression de calme et de coût élevé. C’est ce qui arrive en premier.',
      'Tu parais léger et disponible — d’où les confidences d’inconnus.',
      'Tu as l’air de quelqu’un qui va s’en occuper. C’est à toi qu’on demande d’abord.',
      'Tu entres et la température de la pièce change. Ça ne s’éteint pas.',
      'Tu as l’air compétent, donc tu finis par porter le travail des autres.',
      'On suppose que tu seras d’accord. En général, on a raison.',
      'Tu sembles en savoir plus que tu n’en dis. Ça peut intimider.',
      'Tu as l’air de quelqu’un qui va partir. Même quand tu restes.',
      'On te lit plus âgé et plus sérieux que tu ne l’es. Ça a toujours été le cas.',
      'On voit quelqu’un à part. Sympathique, mais pas tout à fait présent.',
      'On lit ton visage comme une invitation. Souvent à tort.'
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

  global.COPY_ALL.fr = C;
  if (global.LANG === 'fr') { global.COPY = C; }
})(typeof window !== 'undefined' ? window : globalThis);
