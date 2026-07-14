# Płatności online — Stripe i Przelewy24

**Projekt:** `turniejprosaas`  
**Region funkcji:** `europe-west1`

## Architektura

```
Klient (landing / Stripe Checkout)
        │
        ▼
Stripe webhook ──POST──► paymentWebhook (Cloud Function)
        │                      │
        │                      ├── createAndActivateLicense()
        │                      ├── licencje/{TP-XXXX-XXXX}
        │                      └── zamowienia/{sessionId}
        ▼
Klient wpisuje klucz na bramce app.turniejomat.pl
```

Panel admina aktywuje istniejące klucze przez **callable** `activateLicense` (nie zapisuje `status: aktywny` bezpośrednio w RTDB).

---

## Endpoint webhooka

```
https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook
```

| Parametr | Wartość |
|----------|---------|
| Metoda | `POST` |
| Provider domyślny | Stripe |
| Przelewy24 | `?provider=p24` — **501 Not Implemented** (placeholder) |

---

## Stripe — konfiguracja

### 1. Sekrety w Firebase Functions

```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..."
```

Po zmianie configu:

```bash
cd functions && npm install
firebase deploy --only functions
```

### 2. Webhook w Stripe Dashboard

1. **Developers → Webhooks → Add endpoint**
2. URL: endpoint powyżej
3. Zdarzenie: `checkout.session.completed`
4. Skopiuj **Signing secret** (`whsec_...`) do configu

### 3. Stripe Checkout — metadata

Przy tworzeniu sesji Checkout ustaw metadata:

| Klucz | Wartość |
|-------|---------|
| `package` | `weekend` lub `miesiac` |

Przykład (Node.js):

```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  customer_email: email,
  line_items: [{ price: 'price_...', quantity: 1 }],
  success_url: 'https://app.turniejomat.pl/?paid=1',
  cancel_url: 'https://turniejomat.pl/#cennik',
  metadata: { package: 'weekend' },
});
```

Po opłaceniu funkcja:
- generuje klucz `TP-XXXX-XXXX`,
- aktywuje licencję (pakiet weekend = 72 h, miesiąc = 30 dni),
- zapisuje wpis w `zamowienia/{session.id}` (idempotencja — powtórny webhook nie tworzy duplikatu).

### 4. Powiadomienie klienta

Obecnie klucz trafia tylko do RTDB. Kolejny krok produktowy:
- email z kluczem (SendGrid / Resend / Firebase Extension),
- lub przekierowanie na stronę z kluczem po `success_url` + odczyt z backendu.

---

## Przelewy24 — plan integracji

Endpoint zwraca `501` z komunikatem. Kroki do wdrożenia:

1. `firebase functions:config:set p24.merchant_id="..." p24.pos_id="..." p24.crc="..." p24.sandbox="true"`
2. W `paymentWebhook` — gałąź `provider=p24`:
   - weryfikacja sygnatury CRC,
   - mapowanie `sessionId` / `orderId` na pakiet,
   - wywołanie `createAndActivateLicense()` z `source: 'p24'`.
3. Webhook URL w panelu P24:  
   `https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook?provider=p24`

---

## RTDB — ścieżka `zamowienia`

```
zamowienia/
  └── {paymentId}/
      ├── provider      # stripe | p24
      ├── paymentId
      ├── licenseKey
      ├── typ           # weekend | miesiac
      ├── status        # completed
      ├── createdAt     # timestamp ms
      └── notatka       # np. "Stripe: user@email.com"
```

- **Odczyt:** tylko admin (`auth.token.admin === true`)
- **Zapis:** tylko Admin SDK (Cloud Functions) — reguły `.write: false` dla klientów

---

## Panel admina — aktywacja ręczna

Zalogowany admin wywołuje:

```javascript
firebase.app().functions('europe-west1').httpsCallable('activateLicense')({ key: 'TP-XXXX-XXXX' })
```

Wymaga custom claim `admin: true` na koncie Firebase Auth.

---

## Test lokalny (emulator)

```bash
cd functions
npm install
firebase emulators:start --only functions
```

Stripe CLI do testów webhooka:

```bash
stripe listen --forward-to http://127.0.0.1:5001/turniejprosaas/europe-west1/paymentWebhook
stripe trigger checkout.session.completed
```

---

## Checklist wdrożenia produkcyjnego

- [ ] `stripe.secret_key` i `stripe.webhook_secret` w Functions config
- [ ] `firebase deploy --only functions,database`
- [ ] Webhook Stripe wskazuje na URL produkcyjny
- [ ] CSP (`_headers`) zawiera `https://*.cloudfunctions.net` w `connect-src`
- [ ] Checkout na landingu z poprawnym `metadata.package`
- [ ] Proces wysyłki klucza do klienta po płatności
