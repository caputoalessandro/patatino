import { serve, browser, offlineFonts } from "./comune.mjs";
const { server, url } = await serve("/home/user/patatino");
const b = await browser(); let bad = 0; const errs = [];
for(const [w, ua, name] of [[360, "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1", "ios"], [430, "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36", "and"]]){
  const ctx = await b.newContext({locale:"it-IT", viewport:{width:w, height:780}, deviceScaleFactor:2, isMobile:true, hasTouch:true, userAgent:ua}); await offlineFonts(ctx);
  const p = await ctx.newPage(); p.on("pageerror", e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(300);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await p.locator(".top").screenshot({path:`/tmp/patatino-test/shots2/chip-${name}.png`});
  await p.click("#hinst"); await p.waitForTimeout(300);
  const st = await p.evaluate(() => history.state.s);
  await p.evaluate(() => history.back()); await p.waitForTimeout(300);
  const back = await p.evaluate(() => history.state.s);
  console.log(w, "overflow:", ov, "→", st, "← ", back);
  if(ov || st !== "install" || back !== "home") bad++;
  await ctx.close();
}
// standalone: niente chip
const ctx = await b.newContext({locale:"it-IT", viewport:{width:360, height:780}}); const p = await ctx.newPage();
await p.addInitScript(() => Object.defineProperty(navigator, "standalone", {value:true}));
await p.goto(url); await p.waitForTimeout(300);
const n = await p.locator("#hinst").count(); console.log("standalone chip:", n); if(n) bad++;
console.log("errori:", errs.length); await b.close(); server.close(); process.exit(bad || errs.length ? 1 : 0);
