import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://demo.turniejomat.pl/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);
await page.locator('button[data-demo-action="next"]').first().click();
await page.waitForTimeout(600);
for (let i = 0; i < 2; i++) {
  await page.locator('button[data-demo-action="next"]').first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
}
await page.waitForTimeout(1000);
const info = await page.evaluate(() => ({
  step: window.DemoStoryController?.getStep?.(),
  hallParent: document.getElementById('hall-screen')?.parentElement?.id,
  hallTitle: document.getElementById('hall-title')?.textContent,
  playedCount: document.getElementById('hall-played-count')?.textContent,
  liveSnippet: document.getElementById('hall-live-body')?.textContent?.trim().slice(0, 80),
  hasLandingBtn: !!document.querySelector('.demo-btn-landing'),
}));
console.log('PROD DEMO QA:', JSON.stringify(info, null, 2));
await browser.close();
