# Płatności i moduł Billing — Turniejomat

**Projekt:** `turniejprosaas`  
**Region funkcji:** `europe-west1`

Moduł **billing** jest samodzielny — nie zna logiki turniejów (piłka, dart, pool). Zna tylko **katalog produktów** i wydaje **licencje** przez moduł **licensing**.

---

## Architektura modułów

```
landing (checkout)
       │
       ▼
createCheckoutSession ──► Autopay (POST redirect)  [domyślnie]
       │                  lub Stripe Checkout [legacy]
       ▼
paymentWebhook ──► billing/fulfillOrder()
       │                  │
       │                  ├── licensing/issue (klucz + sports + productId)
       │                  ├── zamowienia/{paymentId}
       │                  └── billing/email (klucz na email)
       ▼
app.turniejomat.pl — verifyLicense() + APP_SPORT gate
```

| Moduł | Ścieżka w repo | Odpowiedzialność |
|-------|----------------|------------------|
| **Billing** | `functions/lib/billing/` | Katalog produktów, Autopay/Stripe, zamówienia, email |
| **Licensing** | `functions/lib/licensing/` | Klucze, aktywacja, uprawnienia sportowe |
| **Sport** | `index.html` Moduł C | Silnik turnieju (dziś: `APP_SPORT = 'football'`) |

---

## Katalog produktów

Plik: `functions/lib/billing/catalog.js`

| productId | Sport(y) | Czas | Cena |
|-----------|----------|------|------|
| `football-weekend` | football | 72 h | 79 zł |
| `football-month` | football | 30 dni | 149 zł | Pakiet miesięczny |

Dodanie darta / poola = nowy wpis w katalogu + nowy silnik sportowy — **bez zmiany webhooka**.

---

## Cloud Functions

| Funkcja | Typ | Auth | Opis |
|---------|-----|------|------|
| `createCheckoutSession` | callable | publiczna | `{ productId, email? }` → Autopay `{ provider, method, url, fields }` lub Stripe `{ url, sessionId }` |
| `getProductCatalog` | callable | publiczna | Lista aktywnych produktów (bez sekretów) |
| `paymentWebhook` | HTTPS POST | ITN hash / Stripe signature | Fulfillment po płatności |
| `activateLicense` | callable | admin | Ręczna aktywacja klucza |

### Endpoint ITN / webhooka

**Autopay (produkcja):**

```
https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook?provider=autopay
```

Skonfiguruj ten adres w panelu Autopay jako **ITN** (Instant Transaction Notification).

**Stripe (legacy):** ten sam URL bez parametru — wykrywany po nagłówku `stripe-signature`.

Przelewy24 bezpośrednio: `?provider=p24` → **501** (użyj Autopay — obsługuje BLIK i przelewy).

---

## Konfiguracja produkcyjna

> **Od 2026:** zamiast `firebase functions:config:set` używamy **Secret Manager** + pliku `functions/.env.turniejprosaas` (parametry `defineString` / `defineSecret`).

### Autopay (domyślny provider)

```powershell
$env:AUTOPAY_SERVICE_ID="123456"
$env:AUTOPAY_SHARED_KEY="..."
# test: $env:AUTOPAY_GATEWAY_URL="https://testpay.autopay.eu"
node scripts/setup-autopay-config.mjs
```

Ręcznie:

```bash
firebase functions:secrets:set AUTOPAY_SHARED_KEY
```

W `functions/.env.turniejprosaas`:

```
PAYMENT_PROVIDER=autopay
AUTOPAY_SERVICE_ID=123456
AUTOPAY_GATEWAY_URL=https://pay.autopay.eu/payment
```

Test hash (przykład z dokumentacji Autopay):

```bash
node scripts/qa-autopay-hash.mjs
```

**Przepływ Autopay:**
1. `createCheckoutSession` → hash startu + zapis `platnosci_oczekujace/{orderId}`
2. Landing auto-submit POST na bramkę (`pay.autopay.eu/payment` / `testpay.autopay.eu/payment`)
3. Po płatności Autopay wysyła ITN (POST `transactions` = base64 XML)
4. Funkcja weryfikuje hash (serviceID + hash z `<transactionList>`), wywołuje `fulfillOrder`, odpowiada XML `confirmationList` / `transactionsConfirmations` / `CONFIRMED`

