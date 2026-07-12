# GROUP_TIEBREAKER_SPEC.md

**TurniejPro SaaS — Specyfikacja klasyfikacji grupowej i remisu absolutnego**

| Pole | Wartość |
|------|---------|
| **Wersja** | 1.0 (analiza + plan wdrożenia) |
| **Status** | Specyfikacja produktowa i techniczna — **bez implementacji** |
| **Data** | 2026-07-12 |
| **Zakres** | Faza grupowa: 3, 4, 5, … n drużyn na grupę |
| **Pliki referencyjne** | `index.html` → `getSortedGroupStats()`, `isAbsoluteRemis()`, `calcTables()` |

---

## Streszczenie wykonawcze

TurniejPro posiada **częściowo działający** silnik tie-breakerów (mini-tabela w obrębie remisu punktowego + ręczna korekta strzałkami). Brakuje jednak:

- formalnej separacji reguł dla **2 drużyn** vs **3+ drużyn**,
- obsługi **remisu absolutnego k- drużinowego** (nie tylko pary na linii awansu),
- **audytowalnego losowania** jako ostatniego kryterium,
- spójnego **UX i archiwum** dokumentującego decyzję organizatora.

Niniejszy dokument definiuje docelowy model zgodny z praktyką turniejów amatorskich i halowych (mini-tabela → bilans całej grupy → losowanie), oraz plan wdrożenia bez pisania kodu w tej fazie.

---

## 1. Analiza matematyczna remisu absolutnego

### 1.1 Definicje

| Termin | Definicja |
|--------|-----------|
| **Remis punktowy** | Co najmniej 2 drużiny mają identyczną liczbę punktów w tabeli grupowej |
| **Mini-tabela (mała tabela)** | Tabela wyliczona **wyłącznie** z meczów rozegranych między drużynami z tego samego remisu punktowego |
| **Remis absolutny** | Po zastosowaniu wszystkich kryteriów rankingowych (bez losowania) statystyki drużyn pozostają **identyczne** |
| **Linia awansu (cutoff)** | Pozycja w tabeli, na której decyduje się awans (np. top 2 w grupie 4 → cutoff między 2. a 3. miejscem) |

### 1.2 Grupa 3 drużyn (n = 3)

**Model meczów:** każda z każdą (3 mecze w pojedynczej rundzie).

**Klasyczny przykład remisu absolutnego (cykl wyników 1:0):**

| Mecz | Wynik |
|------|-------|
| A – B | 1:0 |
| B – C | 1:0 |
| C – A | 1:0 |

**Tabela główna:**

| Drużyna | Pkt | BZ:BS | Bilans |
|---------|-----|-------|--------|
| A | 3 | 1:1 | 0 |
| B | 3 | 1:1 | 0 |
| C | 3 | 1:1 | 0 |

**Mini-tabela (3 drużiny — identyczna z główną w tej konfiguracji):**

| Drużyna | Pkt (mini) | BZ:BS (mini) | Bilans (mini) |
|---------|------------|--------------|---------------|
| A | 3 | 1:1 | 0 |
| B | 3 | 1:1 | 0 |
| C | 3 | 1:1 | 0 |

**Wniosek:** Remis absolutny **3-drużynowy jest możliwy** i nie jest patologiczny — występuje w realnych turniejach (np. wszystkie wyniki 1:0 w „kółko”).

**Awans:** Przy `advCount = 2` z jednej grupy 3-drużinowej (cutoff między 2. a 3.) — **wszystkie trzy drużiny są nierozstrzygnięte** co do miejsc 1–3; decyzja wymaga losowania lub decyzji regulaminowej organizatora.

### 1.3 Grupa 4 drużyn (n = 4)

**Model meczów:** 6 meczów (pojedyncza runda).

Remis absolutny może wystąpić:

1. **W podgrupie 2 drużyn** remisujących punktowo (np. obie 7 pkt, identyczna mini-tabela 2-drużynowa).
2. **W podgrupie 3 drużyn** (jak w §1.2) wewnątrz szerszego remisu punktowego.
3. **W podgrupie 4 drużyn** — rzadsze, ale możliwe przy skoordynowanych wynikach (wszystkie 4 drużiny identyczne w mini-tabeli 4-drużynowej).

