#!/usr/bin/env node
/**
 * Generuje PDF-y dokumentów prawnych z landing/legal/*.html
 * Uruchom: node scripts/build-legal-pdfs.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const legalDir = path.join(root, 'landing', 'legal');
const parentOut = path.resolve(root, '..');

const docs = [
  { html: 'regulamin-serwisu.html', pdf: 'REGULAMIN SERWISU TURNIEJOMAT.pdf' },
  { html: 'regulamin-uslug-platnych.html', pdf: 'REGULAMIN USŁUG PŁATNYCH TURNIEJOMAT.pdf' },
  { html: 'polityka-prywatnosci.html', pdf: 'POLITYKA PRYWATNOŚCI TURNIEJOMAT.pdf' },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const doc of docs) {
  const htmlPath = path.join(legalDir, doc.html);
  const pdfPath = path.join(parentOut, doc.pdf);
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
  });
  console.log('OK:', pdfPath);
}

await browser.close();
console.log('\nGotowe — PDF-y zapisane obok oryginałów w:', parentOut);
