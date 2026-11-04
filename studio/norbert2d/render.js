// node render.js <scene.html> <out.mp4> <seconds> [fps] [--stills t1,t2,...]
// Renders window.frame(t) to PNG frames with headless Chromium, then encodes with ffmpeg.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  const args = process.argv.slice(2);
  const [scene, out, secs] = args;
  const fps = +(args[3] && !args[3].startsWith('--') ? args[3] : 30);
  const si = args.indexOf('--stills');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await p.goto('file://' + path.resolve(scene));
  await p.evaluate(() => document.fonts.ready);
  if (si >= 0) {
    for (const t of args[si + 1].split(',')) {
      await p.evaluate((t) => window.frame(t), +t);
      await p.screenshot({ path: `${out}_${t}.png` });
      console.log('still', t);
    }
    await b.close();
    return;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'frames-'));
  const n = Math.round(+secs * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.frame(t), i / fps);
    await p.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.png') });
    if (i % 60 === 0) console.log('frame', i, '/', n);
  }
  await b.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, '%05d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', out]);
  fs.rmSync(dir, { recursive: true });
  console.log('wrote', out);
})();
