import sharp from "sharp";
import { readFile, writeFile, unlink, stat } from "node:fs/promises";
const DIR = "public/images";

// Orphaned assets (refs=0 in src) -> delete (dead weight in deploy)
const orphans = [
  "ICAC Logo.png", "ICAC Full Dark Logo.png", "rheem-logo.png",
  "ac-blowing-warm-air-tampa-outdoor-condenser-fan-grille-inspection.png",
  "ac-blowing-warm-air-tampa-woman-relaxing-cool-comfort-mini-split-living-room.png",
  "Air-Conditioning-Cool-Photo-May-13-2025-scaled-1.webp",
];
let freed = 0;
for (const f of orphans) {
  try { const s = await stat(`${DIR}/${f}`); await unlink(`${DIR}/${f}`); freed += s.size; console.log(`deleted orphan: ${f} (${(s.size/1024|0)}KB)`); }
  catch { console.log(`skip (not found): ${f}`); }
}

// Recompress heavy USED webp in place
const targets = [
  "cooling-crunch-residential-ac-demand-market-infographic.webp",
  "ac-not-cooling-i-care-air-care-technician-refrigerant-diagnostics-wesley-chapel.webp",
  "ac-incentives-florida-energy-costs-key-statistics-infographic.webp",
];
let saved = 0;
for (const f of targets) {
  const p = `${DIR}/${f}`;
  const buf = await readFile(p); const before = buf.length;
  const isInfographic = /infographic/i.test(f);
  const meta = await sharp(buf).metadata();
  const maxW = Math.min(meta.width, isInfographic ? 1200 : 1400);
  const out = await sharp(buf).resize({ width: maxW, withoutEnlargement: true }).webp({ quality: isInfographic ? 80 : 74 }).toBuffer();
  await writeFile(p, out); saved += (before - out.length);
  console.log(`recompressed: ${f}  ${(before/1024|0)}KB -> ${(out.length/1024|0)}KB`);
}
console.log(`\nTotal saved: ${((freed + saved)/1024|0)}KB`);
