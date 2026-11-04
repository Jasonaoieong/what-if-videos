// node snap.js <page.html> <out.png> <w> <h>
const { chromium } = require('playwright');
(async () => {
  const [page_, out, w, h] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto('file://' + require('path').resolve(page_));
  await p.waitForTimeout(400);
  await p.screenshot({ path: out });
  await b.close();
})();
