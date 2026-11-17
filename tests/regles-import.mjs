// Règles à respecter après chaque import de contenu, en comparant avec la version de référence (main).
// usage : node tests/regles-import.mjs [--base <référence git>]   (par défaut : origin/main, sinon main)
//
// Erreurs (✘, bloquantes) : ce qui casse la continuité du parcours ou une règle de CLAUDE.md.
// Avertissements (!, non bloquants) : ce qu’il faut relire soi-même.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...a) => execFileSync("git", a, { cwd: RACINE, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 });
const i = process.argv.indexOf("--base");
const refs = i > 0 && process.argv[i + 1] ? [process.argv[i + 1]] : ["origin/main", "main"];
const erreurs = [], avertissements = [], nouveautes = [];
const charger = async (dossier) => (await import(pathToFileURL(join(dossier, "cours.js")).href)).COURS;
const fichiersServis = (texteSw) => JSON.parse(texteSw.match(/FICHIERS = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));
const cacheDe = (texteSw) => (texteSw.match(/const CACHE = "([^"]+)"/) || [])[1];

// Version de référence : les fichiers de contenu de main, recopiés dans un dossier temporaire.
function reference() {
  for (const ref of refs) {
    try {
      git("rev-parse", "--verify", "--quiet", ref + "^{commit}");
      const fichiers = git("ls-tree", "--name-only", ref).split("\n").filter(Boolean);
      if (!fichiers.includes("cours.js")) continue;
      const dossier = mkdtempSync(join(tmpdir(), "cl4ud3-reference-"));
      for (const f of fichiers.filter((f) => /^(cours|donnees.*|sw)\.js$/.test(f))) writeFileSync(join(dossier, f), git("show", ref + ":" + f));
      return { ref, dossier, fichiers };
    } catch {}
  }
  return null;
}

// Tous les textes d’un objet, avec le nom du champ qui les contient.
function textes(o, cle = "", out = []) {
  if (typeof o === "string") out.push([cle, o]);
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) textes(v, Array.isArray(o) ? cle : k, out);
  return out;
}

const COURS = await charger(RACINE);
const base = reference();
if (!base) {
  console.log("! Pas de version de référence (" + refs.join(", ") + ") : règles d’import non vérifiées.");
  process.exit(0);
}
const REF = await charger(base.dossier);
const nom = (c, l) => `${c.titre}, leçon ${l.id} « ${l.titre} »`;

// 1. Les cours déjà publiés gardent leur id et leur ordre.
REF.forEach((r, k) => {
  if (!COURS[k] || COURS[k].id !== r.id) erreurs.push(`Le cours « ${r.titre} » (${r.id}) a disparu, changé d’id ou de place : les cours s’ajoutent à la fin, sans toucher aux autres.`);
});

// 2. Les leçons déjà publiées ne sont ni supprimées, ni déplacées.
for (const r of REF) {
  const c = COURS.find((x) => x.id === r.id);
  if (!c) continue;
  if (c.LECONS.length < r.LECONS.length) erreurs.push(`${c.titre} : ${r.LECONS.length - c.LECONS.length} leçon(s) supprimée(s). Une leçon publiée ne se supprime pas.`);
  r.LECONS.forEach((lr, k) => {
    const lc = c.LECONS[k];
    if (!lc || lc.titre === lr.titre) return;
    if (c.LECONS.some((x) => x.titre === lr.titre)) erreurs.push(`${c.titre} : la leçon « ${lr.titre} » n’est plus à la place ${lr.id}. Les nouvelles leçons s’ajoutent à la fin.`);
    else avertissements.push(`${c.titre}, leçon ${lr.id} : titre modifié (« ${lr.titre} » devient « ${lc.titre} »). Vérifie que c’est voulu.`);
  });
}

