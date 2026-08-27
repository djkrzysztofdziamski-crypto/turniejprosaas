# TOP 10 fixów UX — plan 2 tygodnie (tylko produkt)

**Cel:** domknąć lukę „marketing obiecuje spokój → panel daje kontrolę”.  
**Zakres:** decyzje, copy, procedury, checklisty — **bez kodu** w tych 2 tygodniach (wdrożenie UI później).  
**Metryka sukcesu (dzień 10):** osoba spoza teamu, nowy klucz, ≤**30** min, bez pomocy: turniej (np. 8 drużyn) → terminarz → QR kibica → 1 wynik.  
*(Pierwotnie ≤15 min; T10.6 **B** — metryka zmieniona po teście 2026-08-26.)*

**Status ogólny:** ✅ TOP 10 produkt (wywiad) zamknięty 2026-08-26 · **Metoda:** wywiad — decyzje w docs · wyjątki kodu = backlog poniżej  
**Proces (Blok 0 — ustalone):** decydujesz Ty · done = zapis w docs · wyjątki kodu wolno gdy poprosisz · zakres = wszystko konieczne · metryka dnia 10 zostaje  

---

## Jak pracować

1. Idź **kolejno** (#1 → #5 → #6 → …); bez domyślania.
2. Każdy punkt: **wywiad → Twoje odpowiedzi → zapis → potwierdzenie „ZAMKNIĘTE”**.
3. Draft AI ≠ decyzja. Decyzja = Twoje słowa w docs.
4. Dzień 10 = test z osobą zewnętrzną.

---

## Backlog TOP 10 (mapa)

| # | Fix | Priorytet | Dni | Status |
|---|-----|-----------|-----|--------|
| 1 | Home dnia = Na żywo | P0 | 1–2 | ✅ ZAMKNIĘTE (wywiad) |
| 2 | Wizard pierwszego turnieju (ścieżka kanoniczna) | P0 | 7–8 | ✅ ZAMKNIĘTE (wywiad) |
| 3 | Słownik dnia turnieju | P1 | 3–4 | ✅ ZAMKNIĘTE (wywiad) |
| 4 | Polityka RESET / ZAMROŹ / PRZYWRÓĆ | P0 | 5–6 | ✅ ZAMKNIĘTE (wywiad) |
| 5 | Legenda statusów (jedna wszędzie) | P0 | 1–2 | ✅ ZAMKNIĘTE (wywiad) |
| 6 | Kontrakt roli asystenta (copy) | P1 | 1–2 | ✅ ZAMKNIĘTE (wywiad) |
| 7 | Procedura kapitana + template wiadomości | P1 | 9 | ✅ ZAMKNIĘTE (wywiad) |
| 8 | Onboarding po kluczu ≠ Demo | P0 | 7–8 | ✅ ZAMKNIĘTE (wywiad) |
| 9 | Empty states — teksty + CTA | P1 | 3–4 | ✅ ZAMKNIĘTE (wywiad) |
| 10 | Tryb przygotowań vs tryb dnia (procedura) | P1 | 5–6 | ✅ ZAMKNIĘTE (wywiad) |

---

## Tydzień 1

### Dzień 1–2 — #1 Home Na żywo · #5 Legenda · #6 Asystent — ✅ ZAMKNIĘTE (2026-08-24)

**Źródło:** wywiad (odpowiedzi użytkownika). Draft AI nie obowiązuje.

#### #1 Home dnia turnieju = „Na żywo” — ✅

| Pytanie | Decyzja |
|---------|---------|
| Kiedy „domem dnia” jest Na żywo? | **A:** gdy istnieje **≥1 mecz w terminarzu** |
| Kiedy Start/Tor są OK jako miejsce pracy? | **B:** gdy użytkownik **sam** otworzy Start/Tor (nie zmuszamy) |
| Auto-przełączenie zakładki? | **Nie** — tylko **procedura + copy** |
| Po F5 / odświeżeniu | **Zostaje** na bieżącej zakładce |
| Role | Sędzia **TAK** · Asystent **TAK** · Kibic **NIE** · Hala **NIE** · Kapitan **NIE** |

**Mikrocopy:**  
`Gdy masz terminarz: wyniki wpisuj w „Na żywo” (sędzia i asystent). Start i Tor otwieraj tylko gdy zmieniasz grafik lub składy.`

**Checklista (procedura):**
1. Otwórz **Na żywo** (asystent: ekran meczów).
2. Filtr **Oczekujące** (opcjonalnie).
3. Wpisz wynik → zatwierdź.

**Kod #1:** brak (świadomie — tylko procedura+copy).

---

#### #5 Legenda statusów — ✅

| Element | Znaczenie |
|---------|-----------|
| Kropka szara | mecz nierozgrany (jak w kodzie) |
| Kropka zielona | mecz zakończony (jak w kodzie) |
| Badge boiska szary (cyfra) | boisko **planowane** (jak w kodzie) |
| Badge boiska zielony (cyfra) | boisko z meczu **zakończonego** (jak w kodzie) |
| „—” w Boisko | **bez przydziału / wolne** |
| WO w terminarzu | czerwone **WO** tylko przy nazwie drużyny z `walkoverTeamId` |
| WO w tabelach | bez zmian: „WO nieobecność” / „WO dyscyplinarny” |

**Gdzie legenda widoczna (W5.6):**
- **B)** sędzia — nad harmonogramem
- **C)** asystent — w **banerze** (nie osobno nad tabelą — doprecyzowane w #6)
- Kibic / hala / wydruk A6 — **nie**

**Tekst legendy (kanoniczny, do UI sędziego nad harmonogramem):**  
`Status: kropka szara = mecz nierozgrany · kropka zielona = zakończony. Boisko: szara cyfra = planowane · zielona cyfra = zakończony · — = bez przydziału / wolne.`

**Kod #5 (wyjątek — dopiero gdy poprosisz):** legenda nad harmonogramem sędziego; czerwone WO przy nazwie w terminarzu (`walkoverTeamId`).

---

#### #6 Kontrakt asystenta — ✅

| Pytanie | Decyzja |
|---------|---------|
| Legenda u asystenta | **w banerze** |
| Zdanie o boiskach | **TAK** — sędzia ustawia, asystent nie zmienia |
| Baner | **obecny tekst + dopiski** |
| Kartka A6 / wydruk | **NIE** |
| Pełny string banera | **TAK** (W6.5) |

**Baner kanoniczny (1:1):**  
`Tryb asystenta — wpisuj wynik przez Strzelcy/Kartki (+ GOL / kartki) albo bezpośrednio w polu wyniku. Brak dostępu do ustawień turnieju. Boiska ustawia sędzia — asystent ich nie zmienia. Status: kropka szara = mecz nierozgrany · kropka zielona = zakończony. Boisko: szara cyfra = planowane · zielona cyfra = zakończony · — = bez przydziału / wolne.`

**Kod #6 (wyjątek — dopiero gdy poprosisz):** podmiana `#assistant-banner` na string powyżej.

---

**Status dni 1–2:** ✅ #1 · #5 · #6 zamknięte (wywiad 2026-08-24)

**Backlog kodu z dnia 1–2 (nie startować bez prośby):**
1. Legenda nad harmonogramem (sędzia)
2. Baner asystenta (string powyżej)
3. Czerwone WO przy nazwie w terminarzu (`walkoverTeamId`)

---

### Dzień 3–4 — #3 Słownik · #9 Empty states — ✅ ZAMKNIĘTE (2026-08-26)

**Źródło:** wywiad (odpowiedzi użytkownika). Draft AI zaakceptowany 1:1.

#### #3 Słownik — ✅

| Decyzja | Wartość |
|---------|---------|
| Lista haseł | 12 pozycji **1:1** (bez zmian) |
| Tryb | B — draft → OK na wszystkie |
| Nazwa sekcji | **Pomoc** (nie „Pomoc dnia”) |
| Miejsce w app | **Archiwum** |

| Hasło | Znaczenie (1 zdanie) | Kiedy używać |
|-------|----------------------|--------------|
| Tor / Losowanie | Pasek kroków przygotowania: 1 · Grupy → 2 · Terminarz → 3 · Play-off. | Zanim zaczniesz wpisywać wyniki dnia; gdy budujesz lub przebudowujesz grafik. |
| Start | Zakładka konfiguracji turnieju (nazwa, skala, boiska, parametry drużyn/meczów, utwórz drużyny). | Przygotowania; gdy zmieniasz ustawienia, nie gdy wpisujesz wyniki. |
| Na żywo | Główne miejsce wpisywania wyników i przeglądu harmonogramu w trakcie turnieju. | Gdy jest terminarz (≥1 mecz) — tu pracujesz dzień turnieju (sędzia/asystent). |
| Seed / rozstawienie | Oznaczenie silniejszych drużyn i kolejności siły przed losowaniem grup. | Tylko gdy w Start włączysz rozstawianie; przed Tor → 1 · Grupy. |
| Walkover (WO) | Wynik walkowerem (np. 3:0) bez rozegrania meczu; w terminarzu WO przy drużynie z `walkoverTeamId`; w tabelach: „WO nieobecność” / „WO dyscyplinarny”. | Nieobecność, dyskwalifikacja, brak drużyny na meczu — przez narzędzie Walkover, nie „ręczny 3:0” bez WO. |
| Remis absolutny | Remis w tabeli grupowej po wszystkich kryteriach (bezpośrednie, bilans, bramki, Fair Play) — sędzia rozstrzyga losowaniem lub serią karnych. | Gdy system pokazuje nierozstrzygnięty remis o awans/kolejność w grupie. |
| Zamroź | Zapisuje punkt przywracania (snapshot) stanu turnieju. | Przed ryzykowną zmianą lub jako bezpieczny punkt w trakcie dnia. |
| Przywróć ostatni stan | Wraca do ostatnio zamrożonego snapshota (wyniki i ustawienia z tego momentu). | Tylko po Zamroź; gdy chcesz cofnąć późniejsze zmiany do tego punktu. |
| RESET | Kasuje dane turnieju (operacja destrukcyjna). | Nie w dniu turnieju na żywej licencji „żeby poprawić jedną rzecz”; polityka szczegółowa = dzień 5–6. |
| Write-lock / turniej zamknięty | Stan, w którym zapis/edycja wyniku i ustawień jest zablokowana (turniej zamknięty / zarchiwizowany). | Po zakończeniu i zamknięciu turnieju; wtedy tylko podgląd, bez edycji. |
| Asystent | Osobny widok (link/QR) do wpisywania wyniku przy boisku — bez ustawień turnieju i bez zmiany boisk. | Gdy ktoś wpisuje wynik na telefonie/tablecie przy boisku, a sędzia trzyma konfigurację. |
| Hala | Widok prezentacyjny na TV/projektor (wyniki live, nie panel edycji sędziego). | Ekran hali / orlika dla publiczności — nie do wpisywania wyników. |

**Treść sekcji „Pomoc” w Archiwum (kanoniczna, do UI gdy poprosisz o wyjątek kodu):**
```
POMOC — Turniejomat (sędzia / asystent)

Gdy masz terminarz: wyniki → „Na żywo”.
Start i Tor → tylko gdy zmieniasz grafik lub składy.

[tabela słownika 12 haseł — jak wyżej]

Legenda (dzień 1–2):
Status: kropka szara = mecz nierozgrany · kropka zielona = zakończony
Boisko: szara cyfra = planowane · zielona cyfra = zakończony · — = bez przydziału / wolne
```

**Kod #3 (wyjątek — gdy poprosisz):** sekcja **Pomoc** w zakładce Archiwum.

---

#### #9 Empty states — ✅

| Decyzja | Wartość |
|---------|---------|
| Lista 10 miejsc | **1:1** |
| Tryb | B — draft → OK na wszystkie |
| Katalog tekstów | w **Archiwum** (razem z Pomoc) |
| Komunikaty runtime | w **danym widoku**, gdy jest pusto |

| Miejsce | Nagłówek | Zdanie | CTA |
|---------|---------|--------|-----|
| Składy — brak drużyn | Brak drużyn | Najpierw utwórz skład turnieju w konfiguracji. | → Start → Utwórz drużyny |
| Grupy — brak losowania | Brak grup | Rozlosuj drużyny, żeby zobaczyć grupy. | → Tor → 1 · Grupy |
| Na żywo — brak meczów | Brak meczów | Harmonogram jeszcze nie istnieje. | → Tor → 2 · Terminarz |
| Play-Off — pusto | Brak drabinki | Play-off generujesz po domknięciu fazy grupowej. | → Tor → 3 · Play-off |
| Podium — pusto | Brak podium | Podium pojawi się po zakończeniu finału. | Dokończ finał w Na żywo / Play-Off |
| Archiwum — pusto | Brak archiwum | Tu trafią zakończone turnieje po zamknięciu. | Zakończ i zarchiwizuj po turnieju |
| Kapitan — link niepełny | Link niepełny | Ten adres nie zawiera pełnego zaproszenia. | Poproś organizatora o pełny link |
| Asystent — brak tokenu | Brak dostępu | Link asystenta jest niekompletny lub wygasł. | Poproś sędziego o nowy link / QR |
| Boiska — wyłączone | Boiska wyłączone | Numeracja boisk działa od 2 boisk w górę. | Ustaw liczbę boisk ≥2 w Start |
| Kibic — turniej pusty | Brak wyników | Turniej jeszcze nie ma meczów do pokazania. | Wyniki pojawią się po pierwszym meczu |

**Kod #9 (wyjątek — gdy poprosisz):** podmiana empty states w widokach + katalog w Archiwum/Pomoc.

---

**Status dni 3–4:** ✅ #3 · #9 zamknięte (wywiad 2026-08-26)

---

### Dzień 5–6 — #4 Zagrożenia · #10 Tryby dnia — ✅ ZAMKNIĘTE (2026-08-26)

**Źródło:** wywiad. Znaczenia Zamroź / Przywróć = **jak w kodzie dziś** (nie mylić ze „snapshotem dnia”).

#### #4 Polityka RESET / ZAMROŹ / PRZYWRÓĆ — ✅

| Element | Decyzja produktowa |
|---------|-------------------|
| **ZAMROŹ** | Jak w kodzie: kopia → **Wstrzymane sesje** → aktywny turniej pusty |
| **PRZYWRÓĆ OSTATNI STAN** | Jak w kodzie: lokalny `lastSnapshot` w sesji przeglądarki — **nie** Wstrzymane / Archiwum |
| **RESET — kiedy wolno** | **Tylko A:** zero meczów **rozegranych** (`played`) |
| **RESET — potwierdzenie** | **B:** 2 kroki + wpis nazwy turnieju (docelowo w kodzie) |
| Miejsce procedury | **Pomoc / Archiwum** |

**Copy kanoniczny (R4.1 OK):**

**ZAMROŹ**  
`Zapisuje kopię turnieju w Wstrzymanych sesjach i czyści aktywny turniej. Przywrócisz go z listy Wstrzymanych (nie przyciskiem „Przywróć ostatni stan”).`

**PRZYWRÓĆ OSTATNI STAN**  
`Cofa ostatnią zmianę w tej sesji przeglądarki (lokalny punkt przywracania). To nie jest przywrócenie z Wstrzymanych ani z Archiwum.`

**RESET — kiedy wolno**  
`Wolno tylko, gdy żaden mecz nie został jeszcze rozegrany (brak wyników zakończonych).`

**RESET — ostrzeżenie**  
`RESET kasuje aktywny turniej (drużyny, grupy, mecze, ustawienia). Archiwum i Wstrzymane zostają. Tego nie cofniesz przyciskiem Cofnij.`

**Procedura (do Pomoc / Archiwum):**
1. Chcesz przerwać i wrócić później → **Zamroź** → potem Wstrzymane.
2. Chcesz cofnąć ostatnią operację w tej sesji → **Przywróć ostatni stan**.
3. Chcesz zacząć od zera i **nie ma żadnego rozegranego meczu** → **RESET** (2 potwierdzenia + nazwa).
4. Jest choć jeden wynik → **RESET zabroniony** (produktowo); popraw wynik albo Zamroź.

**Kod #4 (wyjątek — gdy poprosisz):** egzekwowanie RESET tylko przy 0 `played`; 2-step confirm + nazwa turnieju; copy przycisków/Pomoc.

---

#### #10 Tryb przygotowań vs tryb dnia — ✅

| Decyzja | Wartość |
|---------|---------|
| Przygotowania | Start · Składy · Tor (1–2–3) · Grupy · (opcjonalnie kapitanowie) |
| Dzień turnieju | Na żywo · Boiska · Play-Off · Podium · Share/QR/Hala · Asystent |
| Trigger „dzień turnieju” | **A:** od momentu **≥1 meczu w terminarzu** (spójne z #1; bez auto-zakładki) |
| Checklista | Nazwa: **CHECKLISTA START** · 5 punktów 1:1 |

**CHECKLISTA START:**
1. Terminarz OK
2. QR kibica wydrukowany / wysłany
3. Link asystenta na telefonach przy boiskach
4. Otwórz Na żywo (nie Start)
5. Wiesz gdzie Zamroź (nie Reset)

**Kod #10:** brak wymogu auto-UI (procedura + Pomoc); checklista w Archiwum/Pomoc gdy poprosisz o wyjątek.

---

**Status dni 5–6:** ✅ #4 · #10 zamknięte (wywiad 2026-08-26)

---

## Tydzień 2

### Dzień 7–8 — #2 Ścieżka pierwszego turnieju · #8 Po kluczu ≠ Demo — ✅ ZAMKNIĘTE (2026-08-26)

**Źródło:** wywiad. Drafty zaakceptowane (W2.1, M8.1).

#### #2 Kanoniczna ścieżka — ✅

| Decyzja | Wartość |
|---------|---------|
| Happy path | **1:1** (5 kroków) |
| Zaawansowane | seed, tryby play-off, kartki, format 6/7, remisy absolutne, kapitan/zdjęcia — **poza** happy path |
| Dostawa | docs + **skrypt nagrania 3 min** |
| Miejsce w app | **Archiwum / Pomoc** |

**„Zrób to w tej kolejności” (kanoniczne):**
```
PIERWSZY TURNIEJ — Zrób to w tej kolejności

1. Start: nazwa turnieju + liczba drużyn
2. Start: liczba grup (+ awanse, jeśli potrzeba)
3. Start: boiska — 0 (wyłączone) albo 2+
4. Start / Tor: godzina startu i czasy meczów
5. Start → Utwórz drużyny → Składy (nazwy) → Tor → 1 · Grupy → Tor → 2 · Terminarz

Potem: Na żywo (wyniki). CHECKLISTA START — w Pomoc.

Na start NIE ruszaj (zaawansowane):
seed/rozstawienie, szczegółowe tryby play-off, kartki, format 6/7,
remis absolutny, kapitan/zdjęcia, WO.
```

**Skrypt nagrania 3 min:**
1. (0:00) Ekran Start — nazwa + drużyny
2. (0:30) Grupy, awanse, boiska, czasy
3. (1:00) Utwórz drużyny → krótkie nazwy w Składach
4. (1:40) Tor 1 Losuj → Tor 2 Generuj terminarz
5. (2:20) Na żywo — wskaż gdzie wynik
6. (2:40) „Reszta później; Pomoc w Archiwum”

**Kod #2 (wyjątek — gdy poprosisz):** treść w Archiwum/Pomoc; nagranie poza kodem.

---

#### #8 Onboarding po zakupie — ✅

| Decyzja | Wartość |
|---------|---------|
| Demo vs klucz | Demo = sprzedaż emocji; po kluczu = **„Pierwsze 15 minut”** |
| Scenariusz | 6 kroków **1:1** |
| Liczba drużyn w copy | **„np. 8”** (nie sztywno 8) |
| Dostawa | **A:** treść maila + ta sama checklista w **Pomoc / Archiwum** |

**Mail kanoniczny:**

Temat: `Turniejomat — Pierwsze 15 minut z kluczem`

```
Cześć,

Masz klucz licencyjny Turniejomat. Demo pokazuje finał i emocje —
teraz ustawiasz swój turniej. Cel: ok. 15 minut do pierwszego wyniku.

1. Wejdź na https://app.turniejomat.pl i wklej klucz.
2. Na Start ustaw turniej (np. 8 drużyn) — kolejność: „Zrób to w tej kolejności” w Archiwum → Pomoc.
3. Utwórz drużyny → Tor → 1 · Grupy → Tor → 2 · Terminarz.
4. Udostępnij QR / link kibica.
5. W Na żywo wpisz 1 testowy wynik (potem możesz poprawić).
6. Opcja: link asystenta na telefon przy boisku.

Nie zaczynaj od seed, kartek ani kapitana — to zaawansowane.
RESET tylko gdy nie ma żadnego rozegranego meczu.
CHECKLISTA START i Pomoc: w aplikacji → Archiwum.

Powodzenia,
Turniejomat
```

**Checklista w Pomoc** = punkty 1–6 z maila (tytuł: Pierwsze 15 minut).

**Kod #8 (wyjątek — gdy poprosisz):** sekcja w Archiwum/Pomoc; wysyłka maila = proces billing/ops (poza samym UI, jeśli mail już idzie z CF).

---

**Status dni 7–8:** ✅ #2 · #8 zamknięte (wywiad 2026-08-26)

---

### Dzień 9 — #7 Kapitan — ✅ ZAMKNIĘTE (2026-08-26)

**Źródło:** wywiad.

| Decyzja | Wartość |
|---------|---------|
| Procedura | kroki **1–5** (punkt hard refresh **wyrzucony**) |
| Template WhatsApp | **1:1** z planu |
| Zdjęcie | **opcjonalne** |
| Nota „nie obiecywać zdjęć na landingu” | **usunięta** |
| Miejsce | **Archiwum / Pomoc** |

**Procedura kapitana (kanoniczna):**
1. W Start: włącz „Podaj dane zawodników” (+ kapitan/gk jeśli potrzeba).
2. Składy: drużyny istnieją.
3. „Link kapitana” → wyślij WhatsApp/mail.
4. Kapitan: skład + (opcjonalnie) zdjęcie; czeka na „Zdjęcie zapisane”.
5. Sędzia: Przejrzyj → Akceptuj / Odrzuć.

**Template WhatsApp (kanoniczny):**
```
Cześć! Tu link do zgłoszenia składu na turniej [NAZWA]:
[LINK]
Uzupełnij zawodników, bramkarza i kapitana. Zdjęcie opcjonalne (JPG/PNG).
Po wysłaniu czekamy na akceptację sędziego. Dzięki!
```

**Kod #7 (wyjątek — gdy poprosisz):** treść procedury + template w Archiwum/Pomoc.

---

**Status dzień 9:** ✅ #7 zamknięte (wywiad 2026-08-26)

---

### Dzień 10 — Test metryki sukcesu — ✅ ZAMKNIĘTY (2026-08-26)

**Tester:** osoba spoza projektu.  
**Bez podpowiedzi na żywo** — handout `docs/UX_DAY10_TESTER_HANDOUT.md`.  
**Aplikacja:** stan bieżący (bez wdrożonych wyjątków UI z backlogu kodu).

**Metryka (po T10.6 B):** ≤ **30** min: klucz → drużyny → terminarz → QR → 1 wynik.  
**Metryka pierwotna (dla kontekstu):** ≤15 min — ten przebieg by **nie** zaliczył limitu czasu.

**Scenariusz:**
- [x] Klucz testowy / nowy
- [x] Ścieżka ukończona (drużyny → terminarz → QR → 1 wynik)
- [x] Notatka z przebiegu

**Wynik surowego przebiegu (obserwacja):**  
`~25 min | nie utknął | blockery: brak | ścieżka ukończona`  
Względem limitu **15 min** → byłby **FAIL (czas)**.

**Werdykt oficjalny (metryka ≤30 min, T10.6 B):** **PASS**

| Pole | Wartość |
|------|---------|
| PASS/FAIL | **PASS** |
| Czas | ~25 min |
| Utknął | nie |
| Blockery | brak |
| Ścieżka | ukończona |

**Arkusz:** `docs/UX_DAY10_TEST_RESULTS.xlsx` (uzupełnij wiersz ręcznie tymi danymi).

**Status dzień 10:** ✅ PASS (metryka ≤30 min) · Notatka: przebieg ~25 min, bez blockerów; limit 15→30 po T10.6 B

---

## Świadomie POZA tymi 2 tygodniami

- Przepisanie nawigacji / hamburger
- Edycja boisk u asystenta
- Nowy design system
- Pełny audyt a11y
- Drugie demo „hard path” jako app

→ backlog „Tydzień 3–6”.

---

## Dziennik (krótki)

| Dzień | Data | Status | 1 zdanie |
|-------|------|--------|----------|
| 1–2 | 2026-08-24 | ✅ | #1 #5 #6 zamknięte (wywiad). Następne: dzień 3–4. |
| 3–4 | 2026-08-26 | ✅ | #3 #9 zamknięte (wywiad). Następne: dzień 5–6. |
| 5–6 | 2026-08-26 | ✅ | #4 #10 zamknięte (wywiad). Następne: dzień 7–8. |
| 7–8 | 2026-08-26 | ✅ | #2 #8 zamknięte (wywiad). Następne: dzień 9. |
| 9 | 2026-08-26 | ✅ | #7 Kapitan zamknięte. Następne: dzień 10 (test). |
| 10 | 2026-08-26 | ✅ | PASS (~25 min). Metryka T10.6 B: ≤30 min. TOP 10 produkt zamknięty. |

---

## Następny krok po PASS dnia 10

Oddzielny sprint **wdrożenia w kodzie** (gdy poprosisz o wyjątki):
- z dnia 1–2: legenda sędziego, baner asystenta, WO w terminarzu
- z dnia 3–4: sekcja **Pomoc** w Archiwum, empty states w widokach + katalog
- z dnia 5–6: egzekwowanie RESET (0 `played`), 2-step + nazwa; copy Zamroź/Przywróć/RESET; **CHECKLISTA START** + tryby w Pomoc
- z dnia 7–8: „Zrób to w tej kolejności” + „Pierwsze 15 minut” w Pomoc; mail po zakupie (ops/billing)
- z dnia 9: procedura kapitana + template WhatsApp w Pomoc
- po dniu 10: wg pozostałych tekstów z tego dokumentu.
