// CL4UD3 — application
// Source lisible. Le fichier app.js utilisé par la page est généré à partir de celui-ci.
// Composants inspirés de 21st.dev et adaptés :
//  - « Vertical Descriptive Stepper » (sean0205) pour le parcours
//  - « Questionnaire » (uiable) pour le quiz, une question à la fois
//  - thème « Amber Vivid_1 » (sriyanshintern) pour la couleur d’accent et les arrondis

import { React, createRoot } from "./vendor-react.js";
import { COURS } from "./cours.js";

const { useState, useEffect, useRef, useMemo, useCallback, useId } = React;

/* ---------------------------------------------------------------- cours */

// Les cours viennent de cours.js, dans l’ordre du parcours. Tant qu’il n’y en a
// qu’un, l’appli s’affiche exactement comme avant.
const PREMIER = COURS[0];
const PLUSIEURS = COURS.length > 1;
const TOTAL_LECONS = COURS.reduce((n, c) => n + c.LECONS.length, 0);
const DERNIER_QUIZ = [...COURS].reverse().find((c) => c.QUIZ.length) || PREMIER;

// Le lexique réunit les mots de tous les cours, sans doublon, par ordre alphabétique.
const LEXIQUE = (() => {
  const vus = new Set();
  return COURS.flatMap((c) => c.LEXIQUE || [])
    .filter(([m]) => !vus.has(m) && vus.add(m))
    .sort((a, b) => a[0].localeCompare(b[0], "fr"));
})();

// Adresses : #lecon-3 et #quiz pour le premier cours (les liens existants restent valables),
// #<id du cours>/lecon-3 et #<id du cours>/quiz pour les suivants.
function lien(c, page) {
  return "#" + (c.id === PREMIER.id ? "" : c.id + "/") + page;
}

/* ---------------------------------------------------------------- état */

const CLE = "cc101fr:v1";

// La progression du premier cours garde son format d’origine (faites, quiz) ;
// celle des cours suivants est rangée dans « cours », par id de cours.
function lireEtat() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE) || "null");
    if (o && Array.isArray(o.faites)) {
      return { faites: o.faites, quiz: o.quiz || null, cours: o.cours || {}, theme: o.theme || "auto" };
    }
  } catch (e) {}
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
  return { ...etat, cours: { ...(etat.cours || {}), [c.id]: p } };
}

function nbFaites(etat, c) {
  const p = progression(etat, c);
  return c.LECONS.filter((l) => p.faites.includes(l.id)).length;
}

// La prochaine étape : la première leçon pas encore terminée, ou le quiz d’un cours
// dont toutes les leçons sont faites, en suivant l’ordre des cours.
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
    if (existant) { existant.occurrences = (existant.occurrences || 1) + 1; existant.updatedAt = Date.now(); localStorage.setItem(cle, JSON.stringify(items)); return; }
    items.unshift({ id: "quiz-" + Date.now() + "-" + q.l, type: "Erreur", source: "quiz", courseId: c.id, courseTitle: c.titre, lessonId: lecon.id, lessonTitle: lecon.titre, topicTitle: lecon.objectifs[0] || lecon.titre, description: "Question : " + q.q + "\nRéponse donnée : " + q.o[choisi] + "\nRéponse attendue : " + q.o[q.b] + "\nExplication : " + q.e, question: q.q, wrongAnswer: q.o[choisi], correctAnswer: q.o[q.b], explanation: q.e, status: "a-comprendre", createdAt: Date.now(), updatedAt: Date.now(), occurrences: 1 });
    localStorage.setItem(cle, JSON.stringify(items));
  } catch (e) {}
}

function enregistrerErreurExercice(c, lessonId, question, choix, bonneReponse) {
  try {
    const cle = "cc101fr:revisions:v1";
    const items = JSON.parse(localStorage.getItem(cle) || "[]");
    const lecon = c.LECONS.find((l) => l.id === lessonId) || c.LECONS[0];
    const existant = items.find((x) => x.source === "exercice" && (x.courseId || PREMIER.id) === c.id && x.lessonId === lessonId && x.question === question && x.status !== "maitrise");
    if (existant) { existant.occurrences = (existant.occurrences || 1) + 1; existant.updatedAt = Date.now(); localStorage.setItem(cle, JSON.stringify(items)); return; }
    items.unshift({ id: "ex-" + Date.now() + "-" + lessonId, type: "Erreur", source: "exercice", courseId: c.id, courseTitle: c.titre, lessonId, lessonTitle: lecon.titre, topicTitle: question, description: "Question : " + question + "\nRéponse donnée : " + choix + "\nRéponse attendue : " + bonneReponse, question, wrongAnswer: choix, correctAnswer: bonneReponse, status: "a-comprendre", createdAt: Date.now(), updatedAt: Date.now(), occurrences: 1 });
    localStorage.setItem(cle, JSON.stringify(items));
  } catch (e) {}
}

