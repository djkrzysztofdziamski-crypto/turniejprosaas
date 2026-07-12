# Admin Table Layout Fix — Analiza i rekomendacja

**Wersja:** 1.0  
**Status:** Analiza (bez implementacji)  
**Data:** 2026-07-12  
**Zakres:** Tabela licencji w `#view-admin` → `#licenses-table-body`  
**Plik:** `index.html` (CSS linie ~56–70, HTML ~380–401, JS `initAdminMonitor()` ~926–970)

---

## 1. Opis problemu (objaw)

Przy dłuższej wartości pola **Organizator / Notatka** (`lic.notatka`) tekst wizualnie wchodzi w obszar kolumny **Zarządzanie / Akcje serwera** (przyciski PODGLĄD, BLOKUJ, +24H, USUŃ).

Efekt: przyciski są trudne do odczytania / trudne do kliknięcia; wiersz wygląda na „rozlany”.

---

## 2. Analiza implementacji

### 2.1 Struktura HTML

**Statyczny szkielet** (bez klas kolumn):

```html
<div style="overflow-x: auto;">
  <table>
    <thead>
      <tr>
        <th>Klucz Licencyjny</th>
        <th>Organizator / Notatka</th>
        <th>Pakiet</th>
        <th>Status</th>
        <th>Aktywowano</th>
        <th>Wygasa</th>
        <th>Zarządzanie / Akcje serwera</th>
      </tr>
    </thead>
    <tbody id="licenses-table-body">…</tbody>
  </table>
</div>
```

**Dynamiczny wiersz** (`initAdminMonitor()`):

| Kolumna | Zawartość | Style inline |
|---------|-----------|--------------|
| 1 | `TP-XXXX-XXXX` | `font-family: monospace; font-weight: bold; color: #60a5fa` |
| 2 | `esc(lic.notatka)` | `font-weight: 500` |
| 3 | `lic.typ` w `<code>` | brak |
| 4 | badge statusu | brak |
| 5 | data aktywacji | `font-size: 11px; color: #94a3b8` |
| 6 | data wygaśnięcia | `font-size: 11px; font-weight: bold` |
| 7 | 3–4× `<button class="action-btn">` | **brak wrappera, brak klas komórki** |

Komórka akcji (uproszczony markup):

```html
<td>
  <button class="action-btn act-view">👁 PODGLĄD</button>
  <button class="action-btn act-block">🚫 BLOKUJ</button>
  <button class="action-btn act-time">➕ 24H</button>
  <button class="action-btn act-del">✖ USUŃ</button>
</td>
```

Brak: `<colgroup>`, klas na `<th>`/`<td>`, atrybutu `title` z pełną notatką.

---

### 2.2 Szerokości kolumn

| Właściwość | Wartość | Wniosek |
|------------|---------|---------|
| `#view-admin table` | `width: 100%` | Tabela rozciąga się na kartę |
| `#view-admin .container` | `max-width: 1100px` | Górny limit szerokości contentu |
| Szerokości kolumn | **brak** | Przeglądarka liczy je algorytmem `auto` |
| `<colgroup>` | **brak** | Brak kontroli proporcji |
| `min-width` na kolumnie akcji | **brak** | Kolumna może się ściskać |

Szacunkowa **minimalna szerokość** kolumny akcji (4 przyciski w jednej linii):

| Przycisk | ~szerokość |
|----------|------------|
| 👁 PODGLĄD | ~95 px |
| 🚫 BLOKUJ / 🔓 ODBLOKUJ | ~85 px |
| ➕ 24H | ~65 px |
| ✖ USUŃ | ~65 px |
| marginesy `margin-right: 4px` | ~12 px |
| **Razem** | **~320–360 px** |

Przy 7 kolumnach w ~1060 px (karta minus padding) pozostałe 6 kolumn dzieli ~700 px — notatka + daty (`toLocaleString('pl-PL')` ≈ 16–20 znaków) konkurują z akcjami.

---

