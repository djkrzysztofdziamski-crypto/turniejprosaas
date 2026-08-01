#!/usr/bin/env node
/**
 * Stempel wersji frontu:
 * - version.json (version semver + buildId)
 * - <meta name="app-build-id"> / <meta name="app-version"> w index.html
 * - ?v=<buildId> na lokalnych CSS/JS w index.html (nie CDN)
 *
 * VERSION = MAJOR.MINOR; PATCH = git rev-list --count HEAD
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

function resolvePatch() {
  try {
    return parseInt(
      execSync('git rev-list --count HEAD', { cwd: root, encoding: 'utf8' }).trim(),
      10
    );
  } catch {
    return 0;
  }
}

function resolveMajorMinor() {
  const raw = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
  const m = raw.match(/^(\d+)\.(\d+)/);
  if (!m) throw new Error(`VERSION musi być MAJOR.MINOR (np. 1.0), dostano: ${raw}`);
  return { major: m[1], minor: m[2] };
}

function stampLocalAssets(html, buildId) {
  return html.replace(
    /\b((?:href|src)=")(?!https?:\/\/|\/\/)([^"?]+?\.(?:css|js))(?:\?v=[^"]*)?(")/gi,
    `$1$2?v=${buildId}$3`
  );
}

function upsertMeta(html, name, content) {
  const tag = `<meta name="${name}" content="${content}">`;
  const re = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
  if (re.test(html)) return html.replace(re, tag);
  if (/name="app-build-id"/i.test(html) && name === 'app-version') {
    return html.replace(
      /(<meta\s+name="app-build-id"\s+content="[^"]*"\s*\/?>)/i,
      `$1\n    ${tag}`
    );
  }
  return html.replace(/<\/title>/i, `</title>\n    ${tag}`);
}

const full = resolveBuildId();
const buildId = full.slice(0, 7);
const builtAt = new Date().toISOString();
const { major, minor } = resolveMajorMinor();
const patch = resolvePatch();
const version = `${major}.${minor}.${patch}`;

fs.writeFileSync(
  path.join(root, 'version.json'),
  JSON.stringify({ version, buildId, full, builtAt }, null, 2) + '\n',
  'utf8'
);

const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = upsertMeta(html, 'app-build-id', buildId);
html = upsertMeta(html, 'app-version', version);

const beforeAssets = html;
html = stampLocalAssets(html, buildId);
const assetHits = (beforeAssets.match(/\b(?:href|src)="(?!https?:\/\/|\/\/)[^"?]+?\.(?:css|js)/gi) || []).length;

fs.writeFileSync(indexPath, html, 'utf8');

console.log(
  `write-app-version: ${version} (buildId=${buildId}) → version.json + meta + ${assetHits} lokalnych CSS/JS`
);
