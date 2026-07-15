# PRD: Demo Story — TurniejPro SaaS

**Wersja:** 1.0  
**Status:** Zaakceptowany do fazy projektowej  
**Data:** 2026-07-11  
**Właściciel produktu:** TurniejPro SaaS  
**Typ dokumentu:** Product Requirements Document (PRD)

---

## 1. Streszczenie

Demo Story to **jedna, liniowa historia produktu**, która pokazuje organizatorowi turnieju piłkarskiego, jak wygląda **dzień turnieju z TurniejPro SaaS** — od momentu, gdy rodzice sami sprawdzają wyniki, po wpisanie wyniku finału, automatyczne podium i zamknięcie turnieju.

Demo **nie jest** hubem funkcji, szkoleniem ani onboardingiem technicznym.

**Obietnica produktu sprzedawana w demo:**

> Spokój organizatora w dniu turnieju.

**Obietnica niesprzedawana w demo:**

> System turniejowy, generator grup, terminarz, play-off (jako główna narracja).

---

## 2. Business Goal

### 2.1 Cel główny

Zwiększyć konwersję od pierwszego kontaktu z produktem do **aktywacji licencji TurniejPro SaaS** poprzez doświadczenie emocjonalne i operacyjne, które organizator utożsamia ze swoim turniejem (16 drużyn, finał, rodzice przy boisku).

### 2.2 Cele biznesowe

| Cel | Opis |
|-----|------|
| **Konwersja** | Użytkownik po demo podejmuje akcję: aktywacja klucza, zamówienie pakietu lub kontakt sprzedażowy |
| **Pozycjonowanie** | TurniejPro postrzegany jako rozwiązanie „dnia turnieju”, nie „kolejnego generatora drabinki” |
| **Redukcja obaw** | Organizator wierzy, że obsłuży 16 drużyn bez chaosu i ręcznego liczenia podium |
| **Różnicowanie** | Wyraźne odróżnienie od Excel/WhatsApp, Score7 (sam wynik) oraz Toornament/Challonge (setup online) |
| **Skrócenie lejka** | Czas od wejścia do momentu „chcę to u siebie” ≤ 60 sekund (impuls), ≤ 3 minut (pełna historia) |

### 2.3 Niec cele (out of scope dla tego PRD)

- Zastąpienie pełnego onboardingu płatnego klienta
- Szkolenie ze wszystkich funkcji systemu
- Obsługa wielu person w jednym flow (admin, sędzia linii, sponsor)
- Implementacja techniczna, layout UI, kod

---

## 3. Persona

### 3.1 Persona główna: Organizator turnieju halowego

| Atrybut | Opis |
|---------|------|
| **Kim jest** | Trener, członek klubu, koordynator akcji promocyjnej, „sędzia przy stoliku” |
| **Skala turnieju** | 16 drużyn (4 grupy × 4), faza grupowa + play-off + finał (~56 meczów) |
| **Kontekst** | Turniej za 7–14 dni; hala, orlik lub boisko szkolne; rodzice i kibice na miejscu |
| **Obecne narzędzia** | Excel, WhatsApp, kartka, czasem Toornament/Challonge/Turniejomat |
| **Ból** | Telefony od rodziców, ręczne liczenie tabel i podium, stres w końcówce dnia |
| **Motywator** | Profesjonalny wizerunek turnieju + mniej pracy w dniu eventu |
| **Bariera** | „Czy dam radę technicznie?”, „Czy internet na obiekcie wytrzyma?”, „Ile to kosztuje?” |

### 3.2 Persona wtórna: Rodzic / kibic (implicit)

| Atrybut | Opis |
|---------|------|
| **Potrzeba** | Terminarz, wyniki, tabela, play-off — bez dzwonienia do organizatora |
| **Oczekiwanie** | Link/QR, bez instalacji aplikacji, bez konta |
| **Rola w demo** | Pokazana przez widok kibica; nie steruje flow |

### 3.3 Anti-persona (kto nie jest celem demo)

- Administrator ligowy szukający sezonowej platformy SaaS
- Użytkownik szukający wyłącznie darmowej drabinki online (Challonge)
- Organizator turnieju 4-drużynowego (może skorzystać, ale nie jest targetem narracji)

