# Plan walidacji MVP — Demo Story v1.0

**Wersja:** 1.0  
**Status:** Do realizacji  
**Data:** 2026-07-12  
**Zakres:** Walidacja produktowa z 3–5 organizatorami turniejów (halowych, ~16 drużyn)  
**Powiązane dokumenty:** `PRD_DEMO_STORY.md` · `COPY_DECK_DEMO_STORY.md` · `IMPLEMENTATION_DEMO_STORY.md` · `SPRINT_A_COMPLETION_REPORT.md`

**Poza zakresem tego planu:** nowe funkcje, zmiany w kodzie, Sprint B jako backlog techniczny.

---

## 0. Kontekst

Demo Story MVP v1.0 jest **ukończone technicznie** (Sprint A = DONE).  
Ten plan służy do **walidacji produktowej i konwersyjnej** — czy historia sprzedaje obietnicę *„spokój organizatora w dniu turnieju”* i czy prowadzi do deklaracji zakupowej / aktywacji licencji.

| Parametr | Wartość |
|----------|---------|
| Liczba uczestników | **3–5** organizatorów (minimum 3 do wniosków, docelowo 5 dla progów PRD) |
| Format | Moderowany test 1:1, ~15–20 min na sesję |
| Środowisko | Urządzenie uczestnika (telefon lub laptop), bez instrukcji „jak klikać” |
| Wersja demo | Kanoniczny build z `SPRINT_A_COMPLETION_REPORT.md` (E0→E7) |
| Entry point | Ekran logowania → „ZOBACZ FINAŁ TURNIEJU” (E0) |

---

## 1. Cele walidacji

### 1.1 Cel główny

Sprawdzić, czy **organizator docelowej persony** (turniej halowy, ~16 drużyn) po przejściu Demo Story:

1. **Rozumie**, co TurniejPro sprzedaje (outcome, nie moduły).
2. **Ufa**, że produkt rozwiązuje jego realny ból w dniu turnieju.
3. **Chce** taki sam efekt u siebie — mierzone deklaracją intencji i gotowością do CTA.

### 1.2 Cele szczegółowe

| # | Cel | Pytanie badawcze |
|---|-----|------------------|
| C1 | **Zrozumienie obietnicy** | Czy po ~60 s uczestnik mówi o spokoju / mniejszym chaosie, a nie o „grupach” czy „generatorze”? |
| C2 | **Peak emocjonalny (E5)** | Czy podium po wpisaniu finału budzi ulgę / satysfakcję („nie liczę na kartce”)? |
| C3 | **Widok kibica (E2)** | Czy uczestnik widzi wartość dla rodziców i mniej telefonów do organizatora? |
| C4 | **Konwersja (E6–E7)** | Czy impuls po podium przekłada się na chęć aktywacji / kontaktu handlowego? |
| C5 | **Tarcie w flow** | Gdzie uczestnicy się gubią, rezygnują lub tracą zaufanie? |

### 1.3 Czego walidacja NIE robi

- Nie ocenia jakości danych demo (tabele, wyniki meczów) — to QA techniczne, już zamknięte.
- Nie testuje pełnego onboardingu płatnego klienta.
- Nie wymaga porównania z konkurencją (chyba że uczestnik sam wspomni).

---

## 2. Hipotezy do sprawdzenia

Każda hipoteza ma **kryterium falsyfikacji** — co musi się stać, żeby uznać ją za obaloną.

