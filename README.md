# CL4UD3

CL4UD3 est une application pour suivre en français des cours officiels sur Claude Code, pensée pour l’iPad. Premier cours : **Claude Code 101**, avec 12 leçons, des exercices sur claude.ai/code, un quiz final d’une question à la fois et un lexique. Elle s’installe sur l’écran d’accueil et fonctionne hors ligne après une première visite.

Parcours non officiel, rédigé par Claude à partir du programme public du cours Claude Code 101 (Anthropic Academy) et de la documentation officielle de Claude Code en français.

## Mettre l’appli en ligne depuis l’iPad

1. **Enregistre les fichiers** dans un même dossier de l’app Fichiers.
2. Dans Safari, sur github.com, crée un nouveau dépôt, par exemple `claude-code-101`. Choisis **Public**, sans cocher l’option README, puis « Create repository ».
3. Sur la page du dépôt vide, touche le lien **« uploading an existing file »**. Touche « choose your files », sélectionne **tous les fichiers** du dossier, puis touche « Commit changes ».
4. Va dans **Settings**, puis **Pages**. Dans « Build and deployment », choisis « Deploy from a branch », la branche `main` et le dossier `/ (root)`, puis **Save**.
5. Une ou deux minutes plus tard, l’adresse s’affiche en haut de la page Pages. Elle ressemble à `https://ton-pseudo.github.io/claude-code-101/`.

## L’installer comme une appli

Ouvre l’adresse dans Safari, touche le bouton Partager, puis **« Sur l’écran d’accueil »**. L’appli s’ouvre alors en plein écran, comme une vraie application.

Ta progression est enregistrée sur l’appareil. Sur iPad, l’appli installée et l’onglet Safari gardent chacun leur propre progression : choisis l’un des deux et restes-y.

## Mettre à jour

Remplace seulement les fichiers modifiés : sur GitHub, « Add file », puis « Upload files », en envoyant un fichier du même nom. L’appli charge la nouvelle version dès qu’elle est en ligne. Si l’ancienne version s’affiche encore, ferme complètement l’appli et rouvre-la.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La page de l’application |
| `styles.css` | Les couleurs, la mise en page, le mode sombre |
| `app.js` | L’application, générée à partir de `app.jsx` |
| `app.jsx` | Le code source lisible de l’application (pas chargé par la page) |
| `cours.js` | La liste des cours, dans l’ordre du parcours |
| `donnees.js` | Le contenu de Claude Code 101 : leçons, exercices, quiz, lexique |
| `revisions.html`, `revisions.css`, `revisions-app.js` | Le carnet de révision |
| `vendor-react.js` | La bibliothèque React, incluse pour marcher sans dépendance externe |
| `sw.js` | Le service worker : fonctionnement hors ligne |
| `manifest.webmanifest` | Nom et icônes de l’appli installée |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Les icônes |
| `CLAUDE.md` | Les règles à suivre pour ajouter du contenu, lues par Claude Code à chaque session |
| `.claude/settings.json`, `.claude/hooks/verifier-contenu.mjs` | La vérification automatique du contenu (hooks de Claude Code) |

Pour changer un texte, une leçon ou une question du quiz, il suffit de modifier le fichier de contenu du cours (`donnees.js` pour Claude Code 101). Ne modifie pas `app.js` à la main : il est regénéré à partir de `app.jsx`.

## Ajouter du contenu ou un nouveau cours

Fais-le de préférence avec Claude Code (claude.ai/code) sur ce dépôt : il lit `CLAUDE.md` tout seul, et les hooks vérifient le contenu à chaque modification. Un nouveau cours s’ajoute à la suite des autres avec son propre fichier de contenu, déclaré dans `cours.js` ; l’appli et le carnet de révision l’affichent sans autre changement. Si tu prépares le contenu ailleurs, joins `CLAUDE.md` à la conversation.

## Crédits

- Interface construite à partir de composants de [21st.dev](https://21st.dev), adaptés : « Vertical Descriptive Stepper » (sean0205) pour le parcours, « Questionnaire » (uiable) pour le quiz, et le thème « Amber Vivid_1 » (sriyanshintern) pour la couleur d’accent.
- Icônes : tracés de [Lucide](https://lucide.dev) (licence ISC).
- [React](https://react.dev) (licence MIT).
- Polices : Bricolage Grotesque et Atkinson Hyperlegible, via Google Fonts.
- Pour le certificat officiel, il faut passer le quiz du cours, en anglais, sur [anthropic.skilljar.com](https://anthropic.skilljar.com/claude-code-101).
