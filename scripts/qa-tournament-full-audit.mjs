#!/usr/bin/env node
/**
 * Pełny audyt turnieju live — sędzia / kibic / hala / asystent / print / matematyka
 * Uruchom:
 *   node scripts/qa-tournament-full-audit.mjs
 *   LICENSE=TP-QDJL-CTW5 APP_URL=https://app.turniejomat.pl node scripts/qa-tournament-full-audit.mjs
 *
 * Zapisuje: scripts/qa-tournament-full-audit-report.json
 */
import { chromium, devices } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = join(__dir, 'qa-tournament-full-audit-report.json');
const APP = (process.env.APP_URL || 'https://app.turniejomat.pl').replace(/\/$/, '');
const LICENSE = process.env.LICENSE || 'TP-QDJL-CTW5';
const ORG_URL = `${APP}/?id=${encodeURIComponent(LICENSE)}`;

const VIEWPORTS = [
  {
    id: 'galaxy-a56',
    label: 'Samsung Galaxy A56',
    width: 412,
    height: 915,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['Galaxy S9+'].userAgent,
  },
  {
    id: 'tablet-11',
    label: 'Tablet 11"',
    width: 834,
    height: 1194,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['iPad Pro 11'].userAgent,
  },
  {
    id: 'laptop-14',
    label: 'Laptop 14"',
    width: 1366,
    height: 768,
    isMobile: false,
    hasTouch: false,
  },
];

const findings = [];
const startedAt = new Date().toISOString();

