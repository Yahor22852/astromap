/* Français — тексты разбора. Структура повторяет английский объект в
   js/reading-copy.js ключ в ключ. */
(function (global) {
  'use strict';

  if (!global.READING_ALL) { return; }

  var R = {
    ui: {
      title: 'Ta carte',
      forWhom: 'Lecture pour {date}, {city}',
      secPositions: 'Tes trois positions',
      secThemes: 'Tes domaines',
      secWeek: 'Cette semaine',
      secPair: 'Compatibilité',
      sun: 'Soleil', moon: 'Lune', asc: 'Ascendant',
      noAsc: 'Ascendant non calculé — aucune heure de naissance n’a été donnée.',
      weekRange: 'Semaine du {from} au {to}',
      weekMoon: 'La Lune de la semaine',
      weekSun: 'Le Soleil face à ta position',
      recalc: 'Ce chapitre se recalcule chaque semaine à partir des positions du moment.',
      pairScore: 'Indice de compatibilité',
      pairStrongest: 'L’aspect le plus fort entre vous',
      pairFoot: 'Un indice sur une échelle de 38 à 96 à partir des aspects Soleil-Lune entre vous. Méthode astrologique, pas une prévision.',
      noPair: 'Tu n’as pas ajouté de deuxième personne. Reviens au formulaire pour calculer la compatibilité.',
      empty: 'Aucune carte enregistrée dans ce navigateur. Remplis le formulaire à nouveau.',
      back: 'Revenir au formulaire',
      goTitle: 'Ceci est la photo d’un seul jour',
      goText: 'Au-dessus, ta carte de naissance et le ciel de cette semaine. La carte ne changera pas ; le ciel au-dessus d’elle change chaque jour. Dans AstroMap, ces mêmes positions se recalculent pour la date de ton choix : transits avec leurs fenêtres et leurs pics, la Lune, les rétrogrades, ta frise et la roue complète avec les maisons.',
      goCta: 'Ouvrir AstroMap',
      disclaimer: 'Ce contenu relève du divertissement et ne remplace pas l’avis d’un professionnel.'
    },

    sun: [
      'Ton Soleil fonctionne comme un moteur qui démarre : la décision tombe avant que tu l’aies pensée jusqu’au bout. Tu commences bien et tu souffres à l’étape où il n’y a plus qu’à tenir. La force est dans le premier geste, pas dans la dixième semaine.',
      'Ton Soleil refuse le tempo des autres. Il te faut du temps pour décider et ensuite tu n’y reviens pas — c’est pour ça que tu gagnes là où d’autres abandonnent au bout d’un mois. Le prix : tu restes dans des choses finies depuis longtemps.',
      'Ton Soleil pense plus vite qu’il ne parle, donc une phrase finit rarement là où elle a commencé. La nouveauté est ton oxygène, et l’ennui frappe plus fort que la fatigue.',
      'Ton Soleil lit l’ambiance d’une pièce depuis la porte et la prend sur lui. D’où la fatigue sans cause claire. La proximité est pour toi une condition pour travailler, pas une récompense.',
      'Ton Soleil a besoin d’un public, non par vanité : il te faut un témoin et un sens à ce que tu fais. Sans ça, même le bon travail sonne creux.',
      'Ton Soleil voit le détail qui abîme l’ensemble et ne peut plus ne pas le voir. Tu déclares donc rarement une chose finie, et plus rarement encore assez bonne.',
      'Ton Soleil compte le confort de tous les autres avant le sien. Tu appelles ça la paix, mais c’est plus souvent ta propre décision, remise à plus tard.',
      'Ton Soleil ne fait rien à moitié. Tu entres à fond ou pas du tout — partir compris. Ça te donne une profondeur que d’autres n’ont pas, et un prix que tu paies seul.',
      'Ton Soleil répond à la difficulté par le mouvement : un voyage, un plan, une autre direction. Parfois c’est du courage, parfois une fuite, et la différence ne se voit qu’après.',
      'Ton Soleil construit lentement et à ses conditions. Tu feras en dix ans ce que d’autres remettent toute leur vie, mais tu traites le repos comme quelque chose à mériter.',
      'Ton Soleil garde ses distances par instinct, pas par froideur. Il te faut un espace où personne ne te range, et c’est seulement de là que tu t’approches.',
      'Ton Soleil absorbe les émotions autour de lui avec tant de précision qu’il est facile de rater le moment où elles ont cessé d’être les tiennes. D’où le besoin de silence après les gens.'
    ],

    moon: [
      'Ta Lune réagit à l’instant : ça éclate, puis c’est clair. Tu ne gardes pas longtemps la colère et ça te protège. Le problème commence quand l’autre a besoin de calme plutôt que de mots.',
      'Ta Lune se calme par le corps : manger, un plaid, un endroit connu, le même rituel. Un changement sans prévenir te coûte plus que tu ne veux l’admettre.',
      'Ta Lune digère l’émotion en parlant. Tant que tu ne l’as pas racontée, tu ne sais pas bien ce que tu ressens. Le silence dans une relation sonne comme une alarme.',
      'Ta Lune retient une blessure jusqu’à la phrase et au ton. Tu pardonnes mais tu n’effaces pas — d’où les vieilles conversations qui reviennent dans les nouvelles disputes.',
      'Ta Lune a besoin que quelqu’un remarque que ça va moins bien pour toi. Tu le demandes rarement franchement ; plus souvent tu le montres et tu attends la question.',
      'Ta Lune range au lieu de pleurer. Le ménage, les listes, un plan. Ça marche à court terme et ça classe l’émotion pour plus tard, en général au pire moment possible.',
      'Ta Lune ne sait pas se mettre en colère devant les gens. Tu gardes la colère pour la solitude, et là elle devient de la rumination plutôt qu’une conversation.',
      'Ta Lune se méfie du calme. Même dans une bonne semaine tu cherches le piège, parce que le moment où quelque chose casse vraiment est plus facile à porter comme ça.',
      'Ta Lune soigne la tristesse en planifiant : un voyage, une formation, une direction. Même si tu n’y vas jamais, le plan fait déjà baisser la pression.',
      'Ta Lune a honte de demander de l’aide. Tu préfères faire trois fois le travail plutôt que de dire que tu n’y arrives plus — et ensuite tu en veux à tout le monde d’un coup.',
      'Ta Lune analyse une émotion au lieu de la ressentir. Efficace jusqu’au moment où l’émotion arrive quand même, plus tard et plus fort.',
      'Ta Lune n’a pas de frontière entre ton humeur et celle d’un autre. C’est pour ça qu’après une journée parmi les gens il te faut du silence, pas un rendez-vous de plus.'
    ],

    asc: [
      'On voit quelqu’un sur le point de décider, même en pleine hésitation. La responsabilité t’atteint plus vite que tu ne la demandes.',
      'Tu donnes une impression de calme et de coût élevé. Ça ouvre des portes, et ça fait aussi que personne ne demande si tu as besoin d’aide.',
      'Tu parais léger et disponible, alors un inconnu se confie en dix minutes. Parfois tu sors de ces conversations plus fatigué que lui.',
      'Tu as l’air de quelqu’un qui va s’en occuper, alors on te demande en premier. Dire non te coûte plus que la tâche elle-même.',
      'Tu entres et la température de la pièce change. Ça ne s’éteint pas, même le jour où tu veux passer inaperçu.',
      'Tu as l’air compétent, donc tu finis par porter le travail des autres. Et en général tu le rends, ce qui boucle la boucle proprement.',
      'On suppose que tu seras d’accord, et en général on a raison. Ta politesse se lit comme une absence d’avis, ce qu’elle n’est pas.',
      'Tu sembles en savoir plus que tu n’en dis. Certains trouvent ça intimidant ; les autres y voient une raison de te faire confiance.',
      'Tu as l’air de quelqu’un qui va partir, même quand tu restes. Du coup on te demande tes projets plus souvent que comment tu vas.',
      'On te lit plus âgé et plus sérieux que tu ne l’es. Ça aide au travail et ça rend la légèreté plus difficile.',
      'On voit quelqu’un à part : sympathique, mais pas tout à fait présent. S’approcher demande de l’initiative de l’autre côté.',
      'On lit ton visage comme une invitation, y compris quand ça n’en est pas une. D’où les malentendus du début.'
    ],

    themes: {
      love: {
        t: 'Amour et relations',
        fire: 'En amour il te faut du rythme et de la franchise. La prudence t’ennuie, et c’est pourtant la prudence qui sauve les relations où les deux vont vite.',
        earth: 'En amour tu comptes la répétition, pas les déclarations. La confiance te prend des mois à construire et exactement autant à reconstruire après une déception.',
        air: 'En amour la conversation te manque plus que les gestes. Le silence sonne comme une alarme, alors que pour l’autre il veut souvent juste dire du calme.',
        water: 'En amour tu sens l’autre plus vite qu’il ne se comprend lui-même. Surveille le point où prendre soin commence à remplacer être ensemble.'
      },
      money: {
        t: 'Travail et argent',
        fire: 'Au travail tu es meilleur au démarrage : un nouveau projet, une crise, une échéance. La routine t’épuise plus vite que la surcharge.',
        earth: 'Au travail ton avantage est l’endurance. Tu gagnes sur des années, mais tu dois apprendre à annoncer ton prix avant qu’un autre l’annonce.',
        air: 'Au travail tu gagnes par les contacts et la vitesse d’apprentissage. Le risque principal : dix directions ouvertes et aucune refermée.',
        water: 'Au travail c’est le sens qui te guide, pas un tableur. Tu lis bien les gens, donc les négociations se passent mieux que tu ne crois — à condition de ne pas céder le premier.'
      },
      calm: {
        t: 'Repos et sommeil',
        fire: 'C’est le mouvement qui te répare, pas la position allongée. Le sport, la route et la fatigue physique font plus pour ton sommeil qu’une soirée libre.',
        earth: 'Ce sont le rythme et l’environnement familier qui te réparent. Ton sommeil casse sur le chaos du planning, pas sur la quantité de travail.',
        air: 'C’est de faire taire la tête qui te répare, pas le corps. Sans couper les entrées, tu restes allongé, fatigué, à penser.',
        water: 'Ce sont la solitude après les gens et l’eau qui te réparent : un bain, une piscine, une marche au bord d’une rivière. Sans ça, tu portes les émotions des autres toute la semaine.'
      },
      self: {
        t: 'Moi et mes limites',
        fire: 'Ta limite casse là où tu confonds vitesse et accord. Avant de dire oui, donne-toi un jour.',
        earth: 'Ta limite casse là où tu restes trop longtemps pour ne pas repartir de zéro. Rester peut coûter plus cher que changer.',
        air: 'Ta limite casse là où tu t’expliques plus longtemps que l’affaire n’a duré. Une phrase plus courte suffit en général.',
        water: 'Ta limite casse là où tu prends l’émotion d’un autre pour une tâche. La compassion ne t’oblige pas à la réparer.'
      }
    },

    transitMoon: [
      'La Lune en Bélier accélère les réactions. Bonne semaine pour commencer, mauvaise pour envoyer des messages à chaud.',
      'La Lune en Taureau ralentit le tempo. Le corps demande du rythme : dormir, manger et une soirée tranquille battent n’importe quel plan.',
      'La Lune en Gémeaux t’inonde de stimulations. Parler vient facilement, se concentrer non — garde des tâches courtes.',
      'La Lune en Cancer augmente la sensibilité. Les conversations sur les choses proches passent plus facilement que d’habitude.',
      'La Lune en Lion veut un public. Bon moment pour montrer un travail fini, mauvais pour se disputer l’attention.',
      'La Lune en Vierge range. Bonne semaine pour fermer les dossiers en suspens, mauvaise pour te juger toi-même.',
      'La Lune en Balance cherche l’équilibre. La réconciliation vient plus facilement, la décision nette moins.',
      'La Lune en Scorpion approfondit tout. Les vraies conversations oui, les messages impulsifs non.',
      'La Lune en Sagittaire ouvre l’horizon. Planifier un voyage ou une formation fait plus pour ton humeur que rester te reposer.',
      'La Lune en Capricorne refroidit les émotions. Bon moment pour les formalités, faible pour parler de sentiments.',
      'La Lune en Verseau donne de la distance. Tu vas voir ta situation de l’extérieur — sers-t’en pour décider.',
      'La Lune en Poissons efface les contours. Le repos et le sommeil comptent plus que la productivité.'
    ],

    transitAspect: {
      conjunction: 'Le Soleil revient sur ta position de naissance. C’est une semaine pour commencer, pas pour faire le bilan.',
      semisquare: 'Petite friction entre ce que tu veux et ce que la semaine demande. Rien de grand, mais ça use.',
      sextile: 'Angle favorable : les choses passent mieux si tu fais le premier pas. Elles n’arriveront pas seules.',
      square: 'Tension entre tes plans et les circonstances. Une semaine pour corriger la route, pas pour forcer.',
      trine: 'La configuration la plus facile du cycle. Dépense-la pour ce que tu repousses depuis des mois.',
      quincunx: 'Quelque chose ne colle pas et se laisse mal nommer. Bon moment pour ranger les petites choses.',
      opposition: 'Opposition pleine : tu vois ta situation depuis l’autre bord. La confrontation peut servir sans devenir une dispute.'
    },

    pairAspect: {
      conjunction: 'Vos luminaires sont au même endroit — vous vous comprenez sans explication et vous répétez les mêmes erreurs.',
      semisquare: 'Petite friction qui revient. Elle ne casse pas la relation, mais elle réapparaît dans les mêmes situations.',
      sextile: 'Une facilité qui demande de l’initiative. Ce couple fonctionne tant que quelqu’un propose en premier.',
      square: 'La configuration la plus dure et la plus formatrice. Elle attire et elle apprend, et elle coûte.',
      trine: 'Accord naturel des rythmes. Un seul risque : avec autant de facilité, personne ne travaille la relation.',
      quincunx: 'Un besoin constant d’ajustement. Ça marche pour les couples qui aiment parler de ce qu’il y a entre eux.',
      opposition: 'Les deux bouts du même axe. Attirance forte et négociation permanente.'
    }
  };

  global.READING_ALL.fr = R;
  if (global.LANG === 'fr') { global.READING = R; }
})(typeof window !== 'undefined' ? window : globalThis);