| ID | Hipoteza | Jak mierzymy | Falsyfikacja (obalenie) |
|----|----------|--------------|-------------------------|
| **H1** | Organizator w ≤60 s od startu demo rozumie, że chodzi o **spokój w dniu turnieju**, nie o konfigurację systemu | Pytanie po E1/E2 (patrz §4) | ≥2/5 opisuje produkt jako „narzędzie do grup/terminarza” bez wzmianki o dniu turnieju / rodzicach |
| **H2** | Widok kibica (E2) jest **czytelny na telefonie** i budzi przekonanie „rodzice sami sprawdzą” | Obserwacja + pytanie po E2 | ≥2/5 nie potrafi powiedzieć, co widzą rodzice; lub ≥2/5 narzeka na czytelność na mobile |
| **H3** | Panel organizatora (E3) daje **poczucie kontroli** (55/56, jeden mecz do domknięcia) | Pytanie po E3 | ≥2/5 nie wie, ile meczów zostało; lub mówi „nie wiem, co mam zrobić” |
| **H4** | Wpisanie wyniku finału (E4) jest **intuicyjne** i jedyna wymagana akcja jest akceptowalna | Obserwacja + czas do zapisu | ≥2/5 nie znajduje formularza bez podpowiedzi; lub ≥2/5 uważa interakcję za mylącą |
| **H5** | Podium (E5) to **moment peak** — uczestnik czuje „WOW” / ulgę, nie sceptycyzm wobec automatyzacji | Skala 1–5 + pytanie otwarte po E5 | Mediana zaufania do podium <3/5; lub ≥2/5 mówi „nie wierzę, że u mnie tak zadziała” |
| **H6** | Po pełnym demo ≥3/5 deklaruje **„chcę taki turniej u siebie”** | Pytanie zamknięte po E7 | ≤1/5 deklaruje silną intencję |
| **H7** | E6 (konwersja) pojawia się **we właściwym momencie** — tuż po peak, nie za wcześnie / za późno | Pytanie po E6 | ≥2/5 mówi „ za wcześnie proponujecie zakup” lub „szkoda, że dopiero na końcu” |
| **H8** | E7 (archiwum) wzmacnia **pewność** (dowód domknięcia), nie rozprasza | Pytanie po E7 | ≥2/5 uważa E7 za zbędny; nikt nie wspomina „wyniki zostają” / „protokół” |

---

## 3. Scenariusz testu użytkownika

### 3.1 Rekrutacja uczestników

**Profil must-have (ICP):**

- Organizuje lub współorganizuje turniej piłkarski halowy (dzieci / młodzież).
- Skala: **12–20 drużyn** (idealnie 16).
- Doświadczenie: minimum 1 turniej w roli decyzyjnej (trener, koordynator, członek zarządu klubu).
- **Nie** musi znać TurniejPro — preferowane świeże spojrzenie.

**Profil wykluczający (te sesje nie wliczamy do 5):**

- Developer / tester produktu.
- Osoba, która widziała wcześniejsze demo DEMO-2026 lub dokumentację wewnętrzną.

### 3.2 Przygotowanie sesji

| Element | Instrukcja dla moderatora |
|---------|---------------------------|
| Urządzenie | Telefon uczestnika (preferowane) + opcjonalnie laptop jako backup |
| Sieć | Wi-Fi lub LTE — notuj problemy łączności |
| Nagranie | Za zgodą: ekran + audio; minimum notatki pisemne |
| Briefing uczestnika | *„Pokażę Ci krótką historię turnieju. Proszę, myśl na głos. Nie ma złych odpowiedzi.”* |
| **Zakaz** | Nie tłumaczyć flow z góry; nie podpowiadać, gdzie klikać (chyba że uczestnik całkowicie zablokowany >2 min) |

### 3.3 Przebieg sesji (timeline)

| Faza | Czas | Działanie |
|------|------|-----------|
| **Intro** | 2 min | Powitanie, zgoda na nagranie, brief (think aloud) |
| **Demo — samodzielnie** | 3–8 min | Uczestnik przechodzi E0→E7 bez ingerencji |
| **Checkpoint E5** | 2–3 min | Pytania po podium (§5) — **przed** dalszą nawigacją, jeśli uczestnik jeszcze na E5 |
| **Dokończenie E6–E7** | 1–2 min | Jeśli zatrzymał się na E5/E6 — pozwól dokończyć |
| **Wywiad końcowy** | 5 min | Pytania po E7 (§6) |
| **CTA (opcjonalnie)** | 1 min | *„Czy chciałbyś teraz przejść do aktywacji licencji?”* — obserwacja, bez presji |

### 3.4 Mapowanie obserwacji na ekrany

Moderator notuje dla każdego ekranu:

| Ekran | Co obserwować |
|-------|----------------|
| **E0** | Czy startuje bez wahania; czy pyta o klucz zamiast demo |
| **E1** | Czy czyta metryki 16/56/55; reakcja emocjonalna |
| **E2** | Czy klika taby; czy mówi o rodzicach; problemy mobile |
| **E3** | Czy rozumie 55/56; czy wie, co zostało |
| **E4** | Czas do wpisania wyniku; błędy walidacji |
| **E5** | Reakcja na podium; czy klika CTA-07 |
| **E6** | Czy czyta bullet points; które CTA przyciąga wzrok |
| **E7** | Czy czyta kartę archiwum; czy kończy flow |

