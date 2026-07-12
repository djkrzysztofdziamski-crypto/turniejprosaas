/**
 * S3 — Tiebreak UI helper tests + state integration smoke
 */
import { createRequire } from 'module';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const TiebreakEngine = require('../tiebreak-engine.js');
require('../tiebreak-audit.js');
require('../tiebreak-ui.js');

let passed = 0;
let failed = 0;
function ok(name) { passed++; console.log('PASS:', name); }
function fail(name, detail) { failed++; console.error('FAIL:', name, detail || ''); }

console.log('\n=== TiebreakUI unit ===\n');

const bannerPending = TiebreakUI.buildGroupBanner('A', {
    state: 'ABSOLUTE_TIE_PENDING',
    criticalCluster: { teamNames: ['FC Orły', 'Lech Mini', 'Red Dragons'] }
}, { esc: (s) => s, fanRo: false });

if (bannerPending.includes('⚖ Remis absolutny') && bannerPending.includes('Losuj kolejność')) ok('UI-UNIT-01 pending banner + draw btn');
else fail('UI-UNIT-01 pending banner', bannerPending.slice(0, 120));

if (bannerPending.includes('Play-off zablokowany do czasu rozstrzygnięcia')) ok('UI-UNIT-02 blocked message');
else fail('UI-UNIT-02 blocked message');

const bannerFanPending = TiebreakUI.buildGroupBanner('A', {
    state: 'ABSOLUTE_TIE_PENDING',
    criticalCluster: { teamNames: ['A', 'B'] }
}, { esc: (s) => s, fanRo: true });

if (!bannerFanPending.includes('Losuj kolejność') && bannerFanPending.includes('zostanie uzupełniona')) ok('UI-UNIT-03 fan pending readonly');
else fail('UI-UNIT-03 fan pending');

const bannerConfirmed = TiebreakUI.buildGroupBanner('A', {
    state: 'ABSOLUTE_TIE_CONFIRMED',
    existingDecision: {
        resolvedOrder: ['t1', 't2'],
        drawSeed: 'a3f8c2d1e5b60794830251617181920',
        drawTimestamp: '2026-07-12T14:32:00.000Z',
        actorLabel: 'Organizator'
    }
}, {
    esc: (s) => s,
    fanRo: false,
    resolveOrderNames: () => '1. FC Orły · 2. Lech Mini'
});

if (bannerConfirmed.includes('rozstrzygnięty') && bannerConfirmed.includes('FC Orły')) ok('UI-UNIT-04 confirmed banner order');
else fail('UI-UNIT-04 confirmed banner');

const bannerFanConfirmed = TiebreakUI.buildGroupBanner('A', {
    state: 'ABSOLUTE_TIE_CONFIRMED',
    existingDecision: {
        resolvedOrder: ['t1', 't2'],
        drawSeed: 'a3f8c2d1e5b60794830251617181920',
        drawTimestamp: '2026-07-12T14:32:00.000Z',
        actorLabel: 'Organizator'
    }
}, {
    esc: (s) => s,
    fanRo: true,
    resolveOrderNames: () => '1. FC Orły · 2. Lech Mini'
});

if (bannerFanConfirmed.includes('ustalona losowaniem') && !bannerFanConfirmed.includes('a3f8c2d1')) ok('UI-UNIT-05 fan confirmed no full seed');
else fail('UI-UNIT-05 fan confirmed');

console.log('\n=== State: PENDING → draw → CONFIRMED ===\n');

const tv01 = {
    groups: { A: [{ id: 't1', name: 'FC Orły' }, { id: 't2', name: 'Lech Mini' }, { id: 't3', name: 'Red Dragons' }] },
    matches: [
        { group: 'A', played: true, t1: { id: 't1' }, t2: { id: 't2' }, g1: 1, g2: 0 },
        { group: 'A', played: true, t1: { id: 't2' }, t2: { id: 't3' }, g1: 1, g2: 0 },
        { group: 'A', played: true, t1: { id: 't3' }, t2: { id: 't1' }, g1: 1, g2: 0 }
    ],
    settings: { advCount: 2, tieBreakDecisions: [], tieBreakByGroup: {} }
};

