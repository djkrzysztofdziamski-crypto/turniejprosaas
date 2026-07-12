# TIEBREAK_ENGINE_S0_REVIEW.md

**Code review architektury — Sprint S0 (tie-break engine extraction)**

| Pole | Wartość |
|------|---------|
| **Data review** | 2026-07-12 |
| **Zakres review** | S0 wyłącznie — bez implementacji S1 |
| **Dokumenty referencyjne** | `GROUP_TIEBREAKER_SPEC.md`, `GROUP_TIEBREAKER_IMPLEMENTATION_PLAN.md`, `TIEBREAK_ENGINE_S0_REPORT.md` |
| **Weryfikacja testowa** | 19/19 unit PASS, E2E `qa-demo-tables-standings.mjs` PASS |

---

## 1. Executive summary

S0 **poprawnie** wydzielił rdzeń rankingowy (statystyki grupowe, mini-tabela punktowa, sortowanie, detekcja pary remisu absolutnego) do `tiebreak-engine.js` przy zachowaniu 100% parity z legacy. Warstwa UI w `index.html` nadal **świadomie** posiada politykę awansu, detekcję remisu na linii cutoff i blokadę play-off — zgodnie z zakresem S0 i planem S1.

Ekstrakcja nie wprowadza regresji i tworzy testowalną bazę pod rekursywne klastry. Rozproszenie logiki między silnik a UI **nie blokuje S1**, ale wymaga dyscypliny: w S1 nowa logika klastrów musi trafić do silnika, a `calcTables()` powinien stać się cienkim konsumentem metadanych (`getGroupTieState`), nie miejscem obliczeń.

---

## 2. Analiza `tiebreak-engine.js`

### 2.1 Co jest w silniku (kompletne dla S0)

| Funkcja | Odpowiedzialność | Ocena |
|---------|------------------|-------|
| `buildRawGroupStats` | Agregacja M/W/R/P, pkt, BZ, BS z rozegranych meczów | ✅ Czysta, bez side-effectów poza nowymi obiektami |
| `applyMiniTableH2H` | `h2h_pkt`, `h2h_bz`, `h2h_bs` per **klaster punktowy** | ✅ Zgodna z legacy |
| `compareStandingsEntry` | Comparator: pkt → h2h → GD mini → BZ mini → GD grupy → BZ grupy | ✅ Wyeksportowany — gotowy building block S1 |
| `applyManualOrder` | Nadpisanie kolejności z tablicy ID | ✅ |
| `assignRanks` | `rank`, `group` | ✅ |
| `getSortedGroupStats` | Pipeline: raw → mini → sort → manual → rank | ✅ API ctx-based, testowalne |
| `isAbsoluteRemis` | Para drużyn — 6 kryteriów identyczności | ✅ Zgodna z legacy (L3 — znane ograniczenie) |

### 2.2 Mocne strony architektury

1. **Pure functions** — brak zależności od DOM, Firebase, `state` globalnego.
2. **Kontekst `ctx`** — jawne wejścia (`groups`, `matches`, `settings`, `tempLocalOrder`) umożliwiają testy Node bez przeglądarki.
3. **Dual export** — `window.TiebreakEngine` + `module.exports` — wzorzec sprawdzony (19/19 testów).
4. **Granularny eksport** — S1 może złożyć `resolveCluster()` z `buildRawGroupStats`, `applyMiniTableH2H`, `compareStandingsEntry` bez przepisywania od zera.
5. **Mutacja kontrolowana** — `applyMiniTableH2H` mutuje stats in-place (jak legacy); zachowanie udokumentowane w JSDoc.

### 2.3 Słabe strony / luki (akceptowalne w S0, istotne dla S1)

