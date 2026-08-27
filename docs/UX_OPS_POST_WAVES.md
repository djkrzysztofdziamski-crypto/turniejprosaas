# Ops po wdrożeniu fal UX TOP 10

**Data:** 2026-08-27 · **Kod:** Fale 1–3 wdrożone w `index.html`, `captain.js`, `functions/lib/billing/email.js`

## 1. Nagranie 3 min (Ty / ops)

Skrypt z `docs/UX_TOP10_2WEEKS.md` (#2):

1. (0:00) Ekran Start — nazwa + drużyny  
2. (0:30) Grupy, awanse, boiska, czasy  
3. (1:00) Utwórz drużyny → krótkie nazwy w Składach  
4. (1:40) Tor 1 Losuj → Tor 2 Generuj terminarz  
5. (2:20) Na żywo — wskaż gdzie wynik  
6. (2:40) „Reszta później; Pomoc w Archiwum”

## 2. Opcjonalny re-test dnia 10

**Cel:** ≤30 min (metryka T10.6 B), bliżej 15–20 min dzięki Pomoc w app.

**Handout:** `docs/UX_DAY10_TESTER_HANDOUT.md`  
**Arkusz:** `docs/UX_DAY10_TEST_RESULTS.xlsx`

**Różnica vs poprzedni test:** tester może korzystać z **Archiwum → Pomoc** (słownik, ścieżka, CHECKLISTA START).

**Scenariusz:** klucz → drużyny → terminarz → QR kibica → 1 wynik (bez podpowiedzi na żywo).

## 3. Smoke po wdrożeniu (sędzia)

- [ ] Archiwum → przycisk **POMOC** (toggle): czytelne na desktop + telefon  
- [ ] Start: podstawowe otwarte; Opcje zaawansowane domyślnie zamknięte  
- [ ] Zmiana drabinki ustawia awanse (= rozmiar)  
- [ ] Na żywo: legenda nad harmonogramem (sędzia)  
- [ ] Asystent: baner kanoniczny (#6)  
- [ ] Terminarz: czerwone WO przy `walkoverTeamId`  
- [ ] Empty states: Składy, Grupy, Na żywo, Play-Off, Podium, Boiska, Archiwum  
- [ ] RESET: odmowa przy ≥1 meczu `played`; 2-step + nazwa turnieju  
- [ ] Mail po zakupie: temat „Pierwsze 15 minut” (staging / resendOrderEmail)

## 4. Deploy

- Frontend: `_headers` + `index.html` (+ `captain.js`)  
- Cloud Functions: `email.js` (fulfillOrder / resendOrderEmail)
