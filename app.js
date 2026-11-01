import { React, createRoot } from "./vendor-react.js";
import { SECTIONS, LECONS, CLASSER, PHASES, QUIZ, LEXIQUE } from "./donnees.js";
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const TOTAL = LECONS.length;
const CLE = "cc101fr:v1";
function lireEtat() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE) || "null");
    if (o && Array.isArray(o.faites)) {
      return { faites: o.faites, quiz: o.quiz || null, theme: o.theme || "auto" };
    }
  } catch (e) {
  }
  return { faites: [], quiz: null, theme: "auto" };
}
function enregistrerErreurQuiz(q, choisi) {
  try {
    const cle = "cc101fr:revisions:v1";
    const items = JSON.parse(localStorage.getItem(cle) || "[]");
    const lecon = LECONS.find((l) => l.id === q.l) || LECONS[0];
    const existant = items.find((x) => x.source === "quiz" && x.question === q.q && x.status !== "maitrise");
    if (existant) { existant.occurrences = (existant.occurrences || 1) + 1; existant.updatedAt = Date.now(); localStorage.setItem(cle, JSON.stringify(items)); return; }
    items.unshift({ id: "quiz-" + Date.now() + "-" + q.l, type: "Erreur", source: "quiz", courseId: "claude-code-101", courseTitle: "Claude Code 101", lessonId: lecon.id, lessonTitle: lecon.titre, topicTitle: lecon.objectifs[0] || lecon.titre, description: "Question : " + q.q + "\nRéponse donnée : " + q.o[choisi] + "\nRéponse attendue : " + q.o[q.b] + "\nExplication : " + q.e, question: q.q, wrongAnswer: q.o[choisi], correctAnswer: q.o[q.b], explanation: q.e, status: "a-comprendre", createdAt: Date.now(), updatedAt: Date.now(), occurrences: 1 });
    localStorage.setItem(cle, JSON.stringify(items));
  } catch (e) {}
}

function enregistrerErreurExercice(lessonId, question, choix, bonneReponse) {
  try {
    const cle = "cc101fr:revisions:v1";
    const items = JSON.parse(localStorage.getItem(cle) || "[]");
    const lecon = LECONS.find((l) => l.id === lessonId) || LECONS[0];
    const existant = items.find((x) => x.source === "exercice" && x.lessonId === lessonId && x.question === question && x.status !== "maitrise");
    if (existant) { existant.occurrences = (existant.occurrences || 1) + 1; existant.updatedAt = Date.now(); localStorage.setItem(cle, JSON.stringify(items)); return; }
    items.unshift({ id: "ex-" + Date.now() + "-" + lessonId, type: "Erreur", source: "exercice", courseId: "claude-code-101", courseTitle: "Claude Code 101", lessonId, lessonTitle: lecon.titre, topicTitle: question, description: "Question : " + question + "\nRéponse donnée : " + choix + "\nRéponse attendue : " + bonneReponse, question, wrongAnswer: choix, correctAnswer: bonneReponse, status: "a-comprendre", createdAt: Date.now(), updatedAt: Date.now(), occurrences: 1 });
    localStorage.setItem(cle, JSON.stringify(items));
  } catch (e) {}
}

