# CL4UD3 : consignes du projet

CL4UD3 est une appli web pour iPad qui présente des cours officiels sur Claude Code, réécrits en
français, à suivre dans l’ordre. Chaque cours a son fichier de contenu (`donnees.js` pour Claude Code 101, puis
`donnees-<id>.js`), déclaré dans `cours.js`. Ce fichier fixe les règles à suivre **à chaque ajout ou
modification de contenu** (cours, leçons, exercices, quiz, lexique). Elles valent aussi pour du
contenu préparé ailleurs (dans le chat claude.ai, par exemple) : joins alors ce fichier à la conversation.

Si une demande laisse un doute (où placer la leçon, suite du labo ou nouveau projet, source du contenu), pose la question avant d’écrire. Garde ce fichier sous 200 lignes (leçon 8).

## Commandes et hooks

- Vérifier le contenu : `node .claude/hooks/verifier-contenu.mjs`. Résultat attendu : « Contenu OK ».
- **Tests imposés après chaque import** : `node tests/tout.mjs` (1 à 3 minutes). Trois étapes : la
  vérification du contenu, les règles d’import comparées à `main` (`tests/regles-import.mjs` : rien
  de supprimé ni déplacé, nouvelles leçons conformes, cache incrémenté, README), puis l’appli dans
  Chromium avec des profils d’iPad, leçon par leçon (`tests/navigateur.cjs`).
- Les hooks de `.claude/settings.json` les imposent : vérification du contenu au début de chaque
  session, après chaque modification de `cours.js`, d’un fichier `donnees*.js` ou de `sw.js`, et
  avant la fin d’une réponse si le contenu a changé ; `node tests/tout.mjs` avant chaque `git push`
  ou création de PR, envoi bloqué s’il échoue. GitHub relance les mêmes tests sur chaque PR
  (`.github/workflows/tests.yml`). Corrige ce qu’ils signalent, ne les contourne jamais ; si un test ne peut pas tourner, dis-le.
- Régénérer `app.js` après une modification de `app.jsx` (ne modifie jamais `app.js` à la main) :

```bash
npx esbuild@0.24.0 app.jsx --format=esm --charset=utf8 --jsx-factory=React.createElement --jsx-fragment=React.Fragment --outfile=app.js
```

## 1. Rester dans la continuité du parcours

- Avant d’écrire, relis les leçons existantes du cours (au moins les deux dernières) et le tableau du labo (partie 6).
- Ajoute toujours à la fin du cours : nouvel `id` = dernier `id` + 1 (chaque cours commence à 1).
  Ne renumérote, ne déplace et ne supprime jamais une leçon, ne change jamais l’`id` d’un cours ni
  une clé du localStorage : la progression (`cc101fr:v1`), le carnet de révision
  (`cc101fr:revisions:v1`) et les conversations de Robotto (`cc101fr:robot-conversations:v1`,
  réglages dans `cc101fr:robot:v1`) enregistrent ces numéros. Ces identifiants gardent l’ancien nom de l’appli
  (`cc101`) : ne les renomme pas en CL4UD3.
- Place la leçon dans une section existante du cours, ou ajoute la section à la fin de son `SECTIONS`.
- Une notion s’appuie sur celles déjà vues. N’utilise pas une notion pas encore expliquée ; renvoie à la leçon qui l’explique :
  « (leçon 8) » dans le même cours, « (Claude Code 101, leçon 8) » sinon, « (leçon 8, exercice) » pour son exercice.
  Mets le renvoi juste après la notion : l’appli l’ouvre dans un panneau, sur le passage où la leçon citée la met en gras.
- Garde le vocabulaire déjà installé : session, mode Plan, « Accepter automatiquement les
  modifications », dépôt, branche, diff, commit, PR, fusionner, contexte, sous-agent, skill, hook.
- Ne contredis pas une leçon précédente. Si une information a changé (Claude Code évolue vite),
  corrige aussi l’ancienne leçon et le quiz, et signale-le dans le résumé de la PR.
- Les exercices appliquent la méthode du parcours : une tâche par session, mode Plan pour une
  fonctionnalité, une vérification avec sa sortie complète, relecture du diff, puis l’étape `PR_FUSION`.
