// Patatino: funzionamento offline. Cambia VERSION a ogni aggiornamento dell'app.
const VERSION = "patatino-v12";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png", "./icon-32.png", "./icon-maskable-192.png", "./icon-maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // licenza e moduli premium: sempre dalla rete, mai nella cache del service worker
  if (url.origin === location.origin && /\/api\/|\/premium-src\//.test(url.pathname)) return;
  // pagina: prima la rete (per ricevere gli aggiornamenti), poi la copia salvata
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { caches.open(VERSION).then(c => c.put("./index.html", r.clone())); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // icone, manifest e font: prima la copia salvata
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (url.origin === location.origin || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")) {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy));
    }
    return r;
  })));
});
