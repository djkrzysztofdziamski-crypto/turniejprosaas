import { chromium } from 'playwright';

async function snapshot(page, label) {
  const info = await page.evaluate(() => ({
    step: window.DemoStoryController?.getStep?.(),
    organizerEmbed: !!window._demoStoryOrganizerEmbed,
    hallParent: document.getElementById('hall-screen')?.parentElement?.id,
    liveBody: document.getElementById('hall-live-body')?.innerHTML?.trim().slice(0, 80),
    playedCount: document.getElementById('hall-played-count')?.textContent,
    logoHeight: document.querySelector('#demo-hall-embed-host .brand-picture--hall img')?.getBoundingClientRect()?.height,
  }));
  console.log(label, JSON.stringify(info));
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8080/index.html?id=DEMO-2026', { waitUntil: 'networkidle' });
await page.evaluate(() => { window.DemoStoryController.start('entry'); window.DemoStoryController.goTo(3); });
await page.waitForTimeout(800);
await snapshot(page, 'step3-first');

await page.evaluate(() => window.DemoStoryController.goTo(2));
await page.waitForTimeout(500);
await snapshot(page, 'step2-fan');

await page.evaluate(() => window.DemoStoryController.goTo(3));
await page.waitForTimeout(800);
await snapshot(page, 'step3-return');

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await snapshot(page, 'after-reload-before-restore');
await page.evaluate(() => window.DemoStoryController.tryRestoreSession());
await page.waitForTimeout(800);
await snapshot(page, 'after-restore');

await browser.close();
