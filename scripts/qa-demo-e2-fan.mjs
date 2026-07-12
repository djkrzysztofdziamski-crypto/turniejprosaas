import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle' });
await page.click('#btn-demo-story-start');
for (let i = 0; i < 2; i++) {
  await page.click('#view-demo-story .demo-screen.active [data-demo-action="next"]');
  await page.waitForTimeout(400);
}
const info = await page.evaluate(() => ({
  step: window.DemoStoryController?.getStep(),
  scenarioMatches: window.DemoStoryController?.getState()?.matches?.length,
  hasApply: typeof window.applyDemoScenarioState === 'function',
  matchesContainerText: document.getElementById('matches-container')?.innerText?.slice(0, 120),
  isEmptyMsg: (document.getElementById('matches-container')?.innerText || '').includes('Brak meczów'),
  matchCards: document.querySelectorAll('#matches-container .match-card').length,
}));
console.log(JSON.stringify(info, null, 2));
await browser.close();
process.exit(info.isEmptyMsg ? 1 : 0);