function add(vp, area, label, ok, detail = '', severity = 'critical', meta = {}) {
  const row = {
    viewport: vp,
    area,
    label,
    ok: !!ok,
    detail: String(detail || ''),
    severity: ok ? 'pass' : severity,
    ...meta,
  };
  findings.push(row);
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark.padEnd(4)} [${vp}|${area}] ${label}${detail ? ' — ' + detail : ''}`);
}

async function waitTournamentReady(page, timeout = 45000) {
  await page.waitForFunction(() => {
    const s = window.state;
    return !!(s && Array.isArray(s.matches) && s.matches.length > 0);
  }, { timeout }).catch(() => null);
  await page.waitForTimeout(800);
}

async function measureLayout(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const overflowX = doc.scrollWidth > window.innerWidth + 2;
    const badgeBox = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
      const parent = el.parentElement;
      return {
        id,
        display: cs.display,
        position: cs.position,
        text: (el.textContent || '').trim().slice(0, 60),
        top: Math.round(r.top),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        width: Math.round(r.width),
        height: Math.round(r.height),
        cssBottom: cs.bottom,
        cssRight: cs.right,
        visible,
        parentId: parent?.id || null,
        inHeader: !!(parent && parent.id === 'header-status-badges'),
        inHome: !!(parent && parent.id === 'status-badges-home'),
      };
    };
    const firebase = badgeBox('firebase-status');
    const save = badgeBox('last-save-info');
    let overlap = false;
    let overlapArea = 0;
    let gapPx = null;
    if (firebase?.visible && save?.visible) {
      const xOverlap = Math.max(0, Math.min(firebase.right, save.right) - Math.max(firebase.left, save.left));
      const yOverlap = Math.max(0, Math.min(firebase.bottom, save.bottom) - Math.max(firebase.top, save.top));
      overlapArea = xOverlap * yOverlap;
      overlap = overlapArea > 0;
      if (!overlap) {
        // vertical gap between stacked fixed badges (same right corner)
        const higherBottom = Math.min(firebase.bottom, save.bottom);
        const lowerTop = Math.max(firebase.top, save.top);
        gapPx = lowerTop - higherBottom;
        // if one is fully above the other, gap = lower.top - higher.bottom
        if (firebase.bottom <= save.top) gapPx = save.top - firebase.bottom;
        else if (save.bottom <= firebase.top) gapPx = firebase.top - save.bottom;
        else gapPx = -overlapArea; // intersecting
      } else {
        gapPx = -1;
      }
    }
    const headerHost = document.getElementById('header-status-badges');
    const headerHostVisible = !!(headerHost && !headerHost.hidden && getComputedStyle(headerHost).display !== 'none');
    const tabs = [...document.querySelectorAll('.nav-tabs button')].map((b) => {
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return {
        t: (b.textContent || '').trim(),
        onclick: b.getAttribute('onclick') || '',
        classes: b.className,
        visible: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden',
      };
    });
    const activeTab = document.querySelector('.tab-content.active')?.id || null;
    const nazywoBtn = tabs.find((t) => /nazywo|żywo/i.test(t.onclick + t.t));
    return {
      overflowX,
      scrollW: doc.scrollWidth,
      vw: window.innerWidth,
      vh: window.innerHeight,
      bodyClasses: document.body.className,
      tabs,
      activeTab,
      nazywoVisible: !!(nazywoBtn && nazywoBtn.visible),
      fixedBadges: {
        firebase,
        save,
        overlap,
        overlapArea,
        gapPx,
        headerHostVisible,
        placement: firebase?.inHeader || save?.inHeader ? 'header' : (firebase?.inHome || save?.inHome ? 'fixed-home' : 'other'),
      },
      headerTitle: (document.getElementById('app-header-title')?.innerText || '').slice(0, 80),
    };
  });
}

async function auditTournamentMath(page) {
  return page.evaluate(() => {
    const s = window.state || {};
    const matches = s.matches || [];
    const playoffs = s.playoffs || [];
    const groups = s.groups || {};
    const issues = [];
    const stats = {
      teams: (s.teams || []).length,
      groups: Object.keys(groups).length,
      matchesTotal: matches.length,
      matchesPlayed: matches.filter((m) => m.played).length,
      matchesPending: matches.filter((m) => !m.played).length,
      playoffsTotal: playoffs.length,
      playoffsPlayed: playoffs.filter((m) => m.played).length,
      playoffsPending: playoffs.filter((m) => !m.played).length,
    };

    // Duplicate match ids
    const ids = matches.map((m) => m.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) issues.push({ sev: 'critical', msg: 'Duplikaty ID meczów grupowych', data: [...new Set(dup)] });

    // Played matches must have numeric scores
    matches.filter((m) => m.played).forEach((m) => {
      if (m.g1 == null || m.g2 == null || isNaN(+m.g1) || isNaN(+m.g2)) {
        issues.push({ sev: 'critical', msg: `Mecz #${m.id} played bez wyniku`, data: { g1: m.g1, g2: m.g2 } });
      }
    });

    // Pending should not look "played" inconsistently
    matches.filter((m) => !m.played).forEach((m) => {
      if (m.g1 != null && m.g2 != null && (+m.g1 > 0 || +m.g2 > 0)) {
        issues.push({ sev: 'warning', msg: `Mecz #${m.id} nieplayed ma niezerowy wynik`, data: { g1: m.g1, g2: m.g2 } });
      }
    });

    // Team references
    const teamIds = new Set((s.teams || []).map((t) => t.id));
    matches.forEach((m) => {
      if (m.t1?.id && !teamIds.has(m.t1.id)) issues.push({ sev: 'critical', msg: `Mecz #${m.id} t1 poza listą teams` });
      if (m.t2?.id && !teamIds.has(m.t2.id)) issues.push({ sev: 'critical', msg: `Mecz #${m.id} t2 poza listą teams` });
    });

    // Standings vs matches: points consistency for first group
    const groupNames = Object.keys(groups);
    let standingsOk = true;
    const standingsSample = [];
    if (typeof window.getSortedGroupStats === 'function' && groupNames[0]) {
      const gn = groupNames[0];
      const st = window.getSortedGroupStats(gn);
      st.forEach((row, idx) => {
        if (row.rank !== idx + 1) {
          standingsOk = false;
          issues.push({ sev: 'warning', msg: `Grupa ${gn}: rank niesekwencyjny`, data: { idx, rank: row.rank } });
        }
        const pkt = Number(row.pkt);
        const expectedMin = (Number(row.w) || 0) * 3 + (Number(row.r) || 0);
        if (!isNaN(pkt) && pkt < expectedMin - 0.001) {
          standingsOk = false;
          issues.push({ sev: 'critical', msg: `Grupa ${gn}: pkt < 3W+R dla ${row.t?.name}`, data: { pkt, expectedMin } });
        }
        if (idx < 3) {
          standingsSample.push({
            group: gn,
            rank: row.rank,
            team: row.t?.name,
            m: row.m,
            w: row.w,
            r: row.r,
            p: row.p,
            pkt: row.pkt,
            bz: row.bz,
            bs: row.bs,
          });
        }
      });
      // Matches played count vs sum of M/2
      const playedInGroup = matches.filter((m) => m.group === gn && m.played).length;
      const sumM = st.reduce((a, r) => a + (Number(r.m) || 0), 0);
      if (sumM !== playedInGroup * 2) {
        issues.push({
          sev: 'critical',
          msg: `Grupa ${gn}: suma M (${sumM}) ≠ 2× rozegranych (${playedInGroup})`,
        });
        standingsOk = false;
      }
    } else {
      issues.push({ sev: 'warning', msg: 'Brak getSortedGroupStats lub grup' });
      standingsOk = false;
    }

    // Playoff structure
    const finals = playoffs.filter((m) => /finał|final/i.test(String(m.round || m.label || m.name || '')) || m.id === 'F' || m.slot === 'final');
    const openFinal = playoffs.filter((m) => !m.played);
    const criticalPo = [];
    playoffs.forEach((m) => {
      if (m.played && m.g1 === m.g2 && (m.pen1 == null || m.pen2 == null || m.pen1 === m.pen2)) {
        // draw without decisive pens — may be OK for 3rd place depending on rules
        criticalPo.push({ id: m.id, issue: 'remis play-off bez rozstrzygnięcia karnych', g1: m.g1, g2: m.g2, pen1: m.pen1, pen2: m.pen2 });
      }
    });

    // Scorers integrity on played matches
    let scorerIssues = 0;
    matches.filter((m) => m.played).forEach((m) => {
      const s1 = (m.s1 || []).length;
      const s2 = (m.s2 || []).length;
      if (s1 > (+m.g1 || 0) + 2) scorerIssues++;
      if (s2 > (+m.g2 || 0) + 2) scorerIssues++;
    });
    if (scorerIssues) issues.push({ sev: 'warning', msg: `Mecze z nadmiarem strzelców vs wynik: ${scorerIssues}` });

    return {
      stats,
      standingsOk,
      standingsSample,
      finalsCount: finals.length,
      openFinalCount: openFinal.length,
      criticalPo,
      issues,
      settings: {
        advCount: s.settings?.advCount,
        matchTime: s.settings?.matchTime,
        name: s.settings?.tournamentName || s.settings?.name,
      },
    };
  });
}

