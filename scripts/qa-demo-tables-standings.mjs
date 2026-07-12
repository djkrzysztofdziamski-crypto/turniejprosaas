import { chromium } from 'playwright';

const expectedByGroup = {
  A: ['FC Orły Poznań', 'Lech Mini Gniezno'],
  B: ['United Luboń', 'Pogoń Kostrzyn'],
  C: ['Sparta Swarzędz', 'FC Libero Swarzędz'],
  D: ['KS WIKO Opalenica', 'KS Czarnuszka Suchy Las'],
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8080/index.html?demo=story', { waitUntil: 'networkidle' });
await page.click('#view-demo-story .demo-screen.active [data-demo-action="next"]');
await page.click('#view-demo-story .demo-screen.active [data-demo-action="next"]');
await page.waitForTimeout(300);
await page.click('.demo-fan-tab[data-demo-fan-tab="tabele"]');
await page.waitForTimeout(300);

const tables = await page.evaluate(() => {
  const out = {};
  [...document.querySelectorAll('#tables-container .card')].forEach((card) => {
    const title = card.querySelector('h4')?.innerText || '';
    const gn = title.match(/Gr\. ([A-D])/)?.[1];
    if (!gn) return;
    out[gn] = [...card.querySelectorAll('tr')].slice(1).map((r, i) => ({
      rank: i + 1,
      name: r.querySelector('td b')?.innerText?.trim(),
      green: r.classList.contains('advancing-row'),
      pts: r.querySelectorAll('td')[7]?.innerText?.trim(),
    }));
  });
  return out;
});

for (const [g, exp] of Object.entries(expectedByGroup)) {
  const rows = tables[g] || [];
  console.log(`\nGrupa ${g}:`);
  rows.forEach((r) => console.log(`  ${r.rank}. ${r.name} (${r.pts} pkt) ${r.green ? '🟩' : ''}`));
  console.log('  Expected top 2:', exp.join(', '));
  console.log('  Computed top 2:', rows.slice(0, 2).map((r) => r.name).join(', '));
  console.log('  Match:', exp[0] === rows[0]?.name && exp[1] === rows[1]?.name ? 'OK' : 'MISMATCH');
}

await browser.close();
