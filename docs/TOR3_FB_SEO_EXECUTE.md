# Tor 3 — pakiet do odhaczenia (FB + SEO ops)

**Data:** 2026-07-18  
**Cel:** wszystko gotowe do wklejenia; Ty tylko logujesz się do Meta / GSC / rejestratora DNS.  
**NDG:** Page + IG + Portfolio OK; bez Business Verification i dużych Ads.

Kolejność: **F0 → F1 → F2 → F3 → F4** → potem soft launch (S3). Równolegle: **S1** (GSC).

---

## F0 — Assety i 2FA (5–10 min)

1. Profil prywatny FB (Twój) → Ustawienia → Bezpieczeństwo → **2FA** (aplikacja Authenticator, nie SMS).
2. Avatar Page/IG: `landing/logo.webp` na tle navy `#0b1f33`, kwadrat **320×320** (min. 180×180).
3. Cover FB: **820×312** — hasło na środku (bezpieczna strefa):  
   *Spokój organizatora w dniu turnieju* · `turniejomat.pl`
4. Avatar IG: ten sam kwadrat co Page.

Narzędzie: Canva / Photopea — wklej logo, tło `#0b1f33`.

---

## F1 — Facebook Page (dzień 1)

1. Otwórz: https://www.facebook.com/pages/create  
2. Nazwa: **Turniejomat**  
3. Kategoria: *Oprogramowanie* / *Usługa biznesowa* / *Sport*  
4. Wypełnij:

| Pole | Wartość |
|------|---------|
| WWW | `https://turniejomat.pl` |
| E-mail | `admin@turniejomat.pl` |
| Telefon | `+48 517 246 034` |
| CTA | „Dowiedz się więcej” → `https://turniejomat.pl` (lub demo: `https://demo.turniejomat.pl`) |
| Username | `turniejomat` (jeśli wolny; wariant: `turniejomat.pl`) |

**Bio (wklej):**

```
Koniec z chaosem w dniu turnieju. Wyniki live dla rodziców, tabele i podium po finale. Hala, orlik, boisko szkolne. Demo 2 min → turniejomat.pl
```

5. Wiadomości: **włączone**. Kraj PL, język PL.  
6. **Nie** udostępniaj Page znajomym, dopóki nie ma 3–5 postów (F4).

Po utworzeniu zapisz URL Page tutaj:  
`facebook.com/________________`  

---

## F2 — Meta Business Portfolio

1. https://business.facebook.com → utwórz Portfolio **Turniejomat**  
2. E-mail biznesowy: `admin@turniejomat.pl` → potwierdź link  
3. Accounts → Pages → dodaj / przejmij Page  
4. Security Center → **wymagaj 2FA** dla wszystkich  
5. Ad Account: utwórz (PLN, PL, Europe/Warsaw) — bez budżetu na start  
6. Nie dodawaj zewnętrznych Adminów

---

## F3 — Instagram Professional

1. Konto `@turniejomat` (lub wolny wariant) → Konto profesjonalne → **Firma**  
2. Połącz z Facebook Page (Ustawienia IG / Meta Business Suite)  
3. Bio IG (wklej):

```
Spokój w dniu turnieju ⚽
Wyniki live · tabele · podium
Demo 2 min ↓
```

Link w bio: `https://turniejomat.pl`  
4. Inbox: FB + IG w Meta Business Suite

Po utworzeniu zapisz:  
`instagram.com/________________`  

---

## F4 — 5 postów startowych (wklej kolejno, dzień 2–3)

Publikuj jako **Page**, nie z profilu prywatnego. Pierwszy wyróżnij (pin).

### Post 1 — O nas (PIN)

```
Koniec z chaosem w dniu turnieju.

Turniejomat to spokój organizatora: wyniki na żywo dla rodziców, tabele i podium zaraz po finale. Hala, orlik, boisko szkolne — bez Excela i grup WhatsApp „jaki wynik?”.

Sprawdź demo w 2 minuty:
https://demo.turniejomat.pl

Więcej: https://turniejomat.pl
```

### Post 2 — Problem rodziców

```
„Jaki wynik?” × 40 wiadomości w trakcie turnieju.

Rodzice i zawodnicy dostają QR → widok kibica na żywo. Ty sędziujesz. Oni wiedzą.

Demo: https://demo.turniejomat.pl
```

### Post 3 — Podium i strzelcy

```
Finał wpisany → podium i król strzelców same.

Bez przepisywania tabel do Canvy o 22:00.

Zobacz na demo (Finał → Podium):
https://demo.turniejomat.pl
```

### Post 4 — Cena

```
Weekend turniejowy: 79 zł.
Od 2 turniejów w miesiącu: 149 zł / miesiąc.

Często mniej niż wpisowe jednej drużyny — a spokój całego dnia.

Cennik: https://turniejomat.pl#cennik
```

