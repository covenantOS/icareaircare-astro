import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const scraped = JSON.parse(readFileSync(join(__dirname, 'scraped-blog-posts.json'), 'utf-8'));

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function textToHtml(text) {
  if (!text) return '';

  const blocks = text.split(/\n\n+/).filter(b => b.trim());
  const out = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    const lines = trimmed.split('\n');
    const first = lines[0].trim();

    // Numbered item: "1. Title\nBody text"
    if (/^\d+\.\s+\S/.test(first)) {
      const title = first.replace(/^\d+\.\s+/, '');
      const body = lines.slice(1).join(' ').trim();
      out.push(`<h3>${escHtml(title)}</h3>`);
      if (body) out.push(`<p>${escHtml(body)}</p>`);
      continue;
    }

    // Multi-line block where first line looks like a heading
    if (lines.length > 1) {
      const looksLikeHeading =
        first.length > 8 &&
        first.length < 120 &&
        !first.startsWith('-') &&
        !first.startsWith('•') &&
        !/^\$/.test(first) &&
        !/^\d+$/.test(first) &&
        !first.endsWith('.');

      if (looksLikeHeading) {
        out.push(`<h3>${escHtml(first)}</h3>`);
        const restLines = lines.slice(1);
        const allBullets = restLines.every(l => !l.trim() || /^[-•]\s/.test(l.trim()));
        if (allBullets) {
          const items = restLines
            .filter(l => l.trim())
            .map(l => `<li>${escHtml(l.replace(/^[-•]\s+/, '').trim())}</li>`);
          out.push(`<ul>${items.join('')}</ul>`);
        } else {
          const bodyText = restLines.join(' ').trim();
          if (bodyText) out.push(`<p>${escHtml(bodyText)}</p>`);
        }
        continue;
      }
    }

    // Single-line heading
    if (
      lines.length === 1 &&
      first.length > 8 &&
      first.length < 120 &&
      !first.endsWith('.') &&
      !first.endsWith(',')
    ) {
      out.push(`<h3>${escHtml(first)}</h3>`);
      continue;
    }

    // All-bullet list
    if (lines.length > 1 && lines.every(l => !l.trim() || /^[-•]\s/.test(l.trim()))) {
      const items = lines
        .filter(l => l.trim())
        .map(l => `<li>${escHtml(l.replace(/^[-•]\s+/, '').trim())}</li>`);
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Regular paragraph
    out.push(`<p>${escHtml(trimmed.replace(/\n/g, ' '))}</p>`);
  }

  return out.join('\n');
}

const bodies = {};
for (const post of scraped.posts) {
  if (post.content) {
    bodies[post.slug] = textToHtml(post.content);
  }
}

// Write blog-bodies.ts
const lines = [
  '// Auto-generated — run scripts/generate-blog-bodies.mjs to regenerate',
  'export const BLOG_BODIES: Record<string, string> = {',
];

for (const [slug, html] of Object.entries(bodies)) {
  const escaped = html
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  lines.push(`  "${slug}": \`${escaped}\`,`);
}

lines.push('};');

const output = lines.join('\n') + '\n';
const outPath = join(__dirname, '../src/lib/blog-bodies.ts');
writeFileSync(outPath, output, { encoding: 'utf-8' });
console.log(`Generated blog-bodies.ts with ${Object.keys(bodies).length} entries`);
