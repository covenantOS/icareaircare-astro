// Internal link audit — count inbound body links per page in dist/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

function toUrl(p) {
  let s = p.replace(/\\/g, '/').replace(DIST.replace(/\\/g, '/'), '').replace(/\/index\.html$/, '').replace(/\/+/g, '/');
  return s === '' ? '/' : s;
}

const pages = walk(DIST);
const urls = new Set(pages.map(toUrl));
const inbound = {};
for (const u of urls) inbound[u] = 0;

for (const p of pages) {
  const src = toUrl(p);
  const html = fs.readFileSync(p, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  const seen = new Set();
  for (let h of hrefs) {
    h = h.replace('https://www.icareaircare.com', '').replace('https://icareaircare.com', '');
    h = h.split('#')[0].split('?')[0];
    if (h.endsWith('/') && h !== '/') h = h.slice(0, -1);
    if (urls.has(h) && h !== src && !seen.has(h)) {
      seen.add(h);
      inbound[h] = (inbound[h] || 0) + 1;
    }
  }
}

const entries = Object.entries(inbound).sort((a, b) => a[1] - b[1]);
console.log('=== ORPHANS (0 inbound unique pages) ===');
for (const [u, c] of entries) if (c === 0) console.log(`  ${c.toString().padStart(3)}  ${u}`);
console.log('\n=== UNDERLINKED (1-3 inbound) ===');
for (const [u, c] of entries) if (c >= 1 && c <= 3) console.log(`  ${c.toString().padStart(3)}  ${u}`);
console.log('\n=== TOP 10 MOST LINKED ===');
for (const [u, c] of entries.sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${c.toString().padStart(3)}  ${u}`);
console.log(`\nTotal pages: ${pages.length}`);
