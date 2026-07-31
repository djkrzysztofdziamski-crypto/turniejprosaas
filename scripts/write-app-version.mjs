#!/usr/bin/env node
/**
 * Stempel wersji frontu:
 * - version.json
 * - <meta name="app-build-id"> w index.html
 * - ?v=<buildId> na lokalnych CSS/JS w index.html (nie CDN)
 *
 * Netlify: COMMIT_REF. Lokalnie: git rev-parse HEAD.
 * Uruchom: node scripts/write-app-version.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveBuildId() {
  const fromEnv = (
    process.env.COMMIT_REF ||
    process.env.CACHED_COMMIT_REF ||
    process.env.GITHUB_SHA ||
    ''
  ).trim();
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return `local-${Date.now()}`;
  }
}

function stampLocalAssets(html, buildId) {
  // href/src lokalne *.css / *.js — ustaw lub podmień ?v=
  return html.replace(
    /\b((?:href|src)=")(?!https?:\/\/|\/\/)([^"?]+?\.(?:css|js))(?:\?v=[^"]*)?(")/gi,
    `$1$2?v=${buildId}$3`
  );
}

const full = resolveBuildId();
const buildId = full.slice(0, 7);
const builtAt = new Date().toISOString();

const versionPath = path.join(root, 'version.json');
fs.writeFileSync(
  versionPath,
  JSON.stringify({ buildId, full, builtAt }, null, 2) + '\n',
  'utf8'
);

const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const metaTag = `<meta name="app-build-id" content="${buildId}">`;
const metaRe = /<meta\s+name="app-build-id"\s+content="[^"]*"\s*\/?>/;
if (metaRe.test(html)) {
  html = html.replace(metaRe, metaTag);
} else {
  html = html.replace(/<\/title>/i, `</title>\n    ${metaTag}`);
}

const beforeAssets = html;
html = stampLocalAssets(html, buildId);
const assetHits = (beforeAssets.match(/\b(?:href|src)="(?!https?:\/\/|\/\/)[^"?]+?\.(?:css|js)/gi) || []).length;

fs.writeFileSync(indexPath, html, 'utf8');

console.log(
  `write-app-version: buildId=${buildId} → version.json + meta + ${assetHits} lokalnych CSS/JS`
);
