# Claude Code 101 en français : consignes du projet

Appli web pour iPad qui présente le parcours Claude Code 101 en français. Tout le contenu
d’apprentissage (leçons, exercices, quiz, lexique) est dans `donnees.js`. Ce fichier fixe les
règles à suivre **à chaque ajout ou modification de contenu**. Elles valent aussi pour du contenu
préparé ailleurs (dans le chat claude.ai, par exemple) : joins alors ce fichier à la conversation.

Si une demande laisse un doute (où placer la leçon, suite du labo ou nouveau projet, source du
contenu), pose la question avant d’écrire. Garde ce fichier sous 200 lignes (leçon 8).

## Commandes

Vérifier le contenu après chaque modification de `donnees.js`. Résultat attendu : « Contenu OK ».

```bash
node --input-type=module <<'EOF'
const { SECTIONS, LECONS, QUIZ, LEXIQUE } = await import(process.cwd() + '/donnees.js');
const err = [], ids = new Set(LECONS.map((l) => l.id)), textes = [];
const BRUT = ['p', 'p2', 'titre', 'resume']; // affichés tels quels, sans mise en forme
const lire = (o, ou, brut) => typeof o === 'string' ? textes.push([ou, o, brut])
  : o && typeof o === 'object' && Object.entries(o).forEach(([k, v]) =>
      k !== 'texte' && lire(v, ou, brut || BRUT.includes(k)));
LECONS.forEach((l, i) => {
  const n = 'Leçon ' + l.id;
  if (l.id !== i + 1) err.push(n + ' : numéro attendu ' + (i + 1));
  if (!SECTIONS[l.section]) err.push(n + ' : section inconnue');
  ['titre', 'resume', 'duree', 'objectifs', 'blocs', 'retenir', 'exercice']
    .forEach((k) => l[k] || err.push(n + ' : champ ' + k + ' manquant'));
  (l.blocs || []).forEach((b) => ['p', 'h2', 'h3', 'liste', 'tableau', 'code']
    .includes(b.type) || err.push(n + ' : bloc inconnu ' + b.type));
  if (!Array.isArray(l.exercice?.etapes)) err.push(n + ' : exercice.etapes manquant');
  if (l.exercice?.classer && l.id !== 2) err.push(n + ' : classer est réservé à la leçon 2');
  lire(l, n, false);
});
QUIZ.forEach((q, i) => {
  const n = 'Quiz ' + (i + 1);
  if (!ids.has(q.l)) err.push(n + ' : leçon ' + q.l + ' inconnue');
  if (q.o?.length !== 4) err.push(n + ' : il faut 4 réponses');
  if (!(q.b >= 0 && q.b < q.o?.length)) err.push(n + ' : bonne réponse hors limites');
  if (!q.q || !q.e) err.push(n + ' : question ou explication manquante');
  lire(q, n, true);
});
LEXIQUE.forEach((m, i) => {
  if (i && LEXIQUE[i - 1][0].localeCompare(m[0], 'fr') >= 0) err.push('Lexique : ' + m[0] + ' mal classé');
  lire(m, 'Lexique', true);
});
textes.forEach(([ou, t, brut]) => {
  const debut = ' dans « ' + t.slice(0, 40) + '… »';
  if (/['"]/.test(t)) err.push(ou + ' : apostrophe ou guillemet droit' + debut);
  if (brut && /\*\*|`/.test(t)) err.push(ou + ' : ** ou ` affiché tel quel' + debut);
  if (/\bcliqu/i.test(t)) err.push(ou + ' : écrire « touche », pas « clique »');
  if (/\p{Extended_Pictographic}/u.test(t)) err.push(ou + ' : pas d’emoji');
});
console.log(err.length ? err.join('\n') : 'Contenu OK : ' + LECONS.length + ' leçons, '
  + QUIZ.length + ' questions, ' + LEXIQUE.length + ' mots du lexique');
