# Firebase RTDB — reguły bezpieczeństwa Turniejomat

**Projekt:** `turniejprosaas`  
**Baza:** `https://turniejprosaas-default-rtdb.europe-west1.firebasedatabase.app`  
**Data:** 2026-07-13

## Pliki w repozytorium

| Plik | Rola |
|------|------|
| `firebase.json` | Konfiguracja CLI — wskazuje na `database.rules.json` |
| `database.rules.json` | **Wariant strict (aktywny)** — tylko admin pisze w `licencje` |
| `database.rules.transitional.json` | Archiwum — aktywacja klienta z ograniczeniami (2026-07-13) |
| `database.rules.strict.json` | Kopia strict (identyczna z `database.rules.json`) |

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

### `licencje` — strict (`database.rules.json`, od 2026-07-14)

- Zapis **wyłącznie admin** (Firebase Auth + `admin` claim) lub Cloud Function z Admin SDK.
- Klient **nie może** aktywować klucza `nowy → aktywny` — aktywacja w panelu admina lub przez `activateLicense` (Functions).

### `licencje` — transitional (`database.rules.transitional.json`, archiwum)

- Aktywacja klienta z limitami czasu pakietu — **wyłączone** po wdrożeniu strict.

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

### 4. Cloud Functions (opcjonalnie, przed płatnościami)

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

Funkcje: `activateLicense` (callable, admin), `paymentWebhook` (placeholder 501).

---

## Checklist testów po deploy

Wykonaj w **Rules playground** lub `node scripts/qa-firebase-rules-smoke.mjs`:

| # | Scenariusz | Oczekiwany wynik |
|---|------------|------------------|
| 1 | `GET /licencje.json?shallow=true` bez auth | **403** Permission denied |
| 2 | `GET /licencje/TP-VALID.json` bez auth | **200** (metadane licencji) |
| 3 | `GET /turnieje_uzytkownikow/TP-VALID.json` bez auth | **200** (fan live) |
| 4 | `PUT /turnieje_uzytkownikow/TP-VALID.json` bez auth, licencja wygasła | **403** |
| 5 | Klient: `PATCH licencje/TP-XXX` aktywacja | **403** (strict) |
| 6 | Admin: `GET /licencje.json` z tokenem admin | **200** |
| 7 | `GET /archiwum.json?shallow=true` bez auth | **403** |
| 8 | `GET /archiwum/{push-id}.json` bez auth | **200** (link raportu) |
| 9 | Bramka: klucz `nowy` bez aktywacji admina | komunikat „oczekuje na aktywację” |
| 10 | Admin: przycisk **AKTYWUJ** / checkbox przy tworzeniu | **200** |

---

## Co się zmienia po deploy strict (2026-07-14)

| Zachowanie | Przed | Po |
|------------|-------|-----|
| Aktywacja klucza z bramki | klient sam aktywował | **tylko admin** |
| Enumeracja licencji | zablokowana | bez zmian |
| Zapis turnieju przy wygasłej licencji | zablokowany | bez zmian |
| Fan live po kluczu | tak | bez zmian |

`verifyLicense()` — tylko wejście dla już aktywnych kluczy. Nowe klucze: admin **AKTYWUJ** lub checkbox „Aktywuj od razu”.

---

## Świadome kompromisy (Faza 2 — płatności)

1. **Klucz = bearer token** — kto zna `TP-XXXX-XXXX`, czyta turniej (fan live).
2. **Link archiwum** — publiczny przy znajomości push ID.
3. **Aktywacja manualna** — do czasu webhooka płatności admin aktywuje klucze ręcznie (bezpieczne, ale nie skalowalne).

---

## Następny krok — moduł płatności

1. Stripe / Przelewy24 checkout na landingu
2. `paymentWebhook` → weryfikacja podpisu → `licencje/{key}.update(...)` przez Admin SDK
3. Opcjonalnie: panel admin — lista zamówień

Scaffold Functions: `functions/index.js` (`activateLicense`, `paymentWebhook`).

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
