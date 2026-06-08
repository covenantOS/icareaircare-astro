// Reinforce meta descriptions on the high-impression service pages with
// social proof (4.9 stars / 700+ reviews) + a clear CTA, kept under ~160 chars.
import { readFile, writeFile } from 'node:fs/promises';
const S = 'src/pages/services';

const METAS = [
  [`${S}/ac-maintenance-tampa.astro`,
    "21-point AC tune-ups & maintenance plans in Wesley Chapel, New Tampa, Land O' Lakes, Lutz & Tampa. Catch problems early, lower bills, keep your warranty valid. Call (813) 395-2324.",
    "21-point AC tune-ups & maintenance plans across Wesley Chapel & Tampa Bay. Lower bills, fewer breakdowns, warranty kept valid. 4.9★ · 700+ reviews. Call (813) 395-2324."],
  [`${S}/hvac-installation-tampa.astro`,
    "Wesley Chapel HVAC installation done right: Manual-J sized, permitted, guaranteed. Serving Wesley Chapel, New Tampa, Land O' Lakes, Lutz & Tampa. Financing available. Call (813) 395-2324.",
    "Wesley Chapel HVAC installation done right — Manual-J sized, permitted, guaranteed. Free estimate + 0% financing. 4.9★ · 700+ reviews. Call (813) 395-2324."],
  [`${S}/ac-replacement-tampa.astro`,
    "Wesley Chapel & Tampa AC replacement — Manual-J sized, permitted, 2-year installation warranty. Carrier, Trane, Lennox, Rheem. Call (813) 395-2324.",
    "Wesley Chapel AC replacement — Manual-J sized, permitted, 2-yr install warranty. Carrier, Trane, Rheem. Free quote + 0% financing. 4.9★ · 700+ reviews. (813) 395-2324."],
  [`${S}/indoor-air-quality-tampa.astro`,
    "Wesley Chapel indoor air quality — UV lamps, whole-home purifiers, dehumidifiers, ERVs, duct sealing. Free assessment. Call (813) 395-2324.",
    "Wesley Chapel indoor air quality — UV lamps, whole-home purifiers, dehumidifiers, ERVs, duct sealing. Free assessment. 4.9★ · 700+ reviews. Call (813) 395-2324."],
  [`${S}/mini-split-installation-tampa.astro`,
    "Wesley Chapel mini-split installation — garages, additions, sunrooms, whole homes. Mitsubishi, Fujitsu, LG. Licensed CAC1816515. Call (813) 395-2324.",
    "Wesley Chapel mini-split installation — garages, additions, sunrooms, whole homes. Mitsubishi, Fujitsu, LG. Free quote + 0% financing. 4.9★. Call (813) 395-2324."],
  [`${S}/heat-pump-repair-tampa.astro`,
    "Wesley Chapel heat pump repair — reversing valves, defrost boards, TXVs, compressors. All brands. Licensed CAC1816515. Call (813) 395-2324.",
    "Wesley Chapel heat pump repair — reversing valves, defrost boards, TXVs, compressors. All brands, same-day when available. 4.9★ · 700+ reviews. Call (813) 395-2324."],
];

let ok = 0, miss = 0;
for (const [file, oldS, newS] of METAS) {
  const text = await readFile(file, 'utf8');
  const needle = `description="${oldS}"`;
  if (!text.includes(needle)) { console.error('MISS:', file); miss++; continue; }
  await writeFile(file, text.replace(needle, `description="${newS}"`));
  ok++; console.log('✓', file.split('/').pop());
}
console.log(`\nApplied ${ok} metas, ${miss} misses.`);
