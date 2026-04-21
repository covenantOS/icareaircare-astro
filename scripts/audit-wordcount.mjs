// One-off audit script (read-only). Parses dist/**/index.html, strips header/footer/nav/script/style/JSON-LD,
// and returns word count + link counts + H2/H3 counts.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (entry.name === 'index.html' || entry.name === '404.html') files.push(p);
  }
  return files;
}

function strip(html) {
  // Remove comments, scripts, styles, JSON-LD, SVG, noscript
  let h = html;
  h = h.replace(/<!--[\s\S]*?-->/g, '');
  h = h.replace(/<script[\s\S]*?<\/script>/gi, '');
  h = h.replace(/<style[\s\S]*?<\/style>/gi, '');
  h = h.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  h = h.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  // Remove header + footer blocks (site chrome). They exist as <header>...</header> and <footer>...</footer>.
  h = h.replace(/<header[\s\S]*?<\/header>/gi, '');
  h = h.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  // Remove nav blocks that may live outside header.
  h = h.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  return h;
}

function bodyContent(html) {
  const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1] : html;
}

function countWords(text) {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return 0;
  return clean.split(' ').filter(Boolean).length;
}

function countMatches(text, re) { return (text.match(re) || []).length; }

function extractLinks(html) {
  const links = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    links.push({ href, text });
  }
  return links;
}

const files = walk(DIST);
const results = [];
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const stripped = strip(raw);
  const body = bodyContent(stripped);
  const words = countWords(body);
  const h2 = countMatches(body, /<h2\b/gi);
  const h3 = countMatches(body, /<h3\b/gi);
  const p  = countMatches(body, /<p\b/gi);
  const bodyLinks = extractLinks(body);
  const internal = bodyLinks.filter(l => {
    if (!l.href) return false;
    if (l.href.startsWith('http') && !l.href.includes('icareaircare.com')) return false;
    if (l.href.startsWith('tel:') || l.href.startsWith('mailto:') || l.href.startsWith('#')) return false;
    if (l.href.startsWith('javascript:')) return false;
    return true;
  });
  const rel = path.relative(DIST, f).replace(/\\/g, '/');
  const url = '/' + rel.replace(/index\.html$/, '').replace(/\/$/, '') + '/';
  results.push({
    file: rel,
    url: url === '//' ? '/' : url,
    words, h2, h3, paragraphs: p,
    bodyInternalLinks: internal.length,
    internalLinks: internal.map(l => l.href),
    anchors: internal.map(l => ({ href: l.href, text: l.text.slice(0, 80) })),
  });
}

// Build inbound counts
const inbound = new Map();
for (const r of results) {
  for (const href of r.internalLinks) {
    const clean = href.split('#')[0].split('?')[0];
    const norm = clean.endsWith('/') ? clean : clean + '/';
    inbound.set(norm, (inbound.get(norm) || 0) + 1);
  }
}

for (const r of results) {
  r.inbound = inbound.get(r.url) || 0;
}

results.sort((a, b) => a.url.localeCompare(b.url));

console.log(JSON.stringify(results, null, 2));
