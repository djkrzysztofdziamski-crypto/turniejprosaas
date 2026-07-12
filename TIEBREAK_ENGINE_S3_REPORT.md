# TIEBREAK_ENGINE_S3_REPORT.md

**Sprint S3 — UX remisu absolutnego**

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-12 |
| **Status** | ✅ Zakończone |
| **Zakres** | UI organizatora + widok kibica (readonly po rozstrzygnięciu). Bez zmian algorytmu, losowania CSPRNG ani modelu `TieBreakDecision`. |

---

## Cel S3

Udostępnić organizatorowi pełny przepływ rozstrzygania remisu absolutnego w UI, wykorzystując istniejące API z S1/S2:

- `TiebreakEngine.getGroupTieState()`
- `window.performTieBreakDraw()` → `performAuditedDraw()`
- `state.settings.tieBreakDecisions[]`

---

## ✅ Wdrożone elementy UI

### Nowy plik: `tiebreak-ui.js`

Warstwa prezentacji (HTML bannerów, formatowanie czasu/seedu/kolejności). Bez logiki algorytmu ani persistencji.

| API | Opis |
|-----|------|
| `buildTablesIntro()` | Legenda tabel + informacja o losowaniu |
| `buildPoBlockedBanner()` | Globalny komunikat blokady play-off |
| `buildGroupBanner(gn, tieState, opts)` | Banner grupy dla stanów PENDING / CONFIRMED / INCOMPLETE |
| `buildModalConfirmBody()` / `buildModalResultBody()` | Treść modala |
| `formatTieBreakDisplayTime()` | Czas PL |
| `formatSeedDisplay(seed, fanMode)` | Pełny seed (organizator) / skrót (kibic) |

### `index.html`

| Element | Stan / zachowanie |
|---------|-------------------|
| **Banner grupy PENDING** | `⚖ Remis absolutny` + lista drużyn + „Play-off zablokowany do czasu rozstrzygnięcia.” |
| **Przycisk** | `🎲 Losuj kolejność` → otwiera modal |
| **Modal `#tieBreakModal`** | Krok 1: potwierdzenie · Krok 2: wynik (kolejność, operator, czas, seed) |
| **Banner CONFIRMED** | `⚖ Remis absolutny — rozstrzygnięty` + kolejność + meta losowania + seed (organizator) |
| **Żółte wiersze** | Cały klaster krytyczny (`criticalCluster.teamIds`), nie tylko para na cutoff |
| **Strzałki ręczne** | Ukryte w stanie `ABSOLUTE_TIE_PENDING` (wymuszane losowanie audytowane) |
| **Play-off** | Zablokowany przy `detectRemisAlert`; odblokowany po `ABSOLUTE_TIE_CONFIRMED` |
| **Widok kibica** | PENDING: komunikat „zostanie uzupełniona”; CONFIRMED: „ustalona losowaniem” (bez pełnego seedu, bez przycisków) |
| **readonlyCSS** | Ukrywa `.tiebreak-draw-btn`, `#tb-draw-run`, `.tiebreak-action-btn` |

### Harness QA: `tiebreak-s3-harness.html`

Minimalna strona testowa (scenariusz TV-01) do Playwright — bez Firebase.

---

## Mapowanie stanów

| `getGroupTieState().state` | UI organizatora | UI kibica |
|----------------------------|-----------------|-----------|
| `ABSOLUTE_TIE_PENDING` | Banner + przycisk losowania + blokada play-off | Banner informacyjny, bez losowania |
| `ABSOLUTE_TIE_CONFIRMED` | Banner wyniku + badge „Rozstrzygnięto losowaniem” | Readonly komunikat + kolejność |
| `GROUP_INCOMPLETE` | Szary banner oczekiwania na wyniki | — |
| `NORMAL` | Brak banneru tie-break | Brak banneru tie-break |

---

## ✅ Testy

### `scripts/tiebreak-s3-ui.test.mjs`

| ID | Opis | Wynik |
|----|------|-------|
| UI-UNIT-01…05 | Helpery `TiebreakUI` (bannery pending/confirmed, fan) | ✅ |
| UI-STATE-01…03 | PENDING → draw → CONFIRMED, odblokowanie play-off | ✅ |
| UI-01 | Harness: banner, 3 żółte wiersze, play-off disabled | ✅ |
| UI-01b | Globalny banner blokady play-off | ✅ |
| UI-02 | Modal draw → decyzja zapisana, play-off enabled | ✅ |
| UI-02b | Modal: kolejność + seed 32 hex | ✅ |
| UI-03 | Fan readonly: brak przycisku, komunikat po decyzji | ✅ |