---

## 4. Success Metrics

### 4.1 Metryki pierwszorzędne (konwersja)

| Metryka | Definicja | Cel (do ustalenia z baseline) |
|---------|-----------|-------------------------------|
| **Demo → CTA click** | % użytkowników, którzy kliknęli główny CTA po podium | TBD po wdrożeniu |
| **Demo → aktywacja licencji** | % sesji demo zakończonych aktywacją klucza w ciągu 7 dni | TBD |
| **Demo → kontakt sprzedażowy** | % sesji z „Zamów klucz” / „Wyślij ofertę” | TBD |

### 4.2 Metryki drugorzędne (jakość doświadczenia)

| Metryka | Definicja | Cel |
|---------|-----------|-----|
| **Completion rate** | % użytkowników, którzy dochodzą do ekranu podium | ≥ 70% |
| **Time to peak** | Czas od startu do wpisania wyniku finału | 45–90 s |
| **Time to CTA** | Czas od startu do kliknięcia CTA | ≤ 120 s (median) |
| **Drop-off po hooku** | % odpadnięć między ekranem 1 a 2 | Monitorować; cel: minimalizacja |

### 4.3 Metryki jakościowe (badania)

| Metryka | Metoda | Pytanie kontrolne |
|---------|--------|-------------------|
| **Message recall** | Wywiad / ankieta po demo | „Co sprzedaje TurniejPro?” → oczekiwane: spokój / mniej chaosu, nie „grupy” |
| **Intent score** | Skala 1–5 | „Chcę taki turniej u siebie” |
| **Format fit** | Skala 1–5 | „To jest dla turnieju 16 drużyn” |

### 4.4 Kryterium sukcesu produktowego (qualitative)

Demo Story uznaje się za udane, gdy organizator 16 drużyn po ~60 sekundach potrafi powiedzieć:

> „Chcę taki turniej u siebie — rodzice sami widzą wyniki, a po finałe nie liczę podium na kartce.”

---

## 5. User Journey

### 5.1 Mapa journey (7 ekranów + opcjonalne)

```
[0 Wejście] → [1 Hook] → [2 Kibic] → [3 Organizator] → [4 Finał] → [5 Podium] → [6 CTA] → [7 Archiwum] → [8 Więcej? opcjonalnie]
```

### 5.2 Szczegółowy opis kroków

#### Ekran 0 — Wejście

| Element | Wymaganie |
|---------|-----------|
| Cel | Uruchomić demo bez barier; nie wymagać klucza licencyjnego |
| Akcja użytkownika | Jeden klik: start demo |
| Outcome | Użytkownik rozumie: to 2-minutowa historia finału, nie szkolenie |

#### Ekran 1 — Hook

| Element | Wymaganie |
|---------|-----------|
| Treść obowiązkowa | „Turniej 16 drużyn. 56 meczów. Finał za chwilę.” |
| Licznik | 55/56 meczów (może być zasygnalizowany już tutaj lub na ekranie 3) |
| Outcome | Skala turnieju + napięcie finału |

#### Ekran 2 — Widok kibica

| Element | Wymaganie |
|---------|-----------|
| Treść obowiązkowa | Terminarz, wyniki, tabela, play-off — widok publiczny |
| Komunikat | Rodzice sami sprawdzają; organizator nie jest infolinią |
| Outcome | Ulga; zrozumienie wartości live dla kibiców |

#### Ekran 3 — Panel organizatora

| Element | Wymaganie |
|---------|-----------|
| Status | 55/56 meczów rozegranych; pozostał finał |
| Kontekst | Widać, że turniej był prowadzony w systemie (bez tutorialu setupu) |
| Outcome | Spokój; poczucie kontroli; gotowość do jednej akcji |

#### Ekran 4 — Wpisanie wyniku finału

| Element | Wymaganie |
|---------|-----------|
| Interakcja | Jedyna wymagana akcja użytkownika w głównym flow |
| Zakres | Wynik finału (strzelcy opcjonalnie / uproszczone w demo) |
| Outcome | Agency; prostota; „dam radę w sobotę” |

#### Ekran 5 — Podium (peak)

