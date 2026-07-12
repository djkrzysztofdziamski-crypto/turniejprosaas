# Wireframe: Demo Story — TurniejPro SaaS

**Wersja:** 1.0  
**Status:** Do akceptacji  
**Data:** 2026-07-11  
**Powiązane dokumenty:** `PRD_DEMO_STORY.md`, `COPY_DECK_DEMO_STORY.md`  
**Format:** Low-fidelity ASCII wireframe — bez kodu, bez grafiki, bez CSS

---

## 0. Założenia globalne UX

### 0.1 Flow (liniowy)

```
[0] → [1] → [2] → [3] → [4] → [5] → [6] → [7] → [8 opcjonalnie]
```

- Brak menu funkcji na starcie  
- Jeden primary CTA na ekran  
- Progress indicator (krok X z 6–7) od ekranu 1  
- Brak wymagania klucza licencyjnego do przejścia demo  

### 0.2 Wspólne elementy chrome (wszystkie ekrany demo)

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] TurniejPro SaaS          DEMO STORY    Krok 2 z 6   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [ TREŚĆ EKRANU ]                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [ PRIMARY CTA — pełna szerokość mobile ]       │
│              [ Secondary link — opcjonalnie ]               │
└─────────────────────────────────────────────────────────────┘
```

| Element chrome | Obowiązkowy | Uwagi |
|----------------|-------------|-------|
| Logo + nazwa produktu | Tak | Bez nawigacji aplikacji |
| Badge „DEMO STORY” | Tak | Odróżnia od produkcji |
| Progress (krok X z N) | Od ekranu 1 | Ukryty na ekranie 0 |
| Stopka z linkiem „Mam klucz” | Tylko ekran 0, 6 | Nie konkuruje z primary CTA |

---

## Ekran 0 — Wejście

### 1. Cel ekranu
Uruchomić demo bez tarcia. Ustawić oczekiwanie: **2-minutowa historia finału**, nie szkolenie.

### 2. Hierarchia treści
1. Marka (TurniejPro SaaS)  
2. H1 — obietnica (finał bez chaosu)  
3. Podnagłówek — czas + identyfikacja  
4. Primary CTA  
5. Secondary CTA (klucz)  
6. Microcopy zaufania  

### 3. Najważniejszy element wizualny
**Primary CTA „Zobacz finał turnieju”** — jedyny dominujący punkt akcji.

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary | Zobacz finał turnieju |
| Secondary | Mam klucz — aktywuj licencję |

### 5. Elementy obowiązkowe
- Logo / eyebrow TurniejPro SaaS  
- H1: „Zobacz finał turnieju — bez chaosu na hali”  
- Podnagłówek: „2 minuty. Jedna historia…”  
- Primary CTA  
- Microcopy: „Bez rejestracji · Demo nie wymaga klucza”  

### 6. Elementy opcjonalne
- Krótki body (1 zdanie o braku konfiguracji)  
- Ilustracyjna ikona hali / puchar (dekoracja, nie interaktywna)  

### 7. Mobile

```
┌─────────────────────────┐
│      [Logo TurniejPro]  │
│                         │
│   Zobacz finał turnieju │
│   — bez chaosu na hali  │
│                         │
│   2 minuty. Jedna       │
│   historia. Twój turniej │
│   może wyglądać tak samo.│
│                         │
│ ┌─────────────────────┐ │
│ │ Zobacz finał turnieju│ │
│ └─────────────────────┘ │
│                         │
│ Mam klucz — aktywuj     │
│ licencję                │
│                         │
│ Bez rejestracji · Demo  │
│ nie wymaga klucza       │
└─────────────────────────┘
```

- CTA sticky na dole ekranu (thumb zone)  
- H1 max 3 linie  
- Secondary jako text link pod primary  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  TurniejPro SaaS                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              Zobacz finał turnieju — bez chaosu na hali      │
│         2 minuty. Jedna historia. Twój turniej może          │
│                    wyglądać tak samo.                        │
│                                                              │
│              ┌──────────────────────────────┐                │
│              │   Zobacz finał turnieju      │                │
│              └──────────────────────────────┘                │
│                 Mam klucz — aktywuj licencję                 │
│           Bez rejestracji · Demo nie wymaga klucza           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Treść wyśrodkowana, max-width ~560px  
- Primary CTA stała szerokość (~320px), nie full-bleed  

---

## Ekran 1 — Hook

### 1. Cel ekranu
Natychmiast pokazać **skalę (16 drużyn, 56 meczów)** i **napięcie finału**.

### 2. Hierarchia treści
1. H1 (skala + finał)  
2. Trzy liczniki (16 / 56 / 55)  
3. Podnagłówek emocjonalny  
4. Meta turnieju (nazwa, hala)  
5. Primary CTA  

### 3. Najważniejszy element wizualny
**Trzy liczniki** w jednym rzędzie — natychmiastowa czytelność skali.

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary | Zobacz, co widzą rodzice |

### 5. Elementy obowiązkowe
- H1: „Turniej 16 drużyn. 56 meczów. Finał za chwilę.”  
- Liczniki: 16 drużyn · 56 meczów · 55 rozegranych  
- Podnagłówek: „Został jeden mecz…”  
- Meta: Memoriał Wiosenny 2026 · Hala OSiR  
- Progress: Krok 1 z 6  

### 6. Elementy opcjonalne
- Subtelny pasek postępu 55/56 (wizualizacja)  
- Animacja wejścia liczników (spec UX, nie wireframe)  

### 7. Mobile

```
┌─────────────────────────┐
│ DEMO STORY    Krok 1/6  │
├─────────────────────────┤
│                         │
│ Turniej 16 drużyn.      │
│ 56 meczów.              │
│ Finał za chwilę.        │
│                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │  16 │ │  56 │ │  55 │ │
│ │druż.│ │mecz.│ │rozgr│ │
│ └─────┘ └─────┘ └─────┘ │
│                         │
│ Został jeden mecz.      │
│ Cała hala czeka na wynik.│
│                         │
│ Memoriał Wiosenny 2026  │
│ · Hala OSiR             │
│                         │
│ ┌─────────────────────┐ │
│ │Zobacz, co widzą     │ │
│ │rodzice              │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

