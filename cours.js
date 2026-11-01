// Les cours du parcours, dans l’ordre où on les suit.
// Chaque cours a son fichier de contenu, de la même forme que donnees.js :
// SECTIONS, LECONS, QUIZ, LEXIQUE (et, si besoin, CLASSER et PHASES).
// Pour ajouter un cours : crée son fichier, importe-le ici et ajoute-le à la fin de COURS.
// Ne change jamais l’id d’un cours : la progression et le carnet de révision l’enregistrent.
import * as claudeCode101 from "./donnees.js";
import * as claudeCodeEnAction from "./donnees-claude-code-en-action.js";

export const COURS = [
  {
    id: "claude-code-101",
    titre: "Claude Code 101",
    source: { nom: "Claude Code 101, Claude Academy", url: "https://academy.claude.com/fr/courses/claude-code-101" },
    ...claudeCode101,
  },
  {
    id: "claude-code-en-action",
    titre: "Claude Code en action",
    source: { nom: "Claude Code en action, Claude Academy", url: "https://academy.claude.com/fr/courses/claude-code-in-action" },
    ...claudeCodeEnAction,
  },
];
