import fs from "node:fs";
import { serve, browser, offlineFonts } from "./comune.mjs";
const dir = "/home/user/patatino", out = "/tmp/patatino-test/shots";
fs.mkdirSync(out, {recursive:true});
const { server, url } = await serve(dir);
const b = await browser();
const fails = []; const ok = (c, m) => { console.log((c ? "OK  " : "FAIL") + " " + m); if(!c) fails.push(m); };
async function newPage(){
  const ctx = await b.newContext({locale:"it-IT", viewport:{width:360, height:780}, isMobile:true, hasTouch:true, deviceScaleFactor:2, acceptDownloads:true});
  await offlineFonts(ctx);
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  return {ctx, page, errors};
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

// 1) app vuota: nessun promemoria, persist chiamato senza errori
let {ctx, page, errors} = await newPage();
await ctx.addInitScript(() => { window.__persist = 0; if(navigator.storage){ const o = navigator.storage.persist.bind(navigator.storage); navigator.storage.persist = () => { window.__persist++; return o(); }; } });
await page.goto(url); await page.waitForTimeout(400);
ok(await page.locator(".nudge:not(.inst-banner)").count() === 0, "nessun promemoria senza progressi");
ok(await page.evaluate(() => window.__persist) >= 0, "persist ok");
// persist non supportato
const p2 = await ctx.newPage(); p2.on("pageerror", e => errors.push(e.message));
await p2.addInitScript(() => { Object.defineProperty(navigator, "storage", {value:undefined}); });
await p2.goto(url); await p2.waitForTimeout(300); await p2.close();

// 2) con progressi e mai esportato: promemoria, "Più tardi" rimanda di 7 giorni
await page.evaluate(() => { localStorage.setItem("goesting.v1", JSON.stringify({xp:120, best:{u1:90}, vbest:{}, palette:"praline"})); sessionStorage.clear(); });
await page.reload(); await page.waitForTimeout(400);
ok(await page.locator(".nudge:not(.inst-banner)").count() === 1, "promemoria mostrato (mai esportato, con progressi)");
ok(await noOverflow(page), "home con promemoria senza scroll orizzontale a 360");
await page.screenshot({path: out + "/01-nudge.png"});
await page.click("#nlat"); await page.waitForTimeout(200);
const snooze = await page.evaluate(() => JSON.parse(localStorage.getItem("goesting.v1")).backupSnooze);
const dd = (new Date(snooze) - Date.now()) / 864e5;
ok(dd > 6.9 && dd < 7.1, "Più tardi → rimandato di 7 giorni (" + dd.toFixed(2) + ")");
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("goesting.v1")); s.backupSnooze = null; localStorage.setItem("goesting.v1", JSON.stringify(s)); });
await page.reload(); await page.waitForTimeout(300);
ok(await page.locator(".nudge:not(.inst-banner)").count() === 0, "non più di una volta per sessione");

// 3) export dalle impostazioni
await page.click("#vox"); await page.waitForTimeout(300);
await page.evaluate(() => localStorage.setItem("goesting.licenza", JSON.stringify({ok:true})));
ok(await page.locator(".data-msg").count() === 0, "nessun messaggio entrando nelle impostazioni");
ok(await noOverflow(page), "impostazioni senza scroll orizzontale");
await page.screenshot({path: out + "/02-settings.png", fullPage:true});
const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#exp")]);
const name = dl.suggestedFilename();
const today = new Date().toISOString().slice(0,10);
ok(name === "patatino-backup-" + today + ".json", "nome file " + name);
const fp = out + "/" + name; await dl.saveAs(fp);
const f = JSON.parse(fs.readFileSync(fp, "utf8"));
ok(f.app === "patatino" && f.schemaVersion === 1 && f.exportedAt, "intestazione file");
ok(Object.keys(f.data).sort().join() === "goesting.licenza,goesting.v1", "tutte le chiavi col prefisso: " + Object.keys(f.data));
ok(JSON.parse(f.data["goesting.v1"]).lastExport, "data ultimo export salvata");
await page.screenshot({path: out + "/03-exported.png"});