- Liczniki w 3 kolumnach równych  
- H1 największy typ na ekranie  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ DEMO STORY                                         Krok 1/6  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│        Turniej 16 drużyn. 56 meczów. Finał za chwilę.        │
│                                                              │
│     ┌──────────┐   ┌──────────┐   ┌──────────┐              │
│     │    16    │   │    56    │   │    55    │              │
│     │  drużyn  │   │  meczów  │   │ rozegr.  │              │
│     └──────────┘   └──────────┘   └──────────┘              │
│                                                              │
│           Został jeden mecz. Cała hala czeka na wynik.       │
│              Memoriał Wiosenny 2026 · Hala OSiR              │
│                                                              │
│              ┌──────────────────────────────┐                │
│              │  Zobacz, co widzą rodzice    │                │
│              └──────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

- Liczniki powiększone, więcej oddechu między blokami  
- Opcjonalnie pasek 55/56 pod licznikami (pełna szerokość contentu)  

---

## Ekran 2 — Widok Kibica

### 1. Cel ekranu
Sprzedać **ulgę**: rodzice sami sprawdzają wyniki — organizator nie jest infolinią.

### 2. Hierarchia treści
1. Etykieta kontekstu („Widok kibica”)  
2. H1 — obietnica ulgi  
3. **Symulacja telefonu** z widokiem live  
4. Zakładki / sekcje w telefonie (Terminarz, Wyniki, Tabela, Play-off)  
5. Callout QR / link  
6. Primary CTA powrotu do organizatora  

