#!/usr/bin/env node
// One-shot image variant generator for the worst Lighthouse image-delivery offenders.
// Reads sources from public/images/, writes width-variants to public/images/gen/.
// Idempotent: skips a variant if the output already exists.

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '..', 'public', 'images');
const OUT_DIR = path.join(SRC_DIR, 'gen');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Each entry: [source filename, [output widths], output format ('webp' default)]
const jobs = [
  // Hero LCP — home page primary above-the-fold image
  ['ICAC Team(1).webp', [480, 800, 1200]],
  // Local team/vans band — home page mid section
  ['I-Care-Air-Care-HVAC-Installation-\u2013-Local-Team-and-Service-AC.webp', [480, 800, 1024]],
  // "About / team" big square image
  ['ICAC Team(3).webp', [400, 600]],
  // ThreeStep full-bleed background (rendered behind 3-step process section)
  ['ICAC Team(2).webp', [480, 800, 1200]],
  // Owner-spotlight bottom-left inline image (displayed ~400x260)
  ['ICAC Team(4).webp', [400, 600]],
  // Tim Hawk portrait
  ['Tim Hawk (ICAC Owner).webp', [320, 500]],
  // Rheem brand badge — 1454x1454 original is 195x oversize for 52x52 display
  ['rheem-logo.png', [104, 208], 'webp'],
  // Rheem lifestyle image — 585x401 original
  ['rheem-lifestyle.jpg', [480, 800], 'webp'],
  // "Sunday" HVAC team photo — 1024x768 original
  ['SUNDAY-2026-01-30T130107.789.webp', [400, 700]],
  // Service grid thumbs (8 of them — each used at ~232x289 on desktop, ~335x198 mobile)
  ['HVAC-Services-in-Tampa-FL-\u2013-Outdoor-AC-Unit-Repair-Man.webp', [320, 520]],
  ['HVAC-Services-in-Tampa-FL-\u2013-AC-Refrigerant-Pressure-Testing.webp', [320, 520]],
  ['HVAC-Installation-Tampa-Bay-\u2013-New-Outdoor-Condenser-Installation.webp', [320, 520]],
  ['air-duct-cleaning-wesley-chapel-metal-ductwork-supply-vent-register.webp', [320, 520]],
  ['HVAC-Services-in-Tampa-FL-\u2013-Commercial-AC-Condenser-Systems.webp', [320, 520]],
  ['Heating-Services-ICAC.webp', [320, 520]],
  ['Presentation-t-14.webp', [320, 520]],
  ['Outdoor-AC-Condenser-Installation-HVAC-Contractor-Near-Me.webp', [320, 520]],
  // Home mini-grid full-width stacked images (mobile 479 wide, desktop 479 wide)
  ['air-conditioning-not-cooling-tampa-fl-mini-split-outdoor-condenser-unit-wall-mounted.webp', [480, 640]],
  ['ac-blowing-warm-air-tampa-woman-relaxing-cool-comfort-mini-split-living-room.webp', [480, 640]],
];

function outName(src, w, fmt) {
  const ext = path.extname(src);
  const base = src.substring(0, src.length - ext.length);
  return `${base}-w${w}.${fmt}`;
}

async function fileSize(p) {
  try { return (await stat(p)).size; } catch { return 0; }
}

let generated = 0, skipped = 0, missing = 0;
let totalSaved = 0;

for (const [name, widths, fmtArg] of jobs) {
  const fmt = fmtArg || 'webp';
  const src = path.join(SRC_DIR, name);
  if (!existsSync(src)) {
    console.log(`MISSING: ${name}`);
    missing++;
    continue;
  }
  const origSize = await fileSize(src);
  for (const w of widths) {
    const outPath = path.join(OUT_DIR, outName(name, w, fmt));
    if (existsSync(outPath)) { skipped++; continue; }
    await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .toFormat(fmt, fmt === 'webp' ? { quality: 82, effort: 5 } : {})
      .toFile(outPath);
    const newSize = await fileSize(outPath);
    const saved = Math.max(0, origSize - newSize);
    totalSaved += saved;
    generated++;
    console.log(`  wrote ${path.relative(SRC_DIR, outPath)} — ${(newSize/1024).toFixed(1)} KiB`);
  }
}

console.log(`\nDone — generated ${generated}, skipped ${skipped}, missing ${missing}`);
console.log(`(approx saved vs original per-variant: ${(totalSaved/1024).toFixed(1)} KiB across ${generated} files)`);
