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

## SETKA (dystrybucja)

| Link | URL |
|------|-----|
| Hub bio | https://turniejomat.pl/start |
| Zakup | https://turniejomat.pl/setka.html |
| Gra | https://setka.turniejomat.pl/ |

Teksty FB/bio: repo SETKA → `tools/DYSTRYBUCJA.md`.

## Checkout (Autopay)

1. Wejdź na https://turniejomat.pl/#cennik
2. Wpisz email → **Zamów pakiet weekendowy**
3. Przekierowanie na bramkę Autopay (test: `testpay.autopay.eu` jeśli skonfigurowane)
4. Po płatności → powrót na `https://turniejomat.pl/dziekujemy.html` (ustaw w panelu Autopay jako adres powrotu)
5. Hub `/dziekujemy.html` rozpoznaje produkt (`getCheckoutStatus`): SETKA → redirect na `/setka-dziekujemy.html?OrderID=…`; Turniejomat → UI TP (mail z kluczem)
6. Klucz w **admin** → Zamówienia online + Licencje (auto-aktywny po ITN)

Smoke test z CLI (z root repo):

```bash
node scripts/qa-landing-checkout.mjs
```

## Pliki

- `index.html` — strona + `createCheckoutSession`
- `legal/` — regulaminy i polityka prywatności (HTML)
- `_headers` — CSP (Firebase callable, Autopay form-action)
- `netlify.toml` — redirect www → apex
