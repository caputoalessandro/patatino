import fs from "node:fs";
import { serve, browser, offlineFonts } from "./comune.mjs";
const out = "/tmp/patatino-test/shots2"; fs.mkdirSync(out, {recursive:true});
const { server, url } = await serve("/home/user/patatino");
const b = await browser();
const fails = []; const ok = (c, m) => { console.log((c ? "OK  " : "FAIL") + " " + m); if(!c) fails.push(m); };
const UA = {
  iosSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  iosChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1",
  iosFirefox: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/141.0 Mobile/15E148 Safari/605.1.15",
  iosInsta: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 389.0.0.26.84 (iPhone15,3; iOS 18_5; it_IT; it; scale=3.00; 1290x2796; 761276581)",
  iosFB: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/520.0.0.38.101;FBBV/1;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBCR/;FBID/phone;FBLC/it_IT;FBOP/80]",
  iosMessenger: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LightSpeed [FBAN/MessengerLiteForiOS;FBAV/520.0.0.30.106;FBBV/1;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/18.5;FBSS/3;FBCR/;FBID/phone;FBLC/it_IT;FBOP/0]",
  iosTikTok: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_40.5.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/it Region/IT",
  iosWA: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/25.20.79",
  andChrome: "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
  andSamsung: "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
  andEdge: "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 EdgA/138.0.0.0",
  andInsta: "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.63 Mobile Safari/537.36 Instagram 389.0.0.49.87 Android",
  desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
};
const EXP = {iosSafari:"ios-safari", iosChrome:"ios-other", iosFirefox:"ios-other", iosInsta:"inapp", iosFB:"inapp", iosMessenger:"inapp", iosTikTok:"inapp", iosWA:"inapp", andChrome:"android", andSamsung:"android", andEdge:"android", andInsta:"inapp", desktop:"desktop"};
const errors = [];
async function pg(ua, opts = {}){
  const ctx = await b.newContext({locale:"it-IT", viewport:{width:360, height:780}, isMobile:true, hasTouch:true, deviceScaleFactor:2, userAgent:ua, ...opts});
  await offlineFonts(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(ua.slice(0, 30) + ": " + e.message));
  return {ctx, page};
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

// 1) rilevamento + schermata guida per ogni contesto
for(const [k, ua] of Object.entries(UA)){
  const {ctx, page} = await pg(ua);
  await page.goto(url); await page.waitForTimeout(250);
  const c = await page.evaluate(() => window.__goesting.installContext());
  ok(c.k === EXP[k], `${k} → ${JSON.stringify(c)}`);
  await page.click("#vox"); await page.waitForTimeout(200);
  ok(await page.locator("#inst").count() === 1, `${k}: bottone Installa nelle impostazioni`);
  await page.click("#inst"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => history.state && history.state.s) === "install", `${k}: apre la guida`);
  ok(await noOverflow(page), `${k}: guida senza scroll orizzontale`);
  await page.screenshot({path: `${out}/${k}.png`, fullPage:true});
  if(c.k === "inapp" || k === "iosChrome"){
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
    await page.click("#copy"); await page.waitForTimeout(200);
    ok(/copiato|qui sotto/.test(await page.locator("#copy").innerText()), `${k}: Copia link reagisce (${await page.locator("#copy").innerText()})`);
  }
  if(k === "iosInsta") ok(/Apri questa pagina in Safari/.test(await page.locator("h2").innerText()), "Instagram iOS: titolo Safari");
  if(k === "andInsta") ok(/Chrome/.test(await page.locator("h2").innerText()), "Instagram Android: titolo Chrome");
  await page.evaluate(() => history.back()); await page.waitForTimeout(250);
  ok(await page.evaluate(() => history.state && history.state.s) === "settings", `${k}: indietro → impostazioni`);
  await ctx.close();
}