- Vérifie chaque fait sur Claude Code (commande, mode, libellé, limite) dans la documentation
  officielle, https://code.claude.com/docs/fr. Ce qui n’a pas pu être vérifié est signalé dans le
  résumé de la PR, jamais présenté comme sûr. N’invente ni chiffre, ni libellé, ni adresse.

## 2. Un cours officiel en ligne, à ajouter comme cours suivant

- Travaille seulement à partir de ce que l’utilisateur fournit (texte, transcription, captures du
  cours) et de la documentation officielle. S’il manque le contenu d’une leçon, demande-le :
  n’invente jamais ce que dit le cours d’origine.
- Garde les leçons du cours d’origine dans leur ordre, comme pour Claude Code 101. Réécris tout en
  français ; ne reproduis ni les vidéos, ni le texte, ni les exercices d’origine (souvent faits pour
  un ordinateur) : refais les exercices pour l’iPad.
- C’est la suite du parcours : ce qu’un cours précédent explique déjà est rappelé en une ou deux
  phrases avec un renvoi, pas réexpliqué. Si le cours d’origine dit autre chose qu’un cours
  précédent, vérifie dans la documentation et corrige le plus ancien si besoin.
- Pour l’ajouter :
  1. Crée `donnees-<id>.js` sur le modèle de `donnees.js` : `SECTIONS`, `LECONS`, `QUIZ`, `LEXIQUE`,
     et `import { PR_FUSION } from "./donnees.js";` pour l’étape de fusion.
  2. Dans `cours.js`, importe-le et ajoute à la fin de `COURS` : `id` (minuscules et tirets,
     définitif), `titre`, `source` (nom exact et adresse du cours d’origine), `...contenu`.
  3. Ajoute le fichier à `FICHIERS` dans `sw.js` et en `modulepreload` dans `index.html`.
  4. Cite le cours dans `README.md`. Sa première leçon cite le cours précédent (où on en est).
- L’appli s’adapte seule : un en-tête et un quiz par cours, adresses `#<id>/lecon-1`, lexique commun,
  cours proposé dans le carnet de révision. Rien à changer dans `app.jsx` ni `revisions-app.js`.

## 3. La forme d’une leçon

```js
{
  id: 1, section: 0, duree: 20,       // duree : minutes, exercice compris
  titre: "Titre court",               // sans point final
  resume: "Une phrase courte.",       // affichée dans la liste du parcours
  objectifs: ["Comprendre…", "Savoir…", "Créer…"],  // 3, sans point final
  mots: ["Commit", "Test"],           // facultatif : mots nouveaux, tels que dans LEXIQUE
  blocs: [                            // types : p, h2, h3, liste, tableau, code
    { type: "p", t: "…" }, { type: "h2", t: "…" },
    { type: "liste", items: ["…", "…"] },
    { type: "tableau", entetes: ["…", "…"], lignes: [["…", "…"]] },
    { type: "code", titre: "chemin/du/fichier", texte: "…" },
  ],
  retenir: ["Phrase courte.", "…", "…"],  // 3 ou 4, avec point final
  exercice: {
    intro: "…",                       // facultatif : le but, en une phrase
    etapes: [
      { t: "Nouvelle session :", p: "Prompt à copier" },
      { t: "…", p: "…", a: "Ce qu’il faut observer", p2: "Second prompt" },
      { t: PR_FUSION },               // étape commune : relire, créer la PR, fusionner
    ],
    note: "…",                        // facultatif : que faire en cas de souci
    details: [{ titre: "Question", t: ["Paragraphe"], p: "Prompt facultatif" }],
  },
},
```

- `duree` : réaliste sur iPad (les leçons actuelles vont de 8 à 30 minutes).
- Au moins un `h2` par leçon. Les `h2`, les `h3` et les objectifs deviennent des notions du carnet de révision : chacun se comprend seul.
- Mise en forme : `**gras**` pour un terme nouveau à sa première apparition, `` `code` `` pour un
  fichier, une commande, un champ, `*italique*` rarement. Pas d’autre Markdown, pas de HTML, pas
  d’astérisque isolé. Elle ne marche pas dans `titre`, `resume`, les prompts, le quiz et le lexique.
- Un bloc `code` qui contient des antislashs s’écrit avec `String.raw` (voir `PRETTIER_HOOK`).
- `classer: true` (exercice où l’on classe des étapes) demande `CLASSER` et `PHASES` dans le fichier du cours, une fois
  par cours. Un autre type de bloc ou d’exercice demande de modifier `app.jsx`, de régénérer `app.js` et de le signaler.
