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
createCheckoutSession ──► Stripe Checkout
       │
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
| **Billing** | `functions/lib/billing/` | Katalog produktów, Stripe, zamówienia, email |
| **Licensing** | `functions/lib/licensing/` | Klucze, aktywacja, uprawnienia sportowe |
| **Sport** | `index.html` Moduł C | Silnik turnieju (dziś: `APP_SPORT = 'football'`) |

---

## Katalog produktów

Plik: `functions/lib/billing/catalog.js`

| productId | Sport(y) | Czas | Cena |
|-----------|----------|------|------|
| `football-weekend` | football | 72 h | 79 zł |
| `football-month` | football | 30 dni | 149 zł |

Dodanie darta / poola = nowy wpis w katalogu + nowy silnik sportowy — **bez zmiany webhooka**.

---

## Cloud Functions

| Funkcja | Typ | Auth | Opis |
|---------|-----|------|------|
| `createCheckoutSession` | callable | publiczna | `{ productId, email? }` → `{ url, sessionId }` |
| `getProductCatalog` | callable | publiczna | Lista aktywnych produktów (bez sekretów) |
| `paymentWebhook` | HTTPS POST | Stripe signature | Fulfillment po płatności |
| `activateLicense` | callable | admin | Ręczna aktywacja klucza |

### Endpoint webhooka

```
https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook
```

Przelewy24: `?provider=p24` → **501** (placeholder).

---

## Konfiguracja produkcyjna

### Stripe

```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..."
```

Opcjonalnie metody płatności (domyślnie `card,blik` — bez P24 do czasu aktywacji w Stripe Live):

```bash
firebase functions:config:set stripe.payment_method_types="card,blik,p24"
```

P24 w Live: **Stripe Dashboard → Settings → Payment methods → Przelewy24 → Enable**.

Webhook w Stripe Dashboard:
- Zdarzenia: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
- Metadata sesji: `productId` (ustawiane automatycznie przez `createCheckoutSession`)

### Email z kluczem (SMTP)

Szczegóły: **[docs/EMAIL.md](EMAIL.md)** (Brevo — rekomendowane, O2 — alternatywa).

```bash
firebase functions:config:set \
  email.smtp_host="smtp-relay.brevo.com" \
  email.smtp_port="587" \
  email.smtp_user="..." \
  email.smtp_pass="..." \
  email.smtp_secure="false" \
  email.from="Turniejomat <noreply@turniejomat.pl>" \
  email.reply_to="admin@turniejomat.pl"
```

Bez konfiguracji email — webhook nadal wydaje licencję; w adminie widać `Email: BRAK`. Admin może wysłać ręcznie przyciskiem **📧 WYŚLIJ**.

### URL aplikacji (opcjonalnie)

```bash
firebase functions:config:set \
  app.url="https://app.turniejomat.pl" \
  app.landing_url="https://turniejomat.pl"
```

Po zmianie configu:

```bash
cd functions && npm install
firebase deploy --only functions
```

---

## RTDB — ścieżki

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

Licencje bez `sports` (legacy) = traktowane jako `['football']`.

### `zamowienia/{paymentId}`

```javascript
{
  provider: 'stripe',
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
| `landing/index.html` | `createCheckoutSession` — przyciski cennika |
| `index.html` (bramka) | `verifyLicense` + `APP_SPORT` |
| `index.html` (admin) | Monitor `zamowienia/`, generator z `productId` + `sports` |

CSP landing: `connect-src` musi zawierać `https://*.cloudfunctions.net`.

---

## Przepływ zakupu

1. Klient klika „Zamów” na landingu → Stripe Checkout
2. Po opłaceniu webhook → licencja aktywna + wpis w `zamowienia/`
3. Email z kluczem (jeśli SMTP skonfigurowany)
4. Klient wchodzi na `app.turniejomat.pl/?checkout=success` i wpisuje klucz

Fallback: link „zamów mailowo” na landingu.

---

## Test lokalny

```bash
cd functions && npm install
firebase emulators:start --only functions
```

```bash
stripe listen --forward-to http://127.0.0.1:5001/turniejprosaas/europe-west1/paymentWebhook
stripe trigger checkout.session.completed
```

---

## Roadmap multi-sport

1. Dodać produkt w `catalog.js` (np. `dart-weekend`)
2. Dodać `APP_SPORT` / routing do modułu darta
3. Namespace danych: `turnieje_uzytkownikow/{key}/dart/` (przyszłość)

Billing i webhook **bez zmian**.
