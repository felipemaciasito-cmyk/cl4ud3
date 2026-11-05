// Contenu du cours « Claude Code en action », dans l’appli CL4UD3.
// Mise en forme dans les textes : **gras** et `code`.
// Types de blocs : p, h2, h3, liste, tableau, code.
import { PR_FUSION } from "./donnees.js";

export const SECTIONS = [
  "Orienter le travail",
  "Configurer Claude",
  "Automatiser le travail répétitif",
  "Vérifier et partager",
];

const REPONSE_PRETOOLUSE = `{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Clé secrète masquée",
    "updatedInput": {
      "command": "deploy --token=[MASQUÉ]"
    }
  }
}`;

const PLUGIN_ARBRE = `plugin-labo/
├── .claude-plugin/plugin.json   le manifeste
├── agents/relecteur.md
├── skills/journal/SKILL.md
├── skills/verifier/…
├── hooks/hooks.json
└── .mcp.json`;

const PLUGIN_MANIFESTE = `{
  "name": "plugin-labo",
  "version": "0.1.0",
  "description": "Relecteur, journal et vérifications du labo"
}`;

const ACTION_GITHUB = `- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
    trigger_phrase: "@claude"
    claude_args: "--max-turns 5"`;

export const LECONS = [
  {
    id: 1, section: 0, duree: 25,
    titre: "Piloter les sessions longues",
    resume: "Cadrer avant de lancer, puis garder la main pendant que Claude travaille.",
    objectifs: [
      "Cadrer une longue tâche avant que Claude commence",
      "Garder le cap pendant la session : compaction dirigée et retour en arrière",
      "Laisser Claude avancer seul jusqu’à un objectif vérifiable",
    ],
    blocs: [
      { type: "p", t: "Tu as fini Claude Code 101 : tu sais confier une tâche, choisir le mode, relire le diff et fusionner. Ton labo a son CLAUDE.md, un sous-agent, des skills, un serveur MCP et des hooks. Ce cours t’apprend à confier des tâches plus longues, avec moins de surveillance, sans perdre confiance dans le résultat." },
      { type: "p", t: "Une tâche courte se vérifie d’un coup d’œil. Une tâche longue (refaire dix fichiers, construire une fonctionnalité entière) dérape plus facilement, et plus tu corriges en route, plus elle s’éternise. Deux habitudes changent tout : cadrer le travail avant que Claude commence, puis le piloter pendant qu’il avance." },
      { type: "h2", t: "Cadrer d’abord, avec le mode Plan" },
      { type: "p", t: "Tu connais le mode Plan (Claude Code 101, leçon 5) : Claude lit le code et propose un plan, sans rien modifier. Pour une longue tâche, lis vraiment ce plan, ligne par ligne. Ce qui manque, demande-le tout de suite : corriger un plan coûte bien moins cher que réparer après coup." },
      { type: "h2", t: "Piloter pendant que Claude travaille" },
      { type: "h3", t: "Diriger la compaction" },
      { type: "p", t: "La compaction résume la conversation pour libérer le contexte (Claude Code 101, leçon 6). Le risque : un détail important disparaît du résumé, et Claude dévie. Ne tape donc pas `/compact` seul : ajoute derrière ce que le résumé doit garder, par exemple `/compact garde seulement la nouvelle page des statistiques`. Ce que tu écris après la commande, c’est ton volant." },
      { type: "h3", t: "Revenir à un point de contrôle" },
      { type: "p", t: "Chaque message que tu envoies crée un **point de contrôle** : l’état de la conversation et des fichiers à ce moment-là. Quand Claude part dans la mauvaise direction, inutile de lui expliquer comment défaire : tu reviens à un point de contrôle. Dans le terminal, la commande `/rewind` ouvre ce menu :" },
      { type: "liste", items: [
        "**Restaurer le code et la conversation** : tout revient à ce point.",
        "**Restaurer la conversation** : seule la discussion recule, les fichiers restent.",
        "**Restaurer le code** : seuls les fichiers reculent.",
        "**Résumer à partir d’ici** : résume la suite, utile après une discussion annexe.",
        "**Résumer jusqu’ici** : résume ce qui précède, et garde la suite intacte.",
      ] },
      { type: "p", t: "Dans les sessions cloud, la même idée existe sous le nom « Rewind to here » (revenir ici), sur un de tes messages. Et sur le web, ton filet de sécurité reste GitHub : rien n’arrive sur `main` sans ta fusion." },
      { type: "h2", t: "Laisser Claude avancer seul" },
      { type: "h3", t: "La commande /goal : continuer jusqu’à un objectif" },
      { type: "p", t: "Avec `/goal`, tu décris à quoi ressemble « terminé », et Claude enchaîne les tours jusqu’à ce que ce soit vrai. Après chaque tour, un second modèle, l’**évaluateur**, vérifie la condition. Claude ne s’arrête donc pas la première fois qu’il croit avoir fini. `/goal clear` annule l’objectif." },
      { type: "p", t: "L’évaluateur ne lance rien et ne lit aucun fichier : il lit seulement la conversation. Ta condition doit donc se prouver par ce que Claude affiche. « `node --test` réussit et sa sortie complète est affichée » marche. « Le code est propre » ne marche pas." },
      { type: "h3", t: "La commande /loop : relancer à intervalle" },
      { type: "p", t: "`/loop` relance une demande à intervalle régulier, par exemple pour surveiller des tests en cours sur GitHub et agir quand ils finissent. Une boucle à intervalle fixe s’arrête quand tu le demandes, ou au bout de sept jours. Elle vit dans la session : pour un travail régulier sans session ouverte, il y a les tâches planifiées (leçon 6)." },
      { type: "h2", t: "Travailler en parallèle sans collision" },
      { type: "p", t: "Deux sessions qui modifient les mêmes fichiers au même moment se marchent dessus. Sur ordinateur, la solution s’appelle un **worktree** : une copie de travail séparée du dépôt pour chaque session. Un fichier `.worktreeinclude` liste les fichiers ignorés par git à recopier dans chaque copie, comme une configuration locale." },
      { type: "p", t: "Sur le web, tu as déjà cette séparation : chaque session travaille dans sa propre copie du dépôt et pousse sa propre branche. Les conflits n’apparaissent qu’au moment de fusionner, et GitHub te les signale." },
    ],
    retenir: [
      "Cadre d’abord en mode Plan, puis pilote.",
      "Dis à /compact ce que le résumé doit garder.",
      "Un point de contrôle permet de revenir en arrière au lieu de réexpliquer.",
      "/goal fait continuer Claude jusqu’à une condition prouvée dans la conversation.",
    ],
    exercice: {
      intro: "On reprend `SPECIFICODE` là où Claude Code 101 l’a laissé (Claude Code 101, leçon 12). Nouvelle fonctionnalité : les totaux du mois en cours, au-dessus de la liste.",
      etapes: [
        { t: "Nouvelle session sur `SPECIFICODE`, en mode **Plan** :", p: "Lis d’abord le code de l’appli et ses tests. Je veux afficher au-dessus de la liste les totaux du mois en cours : km, euros et euros par km. Propose un plan : les fichiers touchés, la fonction de calcul à ajouter et les tests à écrire dans le fichier de test existant. Respecte CLAUDE.md. Ne modifie rien.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Aucune", autorisations: "Plan" } },
        { t: "Lis le plan en entier. Demande ce qui manque, par exemple :", p: "Affiche ces totaux dans un encadré, avec le nom du mois en français, comme Novembre 2026.", cfg: { session: "Même session que l’étape 1", depot: "SPECIFICODE", branche: "Aucune", autorisations: "Plan" } },
        { t: "Valide le plan. Si on te propose un mode, choisis « Accepter automatiquement les modifications ». Laisse Claude coder.", cfg: { session: "Même session que l’étape 1", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" } },
        { t: "Quand il a fini, fixe-lui un objectif vérifiable :", p: "/goal node --test réussit, un test couvre les totaux du mois en cours, un autre couvre un mois sans aucune course, et la sortie complète de node --test est affichée dans la conversation", cfg: { session: "Même session que l’étape 1", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" }, a: "Observe : si la condition est déjà remplie, l’évaluateur le confirme aussitôt. Sinon, Claude enchaîne les tours sans que tu le relances, jusqu’à ce qu’elle le soit." },
        { t: PR_FUSION },
        { t: "Ouvre ton appli en ligne sur l’iPad. Ajoute une course datée d’aujourd’hui et vérifie que les totaux du mois changent." },
      ],
      note: "Si Claude part dans une mauvaise direction, ne réexplique pas tout : cherche « Rewind to here » sur ton dernier bon message, ou tape `/goal clear` et reformule.",
      details: [
        { titre: "Et si /goal n’est pas reconnu ?", t: ["Envoie la même condition sous forme de demande. Tu perds l’évaluateur séparé : relis donc toi-même la sortie des tests."], p: "Continue de travailler sans t’arrêter jusqu’à ce que node --test réussisse, avec un test pour les totaux du mois en cours et un autre pour un mois sans aucune course. Affiche ensuite la sortie complète de node --test.", cfg: { session: "Même session que l’étape 4", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" } },
      ],
    },
  },
  {
    id: 2, section: 1, duree: 20,
    titre: "Un CLAUDE.md que Claude suit",
    resume: "Un fichier court, des règles précises, et les règles dures dans des hooks.",
    objectifs: [
      "Savoir ce qui relève de CLAUDE.md, et ce qui relève d’un hook",
      "Connaître les quatre emplacements de CLAUDE.md et les imports",
      "Écrire des règles précises, vérifiables, qui disent quoi faire",
    ],
    blocs: [
      { type: "p", t: "Un piège guette presque tout le monde : CLAUDE.md grossit. Un problème, une règle de plus. Un autre problème, encore une règle. Un jour, Claude en ignore une partie. Ce n’est pas un bug : chaque ligne est en concurrence avec les autres pour son attention. Plus le fichier est court, mieux Claude le suit (Claude Code 101, leçon 8)." },
      { type: "h2", t: "Une consigne, pas une contrainte" },
      { type: "p", t: "CLAUDE.md oriente Claude, il ne l’oblige à rien. Prends la règle « ne jamais pousser sur main ». Écrite dans CLAUDE.md, Claude la respectera presque toujours. Pour une règle aussi risquée, « presque » ne suffit pas. Elle va dans un hook `PreToolUse`, qui bloque l’action à chaque fois (Claude Code 101, leçon 12), ou dans une protection de branche sur GitHub." },
      { type: "p", t: "Garde CLAUDE.md pour les conventions, et confie les règles sans exception aux hooks." },
      { type: "h2", t: "Les quatre emplacements de CLAUDE.md" },
      { type: "p", t: "CLAUDE.md peut se trouver à quatre endroits. Claude Code les charge tous au démarrage et les additionne : aucun ne remplace l’autre." },
      { type: "tableau", entetes: ["Emplacement", "À quoi il sert"], lignes: [
        ["Organisation", "Fixé par l’équipe qui gère les comptes ; impossible à désactiver"],
        ["Utilisateur : `~/.claude/CLAUDE.md`", "Tes préférences pour tous tes projets, sur ton ordinateur"],
        ["Projet : `CLAUDE.md`", "Les règles partagées, dans le dépôt"],
        ["Local : `CLAUDE.local.md`", "Tes notes pour ce dépôt, ignorées par git"],
      ] },
      { type: "p", t: "Le fichier local sert par exemple à garder en tête des décisions pendant un travail sur ta propre branche, sans les imposer à toute l’équipe. Sur le web, seul compte ce qui est dans le dépôt : les fichiers utilisateur et local restent sur un ordinateur et n’arrivent pas dans tes sessions." },
      { type: "h2", t: "Découper CLAUDE.md avec des imports" },
      { type: "p", t: "Quand le fichier du projet s’allonge, tu peux le découper : une ligne `@chemin/du/fichier.md` insère un autre fichier à cet endroit. C’est pratique pour ranger. Mais les fichiers importés se chargent quand même en entier au démarrage : les imports organisent, ils n’allègent pas le contexte." },
      { type: "code", titre: "CLAUDE.md", texte: "# Conventions\n@.claude/conventions/style.md\n@.claude/conventions/tests.md" },
      { type: "h2", t: "Écrire des règles que Claude suit" },
      { type: "h3", t: "Une règle précise et vérifiable" },
      { type: "p", t: "« Suis les bonnes pratiques » ne se vérifie pas : ni toi ni Claude ne pouvez dire si c’est fait. « Place chaque nouvelle fonction de calcul dans calculs.js, avec son test » se vérifie d’un coup d’œil. Chaque règle doit passer ce test." },
      { type: "h3", t: "Dire quoi faire à la place d’un interdit" },
      { type: "p", t: "Une interdiction seule laisse une porte ouverte. « N’utilise pas de bibliothèque » : d’accord, mais alors quoi ? « Écris le code en JavaScript sans bibliothèque, avec les fonctions du navigateur » ferme la porte." },
      { type: "h3", t: "Écrire sans crier" },
      { type: "p", t: "Le cours d’origine conseille de réserver IMPORTANT et les majuscules aux deux ou trois règles qui comptent le plus, puisque l’emphase n’agit que si elle est rare. La documentation va plus loin : les modèles actuels suivent une ligne écrite simplement, et l’emphase les pousse surtout à trop appliquer la règle. Écris donc normalement. Si une ligne est ignorée, raccourcis le fichier ou fais-en un hook." },
      { type: "h2", t: "Un fichier toujours en révision" },
      { type: "p", t: "Quand Claude se trompe, ne corrige pas seulement à la main : traite l’erreur comme un bug de CLAUDE.md. Demande-lui d’ajouter la règle qui l’aurait évitée, il l’écrira. Et si tu ne sais plus justifier une ligne, supprime-la." },
    ],
    retenir: [
      "CLAUDE.md oriente ; un hook impose.",
      "Les imports rangent le fichier, sans alléger le contexte.",
      "Une bonne règle est précise, vérifiable, et dit quoi faire à la place.",
      "Chaque erreur de Claude est une occasion de corriger CLAUDE.md.",
    ],
    exercice: {
      intro: "Tu vas faire relire le CLAUDE.md de ton labo, écrit à la leçon 8 de Claude Code 101, avec les critères de cette leçon.",
      etapes: [
        { t: "Nouvelle session, en mode **Plan** :", p: "Relis CLAUDE.md. Pour chaque règle, dis si elle est précise et vérifiable, si une interdiction dit quoi faire à la place, et si c’est une règle sans aucune exception qui serait mieux dans un hook. Propose une version réécrite plus courte, en gardant toutes nos règles : la commande de test, l’interface en français, pas de bibliothèque externe, les montants comme 12,50 €, et la clé du localStorage à ne jamais changer. Ne modifie rien.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Aucune", autorisations: "Plan" } },
        { t: "Lis les propositions. Si Claude conseille de transformer une règle en hook, note-le : tu écriras des hooks à la leçon 5. Pour l’instant :", p: "Applique ta version réécrite de CLAUDE.md, sans créer de hook. Montre-moi l’ancien et le nouveau nombre de lignes.", cfg: { session: "Même session que l’étape 1", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" } },
        { t: PR_FUSION },
        { t: "Nouvelle session, sans rappeler aucune règle :", p: "Ajoute sous les totaux du mois une ligne avec le nombre de courses du mois.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" } },
        { t: "Relis le diff : les règles de CLAUDE.md sont-elles respectées sans que tu les aies rappelées ? Si l’une ne l’est pas, envoie :", p: "Tu n’as pas respecté une règle de CLAUDE.md. Corrige le code, puis réécris cette règle dans CLAUDE.md pour qu’elle soit plus précise.", cfg: { session: "Même session que l’étape 4", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" } },
        { t: PR_FUSION },
      ],
    },
  },
  {
    id: 3, section: 1, duree: 20,
    titre: "Un skill de vérification",
    resume: "Une procédure qui vérifie le travail de Claude, sans que tu y penses.",
    objectifs: [
      "Comprendre pourquoi un skill de vérification vient en premier",
      "Ranger des fichiers annexes et des scripts dans un skill",
      "Choisir entre CLAUDE.md, un skill et un hook",
    ],
    blocs: [
      { type: "p", t: "Tu connais les skills : des procédures rangées dans `.claude/skills/` (Claude Code 101, leçon 10). Ton skill `/journal` ne se lance que si tu le tapes. Celui de cette leçon se lance tout seul, pour la tâche la plus utile à automatiser : vérifier le travail." },
      { type: "h2", t: "Pourquoi commencer par un skill de vérification" },
      { type: "p", t: "D’habitude, quand Claude a fini, c’est à toi de penser à vérifier : lancer les tests, lire le diff. Le jour où tu oublies, une erreur passe. Un skill de vérification supprime cet oubli. Sa description dit quand il s’applique, par exemple « après toute modification du code » : Claude le lance alors de lui-même, et suit les mêmes étapes à chaque fois." },
      { type: "liste", items: [
        "Lancer tous les tests.",
        "Lire le diff.",
        "Vérifier qu’aucun test n’a été affaibli pour passer.",
        "Annoncer RÉUSSI ou ÉCHEC, avec les preuves.",
      ] },
      { type: "p", t: "Le troisième point compte. Un test peut être assoupli en douce, et il passe alors quoi qu’il arrive. « Terminé » ne veut pas dire « le code a l’air bon » : cela veut dire que les vérifications ont tourné, et que leurs résultats sont écrits noir sur blanc." },
      { type: "p", t: "La règle pratique : si tu as tapé deux fois la même consigne en plusieurs étapes, fais-en un skill. Une liste avant publication, une vérification avant PR, une recette de migration." },
      { type: "h2", t: "Un skill est un dossier" },
      { type: "p", t: "À côté de `SKILL.md`, le dossier d’un skill peut contenir :" },
      { type: "liste", items: [
        "**Un fichier de référence**, comme `reference.md`, pour les détails. Cite-le depuis `SKILL.md` : Claude ne le lit que s’il en a besoin.",
        "**Des scripts**, comme `verifier.sh`. Claude les exécute, sans charger leur contenu dans le contexte.",
      ] },
      { type: "p", t: "Garde `SKILL.md` léger : il dit quoi faire. Les fichiers annexes portent les détails et les outils." },
      { type: "code", titre: ".claude/skills/verifier/", texte: "verifier/\n├── SKILL.md      la procédure, courte\n└── verifier.sh   lance tous les contrôles" },
      { type: "h2", t: "Où ranger chaque règle" },
      { type: "tableau", entetes: ["Où", "Pour quoi"], lignes: [
        ["CLAUDE.md", "Les conventions valables tout le temps"],
        ["Skill", "Une procédure pour un type de tâche"],
        ["Hook", "Une règle que Claude ne doit jamais contourner"],
      ] },
      { type: "p", t: "CLAUDE.md et les skills sont des instructions que Claude suit. Un hook est du code que Claude Code exécute. Si une entorse est inacceptable, ne la laisse pas dépendre d’une instruction." },
    ],
    retenir: [
      "Le premier skill à écrire est celui qui vérifie le travail.",
      "Sa description le déclenche ; il suit les mêmes étapes à chaque fois.",
      "SKILL.md reste court ; les détails et les scripts vont à côté.",
      "Consigne permanente : CLAUDE.md. Procédure : skill. Règle absolue : hook.",
    ],
    exercice: {
      etapes: [
        { t: "Nouvelle session :", p: "Lis d’abord les tests du projet et la façon de les lancer. Crée un skill dans .claude/skills/verifier/ : un fichier SKILL.md court et un script verifier.sh qui lance node --test. Sa description dit qu’il s’applique après toute modification du code de l’appli. Ses étapes : lancer verifier.sh, lire le diff par rapport à main, vérifier qu’aucun test n’a été supprimé ni assoupli, puis conclure par RÉUSSI ou ÉCHEC avec la sortie complète des tests. Ne mets pas disable-model-invocation.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" } },
        { t: PR_FUSION },
        { t: "Nouvelle session. Demande un changement sans parler de vérification :", p: "Affiche sous les totaux la meilleure course : celle qui a rapporté le plus d’euros par km.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" }, a: "Observe : Claude lance le skill verifier de lui-même et conclut par RÉUSSI ou ÉCHEC, avec la sortie des tests." },
        { t: "S’il ne s’est pas lancé, demande :", p: "Pourquoi n’as-tu pas utilisé le skill verifier ? Réécris sa description pour qu’il se déclenche après ce genre de changement.", cfg: { session: "Même session que l’étape 3", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" } },
        { t: PR_FUSION },
      ],
    },
  },
  {
    id: 4, section: 1, duree: 15,
    titre: "Les modes de permission",
    resume: "Choisir le niveau de confiance adapté à la tâche, jusqu’au mode Auto.",
    objectifs: [
      "Connaître les six modes de permission",
      "Comprendre ce que le mode Auto surveille, et ce qu’il ne voit pas",
      "Choisir le mode adapté à une tâche surveillée ou non",
    ],
    blocs: [
      { type: "p", t: "Un mode de permission décide une fois pour toutes de ce que Claude peut faire sans te demander. Tu en connais quatre (Claude Code 101, leçon 2). Il en existe six, et les deux derniers servent quand personne ne regarde." },
      { type: "h2", t: "Les six modes de permission" },
      { type: "tableau", entetes: ["Mode", "Sans te demander, Claude peut…"], lignes: [
        ["Manuel", "Lire. Tout le reste demande ton accord"],
        ["Accepter les modifications", "Lire, modifier les fichiers, lancer les commandes courantes sur les fichiers"],
        ["Plan", "Lire et explorer, sans modifier ton code"],
        ["Auto", "Tout, mais un classifieur examine la plupart des actions"],
        ["Ne pas demander", "Lire et utiliser les outils autorisés d’avance ; le reste est refusé"],
        ["Contourner les permissions", "Tout, sans aucune vérification"],
      ] },
      { type: "p", t: "Sur le web, le menu sous la zone de saisie propose trois modes : « Accepter automatiquement les modifications », Plan et Auto. Auto n’y apparaît que si ton modèle le prend en charge. Dans le terminal, on passe d’un mode à l’autre au clavier, et la barre du bas affiche le mode actif." },
      { type: "h2", t: "Comment marche le mode Auto" },
      { type: "p", t: "En mode Auto, Claude avance seul. Avant la plupart des actions, un second modèle, le **classifieur**, vérifie qu’elles restent dans ce que tu as demandé." },
      { type: "tableau", entetes: ["Il bloque, par exemple", "Il laisse passer"], lignes: [
        ["Un déploiement en production", "Les modifications locales du projet"],
        ["Un force push (envoi forcé)", "Les dépendances du fichier de verrouillage"],
        ["Un script téléchargé puis exécuté", "Les requêtes en lecture seule"],
        ["La suppression de fichiers qui existaient avant la session", "Un push vers une branche du dépôt"],
      ] },
      { type: "p", t: "Attention : « une branche du dépôt » inclut `main`. Si tu ne veux jamais de push direct sur `main`, impose-le avec un hook ou une protection de branche sur GitHub. Ces listes évoluent : la documentation fait foi." },
      { type: "h2", t: "Ce que le classifieur ne voit pas" },
      { type: "p", t: "Il juge l’intention, pas la justesse. Si Claude écrit un calcul faux, rien de dangereux ne se passe : le classifieur laisse faire. D’où le duo à retenir : le mode Auto surveille ce que Claude essaie de faire pendant le travail, et un hook `Stop` qui lance les tests vérifie que le code marche à la fin (leçon 5)." },
      { type: "h2", t: "Les modes pour le travail sans témoin" },
      { type: "liste", items: [
        "**Ne pas demander** : pour un pipeline d’intégration continue ou un script de nuit. Ce qui demanderait une approbation est refusé d’office, et le travail ne reste pas bloqué à attendre une réponse.",
        "**Contourner les permissions** : seulement dans un conteneur ou une machine virtuelle isolés.",
        "Ces deux modes ne sont pas proposés sur le web. Les tâches planifiées, elles, démarrent en mode Auto quand il est disponible (leçon 6).",
      ] },
    ],
    retenir: [
      "Six modes, du plus prudent (Manuel) au plus libre (Contourner les permissions).",
      "En mode Auto, un classifieur vérifie l’intention avant la plupart des actions.",
      "Le classifieur ne vérifie pas que le code marche : il faut des tests et un hook.",
      "Ne pas demander pour l’automatisation ; Contourner seulement dans un conteneur isolé.",
    ],
    exercice: {
      intro: "D’abord, classe ces actions selon ce que fait le mode Auto par défaut. Ensuite, une petite tâche en mode Auto.",
      classer: true,
      etapes: [
        { t: "Nouvelle session. Dans le menu des modes, choisis **Auto**. Envoie :", p: "Ajoute un bouton pour vider le formulaire de saisie d’une course. Lance node --test et montre-moi la sortie complète. À la fin, liste toutes les commandes que tu as lancées.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Auto" }, a: "Observe : Claude ne te demande rien. Lis la liste des commandes : pour chacune, tu dois pouvoir dire pourquoi elle était sans danger." },
        { t: PR_FUSION },
      ],
      note: "Si Auto n’apparaît pas dans le menu, ton modèle ne le prend peut-être pas en charge : essaie un autre modèle, ou fais l’exercice en « Accepter automatiquement les modifications ».",
    },
  },
  {
    id: 5, section: 1, duree: 25,
    titre: "Aller plus loin avec les hooks",
    resume: "Bloquer, réécrire, refuser de s’arrêter, et garder le fil après une compaction.",
    objectifs: [
      "Connaître les événements de hook les plus utiles",
      "Maîtriser les codes de sortie et la décision d’un hook PreToolUse",
      "Imposer les tests avant la fin d’un tour",
    ],
    blocs: [
      { type: "p", t: "Tu sais qu’un hook transforme « Claude le fait en général » en « Claude ne peut pas l’éviter » (Claude Code 101, leçon 12). Pendant une longue session que tu ne surveilles pas, « en général » ne suffit plus. Cette leçon va plus loin : les bons événements, les codes de sortie, et deux hooks que tu vas ajouter au labo." },
      { type: "h2", t: "Les événements de hook à connaître" },
      { type: "p", t: "Claude Code déclenche plus de trente événements de hook. Une poignée suffit au quotidien :" },
      { type: "tableau", entetes: ["Événement", "Quand"], lignes: [
        ["`PreToolUse`", "Avant un outil : il peut l’empêcher"],
        ["`PostToolUse`", "Après un outil réussi : formatage, vérifications"],
        ["`Stop`", "Quand Claude veut finir son tour"],
        ["`SubagentStop`", "Quand un sous-agent veut finir"],
        ["`PreCompact`, `PostCompact`", "Avant et après une compaction"],
        ["`InstructionsLoaded`", "Quand un CLAUDE.md ou un fichier de règles se charge"],
        ["`SessionStart`", "Au démarrage, à la reprise, ou après une compaction"],
      ] },
      { type: "h2", t: "Les codes de sortie d’un hook" },
      { type: "p", t: "Un hook simple répond par son **code de sortie** : le nombre que renvoie sa commande en se terminant." },
      { type: "liste", items: [
        "**0** : tout va bien. Pour `SessionStart`, le texte affiché par la commande est ajouté au contexte de Claude.",
        "**2** : blocage. Le message d’erreur est renvoyé à Claude. Sur `PreToolUse`, l’outil n’est pas lancé ; sur `Stop`, Claude doit continuer.",
        "**Tout autre code** : erreur non bloquante. L’action continue.",
      ] },
      { type: "p", t: "Le piège classique, c’est le code 1 : il ressemble à une erreur, mais il ne bloque rien. Pour arrêter quelque chose, c’est 2. Et sur `PostToolUse`, même le code 2 arrive trop tard : l’outil a déjà tourné, Claude reçoit seulement le message." },
      { type: "h2", t: "Décider ou réécrire un appel d’outil" },
      { type: "p", t: "Un hook `PreToolUse` peut aussi répondre en JSON, avec le champ `permissionDecision` : `allow` (laisser passer), `deny` (refuser) ou `ask` (te demander). Une quatrième valeur, `defer`, ne sert qu’en mode non interactif (leçon 6)." },
      { type: "code", titre: "Réponse JSON d’un hook PreToolUse", texte: REPONSE_PRETOOLUSE },
      { type: "p", t: "Le champ `updatedInput` réécrit l’appel au lieu de le bloquer. Un hook peut ainsi remplacer une clé secrète par un masque : la commande tourne quand même, mais sans la clé. Attention, `updatedInput` remplace toute l’entrée de l’outil : recopie les champs que tu ne changes pas, sinon ils disparaissent." },
      { type: "h2", t: "Garder le fil après une compaction" },
      { type: "p", t: "Après une compaction, Claude perd des détails. Un hook `SessionStart` dont le filtre, le **matcher**, vaut `compact` se lance juste après. Ce qu’il affiche revient dans le contexte, par exemple la liste des fichiers modifiés, et Claude reprend là où il en était. Le piège : `PostCompact` se déclenche aussi, mais sa sortie ne revient pas dans la conversation." },
      { type: "h2", t: "Empêcher Claude de finir sur un échec" },
      { type: "p", t: "Un hook `Stop` qui lance les tests et sort avec le code 2 en cas d’échec empêche Claude de finir tant que les tests ne passent pas. Claude lit l’échec et corrige seul. Pour éviter une boucle sans fin, Claude Code transmet au hook le champ `stop_hook_active`, vrai quand Claude continue déjà à cause d’un hook `Stop` : le hook peut alors le laisser finir." },
    ],
    retenir: [
      "Le code 2 bloque ; le code 1 ne bloque rien.",
      "PreToolUse peut refuser, demander, ou réécrire l’appel avec updatedInput.",
      "SessionStart avec le matcher compact remet l’essentiel dans le contexte.",
      "Un hook Stop qui lance les tests empêche de finir sur un échec.",
    ],
    exercice: {
      etapes: [
        { t: "Nouvelle session :", p: "Lis d’abord .claude/settings.json et garde tous les hooks existants. Ajoute un hook Stop qui lance node --test : si les tests échouent, il sort avec le code 2 et renvoie la fin de la sortie des tests, sauf si le champ stop_hook_active de son entrée vaut true. Ajoute aussi un hook SessionStart avec le matcher compact, qui affiche la liste des fichiers modifiés par rapport à main. Range les commandes dans des scripts du dossier .claude/hooks/. Teste chaque script à la main et montre-moi les sorties.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" } },
        { t: PR_FUSION },
        { t: "Nouvelle session. Teste le hook Stop :", p: "Pour tester le hook Stop, ajoute dans le fichier de test un test qui échoue exprès, puis termine ton tour sans rien faire d’autre. Quand le hook te bloque, retire ce test et montre-moi le message que le hook t’a renvoyé.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" }, a: "Observe : Claude ne peut pas finir tant que le test qui échoue est là." },
        { t: "Dans la même session, tape :", p: "/compact garde seulement ce qu’on a appris sur le hook Stop", cfg: { session: "Même session que l’étape 3", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" }, a: "Puis demande :", p2: "Qu’est-ce que le hook SessionStart t’a rappelé juste après la compaction ?", cfg2: { session: "Même session que l’étape 3", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" } },
        { t: "Ouvre le diff : il doit être vide, puisque le test a été retiré. Rien à fusionner dans cette session." },
      ],
      note: "Si Claude dit n’avoir rien reçu après la compaction, demande-lui de vérifier le matcher du hook SessionStart dans .claude/settings.json.",
    },
  },
  {
    id: 6, section: 2, duree: 20,
    titre: "Tâches planifiées et mode non interactif",
    resume: "Faire tourner Claude sans toi, dans le cloud ou depuis tes scripts.",
    objectifs: [
      "Savoir ce qu’est une tâche planifiée et ce qui la déclenche",
      "Créer et lancer une tâche planifiée depuis l’iPad",
      "Situer le mode non interactif et l’Agent SDK",
    ],
    blocs: [
      { type: "p", t: "Quand tu fais confiance à Claude pour une tâche qui revient, l’étape suivante est d’arrêter de la lancer toi-même. Deux familles d’outils existent : les tâches planifiées, qui tournent chez Anthropic sans rien à installer, et le mode non interactif, que tu pilotes depuis tes propres scripts." },
      { type: "h2", t: "Les tâches planifiées" },
      { type: "p", t: "Une **tâche planifiée** réunit un prompt, un ou plusieurs dépôts et, si besoin, des connecteurs. Elle tourne dans le cloud d’Anthropic à chaque déclenchement : ton iPad peut rester éteint. Le cours d’origine les appelle encore **routines**, leur ancien nom, et certains comptes affichent toujours ce mot." },
      { type: "p", t: "Trois déclencheurs, qui se combinent :" },
      { type: "liste", items: [
        "**Planification** : toutes les heures, chaque jour, chaque semaine, ou une seule fois à une date.",
        "**API** : un appel web vers l’adresse de la tâche, avec un jeton, depuis ton propre code.",
        "**Événement GitHub** : une nouvelle PR, une nouvelle version publiée…",
      ] },
      { type: "p", t: "Exemples : un audit des dépendances chaque matin, un tri des nouvelles PR, un résumé chaque semaine. Sur le web, on les crée à l’adresse claude.ai/code/routines. Sur ordinateur, la commande `/schedule` fait la même chose en langage courant. Elles sont incluses dans Pro." },
      { type: "h2", t: "Avant de te fier à une tâche planifiée" },
      { type: "liste", items: [
        "**Aperçu de recherche** : le fonctionnement et les limites peuvent encore changer.",
        "**Au plus une fois par heure** pour une planification récurrente.",
        "**Point de départ** : une copie neuve de ta branche par défaut. Claude pousse sur une branche `claude/…`, sauf si le prompt en nomme une autre.",
        "**Quota** : chaque exécution consomme ton abonnement, comme une session.",
        "**Mode Auto** : chaque exécution démarre en mode Auto quand il est disponible (leçon 4).",
      ] },
      { type: "h2", t: "Le mode non interactif" },
      { type: "p", t: "Quand la tâche a besoin de ton propre environnement, on passe au **mode non interactif** (ancien nom : headless), sur ordinateur. L’option `-p` lance Claude Code pour une seule demande, sans interface : il lit l’entrée, écrit la sortie, et s’enchaîne avec d’autres commandes." },
      { type: "code", titre: "Dans un terminal", texte: "claude -p \"Résume les changements de ce diff\"" },
      { type: "liste", items: [
        "`--output-format json` avec `--json-schema` : une réponse structurée, rangée dans le champ `structured_output`.",
        "`--resume` avec l’identifiant d’une session : un second script reprend le travail du premier, avec tout son contexte.",
        "`--bare` : ignore les hooks, skills, plugins, serveurs MCP et CLAUDE.md, pour avoir la même configuration sur chaque machine d’intégration continue. Il n’utilise pas ton abonnement : il faut une clé API.",
      ] },
      { type: "p", t: "Au bout du chemin, l’**Agent SDK** place le moteur de Claude Code dans tes propres applications, en TypeScript ou en Python." },
      { type: "h2", t: "Choisir entre ces outils" },
      { type: "tableau", entetes: ["Besoin", "Outil"], lignes: [
        ["Une tâche qui revient, sans rien héberger", "Tâche planifiée"],
        ["Un script qui enchaîne des commandes", "Mode non interactif (`-p`)"],
        ["La même configuration partout en CI", "`--bare`"],
        ["Claude dans ton propre produit", "Agent SDK"],
      ] },
      { type: "p", t: "Commence par les tâches planifiées. Ne descends dans la liste que si la tâche a vraiment besoin de plus de contrôle." },
    ],
    retenir: [
      "Une tâche planifiée réunit un prompt, des dépôts et des déclencheurs, dans le cloud.",
      "Sur iPad : claude.ai/code/routines, au plus une exécution récurrente par heure.",
      "Le mode non interactif et l’Agent SDK servent quand la tâche a besoin de ton environnement.",
    ],
    exercice: {
      intro: "Tu vas créer une tâche planifiée qui contrôle ton labo chaque semaine. Elle ne modifie rien : elle fait un rapport.",
      etapes: [
        { t: "Dans Safari, ouvre claude.ai/code/routines. Touche « New task » (ou « New routine », selon ton compte). Si un menu propose « Create with Claude » et « Set up manually », choisis « Set up manually »." },
        { t: "Nomme la tâche « Contrôle du labo », puis colle ce prompt :", p: "Tu contrôles le dépôt SPECIFICODE. Lance node --test et lis la sortie complète. Vérifie que JOURNAL.md contient une entrée de moins de 30 jours. Ne modifie aucun fichier et ne pousse rien. Termine par un rapport en français de 5 lignes au plus : RÉUSSI ou ÉCHEC pour les tests avec leur nombre, puis ce qu’il faudrait faire ensuite.", cfg: { env: "Tâche planifiée sur claude.ai/code/routines", session: "Tâche planifiée (pas une session)", depot: "SPECIFICODE", branche: "Aucune", autorisations: "À vérifier dans le réglage de la tâche" } },
        { t: "Dans la ligne « Trigger », choisis « Schedule » et une fréquence hebdomadaire, par exemple le lundi à 9 h 07 : une heure pile peut démarrer avec quelques minutes de retard. Dans « Advanced settings », choisis le dépôt `SPECIFICODE` et garde l’environnement par défaut. Retire les connecteurs dont la tâche n’a pas besoin, puis touche « Create »." },
        { t: "Sur la page de la tâche, touche « Run now » pour la lancer tout de suite. Quand l’exécution apparaît dans « History », ouvre-la.", a: "Lis la session : quelles commandes Claude a-t-il lancées ? Le rapport tient-il en 5 lignes ? Le dépôt est-il resté intact ?" },
        { t: "Décide : garde la tâche active, ou suspends-la avec l’interrupteur en haut de sa page. Chaque exécution consomme ton quota comme une session." },
      ],
      note: "Si le formulaire ne ressemble pas à ces étapes, l’interface a changé : cherche les mêmes réglages (nom, prompt, déclencheur, dépôt). La page s’appelle peut-être encore « Routines ».",
    },
  },
  {
    id: 7, section: 2, duree: 30,
    titre: "GitHub Actions et revue de code",
    resume: "Mettre Claude au travail dans tes pull requests.",
    objectifs: [
      "Distinguer le service Code Review et l’action GitHub de Claude",
      "Faire tourner les tests du labo sur chaque PR avec GitHub Actions",
      "Faire relire puis corriger une PR par Claude depuis l’iPad",
    ],
    blocs: [
      { type: "p", t: "La pull request est le meilleur endroit pour déléguer : c’est là qu’on relit, qu’on fusionne, et que s’accumulent les petites corrections. Il existe deux façons officielles d’y mettre Claude : un service tout prêt d’Anthropic, et une action GitHub que tu configures toi-même. Sur iPad avec Pro, tu passeras par une troisième voie." },
      { type: "h2", t: "La voie gérée : Code Review" },
      { type: "p", t: "**Code Review** est un service d’Anthropic qui relit tes PR à travers l’application Claude GitHub. Le responsable (« Owner ») de l’organisation Claude l’active, choisit les dépôts, et décide quand il tourne : à l’ouverture de la PR, à chaque push, ou quand quelqu’un écrit `@claude review` en commentaire." },
      { type: "p", t: "Plusieurs agents analysent le diff au regard de tout le code, puis publient des remarques sur les lignes concernées, classées par gravité. Le service n’approuve ni ne bloque jamais une PR, et ne pousse aucune correction : la décision reste humaine. Il est réservé aux forfaits Team et Enterprise." },
      { type: "h2", t: "La voie artisanale : l’action GitHub de Claude" },
      { type: "p", t: "Pour aller au-delà de la relecture (coder à partir d’un commentaire, produire un rapport chaque matin), il y a l’action `anthropics/claude-code-action@v1`. Elle tourne dans **GitHub Actions**, le service de GitHub qui lance des tâches automatiques sur un dépôt, décrites dans des fichiers du dossier `.github/workflows/`." },
      { type: "liste", items: [
        "**Installation** : dans le terminal, la commande `/install-github-app` installe l’application et enregistre un secret dans le dépôt.",
        "**Le secret** : soit une clé API, payée à l’usage, soit un jeton lié à ton abonnement, créé sur un ordinateur avec `claude setup-token`.",
        "**Déclenchement** : par défaut, un commentaire qui contient `@claude`. Ou une heure fixe, avec un `prompt` qui dit quoi faire.",
        "**Réglages** : `claude_args` limite le travail, par exemple `--max-turns 5`, et fixe le mode de permission et les outils autorisés.",
      ] },
      { type: "code", titre: ".github/workflows/claude.yml (extrait)", texte: ACTION_GITHUB },
      { type: "p", t: "Sur ton iPad, sans ordinateur ni clé API, cette action reste hors de portée. Retiens son principe : tu la retrouveras le jour où tu auras un ordinateur." },
      { type: "h2", t: "Ce que tu peux faire sur iPad" },
      { type: "liste", items: [
        "**GitHub Actions sans Claude** : un workflow qui lance `node --test` à chaque PR. Gratuit pour un dépôt public, sans clé ni secret.",
        "**`/code-review`** : la relecture dans ta session, avant de créer la PR. Elle marche avec tous les forfaits.",
        "**Auto-fix** : Claude surveille la PR créée depuis sa session. Si un test échoue sur GitHub, ou si quelqu’un laisse un commentaire de relecture, il enquête et pousse une correction quand elle est claire.",
      ] },
      { type: "p", t: "Auto-fix a besoin de l’application Claude GitHub, installée au début du parcours (Claude Code 101, leçon 3). Ses réponses sur GitHub apparaissent sous ton nom, avec une mention qui indique qu’elles viennent de Claude Code." },
    ],
    retenir: [
      "Code Review : relecture gérée par Anthropic, pour les forfaits Team et Enterprise.",
      "L’action GitHub fait tout ce qu’un workflow peut faire, avec une clé ou un jeton.",
      "Sur iPad : les tests dans GitHub Actions, /code-review avant la PR, Auto-fix après.",
    ],
    exercice: {
      etapes: [
        { t: "Nouvelle session :", p: "Lis d’abord comment on lance les tests. Ajoute un workflow .github/workflows/tests.yml qui lance node --test à chaque pull request et à chaque push sur main. Utilise seulement les actions officielles de GitHub, sans clé ni secret.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" } },
        { t: PR_FUSION },
        { t: "Sur GitHub, ouvre l’onglet « Actions » de ton dépôt : une exécution des tests apparaît. Une coche verte veut dire que tout passe." },
        { t: "Nouvelle session :", p: "Affiche à côté de chaque course son gain en euros par km, avec deux décimales.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" }, a: "Quand Claude a fini, avant de créer la PR, tape :", p2: "/code-review", cfg2: { session: "Même session que l’étape 4", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" } },
        { t: "Lis les remarques et demande à Claude de corriger celles qui changent un résultat. Puis touche « Créer une PR », sans fusionner.", cfg: { session: "Même session que l’étape 4", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" } },
        { t: "Dans la carte des changements de la session, ouvre le menu « ⋮ » à côté du titre de la PR et active « Auto-fix ».", cfg: { session: "Même session que l’étape 4", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" } },
        { t: "Sur GitHub, ouvre la PR, puis l’onglet « Files changed ». Laisse un commentaire sur une ligne de texte affichée à l’écran, par exemple « Écris €/km plutôt que euros par km », et envoie-le.", a: "Retourne dans la session : Claude lit le commentaire, corrige et pousse. Sur GitHub, les tests de la PR repassent." },
        { t: "Quand les tests sont au vert, relis le diff sur GitHub, puis touche « Merge pull request » et « Confirm merge »." },
      ],
      note: "Si /code-review n’est pas reconnu, demande plutôt à Claude de relire ses changements comme un relecteur neuf, en signalant seulement les bugs qui changent un résultat.",
    },
  },
  {
    id: 8, section: 3, duree: 25,
    titre: "Vérifier une exécution non surveillée",
    resume: "Moins tu as regardé, plus tu vérifies : diff, tests imposés, second avis.",
    objectifs: [
      "Adapter la vérification à la liberté laissée à Claude",
      "Partir du diff, pas du résumé de Claude",
      "Verrouiller les tests avec des hooks et demander un second avis",
    ],
    blocs: [
      { type: "p", t: "Tu as confié une tâche à Claude, tu n’as pas suivi chaque étape, et il annonce qu’il a fini. Avant de fusionner, il faut vérifier un travail que tu n’as pas vu se faire. La règle : vérifie à proportion de la liberté que tu as laissée. Une courte session suivie des yeux mérite un coup d’œil. Une exécution sans témoin mérite une vraie vérification." },
      { type: "h2", t: "Le mode Auto plutôt que le contournement" },
      { type: "p", t: "Pour une exécution non surveillée, garde le mode Auto plutôt que Contourner les permissions : son classifieur continue de bloquer les actions dangereuses (leçon 4). Mais il ne dit rien de la justesse du code. Ton niveau de vérification ne change donc pas." },
      { type: "h2", t: "Le diff d’abord, le résumé ensuite" },
      { type: "p", t: "Le résumé de Claude peut être impeccable alors que le diff touche un fichier inattendu. Commence donc par le diff :" },
      { type: "liste", items: [
        "**`/code-review`** parcourt les changements et signale les problèmes.",
        "**Tes propres yeux** sur le diff : d’abord les fichiers prévus par le plan, puis tout ce qui en sort.",
      ] },
      { type: "p", t: "Un compte rendu soigné n’est pas une preuve de code propre." },
      { type: "h2", t: "Les tests comme verrou" },
      { type: "p", t: "La vraie question : les tests ont-ils tourné, et ont-ils réussi ? Ne te contente pas d’un « tous les tests passent » : impose-le avec des hooks, que Claude ne peut pas contourner." },
      { type: "liste", items: [
        "**Un hook `Stop`** qui lance les tests et refuse la fin du tour en cas d’échec : ton labo l’a depuis la leçon 5.",
        "**Un hook `PostToolUse`** qui vérifie chaque fichier juste après sa modification.",
      ] },
      { type: "p", t: "Avec le code de sortie 2, l’échec revient directement à Claude, qui corrige sans que tu le demandes. Et la vérification tourne à chaque fois, même quand tu oublies d’y penser. Pour une exécution en mode non interactif, regarde aussi son résultat JSON et son code de sortie (leçon 6)." },
      { type: "h2", t: "Un second avis, avec un regard neuf" },
      { type: "p", t: "Une nouvelle session ou un sous-agent relit le code sans savoir comment il a été construit. Il ne tient pas à l’approche choisie, et repère ce que l’exécution d’origine a fini par trouver normal. Ton sous-agent relecteur est fait pour ça (Claude Code 101, leçon 9)." },
    ],
    retenir: [
      "Vérifie à proportion de la liberté laissée à Claude.",
      "Lis le diff avant de croire le résumé.",
      "Les hooks Stop et PostToolUse font des tests un verrou.",
      "Un relecteur neuf trouve ce que l’auteur a fini par trouver normal.",
    ],
    exercice: {
      intro: "Tu vas ajouter un dernier verrou, laisser Claude construire une fonctionnalité sans le regarder, puis tout vérifier.",
      etapes: [
        { t: "Nouvelle session :", p: "Lis d’abord .claude/settings.json et garde tous les hooks existants. Ajoute un hook PostToolUse sur Edit et Write qui lance node --check sur le fichier modifié quand c’est un fichier .js. En cas d’erreur de syntaxe, il sort avec le code 2 et renvoie le message. Teste le script à la main avec un fichier correct et un fichier cassé, et montre-moi les deux sorties.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" } },
        { t: PR_FUSION },
        { t: "Nouvelle session, en mode **Plan** :", p: "Je veux un bouton qui exporte toutes les courses dans un fichier CSV que je peux enregistrer dans l’app Fichiers de l’iPad, avec la date, les km et les euros. Lis d’abord le code, puis propose un plan avec les tests.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Aucune", autorisations: "Plan" } },
        { t: "Valide le plan et passe en mode **Auto** : si la validation te le propose, choisis-le ; sinon, change de mode dans le menu sous la zone de saisie. Laisse Claude travailler sans regarder, et reviens quand la session est terminée.", cfg: { session: "Même session que l’étape 3", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Auto" } },
        { t: "Ne lis pas encore le résumé de Claude. Tape :", p: "/code-review", cfg: { session: "Même session que l’étape 3", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Auto" }, a: "Puis ouvre le diff : liste les fichiers prévus par le plan, et repère ceux qui n’y étaient pas." },
        { t: "Demande un second avis :", p: "Demande au sous-agent relecteur de relire tous les changements de cette session, sans lui dire comment ils ont été faits. Montre-moi son rapport tel quel, puis corrige seulement les bugs qui changent un résultat.", cfg: { session: "Même session que l’étape 3", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Auto" } },
        { t: "Demande les preuves :", p: "Montre-moi la sortie complète de node --test, et dis-moi si un hook Stop ou PostToolUse t’a renvoyé une erreur pendant cette session.", cfg: { session: "Même session que l’étape 3", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Auto" } },
        { t: PR_FUSION },
        { t: "Sur ton appli en ligne, touche le bouton d’export et ouvre le fichier dans l’app Fichiers." },
      ],
      note: "Si /code-review n’est pas reconnu, demande plutôt à Claude de relire ses changements comme un relecteur neuf, en signalant seulement les bugs qui changent un résultat.",
    },
  },
  {
    id: 9, section: 3, duree: 20,
    titre: "Les plugins",
    resume: "Emballer une configuration de confiance pour la partager, et lire avant d’installer.",
    objectifs: [
      "Comprendre ce que sont un plugin et une marketplace",
      "Lire un plugin avant de l’installer",
      "Emballer ta propre configuration dans un plugin",
    ],
    blocs: [
      { type: "p", t: "Une configuration qui marche vaut bien plus quand toute l’équipe s’en sert. Mais recopier un dossier `.claude` de machine en machine, c’est l’assurance de versions qui divergent. Le **plugin** règle ce problème : c’est la façon dont Claude Code emballe une configuration pour la faire passer d’une personne à l’autre." },
      { type: "h2", t: "Ce qu’un plugin contient" },
      { type: "p", t: "Un plugin s’installe d’un seul geste. Il peut regrouper des skills, des sous-agents, des hooks, des serveurs MCP et quelques réglages : une version, une installation." },
      { type: "p", t: "On l’installe depuis une **marketplace** : un catalogue de plugins, souvent un dépôt GitHub. Anthropic en publie deux générales, l’officielle (`claude-plugins-official`) et celle de la communauté. Une équipe peut ajouter la sienne." },
      { type: "code", titre: "Dans le terminal", texte: "/plugin install commit-commands@claude-plugins-official\n/plugin marketplace add mon-equipe/plugins-claude" },
      { type: "p", t: "Sur le web, il n’y a pas de catalogue de plugins, et une session cloud ne charge pas les plugins activés par le dépôt. En revanche, Claude peut te proposer un plugin dans la conversation, avec un bouton « Add » : il l’active alors pour ton compte claude.ai." },
      { type: "h2", t: "Lire un plugin avant de l’installer" },
      { type: "p", t: "C’est le point le plus important. Un plugin exécute du code sur ta machine, avec tes droits. Si tu l’installes pour ses skills, tu reçois aussi ses hooks, que tu les aies lus ou non. Un plugin pourrait cacher un hook `Stop` qui envoie des données sur internet à chaque tour, sans que rien ne t’avertisse." },
      { type: "liste", items: [
        "Avant l’installation, Claude Code montre ce que le plugin ajoute et estime son coût en contexte, avec un avertissement : Anthropic ne contrôle pas le contenu des plugins tiers.",
        "Être listé dans une marketplace ne veut pas dire être digne de confiance.",
        "N’installe que depuis des sources sûres, et regarde d’abord ses hooks, ses agents et ses serveurs MCP.",
      ] },
      { type: "h2", t: "Un plugin s’ajoute à ta configuration" },
      { type: "p", t: "Un plugin n’écrase rien : ses éléments s’ajoutent aux tiens." },
      { type: "liste", items: [
        "**Les hooks s’additionnent** : le `PreToolUse` du plugin et le tien se déclenchent tous les deux.",
        "**Les skills, agents et commandes** sont rangés sous le nom du plugin, comme `/plugin-labo:journal` : aucune collision avec les tiens.",
        "**Son fichier `settings.json`** n’accepte que deux réglages. L’un d’eux, `agent`, peut remplacer le comportement principal de Claude Code par celui d’un de ses sous-agents : raison de plus pour lire avant d’activer.",
      ] },
      { type: "h2", t: "Emballer ta configuration dans un plugin" },
      { type: "p", t: "Pas besoin de tout réorganiser : un plugin reprend la structure que tu connais, et Claude Code trouve chaque élément d’après son dossier." },
      { type: "code", titre: "plugin-labo/", texte: PLUGIN_ARBRE },
      { type: "p", t: "Le manifeste `.claude-plugin/plugin.json` est facultatif. Son seul champ obligatoire est `name`, qui sert de préfixe aux skills. Ajoute une `version`, et fais-la monter à chaque changement : c’est ce qui permet de suivre les mises à jour." },
      { type: "code", titre: "plugin-labo/.claude-plugin/plugin.json", texte: PLUGIN_MANIFESTE },
    ],
    retenir: [
      "Un plugin regroupe skills, sous-agents, hooks et MCP en une installation.",
      "Un plugin exécute du code avec tes droits : lis-le avant de l’installer.",
      "Ses éléments s’ajoutent aux tiens ; ses skills sont rangés sous son nom.",
      "Pour partager ta configuration, emballe-la avec un manifeste.",
    ],
    exercice: {
      etapes: [
        { t: "Lis un plugin avant de l’installer. Nouvelle session :", p: "Sans rien modifier dans mon dépôt, va lire sur GitHub le dépôt public anthropics/claude-plugins-official et choisis un plugin qui contient des hooks. Explique-moi en français ce qu’il ajoute : ses skills, ses agents, ses serveurs MCP, et pour chaque hook, quand il se déclenche et ce qu’il exécute. Dis-moi s’il envoie des données sur internet.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE (lecture seule)", branche: "Aucune", autorisations: "Plan" }, a: "Tu peux aussi ouvrir ce dépôt dans Safari, sur github.com, et suivre ce que Claude décrit." },
        { t: "Nouvelle session :", p: "Crée à la racine un dossier plugin-labo qui emballe notre configuration : le sous-agent relecteur, les skills journal et verifier, les hooks de .claude/settings.json avec leurs scripts, et le serveur MCP de .mcp.json. Adapte les chemins des scripts au plugin. Ajoute un manifeste .claude-plugin/plugin.json avec name, version 0.1.0 et description. Ne touche pas au dossier .claude. Si la commande claude plugin validate existe dans cette session, lance-la sur plugin-labo et montre-moi la sortie complète. Sinon, vérifie la structure avec le serveur claude-code-docs.", cfg: { session: "Nouvelle session", depot: "SPECIFICODE", branche: "Nouvelle, créée par Claude", autorisations: "Accept edits" } },
        { t: "Tape :", p: "/journal", cfg: { session: "Même session que l’étape 2", depot: "SPECIFICODE", branche: "Celle de la session en cours", autorisations: "Accept edits" }, a: "Vérifie dans le diff que JOURNAL.md présente le plugin." },
        { t: PR_FUSION },
      ],
      details: [
        { titre: "Comment installer ce plugin un jour ?", t: ["Sur un ordinateur, dans le terminal, `claude --plugin-dir ./plugin-labo` charge le plugin pour une session, sans l’installer. Pour une équipe, on le publie dans une marketplace, et chacun l’installe avec `/plugin install`."] },
      ],
    },
  },
];

// Exercice à classer de la leçon 4 : ce que le mode Auto fait par défaut.
export const CLASSER = [
  { t: "Modifier un fichier de ton projet", r: "p" },
  { t: "Forcer l’envoi d’une branche (force push)", r: "b" },
  { t: "Installer les dépendances listées dans le fichier de verrouillage", r: "p" },
  { t: "Télécharger un script sur internet et l’exécuter aussitôt", r: "b" },
  { t: "Pousser sur une branche du dépôt", r: "p" },
  { t: "Supprimer pour de bon des fichiers qui existaient avant la session", r: "b" },
  { t: "Fusionner une PR qu’aucun humain n’a approuvée", r: "b" },
];

export const PHASES = { p: "Le mode Auto laisse passer", b: "Le mode Auto bloque" };

export const QUIZ = [
  { q: "Tu lances /compact pendant une longue tâche. Qu’ajoutes-tu après la commande ?", o: ["Rien, la commande se suffit", "Ce que le résumé doit garder", "Le nom des fichiers à supprimer", "Le mot IMPORTANT"], b: 1, e: "Ce que tu écris après /compact décide de ce que le résumé conserve.", l: 1 },
  { q: "L’évaluateur de /goal juge ta condition à partir de :", o: ["Ce que Claude a affiché dans la conversation", "Une relance des tests qu’il fait lui-même", "Le contenu de CLAUDE.md", "Ton avis"], b: 0, e: "Il ne lance rien et ne lit aucun fichier : la preuve doit apparaître dans la conversation, comme la sortie des tests.", l: 1 },
  { q: "Quelle règle de CLAUDE.md est la mieux écrite ?", o: ["Suis les bonnes pratiques", "N’utilise pas de bibliothèque", "Place chaque fonction de calcul dans calculs.js, avec son test", "IMPORTANT : code proprement"], b: 2, e: "Elle est précise, et se vérifie d’un coup d’œil.", l: 2 },
  { q: "Que font les imports @chemin dans CLAUDE.md ?", o: ["Ils réduisent le contexte chargé", "Ils rangent le fichier, mais tout se charge quand même au démarrage", "Ils chargent les fichiers seulement quand Claude en a besoin", "Ils désactivent les autres CLAUDE.md"], b: 1, e: "Les fichiers importés sont insérés en entier : les imports organisent, ils n’allègent pas.", l: 2 },
  { q: "Qu’est-ce qui distingue un bon skill de vérification ?", o: ["Il lance les tests une seule fois", "Il vérifie aussi qu’aucun test n’a été affaibli", "Il lit seulement le résumé de Claude", "Il demande ton accord à chaque étape"], b: 1, e: "Un test assoupli passe quoi qu’il arrive : le skill lit le diff pour s’en assurer.", l: 3 },
  { q: "Une règle ne doit jamais être contournée. Où la mets-tu ?", o: ["Dans CLAUDE.md", "Dans un skill", "Dans un hook", "Dans le README"], b: 2, e: "CLAUDE.md et les skills sont des instructions. Un hook est du code que Claude Code exécute à chaque fois.", l: 3 },
  { q: "En mode Auto, que vérifie le classifieur ?", o: ["Que le code est juste", "Que l’action reste dans ce que tu as demandé", "Que les tests passent", "Que le style est propre"], b: 1, e: "Il juge l’intention, pas la justesse. Pour la justesse : des tests et un hook Stop.", l: 4 },
  { q: "Quel mode choisir pour un pipeline où personne ne peut répondre aux demandes ?", o: ["Plan", "Manuel", "Accepter les modifications", "Ne pas demander"], b: 3, e: "Ce qui demanderait une approbation est refusé d’office : le pipeline ne reste pas bloqué.", l: 4 },
  { q: "La commande d’un hook PreToolUse se termine avec le code 1. Que se passe-t-il ?", o: ["L’outil est bloqué", "L’outil est lancé quand même", "La session s’arrête", "Claude te demande ton accord"], b: 1, e: "Le code 1 est une erreur non bloquante. Pour bloquer, c’est le code 2.", l: 5 },
  { q: "Pour remettre l’essentiel dans le contexte après une compaction, tu utilises :", o: ["SessionStart avec le matcher compact", "PostCompact", "PreToolUse", "Notification"], b: 0, e: "La sortie de SessionStart revient dans le contexte. Celle de PostCompact, non.", l: 5 },
  { q: "Que fait updatedInput dans la réponse d’un hook PreToolUse ?", o: ["Il met à jour Claude Code", "Il relance l’outil", "Il bloque l’appel", "Il réécrit toute l’entrée de l’outil avant son exécution"], b: 3, e: "Recopie les champs inchangés : updatedInput remplace l’entrée entière.", l: 5 },
  { q: "Où crées-tu une tâche planifiée depuis l’iPad ?", o: ["Sur claude.ai/code/routines", "Dans CLAUDE.md", "Dans .mcp.json", "Avec claude -p"], b: 0, e: "Sur ordinateur, la commande /schedule fait la même chose.", l: 6 },
  { q: "À quelle fréquence, au plus, une tâche planifiée récurrente peut-elle tourner ?", o: ["Chaque minute", "Toutes les dix minutes", "Toutes les heures", "Une fois par jour"], b: 2, e: "Une planification plus fréquente est refusée. Pour surveiller de près, il y a /loop, dans une session.", l: 6 },
  { q: "Que fait le service Code Review sur une PR ?", o: ["Il l’approuve si tout va bien", "Il pousse les corrections", "Il publie des remarques sur les lignes, sans approuver ni bloquer", "Il la fusionne"], b: 2, e: "La décision reste humaine. Le service est réservé aux forfaits Team et Enterprise.", l: 7 },
  { q: "Sur iPad avec Pro, comment Claude peut-il corriger une PR après un commentaire de relecture ?", o: ["Avec Auto-fix, activé depuis la session qui a créé la PR", "Avec le service Code Review", "En installant l’action GitHub depuis Safari", "Ce n’est pas possible"], b: 0, e: "Auto-fix surveille la PR : les tests en échec et les commentaires de relecture.", l: 7 },
  { q: "Claude a travaillé sans surveillance. Par quoi commences-tu ?", o: ["Son résumé", "Le diff", "Le README", "Le quiz"], b: 1, e: "Un résumé soigné peut cacher un fichier modifié par surprise. Le diff, non.", l: 8 },
  { q: "Pourquoi garder le mode Auto plutôt que Contourner les permissions pour une exécution non surveillée ?", o: ["Il est plus rapide", "Il vérifie que le code est juste", "Son classifieur continue de bloquer les actions dangereuses", "Il ne consomme pas de quota"], b: 2, e: "Mais il ne juge pas la justesse : la vérification reste nécessaire.", l: 8 },
  { q: "Tu installes un plugin pour ses skills. Que reçois-tu aussi ?", o: ["Rien d’autre", "Ses hooks, ses agents et ses serveurs MCP, lus ou non", "Une copie de ton dépôt", "Un abonnement"], b: 1, e: "Un plugin exécute du code avec tes droits : lis-le avant de l’installer.", l: 9 },
  { q: "Quel est le seul champ obligatoire du manifeste plugin.json ?", o: ["version", "author", "description", "name"], b: 3, e: "Le nom sert de préfixe aux skills, comme /plugin-labo:journal.", l: 9 },
];

export const LEXIQUE = [
  ["Auto-fix", "Claude surveille une PR créée depuis sa session et pousse une correction quand un test échoue ou qu’un relecteur commente."],
  ["Classifieur", "En mode Auto, le second modèle qui examine la plupart des actions de Claude et bloque celles qui dépassent ta demande."],
  ["GitHub Actions", "Le service de GitHub qui lance des tâches automatiques sur un dépôt, comme des tests, décrites dans .github/workflows/."],
  ["Marketplace", "Un catalogue de plugins, souvent un dépôt GitHub, depuis lequel on les installe."],
  ["Matcher", "Le filtre d’un hook : l’outil ou la situation qui le déclenche, comme Edit|Write ou compact."],
  ["Mode Auto", "Mode où Claude avance seul ; un classifieur examine la plupart des actions avant leur exécution."],
  ["Mode non interactif", "Claude Code lancé pour une seule demande, sans interface, avec claude -p, depuis un script. Ancien nom : headless."],
  ["Objectif (/goal)", "Une condition de fin : Claude enchaîne les tours jusqu’à ce qu’un évaluateur la juge remplie."],
  ["Plugin", "Un paquet installable qui regroupe skills, sous-agents, hooks et serveurs MCP."],
  ["Point de contrôle", "L’état de la conversation et des fichiers, enregistré à chaque message, pour pouvoir y revenir."],
  ["Tâche planifiée", "Un prompt et des dépôts que Claude exécute dans le cloud selon un déclencheur : horaire, appel API ou événement GitHub. Ancien nom : routine."],
  ["Worktree", "Une copie de travail séparée d’un dépôt, pour faire tourner plusieurs sessions sans collision."],
];