**Przykład ilustracyjny (3 drużyny na linii awansu):**

Załóżmy tabelę końcową:

| Msc | Drużyna | Pkt |
|-----|---------|-----|
| 1 | D | 9 |
| 2 | A | 4 |
| 3 | B | 4 |
| 4 | C | 4 |

A, B, C tworzą mini-tabelę 3-drużynową z cyklem 1:0 → remis absolutny w podgrupie {A,B,C}. Przy awansie 2 z grupy decyzja dotyczy miejsc 2–4, nie tylko pary (2., 3.).

**Wniosek:** Algorytm musi obsługiwać **zbiory remisujące (tie clusters)**, nie wyłącznie sąsiadujące pary.

### 1.4 Grupa 5 drużyn (n = 5)

**Model meczów:** 10 meczów (pojedyncza runda).

- Możliwe klastry remisowe: 2, 3, 4 lub 5 drużyn.
- Im więcej drużyn w klastrze, tym więcej meczów w mini-tabeli: `k × (k−1) / 2`.
- Przy n = 5 i awansie 2: cutoff = między 2. a 3. — wystarczy remis absolutny **pary** na tej linii LUB remis **trójki** obejmującej pozycję 2.

**Wniosek:** Potrzebna detekcja klastra obejmującego pozycje przy cutoff, nie tylko `st[i]` vs `st[i+1]`.

### 1.5 Grupa n drużyn (uogólnienie)

**Twierdzenie praktyczne (nie formalne):** Dla każdego `n ≥ 3` istnieje konfiguracja wyników meczów prowadząca do remisu absolutnego w klastrze rozmiaru `k`, gdzie `2 ≤ k ≤ n`.

**Algorytm wysokopoziomowy (zgodny z UEFA / FIFA dla faz grupowych):**

```
1. Posortuj drużyny wg punktów (malejąco).
2. Zidentyfikuj wszystkie klastry o identycznej liczbie punktów.
3. Dla każdego klastra |C| ≥ 2:
   a. Jeśli |C| = 2 → zastosuj reguły 2-drużynowe.
   b. Jeśli |C| ≥ 3 → zbuduj mini-tabelę na meczach między drużynami z C.
   c. Jeśli w mini-tabeli nadal remis → zastosuj bilans całej grupy (tylko dla drużyn z C).
   d. Jeśli nadal remis → losowanie (audytowane).
4. Rekursywnie: jeśli w mini-tabeli powstanie podklaster remisowy, powtórz kroki 3a–3d na podzbiorze.
```

**Złożoność obliczeniowa:** O(n²) na grupę (przegląd meczów + sortowania klastrów) — akceptowalne dla n ≤ 8 typowych w turniejach halowych.

---

## 2. Obecny stan aplikacji

### 2.1 Jak liczona jest tabela (`getSortedGroupStats`)

**Lokalizacja:** `index.html`, funkcja `window.getSortedGroupStats(gn)`.

**Kroki obecnego algorytmu:**

1. **Statystyki główne** — dla każdej drużyny w grupie `gn`:
   - `m, w, r, p, pkt, bz, bs` z rozegranych meczów grupowych (`m.played === true`).

2. **Grupowanie po punktach** — drużyny z identycznym `pkt` trafiają do tego samego `pointGroups[pkt]`.

3. **Mini-tabela (częściowa)** — dla każdej grupy punktowej `|group| > 1`:
   - Zerowanie `h2h_pkt, h2h_bz, h2h_bs`.
   - Sumowanie statystyk **tylko z meczów**, gdzie obie drużyny ∈ group (to jest mini-tabela, ale **bez rekursji**).

4. **Sortowanie globalne** (jeden pass na całą tabelę):

   | Kolejność | Kryterium |
   |-----------|-----------|
   | 1 | `pkt` (punkty w grupie) |
   | 2 | `h2h_pkt` (punkty w mini-tabeli remisu punktowego) |
   | 3 | `h2h_bz - h2h_bs` (bilans bramek w mini-tabeli) |
   | 4 | `h2h_bz` (bramki zdobyte w mini-tabeli) |
   | 5 | `bz - bs` (bilans w całej grupie) |
   | 6 | `bz` (bramki zdobyte w całej grupie) |

