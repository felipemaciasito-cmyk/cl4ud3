// Tests de l’appli dans un navigateur : Chromium, piloté par Playwright, avec des profils d’iPad
// (taille d’écran, tactile). Tout est déduit de cours.js : chaque leçon de chaque cours est testée,
// quel que soit leur nombre.
// usage : node tests/navigateur.cjs      code de sortie : 0 réussi, 1 échec, 3 Playwright absent
const http = require("http"), fs = require("fs"), path = require("path"), { pathToFileURL } = require("url");
const RACINE = path.resolve(__dirname, "..");
let playwright;
try { playwright = require("playwright"); } catch {
  console.log("! Playwright est absent : tests du navigateur non lancés.");
  process.exit(process.env.CI ? 1 : 3);
}
const { chromium, devices } = playwright;
const IPAD = devices["iPad (gen 7)"];
const APPAREILS = ["iPad (gen 7)", "iPad (gen 7) landscape", "iPad Mini", "iPad Pro 11 landscape"];
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };

const res = []; let section = "";
const ok = (nom, cond, info = "") => res.push({ s: section, nom, ok: !!cond, info: String(info || "") });
const titre = (t) => { section = t; };
const attendre = (p, ms) => p.waitForTimeout(ms);
// Va à une adresse et attend que la page soit vraiment affichée (utile sur des machines lentes).
async function aller(p, url) {
  await p.goto(url);
  const sel = /revisions\.html/.test(url) ? "#course-select option" : /lecon-\d+$/.test(url) ? ".lecon h1"
    : /quiz$/.test(url) ? ".quiz h1" : /#lexique$/.test(url) ? ".lexique h1" : ".hero h1";
  await p.waitForSelector(sel, { timeout: 15000 }).catch(() => {});
}

function serveur() {
  return new Promise((pret) => {
    const s = http.createServer((req, rep) => {
      let u = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (u.endsWith("/")) u += "index.html";
      const f = path.join(RACINE, u);
      if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rep.writeHead(404); return rep.end("introuvable"); }
      rep.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(rep);
    });
    s.listen(0, "127.0.0.1", () => pret(s));
  });
}

// Zones à toucher de moins de 44 px (hors liens au fil du texte).
const petitesCibles = (p) => p.evaluate(() => [...document.querySelectorAll("a, button, select, input, textarea, summary")].filter((e) => {
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  if (!r.width || s.visibility === "hidden" || s.display === "none") return false;
  if (e.tagName === "A" && e.closest("p, li, td, dd") && !e.className) return false;
  return r.height < 43.5 || r.width < 43.5;
}).map((e) => `${e.tagName.toLowerCase()}${e.className ? "." + String(e.className).split(" ")[0] : ""} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`));

