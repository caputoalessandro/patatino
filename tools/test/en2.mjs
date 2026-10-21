// Contenuti in inglese ed esercizi difficili, gratuiti e premium.
import fs from "node:fs";
import { serve, browser, offlineFonts } from "./comune.mjs";
const out = "/tmp/patatino-test/shots5"; fs.mkdirSync(out, {recursive:true});
const { server, url } = await serve("/home/user/patatino"); const b = await browser();
const fails = []; const ok = (c, m) => { console.log((c ? "OK  " : "FAIL") + " " + m); if(!c) fails.push(m); };
const ctx = await b.newContext({locale:"en-GB", viewport:{width:360, height:780}, isMobile:true, hasTouch:true, deviceScaleFactor:2});
await offlineFonts(ctx);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
const st = () => p.evaluate(() => history.state && history.state.s);
const openUnit = async (gi, ui) => { await p.goto(url); await p.waitForTimeout(400); const g = p.locator(".grp").nth(gi); if(!(await g.getAttribute("class")).includes("open")) await g.locator(".grp-h").click(); await g.locator(".unit").nth(ui).click(); await p.waitForTimeout(300); };
const ITA = /\b(della|delle|degli|nella|sono|anche|quando|perché|parola|frase|verbo|esempio|significa|italiano|cioè)\b/i;
await openUnit(0, 0);
const note = await p.locator(".note").innerText();
ok(!ITA.test(note) && /\b(the|you|is)\b/.test(note), "u1: spiegazione in inglese");
ok(/Subject pronouns|pronoun/i.test(await p.locator(".lesson-h p").innerText()), "u1: sottotitolo inglese (" + await p.locator(".lesson-h p").innerText() + ")");
const vocab = await p.locator(".vocab .m").allInnerTexts();
ok(vocab.length > 5 && vocab.every(m => !/\b(il|la|lo|essere|abitare)\b/.test(m)), "u1: lessico in inglese (" + vocab.slice(0, 4).join(", ") + ")");
ok(await p.locator("#p3").count() === 1, "u1: terza parte «Hard level»");
await p.screenshot({path:`${out}/lesson-en.png`, fullPage:true});
await p.click("#p3"); await p.waitForTimeout(300);
ok(await st() === "quiz", "parte difficile avviata");
let seen = 0, txts = [];
for(let k = 0; k < 40 && await st() === "quiz"; k++){
  if(await p.locator("#nx").count()){ await p.click("#nx"); continue; }
  txts.push(await p.locator(".pop .q, .pop .bigword").first().innerText().catch(() => "")); seen++;
  if(seen === 1) await p.screenshot({path:`${out}/hard-q.png`});
  if(await p.locator(".opt").count()){ await p.locator(".opt").first().click(); }
  else if(await p.locator("#ans").count()){ await p.fill("#ans", "x"); }
  else if(await p.locator(".bank .tok").count()){ await p.locator(".bank .tok").first().click(); }
  await p.click("#chk");
  if(seen === 2) await p.screenshot({path:`${out}/hard-fb.png`});
}
ok(await st() === "res", "parte difficile completata → risultati");
ok(/Part 3 · Hard level/i.test(await p.locator(".res .label").first().innerText()), "risultati: Part 3 · Hard level");
console.log("   domande viste:", txts.slice(0, 8).map(t => t.slice(0, 50)).join(" | "));
const S = JSON.parse(await p.evaluate(() => localStorage.getItem("goesting.v1")));
ok(S.hbest && "u1" in S.hbest, "punteggio parte 3 salvato");
ok(S.wrong.some(k => k.startsWith("h:u1:")), "errori della parte 3 nel ripasso");
// ripasso con errori h:
await p.goto(url); await p.waitForTimeout(300); await p.click("#rev"); await p.waitForTimeout(300);
ok(await st() === "quiz", "ripasso errori avviato (anche con esercizi difficili)");
// italiano
await p.goto(url); await p.waitForTimeout(300); await p.click("#vox"); await p.click('[data-lang="it"]'); await p.waitForTimeout(200);
await openUnit(0, 0);
ok(/Pronomi soggetto/.test(await p.locator(".lesson-h p").innerText()) && /Livello difficile/.test(await p.locator(".part-hard").innerText()), "in italiano: titoli e parte 3 in italiano");
ok(ITA.test(await p.locator(".note").innerText()), "in italiano: spiegazione in italiano");
await p.click("#vox").catch(() => {}); await p.goto(url); await p.waitForTimeout(300); await p.click("#vox"); await p.click('[data-lang="en"]'); await p.waitForTimeout(200);
// flashcard gratuita in inglese
await p.goto(url); await p.waitForTimeout(300); await p.locator(".tab").nth(1).click(); await p.waitForTimeout(200);
await p.locator(".deck", {hasText:"Family"}).first().click(); await p.waitForTimeout(250);
await p.click("#flip"); await p.waitForTimeout(250);
const back = await p.locator(".fc-b .fc-txt").innerText();
ok(!/\b(il|la|lo|l')\b/.test(back), "flashcard Famiglia in inglese (" + back + ")");
// premium sbloccato (sviluppo): unità 6 e 30, frasi e mazzi in inglese
await p.goto(url); await p.waitForTimeout(300); await p.click("#vox"); await p.click("#lbuy"); await p.fill("#lic", "TEST-PREMIUM-0000"); await p.click("#act");
await p.waitForFunction(() => window.__goesting.missingModules().length === 0, null, {timeout:10000}).catch(() => {});
await openUnit(1, 0);
ok(!ITA.test(await p.locator(".note").innerText()) && /plural/i.test(await p.locator(".lesson-h p").innerText()), "u6 (premium): inglese");
ok(await p.locator("#p3").count() === 1, "u6: parte difficile presente");
await openUnit(5, 4);
ok(!ITA.test(await p.locator(".note").innerText()), "u30 (premium): inglese");
await p.click("#p3"); await p.waitForTimeout(300); ok(await st() === "quiz", "u30: parte difficile avviata");
await p.goto(url); await p.waitForTimeout(300); await p.locator(".tab").nth(2).click(); await p.waitForTimeout(200);
const sets = await p.locator(".deck .dk-t b").allInnerTexts();
ok(sets.length === 14 && sets.every(s => !ITA.test(s) && !/\b(il|la|nella)\b/i.test(s)), "frasi: titoli in inglese (" + sets.slice(0, 3).join(", ") + ")");
await p.locator(".deck").first().click(); await p.waitForTimeout(300);
const q = await p.locator(".pop .q").first().innerText().catch(() => "");
ok(q && !ITA.test(q), "frasi: frase da costruire in inglese (" + q + ")");
await p.screenshot({path:`${out}/wo-en.png`});
await p.goto(url); await p.waitForTimeout(300); await p.locator(".tab").nth(1).click(); await p.waitForTimeout(200);
await p.locator(".deck", {hasText:"Irregular"}).first().click().catch(() => {}); await p.waitForTimeout(250);
ok(await st() === "cards", "mazzo premium in inglese apribile");
ok(errs.length === 0, "nessun errore JS " + errs.join(" | "));
const missing = await p.evaluate(() => [...window.__goesting.missingT]); ok(missing.length === 0, "nessun testo senza traduzione " + missing.join(" | "));
await b.close(); server.close(); process.exit(fails.length ? 1 : 0);