// 2) standalone: niente bottone, niente banner
{
  const {ctx, page} = await pg(UA.iosSafari);
  await page.addInitScript(() => { Object.defineProperty(navigator, "standalone", {value:true}); localStorage.setItem("goesting.v1", JSON.stringify({xp:50, best:{u1:90}, vbest:{}, vblk:{"u1:0":90}, lastExport:new Date().toISOString()})); });
  await page.goto(url); await page.waitForTimeout(250);
  ok((await page.evaluate(() => window.__goesting.installContext())).k === "installed", "standalone rilevato");
  ok(await page.locator(".inst-banner").count() === 0, "standalone: nessun banner");
  await page.click("#vox"); await page.waitForTimeout(200);
  ok(await page.locator("#inst").count() === 0, "standalone: nessun bottone");
  await ctx.close();
}

// 3) banner solo dopo la prima lezione; chiudi = 14 giorni
{
  const {ctx, page} = await pg(UA.iosSafari);
  await page.addInitScript(() => sessionStorage.setItem("patatino.nudged", "1"));
  await page.goto(url); await page.waitForTimeout(250);
  ok(await page.locator(".inst-banner").count() === 0, "nessun banner prima della prima lezione");
  await page.evaluate(() => { localStorage.setItem("goesting.v1", JSON.stringify({xp:50, best:{}, vbest:{u1:90}, vblk:{"u1:0":90}, lastExport:new Date().toISOString()})); });
  await page.reload(); await page.waitForTimeout(250);
  ok(await page.locator(".inst-banner").count() === 1, "banner dopo la prima lezione superata");
  ok(/Ti è piaciuto\? Mettimi sulla schermata Home così mi ritrovi subito!/.test(await page.locator(".inst-banner").innerText()), "testo del banner");
  await page.screenshot({path: `${out}/banner-home.png`});
  await page.click(".inst-banner .nudge-x"); await page.waitForTimeout(150);
  const sn = await page.evaluate(() => JSON.parse(localStorage.getItem("goesting.v1")).installSnooze);
  const dd = (new Date(sn) - Date.now()) / 864e5;
  ok(dd > 13.9 && dd < 14.1, "chiuso → 14 giorni (" + dd.toFixed(2) + ")");
  await page.reload(); await page.waitForTimeout(250);
  ok(await page.locator(".inst-banner").count() === 0, "non riproposto dopo la chiusura");
  await ctx.close();
}

// 4) banner sulla schermata dei risultati alla fine della prima lezione
{
  const {ctx, page} = await pg(UA.iosInsta);
  await page.addInitScript(() => sessionStorage.setItem("patatino.nudged", "1"));
  await page.goto(url); await page.waitForTimeout(250);
  await page.click("#go"); await page.waitForTimeout(300);
  await page.locator(".pbtn").first().click(); await page.waitForTimeout(300);
  // accorcia la sessione: un solo passo, già risposto giusto
  await page.evaluate(() => { const R = window.__goesting.session; const intro = R.queue.find(c => c.intro); R.queue = intro ? [intro] : R.queue.slice(0, 1); R.pos = 0; R.first = R.total = 1; });
  for(let g = 0; g < 5 && await page.evaluate(() => history.state.s) !== "res"; g++){ const nx = page.locator("#nx"); if(await nx.count()) await nx.click(); else await page.evaluate(() => { const R = window.__goesting.session; R.pos = R.queue.length; }); await page.waitForTimeout(150); }
  console.log("   stato: " + await page.evaluate(() => history.state.s));
  ok(await page.locator(".res .inst-banner").count() === 1, "banner sulla schermata dei risultati");
  await page.screenshot({path: `${out}/banner-res.png`, fullPage:true});
  await page.click(".res #ninst"); await page.waitForTimeout(250);
  ok(await page.evaluate(() => history.state.s) === "install", "dal banner alla guida");
  await page.evaluate(() => history.back()); await page.waitForTimeout(250);
  console.log("   dopo indietro: " + await page.evaluate(() => history.state && history.state.s));
  await ctx.close();
}

