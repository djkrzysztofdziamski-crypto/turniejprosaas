/**
 * Generuje DEMO_STORY_SCIAGA.pdf z HTML
 * Uruchom: node scripts/build-demo-sciaga-pdf.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'DEMO_STORY_SCIAGA.html');
const pdfPath = path.join(root, 'DEMO_STORY_SCIAGA.pdf');
const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: 'networkidle' });
await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' }
});
await browser.close();

console.log('OK:', pdfPath);