async function auditOrganizerTabs(page, vp) {
  const tabIds = ['nazywo', 'mecze', 'tabele', 'playoff', 'podium', 'sklady', 'ustawienia', 'archiwum'];
  for (const tab of tabIds) {
    const btn = page.locator(`.nav-tabs button[onclick*="'${tab}'"], .nav-tabs button[onclick*="${tab}"]`).first();
    const alt = page.locator(`.nav-tabs button`).filter({ hasText: new RegExp(tab === 'nazywo' ? 'żywo|Na żywo' : tab === 'playoff' ? 'Play|Puchar' : tab, 'i') }).first();
    try {
      if (await btn.count()) await btn.click({ timeout: 3000 });
      else if (await alt.count()) await alt.click({ timeout: 3000 });
      else {
        // try switchTab
        await page.evaluate((t) => { if (window.switchTab) window.switchTab(t); }, tab);
      }
      await page.waitForTimeout(500);
      const info = await page.evaluate((t) => {
        const el = document.getElementById(t);
        const active = el && el.classList.contains('active');
        const textLen = el ? (el.innerText || '').trim().length : 0;
        const overflowX = document.documentElement.scrollWidth > window.innerWidth + 2;
        const tables = el ? el.querySelectorAll('table').length : 0;
        const cards = el ? el.querySelectorAll('.match-card, .assistant-match-card, .live-match-table').length : 0;
        return { active, textLen, overflowX, tables, cards, display: el ? getComputedStyle(el).display : 'missing' };
      }, tab);
      add(vp, 'Organizer', `Zakładka ${tab}`, info.active || info.textLen > 20, `active=${info.active}, text=${info.textLen}, tables=${info.tables}, overflowX=${info.overflowX}`, info.overflowX ? 'high' : 'critical');
      if (info.overflowX) add(vp, 'Layout', `H-overflow na ${tab}`, false, `scrollW > vw`, 'high');
    } catch (e) {
      add(vp, 'Organizer', `Zakładka ${tab}`, false, e.message, 'warning');
    }
  }
}