5. **Nadpisanie ręczne** (jeśli istnieje):
   - `tempLocalOrders[gn]` — lokalna kolejność przed zatwierdzeniem,
   - `state.settings.customTableOrder[gn]` — zapisana kolejność,
   - `state.settings.confirmedTableOrder[gn]` — flaga zatwierdzenia.

6. **Rank** — numeracja miejsc 1…n.

### 2.2 Detekcja remisu absolutnego (`isAbsoluteRemis`)

**Lokalizacja:** `index.html`, linia ~1710.

Porównuje **dwie** drużyny `a`, `b` na identyczność:

- `pkt`, `h2h_pkt`, `h2h_bz - h2h_bs`, `h2h_bz`, `bz - bs`, `bz`

**Użycie w UI (`calcTables`):**

- Sprawdzenie **wyłącznie pary** na linii awansu: `st[cutoffIndex]` vs `st[cutoffIndex + 1]`.
- Jeśli remis absolutny i brak `confirmedTableOrder[gn]`:
  - wiersze na cutoff oznaczone klasą `absolute-remis-row` (żółte tło),
  - badge „⚠️ REMIS ABSOLUTNY! Użyj strzałek”,
  - przycisk **START PLAY-OFF** zablokowany (`anyUnconfirmedAbsoluteRemis`).

### 2.3 Ręczna korekta (workaround organizatora)

| Mechanizm | Opis |
|-----------|------|
| `moveTableTeam(gn, index, dir)` | Strzałki ↑↓ przy wierszu tabeli |
| `confirmTableOrder(gn)` | Zatwierdzenie kolejności → zapis do `customTableOrder` + `confirmedTableOrder` |
| `resetTableOrder(gn)` | Powrót do sortowania automatycznego |

**Brak:** logu *dlaczego* zmieniono kolejność, braku typu decyzji (losowanie vs Fair Play vs decyzja sędziego).

### 2.4 Co już działa dobrze

- Mini-tabela dla remisu punktowego (h2h) — **rdzeń zgodny z praktyką UEFA**.
- Bilans i bramki całej grupy jako kolejne kryteria.
- Wizualne ostrzeżenie remisu absolutnego na linii awansu.
- Blokada generowania play-off do rozstrzygnięcia.
- Demo Story: `qualifiedTeamIds` + `customTableOrder` ze scenariusza omijają fałszywy alarm w prezentacji.

### 2.5 Ograniczenia obecnego algorytmu

| # | Ograniczenie | Skutek |
|---|--------------|--------|
| L1 | Brak osobnej ścieżki **2 drużyn** (bezpośredni wynik meczu jako osobne kryterium przed mini-pkt) | Przy 2 drużynach remis punktowy z remisem w bezpośrednim meczu → mini-pkt remisuje się na 1:1 pkt — OK, ale brak jawnego „kto wygrał bezpośrednio” gdy obie mają różne pkt w mini z jednego meczu |
| L2 | **Jeden globalny sort**, nie rekursywny podział klastrów | Przy 3+ remisujących na linii awansu sort może dać kolejność „sztuczną” bez rozstrzygnięcia klastra |
| L3 | `isAbsoluteRemis` tylko dla **pary** na cutoff | Remis 3-drużynowy na linii awansu może być niewykryty w pełni |
| L4 | Brak **losowania** jako formalnego kroku | Organizator używa strzałek — brak audytu, brak timestampu, brak opisu w archiwum |
| L5 | Brak zapisu **uzasadnienia tie-breakera** | W archiwum turnieju nie widać, czy kolejność wynika z algorytmu, losowania czy decyzji |
| L6 | `h2h_*` liczone per **punktowa grupa**, nie per **rekursywny klaster** | Przy zagnieżdżonych remisach (np. 4 drużiny, podklaster 3) możliwe niespójności z regulaminem FIFA |
| L7 | Brak obsługi **niedokończonej fazy grupowej** przy tie-breakerze | Nierozegrane mecze w klastrze — niezdefiniowane zachowanie |
| L8 | Komunikat UI mówi „bezpośrednie starcia”, nie „mini-tabela” | Organizatorzy mogą źle interpretować przy 3+ drużynach |

---

## 3. Docelowa kolejność tie-breakerów