### 3.5 Dane do zebrania (per uczestnik)

| Pole | Typ |
|------|-----|
| ID uczestnika | P1–P5 |
| Urządzenie / rozdzielczość | tekst |
| Czas start → E5 (peak) | sekundy |
| Czas start → E7 (complete) | sekundy |
| Drop-off (jeśli) | ostatni ekran |
| Wynik finału wpisany | np. 3:2 |
| Notatki moderatora | wolny tekst |

---

## 4. Pytania po ekranie podium (E5)

**Moment:** Zaraz po wyświetleniu podium, **zanim** uczestnik przejdzie do E6.  
**Cel:** Złapać peak emocjonalny i zrozumienie obietnicy w „gorącym” stanie.

### 4.1 Pytania obowiązkowe

| # | Pytanie | Typ | Co nas interesuje |
|---|---------|-----|-------------------|
| Q5-1 | *„W jednym zdaniu: co właśnie się stało w tej chwili turnieju?”* | Otwarte | Czy mówi o zamknięciu / podium / automatyce, nie o „wpisaniu danych” |
| Q5-2 | *„Na skali 1–5: jak bardzo wierzysz, że po Twoim prawdziwym finałe nie musiałbyś liczyć podium na kartce?”* | Skala | H5 — zaufanie do automatyki |
| Q5-3 | *„Co byś powiedział rodzicom tego turnieju — skąd mają wyniki?”* | Otwarte | Message recall: kibic / live, nie organizator jako infolinia |
| Q5-4 | *„Gdyby to był Twój turniej — czy taki moment po finałe byłby dla Ciebie ważny?”* | Tak/nie + dlaczego | Wartość peak |
| Q5-5 | *„Co sprzedaje TurniejPro według Ciebie — na podstawie tego, co widziałeś?”* | Otwarte | H1 — spokój vs moduły (nagrywamy dosłownie) |

### 4.2 Pytania opcjonalne (jeśli czas)

| # | Pytanie |
|---|---------|
| Q5-6 | *„Czy podium wygląda wiarygodnie? Czego byś nie ufał?”* |
| Q5-7 | *„Czy zauważyłeś króla strzelców / bramkarza turnieju? Czy to ma sens?”* |

### 4.3 Sygnały ostrzegawcze na E5 (notatka dla moderatora)

- Mówi wyłącznie o „ładnym widoku” bez outcome.
- Pyta „skąd system wie wyniki?” w tonie sceptycznym.
- Nie potrafi wskazać, kto wygrał turniej po podium.
- Chce edytować / poprawiać wyniki po zapisie.

---

## 5. Pytania po ukończeniu E7

**Moment:** Po dotarciu do archiwum lub rezygnacji z flow.  
**Cel:** Konwersja, tarcie, gotowość do następnego kroku.

### 5.1 Pytania obowiązkowe

| # | Pytanie | Typ | Co nas interesuje |
|---|---------|-----|-------------------|
| Q7-1 | *„Czy chciałbyś, żeby Twój następny turniej wyglądał tak samo?”* | Skala 1–5 | H6 — intencja zakupowa |
| Q7-2 | *„Co było dla Ciebie najważniejsze w tej historii?”* | Otwarte | Priorytetyzacja WOW (E2 vs E5 vs E3) |
| Q7-3 | *„Co było niejasne lub zbędne?”* | Otwarte | Tarcie w flow |
| Q7-4 | *„Czy moment z propozycją aktywacji licencji (ekran ‘Twój turniej może wyglądać tak samo’) był we właściwym momencie?”* | Tak/nie + dlaczego | H7 — timing konwersji |
| Q7-5 | *„Który przycisk byś kliknął: aktywacja licencji, zamówienie klucza, czy oferta — czy żaden?”* | Wybór + dlaczego | CTA preference |
| Q7-6 | *„Co musiałoby się stać, żebyś kupił / aktywował TurniejPro przed swoim turniejem?”* | Otwarte | Barier konwersji |
| Q7-7 | *„Gdybyś polecał to innemu organizatorowi — co byś powiedział w jednym zdaniu?”* | Otwarte | Message recall / NPS jakościowy |