| Element | Wymaganie |
|---------|-----------|
| Treść obowiązkowa | Podium 1–3, król strzelców, bramkarz turnieju |
| Reguła | Wyliczone automatycznie po zapisie finału — bez dodatkowych kroków |
| Outcome | WOW; ulga; prestiż turnieju |

#### Ekran 6 — CTA konwersyjne

| Element | Wymaganie |
|---------|-----------|
| Timing | Bezpośrednio po podium (peak-end rule) |
| Komunikat | „Twój turniej może wyglądać tak samo.” |
| Akcje | Aktywacja licencji / zamówienie pakietu / kontakt |
| Outcome | Decyzja zakupowa lub zapis leadu |

#### Ekran 7 — Archiwum (epilog)

| Element | Wymaganie |
|---------|-----------|
| Długość | Krótki dowód (≤ 15 s czytania / 1 ekran) |
| Treść | Turniej zamknięty; wyniki i protokół zostają |
| Outcome | Zaufanie; racjonalne potwierdzenie decyzji |

#### Ekran 8 — „Chcesz zobaczyć więcej?” (opcjonalny)

| Element | Wymaganie |
|---------|-----------|
| Dostępność | Tylko po CTA / archiwum; nie na starcie |
| Zakres | Skróty: terminarz, tabela/remis, pełny dzień turnieju |
| Outcome | Power userzy bez psucia głównej historii |

### 5.3 Emocje w czasie (journey arc)

| Faza | Emocja |
|------|--------|
| Wejście | Ciekawość |
| Hook | Napięcie, skala |
| Kibic | Ulga |
| Organizator | Spokój, kontrola |
| Finał | Zaangażowanie |
| Podium | Satysfakcja, WOW |
| CTA | Decyzyjność |
| Archiwum | Pewność |

---

## 6. Wow Moments

Momenty, które muszą być **wyraźne, natychmiastowe i zapamiętywalne**.

| # | Moment | Co użytkownik widzi / czuje | Dlaczego to WOW |
|---|--------|----------------------------|-----------------|
| W1 | **Skala turnieju** | 16 drużyn, 56 meczów, 55 rozegranych | „To ogarnia mój format” |
| W2 | **Widok kibica** | Rodzic na telefonie: terminarz + tabela + play-off | „Koniec z 50 telefonami” |
| W3 | **Jeden mecz do końca** | Status 55/56, finał czeka | Napięcie + prostota domknięcia |
| W4 | **Wpisanie finału** | Jedna akcja organizatora | „Ja to kontroluję — to proste” |
| W5 | **Podium auto** | 1–2–3 + król strzelców + bramkarz | „Nie liczę na kartce o 21:00” |
| W6 | **Identyfikacja** | „Twój turniej może wyglądać tak samo” | Most do własnego eventu |

**Moment peak (obowiązkowy):** W5 — Podium po finałe.

---

## 7. Conversion Moments

### 7.1 Primary conversion moment

**Tuż po ekranie Podium (W5), ekran CTA (Ekran 6).**

Uzasadnienie: szczyt emocji + peak-end rule; użytkownik chce powtórzyć doświadczenie u siebie.

### 7.2 Secondary conversion moments

| Moment | Typ CTA | Uwagi |
|--------|---------|-------|
| Ekran 0 (Wejście) | „Mam klucz — aktywuj” | Dla użytkowników już kupionych; nie konkuruje z demo |
| Ekran 7 (Archiwum) | Powtórzone CTA | Dla wahających się; mniejsza widoczność |
| Ekran 8 (Więcej) | Powrót do CTA | Po eksploracji funkcji |

### 7.3 Wymagania CTA (copy i intencja)

| CTA | Intencja |
|-----|----------|
| **Aktywuj licencję na mój turniej** | Użytkownik ma już klucz lub chce od razu wejść |
| **Zamów klucz na weekend turnieju** | Lead / sprzedaż pakietu weekendowego |
| **Wyślij mi ofertę** | Lead nurturing |

**Przy CTA obowiązkowo (copy deck, nie UI):**
- Potwierdzenie formatu: 16 drużyn obsłużone
- Wzmianka pakietów: 1 dzień / weekend / miesiąc (jedna linia)
- Jeden następny krok: co się stanie po kliknięciu

