# Demo Story Scenario — Memoriał Wiosenny 2026

**Wersja:** 1.0  
**Status:** Kanoniczny pakiet danych — źródło prawdy dla Demo Story MVP v1.0  
**Data:** 2026-07-11  
**Powiązane dokumenty:** `IMPLEMENTATION_DEMO_STORY.md`, `COPY_DECK_DEMO_STORY.md`

---

## Cel pakietu

Ten katalog zawiera **kompletny, spójny matematycznie** scenariusz turnieju demo używany w Demo Story MVP. Wszystkie pliki muszą być ładowane jako jedna całość — nie modyfikuj pojedynczych wyników bez przeliczenia tabel, statystyk i `expected-podium.json`.

---

## Struktura plików

| Plik | Opis |
|------|------|
| `tournament.meta.json` | Metadane turnieju, skala, status, fazy |
| `teams.json` | 16 drużyn z przypisaniem do grup |
| `players.json` | Zawodnicy (strzelcy, bramkarze) przypisani do drużyn |
| `groups.json` | Definicja 4 grup (A–D) |
| `matches.json` | 32 mecze (24 grupowe + 8 pucharowych; 31 rozegranych + 1 finał) |
| `standings.json` | Tabele 4 grup — pojedyncza runda, top 2 awansuje |
| `playoff-bracket.json` | Drabinka play-off: ćwierćfinały → finał |
| `player-stats.json` | Statystyki indywidualne po 55 meczach |
| `expected-podium.json` | Oczekiwany wynik po wpisaniu finału **3 : 2** |
| `archive.json` | Dane archiwum turnieju (epilog E7) |
| `manifest.json` | Manifest pakietu, kolejność ładowania, mapowanie na ekrany |

### Regeneracja bundle (dla developera)

Po edycji plików JSON w tym katalogu:

```bash
python scripts/build-demo-bundle.py
```

Wynik: `demo-story-scenario.bundle.js` w katalogu głównym projektu.

---

## Parametry kanoniczne

| Parametr | Wartość |
|----------|---------|
| ID turnieju | `DEMO-STORY-2026` |
| Nazwa | Memoriał Wiosenny 2026 — Hala OSiR |
| Drużyny | 16 |
| Grupy | 4 × 4 drużyny |
| System grupowy | Pojedyncza runda (każda para 1×) |
| Mecze grupowe | 24 |
| Play-off | ćwierćfinały (4) + półfinały (2) + mecz o 3. miejsce (1) + finał (1) |
| Łącznie meczów | 32 |
| Rozegrane | 31 |
| Finał | FC Orły Poznań vs United Luboń — **nierozegrany** |
| Król strzelców | Kowalski (FC Orły Poznań) — 6 bramek |
| Bramkarz turnieju | Nowak (FC Orły Poznań) — 2 czyste konta |

---

## Finał demo (interakcja użytkownika)

Użytkownik wpisuje wynik finału. **Wynik kanoniczny QA:**

```
FC Orły Poznań  3 : 2  United Luboń
```

Po tym wyniku system musi wyliczyć wartości z `expected-podium.json`.

---

## Walidacja spójności (checklist QA)

| # | Reguła | Oczekiwany wynik |
|---|--------|------------------|
| 1 | Liczba drużyn | 16 |
| 2 | Mecze ze statusem `played` | 31 |
| 3 | Mecze ze statusem `pending` | 1 (m032) |
| 4 | Suma bramek Kowalskiego w `matches.json` | 6 |
| 5 | Czyste konta Nowaka w meczach Orłów | 2 |
| 6 | Orły i United w finale | tak |
| 7 | Sparta 3. w turnieju (przed finałem) | wygrała m031 |
| 8 | Po finału 3:2 → 1. Orły, 2. United | `expected-podium.json` |

---

## Format meczu

Każdy mecz w `matches.json` zawiera:

- `id` — identyfikator (m001–m032)
- `phase` — `group` | `quarterfinal` | `semifinal` | `third_place` | `final`
- `group` — litera grupy (tylko faza grupowa)
- `round` — numer kolejki / rundy
- `homeTeamId`, `awayTeamId`
- `homeScore`, `awayScore` — `null` jeśli nierozegrany
- `status` — `played` | `pending`
- `scorers` — tablica `{ playerId, teamId, goals[] }` (minute opcjonalna)
- `homeCards` / `awayCards` — opcjonalnie `[{ type: "Y"|"R", playerId }]` (badge’e jak w kibicu)
- `cleanSheetGoalkeeperId` — ID bramkarza z czystym kontem (jeśli dotyczy)

---

## Historia

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | 2026-07-11 | Pierwsza wersja kanoniczna |
