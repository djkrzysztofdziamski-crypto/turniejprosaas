# Sprint A — Completion Report

**Data:** 2026-07-11  
**Zakres:** Demo Story MVP E0→E7  
**Wersja:** Sprint A final

---

## ✅ Wykonane

### T1 — Bramkarz Turnieju (Rekomendacja B)

| Element | Status |
|---------|--------|
| Loader mapuje `cleanSheetGoalkeeperId` na `state.matches[]` i `state.playoffs[]` | ✅ |
| Loader buduje `state._demoStory.goalkeepersById` | ✅ |
| `calcStats()` — model indywidualny (`cleanSheetGoalkeeperId`) | ✅ |
| `calcStats()` — fallback legacy (shutout drużyny) gdy brak tagów | ✅ |
| Synchronizacja `matches.json` — usunięto tagi `p007` (6→0) | ✅ |
| Synchronizacja `player-stats.json` — tylko Nowak (4 CK) | ✅ |
| Regeneracja `demo-story-scenario.bundle.js` | ✅ |

**QA automatyczne (wynik finału 3:2):**

| Kryterium | Wynik |
|-----------|--------|
| 🥇 FC Orły Poznań | ✅ |
| 🥈 United Luboń | ✅ |
| 🥉 Sparta Swarzędz | ✅ |
| ⚽ Kowalski (7) | ✅ |
| 🧤 Nowak (4) | ✅ |

### Faza 1–3 (wcześniej + domknięcie)

| Element | Status |
|---------|--------|
| E0 Wejście + CTA login | ✅ |
| E1 Hook + hero metrics | ✅ |
| E2 Fan embed (mecze, tabele, play-off) | ✅ |
| E3 Organizator + dashboard | ✅ |
| E4 Finał + walidacja + zapis | ✅ |
| E5 Podium reuse `renderPodium()` | ✅ |
| `findGrandFinalMatch()` — poprawka finału | ✅ |
| Maszyna stanów E0→E7 | ✅ |
| Analytics stub | ✅ |

### Faza 4 — Konwersja + Archiwum

| Element | Status |
|---------|--------|
| `renderConversionScreen()` — pełne copy Copy Deck | ✅ |
| CTA-08, CTA-09, CTA-10 | ✅ |
| `renderArchiveScreen()` — karta z `archive.json` | ✅ |
| Dynamiczny wynik finału | ✅ |
| Dynamiczne podium i nagrody (`calcStats`) | ✅ |
| Przejście E5 → E6 → E7 | ✅ |
| `exitToLicense({ cta_id, source_step })` + analityka | ✅ |
| `demo_story_completed` na E7 | ✅ |
| `demo_story_abandoned` — listener `beforeunload` | ✅ |

### Legacy DEMO-2026

| Element | Status |
|---------|--------|
| `?id=DEMO-2026` → redirect do Demo Story E0 | ✅ |
| `verifyLicense()` — blokada klucza DEMO-2026 | ✅ |
| `autoVerify()` — ignoruje cache DEMO-2026 | ✅ |
| `isDemoMode` — wyłączony z URL | ✅ |
| Kod legacy (`generateDemoMockData`) — **nie usunięty** | ✅ |

### Smoke test (programowy)

| Test | Wynik |
|------|--------|
| Flow kroków 1→7 po `saveFinalScore(3,2)` | ✅ |
| `demo_story_completed` emitowane | ✅ |
| `final_score_saved: true` | ✅ |

---

## ⚠️ Uwagi

1. **CTA-09 / CTA-10 (E6)** — w MVP prowadzą do `exitToLicense()` z focus na input licencji. Brak integracji CRM / mailto — zgodnie z scope Sprint A.

2. **CTA-11 „Chcesz zobaczyć więcej?” (E7)** — celowo **pominięty** (E8 poza MVP).

3. **Testy embedów E2/E3/E5** — wymagają przeglądarki (przenoszenie węzłów DOM). Test programowy obejmuje logikę FSM i QA statystyk.

4. **Fallback legacy `calcStats()`** — aktywny tylko gdy żaden mecz nie ma `cleanSheetGoalkeeperId`. Turnieje Firebase bez tagów zachowują dotychczasowe shutouty drużyny.

5. **Pakiety cenowe (E6 microcopy)** — copy statyczne z Copy Deck; ceny docelowe do ustalenia przed produkcją live.

6. **Regeneracja bundle** — po każdej edycji `demo-story-scenario/*.json` uruchomić `python scripts/build-demo-bundle.py`.

---

## ❌ Problemy

| # | Problem | Severity | Status |
|---|---------|----------|--------|
| — | Brak blokujących problemów w QA automatycznym | — | — |

**Manual browser QA** (zalecane przed release):

- [ ] E2 — taby kibica na 375px
- [ ] E5 — podium wizualnie w embedzie
- [ ] E6 — wszystkie 3 CTA + przejście do archiwum
- [ ] E7 — karta z dynamicznym wynikiem użytkownika (≠ 3:2)
- [ ] Brak zapisu Firebase w Network tab podczas demo
- [ ] `?id=DEMO-2026` otwiera Demo Story, nie legacy hub

---

## Pliki zmienione (Sprint A — final)

| Plik | Zmiana |
|------|--------|
| `demo-story.js` | T1 loader, Faza 4, exitToLicense, analityka |
| `index.html` | calcStats hybrid, CSS E6/E7, DEMO-2026 hide |
| `demo-story-scenario/matches.json` | Tagi CK tylko Nowak (4) |
| `demo-story-scenario/player-stats.json` | Spójność bramkarza |
| `demo-story-scenario.bundle.js` | Regeneracja |

---

## Kryteria akceptacji Sprint A

| ID | Kryterium | Status |
|----|-----------|--------|
| SA-1 | Flow E0→E7 bez klucza | ✅ |
| SA-2 | Jedna interakcja: wynik finału | ✅ |
| SA-3 | 16/56/55 na E1 i E3 | ✅ |
| SA-4 | E2: terminarz, wyniki, tabela, play-off | ✅ |
| SA-5 | E6 po E5 (przed E7) | ✅ |
| SA-6 | Podium 3:2 = Orły, United, Sparta | ✅ |
| SA-7 | Kowalski 7, Nowak 4 CK | ✅ |
| SA-8 | Brak Firebase write w demo | ✅ (architektura) |
| SA-9 | E8 niedostępny | ✅ |
| SA-10 | Legacy DEMO-2026 niewidoczny z E0 | ✅ |

---

## Końcowy status

# SPRINT A = DONE

Demo Story MVP v1.0 (E0→E7) jest zaimplementowane zgodnie z zaakceptowanym zakresem. Zalecany manual smoke test w przeglądarce przed wdrożeniem produkcyjnym.

---

*Wygenerowano: Sprint A completion — TurniejPro SaaS Demo Story*