| # | Obserwacja | Wpływ na S1 |
|---|------------|-------------|
| W1 | **Brak rekursji** — `applyMiniTableH2H` liczy mini-tabelę per klaster punktowy, potem **globalny** `sort(compareStandingsEntry)` | S1 musi **zastąpić** ten fragment pipeline'u, nie rozszerzyć go |
| W2 | **`h2h_*` jako alias semantyczny** — w modelu rekursywnym mini-tabela dotyczy podklastra, nie całego klastra punktowego | Potrzebny adapter kompatybilności UI (plan S1.4) |
| W3 | **Brak metadanych klastra** — wynik to płaska tablica `TeamStanding[]` bez `{ absoluteTie, clusterTeamIds, criteriaExhausted }` | S1 wymaga rozszerzenia API (np. `getGroupStandingsResult`) |
| W4 | **`isAbsoluteRemis` tylko para** — nie wykrywa remisu 3+ na linii awansu | Główny cel S1; obecne API nie wystarczy — nowa funkcja |
| W5 | **Brak `cutoffIndex` / `advPerGroup` w silniku** — linia awansu liczona w UI | S1: przenieść do `getGroupTieState(gn, ctx)` |
| W6 | **`applyManualOrder` + `indexOf(-1)`** — legacy behaviour; drużyna spoza listy sortuje się na początek | Nie zmieniać bez świadomej decyzji produktowej |

### 2.4 Ocena jakości kodu silnika

| Kryterium | Ocena |
|-----------|-------|
| Czytelność | ✅ Dobre nazewnictwo, JSDoc typów |
| Testowalność | ✅ Wysoka |
| Rozszerzalność pod S1 | 🟡 Dobra baza, wymaga nowego pipeline'u wewnątrz `getSortedGroupStats` |
| Spójność z legacy | ✅ Potwierdzona testami parity |

---

## 3. Analiza `calcTables()`

**Lokalizacja:** `index.html` ~1610–1674

### 3.1 Odpowiedzialności (mieszane: render + polityka tie-break)

| Fragment | Warstwa | W silniku? |
|----------|---------|------------|
| Sync Demo Story state | Integracja embed | ❌ (OK — UI) |
| Banner informacyjny | Render | ❌ (OK — UI) |
| `getAdvancingTeamsFull()` → `advIds` | Polityka awansu międzygrupowego | ❌ |
| `cutoffIndex = floor(advCount / numGroups) - 1` | **Polityka linii awansu** | ❌ |
| `isAbsoluteRemis(st[cutoffIndex], st[cutoffIndex+1])` | **Detekcja remisu absolutnego** | ⚠️ Wywołuje silnik, ale **orchestracja w UI** |
| `anyUnconfirmedAbsoluteRemis` + blokada play-off | **Gate business rule** | ❌ |
| `qualifiedTeamIds` override awansu | Demo / override prezentacyjny | ❌ |
| `isPewniak` (miejsce 1 przy małej liczbie grup) | Reguła awansu specjalna | ❌ |
| Klasa `absolute-remis-row` tylko dla **pary** na cutoff | **UX remisu** | ❌ |
| Strzałki, confirm, reset | Manual override workflow | ❌ |
| Render HTML tabel | Prezentacja | ❌ |

### 3.2 Werdykt: `calcTables()` jest „grubym” konsumentem

`calcTables()` **nie duplikuje** logiki sortowania (deleguje do `getSortedGroupStats`), ale **kumuluje reguły biznesowe tie-break**, które w docelowej architekturze (spec §6, plan S1.5) powinny pochodzić z silnika jako `getGroupTieState()`.

**Stan po S0:** akceptowalny — to był zakres „extract engine, don't change UI”.

**Ryzyko dla S1:** jeśli rekursywne klastry zostaną zaimplementowane tylko w sortowaniu, a `calcTables()` nadal sprawdza parę na `cutoffIndex`, remis 3-drużynowy pozostanie niewykryty w UI mimo poprawnego (lub niepoprawnego) sortowania.

### 3.3 Konkretne antywzorce do uniknięcia w S1

```
❌ Dodawanie logiki klastrów 3+ bezpośrednio w calcTables()
❌ Duplikowanie compareStandingsEntry w index.html
✅ calcTables() czyta: standings + tieState z silnika → renderuje
```

---

## 4. Mapa wywołań `getSortedGroupStats()`

| # | Miejsce | Plik | Cel wywołania | Uwagi |
|---|---------|------|---------------|-------|
| 1 | Wrapper | `index.html:1600` | Delegacja do `TiebreakEngine` | ✅ Cienka warstwa adaptera |
| 2 | `calcTables()` | `index.html:1622` | Render tabeli per grupa | Główny konsument |
| 3 | `getAdvancingTeamsFull()` | `index.html:1680` | Zbieranie statystyk wszystkich grup przed awansem | Pośredni wpływ na play-off |
| 4 | `moveTableTeam()` | `index.html:1686` | Odczyt bieżącej kolejności przed swap | Manual override — OK poza silnikiem |

