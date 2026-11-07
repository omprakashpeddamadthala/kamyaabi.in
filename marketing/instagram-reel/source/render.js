// Usage: node render.js <outDir> [fps] [t1,t2,...]   (times list => stills only)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2];
  const fps = Number(process.argv[3] || 30);
  const times = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'reel.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => i.onload = r))));

  const list = times || Array.from({ length: Math.round(30 * fps) }, (_, i) => i / fps);
  for (let i = 0; i < list.length; i++) {
    await page.evaluate(t => window.render(t), list[i]);
    const name = times ? `t${list[i].toFixed(2)}.jpg` : `f${String(i).padStart(4, '0')}.jpg`;
    await page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 94 });
    if (!times && i % 100 === 0) console.log('frame', i);
  }
  await browser.close();
})();
