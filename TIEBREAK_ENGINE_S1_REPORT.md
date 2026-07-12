# TIEBREAK_ENGINE_S1_REPORT.md

**Sprint S1 — rekursywne klastry remisowe 3+ drużyn**

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-12 |
| **Status** | ✅ Zakończone |
| **Zakres** | Algorytm klastrów + `getGroupTieState` — bez losowania, modali, archiwizacji, zmian UX |

---

## Cel S1

Obsługa klastrów remisowych 3+ drużyn z rekursywną mini-tabelą, przeniesienie wiedzy o remisie z `calcTables()` do silnika, zachowanie zgodności wstecznej dla par (2 drużiny) i scenariusza demo.

---

## ✅ Wdrożone zmiany

### `tiebreak-engine.js` (S1)

| Funkcja | Opis |
|---------|------|
| `buildMiniTableStatsForCluster` | Mini-tabela dla dowolnego podzbioru drużyn w klastrze |
| `compareByTiebreakCriteria` | Comparator T2/T3: mini_pkt → mini_gd → mini_bz → group_gd → group_bz |
| `identifyPointClusters` | Segmentacja po `pkt` (malejąco) |
| `identifyClustersByKey` | Segmentacja po kluczu (np. mini_pkt w rekursji) |
| `isAbsoluteTieCluster` | Detekcja remisu absolutnego dla klastra 2…n drużyn |
| `resolveCluster` | Rekursywne rozstrzyganie klastra; zwraca `ordered` + `absoluteTieClusters` |
| `resolveAllClusters` | Pipeline: raw stats → klastry punktowe → rekursja → finalna kolejność |
| `buildAlgorithmicStandings` | Standings bez manual override (detekcja remisu) |
| `computeCutoff` | `cutoffIndex`, `advPerGroup` |
| `findCriticalAbsoluteCluster` | Klaster absolutny przecinający linię awansu |
| `getGroupTieState` | Stan tie-break per grupa (silnik = źródło prawdy) |
| `getSortedGroupStats` | **Zmieniony pipeline S1:** `resolveAllClusters` zamiast globalnego sort S0 |

**Zachowane z S0:** `applyMiniTableH2H` (alias `h2h_*` dla UI), `applyManualOrder`, `isAbsoluteRemis` (para), dual export Node/browser.

### `index.html`

| Zmiana | Opis |
|--------|------|
| `calcTables()` | Detekcja remisu przez `TiebreakEngine.getGroupTieState()` zamiast inline `isAbsoluteRemis` na parze |
| Cache-bust | `tiebreak-engine.js?v=20260712s1` |

**Bez zmian wizualnych:** ten sam HTML/CSS, ten sam `rowClass` (para na cutoff), ten sam badge „REMIS ABSOLUTNY”, ten sam tekst przycisku play-off.

### `scripts/tiebreak-engine.test.mjs`

Rozszerzony o TV-01…TV-06 + regresja S0 (TV-REG-01, parity legacy, customOrder, confirmed, tempLocal).

---

## Architektura S1

```
getSortedGroupStats(gn, ctx)
  buildRawGroupStats
  resolveAllClusters
    identifyPointClusters (pkt)
    resolveCluster (rekursja)
      buildMiniTableStatsForCluster
      compareByTiebreakCriteria
      identifyClustersByKey (mini_pkt)
      isAbsoluteTieCluster
  applyMiniTableH2H  ← h2h_* compat
  applyManualOrder   ← tempLocal / customTableOrder
  assignRanks

getGroupTieState(gn, ctx)
  computeCutoff
  buildAlgorithmicStandings (bez manual)
  findCriticalAbsoluteCluster
  → state, detectRemisAlert, blocksPlayoff, criticalCluster
```

### Stany `getGroupTieState`

| Stan | Warunek |
|------|---------|
| `ABSOLUTE_TIE_CONFIRMED` | `confirmedTableOrder[gn]` |
| `GROUP_INCOMPLETE` | Nierozegrane mecze w grupie |
| `ABSOLUTE_TIE_PENDING` | Klaster absolutny na linii awansu |
| `NORMAL` | Brak remisu absolutnego wymagającego decyzji |

---

## ✅ Wyniki testów

### Unit (`node scripts/tiebreak-engine.test.mjs`)

```
Passed: 30
Failed: 0
```

| Kategoria | Testy |
|-----------|-------|
| **TV-01** | Cykl 3×1:0 — klaster 3, `blocksPlayoff`, `criticalCluster.size=3` |
| **TV-02** | Demo Gr.A — `NORMAL`, play-off OK |
| **TV-03** | Lider + cykl ABC — klaster 3 na cutoff, `blocksPlayoff` |
| **TV-04** | Para 7 pkt, H2H 2:2 — `isAbsoluteTieCluster` size=2 |
| **TV-05** | Para rozstrzygnięta H2H — `resolveCluster`, stan grupy `NORMAL` |
| **TV-06** | D wyłączony mini-tabelą, podklaster ABC absolutny (3 drużiny) |
| **TV-REG-01** | Demo top-2 grup A–D |
| **Parity S0** | Demo algo — identyczne snapshoty Gr.A–D |
| **Manual order** | `customTableOrder`, `confirmedTableOrder`, `tempLocalOrder` |