**Inne pliki:** brak wywołań produkcyjnych poza `index.html`. Testy: `tiebreak-engine.test.mjs`, fixture loader.

### 4.1 Łańcuch zależności awansu do play-off

```
getSortedGroupStats(gn)          ← silnik (kolejność w grupie)
        ↓
getAdvancingTeamsFull()          ← index.html (sort międzygrupowy + slice)
        ↓
calcTables() / generujPlayoff()  ← UI + drabinka
```

**Logika międzygrupowa** (`getAdvancingTeamsFull`, linie 1678–1682):

```javascript
allStats.sort((a,b) => a.rank - b.rank || b.pkt - a.pkt || (b.bz-b.bs) - (a.bz-a.bs));
return allStats.slice(0, advCount).map(s => s.t);
```

Ta reguła **nie jest** w silniku — dotyczy rankingu globalnego turnieju (miejsce w grupie → pkt → GD), nie tie-breaka wewnątrz grupy. Dla S1: **może pozostać w UI**, o ile kolejność w grupie z silnika jest poprawna.

---

## 5. Mapa wywołań `isAbsoluteRemis()`

| # | Miejsce | Plik | Kontekst |
|---|---------|------|----------|
| 1 | Re-export | `index.html:1676` | `window.isAbsoluteRemis = TiebreakEngine.isAbsoluteRemis` |
| 2 | `calcTables()` | `index.html:1631` | **Jedyne** wywołanie produkcyjne — para `[cutoffIndex, cutoffIndex+1]` gdy `!isConfirmed` |

**Testy:** `tiebreak-engine.test.mjs` — parity wszystkich par w Gr. A.

### 5.1 Ocena

- Silnik **posiada** implementację detekcji.
- UI **posiada** politykę *kiedy* i *kogo* sprawdzać — wyłącznie sąsiadów na linii cutoff, tylko para.
- Brak innych callerów — refaktoryzacja S1 (`isAbsoluteTieCluster` → `getGroupTieState`) ma **jeden punkt integracji** w `calcTables()` — niskie ryzyko rozproszenia.

---

## 6. Czy cała logika tie-break jest już w silniku?

### 6.1 Podział odpowiedzialności (stan po S0)

| Warstwa | Co obejmuje | Gdzie |
|---------|-------------|-------|
| **Ranking w grupie** | Statystyki, mini-tabela punktowa, sort, manual order, rank | ✅ `tiebreak-engine.js` |
| **Detekcja remisu absolutnego (para)** | Algorytm 6 kryteriów | ✅ `tiebreak-engine.js` |
| **Detekcja remisu absolutnego (klaster 3+)** | — | ❌ Nie zaimplementowane (S1) |
| **Linia awansu (cutoff)** | `floor(advCount / numGroups) - 1` | ❌ `calcTables()` |
| **Gate play-off** | `anyUnconfirmedAbsoluteRemis` | ❌ `calcTables()` |
| **Awans międzygrupowy** | Sort + top-N | ❌ `getAdvancingTeamsFull()` |
| **Override demo** | `qualifiedTeamIds` | ❌ `calcTables()` + `demo-story.js` |
| **Manual override workflow** | Strzałki, confirm, reset, `tempLocalOrders` | ❌ `index.html` |
| **Persistencja kolejności** | `customTableOrder`, `confirmedTableOrder` | ❌ `state.settings` + Firebase |

### 6.2 Werdykt

**Nie** — cała logika tie-break **nie jest** w silniku, i **nie powinna była być** po S0.

W silniku jest **rdzeń matematyczny rankingu grupowego** (≈ 70% logiki sortowania). Pozostałe **≈ 30% to polityka produktowa i UX**, świadomie w UI — zgodnie z planem wdrożenia fazowego.

**Duplikacji rankingu w UI nie ma** — to kluczowy sukces S0.

---

## 7. Rozproszone fragmenty logiki — ocena ryzyka

