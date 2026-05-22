#!/usr/bin/env node
// One-shot recompression of the images PageSpeed flagged for "increase compression
// factor" (round 1 audit, 2026-05-22). Regenerates the variants FROM the source
// originals at a lower quality (not re-encoding the already-lossy gen files), and
// adds a right-sized logo. Overwrites existing gen variants in place.

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '..', 'public', 'images');
const OUT_DIR = path.join(SRC_DIR, 'gen');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const Q = 72; // down from 82 — photographic content, retina-served, change imperceptible at display size

// [source filename, [widths], quality?]
const jobs = [
  ['i-care-air-care-wesley-chapel-hvac-team.webp', [480, 800, 1200]],
  ['I-Care-Air-Care-HVAC-Installation-–-Local-Team-and-Service-AC.webp', [480, 800, 1024]],
  ['Heating-Services-ICAC.webp', [320, 520]],
  ['HVAC-Services-in-Tampa-FL-–-Outdoor-AC-Unit-Repair-Man.webp', [320, 520]],
  ['HVAC-Installation-Tampa-Bay-–-New-Outdoor-Condenser-Installation.webp', [320, 520]],
  ['HVAC-Services-in-Tampa-FL-–-Commercial-AC-Condenser-Systems.webp', [320, 520]],
  ['HVAC-Services-in-Tampa-FL-–-AC-Refrigerant-Pressure-Testing.webp', [320, 520]],
];

// Logo: source 393x222, never displayed wider than ~103px. A w240 variant covers
// 2x retina at every header size. Written as a new file; code refs updated separately.
const logoJob = ['ICAC Full Logo.webp', [{ name: 'ICAC-Full-Logo-w240.webp', width: 240 }], 86];

const sz = async (p) => { try { return (await stat(p)).size; } catch { return 0; } };
const variantName = (src, w) => {
  const ext = path.extname(src);
  return `${src.slice(0, -ext.length)}-w${w}${ext}`;
};

let before = 0, after = 0, n = 0;
for (const [name, widths] of jobs) {
  const src = path.join(SRC_DIR, name);
  if (!existsSync(src)) { console.log(`MISSING: ${name}`); continue; }
  for (const w of widths) {
    const out = path.join(OUT_DIR, variantName(name, w));
    before += await sz(out);
    await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: Q, effort: 6 }).toFile(out);
    after += await sz(out); n++;
    console.log(`  ${variantName(name, w)} -> ${((await sz(out)) / 1024).toFixed(1)} KiB`);
  }
}

// logo
{
  const [name, outs, q] = logoJob;
  const src = path.join(SRC_DIR, name);
  for (const o of outs) {
    const out = path.join(OUT_DIR, o.name);
    await sharp(src).resize({ width: o.width, withoutEnlargement: true }).webp({ quality: q, effort: 6 }).toFile(out);
    after += await sz(out); n++;
    console.log(`  ${o.name} -> ${((await sz(out)) / 1024).toFixed(1)} KiB`);
  }
}

console.log(`\nRegenerated ${n} files. Existing variants: ${(before / 1024).toFixed(1)} KiB -> ${(after / 1024).toFixed(1)} KiB (logo new).`);
