# Admin Table Layout Fix — Raport wdrożenia

**Data:** 2026-07-12  
**Plik:** `index.html`  
**Spec:** `ADMIN_TABLE_LAYOUT_FIX.md`

---

## ✅ Wykonane

| # | Element | Status |
|---|---------|--------|
| 1 | `table-layout: fixed` na `.licenses-table` | ✅ |
| 2 | `<colgroup>` z 7 kolumnami (`lic-col-*`) | ✅ |
| 3 | `<div class="lic-actions">` + `display: flex; flex-wrap: wrap` | ✅ |
| 4 | Kolumna akcji: `width/min-width: 340px` | ✅ |
| 5 | Notatka: `title` + `overflow: hidden` + `-webkit-line-clamp: 2` | ✅ |
| 6 | Ellipsis / obcięcie długich nazw (`.lic-notatka-text`) | ✅ |
| 7 | Mobile: `min-width: 960px` + sticky kolumna akcji (`≤899px`) | ✅ |
| 8 | `initAdminMonitor()` — logika bez zmian (status, block, +24h, delete, superSędzia) | ✅ |

### Zmienione miejsca w `index.html`

- **CSS** (~linie 56–78): reguły `.licenses-table`, `.lic-col-*`, `.lic-actions`, media query sticky
- **HTML** (~linie 402–420): `table.licenses-table`, `<colgroup>`, klasy w `<thead>`
- **JS** `initAdminMonitor()` (~linie 951–975): klasy komórek, `title`, wrapper `lic-actions`, `—` dla pustej notatki

---

## ✅ Wynik QA

**Metoda:** Playwright (Chromium) — `scripts/qa-admin-table-layout.mjs`  
**Dane testowe:** wiersz krótki (`Test`) + wiersz długi (>50 znaków, 97 znaków)

| Scenariusz | Wynik | Szczegóły |
|------------|-------|-----------|
| **Desktop 1920×900** | ✅ PASS | Brak nachodzenia notatka → akcje; 4 przyciski w kolumnie akcji |
| **Desktop 1366×900** | ✅ PASS | Jak wyżej; scroll poziomy tabeli OK w wąskim card (~1060px) |
| **Długa nazwa (>50 znaków)** | ✅ PASS | `overflow: hidden`, `line-clamp: 2`, `title` ustawiony, `textOverlapsActions: false` |
| **Krótka nazwa (`Test`)** | ✅ PASS | Pełny tekst widoczny (1 wiersz, bez obcięcia) |
| **table-layout: fixed** | ✅ PASS | `getComputedStyle(table).tableLayout === 'fixed'` |
| **colgroup** | ✅ PASS | Obecny w DOM |
| **lic-actions flex + wrap** | ✅ PASS | `display: flex`, `flex-wrap: wrap` |
| **min-width akcji** | ✅ PASS | CSS `min-width: 340px` (computed) |

**Checklist automatyczny:** 12/12 PASS (exit code 0)

---

## ⚠️ Znane ograniczenia

| # | Ograniczenie |
|---|--------------|
| 0 | ~~**HTML injection w `onclick` BLOKUJ**~~ — **NAPRAWIONE 2026-07-12:** `JSON.stringify(notatka)` w atrybucie HTML łamał DOM przy `"` i `>`; `confirmBlock` czyta notatkę z `title` komórki |
| 1 | **Szerokość renderowana kolumny akcji** — computed `width` ~315px przy `min-width: 340px` (algorytm `table-layout: fixed` w kontenerze ~1060px); przyciski pozostają w komórce, bez overlap z notatką |
| 2 | **Pełna notatka na mobile** — tylko atrybut `title` (long-press / hover); brak dedykowanego tooltipu |
| 3 | **Archiwum centralne** (`.archive-item`) — poza scope; ten sam problem długich nazw może wystąpić tam osobno |
| 4 | **QA bez Firebase** — wiersze testowe wstrzyknięte w DOM; pełny flow z live `licencje/` wymaga ręcznego smoke testu po zalogowaniu admina |
| 5 | **Sticky akcje** — działa przy scrollu poziomym wrappera; tło `#1e293b` (może lekko zasłaniać krawędź kolumny daty przy scrollu) |
| 6 | `-webkit-line-clamp` — wymaga WebKit/Blink; w starszych silnikach może brakować wieloliniowego ellipsis (fallback: `overflow: hidden`) |

---

## Rekomendowany smoke test ręczny (1 min)

1. `index.html?view=admin` → zaloguj jako admin  
2. Utwórz licencję z notatką >80 znaków  
3. Sprawdź: ellipsis + hover `title`, przyciski czytelne  
4. Zwęż okno <900px → scroll poziomy, sticky akcje po prawej  

---

*Koniec raportu ADMIN_TABLE_LAYOUT_FIX_REPORT.md*