| Fragment | Lokalizacja | Ryzyko rozproszenia | Rekomendacja S1 |
|----------|-------------|---------------------|-----------------|
| `cutoffIndex` | `calcTables()` | 🟠 Średnie | Przenieść do `getGroupTieState(gn, ctx)` |
| Detekcja remisu | `calcTables()` linia 1630–1631 | 🟠 Średnie | Konsumować `tieState.absoluteTiePending` z silnika |
| Żółte wiersze (para vs klaster) | `calcTables()` linia 1642 | 🟠 Średnie | `tieState.criticalClusterTeamIds` → klasa CSS dla wszystkich |
| Blokada play-off | `calcTables()` linia 1671 | 🟡 Niskie | `tieState.blocksPlayoff` z silnika |
| `tempLocalOrders` | Zmienna modułowa `index.html:1200` | 🟡 Niskie | Zachować w UI; przekazywać przez ctx (obecny wzorzec OK) |
| `customTableOrder` budowany w demo | `demo-story.js:472` | 🟢 Niskie | Bez zmian — override prezentacyjny |
| Czyszczenie order przy losowaniu grup | `losujGrupy()` linia 1441 | 🟢 Niskie | W S3/S2 dodać czyszczenie `tieBreakDecisions` |

---

## 8. Gotowość architektury do S1

### 8.1 Co jest gotowe

| Element | Status |
|---------|--------|
| Testowalny silnik bez DOM | ✅ |
| Building blocks (`buildRawGroupStats`, `compareStandingsEntry`) | ✅ |
| Fixture demo + TV-REG-01 | ✅ |
| Cienki adapter `window.getSortedGroupStats` | ✅ |
| Jeden punkt integracji `isAbsoluteRemis` w UI | ✅ |
| Parity legacy udokumentowana i automatyczna | ✅ |

### 8.2 Co S1 musi dodać (zgodnie z planem — nie blokuje startu)

1. **`identifyPointClusters` / `resolveCluster`** — rekursja w mini-tabeli
2. **`isAbsoluteTieCluster`** — zastąpienie semantyki pary
3. **`getGroupTieState(gn, ctx)`** — cutoff + stan + metadane klastra
4. **Adapter `h2h_*`** — kompatybilność z renderem tabeli
5. **Testy TV-01, TV-03, TV-06** — przed zmianą UI

### 8.3 Proponowany przepływ S1 (architektura docelowa)

```
tiebreak-engine.js
├── [S0] buildRawGroupStats, compareStandingsEntry, applyManualOrder
├── [S1] buildMiniTable(cluster), resolveCluster (rekursja)
├── [S1] getGroupStandings(gn, ctx)     ← zastępuje wewnętrzny pipeline getSortedGroupStats
├── [S1] getGroupTieState(gn, ctx)       ← cutoff, criticalCluster, blocksPlayoff
└── [S0→deprecate] isAbsoluteRemis       ← wrapper na cluster size === 2

index.html
├── getSortedGroupStats(gn)              ← delegacja (sygnatura bez zmian)
├── calcTables()                         ← czyta tieState, nie liczy cutoff logic inline
└── moveTableTeam / confirm / reset      ← bez zmian w S1 (S2 audyt)
```

---

## 9. Ryzyka przy wdrażaniu rekursywnych klastrów (S1)

