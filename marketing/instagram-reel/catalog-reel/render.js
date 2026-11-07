// node render.js frames <outDir> [fps]      -> every frame as JPEG
// node render.js stills <outDir> t1,t2,...  -> chosen moments
// node render.js cards  <outDir>            -> one finished 1080x1920 card per product (Stories)
// node render.js timeline                   -> prints timeline JSON (used for the music)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [mode, out, arg] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'reel.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = r; i.onerror = r; }))));
  await page.evaluate(() => window.layout());
  const tl = await page.evaluate(() => window.TIMELINE);
  if (mode === 'timeline') { console.log(JSON.stringify(tl)); await browser.close(); return; }
  fs.mkdirSync(out, { recursive: true });

  let shots;
  if (mode === 'frames') {
    const fps = Number(arg || 30);
    shots = Array.from({ length: Math.round(tl.total * fps) }, (_, i) => [i / fps, `f${String(i).padStart(4, '0')}.jpg`]);
  } else if (mode === 'stills') {
    shots = arg.split(',').map(Number).map(t => [t, `t${t.toFixed(2)}.jpg`]);
  } else if (mode === 'cards') {
    const products = await page.evaluate(() => window.CATALOG.products.map(p => p.name));
    const starts = tl.transitions.slice(1, 1 + products.length);
    shots = products.map((n, i) => [starts[i] + 2.4, `${String(i + 1).padStart(2, '0')}-${n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`]);
  }
  for (let i = 0; i < shots.length; i++) {
    const [t, name] = shots[i];
    await page.evaluate(t => window.render(t), t);
    await page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: mode === 'frames' ? 94 : 96 });
    if (mode === 'frames' && i % 200 === 0) console.log('frame', i, '/', shots.length);
  }
  await browser.close();
})();