### 3.1 Remis 2 drużyn (|C| = 2)

Stosować **wyłącznie mecze między tymi dwiema drużynami** (zwykle 1 mecz w rundzie pojedynczej; 2 mecze w rundzie rewanżowej).

| Krok | Kryterium | Opis |
|------|-----------|------|
| T2-1 | **Punkty w grupie** | Porównanie `pkt` obu drużyn (warunek wejścia w tie-breaker) |
| T2-2 | **Wynik bezpośredni (mecz/e)** | Kto zdobył więcej punktów w bezpośrednich spotkaniach (`h2h_pkt`) |
| T2-3 | **Bilans bramek bezpośredni** | `h2h_bz - h2h_bs` |
| T2-4 | **Bramki zdobyte bezpośrednio** | `h2h_bz` |
| T2-5 | **Bilans bramek w grupie** | `bz - bs` (cała grupa) |
| T2-6 | **Bramki zdobyte w grupie** | `bz` |
| T2-7 | **Losowanie** | Patrz §5 |

**Uwaga rewanż:** Przy dwóch meczach bezpośrednich T2-2–T2-4 sumują oba mecze (jak obecne `h2h_*`).

### 3.2 Remis 3+ drużyn (|C| ≥ 3)

| Krok | Kryterium | Opis |
|------|-----------|------|
| T3-1 | **Punkty w grupie** | Warunek wejścia w klaster C |
| T3-2 | **Mini-tabela** | Utworzenie podtabeli tylko z meczów między drużynami ∈ C |
| T3-3 | **Punkty w mini-tabeli** | `mini_pkt` |
| T3-4 | **Bilans bramek w mini-tabeli** | `mini_bz - mini_bs` |
| T3-5 | **Bramki zdobyte w mini-tabeli** | `mini_bz` |
| T3-6 | **Bilans bramek w całej grupie** | `bz - bs` (tylko dla drużyn z C) |
| T3-7 | **Bramki zdobyte w całej grupie** | `bz` |
| T3-8 | **Losowanie** | Patrz §5 |

**Rekursja:** Jeśli po T3-3…T3-5 nadal remis w podgrupie C′ ⊂ C, |C′| ≥ 2, powtórz T3-2…T3-8 dla C′.

### 3.3 Mapowanie na obecny kod

| Docelowe | Obecne pole | Status |
|----------|-------------|--------|
| pkt | `pkt` | ✅ |
| mini_pkt | `h2h_pkt` | ✅ (dla klastra punktowego) |
| mini bilans | `h2h_bz - h2h_bs` | ✅ |
| mini BZ | `h2h_bz` | ✅ |
| grupa bilans | `bz - bs` | ✅ |
| grupa BZ | `bz` | ✅ |
| losowanie | brak | ❌ |
| rekursja klastrów | brak | ❌ |

---

## 4. Mini-tabela — specyfikacja

### 4.1 Dane wejściowe

```typescript
// Konceptualny model (nie implementacja)
type TeamStats = {
  teamId: number;
  teamName: string;
  pkt: number;      // punkty w całej grupie
  bz: number;       // bramki zdobyte w grupie
  bs: number;       // bramki stracone w grupie
  m: number;        // mecze rozegrane w grupie
};

type Match = {
  group: string;
  t1: { id: number };
  t2: { id: number };
  g1: number;
  g2: number;
  played: boolean;
};

type TieCluster = {
  groupName: string;           // np. "A"
  teamIds: number[];           // drużyny w remisie punktowym
  points: number;              // wspólna liczba punktów
  reason: 'POINTS_TIE';        // powód utworzenia klastra
};
```

### 4.2 Sposób tworzenia klastra

1. Po wyliczeniu tabeli głównej posortuj drużyny malejąco wg `pkt`.
2. Zgrupuj **ciągłe segmenty** (w sortowaniu po pkt) o identycznej wartości `pkt`.
3. Każdy segment o rozmiarze ≥ 2 → klaster C.
4. **Cutoff awareness:** Dodatkowo oznacz klastry, które **przecinają linię awansu** (pozycje `advPerGroup` i `advPerGroup + 1`).

**Przykład:** Grupa 4 drużin, awans 2 → `advPerGroup = 2`. Klaster obejmujący miejsca {2,3,4} jest krytyczny.