### E2E (`qa-demo-tables-standings.mjs`)

Grupy A–D — **Match: OK** (top-2 zgodne z oczekiwanymi).

---

## ✅ Zgodność wsteczna

| Wymaganie | Status | Dowód |
|-----------|--------|-------|
| Brak regresji 2 drużin | ✅ | TV-04, TV-05, parity demo Gr.A–D |
| `customTableOrder` | ✅ | 4/4 grup demo — identyczne snapshoty |
| `confirmedTableOrder` | ✅ | `ABSOLUTE_TIE_CONFIRMED`, brak alertu |
| `tempLocalOrder` | ✅ | Parity Gr.A |
| Demo scenario TV-REG-01 | ✅ | Top-2 + pełna kolejność |
| UI bez zmian | ✅ | Ten sam render `calcTables()`; logika alertu z silnika |
| `isAbsoluteRemis` API | ✅ | Zachowane; używane wewnętrznie przez `getGroupTieState` |

### Zmiana semantyczna (zamierzona S1)

| Aspekt | S0 | S1 |
|--------|----|----|
| Sortowanie 3+ w klastrze punktowym | Globalny sort + h2h całej grupy punktowej | Rekursywna mini-tabela |
| Detekcja remisu 3+ na cutoff | Tylko para `st[i]` vs `st[i+1]` | `findCriticalAbsoluteCluster` — klaster 3+ |
| Blokada play-off | Para absolutna na cutoff | Klaster absolutny 2…n na cutoff |

**Nie dotyczy** turniejów demo (brak remisu absolutnego na cutoff) ani typowych tabel bez remisów punktowych 3+.

---

## ⚠️ Nowe ryzyka przed S2

| ID | Ryzyko | P | Opis | Mitygacja S2 |
|----|--------|---|------|--------------|
| S2-R1 | **Brak `TieBreakDecision`** | 🔴 | `getGroupTieState` wykrywa remis, ale nie ma gdzie zapisać losowania | Model `tieBreakDecision` + `applyTieBreakDecision()` |
| S2-R2 | **UI nadal pokazuje parę na cutoff** | 🟠 | `rowClass` żółty tylko dla `cutoffIndex` i `cutoffIndex+1`, nie całego klastra 3+ | S3 (UX) — opcjonalnie wcześniej podświetlenie `criticalCluster.teamIds` |
| S2-R3 | **`blocksPlayoff` bez rozstrzygnięcia** | 🟠 | Play-off zablokowany, organizator ma tylko strzałki (bez audytu) | Modal losowania + audyt w S2/S3 |
| S2-R4 | **`h2h_*` vs rekursja** | 🟡 | Pola `h2h_*` nadal z całego klastra punktowego, nie podklastra rekursywnego | Wystarczy na UI S0/S1; dokumentować w `TieBreakDecision` |
| S2-R5 | **Deterministyczna kolejność przy remisie absolutnym** | 🟡 | Kolejność w klastrze 3+ przed losowaniem = kolejność wejściowa / stabilna — nie powinna implikować awansu | S2: losowanie nadpisuje `customTableOrder` |
| S2-R6 | **`GROUP_INCOMPLETE` bez UX** | 🟡 | Silnik blokuje play-off, UI nie pokazuje dedykowanego bannera | S3 UX |
| S2-R7 | **Migracja legacy `confirmedTableOrder`** | 🟡 | Brak wpisów `tieBreakDecisions` dla starych turniejów | `migrateTieBreakSettings()` w S2 |

---

## Gotowość do S2 (audytowalne losowanie)

| Kryterium | Status |
|-----------|--------|
| Rekursywne klastry 3+ | ✅ |
| `isAbsoluteTieCluster` | ✅ |
| `getGroupTieState` w silniku | ✅ |
| `calcTables()` deleguje detekcję | ✅ |
| TV-01…TV-06 | ✅ 30/30 |
| TV-REG-01 + E2E | ✅ |

---

## Odpowiedź: czy silnik jest gotowy do wdrożenia audytowalnego losowania w S2?

**Tak — silnik jest gotowy do S2.**

Uzasadnienie:

1. **`getGroupTieState`** dostarcza komplet metadanych potrzebnych do losowania: `criticalCluster.teamIds`, `size`, `absoluteTie`, `criteriaExhausted`, `blocksPlayoff`, `cutoffIndex`.
2. **`resolveCluster`** identyfikuje `absoluteTieClusters` — wiadomo **kogo** losować.
3. **`applyManualOrder`** + hook na `customTableOrder` — gotowa ścieżka zapisu wyniku po losowaniu (S2 podmieni strzałki na `applyTieBreakDecision`).
4. **Testy** pokrywają scenariusze wymagające losowania (TV-01, TV-03) vs rozstrzygnięte (TV-05).
5. **Brakujące w S2** (świadomie poza S1): `TieBreakDecision`, CSPRNG, persistencja, logi — to warstwa audytu, nie algorytmu rankingu.

---

*Koniec dokumentu TIEBREAK_ENGINE_S1_REPORT.md*
