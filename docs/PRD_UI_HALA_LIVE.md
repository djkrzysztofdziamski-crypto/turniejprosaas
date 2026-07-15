# PRD: Turniejomat UI P0 — „Jasna Hala + Na żywo + Tryb projektora”

**Wersja:** 1.0 (plan wdrożeniowy — bez kodu)  
**Data:** 2026-07-14  
**Status:** Zaakceptowane decyzje produktowe od właściciela  
**Powiązane:** `index.html`, `css/brand-tokens.css`, `database.rules.json`, raport konkurencyjny turniej.pl

---

## 0. Decyzje produktowe (potwierdzone — nie zgadywać)

| # | Temat | Decyzja |
|---|--------|---------|
| D1 | Header | **Ciemny navy zostaje** (marka). Reszta panelu organizatora = **bardzo jasna** z subtelną poświatą |
| D2 | Split-view | **Nowa zakładka „Na żywo”** = harmonogram + tabele razem. Na mobile: Mecze + Tabele osobno (obecne zakładki) |
| D3 | Tryb hali | **Osobny URL** `?view=hall&id=TP-XXXX-XXXX` dla projektora. Fan view `?view=fan` **zostaje** dla telefonów |
| D4 | Zakres P0 | **Pełne P0:** UI + tryb hali + print CSS + reguły publiczne + link asystenta |

---

## 1. Cel produktu

Organizator halowego turnieju piłkarskiego w **jeden dzień** ma:
- czytelniejszy panel niż dziś (inspiracja turniej.pl: tabele, ramki, typografia),
- **jeden ekran „Na żywo”** bez skakania między Mecze ↔ Tabele na laptopie,
- **tryb projektora** na hali (duże wyniki, tabela, następny mecz),
- **drukowanie** harmonogramu + tabel bez PDF na końcu,
- **transparentne reguły punktacji** dla kibiców,
- **link asystenta** — drugi sędzia wpisuje wyniki bez klucza licencyjnego.

**North star UX:** „W gorącym dniu turnieju nie muszę myśleć o interfejsie — widzę mecze i tabelę naraz, kibic na telefonie, hala na projektorze.”

---

## 2. Non-goals (P0 — świadomie poza zakresem)

- Widget iframe na stronę klubu (P1)
- Logo drużyn / sponsora (P1)
- Multi-boisko / parallel courts (P1)
- Kopiowanie turnieju / defaults (P1)
- Free tier / publiczny katalog turniejów
- Zmiana modelu licencjonowania lub billingu
- Przebudowa play-off / podium / PDF końcowego
- Zmiana ciemnego headera na jasny
- WordPress plugin

---

## 3. Persony i scenariusze

### P1 — Organizator (główny sędzia, laptop)
- Siedzi przy biurku z laptopem, wpisuje wyniki między meczami.
- Potrzebuje: split Na żywo, inline score (opcjonalnie P0.1), szybki podgląd awansu w tabeli.

### P2 — Asystent (telefon / tablet, boisko)
- Dostaje link WhatsApp/SMS, wpisuje wynik meczu na boisku.
- Potrzebuje: tylko lista meczów + pola wyniku, bez resetu / zamrożenia / ustawień.

### P3 — Kibic (telefon)
- Skanuje QR, śledzi wyniki na telefonie w kieszeni.
- Potrzebuje: fan view (obecny), reguły punktacji, czytelne karty meczów.

### P4 — Publiczność hali (projektor)
- Patrzy na duży ekran.
- Potrzebuje: hall view — duża czcionka, aktualny / następny mecz, TOP tabela, bez elementów administracyjnych.

---

## 4. System design — wizualny (jasny ekran + poświata)

### 4.1 Filozofia

Inspiracja turniej.pl: **biurowa czytelność tabel**.  
Tożsamość Turniejomat: **ciemny header + nowoczesna typografia** (Plus Jakarta / DM Sans).

**„Poświata”** = delikatna aureola wokół paneli roboczych (nie gradient tła strony):
- jasne tło `#f8fafc` → `#ffffff` w kartach,
- obramowanie `1px solid #e2e8f0`,
- **outer glow:** `0 0 0 1px rgba(0,82,204,0.06), 0 8px 32px rgba(11,31,51,0.06)` — tylko na `.card`, `.live-split-panel`, `.rules-box`,
- **bez** ciężkich cieni kart obecnych (`shadow-card` zmniejszyć kontrast).

### 4.2 Nowe tokeny CSS (`brand-tokens.css`)