### 5.2 Pytania o obiekcje (z Copy Deck FAQ)

| # | Pytanie |
|---|---------|
| Q7-8 | *„Czy martwi Cię, że na hali może nie być internetu?”* |
| Q7-9 | *„Czy 16 drużyn to skala, która pasuje do Twoich turniejów?”* |
| Q7-10 | *„Ile realnie zapłaciłbyś za spokój w taki dzień turnieju — jako widełki (np. do 100 / 100–300 / 300+ zł)?”* |

### 5.3 Pytanie zamykające

| # | Pytanie |
|---|---------|
| Q7-11 | *„Czy coś jeszcze chciałbyś zobaczyć przed podjęciem decyzji?”* (bez obiecywania E8 — tylko zapis potrzeb) |

---

## 6. Kryteria sukcesu

Walidacja MVP uznaje się za **sukces produktowy**, gdy spełnione są **kumulatywnie** progi z PRD (dla **5 uczestników**; przy **3 uczestnikach** stosuj proporcje: 3/5 ≈ 60% → zaokrąglenie w dół w tabeli „minimum 3”).

### 6.1 Progi ilościowe

| ID | Kryterium | Próg (5 os.) | Minimum (3 os.) |
|----|-----------|--------------|-----------------|
| **S1** | Completion: dotarcie do E5 (podium) | ≥4/5 (80%) | ≥2/3 |
| **S2** | Completion: dotarcie do E7 | ≥3/5 (60%) | ≥2/3 |
| **S3** | „Chcę taki turniej u siebie” (Q7-1 ≥4/5) | ≥3/5 | ≥2/3 |
| **S4** | Zrozumienie obietnicy po ~60 s (Q5-5: spokój/chaos/rodzice) | ≥4/5 | ≥2/3 |
| **S5** | Message recall: **nie** dominuje narracja „grupy/terminarz/generator” | ≥4/5 | ≥2/3 |
| **S6** | Zaufanie do podium (Q5-2 mediana) | ≥4/5 | mediana ≥3.5 |
| **S7** | Median time to peak (start → E5) | ≤120 s | ≤150 s |
| **S8** | Timing E6 akceptowany (Q7-4: „tak, we właściwym”) | ≥3/5 | ≥2/3 |
| **S9** | Chęć kliknięcia dowolnego CTA konwersyjnego (Q7-5 ≠ „żaden”) | ≥2/5 | ≥1/3 |

### 6.2 Kryterium sukcesu jakościowego (North Star)

≥ **4/5** uczestników po pełnym demo potrafi powiedzieć wariant:

> *„Chcę taki turniej u siebie — rodzice sami widzą wyniki, a po finałe nie liczę podium na kartce.”*

(lub równoważnik w własnych słowach — moderator ocenia zgodność z intencją).

### 6.3 Warunek domknięcia walidacji

- Przeprowadzono **minimum 3** pełne sesje.
- Każda sesja ma wypełnioną kartę w §8.
- Spisano rekomendacje Sprint B (§9) — **produktowe**, nie techniczne.

---

## 7. Kryteria porażki

Walidacja wymaga **rewizji narracji / konwersji** (decyzja produktowa), gdy wystąpi **którykolwiek** z warunków:

| ID | Warunek porażki | Implikacja |
|----|-----------------|------------|
| **F1** | ≤1/5 dociera do E5 | Flow zbyt długi lub niezrozumiały entry |
| **F2** | ≤1/5 deklaruje intencję zakupu (Q7-1 ≥4) | Peak nie przekłada się na konwersję |
| **F3** | ≥3/5 opisuje produkt jako „system do grup/terminarza” (Q5-5) | Zła obietnica produktowa — feature selling |
| **F4** | ≥3/5 nie ufa podium (Q5-2 ≤2) | Peak nie działa — brak wiarygodności automatyki |
| **F5** | ≥3/5 uważa E6 za „za wcześnie” | Złamanie peak-end rule |
| **F6** | ≥2/5 rezygnuje na E2 (mobile) z powodu czytelności | WOW #1 (kibic) nie dowozi na docelowym urządzeniu |
| **F7** | ≥3/5 mówi „nie wiem, co robić” na E3 lub E4 | Luka narracyjna przed/po interakcji |
| **F8** | Żaden uczestnik nie wspomina spontanicznie rodziców / telefonów | Obietnica „mniej chaosu od rodziców” nie rezonuje |

