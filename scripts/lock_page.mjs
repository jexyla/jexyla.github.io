// Password-protects a page: encrypts its content and images with AES-GCM (key from PBKDF2-SHA256 of the password),
// so the published files contain only ciphertext plus the password screen.
//
// Usage: node scripts/lock_page.mjs <password>
//   reads  private/deel/shell.html    (page with the password screen; {{PAYLOAD}} marks where the ciphertext goes)
//          private/deel/content.html  (the page content; images referenced as src="deel/<file>")
//          private/deel/assets/       (the images)
//   writes deel-engage-canvas-case-study.html and assets/locked/deel/*.bin
// Re-run after editing content.html. The private/ folder is never published.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { webcrypto as crypto } from 'node:crypto';
import path from 'node:path';

const password = process.argv[2];
if (!password) { console.error('Usage: node scripts/lock_page.mjs <password>'); process.exit(1); }

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const SRC = path.join(ROOT, 'private/deel');
const OUT_DIR = path.join(ROOT, 'assets/locked/deel');
const OUT_PAGE = path.join(ROOT, 'deel-engage-canvas-case-study.html');
const ITERATIONS = 310000;
const TYPES = { '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };

const b64 = buf => Buffer.from(buf).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16));
const tag = Buffer.from(salt).toString('hex').slice(0, 8);   // file names carry this, so every lock run has its own URLs (no stale browser caches)
const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt'],
);
const encrypt = async data => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  return { iv, ct };
};

// Images: each becomes <n>.bin = 12-byte IV + ciphertext; the content points at it with data-locked.
let content = await readFile(path.join(SRC, 'content.html'), 'utf8');
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
const files = [...new Set([...content.matchAll(/src="deel\/([^"]+)"/g)].map(m => m[1]))];
let n = 0;
for (const file of files) {
  n += 1;
  const { iv, ct } = await encrypt(await readFile(path.join(SRC, 'assets', file)));
  const name = `${tag}-${String(n).padStart(2, '0')}.bin`;
  await writeFile(path.join(OUT_DIR, name), Buffer.concat([Buffer.from(iv), Buffer.from(ct)]));
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  content = content.split(`src="deel/${file}"`).join(`data-locked="assets/locked/deel/${name}" data-type="${type}"`);
}

const { iv, ct } = await encrypt(new TextEncoder().encode(content));
const payload = JSON.stringify({ salt: b64(salt), iterations: ITERATIONS, iv: b64(iv), ct: b64(ct) });
const shell = await readFile(path.join(SRC, 'shell.html'), 'utf8');
if (!shell.includes('{{PAYLOAD}}')) throw new Error('shell.html needs a {{PAYLOAD}} marker');
await writeFile(OUT_PAGE, shell.replace('{{PAYLOAD}}', payload));
console.log(`Locked ${path.basename(OUT_PAGE)}: ${content.length} chars of content, ${files.length} images`);
