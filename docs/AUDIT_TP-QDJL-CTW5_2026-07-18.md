# Audyt turnieju TP-QDJL-CTW5 (pełny)

**Data:** 2026-07-18 (re-run po deployu, wieczór)  
**URL:** https://app.turniejomat.pl/?id=TP-QDJL-CTW5  
**Viewporty:** Samsung Galaxy A56 (412×915) · Tablet 11" (834×1194) · Laptop 14" (1366×768)  
**Narzędzie:** Playwright (`scripts/qa-tournament-full-audit.mjs`)  
**Raport JSON:** `scripts/qa-tournament-full-audit-report.json`  
**Wynik skryptu:** 150 checków · **141 PASS** · **9 FAIL** (3 critical · 3 high · 3 warning)

## Werdykt

Turniej na produkcji **działa end-to-end**. Fixy z `main` (`c3fb43f`) **są na `app.turniejomat.pl`**.

### D4 smoke (kryteria deployu) — PASS

| # | Check | Wynik |
|---|--------|--------|
| 1 | Badge sędziego w belce, bez overlap | PASS (`placement=header`, overlap=false) |
| 2 | „Na żywo” widoczne na telefonie/tablecie | PASS |
| 3 | `switchTab('ustawienia')` bez crasha | PASS (null-guard) |
| 4 | Hala: tytuł ≠ „Turniej” | PASS (`title="TP-QDJL-CTW5"`) |
| 5 | Druk: treść harmonogramu/tabel | PASS |

Badge zapisu: **„Zapisano przed chwilą”** (nie fałszywe „Oczekiwanie…”).

### Pozostałe FAIL (nie blokują deployu)

| FAIL | Ocena |
|------|--------|
| Grupy A:5 / B:4 | Dane turnieju (9 drużyn) — oczekiwane; banner nierównych grup w kodzie |
| Zakładka „Mecze” na MP/tablet | Skrypt klika `nav-desktop-only` first; na mobile jest osobny `nav-mobile-only` — **false positive QA** |
| Zakładka „Tabele” na laptopie | Analogicznie: `nav-mobile-only` ukryte ≥1366 — tabele w „Na żywo” |
| Zakładka „ustawienia” active=null | Brak panelu `#ustawienia` by design; guard zapobiega crashowi |

## Stan turnieju

| Metryka | Wartość |
|--------|---------|
| Drużyny | 9 |
| Mecze | 24 / 24 |
| Faza | Play-Off (zakończony) |
| Firebase | Online |
| Badge zapisu | „Zapisano przed chwilą” |
| Hala podium | 1. Drużyna 5 · 2. Drużyna 7 · 3. Drużyna 1 |

## Linki

- Sędzia: https://app.turniejomat.pl/?id=TP-QDJL-CTW5  
- Kibic: https://app.turniejomat.pl/?view=fan&id=TP-QDJL-CTW5  
- Hala: https://app.turniejomat.pl/?view=hall&id=TP-QDJL-CTW5  
