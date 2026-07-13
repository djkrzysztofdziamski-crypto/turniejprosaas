/**
 * Regeneracja WebP z PNG (logo, icon) — root + landing/
 * Uruchom: node scripts/optimize-brand-images.mjs
 * Wymaga: pip install pillow  LUB  sharp (npm)
 */
import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const folders = ['', 'landing'];

function sizeKb(path) {
  return existsSync(path) ? Math.round(statSync(path).size / 1024) : 0;
}

for (const sub of folders) {
  const dir = sub ? join(root, sub) : root;
  for (const name of ['logo', 'icon']) {
    const png = join(dir, `${name}.png`);
    const webp = join(dir, `${name}.webp`);
    if (!existsSync(png)) continue;
    execSync(`python -c "from PIL import Image; Image.open(r'${png.replace(/\\/g, '/')}').save(r'${webp.replace(/\\/g, '/')}', 'WEBP', quality=82, method=6)"`, { stdio: 'inherit' });
    console.log(`${png}: ${sizeKb(png)}KB -> ${sizeKb(webp)}KB webp`);
  }
}

console.log('Done. Zaktualizuj <picture> w HTML jeśli zmieniłeś nazwy plików.');