### 3. Najważniejszy element wizualny
**Ramka telefonu** z aktywną zawartością live (terminarz lub tabela).

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary | Wróć do stołu organizatora |
| Alternatywny | Zobacz, co robię ja jako organizator |

*(Oba prowadzą do ekranu 3 — copy alternatywne dla jasności intencji)*

### 5. Elementy obowiązkowe
- Etykieta: „Widok kibica — to widzą rodzice na telefonie”  
- H1: „Rodzice sami sprawdzają wyniki”  
- Podnagłówek z listą: terminarz, wyniki, tabela, play-off  
- Mockup telefonu z treścią (min. 1 sekcja widoczna, reszta jako taby)  
- Callout: „Link lub QR — bez aplikacji, bez konta”  
- Progress: Krok 2 z 6  

### 6. Elementy opcjonalne
- Bąbelki pytań rodziców („Jaki wynik?”) z przekreśleniem  
- Auto-przewijanie między tabami (motion spec)  
- Badge „LIVE” w mockupie telefonu  

### 7. Mobile

```
┌─────────────────────────┐
│ DEMO STORY    Krok 2/6  │
├─────────────────────────┤
│ Widok kibica            │
│                         │
│ Rodzice sami            │
│ sprawdzają wyniki       │
│                         │
│ Terminarz, wyniki,      │
│ tabela, play-off —      │
│ bez dzwonienia do Ciebie│
│                         │
│    ┌───────────────┐    │
│    │ ┌───────────┐ │    │
│    │ │ LIVE  🔴  │ │    │
│    │ ├───────────┤ │    │
│    │ │[Term][Wyn]│ │    │
│    │ │[Tab][PO]  │ │    │
│    │ ├───────────┤ │    │
│    │ │ 10:40     │ │    │
│    │ │ Orły -    │ │    │
│    │ │ United 2:1│ │    │
│    │ │ ...       │ │    │
│    │ └───────────┘ │    │
│    └─ telefon ─────┘    │
│                         │
│ Link lub QR — bez app,  │
│ bez konta               │
│                         │
│ ┌─────────────────────┐ │
│ │Wróć do stołu        │ │
│ │organizatora         │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

- Telefon wyśrodkowany, ~70% szerokości viewport  
- Taby w mockupie scroll horizontal jeśli brak miejsca  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ DEMO STORY                                         Krok 2/6  │
├──────────────────────────────────────────────────────────────┤
│  Widok kibica — to widzą rodzice na telefonie                 │
│                                                              │
│  Rodzice sami sprawdzają wyniki                            │
│  Terminarz, wyniki, tabela, play-off — bez dzwonienia...     │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────┐   │
│  │                     │    │  ~~Jaki wynik?~~        │   │
│  │   [ MOCKUP TELEFONU ]│    │  ~~Kiedy gra?~~         │   │
│  │   z tabami + tabelą  │    │                         │   │
│  │                     │    │  Odpowiedź jest tutaj.  │   │
│  └─────────────────────┘    └─────────────────────────┘   │
│                                                              │
│  Link lub QR — bez aplikacji, bez konta                      │
│              ┌──────────────────────────────┐                │
│              │  Wróć do stołu organizatora │                │
│              └──────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

- Layout split: telefon (lewo) + copy wspierający (prawo)  
- Mockup telefonu stała szerokość ~280px  

---

## Ekran 3 — Panel Organizatora

### 1. Cel ekranu
Pokazać **kontrolę i spokój** — turniej prawie domknięty, została jedna akcja.

### 2. Hierarchia treści
1. H1 — „Cały turniej za Tobą”  
2. Status 55/56 (dominujący)  
3. Karta finału (wyróżniona)  
4. Pasek postępu faz (grupy ✓, PO ✓, finał)  
5. Podnagłówek  
6. Primary CTA  

### 3. Najważniejszy element wizualny
**Status 55/56 meczów** + wyróżniona **karta WIELKI FINAŁ**.

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary | Wpisz wynik finału |

### 5. Elementy obowiązkowe
- H1: „Cały turniej za Tobą. Został finał.”  
- Licznik: 55 / 56 meczów rozegranych  
- Karta finału: WIELKI FINAŁ — wynik do wpisania  
- Kontekst faz: Faza grupowa ✓ · Play-off ✓ · Finał — czeka  
- Progress: Krok 3 z 6  

### 6. Elementy opcjonalne
- Skrócona lista ostatnich meczów (tło, przyciemnione)  
- Dashboard turnieju (mini) — bez edukacji  

### 7. Mobile

```
┌─────────────────────────┐
│ DEMO STORY    Krok 3/6  │
├─────────────────────────┤
│ Cały turniej za Tobą.   │
│ Został finał.           │
│                         │
│      55 / 56            │
│   meczów rozegranych    │
│ [████████████████░░]    │
│                         │
│ Grupa ✓  PO ✓  Finał ○  │
│                         │
│ ┌─────────────────────┐ │
│ │ 🏆 WIELKI FINAŁ     │ │
│ │ Orły vs United      │ │
│ │ Wynik: — : —        │ │
│ │ [ wynik do wpisania]│ │
│ └─────────────────────┘ │
│                         │
│ Jeden wpis. Koniec      │
│ turnieju.               │
│                         │
│ ┌─────────────────────┐ │
│ │ Wpisz wynik finału  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

