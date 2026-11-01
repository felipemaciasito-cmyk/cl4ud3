// Contenu du cours « Claude Code 101 », dans l’appli CL4UD3.
// Mise en forme dans les textes : **gras** et `code`.
// Types de blocs : p, h2, h3, liste, tableau, code.

export const SECTIONS = [
  "Qu’est-ce que Claude Code ?",
  "Ton premier prompt",
  "Le travail au quotidien",
  "Personnaliser Claude Code",
];

export const PR_FUSION =
  "Ouvre le diff et relis-le, puis touche « Créer une PR ». Sur GitHub, ouvre la PR et touche « Merge pull request », puis « Confirm merge ».";

const PRETTIER_HOOK = String.raw`{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npx prettier --write --ignore-unknown \"$(jq -r '.tool_input.file_path')\"" }
        ]
      }
    ]
  }
}`;

export const LECONS = [
  {
    id: 1, section: 0, duree: 8,
    titre: "Qu’est-ce que Claude Code ?",
    resume: "L’agent qui agit sur ton projet, et ce qui change par rapport au chat.",
    objectifs: [
      "Comprendre ce qu’est un agent de code",
      "Voir ce qui change par rapport au chat",
      "Savoir où Claude Code fonctionne, et lequel utiliser sur iPad",
    ],
    blocs: [
      { type: "p", t: "Jusqu’ici, tu codes avec Claude dans le chat : tu décris ce que tu veux, Claude écrit le code, et toi tu copies les fichiers dans ton projet. Claude ne voit que ce que tu lui colles, et c’est toi qui fais le lien entre la conversation et le projet." },
      { type: "p", t: "Claude Code change ce fonctionnement. C’est un **agent** : il a accès à ton projet et il peut agir dessus. Il lit les fichiers, les modifie, lance des commandes (tests, installations, git) et vérifie le résultat. Tu ne copies plus rien : tu confies une tâche, tu suis ce qu’il fait, tu relis et tu valides." },
      { type: "h2", t: "Le chat et l’agent, côte à côte" },
      { type: "tableau", entetes: ["", "Dans le chat", "Avec Claude Code"], lignes: [
        ["Ce que Claude voit", "Ce que tu colles", "Tout le projet"],
        ["Qui modifie les fichiers", "Toi", "Claude"],
        ["Qui teste", "Toi", "Claude, s’il a de quoi vérifier"],
        ["Ton rôle", "Copier, coller, relancer", "Décrire, piloter, relire"],
      ] },
      { type: "p", t: "Le modèle qui réfléchit est le même. Ce qui fait la différence, ce sont les **outils** que Claude Code lui donne pour agir. On les voit à la leçon suivante." },
      { type: "h2", t: "Où fonctionne Claude Code" },
      { type: "liste", items: [
        "**Le terminal** d’un ordinateur : la version d’origine, celle du cours officiel.",
        "**VS Code et JetBrains** : une extension dans l’éditeur de code.",
        "**L’application de bureau** Claude, sur Mac et Windows.",
        "**Le web**, à l’adresse claude.ai/code, ou l’onglet Code de l’appli Claude. Le code tourne alors sur un ordinateur d’Anthropic, dans le cloud, à partir d’une copie de ton dépôt GitHub.",
      ] },
      { type: "p", t: "Sur iPad, tu utiliseras **le web** : rien à installer, mais il faut un dépôt GitHub. La façon de travailler (la boucle, les modes, CLAUDE.md, les sous-agents, les skills, MCP, les hooks) est la même partout. Ce que tu apprends ici te servira tel quel le jour où tu passeras sur ordinateur." },
    ],
    retenir: [
      "Un agent agit sur ton projet, il ne se contente pas de répondre.",
      "Ton rôle passe de « copier-coller » à « décrire, piloter, relire ».",
      "Sur iPad : claude.ai/code, avec un dépôt GitHub.",
    ],
    exercice: {
      intro: "Pas encore de manipulation : on prépare le terrain.",
      etapes: [
        { t: "Vérifie que ton abonnement Claude est bien Pro, dans les paramètres de ton compte. Claude Code est inclus dans Pro." },
        { t: "Si tu n’as pas de compte GitHub, crée-le gratuitement sur github.com. Si tu en as un, vérifie que tu arrives à t’y connecter depuis Safari." },
        { t: "Pense à une modification récente faite sur une de tes applis via le chat. Note toutes les étapes que tu as faites toi-même, de la demande jusqu’à l’appli qui marche." },
      ],
      details: [
        { titre: "Voir une réponse possible", t: [
          "**Dans le chat :** j’ai décrit le bug, collé le fichier, récupéré la réponse, remplacé le fichier, testé, renvoyé l’erreur, recollé la nouvelle version, retesté.",
          "**Avec Claude Code :** je décris le bug une fois. Claude trouve le bon fichier, corrige, lance l’appli ou les tests, recommence s’il le faut, et je relis les changements avant de valider.",
        ] },
      ],
    },
  },
  {
    id: 2, section: 0, duree: 12,
    titre: "Comment fonctionne Claude Code",
    resume: "La boucle agentive, les outils, le contexte et les permissions.",
    objectifs: [
      "La boucle agentive : contexte, action, vérification",
      "Les outils qui font de Claude un agent",
      "La fenêtre de contexte et les permissions",
    ],
    blocs: [
      { type: "h2", t: "La boucle agentive" },
      { type: "p", t: "Quand tu donnes une tâche, Claude enchaîne trois phases : il **rassemble le contexte** (il lit, il cherche), il **agit** (il modifie, il lance des commandes), puis il **vérifie le résultat**. Selon ce qu’il découvre, il refait un tour, parfois des dizaines. Une simple question ne demande que la première phase. Une correction de bug passe plusieurs fois par les trois." },
      { type: "p", t: "Tu fais partie de la boucle : tu peux l’interrompre à tout moment, lui donner une information qui lui manque ou le réorienter, sans tout recommencer." },
      { type: "h2", t: "Les outils" },
      { type: "p", t: "Le modèle réfléchit, les outils agissent. Sans outils, Claude ne peut que répondre avec du texte. Claude Code lui en donne cinq familles :" },
      { type: "tableau", entetes: ["Famille", "Ce que Claude peut faire"], lignes: [
        ["Fichiers", "Lire, créer, modifier, renommer"],
        ["Recherche", "Trouver des fichiers, chercher du texte dans le code"],
        ["Exécution", "Lancer des commandes, des tests, un serveur, utiliser git"],
        ["Web", "Chercher sur le web, lire une documentation"],
        ["Intelligence du code", "Voir les erreurs de type, aller à une définition (avec un plugin)"],
      ] },
      { type: "p", t: "Chaque résultat d’outil revient dans la boucle et guide l’étape suivante. Si tu dis « corrige les tests qui échouent », Claude peut lancer les tests, lire l’erreur, chercher le fichier concerné, le lire, le corriger, puis relancer les tests pour vérifier." },
      { type: "h2", t: "La fenêtre de contexte" },
      { type: "p", t: "C’est la mémoire de travail de la session : la conversation, les fichiers lus, les sorties de commandes, ton fichier CLAUDE.md, les instructions système. Elle se remplit au fil du travail. Quand elle approche de sa limite, Claude Code la résume automatiquement (la **compaction**), et des consignes du début peuvent se perdre." },
      { type: "p", t: "Chaque nouvelle session repart avec un contexte vide. C’est pour ça qu’existe CLAUDE.md, qui se charge au début de chaque session (leçon 8). On verra comment gérer le contexte à la leçon 6." },
      { type: "h2", t: "Les permissions" },
      { type: "p", t: "Elles décident de ce que Claude peut faire sans te demander. Il existe plusieurs modes :" },
      { type: "tableau", entetes: ["Mode", "Ce que fait Claude"], lignes: [
        ["Manuel", "Il demande ton accord avant chaque modification et chaque commande"],
        ["Accepter les modifications", "Il modifie les fichiers sans demander"],
        ["Plan", "Il explore et propose un plan, sans toucher aux fichiers"],
        ["Auto", "Il avance seul ; un second modèle vérifie les actions risquées et les bloque"],
      ] },
      { type: "p", t: "Sur le web, tu as trois modes : **Accepter automatiquement les modifications** (par défaut), **Plan** et **Auto**. Le mode Manuel existe sur le terminal." },
      { type: "p", t: "Ton filet de sécurité sur le web, c’est GitHub : Claude travaille sur une branche à part. Rien ne touche ta branche principale tant que tu n’as pas fusionné ses changements. Dans le terminal, Claude Code garde en plus une copie de chaque fichier avant de le modifier, pour pouvoir revenir en arrière." },
    ],
    retenir: [
      "Boucle : rassembler le contexte, agir, vérifier, et recommencer.",
      "Les outils sont ce qui fait de Claude un agent.",
      "Le contexte est la mémoire de la session : limité, et vide à chaque nouvelle session.",
      "Les permissions fixent ce que Claude peut faire seul.",
    ],
    exercice: {
      intro: "Tâche donnée à Claude : « le total des courses affiché est faux ». Pour chaque étape, choisis la phase de la boucle.",
      classer: true,
      etapes: [],
    },
  },
  {
    id: 3, section: 1, duree: 15,
    titre: "Installer Claude Code",
    resume: "Les façons d’utiliser Claude Code, et ton espace de travail sur iPad.",
    objectifs: [
      "Connaître les façons d’utiliser Claude Code",
      "Préparer ton espace de travail sur iPad",
      "Envoyer un premier message à Claude Code",
    ],
    blocs: [
      { type: "h2", t: "Les différentes installations" },
      { type: "tableau", entetes: ["Où", "Comment", "Pour qui"], lignes: [
        ["Terminal", "Une commande d’installation, puis `claude` dans le dossier du projet", "Sur ordinateur, la version la plus complète"],
        ["VS Code, JetBrains", "Une extension à installer dans l’éditeur", "Sur ordinateur, si tu codes dans un éditeur"],
        ["Application de bureau", "L’appli Claude sur Mac ou Windows", "Sur ordinateur, sans terminal"],
        ["Web", "claude.ai/code, ou l’onglet Code de l’appli Claude", "Partout, même sur iPad"],
      ] },
      { type: "h2", t: "Comment marche la version web" },
      { type: "liste", items: [
        "Il te faut un **dépôt GitHub** : Claude le copie sur un ordinateur d’Anthropic isolé, dans le cloud.",
        "Claude y travaille, puis **pousse une branche** que tu relis.",
        "La session **continue même si tu fermes l’onglet**, et tu la retrouves sur tes autres appareils.",
        "L’environnement cloud a déjà les outils courants : Node.js, Python, git, et d’autres.",
      ] },
      { type: "p", t: "Le jour où tu auras un ordinateur, tu installeras la version terminal. Tout le reste du parcours restera valable." },
    ],
    retenir: [
      "Sur iPad : claude.ai/code ou l’onglet Code de l’appli Claude.",
      "Il faut un dépôt GitHub ; Claude travaille dans une copie et pousse une branche.",
      "Pour t’entraîner, utilise un dépôt à part, pas tes vraies applis.",
    ],
    exercice: {
      intro: "Tu vas créer un dépôt d’entraînement, `labo-claude-code`, qui servira pendant tout le parcours.",
      etapes: [
        { t: "Sur github.com/new, nomme le dépôt `labo-claude-code`. Choisis **Public** : c’est nécessaire pour publier gratuitement l’appli à la leçon 4. N’y mets donc jamais de mot de passe. Active l’option README (« Add a README file » ou « Add README » selon la version), pour que le dépôt ne soit pas vide. Puis « Create repository »." },
        { t: "Ouvre claude.ai/code dans Safari, ou l’onglet Code de l’appli Claude, et connecte-toi avec ton compte Claude." },
        { t: "Accepte de connecter GitHub : installe l’application Claude GitHub et donne-lui accès à `labo-claude-code`." },
        { t: "Quand on te propose de créer un environnement, garde les réglages par défaut (accès réseau « Trusted ») et valide." },
        { t: "Sous la zone de saisie, choisis le dépôt `labo-claude-code`, puis envoie :", p: "Décris-moi ce dépôt en une phrase et liste ses fichiers. Ne modifie rien." },
      ],
      note: "Si Claude te parle du README, tout est prêt. Si aucun dépôt n’apparaît, vérifie sur GitHub que le compte connecté a bien accès au dépôt.",
    },
  },
  {
    id: 4, section: 1, duree: 25,
    titre: "Ton premier prompt",
    resume: "Écrire un bon prompt, choisir le mode, relire et valider.",
    objectifs: [
      "Écrire un prompt qui donne à Claude ce qu’il ne peut pas deviner",
      "Choisir le bon mode : Plan, Accepter les modifications, Auto",
      "Relire, commenter et valider un premier résultat",
    ],
    blocs: [
      { type: "h2", t: "Dire à Claude ce qu’il ne peut pas voir" },
      { type: "p", t: "Claude lit très bien le code. Ce qu’il ne peut pas deviner, c’est ton intention, tes contraintes et ce que veut dire « terminé » pour toi. Un bon prompt donne exactement ça." },
      { type: "tableau", entetes: ["Au lieu de", "Essaie"], lignes: [
        ["« corrige le bug »", "« Le total affiché est faux quand j’ajoute deux courses. Regarde la fonction de calcul dans index.html, corrige-la et montre-moi un exemple chiffré qui marche. »"],
        ["« fais une page de réglages »", "« Ajoute une page de réglages sur le modèle de la page d’accueil, sans nouvelle bibliothèque. Sois ambitieux : états vides, erreurs, sauvegarde. »"],
      ] },
      { type: "liste", items: [
        "**Nomme** le fichier ou la fonction si tu les connais.",
        "**Décris** le symptôme et le résultat attendu, pas seulement le problème.",
        "**Montre** plutôt que décrire : colle une capture d’écran ou le message d’erreur.",
        "**« Sois ambitieux »** : sans ça, Claude construit souvent la plus petite version qui répond à la demande.",
        "**Pas encore d’idée précise ?** Demande : « Pose-moi des questions jusqu’à pouvoir écrire la spécification, puis écris-la dans SPEC.md. » Ensuite, construis à partir de SPEC.md dans une nouvelle session.",
      ] },
      { type: "h2", t: "Choisir le mode" },
      { type: "liste", items: [
        "**Plan** : Claude explore et propose une approche sans toucher aux fichiers. Idéal pour démarrer une fonctionnalité.",
        "**Accepter automatiquement les modifications** : Claude modifie et pousse sa branche sans s’arrêter.",
        "**Auto** : Claude avance seul, et un classifieur bloque ce qui est risqué.",
      ] },
      { type: "h2", t: "C’est une conversation" },
      { type: "p", t: "Pas besoin du prompt parfait : si le résultat n’est pas bon, précise. Mais après deux corrections ratées sur le même point, ne fais pas une troisième tentative. Ouvre une nouvelle session avec un meilleur prompt, qui intègre ce que tu as appris." },
      { type: "h2", t: "Relire et valider" },
      { type: "p", t: "Quand Claude a fini, un indicateur du type `+42 −18` apparaît : lignes ajoutées et supprimées. Ouvre-le pour voir les fichiers modifiés. Touche une ligne pour laisser un commentaire précis : il partira avec ton prochain message, et Claude saura exactement où regarder. Quand tout est bon, « Créer une PR » (une demande de fusion), puis tu fusionnes sur GitHub." },
    ],
    retenir: [
      "Un bon prompt dit ce que Claude ne peut pas voir : intention, contraintes, résultat attendu.",
      "Mode Plan pour démarrer, puis Accepter les modifications pour coder.",
      "Deux corrections ratées : nouvelle session et meilleur prompt.",
      "Relire le diff, commenter une ligne, créer la PR, fusionner.",
    ],
    exercice: {
      intro: "Tu vas faire construire une petite appli : un carnet pour noter des courses de livraison.",
      etapes: [
        { t: "Nouvelle session sur `labo-claude-code`. Dans le menu des modes, à côté de la zone de saisie, choisis **Plan**." },
        { t: "Envoie :", p: "Je veux une petite appli web en un seul fichier index.html, en français, pour noter mes courses de livraison : pour chaque course, la distance en km et le montant gagné en euros. Affiche la liste des courses et les totaux : km, euros et euros par km. Pas de bibliothèque externe, design simple et lisible sur iPad. Propose-moi d’abord un plan." },
        { t: "Lis le plan et demande un changement, par exemple :", p: "Ajoute la date de chaque course." },
        { t: "Valide le plan et laisse Claude coder. Passe en « Accepter automatiquement les modifications » si on te le demande." },
        { t: "Ouvre le diff. Touche une ligne de texte à reformuler et laisse un commentaire, par exemple « écris plutôt Total gagné ». Envoie, puis vérifie que la correction est faite." },
        { t: PR_FUSION },
        { t: "Mets l’appli en ligne : sur GitHub, dans ton dépôt, va dans Settings, puis Pages. Dans « Build and deployment », choisis « Deploy from a branch », la branche `main` et le dossier `/ (root)`, puis Save. Une ou deux minutes plus tard, l’adresse de ton appli s’affiche en haut de la page Pages. Ouvre-la sur ton iPad." },
      ],
    },
  },
  {
    id: 5, section: 2, duree: 30,
    titre: "Explorer, planifier, coder, valider",
    resume: "La méthode en quatre temps pour toute nouvelle fonctionnalité.",
    objectifs: [
      "Appliquer une méthode fiable à toute nouvelle fonctionnalité",
      "Donner à Claude un moyen de vérifier son travail",
      "Valider proprement : relecture, commit, fusion",
    ],
    blocs: [
      { type: "p", t: "La plupart des ratés viennent d’un Claude qui code trop vite, sur une mauvaise compréhension de ce que tu veux. La méthode en quatre temps l’évite." },
      { type: "h2", t: "Les quatre temps" },
      { type: "h3", t: "1. Explorer" },
      { type: "p", t: "Claude lit le code concerné et t’explique ce qu’il a compris. Il ne modifie rien. Toi, tu vérifies qu’il a compris la même chose que toi." },
      { type: "h3", t: "2. Planifier" },
      { type: "p", t: "En mode Plan, Claude propose une approche : les fichiers touchés, les étapes, et comment il vérifiera que ça marche. C’est le moment le moins cher pour changer d’avis : corrige le plan maintenant, pas après 300 lignes de code." },
      { type: "h3", t: "3. Coder" },
      { type: "p", t: "Claude applique le plan. Donne-lui de quoi vérifier son travail : un test, une commande qui répond « réussi » ou « échoué ». Il pourra alors boucler seul jusqu’à ce que tout passe." },
      { type: "h3", t: "4. Valider" },
      { type: "p", t: "Tu relis le diff. Claude enregistre le changement avec un message clair (un **commit**). Tu crées la PR et tu fusionnes." },
      { type: "h2", t: "Quand l’utiliser" },
      { type: "p", t: "Pour une toute petite modification (une faute, une couleur), décris-la directement : pas besoin d’explorer ni de planifier. La méthode sert quand la tâche touche plusieurs fichiers, ou quand tu n’es pas sûr de la bonne approche." },
      { type: "p", t: "Astuce : un plan validé peut être enregistré dans un fichier, par exemple PLAN.md, puis exécuté dans une nouvelle session, avec un contexte propre." },
    ],
    retenir: [
      "Explorer sans modifier, planifier en mode Plan, coder avec une vérification, valider par relecture et commit.",
      "Le plan est le moment le moins cher pour changer d’avis.",
      "Une vérification (un test) permet à Claude de boucler seul.",
    ],
    exercice: {
      intro: "Nouvelle fonctionnalité : les courses doivent rester enregistrées quand tu fermes la page.",
      etapes: [
        { t: "**Explorer.** Nouvelle session, mode Plan :", p: "Lis index.html et explique-moi comment les courses sont stockées aujourd’hui et ce qui se passe quand je recharge la page. Ne modifie rien." },
        { t: "**Planifier.** Toujours en mode Plan :", p: "Propose un plan pour que les courses restent enregistrées dans le navigateur (localStorage) après la fermeture de la page. Dis quelles parties du code changent et comment tu vérifieras que ça marche. Si c’est utile, sors les calculs des totaux dans un fichier calculs.js pour pouvoir les tester." },
        { t: "**Coder.** Passe en « Accepter automatiquement les modifications » :", p: "Applique le plan. Ajoute un fichier de test qui vérifie le calcul des totaux, lance-le avec node --test et montre-moi la sortie complète." },
        { t: "**Valider.**", p: "Fais un commit avec un message clair qui résume le changement.", a: PR_FUSION },
        { t: "Teste en vrai sur ton appli en ligne : ajoute une course, ferme l’onglet, rouvre-le. La course doit toujours être là." },
      ],
    },
  },
  {
    id: 6, section: 2, duree: 10,
    titre: "Gérer le contexte",
    resume: "Ce qui remplit le contexte, /context, /compact, et repartir à zéro.",
    objectifs: [
      "Savoir ce qui remplit la fenêtre de contexte",
      "Utiliser /context et /compact",
      "Savoir quand repartir d’une session neuve",
    ],
    blocs: [
      { type: "h2", t: "Ce qui occupe le contexte" },
      { type: "p", t: "La conversation, les fichiers lus, les sorties de commandes, CLAUDE.md, les skills chargés, les instructions système. Plus le contexte contient de choses sans rapport avec la tâche, plus Claude se disperse, et plus chaque message pèse sur ton quota : chaque requête renvoie toute la conversation." },
      { type: "h2", t: "La compaction" },
      { type: "p", t: "Quand le contexte approche de sa limite, Claude Code résume la conversation. Il garde tes demandes et les extraits de code importants, mais des consignes détaillées du début peuvent disparaître. D’où la règle : ce qui doit durer va dans CLAUDE.md, pas dans la conversation." },
      { type: "h2", t: "Les trois commandes" },
      { type: "tableau", entetes: ["Commande", "Ce qu’elle fait", "Sur le web"], lignes: [
        ["`/context`", "Montre ce qui occupe le contexte", "Oui"],
        ["`/compact`", "Résume la conversation maintenant. Tu peux dire quoi garder : `/compact garde les décisions sur le stockage`", "Oui"],
        ["`/clear`", "Repart d’un contexte vide", "Non : ouvre une nouvelle session depuis la barre latérale"],
      ] },
      { type: "h2", t: "Les bonnes habitudes" },
      { type: "liste", items: [
        "**Une tâche, une session.** Pour une tâche sans rapport, nouvelle session.",
        "**Deux corrections ratées :** nouvelle session, avec un prompt qui intègre ce que tu as appris. Sinon, Claude continue de relire tes deux tentatives ratées.",
        "**Longue tâche :** `/compact` en précisant ce qu’il faut garder.",
        "**Sorties longues** (tous les tests, une grosse recherche) : les sous-agents de la leçon 9 travaillent dans leur propre contexte, et seul leur résumé revient.",
      ] },
    ],
    retenir: [
      "Le contexte, c’est tout ce que Claude a en tête pendant la session.",
      "/context pour voir, /compact pour résumer, nouvelle session pour repartir à zéro.",
      "Ce qui doit durer va dans CLAUDE.md.",
    ],
    exercice: {
      etapes: [
        { t: "Retourne dans la session de la leçon 5 (barre latérale de claude.ai/code) et tape :", p: "/context", a: "Repère ce qui prend le plus de place." },
        { t: "Tape :", p: "/compact garde seulement les décisions sur l’enregistrement des courses et la commande de test" },
        { t: "Retape `/context` et compare avec la première fois." },
        { t: "Pour la leçon suivante, ouvre une nouvelle session depuis la barre latérale : c’est l’équivalent web de `/clear`." },
      ],
      details: [
        { titre: "Pourquoi ne pas tout faire dans une seule session ?", t: [
          "Parce que chaque message renvoie toute la conversation : une session qui a déjà servi à trois tâches sans rapport les relit à chaque tour de la quatrième. Ça coûte du quota, et Claude risque de mélanger des décisions qui n’ont rien à voir.",
        ] },
      ],
    },
  },
  {
    id: 7, section: 2, duree: 25,
    titre: "Relire le code",
    resume: "Vérifications, preuves, relecteur neuf et relecture du diff.",
    objectifs: [
      "Donner à Claude une vérification à exécuter",
      "Exiger des preuves",
      "Faire relire par un regard neuf, et relire toi-même un diff",
    ],
    blocs: [
      { type: "p", t: "Claude s’arrête quand le travail *semble* fini. S’il n’a rien pour vérifier, c’est tout ce sur quoi il peut s’appuyer, et c’est toi qui deviens le testeur." },
      { type: "h2", t: "Quatre réflexes" },
      { type: "h3", t: "Donne-lui une vérification" },
      { type: "p", t: "Un test, un build, un linter : quelque chose qui répond « réussi » ou « échoué ». Claude peut alors modifier, vérifier, corriger et revérifier seul." },
      { type: "h3", t: "Demande des preuves" },
      { type: "p", t: "La commande lancée et sa sortie, ou une capture d’écran. « Tous les tests passent », seul, ne te dit presque rien." },
      { type: "h3", t: "Fais relire par quelqu’un qui n’a pas écrit le code" },
      { type: "p", t: "Une nouvelle session ou un sous-agent ne connaît pas le raisonnement qui a produit le code : il le voit autrement. Demande-lui d’ignorer le style. Un relecteur à qui l’on demande des problèmes en trouvera toujours, et tout corriger alourdit le code. Dans le terminal, la commande `/code-review` fait exactement ça ; sur le web, il suffit de le demander." },
      { type: "h3", t: "Relis toi-même le diff" },
      { type: "p", t: "Pas besoin de tout comprendre. Cherche ce qui te surprend : un fichier modifié que tu n’attendais pas, une suppression importante, un texte bizarre. Et demande des explications sur les lignes que tu ne comprends pas : c’est aussi comme ça qu’on apprend à coder." },
    ],
    retenir: [
      "Sans vérification, « ça semble fini » est la seule preuve de Claude.",
      "Exige la commande et sa sortie.",
      "Un relecteur neuf, à qui on dit d’ignorer le style.",
      "Relis le diff et questionne ce qui te surprend.",
    ],
    exercice: {
      etapes: [
        { t: "Nouvelle session :", p: "Tu relis un code que tu n’as pas écrit. Analyse index.html et calculs.js : signale uniquement les bugs qui changent un résultat (calculs, enregistrement, affichage), ignore le style. Pour chaque bug : fichier, ligne et explication." },
        { t: "Ensuite :", p: "Pour chaque bug confirmé, écris d’abord un test qui échoue, puis corrige, relance node --test et montre-moi la sortie complète." },
        { t: "Ouvre le diff et commente au moins une ligne que tu ne comprends pas, avec : « explique-moi cette ligne simplement »." },
        { t: PR_FUSION },
      ],
      details: [
        { titre: "Et si Claude ne trouve aucun bug ?", t: ["C’est possible. Demande alors :"], p: "Quels cas limites ne sont pas testés ? Par exemple un montant vide, une distance à 0, un nombre négatif. Ajoute les tests qui manquent et corrige ce qui casse." },
      ],
    },
  },
  {
    id: 8, section: 3, duree: 20,
    titre: "Le fichier CLAUDE.md",
    resume: "La mémoire durable du projet : quoi y mettre, et le garder court.",
    objectifs: [
      "Donner à Claude une mémoire durable du projet",
      "Savoir quoi y mettre, et quoi laisser de côté",
      "Le garder court",
    ],
    blocs: [
      { type: "p", t: "Chaque session repart de zéro. **CLAUDE.md** est un fichier à la racine du projet que Claude Code charge au début de chaque session : c’est la mémoire durable du projet." },
      { type: "h2", t: "Quoi y mettre" },
      { type: "p", t: "Seulement ce que Claude ne peut pas trouver en lisant le code :" },
      { type: "liste", items: [
        "les commandes pour vérifier le travail (tests, build) ;",
        "les règles du projet qui ne se voient pas dans le code ;",
        "les pièges : un dossier qui semble inutile mais ne l’est pas, une ancienne façon de faire à ne pas copier ;",
        "tout ce que tu as déjà dû corriger deux fois.",
      ] },
      { type: "p", t: "Inutile d’y décrire l’architecture ou l’organisation des fichiers : Claude la lit lui-même." },
      { type: "h2", t: "Le garder court" },
      { type: "p", t: "Chaque ligne est relue à chaque tâche, qu’elle serve ou non. La documentation conseille de rester sous 200 lignes ; pour un petit projet, une vingtaine suffit. Écrire IMPORTANT en majuscules n’aide pas : si une ligne est ignorée, soit le fichier est trop long, soit c’est une règle sans exception, qui doit devenir un hook (leçon 12)." },
      { type: "code", titre: "Exemple de CLAUDE.md pour ton labo", texte: "# Commandes\n- Tests : node --test\n\n# Règles\n- Interface en français, montants en euros avec 2 décimales.\n- Pas de bibliothèque externe.\n\n# Pièges\n- Les courses sont dans le localStorage : ne change pas le nom\n  de la clé, sinon les courses déjà notées disparaissent." },
      { type: "h2", t: "Les fichiers voisins" },
      { type: "tableau", entetes: ["Fichier", "Rôle"], lignes: [
        ["`CLAUDE.md`", "Les consignes du projet, partagées dans le dépôt"],
        ["`CLAUDE.local.md`", "Tes préférences perso pour ce projet, à exclure du dépôt (dans .gitignore)"],
        ["`.claude/rules/`", "Des règles qui ne se chargent que pour une partie du code"],
        ["`~/.claude/CLAUDE.md`", "Tes préférences pour tous tes projets, sur ton ordinateur. Pas dans les sessions web, qui ne voient que le dépôt"],
      ] },
      { type: "p", t: "La commande `/init` génère une première version à partir du code. Ton travail consiste ensuite surtout à enlever des lignes. Un changement dans CLAUDE.md s’applique aux sessions suivantes." },
    ],
    retenir: [
      "CLAUDE.md se charge au début de chaque session.",
      "N’y mets que ce que Claude ne peut pas trouver seul.",
      "Court : une ligne ignorée est le signe d’un fichier trop long, ou d’une règle qui doit devenir un hook.",
    ],
    exercice: {
      etapes: [
        { t: "Nouvelle session. Tape `/init`. Si la commande n’est pas reconnue, envoie plutôt :", p: "Crée un CLAUDE.md court (moins de 25 lignes) pour ce projet : la commande de test, nos règles (interface en français, pas de bibliothèque externe) et les pièges. Ne décris pas l’organisation des fichiers." },
        { t: "Lis le résultat, puis :", p: "Enlève de CLAUDE.md toutes les lignes qui décrivent ce qui se voit déjà dans le code." },
        { t: "Ajoute une règle :", p: "Ajoute dans CLAUDE.md : chaque montant s’affiche avec le symbole € après le nombre et une virgule, comme 12,50 €." },
        { t: PR_FUSION },
        { t: "Nouvelle session : tape `/context` et vérifie que CLAUDE.md est chargé. Puis :", p: "Ajoute une ligne qui affiche le gain moyen par course.", a: "Regarde si la règle des montants est respectée sans que tu la répètes." },
      ],
    },
  },
  {
    id: 9, section: 3, duree: 20,
    titre: "Les sous-agents",
    resume: "Des Claude secondaires, chacun avec son propre contexte.",
    objectifs: [
      "Comprendre ce qu’est un sous-agent",
      "Savoir quand il est utile, et ce qu’il coûte",
      "Créer ton propre sous-agent relecteur",
    ],
    blocs: [
      { type: "p", t: "Un **sous-agent** est un Claude secondaire que Claude lance pour une tâche précise. Il travaille dans **sa propre fenêtre de contexte** : ses lectures et ses commandes ne remplissent pas ta conversation. Quand il a fini, seul son résumé revient." },
      { type: "p", t: "Claude en utilise déjà tout seul : par exemple un agent d’exploration pour les grandes recherches dans le code." },
      { type: "h2", t: "Quand c’est utile" },
      { type: "liste", items: [
        "Faire plusieurs travaux indépendants en même temps.",
        "Tenir à l’écart une sortie très longue : tous les tests, une grosse recherche.",
        "Avoir un relecteur qui n’a pas vu le code s’écrire.",
        "Donner moins de droits pour une tâche : un relecteur qui peut lire, mais pas modifier.",
      ] },
      { type: "h2", t: "Ce que ça coûte" },
      { type: "p", t: "Chaque sous-agent consomme ton quota comme une conversation. Et le même modèle sur la même tâche ne donne pas une meilleure réponse : tu gagnes du parallélisme ou un regard neuf, pas de l’intelligence en plus." },
      { type: "h2", t: "Créer le tien" },
      { type: "p", t: "Un sous-agent personnalisé est un fichier dans `.claude/agents/`. Il commence par un en-tête, puis ses instructions :" },
      { type: "code", titre: ".claude/agents/relecteur.md", texte: "---\nname: relecteur\ndescription: Relit les fichiers modifiés et signale les bugs. À utiliser après une nouvelle fonctionnalité, avant la PR.\ntools: Read, Grep, Glob\n---\nTu relis un code que tu n’as pas écrit. Signale uniquement les bugs\nqui changent un résultat, avec le fichier et la ligne.\nIgnore le style. Réponds en français." },
      { type: "liste", items: [
        "`name` : son nom.",
        "`description` : Claude s’en sert pour savoir quand l’appeler.",
        "`tools` : les outils autorisés. Ici, lecture et recherche seulement : Claude Code l’impose, le relecteur ne peut rien modifier.",
        "`model` (facultatif) : `haiku` pour une tâche simple, qui coûte beaucoup moins cher.",
      ] },
      { type: "p", t: "Les sous-agents rangés dans `.claude/agents/` du dépôt fonctionnent aussi dans les sessions web." },
    ],
    retenir: [
      "Un sous-agent travaille dans son propre contexte et ne renvoie qu’un résumé.",
      "Utile pour le parallèle, les sorties longues, une relecture neuve, des droits limités.",
      "Il coûte du quota et ne rend pas la réponse plus intelligente.",
    ],
    exercice: {
      etapes: [
        { t: "Nouvelle session :", p: "Crée un sous-agent dans .claude/agents/relecteur.md. Il relit les changements, n’a accès qu’aux outils Read, Grep et Glob, signale uniquement les bugs qui changent un résultat avec le fichier et la ligne, ignore le style et répond en français." },
        { t: PR_FUSION },
        { t: "Nouvelle session :", p: "Ajoute un bouton pour supprimer une course. Ensuite, demande au sous-agent relecteur de vérifier tes changements, et corrige ce qu’il trouve." },
        { t: "Observe : Claude lance le relecteur, reçoit son résumé, puis corrige. Relis le diff, crée la PR et fusionne." },
      ],
    },
  },
  {
    id: 10, section: 3, duree: 15,
    titre: "Les skills",
    resume: "Des procédures enregistrées, lues au besoin ou lancées avec /nom.",
    objectifs: [
      "Comprendre ce qu’est un skill",
      "Savoir quand utiliser un skill plutôt que CLAUDE.md",
      "Créer un skill que tu lances avec /nom",
    ],
    blocs: [
      { type: "p", t: "Un **skill** est une procédure ou un savoir que tu enregistres pour Claude : comment publier une version, comment écrire la documentation, comment ton projet fait telle ou telle chose." },
      { type: "p", t: "Il vit dans `.claude/skills/<nom>/SKILL.md` : un en-tête (nom, description), puis les instructions." },
      { type: "h2", t: "Léger pour le contexte" },
      { type: "p", t: "À chaque session, Claude ne voit que le nom et la description du skill. Il ne lit le reste que quand la tâche en a besoin. Une longue procédure rangée dans un skill ne pèse pas sur une correction de bug sans rapport ; dans CLAUDE.md, elle pèserait à chaque tâche." },
      { type: "tableau", entetes: ["", "CLAUDE.md", "Skill"], lignes: [
        ["Contient", "Ce qui vaut pour toutes les tâches", "Une procédure pour une tâche précise"],
        ["Chargé", "En entier, à chaque session", "Description seule ; le reste à la demande"],
      ] },
      { type: "h2", t: "Qui le déclenche" },
      { type: "p", t: "Soit Claude, quand il juge que la tâche correspond à la description. Soit toi, en tapant `/nom`. Pour un skill qui a des effets (publier, envoyer, pousser), ajoute `disable-model-invocation: true` : Claude ne pourra pas le lancer de lui-même, seul toi le pourras." },
      { type: "p", t: "Même règle que pour CLAUDE.md : n’écris que ce que Claude ne peut pas trouver seul." },
      { type: "code", titre: ".claude/skills/journal/SKILL.md", texte: "---\nname: journal\ndescription: Ajoute au journal du projet un résumé daté des changements de la session.\ndisable-model-invocation: true\n---\n1. Regarde les changements faits pendant cette session.\n2. Ajoute en haut de JOURNAL.md la date du jour, puis une ligne\n   par changement visible pour l’utilisateur.\n3. Écris en français simple, sans détails techniques." },
    ],
    retenir: [
      "Un skill = une procédure rangée dans .claude/skills/<nom>/SKILL.md.",
      "Claude ne lit le contenu complet qu’au besoin.",
      "disable-model-invocation: true pour un skill que toi seul lances, avec /nom.",
    ],
    exercice: {
      etapes: [
        { t: "Nouvelle session :", p: "Crée un skill dans .claude/skills/journal/SKILL.md : quand je tape /journal, tu ajoutes en haut de JOURNAL.md la date du jour et une ligne par changement visible fait pendant la session, en français simple. Mets disable-model-invocation: true." },
        { t: PR_FUSION },
        { t: "Nouvelle session. Fais un petit changement :", p: "Mets les totaux en gras.", a: "Puis tape :", p2: "/journal" },
        { t: "Ouvre le diff et vérifie le contenu de JOURNAL.md." },
      ],
    },
  },
  {
    id: 11, section: 3, duree: 15,
    titre: "MCP",
    resume: "Brancher Claude sur des outils et des données extérieures.",
    objectifs: [
      "Comprendre ce qu’est MCP",
      "Savoir où se déclare un serveur MCP",
      "Connecter un serveur à ton projet",
    ],
    blocs: [
      { type: "p", t: "**MCP** (Model Context Protocol) est un standard pour brancher Claude sur des outils et des données extérieures : Notion, une base de données, un outil de tickets, une documentation… Un **serveur MCP** fournit des outils que Claude peut appeler." },
      { type: "p", t: "Quand un outil a déjà une commande en ligne (comme `gh` pour GitHub), Claude sait souvent s’en servir directement. MCP sert surtout pour les systèmes sans commande en ligne." },
      { type: "h2", t: "Où le déclarer" },
      { type: "liste", items: [
        "**Sur ordinateur**, avec une commande, par exemple `claude mcp add --transport http notion https://mcp.notion.com/mcp`. Puis `/mcp` montre les serveurs connectés. Ce réglage reste sur ton ordinateur.",
        "**Dans le projet**, dans un fichier `.mcp.json` à la racine du dépôt. Il est partagé avec le dépôt, et c’est ce qui fonctionne dans les sessions web.",
      ] },
      { type: "h2", t: "Les précautions" },
      { type: "liste", items: [
        "**Contexte :** chaque serveur connecté ajoute ses noms d’outils et ses instructions au contexte, même quand tu ne t’en sers pas. Désactive ceux dont tu n’as pas besoin.",
        "**Confiance :** un serveur MCP peut lire et envoyer des données. N’ajoute que des serveurs de sources fiables.",
      ] },
    ],
    retenir: [
      "MCP branche Claude sur des outils et des données extérieures.",
      "Sur le web, déclare le serveur dans .mcp.json, dans le dépôt.",
      "Chaque serveur coûte du contexte, et demande de la confiance.",
    ],
    exercice: {
      intro: "Tu vas brancher ton labo sur le serveur MCP de la documentation officielle de Claude Code, hébergé par Anthropic.",
      etapes: [
        { t: "Nouvelle session :", p: "Ajoute à la racine du dépôt un fichier .mcp.json qui déclare un serveur MCP HTTP nommé claude-code-docs, à l’adresse https://code.claude.com/docs/mcp." },
        { t: PR_FUSION },
        { t: "Nouvelle session :", p: "Quels serveurs MCP et quels outils as-tu à ta disposition dans cette session ?" },
        { t: "Puis :", p: "Avec le serveur claude-code-docs, explique-moi en français ce qu’est un hook PreToolUse et dis-moi quelle page de la documentation tu as utilisée." },
      ],
      note: "Si Claude ne voit pas le serveur, demande-lui de vérifier le format du fichier .mcp.json, puis ouvre une nouvelle session.",
    },
  },
  {
    id: 12, section: 3, duree: 20,
    titre: "Les hooks",
    resume: "Des règles imposées par Claude Code, à chaque fois.",
    objectifs: [
      "Distinguer une consigne d’une règle imposée",
      "Connaître les principaux moments où un hook se déclenche",
      "Créer un hook qui bloque une action",
    ],
    blocs: [
      { type: "h2", t: "Consigne ou règle imposée" },
      { type: "p", t: "Ce que tu écris dans un prompt, dans CLAUDE.md ou dans un skill, Claude le lit et **décide** : il le suit presque toujours, mais rien ne le garantit. Un **hook**, c’est Claude Code qui l’exécute, **à chaque fois**, quoi que décide le modèle." },
      { type: "h2", t: "Quand un hook se déclenche" },
      { type: "tableau", entetes: ["Événement", "Moment"], lignes: [
        ["`PreToolUse`", "Avant que Claude utilise un outil (modifier un fichier, lancer une commande)"],
        ["`PostToolUse`", "Juste après"],
        ["`Stop`", "Quand Claude veut terminer son tour"],
        ["`SessionStart`", "Au démarrage d’une session"],
        ["`Notification`", "Quand Claude a besoin de toi"],
      ] },
      { type: "h2", t: "Bloquer une action" },
      { type: "p", t: "Si la commande d’un hook `PreToolUse` se termine avec le code 2, l’action est bloquée, et le message d’erreur est renvoyé à Claude pour qu’il comprenne pourquoi. Pour un hook `Stop`, le code 2 renvoie Claude au travail, par exemple tant que les tests ne passent pas." },
      { type: "h2", t: "Trois usages classiques" },
      { type: "liste", items: [
        "**Formater** automatiquement chaque fichier modifié.",
        "**Bloquer** une commande ou un dossier interdit.",
        "**Être prévenu** quand Claude attend ta réponse.",
      ] },
      { type: "p", t: "Les hooks se déclarent dans `.claude/settings.json`, dans le dépôt. Ils fonctionnent aussi dans les sessions web. Voici le premier usage :" },
      { type: "code", titre: ".claude/settings.json", texte: PRETTIER_HOOK },
      { type: "p", t: "Après chaque modification ou création de fichier (`Edit|Write`), Claude Code lance Prettier sur le fichier concerné. Le nom du fichier arrive en JSON à la commande, et `jq` l’en extrait. Pas besoin d’écrire ce JSON toi-même : décris le hook à Claude, il l’écrira." },
      { type: "h2", t: "N’en abuse pas" },
      { type: "p", t: "Un hook est fait pour une règle **sans aucune exception**. Une simple préférence (« préfère tel style ») reste dans CLAUDE.md, où Claude peut juger si elle s’applique. Mais si une ligne de CLAUDE.md est régulièrement ignorée, c’est le signe qu’elle mérite un hook." },
    ],
    retenir: [
      "Consigne : Claude décide. Hook : Claude Code impose, à chaque fois.",
      "PreToolUse + code 2 = action bloquée.",
      "Les hooks vivent dans .claude/settings.json.",
      "Réserve-les aux règles sans exception.",
    ],
    exercice: {
      etapes: [
        { t: "Nouvelle session :", p: "Crée d’abord un fichier protege/LISEZMOI.md avec une phrase. Ensuite, écris dans .claude/settings.json un hook PreToolUse qui bloque toute modification de fichier dans le dossier protege/ avec le message « Dossier protégé : modification interdite »." },
        { t: PR_FUSION },
        { t: "Nouvelle session :", p: "Ajoute une ligne dans protege/LISEZMOI.md.", a: "Claude doit être bloqué et t’expliquer pourquoi." },
        { t: "Bonus :", p: "Ajoute dans .claude/settings.json un hook PostToolUse qui formate avec Prettier chaque fichier modifié.", a: "Après fusion, dans une nouvelle session, demande une modification et regarde dans le diff si le fichier ressort bien formaté." },
      ],
      details: [
        { titre: "Pourquoi pas une simple ligne dans CLAUDE.md ?", t: [
          "Claude la suivrait presque toujours. Le hook la rend certaine : ce n’est plus Claude qui choisit de la respecter, c’est Claude Code qui l’applique.",
        ] },
      ],
    },
  },
];