**Porażka ≠ wycofanie MVP.** Oznacza: przed skalą ruchu / płatnym ruchem trzeba iterować **copy, kolejność CTA lub moment konwersji** — w ramach decyzji produktowej, nie „dokładania funkcji”.

---

## 8. Analiza wyników pierwszych 5 testów

### 8.1 Karta uczestnika (szablon)

```
ID uczestnika:     P__
Data:              ____
Urządzenie:        ____
Rola:              ____
Skala turniejów:   __ drużyn

CZASY
  Start → E5:      ___ s
  Start → E7:      ___ s
  Drop-off:        E__ / brak

WYNIK FINaŁU:      ___:___

SKALE (1–5)
  Q5-2 Zaufanie podium:     __
  Q7-1 Chcę u siebie:       __

PYTANIA KLUCZOWE (skrót dosłownych cytatów)
  Q5-5 Co sprzedaje TP:     "..."
  Q7-2 Najważniejsze:       "..."
  Q7-3 Niejasne/zbędne:     "..."
  Q7-5 Wybrane CTA:         ____

CHECKLIST SUKCESU (T/N)
  [ ] S1 E5    [ ] S2 E7    [ ] S3 intencja    [ ] S4 obietnica
  [ ] S5 recall [ ] S6 zaufanie [ ] S8 timing E6 [ ] S9 CTA

SYGNAŁY PORAŻKI (T/N)
  [ ] F3 feature selling  [ ] F4 brak zaufania  [ ] F5 E6 za wcześnie
  [ ] F6 E2 mobile        [ ] F7 luka E3/E4

NOTATKI MODERATORA:
...
```

### 8.2 Tabela zbiorcza (wypełnić po sesjach)

| ID | E5? | E7? | t→E5 (s) | Q5-2 | Q7-1 | Obietnica OK? | CTA | Główny insight |
|----|-----|-----|----------|------|------|---------------|-----|----------------|
| P1 | | | | | | | | |
| P2 | | | | | | | | |
| P3 | | | | | | | | |
| P4 | | | | | | | | |
| P5 | | | | | | | | |
| **Σ** | /5 | /5 | med. | med. | ≥4: /5 | /5 | /5 | — |

### 8.3 Macierz hipotez — wynik końcowy

| Hipoteza | P1 | P2 | P3 | P4 | P5 | Werdykt |
|----------|----|----|----|----|-----|---------|
| H1 Obietnica ≤60 s | | | | | | POTWIERDZONA / OBRÓCONA / NIEJASNA |
| H2 E2 mobile | | | | | | |
| H3 E3 kontrola | | | | | | |
| H4 E4 intuicyjność | | | | | | |
| H5 E5 peak | | | | | | |
| H6 intencja zakupu | | | | | | |
| H7 timing E6 | | | | | | |
| H8 E7 dowód | | | | | | |

### 8.4 Wnioski zbiorcze (szablon do uzupełnienia)

**Co działa konsekwentnie (≥3/5):**  
- …

**Co nie działa konsekwentnie (≥2/5):**  
- …

**Niespodzianki (1 cytat reprezentatywny):**  
- „…” — P__

**Verdykt walidacji:**  
- [ ] **SUKCES** — spełnione progi §6, brak warunków §7  
- [ ] **SUKCES WARUNKOWY** — spełnione progi przy 3–4 osobach; wymaga 1–2 follow-up  
- [ ] **PORAŻKA PRODUKTOWA** — wymaga iteracji narracji/konwersji przed skalą  

---

## 9. Rekomendacje dla Sprint B (tylko produkt i konwersja)

> Sekcja uzupełniana **po** walidacji. Poniżej katalog decyzji produktowych możliwych do rozważenia — **nie** backlog implementacyjny.

### 9.1 Jeśli walidacja = SUKCES