- Karta finału z obramowaniem / wyróżnieniem  
- Progress bar 55/56 pod licznikiem  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ DEMO STORY                                         Krok 3/6  │
├──────────────────────────────────────────────────────────────┤
│  Cały turniej za Tobą. Został finał.                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  55 / 56 meczów rozegranych    [███████████████░] 98%   ││
│  │  Faza grupowa ✓   Play-off ✓   Finał — czeka na Ciebie   ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ 🏆 WIELKI FINAŁ          │  │ (lista meczów            │ │
│  │ FC Orły vs United Luboń  │  │  przyciemniona,         │ │
│  │ Wynik: — : —             │  │  opcjonalnie)           │ │
│  │ ► wynik do wpisania      │  │                         │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│  Jeden wpis. Koniec turnieju. Reszta zrobi się sama.         │
│              ┌──────────────────────────────┐                │
│              │     Wpisz wynik finału         │                │
│              └──────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

- Karta finału min. 50% szerokości contentu  
- Lista meczów opcjonalna, low contrast  

---

## Ekran 4 — Finał (wpisanie wyniku)

### 1. Cel ekranu
Jedyna interakcja użytkownika — **agency**, prostota, „dam radę w sobotę”.

### 2. Hierarchia treści
1. Nagłówek WIELKI FINAŁ  
2. Drużyny (lewo / prawo)  
3. Pola wyniku (centrum)  
4. Primary CTA zapisu  
5. Microcopy o automatycznym podium  

### 3. Najważniejszy element wizualny
**Pola wyniku** między nazwami drużyn (duże, dotykowe).

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary | Zapisz wynik finału |

### 5. Elementy obowiązkowe
- H1: WIELKI FINAŁ  
- FC Orły Poznań vs United Luboń  
- Pola wyniku (2 inputy lub jeden „3 : 2”)  
- CTA Zapisz  
- Microcopy: „Po zapisie system wyliczy podium…”  
- Progress: Krok 4 z 6  
- Walidacja: komunikat jeśli pusty wynik  

### 6. Elementy opcjonalne
- Strzelcy (uproszczone, collapsible)  
- Przycisk cofnięcia do ekranu 3  

### 7. Mobile