**Uruchomienie:**

```bash
node scripts/tiebreak-s3-ui.test.mjs
node scripts/tiebreak-engine.test.mjs
node scripts/tiebreak-draw.test.mjs
```

Regresja S0/S1/S2 pozostaje bez zmian w algorytmie.

---

## ✅ Scenariusze QA (manualne)

| # | Scenariusz | Kroki | Oczekiwany wynik |
|---|------------|-------|------------------|
| QA-01 | Remis 3-drużynowy (TV-01) | Rozegraj cykl 1-0 · wpisz wyniki · Tabele | Banner PENDING, 3 żółte wiersze, play-off zablokowany |
| QA-02 | Losowanie | „Losuj kolejność” → potwierdź w modalu | Wynik w modalu (kolejność, czas, operator, seed), tabela zaktualizowana |
| QA-03 | Odblokowanie play-off | Po QA-02 | Przycisk „START PLAY-OFF” aktywny |
| QA-04 | Reload | F5 po losowaniu | Banner CONFIRMED, ta sama kolejność, brak ponownego losowania |
| QA-05 | Kibic live | `?view=fan&id=KEY` po decyzji | Komunikat readonly, brak seedu pełnego i przycisków |
| QA-06 | Kibic pending | Fan przed losowaniem | Brak przycisku losowania, komunikat oczekiwania |
| QA-07 | Reset tabeli | „AUTOMAT” po losowaniu (jeśli dostępny) | Decyzja usunięta (S2), powrót do PENDING |
| QA-08 | Remis 2-drużynowy | Para na linii awansu | Banner + modal działają dla klastra 2 |

---

## ⚠️ Ograniczenia przed S4

| Obszar | Status S3 | Plan S4+ |
|--------|-----------|----------|
| **PDF protokołu** | Brak sekcji rozstrzygnięć tie-break | UI-05 |
| **Archiwum `_meta_tiebreaks`** | Decyzje w `settings`, brak dedykowanej sekcji archiwum | S4 |
| **Demo Story TV-01** | Demo używa `qualifiedTeamIds` — bez remisu absolutnego | S5 opcjonalny |
| **Animacja losowania 1–2 s** | Natychmiastowy wynik po `performTieBreakDraw` | Kosmetyka |
| **Kopiuj seed** | Wyświetlanie tekstowe, bez przycisku clipboard | S4 |
| **Fair Play / PDF / archiwum centralne** | Poza zakresem | S4+ |
| **Potwierdzenie dwuetapowe (Losuj → preview → Zatwierdź)** | Jeden krok: modal confirm → draw+save (API S2) | Wymagałoby zmiany API losowania |

---

## Pliki zmienione / dodane

| Plik | Zmiana |
|------|--------|
| `tiebreak-ui.js` | **NOWY** — helpery UI |
| `index.html` | Modal, CSS, `calcTables`, handlers, readonlyCSS |
| `tiebreak-s3-harness.html` | **NOWY** — harness Playwright |
| `scripts/tiebreak-s3-ui.test.mjs` | **NOWY** — testy S3 |
| `TIEBREAK_ENGINE_S3_REPORT.md` | **NOWY** — ten raport |

**Bez zmian:** `tiebreak-engine.js`, `tiebreak-audit.js` (algorytm, CSPRNG, model danych).

---

## Werdykt produkcyjny

**Obsługa remisu absolutnego jest funkcjonalnie kompletna dla pierwszego klienta produkcyjnego w zakresie organizatora** (wykrycie → blokada play-off → audytowalne losowanie → odblokowanie → widok kibica po decyzji).

**Do pełnego „production polish” przed pierwszym turniejem na żywo zalecane S4:**

- sekcja tie-break w PDF,
- readonly w archiwum kibica,
- smoke regresji demo,
- opcjonalnie animacja / kopiuj seed.

Bez S4 organizator może bezpiecznie rozstrzygnąć remis na hali; brakuje głównie materiałów dokumentacyjnych dla kibica/archiwum.