### 2.3 `table-layout`

```css
#view-admin table { width: 100%; border-collapse: collapse; … }
```

| Właściwość | Stan |
|------------|------|
| `table-layout` | **nie ustawione** → domyślnie `auto` |
| Zachowanie `auto` | Szerokość kolumn = f(content min/max). Długa notatka **poszerza** kolumnę 2. Kolumna akcji dostaje resztę lub jest ściskana poniżej min-content przycisków. |
| `border-collapse: collapse` | OK — nie wpływa na overlap |

**Wniosek:** Bez `table-layout: fixed` i bez `min-width` na akcjach tabela nie gwarantuje rezerwacji miejsca na przyciski.

---

### 2.4 Flexbox / Grid w komórce akcji

| Element | Layout |
|---------|--------|
| `<td>` akcji | Domyślny **block flow** — przyciski jako `inline`/`inline-block` (typowe dla `<button>`) |
| `.action-btn` | `padding: 4px 8px; margin-right: 4px` — **brak** `display: flex`, **brak** `flex-wrap`, **brak** `gap` |
| Wrapper | **brak** `<div class="lic-actions">` |

Przyciski układają się w linii jak tekst. Gdy kolumna jest węższa niż suma szerokości przycisków:

- przyciski **zawijają się** do kolejnej linii w tej samej komórce (domyślne zachowanie inline),
- jednocześnie długa notatka w sąsiedniej komórce **nie jest obcinana**,

→ wizualnie w jednym wierszu tabeli widać długi tekst po lewej i „wciśnięte” / zawinięte przyciski po prawej — użytkownik odbiera to jako **nachodzenie tekstu na strefę akcji**.

**Porównanie:** Sekcja archiwum admina (`.archive-item`) używa `display: flex; justify-content: space-between` — tam layout jest świadomie rozdzielony. Tabela licencji **nie** ma analogicznej struktury.

---

### 2.5 `white-space` / `overflow` / `text-overflow`

| Selektor | white-space | overflow | text-overflow | word-break |
|----------|-------------|----------|---------------|------------|
| `#view-admin th, td` | domyślne `normal` | domyślne `visible` | brak | brak |
| Komórka notatki (inline) | — | — | — | — |
| Komórka akcji | domyślne | `visible` | — | — |

Skutki:

1. **Długie słowa bez spacji** (np. `SędziaKowalski-PucharOpalenicy2026`) — mogą **nie łamać się** i rozszerzać kolumnę.
2. **Brak ellipsis** — pełny tekst zawsze renderowany; nie ma sygnału „jest więcej”.
3. **`overflow: visible`** na komórkach — zawartość nie jest przycinana do granic `<td>` (w praktyce table cell clipping varies, ale bez max-width tekst i tak dominuje layout).
4. Brak **`title`** — brak podglądu pełnej nazwy po hover.

Wrapper `overflow-x: auto` na `<div>` **nie rozwiązuje** problemu czytelności — tylko umożliwia scroll poziomy, gdy suma kolumn > viewport.

---

## 3. Źródło problemu (root cause)

**Jedno zdanie:** Tabela używa domyślnego `table-layout: auto` bez limitów szerokości kolumn i bez kontroli overflow w kolumnie notatki, podczas gdy kolumna akcji nie ma zarezerwowanej minimalnej szerokości ani osobnego układu — długi tekst organizatora wygrywa konkurs o przestrzeń z przyciskami.

**Składowe (5):**

| # | Przyczyna |
|---|-----------|
| R1 | Brak `table-layout: fixed` + brak `<colgroup>` |
| R2 | Kolumna notatki bez `max-width` / `overflow: hidden` / `text-overflow: ellipsis` |
| R3 | Kolumna akcji bez `min-width` (~340px) i bez `white-space: nowrap` (lub flex-wrap z kontrolą) |
| R4 | Komórka akcji — płaskie inline `<button>` bez kontenera flex |
| R5 | Brak responsywnej strategii — na wąskich ekranach ten sam 7-kolumnowy układ |

