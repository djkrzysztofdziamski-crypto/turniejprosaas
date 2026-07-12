# Implementation Spec: Demo Story MVP v1.0 — TurniejPro SaaS

**Wersja:** 1.0  
**Status:** Zaakceptowany — gotowy do przekazania developerowi  
**Data:** 2026-07-11  
**Właściciel:** Product / Solution Architecture  
**Powiązane dokumenty:**  
- `PRD_DEMO_STORY.md` (źródło prawdy — wymagania)  
- `COPY_DECK_DEMO_STORY.md` (źródło prawdy — copy)  
- `WIREFRAME_DEMO_STORY.md` (źródło prawdy — układ ekranów)

---

## 0. North Star implementacji

Każda decyzja techniczna w Demo Story MVP musi wzmacniać:

| Wartość sprzedawana | Implikacja implementacyjna |
|---------------------|----------------------------|
| Poczucie kontroli | Panel organizatora pokazuje stan 55/56 — użytkownik wie, co zostało |
| Mniej chaosu | Liniowy flow bez menu funkcji; jedna ścieżka |
| Mniej pytań od rodziców | Widok kibica z pełnymi danymi live (terminarz, wyniki, tabela, play-off) |
| Automatyzacja zakończenia | Po zapisie finału — podium + statystyki bez dodatkowych kroków |

**Nie implementujemy:** sprzedaży grup, terminarzy, play-off ani dashboardu jako narracji. Te elementy mogą istnieć w danych demo jako **tło**, nie jako **historia**.

---

## 1. Zakres MVP

### 1.1 W scope — Demo Story MVP v1.0

| ID | Ekran | Rola w MVP |
|----|-------|------------|
| E0 | Wejście | Start demo bez klucza |
| E1 | Hook | Skala turnieju + napięcie finału |
| E2 | Widok Kibica | WOW #1 — rodzice sami sprawdzają |
| E3 | Panel Organizatora | Spokój + status 55/56 |
| E4 | Finał | WOW #2 — jedyna interakcja użytkownika |
| E5 | Podium | WOW #3 / PEAK — auto podium + statystyki |
| E6 | Konwersja | CTA natychmiast po podium |
| E7 | Archiwum | Krótki epilog dowodowy |

### 1.2 Poza scope — Demo Story MVP v1.0

| Element | Status | Uwagi |
|---------|--------|-------|
| E8 — Chcesz zobaczyć więcej? | **Nie implementować** | Zaplanowane na v1.1+ |
| Pełna ścieżka setupu turnieju | Poza scope | Losowanie grup, generowanie terminarza |
| Konfiguracja turnieju od zera w demo | Poza scope | Obniża konwersję |
| Menu funkcji / hub demo | Poza scope | Odrzucone w audycie produktowym |
| Onboarding płatnego klienta | Poza scope | Osobny flow |
| Panel admina / zarządzanie licencjami | Poza scope | Istniejący moduł aplikacji |
| Wiele ścieżek demo na starcie | Poza scope | Tylko jedna historia |
| A/B testy copy | Poza scope MVP | Przygotowane w Copy Deck, wdrożenie później |
| Analityka zaawansowana / heatmapy | Poza scope MVP | Minimum: zdarzenia z sekcji 10 |

### 1.3 Definicja MVP

Demo Story MVP v1.0 = **liniowy, 8-ekranowy flow** z **jedną interakcją użytkownika** (wpisanie wyniku finału), oparty na **predefiniowanym scenariuszu turnieju 16 drużyn**, kończący się **konwersją tuż po peak (podium)**, z **krótkim archiwum** jako epilogiem.

---

## 2. Cel biznesowy każdego ekranu

| Ekran | Cel biznesowy | Emocja docelowa | Metryka powiązana |
|-------|---------------|-----------------|-------------------|
| **E0 Wejście** | Uruchomić demo bez barier; ustawić oczekiwanie 2-minutowej historii | Ciekawość | `demo_story_started` |
| **E1 Hook** | Potwierdzić format 16 drużyn; zbudować napięcie finału | Napięcie, identyfikacja | `demo_story_hook_viewed` |
| **E2 Widok Kibica** | Sprzedać ulgę — koniec z telefonami od rodziców | Ulga | `demo_story_fan_view_viewed` |
| **E3 Panel Organizatora** | Pokazać kontrolę i spokój — turniej prawie domknięty | Spokój, kontrola | `demo_story_organizer_view_viewed` |
| **E4 Finał** | Dać agency — jedna prosta akcja | Zaangażowanie | `demo_story_final_score_saved` |
| **E5 Podium** | Peak emocji — auto podium bez ręcznego liczenia | Satysfakcja, WOW | `demo_story_podium_viewed` |
| **E6 Konwersja** | Konwertować impuls po peak na akcję zakupową | Decyzyjność | `demo_story_cta_clicked` |
| **E7 Archiwum** | Racjonalny dowód — turniej zamknięty, wyniki zostają | Pewność | `demo_story_archive_viewed` |

---

## 3. Mapowanie ekranów na istniejącą aplikację TurniejPro