### 7.4 Anti-patterns konwersji (czego unikać)

- CTA dopiero po archiwum jako jedyny moment
- Menu funkcji na starcie zamiast historii
- Prośba o klucz licencyjny przed pokazaniem wartości
- CTA bez odpowiedzi „ile kosztuje” / „co dalej”

---

## 8. FAQ Objections

Obiekcje, które demo **musi adresować** (w copy, ekranach lub FAQ tuż przy CTA) — nawet jeśli nie są pełnym modułem demo.

| Obiekcja | Odpowiedź produktowa (kierunek) | Gdzie w journey |
|----------|--------------------------------|-----------------|
| **Czy 16 drużyn to obsłużycie?** | Demo pokazuje 16 drużyn, 56 meczów, play-off | Hook, Organizator, CTA |
| **Rodzice muszą coś instalować?** | Link / QR, bez aplikacji, bez konta | Ekran Kibic |
| **Czy dam radę technicznie?** | Jedna akcja: wpis finału | Ekran Finał |
| **Co po turnieju?** | Archiwum, protokół, wyniki zostają | Ekran Archiwum |
| **Ile to kosztuje?** | Pakiety: 1 dzień / weekend / miesiąc | Ekran CTA |
| **Co jeśli internet padnie?** | FAQ / 1 linia przy CTA (do ustalenia z produktem) | CTA / FAQ |
| **Czym różnicie się od Toornament/Challonge?** | Cały dzień turnieju + kibic live + podium PL-football | Kibic + Podium |
| **Czym różnicie się od Excel/WhatsApp?** | Rodzice sami sprawdzają; podium automatycznie | Kibic + Podium |
| **Czy mogę zepsuć turniej jednym kliknięciem?** | Opcjonalnie: wzmianka o cofnięciu / wsparcie (poza głównym flow) | FAQ przy CTA |
| **Czy to działa na telefonie przy boisku?** | Widok kibica na mobile; organizator na tablecie/telefonie | Ekran Kibic |

---

## 9. Scope

### 9.1 In scope (MVP Demo Story)

| Element | Opis |
|---------|------|
| Liniowy flow 7 ekranów | Wejście → Hook → Kibic → Organizator → Finał → Podium → CTA → Archiwum |
| Pre-fill scenariusza | Turniej 16 drużyn, 55/56 meczów, finał do wpisania |
| Jedna interakcja użytkownika | Wpisanie wyniku finału |
| Widok kibica | Terminarz, wyniki, tabela, play-off (prezentacja) |
| Automatyczne podium | Po zapisie finału: miejsca 1–3, król strzelców, bramkarz |
| CTA konwersyjne | Bezpośrednio po podium |
| Archiwum | Krótki epilog dowodowy |
| Opcjonalny „Zobacz więcej” | Po głównej historii; max 2–3 skróty |

### 9.2 Out of scope (Demo Story v1)

| Element | Powód |
|---------|-------|
| Pełna ścieżka: losowanie grup, generowanie terminarza | Nie sprzedaje outcome; dostępne opcjonalnie po CTA |
| Konfiguracja turnieju od zera w demo | Zbyt długie; obniża konwersję |
| Wiele ścieżek demo na starcie | Menu funkcji — odrzucone w audycie |
| Onboarding płatnego klienta | Osobny PRD |
| Panel admina / licencji | Osobny kontekst |
| Implementacja, UI, kod | Osobna faza |

### 9.3 Zależności produktowe (do ustalenia przed wdrożeniem)

- Gotowy scenariusz danych: 16 drużyn, mecze grupowe, play-off, finał
- Copy deck PL dla wszystkich ekranów
- Definicja pakietów licencyjnych przy CTA
- Polityka odpowiedzi na obiekcję Wi‑Fi / offline (copy)

---

## 10. Acceptance Criteria

### 10.1 Kryteria akceptacji — journey