async function auditPrint(page, vp) {
  // Ensure Na żywo is active
  await page.evaluate(() => { if (window.switchTab) window.switchTab('nazywo'); });
  await page.waitForTimeout(400);
  const printInfo = await page.evaluate(async () => {
    const before = document.body.classList.contains('print-live');
    const styleSheets = [...document.styleSheets].length;
    let printRules = 0;
    try {
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const rule of rules || []) {
          if (rule instanceof CSSMediaRule && String(rule.media).includes('print')) {
            printRules += rule.cssRules?.length || 0;
          }
        }
      }
    } catch (_) {}
    const live = document.getElementById('nazywo');
    const schedule = live?.querySelector('#live-matches-container, .live-match-table, #matches-container');
    const standings = live?.querySelector('#live-tables-container, .standings-table, .standings-group-card, #tables-container');
    const printBtnFound = !![...document.querySelectorAll('button')].find((b) => /drukuj/i.test(b.textContent || ''));
    const hasPrintFn = typeof window.printLiveView === 'function';
    return {
      before,
      printRules,
      styleSheets,
      hasSchedule: !!schedule,
      hasStandings: !!standings,
      printBtnFound,
      hasPrintFn,
      liveTextLen: (live?.innerText || '').trim().length,
      sample: (live?.innerText || '').replace(/\s+/g, ' ').slice(0, 280),
    };
  });

  // Emulate print media and capture what would print from #nazywo
  let printMedia = null;
  try {
    await page.emulateMedia({ media: 'print' });
    printMedia = await page.evaluate(() => {
      const hideCandidates = ['#app-header', 'header', '.nav-tabs', '#firebase-status', '#last-save-info', '.header-organizer-actions'];
      const hidden = hideCandidates.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, exists: false };
        const cs = getComputedStyle(el);
        return { sel, exists: true, display: cs.display, visibility: cs.visibility };
      });
      const live = document.getElementById('nazywo');
      const text = (live?.innerText || '').replace(/\s+/g, ' ').trim();
      const tables = live ? live.querySelectorAll('table').length : 0;
      const matchRows = live ? live.querySelectorAll('table tbody tr, .match-card').length : 0;
      return {
        hidden,
        textLen: text.length,
        tables,
        matchRows,
        sample: text.slice(0, 400),
        hasGroupWord: /grupa/i.test(text),
        hasScoreLike: /\d+\s*[:\-]\s*\d+/.test(text) || /vs|–|—/i.test(text),
      };
    });
    await page.emulateMedia({ media: 'screen' });
  } catch (e) {
    printMedia = { error: e.message };
    try { await page.emulateMedia({ media: 'screen' }); } catch (_) {}
  }

  printInfo.printMedia = printMedia;
  add(vp, 'Print', 'Przycisk Drukuj obecny', printInfo.printBtnFound, printInfo.hasPrintFn ? 'printLiveView OK' : 'brak printLiveView', 'high');
  add(vp, 'Print', 'Reguły @media print', printInfo.printRules > 0, `rules=${printInfo.printRules}`, 'warning');
  add(vp, 'Print', 'Na żywo ma harmonogram do druku', printInfo.hasSchedule, `textLen=${printInfo.liveTextLen}`, 'critical');
  add(vp, 'Print', 'Na żywo ma tabele do druku', printInfo.hasStandings, '', 'high');
  if (printMedia && !printMedia.error) {
    add(vp, 'Print', 'Print media: treść #nazywo niepusta', printMedia.textLen > 40, `textLen=${printMedia.textLen} tables=${printMedia.tables} rows=${printMedia.matchRows}`, 'critical');
    add(vp, 'Print', 'Print media: wygląda na harmonogram/tabele', printMedia.tables > 0 || printMedia.hasGroupWord, printMedia.sample?.slice(0, 120) || '', 'high');
  }
  return printInfo;
}

async function getShareUrls(page) {
  return page.evaluate(async () => {
    const out = { fan: null, hall: null, assistant: null, errors: [] };
    try {
      if (typeof window.buildShareUrl === 'function') {
        out.fan = window.buildShareUrl('fan');
        out.hall = window.buildShareUrl('hall');
      }
    } catch (e) {
      out.errors.push('buildShareUrl: ' + e.message);
    }
    try {
      if (typeof window.ensureAssistantShareLink === 'function') {
        // may call cloud function
        await new Promise((resolve) => {
          const prev = window.cachedAssistantToken;
          window.ensureAssistantShareLink(false);
          let n = 0;
          const t = setInterval(() => {
            n++;
            if (window.cachedAssistantToken || n > 40) {
              clearInterval(t);
              resolve();
            }
          }, 250);
        });
        out.assistant = typeof window.buildShareUrl === 'function' ? window.buildShareUrl('assistant') : null;
        out.assistantToken = !!window.cachedAssistantToken;
      }
    } catch (e) {
      out.errors.push('assistant: ' + e.message);
    }
    // Fallback URLs
    const key = window.activeKey || new URLSearchParams(location.search).get('id');
    const base = location.origin + location.pathname.replace(/index\.html$/, '');
    if (!out.fan && key) out.fan = `${base}?view=fan&id=${encodeURIComponent(key)}`;
    if (!out.hall && key) out.hall = `${base}?view=hall&id=${encodeURIComponent(key)}`;
    return out;
  });
}