Mapowanie na **moduły logiczne** aplikacji TurniejPro SaaS — bez odniesień do implementacji kodu.

### 3.1 Tabela mapowania

| Ekran Demo Story | Moduł / capability TurniejPro | Tryb wykorzystania w demo |
|------------------|-------------------------------|---------------------------|
| **E0 Wejście** | Ekran startowy aplikacji | Nowy entry point lub warstwa nad istniejącym startem; nie pokazuje pełnego menu aplikacji |
| **E1 Hook** | Metadane turnieju + agregaty meczów | Prezentacja statystyk z danych demo (16 drużyn, 56 meczów, 55 rozegranych) |
| **E2 Widok Kibica** | **Widok publiczny kibica** (fan view) | Osadzenie / render istniejącego widoku kibica z danymi demo; taby: Terminarz, Wyniki, Tabela, Play-off |
| **E3 Panel Organizatora** | **Panel organizatora turnieju** | Uproszczony widok stanu turnieju: postęp meczów, fazy, karta finału; bez edukacji setupu |
| **E4 Finał** | **Wpis wyniku meczu** (protokół meczowy) | Formularz wyniku finału — reuse logiki zapisu wyniku meczu, ograniczony do jednego meczu |
| **E5 Podium** | **Wyliczenie podium + statystyki turnieju** | Automatyczne wyliczenie po zapisie finału: miejsca 1–3, król strzelców, bramkarz turnieju |
| **E6 Konwersja** | **Flow aktywacji licencji** + lead capture | Primary → aktywacja; secondary → zamówienie klucza / oferta |
| **E7 Archiwum** | **Archiwum turniejów** | Karta zamkniętego turnieju demo; meta + informacja o protokole |

### 3.2 Co reuse’ujemy vs. co budujemy

| Warstwa | Reuse (istniejąca aplikacja) | Nowe (Demo Story) |
|---------|------------------------------|-------------------|
| Dane turnieju | Model drużyn, meczów, grup, play-off, wyników | Scenariusz demo preloaded |
| Widok kibica | Render terminarza, wyników, tabeli, play-off | Ramka narracyjna + copy + przejście do następnego ekranu |
| Wpis wyniku | Logika zapisu wyniku meczu | Ograniczenie do finału w kontekście demo |
| Podium / statystyki | Silnik wyliczeń podium, króla strzelców, bramkarza | Trigger po zapisie finału w flow demo |
| Aktywacja licencji | Istniejący flow klucza licencyjnego | Wejście z ekranu konwersji z kontekstem demo |
| Archiwum | Widok archiwum turnieju | Skrócony epilog, nie pełna eksploracja |
| Nawigacja | — | **Nowy:** maszyna stanów Demo Story (E0→E7) |
| UI narracyjne | — | **Nowe:** copy deck, progress, CTA per ekran |

### 3.3 Izolacja od produkcji

Demo Story musi działać w **trybie izolowanym**:

- Nie wymaga aktywnej licencji użytkownika  
- Nie modyfikuje danych produkcyjnych organizatora  
- Nie wymaga połączenia z Firebase produkcyjnym (dopuszczalny: sandbox demo / dane lokalne / dedykowany namespace demo)  
- Po wyjściu z demo użytkownik wraca do standardowego flow aplikacji (aktywacja licencji lub start własnego turnieju)

---

## 4. Jak uruchamiane jest Demo Story

### 4.1 Entry points

| Entry point | Priorytet MVP | Zachowanie |
|-------------|---------------|------------|
| **Primary:** CTA „Zobacz finał turnieju” (E0) | Obowiązkowy | Główny sposób wejścia dla nowych użytkowników |
| **Secondary:** „Mam klucz — aktywuj licencję” (E0) | Obowiązkowy | Przekierowanie do istniejącego flow aktywacji; **nie** wchodzi w Demo Story |
| **Deep link** (opcjonalny MVP) | Nice-to-have | URL z parametrem `?demo=story` → E0 lub E1 |
| **Powrót po zamknięciu** | Obowiązkowy | Restart od E0; brak wznowienia w połowie (MVP) |

### 4.2 Sekwencja uruchomienia

```
1. Użytkownik otwiera TurniejPro SaaS
2. Widzi E0 (Wejście) — domyślny ekran dla niezalogowanych / bez licencji
3. Klika „Zobacz finał turnieju”
4. System:
   a. Inicjalizuje sesję Demo Story (unikalne session_id)
   b. Ładuje predefiniowany scenariusz turnieju demo
   c. Ustawia maszynę stanów na E1 (Hook)
   d. Emituje zdarzenie demo_story_started
5. Użytkownik przechodzi liniowo E1 → E7
6. Po E7 sesja demo uznana za zakończoną (demo_story_completed)
```

### 4.3 Wymagania techniczne uruchomienia

| Wymaganie | Opis |
|-----------|------|
| Brak klucza licencyjnego | Demo startuje bez autoryzacji |
| Brak rejestracji | Brak formularza przed E1 |
| Czas ładowania scenariusza | ≤ 3 s do E1 (microcopy: „Trwa ładowanie finału turnieju…”) |
| Sesja demo | Identyfikowalna sesja do analityki; nie persystowana między urządzeniami (MVP) |
| Ponowne uruchomienie | Zawsze świeży scenariusz (55/56, finał nie rozstrzygnięty) |

