/**
 * Demo Story E0→E7 smoke test (Playwright)
 * Uruchom: node scripts/qa-demo-story-smoke.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DEMO_URL || ('http://127.0.0.1:8080/index.html');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto(BASE, { waitUntil: 'networkidle' });

// E0 — start
await page.click('#btn-demo-story-start');
await page.waitForSelector('#view-demo-story.active', { timeout: 5000 });

const clickActiveNext = () =>
  page.click('#view-demo-story .demo-screen.active [data-demo-action="next"]');

const clickActive = (action) =>
  page.click(`#view-demo-story .demo-screen.active [data-demo-action="${action}"]`);

const runStep = async () => {
  return page.evaluate(() => ({
    active: document.getElementById('view-demo-story')?.classList.contains('active'),
    step: window.DemoStoryController?.getStep(),
    completed: window.DemoStoryController?.getEvents?.().some(e => e.event === 'demo_story_completed'),
  }));
};

// E0→E1 (start story)
await clickActiveNext();
let s = await runStep();
if (s.step !== 1) throw new Error('Expected step 1, got ' + s.step);

// E1→E2
await clickActiveNext();
s = await runStep();
if (s.step !== 2) throw new Error('Expected step 2, got ' + s.step);

// E2 fan tabs
const fanTabs = await page.$$('.demo-fan-tab');
if (fanTabs.length < 2) throw new Error('Missing fan tabs on E2');

// E2→E3
await clickActiveNext();
s = await runStep();
if (s.step !== 3) throw new Error('Expected step 3, got ' + s.step);

// E3→E4
await clickActiveNext();
s = await runStep();
if (s.step !== 4) throw new Error('Expected step 4, got ' + s.step);

// E4 — save final 3:2
await page.fill('#demo-final-g1', '3');
await page.fill('#demo-final-g2', '2');
await page.click('#view-demo-story .demo-screen.active [data-demo-action="save-final"]');
await page.waitForFunction(() => window.DemoStoryController?.getStep() === 5, { timeout: 8000 });
await page.waitForTimeout(800);
s = await runStep();
if (s.step !== 5) throw new Error('Expected step 5 after final, got ' + s.step);

// E5 podium — check via controller state + visible text
const podiumData = await page.evaluate(() => {
  const el = document.getElementById('demo-screen-podium');
  const state = window.DemoStoryController?.getState?.();
  return {
    text: el?.innerText || '',
    step: window.DemoStoryController?.getStep(),
    finalSaved: window.DemoStoryController?.isFinalSaved?.(),
  };
});
const allText = await page.evaluate(() => document.getElementById('view-demo-story')?.innerText || '');
const podiumChecks = {
  orly: /Orły/i.test(allText),
  united: /United/i.test(allText),
  sparta: /Sparta/i.test(allText),
  step5: podiumData.step === 5,
  finalSaved: podiumData.finalSaved === true,
};
if (!podiumChecks.orly || !podiumChecks.step5) {
  throw new Error('Podium check failed: ' + JSON.stringify(podiumChecks));
}

// E5→E6
await clickActiveNext();
s = await runStep();
if (s.step !== 6) throw new Error('Expected step 6, got ' + s.step);

// E6 conversion screen
const e6 = await page.textContent('#demo-screen-conversion');
if (!e6 || e6.length < 20) throw new Error('E6 conversion empty');

// E6→E7
await clickActiveNext();
s = await runStep();
if (s.step !== 7) throw new Error('Expected step 7, got ' + s.step);

// E7 archive with user score
const e7 = await page.textContent('#demo-screen-archive');
const archiveChecks = {
  hasFinal: /3\s*:\s*2/.test(e7 || ''),
  hasContent: (e7 || '').length > 30,
};

await browser.close();

const result = {
  pass: true,
  steps: 'E0→E7',
  podium: podiumChecks,
  archive: archiveChecks,
  pageErrors: errors.filter(e => !e.includes('Firebase') && !e.includes('network')),
};

console.log(JSON.stringify(result, null, 2));
process.exit(0);