---

## 4. Docelowy layout tabeli admina

### 4.1 Zasady

1. **Kolumna akcji jest święta** — zawsze czytelna, min. ~340 px na desktopie.
2. **Notatka jest elastyczna** — zajmuje pozostałe miejsce, długi tekst obcinany z `…`.
3. **Pełna notatka dostępna** — `title` na komórce + opcjonalnie klik/hover (bez modala w MVP fix).
4. **Daty i klucz** — stałe wąskie kolumny, `nowrap` gdzie sensowne.
5. **Mobile** — ten sam model danych; inna prezentacja poniżej progu (karty) lub scroll + sticky akcje.

### 4.2 Desktop (≥ 900 px)

```
┌──────────┬─────────────────────────────┬─────────┬────────┬───────────┬───────────┬──────────────────────────────┐
│ Klucz    │ Organizator / Notatka       │ Pakiet  │ Status │ Aktywowano│ Wygasa    │ Akcje (zawsze w jednej strefie)│
│ ~11%     │ reszta (ellipsis)           │ ~9%     │ ~8%    │ ~12%      │ ~12%      │ min 340px, flex row wrap     │
│ nowrap   │ overflow hidden + ellipsis  │ nowrap  │ center │ nowrap    │ nowrap    │ gap 4px, justify flex-end    │
└──────────┴─────────────────────────────┴─────────┴────────┴───────────┴───────────┴──────────────────────────────┘
```

**Mechanizm:** `table-layout: fixed` + `<colgroup>` + klasy semantyczne na `<th>`/`<td>`.

### 4.3 Mobile (< 900 px) — rekomendacja

**Opcja A (minimalna, bez zmiany JS-markup na karty):**

- Zachować tabelę + `overflow-x: auto`
- Dodać `min-width: 960px` na `<table>` — wymusza scroll, kolumny zachowują proporcje
- Kolumna akcji: `position: sticky; right: 0; background: #1e293b` — akcje widoczne przy scrollu w poziomie

**Opcja B (docelowa, większy diff — poza „minimal fix”):**

- Poniżej 768 px: wiersze jako karty (JS generuje `<div class="lic-row-card">`)
- Akcje zawsze na dole karty, pełna szerokość, `flex-wrap: wrap`

**Rekomendacja na pierwszy fix:** **Opcja A** (CSS-only, niski koszt) + ellipsis notatki.

---

## 5. Rekomendowane rozwiązanie

### 5.1 Strategia: „Fixed table + ellipsis + reserved actions”

| Warstwa | Zmiana |
|---------|--------|
| CSS | `table-layout: fixed`, klasy kolumn, ellipsis, min-width akcji, flex na akcjach |
| HTML (statyczny) | `<colgroup>`, klasy na `<th>`, opcjonalnie `class="licenses-table"` na `<table>` |
| JS (`initAdminMonitor`) | Klasy na `<td>`, `title="${esc(lic.notatka)}"` na komórce notatki, wrapper `<div class="lic-actions">` wokół przycisków |

### 5.2 Zachowanie dla bardzo długich nazw

| Scenariusz | Zachowanie |
|------------|------------|
| Normalna nazwa (≤ ~40 znaków) | Pełny tekst widoczny |
| Długa nazwa (41–200+ znaków) | Jedna linia (desktop) lub max 2 linie (wariant B poniżej) + `…` na końcu |
| Hover / focus | `title` pokazuje pełną wartość `lic.notatka` |
| Bardzo długie słowo bez spacji | `overflow-wrap: anywhere` lub `word-break: break-word` **tylko** w kolumnie notatki (nie w akcjach) |
| Pusty `notatka` | `—` lub `(brak notatki)` — opcjonalnie, nie blokuje fix |

**Wariant ellipsis — 1 linia (prostszy):**

```css
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
```

**Wariant — max 2 linie (czytelniejszy, nowocześniejszy):**

```css
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
```