const ctx = {
    groups: tv01.groups,
    matches: tv01.matches,
    settings: tv01.settings,
    numGroups: 1,
    advCount: 2
};

const before = TiebreakEngine.getGroupTieState('A', ctx);
if (before.state === 'ABSOLUTE_TIE_PENDING' && before.blocksPlayoff) ok('UI-STATE-01 ABSOLUTE_TIE_PENDING');
else fail('UI-STATE-01 pending', before.state);

const draw = TiebreakEngine.performAuditedDraw('A', ctx, {
    actorLabel: 'QA Operator',
    tournamentId: 'qa',
    now: () => '2026-07-12T14:32:00.000Z'
});
if (draw.ok) ok('UI-STATE-02 performAuditedDraw');
else fail('UI-STATE-02 draw', draw.error);

const after = TiebreakEngine.getGroupTieState('A', ctx);
if (after.state === 'ABSOLUTE_TIE_CONFIRMED' && !after.blocksPlayoff && after.existingDecision) ok('UI-STATE-03 ABSOLUTE_TIE_CONFIRMED unlock');
else fail('UI-STATE-03 confirmed', after.state);

console.log('\n=== Playwright harness (UI-01…UI-03) ===\n');

const harnessUrl = 'file:///' + path.join(root, 'tiebreak-s3-harness.html').replace(/\\/g, '/');
const browser = await chromium.launch();
const page = await browser.newPage();

try {
    await page.goto(harnessUrl, { waitUntil: 'networkidle' });

    const ui01 = await page.evaluate(() => ({
        pendingBanner: !!document.querySelector('[data-state="ABSOLUTE_TIE_PENDING"]'),
        yellowRows: document.querySelectorAll('.absolute-remis-row').length,
        poDisabled: document.getElementById('btn-start-po').disabled,
        blockedBanner: document.querySelector('.tiebreak-po-blocked-banner')?.innerText || ''
    }));

    if (ui01.pendingBanner && ui01.yellowRows >= 3 && ui01.poDisabled) ok('UI-01 pending: banner, rows, play-off disabled');
    else fail('UI-01 pending harness', JSON.stringify(ui01));

    if (ui01.blockedBanner.includes('Play-off zablokowany')) ok('UI-01b global blocked banner');
    else fail('UI-01b blocked banner');

    await page.click('.tiebreak-draw-btn');
    await page.click('#tb-draw-run');
    await page.waitForTimeout(100);

    const ui02 = await page.evaluate(() => ({
        decisions: window.harnessGetDecisionsCount(),
        poEnabled: !document.getElementById('btn-start-po').disabled,
        confirmedBanner: !!document.querySelector('[data-state="ABSOLUTE_TIE_CONFIRMED"]'),
        seedVisible: document.getElementById('tb-result-seed')?.innerText?.length >= 32,
        orderText: document.getElementById('tb-result-order')?.innerText || ''
    }));

    if (ui02.decisions === 1 && ui02.poEnabled && ui02.confirmedBanner) ok('UI-02 draw: decision saved, play-off enabled');
    else fail('UI-02 draw harness', JSON.stringify(ui02));

    if (ui02.seedVisible && ui02.orderText.includes('1.')) ok('UI-02b modal result seed + order');
    else fail('UI-02b modal result');

    await page.evaluate(() => window.harnessSetFanMode(true));
    const ui03 = await page.evaluate(() => ({
        drawBtns: document.querySelectorAll('.tiebreak-draw-btn').length,
        fanMsg: document.querySelector('.tiebreak-confirmed .tiebreak-banner-msg')?.innerText || '',
        fullSeedInBanner: (document.querySelector('.tiebreak-confirmed')?.innerText || '').includes('a3f8c2d1e5b6079')
    }));

    if (ui03.drawBtns === 0 && ui03.fanMsg.includes('ustalona losowaniem') && !ui03.fullSeedInBanner) ok('UI-03 fan readonly after decision');
    else fail('UI-03 fan harness', JSON.stringify(ui03));
} catch (e) {
    fail('Playwright harness', e.message);
} finally {
    await browser.close();
}

console.log('\n--- Summary ---');
console.log('Passed:', passed, 'Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