// 5) Android con prompt vero (simulato)
{
  const {ctx, page} = await pg(UA.andChrome);
  await page.goto(url); await page.waitForTimeout(250);
  await page.evaluate(() => {
    const e = new Event("beforeinstallprompt", {cancelable:true});
    e.prompt = () => { window.__prompted = true; return Promise.resolve(); };
    e.userChoice = Promise.resolve({outcome:"accepted"});
    window.dispatchEvent(e);
    window.__prevented = e.defaultPrevented;
  });
  ok(await page.evaluate(() => window.__prevented), "beforeinstallprompt intercettato");
  await page.click("#vox"); await page.waitForTimeout(200);
  await page.click("#inst"); await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.__prompted) === true, "Android: il bottone apre il prompt vero");
  ok(await page.evaluate(() => history.state.s) === "settings", "Android: nessuna guida se c'è il prompt");
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem("goesting.v1")).installed) === true, "installazione accettata registrata");
  await ctx.close();
}

// 6) privacy da impostazioni e da #privacy
{
  const {ctx, page} = await pg(UA.iosSafari);
  await page.goto(url); await page.waitForTimeout(250);
  await page.click("#vox"); await page.waitForTimeout(200);
  await page.click("#priv"); await page.waitForTimeout(250);
  ok(await page.evaluate(() => history.state.s) === "privacy", "privacy dalle impostazioni");
  ok(/\[NOME E COGNOME DEL TITOLARE\]/.test(await page.locator(".privacy").innerText()), "segnaposto titolare");
  ok(await noOverflow(page), "privacy senza scroll orizzontale");
  await page.screenshot({path: `${out}/privacy.png`, fullPage:true});
  await page.evaluate(() => history.back()); await page.waitForTimeout(250);
  ok(await page.evaluate(() => history.state.s) === "settings", "privacy → indietro → impostazioni");
  await page.goto("about:blank"); await page.goto(url + "#privacy"); await page.waitForTimeout(300);
  ok(await page.locator(".privacy").count() === 1, "link diretto #privacy");
  await page.evaluate(() => history.back()); await page.waitForTimeout(250);
  ok(await page.locator(".path").count() === 1, "#privacy → indietro → home");
  await ctx.close();
}

// 7) trasloco: OLD_HOST = 127.0.0.1 in una copia
{
  const tmp = "/tmp/patatino-test/moved/patatino"; fs.mkdirSync(tmp, {recursive:true});
  for(const f of fs.readdirSync("/home/user/patatino")) if(/\.(html|js|webmanifest|png)$/.test(f)) fs.copyFileSync("/home/user/patatino/" + f, tmp + "/" + f);
  fs.writeFileSync(tmp + "/index.html", fs.readFileSync(tmp + "/index.html", "utf8").replace('const OLD_HOST = "";', 'const OLD_HOST = "127.0.0.1";').replace('const NEW_URL = "";', 'const NEW_URL = "https://patatino.example/";'));
  const s2 = await serve(tmp);
  const {ctx, page} = await pg(UA.iosSafari, {acceptDownloads:true});
  await page.goto(s2.url); await page.waitForTimeout(300);
  ok(/L'app si è trasferita!/.test(await page.locator(".moved").innerText().catch(() => "")), "banner trasloco");
  ok(await page.locator('.moved a[href="https://patatino.example/"]').count() === 1, "link al nuovo indirizzo");
  await page.screenshot({path: `${out}/moved.png`});
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#mexp")]);
  ok(/patatino-backup-/.test(dl.suggestedFilename()), "trasloco: esporta i dati");
  await ctx.close(); s2.server.close();
}
ok(errors.length === 0, "nessun errore JS " + errors.join(" | "));
await b.close(); server.close(); process.exit(fails.length ? 1 : 0);
