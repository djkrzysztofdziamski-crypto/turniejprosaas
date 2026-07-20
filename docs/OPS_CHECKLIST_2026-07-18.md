# Ops checklista — 2026-07-18

Deploy fixów + Autopay ręcznie + SEO/FB poza kodem.  
Agent wykonał części automatyczne; kroki z logowaniem (Autopay / Meta / GSC / Netlify) — Ty.

---

## Tor 1 — Deploy (ZAMKNIĘTY)

| # | Status | Notatka |
|---|--------|---------|
| D1 | DONE | `main` = `origin/main` @ `c3fb43f` |
| D2 | DONE | Prod już serwuje fixy (brak `NETLIFY_AUTH_TOKEN` w env — redeploy niepotrzebny) |
| D3 | N/A | Cache nie blokował |
| D4 | DONE | 5/5 smoke PASS na `TP-QDJL-CTW5` |
| D5 | DONE | Audyt: 141/150 PASS — szczegóły w `docs/AUDIT_TP-QDJL-CTW5_2026-07-18.md` |

---

## Tor 2 — Autopay (ZAMKNIĘTY — odhaczone przez użytkownika 2026-07-18)

| # | Status | Notatka |
|---|--------|---------|
| A1 | DONE | ITN URL w panelu Autopay |
| A2 | DONE | Adres powrotu `dziekujemy.html` |
| A3 | POMINIĘTY | Functions — bez potrzeby redeployu |
| A4 | DONE | `qa-autopay-hash` + `qa-autopay-itn` PASS |
| A5 | DONE | Potwierdzone przez użytkownika (OK) |
| A6 | DONE | Ten dokument |

Źródło: `docs/PAYMENTS.md`.

---

## Tor 3 — FB + SEO ops (PAKIET GOTOWY — odhaczasz Ty)

**Pakiet do wklejenia:** [`docs/TOR3_FB_SEO_EXECUTE.md`](TOR3_FB_SEO_EXECUTE.md)  
**Lista soft launch:** [`docs/TOR3_SOFT_LAUNCH_KONTAKTY.csv`](TOR3_SOFT_LAUNCH_KONTAKTY.csv)  
Źródło strategii: `docs/FACEBOOK_TURNIEJOMAT_A_Z.md`, `docs/SEO_TURNIEJOMAT.md`.

Agent **nie może** zalogować się do Meta / GSC / DNS — wszystkie teksty, bio, 5 postów, Messenger, GSC i soft launch są w pakiecie.

### 3a Facebook / Instagram

| # | Krok | Odznacz |
|---|------|--------|
| F0 | 2FA + avatar/cover (instrukcja w pakiecie) | [ ] |
| F1 | Facebook Page Turniejomat + bio/CTA | [ ] |
| F2 | Business Portfolio `admin@turniejomat.pl` | [ ] |
| F3 | IG Professional + link z Page | [ ] |
| F4 | 5 postów z pakietu (pin Post 1) | [ ] |
| F5 | Bez Business Verification / dużych Ads | — |

Po F1/F3 wpisz URL Page/IG w pakiecie albo w chacie → PR linków w stopce landingu.

### 3b SEO ops

| # | Krok | Status | Odznacz |
|---|------|--------|--------|
| S1 | GSC domena `turniejomat.pl` (DNS TXT) — kroki w pakiecie | Ty | [ ] |
| S2 | Sitemap + Request indexing | **FOLLOW-UP** po PR SEO Faza A | zablokowane |
| S3 | Soft launch: CSV + wiadomość w pakiecie; wysyłka po F4 | Ty | [ ] |
| S4 | Główna własność GSC = landing | Zasada | — |

---

## Szybkie linki

| Co | URL |
|----|-----|
| App | https://app.turniejomat.pl |
| Landing | https://turniejomat.pl |
| Admin | https://admin.turniejomat.pl |
| Demo | https://demo.turniejomat.pl |
| ITN | https://europe-west1-turniejprosaas.cloudfunctions.net/paymentWebhook?provider=autopay |
| GSC | https://search.google.com/search-console |
| Meta Pages | https://www.facebook.com/pages/create |
| Business Portfolio | https://business.facebook.com |
