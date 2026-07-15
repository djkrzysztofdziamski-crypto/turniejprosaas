/**
 * Smoke test widoku Hala — struktura DOM + logika ex aequo GK
 * Uruchom: node scripts/qa-hall-view.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const PORT = Number(process.env.QA_PORT || 8081);

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = (req.url || '/').split('?')[0];
      const file = url === '/' ? '/index.html' : url;
      const path = join(ROOT, file.replace(/^\//, ''));
      try {
        const data = readFileSync(path);
        const ext = path.split('.').pop();
        const types = { html: 'text/html', js: 'application/javascript', css: 'text/css', png: 'image/png', webp: 'image/webp' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

const server = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`http://127.0.0.1:${PORT}/index.html?id=DEMO-2026`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.buildGoalkeepersTopRanked === 'function', { timeout: 20000 });

const checks = await page.evaluate(() => {
  const out = { ok: [], fail: [] };
  const pass = (name, cond) => (cond ? out.ok.push(name) : out.fail.push(name));

  pass('hall-screen in DOM', !!document.getElementById('hall-screen'));
  pass('hall logo img in DOM', !!document.querySelector('#hall-screen .brand-picture--hall img'));
  pass('hall live panel in DOM', !!document.getElementById('hall-live-panel'));
  pass('played section in DOM', !!document.getElementById('hall-played-panel'));

  const panel = document.getElementById('hall-played-panel');
  const grid = document.getElementById('hall-played-grid');
  const featured = document.getElementById('hall-played-featured');
  pass('featured below grid in DOM', panel && grid && featured && grid.compareDocumentPosition(featured) === Node.DOCUMENT_POSITION_FOLLOWING);

  const tied = [
    { n: 'GK A', t: 'TEAM A', ck: 2, lost: 1, m: 3 },
    { n: 'GK B', t: 'TEAM B', ck: 2, lost: 1, m: 3 },
    { n: 'GK C', t: 'TEAM C', ck: 0, lost: 2, m: 3 },
  ];
  const rows = window.buildGoalkeepersTopRanked(tied, 1);
  pass('gk ex aequo rank1 count', rows.length === 2);
  pass('gk ex aequo flag', rows.every((r) => r.ex === true));

  const gkAward = window.formatGkAwardHTML(tied[0], tied);
  pass('formatGkAwardHTML ex aequo', gkAward.includes('ex aequo'));

  return out;
});

console.log('Hall view QA');
checks.ok.forEach((c) => console.log('✓', c));
checks.fail.forEach((c) => console.log('✗', c));
if (errors.length) console.log('Page errors:', errors);

await browser.close();
server.close();

if (checks.fail.length || errors.length) process.exit(1);
console.log('All hall checks passed.');
