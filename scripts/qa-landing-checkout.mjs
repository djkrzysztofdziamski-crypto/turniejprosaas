#!/usr/bin/env node
/**
 * Smoke test: landing checkout → createCheckoutSession (Autopay lub Stripe).
 * Nie wykonuje płatności — tylko weryfikuje callable i CSP landing.
 */
const CHECKOUT_URL = 'https://europe-west1-turniejprosaas.cloudfunctions.net/createCheckoutSession';
const LANDING_URL = 'https://turniejomat.pl/';

async function main() {
  console.log('=== QA landing checkout ===\n');

  const landingRes = await fetch(LANDING_URL);
  const landingHtml = await landingRes.text();
  const checks = [
    ['Landing HTTP 200', landingRes.ok],
    ['startCheckout w HTML', landingHtml.includes('startCheckout')],
    ['submitPaymentForm w HTML', landingHtml.includes('submitPaymentForm')],
    ['Pole email checkout', landingHtml.includes('checkout-email')],
    ['Checkbox regulaminów', landingHtml.includes('checkout-terms')],
    ['Checkbox odstąpienia', landingHtml.includes('checkout-withdrawal')],
    ['Link Regulamin serwisu', landingHtml.includes('legal/regulamin-serwisu.html')],
    ['Link Polityka prywatności', landingHtml.includes('legal/polityka-prywatnosci.html')],
    ['football-weekend', landingHtml.includes('football-weekend')],
  ];
  for (const [label, ok] of checks) {
    console.log(ok ? '✅' : '❌', label);
    if (!ok) process.exitCode = 1;
  }

  const sessionRes = await fetch(CHECKOUT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        productId: 'football-weekend',
        email: 'qa-test@turniejomat.pl',
        termsAccepted: true,
        withdrawalConsent: true,
        termsVersion: 'RUP-2.1/RS-1.2/PP-2.1',
      },
    }),
  });
  const sessionJson = await sessionRes.json();
  const data = sessionJson?.result || {};
  const isAutopay = data.provider === 'autopay' && data.url && data.fields;
  const isStripe = data.url?.includes('checkout.stripe.com');
  const ok = sessionRes.ok && (isAutopay || isStripe);
  console.log(ok ? '✅' : '❌', 'createCheckoutSession →', isAutopay ? 'Autopay POST' : isStripe ? 'Stripe URL' : 'brak odpowiedzi');
  if (!ok) {
    console.error(sessionJson);
    process.exitCode = 1;
  } else if (isAutopay) {
    console.log('   gateway:', data.url);
    console.log('   orderId:', data.orderId);
  } else {
    console.log('   session:', data.sessionId?.slice(0, 24) + '…');
  }

  console.log('\nGotowe. Pełny test: płatność testowa na turniejomat.pl/#cennik');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