(async () => {
  const { COURS } = await import(pathToFileURL(path.join(RACINE, "cours.js")).href);
  const PREMIER = COURS[0];
  const lien = (c, page) => "#" + (c.id === PREMIER.id ? "" : c.id + "/") + page;
  const srv = await serveur();
  const BASE = `http://127.0.0.1:${srv.address().port}/`;
  const b = await chromium.launch();
  const ouvrir = async (opts = {}) => {
    const ctx = await b.newContext({ ...IPAD, ...opts });
    const p = await ctx.newPage(); p.erreurs = [];
    p.on("pageerror", (e) => p.erreurs.push(e.message));
    p.on("dialog", (d) => d.accept());
    return { ctx, p };
  };
  const stockage = (p, cle) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), cle);

  try {
    // ---------- 1. Toutes les pages sur plusieurs iPad
    titre("Toutes les pages, sur plusieurs iPad");
    const routes = ["", ...COURS.flatMap((c) => [...c.LECONS.map((l) => lien(c, "lecon-" + l.id)), ...(c.QUIZ.length ? [lien(c, "quiz")] : [])]), "#lexique", "revisions.html"];
    for (const d of APPAREILS) {
      const ctx = await b.newContext({ ...devices[d] }); const p = await ctx.newPage();
      const errs = [], echecs = [], debord = [];
      p.on("pageerror", (e) => errs.push(e.message));
      p.on("response", (r) => r.status() >= 400 && !/fonts\.g/.test(r.url()) && echecs.push(r.status() + " " + r.url()));
      for (const r of routes) {
        await aller(p, BASE + r);
        if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) debord.push(r || "accueil");
      }
      ok(`${d} : ${routes.length} pages sans erreur JavaScript`, !errs.length, errs.slice(0, 2).join(" | "));
      ok(`${d} : aucun fichier introuvable`, !echecs.length, echecs.slice(0, 2).join(" | "));
      ok(`${d} : pas de défilement horizontal`, !debord.length, debord.join(", "));
      await ctx.close();
    }

    // ---------- 2. Chaque leçon, en détail
    const { ctx: c2, p } = await ouvrir({ permissions: ["clipboard-read", "clipboard-write"] });
    for (const c of COURS) {
      titre(`Leçons : ${c.titre}`);
      for (const l of c.LECONS) {
        const n = `Leçon ${l.id}`;
        await aller(p, BASE + lien(c, "lecon-" + l.id));
        const compte = (t) => (l.blocs || []).filter((x) => x.type === t).length;
        const ex = l.exercice || {};
        const prompts = (ex.etapes || []).reduce((s, e) => s + !!e.p + !!e.p2, 0) + (ex.details || []).filter((d) => d.p).length;
        const vu = await p.evaluate(() => ({
          h1: document.querySelector("h1")?.textContent, obj: document.querySelectorAll(".objectifs li").length,
          ret: document.querySelectorAll(".retenir li").length, h2: document.querySelectorAll(".contenu > h2").length,
          h3: document.querySelectorAll(".contenu > h3").length, ul: document.querySelectorAll(".contenu > ul").length,
          tab: document.querySelectorAll(".contenu .tableau").length, code: document.querySelectorAll(".contenu > figure.code").length,
          prompts: document.querySelectorAll(".exercice figure.prompt").length, etapes: document.querySelectorAll(".exercice-etapes > li").length,
          depl: document.querySelectorAll(".exercice details.depliable").length, classer: !!document.querySelector(".classer"),
          suivant: [...document.querySelectorAll(".lecon-pied a")].pop()?.getAttribute("href"),
        }));
        const attendu = { h1: l.titre, obj: l.objectifs.length, ret: l.retenir.length, h2: compte("h2"), h3: compte("h3"), ul: compte("liste"),
          tab: compte("tableau"), code: compte("code"), prompts, etapes: (ex.etapes || []).length, depl: (ex.details || []).length,
          classer: !!(ex.classer && c.CLASSER && c.PHASES),
          suivant: l.id < c.LECONS.length ? lien(c, "lecon-" + (l.id + 1)) : c.QUIZ.length ? lien(c, "quiz") : undefined };
        const ecarts = Object.keys(attendu).filter((k) => attendu[k] !== undefined && vu[k] !== attendu[k]).map((k) => `${k} : ${vu[k]} au lieu de ${attendu[k]}`);
        ok(`${n} « ${l.titre} » : tout le contenu s’affiche`, !ecarts.length, ecarts.join(" ; "));
        const petits = await petitesCibles(p);
        ok(`${n} : zones à toucher d’au moins 44 px`, !petits.length, petits.slice(0, 3).join(", "));
        if (prompts) {
          const texte = await p.locator("figure.prompt pre").first().textContent();
          await p.locator(".prompt .copier").first().tap(); await attendre(p, 200);
          ok(`${n} : le bouton Copier copie le prompt`, (await p.evaluate(() => navigator.clipboard.readText())) === texte);
        }
        if (attendu.classer) {
          const items = p.locator(".classer ol > li");
          for (let k = 0; k < c.CLASSER.length; k++) await items.nth(k).locator("button", { hasText: c.PHASES[c.CLASSER[k].r] }).tap();
          ok(`${n} : exercice à classer, tout juste`, (await p.locator(".classer-score").textContent()).startsWith(`${c.CLASSER.length} sur ${c.CLASSER.length}`));
        }
      }
    }
    ok("Aucune erreur JavaScript dans les leçons", !p.erreurs.length, p.erreurs.join(" | "));
    await c2.close();

    // ---------- 3. Le quiz de chaque cours
    for (const c of COURS.filter((x) => x.QUIZ.length)) {
      titre(`Quiz : ${c.titre}`);
      const { ctx, p } = await ouvrir();
      const N = c.QUIZ.length;
      const repondre = async (choix) => {
        for (let k = 0; k < N; k++) {
          await p.locator(".choix-carte").nth(choix(c.QUIZ[k])).tap();
          await p.getByRole("button", { name: "Valider" }).tap();
          await p.getByRole("button", { name: /Question suivante|Voir mon résultat/ }).tap();
        }
        await attendre(p, 250);
      };
      await aller(p, BASE + lien(c, "quiz"));
      await repondre((q) => q.b);
      ok(`Tout juste : ${N}/${N}`, (await p.locator(".resultat-anneau").textContent()).replace(/\s/g, "") === `${N}/${N}` && /Bravo/.test(await p.locator(".resultat h1").textContent()));
      const etat = await stockage(p, "cc101fr:v1");
      const meilleur = c.id === PREMIER.id ? etat.quiz?.meilleur : etat.cours?.[c.id]?.quiz?.meilleur;
      ok("Meilleur score enregistré pour ce cours", meilleur === N);
      await p.getByRole("button", { name: /Recommencer/ }).tap(); await attendre(p, 200);
      await repondre((q) => (q.b + 1) % 4);
      ok("Tout faux : le quiz va jusqu’au bout", /Encore un petit effort/.test(await p.locator(".resultat h1").textContent()));
      ok(`${N} questions « À revoir », avec un lien vers la leçon`, (await p.locator(".revision li").count()) === N && (await p.locator(".revision a").first().getAttribute("href")) === lien(c, "lecon-" + c.QUIZ[0].l));
      const carnet = (await stockage(p, "cc101fr:revisions:v1")) || [];
      ok(`${N} erreurs notées dans le carnet, pour ce cours`, carnet.filter((x) => x.source === "quiz" && x.courseId === c.id).length === N);
      const suivant = COURS[COURS.indexOf(c) + 1];
      if (suivant) ok("Bouton « Cours suivant »", (await p.locator(".resultat-actions a", { hasText: "Cours suivant" }).getAttribute("href")) === lien(suivant, "lecon-1"));
      ok("Aucune erreur JavaScript", !p.erreurs.length, p.erreurs.join(" | "));
      await ctx.close();
    }

    // ---------- 4. Lexique
    titre("Lexique");
    {
      const { ctx, p } = await ouvrir();
      const mots = [...new Set(COURS.flatMap((c) => (c.LEXIQUE || []).map((m) => m[0])))];
      await aller(p, BASE + "#lexique");
      const vus = await p.locator("dt").allTextContents();
      ok(`${mots.length} mots, tous les cours réunis`, vus.length === mots.length && mots.every((m) => vus.includes(m)));
      ok("Ordre alphabétique", vus.every((m, k) => !k || vus[k - 1].localeCompare(m, "fr") < 0));
      await p.locator("input[type=search]").fill(mots[0].slice(0, 4)); await attendre(p, 150);
      ok("La recherche filtre", (await p.locator("dt").count()) >= 1 && (await p.locator("dt").count()) <= mots.length);
      await ctx.close();
    }

    // ---------- 5. Carnet de révision
    titre("Carnet de révision");
    {
      const { ctx, p } = await ouvrir({ acceptDownloads: true });
      await aller(p, BASE + "revisions.html");
      ok("Tous les cours proposés", JSON.stringify(await p.locator("#course-select option").allTextContents()) === JSON.stringify(COURS.map((c) => c.titre)));
      for (const c of COURS) {
        await p.locator("#course-select").selectOption(c.id); await attendre(p, 100);
        const lecons = await p.locator("#lesson-select option").count();
        const fautes = [];
        for (const l of c.LECONS) {
          await p.locator("#lesson-select").selectOption(String(l.id));
          const notions = await p.locator("#topic-select option").count();
          const attendu = l.objectifs.length + (l.blocs || []).filter((x) => x.type === "h2" || x.type === "h3").length;
          if (notions !== attendu) fautes.push(`leçon ${l.id} : ${notions} notions au lieu de ${attendu}`);
        }
        ok(`${c.titre} : ${c.LECONS.length} leçons et leurs notions`, lecons === c.LECONS.length && !fautes.length, fautes.slice(0, 3).join(" ; "));
      }
      const c = COURS.at(-1), l = c.LECONS.at(-1);
      await aller(p, BASE + `revisions.html?course=${c.id}&lesson=${l.id}`);
      ok("Ouvert depuis une leçon : cours et leçon présélectionnés", (await p.locator("#course-select").inputValue()) === c.id && (await p.locator("#lesson-select").inputValue()) === String(l.id));
      await p.locator("textarea[name=description]").fill("Essai automatique");
      await p.locator("#entry-images").setInputFiles(path.join(RACINE, "icon-192.png"));
      await p.getByRole("button", { name: "Ajouter au carnet" }).tap(); await attendre(p, 800);
      const fiche = ((await stockage(p, "cc101fr:revisions:v1")) || [])[0];
      ok("Ajouter une difficulté avec une capture", fiche && fiche.courseId === c.id && fiche.lessonId === l.id && fiche.images?.length === 1);
      await p.locator("[data-open]").first().tap(); await attendre(p, 300);
      ok("Ouvrir la fiche", await p.locator("#detail-modal").isVisible());
      await p.locator("#detail-status").selectOption("maitrise"); await attendre(p, 150);
      ok("Changer son état", ((await stockage(p, "cc101fr:revisions:v1")) || [])[0]?.status === "maitrise");
      await p.locator("#delete-item").tap(); await attendre(p, 300);
      ok("Supprimer la fiche", ((await stockage(p, "cc101fr:revisions:v1")) || []).length === 0);
      const [dl] = await Promise.all([p.waitForEvent("download"), p.locator("#export-data").tap()]);
      ok("Exporter le carnet", dl.suggestedFilename() === "cl4ud3-mon-carnet.json");
      ok("Aucune erreur JavaScript", !p.erreurs.length, p.erreurs.join(" | "));
      await ctx.close();
    }

    // ---------- 6. Progression
    titre("Progression");
    {
      const { ctx, p } = await ouvrir();
      for (const c of COURS) {
        await aller(p, BASE + lien(c, "lecon-1"));
        await p.locator(".bouton-fait").tap(); await attendre(p, 200);
        const e = await stockage(p, "cc101fr:v1");
        const faites = c.id === PREMIER.id ? e.faites : e.cours?.[c.id]?.faites;
        await p.reload(); await p.waitForSelector(".lecon h1");
        ok(`${c.titre} : leçon 1 terminée, enregistrée et gardée après rechargement`, faites?.includes(1) && /Leçon terminée/.test(await p.locator(".bouton-fait").textContent()));
      }
      await p.evaluate(() => localStorage.setItem("cc101fr:v1", JSON.stringify({ faites: [1, 2], quiz: null, theme: "auto" })));
      await aller(p, BASE); await p.reload(); await p.waitForSelector(".hero h1");
      ok("Ancienne sauvegarde relue", /2 leçons terminées/.test(await p.locator(".progression").textContent()));
      await p.locator(".apropos button").tap(); await attendre(p, 300);
      const e = await stockage(p, "cc101fr:v1");
      ok("Effacer ma progression", e.faites.length === 0 && !e.quiz && !Object.keys(e.cours || {}).length);
      ok("Aucune erreur JavaScript", !p.erreurs.length, p.erreurs.join(" | "));
      await ctx.close();
    }

    // ---------- 7. Hors ligne
    titre("Hors ligne");
    {
      const { ctx, p } = await ouvrir();
      await aller(p, BASE);
      await p.evaluate(async () => { await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready; });
      await attendre(p, 1000);
      const urls = await p.evaluate(async () => { const k = await caches.keys(); return k.length ? (await (await caches.open(k[0])).keys()).map((r) => new URL(r.url).pathname.slice(1)) : []; });
      const contenu = ["cours.js", ...fs.readdirSync(RACINE).filter((f) => /^donnees.*\.js$/.test(f))];
      ok("Tous les fichiers de contenu sont en cache", contenu.every((f) => urls.includes(f)), contenu.filter((f) => !urls.includes(f)).join(", "));
      await ctx.setOffline(true);
      for (const c of COURS) for (const l of [c.LECONS[0], c.LECONS.at(-1)]) {
        await p.goto(BASE + lien(c, "lecon-" + l.id)).catch(() => {}); await attendre(p, 400);
        ok(`Coupé du réseau : ${c.titre}, leçon ${l.id}`, (await p.locator("h1").textContent().catch(() => "")) === l.titre);
      }
      await p.goto(BASE + "revisions.html").catch(() => {}); await attendre(p, 800);
      ok("Coupé du réseau : carnet de révision", (await p.locator("body").textContent().catch(() => "")).includes("Révisions"));
      await ctx.close();
    }
  } catch (e) {
    ok("Le test s’est déroulé jusqu’au bout", false, e.message.split("\n")[0]);
  } finally {
    await b.close(); srv.close();
  }

  let sec = "";
  for (const r of res) {
    if (r.s !== sec) { sec = r.s; console.log("\n# " + sec); }
    console.log((r.ok ? "  ✔ " : "  ✘ ") + r.nom + (r.ok || !r.info ? "" : "  → " + r.info));
  }
  const ko = res.filter((r) => !r.ok).length;
  console.log(`\n${res.length - ko} réussis, ${ko} échoués sur ${res.length}`);
  process.exitCode = ko ? 1 : 0;
})();
