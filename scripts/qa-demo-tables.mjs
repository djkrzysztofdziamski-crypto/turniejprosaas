import { chromium } from 'playwright';

const expected = [
  'FC Orły Poznań', 'Lech Mini Gniezno',
  'United Luboń', 'Pogoń Kostrzyn',
  'Sparta Swarzędz', 'FC Libero Swarzędz',
  'KS WIKO Opalenica', 'KS Czarnuszka Suchy Las',
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8080/index.html?demo=story', { waitUntil: 'networkidle' });
for (let i = 0; i < 2; i++) {
  await page.click('#view-demo-story .demo-screen.active [data-demo-action="next"]');
  await page.waitForTimeout(300);
}
await page.click('.demo-fan-tab[data-demo-fan-tab="tabele"]');
await page.waitForTimeout(300);

const info = await page.evaluate(() => {
  const settings = window.DemoStoryController?.getState()?.settings;
  const advIds = window.getAdvancingTeamsFull?.().map((t) => t.name) || [];
  const advancing = [...document.querySelectorAll('#tables-container .advancing-row')].map((r) =>
    r.querySelector('td')?.innerText?.replace(/\s+/g, ' ').trim().split(' ').slice(0, -0).join(' ')
  );
  const advancingNames = [...document.querySelectorAll('#tables-container .advancing-row td:first-child b')].map((el) =>
    el.innerText.trim()
  );
  const allRows = [...document.querySelectorAll('#tables-container table tr')].slice(1).map((r) => ({
    name: r.querySelector('td b')?.innerText?.trim(),
    green: r.classList.contains('advancing-row'),
  }));
  return { settings, advIds, advancingNames, greenCount: advancingNames.length, allRows };
});

console.log(JSON.stringify(info, null, 2));
console.log('\nExpected:', expected);
console.log('Missing:', expected.filter((n) => !info.advancingNames.includes(n)));
console.log('Extra:', info.advancingNames.filter((n) => !expected.includes(n)));

await browser.close();
