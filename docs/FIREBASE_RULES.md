# Firebase RTDB — reguły bezpieczeństwa Turniejomat

**Projekt:** `turniejprosaas`  
**Baza:** `https://turniejprosaas-default-rtdb.europe-west1.firebasedatabase.app`  
**Data:** 2026-07-13

## Pliki w repozytorium

| Plik | Rola |
|------|------|
| `firebase.json` | Konfiguracja CLI — wskazuje na `database.rules.json` |
| `database.rules.json` | **Wariant przejściowy** — wdrożenie teraz (aktywacja klucza z ograniczeniami) |
| `database.rules.strict.json` | **Wariant docelowy** — po Cloud Functions + płatnościach (tylko admin pisze w `licencje`) |

---

## Mapa ścieżek RTDB

```
/
├── licencje/
│   └── {TP-XXXX-XXXX}/          # metadane licencji
│       ├── typ                  # weekend | miesiac | 1-dzien | unlimited
│       ├── status               # nowy | aktywny | zablokowany
│       ├── stworzony
│       ├── aktywowany
│       ├── wygasa
│       └── notatka
│
├── turnieje_uzytkownikow/
│   └── {TP-XXXX-XXXX}/          # stan live turnieju (organizator + kibic)
│       ├── teams, groups, matches, playoffs, settings, logs
│       ├── archiwum/            # kopie lokalne organizatora
│       └── wstrzymane/          # zamrożone sesje
│
└── archiwum/
    └── {-pushId}/               # centralne archiwum serwera (raporty po finale)
        ├── _meta_name, _meta_date
        └── _license_owner       # klucz sędziego
```

### Kto korzysta (dziś)

| Ścieżka | Organizator (`?id=`) | Kibic (`?view=fan&id=`) | Admin (Firebase Auth) |
|---------|----------------------|-------------------------|------------------------|
| `licencje/{key}` | odczyt | odczyt (nagłówek) | lista + CRUD |
| `turnieje_uzytkownikow/{key}` | odczyt + zapis | tylko odczyt | podgląd (deep link) |
| `archiwum/{pushId}` | zapis po finale | odczyt przez link | lista + usuwanie |

**Uwaga:** organizator i kibic **nie logują się** do Firebase Auth — znają tylko klucz w URL. Reguły nie rozróżniają sędziego od kibica; rozróżniają **odczyt vs zapis** oraz **aktywną licencję**.

---

## Logika reguł (skrót)

### Domyślnie: deny all
```json
".read": false,
".write": false
```

### `licencje` — przejściowy (`database.rules.json`)

| Operacja | Reguła |
|----------|--------|
| Lista wszystkich kluczy | tylko `auth.token.admin === true` |
| Odczyt `licencje/{key}` | każdy, kto zna poprawny format klucza `TP-XXXX-XXXX` |
| Zapis admin | tworzenie, blokada, +24h, usuwanie |
| Aktywacja klienta | tylko `status: nowy → aktywny`, bez zmiany `typ`/`notatka`, `wygasa` zgodne z pakietem |

Limity czasu przy aktywacji (bufor 10 min):

| `typ` | Maks. czas od `aktywowany` |
|-------|----------------------------|
| `1-dzien` | 24 h |
| `weekend` | 72 h |
| `miesiac` | 30 dni |
| `unlimited` | 99 lat (legacy) |

### `licencje` — strict (`database.rules.strict.json`)

- Zapis **wyłącznie admin** — aktywacja tylko przez Cloud Function po płatności.

### `turnieje_uzytkownikow/{key}`

| Operacja | Reguła |
|----------|--------|
| Odczyt | poprawny format klucza (fan live — zamierzone) |
| Zapis | licencja istnieje, `status === aktywny`, `wygasa > now` |

Dotyczy: `save()`, reset, archiwum lokalne, wstrzymane, zamrożenie.

### `archiwum/{pushId}`

| Operacja | Reguła |
|----------|--------|
| Lista (`archiwum`) | admin |
| Odczyt pojedynczego raportu | **publiczny** (link `?view=archive&archiveId=`) |
| Nowy wpis (push) | organizator z aktywną licencją + `_license_owner` = jego klucz |
| Usunięcie | admin |

---

## Wdrożenie (Firebase CLI)

### 1. Jednorazowa konfiguracja

```bash
npm install -g firebase-tools
firebase login
firebase use turniejprosaas
```