| Token | Wartość | Użycie |
|-------|---------|--------|
| `--color-app-bg` | `#f8fafc` | Tło całego `#view-app` |
| `--color-app-surface` | `#ffffff` | Karty, tabele |
| `--color-app-surface-muted` | `#f1f5f9` | Zebra co drugi wiersz |
| `--color-app-border` | `#e2e8f0` | Ramki 1px |
| `--color-app-border-strong` | `#cbd5e1` | Nagłówki tabel |
| `--color-table-head-bg` | `#eef2ff` | Nagłówek tabeli (lawenda — insp. turniej.pl) |
| `--color-table-head-text` | `#334155` | Tekst nagłówka |
| `--color-glow-accent` | `0 0 0 1px rgba(0,82,204,0.08), 0 8px 28px rgba(11,31,51,0.07)` | Poświata paneli |
| `--font-size-body` | `14px` | Domyślny tekst panelu |
| `--font-size-table` | `14px` | Komórki tabel |
| `--font-size-table-head` | `11px` | Nagłówki kolumn (uppercase, letter-spacing 0.06em) |
| `--font-size-nav-tab` | `12px` | Zakładki (mixed case, nie 10px) |
| `--row-height-table` | `44px` | Min-height wiersza tabeli |
| `--radius-panel` | `8px` | Karty |

### 4.3 Typografia — mapowanie elementów

| Element | Było | Ma być |
|---------|------|--------|
| `.nav-tabs button` | 10px uppercase | 12px, **„Na żywo”** pierwsza litera wielka, font-weight 700 |
| `#view-app table` | 13px | 14px, `tabular-nums` na kolumnach liczb |
| `#view-app th` | padding 10px | padding 12px 10px, tło `--color-table-head-bg` |
| `#view-app td` | padding 10px | padding 11px 10px, min-height 44px |
| `.time-setting span` | bold | 14px, kolor `#475569`, min-width 180px |
| `.card h3` | domyślne | 18px Plus Jakarta 800, `#0f172a` |
| Hint / pomoc | 11–12px | 13px, `#64748b` |

### 4.4 Co zostaje ciemne

- `#view-app header` — bez zmian kolorystycznych (navy `#0b1f33`)
- `#view-login`, `#view-admin`, landing — **poza zakresem** tego PRD (tylko `#view-app` organizator + hall + fan)

---

## 5. Informacja architektury UI (stan obecny → docelowy)

### 5.1 Nawigacja zakładek — docelowa

**Desktop (≥1024px):**
```
Start | Składy | Grupy | Na żywo | Play-Off | Podium | Archiwum
```
- Zakładki **Mecze** i **Tabele** znikają z paska (zastąpione przez **Na żywo**).
- Logika `switchTab()` musi mapować `'nazywo'` → render obu paneli.

**Mobile (<1024px):**
```
Start | Składy | Grupy | Mecze | Tabele | Play-Off | Podium | Archiwum
```
- **Na żywo** ukryta lub alias: pierwszy tap „Mecze” z bannerem „Pełny widok: obróć telefon / użyj laptopa”.
- **Decyzja implementacyjna:** na mobile zostają Mecze + Tabele (potwierdzone D2).

### 5.2 Nowe ID DOM (plan struktury HTML)

```
#nazywo.tab-content
  .live-toolbar          — filtry (skopiowane z #match-filter-bar)
  .live-split
    .live-split-schedule  — 62% szerokości
      #live-matches-container  — alias renderu meczów LUB wspólny renderer
    .live-split-standings — 38% szerokości
      #live-tables-container   — alias calcTables() output
  .live-footer-actions    — przycisk START PLAY-OFF (przeniesiony z #tabele)
```

**Ważne:** nie duplikować logiki — `renderMatches()` i `calcTables()` renderują do przekazanego kontenera (refactor planowany, nie dwa źródła prawdy).

---

