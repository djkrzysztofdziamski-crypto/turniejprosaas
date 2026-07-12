# TIEBREAK_ENGINE_S0_REPORT.md

**Sprint S0 — wydzielenie logiki tie-break do `tiebreak-engine.js`**

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-12 |
| **Status** | ✅ Zakończone |
| **Zakres** | Wyłącznie S0 — bez losowania, modali, UX, archiwizacji decyzji |

---

## Cel S0

Wydzielić logikę rozstrzygania remisów punktowych (mini-tabela) do osobnego modułu **bez zmiany zachowania** aplikacji produkcyjnej i Demo Story.

---

## ✅ Zmodyfikowane pliki

| Plik | Typ | Opis |
|------|-----|------|
| `tiebreak-engine.js` | **NOWY** | Moduł rankingowy: mini-tabela, sortowanie, `isAbsoluteRemis` |
| `index.html` | **MOD** | `<script src="tiebreak-engine.js">`; `getSortedGroupStats` / `isAbsoluteRemis` delegują do `TiebreakEngine` |
| `scripts/tiebreak-engine.test.mjs` | **NOWY** | Testy regresji TV-REG-01 + dowód parity legacy vs engine |
| `scripts/fixtures/demo-group-fixture.mjs` | **NOWY** | Loader scenariusza demo z JSON → format `state` |

**Nie zmieniano:** `demo-story.js`, `calcTables()`, UI, Firebase, archiwum, modal losowania.

---

## Architektura `tiebreak-engine.js`

```
TiebreakEngine
├── buildRawGroupStats(teams, groupMatches)     // pkt, bz, bs, m, w, r, p
├── applyMiniTableH2H(stats, groupMatches)      // h2h_pkt, h2h_bz, h2h_bs per klaster punktowy
├── compareStandingsEntry(a, b)                 // comparator: pkt → h2h → GD grupy → BZ
├── applyManualOrder(stats, orderIds)           // tempLocalOrder / customTableOrder
├── assignRanks(stats, groupName)               // rank 1…n, group
├── getSortedGroupStats(gn, ctx)                // pipeline S0 (identyczny z legacy)
└── isAbsoluteRemis(a, b)                       // detekcja pary na cutoff
```

**Eksport dualny:**
- Przeglądarka: `window.TiebreakEngine`
- Node (testy): `module.exports`

**Integracja w `index.html`:**

```javascript
window.getSortedGroupStats = (gn) => TiebreakEngine.getSortedGroupStats(gn, {
  groups: state.groups,
  matches: state.matches,
  settings: state.settings,
  tempLocalOrder: tempLocalOrders[gn]
});
window.isAbsoluteRemis = TiebreakEngine.isAbsoluteRemis;
```

Publiczne API `window.getSortedGroupStats` **nie zmieniło sygnatury** — wszystkie wywołania (`calcTables`, `getAdvancingTeamsFull`, `moveTableTeam`) działają bez modyfikacji.

---

## ✅ Testy

### Uruchomienie

```bash
node scripts/tiebreak-engine.test.mjs
```

### Wynik (2026-07-12)

```
Passed: 19
Failed: 0
```

### Pokrycie testów

| Kategoria | Test | Wynik |
|-----------|------|-------|
| **TV-REG-01** | Top-2 grup A–D vs oczekiwane nazwy | ✅ 4/4 |
| **TV-REG-01** | Pełna kolejność + pkt + M vs `standings.json` | ✅ 4/4 |
| **Parity** | Legacy vs engine — sort algorytmiczny (bez customOrder) | ✅ Gr. A–D |
| **Parity** | Z `customTableOrder` (scenariusz demo) | ✅ Gr. A–D |
| **Parity** | `tempLocalOrder` override | ✅ Gr. A |
| **Parity** | `isAbsoluteRemis` wszystkie pary | ✅ Gr. A |
| **Synthetic** | Cykl 3-drużynowy (3 pkt każda) | ✅ |

### Playwright E2E (integracja UI)

```bash
python -m http.server 8080
node scripts/qa-demo-tables-standings.mjs
```

**Wynik:** Grupy A–D — `Match: OK` (top-2 zgodne z oczekiwanymi).

---

## ✅ Zgodność z obecnym algorytmem

### Metoda dowodu