function useEtat() {
  const [etat, setEtat] = useState(lireEtat);
  useEffect(() => {
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {}
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
    const f = () => { setRoute(lireRoute()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return route;
}

/* ---------------------------------------------------------------- icônes (tracés Lucide, licence ISC) */

function Icone({ children, taille = 20, ...props }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}
const IcCheck = (p) => <Icone {...p}><path d="M20 6 9 17l-5-5" /></Icone>;
const IcX = (p) => <Icone {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icone>;
const IcCopie = (p) => <Icone {...p}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></Icone>;
const IcGauche = (p) => <Icone {...p}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></Icone>;
const IcDroite = (p) => <Icone {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icone>;
const IcSoleil = (p) => <Icone {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></Icone>;
const IcLune = (p) => <Icone {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Icone>;
const IcAuto = (p) => <Icone {...p}><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none" /></Icone>;
const IcChevron = (p) => <Icone {...p}><path d="m6 9 6 6 6-6" /></Icone>;
const IcLoupe = (p) => <Icone {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icone>;
const IcRelancer = (p) => <Icone {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Icone>;
const IcDrapeau = (p) => <Icone {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></Icone>;
const IcLivre = (p) => <Icone {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Icone>;
const IcListe = (p) => <Icone {...p}><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /></Icone>;
const IcCorbeille = (p) => <Icone {...p}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></Icone>;
const IcReglages = (p) => <Icone {...p}><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></Icone>;
const IcEnvoyer = (p) => <Icone {...p}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icone>;
const IcPlus = (p) => <Icone {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Icone>;
const IcBulle = (p) => <Icone {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Icone>;
const IcCoches = (p) => <Icone {...p}><path d="m3 7 2 2 4-4" /><path d="m3 17 2 2 4-4" /><path d="M13 7h8" /><path d="M13 17h8" /></Icone>;

/* ---------------------------------------------------------------- petits composants */

// Typographie française : espaces insécables avant ? ! : ; et dans les guillemets
function fr(s) {
  return String(s)
    .replace(/« /g, "«\u00A0")
    .replace(/ »/g, "\u00A0»")
    .replace(/ ([?!:;])/g, "\u00A0$1");
}

// Mise en forme : **gras**, *italique*, `code`
function Texte({ t }) {
  const morceaux = fr(t).split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g);
  return (
    <>
      {morceaux.map((m, i) => {
        if (m.length > 4 && m.startsWith("**") && m.endsWith("**")) return <strong key={i}>{m.slice(2, -2)}</strong>;
        if (m.length > 2 && m.startsWith("`") && m.endsWith("`")) return <code key={i}>{m.slice(1, -1)}</code>;
        if (m.length > 2 && m.startsWith("*") && m.endsWith("*")) return <em key={i}>{m.slice(1, -1)}</em>;
        return m;
      })}
    </>
  );
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

const ENVIRONNEMENT_PAR_DEFAUT = "Claude Code sur le web (claude.ai/code)";

// Les données gardent le nom officiel des modes (documentation : Accept edits, Manual).
// La check-list affiche le libellé de l’appli Claude en français.
const MODES_AFFICHES = { "Accept edits": "Accepter automatiquement les modifications", "Manual": "Manuel" };

// Check-list « Avant d’envoyer » : un bouton qui déroule la configuration de la conversation
// (cfg d’un prompt, ou d’une étape où l’on agit avec Claude sans prompt). Les coches ne sont
// pas enregistrées : elles servent seulement à vérifier, sur le moment.
function useConfiguration(cfg) {
  const id = useId();
  const [ouvert, setOuvert] = useState(false);
  const [coches, setCoches] = useState([]);
  if (!cfg) return { bouton: null, panneau: null };
  const lignes = [
    ["Environnement", cfg.env || ENVIRONNEMENT_PAR_DEFAUT],
    ["Session", cfg.session],
    ["Dépôt", cfg.depot],
    ["Branche", cfg.branche],
    ["Mode", MODES_AFFICHES[cfg.autorisations] || cfg.autorisations],
  ];
  const n = coches.length, total = lignes.length;
  const basculer = (nom) => setCoches((c) => c.includes(nom) ? c.filter((x) => x !== nom) : [...c, nom]);
  const bouton = (
    <button type="button" className={"cfg-bouton" + (n === total ? " tout-ok" : "")}
      aria-expanded={ouvert} aria-controls={id} onClick={() => setOuvert((o) => !o)}
      aria-label={`Avant d’envoyer : configuration de la conversation, ${n} sur ${total} vérifiés`}>
      {n === total ? <IcCheck taille={16} /> : <IcCoches taille={16} />}
      <span>Avant d’envoyer</span>
      <span className="cfg-compte">{n}/{total}</span>
      <IcChevron taille={16} className="cfg-chevron" />
    </button>
  );
  const panneau = (
    <div className="cfg-panneau" id={id} hidden={!ouvert}>
      <p>Vérifie ta conversation :</p>
      {lignes.map(([nom, valeur]) => (
        <button key={nom} type="button" className="cfg-case" aria-pressed={coches.includes(nom)} onClick={() => basculer(nom)}>
          <span className="cfg-coche" aria-hidden="true"><IcCheck taille={14} /></span>
          <span><b>{nom}</b> : {valeur}</span>
        </button>
      ))}
    </div>
  );
  return { bouton, panneau };
}

// Étape où l’on agit avec Claude sans prompt à copier : seulement la check-list.
function ConfigurationEtape({ cfg }) {
  const { bouton, panneau } = useConfiguration(cfg);
  return (
    <div className="prompt prompt-sans-texte">
      <div className="prompt-tete">
        <span>Dans la conversation</span>
        <div className="prompt-actions">{bouton}</div>
      </div>
      {panneau}
    </div>
  );
}

function Prompt({ texte, cfg }) {
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
  const { bouton, panneau } = useConfiguration(cfg);
  return (
    <figure className="prompt">
      <div className="prompt-tete">
        <span>À envoyer à Claude</span>
        <div className="prompt-actions">
          {bouton}
          <button type="button" className={"copier" + (etat === "copie" ? " est-copie" : "")} onClick={copier}
            aria-label={etat === "copie" ? "Texte copié" : "Copier le texte"}>
            {etat === "copie" ? <IcCheck taille={16} /> : <IcCopie taille={16} />}
            <span>{etat === "copie" ? "Copié" : etat === "echec" ? "Sélectionne le texte" : "Copier"}</span>
          </button>
        </div>
      </div>
      {panneau}
      <pre>{texte}</pre>
    </figure>
  );
}

function Depliable({ titre, children }) {
  return (
    <details className="depliable">
      <summary><span>{titre}</span><IcChevron taille={18} /></summary>
      <div className="depliable-corps">{children}</div>
    </details>
  );
}

function Tableau({ entetes, lignes }) {
  return (
    <div className="tableau">
      <table>
        <thead><tr>{entetes.map((e, i) => <th key={i} scope="col"><Texte t={e} /></th>)}</tr></thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i}>{l.map((c, j) => j === 0 && entetes[0] === ""
              ? <th key={j} scope="row"><Texte t={c} /></th>
              : <td key={j}><Texte t={c} /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bloc({ b }) {
  switch (b.type) {
    case "h2": return <h2><Texte t={b.t} /></h2>;
    case "h3": return <h3><Texte t={b.t} /></h3>;
    case "liste": return <ul>{b.items.map((x, i) => <li key={i}><Texte t={x} /></li>)}</ul>;
    case "tableau": return <Tableau entetes={b.entetes} lignes={b.lignes} />;
    case "code": return (
      <figure className="code">
        {b.titre && <figcaption>{b.titre}</figcaption>}
        <pre><code>{b.texte}</code></pre>
      </figure>
    );
    default: return <p><Texte t={b.t} /></p>;
  }
}

// Encadré « Les mots de la leçon » : les mots nouveaux de la leçon (champ mots).
// Les définitions viennent du lexique, pour que les deux disent toujours la même chose.
function MotsLecon({ mots }) {
  const entrees = (mots || []).map((m) => LEXIQUE.find(([x]) => x === m)).filter(Boolean);
  if (!entrees.length) return null;
  return (
    <section className="carte mots">
      <h2>Les mots de la leçon</h2>
      <dl>
        {entrees.map(([m, d]) => (
          <div key={m} className="mots-entree"><dt>{m}</dt><dd>{fr(d)}</dd></div>
        ))}
      </dl>
      <a className="mots-lien" href="#lexique"><IcLivre taille={18} /><span>Tout le lexique</span></a>
    </section>
  );
}

function Jauge({ valeur, total, etiquette }) {
  const pct = total ? Math.round((valeur / total) * 100) : 0;
  return (
    <div className="jauge" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={valeur} aria-label={etiquette}>
      <span style={{ width: pct + "%" }} />
    </div>
  );
}

function Anneau({ valeur, total }) {
  const r = 15, c = 2 * Math.PI * r;
  const part = total ? valeur / total : 0;
  return (
    <a href="#" className="anneau" aria-label={`${valeur} leçons terminées sur ${total}. Retour au parcours`}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} className="anneau-fond" />
        <circle cx="20" cy="20" r={r} className="anneau-plein"
          strokeDasharray={c} strokeDashoffset={c * (1 - part)} transform="rotate(-90 20 20)" />
      </svg>
      <span>{valeur}</span>
    </a>
  );
}

/* ---------------------------------------------------------------- barre du haut */

const THEMES = ["auto", "clair", "sombre"];
const NOM_THEME = { auto: "automatique", clair: "clair", sombre: "sombre" };

function Barre({ etat, setEtat, route }) {
  const theme = etat.theme;
  const suivant = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const Ic = theme === "clair" ? IcSoleil : theme === "sombre" ? IcLune : IcAuto;
  // Le lien Quiz mène au quiz du cours affiché, sinon à celui du cours en cours.
  const etape = prochaineEtape(etat);
  const coursQuiz = [route.cours, etape && etape.cours].find((c) => c && c.QUIZ.length) || DERNIER_QUIZ;
  const faites = COURS.reduce((n, c) => n + nbFaites(etat, c), 0);
  return (
    <header className="barre">
      <div className="barre-int">
        <a href="#" className="marque">
          <span className="marque-logo" aria-hidden="true"><i /><i /><i /></span>
          <span className="marque-nom">CL4UD3</span>
        </a>
        <nav className="barre-nav" aria-label="Navigation principale">
          <a href="#lexique" aria-current={route.vue === "lexique" ? "page" : undefined}><IcLivre taille={18} /><span>Lexique</span></a>
          <a href={lien(coursQuiz, "quiz")} aria-current={route.vue === "quiz" ? "page" : undefined}><IcDrapeau taille={18} /><span>Quiz</span></a>
          <a href="revisions.html"><IcCheck taille={18} /><span>Révisions</span></a>
        </nav>
        <button type="button" className="bouton-icone" onClick={() => setEtat((e) => ({ ...e, theme: suivant }))}
          aria-label={`Thème ${NOM_THEME[theme]}. Passer au thème ${NOM_THEME[suivant]}`}>
          <Ic taille={19} />
        </button>
        <Anneau valeur={faites} total={TOTAL_LECONS} />
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- accueil : le parcours (stepper vertical) */

function Etape({ c, lecon, statut }) {
  return (
    <li className="etape" data-statut={statut}>
      <a href={lien(c, `lecon-${lecon.id}`)} className="etape-lien">
        <span className="etape-indicateur">
          {statut === "fait" ? <IcCheck taille={18} strokeWidth="3" /> : lecon.id}
        </span>
        <span className="etape-texte">
          <span className="etape-titre">{lecon.titre}</span>
          <span className="etape-desc">{lecon.resume}</span>
        </span>
        <span className="etape-duree">{lecon.duree} min</span>
      </a>
    </li>
  );
}

function ParcoursCours({ c, numero, etat, etape }) {
  const p = progression(etat, c);
  const Titre = PLUSIEURS ? "h3" : "h2";
  const ici = etape && etape.cours === c ? etape : null;
  const sections = (
    <>
      {c.SECTIONS.map((s, si) => (
        <section key={si} className="parcours-section">
          <Titre>{s}</Titre>
          <ol className="etapes">
            {c.LECONS.filter((l) => l.section === si).map((l) => (
              <Etape key={l.id} c={c} lecon={l}
                statut={p.faites.includes(l.id) ? "fait" : ici && ici.lecon === l ? "actif" : "a-venir"} />
            ))}
          </ol>
        </section>
      ))}
      {c.QUIZ.length > 0 && (
        <section className="parcours-section">
          <Titre>Pour finir</Titre>
          <ol className="etapes">
            <li className="etape etape-terminus" data-statut={p.quiz ? "fait" : ici && ici.quiz ? "actif" : "a-venir"}>
              <a href={lien(c, "quiz")} className="etape-lien">
                <span className="etape-indicateur">{p.quiz ? <IcCheck taille={18} strokeWidth="3" /> : <IcDrapeau taille={18} />}</span>
                <span className="etape-texte">
                  <span className="etape-titre">Quiz final</span>
                  <span className="etape-desc">{c.QUIZ.length} questions sur tout le {PLUSIEURS ? "cours" : "parcours"}, une à la fois.</span>
                </span>
              </a>
            </li>
          </ol>
        </section>
      )}
    </>
  );
  if (!PLUSIEURS) return sections;
  return (
    <section className="parcours-cours" aria-labelledby={`cours-${c.id}`}>
      <div className="cours-entete">
        <span className="cours-numero">Cours {numero}</span>
        <h2 id={`cours-${c.id}`}>{c.titre}</h2>
        <span className="cours-avance">{nbFaites(etat, c)} sur {c.LECONS.length} leçons</span>
      </div>
      {sections}
    </section>
  );
}

function Accueil({ etat, setEtat, toast }) {
  const n = COURS.reduce((s, c) => s + nbFaites(etat, c), 0);
  const etape = prochaineEtape(etat);
  const pct = Math.round((n / TOTAL_LECONS) * 100);
  const cta = !etape
    ? { href: lien(DERNIER_QUIZ, "quiz"), t: "Passer le quiz final" }
    : n === 0 ? { href: lien(PREMIER, "lecon-1"), t: "Commencer le parcours" }
    : etape.quiz ? { href: lien(etape.cours, "quiz"), t: PLUSIEURS ? `Passer le quiz : ${etape.cours.titre}` : "Passer le quiz final" }
    : { href: lien(etape.cours, `lecon-${etape.lecon.id}`), t: PLUSIEURS ? `Reprendre : ${etape.cours.titre}, leçon ${etape.lecon.id}` : `Reprendre : leçon ${etape.lecon.id}` };
  const ou = n === 0 ? "Pas encore commencé"
    : n === TOTAL_LECONS || !etape ? "Parcours terminé"
    : etape.quiz ? `${etape.cours.titre} : quiz final à passer`
    : PLUSIEURS ? `${etape.cours.titre} : leçon ${etape.lecon.id} sur ${etape.cours.LECONS.length} à suivre`
    : `Leçon ${etape.lecon.id} sur ${TOTAL_LECONS} à suivre`;
  const quiz = PLUSIEURS
    ? `Quiz réussis : ${COURS.filter((c) => progression(etat, c).quiz).length} sur ${COURS.filter((c) => c.QUIZ.length).length}`
    : etat.quiz ? `Meilleur score au quiz : ${etat.quiz.meilleur}/${PREMIER.QUIZ.length}` : "Quiz pas encore passé";

  const effacer = () => {
    if (window.confirm("Effacer ta progression et ton score sur cet appareil ?")) {
      setEtat((e) => ({ ...e, faites: [], quiz: null, cours: {} }));
      toast("Progression effacée");
    }
  };

  return (
    <div className="page">
      <section className="hero">
        <h1>CL4UD3</h1>
        <p className="chapo">{PLUSIEURS
          ? `Des cours officiels, réécrits en français et pensés pour l’iPad, à suivre dans l’ordre. Au programme : ${COURS.length} cours, ${TOTAL_LECONS} leçons, des exercices sur claude.ai/code et un quiz final par cours.`
          : `Le cours Claude Code 101 de Claude Academy, réécrit en français et pensé pour l’iPad. Au programme : ${TOTAL_LECONS} leçons, des exercices sur claude.ai/code et un quiz final.`}</p>
        <div className="progression">
          <div className="progression-ligne">
            <span>{ou}</span>
            <strong>{pct} %</strong>
          </div>
          <Jauge valeur={n} total={TOTAL_LECONS} etiquette="Progression dans le parcours" />
          <div className="progression-ligne discret">
            <span>{n} {n > 1 ? "leçons terminées" : "leçon terminée"}</span>
            <span>{quiz}</span>
          </div>
        </div>
        <a className="bouton bouton-principal bouton-grand" href={cta.href}>{cta.t}<IcDroite taille={20} /></a>
      </section>

      <section className="carte besoin">
        <h2>Ce qu’il te faut</h2>
        <ul>
          <li>Ton abonnement Claude Pro.</li>
          <li>Un compte GitHub, gratuit.</li>
          <li>Safari, ou l’onglet Code de l’appli Claude.</li>
        </ul>
      </section>

      <nav className="parcours" aria-label="Les leçons du parcours">
        {COURS.map((c, ci) => <ParcoursCours key={c.id} c={c} numero={ci + 1} etat={etat} etape={etape} />)}
      </nav>

      <section className="apropos">
        <h2>À propos de ce parcours</h2>
        {PLUSIEURS
          ? <p>Parcours non officiel, rédigé par Claude à partir des programmes publics des cours d’origine et de la documentation officielle de Claude Code en français. Chaque cours suit les mêmes leçons, dans le même ordre. Les vidéos et exercices d’origine ne sont pas reproduits : les exercices d’ici sont pensés pour l’iPad.</p>
          : <p>Parcours non officiel, rédigé par Claude à partir du programme public de Claude Code 101 (Claude Academy) et de la documentation officielle de Claude Code en français. Il suit les mêmes leçons, dans le même ordre. Les vidéos et exercices d’origine ne sont pas reproduits : les exercices d’ici sont pensés pour l’iPad.</p>}
        <p>Ta progression est enregistrée sur cet appareil.</p>
        <ul>
          {PLUSIEURS
            ? <li>Les cours d’origine : {COURS.map((c, i) => (
                <React.Fragment key={c.id}>{i > 0 && ", "}<a href={c.source.url} target="_blank" rel="noopener">{c.source.nom}</a></React.Fragment>
              ))}. Pour un badge officiel, il faut passer le quiz du cours d’origine.</li>
            : <li>Pour le badge officiel, il faut passer le quiz du cours sur <a href="https://academy.claude.com/fr/courses/claude-code-101" target="_blank" rel="noopener">academy.claude.com</a>.</li>}
          <li>La documentation officielle en français : <a href="https://code.claude.com/docs/fr/overview" target="_blank" rel="noopener">code.claude.com/docs/fr</a>.</li>
          <li>Bloqué sur une étape ? Copie le titre de la leçon et pose ta question à Claude.</li>
        </ul>
        <button type="button" className="bouton bouton-contour" onClick={effacer}><IcRelancer taille={18} />Effacer ma progression</button>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- leçon */

function Pastilles({ c, id, faites }) {
  return (
    <nav className="pastilles" aria-label="Aller à une leçon">
      {c.LECONS.map((l) => {
        const statut = l.id === id ? "courant" : faites.includes(l.id) ? "fait" : "a-venir";
        return (
          <a key={l.id} href={lien(c, `lecon-${l.id}`)} data-statut={statut}
            aria-label={`Leçon ${l.id} : ${l.titre}${faites.includes(l.id) ? ", terminée" : ""}`}
            aria-current={l.id === id ? "step" : undefined}>
            <span />
          </a>
        );
      })}
    </nav>
  );
}

// Exercice interactif « classer » : les étapes et les phases viennent du cours (CLASSER, PHASES).
function Classer({ cours, lessonId }) {
  const { CLASSER, PHASES } = cours;
  const [choix, setChoix] = useState({});
  const justes = CLASSER.filter((s, i) => choix[i] === s.r).length;
  return (
    <div className="classer">
      <ol>
        {CLASSER.map((s, i) => {
          const c = choix[i];
          return (
            <li key={i}>
              <p className="classer-q">{s.t}</p>
              <div className="classer-choix" role="group" aria-label={`Phase pour : ${s.t}`}>
                {Object.keys(PHASES).map((k) => (
                  <button type="button" key={k}
                    className={c === k ? (k === s.r ? "est-juste" : "est-faux") : ""}
                    aria-pressed={c === k}
                    onClick={() => { setChoix((x) => ({ ...x, [i]: k })); if (k !== s.r) enregistrerErreurExercice(cours, lessonId, s.t, PHASES[k], PHASES[s.r]); }}>
                    {c === k && (k === s.r ? <IcCheck taille={16} strokeWidth="3" /> : <IcX taille={16} strokeWidth="3" />)}
                    {PHASES[k]}
                  </button>
                ))}
              </div>
              <p className="classer-retour" aria-live="polite">
                {c && (c === s.r ? "Juste." : `Pas tout à fait : c’est « ${PHASES[s.r]} ».`)}
              </p>
            </li>
          );
        })}
      </ol>
      <p className="classer-score">{justes} sur {CLASSER.length} bien placées</p>
    </div>
  );
}

function Exercice({ ex, cours, lessonId }) {
  return (
    <section className="exercice" aria-labelledby="titre-exercice">
      <h2 id="titre-exercice">Exercice</h2>
      {ex.intro && <p><Texte t={ex.intro} /></p>}
      {ex.classer && cours.CLASSER && cours.PHASES && <Classer cours={cours} lessonId={lessonId} />}
      {ex.etapes.length > 0 && (
        <ol className="exercice-etapes">
          {ex.etapes.map((e, i) => (
            <li key={i}>
              <span className="exercice-num" aria-hidden="true">{i + 1}</span>
              <div className="exercice-contenu">
                <p><Texte t={e.t} /></p>
                {e.p && <Prompt texte={e.p} cfg={e.cfg} />}
                {!e.p && e.cfg && <ConfigurationEtape cfg={e.cfg} />}
                {e.a && <p><Texte t={e.a} /></p>}
                {e.p2 && <Prompt texte={e.p2} cfg={e.cfg2} />}
              </div>
            </li>
          ))}
        </ol>
      )}
      {ex.note && <p className="note"><Texte t={ex.note} /></p>}
      {(ex.details || []).map((d, i) => (
        <Depliable key={i} titre={d.titre}>
          {d.t.map((x, j) => <p key={j}><Texte t={x} /></p>)}
          {d.p && <Prompt texte={d.p} cfg={d.cfg} />}
        </Depliable>
      ))}
    </section>
  );
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
      faites: p.faites.includes(id) ? p.faites.filter((x) => x !== id) : [...p.faites, id],
    })));
    if (!fait) toast(id === TOTAL ? (c.QUIZ.length ? "Dernière leçon terminée. Place au quiz !" : "Dernière leçon terminée") : `Leçon ${id} terminée`);
  };
  const classeSuite = "bouton " + (fait ? "bouton-principal" : "bouton-contour");
  return (
    <article className="page lecon">
      <div className="lecon-haut">
        <a href="#" className="retour"><IcGauche taille={18} />Parcours</a>
        <span className="lecon-section">{PLUSIEURS ? `${c.titre} · ${c.SECTIONS[l.section]}` : c.SECTIONS[l.section]}</span>
        <BoutonConversations page={`${c.id}/lecon-${id}`} />
      </div>
      <Pastilles c={c} id={id} faites={faites} />
      <h1>{l.titre}</h1>
      <p className="lecon-meta">Leçon {id} sur {TOTAL}, environ {l.duree} minutes exercice compris</p>

      <section className="carte objectifs">
        <h2>Dans cette leçon</h2>
        <ul>{l.objectifs.map((o, i) => <li key={i}><Texte t={o} /></li>)}</ul>
      </section>
      <MotsLecon mots={l.mots} />

      <div className="contenu">{l.blocs.map((b, i) => <Bloc key={i} b={b} />)}</div>

      <aside className="retenir">
        <h2>À retenir</h2>
        <ul>{l.retenir.map((r, i) => <li key={i}><Texte t={r} /></li>)}</ul>
      </aside>

      <p className="lecon-meta"><a className="bouton bouton-contour" href={`revisions.html?course=${c.id}&lesson=${id}`}>Noter une difficulté sur cette leçon</a></p>
      <Exercice ex={l.exercice} cours={c} lessonId={id} />

      <nav className="lecon-pied" aria-label="Navigation entre les leçons">
        {id > 1
          ? <a className="bouton bouton-contour" href={lien(c, `lecon-${id - 1}`)}><IcGauche taille={18} /><span>Précédente</span></a>
          : <a className="bouton bouton-contour" href="#"><IcGauche taille={18} /><span>Parcours</span></a>}
        <button type="button" className={"bouton bouton-fait" + (fait ? " est-fait" : "")} onClick={basculer} aria-pressed={fait}>
          <span className="coche" aria-hidden="true"><IcCheck taille={18} strokeWidth="3" /></span>
          {fait ? "Leçon terminée" : "Marquer comme terminée"}
        </button>
        {id < TOTAL
          ? <a className={classeSuite} href={lien(c, `lecon-${id + 1}`)}><span>Suivante</span><IcDroite taille={18} /></a>
          : c.QUIZ.length
          ? <a className={classeSuite} href={lien(c, "quiz")}><span>Quiz final</span><IcDroite taille={18} /></a>
          : suivant
          ? <a className={classeSuite} href={lien(suivant, "lecon-1")}><span>Cours suivant</span><IcDroite taille={18} /></a>
          : <a className={classeSuite} href="#"><span>Parcours</span><IcDroite taille={18} /></a>}
      </nav>
    </article>
  );
}

/* ---------------------------------------------------------------- quiz (questionnaire, une question à la fois) */

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

  useEffect(() => { if (titreRef.current) titreRef.current.focus({ preventScroll: true }); }, [idx, fini]);

  const choisir = useCallback((j) => {
    if (valide[idx]) return;
    setReponses((r) => r.map((x, i) => (i === idx ? j : x)));
  }, [idx, valide]);

  const valider = useCallback(() => {
    if (choisi === null || valide[idx]) return;
    if (choisi !== q.b) enregistrerErreurQuiz(cours, q, choisi);
    setValide((v) => v.map((x, i) => (i === idx ? true : x)));
  }, [choisi, idx, valide, q, cours]);

  const suivant = useCallback(() => {
    if (idx < QUIZ.length - 1) { setIdx(idx + 1); return; }
    setFini(true);
    setEtat((e) => avecProgression(e, cours, (p) => ({ ...p, quiz: { meilleur: Math.max(score, p.quiz ? p.quiz.meilleur : 0), dernier: score } })));
    window.scrollTo(0, 0);
  }, [idx, score, setEtat, cours, QUIZ]);

  const recommencer = () => {
    setIdx(0); setFini(false);
    setReponses(QUIZ.map(() => null));
    setValide(QUIZ.map(() => false));
  };

  useEffect(() => {
    if (fini) return;
    const f = (ev) => {
      if (ev.target && /input|textarea/i.test(ev.target.tagName)) return;
      const n = parseInt(ev.key, 10);
      if (n >= 1 && n <= q.o.length) { choisir(n - 1); return; }
      if (ev.key === "Enter") {
        if (!estValide) valider(); else suivant();
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [fini, q, estValide, choisir, valider, suivant]);

  if (fini) {
    const pct = Math.round((score / QUIZ.length) * 100);
    const ratees = QUIZ.map((x, i) => ({ ...x, i })).filter((x) => reponses[x.i] !== x.b);
    const r = 52, c = 2 * Math.PI * r;
    return (
      <article className="page quiz">
        <div className="lecon-haut"><a href="#" className="retour"><IcGauche taille={18} />Parcours</a></div>
        <section className="resultat">
          <div className="resultat-anneau">
            <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
              <circle cx="64" cy="64" r={r} className="anneau-fond" />
              <circle cx="64" cy="64" r={r} className="anneau-plein" strokeDasharray={c}
                strokeDashoffset={c * (1 - score / QUIZ.length)} transform="rotate(-90 64 64)" />
            </svg>
            <span><strong>{score}</strong>/{QUIZ.length}</span>
          </div>
          <h1 tabIndex={-1} ref={titreRef}>{pct >= 80 ? "Bravo, tu maîtrises les bases" : "Encore un petit effort"}</h1>
          <p className="chapo">{pct >= 80
            ? "Tu as compris l’essentiel de Claude Code. Garde le réflexe : explorer, planifier, coder, valider."
            : "Relis les leçons indiquées ci-dessous, puis retente le quiz."}</p>
          <div className="resultat-actions">
            <button type="button" className="bouton bouton-principal" onClick={recommencer}><IcRelancer taille={18} />Recommencer</button>
            {coursSuivant && <a className="bouton bouton-contour" href={lien(coursSuivant, "lecon-1")}>Cours suivant : {coursSuivant.titre}<IcDroite taille={18} /></a>}
            <a className="bouton bouton-contour" href="#">Retour au parcours</a>
          </div>
        </section>
        {ratees.length > 0 && (
          <section className="revision">
            <h2>À revoir</h2>
            <ul>
              {ratees.map((x) => (
                <li key={x.i} className="carte">
                  <p className="revision-q">{fr(x.q)}</p>
                  <p><strong>{"Bonne réponse\u00A0:"}</strong> {fr(x.o[x.b])}</p>
                  <p className="discret">{fr(x.e)}</p>
                  <a href={lien(cours, `lecon-${x.l}`)}>Relire la leçon {x.l} : {LECONS[x.l - 1].titre}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    );
  }

  return (
    <article className="page quiz">
      <div className="lecon-haut">
        <a href="#" className="retour"><IcGauche taille={18} />Parcours</a>
        <span className="lecon-section">{PLUSIEURS ? `Quiz final · ${cours.titre}` : "Quiz final"}</span>
      </div>
      <div className="quiz-progression">
        <span>Question {idx + 1} sur {QUIZ.length}</span>
        <Jauge valeur={idx + (estValide ? 1 : 0)} total={QUIZ.length} etiquette="Avancement du quiz" />
      </div>

      <section className="question carte" key={idx}>
        <h1 tabIndex={-1} ref={titreRef}>{fr(q.q)}</h1>
        <div className="choix" role="radiogroup" aria-label="Réponses possibles">
          {q.o.map((opt, j) => {
            const coche = choisi === j;
            let statut = coche ? "coche" : "";
            if (estValide) statut = j === q.b ? "juste" : coche ? "faux" : "eteint";
            return (
              <button type="button" key={j} role="radio" aria-checked={coche} className="choix-carte" data-statut={statut}
                disabled={estValide} onClick={() => choisir(j)}>
                <span className="choix-indicateur" aria-hidden="true">
                  {estValide && j === q.b ? <IcCheck taille={14} strokeWidth="3" /> : estValide && coche ? <IcX taille={14} strokeWidth="3" /> : <i />}
                </span>
                <span className="choix-texte">{fr(opt)}</span>
                <kbd aria-hidden="true">{j + 1}</kbd>
              </button>
            );
          })}
        </div>

        {estValide && (
          <div className={"explication " + (choisi === q.b ? "est-juste" : "est-faux")} role="status">
            <strong>{choisi === q.b ? "Bonne réponse." : "Pas tout à fait."}</strong> {fr(q.e)}
          </div>
        )}

        <div className="quiz-actions">
          {idx > 0 && <button type="button" className="bouton bouton-contour" onClick={() => setIdx(idx - 1)}><IcGauche taille={18} />Précédente</button>}
          <span className="espace" />
          {!estValide
            ? <button type="button" className="bouton bouton-principal" disabled={choisi === null} onClick={valider}>Valider</button>
            : <button type="button" className="bouton bouton-principal" onClick={suivant}>
                {idx < QUIZ.length - 1 ? "Question suivante" : "Voir mon résultat"}<IcDroite taille={18} />
              </button>}
        </div>
      </section>
      <p className="astuce">Au clavier : touches 1 à 4 pour choisir, Entrée pour valider.</p>
    </article>
  );
}

/* ---------------------------------------------------------------- lexique */

function Lexique() {
  const [filtre, setFiltre] = useState("");
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const liste = useMemo(() => {
    const f = norm(filtre.trim());
    return f ? LEXIQUE.filter(([m, d]) => norm(m).includes(f) || norm(d).includes(f)) : LEXIQUE;
  }, [filtre]);
  return (
    <article className="page lexique">
      <div className="lecon-haut"><a href="#" className="retour"><IcGauche taille={18} />Parcours</a><BoutonConversations page="lexique" /></div>
      <h1>Lexique</h1>
      <p className="chapo">Les mots du parcours, expliqués simplement.</p>
      <label className="recherche">
        <IcLoupe taille={18} />
        <input type="search" value={filtre} onChange={(e) => setFiltre(e.target.value)}
          placeholder="Chercher un mot" aria-label="Chercher un mot dans le lexique" />
      </label>
      {liste.length === 0
        ? <p className="vide">Aucun mot ne correspond à « {filtre} ». Essaie un mot plus court.</p>
        : <dl>{liste.map(([m, d]) => (
            <div key={m} className="lexique-entree"><dt>{m}</dt><dd>{fr(d)}</dd></div>
          ))}</dl>}
    </article>
  );
}

/* ---------------------------------------------------------------- Robotto, le petit robot */

// Sélectionne un passage dans une leçon ou le lexique : Robotto apparaît. Touche-le
// pour lui poser des questions sur ce passage. Il passe par le service IA réglé dans le carnet
// de révision (aucune clé dans l’appli). Ses conversations restent sur l’appareil, page par page.
// Le robot est un clin d’œil à la mascotte de Claude Code, redessiné ici : rien d’officiel.

const CLE_ROBOT = "cc101fr:robot:v1";                       // { consignes, tri }
const CLE_CONVERSATIONS = "cc101fr:robot-conversations:v1"; // liste des conversations
const CLE_SERVICE_IA = "cc101fr:revision-ai:v1";            // réglée dans le carnet de révision
const MAX_PAR_PAGE = 30;

const BIENVENUES = [
  "Hey, salut toi ! Qu’est-ce que tu veux savoir sur ce passage ?",
  "Bonjour ! Pose-moi ta question, je t’écoute.",
  "Coucou ! Un mot t’échappe ? On regarde ça ensemble.",
  "Bip bip ! Robotto au rapport. Qu’est-ce qui te turlupine ?",
  "Salut ! On décortique ce passage ensemble ?",
  "Hello ! Je suis tout ouïe. Vas-y, demande-moi.",
];
const RAPIDES = [
  { l: "Plus simple", q: "Explique-le-moi plus simplement, comme à un débutant." },
  { l: "Un exemple", q: "Donne-moi un exemple concret." },
  { l: "Plus court", q: "Résume-le en deux phrases." },
];
const TRIS = [
  { v: "recentes", l: "Plus récentes", f: (a, b) => b.modifieLe - a.modifieLe },
  { v: "anciennes", l: "Plus anciennes", f: (a, b) => a.creeLe - b.creeLe },
  { v: "longues", l: "Les plus longues", f: (a, b) => b.messages.length - a.messages.length || b.modifieLe - a.modifieLe },
];
const CONSIGNE_ROBOT = "Tu t’appelles Robotto, le petit robot de CL4UD3, une appli qui aide à suivre en français des cours sur Claude Code. "
  + "L’apprenant te pose des questions sur un passage du cours qu’il a sélectionné. Réponds en français, en le tutoyant, "
  + "avec des phrases courtes et simples. Appuie-toi sur le passage et sur ce que tu sais de Claude Code. "
  + "Si tu n’es pas sûr d’une information, dis-le clairement : n’invente ni commande, ni libellé, ni adresse. "
  + "Mise en forme possible : **gras**, `code`, une ligne vide entre deux paragraphes. Pas d’autre Markdown.";

function lireJson(cle, defaut) {
  try { const v = JSON.parse(localStorage.getItem(cle) || "null"); return v == null ? defaut : v; } catch (e) { return defaut; }
}
function ecrireJson(cle, v) {
  try { localStorage.setItem(cle, JSON.stringify(v)); return true; } catch (e) { return false; }
}

// Petit relais entre composants : la liste des conversations a changé, ou il faut l’ouvrir.
const relaisRobot = new EventTarget();
function lireConversations() {
  const l = lireJson(CLE_CONVERSATIONS, []);
  return Array.isArray(l) ? l : [];
}
function ecrireConversations(liste) {
  let l = liste;
  // Stockage plein : on retire les plus anciennes conversations jusqu’à ce que ça tienne.
  while (!ecrireJson(CLE_CONVERSATIONS, l) && l.length) {
    const ancienne = l.reduce((a, b) => (a.modifieLe <= b.modifieLe ? a : b));
    l = l.filter((x) => x !== ancienne);
  }
  relaisRobot.dispatchEvent(new Event("conversations"));
}
function enregistrerConversation(conv) {
  const autres = lireConversations().filter((x) => x.id !== conv.id);
  const page = [conv, ...autres.filter((x) => x.page === conv.page)]
    .sort((a, b) => b.modifieLe - a.modifieLe).slice(0, MAX_PAR_PAGE);
  ecrireConversations([...page, ...autres.filter((x) => x.page !== conv.page)]);
}
function supprimerConversations(filtre) {
  ecrireConversations(lireConversations().filter((x) => !filtre(x)));
}
function useConversations(page) {
  const lire = () => (page ? lireConversations().filter((x) => x.page === page) : []);
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
  const contexte = [CONSIGNE_ROBOT, `Cours : ${conv.cours}`, `Page : ${conv.pageTitre}`,
    conv.extrait ? `Passage sélectionné :\n« ${conv.extrait} »` : "Pas de passage sélectionné : la question porte sur la page en général."].join("\n\n");
  const n = conv.messages.length;
  const messages = conv.messages.map((m, i) => {
    let t = m.t;
    if (i === 0) t = contexte + "\n\nMa question : " + t;
    if (i === n - 1 && consignes) t += "\n\nMes consignes sur ta façon de répondre, à suivre en priorité : " + consignes;
    return { role: m.role, content: t };
  });
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), 30000);
  try {
    let rep;
    try {
      rep = await fetch(adresse, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }), signal: ctrl.signal });
    } catch (e) {
      throw Error(e.name === "AbortError" ? "Le service IA met plus de 30 secondes à répondre. Réessaie dans un moment."
        : "Je n’arrive pas à joindre le service IA. Vérifie ta connexion à Internet, puis réessaie.");
    }
    let d;
    try { d = await rep.json(); } catch (e) { throw Error("La réponse du service IA est illisible."); }
    if (!rep.ok) {
      const motif = (d.error && (d.error.message || d.error)) || d.message || "erreur " + rep.status;
      throw Error("Le service IA a refusé la demande : " + String(motif));
    }
    const t = typeof d.answer === "string" ? d.answer
      : typeof d.content === "string" ? d.content
      : Array.isArray(d.content) ? d.content.filter((x) => x && x.type === "text").map((x) => x.text).join("\n\n")
      : d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    if (typeof t !== "string" || !t.trim()) throw Error("Le service IA n’a pas renvoyé de réponse.");
    return t.trim();
  } finally {
    clearTimeout(minuteur);
  }
}

// Robotto en pixels (16 × 11). Les animations sont dans styles.css.
function RobotPixels({ taille = 40 }) {
  return (
    <svg className="robot-pixels" width={taille} height={Math.round(taille * 11 / 16)} viewBox="0 0 16 11"
      shapeRendering="crispEdges" aria-hidden="true">
      <g className="robot-pattes-a"><rect x="4" y="8" width="1" height="3" /><rect x="9" y="8" width="1" height="3" /></g>
      <g className="robot-pattes-b"><rect x="6" y="8" width="1" height="3" /><rect x="11" y="8" width="1" height="3" /></g>
      <g className="robot-corps">
        <rect x="3" y="1" width="10" height="7" />
        <rect x="1" y="4" width="2" height="2" />
        <rect x="13" y="4" width="2" height="2" />
      </g>
      <g className="robot-regard"><g className="robot-yeux">
        <rect x="5" y="3" width="1" height="2" /><rect x="10" y="3" width="1" height="2" />
      </g></g>
    </svg>
  );
}

// Réponse du robot : paragraphes, **gras**, `code` et blocs de code.
function TexteRobot({ t }) {
  return (
    <>
      {t.split("```").map((m, i) => (i % 2
        ? <pre key={i} className="robot-code"><code>{m.replace(/^[\w-]*\n/, "").replace(/\n$/, "")}</code></pre>
        : m.split(/\n{2,}/).filter((x) => x.trim()).map((x, j) => <p key={i + "-" + j}><Texte t={x.trim()} /></p>)))}
    </>
  );
}

// Dans l’en-tête d’une page : rouvre les conversations déjà tenues ici.
function BoutonConversations({ page }) {
  const n = useConversations(page).length;
  if (!n) return null;
  return (
    <button type="button" className="bouton-conversations" onClick={() => relaisRobot.dispatchEvent(new Event("ouvrir-liste"))}>
      <IcBulle taille={17} />Conversations ({n})
    </button>
  );
}

function Robot({ route }) {
  const page = pageDuRobot(route);
  const cle = page ? page.cle : null;
  const liste = useConversations(cle);
  const [sel, setSel] = useState(null);          // { texte, x, y, n } : passage sélectionné
  const [ouvert, setOuvert] = useState(false);
  const [vue, setVue] = useState("chat");        // « chat » ou « liste »
  const [conv, setConv] = useState(null);
  const [humeur, setHumeur] = useState("arrive"); // arrive, repos, reflechit, joie
  const [question, setQuestion] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [service, setService] = useState("");
  const [reglages, setReglages] = useState(() => ({ consignes: "", tri: "recentes", ...lireJson(CLE_ROBOT, {}) }));
  const [voirConsignes, setVoirConsignes] = useState(false);
  const [brouillon, setBrouillon] = useState(reglages.consignes);
  const plage = useRef(null), attente = useRef(null), fil = useRef(null), fenetre = useRef(null);

  const majReglages = (p) => setReglages((r) => { const n = { ...r, ...p }; ecrireJson(CLE_ROBOT, n); return n; });
  const lireService = () => setService(String((lireJson(CLE_SERVICE_IA, {}) || {}).endpoint || ""));

  // Suivre la sélection : le robot se place juste sous le passage (le menu de l’iPad est au-dessus).
  useEffect(() => {
    if (!cle) { setSel(null); return; }
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
        plage.current = null; setSel(null); return;
      }
      plage.current = r;
      setSel((avant) => ({ texte: texte.slice(0, 1500), x: 0, y: 0, n: avant ? avant.n : Date.now() }));
      placer();
    };
    const auChangement = () => { clearTimeout(attente.current); attente.current = setTimeout(lire, 300); };
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

  // Changer de page ferme la fenêtre.
  useEffect(() => { setOuvert(false); setConv(null); setVoirConsignes(false); }, [cle]);

  // Ouvrir la liste depuis le bouton « Conversations » de la page.
  useEffect(() => {
    const f = () => { lireService(); setVue("liste"); setOuvert(true); };
    relaisRobot.addEventListener("ouvrir-liste", f);
    return () => relaisRobot.removeEventListener("ouvrir-liste", f);
  }, []);

  // Après un saut, le robot se repose.
  useEffect(() => {
    if (humeur !== "arrive" && humeur !== "joie") return;
    const m = setTimeout(() => setHumeur((h) => (h === humeur ? "repos" : h)), 1000);
    return () => clearTimeout(m);
  }, [humeur, conv && conv.id]);

  useEffect(() => {
    if (!ouvert) return;
    if (fenetre.current) fenetre.current.focus({ preventScroll: true });
    const f = (e) => { if (e.key === "Escape") setOuvert(false); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [ouvert]);

  useEffect(() => { if (fil.current) fil.current.scrollTop = fil.current.scrollHeight; }, [conv, envoi, erreur, ouvert, vue, service]);

  if (!page) return null;

  const nouvelle = (extrait) => {
    lireService();
    setConv({
      id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), page: cle, cours: page.cours, pageTitre: page.titre,
      extrait: extrait || "", creeLe: Date.now(), modifieLe: Date.now(),
      bienvenue: BIENVENUES[Math.floor(Math.random() * BIENVENUES.length)], messages: [],
    });
    setVue("chat"); setOuvert(true); setHumeur("arrive"); setErreur(""); setQuestion("");
  };
  const ouvrirAvecSelection = () => {
    if (!sel) return;
    nouvelle(sel.texte);
    plage.current = null; setSel(null);
    try { document.getSelection().removeAllRanges(); } catch (e) {}
  };
  const rouvrir = (x) => { lireService(); setConv(x); setVue("chat"); setErreur(""); setQuestion(""); setHumeur("arrive"); };

  const envoyer = async (texte) => {
    const q = texte.trim();
    if (!q || envoi || !conv || !service) return;
    const c1 = { ...conv, modifieLe: Date.now(), messages: [...conv.messages, { role: "user", t: q }] };
    const meme = (f) => setConv((c) => (c && c.id === c1.id ? f(c) : c));
    setConv(c1); setQuestion(""); setErreur(""); setEnvoi(true); setHumeur("reflechit");
    try {
      const reponse = await demanderAuRobot(service, c1, (reglages.consignes || "").trim());
      const c2 = { ...c1, modifieLe: Date.now(), messages: [...c1.messages, { role: "assistant", t: reponse }] };
      enregistrerConversation(c2);
      meme(() => c2); setHumeur("joie");
    } catch (e) {
      meme(() => conv); setQuestion((v) => v || q); setErreur(e.message); setHumeur("repos");
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

  return (
    <>
      {sel && sel.y > 0 && !ouvert && (
        <button type="button" className="robot-bouton" key={sel.n} style={{ left: sel.x + "px", top: sel.y + "px" }}
          onMouseDown={(e) => e.preventDefault()} onClick={ouvrirAvecSelection}
          aria-label="Poser une question à Robotto sur le texte sélectionné">
          <span className="robot robot-arrive"><RobotPixels taille={36} /></span>
        </button>
      )}

      {ouvert && (
        <section className="robot-fenetre" role="dialog" aria-label="Robotto" tabIndex={-1} ref={fenetre}>
          <header className="robot-tete">
            <button type="button" className="robot-avatar" onClick={() => setHumeur(envoi ? "reflechit" : "joie")} aria-label="Faire sauter Robotto">
              <span className={"robot robot-" + humeur} key={conv ? conv.id : "liste"}><RobotPixels taille={44} /></span>
            </button>
            <p className="robot-nom">{vue === "liste" ? "Conversations" : "Robotto"}</p>
            <button type="button" className={"bouton-icone robot-consignes-bouton" + (voirConsignes ? " actif" : "")} aria-pressed={voirConsignes}
              aria-label="Ma façon de répondre" onClick={() => { setBrouillon(reglages.consignes || ""); setVoirConsignes((v) => !v); }}>
              <IcReglages taille={20} />
            </button>
            {vue === "chat"
              ? <button type="button" className="bouton-icone robot-liste-bouton" aria-label="Conversations de cette page" onClick={() => setVue("liste")}><IcListe taille={20} /></button>
              : conv && <button type="button" className="bouton-icone robot-retour-bouton" aria-label="Revenir à la conversation" onClick={() => setVue("chat")}><IcBulle taille={20} /></button>}
            <button type="button" className="bouton-icone" aria-label="Fermer" onClick={() => setOuvert(false)}><IcX taille={20} /></button>
          </header>

          {voirConsignes && (
            <div className="robot-consignes">
              <label htmlFor="robot-consignes">Ma façon de répondre</label>
              <p className="robot-aide">{fr("Robotto suit ces consignes dans toutes ses réponses. Elles restent sur cet appareil.")}</p>
              <textarea id="robot-consignes" rows={3} value={brouillon} onChange={(e) => setBrouillon(e.target.value)}
                placeholder="Par exemple : réponds en trois phrases, avec un exemple concret." />
              <div className="robot-ligne">
                <button type="button" className="bouton bouton-principal" disabled={consignesEnregistrees}
                  onClick={() => majReglages({ consignes: brouillon.trim() })}>
                  {consignesEnregistrees && reglages.consignes ? "Enregistré" : "Enregistrer"}
                </button>
              </div>
            </div>
          )}

          {vue === "chat" && conv && (
            <>
              <div className="robot-fil" ref={fil} aria-live="polite">
                <div className="robot-bulle robot-de-robot"><p>{fr(conv.bienvenue)}</p></div>
                {!service && (
                  <div className="robot-bulle robot-de-robot robot-connexion">
                    <p>{fr("Pour te répondre, j’ai besoin d’être connecté à une IA. Ça se règle une seule fois, dans le carnet de révision :")}</p>
                    <ol>
                      <li>{fr("ouvre le panneau « Assistant intelligent » ;")}</li>
                      <li>{fr("colle l’adresse HTTPS de ton service IA, le petit serveur qui garde ta clé à l’abri ;")}</li>
                      <li>{fr("touche « Enregistrer et tester la connexion », puis reviens ici.")}</li>
                    </ol>
                    <a className="bouton bouton-principal" href="revisions.html">Connecter une IA</a>
                  </div>
                )}
                {conv.messages.map((m, i) => (
                  <div key={i} className={"robot-bulle " + (m.role === "user" ? "robot-de-moi" : "robot-de-robot")}>
                    {m.role === "user" ? <p>{m.t}</p> : <TexteRobot t={m.t} />}
                  </div>
                ))}
                {envoi && <div className="robot-attente" role="status" aria-label="Robotto réfléchit"><i /><i /><i /></div>}
                {erreur && <p className="robot-erreur" role="alert">{fr(erreur)}</p>}
              </div>
              {service && (
                <form className="robot-saisie" onSubmit={(e) => { e.preventDefault(); envoyer(question); }}>
                  <div className="robot-rapides">
                    {RAPIDES.map((r) => (
                      <button type="button" key={r.l} className="robot-rapide" disabled={envoi} onClick={() => envoyer(r.q)}>{r.l}</button>
                    ))}
                  </div>
                  <div className="robot-ligne">
                    <textarea rows={1} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ta question…"
                      aria-label="Ta question à Robotto"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); envoyer(question); } }} />
                    <button type="submit" className="bouton bouton-principal robot-envoyer" disabled={envoi || !question.trim()} aria-label="Envoyer">
                      <IcEnvoyer taille={20} />
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {(vue === "liste" || !conv) && (
            <div className="robot-fil robot-liste" ref={fil}>
              {!liste.length
                ? <p className="robot-aide">{fr("Aucune conversation sur cette page pour l’instant. Sélectionne un passage, puis touche Robotto.")}</p>
                : (
                  <>
                    <label className="robot-tri">
                      <span>Trier</span>
                      <select value={tri.v} onChange={(e) => majReglages({ tri: e.target.value })}>
                        {TRIS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                    </label>
                    <ul>
                      {triees.map((x) => {
                        const nq = x.messages.filter((m) => m.role === "user").length;
                        return (
                          <li key={x.id} className="robot-conv">
                            <button type="button" className="robot-conv-ouvrir" onClick={() => rouvrir(x)}>
                              <strong>{titreConversation(x)}</strong>
                              <span>{DATE_ROBOT.format(new Date(x.modifieLe))} · {nq} question{nq > 1 ? "s" : ""}</span>
                            </button>
                            <button type="button" className="bouton-icone robot-conv-supprimer" onClick={() => supprimer(x)}
                              aria-label={`Supprimer la conversation « ${titreConversation(x)} »`}>
                              <IcCorbeille taille={19} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {liste.length >= MAX_PAR_PAGE && <p className="robot-aide">Seules les {MAX_PAR_PAGE} conversations les plus récentes de la page sont gardées.</p>}
                  </>
                )}
              <div className="robot-actions">
                <button type="button" className="bouton bouton-principal" onClick={() => nouvelle("")}><IcPlus taille={18} />Nouvelle conversation</button>
                {liste.length > 0 && <button type="button" className="bouton bouton-contour robot-tout-supprimer" onClick={toutSupprimer}><IcCorbeille taille={18} />Tout supprimer</button>}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- application */

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
    document.title = route.vue === "lecon" ? `${route.cours.LECONS[route.id - 1].titre} · ${route.cours.titre}`
      : route.vue === "quiz" ? `Quiz final · ${route.cours.titre}`
      : route.vue === "lexique" ? "Lexique · CL4UD3"
      : "CL4UD3";
  }, [route]);

  const cle = route.vue + (route.cours ? route.cours.id : "") + (route.id || "");
  let vue;
  if (route.vue === "lecon") vue = <Lecon cours={route.cours} id={route.id} etat={etat} setEtat={setEtat} toast={toast} />;
  else if (route.vue === "quiz") vue = <Quiz cours={route.cours} etat={etat} setEtat={setEtat} />;
  else if (route.vue === "lexique") vue = <Lexique />;
  else vue = <Accueil etat={etat} setEtat={setEtat} toast={toast} />;

  return (
    <>
      <a className="lien-evitement" href="#contenu" onClick={(e) => { e.preventDefault(); document.getElementById("contenu").focus(); }}>Aller au contenu</a>
      <Barre etat={etat} setEtat={setEtat} route={route} />
      <main id="contenu" tabIndex={-1}>
        <div className="entree" key={cle}>{vue}</div>
      </main>
      <div className="toast-zone" aria-live="polite">
        {message && <div className="toast" key={message.k}><IcCheck taille={18} strokeWidth="3" />{message.t}</div>}
      </div>
      <Robot route={route} />
    </>
  );
}

createRoot(document.getElementById("app")).render(<App />);