Rekomendacja: **2 linie + ellipsis** na desktopie — więcej kontekstu bez zjadania akcji.

---

## 6. Minimalny diff (propozycja — nie wdrożony)

### 6.1 CSS — dodać po `#view-admin table { … }`

```css
/* Tabela licencji — layout fix */
#view-admin table.licenses-table {
  table-layout: fixed;
  min-width: 960px; /* wymusza czytelny scroll na mobile */
}

#view-admin .lic-col-key {
  width: 11%;
  white-space: nowrap;
}

#view-admin .lic-col-notatka {
  width: auto; /* reszta w fixed layout */
  max-width: 0; /* trik: pozwala ellipsis w td */
  overflow: hidden;
}

#view-admin .lic-col-notatka .lic-notatka-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  font-weight: 500;
  line-height: 1.35;
}

#view-admin .lic-col-pakiet {
  width: 9%;
  white-space: nowrap;
}

#view-admin .lic-col-status {
  width: 8%;
  text-align: center;
}

#view-admin .lic-col-date {
  width: 12%;
  white-space: nowrap;
  font-size: 11px;
  color: #94a3b8;
}

#view-admin .lic-col-actions {
  width: 340px;
  min-width: 340px;
  vertical-align: middle;
}

#view-admin .lic-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
}

#view-admin .lic-actions .action-btn {
  margin-right: 0; /* gap zamiast margin */
  white-space: nowrap;
  flex-shrink: 0;
}

/* Mobile: sticky kolumna akcji przy scrollu poziomym */
@media (max-width: 899px) {
  #view-admin .lic-col-actions {
    position: sticky;
    right: 0;
    background: #1e293b;
    box-shadow: -4px 0 8px rgba(0, 0, 0, 0.25);
  }
}
```

### 6.2 HTML — statyczny `<thead>` + `<colgroup>`

```html
<div class="licenses-table-wrap" style="overflow-x: auto;">
  <table class="licenses-table">
    <colgroup>
      <col class="lic-col-key">
      <col class="lic-col-notatka">
      <col class="lic-col-pakiet">
      <col class="lic-col-status">
      <col class="lic-col-date">
      <col class="lic-col-date">
      <col class="lic-col-actions">
    </colgroup>
    <thead>
      <tr>
        <th class="lic-col-key">Klucz Licencyjny</th>
        <th class="lic-col-notatka">Organizator / Notatka</th>
        <th class="lic-col-pakiet">Pakiet</th>
        <th class="lic-col-status">Status</th>
        <th class="lic-col-date">Aktywowano</th>
        <th class="lic-col-date">Wygasa</th>
        <th class="lic-col-actions">Zarządzanie / Akcje</th>
      </tr>
    </thead>
    <tbody id="licenses-table-body">…</tbody>
  </table>
</div>
```

*(Skrócony nagłówek ostatniej kolumny opcjonalnie — mniej miejsca na header.)*

### 6.3 JS — fragment wiersza w `initAdminMonitor()`

```javascript
html += `
  <tr>
    <td class="lic-col-key" style="font-family: monospace; font-weight: bold; color: #60a5fa;">${key}</td>
    <td class="lic-col-notatka" title="${escAttr(lic.notatka || '')}">
      <span class="lic-notatka-text">${esc(lic.notatka) || '—'}</span>
    </td>
    <td class="lic-col-pakiet"><code>${lic.typ}</code></td>
    <td class="lic-col-status">${statusBadge}</td>
    <td class="lic-col-date">${actDate}</td>
    <td class="lic-col-date" style="font-weight: bold; color: ${currentStatus==='wygasl'?'#ef4444':'#fff'};">${expDate}</td>
    <td class="lic-col-actions">
      <div class="lic-actions">
        <button class="action-btn act-view" …>👁 PODGLĄD</button>
        …
      </div>
    </td>
  </tr>
`;
```

**Uwaga:** `escAttr()` już istnieje w `index.html` (~linia 1046) — użyć do `title`.

