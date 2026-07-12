# TIEBREAK_ENGINE_S2_REPORT.md

**Sprint S2 — audytowalne losowanie remisu absolutnego**

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-12 |
| **Status** | ✅ Zakończone |
| **Zakres** | Proof-of-auditable-draw — bez Fair Play, PDF, archiwum centralnego, rozbudowanego UI |

---

## Cel S2

Wdrożyć audytowalne losowanie remisu absolutnego: model `TieBreakDecision`, CSPRNG, persistencja w `state.settings`, blokada wielokrotnego losowania, odczyt po reloadzie.

---

## ✅ Wdrożone zmiany

### Nowy plik: `tiebreak-audit.js`

Rozszerza `TiebreakEngine` (ładowany **po** `tiebreak-engine.js`).

| API | Opis |
|-----|------|
| `generateDrawSeed(getRandomBytes?)` | 16 bajtów hex (32 znaki) z `crypto.getRandomValues` |
| `shuffleTeamIds(teamIds, getRandomBytes?)` | Fisher-Yates z CSPRNG |
| `createTieBreakDecision(params)` | Fabryka rekordu audytu |
| `getTieBreakDecisionForGroup(settings, gn)` | Odczyt decyzji dla grupy |
| `hasTieBreakDecision(settings, gn)` | Czy grupa ma decyzję |
| `applyTieBreakDecision(settings, decision)` | Append-only + `customTableOrder` + `confirmedTableOrder` |
| `removeTieBreakDecision(settings, gn)` | Usunięcie przy resecie tabeli |
| `performAuditedDraw(gn, ctx, options)` | Pełny flow losowania |
| `migrateTieBreakSettings(settings)` | Inicjalizacja + migracja legacy `confirmedTableOrder` |
| `formatTieBreakLogMessage(decision)` | Wpis do `state.logs` |
| `buildFullGroupOrder(...)` | Merge kolejności klastra w pełną tabelę |
| `getGroupTieState` (patch) | Po decyzji DRAW/MANUAL → `ABSOLUTE_TIE_CONFIRMED`, brak blokady play-off |

### Model `TieBreakDecision` (v1)

```javascript
{
  id: string,                    // UUID / tb-*
  version: 1,
  tournamentId: string,
  groupName: string,
  clusterTeamIds: [],
  clusterTeamNames: [],
  clusterSize: number,
  cutoffRank: number,            // 1-based
  advPerGroup: number,
  resolvedOrder: [],             // kolejność w klastrze (wynik losowania)
  fullGroupOrder: [],            // pełna kolejność grupy
  method: 'DRAW',
  criteriaExhausted: [],
  drawSeed: string,              // 32 hex — CSPRNG
  drawTimestamp: string,         // ISO 8601
  actorUserId: string | null,
  actorLabel: string,
  note: string | null,
  snapshotBefore: TeamStatsSnapshot[],
  snapshotAfter: TeamStatsSnapshot[]
}
```

### Persistencja w `state.settings`

| Pole | Zawartość |
|------|-----------|
| `tieBreakDecisions[]` | Append-only lista decyzji |
| `tieBreakByGroup[gn]` | Indeks szybki: `gn` → `decision.id` |
| `customTableOrder[gn]` | Ustawiane przez decyzję |
| `confirmedTableOrder[gn]` | `true` po losowaniu |

Synchronizacja Firebase przez istniejące `window.save()` — `settings` jest częścią payloadu.

### `index.html` — minimalna integracja (bez modala)

| Element | Opis |
|---------|------|
| `<script src="tiebreak-audit.js">` | Po engine |
| `migrateTieBreakSettings` | Przy load z Firebase |
| `window.performTieBreakDraw(gn, actorLabel?)` | Proof API — losowanie + save + log + calcTables |
| `window.getTieBreakCtx(gn)` | Helper kontekstu |
| `resetTableOrder` | Czyści też `tieBreakDecisions` dla grupy |

**Brak zmian wizualnych** — brak modala, brak nowych przycisków w UI tabeli.

---

## Przepływ losowania

```
performTieBreakDraw(gn)
  → getGroupTieState: ABSOLUTE_TIE_PENDING
  → hasTieBreakDecision? → DECISION_ALREADY_EXISTS
  → generateDrawSeed (CSPRNG)
  → shuffleTeamIds(criticalCluster.teamIds) — Fisher-Yates
  → buildFullGroupOrder
  → snapshotBefore / snapshotAfter
  → createTieBreakDecision
  → applyTieBreakDecision → settings.tieBreakDecisions[]
  → logAction + save + calcTables
```

### Blokada wielokrotnego losowania

