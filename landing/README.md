# Turniejomat — landing (turniejomat.pl)

Osobny site Netlify — **nie** deployuj z root repo (to jest app SaaS).

## Netlify — ustawienia site

| Pole | Wartość |
|------|---------|
| **Base directory** | `landing` |
| **Publish directory** | `.` (domyślnie, względem base) |
| **Build command** | *(puste — statyczny HTML)* |
| **Domain** | `turniejomat.pl` + redirect `www` |

Repo: ten sam co aplikacja (`turniejprosaas`), branch `main`.

Po pushu na `main` Netlify powinien sam zdeployować landing, jeśli site ma ustawiony base directory `landing`.

## Checkout (Autopay)

1. Wejdź na https://turniejomat.pl/#cennik
2. Wpisz email → **Zamów pakiet weekendowy**
3. Przekierowanie na bramkę Autopay (test: `testpay.autopay.eu` jeśli skonfigurowane)
4. Po płatności → powrót na stronę skonfigurowaną w panelu Autopay (np. `app.turniejomat.pl/?checkout=success`)
5. Klucz w **admin** → Zamówienia online + Licencje (auto-aktywny po ITN)

Smoke test z CLI (z root repo):

```bash
node scripts/qa-landing-checkout.mjs
```

## Pliki

- `index.html` — strona + `createCheckoutSession`
- `legal/` — regulaminy i polityka prywatności (HTML)
- `_headers` — CSP (Firebase callable, Autopay form-action)
- `netlify.toml` — redirect www → apex