```
┌─────────────────────────┐
│ DEMO STORY    Krok 4/6  │
├─────────────────────────┤
│      WIELKI FINAŁ       │
│                         │
│   FC Orły Poznań        │
│                         │
│      ┌───┐   ┌───┐      │
│      │ 3 │ : │ 2 │      │
│      └───┘   └───┘      │
│                         │
│   United Luboń          │
│                         │
│ Strzelcy (opcj.) [+]    │
│                         │
│ Po zapisie: podium      │
│ automatycznie           │
│                         │
│ ┌─────────────────────┐ │
│ │ Zapisz wynik finału │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

- Pola wyniku min. 48px wysokości (touch target)  
- CTA sticky bottom  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ DEMO STORY                                         Krok 4/6  │
├──────────────────────────────────────────────────────────────┤
│                        WIELKI FINAŁ                          │
│                                                              │
│   FC Orły Poznań          ┌────┐   ┌────┐    United Luboń   │
│                           │  3 │ : │  2 │                    │
│                           └────┘   └────┘                    │
│                                                              │
│              Strzelcy (opcjonalnie)  [ rozwiń ]              │
│                                                              │
│     Po zapisie system wyliczy podium i statystyki auto.      │
│              ┌──────────────────────────────┐                │
│              │     Zapisz wynik finału      │                │
│              └──────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

- Layout poziomy: drużyna — wynik — drużyna  
- Modal overlay dopuszczalny na desktop i mobile  

---

## Ekran 5 — Podium (PEAK)

### 1. Cel ekranu
**Szczyt emocji demo** — automatyczne podium + statystyki po jednym wpisie.

### 2. Hierarchia treści
1. H1 — Turniej zamknięty  
2. Podnagłówek ulgi  
3. Podium 1–2–3 (wizualna hierarchia: 1. miejsce największe)  
4. Król strzelców + bramkarz  
5. Callout automatyczny  
6. **Primary CTA konwersyjny (tu!)**  

### 3. Najważniejszy element wizualny
**Podium 1. miejsca** (złoto, centrum, największe).

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary | Chcę taki turniej u siebie |
| Secondary | Aktywuj licencję |

### 5. Elementy obowiązkowe
- H1: Turniej zamknięty  
- Podnagłówek: „Po finałe nie liczysz na kartce…”  
- 🥇 🥈 🥉 z nazwami drużyn  
- Król strzelców + bramkarz turnieju  
- Callout: wyliczone automatycznie  
- Progress: Krok 5 z 6  
- Primary CTA konwersyjny **na tym ekranie**  

### 6. Elementy opcjonalne
- Krótka animacja wejścia podium (spec)  
- Konfetti / subtelny blask (dekoracja)  
- Miniatura „Raport PDF gotowy”  

### 7. Mobile

```
┌─────────────────────────┐
│ DEMO STORY    Krok 5/6  │
├─────────────────────────┤
│   Turniej zamknięty     │
│ Po finałe nie liczysz    │
│ na kartce.              │
│                         │
│      ┌─────────┐        │
│      │ 🥇 1.   │        │
│      │  Orły   │        │
│      └─────────┘        │
│  ┌──────┐   ┌──────┐   │
│  │🥈 2. │   │🥉 3. │   │
│  │United│   │Sparta│   │
│  └──────┘   └──────┘   │
│                         │
│ ⚽ Kowalski — 7 bramek   │
│ 🧤 Nowak — 4 czyste konta│
│                         │
│ ✓ Wyliczone automatycznie│
│                         │
│ ┌─────────────────────┐ │
│ │Chcę taki turniej    │ │
│ │u siebie             │ │
│ └─────────────────────┘ │
│   Aktywuj licencję      │
└─────────────────────────┘
```

- 1. miejsce wyżej i szersze niż 2. i 3.  
- CTA primary sticky, widoczny bez scrolla po podium  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ DEMO STORY                                         Krok 5/6  │
├──────────────────────────────────────────────────────────────┤
│                     Turniej zamknięty                        │
│           Po finałe nie liczysz na kartce. Podium gotowe.    │
│                                                              │
│         ┌─────────┐                                          │
│    ┌────┤ 🥇 1.   ├────┐                                     │
│    │    │  Orły   │    │                                     │
│ ┌──┴──┐ └─────────┘ ┌──┴──┐                                  │
│ │🥈 2.│             │🥉 3.│                                  │
│ │United│            │Sparta│                                 │
│ └─────┘             └─────┘                                  │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐              │
│  │ ⚽ Król strzelców   │  │ 🧤 Bramkarz turn.  │              │
│  │ Kowalski — 7       │  │ Nowak — 4 CK       │              │
│  └────────────────────┘  └────────────────────┘              │
│                                                              │
│              ┌──────────────────────────────┐                │
│              │  Chcę taki turniej u siebie    │                │
│              └──────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

- Podium poziome, klasyczna kompozycja 2–1–3  
- Statystyki w dwóch kartach pod podium  

---

## Ekran 6 — CTA konwersyjne

### 1. Cel ekranu
Konwertować impuls po peak na **akcję**: aktywacja, zamówienie, lead.

### 2. Hierarchia treści
1. H1 identyfikacyjny  
2. Podnagłówek (16 drużyn + outcome bullets)  
3. Primary CTA  
4. Secondary / tertiary CTA  
5. Pakiety (jedna linia)  
6. Następny krok  
7. FAQ skrócone (opcjonalnie)  

### 3. Najważniejszy element wizualny
**H1 + Primary CTA** — „Twój turniej może wyglądać tak samo” + „Aktywuj licencję”.

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary | Aktywuj licencję na mój turniej |
| Secondary | Zamów klucz na weekend turnieju |
| Tertiary | Wyślij mi ofertę |

### 5. Elementy obowiązkowe
- H1: Twój turniej może wyglądać tak samo  
- 3 bullet outcome (nie feature)  
- Min. 1 primary CTA  
- Microcopy pakietów: 1 dzień · weekend · miesiąc  
- Microcopy następny krok po aktywacji  
- Progress: Krok 6 z 6  

### 6. Elementy opcjonalne
- Miniatura podium w tle (social proof wizualny)  
- Rozwijane FAQ (3 pytania)  
- Pole email (lead capture)  

### 7. Mobile

```
┌─────────────────────────┐
│ DEMO STORY    Krok 6/6  │
├─────────────────────────┤
│ Twój turniej może       │
│ wyglądać tak samo       │
│                         │
│ • Rodzice sami widzą    │
│   wyniki live           │
│ • Ty wpisujesz wyniki   │
│ • Podium po finałe auto │
│                         │
│ ┌─────────────────────┐ │
│ │Aktywuj licencję na  │ │
│ │mój turniej          │ │
│ └─────────────────────┘ │
│                         │
│ Zamów klucz — weekend   │
│ Wyślij mi ofertę        │
│                         │
│ Pakiety: 1 dzień ·      │
│ weekend · miesiąc       │
│                         │
│ Po aktywacji: klucz →   │
│ drużyny → gra           │
└─────────────────────────┘
```

- Primary CTA pierwszy element above fold po H1  
- Secondary/tertiary jako text links  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ DEMO STORY                                         Krok 6/6  │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐   Twój turniej może wyglądać        │
│  │ [miniatura podium]  │   tak samo                         │
│  │                     │                                    │
│  └─────────────────────┘   • Rodzice sami sprawdzają...     │
│                              • Ty wpisujesz wyniki...         │
│                              • Podium po finałe auto...       │
│                              16 drużyn · format obsłużony     │
│                                                              │
│              ┌──────────────────────────────┐                │
│              │ Aktywuj licencję na mój turniej│               │
│              └──────────────────────────────┘                │
│         Zamów klucz na weekend  ·  Wyślij mi ofertę          │
│         Pakiety: 1 dzień · weekend · miesiąc                 │
│         Po aktywacji: klucz → drużyny → gra                  │
└──────────────────────────────────────────────────────────────┘
```

