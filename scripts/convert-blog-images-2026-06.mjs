// One-off: convert the 16 client-provided photos (D:\foldericac\website media)
// to web-optimized .webp and drop them into public/images with descriptive,
// SEO-friendly filenames. Resizes to max 1200px wide (hero render is ~960px).
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SRC = 'D:\\foldericac\\website media';
const OUT = 'public/images';

// source file  ->  destination .webp (descriptive, matches the post it lands on)
const MAP = [
  ['checking-ac-issue-i-care-air-care.jpeg',        '10-common-ac-problems-wesley-chapel-technician-electrical-diagnostics.webp'],
  ['bag-hvac.jpeg',                                  'ac-repair-epperson-condenser-refrigerant-gauges-i-care-air-care.webp'],
  ['hvac-with-icac-bag.jpeg',                        'ac-repair-seven-oaks-wesley-chapel-outdoor-condenser-tool-bag.webp'],
  ['fixing-hvac-i-care-air-care.jpeg',              'ac-repair-wesley-chapel-fl-technician-refrigerant-gauges-condenser.webp'],
  ['technicias-i-care-air-care.jpeg',               'ac-maintenance-tips-tampa-bay-two-technicians-servicing-condenser.webp'],
  ['checking-cooling-bills-i-are-air-care.jpeg',    'lower-cooling-bills-wesley-chapel-technician-reviewing-energy-bill.webp'],
  ['air-filter.jpeg',                               'wesley-chapel-hvac-tune-up-new-pleated-air-filters.webp'],
  ['thermostat-installation.jpeg',                  'seer2-explained-florida-smart-thermostat-efficient-cooling.webp'],
  ['two-technicias-checking-ac.jpeg',               'ac-replacement-wesley-chapel-fl-technicians-installing-new-condenser.webp'],
  ['hvac-system.png',                               'carrier-outdoor-ac-condenser-unit-tampa-bay-brand-comparison.webp'],
  ['ac-stuff.jpeg',                                 'new-construction-hvac-epperson-mirada-indoor-air-handler-ductwork.webp'],
  ['18_ac_repair_v3.png',                           'reliable-ac-repair-tampa-i-care-air-care-honest-pricing.webp'],
  ['client-satisfied-hvac-i-care-air-care.jpeg',    'reliable-hvac-contractor-near-me-satisfied-homeowners-i-care-air-care.webp'],
  ['checking-hvac-i-care-air-care.jpeg',            'evaluate-hvac-warranty-tampa-technician-reviewing-quote-homeowner.webp'],
  ['air-duct-cleaning-icac.jpeg',                   'i-care-air-care-careers-technician-air-duct-cleaning-wesley-chapel.webp'],
  ['air-duct.jpeg',                                 'which-hvac-maintenance-plan-best-value-tampa-clean-ductwork.webp'],
];

if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

let ok = 0;
for (const [src, dest] of MAP) {
  const inPath = `${SRC}\\${src}`;
  if (!existsSync(inPath)) { console.error('MISSING SOURCE:', inPath); continue; }
  const meta = await sharp(inPath).metadata();
  await sharp(inPath)
    .resize({ width: Math.min(1200, meta.width || 1200), withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`${OUT}/${dest}`);
  ok++;
  console.log(`✓ ${dest}`);
}
console.log(`\nConverted ${ok}/${MAP.length} images into ${OUT}`);