- Quiz : 1 à 3 questions par nouvelle leçon, à la fin du `QUIZ` du cours, avec `l` = numéro de la
  leçon. 4 réponses plausibles, une seule juste ; varie sa position (`b`, de 0 à 3). `e` explique pourquoi.
- Lexique : chaque terme nouveau qui resservira entre dans `LEXIQUE` (ordre alphabétique, une ou deux phrases simples, sans
  mise en forme), dans le premier cours qui l’utilise, et dans `mots` de la leçon qui le présente (encadré « Les mots de la leçon »).
  Un mot n’est listé qu’une fois. Robotto le repère dans une sélection ; 3e élément facultatif, ses autres formes : `["fusion"]`.

## 4. Pensé pour l’iPad

- Tout l’exercice se fait sur iPad : Safari, claude.ai/code ou l’onglet Code de l’appli Claude, github.com,
  l’app Fichiers. Jamais de terminal, d’installation, de raccourci clavier, de clic droit ni de survol.
- Écris « touche », « ouvre », « choisis », jamais « clique ».
- Tout texte à envoyer à Claude va dans un prompt (`p`, `p2`, ou `p` d’un `details`), avec son bouton Copier :
  l’apprenant ne tape à la main que des commandes courtes, comme `/context`. Chaque prompt a un `cfg`
  (`cfg2` pour `p2`) : `{ session, depot, branche, autorisations }`, dans la check-list « Avant d’envoyer »
  de l’en-tête du prompt (`autorisations` s’y affiche « Mode »). Une étape sans prompt où l’on agit dans la
  conversation (valider un plan, changer de mode, commenter le diff) a aussi un `cfg`. Valeurs : « Plan », « Accept edits », « Manual » ou « Auto » ;
  « Nouvelle, créée par Claude », « Celle de la session en cours » ou « Aucune » ; « Nouvelle session » ou « Même session que l’étape N ».
- Modes : dans le texte, écris le libellé de l’appli Claude en français, « Accepter automatiquement les modifications »,
  et cite une fois le nom officiel (Accept edits). Le `cfg` garde « Accept edits » ; la check-list l’affiche en français.
- Une commande réservée au terminal ou à l’ordinateur est présentée comme une information, avec
  son équivalent sur le web (`/schedule` devient « une tâche planifiée créée sur claude.ai/code/routines »).
- Libellés de boutons entre « », tels qu’ils s’affichent, même en anglais (« Merge pull request »),
  avec ce qu’ils font en français. Pas sûr du libellé exact : décris où est le bouton.
- Fais vérifier le résultat sur l’iPad : l’appli du labo ouverte dans Safari, sur GitHub Pages.
- Tableaux : 2 ou 3 colonnes, cellules courtes. Blocs de code : 65 caractères par ligne si possible.
- Rien de payant en plus de Claude Pro et d’un compte GitHub gratuit. Labo public : jamais de mot de passe ni de clé.
- Si tu modifies l’interface : zones à toucher d’au moins 44 px, rien qui n’existe qu’au survol,
  mode sombre, marges `safe-area`, portrait et paysage, fonctionnement hors ligne.

## 5. Un français clair

- Tutoiement, phrases courtes, voix active, une idée par phrase. Explique avant de nommer.
- Garde le mot anglais seulement quand c’est le vrai nom de l’outil (hook, skill, commit, diff,
  PR) et explique-le en français à sa première apparition. Sinon, le mot français (dépôt, branche).
- Chaque mot technique (outil, commande, notion) est expliqué en une phrase simple, avec un exemple si possible, à sa
  première apparition : un mot, une définition. S’il ne sert qu’une fois et pas sur iPad, remplace-le par des mots simples.
- Source en anglais : réécris en français naturel, sans traduire mot à mot.
- Typographie : apostrophe courbe ’, guillemets « », points de suspension …, nombres à la
  française (12,50 €). Mets une espace normale avant `: ; ? !` et à l’intérieur des guillemets :
  l’appli la rend insécable. Pas d’emoji.
- Les prompts sont aussi en français, et demandent une réponse en français quand ce n’est pas évident.

## 6. Le projet fil rouge : `SPECIFICODE`

