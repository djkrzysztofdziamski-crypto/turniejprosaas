#!/usr/bin/env node
/**
 * Smoke test: landing checkout → createCheckoutSession (Stripe test URL).
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
    ['Pole email checkout', landingHtml.includes('checkout-email')],
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
      data: { productId: 'football-weekend', email: 'qa-test@turniejomat.pl' },
    }),
  });
  const sessionJson = await sessionRes.json();
  const url = sessionJson?.result?.url;
  console.log(sessionRes.ok && url?.includes('checkout.stripe.com') ? '✅' : '❌', 'createCheckoutSession → Stripe URL');
  if (!url) {
    console.error(sessionJson);
    process.exitCode = 1;
  } else {
    console.log('   session:', sessionJson.result.sessionId?.slice(0, 24) + '…');
  }

  console.log('\nGotowe. Pełny test: płatność testowa na turniejomat.pl/#cennik');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