export const CLASSER = [
  { t: "Chercher le fichier qui calcule le total", r: "c" },
  { t: "Lire la fonction de calcul", r: "c" },
  { t: "Corriger l’addition dans la fonction", r: "a" },
  { t: "Ajouter un test sur le calcul", r: "a" },
  { t: "Lancer le test et lire le résultat", r: "v" },
  { t: "Relancer le test après une deuxième correction", r: "v" },
];

export const PHASES = { c: "Rassembler le contexte", a: "Agir", v: "Vérifier" };

export const QUIZ = [
  { q: "Quelle est la principale différence entre Claude dans le chat et Claude Code ?", o: ["Claude Code utilise un modèle plus intelligent", "Claude Code agit sur ton projet : il lit, modifie et lance des commandes", "Claude Code ne fonctionne qu’en anglais", "Claude Code n’a pas besoin d’instructions"], b: 1, e: "Le modèle peut être le même. Ce sont les outils qui font de Claude Code un agent.", l: 1 },
  { q: "Quelles sont les trois phases de la boucle agentive ?", o: ["Planifier, coder, publier", "Rassembler le contexte, agir, vérifier", "Lire, écrire, supprimer", "Demander, attendre, répondre"], b: 1, e: "Claude enchaîne ces trois phases, et refait un tour selon ce qu’il découvre.", l: 2 },
  { q: "Tu veux que Claude propose une approche sans toucher aux fichiers. Quel mode choisis-tu ?", o: ["Auto", "Accepter les modifications", "Plan", "Manuel"], b: 2, e: "En mode Plan, Claude explore et propose, sans modifier.", l: 4 },
  { q: "Sur claude.ai/code, comment repars-tu d’un contexte vide ?", o: ["/clear", "/compact", "Une nouvelle session depuis la barre latérale", "Je recharge la page"], b: 2, e: "/clear n’existe pas dans les sessions web : on ouvre une nouvelle session.", l: 6 },
  { q: "Que fait /compact ?", o: ["Il supprime les fichiers inutiles", "Il résume la conversation pour libérer du contexte", "Il compresse le code", "Il ferme la session"], b: 1, e: "Tu peux même préciser ce qu’il faut garder : /compact garde les décisions sur X.", l: 6 },
  { q: "Deux corrections de suite n’ont pas marché. Le mieux est de :", o: ["Réécrire la consigne en MAJUSCULES", "Insister une troisième fois", "Repartir d’une nouvelle session avec un meilleur prompt", "Passer en mode Auto"], b: 2, e: "Sinon, Claude continue de relire tes tentatives ratées.", l: 4 },
  { q: "Qu’est-ce qui a sa place dans CLAUDE.md ?", o: ["La description de chaque fichier", "La commande pour lancer les tests", "Tout l’historique du projet", "Tes mots de passe"], b: 1, e: "Seulement ce que Claude ne peut pas trouver en lisant le code. Et jamais de secrets.", l: 8 },
  { q: "Une ligne de CLAUDE.md est souvent ignorée, et c’est une règle sans exception. Que fais-tu ?", o: ["J’ajoute IMPORTANT", "Je la répète trois fois", "Je la transforme en hook", "Je la supprime"], b: 2, e: "Un hook est appliqué par Claude Code à chaque fois, quoi que décide le modèle.", l: 12 },
  { q: "Quel est le principal intérêt d’un sous-agent ?", o: ["Il est plus intelligent que Claude", "Il travaille dans son propre contexte et ne renvoie qu’un résumé", "Il est gratuit", "Il ne fait jamais d’erreur"], b: 1, e: "Il ne rend pas la réponse plus intelligente et consomme du quota, mais il garde ta conversation légère et apporte un regard neuf.", l: 9 },
  { q: "Où range-t-on un skill dans un dépôt ?", o: [".claude/skills/<nom>/SKILL.md", "Dans CLAUDE.md", "Dans .mcp.json", "Dans README.md"], b: 0, e: "Claude ne voit que son nom et sa description, et lit le reste au besoin.", l: 10 },
  { q: "À quoi sert disable-model-invocation: true dans un skill ?", o: ["À désactiver le skill", "À ce que seul toi puisses le lancer, avec /nom", "À le cacher de ta vue", "À le lancer à chaque session"], b: 1, e: "Utile pour les skills qui ont des effets : publier, envoyer, pousser.", l: 10 },
  { q: "À quoi sert MCP ?", o: ["À accélérer le modèle", "À brancher Claude sur des outils et des données extérieures", "À compresser le contexte", "À écrire des tests"], b: 1, e: "Un serveur MCP fournit des outils que Claude peut appeler.", l: 11 },
  { q: "Pour qu’un serveur MCP fonctionne dans les sessions web, il faut :", o: ["L’ajouter avec claude mcp add sur ton iPad", "Le déclarer dans .mcp.json, dans le dépôt", "L’écrire dans CLAUDE.md", "Rien : ils sont tous actifs"], b: 1, e: "Les sessions web ne voient que le dépôt. Ce qui est réglé sur un ordinateur n’y arrive pas.", l: 11 },
  { q: "Un hook PreToolUse dont la commande se termine avec le code 2 :", o: ["relance l’outil deux fois", "bloque l’action", "ignore l’erreur", "ferme la session"], b: 1, e: "Et son message d’erreur est renvoyé à Claude pour qu’il comprenne.", l: 12 },
  { q: "Quelle est la différence entre une consigne dans CLAUDE.md et un hook ?", o: ["Aucune", "Claude décide de suivre la consigne ; le hook est exécuté à chaque fois par Claude Code", "Le hook est plus lent", "La consigne est imposée, le hook est facultatif"], b: 1, e: "C’est la différence entre une instruction que le modèle interprète et une règle que le logiciel applique.", l: 12 },
];

