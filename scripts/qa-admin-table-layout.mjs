import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.resolve(__dirname, '..', 'index.html');
const BASE = 'file:///' + INDEX.replace(/\\/g, '/') + '?view=admin';
const LONG_NAME = 'Sędzia Kowalski — Puchar Opalenicy Halowy Turniej Piłki Nożnej Orlik 2026 Extra Długa Nazwa Organizatora';
const SHORT_NAME = 'Test';
const SPECIAL_NAME = '!@#%^&^%$#@<>:?"} {POL:"]}{POIU';
const SPECIAL_NAME2 = '<1231231231> $ /123098123098///><<<>>>")>';

async function runViewport(page, width, label) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(BASE, { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const admin = document.getElementById('view-admin');
    if (admin) admin.classList.add('active');
  });

  await page.evaluate(({ longName, shortName, specialName, specialName2 }) => {
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const row = (notatka, key) => `
<tr>
  <td class="lic-col-key" style="font-family: monospace; font-weight: bold; color: #60a5fa;">${key}</td>
  <td class="lic-col-notatka" title="${escAttr(notatka)}">
    <span class="lic-notatka-text">${esc(notatka) || '—'}</span>
  </td>
  <td class="lic-col-pakiet"><code>1-dzien</code></td>
  <td class="lic-col-status"><span class="badge nowy">NOWY</span></td>
  <td class="lic-col-date">—</td>
  <td class="lic-col-date">—</td>
  <td class="lic-col-actions">
    <div class="lic-actions">
      <button class="action-btn act-view">👁 PODGLĄD</button>
      <button class="action-btn act-block" onclick="confirmBlock('${key}', this)">🚫 BLOKUJ</button>
      <button class="action-btn act-del">✖ USUŃ</button>
    </div>
  </td>
</tr>`;
    const tbody = document.getElementById('licenses-table-body');
    tbody.innerHTML = row(specialName, 'TP-SPEC-0001') + row(shortName, 'TP-SHRT-0001') + row(specialName2, 'TP-SPEC-0002') + row(longName, 'TP-LONG-0003');
    document.getElementById('auth-lock').style.display = 'none';
  }, { longName: LONG_NAME, shortName: SHORT_NAME, specialName: SPECIAL_NAME, specialName2: SPECIAL_NAME2 });

  const results = await page.evaluate(() => {
    const table = document.querySelector('#view-admin table.licenses-table');
    const actionsCell = document.querySelector('#licenses-table-body tr:last-child .lic-col-actions');
    const notatkaCell = document.querySelector('#licenses-table-body tr:last-child .lic-col-notatka');
    const notatkaText = document.querySelector('#licenses-table-body tr:last-child .lic-notatka-text');
    const licActions = document.querySelector('#licenses-table-body tr:last-child .lic-actions');
    const tableStyle = table ? getComputedStyle(table) : null;
    const actionsStyle = actionsCell ? getComputedStyle(actionsCell) : null;
    const licActionsStyle = licActions ? getComputedStyle(licActions) : null;
    const notatkaStyle = notatkaCell ? getComputedStyle(notatkaCell) : null;
    const notatkaTextStyle = notatkaText ? getComputedStyle(notatkaText) : null;

    const actionsRect = actionsCell?.getBoundingClientRect();
    const notatkaRect = notatkaCell?.getBoundingClientRect();
    const overlap = actionsRect && notatkaRect ? notatkaRect.right > actionsRect.left + 2 : null;

    const buttons = [...(licActions?.querySelectorAll('.action-btn') || [])];
    const btnRects = buttons.map(b => b.getBoundingClientRect());
    const allButtonsInActionsCol = btnRects.every(r => r.left >= actionsRect.left - 1 && r.right <= actionsRect.right + 1);

    const blockButtons = [...document.querySelectorAll('#licenses-table-body .act-block')];
    const blockLabelsClean = blockButtons.every(b => b.textContent.trim() === '🚫 BLOKUJ');

    return {
      tableLayout: tableStyle?.tableLayout,
      tableMinWidth: tableStyle?.minWidth,
      actionsMinWidth: actionsStyle?.minWidth,
      actionsWidth: actionsStyle?.width,
      licActionsDisplay: licActionsStyle?.display,
      licActionsFlexWrap: licActionsStyle?.flexWrap,
      notatkaOverflow: notatkaStyle?.overflow,
      notatkaMaxWidth: notatkaStyle?.maxWidth,
      lineClamp: notatkaTextStyle?.webkitLineClamp || notatkaTextStyle?.WebkitLineClamp,
      titleAttr: notatkaCell?.getAttribute('title')?.length > 0,
      textOverlapsActions: overlap,
      allButtonsInActionsCol,
      colgroupPresent: !!document.querySelector('#view-admin colgroup'),
      blockLabelsClean,
    };
  });

  return { label, width, ...results };
}

const browser = await chromium.launch();
const page = await browser.newPage();
const r1366 = await runViewport(page, 1366, '1366px');
const r1920 = await runViewport(page, 1920, '1920px');
await browser.close();

const checks = [
  ['table-layout: fixed', r1920.tableLayout === 'fixed'],
  ['min-width table 960px', r1920.tableMinWidth === '960px'],
  ['actions min-width 340px', r1920.actionsMinWidth === '340px' || parseFloat(r1920.actionsMinWidth) >= 340],
  ['lic-actions flex', r1920.licActionsDisplay === 'flex'],
  ['flex-wrap wrap', r1920.licActionsFlexWrap === 'wrap'],
  ['notatka overflow hidden', r1920.notatkaOverflow === 'hidden'],
  ['title on long row', r1920.titleAttr === true],
  ['no text overlap actions (1920)', r1920.textOverlapsActions === false],
  ['buttons inside actions col (1920)', r1920.allButtonsInActionsCol === true],
  ['no text overlap actions (1366)', r1366.textOverlapsActions === false],
  ['buttons inside actions col (1366)', r1366.allButtonsInActionsCol === true],
  ['colgroup present', r1920.colgroupPresent === true],
  ['block button labels clean (no HTML injection)', r1920.blockLabelsClean === true],
];

console.log(JSON.stringify({ viewports: [r1366, r1920], checks: checks.map(([n, ok]) => ({ name: n, pass: ok })) }, null, 2));
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