| ID | Kryterium | Pass/Fail |
|----|-----------|-----------|
| AC-J1 | Użytkownik może przejść całe demo **bez klucza licencyjnego** | ☐ |
| AC-J2 | Główny flow to **jedna ścieżka** bez wyboru modułów na starcie | ☐ |
| AC-J3 | W hooku widoczna informacja o **16 drużinach** i **56 meczach** | ☐ |
| AC-J4 | Ekran kibica pokazuje **terminarz, wyniki, tabelę, play-off** | ☐ |
| AC-J5 | Panel organizatora pokazuje **55/56 meczów** i finał do wpisania | ☐ |
| AC-J6 | Użytkownik wykonuje **dokładnie jedną** interakcję: wynik finału | ☐ |
| AC-J7 | Po zapisie finału **automatycznie** pojawia się podium + statystyki | ☐ |
| AC-J8 | CTA pojawia się **bezpośrednio po podium**, przed długim archiwum | ☐ |
| AC-J9 | Archiwum to **krótki epilog** (dowód), nie osobny akt demo | ☐ |
| AC-J10 | „Zobacz więcej” dostępne **tylko po** CTA / archiwum | ☐ |

### 10.2 Kryteria akceptacji — messaging

| ID | Kryterium | Pass/Fail |
|----|-----------|-----------|
| AC-M1 | Żaden ekran głównego flow nie sprzedaje „generatora grup” jako głównej obietnicy | ☐ |
| AC-M2 | Główny komunikat CTA: **„Twój turniej może wyglądać tak samo.”** | ☐ |
| AC-M3 | Demo komunikuje outcome: **spokój organizatora**, mniej telefonów, brak ręcznego liczenia podium | ☐ |
| AC-M4 | Format 16 drużyn jest **wiarygodnie** obecny minimum 2× w flow | ☐ |

### 10.3 Kryteria akceptacji — konwersja

| ID | Kryterium | Pass/Fail |
|----|-----------|-----------|
| AC-C1 | Po podium użytkownik ma ≥1 akcję konwersyjną (aktywuj / zamów / kontakt) | ☐ |
| AC-C2 | Przy CTA widoczna informacja o **następnym kroku** po kliknięciu | ☐ |
| AC-C3 | Przy CTA lub FAQ: **pakiety licencyjne** (min. wzmianka) | ☐ |
| AC-C4 | Opcja „Mam klucz” dostępna bez psucia głównej historii | ☐ |

### 10.4 Kryteria akceptacji — jakość doświadczenia

| ID | Kryterium | Pass/Fail |
|----|-----------|-----------|
| AC-Q1 | Median time to podium ≤ **120 s** | ☐ |
| AC-Q2 | Completion rate (start → podium) ≥ **70%** | ☐ |
| AC-Q3 | W teście z 5 organizatorami 16 drużyn: ≥4/5 po 60 s rozumie obietnicę „spokój w dniu turnieju” | ☐ |
| AC-Q4 | W teście z 5 organizatorami: ≥3/5 deklaruje „chcę taki turniej u siebie” po pełnym demo | ☐ |

### 10.5 Definition of Done (produkt)

Demo Story uznaje się za **Done**, gdy:

1. Wszystkie kryteria AC-J*, AC-M*, AC-C* są spełnione  
2. Przeprowadzono test z minimum **5 organizatorami** docelowej persony  
3. Metryki baseline (completion, time to CTA) są zmierzone  
4. Copy deck i FAQ objections są zatwierdzone przez właściciela produktu  

---

## 11. Załączniki referencyjne

### 11.1 Flow (skrót)

```
Hook (16 drużyn, 56 meczów, finał)
  → Kibic (rodzice sami sprawdzają)
  → Organizator (55/56, finał czeka)
  → Wpis finału (1 akcja)
  → Podium + statystyki (AUTO) ← PEAK
  → CTA ← KONWERSJA
  → Archiwum (dowód, krótko)
  → [Opcjonalnie: Zobacz więcej]
```

### 11.2 Zdanie produktu (north star)

> TurniejPro SaaS sprzedaje spokój organizatora w dniu turnieju — demo musi sprawić, że organizator 16 drużyn przeżyje finał bez stresu i zechce go powtórzyć u siebie.

---

## 12. Historia dokumentu

| Wersja | Data | Autor | Zmiany |
|--------|------|-------|--------|
| 1.0 | 2026-07-11 | Product | Pierwsza wersja PRD na podstawie zaakceptowanego Storyboardu Demo Story |

---

*Koniec dokumentu PRD_DEMO_STORY.md*
