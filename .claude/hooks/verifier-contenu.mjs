// Vérifie le contenu d’apprentissage : le registre des cours (cours.js) et chaque fichier de contenu.
//
// À la main :   node .claude/hooks/verifier-contenu.mjs
// En hook :     node .claude/hooks/verifier-contenu.mjs --hook   (voir .claude/settings.json)
//   - SessionStart : signale à Claude, dès l’ouverture, un contenu déjà en erreur.
//   - PostToolUse  : après chaque modification d’un fichier de contenu, renvoie les erreurs à Claude.
//   - Stop         : empêche Claude de terminer si le contenu modifié pendant la session est en erreur.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BLOCS = ["p", "h2", "h3", "liste", "tableau", "code"];
const BRUT = ["p", "p2", "titre", "resume"]; // affichés tels quels, sans mise en forme
const estContenu = (f) => /^(cours|donnees.*|sw)\.js$/.test(basename(f || "")) && resolve(dirname(f)) === RACINE;
const fichiersDeContenu = () => readdirSync(RACINE).filter((f) => /^donnees.*\.js$/.test(f)).sort();

async function verifier() {
  const err = [];
  let COURS;
  try {
    ({ COURS } = await import(pathToFileURL(join(RACINE, "cours.js")).href));
  } catch (e) {
    return ["cours.js ou un fichier de contenu ne se charge pas : " + e.message];
  }
  const textes = [];
  const lire = (o, ou, brut) => typeof o === "string" ? textes.push([ou, o, brut])
    : o && typeof o === "object" && Object.entries(o).forEach(([k, v]) =>
        k !== "texte" && lire(v, ou, brut || BRUT.includes(k)));
  const ids = new Set(), mots = new Map();
  const CONF = ["session", "depot", "branche", "autorisations"]; // cfg de chaque prompt (cfg2 pour p2, cfg pour details)

  COURS.forEach((c, ci) => {
    const nc = c.titre || "Cours " + (ci + 1);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id || "")) err.push(nc + " : id invalide (minuscules, chiffres et tirets)");
    if (ids.has(c.id)) err.push(nc + " : id déjà utilisé par un autre cours");
    ids.add(c.id);
    if (!c.titre) err.push("Cours " + (ci + 1) + " : titre manquant");
    if (!c.source?.nom || !/^https:\/\//.test(c.source?.url || "")) err.push(nc + " : source.nom et source.url (https) obligatoires");
    if (!Array.isArray(c.SECTIONS) || !c.SECTIONS.length) err.push(nc + " : SECTIONS manquant");
    if (!Array.isArray(c.LECONS) || !c.LECONS.length) { err.push(nc + " : LECONS manquant"); return; }
    if (!Array.isArray(c.QUIZ) || !Array.isArray(c.LEXIQUE)) err.push(nc + " : QUIZ et LEXIQUE obligatoires (même vides)");
    lire({ titre: c.titre, SECTIONS: c.SECTIONS }, nc, true);

    const numeros = new Set(c.LECONS.map((l) => l.id));
    let classer = 0;
    c.LECONS.forEach((l, i) => {
      const n = nc + ", leçon " + l.id;
      if (l.id !== i + 1) err.push(n + " : numéro attendu " + (i + 1));
      if (!c.SECTIONS?.[l.section]) err.push(n + " : section inconnue");
      ["titre", "resume", "duree", "objectifs", "blocs", "retenir", "exercice"]
        .forEach((k) => l[k] || err.push(n + " : champ " + k + " manquant"));
      (l.blocs || []).forEach((b) => BLOCS.includes(b.type) || err.push(n + " : bloc inconnu " + b.type));
      if (!Array.isArray(l.exercice?.etapes)) err.push(n + " : exercice.etapes manquant");
      const prompts = [...(l.exercice?.etapes || []).flatMap((e) => [[e.p, e.cfg], [e.p2, e.cfg2]]),
        ...(l.exercice?.details || []).map((d) => [d.p, d.cfg])];
      prompts.forEach(([texte, cfg]) => texte && (CONF.every((k) => cfg?.[k]?.trim())
        || err.push(n + " : prompt sans configuration complète (session, depot, branche, autorisations)")));
      // une étape où l’on agit avec Claude sans prompt peut avoir un cfg : il doit être complet aussi
      (l.exercice?.etapes || []).forEach((e, k) => !e.p && e.cfg && !CONF.every((c) => e.cfg[c]?.trim())
        && err.push(n + ", étape " + (k + 1) + " : configuration incomplète (session, depot, branche, autorisations)"));
      if (l.exercice?.classer && !(c.CLASSER && c.PHASES)) err.push(n + " : classer demande CLASSER et PHASES dans le fichier du cours");
      if (l.exercice?.classer) classer++;
      lire(l, n, false);
    });
    if (classer > 1) err.push(nc + " : un seul exercice classer par cours");

    (c.QUIZ || []).forEach((q, i) => {
      const n = nc + ", quiz " + (i + 1);
      if (!numeros.has(q.l)) err.push(n + " : leçon " + q.l + " inconnue");
      if (q.o?.length !== 4) err.push(n + " : il faut 4 réponses");
      if (!(q.b >= 0 && q.b < q.o?.length)) err.push(n + " : bonne réponse hors limites");
      if (!q.q || !q.e) err.push(n + " : question ou explication manquante");
      lire(q, n, true);
    });

    (c.LEXIQUE || []).forEach((m, i, L) => {
      if (i && L[i - 1][0].localeCompare(m[0], "fr") >= 0) err.push(nc + ", lexique : " + m[0] + " mal classé");
      if (mots.has(m[0])) err.push(nc + ", lexique : " + m[0] + " est déjà défini dans " + mots.get(m[0]));
      mots.set(m[0], nc);
      lire(m, nc + ", lexique", true);
    });
  });

  textes.forEach(([ou, t, brut]) => {
    const debut = " dans « " + t.slice(0, 40) + "… »";
    if (/['"]/.test(t)) err.push(ou + " : apostrophe ou guillemet droit" + debut);
    if (brut && /\*\*|`/.test(t)) err.push(ou + " : ** ou ` affiché tel quel" + debut);
    if (/\bcliqu/i.test(t)) err.push(ou + " : écrire « touche », pas « clique »");
    if (/\p{Extended_Pictographic}/u.test(t)) err.push(ou + " : pas d’emoji");
  });

  // Chaque fichier de contenu doit être déclaré dans cours.js et gardé pour le hors ligne dans sw.js.
  const registre = readFileSync(join(RACINE, "cours.js"), "utf8");
  const sw = readFileSync(join(RACINE, "sw.js"), "utf8");
  for (const f of ["cours.js", ...fichiersDeContenu()]) {
    if (f !== "cours.js" && !registre.includes("\"./" + f + "\"")) err.push(f + " : fichier de contenu pas importé dans cours.js");
    if (!sw.includes("\"" + f + "\"")) err.push(f + " : à ajouter à FICHIERS dans sw.js (hors ligne)");
  }
  return err;
}

function empreinte() {
  const h = createHash("sha1");
  for (const f of ["cours.js", "sw.js", ...fichiersDeContenu()]) {
    const p = join(RACINE, f);
    if (existsSync(p)) h.update(f).update(readFileSync(p));
  }
  return h.digest("hex");
}

async function lireEntree() {
  if (process.stdin.isTTY) return {};
  let s = "";
  for await (const morceau of process.stdin) s += morceau;
  try { return JSON.parse(s || "{}"); } catch { return {}; }
}

const resume = (err) => err.length + (err.length > 1 ? " problèmes" : " problème");

if (!process.argv.includes("--hook")) {
  const err = await verifier();
  if (err.length) { console.log(err.join("\n")); process.exitCode = 1; }
  else {
    const { COURS } = await import(pathToFileURL(join(RACINE, "cours.js")).href);
    const n = (k) => COURS.reduce((s, c) => s + (c[k] || []).length, 0);
    console.log("Contenu OK : " + COURS.length + " cours, " + n("LECONS") + " leçons, " + n("QUIZ") + " questions, " + n("LEXIQUE") + " mots du lexique");
  }
} else {
  const e = await lireEntree();
  const marque = join(tmpdir(), "cc101-contenu-" + String(e.session_id || "sans-session").replace(/[^\w-]/g, "") + ".txt");

  if (e.hook_event_name === "SessionStart") {
    try { writeFileSync(marque, empreinte()); } catch {}
    const err = await verifier();
    if (err.length) {
      console.log("Attention : le contenu d’apprentissage du dépôt ne passe pas la vérification (" + resume(err)
        + "). Signale-le à l’utilisateur et propose de corriger, en suivant CLAUDE.md :\n" + err.join("\n"));
    }
  } else if (e.hook_event_name === "PostToolUse") {
    const f = e.tool_input?.file_path || e.tool_response?.filePath || "";
    if (estContenu(f)) {
      const err = await verifier();
      if (err.length) {
        console.error("Le contenu d’apprentissage ne passe plus la vérification (" + resume(err)
          + "). Corrige ces points en suivant CLAUDE.md :\n" + err.join("\n"));
        process.exit(2);
      }
    }
  } else if (e.hook_event_name === "Stop") {
    // On ne bloque que si le contenu a changé pendant cette session.
    let avant = null;
    try { avant = readFileSync(marque, "utf8"); } catch {}
    if (avant === null || avant !== empreinte()) {
      const err = await verifier();
      if (err.length && e.stop_hook_active) {
        console.log(JSON.stringify({ systemMessage: "Le contenu d’apprentissage ne passe toujours pas la vérification ("
          + resume(err) + "). Pour les voir : node .claude/hooks/verifier-contenu.mjs" }));
      } else if (err.length) {
        console.error("Avant de terminer, corrige le contenu d’apprentissage (" + resume(err) + ") :\n" + err.join("\n"));
        process.exit(2);
      }
    }
  }
}
