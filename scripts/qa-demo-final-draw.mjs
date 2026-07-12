/**
 * Demo Story — remis 0:0 wymaga karnych; remis karny 4:4 odrzucony; 0:0 + k. 5:4 OK
 */
import { chromium } from 'playwright';

const BASE = process.env.DEMO_URL || 'http://127.0.0.1:8080/index.html';

async function goToFinal(page) {
  await page.click('#btn-demo-story-start');
  await page.waitForSelector('#view-demo-story.active');
  for (let i = 0; i < 4; i++) {
    await page.click('#view-demo-story .demo-screen.active [data-demo-action="next"]');
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(BASE, { waitUntil: 'networkidle' });
await goToFinal(page);

// --- Test 1: 0:0 bez karnych → odrzucone, sekcja karnych widoczna
await page.fill('#demo-final-g1', '0');
await page.fill('#demo-final-g2', '0');
await page.click('[data-demo-action="save-final"]');
await page.waitForTimeout(500);

const drawOnly = await page.evaluate(() => ({
  step: window.DemoStoryController?.getStep(),
  validation: document.getElementById('demo-final-validation')?.textContent || '',
  penaltyVisible: document.getElementById('demo-final-penalty-section')?.style.display !== 'none',
  finalSaved: window.DemoStoryController?.isFinalSaved?.(),
}));

const test1 = drawOnly.step === 4
  && /rzutów karnych|karnych/i.test(drawOnly.validation)
  && drawOnly.penaltyVisible
  && !drawOnly.finalSaved;

// --- Test 2: 0:0 + k. 4:4 → odrzucone (remis karny niemożliwy)
await page.fill('#demo-final-pen1', '4');
await page.fill('#demo-final-pen2', '4');
await page.click('[data-demo-action="save-final"]');
await page.waitForTimeout(500);

const penTie = await page.evaluate(() => ({
  step: window.DemoStoryController?.getStep(),
  validation: document.getElementById('demo-final-validation')?.textContent || '',
  finalSaved: window.DemoStoryController?.isFinalSaved?.(),
}));

const test2 = penTie.step === 4
  && /zwycięzc|przewag|4:4|3:3/i.test(penTie.validation)
  && !penTie.finalSaved;

// --- Test 3: 0:0 + k. 5:4 → podium
await page.fill('#demo-final-pen1', '5');
await page.fill('#demo-final-pen2', '4');
await page.click('[data-demo-action="save-final"]');
await page.waitForFunction(() => window.DemoStoryController?.getStep() === 5, { timeout: 8000 });

const withPen = await page.evaluate(() => {
  const fin = window.DemoStoryController?.getState?.()?.playoffs?.find(m => m.isDemoFinal)
    || window.DemoStoryController?.getState?.()?.playoffs?.find(m => /WIELKI/i.test(m.n));
  return {
    step: window.DemoStoryController?.getStep(),
    finalSaved: window.DemoStoryController?.isFinalSaved?.(),
    g1: fin?.g1,
    g2: fin?.g2,
    pen1: fin?.pen1,
    pen2: fin?.pen2,
  };
});

const test3 = withPen.step === 5
  && withPen.finalSaved
  && withPen.g1 === 0 && withPen.g2 === 0
  && withPen.pen1 === 5 && withPen.pen2 === 4;

await browser.close();

const pass = test1 && test2 && test3;
console.log(JSON.stringify({ pass, test1_draw_rejected: test1, test2_pen_tie_rejected: test2, test3_penalties_ok: test3, drawOnly, penTie, withPen }, null, 2));
process.exit(pass ? 0 : 1);
