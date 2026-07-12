import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8080/index.html?demo=story', { waitUntil: 'networkidle' });
for (let i = 0; i < 2; i++) {
  await page.click('#view-demo-story .demo-screen.active [data-demo-action="next"]');
  await page.waitForTimeout(300);
}

function cardInfo() {
  return [...document.querySelectorAll('#matches-container .match-card')].map((c) =>
    c.innerText.replace(/\s+/g, ' ').trim()
  );
}

await page.click('button.filter-btn >> text=Oczekujące');
await page.waitForTimeout(200);
const pendingCards = await page.evaluate(cardInfo);
const pending = {
  hasFinishedPo: pendingCards.some((t) => /PÓŁFINAŁ|MECZ O 3/.test(t) && !/-:-/.test(t)),
  hasFinalPending: pendingCards.some((t) => /WIELKI FINAŁ/.test(t)),
  count: pendingCards.length,
};

await page.click('button.filter-btn >> text=Zakończone');
await page.waitForTimeout(200);
const finishedCards = await page.evaluate(cardInfo);
const finished = {
  hasFinalPending: finishedCards.some((t) => /WIELKI FINAŁ/.test(t) && /-:-/.test(t)),
  hasSemiFinished: finishedCards.some((t) => /PÓŁFINAŁ/.test(t)),
  count: finishedCards.length,
};

await page.click('.demo-fan-tab[data-demo-fan-tab="playoff"]');
await page.waitForTimeout(200);

await page.click('button.filter-btn >> text=Oczekujące');
await page.waitForTimeout(200);
const poPendingCards = await page.evaluate(() =>
  [...document.querySelectorAll('#playoff-container .match-card')].map((c) => c.innerText.replace(/\s+/g, ' ').trim())
);
const poPending = {
  count: poPendingCards.length,
  hasFinalOnly: poPendingCards.length === 1 && /WIELKI FINAŁ|-:-/.test(poPendingCards[0]),
  hasFinishedSemi: poPendingCards.some((t) => /PÓŁFINAŁ/.test(t) && !/-:-/.test(t)),
};

await page.click('button.filter-btn >> text=Zakończone');
await page.waitForTimeout(200);
const poFinishedCards = await page.evaluate(() =>
  [...document.querySelectorAll('#playoff-container .match-card')].map((c) => c.innerText.replace(/\s+/g, ' ').trim())
);
const poFinished = {
  count: poFinishedCards.length,
  hasFinalPending: poFinishedCards.some((t) => /WIELKI FINAŁ/.test(t) && /-:-/.test(t)),
  hasSemiFinished: poFinishedCards.some((t) => /PÓŁFINAŁ/.test(t)),
};

const pass =
  !pending.hasFinishedPo &&
  pending.hasFinalPending &&
  !finished.hasFinalPending &&
  finished.hasSemiFinished &&
  poPending.count === 1 &&
  !poPending.hasFinishedSemi &&
  !poFinished.hasFinalPending &&
  poFinished.count >= 3;

console.log(JSON.stringify({ pending, finished, poPending, poFinished, pass }, null, 2));
await browser.close();
process.exit(pass ? 0 : 1);
