// node render.js stills t1 t2 ...   |   node render.js frames <from> <to> <outdir>   (frame indices, 30fps)
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = __dirname;
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  const ty = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.ttf': 'font/ttf' }[path.extname(f)] || 'application/octet-stream';
  r.writeHead(200, { 'Content-Type': ty }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/index.html`);
  try { await pg.waitForFunction('window.ENGINE_READY===true', null, { timeout: 120000 }); } catch (e) { console.error('LOAD FAIL', errs); process.exit(1); }
  await pg.evaluate('document.fonts.ready');
  const [mode, ...a] = process.argv.slice(2);
  if (mode === 'stills') { fs.mkdirSync('stills', { recursive: true });
    for (const t of a) { await pg.evaluate(`renderAt(${t})`); await pg.screenshot({ path: `stills/t${(+t).toFixed(2)}.jpg`, type: 'jpeg', quality: 80 }); } }
  else { const [f0, f1, out] = a; fs.mkdirSync(out, { recursive: true }); const t0 = Date.now();
    for (let i = +f0; i < +f1; i++) { await pg.evaluate(`renderAt(${(i / 30).toFixed(5)})`);
      await pg.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
      if ((i - f0) % 60 === 0) console.log(`frame ${i} ${((Date.now() - t0) / 1000 / (i - f0 + 1)).toFixed(2)}s/f`); } }
  if (errs.length) console.error('PAGE ERRORS', errs.slice(0, 5));
  await b.close(); srv.close();
})();