1. `performAuditedDraw` → `{ error: 'DECISION_ALREADY_EXISTS' }` jeśli `hasTieBreakDecision`
2. `getGroupTieState` po decyzji → `ABSOLUTE_TIE_CONFIRMED`, `blocksPlayoff: false`

### Odczyt po reloadzie

1. Firebase load → `migrateTieBreakSettings(state.settings)`
2. `getGroupTieState(gn)` → `existingDecision` z seed/timestamp/resolvedOrder
3. `getSortedGroupStats(gn)` → stosuje `customTableOrder[gn]` z decyzji

---

## ✅ Wyniki testów

### S2 draw (`node scripts/tiebreak-draw.test.mjs`)

```
Passed: 29
Failed: 0
```

| Test | Opis |
|------|------|
| **TV-DRAW-2** | Klaster 2 drużin (remis 2:2), losowanie, reload, blokada 2. losu |
| **TV-DRAW-3** | Cykl 3×1:0, klaster 3 |
| **TV-DRAW-4** | Lider D + ABC absolutny, klaster 3 na cutoff |
| **CSPRNG** | `generateDrawSeed` → 32 hex |
| **Fisher-Yates** | Injectable `getRandomBytes` |

### Regresja S1 (`node scripts/tiebreak-engine.test.mjs`)

```
Passed: 30
Failed: 0
```

---

## Naprawiony bug w S2

**`randomUint32` — signed 32-bit overflow**

Bitowe OR w JS dawało ujemne wartości → ujemny indeks w Fisher-Yates → `null` w `resolvedOrder`.

**Fix:** `>>> 0` (unsigned) przed modulo.

---

## ✅ Zgodność wsteczna

| Aspekt | Status |
|--------|--------|
| Demo scenario (TV-REG-01) | ✅ Bez zmian |
| `confirmedTableOrder` legacy | ✅ Migracja → wpis MANUAL `legacy-{gn}` |
| Strzałki / confirmTableOrder | ✅ Nadal działają (osobna ścieżka; S3 zunifikuje z audytem) |
| Widok kibica | ✅ Bez zmian |
| Play-off po losowaniu | ✅ Odblokowany (`blocksPlayoff: false`) |

---

## ⚠️ Ryzyka przed S3 (UX losowania)

| ID | Ryzyko | P | Mitygacja S3 |
|----|--------|---|--------------|
| S3-R1 | **Brak modala** — organizator musi wołać `performTieBreakDraw()` z konsoli | 🟠 | Modal + przycisk „Losuj kolejność” |
| S3-R2 | **Strzałki bez `TieBreakDecision`** — `confirmTableOrder` omija audyt DRAW | 🟠 | `confirmTableOrder` → `method: MANUAL` + notatka |
| S3-R3 | **UI pokazuje parę na cutoff**, nie cały klaster 3+ | 🟡 | Podświetlenie `criticalCluster.teamIds` |
| S3-R4 | **Brak podglądu seed/timestamp** w UI | 🟡 | Modal z seed + copy |
| S3-R5 | **Kibic nie widzi rozstrzygnięcia** | 🟡 | Readonly banner z `existingDecision` |
| S3-R6 | **`resetTableOrder` usuwa decyzję** bez ostrzeżenia audytu | 🟡 | Confirm + opcjonalny wpis logu |

---

## Proof-of-auditable-draw — kryteria akceptacji S2

| Kryterium | Status |
|-----------|--------|
| Model `TieBreakDecision` | ✅ |
| `crypto.getRandomValues` | ✅ |
| Zapis seed + timestamp + operator + wynik | ✅ |
| `state.settings.tieBreakDecisions[]` | ✅ |
| Blokada wielokrotnego losowania | ✅ |
| Odczyt po reloadzie | ✅ |
| Test vectors 2 / 3 / 4 drużiny | ✅ TV-DRAW-2/3/4 |

---

## Odpowiedź: czy system jest gotowy do UX losowania w S3?

**Tak — system jest gotowy do wdrożenia UX losowania w S3.**

Backend audytowego losowania jest kompletny:

- `performAuditedDraw` / `performTieBreakDraw` — gotowe API
- `getGroupTieState` — stany `PENDING` vs `CONFIRMED` + `existingDecision`
- Persistencja Firebase — przez `settings.tieBreakDecisions`
- Testy 29/29 + regresja 30/30

S3 może skupić się wyłącznie na warstwie prezentacji: modal, przycisk, copy, podświetlenie klastra, integracja strzałek z `method: MANUAL` — bez zmiany rdzenia losowania.

---

*Koniec dokumentu TIEBREAK_ENGINE_S2_REPORT.md*