### 4.4 Wyjście z Demo Story

| Akcja użytkownika | Zachowanie |
|-------------------|------------|
| CTA „Aktywuj licencję” (E5, E6, E7) | Przejście do flow aktywacji licencji z parametrem źródła `demo_story` |
| CTA „Zamów klucz” / „Wyślij ofertę” (E6) | Lead capture / kontakt sprzedażowy z parametrem źródła |
| Zamknięcie karty / odświeżenie | Utrata postępu demo (MVP); następne wejście od E0 |
| Próba nawigacji wstecz (browser back) | Potwierdzenie wyjścia z demo (MVP) lub powrót 1 krok w flow |

---

## 5. Jakie dane demo są wymagane

### 5.1 Scenariusz narracyjny (kanoniczny)

| Pole | Wartość demo |
|------|--------------|
| **ID turnieju demo** | Stały identyfikator (np. `DEMO-STORY-2026`) |
| **Nazwa turnieju** | Memoriał Wiosenny 2026 — Hala OSiR |
| **Skala** | 16 drużyn · 4 grupy · play-off 1/8 · finał |
| **Łączna liczba meczów** | 56 |
| **Mecze rozegrane** | 55 |
| **Mecze pozostałe** | 1 (finał) |
| **Faza turnieju** | Finał — wynik do wpisania |
| **Finał — drużyna A** | FC Orły Poznań |
| **Finał — drużyna B** | United Luboń |
| **Przykładowy wynik finału** | 3 : 2 (użytkownik może wpisać dowolny poprawny) |

### 5.2 Struktura danych wymagana per moduł

#### 5.2.1 Metadane turnieju
- Nazwa, lokalizacja (hala), data  
- Liczba drużyn: 16  
- Status: aktywny → zamknięty (po zapisie finału)

#### 5.2.2 Drużyny (16 rekordów)
- Nazwa drużyny  
- Przypisanie do grupy (A, B, C, D — po 4 drużyny)  
- Statystyki grupowe (pkt, bramki) — kompletne dla 15 drużyn + finałistów

**Lista drużyn demo (do ustalenia z contentem; minimum wymagane nazwy):**

| Grupa | Drużyny |
|-------|---------|
| A | FC Orły Poznań, Sparta Swarzędz, … |
| B | United Luboń, … |
| C | … |
| D | … |

> **Uwaga dla developera:** Pełna lista 16 drużyn musi być dostarczona jako plik scenariusza demo. Minimum MVP: nazwy finałystów (Orły, United) i drużyny 3. miejsca (Sparta Swarzędz) muszą być spójne z wynikiem podium.

#### 5.2.3 Mecze (56 rekordów)
- 48 meczów grupowych (4 grupy × 6 meczów) — **wszystkie rozegrane z wynikami**  
- 7 meczów play-off (1/8 → 1/4 → 1/2) — **wszystkie rozegrane z wynikami**  
- 1 mecz finałowy — **nierozstrzygnięty** (brak wyniku)

Każdy rozegrany mecz wymaga:
- Drużyna A, drużyna B  
- Wynik (gole A : gole B)  
- Status: rozegrany  
- Opcjonalnie: strzelcy, czyste konta bramkarzy (dla statystyk końcowych)

#### 5.2.4 Tabela grupowa (4 grupy)
- Kompletne tabele z punktami, bramkami, miejscami  
- Spójne z wynikami meczów grupowych

#### 5.2.5 Drabinka play-off
- Kompletna drabinka 1/8 → finał  
- Wszystkie mecze PO rozegrane oprócz finału  
- Finał: Orły vs United, wynik pusty

#### 5.2.6 Statystyki indywidualne (preloaded, wyliczone po finałe)
- **Król strzelców:** Kowalski — 7 bramek (z historii meczów demo)  
- **Bramkarz turnieju:** Nowak — 4 czyste konta (z historii meczów demo)  
- Statystyki muszą być **spójne matematycznie** z wynikami 55 rozegranych meczów + finał wpisany przez użytkownika

#### 5.2.7 Podium (wyliczone po zapisie finału)
- 1. miejsce: zwycięzca finału  
- 2. miejsce: przegrany finału  
- 3. miejsce: Sparta Swarzędz (predefiniowany w scenariuszu — drużyna z meczu o 3. miejsce już rozegranego)

> **Reguła produktowa:** Podium musi wynikać z silnika aplikacji (reuse), nie być hardcoded — demo musi dowodzić, że system liczy automatycznie.

### 5.3 Plik scenariusza demo (deliverable)

Developer powinien otrzymać **jeden kanoniczny pakiet danych demo** (format do ustalenia: JSON / import do Firebase sandbox):

```
demo-story-scenario/
├── tournament.meta.json
├── teams.json          (16)
├── matches.json        (56, finał bez wyniku)
├── standings.json      (4 grupy)
├── playoff-bracket.json
├── player-stats.json   (strzelcy, bramkarze — spójne z meczami)
└── expected-podium.json (walidacja po przykładowym wyniku 3:2)
```