// 3. Les nouvelles leçons respectent CLAUDE.md.
const renvoi = /\((?:([^()]*?),\s*)?leçon (\d+)(?:,\s*exercice)?\)/g;
const interdits = /\b(?:ctrl|cmd|alt)\s*\+|⌘|clic droit|survol/i;
for (const c of COURS) {
  const r = REF.find((x) => x.id === c.id);
  const debut = r ? r.LECONS.length : 0;
  const nouvelles = c.LECONS.slice(debut);
  if (!nouvelles.length) continue;
  if (!r) nouveautes.push(`nouveau cours « ${c.titre} » (${c.LECONS.length} leçons)`);
  else nouveautes.push(`${c.titre} : leçon(s) ${nouvelles.map((l) => l.id).join(", ")}`);

  for (const l of nouvelles) {
    const n = nom(c, l);
    if (l.objectifs?.length !== 3) erreurs.push(`${n} : il faut 3 objectifs (${l.objectifs?.length || 0}).`);
    if (!(l.retenir?.length >= 3 && l.retenir.length <= 4)) erreurs.push(`${n} : il faut 3 ou 4 points « À retenir » (${l.retenir?.length || 0}).`);
    if (!(l.duree >= 5 && l.duree <= 45)) erreurs.push(`${n} : durée irréaliste (${l.duree} min).`);
    if (/\.$/.test(l.titre)) erreurs.push(`${n} : pas de point à la fin du titre.`);
    if (!/[.!?]$/.test(l.resume || "")) erreurs.push(`${n} : le résumé finit par un point.`);
    if ((l.objectifs || []).some((o) => /\.$/.test(o))) erreurs.push(`${n} : pas de point à la fin des objectifs.`);
    if ((l.retenir || []).some((o) => !/[.!?]$/.test(o))) erreurs.push(`${n} : chaque point « À retenir » finit par un point.`);
    if (!(l.blocs || []).some((b) => b.type === "h2")) erreurs.push(`${n} : au moins un titre h2 (il devient une notion du carnet).`);
    if (!(l.exercice?.etapes?.length || l.exercice?.classer)) erreurs.push(`${n} : l’exercice n’a aucune étape.`);
    const questions = c.QUIZ.filter((q) => q.l === l.id).length;
    if (questions < 1 || questions > 3) erreurs.push(`${n} : il faut 1 à 3 questions de quiz (${questions}).`);
    for (const b of l.blocs || []) {
      if (b.type === "tableau" && b.entetes.length > 3) erreurs.push(`${n} : tableau de ${b.entetes.length} colonnes, 3 au maximum sur iPad.`);
      if (b.type === "code" && b.texte.split("\n").some((x) => x.length > 65)) avertissements.push(`${n} : bloc de code avec des lignes de plus de 65 caractères (défilement sur iPad).`);
    }
    for (const [cle, t] of textes(l)) {
      if (interdits.test(t)) (JSON.stringify(l.exercice).includes(JSON.stringify(t).slice(1, -1)) ? erreurs : avertissements)
        .push(`${n} : raccourci clavier, clic droit ou survol (« ${t.slice(0, 50)}… ») : tout se fait au doigt sur iPad.`);
      for (const [, coursCite, num] of t.matchAll(renvoi)) {
        const cible = coursCite ? COURS.find((x) => x.titre === coursCite.trim()) : c;
        if (!cible) erreurs.push(`${n} : renvoi vers un cours inconnu « ${coursCite} ».`);
        else if (!cible.LECONS.some((x) => x.id === Number(num))) erreurs.push(`${n} : renvoi vers une leçon qui n’existe pas (${coursCite ? coursCite + ", " : ""}leçon ${num}).`);
      }
    }
  }
  const nouvellesQuestions = c.QUIZ.filter((q) => nouvelles.some((l) => l.id === q.l));
  if (nouvellesQuestions.length >= 3 && new Set(nouvellesQuestions.map((q) => q.b)).size === 1) avertissements.push(`${c.titre} : toutes les nouvelles questions ont la bonne réponse à la même place. Varie-la.`);

  // Un nouveau cours (pas le premier) commence par rappeler le cours précédent.
  if (!r && COURS.indexOf(c) > 0) {
    const precedents = COURS.slice(0, COURS.indexOf(c)).map((x) => x.titre);
    const premiere = textes(c.LECONS[0]).map(([, t]) => t).join(" ");
    if (!precedents.some((t) => premiere.includes(t))) erreurs.push(`${c.titre} : la première leçon doit rappeler où on en est en citant le cours précédent (${precedents.at(-1)}).`);
  }
}

// 4. Le cache hors ligne change dès qu’un fichier de l’appli change.
const sw = readFileSync(join(RACINE, "sw.js"), "utf8"), swRef = readFileSync(join(base.dossier, "sw.js"), "utf8");
const changes = fichiersServis(sw).filter((f) => f !== "./" && f !== "sw.js").filter((f) => {
  if (!base.fichiers.includes(f)) return true;
  try { return readFileSync(join(RACINE, f), "utf8") !== git("show", base.ref + ":" + f); } catch { return true; }
});
if (changes.length && cacheDe(sw) === cacheDe(swRef)) erreurs.push(`Fichiers modifiés (${changes.join(", ")}) mais CACHE n’a pas changé dans sw.js (${cacheDe(sw)}) : incrémente-le.`);

// 5. Les clés de stockage ne changent jamais (sinon la progression est perdue).
for (const [f, cles] of [["app.jsx", ["cc101fr:v1", "cc101fr:revisions:v1", "cc101fr:robot:v1", "cc101fr:robot-conversations:v1"]], ["app.js", ["cc101fr:v1", "cc101fr:revisions:v1", "cc101fr:robot:v1", "cc101fr:robot-conversations:v1"]], ["revisions-app.js", ["cc101fr:revisions:v1", "cc101fr:revision-ai:v1"]]]) {
  const t = readFileSync(join(RACINE, f), "utf8");
  for (const k of cles) if (!t.includes(`"${k}"`)) erreurs.push(`${f} : la clé de stockage « ${k} » a disparu. La progression serait perdue.`);
}

// 6. Le README cite chaque cours ; CLAUDE.md suit le projet fil rouge.
const readme = readFileSync(join(RACINE, "README.md"), "utf8");
for (const c of COURS) if (!readme.includes(c.titre)) erreurs.push(`README.md ne cite pas le cours « ${c.titre} ».`);
if (nouveautes.length) {
  let claudeMdChange = true;
  try { claudeMdChange = readFileSync(join(RACINE, "CLAUDE.md"), "utf8") !== git("show", base.ref + ":CLAUDE.md"); } catch {}
  if (!claudeMdChange) avertissements.push("Nouvelles leçons mais CLAUDE.md inchangé : si un exercice modifie le labo, mets à jour le tableau du projet fil rouge (partie 6).");
}

rmSync(base.dossier, { recursive: true, force: true });
console.log(`Comparaison avec ${base.ref} : ${nouveautes.length ? "nouveau contenu → " + nouveautes.join(" ; ") : "pas de nouvelle leçon"}`);
for (const e of erreurs) console.log("  ✘ " + e);
for (const a of avertissements) console.log("  ! " + a);
console.log(erreurs.length ? `${erreurs.length} erreur(s) à corriger.` : "Règles d’import respectées" + (avertissements.length ? ` (${avertissements.length} point(s) à relire).` : "."));
process.exitCode = erreurs.length ? 1 : 0;