### 4.3 Sposób liczenia mini-tabeli

Dla klastra C = {t₁, t₂, …, tₖ}:

```
Dla każdego t ∈ C:
  mini_m[t] = 0, mini_w[t] = 0, mini_r[t] = 0, mini_p[t] = 0
  mini_pkt[t] = 0, mini_bz[t] = 0, mini_bs[t] = 0

Dla każdego meczu m w grupie gn, gdzie m.played:
  Jeśli m.t1.id ∈ C AND m.t2.id ∈ C:
    Zaktualizuj statystyki mini_* dla obu drużyn (identyczna logika jak tabela główna)
```

**Nierozegrane mecze w klastrze:** Mini-tabela liczy **tylko rozegrane**. Jeśli w klastrze brakuje meczów — flaga `cluster.incomplete = true` → **blokada losowania** do domknięcia fazy grupowej lub decyzji regulaminowej.

### 4.4 Sortowanie w klastrze

Zastosuj T3-3 … T3-7. Jeśli po sortowaniu nadal ≥ 2 drużiny identyczne na wszystkich polach → **remis absolutny w klastrze** → przejście do §5.

### 4.5 Wpięcie w ranking globalny

Po rozstrzygnięciu klastra C (algorytmicznie lub losowaniem):

1. Wstaw drużyny z C w ustalonej kolejności na zajmowane miejsca w tabeli głównej.
2. Pozostałe drużyny (spoza C) zachowują względną kolejność.

**Rekursja:** Jeśli w C nadal jest podklaster remisu absolutnego C′ — powtórz procedurę dla C′ przed finalizacją kolejności C.

---

## 5. Losowanie — specyfikacja procesu i audytu

### 5.1 Kiedy uruchamiać losowanie

Losowanie jest dozwolone **wyłącznie** gdy:

- wszystkie kryteria T2-1…T2-6 lub T3-1…T3-7 dały **identyczne wartości** dla drużyn w klastrze wymagającym rozstrzygnięcia,
- faza grupowa jest **zakończona** (wszystkie mecze grupowe `played`) **lub** regulamin turnieju przewiduje losowanie przed ostatnim meczem (domyślnie: **nie**),
- klaster **dotyczy linii awansu** lub miejsc kwalifikacyjnych (opcjonalnie: także dla statystyk / puchar ligi — konfigurowalne).

### 5.2 Losowanie przy 3 drużynach remisujących absolutnie

**Rekomendacja TurniejPro (amatorskie / halowe):**

| Wariant | Opis | Rekomendacja |
|---------|------|--------------|
| **A. Losowanie pełnej kolejności klastra** | Jedna sesja — losowana jest permutacja miejsc 1…k w klastrze | ✅ **Preferowany** — prosty audyt, jeden zapis |
| **B. Losowanie „kto awansuje”** | Przy cutoff i k=3, awansuje 1 z 3 losowanych | ⚠️ Tylko gdy regulamin mówi wyraźnie |
| **C. Rzuty karne / baraż** | Rozgrywka sportowa | ❌ Poza zakresem fazy grupowej (osobny moduł) |
| **D. Decyzja organizatora bez losowania** | Ręczne strzałki (obecne) | ⚠️ Dozwolone jako fallback, wymaga audytu |

**Proces wariantu A (docelowy):**

1. System wykrywa klaster C z remisem absolutnym przecinający cutoff.
2. UI pokazuje modal: „Remis absolutny — wymagane losowanie”.
3. Organizator klika **„Przeprowadź losowanie”** (nie automatyczne — świadoma decyzja na hali).
4. System:
   - generuje losową permutację `teamIds` (CSPRNG: `crypto.getRandomValues`),
   - prezentuje animację / wynik,
   - zapisuje **TieBreakDecision** (patrz §5.4),
   - aktualizuje `customTableOrder[gn]` + `confirmedTableOrder[gn] = true`.
5. Odblokowanie play-off.

**Przy k = 3:** Losowanie ustala kolejność miejsc np. 2. = B, 3. = A, 4. = C — jedno losowanie, jeden log.

### 5.3 Losowanie a Fair Play

Fair Play (żółte/czerwone kartki) **nie jest** w proponowanej kolejności użytkownika (kroki 1–8). 