---

## 6. Jakie stany aplikacji będą wykorzystywane

### 6.1 Maszyna stanów Demo Story

```
                    ┌──────────┐
                    │    E0    │ ENTRY
                    │  Wejście │
                    └────┬─────┘
                         │ start_demo
                    ┌────▼─────┐
                    │    E1    │
                    │   Hook   │
                    └────┬─────┘
                         │ next
                    ┌────▼─────┐
                    │    E2    │
                    │  Kibic   │
                    └────┬─────┘
                         │ next
                    ┌────▼─────┐
                    │    E3    │
                    │Organizator│
                    └────┬─────┘
                         │ open_final
                    ┌────▼─────┐
                    │    E4    │◄── jedyna interakcja
                    │  Finał   │
                    └────┬─────┘
                         │ save_final_score
                    ┌────▼─────┐
                    │    E5    │◄── PEAK
                    │  Podium  │
                    └────┬─────┘
                         │ next (auto lub CTA)
                    ┌────▼─────┐
                    │    E6    │◄── KONWERSJA
                    │Konwersja │
                    └────┬─────┘
                         │ next / skip_to_archive
                    ┌────▼─────┐
                    │    E7    │
                    │ Archiwum │
                    └────┬─────┘
                         │ end_demo
                    ┌────▼─────┐
                    │   END    │
                    └──────────┘
```

### 6.2 Stany globalne aplikacji

| Stan | Opis | Kiedy aktywny |
|------|------|---------------|
| `APP_IDLE` | Aplikacja bez aktywnej sesji demo | Przed E0, po END |
| `DEMO_STORY_ACTIVE` | Sesja demo w toku | E0 → E7 |
| `DEMO_STORY_STEP_{n}` | Aktualny ekran (0–7) | Per ekran |
| `DEMO_DATA_LOADED` | Scenariusz demo załadowany | Po starcie demo |
| `DEMO_FINAL_PENDING` | Finał bez wyniku | E1 → E4 (przed zapisem) |
| `DEMO_FINAL_SAVED` | Finał z wynikiem | Po zapisie E4 |
| `DEMO_PODIUM_COMPUTED` | Podium wyliczone | E5+ |
| `DEMO_TOURNAMENT_CLOSED` | Turniej demo zamknięty | E5+ |
| `DEMO_CONVERSION_SHOWN` | Ekran konwersji wyświetlony | E6 |
| `DEMO_COMPLETED` | Flow zakończony | Po E7 |

### 6.3 Stany danych turnieju demo

| Stan danych | Wartość | Ekrany |
|-------------|---------|--------|
| Turniej | Aktywny, 55/56 meczów | E1–E4 |
| Finał | Bez wyniku | E1–E4 |
| Finał | Z wynikiem (user input) | E5–E7 |
| Turniej | Zamknięty | E5–E7 |
| Archiwum | Dostępne | E7 |

### 6.4 Stany UI (per ekran)

| Ekran | Stany UI |
|-------|----------|
| E0 | `idle` |
| E1 | `loaded` |
| E2 | `fan_view_tab_{terminarz\|wyniki\|tabela\|playoff}` — domyślnie terminarz lub wyniki |
| E3 | `organizer_overview` |
| E4 | `final_form_empty` → `final_form_valid` → `final_saving` → `final_saved` |
| E5 | `podium_revealing` → `podium_ready` |
| E6 | `conversion_default` |
| E7 | `archive_epilog` |

### 6.5 Stany wyłączone w Demo Story MVP

Podczas `DEMO_STORY_ACTIVE` **ukryte / zablokowane**:

- Menu główne aplikacji (nawigacja modułów)  
- Generowanie terminarza  
- Losowanie grup  
- Edycja drużyn  
- Regeneracja play-off  
- Operacje destrukcyjne (freeze, unlock, restore)  
- Panel admina  
- Edycja meczów innych niż finał  
- Przełączenie na inny turniej  

---

## 7. Jak wyglądają przejścia pomiędzy ekranami

### 7.1 Macierz przejść

| Z | Do | Trigger | Warunek | Animacja / UX (spec) |
|---|-----|---------|---------|----------------------|
| E0 | E1 | Klik „Zobacz finał turnieju” | — | Load demo → forward |
| E0 | Aktywacja | Klik „Mam klucz” | — | Exit demo flow |
| E1 | E2 | Klik „Zobacz, co widzą rodzice” | Demo loaded | Forward |
| E2 | E3 | Klik „Wróć do stołu organizatora” | — | Forward |
| E3 | E4 | Klik „Wpisz wynik finału” | — | Forward / modal |
| E4 | E5 | Klik „Zapisz wynik finału” | Wynik poprawny | Save → compute → forward |
| E4 | E4 | Klik „Zapisz” | Wynik pusty | Walidacja inline, brak przejścia |
| E5 | E6 | Klik „Chcę taki turniej u siebie” LUB auto-timer | Podium ready | Forward (max 5 s auto optional) |
| E5 | Aktywacja | Klik „Aktywuj licencję” | — | Exit do aktywacji |
| E6 | E7 | Klik „Dalej” / scroll / timer | — | Forward |
| E6 | Aktywacja | Klik primary/secondary CTA | — | Exit do konwersji |
| E7 | END | Zamknięcie / CTA | — | `demo_story_completed` |