### 2. Symulacja w konsoli (zalecane przed produkcją)

1. [Firebase Console](https://console.firebase.google.com/) → projekt **turniejprosaas**
2. **Realtime Database** → **Rules** → **Rules playground**
3. Wklej zawartość `database.rules.json`
4. Przetestuj scenariusze z sekcji „Checklist” poniżej

### 3. Deploy reguł

```bash
cd "ścieżka/do/turniejprosaas"
firebase deploy --only database
```

### 4. Po wdrożeniu Cloud Functions (płatności)

```bash
# podmień reguły na strict
cp database.rules.strict.json database.rules.json
firebase deploy --only database
```

Lub w `firebase.json` zmień ścieżkę na `database.rules.strict.json`.

---

## Checklist testów po deploy

Wykonaj w **Rules playground** lub curl (odczyt):

| # | Scenariusz | Oczekiwany wynik |
|---|------------|------------------|
| 1 | `GET /licencje.json?shallow=true` bez auth | **403** Permission denied |
| 2 | `GET /licencje/TP-VALID.json` bez auth | **200** (metadane licencji) |
| 3 | `GET /turnieje_uzytkownikow/TP-VALID.json` bez auth | **200** (fan live) |
| 4 | `PUT /turnieje_uzytkownikow/TP-VALID.json` bez auth, licencja wygasła | **403** |
| 5 | Aktywacja: `nowy → aktywny` z poprawnym `wygasa` | **200** |
| 6 | Aktywacja z `wygasa` = +10 lat przy `typ: weekend` | **403** |
| 7 | Zmiana `typ` przy aktywacji | **403** |
| 8 | Admin: `GET /licencje.json` z tokenem admin | **200** |
| 9 | `GET /archiwum.json?shallow=true` bez auth | **403** |
| 10 | `GET /archiwum/{znany-push-id}.json` bez auth | **200** (link raportu) |
| 11 | Zapis do `archiwum` z `_license_owner` obcego klucza | **403** |

---

## Co się zmienia po deploy przejściowym

| Zachowanie | Przed (luzne reguły) | Po |
|------------|----------------------|-----|
| Enumeracja licencji | zablokowana ✓ | bez zmian ✓ |
| Zapis turnieju przy wygasłej licencji | możliwy ✗ | **zablokowany** ✓ |
| Zapis przy `status: zablokowany` | możliwy ✗ | **zablokowany** ✓ |
| Samodzielne przedłużenie licencji | możliwe ✗ | **zablokowane** (tylko admin) |
| Aktywacja z fałszywym `wygasa` | możliwa ✗ | **ograniczona do pakietu** ✓ |
| Odczyt turnieju po znajomości klucza | tak | **nadal tak** (fan live) |

Aplikacja **nie wymaga zmian w kodzie** przy wariancie przejściowym — `verifyLicense()` nadal działa.

---

## Świadome kompromisy (do Fazy 2)

1. **Klucz = bearer token** — kto zna `TP-XXXX-XXXX`, czyta turniej. To zamierzone dla QR kibica; nie da się tego naprawić samymi regułami bez auth organizatora.
2. **Link archiwum** — `archiwum/{pushId}` jest publiczny przy znajomości ID. Push ID jest trudny do zgadnięcia, ale nie jest secret jak klucz.
3. **Aktywacja w przeglądarce** (wariant przejściowy) — nadal możliwa bez płatności, ale z limitami czasu. Docelowo: `database.rules.strict.json` + Cloud Function po Stripe/Przelewy24.

---

## Następny krok (punkt 2 z audytu)

Cloud Function `activateLicense`:

```
POST /webhook/payment → verify → admin SDK → licencje/{key}.update({ status, aktywowany, wygasa })
```

Następnie przełączenie na `database.rules.strict.json` i usunięcie aktywacji z `verifyLicense()` w `index.html`.

---

## Rollback awaryjny

W Firebase Console → Realtime Database → Rules → przywróć poprzednią wersję z historii (Rules history) lub tymczasowo:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "licencje": { "$key": { ".read": true, ".write": true } },
    "turnieje_uzytkownikow": { "$key": { ".read": true, ".write": true } },
    "archiwum": { ".read": true, ".write": true }
  }
}
```

**Nie używaj** powyższego na produkcji — tylko awaryjny rollback.