function useEtat() {
  const [etat, setEtat] = useState(lireEtat);
  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(etat));
    } catch (e) {
    }
  }, [etat]);
  return [etat, setEtat];
}
function lireRoute() {
  const h = location.hash.replace(/^#/, "");
  if (h === "quiz") return { vue: "quiz" };
  if (h === "lexique") return { vue: "lexique" };
  const m = /^lecon-(\d{1,2})$/.exec(h);
  if (m && +m[1] >= 1 && +m[1] <= TOTAL) return { vue: "lecon", id: +m[1] };
  return { vue: "accueil" };
}
function useRoute() {
  const [route, setRoute] = useState(lireRoute);
  useEffect(() => {
    const f = () => {
      setRoute(lireRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return route;
}
function Icone({ children, taille = 20, ...props }) {
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      width: taille,
      height: taille,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      ...props
    },
    children
  );
}
const IcCheck = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M20 6 9 17l-5-5" }));
const IcX = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M18 6 6 18" }), /* @__PURE__ */ React.createElement("path", { d: "m6 6 12 12" }));
const IcCopie = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }));
const IcGauche = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ React.createElement("path", { d: "M19 12H5" }));
const IcDroite = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M5 12h14" }), /* @__PURE__ */ React.createElement("path", { d: "m12 5 7 7-7 7" }));
const IcSoleil = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2v2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 20v2" }), /* @__PURE__ */ React.createElement("path", { d: "m4.93 4.93 1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "m17.66 17.66 1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M2 12h2" }), /* @__PURE__ */ React.createElement("path", { d: "M20 12h2" }), /* @__PURE__ */ React.createElement("path", { d: "m6.34 17.66-1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "m19.07 4.93-1.41 1.41" }));
const IcLune = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }));
const IcAuto = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3v18" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3a9 9 0 0 1 0 18", fill: "currentColor", stroke: "none" }));
const IcChevron = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "m6 9 6 6 6-6" }));
const IcLoupe = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" }));
const IcRelancer = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), /* @__PURE__ */ React.createElement("path", { d: "M3 3v5h5" }));
const IcDrapeau = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }), /* @__PURE__ */ React.createElement("path", { d: "M4 22v-7" }));
const IcLivre = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" }), /* @__PURE__ */ React.createElement("path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" }));
function fr(s) {
  return String(s).replace(/« /g, "« ").replace(/ »/g, " »").replace(/ ([?!:;])/g, " $1");
}
function Texte({ t }) {
  const morceaux = fr(t).split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, morceaux.map((m, i) => {
    if (m.length > 4 && m.startsWith("**") && m.endsWith("**")) return /* @__PURE__ */ React.createElement("strong", { key: i }, m.slice(2, -2));
    if (m.length > 2 && m.startsWith("`") && m.endsWith("`")) return /* @__PURE__ */ React.createElement("code", { key: i }, m.slice(1, -1));
    if (m.length > 2 && m.startsWith("*") && m.endsWith("*")) return /* @__PURE__ */ React.createElement("em", { key: i }, m.slice(1, -1));
    return m;
  }));
}
function copierTexte(txt) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(txt).then(() => true, () => copierSecours(txt));
  }
  return Promise.resolve(copierSecours(txt));
}
function copierSecours(txt) {
  try {
    const ta = document.createElement("textarea");
    ta.value = txt;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, txt.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}
function Prompt({ texte }) {
  const [etat, setEtat] = useState("repos");
  const minuteur = useRef(null);
  useEffect(() => () => clearTimeout(minuteur.current), []);
  const copier = () => {
    copierTexte(texte).then((ok) => {
      setEtat(ok ? "copie" : "echec");
      clearTimeout(minuteur.current);
      minuteur.current = setTimeout(() => setEtat("repos"), 1800);
    });
  };
  return /* @__PURE__ */ React.createElement("figure", { className: "prompt" }, /* @__PURE__ */ React.createElement("div", { className: "prompt-tete" }, /* @__PURE__ */ React.createElement("span", null, "À envoyer à Claude"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "copier" + (etat === "copie" ? " est-copie" : ""),
      onClick: copier,
      "aria-label": etat === "copie" ? "Texte copié" : "Copier le texte"
    },
    etat === "copie" ? /* @__PURE__ */ React.createElement(IcCheck, { taille: 16 }) : /* @__PURE__ */ React.createElement(IcCopie, { taille: 16 }),
    /* @__PURE__ */ React.createElement("span", null, etat === "copie" ? "Copié" : etat === "echec" ? "Sélectionne le texte" : "Copier")
  )), /* @__PURE__ */ React.createElement("pre", null, texte));
}
function Depliable({ titre, children }) {
  return /* @__PURE__ */ React.createElement("details", { className: "depliable" }, /* @__PURE__ */ React.createElement("summary", null, /* @__PURE__ */ React.createElement("span", null, titre), /* @__PURE__ */ React.createElement(IcChevron, { taille: 18 })), /* @__PURE__ */ React.createElement("div", { className: "depliable-corps" }, children));
}
function Tableau({ entetes, lignes }) {
  return /* @__PURE__ */ React.createElement("div", { className: "tableau" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, entetes.map((e, i) => /* @__PURE__ */ React.createElement("th", { key: i, scope: "col" }, /* @__PURE__ */ React.createElement(Texte, { t: e }))))), /* @__PURE__ */ React.createElement("tbody", null, lignes.map((l, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, l.map((c, j) => j === 0 && entetes[0] === "" ? /* @__PURE__ */ React.createElement("th", { key: j, scope: "row" }, /* @__PURE__ */ React.createElement(Texte, { t: c })) : /* @__PURE__ */ React.createElement("td", { key: j }, /* @__PURE__ */ React.createElement(Texte, { t: c }))))))));
}
function Bloc({ b }) {
  switch (b.type) {
    case "h2":
      return /* @__PURE__ */ React.createElement("h2", null, /* @__PURE__ */ React.createElement(Texte, { t: b.t }));
    case "h3":
      return /* @__PURE__ */ React.createElement("h3", null, /* @__PURE__ */ React.createElement(Texte, { t: b.t }));
    case "liste":
      return /* @__PURE__ */ React.createElement("ul", null, b.items.map((x, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Texte, { t: x }))));
    case "tableau":
      return /* @__PURE__ */ React.createElement(Tableau, { entetes: b.entetes, lignes: b.lignes });
    case "code":
      return /* @__PURE__ */ React.createElement("figure", { className: "code" }, b.titre && /* @__PURE__ */ React.createElement("figcaption", null, b.titre), /* @__PURE__ */ React.createElement("pre", null, /* @__PURE__ */ React.createElement("code", null, b.texte)));
    default:
      return /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement(Texte, { t: b.t }));
  }
}
function Jauge({ valeur, total, etiquette }) {
  const pct = total ? Math.round(valeur / total * 100) : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "jauge", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": total, "aria-valuenow": valeur, "aria-label": etiquette }, /* @__PURE__ */ React.createElement("span", { style: { width: pct + "%" } }));
}
function Anneau({ valeur, total }) {
  const r = 15, c = 2 * Math.PI * r;
  const part = total ? valeur / total : 0;
  return /* @__PURE__ */ React.createElement("a", { href: "#", className: "anneau", "aria-label": `${valeur} leçons terminées sur ${total}. Retour au parcours` }, /* @__PURE__ */ React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 40 40", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r, className: "anneau-fond" }), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "20",
      cy: "20",
      r,
      className: "anneau-plein",
      strokeDasharray: c,
      strokeDashoffset: c * (1 - part),
      transform: "rotate(-90 20 20)"
    }
  )), /* @__PURE__ */ React.createElement("span", null, valeur));
}
const THEMES = ["auto", "clair", "sombre"];
const NOM_THEME = { auto: "automatique", clair: "clair", sombre: "sombre" };
function Barre({ etat, setEtat, route }) {
  const theme = etat.theme;
  const suivant = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const Ic = theme === "clair" ? IcSoleil : theme === "sombre" ? IcLune : IcAuto;
  return /* @__PURE__ */ React.createElement("header", { className: "barre" }, /* @__PURE__ */ React.createElement("div", { className: "barre-int" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "marque" }, /* @__PURE__ */ React.createElement("span", { className: "marque-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("span", { className: "marque-nom" }, "Claude Code 101 ", /* @__PURE__ */ React.createElement("span", null, "en français"))), /* @__PURE__ */ React.createElement("nav", { className: "barre-nav", "aria-label": "Navigation principale" }, /* @__PURE__ */ React.createElement("a", { href: "#lexique", "aria-current": route.vue === "lexique" ? "page" : void 0 }, /* @__PURE__ */ React.createElement(IcLivre, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Lexique")), /* @__PURE__ */ React.createElement("a", { href: "#quiz", "aria-current": route.vue === "quiz" ? "page" : void 0 }, /* @__PURE__ */ React.createElement(IcDrapeau, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Quiz")), /* @__PURE__ */ React.createElement("a", { href: "revisions.html" }, /* @__PURE__ */ React.createElement(IcCheck, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Révisions"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "bouton-icone",
      onClick: () => setEtat((e) => ({ ...e, theme: suivant })),
      "aria-label": `Thème ${NOM_THEME[theme]}. Passer au thème ${NOM_THEME[suivant]}`
    },
    /* @__PURE__ */ React.createElement(Ic, { taille: 19 })
  ), /* @__PURE__ */ React.createElement(Anneau, { valeur: etat.faites.length, total: TOTAL })));
}
function Etape({ lecon, statut }) {
  return /* @__PURE__ */ React.createElement("li", { className: "etape", "data-statut": statut }, /* @__PURE__ */ React.createElement("a", { href: `#lecon-${lecon.id}`, className: "etape-lien" }, /* @__PURE__ */ React.createElement("span", { className: "etape-indicateur" }, statut === "fait" ? /* @__PURE__ */ React.createElement(IcCheck, { taille: 18, strokeWidth: "3" }) : lecon.id), /* @__PURE__ */ React.createElement("span", { className: "etape-texte" }, /* @__PURE__ */ React.createElement("span", { className: "etape-titre" }, lecon.titre), /* @__PURE__ */ React.createElement("span", { className: "etape-desc" }, lecon.resume)), /* @__PURE__ */ React.createElement("span", { className: "etape-duree" }, lecon.duree, " min")));
}
function Accueil({ etat, setEtat, toast }) {
  const n = etat.faites.length;
  const prochaine = LECONS.find((l) => !etat.faites.includes(l.id));
  const pct = Math.round(n / TOTAL * 100);
  const cta = !prochaine ? { href: "#quiz", t: "Passer le quiz final" } : n === 0 ? { href: "#lecon-1", t: "Commencer le parcours" } : { href: `#lecon-${prochaine.id}`, t: `Reprendre : leçon ${prochaine.id}` };
  const effacer = () => {
    if (window.confirm("Effacer ta progression et ton score sur cet appareil ?")) {
      setEtat((e) => ({ ...e, faites: [], quiz: null }));
      toast("Progression effacée");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page" }, /* @__PURE__ */ React.createElement("section", { className: "hero" }, /* @__PURE__ */ React.createElement("h1", null, "Claude Code 101, en français"), /* @__PURE__ */ React.createElement("p", { className: "chapo" }, "Le parcours du cours d’Anthropic Academy, réécrit en français et pensé pour l’iPad. Douze leçons, des exercices sur claude.ai/code et un quiz final."), /* @__PURE__ */ React.createElement("div", { className: "progression" }, /* @__PURE__ */ React.createElement("div", { className: "progression-ligne" }, /* @__PURE__ */ React.createElement("span", null, n === 0 ? "Pas encore commencé" : n === TOTAL ? "Parcours terminé" : `Leçon ${prochaine.id} sur ${TOTAL} à suivre`), /* @__PURE__ */ React.createElement("strong", null, pct, " %")), /* @__PURE__ */ React.createElement(Jauge, { valeur: n, total: TOTAL, etiquette: "Progression dans le parcours" }), /* @__PURE__ */ React.createElement("div", { className: "progression-ligne discret" }, /* @__PURE__ */ React.createElement("span", null, n, " ", n > 1 ? "leçons terminées" : "leçon terminée"), /* @__PURE__ */ React.createElement("span", null, etat.quiz ? `Meilleur score au quiz : ${etat.quiz.meilleur}/${QUIZ.length}` : "Quiz pas encore passé"))), /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-principal bouton-grand", href: cta.href }, cta.t, /* @__PURE__ */ React.createElement(IcDroite, { taille: 20 }))), /* @__PURE__ */ React.createElement("section", { className: "carte besoin" }, /* @__PURE__ */ React.createElement("h2", null, "Ce qu’il te faut"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Ton abonnement Claude Pro."), /* @__PURE__ */ React.createElement("li", null, "Un compte GitHub, gratuit."), /* @__PURE__ */ React.createElement("li", null, "Safari, ou l’onglet Code de l’appli Claude."))), /* @__PURE__ */ React.createElement("nav", { className: "parcours", "aria-label": "Les leçons du parcours" }, SECTIONS.map((s, si) => /* @__PURE__ */ React.createElement("section", { key: si, className: "parcours-section" }, /* @__PURE__ */ React.createElement("h2", null, s), /* @__PURE__ */ React.createElement("ol", { className: "etapes" }, LECONS.filter((l) => l.section === si).map((l) => /* @__PURE__ */ React.createElement(
    Etape,
    {
      key: l.id,
      lecon: l,
      statut: etat.faites.includes(l.id) ? "fait" : prochaine && prochaine.id === l.id ? "actif" : "a-venir"
    }
  ))))), /* @__PURE__ */ React.createElement("section", { className: "parcours-section" }, /* @__PURE__ */ React.createElement("h2", null, "Pour finir"), /* @__PURE__ */ React.createElement("ol", { className: "etapes" }, /* @__PURE__ */ React.createElement("li", { className: "etape etape-terminus", "data-statut": etat.quiz ? "fait" : !prochaine ? "actif" : "a-venir" }, /* @__PURE__ */ React.createElement("a", { href: "#quiz", className: "etape-lien" }, /* @__PURE__ */ React.createElement("span", { className: "etape-indicateur" }, etat.quiz ? /* @__PURE__ */ React.createElement(IcCheck, { taille: 18, strokeWidth: "3" }) : /* @__PURE__ */ React.createElement(IcDrapeau, { taille: 18 })), /* @__PURE__ */ React.createElement("span", { className: "etape-texte" }, /* @__PURE__ */ React.createElement("span", { className: "etape-titre" }, "Quiz final"), /* @__PURE__ */ React.createElement("span", { className: "etape-desc" }, QUIZ.length, " questions sur tout le parcours, une à la fois."))))))), /* @__PURE__ */ React.createElement("section", { className: "apropos" }, /* @__PURE__ */ React.createElement("h2", null, "À propos de ce parcours"), /* @__PURE__ */ React.createElement("p", null, "Parcours non officiel, rédigé par Claude à partir du programme public de Claude Code 101 (Anthropic Academy) et de la documentation officielle de Claude Code en français. Il suit les mêmes leçons, dans le même ordre. Les vidéos et exercices d’origine ne sont pas reproduits : les exercices d’ici sont pensés pour l’iPad."), /* @__PURE__ */ React.createElement("p", null, "Ta progression est enregistrée sur cet appareil."), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Pour le certificat officiel, il faut passer le quiz du cours, en anglais, sur ", /* @__PURE__ */ React.createElement("a", { href: "https://anthropic.skilljar.com/claude-code-101", target: "_blank", rel: "noopener" }, "anthropic.skilljar.com"), "."), /* @__PURE__ */ React.createElement("li", null, "La documentation officielle en français : ", /* @__PURE__ */ React.createElement("a", { href: "https://code.claude.com/docs/fr/overview", target: "_blank", rel: "noopener" }, "code.claude.com/docs/fr"), "."), /* @__PURE__ */ React.createElement("li", null, "Bloqué sur une étape ? Copie le titre de la leçon et pose ta question à Claude.")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-contour", onClick: effacer }, /* @__PURE__ */ React.createElement(IcRelancer, { taille: 18 }), "Effacer ma progression")));
}
function Pastilles({ id, faites }) {
  return /* @__PURE__ */ React.createElement("nav", { className: "pastilles", "aria-label": "Aller à une leçon" }, LECONS.map((l) => {
    const statut = l.id === id ? "courant" : faites.includes(l.id) ? "fait" : "a-venir";
    return /* @__PURE__ */ React.createElement(
      "a",
      {
        key: l.id,
        href: `#lecon-${l.id}`,
        "data-statut": statut,
        "aria-label": `Leçon ${l.id} : ${l.titre}${faites.includes(l.id) ? ", terminée" : ""}`,
        "aria-current": l.id === id ? "step" : void 0
      },
      /* @__PURE__ */ React.createElement("span", null)
    );
  }));
}
function Classer({ lessonId }) {
  const [choix, setChoix] = useState({});
  const justes = CLASSER.filter((s, i) => choix[i] === s.r).length;
  return /* @__PURE__ */ React.createElement("div", { className: "classer" }, /* @__PURE__ */ React.createElement("ol", null, CLASSER.map((s, i) => {
    const c = choix[i];
    return /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("p", { className: "classer-q" }, s.t), /* @__PURE__ */ React.createElement("div", { className: "classer-choix", role: "group", "aria-label": `Phase pour : ${s.t}` }, Object.keys(PHASES).map((k) => /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        key: k,
        className: c === k ? k === s.r ? "est-juste" : "est-faux" : "",
        "aria-pressed": c === k,
        onClick: () => { setChoix((x) => ({ ...x, [i]: k })); if (k !== s.r) enregistrerErreurExercice(lessonId, s.t, PHASES[k], PHASES[s.r]); }
      },
      c === k && (k === s.r ? /* @__PURE__ */ React.createElement(IcCheck, { taille: 16, strokeWidth: "3" }) : /* @__PURE__ */ React.createElement(IcX, { taille: 16, strokeWidth: "3" })),
      PHASES[k]
    ))), /* @__PURE__ */ React.createElement("p", { className: "classer-retour", "aria-live": "polite" }, c && (c === s.r ? "Juste." : `Pas tout à fait : c’est « ${PHASES[s.r]} ».`)));
  })), /* @__PURE__ */ React.createElement("p", { className: "classer-score" }, justes, " sur ", CLASSER.length, " bien placées"));
}
function Exercice({ ex, lessonId }) {
  return /* @__PURE__ */ React.createElement("section", { className: "exercice", "aria-labelledby": "titre-exercice" }, /* @__PURE__ */ React.createElement("h2", { id: "titre-exercice" }, "Exercice"), ex.intro && /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement(Texte, { t: ex.intro })), ex.classer && /* @__PURE__ */ React.createElement(Classer, { lessonId }), ex.etapes.length > 0 && /* @__PURE__ */ React.createElement("ol", { className: "exercice-etapes" }, ex.etapes.map((e, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("span", { className: "exercice-num", "aria-hidden": "true" }, i + 1), /* @__PURE__ */ React.createElement("div", { className: "exercice-contenu" }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement(Texte, { t: e.t })), e.p && /* @__PURE__ */ React.createElement(Prompt, { texte: e.p }), e.a && /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement(Texte, { t: e.a })), e.p2 && /* @__PURE__ */ React.createElement(Prompt, { texte: e.p2 }))))), ex.note && /* @__PURE__ */ React.createElement("p", { className: "note" }, /* @__PURE__ */ React.createElement(Texte, { t: ex.note })), (ex.details || []).map((d, i) => /* @__PURE__ */ React.createElement(Depliable, { key: i, titre: d.titre }, d.t.map((x, j) => /* @__PURE__ */ React.createElement("p", { key: j }, /* @__PURE__ */ React.createElement(Texte, { t: x }))), d.p && /* @__PURE__ */ React.createElement(Prompt, { texte: d.p }))));
}
function Lecon({ id, etat, setEtat, toast }) {
  const l = LECONS[id - 1];
  const fait = etat.faites.includes(id);
  const basculer = () => {
    setEtat((e) => ({
      ...e,
      faites: e.faites.includes(id) ? e.faites.filter((x) => x !== id) : [...e.faites, id]
    }));
    if (!fait) toast(id === TOTAL ? "Dernière leçon terminée. Place au quiz !" : `Leçon ${id} terminée`);
  };
  return /* @__PURE__ */ React.createElement("article", { className: "page lecon" }, /* @__PURE__ */ React.createElement("div", { className: "lecon-haut" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "retour" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), "Parcours"), /* @__PURE__ */ React.createElement("span", { className: "lecon-section" }, SECTIONS[l.section])), /* @__PURE__ */ React.createElement(Pastilles, { id, faites: etat.faites }), /* @__PURE__ */ React.createElement("h1", null, l.titre), /* @__PURE__ */ React.createElement("p", { className: "lecon-meta" }, "Leçon ", id, " sur ", TOTAL, ", environ ", l.duree, " minutes exercice compris"), /* @__PURE__ */ React.createElement("section", { className: "carte objectifs" }, /* @__PURE__ */ React.createElement("h2", null, "Dans cette leçon"), /* @__PURE__ */ React.createElement("ul", null, l.objectifs.map((o, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Texte, { t: o }))))), /* @__PURE__ */ React.createElement("div", { className: "contenu" }, l.blocs.map((b, i) => /* @__PURE__ */ React.createElement(Bloc, { key: i, b }))), /* @__PURE__ */ React.createElement("aside", { className: "retenir" }, /* @__PURE__ */ React.createElement("h2", null, "À retenir"), /* @__PURE__ */ React.createElement("ul", null, l.retenir.map((r, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Texte, { t: r }))))), /* @__PURE__ */ React.createElement("p", { className: "lecon-meta" }, React.createElement("a", { className: "bouton bouton-contour", href: `revisions.html?lesson=${id}` }, "Noter une difficulté sur cette leçon")), React.createElement(Exercice, { ex: l.exercice, lessonId: id }), /* @__PURE__ */ React.createElement("nav", { className: "lecon-pied", "aria-label": "Navigation entre les leçons" }, id > 1 ? /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-contour", href: `#lecon-${id - 1}` }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Précédente")) : /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-contour", href: "#" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Parcours")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-fait" + (fait ? " est-fait" : ""), onClick: basculer, "aria-pressed": fait }, /* @__PURE__ */ React.createElement("span", { className: "coche", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(IcCheck, { taille: 18, strokeWidth: "3" })), fait ? "Leçon terminée" : "Marquer comme terminée"), id < TOTAL ? /* @__PURE__ */ React.createElement("a", { className: "bouton " + (fait ? "bouton-principal" : "bouton-contour"), href: `#lecon-${id + 1}` }, /* @__PURE__ */ React.createElement("span", null, "Suivante"), /* @__PURE__ */ React.createElement(IcDroite, { taille: 18 })) : /* @__PURE__ */ React.createElement("a", { className: "bouton " + (fait ? "bouton-principal" : "bouton-contour"), href: "#quiz" }, /* @__PURE__ */ React.createElement("span", null, "Quiz final"), /* @__PURE__ */ React.createElement(IcDroite, { taille: 18 }))));
}
function Quiz({ etat, setEtat }) {
  const [idx, setIdx] = useState(0);
  const [reponses, setReponses] = useState(() => QUIZ.map(() => null));
  const [valide, setValide] = useState(() => QUIZ.map(() => false));
  const [fini, setFini] = useState(false);
  const titreRef = useRef(null);
  const q = QUIZ[idx];
  const choisi = reponses[idx];
  const estValide = valide[idx];
  const score = reponses.filter((r, i) => r === QUIZ[i].b).length;
  useEffect(() => {
    if (titreRef.current) titreRef.current.focus({ preventScroll: true });
  }, [idx, fini]);
  const choisir = useCallback((j) => {
    if (valide[idx]) return;
    setReponses((r) => r.map((x, i) => i === idx ? j : x));
  }, [idx, valide]);
  const valider = useCallback(() => {
    if (choisi === null || valide[idx]) return;
    if (choisi !== q.b) recordWrongQuiz(q, choisi);
    setValide((v) => v.map((x, i) => i === idx ? true : x));
  }, [choisi, idx, valide, q]);
  const suivant = useCallback(() => {
    if (idx < QUIZ.length - 1) {
      setIdx(idx + 1);
      return;
    }
    setFini(true);
    setEtat((e) => ({ ...e, quiz: { meilleur: Math.max(score, e.quiz ? e.quiz.meilleur : 0), dernier: score } }));
    window.scrollTo(0, 0);
  }, [idx, score, setEtat]);
  const recommencer = () => {
    setIdx(0);
    setFini(false);
    setReponses(QUIZ.map(() => null));
    setValide(QUIZ.map(() => false));
  };
  useEffect(() => {
    if (fini) return;
    const f = (ev) => {
      if (ev.target && /input|textarea/i.test(ev.target.tagName)) return;
      const n = parseInt(ev.key, 10);
      if (n >= 1 && n <= q.o.length) {
        choisir(n - 1);
        return;
      }
      if (ev.key === "Enter") {
        if (!estValide) valider();
        else suivant();
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [fini, q, estValide, choisir, valider, suivant]);
  if (fini) {
    const pct = Math.round(score / QUIZ.length * 100);
    const ratees = QUIZ.map((x, i) => ({ ...x, i })).filter((x) => reponses[x.i] !== x.b);
    const r = 52, c = 2 * Math.PI * r;
    return /* @__PURE__ */ React.createElement("article", { className: "page quiz" }, /* @__PURE__ */ React.createElement("div", { className: "lecon-haut" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "retour" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), "Parcours")), /* @__PURE__ */ React.createElement("section", { className: "resultat" }, /* @__PURE__ */ React.createElement("div", { className: "resultat-anneau" }, /* @__PURE__ */ React.createElement("svg", { width: "128", height: "128", viewBox: "0 0 128 128", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { cx: "64", cy: "64", r, className: "anneau-fond" }), /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: "64",
        cy: "64",
        r,
        className: "anneau-plein",
        strokeDasharray: c,
        strokeDashoffset: c * (1 - score / QUIZ.length),
        transform: "rotate(-90 64 64)"
      }
    )), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, score), "/", QUIZ.length)), /* @__PURE__ */ React.createElement("h1", { tabIndex: -1, ref: titreRef }, pct >= 80 ? "Bravo, tu maîtrises les bases" : "Encore un petit effort"), /* @__PURE__ */ React.createElement("p", { className: "chapo" }, pct >= 80 ? "Tu as compris l’essentiel de Claude Code. Garde le réflexe : explorer, planifier, coder, valider." : "Relis les leçons indiquées ci-dessous, puis retente le quiz."), /* @__PURE__ */ React.createElement("div", { className: "resultat-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-principal", onClick: recommencer }, /* @__PURE__ */ React.createElement(IcRelancer, { taille: 18 }), "Recommencer"), /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-contour", href: "#" }, "Retour au parcours"))), ratees.length > 0 && /* @__PURE__ */ React.createElement("section", { className: "revision" }, /* @__PURE__ */ React.createElement("h2", null, "À revoir"), /* @__PURE__ */ React.createElement("ul", null, ratees.map((x) => /* @__PURE__ */ React.createElement("li", { key: x.i, className: "carte" }, /* @__PURE__ */ React.createElement("p", { className: "revision-q" }, fr(x.q)), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Bonne réponse :"), " ", fr(x.o[x.b])), /* @__PURE__ */ React.createElement("p", { className: "discret" }, fr(x.e)), /* @__PURE__ */ React.createElement("a", { href: `#lecon-${x.l}` }, "Relire la leçon ", x.l, " : ", LECONS[x.l - 1].titre))))));
  }
  return /* @__PURE__ */ React.createElement("article", { className: "page quiz" }, /* @__PURE__ */ React.createElement("div", { className: "lecon-haut" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "retour" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), "Parcours"), /* @__PURE__ */ React.createElement("span", { className: "lecon-section" }, "Quiz final")), /* @__PURE__ */ React.createElement("div", { className: "quiz-progression" }, /* @__PURE__ */ React.createElement("span", null, "Question ", idx + 1, " sur ", QUIZ.length), /* @__PURE__ */ React.createElement(Jauge, { valeur: idx + (estValide ? 1 : 0), total: QUIZ.length, etiquette: "Avancement du quiz" })), /* @__PURE__ */ React.createElement("section", { className: "question carte", key: idx }, /* @__PURE__ */ React.createElement("h1", { tabIndex: -1, ref: titreRef }, fr(q.q)), /* @__PURE__ */ React.createElement("div", { className: "choix", role: "radiogroup", "aria-label": "Réponses possibles" }, q.o.map((opt, j) => {
    const coche = choisi === j;
    let statut = coche ? "coche" : "";
    if (estValide) statut = j === q.b ? "juste" : coche ? "faux" : "eteint";
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        key: j,
        role: "radio",
        "aria-checked": coche,
        className: "choix-carte",
        "data-statut": statut,
        disabled: estValide,
        onClick: () => choisir(j)
      },
      /* @__PURE__ */ React.createElement("span", { className: "choix-indicateur", "aria-hidden": "true" }, estValide && j === q.b ? /* @__PURE__ */ React.createElement(IcCheck, { taille: 14, strokeWidth: "3" }) : estValide && coche ? /* @__PURE__ */ React.createElement(IcX, { taille: 14, strokeWidth: "3" }) : /* @__PURE__ */ React.createElement("i", null)),
      /* @__PURE__ */ React.createElement("span", { className: "choix-texte" }, fr(opt)),
      /* @__PURE__ */ React.createElement("kbd", { "aria-hidden": "true" }, j + 1)
    );
  })), estValide && /* @__PURE__ */ React.createElement("div", { className: "explication " + (choisi === q.b ? "est-juste" : "est-faux"), role: "status" }, /* @__PURE__ */ React.createElement("strong", null, choisi === q.b ? "Bonne réponse." : "Pas tout à fait."), " ", fr(q.e)), /* @__PURE__ */ React.createElement("div", { className: "quiz-actions" }, idx > 0 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-contour", onClick: () => setIdx(idx - 1) }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), "Précédente"), /* @__PURE__ */ React.createElement("span", { className: "espace" }), !estValide ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-principal", disabled: choisi === null, onClick: valider }, "Valider") : /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-principal", onClick: suivant }, idx < QUIZ.length - 1 ? "Question suivante" : "Voir mon résultat", /* @__PURE__ */ React.createElement(IcDroite, { taille: 18 })))), /* @__PURE__ */ React.createElement("p", { className: "astuce" }, "Au clavier : touches 1 à 4 pour choisir, Entrée pour valider."));
}
function Lexique() {
  const [filtre, setFiltre] = useState("");
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const liste = useMemo(() => {
    const f = norm(filtre.trim());
    return f ? LEXIQUE.filter(([m, d]) => norm(m).includes(f) || norm(d).includes(f)) : LEXIQUE;
  }, [filtre]);
  return /* @__PURE__ */ React.createElement("article", { className: "page lexique" }, /* @__PURE__ */ React.createElement("div", { className: "lecon-haut" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "retour" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), "Parcours")), /* @__PURE__ */ React.createElement("h1", null, "Lexique"), /* @__PURE__ */ React.createElement("p", { className: "chapo" }, "Les mots du parcours, expliqués simplement."), /* @__PURE__ */ React.createElement("label", { className: "recherche" }, /* @__PURE__ */ React.createElement(IcLoupe, { taille: 18 }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "search",
      value: filtre,
      onChange: (e) => setFiltre(e.target.value),
      placeholder: "Chercher un mot",
      "aria-label": "Chercher un mot dans le lexique"
    }
  )), liste.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "vide" }, "Aucun mot ne correspond à « ", filtre, " ». Essaie un mot plus court.") : /* @__PURE__ */ React.createElement("dl", null, liste.map(([m, d]) => /* @__PURE__ */ React.createElement("div", { key: m, className: "lexique-entree" }, /* @__PURE__ */ React.createElement("dt", null, m), /* @__PURE__ */ React.createElement("dd", null, fr(d))))));
}
function App() {
  const [etat, setEtat] = useEtat();
  const route = useRoute();
  const [message, setMessage] = useState(null);
  const minuteur = useRef(null);
  const toast = useCallback((t) => {
    setMessage({ t, k: Date.now() });
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setMessage(null), 2400);
  }, []);
  useEffect(() => {
    const racine = document.documentElement;
    if (etat.theme === "clair") racine.setAttribute("data-theme", "light");
    else if (etat.theme === "sombre") racine.setAttribute("data-theme", "dark");
    else racine.removeAttribute("data-theme");
  }, [etat.theme]);
  useEffect(() => {
    const titres = { accueil: "Claude Code 101 en français", quiz: "Quiz final", lexique: "Lexique" };
    document.title = route.vue === "lecon" ? `${LECONS[route.id - 1].titre} · Claude Code 101` : titres[route.vue] + (route.vue === "accueil" ? "" : " · Claude Code 101");
  }, [route]);
  const cle = route.vue + (route.id || "");
  let vue;
  if (route.vue === "lecon") vue = /* @__PURE__ */ React.createElement(Lecon, { id: route.id, etat, setEtat, toast });
  else if (route.vue === "quiz") vue = /* @__PURE__ */ React.createElement(Quiz, { etat, setEtat });
  else if (route.vue === "lexique") vue = /* @__PURE__ */ React.createElement(Lexique, null);
  else vue = /* @__PURE__ */ React.createElement(Accueil, { etat, setEtat, toast });
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("a", { className: "lien-evitement", href: "#contenu", onClick: (e) => {
    e.preventDefault();
    document.getElementById("contenu").focus();
  } }, "Aller au contenu"), /* @__PURE__ */ React.createElement(Barre, { etat, setEtat, route }), /* @__PURE__ */ React.createElement("main", { id: "contenu", tabIndex: -1 }, /* @__PURE__ */ React.createElement("div", { className: "entree", key: cle }, vue)), /* @__PURE__ */ React.createElement("div", { className: "toast-zone", "aria-live": "polite" }, message && /* @__PURE__ */ React.createElement("div", { className: "toast", key: message.k }, /* @__PURE__ */ React.createElement(IcCheck, { taille: 18, strokeWidth: "3" }), message.t)));
}
createRoot(document.getElementById("app")).render(/* @__PURE__ */ React.createElement(App, null));
