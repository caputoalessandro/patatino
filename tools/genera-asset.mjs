// Genera icone e screenshot per il manifest disegnandoli dall'app stessa (mascotte SVG di Patatino).
// Uso (dalla cartella del repo):  node tools/genera-asset.mjs
// Serve Playwright con Chromium: `npm i playwright && npx playwright install chromium` (una volta sola).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = {".html":"text/html; charset=utf-8", ".js":"text/javascript", ".webmanifest":"application/manifest+json", ".png":"image/png", ".json":"application/json"};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/app\//, "") || "index.html";
  const f = path.join(dir, p);
  if(!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end(); }
  res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
await new Promise(ok => server.listen(0, "127.0.0.1", ok));
const url = `http://127.0.0.1:${server.address().port}/app/`;
const b = await chromium.launch().catch(() => chromium.launch({executablePath: "/opt/pw-browsers/chromium"}));
const bg = JSON.parse(fs.readFileSync(path.join(dir, "manifest.webmanifest"), "utf8")).background_color;

/* ---------- icone ---------- */
// "any": mascotte grande; "maskable": mascotte dentro il cerchio sicuro (80% del lato) perché Android può ritagliare l'icona a cerchio
const ICONS = [["icon-512.png", 512, .86], ["icon-192.png", 192, .86], ["icon-180.png", 180, .8], ["icon-32.png", 32, .94],
  ["icon-maskable-512.png", 512, .6], ["icon-maskable-192.png", 192, .6]];
{
  const page = await (await b.newContext({viewport:{width:600, height:600}})).newPage();
  await page.goto(url); await page.waitForFunction(() => window.APP && window.APP.mascot);
  for(const [name, size, k] of ICONS){
    await page.evaluate(({size, k, bg}) => {
      // la mascotte (viewBox 140×160) è più alta che larga: si dimensiona sull'altezza
      const h = Math.round(size * k);
      document.body.innerHTML = `<div id="ic" style="width:${size}px;height:${size}px;background:${bg};display:grid;place-items:center;overflow:hidden">${window.APP.mascot("happy", Math.round(h * 140 / 160))}</div>`;
      document.body.style.cssText = "margin:0;background:" + bg;
    }, {size, k, bg});
    await page.locator("#ic").screenshot({path: path.join(dir, name)});
    console.log(name);
  }
}

/* ---------- screenshot ---------- */
const STATE = {xp:340, streak:6, last:new Date().toISOString().slice(0, 10), best:{u1:100, u2:90, u3:85}, vbest:{u1:100, u2:100, u3:90, u4:60},
  vblk:{"u1:0":100, "u2:0":100, "u3:0":90, "u4:0":60}, palette:"frietkot", lastExport:new Date().toISOString(), installed:true};
fs.mkdirSync(path.join(dir, "screenshots"), {recursive:true});
async function shots(viewport, scale, list){
  const ctx = await b.newContext({viewport, deviceScaleFactor:scale, isMobile:viewport.width < 600, hasTouch:true});
  await ctx.addInitScript((st) => { if(!localStorage.getItem("goesting.v1")) localStorage.setItem("goesting.v1", JSON.stringify(st)); sessionStorage.setItem("patatino.nudged", "1"); }, STATE);
  const page = await ctx.newPage();
  for(const [name, go] of list){
    await page.goto(url); await page.waitForTimeout(500);
    await go(page); await page.waitForTimeout(700);
    await page.screenshot({path: path.join(dir, "screenshots", name)});
    console.log("screenshots/" + name);
  }
  await ctx.close();
}
await shots({width:360, height:740}, 3, [
  ["home.png", async () => {}],
  ["lezione.png", async (p) => { await p.click("#go"); await p.waitForTimeout(400); await p.locator(".pbtn").first().click(); await p.waitForTimeout(400); for(let i = 0; i < 3 && await p.locator(".opt").count() === 0; i++){ const nx = p.locator("#nx, .dock .btn-lion").first(); if(await nx.count()) await nx.click(); await p.waitForTimeout(300); } }],
  ["flashcards.png", async (p) => { await p.locator(".tab").nth(1).click(); }]
]);
await shots({width:1280, height:800}, 1, [["desktop.png", async () => {}]]);
await b.close(); server.close();