- Split: wizualny dowód (lewo) + copy + CTA (prawo)  
- FAQ accordion pod foldem  

---

## Ekran 7 — Archiwum (epilog)

### 1. Cel ekranu
Krótki **dowód racjonalny** — turniej zamknięty, wyniki zostają.

### 2. Hierarchia treści
1. H1 — Turniej zakończony. Wyniki zostają.  
2. Karta archiwum (nazwa, meta)  
3. Callout protokół  
4. Powtórzone CTA (mniejsze)  
5. Link „Chcesz zobaczyć więcej?”  

### 3. Najważniejszy element wizualny
**Karta archiwum** z metadanymi turnieju.

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary (mniejszy) | Aktywuj licencję |
| Secondary | Chcesz zobaczyć więcej? |

### 5. Elementy obowiązkowe
- H1 + podnagłówek (max 2 zdania)  
- Karta: Memoriał Wiosenny 2026 · 16 drużyn · 56 meczów  
- Callout: Raport / protokół dostępny  
- Max 15 s czytania  

### 6. Elementy opcjonalne
- Ikona PDF  
- Data zamknięcia turnieju  

### 7. Mobile

```
┌─────────────────────────┐
│ DEMO STORY    (epilog)  │
├─────────────────────────┤
│ Turniej zakończony.     │
│ Wyniki zostają.         │
│                         │
│ Protokół i archiwum     │
│ gotowe.                 │
│                         │
│ ┌─────────────────────┐ │
│ │ 📁 Memoriał Wiosenny│ │
│ │ 2026                │ │
│ │ 16 drużyn · 56 mecz.│ │
│ │ Zakończono dziś     │ │
│ │ 📄 Raport dostępny  │ │
│ └─────────────────────┘ │
│                         │
│ [ Aktywuj licencję ]    │
│                         │
│ Chcesz zobaczyć więcej? │
└─────────────────────────┘
```