async function auditFan(browser, vpDef, fanUrl, vp) {
  const context = await browser.newContext({
    viewport: { width: vpDef.width, height: vpDef.height },
    isMobile: vpDef.isMobile,
    hasTouch: vpDef.hasTouch,
    userAgent: vpDef.userAgent,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  try {
    await page.goto(fanUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await waitTournamentReady(page);
    const layout = await measureLayout(page);
    add(vp, 'Fan', 'Widok kibica załadowany', /fan-view|KIBIC|WYNIKI LIVE/i.test(layout.bodyClasses + layout.headerTitle), layout.headerTitle, 'critical');
    add(vp, 'Fan', 'Brak H-overflow', !layout.overflowX, `scrollW=${layout.scrollW} vw=${layout.vw}`, 'high');
    add(vp, 'Fan', 'Brak pageerror', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '), 'critical');

    // Try tabs via filters / mecze tabele
    for (const label of ['Mecze', 'Tabele', 'Play']) {
      const tab = page.locator('button, .nav-tabs button, .filter-btn').filter({ hasText: new RegExp(label, 'i') }).first();
      if (await tab.count()) {
        await tab.click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }
    const content = await page.evaluate(() => {
      const tables = document.querySelectorAll('table').length;
      const rows = document.querySelectorAll('.live-match-table tbody tr, .match-card').length;
      const standings = document.querySelectorAll('.standings-table, .standings-group-card').length;
      const writeControls = [...document.querySelectorAll('input[type="number"], .live-score-save, button')].filter((el) => {
        const t = (el.textContent || el.value || '').toLowerCase();
        return el.matches('input[type="number"]') || /zapisz|strzelcy|reset|zamróź/i.test(t);
      });
      const visibleWrite = writeControls.filter((el) => {
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetParent !== null;
      });
      return { tables, rows, standings, visibleWrite: visibleWrite.length };
    });
    add(vp, 'Fan', 'Lista meczów widoczna', content.rows > 0 || content.tables > 0, `rows=${content.rows} tables=${content.tables}`, 'critical');
    add(vp, 'Fan', 'Brak kontrolek zapisu wyniku (readonly)', content.visibleWrite === 0, `visibleWrite=${content.visibleWrite}`, 'critical');
  } catch (e) {
    add(vp, 'Fan', 'Wyjątek audytu kibica', false, e.message, 'critical');
  }
  await context.close();
}

async function auditHall(browser, vpDef, hallUrl, vp) {
  const context = await browser.newContext({
    viewport: { width: Math.max(vpDef.width, 1024), height: Math.max(vpDef.height, 600) },
    isMobile: false,
    hasTouch: vpDef.hasTouch,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  try {
    await page.goto(hallUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await waitTournamentReady(page);
    await page.waitForTimeout(1000);
    const hall = await page.evaluate(() => {
      const screen = document.getElementById('hall-screen');
      const live = document.getElementById('hall-live-body') || document.getElementById('hall-live-panel');
      const title = document.getElementById('hall-title')?.textContent || '';
      const qr = document.getElementById('hall-demo-qr-cell') || document.getElementById('hall-demo-qr');
      const clock = document.getElementById('hall-demo-clock');
      const played = document.getElementById('hall-played-panel');
      const overflowX = document.documentElement.scrollWidth > window.innerWidth + 2;
      return {
        hallView: document.body.classList.contains('hall-view'),
        screenDisplay: screen ? getComputedStyle(screen).display : 'missing',
        liveText: (live?.innerText || '').trim().slice(0, 120),
        title: title.slice(0, 80),
        hasQr: !!(qr && getComputedStyle(qr).display !== 'none'),
        hasClock: !!(clock && (clock.textContent || '').trim().length >= 4),
        playedVisible: !!(played && played.offsetParent !== null),
        overflowX,
      };
    });
    add(vp, 'Hall', 'Tryb hall-view', hall.hallView, hall.title, 'critical');
    add(vp, 'Hall', 'Panel LIVE widoczny', hall.screenDisplay !== 'none' && hall.liveText.length > 0, hall.liveText, 'critical');
    add(vp, 'Hall', 'Tytuł ≠ generyczny „Turniej”', !/^turniej$/i.test((hall.title || '').trim()), `title="${hall.title}"`, 'high');
    add(vp, 'Hall', 'Brak pageerror', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '), 'critical');
    add(vp, 'Hall', 'Brak H-overflow', !hall.overflowX, '', 'high');
  } catch (e) {
    add(vp, 'Hall', 'Wyjątek audytu hali', false, e.message, 'critical');
  }
  await context.close();
}

async function auditAssistant(browser, vpDef, assistantUrl, vp) {
  if (!assistantUrl || !/token=/.test(assistantUrl)) {
    add(vp, 'Assistant', 'Link asystenta z tokenem', false, 'brak tokenu — pominięto głęboki test', 'high');
    return;
  }
  const context = await browser.newContext({
    viewport: { width: vpDef.width, height: vpDef.height },
    isMobile: vpDef.isMobile,
    hasTouch: vpDef.hasTouch,
    userAgent: vpDef.userAgent,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  try {
    await page.goto(assistantUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await waitTournamentReady(page);
    const layout = await measureLayout(page);
    add(vp, 'Assistant', 'Tryb asystenta', /assistant-view|ASYSTENTA/i.test(layout.bodyClasses + layout.headerTitle), layout.headerTitle, 'critical');
    add(vp, 'Assistant', 'Brak H-overflow', !layout.overflowX, `scrollW=${layout.scrollW}`, 'high');
    const ui = await page.evaluate(() => {
      const inputs = document.querySelectorAll('#assistant-screen input[type="number"], .live-score-inputs input').length;
      const cards = document.querySelectorAll('#assistant-screen .assistant-match-card, #assistant-screen .live-match-table tbody tr').length;
      const headerBadges = document.getElementById('header-status-badges');
      const fb = document.getElementById('firebase-status');
      const save = document.getElementById('last-save-info');
      const fbInHeader = !!(headerBadges && fb && headerBadges.contains(fb));
      const saveInHeader = !!(headerBadges && save && headerBadges.contains(save));
      const orgActionsHidden = [...document.querySelectorAll('.header-organizer-actions button')].every((b) => getComputedStyle(b).display === 'none' || b.offsetParent === null);
      let overlap = false;
      let gapPx = null;
      if (fb && save) {
        const a = fb.getBoundingClientRect();
        const b = save.getBoundingClientRect();
        const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        overlap = xOverlap * yOverlap > 0;
        if (a.right <= b.left) gapPx = Math.round(b.left - a.right);
        else if (b.right <= a.left) gapPx = Math.round(a.left - b.right);
        else if (a.bottom <= b.top) gapPx = Math.round(b.top - a.bottom);
        else if (b.bottom <= a.top) gapPx = Math.round(a.top - b.bottom);
        else gapPx = -1;
      }
      const fbCs = fb ? getComputedStyle(fb) : null;
      const saveCs = save ? getComputedStyle(save) : null;
      return {
        inputs,
        cards,
        fbInHeader,
        saveInHeader,
        orgActionsHidden,
        overlap,
        gapPx,
        fbPos: fbCs?.position,
        savePos: saveCs?.position,
        fbText: (fb?.textContent || '').trim().slice(0, 40),
        saveText: (save?.textContent || '').trim().slice(0, 40),
      };
    });
    add(vp, 'Assistant', 'Lista meczów asystenta', ui.cards > 0, `cards/rows=${ui.cards} inputs=${ui.inputs}`, 'critical');
    add(vp, 'Assistant', 'Badge statusu w belce (header)', ui.fbInHeader && ui.saveInHeader, `fb=${ui.fbInHeader} save=${ui.saveInHeader}`, 'warning');
    add(vp, 'Badges', 'Asystent (wzorzec): badge’e nie nachodzą', !ui.overlap, `gapPx=${ui.gapPx} fbPos=${ui.fbPos} savePos=${ui.savePos} fb="${ui.fbText}" save="${ui.saveText}"`, 'high');
    add(vp, 'Assistant', 'Ukryte akcje organizatora (RESET/ZAMRÓŹ)', ui.orgActionsHidden, '', 'critical');
    add(vp, 'Assistant', 'Brak pageerror', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '), 'critical');
  } catch (e) {
    add(vp, 'Assistant', 'Wyjątek audytu asystenta', false, e.message, 'critical');
  }
  await context.close();
}

async function auditViewport(browser, vpDef) {
  const vp = vpDef.id;
  console.log(`\n=== ${vpDef.label} (${vpDef.width}×${vpDef.height}) ===`);
  const context = await browser.newContext({
    viewport: { width: vpDef.width, height: vpDef.height },
    isMobile: vpDef.isMobile,
    hasTouch: vpDef.hasTouch,
    userAgent: vpDef.userAgent,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  let share = { fan: null, hall: null, assistant: null };
  let math = null;
  let printInfo = null;

  try {
    await page.goto(ORG_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitTournamentReady(page);
    const ready = await page.evaluate(() => !!(window.state && window.state.matches && window.state.matches.length));
    add(vp, 'Organizer', 'Turniej załadowany (state.matches)', ready, ORG_URL, 'critical');

    const layout = await measureLayout(page);
    add(vp, 'Organizer', 'Brak H-overflow (start)', !layout.overflowX, `scrollW=${layout.scrollW} vw=${layout.vw}`, 'high');
    add(vp, 'Organizer', 'Header sędziego (nie fan/hall)', !/fan-view|hall-view|assistant-view/.test(layout.bodyClasses), layout.bodyClasses || '(none)', 'critical');
    add(vp, 'Organizer', 'Badge zapisu widoczny', !!(layout.fixedBadges.save && layout.fixedBadges.save.visible), JSON.stringify(layout.fixedBadges.save || {}), 'warning');
    add(vp, 'Organizer', 'Status Firebase widoczny', !!(layout.fixedBadges.firebase && layout.fixedBadges.firebase.visible), JSON.stringify(layout.fixedBadges.firebase || {}), 'warning');
    const badges = layout.fixedBadges || {};
    add(
      vp,
      'Badges',
      'Organizer: badge’e nie nachodzą na siebie',
      !badges.overlap,
      `overlap=${badges.overlap} area=${badges.overlapArea} gapPx=${badges.gapPx} placement=${badges.placement} fb=${JSON.stringify(badges.firebase)} save=${JSON.stringify(badges.save)}`,
      'high'
    );
    add(
      vp,
      'Badges',
      'Organizer: badge’e w belce header (wzorzec asystenta)',
      badges.placement === 'header',
      `placement=${badges.placement} (oczekiwany wzorzec: header; obecnie fixed bottom-right)`,
      'high'
    );
    add(vp, 'Organizer', 'Nav „Na żywo” widoczne', layout.nazywoVisible, JSON.stringify(layout.tabs.filter((t) => /żywo|nazywo/i.test(t.t + t.onclick))), vpDef.width <= 1365 ? 'critical' : 'warning');

    // Critical: switchTab('ustawienia') must not throw
    const switchGuard = await page.evaluate(() => {
      try {
        if (typeof window.switchTab === 'function') window.switchTab('ustawienia');
        return { threw: false };
      } catch (e) {
        return { threw: true, message: e.message };
      }
    });
    add(vp, 'Critical', 'switchTab(ustawienia) bez crasha', !switchGuard.threw, switchGuard.message || 'ok', 'critical');

    // Uneven groups risk
    const groupInfo = await page.evaluate(() => {
      const g = (window.state && window.state.groups) || {};
      const sizes = Object.fromEntries(Object.keys(g).map((k) => [k, (g[k] || []).length]));
      const counts = Object.values(sizes);
      const uneven = counts.length > 1 && Math.min(...counts) !== Math.max(...counts);
      const metaName = window.state?.meta?.tournamentName || null;
      const hallTitleFn = typeof window.renderHallView === 'function';
      return { sizes, uneven, metaName, teams: (window.state?.teams || []).length, hallTitleFn };
    });
    add(vp, 'Math', 'Grupy równe (lub 1 grupa)', !groupInfo.uneven, JSON.stringify(groupInfo.sizes), groupInfo.uneven ? 'high' : 'pass');

    math = await auditTournamentMath(page);
    add(vp, 'Math', 'Drużyny i mecze obecne', math.stats.teams >= 2 && math.stats.matchesTotal > 0, JSON.stringify(math.stats), 'critical');
    add(vp, 'Math', 'Tabele spójne (pkt / M)', math.standingsOk, math.issues.filter((i) => i.sev === 'critical').map((i) => i.msg).slice(0, 3).join('; ') || 'ok', 'critical');
    math.issues.forEach((iss) => {
      add(vp, 'Math', iss.msg, false, JSON.stringify(iss.data || {}), iss.sev === 'critical' ? 'critical' : 'warning');
    });
    if (math.criticalPo.length) {
      add(vp, 'Math', 'Play-off remisy bez karnych', false, JSON.stringify(math.criticalPo.slice(0, 3)), 'high');
    } else {
      add(vp, 'Math', 'Play-off bez nierozstrzygniętych remisów', true, `PO pending=${math.stats.playoffsPending}`, 'pass');
    }

    await auditOrganizerTabs(page, vp);
    printInfo = await auditPrint(page, vp);

    // Critical UI: license blocked screen hidden
    const licenseBlock = await page.evaluate(() => {
      const el = document.getElementById('license-blocked-screen');
      if (!el) return { exists: false, shown: false };
      const cs = getComputedStyle(el);
      return { exists: true, shown: cs.display !== 'none' && cs.visibility !== 'hidden' };
    });
    add(vp, 'Security', 'Ekran blokady licencji niewidoczny', !licenseBlock.shown, JSON.stringify(licenseBlock), 'critical');

    // Dashboard present
    const dash = await page.evaluate(() => {
      const d = document.getElementById('tournament-dashboard');
      return { has: !!d, text: (d?.innerText || '').trim().slice(0, 100), len: (d?.innerText || '').trim().length };
    });
    add(vp, 'Organizer', 'Dashboard turnieju', dash.len > 10, dash.text, 'warning');

    share = await getShareUrls(page);
    add(vp, 'Share', 'URL kibica', !!share.fan, share.fan || share.errors.join('; '), 'critical');
    add(vp, 'Share', 'URL hali', !!share.hall, share.hall || '', 'critical');
    add(vp, 'Share', 'URL asystenta (token)', !!(share.assistant && /token=/.test(share.assistant)), share.assistantToken ? 'token OK' : (share.errors.join('; ') || 'brak tokenu'), 'high');

    add(vp, 'Organizer', 'Brak pageerror JS', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '), 'critical');
  } catch (e) {
    add(vp, 'Organizer', 'Wyjątek audytu organizatora', false, e.message, 'critical');
  }

  await context.close();

  if (share.fan) await auditFan(browser, vpDef, share.fan, vp);
  if (share.hall) await auditHall(browser, vpDef, share.hall, vp);
  if (share.assistant) await auditAssistant(browser, vpDef, share.assistant, vp);

  return { share, math, printInfo, pageErrors };
}

const browser = await chromium.launch({ headless: true });
const perViewport = {};
try {
  for (const vpDef of VIEWPORTS) {
    perViewport[vpDef.id] = await auditViewport(browser, vpDef);
  }
} finally {
  await browser.close();
}

const summary = {
  startedAt,
  finishedAt: new Date().toISOString(),
  app: APP,
  license: LICENSE,
  orgUrl: ORG_URL,
  viewports: VIEWPORTS.map((v) => ({ id: v.id, label: v.label, width: v.width, height: v.height })),
  totals: {
    all: findings.length,
    pass: findings.filter((f) => f.ok).length,
    fail: findings.filter((f) => !f.ok).length,
    criticalFail: findings.filter((f) => !f.ok && f.severity === 'critical').length,
    highFail: findings.filter((f) => !f.ok && f.severity === 'high').length,
    warningFail: findings.filter((f) => !f.ok && f.severity === 'warning').length,
  },
  findings,
  perViewport: Object.fromEntries(
    Object.entries(perViewport).map(([k, v]) => [
      k,
      {
        share: v.share,
        mathStats: v.math?.stats,
        mathIssues: v.math?.issues,
        standingsSample: v.math?.standingsSample,
        settings: v.math?.settings,
        print: v.printInfo,
      },
    ])
  ),
};

writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2), 'utf8');
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(summary.totals, null, 2));
console.log('Report:', REPORT_PATH);
process.exit(summary.totals.criticalFail > 0 ? 1 : 0);