1. **Kopia referencyjna** — w `tiebreak-engine.test.mjs` zachowano byte-for-byte logikę oryginalnego `getSortedGroupStats` z `index.html` (pre-S0) jako `referenceGetSortedGroupStats`.
2. **Porównanie pełnego snapshotu** — dla każdej drużyny w każdej grupie: `m, w, r, p, pkt, bz, bs, h2h_pkt, h2h_bz, h2h_bs, rank, id, name`.
3. **JSON.stringify equality** — engine i reference dają identyczne wyniki na:
   - scenariuszu demo (24 mecze grupowe),
   - wariantach z/bez `customTableOrder`,
   - override `tempLocalOrder`,
   - syntetycznym cyklu 3-drużynowym.

### Zachowane reguły (bez zmian semantyki)

| Reguła | Status |
|--------|--------|
| Kolejność tie-break: pkt → h2h_pkt → h2h GD → h2h BZ → group GD → group BZ | ✅ |
| Mini-tabela liczona per **klaster punktowy** (nie rekursywnie) | ✅ (S0 — jak legacy) |
| Priorytet: `tempLocalOrders` > `customTableOrder` > algorytm | ✅ |
| `isAbsoluteRemis` — tylko para, 6 kryteriów | ✅ |
| Pola wyjściowe `h2h_*`, `rank`, `group` | ✅ |

### Co **świadomie nie** zmieniono (S1+)

- Rekursywne klastry 3+ na linii awansu
- `TieBreakDecision` / audyt losowania
- Detekcja remisu absolutnego dla k > 2 drużin
- Modal losowania, nowe stany UI

---

## ⚠️ Ryzyka przed S1

| # | Ryzyko | Poziom | Opis | Mitygacja w S1 |
|---|--------|--------|------|----------------|
| R1 | **Regresja przy refaktoryzacji klastrów** | 🟠 Średni | S1 zmieni sortowanie z globalnego na rekursywne — możliwe różnice vs legacy przy remisach 3+ | Testy TV-01…TV-06; zachować `compareStandingsEntry` jako building block |
| R2 | **Dual export IIFE** | 🟢 Niski | `require()` w Node vs `<script>` w HTML — różne ścieżki ładowania | Testy Node + Playwright przed każdym merge |
| R3 | **`tempLocalOrders` poza modułem** | 🟡 Niski | Zmienna sesyjna w `index.html`, przekazywana przez ctx | W S1 rozważyć przeniesienie do wrappera lub state |
| R4 | **Demo `customTableOrder` maskuje algorytm** | 🟡 Niski | Scenariusz demo ma precomputed order — TV-REG-01 testuje z orderem; parity testuje też **bez** orderu | Osobne test vectors algorytmiczne w S1 |
| R5 | **`indexOf` w manual order** | 🟢 Niski | Drużyna spoza listy → index -1 (legacy behaviour) | Nie zmieniać w S1 bez świadomej decyzji |
| R6 | **Brak bundlera** | 🟡 Niski | Kolejność `<script>` w `<head>` — engine musi ładować się przed inline JS | Cache-bust `?v=20260712s0`; w S1 rozważyć jeden bundle |
| R7 | **Cykl 3-drużynowy niewykryty w UI** | 🟠 Średni | Obecny `isAbsoluteRemis` sprawdza tylko parę na cutoff — znane ograniczenie L3 ze spec | Główny cel S1 — `isAbsoluteTieCluster` |

---

## Rekomendacja: gotowość do S1

| Kryterium S0 | Status |
|--------------|--------|
| Moduł wydzielony | ✅ |
| 100% parity wyników | ✅ (19/19 testów) |
| TV-REG-01 | ✅ |
| E2E demo tabele | ✅ |
| Brak zmian UX | ✅ |

**S0 ukończone.** Można rozpocząć **S1 — rekursywne klastry 3+** z bazą testową `tiebreak-engine.test.mjs` i fixture demo.

---

## Następny krok (S1 — preview)

1. `identifyPointClusters` + `resolveCluster` rekursywnie
2. `isAbsoluteTieCluster` zamiast pary `isAbsoluteRemis`
3. Testy TV-01, TV-03, TV-06 (bez UI)
4. Adapter: nowy algorytm tylko gdy brak `confirmedTableOrder`

---

*Koniec raportu TIEBREAK_ENGINE_S0_REPORT.md*