Les exercices pratiques continuent dans le même dépôt et la même appli, le carnet de courses de
livraison, d’un cours à l’autre, sauf si une leçon annonce clairement un nouveau projet.

| Cours · leçon | Ce que le labo contient après l’exercice |
|---|---|
| 101 · 3 | Dépôt public `SPECIFICODE` avec un README, relié à claude.ai/code |
| 101 · 4 | `index.html` : carnet de courses (date, km, €), totaux en km, € et €/km ; en ligne sur GitHub Pages |
| 101 · 5 | Courses gardées dans le localStorage ; totaux dans `calculs.js`, testés avec `node --test` |
| 101 · 7 | Bugs ou cas limites corrigés, chacun avec un test écrit d’abord |
| 101 · 8 | `CLAUDE.md` du labo : tests, interface en français, pas de bibliothèque externe, montants « 12,50 € », clé du localStorage à garder ; gain moyen par course |
| 101 · 9 | Sous-agent `.claude/agents/relecteur.md` (Read, Grep, Glob) ; bouton pour supprimer une course |
| 101 · 10 | Skill `/journal` qui tient `JOURNAL.md` ; totaux en gras |
| 101 · 11 | `.mcp.json` : serveur `claude-code-docs` |
| 101 · 12 | `.claude/settings.json` : hook qui bloque toute modification dans `protege/` ; hook Prettier en bonus, donc peut-être absent |
| En action · 1 | Totaux du mois en cours, testés aussi pour un mois sans course |
| En action · 2 | `CLAUDE.md` réécrit en règles précises et vérifiables ; nombre de courses du mois |
| En action · 3 | Skill `verifier` (`SKILL.md`, `verifier.sh`) qui se lance seul ; meilleure course en €/km affichée |
| En action · 4 | Bouton pour vider le formulaire de saisie |
| En action · 5 | Hooks `Stop` (lance `node --test`) et `SessionStart` (matcher `compact`), scripts dans `.claude/hooks/` |
| En action · 6 | Tâche planifiée « Contrôle du labo » sur claude.ai, rien dans le dépôt ; peut-être suspendue |
| En action · 7 | `.github/workflows/tests.yml` : `node --test` à chaque PR ; gain en €/km de chaque course |
| En action · 8 | Hook `PostToolUse` qui lance `node --check` sur chaque `.js` modifié ; export CSV |
| En action · 9 | Dossier `plugin-labo/` avec son manifeste : relecteur, `journal`, `verifier`, hooks, MCP |

- Pars de l’état laissé par la leçon précédente, même dans le cours d’avant : ne recrée pas ce qui existe, ne casse aucune règle.
- Le labo de chaque apprenant peut différer un peu : les prompts demandent à Claude de lire le
  code d’abord, au lieu de supposer un nom de fonction ou de fichier.
- Réutilise ce qui existe quand ça a du sens : `node --test`, le relecteur, `/journal`, `claude-code-docs`.
- Un nouveau projet sur plusieurs leçons : nomme-le dès la première (dépôt ou dossier, à quoi il
  sert). Chaque exercice suivant rappelle en une phrase où on en est (« On reprend … là où la
  leçon 3 l’a laissé »). Chaque leçon ajoute une étape qui marche seule et finit par une PR fusionnée.
- Mets ce tableau à jour dans le même commit que la leçon : une ligne par leçon qui modifie un
  projet, avec un nom court du cours dans la première colonne.

## 7. Avant de valider un ajout

1. `node tests/tout.mjs` affiche « Tout est prêt à être envoyé ». Relis aussi ses points « ! ».
2. `CACHE` est incrémenté dans `sw.js` (`cc101fr-v5` devient `cc101fr-v6`, etc.), et tout nouveau
   fichier est ajouté à `FICHIERS`.
3. `README.md` est à jour : il cite chaque cours, et la liste des fichiers est complète.
4. Le tableau du labo (partie 6) est à jour.
5. Relis comme l’apprenant : chaque étape se fait sur iPad, chaque prompt se copie, chaque mot technique est expliqué,
   rien ne contredit une leçon précédente.
6. Message de commit en français, à l’infinitif : « Ajouter la leçon 13 : … ».
7. Dans le résumé de la PR, liste ce qui n’a pas pu être vérifié, et rappelle de tester la leçon
   sur iPad, en portrait et en paysage, en mode clair et sombre.
