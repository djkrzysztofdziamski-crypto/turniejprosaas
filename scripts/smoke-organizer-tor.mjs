import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8080/index.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('dialog', (d) => d.accept());
const out = {};

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
// Force organizer shell for UI smoke (bare URL shows login)
await page.evaluate(() => {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  const app = document.getElementById('view-app');
  if (app) app.classList.add('active');
  document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
  const start = document.getElementById('start');
  if (start) start.classList.add('active');
  document.body.classList.remove('fan-view', 'assistant-view', 'hall-view', 'captain-view');
  if (typeof window.syncTournamentWord === 'function') window.syncTournamentWord();
  if (typeof window.syncTournamentRail === 'function') window.syncTournamentRail();
});
await page.waitForTimeout(300);
out.dom = await page.evaluate(() => ({
  word: !!document.getElementById('tournament-word'),
  modules: document.querySelectorAll('#setup-view .setup-module').length,
  rail: !!document.getElementById('tournament-rail'),
  tStartInLos: !!document.querySelector('#losowania #t-start'),
  demoLockInLos: !!document.querySelector('#losowania #demo-lock-btn-container'),
  walkoverLive: !!document.querySelector('#nazywo [onclick*="openWalkoverWizard"]'),
  walkoverGrupy: !!document.querySelector('#grupy [onclick*="openWalkoverWizard"]'),
  fns:
    typeof window.syncTournamentWord === 'function' &&
    typeof window.openLosowaniaStep === 'function' &&
    typeof window.syncTournamentRail === 'function',
}));

await page.fill('#team-count', '8');
await page.fill('#group-count', '2');
await page.fill('#advancing-count', '4');
await page.waitForTimeout(200);
await page.evaluate(() => {
  if (typeof window.syncTournamentWord === 'function') window.syncTournamentWord();
});
out.wordText = await page.evaluate(
  () => document.getElementById('tournament-word-main')?.innerText || ''
);

await page.evaluate(() => window.openLosowaniaStep(1));
await page.waitForTimeout(500);
out.afterNoTeams = await page.evaluate(() =>
  document.getElementById('start')?.classList.contains('active')
);

await page.goto(BASE + '?demo=story', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4500);
out.demo = await page.evaluate(() => ({
  ctrl: !!window.DemoStoryController,
  demoActive: !!document.getElementById('view-demo-story')?.classList.contains('active'),
  loginOrDemo:
    !!document.getElementById('view-demo-story')?.classList.contains('active') ||
    !!document.getElementById('view-login')?.classList.contains('active'),
}));

await browser.close();

const pass =
  out.dom.word &&
  out.dom.modules >= 6 &&
  out.dom.rail &&
  out.dom.tStartInLos &&
  out.dom.demoLockInLos &&
  out.dom.walkoverLive &&
  !out.dom.walkoverGrupy &&
  out.dom.fns &&
  /8 drużyn/.test(out.wordText) &&
  /2 grup/.test(out.wordText) &&
  out.demo.ctrl;

console.log(JSON.stringify({ pass, out }, null, 2));
process.exit(pass ? 0 : 1);