export const LEXIQUE = [
  ["Agent", "Une IA qui agit sur ton projet avec des outils (lire, modifier, exécuter), au lieu de seulement répondre."],
  ["Boucle agentive", "Le cycle de Claude Code : rassembler le contexte, agir, vérifier, et recommencer jusqu’à ce que la tâche soit faite."],
  ["Branche", "Une version parallèle du code dans un dépôt. Claude y travaille sans toucher à la branche principale (main)."],
  ["CLAUDE.md", "Fichier de consignes chargé au début de chaque session : la mémoire durable du projet."],
  ["Commit", "Un enregistrement d’un ensemble de changements, avec un message qui les décrit."],
  ["Compaction", "Le résumé automatique de la conversation quand le contexte approche de sa limite."],
  ["Contexte (fenêtre de)", "Tout ce que Claude a en tête pendant une session : conversation, fichiers lus, sorties de commandes, consignes."],
  ["Dépôt (repo)", "Le dossier d’un projet suivi par git, ici hébergé sur GitHub."],
  ["Diff", "L’affichage des lignes ajoutées et supprimées par un changement."],
  ["Hook", "Une commande que Claude Code exécute automatiquement à un moment précis (avant ou après un outil, à l’arrêt…), quoi que décide le modèle."],
  ["MCP", "Model Context Protocol : un standard pour brancher Claude sur des outils et des données extérieures."],
  ["Mode Plan", "Mode où Claude explore et propose une approche sans modifier les fichiers."],
  ["PR (pull request)", "Une demande de fusion : on propose d’intégrer les changements d’une branche dans la branche principale."],
  ["Session", "Une conversation de travail avec Claude Code. Chaque nouvelle session repart d’un contexte vide."],
  ["Skill", "Une procédure enregistrée dans .claude/skills/, que Claude lit au besoin ou que tu lances avec /nom."],
  ["Sous-agent", "Un Claude secondaire qui travaille dans son propre contexte et renvoie un résumé."],
];