- Jeden ekran, bez scrolla jeśli możliwe  
- CTA mniejsze niż na ekranie 5–6  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│                         (epilog)                             │
├──────────────────────────────────────────────────────────────┤
│           Turniej zakończony. Wyniki zostają.                │
│     Protokół i archiwum gotowe — dla klubów i rodziców.       │
│                                                              │
│              ┌──────────────────────────────┐                │
│              │ 📁 Memoriał Wiosenny 2026     │                │
│              │ 16 drużyn · 56 meczów         │                │
│              │ Zakończono dziś · Raport PDF   │                │
│              └──────────────────────────────┘                │
│                                                              │
│              [ Aktywuj licencję ]                            │
│              Chcesz zobaczyć więcej? →                       │
└──────────────────────────────────────────────────────────────┘
```

- Wyśrodkowana karta, max-width ~480px  

---

## Ekran 8 — Chcesz zobaczyć więcej? (opcjonalny)

### 1. Cel ekranu
Obsłużyć power userów **po** głównej historii — bez psucia lejka.

### 2. Hierarchia treści
1. H1 — Chcesz zobaczyć więcej?  
2. Podnagłówek — opcjonalność  
3. Lista 2–3 skrótów (karty)  
4. CTA powrotu do konwersji  

### 3. Najważniejszy element wizualny
**Trzy karty skrótów** — równorzędne, nie dominują nad CTA powrotu.

### 4. CTA
| Typ | Copy |
|-----|------|
| Primary | Wróć do aktywacji licencji |
| Na kartach | Wejdź (do pod-demo) |

### 5. Elementy obowiązkowe
- Dostęp tylko z ekranu 7 (nie z menu startowego)  
- Max 3 opcje skrótów  
- CTA powrotu do ekranu 6  

### 6. Elementy opcjonalne
- Czwarta karta „Pełna wersja DEMO-2026”  
- Szacowany czas każdego skrótu (np. „+3 min”)  

### 7. Mobile

```
┌─────────────────────────┐
│ Chcesz zobaczyć więcej? │
├─────────────────────────┤
│ Masz obraz finału.      │
│ Oto szczegóły — opcj.   │
│                         │
│ ┌─────────────────────┐ │
│ │ 📅 Terminarz        │ │
│ │ 16 drużyn      [→]  │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 📊 Tabela / remis   │ │
│ │                   [→]│ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 🗓 Cały dzień turn. │ │
│ │                   [→]│ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │Wróć do aktywacji    │ │
│ │licencji             │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

