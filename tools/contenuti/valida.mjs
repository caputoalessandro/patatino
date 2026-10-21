// Validatore dei file prodotti per Patatino (esercizi difficili + versione inglese).
// Uso: node valida.mjs u6 [u7 ...] | node valida.mjs all | node valida.mjs ordersets | node valida.mjs decks
import fs from "node:fs";
const DIR = new URL(".", import.meta.url).pathname;
const read = (p) => JSON.parse(fs.readFileSync(DIR + p, "utf8"));
let errors = 0, warns = 0;
const E = (f, m) => { errors++; console.log(`ERRORE ${f}: ${m}`); };
const W = (f, m) => { warns++; console.log(`avviso ${f}: ${m}`); };
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const isStrArr = (x) => Array.isArray(x) && x.length > 0 && x.every(s => typeof s === "string" && s.trim());
const toks = (s) => s.replace(/[.,!?;:]/g, " ").split(/\s+/).filter(Boolean).map(w => w.toLowerCase()).sort().join("|");
// parole italiane frequenti che non dovrebbero comparire nei testi inglesi (fuori da <i>/<b> olandesi è un indizio)
const ITA = /\b(che|della|delle|degli|nella|sono|anche|quando|perché|questo|questa|parola|frase|verbo|esempio|significa|italiano|cioè|oppure|sempre|dopo|prima|come si dice)\b/i;
const strip = (s) => String(s || "").replace(/<(i|b|s)>[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ");
const tagCount = (s) => { const out = {}; (String(s || "").match(/<\/?(h3|p|table|tr|td|th|ul|ol|li|b|i|s)\b/g) || []).forEach(t => out[t] = (out[t] || 0) + 1); return out; };

function checkItem(f, it, ctx){
  if(!it || typeof it !== "object") return E(f, `${ctx}: non è un oggetto`);
  if(!["mc", "fill", "tr", "order"].includes(it.t)) return E(f, `${ctx}: tipo "${it.t}" non valido`);
  if(typeof it.q !== "string" || !it.q.trim()) E(f, `${ctx}: manca q`);
  if(typeof it.e !== "string" || !it.e.trim()) E(f, `${ctx}: manca la spiegazione e`);
  if(it.t === "mc"){
    if(!isStrArr(it.o) || it.o.length < 2 || it.o.length > 4) E(f, `${ctx}: o deve avere 2-4 opzioni`);
    else if(new Set(it.o).size !== it.o.length) E(f, `${ctx}: opzioni duplicate`);
    if(!Number.isInteger(it.a) || !it.o || it.a < 0 || it.a >= it.o.length) E(f, `${ctx}: a deve essere l'indice dell'opzione giusta`);
    if(it.g && it.o && !it.o.every(x => x in it.g)) E(f, `${ctx}: g deve avere una traduzione per ogni opzione`);
  }
  if(it.t === "fill"){
    if(!it.q.includes("___")) E(f, `${ctx}: q deve contenere ___`);
    if(!isStrArr(it.a)) E(f, `${ctx}: a deve essere un elenco di risposte`);
  }
  if(it.t === "tr"){
    if(!isStrArr(it.a)) E(f, `${ctx}: a deve essere un elenco di frasi olandesi`);
    else it.a.forEach(x => { if(/[.!?]$/.test(x.trim())) W(f, `${ctx}: risposta con punteggiatura finale (togliere): "${x}"`); });
  }
  if(it.t === "order"){
    const flat = (x) => Array.isArray(x) ? x.join(" ") : x;
    if(typeof it.a !== "string" && !isStrArr(it.a)) E(f, `${ctx}: a deve essere una frase (stringa)`);
    else {
      (it.alt || []).forEach((x, k) => { if(toks(flat(x)) !== toks(flat(it.a))) E(f, `${ctx}: alt[${k}] non usa le stesse parole di a`); });
      if(typeof it.a === "string" && it.x){ const have = new Set(it.a.toLowerCase().split(" ")); it.x.forEach(w => { if(have.has(w.toLowerCase())) E(f, `${ctx}: il distrattore "${w}" è anche nella risposta`); }); }
    }
  }
}
// versione inglese: stesso tipo, parti olandesi identiche
function checkEn(f, it, en, ctx){
  checkItem(f, en, ctx + " (en)");
  if(!en || !it) return;
  if(en.t !== it.t) return E(f, `${ctx}: tipo diverso tra italiano e inglese`);
  if(it.t === "mc"){
    if(en.a !== it.a) E(f, `${ctx}: indice della risposta giusta diverso`);
    if((en.o || []).length !== (it.o || []).length) E(f, `${ctx}: numero di opzioni diverso`);
    if(!it.oit && !same(en.o, it.o)) E(f, `${ctx}: opzioni olandesi cambiate (senza oit devono restare identiche)`);
    if(!!en.oit !== !!it.oit) E(f, `${ctx}: oit diverso`);
  }
  if(it.t === "fill" || it.t === "tr"){ if(!same(en.a, it.a)) E(f, `${ctx}: risposte olandesi cambiate`); }
  if(it.t === "order"){ ["a", "alt", "x", "tiles", "start"].forEach(k => { if(!same(en[k], it[k])) E(f, `${ctx}: campo ${k} cambiato`); }); }
  if(it.say !== undefined && en.say !== it.say) E(f, `${ctx}: say cambiato`);
  if(ITA.test(strip(en.q) + " " + strip(en.e) + " " + (en.h || ""))) W(f, `${ctx}: possibile italiano rimasto: "${strip(en.q).slice(0, 60)}" / "${strip(en.e).slice(0, 60)}"`);
  if(it.t === "tr" && en.q === it.q) E(f, `${ctx}: q non tradotta`);
}

function unit(id){
  const f = `out/${id}.json`;
  if(!fs.existsSync(DIR + f)) return E(f, "file mancante");
  let o, s; try{ o = read(f); }catch(e){ return E(f, "JSON non valido: " + e.message); }
  s = read(`src/${id}.json`);
  if(o.id !== id) E(f, "id diverso dal nome del file");
  // esercizi difficili
  if(!Array.isArray(o.hard) || o.hard.length !== 8) E(f, "hard deve contenere esattamente 8 esercizi");
  else {
    const types = o.hard.reduce((m, it) => (m[it.t] = (m[it.t] || 0) + 1, m), {});
    ["mc", "fill", "tr", "order"].forEach(t => { if(types[t] !== 2) E(f, `hard: servono 2 esercizi "${t}" (ce ne sono ${types[t] || 0})`); });
    o.hard.forEach((it, i) => { checkItem(f, it, `hard[${i}]`); if(it.t === "mc" && (it.o || []).length < 3) E(f, `hard[${i}]: negli esercizi difficili servono 3-4 opzioni`); if(it.t === "mc" && !it.g) E(f, `hard[${i}]: manca g (traduzione delle opzioni)`); if(!it.tt && it.t !== "tr") W(f, `hard[${i}]: manca tt (traduzione della frase)`); });
    const qs = new Set(s.items.concat(s.drills).map(x => x.q));
    o.hard.forEach((it, i) => { if(qs.has(it.q)) E(f, `hard[${i}]: domanda copiata da un esercizio esistente`); });
  }
  const en = o.en;
  if(!en) return E(f, "manca en");
  if(!en.it || en.it === s.it) E(f, "en.it (titolo inglese) mancante o non tradotto");
  ["note", "vlaams"].forEach(k => {
    if(typeof en[k] !== "string" || en[k].length < s[k].length * 0.5) E(f, `en.${k} mancante o troppo corto`);
    else {
      if(ITA.test(strip(en[k]))) W(f, `en.${k}: possibile italiano rimasto`);
      const a = tagCount(s[k]), b = tagCount(en[k]);
      ["<table", "<tr", "<h3"].forEach(t => { if((a[t] || 0) !== (b[t] || 0)) W(f, `en.${k}: numero di ${t}> diverso (${a[t] || 0} → ${b[t] || 0})`); });
      Object.keys(b).forEach(t => { const open = b[t] || 0, close = b[t.replace("<", "</")] || 0; if(!t.startsWith("</") && open !== close) E(f, `en.${k}: tag ${t}> non chiusi correttamente (${open} aperti, ${close} chiusi)`); });
    }
  });
  const pairs = (k, src) => {
    if(!Array.isArray(en[k]) || en[k].length !== src.length) return E(f, `en.${k}: devono essere ${src.length} coppie`);
    en[k].forEach((p, i) => { if(!Array.isArray(p) || p[0] !== src[i][0]) E(f, `en.${k}[${i}]: la parola olandese deve restare "${src[i][0]}"`); else if(!p[1] || p[1] === src[i][1] && /[àèéìòù]|\b(il|la|lo|gli|le)\b/.test(src[i][1])) E(f, `en.${k}[${i}]: traduzione inglese mancante`); });
  };
  pairs("vocab", s.vocab); pairs("core", s.core);
  ["items", "drills"].forEach(k => {
    if(!Array.isArray(en[k]) || en[k].length !== s[k].length) return E(f, `en.${k}: devono essere ${s[k].length} esercizi, nello stesso ordine`);
    s[k].forEach((it, i) => checkEn(f, it, en[k][i], `en.${k}[${i}]`));
    s[k].forEach((it, i) => { if(it.g && (!en[k][i].g || !Object.keys(it.g).every(x => x in en[k][i].g))) E(f, `en.${k}[${i}]: g incompleto`); if(it.tt && !en[k][i].tt) E(f, `en.${k}[${i}]: manca tt`); });
  });
  if(!en.gloss || typeof en.gloss !== "object") E(f, "manca en.gloss");
  else Object.entries(s.gloss).forEach(([i, g]) => {
    const x = en.gloss[i]; if(!x) return E(f, `en.gloss[${i}] mancante`);
    if(g.g && (!x.g || !Object.keys(g.g).every(k => k in x.g))) E(f, `en.gloss[${i}].g: servono le stesse chiavi olandesi`);
    if(g.t && !x.t) E(f, `en.gloss[${i}].t mancante`);
  });
  if(Array.isArray(o.hard)){
    if(!Array.isArray(en.hard) || en.hard.length !== o.hard.length) E(f, "en.hard deve avere gli stessi 8 esercizi in inglese");
    else o.hard.forEach((it, i) => { checkEn(f, it, en.hard[i], `en.hard[${i}]`); if(it.g && (!en.hard[i].g || !Object.keys(it.g).every(x => x in en.hard[i].g))) E(f, `en.hard[${i}]: g incompleto`); });
  }
}
function ordersets(){
  const f = "out/ordersets.json"; if(!fs.existsSync(DIR + f)) return E(f, "file mancante");
  const o = read(f), s = read("src/ordersets.json");
  s.forEach(st => {
    const x = o[st.id]; if(!x) return E(f, `serie ${st.id} mancante`);
    ["t", "s", "rule"].forEach(k => { if(!x[k] || x[k] === st[k]) E(f, `${st.id}.${k} mancante o non tradotto`); });
    if(!Array.isArray(x.items) || x.items.length !== st.items.length) return E(f, `${st.id}.items: servono ${st.items.length} frasi nello stesso ordine`);
    st.items.forEach((it, i) => { const y = x.items[i]; if(!y || !y.it || y.it === it.it) E(f, `${st.id}.items[${i}].it non tradotta`); if(!y || !y.e) E(f, `${st.id}.items[${i}].e mancante`); else if(ITA.test(strip(y.e))) W(f, `${st.id}.items[${i}].e: possibile italiano`); });
  });
}
function decks(){
  const f = "out/decks.json"; if(!fs.existsSync(DIR + f)) return E(f, "file mancante");
  const o = read(f), s = read("src/decks.json");
  s.forEach(d => {
    const x = o[d.id]; if(!x) return E(f, `mazzo ${d.id} mancante`);
    ["t", "s"].forEach(k => { if(!x[k]) E(f, `${d.id}.${k} mancante`); });
    if(!Array.isArray(x.cards) || x.cards.length !== d.cards.length) return E(f, `${d.id}.cards: servono ${d.cards.length} carte nello stesso ordine`);
    d.cards.forEach((c, i) => {
      const y = x.cards[i]; if(!Array.isArray(y) || y.length !== c.length) return E(f, `${d.id}.cards[${i}]: stessa lunghezza dell'originale`);
      if(y[0] !== c[0]) E(f, `${d.id}.cards[${i}][0]: l'olandese deve restare "${c[0]}"`);
      if(d.kind === "dehet"){ if(y[1] !== c[1]) E(f, `${d.id}.cards[${i}][1]: l'articolo deve restare "${c[1]}"`); }
      if(d.sayExtra && c[2] !== undefined && y[2] !== c[2]) E(f, `${d.id}.cards[${i}][2]: il dettaglio è olandese e deve restare identico`);
    });
  });
}
const args = process.argv.slice(2);
const list = args[0] === "all" ? fs.readdirSync(DIR + "src").filter(x => /^u\d+\.json$/.test(x)).map(x => x.slice(0, -5)).concat(["ordersets", "decks"]) : args;
list.forEach(x => x === "ordersets" ? ordersets() : x === "decks" ? decks() : unit(x));
console.log(`\n${errors} errori, ${warns} avvisi`);
process.exit(errors ? 1 : 0);