| ID | Ryzyko | P | Opis | Mitygacja |
|----|--------|---|------|-----------|
| S1-R1 | **Regresja sortowania demo** | 🟠 | Scenariusz demo ma `customTableOrder` — maskuje algorytm | Testy **bez** customOrder (już w parity); TV-01…TV-06 |
| S1-R2 | **Globalny sort vs rekursja** | 🔴 | Obecny pipeline: mini-tabela + jeden sort. Rekursja wymaga **zastąpienia**, nie dopisania | Nowa funkcja `resolveAllClusters`; zachować stary pipeline za flagą `legacyMode` tylko na czas migracji (opcjonalnie) |
| S1-R3 | **UI sprawdza parę, silnik sortuje klaster** | 🔴 | Niespójność: poprawne sortowanie 3 drużyn, ale UI nie blokuje play-off | S1.5 **przed** lub **razem** z S1.1 — `getGroupTieState` w calcTables |
| S1-R4 | **`h2h_*` semantyka** | 🟠 | UI/tooltipy zakładają h2h = mini-tabela punktowa; rekursja zmienia znaczenie dla podklastrów | Denormalizacja `mini_*` per wiersz po finalnym rankingu |
| S1-R5 | **Turnieje z `confirmedTableOrder`** | 🟡 | Retroaktywne przeliczenie może zmienić kolejność | Spec: nie przeliczać gdy confirmed; silnik respektuje `applyManualOrder` na końcu pipeline |
| S1-R6 | **Cykl 3-drużynowy — kolejność nierozstrzygnięta** | 🟠 | Legacy sort daje deterministyczną kolejność (np. przez BZ); S1 powinien oznaczyć `absoluteTie: true`, nie losować | S1 = detekcja + flaga; losowanie = S3 |
| S1-R7 | **`getAdvancingTeamsFull` bierze złą kolejność** | 🟠 | Przy nierozstrzygniętym klastrze awans może być błędny | `getGroupTieState.blocksPlayoff` + walidacja przed slice |
| S1-R8 | **Test reference w test.mjs** | 🟡 | `referenceGetSortedGroupStats` odzwierciedla legacy — po S1 trzeba go zaktualizować lub oznaczyć `@legacy` | Osobny plik `tiebreak-engine.legacy.test.mjs` |

### 9.1 Największe ryzyko S1 (top 3)

1. **S1-R2** — podmiana środka pipeline'u bez regresji (wymaga TV-* przed merge)
2. **S1-R3** — rozjazd silnika i UI detekcji (wymaga `getGroupTieState` w tej samej iteracji)
3. **S1-R5** — istniejące turnieje live z ręcznym układem (wymaga respektowania `confirmedTableOrder`)

---

## 10. Checklist review S0

| Pytanie | Odpowiedź |
|---------|-----------|
| Czy logika sortowania/min-tabeli opuściła `index.html`? | ✅ Tak |
| Czy pozostała duplikacja rankingu w UI? | ✅ Nie |
| Czy API silnika jest testowalne bez przeglądarki? | ✅ Tak |
| Czy wrapper zachowuje sygnaturę `getSortedGroupStats(gn)`? | ✅ Tak |
| Czy `isAbsoluteRemis` ma jeden caller produkcyjny? | ✅ Tak (`calcTables`) |
| Czy `calcTables()` jest gotowy na klastry 3+ bez zmian? | ❌ Nie — wymaga S1.5 |
| Czy testy wystarczą na S1? | 🟡 Częściowo — potrzeba TV-01…TV-06 |
| Czy S0 wprowadził regresję? | ✅ Nie (19/19 + E2E) |

---

## 11. Rekomendacje przed rozpoczęciem S1 (bez kodu — wytyczne)

1. **S1.1 + S1.5 w jednym PR logicznym** — rekursywne sortowanie + `getGroupTieState` razem, aby uniknąć S1-R3.
2. **Nie rozszerzać `applyMiniTableH2H`** — nowa ścieżka `resolveCluster`; stara funkcja może zostać użyta wewnętrznie przez klaster 2-drużynowy.
3. **Zachować `getSortedGroupStats(gn)` jako publiczny adapter** — wewnętrznie woła `getGroupStandings`.
4. **Rozszerzyć test harness** o TV-01 (cykl 3-drużynowy) **przed** zmianą sortowania.
5. **`calcTables()` w S1** — tylko podmiana źródła detekcji remisu; bez nowej logiki rankingowej inline.
6. **Legacy reference test** — przenieść do osobnego pliku po S1, aby parity S0 nie blokowało postępu.

---

## 12. Decyzja

Po review architektury S0:

- Ekstrakcja silnika jest **poprawna i kompletna** w zakresie S0.
- Rozproszenie polityki tie-break w UI jest **zamierzone** i **mapowane** w planie S1.
- Nie stwierdzono **blokujących** wad strukturalnych wymagających refactoru przed rozpoczęciem prac nad rekursywnymi klastrami.
- Ryzyka S1 są **identyfikowalne i mitygowalne** istniejącą infrastrukturą testową + wytycznymi §11.

---

# ✅ READY FOR S1

---

*Koniec dokumentu TIEBREAK_ENGINE_S0_REVIEW.md*