**Rekomendacja:** Fair Play jako **opcjonalne kryterium T3-7b** w ustawieniach turnieju (przed losowaniem), domyślnie **wyłączone** — w halówkach kartki bywają niekompletne.

Jeśli włączone, komunikat UX:

> ⚖ Remis absolutny. Kolejność ustalona na podstawie Fair Play.

### 5.4 Model audytu (zapis decyzji)

```typescript
type TieBreakDecision = {
  id: string;                    // UUID
  tournamentId: string;
  groupName: string;             // "A"
  clusterTeamIds: number[];      // [1, 4, 7]
  clusterSize: number;           // 3
  cutoffRank: number;            // 2 — linia awansu
  advPositions: number;          // ile miejsc awansuje z grupy
  resolvedOrder: number[];       // teamIds w ustalonej kolejności
  method: 'ALGORITHM' | 'DRAW' | 'MANUAL' | 'FAIR_PLAY';
  criteriaExhausted: string[];   // ['POINTS','MINI_TABLE_PTS','MINI_GD','MINI_GF','GROUP_GD','GROUP_GF']
  drawSeed?: string;             // hex z CSPRNG, jeśli method = DRAW
  drawTimestamp: string;         // ISO 8601
  actorUserId?: string;          // organizator (jeśli znany)
  actorLabel: string;            // "Organizator hali" / login
  note?: string;                 // opcjonalna notatka
  snapshotBefore: TeamStats[];   // tabela przed decyzją
  snapshotAfter: TeamStats[];    // tabela po decyzji
};
```

**Zapis:**

| Miejsce | Co |
|---------|-----|
| `state.settings.tieBreakDecisions[]` | Bieżący turniej (Firebase sync) |
| `state.logs[]` | Czytelny wpis: `[HH:MM:SS] Gr. A: remis absolutny (A, B, C) — kolejność ustalona losowaniem.` |
| Archiwum turnieju | Pełny obiekt `TieBreakDecision` w `_meta_tiebreaks` |
| PDF / raport końcowy | Sekcja „Rozstrzygnięcia remisów” |

### 5.5 Losowanie a obecne strzałki

Strzałki ↑↓ **pozostają** jako tryb `method: 'MANUAL'`, ale:

- wymagają potwierdzenia z **powodem** (select: Losowanie na hali / Decyzja sędziego / Inne),
- generują ten sam rekord audytu co losowanie automatyczne,
- **nie można** zatwierdzić bez notatki przy remisie absolutnym.

---

## 6. UX — widoczność remisu i decyzji

### 6.1 Stany UI tabeli grupowej

| Stan | Opis | Wizualizacja |
|------|------|--------------|
| `NORMAL` | Brak remisu na linii awansu | Zielone wiersze awansu |
| `POINTS_TIE_RESOLVED` | Remis punktowy rozstrzygnięty algorytmem | Standardowa tabela |
| `ABSOLUTE_TIE_PENDING` | Remis absolutny, brak decyzji | Żółte wiersze (`absolute-remis-row`), badge ⚠️ |
| `ABSOLUTE_TIE_DRAW_REQUIRED` | Wymagane losowanie | Modal + przycisk „Losuj kolejność” |
| `ABSOLUTE_TIE_CONFIRMED` | Rozstrzygnięte (losowanie / ręcznie) | Wiersze z ikoną ⚖ + tooltip z metodą |
| `GROUP_INCOMPLETE` | Nierozegrane mecze w klastrze | Szary banner „Dokończ mecze grupowe” |

### 6.2 Komunikaty (copy)

**Banner informacyjny (zastąpi obecny):**

> 🟩 Na zielono zaznaczono drużyny premiowane awansem.  
> ⚖️ Przy remisie punktowym stosowana jest mini-tabela bezpośrednich spotkań.  
> 🎲 Przy remisie absolutnym organizator przeprowadza losowanie w systemie.

**Remis absolutny — oczekuje decyzji:**

> ⚖️ **Remis absolutny w Gr. {X}**  
> Drużyny {A}, {B}[, {C}] mają identyczne statystyki po wszystkich kryteriach rankingowych.  
> **Wymagane losowanie** przed wygenerowaniem fazy pucharowej.

