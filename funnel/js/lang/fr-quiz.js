/* Français — textes du quiz v2. Même structure que l'objet anglais de
   js/quiz-copy.js. Tutoiement ; aucun accord de genre sur la personne. */
(function (global) {
  'use strict';
  if (!global.QUIZ_ALL) { return; }

  var Q = {
    phases: ['Ton focus', 'Données de naissance', 'Aperçu'],
    back: 'Retour',
    cont: 'Continuer',
    paidNote: 'AstroMap est une app sur abonnement. Ces questions sont gratuites : tes réponses construisent un aperçu de ta carte.',

    goal: {
      title: 'Qu’aimerais-tu mieux comprendre en ce moment ?',
      sub: 'On construit ta carte et on te montre par où commencer.',
      note: 'Tu pourras le changer plus tard.',
      opts: {
        love:  ['Les relations', 'Besoins, lien, différences'],
        money: ['Le travail et l’argent', 'Forces et période actuelle'],
        calm:  ['La récupération', 'Repos, rythme, cycles lunaires'],
        self:  ['Moi et mes limites', 'Réactions et besoins']
      }
    },

    ctx: {
      title: {
        love: 'Quoi exactement dans les relations ?',
        money: 'Quoi exactement dans le travail et l’argent ?',
        calm: 'Quoi exactement dans la récupération ?',
        self: 'Quoi exactement sur toi ?'
      },
      sub: 'Cela décide de ce que l’aperçu montre en premier.',
      opts: {
        love:  { needs: 'Comprendre mes propres besoins', connection: 'Regarder un lien précis', differences: 'Mieux comprendre les différences' },
        money: { strengths: 'Comprendre mes forces', period: 'Explorer la période actuelle', overview: 'Commencer par une vue d’ensemble de la carte' },
        calm:  { cycles: 'Découvrir les cycles lunaires', skynow: 'Commencer par le ciel d’aujourd’hui', needs: 'Mieux comprendre mes besoins' },
        self:  { reaction: 'Comprendre ma façon de réagir', needs: 'Explorer mes besoins', overview: 'Commencer par une vue d’ensemble de la carte' }
      },
      unsure: 'Je ne sais pas encore'
    },

    dob: {
      title: 'Ta date de naissance',
      sub: 'On commence le calcul de ta carte par la date.',
      day: 'Jour', month: 'Mois', year: 'Année',
      decades: 'Aller à une décennie',
      pick: 'Fais tourner chaque roue jusqu’à ta date.',
      confirm: 'Confirmer la date',
      clamped: 'Jour changé en {d} : ce mois compte {n} jours.',
      future: 'Cette date n’est pas encore arrivée.'
    },

    sun: {
      eyebrow: 'Premier point de ta carte',
      part: 'Un point parmi d’autres. Ce n’est pas une description complète d’une personne.',
      cta: 'Ajouter les détails de la carte'
    },

    tk: {
      title: 'Connais-tu ton heure de naissance ?',
      sub: 'L’heure permet de calculer l’ascendant et les maisons. Tu peux continuer sans elle.',
      yes: 'Je connais l’heure exacte',
      yesD: 'Par exemple, grâce à l’acte de naissance',
      no: 'Je ne sais pas',
      noD: 'On calcule ce que la date et le lieu permettent'
    },

    time: {
      title: 'Ton heure de naissance',
      sub: 'Heure locale au lieu de naissance.',
      hour: 'Heure', minute: 'Minute', ampm: 'AM / PM',
      pick: 'Fais tourner les roues jusqu’à ton heure.',
      confirm: 'Confirmer l’heure',
      unknown: 'Je ne connais pas l’heure'
    },

    place: {
      title: 'Ton lieu de naissance',
      sub: 'Le lieu donne le fuseau horaire à ta date de naissance et, avec l’heure, l’ascendant.',
      label: 'Ville ou commune de naissance',
      placeholder: 'Commence à taper une ville…',
      noMatch: 'Rien trouvé. Essaie une autre orthographe, le nom local ou la grande ville la plus proche.',
      selected: 'Lieu de naissance',
      change: 'Modifier',
      confirm: 'Confirmer le lieu',
      notFound: 'Mon lieu n’est pas dans la liste',
      nfTitle: 'Choisis la grande ville la plus proche',
      nfText: 'Dans le même fuseau horaire. On utilise son fuseau pour ta date, mais on n’affiche ni l’ascendant ni les maisons : il faut le lieu exact.',
      nfName: 'Ton lieu (facultatif, seulement pour l’affichage)',
      nfBack: 'Revenir à la recherche',
      approx: 'approximatif : fuseau horaire de {c}'
    },

    core: {
      title: 'La base de ta carte',
      sub: 'Soleil, Lune et ascendant : les trois points par lesquels commence toute carte.',
      lead: 'Affiché en premier à cause de ta réponse. C’est un point de départ, pas une conclusion tirée de ta carte.',
      moonRange: 'Sans l’heure, la Lune ce jour-là était dans l’un de deux signes : {a} ou {b}. Elle a changé de signe dans la journée.',
      sunRange: 'Sans l’heure, le Soleil ce jour-là était dans l’un de deux signes : {a} ou {b}.',
      noAscTime: 'Il faut l’heure de naissance',
      noAscPlace: 'Il faut le lieu exact'
    },

    extra: {
      title: 'Quoi d’autre inclure dans ton aperçu ?',
      sub: 'Facultatif. Cela fixe l’ordre des sections dans l’app.',
      only: 'Pour l’instant seulement : {goal}'
    },

    start: {
      title: 'Par quoi préfères-tu commencer ?',
      sub: 'L’app s’ouvrira ici après l’abonnement. Ta carte natale ne change pas, et tu peux revenir au ciel du jour et à n’importe quelle date choisie.',
      opts: {
        chart: ['Par la carte natale', 'Planètes, maisons, aspects'],
        sky:   ['Par le ciel du jour', 'Ce qui est actif pour ta carte en ce moment'],
        dates: ['Par les prochaines dates', 'Phases de la Lune, tournants, aspects exacts']
      }
    },

    pask: {
      title: 'Ajouter la date de naissance de la personne à qui tu penses ?',
      sub: 'Seulement la date. Pas de nom, pas de contacts, pas de détails sur la relation.',
      add: 'Ajouter sa date',
      skip: 'Continuer sans'
    },

    pdate: {
      title: 'Sa date de naissance',
      sub: 'Sans son heure de naissance, sa Lune est approximative.',
      confirm: 'Confirmer la date'
    },

    load: {
      busy: 'Préparation de ton aperçu…',
      fail: 'L’aperçu ne s’est pas chargé. Tes réponses sont enregistrées.',
      retry: 'Réessayer',
      skip: 'Continuer sans l’aperçu'
    },

    prev: {
      title: {
        love: 'Ta carte avec un focus sur les relations',
        money: 'Ta carte avec un focus sur le travail et l’argent',
        calm: 'Ta carte avec un focus sur la récupération',
        self: 'Ta carte avec un focus sur toi et tes limites'
      },
      frag: '{theme} · élément du Soleil : {element}',
      fragSrc: 'Interprétation selon l’élément de ton Soleil, tirée de la bibliothèque de textes d’AstroMap.',
      plainTitle: 'Aujourd’hui, en mots simples',
      plainNone: 'Aucun aspect exact à ta carte aujourd’hui. Le signal le plus rapide est la Lune : elle change de signe tous les deux ou trois jours.',
      details: 'Détails',
      tabsLead: 'Le même calcul que dans l’app. Touche les onglets.',
      noon: 'Heure de naissance inconnue : les points sont affichés pour 12:00, la Lune est donc approximative.',
      asp: {
        conjunction: 'Le point du ciel se trouve sur un point de ta carte : son thème est accentué.',
        sextile: 'Un lien facile qui fonctionne quand tu t’en sers.',
        square: 'Une tension entre les deux points : un frottement qui demande une décision.',
        trine: 'Un lien fluide et naturel entre les deux points.',
        opposition: 'Les deux points tirent dans des directions opposées : l’enjeu est l’équilibre.'
      },
      pairTitle: 'Ton Soleil et son Soleil',
      pair: {
        same: 'Même élément ({e}) : un rythme et une façon de réagir proches.',
        fit: 'Des éléments qui se soutiennent souvent : {a} et {b}.',
        diff: 'Des éléments différents : {a} et {b}. Un autre rythme, donc ça aide de dire les choses à voix haute.'
      },
      pairNote: 'Indice de la méthode : {n} sur une échelle de 38–96. Une méthode astrologique, pas une prévision sur la relation.'
    },

    bridge: {
      title: 'Ta carte natale reste. Le ciel bouge.',
      sub: 'C’est pour cela qu’AstroMap est un abonnement : le calcul pour ta carte change chaque jour.',
      today: 'Aujourd’hui',
      next: 'À venir',
      moon: 'Lune : {phase} · {s}',
      moonNext: 'La Lune change de signe : {s}',
      tight: 'Aspects exacts à ta carte : {n}',
      retro: 'Rétrogrades en ce moment : {list}',
      first: 'Premier pas conseillé dans l’app',
      act: {
        chart: 'Ouvrir ta carte natale',
        today: 'Voir le ciel du jour pour ta carte',
        match: 'Ouvrir la compatibilité',
        moon: 'Ouvrir le calendrier lunaire'
      },
      appTitle: 'Dans l’app, tu peux',
      app: [
        'Voir quels transits sont actifs pour ta carte maintenant',
        'Tout recalculer pour n’importe quelle date',
        'Suivre les phases de la Lune un mois à l’avance',
        'Enregistrer des dates dans ta frise'
      ]
    },

    pay: {
      features: 'Pour ton focus',
      cta: 'M’abonner — {price} par mois',
      key: 'Après le paiement, Gumroad t’envoie une clé de licence par e-mail. Tu la saisis une fois et tu choisis un mot de passe.',
      seeYear: 'Voir le plan annuel',
      backPrev: 'Revenir à l’aperçu'
    },

    year: {
      title: 'Plan annuel',
      sub: 'La même app, payée une fois par an.',
      renew: 'par an, renouvelé automatiquement',
      equiv: 'Environ $2.50 par mois, facturés $29.99 une fois par an plus TVA.',
      cta: 'M’abonner — {price} par an',
      back: 'Revenir au plan mensuel',
      backPrev: 'Revenir à l’aperçu',
      free: 'Lire l’aperçu gratuit'
    }
  };

  global.QUIZ_ALL.fr = Q;
  if (global.LANG === 'fr') { global.QUIZ = Q; }
})(typeof window !== 'undefined' ? window : globalThis);