## 6. Ekran: „Na żywo” (organizator, desktop)

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [CIEMNY HEADER — bez zmian]                                  │
├─────────────────────────────────────────────────────────────┤
│ [Dashboard KPI — istniejący, lekko jaśniejsze tło]           │
├─────────────────────────────────────────────────────────────┤
│ Start | Składy | Grupy | [Na żywo] | Play-Off | ...         │
├──────────────────────────────┬──────────────────────────────┤
│ HARMONOGRAM MECZÓW (62%)      │ TABELE (38%)                 │
│ ┌ filtry: Wszystkie | ... ─┐ │ ┌─ Grupa A ───────────────┐ │
│ │ Nr | Godz | Mecz | Wynik │ │ │ M | Drużyna | M | Pkt ...│ │
│ │ 1  | 10:00| A vs B | 2:1 │ │ └─────────────────────────┘ │
│ │ 2  | 10:12| ...          │ │ ┌─ Grupa B ───────────────┐ │
│ └──────────────────────────┘ │ └─────────────────────────┘ │
│                              │ [START PLAY-OFF]            │
└──────────────────────────────┴──────────────────────────────┘
```

### 6.2 Breakpointy

| Viewport | Layout |
|----------|--------|
| ≥1280px | 62/38 split, obie kolumny scroll niezależnie (`max-height: calc(100vh - 220px)`) |
| 1024–1279px | 58/42 split |
| 768–1023px | Stack pionowy: harmonogram u góry, tabele pod spodem w `#nazywo` LUB ukryć `#nazywo` i pokazać Mecze/Tabele |
| <768px | Tylko zakładki Mecze + Tabele (bez #nazywo) |

### 6.3 Harmonogram — wariant P0 inline score (szczegóły)

**Wiersz meczu w trybie Na żywo (organizator):**

| Kolumna | Szerokość | Zawartość |
|---------|-----------|-----------|
| Nr | 40px | Globalny numer meczu |
| Godzina | 64px | `match.time`, tabular-nums |
| Mecz | flex | `Drużyna A vs Drużyna B`, ellipsis |
| Wynik | 120px | Dwa inputy `[__]:[__]` + przycisk ✓ |
| Status | 32px | Kropka: szary=zaplanowany, zielony=rozegrany |

**Interakcja:**
1. Asystent/organizator wpisuje wynik → ✓
2. Wywołanie istniejącego `saveMatch()` (lub uproszczona wersja bez modala)
3. Po zapisie: wiersz → zielony lewy border 3px, tabela po prawej **natychmiast** przeliczona (`calcTables()`)

**Mecze wymagające karnych:** inline pokazuje „Kliknij aby rozstrzygnąć” → otwiera **istniejący modal** (nie budujemy karnych inline w P0).

### 6.4 Tabele w kolumnie prawej

- Jedna grupa = jedna mini-tabela (max 6–8 wierszy typowo).
- Nagłówek grupy: sticky w obrębie prawej kolumny.
- Wiersze awansu: zielony lewy border (istniejący `.advancing-row`).
- **Bez** strzałek ręcznej kolejności w prawej kolumnie Na żywo — tylko podgląd. Pełna edycja kolejności → zakładka Tabele (mobile) lub link „Edytuj kolejność” otwierający modal/drawer.

### 6.5 Toolbar Na żywo

Przenieść z `#mecze`:
- Filtr statusu: Wszystkie / Do rozegrania / Rozegrane
- Filtr grupy: Wszystkie / A / B / … / Play-off

Dodać:
- Przycisk **„Drukuj”** → `window.print()` z klasą `body.print-live`
- Przycisk **„Tryb hali”** → otwiera `?view=hall&id={activeKey}` w nowej karcie
- Przycisk **„Link asystenta”** → modal z URL + QR (patrz sekcja 9)

---

## 7. Ekran: Tryb hali (`?view=hall`)

### 7.1 Routing

Rozszerzyć `executeRouter()` / `initAppModule()`:

```
?view=hall&id=TP-XXXX-XXXX   → hallMode = true
?view=fan&id=TP-XXXX-XXXX    → fanMode = true (bez zmian)
?id=TP-XXXX-XXXX             → organizer (bez zmian)
```

**Klasa body:** `body.hall-view` (osobna od `fan-view`).

### 7.2 Layout projektora (landscape 16:9, 1920×1080 docelowo)

```
┌────────────────────────────────────────────────────────────────┐
│ TURNIEJOMAT · {Nazwa turnieju z state.meta lub domyślna}       │
│ {Data} · Faza: Grupy / Play-off          [fullscreen icon]      │
├─────────────────────────────┬──────────────────────────────────┤
│ NASTĘPNY MECZ (duży)        │  TABELA — Grupa A (TOP 5)        │
│ 10:24                       │  1. ...                          │
│ FC Sparta vs Grom Stella    │  2. ...                          │
│                             │  TABELA — Grupa B (TOP 5)        │
├─────────────────────────────┤                                  │
│ OSTATNIO ROZEGRANY            │  REGULAMIN (skrót)             │
│ Pogoń 3:1 Amber               │  3 pkt | remis: H2H→BM→...     │
├─────────────────────────────┴──────────────────────────────────┤
│ Pasek bieżących wyników (ostatnie 4 mecze, ticker statyczny)   │
└────────────────────────────────────────────────────────────────┘
```

### 7.3 Zasady hall view

- **Zero** przycisków admin (reset, zamroź, QR organizatora).
- **Auto-refresh:** polling RTDB co 5s (istniejący mechanizm) + animacja flash przy zmianie wyniku (CSS `@keyframes score-flash` 400ms).
- **Fullscreen:** przycisk „Pełny ekran” (`document.documentElement.requestFullscreen()`).
- **Typografia hall:**
  - Następny mecz: 48–64px (clamp)
  - Wynik ostatni: 36px
  - Tabela: 22–28px
- **Tło:** `#ffffff` z **subtelną** poświatą na panelu centralnym (token `--color-glow-accent`).
- **Header hall:** jasny (`#ffffff`), logo Turniejomat małe, **nie** ciemny header organizatora.

### 7.4 Dane — skąd bez zgadywania

| Pole | Źródło w `state` |
|------|------------------|
| Następny mecz | Pierwszy mecz w `state.matches` (grupowe + PO) bez `played`/`score` |
| Ostatni rozegrany | Ostatni mecz z wypełnionym wynikiem wg `time` lub kolejności ID |
| Tabela | `getSortedGroupStats(gn)` — istniejąca funkcja |
| Nazwa turnieju | **Do ustalenia:** dziś brak pola `state.meta.name` — patrz sekcja 12 (pytanie otwarte) |

### 7.5 Udostępnianie

- Organizator: header → QR Kibic (fan) **+** nowy „QR Hala” lub jeden modal z dwoma zakładkami: Telefon / Projektór.
- URL hall nie wymaga auth (jak fan) — read-only + auto refresh.

---

## 8. Fan view — ulepszenia P0

### 8.1 Reguły punktacji (publiczne)

Box nad zakładkami (tylko `body.fan-view`):

```
┌─ Regulamin punktacji ─────────────────────────────┐
│ Zwycięstwo: 3 pkt · Remis: 1 pkt · Porażka: 0 pkt  │
│ Remis w tabeli: bezpośrednie mecze → bilans → ...   │
│ Awans: TOP {advCount} z każdej grupy               │
└────────────────────────────────────────────────────┘
```

Tekst generowany dynamicznie z `state.settings.advCount` i stałej listy tie-break (zgodnie z `getSortedGroupStats` — **muszą być identyczne**).

### 8.2 Wizualne

- Jaśniejsze tło (już częściowo jest gradient fan-view) — ujednolicić z nowymi tokenami.
- Większe karty meczów na mobile: min-height 72px, font 15px.

### 8.3 Print

- Fan view: przycisk „Drukuj tabele” ukryty (organizator drukuje z Na żywo).

---

## 9. Link asystenta

### 9.1 URL

```
?view=assistant&id=TP-XXXX-XXXX&token={32char}
```

### 9.2 Uprawnienia asystenta

**MOŻE:**
- Odczytać harmonogram meczów
- Wpisać / poprawić wynik meczu (score + opcjonalnie strzelcy — **decyzja:** P0 = tylko wynik, strzelcy w modalu organizatora)

**NIE MO���U:**
- Reset, zamrożenie, archiwum, generowanie play-off, zmiana grup, edycja drużyn
- Dostęp do admina

### 9.3 Model tokena (RTDB)

Nowa ścieżka:
```
asystenci/{licenseKey}/token     → string (hash lub random)
asystenci/{licenseKey}/createdAt → timestamp
asystenci/{licenseKey}/expiresAt → timestamp (koniec licencji lub +72h)
```

**Generowanie:** przycisk „Link asystenta” w headerze lub Na żywo → Cloud Function `generateAssistantToken` (callable, wymaga aktywnej licencji organizatora) **LUB** client-side zapis jeśli reguły pozwalają tylko organizatorowi z kluczem.

**Preferencja architektoniczna:** Cloud Function — nie zgadujemy secret w kliencie.

### 9.4 Reguły Firebase (`database.rules.json`)

```
asystenci/{key}/token — read: false (token w URL weryfikowany server-side?)
```

**Problem:** RTDB nie ma middleware. **Rozwiązanie P0:**
- Token zapisany w `turnieje_uzytkownikow/{key}/assistantToken`
- Zapis wyniku dozwolony gdy `auth == null` AND query token matches AND licencja aktywna

**Alternatywa prostsza P0:** token = HMAC(licenseKey + secret) znany tylko Functions — weryfikacja w **Cloud Function** `saveMatchAssistant` callable z `{key, token, matchId, score}`.

**Rekomendacja PRD:** Callable `assistantSaveMatch` — **nie rozszerzać reguł RTDB na write anonimowy** (bezpieczeństwo).

### 9.5 UI asystenta

- Osobny `body.assistant-view`
- Lista meczów z inline score (jak Na żywo, bez kolumny tabel)
- Banner: „Tryb asystenta — tylko wyniki”
- Brak headera admin

---

## 10. Print CSS (`@media print`)

### 10.1 Klasy

- `body.print-live` — aktywowane przed `window.print()` z Na żywo

### 10.2 Co drukuje

**Strona 1:** Nagłówek turnieju + data + regulamin skrócony  
**Strona 2+:** Harmonogram (wszystkie mecze, wyniki lub `--:--`)  
**Ostatnia:** Tabele wszystkich grup

### 10.3 Ukryć w druku

- Header navy, nav-tabs, dashboard, przyciski, filtry

### 10.4 Styl druku

- Tło białe `#fff`, czarny tekst, ramki 1px `#000` (dla drukarki szkolnej)
- Font 11pt body, 9pt nagłówki kolumn
- `@page { margin: 12mm; size: A4 portrait; }`

---

## 11. Refactor techniczny (plan bez kodu)

### 11.1 Funkcje do rozbicia

| Funkcja obecna | Zmiana |
|----------------|--------|
| `renderMatches()` | Przyjmuje `containerEl`, `mode: 'cards'|'table'|'inline'` |
| `calcTables()` | Przyjmuje `containerEl`, flaga `compact: true` dla kolumny Na żywo |
| `switchTab()` | Obsługa `'nazywo'`, responsive hide/show zakładek |
| `executeRouter()` | `hall`, `assistant` view modes |
| `showQR()` | Rozszerzyć o 3 linki: fan / hall / assistant |

### 11.2 Pliki dotknięte

| Plik | Zmiany |
|------|--------|
| `index.html` | HTML #nazywo, CSS tokens, hall/assistant/fan rules box, print CSS, nav |
| `css/brand-tokens.css` | Nowe tokeny jasne + glow |
| `functions/index.js` | `generateAssistantToken`, `assistantSaveMatch` (nowe callable) |
| `database.rules.json` | Minimalne — assistant przez Functions, nie anon write |
| `docs/FIREBASE_RULES.md` | Dokumentacja assistant |

### 11.3 Kolejność implementacji (krok 3 — plan wykonawczy)

**Sprint UI-A (2–3 dni):** tokeny, typografia, tabele, nav „Na żywo”, split desktop  
**Sprint UI-B (2 dni):** inline score, print CSS, rules box fan  
**Sprint UI-C (2–3 dni):** hall view routing + layout  
**Sprint UI-D (2 dni):** assistant callable + UI  
**Sprint UI-E (1 dzień):** QA, demo-story embed check, fan/hall QR modal

---

## 12. Kryteria akceptacji (testy)

### Na żywo
- [ ] Desktop ≥1024px: harmonogram + tabele widoczne bez scrolla poziomego
- [ ] Zmiana wyniku → tabela po prawej aktualizuje się <1s
- [ ] Mobile: zakładki Mecze i Tabele działają jak dziś
- [ ] START PLAY-OFF dostępny z Na żywo

### Hall
- [ ] URL `?view=hall&id=...` fullscreen na projektorze bez pasków admin
- [ ] Auto-refresh wyniku po zapisie organizatora
- [ ] Czytelność z 5m (test manualny — font ≥48px następny mecz)

### Fan
- [ ] Box regulaminu widoczny, liczby zgodne z `getSortedGroupStats`

### Assistant
- [ ] Link bez klucza licencji w URL (tylko token)
- [ ] Token wygasa z licencją
- [ ] Assistant nie widzi RESET / admin

### Print
- [ ] Druk A4: harmonogram + tabele, bez nav/header

---

## 13. Decyzje zamknięte (2026-07-14)

| # | Pytanie | Decyzja |
|---|---------|---------|
| Q1 | Nazwa turnieju | **Pole w zakładce Start** → `state.meta.tournamentName` |
| Q2 | Asystent | **Wynik + strzelcy** (jak organizator w modalu) |
| Q3 | QR / linki | **Jeden modal „Udostępnij” z 3 zakładkami** (Fan / Hala / Asystent) |
| Q4 | Kolejność przy remisie | **Drawer „Edytuj kolejność”** otwierany z Na żywo |
| Q5 | Demo Story | **Tak — Na żywo + hall w demo** (prezentacja sprzedażowa) |

---

## 14. Metryki sukcesu (po wdrożeniu)

- Organizator: ≤3 kliki od wpisania wyniku do zobaczenia zmiany w tabeli (Na żywo)
- Czas konfiguracji projektora: ≤30s (QR hall → fullscreen)
- Zero regresji: play-off, podium, PDF, billing, admin

---

*Koniec PRD v1.1 — wszystkie decyzje Q1–Q5 zamknięte. Gotowe do implementacji.*
