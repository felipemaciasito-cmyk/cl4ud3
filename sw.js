// Service worker : l’appli marche hors ligne après une première visite.
// Stratégie : réseau d’abord (toujours la dernière version en ligne), cache en secours.
const CACHE = "cc101fr-v11";
const FICHIERS = [
  "./", "index.html", "revisions.html", "revisions.css", "revisions-app.js", "styles.css", "app.js", "cours.js", "donnees.js", "donnees-claude-code-en-action.js", "vendor-react.js",
  "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const memeSite = url.origin === self.location.origin;
  const polices = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!memeSite && !polices) return;

  e.respondWith(
    fetch(req)
      .then((rep) => {
        if (rep && (rep.ok || rep.type === "opaque")) {
          const copie = rep.clone();
          caches.open(CACHE).then((c) => c.put(req, copie));
        }
        return rep;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
