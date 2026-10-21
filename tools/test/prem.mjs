import fs from "node:fs";
import { createRequire } from "node:module";
import { serve, offlineFonts } from "./comune.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const out = "/tmp/patatino-test/shots3"; fs.mkdirSync(out, {recursive:true});
const SRC = "/home/user/patatino/premium-src";
const { server, url } = await serve("/home/user/patatino");
const port = new URL(url).port;
const b = await chromium.launch({executablePath:"/opt/pw-browsers/chromium", args:["--host-resolver-rules=MAP patatino.test 127.0.0.1"]}).catch(() => chromium.launch({args:["--host-resolver-rules=MAP patatino.test 127.0.0.1"]}));
const PROD = `http://patatino.test:${port}/patatino/`;     // host "vero": niente modalità sviluppo
const fails = []; const ok = (c, m) => { console.log((c ? "OK  " : "FAIL") + " " + m); if(!c) fails.push(m); };
const errors = [];
const IPH = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
async function pg(opts = {}){
  const ctx = await b.newContext({locale:"it-IT", viewport:{width:360, height:780}, isMobile:true, hasTouch:true, deviceScaleFactor:2, userAgent:IPH, acceptDownloads:true});
  await offlineFonts(ctx);
  await ctx.addInitScript(() => sessionStorage.setItem("patatino.nudged", "1"));
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(e.message));
  return {ctx, page};
}
const openG = async (p, i) => { const g = p.locator(".grp").nth(i); if(!(await g.getAttribute("class")).includes("open")) await g.locator(".grp-h").click(); await p.waitForTimeout(120); return g; };
const st = (p) => p.evaluate(() => history.state && history.state.s);
const lic = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("goesting.license") || "null"));
const noOverflow = (p) => p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
// API finta: risposte configurabili per percorso
function mockApi(ctx, handlers){
  const seen = [];
  return ctx.route(/\/api\//, async (route) => {
    const req = route.request(); const path = new URL(req.url()).pathname.replace(/^.*\/api/, "");
    seen.push({path, body:req.postData(), headers:req.headers()});
    const h = handlers[path] || (path.startsWith("/modules/") ? handlers.modules : null);
    if(!h) return route.fulfill({status:404, body:"not found"});
    return h(route, path, req);
  }).then(() => seen);
}
const json = (route, data, status = 200) => route.fulfill({status, contentType:"application/json", body:JSON.stringify(data)});
const moduleFromSrc = (route, path) => route.fulfill({status:200, contentType:"application/json", body:fs.readFileSync(`${SRC}/module-${path.split("/").pop()}.json`, "utf8")});

