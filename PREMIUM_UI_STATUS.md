# Turniejomat — status pakietu premium UI (1–4)

**Data:** 2026-07-13 · **Bez commita** — gotowe do review + push z innymi zmianami.

## Zrobione (pakiet 1–4)

| # | Zmiana | Pliki |
|---|--------|-------|
| 1 | **WebP** logo/icon (~54 KB + ~42 KB zamiast ~1,2 MB + ~1 MB) | `logo.webp`, `icon.webp`, `landing/*.webp` |
| 1 | `<picture>` WebP + fallback PNG | `index.html`, `landing/index.html` |
| 1 | Skrypt regeneracji | `scripts/optimize-brand-images.mjs` |
| 2 | **Design tokens + fonty** (Plus Jakarta Sans, DM Sans) | `css/brand-tokens.css`, `landing/css/brand-tokens.css` |
| 3 | **Panel sędziego** — jasne tło zamiast murawy | `index.html` `#view-app` |
| 3 | Nagłówek app — ciemny granat (`--color-header-bg`) | `index.html` |
| 4 | **Bramka** — Turniejomat + „powered by TurniejPro” | `#view-login` |
| 4 | Stała `BRAND` w JS (nagłówki app) | `index.html` |
| 4 | Stopka + tytuł strony | `index.html` |

## Oczekujące na ten sam commit (z wcześniejszych sesji)

- Fix admin PODGLĄD / PRZEGLĄDAJ RAPORT → `app.turniejomat.pl` (warstwa A+B)
- Link bramki: „Cennik i zamówienie licencji”
- `LANDING_SITE_URL` → `https://turniejomat.pl` (nadal `stronaturniejomat.netlify.app`)

## Pakiet 5+ (kolejny etap — nie zrobione)

- [ ] Drabinka play-off wizualna (CSS tree)
- [ ] Redesign kart meczów
- [ ] Skin widoku kibica (`?view=fan`)
- [ ] Podium — scena medalowa
- [ ] `demo-story.js` — rebrand copy na Turniejomat
- [ ] PDF raport — logo Turniejomat
- [ ] Admin dashboard (kafelki KPI)

## Deploy checklist

### App (repo root → Netlify app site)
```bash
git add css/ logo.webp icon.webp index.html scripts/optimize-brand-images.mjs
git commit -m "..."
git push
```

### Landing (osobny site `stronaturniejomat`)
Skopiuj zaktualizowany folder `landing/` (zawiera `css/`, `*.webp`) — drag & drop lub git jeśli podłączony.

## Lokalny podgląd
```bash
python -m http.server 8765
# http://127.0.0.1:8765/index.html — bramka + app
# landing/index.html — osobno
```

## Regeneracja obrazów po zmianie PNG
```bash
node scripts/optimize-brand-images.mjs
```