### 7.2 Reguły nawigacji

| Reguła | MVP |
|--------|-----|
| Flow liniowy | Tak — brak skoków do E5 bez zapisu finału |
| Wstecz (in-app) | Dopuszczalny max 1 krok (E4→E3); bez powrotu do E0 z E3+ |
| Browser back | Confirm dialog: „Opuszczasz demo” |
| Skip ekranów | **Niedozwolony** |
| Progress indicator | Krok 1–6 widoczny na E1–E6 (E0 i E7 bez progress lub E7 jako epilog) |
| Auto-advance | Tylko E5→E6 opcjonalnie po 5 s (decyzja produktowa; domyślnie: manual CTA) |

### 7.3 Sekwencja krytyczna (PEAK → KONWERSJA)

```
E4 save_final_score
  → [backend] zapis wyniku finału
  → [backend] wyliczenie podium + statystyki
  → [backend] zamknięcie turnieju demo
  → E5 podium_revealing (≤ 2 s)
  → E5 podium_ready
  → [użytkownik] CTA „Chcę taki turniej u siebie”
  → E6 konwersja
```

**Reguła peak-end:** E6 musi nastąpić **bezpośrednio po E5**. E7 jest epilogiem **po** E6, nie przed.

### 7.4 Microcopy przejść (z Copy Deck)

| Moment | Copy |
|--------|------|
| Ładowanie demo | Trwa ładowanie finału turnieju… |
| Zapis wyniku | Zapisuję wynik finału… |
| Po zapisie | Finał rozstrzygnięty. Wyliczam podium… |
| Progress | Krok 3 z 6 · Finał |

---

## 8. Jakie interakcje wykonuje użytkownik

### 8.1 Interakcje w scope MVP

| # | Ekran | Interakcja | Typ | Obowiązkowa |
|---|-------|------------|-----|-------------|
| 1 | E0 | Klik „Zobacz finał turnieju” | Nawigacja | Tak (start) |
| 2 | E1 | Klik „Zobacz, co widzą rodzice” | Nawigacja | Tak |
| 3 | E2 | Przełączenie tabów widoku kibica (opcjonalnie) | Eksploracja | Nie |
| 4 | E2 | Klik „Wróć do stołu organizatora” | Nawigacja | Tak |
| 5 | E3 | Klik „Wpisz wynik finału” | Nawigacja | Tak |
| 6 | E4 | **Wpisanie wyniku finału** | **Input** | **Tak — jedyna wymagana interakcja merytoryczna** |
| 7 | E4 | Klik „Zapisz wynik finału” | Akcja | Tak |
| 8 | E5 | Klik „Chcę taki turniej u siebie” | Konwersja | Tak (do przejścia E6) |
| 9 | E6 | Klik CTA konwersyjne | Konwersja | Nie (ale mierzone) |
| 10 | E7 | Klik „Aktywuj licencję” (powtórzone) | Konwersja | Nie |

### 8.2 Interakcje poza scope (zablokowane)

- Edycja drużyn, meczów (poza finałem)  
- Generowanie / regeneracja terminarza  
- Konfiguracja turnieju  
- Operacje admina  
- Eksport PDF (może być widoczny w E7 jako informacja, bez interakcji MVP)

### 8.3 Walidacja interakcji finału (E4)

| Reguła | Opis |
|--------|------|
| Format wyniku | Dwie liczby całkowite ≥ 0 |
| Remis | Dozwolony (jeśli aplikacja wspiera finał remisowy w regulaminie demo) |
| Puste pola | Blokada zapisu + komunikat: „Wpisz wynik finału, aby zamknąć turniej.” |
| Strzelcy | Opcjonalne w MVP — można ukryć lub uprościć |
| Ponowny zapis | Po zapisie — brak edycji w MVP (flow idzie do E5) |

---

## 9. Jakie dane są predefiniowane

### 9.1 Predefiniowane na stałe (nie zmienia użytkownik)

| Kategoria | Zawartość |
|-----------|-----------|
| Turniej | Nazwa, hala, data, 16 drużyn, 4 grupy |
| Mecze rozegrane | 55 meczów z wynikami, strzelcami, fazami |
| Tabele grupowe | 4 kompletne tabele |
| Drabinka play-off | Mecze 1/8, 1/4, 1/2, mecz o 3. miejsce — rozegrane |
| Finał — uczestnicy | FC Orły Poznań vs United Luboń |
| Statystyki bazowe | Król strzelców, bramkarz — z 55 meczów |
| Copy | Wszystkie teksty z Copy Deck |
| Hero metrics | 16 drużyn · 56 meczów · 55 rozegranych |

### 9.2 Predefiniowane z wariantem (zależne od inputu użytkownika)