| Obszar | Rekomendacja produktowa |
|--------|-------------------------|
| **Ruch** | Skierować ruch marketingowy na entry E0 („Zobacz finał turnieju”) jako domyślny lejek |
| **Konwersja** | Ustalić docelowe pakiety cenowe przy CTA-09 (obecnie copy bez ceny) |
| **Analityka** | Podłączyć provider (GA4/Plausible) pod zdarzenia `demo_story_*` — baseline completion i CTA |
| **Social proof** | Przygotować 1–2 cytaty z P1–P5 (za zgodą) pod landing / E6 |
| **Skala testu** | Powtórzyć walidację na **10 organizatorach** przed paid acquisition |

### 9.2 Jeśli F3 (feature selling) — dominuje „grupy/terminarz”

| Rekomendacja | Typ |
|--------------|-----|
| Przepisać hook E1 pod outcome („dzień turnieju”, nie „56 meczów”) | Copy |
| Ograniczyć widoczność tabów E2 w pierwszej sekundzie — domyślnie „Wyniki”, nie „Tabele” | Flow |
| Dodać jedno zdanie mostu E2→E3: „Ty masz panel — rodzice mają to” | Copy |

### 9.3 Jeśli F4 (brak zaufania podium)

| Rekomendacja | Typ |
|--------------|-----|
| Wzmocnić callout na E5: „Wyliczone z protokołu meczowego” — A/B copy | Copy |
| Rozważyć pokazanie **jednego** przykładu meczu finałowego na E4 przed zapisem | Narracja |
| Wywiady pogłębione: *„Co musiałoby Cię przekonać?”* | Badania |

### 9.4 Jeśli F5 (E6 za wcześnie) lub niska konwersja CTA

| Rekomendacja | Typ |
|--------------|-----|
| Test A/B: CTA-07 na E5 → bezpośrednio aktywacja vs E6 pośredni | Konwersja |
| Skrócić E6 do jednego CTA primary + microcopy (mniej wyboru) | Copy |
| E7 skrócić do 1 viewport — mniej przed konwersją | Flow |

### 9.5 Jeśli F6 (E2 mobile)

| Rekomendacja | Typ |
|--------------|-----|
| Priorytet badawczy: 5/5 sesji **tylko na telefonie** | Metodologia |
| Decyzja produktowa: czy E2 na mobile ma być full-width vs ramka | UX (bez nowych funkcji — układ) |

### 9.6 Jeśli F8 (brak rezonansu „rodzice”)

| Rekomendacja | Typ |
|--------------|-----|
| Wzmocnić label E2: „To widzą rodzice na telefonie” | Copy |
| Dodać microcopy na E0/E1 z bólem: „Koniec z telefonami w trakcie meczu” | Copy |
| Test persony: czy rekrutacja trafiła w organizatorów z doświadczeniem presji od rodziców | Rekrutacja |

### 9.7 Backlog decyzyjny Sprint B (do priorytetyzacji po wynikach)

| # | Temat | Typ decyzji | Blokuje skalę? |
|---|-------|-------------|----------------|
| B1 | Ceny pakietów przy CTA-09/10 | Produkt / pricing | Tak |
| B2 | Lead capture (mailto vs formularz) | Konwersja | Średnio |
| B3 | E8 opcjonalny („Chcesz zobaczyć więcej?”) | Scope | Nie |
| B4 | Auto-advance E5→E6 (timer 5 s) | Flow / konwersja | Nie |
| B5 | Usunięcie kodu legacy DEMO-2026 | Techniczne — **poza tym planem** | Nie |
| B6 | Drugi scenariusz demo (8 drużyn) | Scope v2 | Nie |

---

## 10. Checklist przed startem walidacji

| # | Punkt | ✓ |
|---|-------|---|
| 1 | Build demo zgodny z `SPRINT_A_COMPLETION_REPORT.md` | ☐ |
| 2 | Rekrutacja 3–5 organizatorów (profil §3.1) | ☐ |
| 3 | Karta uczestnika §8.1 wydrukowana / w Notion | ☐ |
| 4 | Zgoda na nagranie / RODO | ☐ |
| 5 | Moderator nie jest twórcą demo (unikaj bias) | ☐ |
| 6 | Po sesjach: wypełniona tabela §8.2–8.4 | ☐ |
| 7 | Decyzja: SUKCES / WARUNKOWY / PORAŻKA | ☐ |

---

## 11. Historia dokumentu

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | 2026-07-12 | Pierwsza wersja planu walidacji MVP |

---

*Koniec dokumentu DEMO_STORY_VALIDATION_PLAN.md*