---

## 7. Zachowanie docelowe — podsumowanie

### Desktop (≥ 900 px)

| Element | Zachowanie |
|---------|------------|
| Notatka | Max 2 linie, ellipsis, pełny tekst w `title` |
| Akcje | Min 340 px, flex-end, przyciski nie nachodzą na notatkę |
| Klucz / daty | Bez zawijania (`nowrap`) |
| Tabela | `table-layout: fixed`, proporcje stabilne między wierszami |

### Mobile (< 900 px)

| Element | Zachowanie |
|---------|------------|
| Tabela | Scroll poziomy (`min-width: 960px`) |
| Akcje | **Sticky** po prawej — zawsze widoczne podczas scrollu |
| Notatka | Ellipsis jak na desktopie; pełna nazwa w `title` (long-press na mobile) |
| Przyciski | `flex-wrap: wrap` wewnątrz sticky kolumny — jeśli wąsko, układ 2×2, ale w obrębie kolumny akcji |

### Bardzo długie nazwy (edge cases)

| Przypadek | Oczekiwany efekt |
|----------|------------------|
| 200 znaków + spacje | 2 linie + `…`, reszta w tooltip |
| Jedno długie słowo 80 znaków | `word-break: break-word` w notatce, nadal bez wylewania do akcji |
| Emoji w notatce | Ellipsis działa; `esc()` już sanitizuje HTML |

---

## 8. Co świadomie NIE zmieniamy w tym fixie

- Logika Firebase / `initAdminMonitor()` poza markupiem wiersza
- Teksty przycisków i kolory `.action-btn`
- Sekcja **Centralne Archiwum** (`.archive-item` — osobny layout flex, ten sam problem może wystąpić, ale out of scope)
- Card layout na mobile (Opcja B) — backlog opcjonalny

---

## 9. Kryteria akceptacji (po implementacji)

| # | Test | Oczekiwany wynik |
|---|------|------------------|
| A1 | Notatka 80 znaków | Ellipsis, akcje w pełni klikalne |
| A2 | Notatka 200 znaków | 2 linie + `…`, hover pokazuje pełny tekst |
| A3 | 10 wierszy z różnymi długościami | Kolumna akcji wyrównana, ta sama szerokość |
| A4 | Viewport 375 px | Scroll poziomy OK, sticky akcje widoczne |
| A5 | Viewport 1200 px | Brak horizontal scroll (jeśli content mieści się w 1100 px) |
| A6 | Licencja aktywna (+24H widoczny) | 4 przyciski mieszczą się w kolumnie akcji |
| A7 | Licencja zablokowana (ODBLOKUJ) | Ten sam układ, bez overlap |

---

## 10. Alternatywy rozważone i odrzucone

| Alternatywa | Dlaczego nie jako pierwszy fix |
|-------------|--------------------------------|
| Tylko `overflow-x: scroll` | Nie naprawia czytelności — użytkownik nadal widzi chaos |
| Skrócenie notatki w JS (`substring`) | Utrata danych w UI bez tooltip — gorsze UX |
| Zmniejszenie fontu przycisków | Akcje mniej czytelne; nie rozwiązuje root cause |
| `position: absolute` na akcjach | Kruche w tabeli, problemy z wysokością wiersza |
| Pełny redesign na CSS Grid cards | Większy diff JS, poza „minimal fix” |

---

## 11. Kolejność implementacji (gdy zaakceptowane)

1. CSS — klasy kolumn + `licenses-table`
2. HTML — `colgroup` + klasy w `<thead>`
3. JS — klasy + wrapper `lic-actions` + `title` na notatce
4. Manual QA — checklist §9
5. Opcjonalnie — ten sam wzorzec dla `.archive-item` w archiwum centralnym

---

## Historia dokumentu

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | 2026-07-12 | Analiza root cause + rekomendacja layoutu |

---

*Koniec dokumentu ADMIN_TABLE_LAYOUT_FIX.md*
