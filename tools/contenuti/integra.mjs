// Inserisce esercizi difficili e versione inglese nell'app.
// Uso: node integra.mjs <cartella-repo>   (richiede out/ completo e validato)
import fs from "node:fs"; import path from "node:path";
const ROOT = path.resolve(process.argv[2] || "/home/user/patatino");
const OUT = new URL("out/", import.meta.url).pathname;   // contenuti prodotti (tools/contenuti/out)
const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const html0 = fs.readFileSync(ROOT + "/index.html", "utf8");
let html = html0;
const GROUPS = [[1,5],[6,10],[11,15],[16,20],[21,25],[26,30]].map(([a, b]) => Array.from({length:b - a + 1}, (x, i) => "u" + (a + i)));
const FREE = GROUPS[0];
const sets = rd(OUT + "ordersets.json"), decks = rd(OUT + "decks.json");
const unit = (id) => rd(OUT + id + ".json");
// 1) contenuti gratuiti dentro index.html
const HARD = {}, EN = {units:{}, decks:{}};
FREE.forEach(id => { const o = unit(id); HARD[id] = o.hard; EN.units[id] = o.en; });
const freeDeckIds = [...html.matchAll(/^  id:"(\w+)", g:"/gm)].map(m => m[1]);
freeDeckIds.forEach(id => { if(decks[id]) EN.decks[id] = decks[id]; });
const rep = (a, b) => { if(!html.includes(a)) throw new Error("non trovato: " + a.slice(0, 60)); html = html.replace(a, () => b); };
rep("const HARD = {};", "const HARD = " + JSON.stringify(HARD, null, 1) + ";");
rep("const EN = {units:{}, decks:{}};", "const EN = " + JSON.stringify(EN, null, 1) + ";");
// 2) catalogo: titoli inglesi
html = html.replace(/^  \{id:"(u\d+)", nl:(".*?"), it:(".*?")\}(,?)$/gm, (m, id, nl, it, c) => `  {id:"${id}", nl:${nl}, it:${it}, en:${JSON.stringify(unit(id).en.it)}}${c}`);
html = html.replace(/^  \{id:"(\w+)", unit:"(u\d+)", t:(".*?"), s:(".*?"), n:(\d+)\}(,?)$/gm, (m, id, u, t, s, n, c) => `  {id:"${id}", unit:"${u}", t:${t}, s:${s}, n:${n}, en:${JSON.stringify({t:sets[id].t, s:sets[id].s})}}${c}`);
html = html.replace(/^  \{id:"(\w+)", pos:(\d+), g:(".*?"), t:(".*?"), s:(".*?"), n:(\d+)\}(,?)$/gm, (m, id, pos, g, t, s, n, c) => `  {id:"${id}", pos:${pos}, g:${g}, t:${t}, s:${s}, n:${n}, en:${JSON.stringify({t:decks[id].t, s:decks[id].s})}}${c}`);
const cnt = (re) => (html.match(re) || []).length;
console.log("catalogo con inglese: unità", cnt(/^  \{id:"u\d+", nl:.*, en:/gm), "· serie", cnt(/^  \{id:"\w+", unit:.*, en:/gm), "· mazzi", cnt(/^  \{id:"\w+", pos:.*, en:/gm));
fs.writeFileSync(ROOT + "/index.html", html);
// 3) moduli premium
for(let n = 2; n <= 6; n++){
  const f = `${ROOT}/premium-src/module-${n}.json`, m = rd(f);
  m.units.forEach(u => { const o = unit(u.id); u.hard = o.hard; u.en = o.en; });
  (m.orderSets || []).forEach(st => { st.en = sets[st.id]; });
  (m.decks || []).forEach(d => { d.en = decks[d.id]; });
  m.version = 2;
  fs.writeFileSync(f, JSON.stringify(m, null, 1) + "\n");
  console.log(`module-${n}.json: ${m.units.length} unità, ${(m.orderSets || []).length} serie, ${(m.decks || []).length} mazzi`);
}
console.log("index.html:", Math.round(html0.length / 1024), "→", Math.round(html.length / 1024), "KB");