**Po losowaniu:**

> ⚖️ **Remis absolutny — rozstrzygnięty**  
> Kolejność ustalona w drodze **losowania organizatora** ({data, godzina}).  
> Kolejność: 1. {Drużyna A}, 2. {Drużyna B}, 3. {Drużyna C}.

**Po Fair Play (jeśli włączone):**

> ⚖️ **Remis absolutny**  
> Kolejność ustalona na podstawie **Fair Play** (mniej kartek).

**Po decyzji ręcznej:**

> ⚖️ **Remis absolutny**  
> Kolejność ustalona **ręcznie przez organizatora**: {notatka}.

### 6.3 Elementy interfejsu (nowe / zmienione)

| Element | Zachowanie |
|---------|------------|
| Badge na nagłówku tabeli | „⚠️ Remis absolutny — wymaga losowania” |
| Przycisk „Losuj kolejność” | Otwiera modal z listą drużyn w klastrze |
| Modal losowania | Pokazuje wynik + seed + przycisk „Zatwierdź i zapisz” |
| Tooltip na wierszu | „Miejsce ustalone losowaniem 12.04.2026 14:32” |
| Blokada START PLAY-OFF | Do `ABSOLUTE_TIE_CONFIRMED` dla wszystkich grup |
| Widok kibica (readonly) | Widzi baner + ustaloną kolejność, bez przycisków |

### 6.4 Widok kibica vs organizator

| Funkcja | Organizator | Kibic |
|---------|-------------|-------|
| Detekcja remisu absolutnego | ✅ | ✅ (tylko po zatwierdzeniu wyniku) |
| Losowanie | ✅ | ❌ |
| Strzałki ręczne | ✅ | ❌ |
| Historia decyzji | ✅ | ✅ (readonly, skrót) |

---

## 7. Ryzyka

### 7.1 Sportowe

| Ryzyko | Opis | Mitygacja |
|--------|------|-----------|
| Kontrowersja losowania | Rodzice/kibice kwestionują „sprawiedliwość” | Audyt + widoczny seed + log; regulamin turnieju |
| Presja na organizatora | „Ustaw ręcznie” bez losowania | Wymóg notatki + log MANUAL; edukacja w UI |
| Fair Play niekompletne | Brak kartek w protokole | Domyślnie wyłączone; tylko opt-in |
| Niedokończone mecze | Losowanie przed końcem grupy | Blokada domyślna |

### 7.2 Organizacyjne

| Ryzyko | Opis | Mitygacja |
|--------|------|-----------|
| Brak regulaminu turnieju | Organizator nie wie, że losowanie jest OK | Template regulaminu w TurniejPro |
| Opóźnienie na hali | Losowanie 3 drużyn blokuje play-off | Prosty modal, 1 klik |
| Spór między trenerami | Awans zależy od losu | PDF z archiwum + timestamp |

### 7.3 Techniczne

| Ryzyko | Opis | Mitygacja |
|--------|------|-----------|
| Regresja sortowania | Zmiana algorytmu psuje istniejące turnieje | Testy jednostkowe klastrów; migracja bez nadpisywania `confirmedTableOrder` |
| Firebase sync decyzji | Konflikt offline/online | `tieBreakDecisions` append-only |
| Demo Story | Fałszywy remis absolutny w prezentacji | Scenariusz z `confirmedTableOrder` / brak klastra na cutoff |
| Złożoność rekursji | Błędy przy k=4,5 | Osobne test vectors w QA |
| Losowanie niekryptograficzne | `Math.random()` przewidywalne | **Wymóg:** `crypto.getRandomValues` |

---

## 8. Rekomendacja końcowa

### 8.1 Czy proponowany model jest wystarczający?

| Segment | Ocena | Uzasadnienie |
|---------|-------|--------------|
| **Turnieje młodzieżowe** | ✅ **Tak**, z zastrzeżeniem | Mini-tabela + losowanie audytowane jest standardem PZPN/UEFA uproszczonym; Fair Play opcjonalnie; rodzice potrzebują transparentnego komunikatu |
| **Turnieje amatorskie** | ✅ **Tak** | Model jest prosty do wyjaśnienia; losowanie na hali akceptowalne; ręczna korekta jako fallback |
| **Turnieje halowe** | ✅ **Tak** | Krótkie fazy grupowe (3–5 drużyn) często produkują remisy; obecne strzałki bez audytu są słabe — docelowy model + log to duży zysk |