/* 1) versione gratuita */
{
  const {ctx, page} = await pg();
  await page.goto(url); await page.waitForTimeout(400);
  ok(await page.locator(".grp.glock").count() === 5, "5 moduli premium con lucchetto");
  const g2 = await openG(page, 1);
  ok(await g2.locator(".unit.locked").count() === 5, "unità del modulo 2 bloccate e visibili");
  ok(/Il plurale/.test(await page.locator(".grp.glock").first().innerText()), "titoli premium visibili");
  ok(await noOverflow(page), "home senza scroll orizzontale");
  await page.screenshot({path:`${out}/01-home-free.png`, fullPage:true});
  await g2.locator(".unit.locked").first().click(); await page.waitForTimeout(300);
  ok(await st(page) === "unlock", "unità bloccata → Sblocca tutto");
  ok(await page.locator("#buy").isDisabled() && /Presto disponibile/.test(await page.locator("#buy").innerText()), "Acquista disabilitato: Presto disponibile");
  ok(/da 1\s€/.test(await page.locator(".price").innerText()) && /Donazione libera/i.test(await page.locator(".price").innerText()), "donazione libera da 1 €");
  ok(!/acquist|prezzo|Premium/i.test(await page.locator(".unlock").innerText()), "nessun riferimento ad acquisto/prezzo/Premium");
  ok(await noOverflow(page), "sblocca senza scroll orizzontale");
  await page.screenshot({path:`${out}/02-unlock.png`, fullPage:true});
  await page.evaluate(() => history.back()); await page.waitForTimeout(200);
  ok(await st(page) === "home", "indietro → home");
  // modulo gratuito funziona
  await (await openG(page, 0)).locator(".unit").first().click(); await page.waitForTimeout(250);
  ok(await st(page) === "lesson" && (await page.locator(".note").innerText()).length > 200, "unità 1 aperta con la spiegazione");
  await page.evaluate(() => history.back()); await page.waitForTimeout(200);
  // Frasi bloccate
  await page.locator(".tab").nth(2).click(); await page.waitForTimeout(250);
  ok(await page.locator(".deck.locked").count() === 14, "14 serie di frasi bloccate");
  await page.locator(".deck.locked").first().click(); await page.waitForTimeout(250);
  ok(await st(page) === "unlock", "frasi bloccate → Sblocca tutto");
  // flashcard: alcuni mazzi bloccati
  await page.evaluate(() => history.back()); await page.waitForTimeout(250);
  await page.locator(".tab").nth(1).click(); await page.waitForTimeout(250);
  ok(await page.locator(".deck.locked").count() === 11 && await page.locator(".deck:not(.locked)").count() === 7, "flashcard: 11 mazzi bloccati, 7 liberi");
  await page.screenshot({path:`${out}/09-decks-free.png`, fullPage:true});
  await page.locator(".deck:not(.locked)").first().click(); await page.waitForTimeout(250);
  ok(await st(page) === "cards", "mazzo libero si apre");
  await page.evaluate(() => history.back()); await page.waitForTimeout(250);
  await page.locator(".deck.locked").first().click(); await page.waitForTimeout(250);
  ok(await st(page) === "unlock", "mazzo bloccato → Sostieni Patatino");
  // settings: licenza gratuita
  await page.goto(url); await page.waitForTimeout(300);
  await page.click("#vox"); await page.waitForTimeout(200);
  ok(/libero per tutti/.test(await page.locator(".lic-box").innerText()), "impostazioni: invito a sostenere");
  ok(await page.locator(".pal").count() === 0 && !/Colori/.test(await page.locator(".settings-scr").innerText()), "nessun selettore di colore");
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toUpperCase()) === "#F5D130", "colore classico");
  ok(await page.locator(".lic-box details.lost").count() === 1, "link Hai perso il codice?");
  await ctx.close();
}

