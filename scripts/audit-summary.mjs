import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync('audit-data.json', 'utf8'));
console.log('| URL | Words | H2 | H3 | P | body→out | ← in |');
console.log('|---|---:|---:|---:|---:|---:|---:|');
for (const r of data) {
  console.log(`| ${r.url} | ${r.words} | ${r.h2} | ${r.h3} | ${r.paragraphs} | ${r.bodyInternalLinks} | ${r.inbound} |`);
}