### Post 5 — CTA demo

```
2 minuty. Memoriał, 16 drużyn, finał, podium.

Wejdź i kliknij — bez rejestracji:
https://demo.turniejomat.pl

Pytania? Napisz na Page albo +48 517 246 034
```

**Częstotliwość potem:** ~3 posty/tydzień + Stories (QR, screen hali, przed/po).

---

## F5 — Czego nie robić

- Nie buduj marki na profilu prywatnym  
- Nie wymuszaj Business Verification przy NDG  
- Nie odpalaj dużych Ads na start  
- Nie obiecuj w postach funkcji, których nie ma na prod  

---

## S1 — Google Search Console (równolegle)

1. Wejdź: https://search.google.com/search-console  
2. Dodaj właściwość: **Domena** → `turniejomat.pl` (nie tylko URL-prefix `https://`)  
3. Skopiuj rekord **TXT** (typu `google-site-verification=…`)  
4. U rejestratora DNS domeny dodaj TXT na `@` / root  
5. W GSC → **Zweryfikuj** (DNS bywa 5 min – 48 h)  
6. Po weryfikacji: **nie** dodawaj app/demo/admin jako głównej własności produktu  

**S2 (sitemap / Request indexing):** zablokowane do PR SEO Faza A (`landing/robots.txt` + `sitemap.xml`). Po PR: GSC → Sitemaps → `https://turniejomat.pl/sitemap.xml` → Request indexing URL `/`.

---

## S3 — Soft launch (po F4)

### Wiadomość (WhatsApp / Messenger / SMS) — wklej

```
Cześć! Odpalam Turniejomat — wyniki live + tabele + podium dla turniejów halowych.

Jak masz 2 minuty, kliknij demo (bez rejestracji):
https://demo.turniejomat.pl

Gdy robisz turniej w najbliższych weekendach — daj znać, chętnie pomogę odpalić.
```

### Post FB — zaproszenie beta testerów (wklej)

**Format:** post z linkiem (karta podglądu jest klikalna). Najpierw wklej URL, poczekaj na kartę, potem dopisz tekst.  
**URL karty (beta):** `https://demo.turniejomat.pl` (demostory).  
**Inne URL z tą samą kartą OG (po deployu):** `https://app.turniejomat.pl` · `https://turniejomat.pl` (landing ma własne `og-share.png`).  
**Assety:** root `og-share.png` + `fb-beta-1080.png` (app/demo/admin); `landing/og-share.png` + `landing/fb-beta-1080.png`.  
**Po deployu:** [Sharing Debugger](https://developers.facebook.com/tools/debug/) → scrapuj kolejno `demo` / `app` / `turniejomat.pl`.

```
Szukam beta testerów Turniejomat 👋

Po większości testów wewnętrznych otwieram dostęp dla organizatorów turniejów (hala / orlik / boisko szkolne).

Co sprawdzasz (ok. 2 min, bez rejestracji):
• wyniki live dla rodziców (widok kibica)
• tabele i drabinka
• finał → podium

Wejdź w demo i napisz, co było niejasne albo czego brakuje:
https://demo.turniejomat.pl

Chętnie pomogę odpalić Wasz najbliższy turniej.
Pytania: Messenger albo +48 517 246 034
```

**Krótsza wersja** (grupy / znajomi):

```
Beta Turniejomat — spokój w dniu turnieju zamiast Excela i „jaki wynik?” na WhatsAppie.

2 min demo, bez rejestracji:
https://demo.turniejomat.pl

Organizujesz turnieje? Daj znać po teście, co poprawić.
```

**Stories (opcjonalnie):** wgraj `fb-beta-1080.png` (lub crop 9:16) + naklejka Link → `https://demo.turniejomat.pl`.  
**Tip:** link w pierwszym komentarzu czasem lepiej trzyma zasięg niż sam URL w body.

### Lista kontaktów

Uzupełnij plik: `docs/TOR3_SOFT_LAUNCH_KONTAKTY.csv` (kolumny: imię, kanał, kontakt, wysłano, odpowiedź).  
Cel: **20–50** organizatorów z Twojej sieci — bez spamu grup FB.

---

## Szablon odpowiedzi Messenger (Page)

```
Cześć! Dzięki za wiadomość.
• Demo 2 min (bez rejestracji): https://demo.turniejomat.pl
• Cennik: weekend 79 zł / miesiąc 149 zł → https://turniejomat.pl#cennik
• Telefon: +48 517 246 034
Napisz, jaki turniej planujesz (ile drużyn, hala/orlik) — podpowiem setup.
```

---

## Po odhaczeniu — wróć do Agenta

Gdy masz finalne URL Page + IG, napisz je w chacie — zrobię mały PR: linki FB/IG w stopce `landing/index.html` (Faza C1).
