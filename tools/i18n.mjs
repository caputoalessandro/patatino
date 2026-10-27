// Traduzioni di Patatino: estrae i testi da tradurre e controlla/costruisce i pacchetti di lingua.
// Uso (dalla cartella del repo):
//   node tools/i18n.mjs estrai                 → tools/i18n/it.json (contenuti) e tools/i18n/it-ui.json (interfaccia)
//   node tools/i18n.mjs costruisci en          → unisce tools/i18n/en/*.json in lang/en.js, dopo averli verificati
//   node tools/i18n.mjs verifica en            → solo i controlli
//   node tools/i18n.mjs lista en 0 20000       → testi ancora da tradurre (i primi ~20000 caratteri)
// Le traduzioni stanno in tools/i18n/<lingua>/: ui.json + file di contenuti {testo italiano: traduzione}.
// Le stringhe fatte solo di parole olandesi del corso restano uguali e non vanno tradotte.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const SEP = "|";

// contenuti: tutto lo script dei dati (prima del secondo <script>)
function loadData(){
  const a = html.indexOf("<script>// Contenuti originali."), b = html.indexOf("</script>", a);
  const code = html.slice(a + 8, b) + "\n;({UNITS, NOTES, GLOSS, CORE, DECKS, ORDER_SETS, LOGIC})";
  return vm.runInNewContext(code, {});
}

// percorsi dei testi da tradurre (le parti in olandese restano fuori, tranne dove testo e olandese si mescolano)
function collect(D){
  const out = {};
  const put = (p, v) => { if(typeof v === "string" && v.trim() && /[A-Za-zÀ-ÿ]/.test(v)) out[p.join(SEP)] = v; };
  const item = (p, it) => {
    put([...p, "q"], it.q); put([...p, "h"], it.h); put([...p, "e"], it.e); put([...p, "tt"], it.tt);
    if(it.oit && Array.isArray(it.o)) it.o.forEach((o, k) => put([...p, "o", k], o));
    if(it.g) Object.keys(it.g).forEach(k => put([...p, "g", k], it.g[k]));
  };
  D.UNITS.forEach((u, i) => { put(["UNITS", i, "it"], u.it); u.items.forEach((it, j) => item(["UNITS", i, "items", j], it)); });
  Object.keys(D.NOTES).forEach(id => {
    const n = D.NOTES[id];
    (n.vocab || []).forEach((w, k) => put(["NOTES", id, "vocab", k, 1], w[1]));
    put(["NOTES", id, "note"], n.note); put(["NOTES", id, "vlaams"], n.vlaams);
  });
  Object.keys(D.GLOSS).forEach(k => { const G = D.GLOSS[k]; put(["GLOSS", k, "t"], G.t); Object.keys(G.g || {}).forEach(w => put(["GLOSS", k, "g", w], G.g[w])); });
  Object.keys(D.CORE).forEach(id => {
    const c = D.CORE[id];
    (c.words || []).forEach((w, k) => put(["CORE", id, "words", k, 1], w[1]));
    (c.drills || []).forEach((it, j) => item(["CORE", id, "drills", j], it));
  });
  D.DECKS.forEach((d, i) => {
    put(["DECKS", i, "t"], d.t); put(["DECKS", i, "s"], d.s);
    d.cards.forEach((c, k) => {
      if(d.kind === "dehet"){ put(["DECKS", i, "cards", k, 2], c[2]); return; }
      put(["DECKS", i, "cards", k, 1], c[1]);
      if(!d.sayExtra) put(["DECKS", i, "cards", k, 2], c[2]);
    });
  });
  D.ORDER_SETS.forEach((st, i) => {
    put(["ORDER_SETS", i, "t"], st.t); put(["ORDER_SETS", i, "s"], st.s); put(["ORDER_SETS", i, "rule"], st.rule);
    st.items.forEach((x, j) => { put(["ORDER_SETS", i, "items", j, "it"], x.it); put(["ORDER_SETS", i, "items", j, "e"], x.e); });
  });
  return out;
}

// testi dell'interfaccia: ogni tr("…") nel codice dell'app
function collectUi(){
  const a = html.indexOf("window.patatinoMain"), code = html.slice(a);
  const out = {};
  const re = /\btr\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  let m;
  while((m = re.exec(code))){ const s = m[1][0] === '"' ? JSON.parse(m[1]) : JSON.parse('"' + m[1].slice(1, -1).replace(/"/g, '\\"').replace(/\\'/g, "'") + '"'); out[s] = s; }
  return out;
}

function setPath(root, p, v){
  const k = p.split(SEP); let o = root;
  for(let i = 0; i < k.length - 1; i++) o = o[k[i]];
  o[k[k.length - 1]] = v;
}