Hash startu (minimalny): `SHA256(ServiceID|OrderID|Amount|klucz)`  
Z opcjonalnymi polami (Description, Currency, CustomerEmail) — w kolejności numeracji pól w dokumentacji Autopay.

`Description` jest sanityzowane do znaków dozwolonych przez Autopay (A–Z, cyfry, `.` `:` `-` `,` spacja).

Odpowiedź ITN (wymagana struktura):

```xml
<confirmationList>
  <serviceID>…</serviceID>
  <transactionsConfirmations>
    <transactionConfirmed>
      <orderID>…</orderID>
      <confirmation>CONFIRMED</confirmation>
    </transactionConfirmed>
  </transactionsConfirmations>
  <hash>…</hash>
</confirmationList>
```

Lokalny test: `node scripts/qa-autopay-itn.mjs`

### Stripe (legacy, opcjonalnie)

Ustaw `PAYMENT_PROVIDER=stripe` w `.env.turniejprosaas`.

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Webhook w Stripe Dashboard:
- Zdarzenia: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`

### Email z kluczem (SMTP)

Szczegóły: **[docs/EMAIL.md](EMAIL.md)**.

Hasło SMTP → secret `SMTP_PASS`. Bez konfiguracji email — webhook nadal wydaje licencję; w adminie widać `Email: BRAK`.

### URL aplikacji (opcjonalnie)

```
APP_URL=https://app.turniejomat.pl
APP_LANDING_URL=https://turniejomat.pl
```

Po zmianie parametrów:

```bash
cd functions && npm install
firebase deploy --only functions
```

---

## RTDB — ścieżki

### `platnosci_oczekujace/{orderId}`

Tymczasowy stan checkoutu Autopay (zapis/odczyt tylko Admin SDK).

### `licencje/{TP-XXXX-XXXX}`

```javascript
{
  typ: 'weekend',
  productId: 'football-weekend',
  sports: ['football'],
  status: 'aktywny',
  stworzony, aktywowany, wygasa, notatka
}
```

### `zamowienia/{paymentId}`

```javascript
{
  provider: 'autopay',
  paymentId, licenseKey, productId, typ, sports,
  status: 'completed', createdAt, notatka,
  customerEmail, emailSent, emailError
}
```

- Odczyt: admin (`auth.token.admin`)
- Zapis: tylko Admin SDK (Cloud Functions)

---

## Frontend

| Miejsce | Integracja |
|---------|------------|
| `landing/index.html` | `createCheckoutSession` → auto-submit form POST (Autopay) lub redirect (Stripe) |
| `index.html` (bramka) | `verifyLicense` + `APP_SPORT` |
| `index.html` (admin) | Monitor `zamowienia/`, generator z `productId` + `sports` |

CSP landing: `connect-src` musi zawierać `https://*.cloudfunctions.net`. Form POST wychodzi na domenę Autopay (bez wpisu w CSP).

---

## Przepływ zakupu

1. Klient klika „Zamów” na landingu → bramka Autopay (BLIK / przelew / karta)
2. ITN → licencja aktywna + wpis w `zamowienia/`
3. Email z kluczem (jeśli SMTP skonfigurowany)
4. Klient wraca na stronę powrotu Autopay → `https://turniejomat.pl/dziekujemy.html`
   (legacy: `app.turniejomat.pl/?checkout=success` przekierowuje na stronę podziękowania)

Fallback: link „zamów mailowo” na landingu.

---

## Test lokalny

```bash
node scripts/qa-autopay-hash.mjs
node scripts/qa-landing-checkout.mjs
```

Emulator + Stripe (legacy):

```bash
cd functions && firebase emulators:start --only functions
stripe listen --forward-to http://127.0.0.1:5001/turniejprosaas/europe-west1/paymentWebhook
```

---

## Roadmap multi-sport

1. Dodać produkt w `catalog.js` (np. `dart-weekend`)
2. Dodać `APP_SPORT` / routing do modułu darta
3. Namespace danych: `turnieje_uzytkownikow/{key}/dart/` (przyszłość)

Billing i webhook **bez zmian**.
