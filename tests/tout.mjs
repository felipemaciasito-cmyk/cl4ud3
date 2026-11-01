// Tous les tests à passer après chaque import de contenu d’apprentissage.
// usage : node tests/tout.mjs [--base <référence git>]   (référence par défaut : origin/main, sinon main)
//   1. Vérification du contenu (structure, typographie, fichiers déclarés)
//   2. Règles d’import (comparaison avec main : continuité, nouvelles leçons, cache, README)
//   3. L’appli dans un navigateur, avec des profils d’iPad
// Code de sortie : 0 si tout passe, 1 sinon. Imposé par un hook avant chaque « git push » et par GitHub.
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const i = process.argv.indexOf("--base");
const base = i > 0 && process.argv[i + 1] ? ["--base", process.argv[i + 1]] : [];
const ETAPES = [
  ["Vérification du contenu", join(RACINE, ".claude/hooks/verifier-contenu.mjs"), []],
  ["Règles d’import", join(RACINE, "tests/regles-import.mjs"), base],
  ["Appli dans le navigateur (iPad)", join(RACINE, "tests/navigateur.cjs"), []],
];

const bilan = [];
for (const [nom, script, args] of ETAPES) {
  console.log(`\n========== ${nom}`);
  if (script.endsWith("navigateur.cjs") && bilan.some(([, e]) => e === "ÉCHEC")) {
    console.log("! Non lancé : corrige d’abord les erreurs ci-dessus (le test du navigateur prend une à deux minutes).");
    bilan.push([nom, "non lancé"]);
    continue;
  }
  const r = spawnSync(process.execPath, [script, ...args], { cwd: RACINE, stdio: "inherit" });
  bilan.push([nom, r.status === 0 ? "réussi" : r.status === 3 ? "non lancé" : "ÉCHEC"]);
}
console.log("\n========== Bilan");
for (const [nom, etat] of bilan) console.log(`  ${etat === "réussi" ? "✔" : etat === "ÉCHEC" ? "✘" : "!"} ${nom} : ${etat}`);
const echec = bilan.some(([, e]) => e === "ÉCHEC");
console.log(echec ? "\nDes tests échouent : corrige avant d’envoyer." : "\nTout est prêt à être envoyé.");
process.exitCode = echec ? 1 : 0;
