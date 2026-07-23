# Wizja Turniejomat — 4 dostępy do wiedzy o turnieju

Dokument kanoniczny (produkt + UX). Asystent: **strefa chroniona — bez zmian** bez osobnej decyzji.

## Istota

Jeden turniej, cztery świadome okna:

| Widok | Rola jednym zdaniem |
|-------|---------------------|
| **Sędzia / organizator** | Środowisko pracy — pełna kontrola turnieju |
| **Kibic** | Informacja oczami rodzica — zero zbędnych akcji |
| **Demo Story** | Zachęta i „wow” w stylu produktu — nie pełny feature set |
| **Asystent** | Edycja wyników w terenie — OK, nie ruszamy |

## Zależność od turnieju głównego

- **Sędzia** = źródło prawdy (konfiguracja, zapis, reguły).
- **Kibic** = maksymalnie związany danymi i językiem wizualnym paneli (odczyt).
- **Demo** = niezależny shell / ścieżka story; podobieństwo **kolorytu i stylu**, nie wspólnego chrome’u 1:1.
- **Asystent** = te same dane wyniku/protokołu, osobny UI operacyjny.

## Urządzenia (docelowo)

| Widok | Typowe urządzenia |
|-------|-------------------|
| Sędzia | Laptop, desktop, duży / bardzo duży tablet |
| Kibic | Smartfon / iPhone; rzadziej mały tablet; najrzadziej laptop |
| Demo | Jak kibic (telefon-first) |
| Asystent | Praca edycyjna; urządzenia często jak kibic/demo — status OK |

Elastyczność: layout musi znosić **pinch-zoom** i **Ctrl+scroll** (zoom ≠ 100%), nie tylko „idealny” viewport CSS.

## Zasady projektowe

1. Rozdziel role w UX i w kodzie — Demo nie może „wypadkiem” być full embedem sędziego, jeśli psuje rolę.
2. Kibic = lustrzane info (mecze, tabele, PO, podium, boiska gdy włączone).
3. Sędzia = komplet narzędzi; elegancja przez hierarchię.
4. Asystent = nie ruszamy.
5. Skan vs edycja: 1-liniowe listy tam, gdzie odczyt; karty tam, gdzie inputy.

---

## Decyzje produktowe (zablokowane 2026-07-23)

| # | Temat | Decyzja |
|---|--------|---------|
| 1 | Demo — niezależność | **Cel:** Demo niezależne od shelli sędziego/kibica (osobna ścieżka / showcase). Embed `mountNodes` to dług techniczny do redukcji (D1), nie docelowy model. |
| 2 | Demo krok 3 (organizator) | **Uproszczony showcase jak kibic** — 1-liniowy harmonogram (nie pełny panel sędziego z kartami). |
| 3 | Kibic — Boiska | **Jak dziś:** Boiska w belce gdy boiska włączone (`pitchCount` &gt; 0). |
| 4 | Sędzia — gate | **Twarde** too-small / landscape — bez zmian. |
| 5 | Zoom | Priorytet: **czytelność bez poziomego scrolla** (kompakt, zawijanie/clamp, nie „pełna tabela + scroll”). |
| 6 | Hala | **Potwierdzona — nie ruszamy** (osobny tor wyświetlacza obiektu; poza zakresem zmian UX czwórki). |
| 7 | Lokalne `?demo=story` | **Wyjątek localhost / 127.0.0.1** — bez redirectu na `demo.turniejomat.pl`. |

---

## Otwarte

Brak — decyzje produktowe zablokowane (w tym Hala i Asystent: nie ruszamy).

---

## Konfrontacja wizji ↔ stan aplikacji (2026-07-23)

Źródła: `index.html`, `demo-story.js`, router hostów.

### Zgodne / blisko wizji

| Obszar | Stan |
|--------|------|
| Kibic = odczyt | `fan-view`, readonly, belka Mecze\|Tabele\|Boiska*\|Play-Off\|Podium |
| Kibic telefon-first | Brak landscape gate dla `fan-view`; tabela 1-liniowa (karty UI &lt;360px) |
| Asystent chroniony | Osobny `#assistant-screen`, edycja wyniku; decyzja: nie ruszamy |
| Sędzia large screen | `syncOrganizerViewportGate` / `organizer-view--too-small` |
| Demo fan styl | Krok `fan`: belka + tabela + tip regulaminu; koloryt zbliżony do app |
| Dane kibica | Ten sam `state` / Firebase co turniej |

### Napięcia / luki względem wizji

| Luka | Opis | Priorytet |
|------|------|-----------|
| **D1** Demo ≠ niezależny shell | Kroki fan/organizer **embedują** węzły z `#view-app` (`mountNodes`) | Wysoki (architektura) |
| **D2** Demo organizer = karty 2-liniowe | ~~`preferCards true`~~ → **naprawione:** showcase 1-linia | Zamknięte |
| **D3** `?demo=story` lokalnie | ~~Redirect~~ → **wyjątek localhost** | Zamknięte |
| **S1** Sędzia gate | Potwierdzone: **twarde** | Zamknięte |
| **D4** Demo landscape gate | Story wymusza landscape na wybranych krokach (telefon) vs wizja „jak kibic” | Średni |
| **K1** Zoom / pinch | Brak świadomej strategii pod browser zoom (tylko media queries) | Średni |
| **S1** Sędzia na tablecie | Gate too-small + landscape na kartach — zgodne z „duży ekran”, do potwierdzenia z pytaniem 4 | — |
| **H1** Hala | Potwierdzona — **nie ruszamy** | Zamknięte |

### Diagram zależności kodu (obecny)

```
Demo Story chrome (#view-demo-story)
  ├─ mountFanEmbed     → matches/tables/playoff z app (+ tabela 1-linia)
  └─ mountOrganizerEmbed → dashboard + #nazywo (+ karty preferCards)
Kibic (body.fan-view) → ten sam #view-app / nav-tabs / panele
Sędzia → #view-app pełny
Asystent → #assistant-screen (izolowany UI)
```

---

## Backlog (bez asystenta) — po decyzjach

1. ~~D2 — 1-linia w Demo kroku 3~~ (wdrożone).
2. ~~D3 — localhost `?demo=story`~~ (wdrożone).
3. **D1** — dalsza niezależność Demo (mniej `mountNodes` / własny render) — etapami.
4. **D4** — landscape gate Demo vs telefon-first (jak kibic).
5. **K1** — pass kibica/demo pod zoom 125%/150% z priorytetem „bez poziomego scrolla”.
6. ~~H1 — Hala~~ (potwierdzona, nie ruszamy).

---

## Powiązane commity (kontekst)

- `fc8f797` — kibic/Demo fan: belka, 1-linia, portrait-first  
- `923daf2` — kolumny Boisko/Wynik, UKS AP Poznań  
