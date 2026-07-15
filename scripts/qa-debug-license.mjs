import { chromium } from 'playwright';
const KEY = 'TP-5YGF-ZS4S';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
await page.fill('#license-input', KEY);
await page.click('button:has-text("MAM KLUCZ")');
await page.waitForTimeout(6000);
const info = await page.evaluate(async (key) => {
  let lic = null;
  try {
    const snap = await firebase.database().ref('licencje/' + key).once('value');
    lic = snap.val();
  } catch (e) { lic = { error: e.message }; }
  return {
    url: location.href,
    viewLogin: document.getElementById('view-login')?.className,
    viewApp: document.getElementById('view-app')?.className,
    msg: document.getElementById('msg-box')?.innerText,
    blocked: document.getElementById('license-blocked-screen')?.style.display,
    hasState: !!window.state,
    lic,
  };
}, KEY);
console.log(JSON.stringify(info, null, 2));
await browser.close();