### 8.2 Co dodać w przyszłości (poza zakresem v1)

- Fair Play jako opcjonalne kryterium przed losowaniem
- Baraże / mini-mecz (moduł pucharowy, nie grupowy)
- Import regulaminu PDF z turnieju
- Powiadomienie push do trenerów po losowaniu

### 8.3 Plan wdrożenia (fazy — bez kodu w tej iteracji)

| Faza | Zakres | Priorytet |
|------|--------|-----------|
| **F1 — Algorytm** | Rekursywne klastry, rozdzielenie T2 vs T3, test vectors (3/4/5/n drużyn) | P0 |
| **F2 — Detekcja** | `isAbsoluteTieCluster(C)` zamiast pary; cutoff dla k > 2 | P0 |
| **F3 — Losowanie + audyt** | Modal, CSPRNG, `TieBreakDecision`, logi, archiwum | P0 |
| **F4 — UX** | Nowe komunikaty, stany UI, widok kibica | P1 |
| **F5 — QA** | `qa-tiebreak-*.mjs` — cykl 3-drużynowy, 4-drużinowy, losowanie | P0 |
| **F6 — Demo Story** | Scenariusz opcjonalny z remisem absolutnym (osobna ścieżka prezentacji) | P2 |
| **F7 — Fair Play** | Opcjonalne kryterium | P3 |

### 8.4 Kryteria akceptacji (Definition of Done)

- [ ] Cykl 1:0 × 3 drużiny → wykryty remis absolutny, zablokowany play-off
- [ ] Losowanie 3 drużyn → zapis w logu + archiwum + odblokowany play-off
- [ ] Remis 2 drużin rozstrzygnięty bezpośrednim wynikiem (bez losowania)
- [ ] Remis 2 drużin po remisie bezpośrednim → losowanie
- [ ] Ręczna korekta generuje rekord `MANUAL` z notatką
- [ ] Widok kibica pokazuje komunikat po rozstrzygnięciu
- [ ] Istniejące turnieje z `confirmedTableOrder` nie psują się po migracji

---

## Załącznik A — Test vectors (do QA)

| ID | Grupa | Wyniki | Oczekiwany klaster | Oczekiwana akcja |
|----|-------|--------|-------------------|------------------|
| TV-01 | 3 | A-B 1:0, B-C 1:0, C-A 1:0 | {A,B,C} size=3 | Losowanie |
| TV-02 | 4 | Normalna tabela bez remisu | brak | Play-off OK |
| TV-03 | 4 | D dominuje, A-B-C cykl na miejscach 2-4 | {A,B,C} | Losowanie miejsc 2-4 |
| TV-04 | 2 | A-B 2:2, reszta dowolna, A i B remis punktowy 7 pkt | {A,B} size=2 | T2-2 rozstrzyga lub losowanie |
| TV-05 | 5 | Remis tylko pary na cutoff | {X,Y} size=2 | Bez losowania jeśli T2 rozstrzyga |

---

## Załącznik B — Powiązanie z obecnym kodem (mapa refaktoryzacji)

| Obecna funkcja | Docelowa rola |
|----------------|---------------|
| `getSortedGroupStats(gn)` | → `buildGroupStandings(gn)` + `resolveTieClusters()` |
| `isAbsoluteRemis(a, b)` | → `isAbsoluteTieCluster(cluster)` |
| `moveTableTeam` / `confirmTableOrder` | → `applyManualTieBreak(decision)` |
| `calcTables` | → render + stany UI z §6 |
| `state.settings.customTableOrder` | Zachować; uzupełnić o `tieBreakDecisions` |
| `window.logAction` | Rozszerzyć o typy `TIE_BREAK_DRAW`, `TIE_BREAK_MANUAL` |

---

## Historia dokumentu

| Wersja | Data | Autor | Zmiany |
|--------|------|-------|--------|
| 1.0 | 2026-07-12 | Analiza TurniejPro | Pierwsza specyfikacja remisu absolutnego |

---

*Koniec dokumentu GROUP_TIEBREAKER_SPEC.md*