const tags = (s) => (String(s).match(/<\/?[a-z0-9]+/gi) || []).map(t => t.toLowerCase()).join(",");
// i segni contano dove la frase olandese con la lacuna viene ricostruita (vedi LOGIC.fillSentence)
const marks = (s) => (String(s).includes("___") ? ["___", "→", "—", "(", ")"] : ["___"]).map(m => String(s).split(m).length - 1).join(",");
const vars = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(",");

// parole olandesi del corso: una stringa fatta solo di queste (e di numeri/simboli) resta uguale in ogni lingua
function dutchWords(D){
  const w = new Set();
  const add = (t) => String(t || "").toLowerCase().split(/[^a-zà-ÿ'ëïéèöü]+/i).forEach(x => { if(x) w.add(x); });
  const item = (it) => { (Array.isArray(it.a) ? it.a : [it.a]).forEach(add); (it.alt || []).forEach(x => (Array.isArray(x) ? x : [x]).forEach(add)); (it.x || []).forEach(add); if(!it.oit) (it.o || []).forEach(add); Object.keys(it.g || {}).forEach(add); add(it.say); };
  D.UNITS.forEach(u => { add(u.nl); u.items.forEach(item); });
  Object.values(D.NOTES).forEach(n => (n.vocab || []).forEach(v => add(v[0])));
  Object.values(D.CORE).forEach(c => { (c.words || []).forEach(v => add(v[0])); (c.drills || []).forEach(item); });
  D.DECKS.forEach(d => d.cards.forEach(c => { add(c[0]); if(d.kind === "dehet") add(c[1]); if(d.sayExtra) add(c[2]); }));
  D.ORDER_SETS.forEach(st => st.items.forEach(x => [x.a].concat(x.alt || []).forEach(seq => seq.forEach(add))));
  return w;
}
function isDutchOnly(s, W){
  const t = String(s).replace(/<[^>]+>/g, " ").toLowerCase().split(/[^a-zà-ÿ'ëïéèöü]+/i).filter(Boolean);
  return t.length > 0 && t.every(x => W.has(x));
}
// traduzioni: tools/i18n/<lingua>/ui.json + file di contenuti {testo italiano: traduzione}
function readLang(lang){
  const d = path.join(dir, "tools", "i18n", lang);
  const ui = JSON.parse(fs.readFileSync(path.join(d, "ui.json"), "utf8"));
  const map = {};
  fs.readdirSync(d).filter(f => f.endsWith(".json") && f !== "ui.json").sort().forEach(f => Object.assign(map, JSON.parse(fs.readFileSync(path.join(d, f), "utf8"))));
  return {ui, map};
}
function resolve(src, map, W){
  const data = {}, missing = [];
  Object.keys(src).forEach(k => { const it = src[k]; if(it in map) data[k] = map[it]; else if(isDutchOnly(it, W)) data[k] = it; else missing.push(k); });
  return {data, missing};
}

function verify(lang){
  const D = loadData(), src = collect(D), srcUi = collectUi();
  const {ui, map} = readLang(lang);
  const {data, missing} = resolve(src, map, dutchWords(D));
  const errs = [], warn = [];
  missing.forEach(k => errs.push("manca: " + k + "  «" + src[k].slice(0, 70) + "»"));
  Object.keys(src).forEach(k => {
    if(!(k in data)) return;
    const a = src[k], b = data[k];
    if(typeof b !== "string" || !b.trim()) errs.push("vuoto: " + k);
    else {
      if(tags(a) !== tags(b)) errs.push("tag diversi: " + k + "\n   it: " + tags(a) + "\n   " + lang + ": " + tags(b));
      if(marks(a) !== marks(b)) errs.push("segni ___ → ↔ — diversi: " + k + "\n   it: " + a + "\n   " + lang + ": " + b);
    }
  });
  const used = new Set(Object.values(src)); Object.keys(map).forEach(k => { if(!used.has(k)) warn.push("in più (ignorato): " + k.slice(0, 70)); });
  Object.keys(srcUi).forEach(k => {
    if(!(k in ui)) errs.push("ui manca: " + JSON.stringify(k));
    else if(vars(k) !== vars(ui[k])) errs.push("ui segnaposti diversi: " + JSON.stringify(k) + " → " + JSON.stringify(ui[k]));
    else if(tags(k) !== tags(ui[k])) errs.push("ui tag diversi: " + JSON.stringify(k) + " → " + JSON.stringify(ui[k]));
  });
  // l'olandese pronunciato e controllato non deve cambiare
  const T = loadData();
  Object.keys(data).forEach(k => { if(k in src) setPath(T, k, data[k]); });
  const L = D.LOGIC;
  const same = (p, a, b) => { let x, y; try{ x = L.dutchOf(a); y = L.dutchOf(b); }catch(e){ errs.push("errore olandese: " + p + " " + e.message); return; } if(x !== y) errs.push("olandese cambiato: " + p + "\n   it: " + x + "\n   " + lang + ": " + y); };
  D.UNITS.forEach((u, i) => u.items.forEach((it, j) => same("UNITS|" + i + "|items|" + j, it, T.UNITS[i].items[j])));
  Object.keys(D.CORE).forEach(id => (D.CORE[id].drills || []).forEach((it, j) => same("CORE|" + id + "|drills|" + j, it, T.CORE[id].drills[j])));
  return {errs, warn, src, srcUi, ui, data};
}

const [cmd, lang] = process.argv.slice(2);
if(cmd === "estrai"){
  const src = collect(loadData()), ui = collectUi();
  fs.mkdirSync(path.join(dir, "tools", "i18n"), {recursive:true});
  fs.writeFileSync(path.join(dir, "tools", "i18n", "it.json"), JSON.stringify(src, null, 1));
  fs.writeFileSync(path.join(dir, "tools", "i18n", "it-ui.json"), JSON.stringify(ui, null, 1));
  console.log(Object.keys(src).length + " testi di contenuto, " + Object.keys(ui).length + " dell'interfaccia");
} else if(cmd === "verifica" || cmd === "costruisci"){
  const r = verify(lang);
  r.warn.slice(0, 20).forEach(w => console.log("! " + w));
  r.errs.slice(0, 60).forEach(e => console.log("✗ " + e));
  console.log(lang + ": " + r.errs.length + " errori, " + Object.keys(r.data).length + "/" + Object.keys(r.src).length + " contenuti, " + Object.keys(r.ui).length + "/" + Object.keys(r.srcUi).length + " interfaccia");
  if(r.errs.length) process.exit(1);
  if(cmd === "costruisci"){
    const data = {}; Object.keys(r.src).forEach(k => data[k] = r.data[k]);
    const ui = {}; Object.keys(r.srcUi).forEach(k => ui[k] = r.ui[k]);
    fs.writeFileSync(path.join(dir, "lang", lang + ".js"), "// Patatino: pacchetto di lingua generato da tools/i18n.mjs, non modificare a mano\nwindow.PATATINO_LANG=" + JSON.stringify({code:lang, ui, data}) + ";\n");
    console.log("scritto lang/" + lang + ".js");
  }
} else if(cmd === "lista"){
  // testi unici ancora da tradurre, nell'ordine del corso: node tools/i18n.mjs lista en [da] [quanti caratteri]
  const D = loadData(), W = dutchWords(D), src = collect(D);
  let map = {}; try{ map = readLang(lang).map; }catch(e){}
  const todo = [...new Set(Object.values(src))].filter(t => !(t in map) && !isDutchOnly(t, W));
  const from = +(process.argv[4] || 0), max = +(process.argv[5] || 1e9);
  let n = 0; const out = {};
  for(let i = from; i < todo.length && n < max; i++){ out[todo[i]] = ""; n += todo[i].length; }
  console.log(JSON.stringify(out, null, 0).replace(/","/g, '",\n"'));
  console.error(Object.keys(out).length + " testi, " + n + " caratteri; restano " + todo.length + " testi da tradurre");
} else if(cmd === "congela"){
  // lista fissa dei testi unici da tradurre (uguale per tutte le lingue): tools/i18n/da-tradurre.json
  const D = loadData(), W = dutchWords(D), src = collect(D);
  const todo = [...new Set(Object.values(src))].filter(t => !isDutchOnly(t, W));
  fs.writeFileSync(path.join(dir, "tools", "i18n", "da-tradurre.json"), JSON.stringify(todo, null, 0).replace(/","/g, '",\n"'));
  console.log(todo.length + " testi");
} else if(cmd === "blocco"){
  // mostra i testi numerati da tradurre: node tools/i18n.mjs blocco <da> <quanti>
  const todo = JSON.parse(fs.readFileSync(path.join(dir, "tools", "i18n", "da-tradurre.json"), "utf8"));
  const from = +process.argv[3], n = +process.argv[4];
  todo.slice(from, from + n).forEach((t, i) => console.log((from + i) + "\t" + t));
} else if(cmd === "unisci"){
  // tools/i18n/<lingua>/_b<da>.json (array di traduzioni allineate alla lista fissa) → contenuti.json {italiano: traduzione}
  const todo = JSON.parse(fs.readFileSync(path.join(dir, "tools", "i18n", "da-tradurre.json"), "utf8"));
  const d = path.join(dir, "tools", "i18n", lang), f = path.join(d, "contenuti.json");
  const map = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  fs.readdirSync(d).filter(x => /^_b\d+\.json$/.test(x)).forEach(x => {
    const from = +x.match(/\d+/)[0], arr = JSON.parse(fs.readFileSync(path.join(d, x), "utf8"));
    arr.forEach((t, i) => { map[todo[from + i]] = t; });
    fs.unlinkSync(path.join(d, x));
    console.log(x + ": " + arr.length + " testi (" + from + "–" + (from + arr.length - 1) + ")");
  });
  fs.writeFileSync(f, JSON.stringify(map, null, 1));
} else console.log("uso: node tools/i18n.mjs estrai | verifica <lingua> | costruisci <lingua>");
