// Funzioni comuni agli script: server statico locale e avvio di Chromium con Playwright.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const TYPES = {".html":"text/html; charset=utf-8", ".js":"text/javascript", ".mjs":"text/javascript", ".json":"application/json",
  ".webmanifest":"application/manifest+json", ".png":"image/png", ".svg":"image/svg+xml", ".css":"text/css", ".md":"text/markdown"};

// Serve la cartella dell'app sotto /<nome>/ come farebbe GitHub Pages (indirizzi relativi verificati davvero)
export function serve(dir){
  const base = "/" + path.basename(path.resolve(dir)) + "/";
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if(!p.startsWith(base)){ res.writeHead(404); return res.end(); }
    p = p.slice(base.length) || "index.html";
    const f = path.join(dir, p);
    if(!f.startsWith(path.resolve(dir)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end("404"); }
    res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"});
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => server.listen(0, "127.0.0.1", () => ok({server, url:`http://127.0.0.1:${server.address().port}${base}`})));
}

export async function browser(){
  let pw;
  try{ pw = require("playwright"); }
  catch(e){ console.error("Playwright non trovato: esegui `npm i playwright` nella cartella scripts/ (o globalmente)."); process.exit(2); }
  try{ return await pw.chromium.launch(); }
  catch(e){ return await pw.chromium.launch({executablePath: "/opt/pw-browsers/chromium"}); }
}

// Blocca i font esterni: i test non dipendono dalla rete e il fallback di sistema deve reggere
export async function offlineFonts(ctx){
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
}
