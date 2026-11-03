import { React, createRoot } from "./vendor-react.js";
import { COURS } from "./cours.js";
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const PREMIER = COURS[0];
const PLUSIEURS = COURS.length > 1;
const TOTAL_LECONS = COURS.reduce((n, c) => n + c.LECONS.length, 0);
const DERNIER_QUIZ = [...COURS].reverse().find((c) => c.QUIZ.length) || PREMIER;
const LEXIQUE = (() => {
  const vus = /* @__PURE__ */ new Set();
  return COURS.flatMap((c) => c.LEXIQUE || []).filter(([m]) => !vus.has(m) && vus.add(m)).sort((a, b) => a[0].localeCompare(b[0], "fr"));
})();
function lien(c, page) {
  return "#" + (c.id === PREMIER.id ? "" : c.id + "/") + page;
}
const CLE = "cc101fr:v1";
function lireEtat() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE) || "null");
    if (o && Array.isArray(o.faites)) {
      return { faites: o.faites, quiz: o.quiz || null, cours: o.cours || {}, theme: o.theme || "auto" };
    }
  } catch (e) {
  }
  return { faites: [], quiz: null, cours: {}, theme: "auto" };
}
function progression(etat, c) {
  if (c.id === PREMIER.id) return { faites: etat.faites, quiz: etat.quiz };
  const p = (etat.cours || {})[c.id] || {};
  return { faites: p.faites || [], quiz: p.quiz || null };
}
function avecProgression(etat, c, f) {
  const p = f(progression(etat, c));
  if (c.id === PREMIER.id) return { ...etat, faites: p.faites, quiz: p.quiz };
  return { ...etat, cours: { ...etat.cours || {}, [c.id]: p } };
}
function nbFaites(etat, c) {
  const p = progression(etat, c);
  return c.LECONS.filter((l) => p.faites.includes(l.id)).length;
}
function prochaineEtape(etat) {
  for (const c of COURS) {
    const p = progression(etat, c);
    const l = c.LECONS.find((x) => !p.faites.includes(x.id));
    if (l) return { cours: c, lecon: l };
    if (!p.quiz && c.QUIZ.length) return { cours: c, quiz: true };
  }
  return null;
}
function enregistrerErreurQuiz(c, q, choisi) {
  try {
    const cle = "cc101fr:revisions:v1";
    const items = JSON.parse(localStorage.getItem(cle) || "[]");
    const lecon = c.LECONS.find((l) => l.id === q.l) || c.LECONS[0];
    const existant = items.find((x) => x.source === "quiz" && (x.courseId || PREMIER.id) === c.id && x.question === q.q && x.status !== "maitrise");
    if (existant) {
      existant.occurrences = (existant.occurrences || 1) + 1;
      existant.updatedAt = Date.now();
      localStorage.setItem(cle, JSON.stringify(items));
      return;
    }
    items.unshift({ id: "quiz-" + Date.now() + "-" + q.l, type: "Erreur", source: "quiz", courseId: c.id, courseTitle: c.titre, lessonId: lecon.id, lessonTitle: lecon.titre, topicTitle: lecon.objectifs[0] || lecon.titre, description: "Question : " + q.q + "\nRéponse donnée : " + q.o[choisi] + "\nRéponse attendue : " + q.o[q.b] + "\nExplication : " + q.e, question: q.q, wrongAnswer: q.o[choisi], correctAnswer: q.o[q.b], explanation: q.e, status: "a-comprendre", createdAt: Date.now(), updatedAt: Date.now(), occurrences: 1 });
    localStorage.setItem(cle, JSON.stringify(items));
  } catch (e) {
  }
}
function enregistrerErreurExercice(c, lessonId, question, choix, bonneReponse) {
  try {
    const cle = "cc101fr:revisions:v1";
    const items = JSON.parse(localStorage.getItem(cle) || "[]");
    const lecon = c.LECONS.find((l) => l.id === lessonId) || c.LECONS[0];
    const existant = items.find((x) => x.source === "exercice" && (x.courseId || PREMIER.id) === c.id && x.lessonId === lessonId && x.question === question && x.status !== "maitrise");
    if (existant) {
      existant.occurrences = (existant.occurrences || 1) + 1;
      existant.updatedAt = Date.now();
      localStorage.setItem(cle, JSON.stringify(items));
      return;
    }
    items.unshift({ id: "ex-" + Date.now() + "-" + lessonId, type: "Erreur", source: "exercice", courseId: c.id, courseTitle: c.titre, lessonId, lessonTitle: lecon.titre, topicTitle: question, description: "Question : " + question + "\nRéponse donnée : " + choix + "\nRéponse attendue : " + bonneReponse, question, wrongAnswer: choix, correctAnswer: bonneReponse, status: "a-comprendre", createdAt: Date.now(), updatedAt: Date.now(), occurrences: 1 });
    localStorage.setItem(cle, JSON.stringify(items));
  } catch (e) {
  }
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
  if (h === "lexique") return { vue: "lexique" };
  const m = /^(?:([a-z0-9-]+)\/)?(quiz|lecon-(\d{1,3}))$/.exec(h);
  const c = m && (m[1] ? COURS.find((x) => x.id === m[1]) : PREMIER);
  if (c && m[2] === "quiz" && c.QUIZ.length) return { vue: "quiz", cours: c };
  if (c && m[3] && +m[3] >= 1 && +m[3] <= c.LECONS.length) return { vue: "lecon", cours: c, id: +m[3] };
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
const IcListe = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M3 6h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M3 12h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M3 18h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M8 6h13" }), /* @__PURE__ */ React.createElement("path", { d: "M8 12h13" }), /* @__PURE__ */ React.createElement("path", { d: "M8 18h13" }));
const IcCorbeille = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M3 6h18" }), /* @__PURE__ */ React.createElement("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }), /* @__PURE__ */ React.createElement("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }));
const IcReglages = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M20 7h-9" }), /* @__PURE__ */ React.createElement("path", { d: "M14 17H5" }), /* @__PURE__ */ React.createElement("circle", { cx: "17", cy: "17", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "7", cy: "7", r: "3" }));
const IcEnvoyer = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "m22 2-7 20-4-9-9-4Z" }), /* @__PURE__ */ React.createElement("path", { d: "M22 2 11 13" }));
const IcPlus = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M5 12h14" }), /* @__PURE__ */ React.createElement("path", { d: "M12 5v14" }));
const IcBulle = (p) => /* @__PURE__ */ React.createElement(Icone, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }));
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
  const etape = prochaineEtape(etat);
  const coursQuiz = [route.cours, etape && etape.cours].find((c) => c && c.QUIZ.length) || DERNIER_QUIZ;
  const faites = COURS.reduce((n, c) => n + nbFaites(etat, c), 0);
  return /* @__PURE__ */ React.createElement("header", { className: "barre" }, /* @__PURE__ */ React.createElement("div", { className: "barre-int" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "marque" }, /* @__PURE__ */ React.createElement("span", { className: "marque-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("span", { className: "marque-nom" }, "CL4UD3")), /* @__PURE__ */ React.createElement("nav", { className: "barre-nav", "aria-label": "Navigation principale" }, /* @__PURE__ */ React.createElement("a", { href: "#lexique", "aria-current": route.vue === "lexique" ? "page" : void 0 }, /* @__PURE__ */ React.createElement(IcLivre, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Lexique")), /* @__PURE__ */ React.createElement("a", { href: lien(coursQuiz, "quiz"), "aria-current": route.vue === "quiz" ? "page" : void 0 }, /* @__PURE__ */ React.createElement(IcDrapeau, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Quiz")), /* @__PURE__ */ React.createElement("a", { href: "revisions.html" }, /* @__PURE__ */ React.createElement(IcCheck, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Révisions"))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "bouton-icone",
      onClick: () => setEtat((e) => ({ ...e, theme: suivant })),
      "aria-label": `Thème ${NOM_THEME[theme]}. Passer au thème ${NOM_THEME[suivant]}`
    },
    /* @__PURE__ */ React.createElement(Ic, { taille: 19 })
  ), /* @__PURE__ */ React.createElement(Anneau, { valeur: faites, total: TOTAL_LECONS })));
}
function Etape({ c, lecon, statut }) {
  return /* @__PURE__ */ React.createElement("li", { className: "etape", "data-statut": statut }, /* @__PURE__ */ React.createElement("a", { href: lien(c, `lecon-${lecon.id}`), className: "etape-lien" }, /* @__PURE__ */ React.createElement("span", { className: "etape-indicateur" }, statut === "fait" ? /* @__PURE__ */ React.createElement(IcCheck, { taille: 18, strokeWidth: "3" }) : lecon.id), /* @__PURE__ */ React.createElement("span", { className: "etape-texte" }, /* @__PURE__ */ React.createElement("span", { className: "etape-titre" }, lecon.titre), /* @__PURE__ */ React.createElement("span", { className: "etape-desc" }, lecon.resume)), /* @__PURE__ */ React.createElement("span", { className: "etape-duree" }, lecon.duree, " min")));
}
function ParcoursCours({ c, numero, etat, etape }) {
  const p = progression(etat, c);
  const Titre = PLUSIEURS ? "h3" : "h2";
  const ici = etape && etape.cours === c ? etape : null;
  const sections = /* @__PURE__ */ React.createElement(React.Fragment, null, c.SECTIONS.map((s, si) => /* @__PURE__ */ React.createElement("section", { key: si, className: "parcours-section" }, /* @__PURE__ */ React.createElement(Titre, null, s), /* @__PURE__ */ React.createElement("ol", { className: "etapes" }, c.LECONS.filter((l) => l.section === si).map((l) => /* @__PURE__ */ React.createElement(
    Etape,
    {
      key: l.id,
      c,
      lecon: l,
      statut: p.faites.includes(l.id) ? "fait" : ici && ici.lecon === l ? "actif" : "a-venir"
    }
  ))))), c.QUIZ.length > 0 && /* @__PURE__ */ React.createElement("section", { className: "parcours-section" }, /* @__PURE__ */ React.createElement(Titre, null, "Pour finir"), /* @__PURE__ */ React.createElement("ol", { className: "etapes" }, /* @__PURE__ */ React.createElement("li", { className: "etape etape-terminus", "data-statut": p.quiz ? "fait" : ici && ici.quiz ? "actif" : "a-venir" }, /* @__PURE__ */ React.createElement("a", { href: lien(c, "quiz"), className: "etape-lien" }, /* @__PURE__ */ React.createElement("span", { className: "etape-indicateur" }, p.quiz ? /* @__PURE__ */ React.createElement(IcCheck, { taille: 18, strokeWidth: "3" }) : /* @__PURE__ */ React.createElement(IcDrapeau, { taille: 18 })), /* @__PURE__ */ React.createElement("span", { className: "etape-texte" }, /* @__PURE__ */ React.createElement("span", { className: "etape-titre" }, "Quiz final"), /* @__PURE__ */ React.createElement("span", { className: "etape-desc" }, c.QUIZ.length, " questions sur tout le ", PLUSIEURS ? "cours" : "parcours", ", une à la fois.")))))));
  if (!PLUSIEURS) return sections;
  return /* @__PURE__ */ React.createElement("section", { className: "parcours-cours", "aria-labelledby": `cours-${c.id}` }, /* @__PURE__ */ React.createElement("div", { className: "cours-entete" }, /* @__PURE__ */ React.createElement("span", { className: "cours-numero" }, "Cours ", numero), /* @__PURE__ */ React.createElement("h2", { id: `cours-${c.id}` }, c.titre), /* @__PURE__ */ React.createElement("span", { className: "cours-avance" }, nbFaites(etat, c), " sur ", c.LECONS.length, " leçons")), sections);
}
function Accueil({ etat, setEtat, toast }) {
  const n = COURS.reduce((s, c) => s + nbFaites(etat, c), 0);
  const etape = prochaineEtape(etat);
  const pct = Math.round(n / TOTAL_LECONS * 100);
  const cta = !etape ? { href: lien(DERNIER_QUIZ, "quiz"), t: "Passer le quiz final" } : n === 0 ? { href: lien(PREMIER, "lecon-1"), t: "Commencer le parcours" } : etape.quiz ? { href: lien(etape.cours, "quiz"), t: PLUSIEURS ? `Passer le quiz : ${etape.cours.titre}` : "Passer le quiz final" } : { href: lien(etape.cours, `lecon-${etape.lecon.id}`), t: PLUSIEURS ? `Reprendre : ${etape.cours.titre}, leçon ${etape.lecon.id}` : `Reprendre : leçon ${etape.lecon.id}` };
  const ou = n === 0 ? "Pas encore commencé" : n === TOTAL_LECONS || !etape ? "Parcours terminé" : etape.quiz ? `${etape.cours.titre} : quiz final à passer` : PLUSIEURS ? `${etape.cours.titre} : leçon ${etape.lecon.id} sur ${etape.cours.LECONS.length} à suivre` : `Leçon ${etape.lecon.id} sur ${TOTAL_LECONS} à suivre`;
  const quiz = PLUSIEURS ? `Quiz réussis : ${COURS.filter((c) => progression(etat, c).quiz).length} sur ${COURS.filter((c) => c.QUIZ.length).length}` : etat.quiz ? `Meilleur score au quiz : ${etat.quiz.meilleur}/${PREMIER.QUIZ.length}` : "Quiz pas encore passé";
  const effacer = () => {
    if (window.confirm("Effacer ta progression et ton score sur cet appareil ?")) {
      setEtat((e) => ({ ...e, faites: [], quiz: null, cours: {} }));
      toast("Progression effacée");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "page" }, /* @__PURE__ */ React.createElement("section", { className: "hero" }, /* @__PURE__ */ React.createElement("h1", null, "CL4UD3"), /* @__PURE__ */ React.createElement("p", { className: "chapo" }, PLUSIEURS ? `Des cours officiels, réécrits en français et pensés pour l’iPad, à suivre dans l’ordre. Au programme : ${COURS.length} cours, ${TOTAL_LECONS} leçons, des exercices sur claude.ai/code et un quiz final par cours.` : `Le cours Claude Code 101 de Claude Academy, réécrit en français et pensé pour l’iPad. Au programme : ${TOTAL_LECONS} leçons, des exercices sur claude.ai/code et un quiz final.`), /* @__PURE__ */ React.createElement("div", { className: "progression" }, /* @__PURE__ */ React.createElement("div", { className: "progression-ligne" }, /* @__PURE__ */ React.createElement("span", null, ou), /* @__PURE__ */ React.createElement("strong", null, pct, " %")), /* @__PURE__ */ React.createElement(Jauge, { valeur: n, total: TOTAL_LECONS, etiquette: "Progression dans le parcours" }), /* @__PURE__ */ React.createElement("div", { className: "progression-ligne discret" }, /* @__PURE__ */ React.createElement("span", null, n, " ", n > 1 ? "leçons terminées" : "leçon terminée"), /* @__PURE__ */ React.createElement("span", null, quiz))), /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-principal bouton-grand", href: cta.href }, cta.t, /* @__PURE__ */ React.createElement(IcDroite, { taille: 20 }))), /* @__PURE__ */ React.createElement("section", { className: "carte besoin" }, /* @__PURE__ */ React.createElement("h2", null, "Ce qu’il te faut"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Ton abonnement Claude Pro."), /* @__PURE__ */ React.createElement("li", null, "Un compte GitHub, gratuit."), /* @__PURE__ */ React.createElement("li", null, "Safari, ou l’onglet Code de l’appli Claude."))), /* @__PURE__ */ React.createElement("nav", { className: "parcours", "aria-label": "Les leçons du parcours" }, COURS.map((c, ci) => /* @__PURE__ */ React.createElement(ParcoursCours, { key: c.id, c, numero: ci + 1, etat, etape }))), /* @__PURE__ */ React.createElement("section", { className: "apropos" }, /* @__PURE__ */ React.createElement("h2", null, "À propos de ce parcours"), PLUSIEURS ? /* @__PURE__ */ React.createElement("p", null, "Parcours non officiel, rédigé par Claude à partir des programmes publics des cours d’origine et de la documentation officielle de Claude Code en français. Chaque cours suit les mêmes leçons, dans le même ordre. Les vidéos et exercices d’origine ne sont pas reproduits : les exercices d’ici sont pensés pour l’iPad.") : /* @__PURE__ */ React.createElement("p", null, "Parcours non officiel, rédigé par Claude à partir du programme public de Claude Code 101 (Claude Academy) et de la documentation officielle de Claude Code en français. Il suit les mêmes leçons, dans le même ordre. Les vidéos et exercices d’origine ne sont pas reproduits : les exercices d’ici sont pensés pour l’iPad."), /* @__PURE__ */ React.createElement("p", null, "Ta progression est enregistrée sur cet appareil."), /* @__PURE__ */ React.createElement("ul", null, PLUSIEURS ? /* @__PURE__ */ React.createElement("li", null, "Les cours d’origine : ", COURS.map((c, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: c.id }, i > 0 && ", ", /* @__PURE__ */ React.createElement("a", { href: c.source.url, target: "_blank", rel: "noopener" }, c.source.nom))), ". Pour un badge officiel, il faut passer le quiz du cours d’origine.") : /* @__PURE__ */ React.createElement("li", null, "Pour le badge officiel, il faut passer le quiz du cours sur ", /* @__PURE__ */ React.createElement("a", { href: "https://academy.claude.com/fr/courses/claude-code-101", target: "_blank", rel: "noopener" }, "academy.claude.com"), "."), /* @__PURE__ */ React.createElement("li", null, "La documentation officielle en français : ", /* @__PURE__ */ React.createElement("a", { href: "https://code.claude.com/docs/fr/overview", target: "_blank", rel: "noopener" }, "code.claude.com/docs/fr"), "."), /* @__PURE__ */ React.createElement("li", null, "Bloqué sur une étape ? Copie le titre de la leçon et pose ta question à Claude.")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-contour", onClick: effacer }, /* @__PURE__ */ React.createElement(IcRelancer, { taille: 18 }), "Effacer ma progression")));
}
function Pastilles({ c, id, faites }) {
  return /* @__PURE__ */ React.createElement("nav", { className: "pastilles", "aria-label": "Aller à une leçon" }, c.LECONS.map((l) => {
    const statut = l.id === id ? "courant" : faites.includes(l.id) ? "fait" : "a-venir";
    return /* @__PURE__ */ React.createElement(
      "a",
      {
        key: l.id,
        href: lien(c, `lecon-${l.id}`),
        "data-statut": statut,
        "aria-label": `Leçon ${l.id} : ${l.titre}${faites.includes(l.id) ? ", terminée" : ""}`,
        "aria-current": l.id === id ? "step" : void 0
      },
      /* @__PURE__ */ React.createElement("span", null)
    );
  }));
}
function Classer({ cours, lessonId }) {
  const { CLASSER, PHASES } = cours;
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
        onClick: () => {
          setChoix((x) => ({ ...x, [i]: k }));
          if (k !== s.r) enregistrerErreurExercice(cours, lessonId, s.t, PHASES[k], PHASES[s.r]);
        }
      },
      c === k && (k === s.r ? /* @__PURE__ */ React.createElement(IcCheck, { taille: 16, strokeWidth: "3" }) : /* @__PURE__ */ React.createElement(IcX, { taille: 16, strokeWidth: "3" })),
      PHASES[k]
    ))), /* @__PURE__ */ React.createElement("p", { className: "classer-retour", "aria-live": "polite" }, c && (c === s.r ? "Juste." : `Pas tout à fait : c’est « ${PHASES[s.r]} ».`)));
  })), /* @__PURE__ */ React.createElement("p", { className: "classer-score" }, justes, " sur ", CLASSER.length, " bien placées"));
}
function Exercice({ ex, cours, lessonId }) {
  return /* @__PURE__ */ React.createElement("section", { className: "exercice", "aria-labelledby": "titre-exercice" }, /* @__PURE__ */ React.createElement("h2", { id: "titre-exercice" }, "Exercice"), ex.intro && /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement(Texte, { t: ex.intro })), ex.classer && cours.CLASSER && cours.PHASES && /* @__PURE__ */ React.createElement(Classer, { cours, lessonId }), ex.etapes.length > 0 && /* @__PURE__ */ React.createElement("ol", { className: "exercice-etapes" }, ex.etapes.map((e, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("span", { className: "exercice-num", "aria-hidden": "true" }, i + 1), /* @__PURE__ */ React.createElement("div", { className: "exercice-contenu" }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement(Texte, { t: e.t })), e.p && /* @__PURE__ */ React.createElement(Prompt, { texte: e.p }), e.a && /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement(Texte, { t: e.a })), e.p2 && /* @__PURE__ */ React.createElement(Prompt, { texte: e.p2 }))))), ex.note && /* @__PURE__ */ React.createElement("p", { className: "note" }, /* @__PURE__ */ React.createElement(Texte, { t: ex.note })), (ex.details || []).map((d, i) => /* @__PURE__ */ React.createElement(Depliable, { key: i, titre: d.titre }, d.t.map((x, j) => /* @__PURE__ */ React.createElement("p", { key: j }, /* @__PURE__ */ React.createElement(Texte, { t: x }))), d.p && /* @__PURE__ */ React.createElement(Prompt, { texte: d.p }))));
}
function Lecon({ cours: c, id, etat, setEtat, toast }) {
  const l = c.LECONS[id - 1];
  const TOTAL = c.LECONS.length;
  const faites = progression(etat, c).faites;
  const fait = faites.includes(id);
  const suivant = COURS[COURS.indexOf(c) + 1];
  const basculer = () => {
    setEtat((e) => avecProgression(e, c, (p) => ({
      ...p,
      faites: p.faites.includes(id) ? p.faites.filter((x) => x !== id) : [...p.faites, id]
    })));
    if (!fait) toast(id === TOTAL ? c.QUIZ.length ? "Dernière leçon terminée. Place au quiz !" : "Dernière leçon terminée" : `Leçon ${id} terminée`);
  };
  const classeSuite = "bouton " + (fait ? "bouton-principal" : "bouton-contour");
  return /* @__PURE__ */ React.createElement("article", { className: "page lecon" }, /* @__PURE__ */ React.createElement("div", { className: "lecon-haut" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "retour" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), "Parcours"), /* @__PURE__ */ React.createElement("span", { className: "lecon-section" }, PLUSIEURS ? `${c.titre} · ${c.SECTIONS[l.section]}` : c.SECTIONS[l.section]), /* @__PURE__ */ React.createElement(BoutonConversations, { page: `${c.id}/lecon-${id}` })), /* @__PURE__ */ React.createElement(Pastilles, { c, id, faites }), /* @__PURE__ */ React.createElement("h1", null, l.titre), /* @__PURE__ */ React.createElement("p", { className: "lecon-meta" }, "Leçon ", id, " sur ", TOTAL, ", environ ", l.duree, " minutes exercice compris"), /* @__PURE__ */ React.createElement("section", { className: "carte objectifs" }, /* @__PURE__ */ React.createElement("h2", null, "Dans cette leçon"), /* @__PURE__ */ React.createElement("ul", null, l.objectifs.map((o, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Texte, { t: o }))))), /* @__PURE__ */ React.createElement("div", { className: "contenu" }, l.blocs.map((b, i) => /* @__PURE__ */ React.createElement(Bloc, { key: i, b }))), /* @__PURE__ */ React.createElement("aside", { className: "retenir" }, /* @__PURE__ */ React.createElement("h2", null, "À retenir"), /* @__PURE__ */ React.createElement("ul", null, l.retenir.map((r, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Texte, { t: r }))))), /* @__PURE__ */ React.createElement("p", { className: "lecon-meta" }, /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-contour", href: `revisions.html?course=${c.id}&lesson=${id}` }, "Noter une difficulté sur cette leçon")), /* @__PURE__ */ React.createElement(Exercice, { ex: l.exercice, cours: c, lessonId: id }), /* @__PURE__ */ React.createElement("nav", { className: "lecon-pied", "aria-label": "Navigation entre les leçons" }, id > 1 ? /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-contour", href: lien(c, `lecon-${id - 1}`) }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Précédente")) : /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-contour", href: "#" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), /* @__PURE__ */ React.createElement("span", null, "Parcours")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-fait" + (fait ? " est-fait" : ""), onClick: basculer, "aria-pressed": fait }, /* @__PURE__ */ React.createElement("span", { className: "coche", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(IcCheck, { taille: 18, strokeWidth: "3" })), fait ? "Leçon terminée" : "Marquer comme terminée"), id < TOTAL ? /* @__PURE__ */ React.createElement("a", { className: classeSuite, href: lien(c, `lecon-${id + 1}`) }, /* @__PURE__ */ React.createElement("span", null, "Suivante"), /* @__PURE__ */ React.createElement(IcDroite, { taille: 18 })) : c.QUIZ.length ? /* @__PURE__ */ React.createElement("a", { className: classeSuite, href: lien(c, "quiz") }, /* @__PURE__ */ React.createElement("span", null, "Quiz final"), /* @__PURE__ */ React.createElement(IcDroite, { taille: 18 })) : suivant ? /* @__PURE__ */ React.createElement("a", { className: classeSuite, href: lien(suivant, "lecon-1") }, /* @__PURE__ */ React.createElement("span", null, "Cours suivant"), /* @__PURE__ */ React.createElement(IcDroite, { taille: 18 })) : /* @__PURE__ */ React.createElement("a", { className: classeSuite, href: "#" }, /* @__PURE__ */ React.createElement("span", null, "Parcours"), /* @__PURE__ */ React.createElement(IcDroite, { taille: 18 }))));
}
function Quiz({ cours, etat, setEtat }) {
  const { QUIZ, LECONS } = cours;
  const coursSuivant = COURS[COURS.indexOf(cours) + 1];
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
    if (choisi !== q.b) enregistrerErreurQuiz(cours, q, choisi);
    setValide((v) => v.map((x, i) => i === idx ? true : x));
  }, [choisi, idx, valide, q, cours]);
  const suivant = useCallback(() => {
    if (idx < QUIZ.length - 1) {
      setIdx(idx + 1);
      return;
    }
    setFini(true);
    setEtat((e) => avecProgression(e, cours, (p) => ({ ...p, quiz: { meilleur: Math.max(score, p.quiz ? p.quiz.meilleur : 0), dernier: score } })));
    window.scrollTo(0, 0);
  }, [idx, score, setEtat, cours, QUIZ]);
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
    )), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, score), "/", QUIZ.length)), /* @__PURE__ */ React.createElement("h1", { tabIndex: -1, ref: titreRef }, pct >= 80 ? "Bravo, tu maîtrises les bases" : "Encore un petit effort"), /* @__PURE__ */ React.createElement("p", { className: "chapo" }, pct >= 80 ? "Tu as compris l’essentiel de Claude Code. Garde le réflexe : explorer, planifier, coder, valider." : "Relis les leçons indiquées ci-dessous, puis retente le quiz."), /* @__PURE__ */ React.createElement("div", { className: "resultat-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-principal", onClick: recommencer }, /* @__PURE__ */ React.createElement(IcRelancer, { taille: 18 }), "Recommencer"), coursSuivant && /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-contour", href: lien(coursSuivant, "lecon-1") }, "Cours suivant : ", coursSuivant.titre, /* @__PURE__ */ React.createElement(IcDroite, { taille: 18 })), /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-contour", href: "#" }, "Retour au parcours"))), ratees.length > 0 && /* @__PURE__ */ React.createElement("section", { className: "revision" }, /* @__PURE__ */ React.createElement("h2", null, "À revoir"), /* @__PURE__ */ React.createElement("ul", null, ratees.map((x) => /* @__PURE__ */ React.createElement("li", { key: x.i, className: "carte" }, /* @__PURE__ */ React.createElement("p", { className: "revision-q" }, fr(x.q)), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Bonne réponse :"), " ", fr(x.o[x.b])), /* @__PURE__ */ React.createElement("p", { className: "discret" }, fr(x.e)), /* @__PURE__ */ React.createElement("a", { href: lien(cours, `lecon-${x.l}`) }, "Relire la leçon ", x.l, " : ", LECONS[x.l - 1].titre))))));
  }
  return /* @__PURE__ */ React.createElement("article", { className: "page quiz" }, /* @__PURE__ */ React.createElement("div", { className: "lecon-haut" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "retour" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), "Parcours"), /* @__PURE__ */ React.createElement("span", { className: "lecon-section" }, PLUSIEURS ? `Quiz final · ${cours.titre}` : "Quiz final")), /* @__PURE__ */ React.createElement("div", { className: "quiz-progression" }, /* @__PURE__ */ React.createElement("span", null, "Question ", idx + 1, " sur ", QUIZ.length), /* @__PURE__ */ React.createElement(Jauge, { valeur: idx + (estValide ? 1 : 0), total: QUIZ.length, etiquette: "Avancement du quiz" })), /* @__PURE__ */ React.createElement("section", { className: "question carte", key: idx }, /* @__PURE__ */ React.createElement("h1", { tabIndex: -1, ref: titreRef }, fr(q.q)), /* @__PURE__ */ React.createElement("div", { className: "choix", role: "radiogroup", "aria-label": "Réponses possibles" }, q.o.map((opt, j) => {
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
  return /* @__PURE__ */ React.createElement("article", { className: "page lexique" }, /* @__PURE__ */ React.createElement("div", { className: "lecon-haut" }, /* @__PURE__ */ React.createElement("a", { href: "#", className: "retour" }, /* @__PURE__ */ React.createElement(IcGauche, { taille: 18 }), "Parcours"), /* @__PURE__ */ React.createElement(BoutonConversations, { page: "lexique" })), /* @__PURE__ */ React.createElement("h1", null, "Lexique"), /* @__PURE__ */ React.createElement("p", { className: "chapo" }, "Les mots du parcours, expliqués simplement."), /* @__PURE__ */ React.createElement("label", { className: "recherche" }, /* @__PURE__ */ React.createElement(IcLoupe, { taille: 18 }), /* @__PURE__ */ React.createElement(
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
const CLE_ROBOT = "cc101fr:robot:v1";
const CLE_CONVERSATIONS = "cc101fr:robot-conversations:v1";
const CLE_SERVICE_IA = "cc101fr:revision-ai:v1";
const MAX_PAR_PAGE = 30;
const BIENVENUES = [
  "Hey, salut toi ! Qu’est-ce que tu veux savoir sur ce passage ?",
  "Bonjour ! Pose-moi ta question, je t’écoute.",
  "Coucou ! Un mot t’échappe ? On regarde ça ensemble.",
  "Bip bip ! Robotto au rapport. Qu’est-ce qui te turlupine ?",
  "Salut ! On décortique ce passage ensemble ?",
  "Hello ! Je suis tout ouïe. Vas-y, demande-moi."
];
const RAPIDES = [
  { l: "Plus simple", q: "Explique-le-moi plus simplement, comme à un débutant." },
  { l: "Un exemple", q: "Donne-moi un exemple concret." },
  { l: "Plus court", q: "Résume-le en deux phrases." }
];
const TRIS = [
  { v: "recentes", l: "Plus récentes", f: (a, b) => b.modifieLe - a.modifieLe },
  { v: "anciennes", l: "Plus anciennes", f: (a, b) => a.creeLe - b.creeLe },
  { v: "longues", l: "Les plus longues", f: (a, b) => b.messages.length - a.messages.length || b.modifieLe - a.modifieLe }
];
const CONSIGNE_ROBOT = "Tu t’appelles Robotto, le petit robot de CL4UD3, une appli qui aide à suivre en français des cours sur Claude Code. L’apprenant te pose des questions sur un passage du cours qu’il a sélectionné. Réponds en français, en le tutoyant, avec des phrases courtes et simples. Appuie-toi sur le passage et sur ce que tu sais de Claude Code. Si tu n’es pas sûr d’une information, dis-le clairement : n’invente ni commande, ni libellé, ni adresse. Mise en forme possible : **gras**, `code`, une ligne vide entre deux paragraphes. Pas d’autre Markdown.";
function lireJson(cle, defaut) {
  try {
    const v = JSON.parse(localStorage.getItem(cle) || "null");
    return v == null ? defaut : v;
  } catch (e) {
    return defaut;
  }
}
function ecrireJson(cle, v) {
  try {
    localStorage.setItem(cle, JSON.stringify(v));
    return true;
  } catch (e) {
    return false;
  }
}
const relaisRobot = new EventTarget();
function lireConversations() {
  const l = lireJson(CLE_CONVERSATIONS, []);
  return Array.isArray(l) ? l : [];
}
function ecrireConversations(liste) {
  let l = liste;
  while (!ecrireJson(CLE_CONVERSATIONS, l) && l.length) {
    const ancienne = l.reduce((a, b) => a.modifieLe <= b.modifieLe ? a : b);
    l = l.filter((x) => x !== ancienne);
  }
  relaisRobot.dispatchEvent(new Event("conversations"));
}
function enregistrerConversation(conv) {
  const autres = lireConversations().filter((x) => x.id !== conv.id);
  const page = [conv, ...autres.filter((x) => x.page === conv.page)].sort((a, b) => b.modifieLe - a.modifieLe).slice(0, MAX_PAR_PAGE);
  ecrireConversations([...page, ...autres.filter((x) => x.page !== conv.page)]);
}
function supprimerConversations(filtre) {
  ecrireConversations(lireConversations().filter((x) => !filtre(x)));
}
function useConversations(page) {
  const lire = () => page ? lireConversations().filter((x) => x.page === page) : [];
  const [liste, setListe] = useState(lire);
  useEffect(() => {
    const f = () => setListe(lire());
    f();
    relaisRobot.addEventListener("conversations", f);
    return () => relaisRobot.removeEventListener("conversations", f);
  }, [page]);
  return liste;
}
function pageDuRobot(route) {
  if (route.vue === "lecon") return { cle: `${route.cours.id}/lecon-${route.id}`, cours: route.cours.titre, titre: `Leçon ${route.id} : ${route.cours.LECONS[route.id - 1].titre}` };
  if (route.vue === "lexique") return { cle: "lexique", cours: "Lexique commun à tous les cours", titre: "Lexique" };
  return null;
}
const titreConversation = (x) => {
  const q = (x.messages.find((m) => m.role === "user") || {}).t || "Conversation sans question";
  return q.length > 80 ? q.slice(0, 79) + "…" : q;
};
const DATE_ROBOT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
async function demanderAuRobot(adresse, conv, consignes) {
  const contexte = [
    CONSIGNE_ROBOT,
    `Cours : ${conv.cours}`,
    `Page : ${conv.pageTitre}`,
    conv.extrait ? `Passage sélectionné :
« ${conv.extrait} »` : "Pas de passage sélectionné : la question porte sur la page en général."
  ].join("\n\n");
  const n = conv.messages.length;
  const messages = conv.messages.map((m, i) => {
    let t = m.t;
    if (i === 0) t = contexte + "\n\nMa question : " + t;
    if (i === n - 1 && consignes) t += "\n\nMes consignes sur ta façon de répondre, à suivre en priorité : " + consignes;
    return { role: m.role, content: t };
  });
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), 3e4);
  try {
    let rep;
    try {
      rep = await fetch(adresse, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }), signal: ctrl.signal });
    } catch (e) {
      throw Error(e.name === "AbortError" ? "Le service IA met plus de 30 secondes à répondre. Réessaie dans un moment." : "Je n’arrive pas à joindre le service IA. Vérifie ta connexion à Internet, puis réessaie.");
    }
    let d;
    try {
      d = await rep.json();
    } catch (e) {
      throw Error("La réponse du service IA est illisible.");
    }
    if (!rep.ok) {
      const motif = d.error && (d.error.message || d.error) || d.message || "erreur " + rep.status;
      throw Error("Le service IA a refusé la demande : " + String(motif));
    }
    const t = typeof d.answer === "string" ? d.answer : typeof d.content === "string" ? d.content : Array.isArray(d.content) ? d.content.filter((x) => x && x.type === "text").map((x) => x.text).join("\n\n") : d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    if (typeof t !== "string" || !t.trim()) throw Error("Le service IA n’a pas renvoyé de réponse.");
    return t.trim();
  } finally {
    clearTimeout(minuteur);
  }
}
function RobotPixels({ taille = 40 }) {
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      className: "robot-pixels",
      width: taille,
      height: Math.round(taille * 11 / 16),
      viewBox: "0 0 16 11",
      shapeRendering: "crispEdges",
      "aria-hidden": "true"
    },
    /* @__PURE__ */ React.createElement("g", { className: "robot-pattes-a" }, /* @__PURE__ */ React.createElement("rect", { x: "4", y: "8", width: "1", height: "3" }), /* @__PURE__ */ React.createElement("rect", { x: "9", y: "8", width: "1", height: "3" })),
    /* @__PURE__ */ React.createElement("g", { className: "robot-pattes-b" }, /* @__PURE__ */ React.createElement("rect", { x: "6", y: "8", width: "1", height: "3" }), /* @__PURE__ */ React.createElement("rect", { x: "11", y: "8", width: "1", height: "3" })),
    /* @__PURE__ */ React.createElement("g", { className: "robot-corps" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "1", width: "10", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "4", width: "2", height: "2" }), /* @__PURE__ */ React.createElement("rect", { x: "13", y: "4", width: "2", height: "2" })),
    /* @__PURE__ */ React.createElement("g", { className: "robot-regard" }, /* @__PURE__ */ React.createElement("g", { className: "robot-yeux" }, /* @__PURE__ */ React.createElement("rect", { x: "5", y: "3", width: "1", height: "2" }), /* @__PURE__ */ React.createElement("rect", { x: "10", y: "3", width: "1", height: "2" })))
  );
}
function TexteRobot({ t }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, t.split("```").map((m, i) => i % 2 ? /* @__PURE__ */ React.createElement("pre", { key: i, className: "robot-code" }, /* @__PURE__ */ React.createElement("code", null, m.replace(/^[\w-]*\n/, "").replace(/\n$/, ""))) : m.split(/\n{2,}/).filter((x) => x.trim()).map((x, j) => /* @__PURE__ */ React.createElement("p", { key: i + "-" + j }, /* @__PURE__ */ React.createElement(Texte, { t: x.trim() })))));
}
function BoutonConversations({ page }) {
  const n = useConversations(page).length;
  if (!n) return null;
  return /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton-conversations", onClick: () => relaisRobot.dispatchEvent(new Event("ouvrir-liste")) }, /* @__PURE__ */ React.createElement(IcBulle, { taille: 17 }), "Conversations (", n, ")");
}
function Robot({ route }) {
  const page = pageDuRobot(route);
  const cle = page ? page.cle : null;
  const liste = useConversations(cle);
  const [sel, setSel] = useState(null);
  const [ouvert, setOuvert] = useState(false);
  const [vue, setVue] = useState("chat");
  const [conv, setConv] = useState(null);
  const [humeur, setHumeur] = useState("arrive");
  const [question, setQuestion] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [service, setService] = useState("");
  const [reglages, setReglages] = useState(() => ({ consignes: "", tri: "recentes", ...lireJson(CLE_ROBOT, {}) }));
  const [voirConsignes, setVoirConsignes] = useState(false);
  const [brouillon, setBrouillon] = useState(reglages.consignes);
  const plage = useRef(null), attente = useRef(null), fil = useRef(null), fenetre = useRef(null);
  const majReglages = (p) => setReglages((r) => {
    const n = { ...r, ...p };
    ecrireJson(CLE_ROBOT, n);
    return n;
  });
  const lireService = () => setService(String((lireJson(CLE_SERVICE_IA, {}) || {}).endpoint || ""));
  useEffect(() => {
    if (!cle) {
      setSel(null);
      return;
    }
    const placer = () => {
      const r = plage.current;
      if (!r) return;
      const rects = r.getClientRects();
      const b = rects.length ? rects[rects.length - 1] : r.getBoundingClientRect();
      const t = 52, marge = 12;
      const x = Math.min(Math.max(b.right - t / 2, marge), window.innerWidth - t - marge);
      let y = b.bottom + 10;
      if (y + t > window.innerHeight - marge) y = Math.max(b.top - t - 10, marge);
      setSel((s) => s && { ...s, x, y });
    };
    const lire = () => {
      const s = document.getSelection();
      const texte = s && s.rangeCount ? s.toString().replace(/\s+/g, " ").trim() : "";
      const r = texte.length >= 2 ? s.getRangeAt(0) : null;
      const n = r && r.commonAncestorContainer;
      const el = n && (n.nodeType === 1 ? n : n.parentElement);
      if (!el || !el.closest("main .page") || el.closest("input, textarea, .robot-fenetre")) {
        plage.current = null;
        setSel(null);
        return;
      }
      plage.current = r;
      setSel((avant) => ({ texte: texte.slice(0, 1500), x: 0, y: 0, n: avant ? avant.n : Date.now() }));
      placer();
    };
    const auChangement = () => {
      clearTimeout(attente.current);
      attente.current = setTimeout(lire, 300);
    };
    const auDefilement = () => requestAnimationFrame(placer);
    document.addEventListener("selectionchange", auChangement);
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement);
    return () => {
      clearTimeout(attente.current);
      document.removeEventListener("selectionchange", auChangement);
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
    };
  }, [cle]);
  useEffect(() => {
    setOuvert(false);
    setConv(null);
    setVoirConsignes(false);
  }, [cle]);
  useEffect(() => {
    const f = () => {
      lireService();
      setVue("liste");
      setOuvert(true);
    };
    relaisRobot.addEventListener("ouvrir-liste", f);
    return () => relaisRobot.removeEventListener("ouvrir-liste", f);
  }, []);
  useEffect(() => {
    if (humeur !== "arrive" && humeur !== "joie") return;
    const m = setTimeout(() => setHumeur((h) => h === humeur ? "repos" : h), 1e3);
    return () => clearTimeout(m);
  }, [humeur, conv && conv.id]);
  useEffect(() => {
    if (!ouvert) return;
    if (fenetre.current) fenetre.current.focus({ preventScroll: true });
    const f = (e) => {
      if (e.key === "Escape") setOuvert(false);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [ouvert]);
  useEffect(() => {
    if (fil.current) fil.current.scrollTop = fil.current.scrollHeight;
  }, [conv, envoi, erreur, ouvert, vue, service]);
  if (!page) return null;
  const nouvelle = (extrait) => {
    lireService();
    setConv({
      id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      page: cle,
      cours: page.cours,
      pageTitre: page.titre,
      extrait: extrait || "",
      creeLe: Date.now(),
      modifieLe: Date.now(),
      bienvenue: BIENVENUES[Math.floor(Math.random() * BIENVENUES.length)],
      messages: []
    });
    setVue("chat");
    setOuvert(true);
    setHumeur("arrive");
    setErreur("");
    setQuestion("");
  };
  const ouvrirAvecSelection = () => {
    if (!sel) return;
    nouvelle(sel.texte);
    plage.current = null;
    setSel(null);
    try {
      document.getSelection().removeAllRanges();
    } catch (e) {
    }
  };
  const rouvrir = (x) => {
    lireService();
    setConv(x);
    setVue("chat");
    setErreur("");
    setQuestion("");
    setHumeur("arrive");
  };
  const envoyer = async (texte) => {
    const q = texte.trim();
    if (!q || envoi || !conv || !service) return;
    const c1 = { ...conv, modifieLe: Date.now(), messages: [...conv.messages, { role: "user", t: q }] };
    const meme = (f) => setConv((c) => c && c.id === c1.id ? f(c) : c);
    setConv(c1);
    setQuestion("");
    setErreur("");
    setEnvoi(true);
    setHumeur("reflechit");
    try {
      const reponse = await demanderAuRobot(service, c1, (reglages.consignes || "").trim());
      const c2 = { ...c1, modifieLe: Date.now(), messages: [...c1.messages, { role: "assistant", t: reponse }] };
      enregistrerConversation(c2);
      meme(() => c2);
      setHumeur("joie");
    } catch (e) {
      meme(() => conv);
      setQuestion((v) => v || q);
      setErreur(e.message);
      setHumeur("repos");
    } finally {
      setEnvoi(false);
    }
  };
  const supprimer = (x) => {
    if (!window.confirm(`Supprimer la conversation « ${titreConversation(x)} » ?`)) return;
    supprimerConversations((y) => y.id === x.id);
    if (conv && conv.id === x.id) setConv(null);
  };
  const toutSupprimer = () => {
    if (!window.confirm("Supprimer toutes les conversations de cette page ?")) return;
    supprimerConversations((y) => y.page === cle);
    setConv(null);
  };
  const tri = TRIS.find((t) => t.v === reglages.tri) || TRIS[0];
  const triees = [...liste].sort(tri.f);
  const consignesEnregistrees = brouillon.trim() === (reglages.consignes || "");
  return /* @__PURE__ */ React.createElement(React.Fragment, null, sel && sel.y > 0 && !ouvert && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "robot-bouton",
      key: sel.n,
      style: { left: sel.x + "px", top: sel.y + "px" },
      onMouseDown: (e) => e.preventDefault(),
      onClick: ouvrirAvecSelection,
      "aria-label": "Poser une question à Robotto sur le texte sélectionné"
    },
    /* @__PURE__ */ React.createElement("span", { className: "robot robot-arrive" }, /* @__PURE__ */ React.createElement(RobotPixels, { taille: 36 }))
  ), ouvert && /* @__PURE__ */ React.createElement("section", { className: "robot-fenetre", role: "dialog", "aria-label": "Robotto", tabIndex: -1, ref: fenetre }, /* @__PURE__ */ React.createElement("header", { className: "robot-tete" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "robot-avatar", onClick: () => setHumeur(envoi ? "reflechit" : "joie"), "aria-label": "Faire sauter Robotto" }, /* @__PURE__ */ React.createElement("span", { className: "robot robot-" + humeur, key: conv ? conv.id : "liste" }, /* @__PURE__ */ React.createElement(RobotPixels, { taille: 44 }))), /* @__PURE__ */ React.createElement("p", { className: "robot-nom" }, vue === "liste" ? "Conversations" : "Robotto"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "bouton-icone robot-consignes-bouton" + (voirConsignes ? " actif" : ""),
      "aria-pressed": voirConsignes,
      "aria-label": "Ma façon de répondre",
      onClick: () => {
        setBrouillon(reglages.consignes || "");
        setVoirConsignes((v) => !v);
      }
    },
    /* @__PURE__ */ React.createElement(IcReglages, { taille: 20 })
  ), vue === "chat" ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton-icone robot-liste-bouton", "aria-label": "Conversations de cette page", onClick: () => setVue("liste") }, /* @__PURE__ */ React.createElement(IcListe, { taille: 20 })) : conv && /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton-icone robot-retour-bouton", "aria-label": "Revenir à la conversation", onClick: () => setVue("chat") }, /* @__PURE__ */ React.createElement(IcBulle, { taille: 20 })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton-icone", "aria-label": "Fermer", onClick: () => setOuvert(false) }, /* @__PURE__ */ React.createElement(IcX, { taille: 20 }))), voirConsignes && /* @__PURE__ */ React.createElement("div", { className: "robot-consignes" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "robot-consignes" }, "Ma façon de répondre"), /* @__PURE__ */ React.createElement("p", { className: "robot-aide" }, fr("Robotto suit ces consignes dans toutes ses réponses. Elles restent sur cet appareil.")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      id: "robot-consignes",
      rows: 3,
      value: brouillon,
      onChange: (e) => setBrouillon(e.target.value),
      placeholder: "Par exemple : réponds en trois phrases, avec un exemple concret."
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "robot-ligne" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "bouton bouton-principal",
      disabled: consignesEnregistrees,
      onClick: () => majReglages({ consignes: brouillon.trim() })
    },
    consignesEnregistrees && reglages.consignes ? "Enregistré" : "Enregistrer"
  ))), vue === "chat" && conv && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "robot-fil", ref: fil, "aria-live": "polite" }, /* @__PURE__ */ React.createElement("div", { className: "robot-bulle robot-de-robot" }, /* @__PURE__ */ React.createElement("p", null, fr(conv.bienvenue))), !service && /* @__PURE__ */ React.createElement("div", { className: "robot-bulle robot-de-robot robot-connexion" }, /* @__PURE__ */ React.createElement("p", null, fr("Pour te répondre, j’ai besoin d’être connecté à une IA. Ça se règle une seule fois, dans le carnet de révision :")), /* @__PURE__ */ React.createElement("ol", null, /* @__PURE__ */ React.createElement("li", null, fr("ouvre le panneau « Assistant intelligent » ;")), /* @__PURE__ */ React.createElement("li", null, fr("colle l’adresse HTTPS de ton service IA, le petit serveur qui garde ta clé à l’abri ;")), /* @__PURE__ */ React.createElement("li", null, fr("touche « Enregistrer et tester la connexion », puis reviens ici."))), /* @__PURE__ */ React.createElement("a", { className: "bouton bouton-principal", href: "revisions.html" }, "Connecter une IA")), conv.messages.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "robot-bulle " + (m.role === "user" ? "robot-de-moi" : "robot-de-robot") }, m.role === "user" ? /* @__PURE__ */ React.createElement("p", null, m.t) : /* @__PURE__ */ React.createElement(TexteRobot, { t: m.t }))), envoi && /* @__PURE__ */ React.createElement("div", { className: "robot-attente", role: "status", "aria-label": "Robotto réfléchit" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), erreur && /* @__PURE__ */ React.createElement("p", { className: "robot-erreur", role: "alert" }, fr(erreur))), service && /* @__PURE__ */ React.createElement("form", { className: "robot-saisie", onSubmit: (e) => {
    e.preventDefault();
    envoyer(question);
  } }, /* @__PURE__ */ React.createElement("div", { className: "robot-rapides" }, RAPIDES.map((r) => /* @__PURE__ */ React.createElement("button", { type: "button", key: r.l, className: "robot-rapide", disabled: envoi, onClick: () => envoyer(r.q) }, r.l))), /* @__PURE__ */ React.createElement("div", { className: "robot-ligne" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 1,
      value: question,
      onChange: (e) => setQuestion(e.target.value),
      placeholder: "Ta question…",
      "aria-label": "Ta question à Robotto",
      onKeyDown: (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          envoyer(question);
        }
      }
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "bouton bouton-principal robot-envoyer", disabled: envoi || !question.trim(), "aria-label": "Envoyer" }, /* @__PURE__ */ React.createElement(IcEnvoyer, { taille: 20 }))))), (vue === "liste" || !conv) && /* @__PURE__ */ React.createElement("div", { className: "robot-fil robot-liste", ref: fil }, !liste.length ? /* @__PURE__ */ React.createElement("p", { className: "robot-aide" }, fr("Aucune conversation sur cette page pour l’instant. Sélectionne un passage, puis touche Robotto.")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "robot-tri" }, /* @__PURE__ */ React.createElement("span", null, "Trier"), /* @__PURE__ */ React.createElement("select", { value: tri.v, onChange: (e) => majReglages({ tri: e.target.value }) }, TRIS.map((t) => /* @__PURE__ */ React.createElement("option", { key: t.v, value: t.v }, t.l)))), /* @__PURE__ */ React.createElement("ul", null, triees.map((x) => {
    const nq = x.messages.filter((m) => m.role === "user").length;
    return /* @__PURE__ */ React.createElement("li", { key: x.id, className: "robot-conv" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "robot-conv-ouvrir", onClick: () => rouvrir(x) }, /* @__PURE__ */ React.createElement("strong", null, titreConversation(x)), /* @__PURE__ */ React.createElement("span", null, DATE_ROBOT.format(new Date(x.modifieLe)), " · ", nq, " question", nq > 1 ? "s" : "")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "bouton-icone robot-conv-supprimer",
        onClick: () => supprimer(x),
        "aria-label": `Supprimer la conversation « ${titreConversation(x)} »`
      },
      /* @__PURE__ */ React.createElement(IcCorbeille, { taille: 19 })
    ));
  })), liste.length >= MAX_PAR_PAGE && /* @__PURE__ */ React.createElement("p", { className: "robot-aide" }, "Seules les ", MAX_PAR_PAGE, " conversations les plus récentes de la page sont gardées.")), /* @__PURE__ */ React.createElement("div", { className: "robot-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-principal", onClick: () => nouvelle("") }, /* @__PURE__ */ React.createElement(IcPlus, { taille: 18 }), "Nouvelle conversation"), liste.length > 0 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "bouton bouton-contour robot-tout-supprimer", onClick: toutSupprimer }, /* @__PURE__ */ React.createElement(IcCorbeille, { taille: 18 }), "Tout supprimer")))));
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
    document.title = route.vue === "lecon" ? `${route.cours.LECONS[route.id - 1].titre} · ${route.cours.titre}` : route.vue === "quiz" ? `Quiz final · ${route.cours.titre}` : route.vue === "lexique" ? "Lexique · CL4UD3" : "CL4UD3";
  }, [route]);
  const cle = route.vue + (route.cours ? route.cours.id : "") + (route.id || "");
  let vue;
  if (route.vue === "lecon") vue = /* @__PURE__ */ React.createElement(Lecon, { cours: route.cours, id: route.id, etat, setEtat, toast });
  else if (route.vue === "quiz") vue = /* @__PURE__ */ React.createElement(Quiz, { cours: route.cours, etat, setEtat });
  else if (route.vue === "lexique") vue = /* @__PURE__ */ React.createElement(Lexique, null);
  else vue = /* @__PURE__ */ React.createElement(Accueil, { etat, setEtat, toast });
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("a", { className: "lien-evitement", href: "#contenu", onClick: (e) => {
    e.preventDefault();
    document.getElementById("contenu").focus();
  } }, "Aller au contenu"), /* @__PURE__ */ React.createElement(Barre, { etat, setEtat, route }), /* @__PURE__ */ React.createElement("main", { id: "contenu", tabIndex: -1 }, /* @__PURE__ */ React.createElement("div", { className: "entree", key: cle }, vue)), /* @__PURE__ */ React.createElement("div", { className: "toast-zone", "aria-live": "polite" }, message && /* @__PURE__ */ React.createElement("div", { className: "toast", key: message.k }, /* @__PURE__ */ React.createElement(IcCheck, { taille: 18, strokeWidth: "3" }), message.t)), /* @__PURE__ */ React.createElement(Robot, { route }));
}
createRoot(document.getElementById("app")).render(/* @__PURE__ */ React.createElement(App, null));
