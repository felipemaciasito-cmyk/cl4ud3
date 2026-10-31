// Claude Code 101 en français — application
// Source lisible. Le fichier app.js utilisé par la page est généré à partir de celui-ci.
// Composants inspirés de 21st.dev et adaptés :
//  - « Vertical Descriptive Stepper » (sean0205) pour le parcours
//  - « Questionnaire » (uiable) pour le quiz, une question à la fois
//  - thème « Amber Vivid_1 » (sriyanshintern) pour la couleur d’accent et les arrondis

import { React, createRoot } from "./vendor-react.js";
import { SECTIONS, LECONS, CLASSER, PHASES, QUIZ, LEXIQUE } from "./donnees.js";

const { useState, useEffect, useRef, useMemo, useCallback } = React;
const TOTAL = LECONS.length;

/* ---------------------------------------------------------------- état */

const CLE = "cc101fr:v1";

function lireEtat() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE) || "null");
    if (o && Array.isArray(o.faites)) {
      return { faites: o.faites, quiz: o.quiz || null, theme: o.theme || "auto" };
    }
  } catch (e) {}
  return { faites: [], quiz: null, theme: "auto" };
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
  if (h === "quiz") return { vue: "quiz" };
  if (h === "lexique") return { vue: "lexique" };
  const m = /^lecon-(\d{1,2})$/.exec(h);
  if (m && +m[1] >= 1 && +m[1] <= TOTAL) return { vue: "lecon", id: +m[1] };
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
  return (
    <figure className="prompt">
      <div className="prompt-tete">
        <span>À envoyer à Claude</span>
        <button type="button" className={"copier" + (etat === "copie" ? " est-copie" : "")} onClick={copier}
          aria-label={etat === "copie" ? "Texte copié" : "Copier le texte"}>
          {etat === "copie" ? <IcCheck taille={16} /> : <IcCopie taille={16} />}
          <span>{etat === "copie" ? "Copié" : etat === "echec" ? "Sélectionne le texte" : "Copier"}</span>
        </button>
      </div>
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
  return (
    <header className="barre">
      <div className="barre-int">
        <a href="#" className="marque">
          <span className="marque-logo" aria-hidden="true"><i /><i /><i /></span>
          <span className="marque-nom">Claude Code 101 <span>en français</span></span>
        </a>
        <nav className="barre-nav" aria-label="Navigation principale">
          <a href="#lexique" aria-current={route.vue === "lexique" ? "page" : undefined}><IcLivre taille={18} /><span>Lexique</span></a>
          <a href="#quiz" aria-current={route.vue === "quiz" ? "page" : undefined}><IcDrapeau taille={18} /><span>Quiz</span></a>
        </nav>
        <button type="button" className="bouton-icone" onClick={() => setEtat((e) => ({ ...e, theme: suivant }))}
          aria-label={`Thème ${NOM_THEME[theme]}. Passer au thème ${NOM_THEME[suivant]}`}>
          <Ic taille={19} />
        </button>
        <Anneau valeur={etat.faites.length} total={TOTAL} />
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- accueil : le parcours (stepper vertical) */

function Etape({ lecon, statut }) {
  return (
    <li className="etape" data-statut={statut}>
      <a href={`#lecon-${lecon.id}`} className="etape-lien">
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

function Accueil({ etat, setEtat, toast }) {
  const n = etat.faites.length;
  const prochaine = LECONS.find((l) => !etat.faites.includes(l.id));
  const pct = Math.round((n / TOTAL) * 100);
  const cta = !prochaine
    ? { href: "#quiz", t: "Passer le quiz final" }
    : n === 0 ? { href: "#lecon-1", t: "Commencer le parcours" }
    : { href: `#lecon-${prochaine.id}`, t: `Reprendre : leçon ${prochaine.id}` };

  const effacer = () => {
    if (window.confirm("Effacer ta progression et ton score sur cet appareil ?")) {
      setEtat((e) => ({ ...e, faites: [], quiz: null }));
      toast("Progression effacée");
    }
  };

  return (
    <div className="page">
      <section className="hero">
        <h1>Claude Code 101, en français</h1>
        <p className="chapo">Le parcours du cours d’Anthropic Academy, réécrit en français et pensé pour l’iPad. Douze leçons, des exercices sur claude.ai/code et un quiz final.</p>
        <div className="progression">
          <div className="progression-ligne">
            <span>{n === 0 ? "Pas encore commencé" : n === TOTAL ? "Parcours terminé" : `Leçon ${prochaine.id} sur ${TOTAL} à suivre`}</span>
            <strong>{pct} %</strong>
          </div>
          <Jauge valeur={n} total={TOTAL} etiquette="Progression dans le parcours" />
          <div className="progression-ligne discret">
            <span>{n} {n > 1 ? "leçons terminées" : "leçon terminée"}</span>
            <span>{etat.quiz ? `Meilleur score au quiz : ${etat.quiz.meilleur}/${QUIZ.length}` : "Quiz pas encore passé"}</span>
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
        {SECTIONS.map((s, si) => (
          <section key={si} className="parcours-section">
            <h2>{s}</h2>
            <ol className="etapes">
              {LECONS.filter((l) => l.section === si).map((l) => (
                <Etape key={l.id} lecon={l}
                  statut={etat.faites.includes(l.id) ? "fait" : prochaine && prochaine.id === l.id ? "actif" : "a-venir"} />
              ))}
            </ol>
          </section>
        ))}
        <section className="parcours-section">
          <h2>Pour finir</h2>
          <ol className="etapes">
            <li className="etape etape-terminus" data-statut={etat.quiz ? "fait" : !prochaine ? "actif" : "a-venir"}>
              <a href="#quiz" className="etape-lien">
                <span className="etape-indicateur">{etat.quiz ? <IcCheck taille={18} strokeWidth="3" /> : <IcDrapeau taille={18} />}</span>
                <span className="etape-texte">
                  <span className="etape-titre">Quiz final</span>
                  <span className="etape-desc">{QUIZ.length} questions sur tout le parcours, une à la fois.</span>
                </span>
              </a>
            </li>
          </ol>
        </section>
      </nav>

      <section className="apropos">
        <h2>À propos de ce parcours</h2>
        <p>Parcours non officiel, rédigé par Claude à partir du programme public de Claude Code 101 (Anthropic Academy) et de la documentation officielle de Claude Code en français. Il suit les mêmes leçons, dans le même ordre. Les vidéos et exercices d’origine ne sont pas reproduits : les exercices d’ici sont pensés pour l’iPad.</p>
        <p>Ta progression est enregistrée sur cet appareil.</p>
        <ul>
          <li>Pour le certificat officiel, il faut passer le quiz du cours, en anglais, sur <a href="https://anthropic.skilljar.com/claude-code-101" target="_blank" rel="noopener">anthropic.skilljar.com</a>.</li>
          <li>La documentation officielle en français : <a href="https://code.claude.com/docs/fr/overview" target="_blank" rel="noopener">code.claude.com/docs/fr</a>.</li>
          <li>Bloqué sur une étape ? Copie le titre de la leçon et pose ta question à Claude.</li>
        </ul>
        <button type="button" className="bouton bouton-contour" onClick={effacer}><IcRelancer taille={18} />Effacer ma progression</button>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- leçon */

function Pastilles({ id, faites }) {
  return (
    <nav className="pastilles" aria-label="Aller à une leçon">
      {LECONS.map((l) => {
        const statut = l.id === id ? "courant" : faites.includes(l.id) ? "fait" : "a-venir";
        return (
          <a key={l.id} href={`#lecon-${l.id}`} data-statut={statut}
            aria-label={`Leçon ${l.id} : ${l.titre}${faites.includes(l.id) ? ", terminée" : ""}`}
            aria-current={l.id === id ? "step" : undefined}>
            <span />
          </a>
        );
      })}
    </nav>
  );
}

function Classer() {
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
                    onClick={() => setChoix((x) => ({ ...x, [i]: k }))}>
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

function Exercice({ ex }) {
  return (
    <section className="exercice" aria-labelledby="titre-exercice">
      <h2 id="titre-exercice">Exercice</h2>
      {ex.intro && <p><Texte t={ex.intro} /></p>}
      {ex.classer && <Classer />}
      {ex.etapes.length > 0 && (
        <ol className="exercice-etapes">
          {ex.etapes.map((e, i) => (
            <li key={i}>
              <span className="exercice-num" aria-hidden="true">{i + 1}</span>
              <div className="exercice-contenu">
                <p><Texte t={e.t} /></p>
                {e.p && <Prompt texte={e.p} />}
                {e.a && <p><Texte t={e.a} /></p>}
                {e.p2 && <Prompt texte={e.p2} />}
              </div>
            </li>
          ))}
        </ol>
      )}
      {ex.note && <p className="note"><Texte t={ex.note} /></p>}
      {(ex.details || []).map((d, i) => (
        <Depliable key={i} titre={d.titre}>
          {d.t.map((x, j) => <p key={j}><Texte t={x} /></p>)}
          {d.p && <Prompt texte={d.p} />}
        </Depliable>
      ))}
    </section>
  );
}

function Lecon({ id, etat, setEtat, toast }) {
  const l = LECONS[id - 1];
  const fait = etat.faites.includes(id);
  const basculer = () => {
    setEtat((e) => ({
      ...e,
      faites: e.faites.includes(id) ? e.faites.filter((x) => x !== id) : [...e.faites, id],
    }));
    if (!fait) toast(id === TOTAL ? "Dernière leçon terminée. Place au quiz !" : `Leçon ${id} terminée`);
  };
  return (
    <article className="page lecon">
      <div className="lecon-haut">
        <a href="#" className="retour"><IcGauche taille={18} />Parcours</a>
        <span className="lecon-section">{SECTIONS[l.section]}</span>
      </div>
      <Pastilles id={id} faites={etat.faites} />
      <h1>{l.titre}</h1>
      <p className="lecon-meta">Leçon {id} sur {TOTAL}, environ {l.duree} minutes exercice compris</p>

      <section className="carte objectifs">
        <h2>Dans cette leçon</h2>
        <ul>{l.objectifs.map((o, i) => <li key={i}><Texte t={o} /></li>)}</ul>
      </section>

      <div className="contenu">{l.blocs.map((b, i) => <Bloc key={i} b={b} />)}</div>

      <aside className="retenir">
        <h2>À retenir</h2>
        <ul>{l.retenir.map((r, i) => <li key={i}><Texte t={r} /></li>)}</ul>
      </aside>

      <Exercice ex={l.exercice} />

      <nav className="lecon-pied" aria-label="Navigation entre les leçons">
        {id > 1
          ? <a className="bouton bouton-contour" href={`#lecon-${id - 1}`}><IcGauche taille={18} /><span>Précédente</span></a>
          : <a className="bouton bouton-contour" href="#"><IcGauche taille={18} /><span>Parcours</span></a>}
        <button type="button" className={"bouton bouton-fait" + (fait ? " est-fait" : "")} onClick={basculer} aria-pressed={fait}>
          <span className="coche" aria-hidden="true"><IcCheck taille={18} strokeWidth="3" /></span>
          {fait ? "Leçon terminée" : "Marquer comme terminée"}
        </button>
        {id < TOTAL
          ? <a className={"bouton " + (fait ? "bouton-principal" : "bouton-contour")} href={`#lecon-${id + 1}`}><span>Suivante</span><IcDroite taille={18} /></a>
          : <a className={"bouton " + (fait ? "bouton-principal" : "bouton-contour")} href="#quiz"><span>Quiz final</span><IcDroite taille={18} /></a>}
      </nav>
    </article>
  );
}

/* ---------------------------------------------------------------- quiz (questionnaire, une question à la fois) */

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

  useEffect(() => { if (titreRef.current) titreRef.current.focus({ preventScroll: true }); }, [idx, fini]);

  const choisir = useCallback((j) => {
    if (valide[idx]) return;
    setReponses((r) => r.map((x, i) => (i === idx ? j : x)));
  }, [idx, valide]);

  const valider = useCallback(() => {
    if (choisi === null || valide[idx]) return;
    setValide((v) => v.map((x, i) => (i === idx ? true : x)));
  }, [choisi, idx, valide]);

  const suivant = useCallback(() => {
    if (idx < QUIZ.length - 1) { setIdx(idx + 1); return; }
    setFini(true);
    setEtat((e) => ({ ...e, quiz: { meilleur: Math.max(score, e.quiz ? e.quiz.meilleur : 0), dernier: score } }));
    window.scrollTo(0, 0);
  }, [idx, score, setEtat]);

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
                  <a href={`#lecon-${x.l}`}>Relire la leçon {x.l} : {LECONS[x.l - 1].titre}</a>
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
        <span className="lecon-section">Quiz final</span>
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
      <div className="lecon-haut"><a href="#" className="retour"><IcGauche taille={18} />Parcours</a></div>
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
    const titres = { accueil: "Claude Code 101 en français", quiz: "Quiz final", lexique: "Lexique" };
    document.title = route.vue === "lecon"
      ? `${LECONS[route.id - 1].titre} · Claude Code 101`
      : titres[route.vue] + (route.vue === "accueil" ? "" : " · Claude Code 101");
  }, [route]);

  const cle = route.vue + (route.id || "");
  let vue;
  if (route.vue === "lecon") vue = <Lecon id={route.id} etat={etat} setEtat={setEtat} toast={toast} />;
  else if (route.vue === "quiz") vue = <Quiz etat={etat} setEtat={setEtat} />;
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
    </>
  );
}

createRoot(document.getElementById("app")).render(<App />);
