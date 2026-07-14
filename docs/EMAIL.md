# Email z kluczem licencyjnym — Turniejomat

Po płatności Stripe webhook wywołuje `sendLicenseEmail()` — klient dostaje klucz na adres podany przy checkout.

---

## Rekomendacja: Brevo (darmowy SMTP, działa z Firebase)

O2 / WP / Onet często **blokują** wysyłkę z serwerów chmurowych. **Brevo** (dawniej Sendinblue) ma darmowy plan (~300 maili/dzień) i działa z Cloud Functions.

### 1. Konto Brevo

1. Załóż konto: https://www.brevo.com/
2. **SMTP & API** → **SMTP** → wygeneruj klucz SMTP
3. Zweryfikuj domenę `turniejomat.pl` (DNS: SPF + DKIM) — ważne, żeby maile nie trafiały do spamu

### 2. Konfiguracja Firebase

```powershell
firebase functions:config:set `
  email.smtp_host="smtp-relay.brevo.com" `
  email.smtp_port="587" `
  email.smtp_user="TWOJ_LOGIN_BREVO" `
  email.smtp_pass="TWOJ_KLUCZ_SMTP_BREVO" `
  email.smtp_secure="false" `
  email.from="Turniejomat <noreply@turniejomat.pl>" `
  email.reply_to="admin@turniejomat.pl"
```

Lub skrypt (czyta zmienne środowiskowe):

```powershell
$env:SMTP_HOST="smtp-relay.brevo.com"
$env:SMTP_PORT="587"
$env:SMTP_USER="..."
$env:SMTP_PASS="..."
$env:SMTP_FROM="Turniejomat <noreply@turniejomat.pl>"
node scripts/setup-email-config.mjs
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
firebase functions:config:set `
  email.smtp_host="smtp.o2.pl" `
  email.smtp_port="465" `
  email.smtp_user="admin@turniejomat.pl" `
  email.smtp_pass="HASLO_SKRZYNKI" `
  email.smtp_secure="true" `
  email.from="Turniejomat <admin@turniejomat.pl>"
```

⚠️ O2 może odrzucać połączenia z IP Google Cloud — wtedy użyj Brevo.

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