| Kategoria | Input użytkownika | Output systemu |
|-----------|-------------------|----------------|
| Wynik finału | Gole A : Gole B | Zwycięzca / przegrany finału |
| Podium 1–2 | Wynik finału | Wyliczone przez silnik aplikacji |
| Podium 3. miejsce | — | Sparta Swarzędz (z rozegranego meczu o 3. miejsce) |
| Statystyki końcowe | Wynik finału | Aktualizacja po zapisie (strzelcy finału, jeśli podani) |

### 9.3 Predefiniowane wartości kanoniczne (walidacja QA)

Przy wyniku finału **3 : 2** (Orły : United):

| Element | Oczekiwana wartość |
|---------|-------------------|
| 1. miejsce | FC Orły Poznań |
| 2. miejsce | United Luboń |
| 3. miejsce | Sparta Swarzędz |
| Król strzelców | Kowalski — 7 bramek |
| Bramkarz turnieju | Nowak — 4 czyste konta |
| Status turnieju | Zamknięty |
| Mecze rozegrane | 56 / 56 |

---

## 10. Jakie zdarzenia analityczne należy mierzyć

### 10.1 Konwencja nazewnictwa

Prefix: `demo_story_`  
Każde zdarzenie zawiera: `session_id`, `step`, `timestamp`

### 10.2 Zdarzenia obowiązkowe (MVP)

| Zdarzenie | Trigger | Właściwości |
|-----------|---------|-------------|
| `demo_story_started` | Start demo (E0→E1) | `entry_point`, `device_type` |
| `demo_story_step_viewed` | Każdy ekran E1–E7 | `step_id`, `step_name`, `time_on_previous_step` |
| `demo_story_hook_viewed` | E1 rendered | `teams_count: 16`, `matches_total: 56`, `matches_played: 55` |
| `demo_story_fan_view_viewed` | E2 rendered | `default_tab` |
| `demo_story_fan_tab_switched` | Zmiana tabu E2 | `tab_name` |
| `demo_story_organizer_view_viewed` | E3 rendered | `matches_played: 55`, `matches_total: 56` |
| `demo_story_final_form_opened` | E4 rendered | — |
| `demo_story_final_score_saved` | Sukces zapisu E4 | `score_home`, `score_away`, `time_from_start` |
| `demo_story_final_validation_error` | Błąd walidacji E4 | `error_type` |
| `demo_story_podium_viewed` | E5 rendered | `time_from_start`, `winner`, `podium_1/2/3` |
| `demo_story_cta_clicked` | Klik CTA konwersyjne | `cta_id`, `step_id`, `cta_copy` |
| `demo_story_conversion_viewed` | E6 rendered | `time_from_podium` |
| `demo_story_archive_viewed` | E7 rendered | — |
| `demo_story_completed` | E7 osiągnięty / END | `total_duration`, `final_score_saved: true/false` |
| `demo_story_abandoned` | Wyjście przed E5 | `last_step`, `duration` |
| `demo_story_license_redirect` | Wyjście do aktywacji | `source_step`, `cta_id` |

### 10.3 Mapowanie CTA → cta_id

| cta_id | Copy | Ekrany |
|--------|------|--------|
| CTA-01 | Zobacz finał turnieju | E0 |
| CTA-02 | Mam klucz — aktywuj licencję | E0 |
| CTA-03 | Zobacz, co widzą rodzice | E1 |
| CTA-04 | Wróć do stołu organizatora | E2 |
| CTA-05 | Wpisz wynik finału | E3 |
| CTA-06 | Zapisz wynik finału | E4 |
| CTA-07 | Chcę taki turniej u siebie | E5 |
| CTA-08 | Aktywuj licencję na mój turniej | E5, E6 |
| CTA-09 | Zamów klucz na weekend turnieju | E6 |
| CTA-10 | Wyślij mi ofertę | E6 |
| CTA-11 | Aktywuj licencję (powtórzone) | E7 |

### 10.4 Metryki pochodne (dashboard produktowy)

| Metryka | Formuła |
|---------|---------|
| **Completion rate** | `demo_story_podium_viewed` / `demo_story_started` |
| **Conversion rate** | `demo_story_cta_clicked` (CTA-07/08/09/10) / `demo_story_podium_viewed` |
| **Time to peak** | `demo_story_final_score_saved.timestamp` − `demo_story_started.timestamp` |
| **Time to CTA** | pierwszy `demo_story_cta_clicked.timestamp` − start |
| **Drop-off hook → kibic** | E1 viewed bez E2 / E1 viewed |
| **Abandon rate** | `demo_story_abandoned` / `demo_story_started` |

### 10.5 Cele docelowe (z PRD)

| Metryka | Cel MVP |
|---------|---------|
| Completion rate (start → podium) | ≥ 70% |
| Time to peak | 45–90 s |
| Time to CTA (median) | ≤ 120 s |
| Drop-off E1→E2 | Monitorować, minimalizować |

---

## 11. Kryteria ukończenia demo

Demo Story uznaje się za **ukończone przez użytkownika**, gdy spełnione są **wszystkie** warunki:

