// Percorre l'app in inglese e segnala testi senza traduzione (missingT) e parole italiane visibili nell'interfaccia.
import fs from "node:fs";
import { serve, browser, offlineFonts } from "./comune.mjs";
const out = "/tmp/patatino-test/shots4"; fs.mkdirSync(out, {recursive:true});
const { server, url } = await serve("/home/user/patatino"); const b = await browser();
const ctx = await b.newContext({locale:"en-GB", viewport:{width:360, height:780}, isMobile:true, hasTouch:true, deviceScaleFactor:2, userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"});
await offlineFonts(ctx);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
const ITA = /\b(il|della|delle|che|per|non|sono|questo|questa|tocca|torna|parola|frase|esercizi|lezione|impostazioni|percorso|scarica|ripasso|carte|mazzi|unità|giorni|errori|continua|inizia|indietro|sostieni|donazione|codice|dispositivo)\b/i;
const found = new Map();
let n = 0;
async function scan(name){
  await p.waitForTimeout(250);
  // testo dell'interfaccia: escludo spiegazioni e contenuti del corso (ancora in italiano finché non arriva la traduzione)
  const txt = await p.evaluate(() => {
    const skip = ".note,.vl,.vocab,.q,.mean,.opts,.hint,.ex,.cmp,.tr-it,.fc-txt,.fc-sub,.t .it,.next p,.dk-t,.grp-t span,.lesson-h p,.lesson-h h2,.rulebox,.wdiag,.bank,.slot,.unit .t,.bigword,.res > .label,.mod-chip,.dl-list,script,style";
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), out = [];
    while(w.nextNode()){ const n = w.currentNode, el = n.parentElement; if(!el || el.closest(skip) || !el.getClientRects().length) continue; const t = n.textContent.trim(); if(t) out.push(t); }
    return out.join("\n");
  });
  txt.split("\n").forEach(l => { if(ITA.test(l)) found.set(l.trim(), name); });
  await p.screenshot({path:`${out}/${String(++n).padStart(2, "0")}-${name}.png`});
}
await p.goto(url); await p.waitForTimeout(500);
console.log("lingua iniziale:", await p.evaluate(() => document.documentElement.lang));
await scan("home");
await p.click("#vox"); await scan("settings");
await p.click("#priv"); await scan("privacy"); await p.evaluate(() => history.back()); await p.waitForTimeout(200);
await p.click("#inst"); await scan("install"); await p.evaluate(() => history.back()); await p.waitForTimeout(200);
await p.click("#lbuy"); await scan("unlock");
await p.fill("#lic", "nope"); await p.click("#act"); await p.waitForTimeout(400); await scan("unlock-err");
await p.goto(url); await p.waitForTimeout(400);
await p.locator(".grp").first().locator(".unit").first().click(); await scan("lesson");
await p.locator(".pbtn").first().click(); await p.waitForTimeout(300); await scan("quiz-intro");
for(let k = 0; k < 40 && await p.evaluate(() => history.state.s) === "quiz"; k++){
  if(await p.locator("#nx").count()){ await p.click("#nx"); continue; }
  if(await p.locator(".opt").count()){ await p.locator(".opt").first().click(); await p.click("#chk"); if(k === 7) await scan("feedback"); continue; }
  break;
}
await scan("results");
await p.goto(url); await p.waitForTimeout(400);
await p.locator(".grp").first().locator(".unit").first().click(); await p.waitForTimeout(250);
await p.locator(".pbtn").nth(1).click(); await p.waitForTimeout(300);
for(let k = 0; k < 60 && await p.evaluate(() => history.state.s) === "quiz"; k++){
  if(await p.locator("#nx").count()){ await p.click("#nx"); continue; }
  if(await p.locator(".opt").count()){ await p.locator(".opt").first().click(); await p.click("#chk"); continue; }
  if(await p.locator("#ans").count()){ await p.fill("#ans", "x"); if(k < 30) await scan("fill"); await p.click("#chk"); continue; }
  if(await p.locator(".bank .tok").count()){ await p.locator(".bank .tok").first().click(); if(k < 40) await scan("tiles"); await p.click("#chk"); continue; }
  break;
}
await scan("results2");
await p.goto(url); await p.waitForTimeout(400); await p.locator(".tab").nth(1).click(); await scan("decks");
await p.locator(".deck:not(.locked)").nth(1).click(); await p.waitForTimeout(250); await scan("card");
await p.click("#flip"); await scan("card-flipped");
for(let k = 0; k < 40 && await p.evaluate(() => history.state.s) === "cards"; k++){ if(await p.locator("#flip").count()) await p.click("#flip"); if(await p.locator("#know").count()) await p.click("#know"); else break; await p.waitForTimeout(60); }
await scan("cards-done");
await p.goto(url); await p.waitForTimeout(400); await p.locator(".tab").nth(2).click(); await scan("sentences");
// sbloccato (modalità sviluppo)
await p.goto(url); await p.waitForTimeout(300); await p.click("#vox"); await p.click("#lbuy"); await p.fill("#lic", "TEST-PREMIUM-0000"); await p.click("#act");
await p.waitForFunction(() => window.__goesting.missingModules().length === 0, null, {timeout:8000}).catch(() => {});
await scan("premium");
await p.goto(url); await p.waitForTimeout(400); await p.locator(".tab").nth(2).click(); await p.locator(".deck").first().click(); await p.waitForTimeout(300); await scan("wo");
await p.goto(url); await p.waitForTimeout(400); await p.click("#vox"); await scan("settings-lic");
// torna all'italiano e poi di nuovo inglese
await p.click('[data-lang="it"]'); await p.waitForTimeout(200);
const itOK = /Impostazioni/.test(await p.locator(".settings-scr h2").innerText());
await p.click('[data-lang="en"]'); await p.waitForTimeout(200);
const enOK = /Settings/.test(await p.locator(".settings-scr h2").innerText());
console.log("cambio lingua it/en:", itOK, enOK);
const missing = await p.evaluate(() => [...window.__goesting.missingT]);
console.log("SENZA TRADUZIONE:", missing.length); missing.forEach(m => console.log("  -", m.slice(0, 120)));
console.log("RIGHE CON ITALIANO:", found.size); [...found].forEach(([l, s]) => console.log(`  [${s}] ${l.slice(0, 140)}`));
console.log("errori JS:", errs);
await b.close(); server.close();
