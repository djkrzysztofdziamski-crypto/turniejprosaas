# Email z kluczem licencyjnym — Turniejomat

Po płatności Stripe webhook wywołuje `sendLicenseEmail()` — klient dostaje klucz na adres podany przy checkout.

---

## Rekomendacja: Brevo (darmowy SMTP, działa z Firebase)

O2 / WP / Onet często **blokują** wysyłkę z serwerów chmurowych. **Brevo** (dawniej Sendinblue) ma darmowy plan (~300 maili/dzień) i działa z Cloud Functions.

### 1. Konto Brevo

1. Załóż konto: https://www.brevo.com/
2. **SMTP & API** → **SMTP** → wygeneruj klucz SMTP
3. Zweryfikuj domenę `turniejomat.pl` (DNS: SPF + DKIM) — ważne, żeby maile nie trafiały do spamu

### 2. Konfiguracja Firebase (params + Secret Manager)

Hasło SMTP jako secret; pozostałe pola w `functions/.env.turniejprosaas`:

```powershell
$env:SMTP_HOST="smtp-relay.brevo.com"
$env:SMTP_PORT="587"
$env:SMTP_USER="TWOJ_LOGIN_BREVO"
$env:SMTP_PASS="TWOJ_KLUCZ_SMTP_BREVO"
$env:SMTP_SECURE="false"
$env:SMTP_FROM="Turniejomat <noreply@turniejomat.pl>"
$env:SMTP_REPLY_TO="admin@turniejomat.pl"
node scripts/setup-email-config.mjs
```

Migracja ze starego `functions:config`:

```bash
node scripts/migrate-functions-config-to-secrets.mjs
```

### 3. Deploy funkcji

```bash
cd functions && npm install
firebase deploy --only functions
```

### 4. Test

1. **Admin** → przycisk **📧 TEST SMTP** (weryfikuje połączenie)
2. W **Zamówienia online** → **📧 WYŚLIJ** przy zamówieniu z emailem
3. Albo nowa płatność testowa na landingu

---

## Alternatywa: skrzynka O2 (mniej pewne)

| Parametr | Wartość |
|----------|---------|
| Host | `smtp.o2.pl` |
| Port | `465` (SSL) lub `587` |
| User | pełny adres, np. `admin@turniejomat.pl` |
| Secure | `true` dla 465 |

```powershell
$env:SMTP_HOST="smtp.o2.pl"
$env:SMTP_PORT="465"
$env:SMTP_USER="admin@turniejomat.pl"
$env:SMTP_PASS="HASLO_SKRZYNKI"
$env:SMTP_SECURE="true"
$env:SMTP_FROM="Turniejomat <admin@turniejomat.pl>"
node scripts/setup-email-config.mjs
```

⚠️ O2 może odrzucać połączenia z IP Google Cloud — wtedy użyj Brevo.

---

## Hosti24.pl (admin@turniejomat.pl)

Jeśli skrzynka jest u **Hosti24** (np. `admin@turniejomat.pl`):

| Parametr | Wartość |
|----------|---------|
| Host | `mx.hosti24.pl` |
| Port | `465` |
| Szyfrowanie | SSL/TLS (`smtp_secure=true`) |
| User | pełny email, np. `admin@turniejomat.pl` |
| Hasło | z panelu Hosti24 (Poczta → konto) |

```powershell
$env:SMTP_HOST="mx.hosti24.pl"
$env:SMTP_PORT="465"
$env:SMTP_USER="admin@turniejomat.pl"
$env:SMTP_PASS="HASLO_Z_PANELU_HOSTI24"
$env:SMTP_SECURE="true"
$env:SMTP_FROM="Turniejomat <admin@turniejomat.pl>"
$env:SMTP_REPLY_TO="admin@turniejomat.pl"
node scripts/setup-email-config.mjs
firebase deploy --only functions
```

Potem: **Admin → 📧 TEST SMTP**. Jeśli OK — **📧 WYŚLIJ** przy zamówieniu lub nowa płatność testowa.

Źródło: [hosti24.pl — konfiguracja poczty](https://www.hosti24.pl/pomoc/microsoft-outlook-konfiguracja-konta-e-mail)

---

## Co jest w mailu

- Klucz licencyjny (np. `TP-XXXX-XXXX`)
- Data ważności
- Link bezpośredni: `https://app.turniejomat.pl/?id=KLUCZ`
- Reply-To: `admin@turniejomat.pl`

---

## Admin — ponowna wysyłka

W **Zamówienia online** kolumna **Email wysłany**:
- **WYSŁANO** / **BRAK** + przyczyna błędu
- Przycisk **📧 WYŚLIJ** — callable `resendOrderEmail` (tylko admin)

---

## RTDB — pola zamówienia

```javascript
{
  customerEmail: "klient@example.com",
  emailSent: true,
  emailError: null,
  emailSentAt: 1784027199653
}
```

Bez SMTP: `emailSent: false`, `emailError: "not_configured"`.