| # | Kryterium |
|---|-----------|
| DC-1 | Użytkownik przeszedł E0 → E1 → E2 → E3 → E4 |
| DC-2 | Użytkownik wpisał i zapisał wynik finału |
| DC-3 | System wyświetlił E5 (podium) z automatycznie wyliczonymi miejscami 1–3 |
| DC-4 | System wyświetlił króla strzelców i bramkarza turnieju na E5 |
| DC-5 | Użytkownik dotarł do E6 (konwersja) po E5 |
| DC-6 | Zdarzenie `demo_story_completed` emitowane po E7 lub po CTA konwersyjnym z E6 |

**Demo częściowo ukończone:** użytkownik dotarł do E5, ale nie do E6 — mierzone jako `demo_story_abandoned` z `last_step: 5`.

**Demo nieukończone:** użytkownik opuścił przed zapisem finału (E4).

---

## 12. Kryteria sukcesu MVP

### 12.1 Kryteria techniczne (Definition of Done — developer)

| ID | Kryterium | Źródło |
|----|-----------|--------|
| TD-1 | Flow E0→E7 działa bez klucza licencyjnego | AC-J1 |
| TD-2 | Jedna liniowa ścieżka, brak menu funkcji na starcie | AC-J2 |
| TD-3 | Hero metrics (16/56/55) widoczne na E1 i E3 | AC-J3, AC-M4 |
| TD-4 | Widok kibica pokazuje terminarz, wyniki, tabelę, play-off | AC-J4 |
| TD-5 | Panel organizatora: 55/56 + finał do wpisania | AC-J5 |
| TD-6 | Jedna interakcja: wynik finału | AC-J6 |
| TD-7 | Podium + statystyki auto po zapisie finału | AC-J7 |
| TD-8 | E6 bezpośrednio po E5, przed E7 | AC-J8 |
| TD-9 | E7 ≤ 1 viewport / 15 s czytania | AC-J9 |
| TD-10 | E8 niedostępny | Scope MVP |
| TD-11 | Copy zgodny z Copy Deck | AC-M1–M3 |
| TD-12 | CTA konwersyjne z next step + pakiety | AC-C1–C3 |
| TD-13 | „Mam klucz” dostępny na E0 bez psucia flow | AC-C4 |
| TD-14 | Wszystkie zdarzenia z sekcji 10 emitowane | Analytics |
| TD-15 | Scenariusz demo spójny matematycznie (QA z expected-podium.json) | Data integrity |

### 12.2 Kryteria produktowe (Definition of Done — product)

| ID | Kryterium | Cel |
|----|-----------|-----|
| PD-1 | Median time to podium | ≤ 120 s |
| PD-2 | Completion rate | ≥ 70% |
| PD-3 | Test 5 organizatorów: zrozumienie obietnicy po 60 s | ≥ 4/5 |
| PD-4 | Test 5 organizatorów: „chcę taki turniej u siebie” po pełnym demo | ≥ 3/5 |
| PD-5 | Message recall: „spokój / mniej chaosu”, nie „grupy/terminarz” | ≥ 4/5 |

### 12.3 Kryterium sukcesu biznesowego (qualitative)

Po ~60 sekundach organizator 16 drużyn potrafi powiedzieć:

> „Chcę taki turniej u siebie — rodzice sami widzą wyniki, a po finałe nie liczę podium na kartce.”

---

## 13. Ryzyka implementacyjne

| # | Ryzyko | Prawdop. | Wpływ | Mitygacja |
|---|--------|----------|-------|-----------|
| R1 | **Integracja z istniejącym demo (tab-based)** — konflikt dwóch entry pointów | Wysoka | Wysoki | Demo Story jako domyślny entry; stare demo ukryte lub pod aliasem |
| R2 | **Dane demo niespójne matematycznie** — podium ≠ wyniki meczów | Średnia | Krytyczny | Kanoniczny plik scenariusza + test expected-podium.json |
| R3 | **Silnik podium nie działa na danych demo** — hardcode jako obejście | Średnia | Wysoki | QA obowiązkowe: podium musi wynikać z silnika, nie stałych |
| R4 | **Widok kibica wymaga Firebase live** — demo offline niemożliwe | Średnia | Średni | Warstwa demo: lokalne dane lub sandbox namespace |
| R5 | **Scope creep** — developer dodaje E8, setup, menu | Wysoka | Wysoki | Ten dokument + code review vs sekcja 1.2 |
| R6 | **CTA konkuruje z nawigacją aplikacji** | Średnia | Średni | `DEMO_STORY_ACTIVE` blokuje globalną nawigację |
| R7 | **Czas ładowania > 3 s** — drop-off na E0→E1 | Średnia | Średni | Preload scenariusza; lazy load tylko widoku kibica |
| R8 | **Copy techniczny przedostaje się do UI** | Niska | Średni | Copy Deck jako checklist; review PR |
| R9 | **Brak analityki** — brak baseline do iteracji | Średnia | Średni | Sekcja 10 jako wymaganie MVP, nie nice-to-have |
| R10 | **Regresja istniejącego flow aktywacji licencji** | Niska | Wysoki | Parametr źródła `demo_story`; test regresji aktywacji |
| R11 | **Mobile widok kibica nieczytelny w ramce demo** | Średnia | Średni | Test na urządzeniach 375px; fallback full-width |
| R12 | **Użytkownik wpisuje ekstremalny wynik** (np. 99:0) | Niska | Niski | Walidacja max bramek (np. ≤ 20) w demo |

