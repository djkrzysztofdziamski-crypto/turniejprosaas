# Audyt UX/UI i responsywności — Turniejomat (raport końcowy)

> Zapis: 2026-07-18. Wdrożenie etapami, **bez push na `main`** aż do akceptacji.  
> Plan źródłowy: audyt UX responsywność (Cursor).

**Werdykt ogólny:** produkt używalny na tablecie/desktopie; **nie był perfekcyjny na najmniejszych telefonach**. Główne ryzyka: climax Demo (podium), wpis wyniku Asystenta (tabela 580px), tabele kibica, Autopay na landingu.

---

## System breakpointów (kanoniczny)

| Band | Szerokość | Orientacja | Urządzenia |
|------|-----------|------------|------------|
| **MP** Mobile Portrait | **320–479** | portret | Galaxy / Pixel / iPhone małe |
| **LMP** Large Mobile Portrait | **480–767** | portret | duże telefony 6–7" |
| **TL** Tablet Landscape | **768–1365** | landscape | iPad / Air / Pro / Galaxy Tab |
| **D** Desktop | **1366–1919** | — | laptopy / monitory 24" |
| **LD** Large Desktop | **1920+** | — | 27–32" |

Literały MQ: `479`, `767`, `768`, `1366`, `1920` (+ `max-height: 500` landscape).

Sync: `css/brand-tokens.css`, `landing/css/brand-tokens.css`, `window.TP_BREAKPOINTS`, oba `responsive.css`.

---

## Problemy P0 / P1 / P2

### P0

| ID | Problem | Naprawa (wdrożenie) |
|----|---------|---------------------|
| P0-A1 | Autopay `min-width: 420px` | width 100%, bez sztywnego min |
| P0-A2 | Pricing 2-col phone landscape | 2-col od 768 |
| P0-D1 | Podium Demo bez 1-col | selektory `#view-demo-story` ≤767 |
| P0-D2 | Embed `max-height` obcina climax | pełniejszy `dvh` na podium |
| P0-D3 | Hero `nowrap` | wrap ≤479 |
| P0-F1 | Tabele `min-width: 580px` | karty / progressive ≤767 |
| P0-F2 | Bracket 4-col + overflow hidden | stack / scroll ≤767 |
| P0-S1/S2 | Asystent zawsze tabela | `renderAssistantMatchCard` ≤767 |

### P1 / P2

Sticky `top: 52px`, archive absolute actions, hall `100vh`, admin `100vw`, LMP polish, H1 `<br>`, pricing toggle wrap — patrz fazy 4–6 w kodzie.

---

## Kolejność fal

0. Tokeny + ten dokument  
1. Asystent karty ≤767  
2. Tabele / bracket kibic+sędzia  
3. Demo Finał/Podium  
4. Landing Autopay + pricing  
5. Chrome (sticky, archive, hall, admin)  
6. Align MQ + QA  

Push dopiero po akceptacji.

---

## Checklista QA (status wdrożenia lokalnego)

**Telefony portret:** 320, 360, 390, 430 — do ręcznej weryfikacji przed push.  
**Tablety landscape:** 1024×768, 1180×820, 1366×1024.  
**Desktop:** 1366, 1440, 1920, 2560.

Wdrożone lokalnie (2026-07-18, cachebust `v=20260718ux1`):

- [x] Tokeny BP + `TP_BREAKPOINTS` + raport docs
- [x] Asystent/kibic/sędzia: karty meczów ≤767
- [x] Bracket stack ≤767; bez `min-width: 580`
- [x] Demo podium 1-col + wyższy embed; hero wrap
- [x] Landing Autopay bez 420px; pricing 2-col od 768; LMP polish
- [x] Sticky `--header-h`, archive stack, hall/admin `dvh`/`100%`
- [ ] Ręczna QA na urządzeniach przed push
- [ ] Push / Netlify — tylko po akceptacji

---

## Gotowość produkcyjna (przed → po wdrożeniu lokalnym)

| Widok | Przed | Po (szacunek) |
|-------|-------|---------------|
| Landing | B | A− |
| Demo Finał | B− | B+ |
| Demo Podium | C+ | B+ |
| Kibic live/mecze | B− | B+ |
| Kibic play-off | C | B |
| Asystent | C | B+ |
| Admin | B | B |

---

## Pliki

- `css/brand-tokens.css`, `css/responsive.css`
- `index.html`
- `landing/css/brand-tokens.css`, `landing/css/responsive.css`, `landing/index.html`
- `landing/platnosci.html`, `landing/legal/legal-doc.css`
- `docs/UX_RESPONSIVE_AUDIT.md` (ten plik)