/* 2) modalità sviluppo (127.0.0.1, nessun Worker) */
{
  const {ctx, page} = await pg();
  await page.goto(url); await page.waitForTimeout(300);
  await page.evaluate(() => localStorage.setItem("goesting.v1", JSON.stringify({xp:77, best:{u1:90, u2:85}, vbest:{u1:100}, vblk:{"u1:0":100}, palette:"frietkot"})));
  await page.goto(url + "#x"); await page.reload(); await page.waitForTimeout(300);
  await (await openG(page, 1)).locator(".unit").first().click(); await page.waitForTimeout(250);
  await page.fill("#lic", "abcd-1234"); await page.click("#act"); await page.waitForTimeout(400);
  ok(/TEST-PREMIUM-0000/.test(await page.locator("#umsg").innerText()), "sviluppo: codice sbagliato → solo codice di prova");
  await page.fill("#lic", "  test-premium-0000 "); await page.click("#act");
  await page.waitForSelector(".party", {timeout:3000}).catch(() => {});
  ok(await page.locator(".party").count() === 1, "festa della mascotte dopo lo sblocco");
  await page.waitForTimeout(250);
  await page.screenshot({path:`${out}/03-party.png`});
  await page.waitForFunction(() => /sul telefono/.test(document.querySelector(".dl-t") ? document.querySelector(".dl-t").innerText : ""), null, {timeout:8000}).catch(() => {});
  ok(/Tutti i moduli/.test(await page.locator(".dl-t").innerText()), "download 5/5 completato");
  await page.screenshot({path:`${out}/04-downloaded.png`, fullPage:true});
  const l = await lic(page);
  ok(l && l.key === "TEST-PREMIUM-0000" && l.dev && l.instanceId, "licenza di sviluppo salvata (codice ripulito)");
  await page.click("#go"); await page.waitForTimeout(250);
  ok(await page.locator(".grp.glock").count() === 0, "nessun lucchetto dopo lo sblocco");
  await (await openG(page, 5)).locator(".unit").last().click(); await page.waitForTimeout(300);
  ok(await st(page) === "lesson" && /Punteggiatura/.test(await page.locator(".lesson-h").innerText()) && (await page.locator(".note").innerText()).length > 200, "unità 30 aperta con i contenuti scaricati");
  await page.locator(".pbtn").last().click(); await page.waitForTimeout(300);
  ok(await st(page) === "quiz", "esercizio premium avviato");
  // offline: niente rete per premium-src e /api, i moduli vengono da IndexedDB
  await ctx.route(/premium-src|\/api\//, r => r.abort());
  await page.goto(url); await page.waitForTimeout(600);
  await (await openG(page, 1)).locator(".unit").first().click(); await page.waitForTimeout(300);
  ok(await st(page) === "lesson" && (await page.locator(".note").innerText()).length > 200, "dopo il ricaricamento i moduli funzionano offline");
  await page.locator(".tab").nth(2).click().catch(() => {}); await page.goto(url); await page.waitForTimeout(400);
  await page.locator(".tab").nth(2).click(); await page.waitForTimeout(250);
  ok(await page.locator(".deck.locked").count() === 0, "frasi sbloccate");
  await page.locator(".deck").first().click(); await page.waitForTimeout(250);
  ok(await st(page) === "quiz", "frasi premium avviate");
  await page.goto(url); await page.waitForTimeout(400); await page.locator(".tab").nth(1).click(); await page.waitForTimeout(250);
  ok(await page.locator(".deck.locked").count() === 0 && await page.locator(".deck").count() === 18, "flashcard: tutti i 18 mazzi sbloccati (anche offline)");
  await page.locator(".deck", {hasText:"Verbi irregolari · i più comuni"}).click(); await page.waitForTimeout(250);
  ok(await st(page) === "cards", "mazzo sbloccato si apre");
  // export include la licenza
  await page.goto(url); await page.waitForTimeout(400); await page.click("#vox"); await page.waitForTimeout(200);
  ok(/TEST-••••-••••-0000/.test(await page.locator(".lic-box").innerText()), "codice nascosto: TEST-••••-••••-0000");
  ok(/modalità sviluppo/.test(await page.locator(".lic-box").innerText()), "ultima verifica: modalità sviluppo");
  await page.screenshot({path:`${out}/05-settings-lic.png`, fullPage:true});
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#exp")]);
  const p = out + "/bk.json"; await dl.saveAs(p);
  const f = JSON.parse(fs.readFileSync(p, "utf8"));
  ok(f.data["goesting.license"] && JSON.parse(f.data["goesting.license"]).instanceId === l.instanceId, "backup contiene chiave e instanceId");
  // rimozione (sviluppo: niente server)
  await page.click("#lrm"); await page.waitForTimeout(150); await page.click("#mok"); await page.waitForTimeout(400);
  ok(await lic(page) === null, "licenza rimossa");
  ok(/rimossa/.test(await page.locator(".lic-box").innerText()), "messaggio rimozione");
  ok(JSON.parse(await page.evaluate(() => localStorage.getItem("goesting.v1"))).xp === 77, "progressi intatti dopo la rimozione");
  await page.goto(url); await page.waitForTimeout(400);
  ok(await page.locator(".grp.glock").count() === 5, "di nuovo bloccato");
  // ripristino del backup: la licenza torna e i moduli si riscaricano
  await ctx.unroute(/premium-src|\/api\//);
  await page.click("#vox"); await page.waitForTimeout(200);
  await page.setInputFiles("#imp", p); await page.waitForTimeout(300);
  await Promise.all([page.waitForEvent("load"), page.click("#mok")]); await page.waitForTimeout(1500);
  ok((await lic(page)) && (await lic(page)).key === "TEST-PREMIUM-0000", "backup ripristina la licenza");
  ok(await page.evaluate(() => window.__goesting.missingModules().length) === 0, "moduli riscaricati da soli dopo il ripristino");
  await ctx.close();
}

/* 3) API simulate su un host "vero" (niente modalità sviluppo) */
const CASES = [["not_found", /non lo riconosco/], ["wrong_product", /altro prodotto/], ["limit_reached", /3 dispositivi.*Rimuovi la licenza da un altro dispositivo.*\[EMAIL\]/s], ["refunded", /non è più attivo/]];
{
  const {ctx, page} = await pg();
  let mode = "not_found";
  const seen = await mockApi(ctx, {
    "/license/activate": (r) => mode === "offline" ? r.abort() : mode === "ok" ? json(r, {valid:true, instanceId:"inst-42"}) : mode === "500" ? r.fulfill({status:502, body:"bad gateway"}) : json(r, {valid:false, reason:mode}, 400),
    modules: moduleFromSrc
  });
  await page.goto(PROD + "#"); await page.waitForTimeout(400);
  ok(await page.evaluate(() => location.hostname) === "patatino.test", "host di produzione simulato");
  await page.goto(PROD); await page.waitForTimeout(300);
  await page.evaluate(() => { history.pushState({s:"x"}, ""); }); 
  await page.goto(PROD); await page.waitForTimeout(300);
  await (await openG(page, 1)).locator(".unit").first().click(); await page.waitForTimeout(250);
  for(const [reason, re] of CASES){
    mode = reason; await page.fill("#lic", "8f3a 1111 2222 4b10"); await page.click("#act"); await page.waitForTimeout(300);
    ok(re.test(await page.locator("#umsg").innerText()), `messaggio: ${reason}`);
  }
  await page.screenshot({path:`${out}/06-limit.png`, fullPage:true});
  mode = "offline"; await page.click("#act"); await page.waitForTimeout(300);
  ok(/Non riesco a collegarmi/.test(await page.locator("#umsg").innerText()), "messaggio: nessuna connessione");
  mode = "500"; await page.click("#act"); await page.waitForTimeout(300);
  ok(/Non riesco a collegarmi/.test(await page.locator("#umsg").innerText()), "errore 5xx trattato come server non raggiungibile");
  mode = "TEST-PREMIUM-0000"; await page.fill("#lic", "TEST-PREMIUM-0000"); mode = "not_found"; await page.click("#act"); await page.waitForTimeout(300);
  ok(await lic(page) === null, "codice di prova rifiutato fuori dallo sviluppo");
  mode = "ok"; await page.fill("#lic", "8f3a-1111-2222-4b10 "); await page.click("#act");
  await page.waitForFunction(() => window.__goesting.missingModules().length === 0, null, {timeout:8000}).catch(() => {});
  const act = seen.filter(x => x.path === "/license/activate").pop();
  const body = JSON.parse(act.body);
  ok(body.key === "8F3A-1111-2222-4B10" && body.deviceName === "iPhone – Safari", `POST activate { key, deviceName } = ${act.body}`);
  const l = await lic(page);
  ok(l.instanceId === "inst-42" && l.valid && l.lastCheck, "salvati chiave, instanceId e data di verifica");
  const mods = seen.filter(x => x.path.startsWith("/modules/"));
  ok(mods.length === 5 && mods.every(m => m.headers["x-license-key"] === "8F3A-1111-2222-4B10"), "moduli scaricati con X-License-Key (" + mods.map(m => m.path).join(" ") + ")");
  ok(!fs.existsSync("x") , "");
  await ctx.close();
}

/* 4) riverifica all'avvio */
async function withLicense(lastCheckDaysAgo, validate, checks, name){
  const {ctx, page} = await pg();
  const calls = await mockApi(ctx, {"/license/validate": validate, modules: moduleFromSrc});
  await ctx.addInitScript((d) => {
    if(!localStorage.getItem("goesting.license")) {
      localStorage.setItem("goesting.license", JSON.stringify({key:"8F3A-1111-2222-4B10", instanceId:"inst-42", valid:true, device:"iPhone – Safari", lastCheck:new Date(Date.now() - d * 864e5).toISOString()}));
      localStorage.setItem("goesting.v1", JSON.stringify({xp:500, best:{u1:90, u6:88}, vbest:{u6:90}, vblk:{"u6:0":90}, palette:"frietkot"}));
    }
  }, lastCheckDaysAgo);
  await page.goto(PROD); await page.waitForTimeout(1500);
  await checks(page, calls.filter(c => c.path === "/license/validate"));
  await ctx.close();
}
await withLicense(2, (r) => json(r, {valid:false, reason:"refunded"}), async (page, calls) => {
  ok(calls.length === 0, "verifica recente (2 giorni): nessuna chiamata");
  ok(await page.evaluate(() => window.__goesting.isPremium()), "resta premium");
});
await withLicense(8, (r) => json(r, {valid:false, reason:"refunded"}), async (page, calls) => {
  ok(calls.length === 1 && JSON.parse(calls[0].body).instanceId === "inst-42", "dopo 8 giorni: POST validate { key, instanceId }");
  ok(!(await page.evaluate(() => window.__goesting.isPremium())), "rimborso: moduli richiusi");
  ok(await page.locator(".grp.glock").count() === 5, "rimborso: lucchetti di nuovo visibili");
  const S = JSON.parse(await page.evaluate(() => localStorage.getItem("goesting.v1")));
  ok(S.xp === 500 && S.best.u6 === 88, "rimborso: progressi conservati");
  await page.click("#vox"); await page.waitForTimeout(200);
  ok(/non più valido/.test(await page.locator(".lic-box").innerText()), "impostazioni: codice non più valido");
  await page.screenshot({path:`${out}/07-revoked.png`, fullPage:true});
});
await withLicense(8, (r) => r.abort(), async (page, calls) => {
  ok(calls.length === 1 && await page.evaluate(() => window.__goesting.isPremium()), "offline durante la verifica: resta sbloccato");
  ok(await page.locator(".grp.glock").count() === 0, "offline: niente lucchetti");
});
await withLicense(8, (r) => r.fulfill({status:503, body:"down"}), async (page) => {
  ok(await page.evaluate(() => window.__goesting.isPremium()), "server in errore: resta sbloccato");
});
await withLicense(8, (r) => r.fulfill({status:404, contentType:"text/html", body:"<h1>404</h1>"}), async (page) => {
  ok(await page.evaluate(() => window.__goesting.isPremium()), "risposta non JSON: resta sbloccato");
});
await withLicense(8, (r) => json(r, {valid:true}), async (page) => {
  const l = await lic(page);
  ok(Date.now() - new Date(l.lastCheck) < 60000, "verifica positiva: data aggiornata");
});

/* 5) rimozione con server online e offline */
for(const online of [true, false]){
  const {ctx, page} = await pg();
  const calls = await mockApi(ctx, {"/license/deactivate": (r) => online ? json(r, {ok:true}) : r.abort(), "/license/validate": (r) => json(r, {valid:true}), modules: moduleFromSrc});
  await ctx.addInitScript(() => { if(!localStorage.getItem("goesting.license")) localStorage.setItem("goesting.license", JSON.stringify({key:"8F3A-1111-2222-4B10", instanceId:"inst-42", valid:true, lastCheck:new Date().toISOString()})); });
  await page.goto(PROD); await page.waitForTimeout(800);
  await page.click("#vox"); await page.waitForTimeout(200);
  ok(/8F3A-••••-••••-4B10/.test(await page.locator(".lic-box").innerText()), "codice mascherato 8F3A-••••-••••-4B10");
  await page.click("#lrm"); await page.waitForTimeout(150); await page.click("#mok"); await page.waitForTimeout(500);
  if(!online){
    ok(/Sei offline/.test(await page.locator(".modal").innerText().catch(() => "")), "offline: avviso attivazione occupata");
    await page.screenshot({path:`${out}/08-offline-remove.png`});
    await page.click("#mok"); await page.waitForTimeout(400);
    ok(/ancora occupata/.test(await page.locator(".lic-box").innerText()), "offline: messaggio dopo la rimozione");
  } else {
    const d = calls.filter(c => c.path === "/license/deactivate");
    ok(d.length === 1 && JSON.parse(d[0].body).instanceId === "inst-42", "online: POST deactivate { key, instanceId }");
  }
  ok(await lic(page) === null, (online ? "online" : "offline") + ": stato locale rimosso");
  await ctx.close();
}

ok(errors.length === 0, "nessun errore JS " + errors.join(" | "));
await b.close(); server.close(); process.exit(fails.length ? 1 : 0);
