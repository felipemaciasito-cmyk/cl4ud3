// Hook PreToolUse : avant un « git push » ou la création d’une PR, lance tous les tests d’import
// (node tests/tout.mjs) si un fichier de l’appli a changé par rapport à origin/main.
// S’ils échouent, l’envoi est bloqué (code 2) et Claude reçoit la liste des problèmes.
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let s = "";
for await (const morceau of process.stdin) s += morceau;
let e = {};
try { e = JSON.parse(s || "{}"); } catch {}

const envoi = /(^|[\s;&|(])git\s+push\b/.test(e.tool_input?.command || "") || /create_pull_request$/.test(e.tool_name || "");
if (!envoi) process.exit(0);

// Rien à tester si seuls des fichiers Markdown ont changé par rapport à origin/main.
try {
  const changes = execFileSync("git", ["diff", "--name-only", "origin/main"], { cwd: RACINE, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split("\n").filter((f) => f && !f.endsWith(".md"));
  if (!changes.length) process.exit(0);
} catch {}

const r = spawnSync(process.execPath, [join(RACINE, "tests/tout.mjs")], { cwd: RACINE, encoding: "utf8", timeout: 9 * 60 * 1000 });
if (r.status === 0) process.exit(0);
const lignes = (r.stdout + r.stderr).split("\n");
const utiles = lignes.filter((l) => /✘|ÉCHEC|erreur|ne passe|manquant|inconnu/i.test(l)).slice(0, 40);
console.error("Envoi bloqué : les tests d’import ne passent pas (node tests/tout.mjs). Corrige ces points, puis relance l’envoi."
  + " Si les tests ne peuvent pas tourner (outil absent), dis-le à l’utilisateur au lieu de contourner ce hook.\n"
  + (utiles.length ? utiles : lignes.slice(-40)).join("\n"));
process.exit(2);
