import { chromium } from 'playwright';
import http from 'http';
import path from 'path';
import { createReadStream, existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
function mime(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css';
  if (p.endsWith('.js')) return 'application/javascript';
  return 'application/octet-stream';
}
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const file = path.join(ROOT, u.replace(/^\//, ''));
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404); res.end('404'); return;
  }
  res.writeHead(200, { 'Content-Type': mime(file) });
  createReadStream(file).pipe(res);
});

server.listen(8799, '127.0.0.1', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.setViewportSize({ width: 800, height: 360 });
  await page.goto('http://127.0.0.1:8799/?id=DEMO-2026', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => !!window.DemoStoryController, null, { timeout: 15000 });
  await page.evaluate(() => DemoStoryController.start('smoke'));
  await page.waitForSelector('#view-demo-story.active', { timeout: 10000 });
  const results = {};

  await page.evaluate(() => DemoStoryController.goTo(2));
  await page.waitForTimeout(500);
  results.step2 = await page.evaluate(() => ({
    preferCards: tpPreferMatchCards(),
    cards: document.querySelectorAll('.assistant-match-card').length,
    sep: !!document.querySelector('.live-teams-sep'),
    gateHidden: document.getElementById('demo-rotate-gate').hasAttribute('hidden'),
    sampleTeams: (document.querySelector('.assistant-match-card-teams') || {}).textContent || ''
  }));

  await page.evaluate(() => DemoStoryController.goTo(3));
  await page.waitForTimeout(700);
  results.step3 = await page.evaluate(() => {
    const cs = (id) => {
      const el = document.getElementById(id);
      return el ? getComputedStyle(el).display : 'missing';
    };
    const h = document.querySelector('#view-demo-story .demo-hall-embed-host #hall-screen');
    return {
      preferCards: tpPreferMatchCards(),
      cards: document.querySelectorAll('#demo-live-embed-host .assistant-match-card').length,
      shareBtns: [...document.querySelectorAll('#demo-live-embed-host .live-toolbar-actions .live-btn-secondary')].map((x) => ({
        t: x.textContent.trim(),
        disp: getComputedStyle(x.parentElement).display,
        btnDisp: getComputedStyle(x).display
      })),
      hallQr: cs('hall-demo-qr-cell'),
      hallClock: cs('hall-demo-clock-cell'),
      hallNext: cs('hall-demo-next-panel'),
      hallDone: cs('hall-demo-done-panel'),
      hallOverflow: h ? { o: getComputedStyle(h).overflow, h: getComputedStyle(h).height, mh: getComputedStyle(h).maxHeight } : null,
      liveHostClass: document.getElementById('demo-live-embed-host')?.className || ''
    };
  });

  await page.evaluate(() => {
    DemoStoryController.saveFinalScore(2, 1, null, null);
    DemoStoryController.goTo(5);
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => DemoStoryController.goTo(6));
  await page.waitForTimeout(200);
  results.step6 = await page.evaluate(() => ({
    sub: (document.querySelector('#view-demo-story .demo-sub') || {}).textContent || ''
  }));

  await page.setViewportSize({ width: 390, height: 800 });
  await page.evaluate(() => DemoStoryController.goTo(2));
  await page.waitForTimeout(250);
  results.portraitGate = await page.evaluate(() => ({
    need: document.getElementById('view-demo-story').classList.contains('demo-need-landscape'),
    gateShown: !document.getElementById('demo-rotate-gate').hasAttribute('hidden')
  }));

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  server.close();
});