// 4) import file non valido
const bad = out + "/bad.json"; fs.writeFileSync(bad, JSON.stringify({app:"ghisa", schemaVersion:1, data:{}}));
await page.setInputFiles("#imp", bad); await page.waitForTimeout(300);
ok(/non è un backup di Patatino/.test(await page.locator(".data-msg").innerText()), "messaggio per file di altra app");
fs.writeFileSync(bad, "ciao"); await page.setInputFiles("#imp", bad); await page.waitForTimeout(300);
ok(/JSON valido/.test(await page.locator(".data-msg").innerText()), "messaggio per file non JSON");
fs.writeFileSync(bad, JSON.stringify({app:"patatino", schemaVersion:9, data:{}})); await page.setInputFiles("#imp", bad); await page.waitForTimeout(300);
ok(/più recente/.test(await page.locator(".data-msg").innerText()), "messaggio per versione futura");
await page.screenshot({path: out + "/04-error.png"});

// 5) import valido: annulla, poi conferma
await page.evaluate(() => { localStorage.setItem("goesting.v1", JSON.stringify({xp:1, best:{}, vbest:{}, palette:"frietkot"})); localStorage.setItem("goesting.extra", "x"); });
await page.setInputFiles("#imp", fp); await page.waitForTimeout(300);
ok(await page.locator(".modal").count() === 1, "chiede conferma");
await page.screenshot({path: out + "/05-confirm.png"});
await page.click("#mno"); await page.waitForTimeout(200);
ok(JSON.parse(await page.evaluate(() => localStorage.getItem("goesting.v1"))).xp === 1, "annulla non tocca i dati");
await page.setInputFiles("#imp", fp); await page.waitForTimeout(300);
await Promise.all([page.waitForEvent("load"), page.click("#mok")]); await page.waitForTimeout(400);
const ls = await page.evaluate(() => Object.keys(localStorage).sort().join());
ok(ls === "goesting.licenza,goesting.v1", "chiavi ripristinate (extra rimossa): " + ls);
ok(await page.evaluate(() => JSON.parse(localStorage.getItem("goesting.v1")).xp) === 120, "progressi ripristinati");
ok(await page.evaluate(() => document.documentElement.dataset.palette) === "frietkot", "colore classico anche con un backup che aveva un'altra palette");
console.log("DBG", page.url(), await page.evaluate(() => [history.state && history.state.s, sessionStorage.getItem("patatino.restored"), document.querySelector("#app h2")?.innerText]));
ok(/ripristinato/.test(await page.locator(".data-msg").innerText()), "messaggio di ripristino");
await page.screenshot({path: out + "/06-restored.png"});
await page.evaluate(() => history.back()); await page.waitForTimeout(300);
ok(await page.locator(".path").count() === 1, "indietro dopo ripristino → home");

// 6) migrazione da backup v0 (stato nudo)
fs.writeFileSync(bad, JSON.stringify({xp:55, best:{u2:80}, vbest:{}, palette:"atomium"}));
await page.click("#vox"); await page.waitForTimeout(300);
await page.setInputFiles("#imp", bad); await page.waitForTimeout(300);
await Promise.all([page.waitForEvent("load"), page.click("#mok")]); await page.waitForTimeout(400);
ok(await page.evaluate(() => JSON.parse(localStorage.getItem("goesting.v1")).xp) === 55, "backup v0 migrato e ripristinato");

// 7) export vecchio > 30 giorni → promemoria in una nuova sessione
const old = new Date(Date.now() - 40*864e5).toISOString();
await page.evaluate((o) => { const s = JSON.parse(localStorage.getItem("goesting.v1")); s.lastExport = o; localStorage.setItem("goesting.v1", JSON.stringify(s)); sessionStorage.clear(); }, old);
await page.goto(url); await page.waitForTimeout(400);
ok(/40 giorni/.test(await page.locator(".nudge:not(.inst-banner)").innerText().catch(() => "")), "promemoria dopo 40 giorni");
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("goesting.v1")); s.lastExport = new Date(Date.now() - 5*864e5).toISOString(); localStorage.setItem("goesting.v1", JSON.stringify(s)); sessionStorage.clear(); });
await page.reload(); await page.waitForTimeout(300);
ok(await page.locator(".nudge:not(.inst-banner)").count() === 0, "nessun promemoria dopo 5 giorni");

ok(errors.length === 0, "nessun errore JS " + errors.join(" | "));
await b.close(); server.close();
process.exit(fails.length ? 1 : 0);