- Karty pełnej szerokości, stack vertical  
- Brak progress bar (poza głównym flow)  

### 8. Desktop

```
┌──────────────────────────────────────────────────────────────┐
│                   Chcesz zobaczyć więcej?                    │
│         Masz już obraz finału. Oto szczegóły — opcjonalnie.    │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ 📅 Terminarz │ │ 📊 Tabela    │ │ 🗓 Cały dzień │         │
│  │ 16 drużyn    │ │ remis punkt. │ │ turnieju     │         │
│  │    [ Wejdź ] │ │   [ Wejdź ]  │ │  [ Wejdź ]   │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│              ┌──────────────────────────────┐                │
│              │  Wróć do aktywacji licencji   │                │
│              └──────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

- 3 kolumny kart, równa wysokość  
- Primary CTA powrotu wyśrodkowany pod kartami  

---

## 9. Mapa nawigacji (UX)

```
                    ┌─────────────┐
                    │  0 Wejście  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  1 Hook     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  2 Kibic    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ 3 Organizator│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  4 Finał    │◄── jedyna interakcja
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ 5 Podium    │◄── PEAK + CTA #1
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  6 CTA      │◄── KONWERSJA
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ 7 Archiwum  │◄── epilog
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ 8 Więcej?   │◄── opcjonalnie
                    └─────────────┘
                           │
                           └──► powrót do 6
```

**Zasady nawigacji:**
- Brak „Wstecz” do menu funkcji  
- „Wstecz” dopuszczalny tylko 1 krok (np. z finału do organizatora)  
- Brak skip do ekranu 5 bez wpisania finału  
- Ekran 0 secondary „Mam klucz” → flow aktywacji (poza demo story)  

---

## 10. Responsywność — zasady wspólne

| Zasada | Mobile (<768px) | Desktop (≥768px) |
|--------|-----------------|------------------|
| Primary CTA | Full width, sticky bottom | Fixed width, wyśrodkowany |
| Typografia H1 | 24–28px eq. | 32–40px eq. |
| Mockup telefonu | Centrum, 70% szerokości | Split layout z copy |
| Podium | Stack vertical (1 nad 2–3) | Klasyczne 2–1–3 poziome |
| Progress | Zawsze widoczny w headerze | Ten sam header |
| Max content width | 100% - padding 16px | max 720–960px centrum |

---

## 11. Checklist akceptacji wireframe

| # | Kryterium | ✓ |
|---|-----------|---|
| 1 | Każdy ekran ma dokładnie 1 primary CTA | ☐ |
| 2 | Ekran 4 to jedyna wymagana interakcja | ☐ |
| 3 | Ekran 5 zawiera CTA konwersyjny | ☐ |
| 4 | Ekran 6 bezpośrednio po podium w flow | ☐ |
| 5 | Ekran 7 ≤ 1 viewport wysokości | ☐ |
| 6 | Ekran 8 niedostępny ze startu | ☐ |
| 7 | 16 drużyn / 56 meczów widoczne min. ekran 1 i 3 | ☐ |
| 8 | ASCII wireframe dla każdego ekranu mobile + desktop | ☐ |

---

## 12. Historia dokumentu

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | 2026-07-11 | Pierwsza wersja wireframe Demo Story |

---

*Koniec dokumentu WIREFRAME_DEMO_STORY.md*