process.exitCode = err.length ? 1 : 0;
EOF
```

Régénérer `app.js` après une modification de `app.jsx` (ne modifie jamais `app.js` à la main) :

```bash
npx esbuild@0.24.0 app.jsx --format=esm --charset=utf8 --jsx-factory=React.createElement --jsx-fragment=React.Fragment --outfile=app.js
```

## 1. Rester dans la continuité du parcours

- Avant d’écrire, relis les leçons existantes, au moins les deux dernières, et le tableau du labo (partie 5).
- Ajoute toujours à la fin : nouvel `id` = dernier `id` + 1. Ne renumérote, ne déplace et ne supprime
  jamais une leçon : la progression (`cc101fr:v1`) et le carnet de révision (`cc101fr:revisions:v1`)
  enregistrent les numéros, et l’appli lit la leçon `id` à la position `id - 1`. Ne change jamais
  une clé du localStorage.
- Place la leçon dans une section existante de `SECTIONS`, ou ajoute la nouvelle section à la fin.
- Une notion s’appuie sur celles déjà vues. N’utilise pas une notion pas encore expliquée ; renvoie à
  la leçon qui l’explique, au format « (leçon 8) ».
- Garde le vocabulaire déjà installé : session, mode Plan, « Accepter automatiquement les
  modifications », dépôt, branche, diff, commit, PR, fusionner, contexte, sous-agent, skill, hook.
- Ne contredis pas une leçon précédente. Si une information a changé (Claude Code évolue vite),
  corrige aussi l’ancienne leçon et le quiz, et signale-le dans le résumé de la PR.
- Les exercices appliquent la méthode du parcours : une tâche par session, mode Plan pour une
  fonctionnalité, une vérification avec sa sortie complète, relecture du diff, puis l’étape `PR_FUSION`.
- Le parcours est une réécriture, pas une copie : ne reproduis ni le texte ni les exercices d’une
  source (cours officiel, documentation). Écris tes explications et des exercices pensés pour l’iPad.
- Vérifie chaque fait sur Claude Code (commande, mode, libellé, limite) dans la documentation
  officielle, https://code.claude.com/docs/fr. Ce qui n’a pas pu être vérifié est signalé dans le
  résumé de la PR, jamais présenté comme sûr. N’invente ni chiffre, ni libellé, ni adresse.

## 2. La forme du contenu dans `donnees.js`

```js
{
  id: 13, section: 3, duree: 20,      // duree : minutes, exercice compris
  titre: "Titre court",               // sans point final
  resume: "Une phrase courte.",       // affichée dans la liste du parcours
  objectifs: ["Comprendre…", "Savoir…", "Créer…"],  // 3, sans point final
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
- Les titres `h2` et `h3`, comme les objectifs, deviennent les notions proposées dans le carnet de
  révision : chacun doit se comprendre seul.
- Mise en forme : `**gras**` pour un terme nouveau à sa première apparition, `` `code` `` pour un
  fichier, une commande, un champ, `*italique*` rarement. Pas d’autre Markdown, pas de HTML, pas
  d’astérisque isolé. Elle ne marche pas dans `titre`, `resume`, les prompts, le quiz et le lexique.
- Un bloc `code` qui contient des antislashs s’écrit avec `String.raw` (voir `PRETTIER_HOOK`).
- N’utilise pas `classer: true` : cet exercice interactif est lié à la leçon 2. Un nouveau type de
  bloc ou d’exercice demande de modifier `app.jsx`, de régénérer `app.js` et de le signaler.
- Quiz : 1 à 3 questions par nouvelle leçon, à la fin de `QUIZ`, avec `l` = numéro de la leçon.
  4 réponses plausibles, une seule juste ; varie sa position (`b`, de 0 à 3). `e` explique pourquoi.
- Lexique : chaque terme nouveau qui resservira entre dans `LEXIQUE`, par ordre alphabétique, en une ou deux phrases.

## 3. Pensé pour l’iPad

- Tout l’exercice se fait sur iPad : Safari, claude.ai/code ou l’onglet Code de l’appli Claude,
  github.com, l’app Fichiers. Jamais de terminal, d’installation, de raccourci clavier, de clic
  droit ni de survol.
- Écris « touche », « ouvre », « choisis », jamais « clique ».
- Tout texte à envoyer à Claude va dans un prompt (`p` ou `p2`), avec son bouton Copier :
  l’apprenant ne tape à la main que des commandes courtes, comme `/context`.
- Une commande réservée au terminal ou à l’ordinateur est présentée comme une information, avec
  son équivalent sur le web (`/clear` devient « nouvelle session depuis la barre latérale »).
- Libellés de boutons entre « », tels qu’ils s’affichent, même en anglais (« Merge pull request »),
  avec ce qu’ils font en français. Pas sûr du libellé exact : décris où est le bouton.
- Fais vérifier le résultat sur l’iPad : l’appli du labo ouverte dans Safari, sur GitHub Pages.
- Tableaux : 2 ou 3 colonnes, cellules courtes. Blocs de code : 65 caractères par ligne si possible.
- Rien de payant en plus de Claude Pro et d’un compte GitHub gratuit. Labo public : jamais de mot de passe ni de clé.
- Si tu modifies l’interface : zones à toucher d’au moins 44 px, rien qui n’existe qu’au survol,
  mode sombre, marges `safe-area`, portrait et paysage, fonctionnement hors ligne.

## 4. Un français clair

- Tutoiement, phrases courtes, voix active, une idée par phrase. Explique avant de nommer.
- Garde le mot anglais seulement quand c’est le vrai nom de l’outil (hook, skill, commit, diff,
  PR) et explique-le en français à sa première apparition. Sinon, le mot français (dépôt, branche).
- Source en anglais : réécris en français naturel, sans traduire mot à mot.
- Typographie : apostrophe courbe ’, guillemets « », points de suspension …, nombres à la
  française (12,50 €). Mets une espace normale avant `: ; ? !` et à l’intérieur des guillemets :
  l’appli la rend insécable. Pas d’emoji.
- Les prompts sont aussi en français, et demandent une réponse en français quand ce n’est pas évident.

## 5. Le projet fil rouge : `labo-claude-code`

Les exercices pratiques continuent dans le même dépôt et la même appli, le carnet de courses de
livraison, sauf si la leçon annonce clairement un nouveau projet.

| Leçon | Ce que le labo contient après l’exercice |
|---|---|
| 3 | Dépôt public `labo-claude-code` avec un README, relié à claude.ai/code |
| 4 | `index.html` : carnet de courses (date, km, €), totaux en km, € et €/km ; en ligne sur GitHub Pages |
| 5 | Courses gardées dans le localStorage ; totaux dans `calculs.js`, testés avec `node --test` |
| 7 | Bugs ou cas limites corrigés, chacun avec un test écrit d’abord |
| 8 | `CLAUDE.md` du labo : tests, interface en français, pas de bibliothèque externe, montants « 12,50 € », clé du localStorage à garder ; gain moyen par course |
| 9 | Sous-agent `.claude/agents/relecteur.md` (Read, Grep, Glob) ; bouton pour supprimer une course |
| 10 | Skill `/journal` qui tient `JOURNAL.md` ; totaux en gras |
| 11 | `.mcp.json` : serveur `claude-code-docs` |
| 12 | `.claude/settings.json` : hook qui bloque toute modification dans `protege/` ; hook Prettier en bonus, donc peut-être absent |

- Pars de l’état laissé par la leçon précédente : ne recrée pas ce qui existe, ne casse aucune règle posée.
- Le labo de chaque apprenant peut différer un peu : les prompts demandent à Claude de lire le
  code d’abord, au lieu de supposer un nom de fonction ou de fichier.
- Réutilise ce qui existe quand ça a du sens : `node --test`, le relecteur, `/journal`, `claude-code-docs`.
- Un nouveau projet sur plusieurs leçons : nomme-le dès la première (dépôt ou dossier, à quoi il
  sert). Chaque exercice suivant rappelle en une phrase où on en est (« On reprend … là où la
  leçon 14 l’a laissé »). Chaque leçon ajoute une étape qui marche seule et finit par une PR fusionnée.
- Mets ce tableau à jour dans le même commit que la leçon : une ligne par leçon qui modifie un projet.

## 6. Avant de valider un ajout

1. La commande de vérification affiche « Contenu OK ».
2. Les textes qui citent le nombre de leçons sont à jour : « Douze leçons » dans `app.jsx` et
   `app.js`, « 12 leçons » dans `README.md`. Si le contenu dépasse le programme officiel, adapte
   « À propos de ce parcours » (`app.jsx` et `app.js`), qui dit suivre les mêmes leçons.
3. `CACHE` est incrémenté dans `sw.js` (`cc101fr-v4` devient `cc101fr-v5`, etc.), et tout nouveau
   fichier est ajouté à `FICHIERS`.
4. Le tableau du labo (partie 5) est à jour.
5. Relis comme l’apprenant : chaque étape se fait sur iPad, chaque prompt se copie, rien ne
   contredit une leçon précédente.
6. Message de commit en français, à l’infinitif : « Ajouter la leçon 13 : … ».
7. Dans le résumé de la PR, liste ce qui n’a pas pu être vérifié, et rappelle de tester la leçon
   sur iPad, en portrait et en paysage, en mode clair et sombre.
