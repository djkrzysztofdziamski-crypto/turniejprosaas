# Turniejomat — status pakietu premium UI

**Data:** 2026-07-13 · Pakiety 1–5 wdrożone lokalnie (commit po review).

## Zrobione (pakiet 1–4)

| # | Zmiana | Pliki |
|---|--------|-------|
| 1 | **WebP** logo/icon (~54 KB + ~42 KB) | `logo.webp`, `icon.webp`, `landing/*.webp` |
| 1 | `<picture>` WebP + fallback PNG | `index.html`, `landing/index.html` |
| 1 | Skrypt regeneracji | `scripts/optimize-brand-images.mjs` |
| 2 | **Design tokens + fonty** | `css/brand-tokens.css`, `landing/css/brand-tokens.css` |
| 3 | Panel sędziego — jasne tło | `index.html` `#view-app` |
| 4 | Bramka Turniejomat + `BRAND` | `index.html` |
| 4 | Stopka ujednolicona + Kris gradient | `index.html`, `landing/`, `demo-story` |

## Zrobione (pakiet 5+)

| # | Zmiana | Pliki |
|---|--------|-------|
| 5 | **Drabinka play-off** — kolumny ćwierć / pół / finał | `renderPlayoffBracketHTML`, CSS `.playoff-bracket` |
| 5 | **Karty meczów** — status played/pending, hover, lewa kreska | `.match-card--played/pending/po` |
| 5 | **Skin widoku kibica** — `body.fan-view`, gradient tła | `index.html` |
| 5 | **Podium** — scena medalowa `.podium-scene` + emoji medali | `renderPodium()` |
| 5 | **Demo Story** — copy Turniejomat, cennik 79/149 | `demo-story.js` |
| 5 | **PDF raport** — logo Turniejomat na górze | `exportToPDF()` |
| 5 | **Admin KPI** — kafelki: licencje, aktywne, archiwa | `#admin-kpi-strip`, `renderAdminKpi()` |

## Kolejny etap (opcjonalnie)

- [ ] Animacje wejścia drabinki
- [ ] Dark mode kibica (osobny toggle)
- [ ] PDF — pełny branding stopki
- [ ] Admin — wykres aktywności w czasie

## Deploy

```bash
git add index.html demo-story.js PREMIUM_UI_STATUS.md
git commit -m "feat: premium UI pakiet 5 — drabinka, karty, fan skin, podium, admin KPI"
git push
```

Landing (`landing/`) — osobny deploy Netlify jeśli zmieniasz tylko app.

## Lokalny podgląd

```bash
python -m http.server 8765
# http://127.0.0.1:8765/index.html?id=DEMO-2026
```