---

## 14. Elementy poza zakresem MVP

### 14.1 Funkcjonalne

| Element | Wersja docelowa |
|---------|-----------------|
| E8 — Chcesz zobaczyć więcej? | v1.1 |
| Wznowienie demo po odświeżeniu | v1.1 |
| Deep link do konkretnego ekranu | v1.1 |
| A/B testy copy (warianty z Copy Deck §9) | v1.2 |
| Wiele scenariuszy demo (np. 8 drużyn, 32 drużyny) | v2.0 |
| Personalizacja demo (nazwa własnego turnieju) | v2.0 |
| Eksport PDF z poziomu demo | v1.1 |
| FAQ rozwijane na E6 | v1.1 (copy gotowe) |
| Auto-advance E5→E6 po timerze | v1.1 |
| Wielojęzyczność | v2.0 |

### 14.2 Techniczne

| Element | Uwagi |
|---------|-------|
| Persystencja sesji demo między urządzeniami | Nie MVP |
| Integracja CRM / webhook leadów | Konfiguracja po MVP |
| Firebase Security Rules — produkcja | Osobny task |
| Pełny refactor monolitu | Nie w scope Demo Story |
| Testy E2E automatyczne | Zalecane post-MVP |

### 14.3 Produkty / content

| Element | Uwagi |
|---------|-------|
| Pełna lista 16 drużyn z realistycznymi nazwami | Deliverable przed dev start |
| Polityka odpowiedzi Wi-Fi / offline (ostateczna copy) | Do ustalenia z produktem |
| Definicja cen pakietów (1 dzień / weekend / miesiąc) | Wymagane przed E6 live |
| Materiały sprzedażowe (status quo vs TurniejPro) | Copy Deck §7 — poza demo |

---

## 15. Plan wdrożenia (fazy)

### Faza 1 — Fundament (dev)
- Maszyna stanów Demo Story (E0–E7)  
- Pakiet danych demo (scenariusz kanoniczny)  
- Izolacja trybu demo od produkcji  

### Faza 2 — Ekrany narracyjne (dev)
- E0, E1, E3, E6, E7 — warstwa copy + nawigacja  
- Hero metrics na E1 i E3  

### Faza 3 — Reuse modułów (dev)
- E2: osadzenie widoku kibica  
- E4: wpis wyniku finału (reuse protokołu)  
- E5: auto podium + statystyki (reuse silnika)  

### Faza 4 — Konwersja i analityka (dev)
- CTA → aktywacja / lead  
- Zdarzenia sekcji 10  
- Parametr źródła `demo_story`  

### Faza 5 — QA i walidacja produktowa
- Test expected-podium.json  
- Test 5 organizatorów (PD-3, PD-4, PD-5)  
- Pomiar baseline metryk  

---

## 16. Deliverables dla developera

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Ten dokument (`IMPLEMENTATION_DEMO_STORY.md`) | ✅ |
| 2 | `PRD_DEMO_STORY.md` | ✅ |
| 3 | `COPY_DECK_DEMO_STORY.md` | ✅ |
| 4 | `WIREFRAME_DEMO_STORY.md` | ✅ |
| 5 | Plik scenariusza demo (`demo-story-scenario/`) | ☐ Do przygotowania |
| 6 | Lista 16 drużyn demo (pełna) | ☐ Do przygotowania |
| 7 | Definicja cen pakietów przy CTA | ☐ Do ustalenia |
| 8 | Konfiguracja analityki (provider) | ☐ Do ustalenia |

---

## 17. Checklist akceptacji przed merge

| # | Pytanie | ✓ |
|---|---------|---|
| 1 | Czy flow jest liniowy E0→E7 bez E8? | ☐ |
| 2 | Czy jedyna interakcja to wynik finału? | ☐ |
| 3 | Czy E6 jest bezpośrednio po E5? | ☐ |
| 4 | Czy 16/56/55 widoczne na E1 i E3? | ☐ |
| 5 | Czy podium wynika z silnika, nie hardcode? | ☐ |
| 6 | Czy demo działa bez klucza? | ☐ |
| 7 | Czy copy zgodny z Copy Deck? | ☐ |
| 8 | Czy wszystkie zdarzenia analityczne działają? | ☐ |
| 9 | Czy stare demo nie psuje entry point? | ☐ |
| 10 | Czy QA expected-podium.json przechodzi? | ☐ |

---

## 18. Historia dokumentu

| Wersja | Data | Autor | Zmiany |
|--------|------|-------|--------|
| 1.0 | 2026-07-11 | Product / Solution Architecture | Pierwsza wersja — pomost produkt → implementacja |

---

*Koniec dokumentu IMPLEMENTATION_DEMO_STORY.md*
