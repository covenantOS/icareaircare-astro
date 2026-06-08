// One-off: intent-optimized SEO titles (CTR hooks) across commercial pages.
// Replaces the exact title="OLD" with title="NEW". Reports any miss.
import { readFile, writeFile } from 'node:fs/promises';

const P = 'src/pages';

// [file, oldTitle, newTitle]
const TITLES = [
  // ---- Services ----
  [`${P}/services/ac-installation-wesley-chapel.astro`, 'AC Installation in Wesley Chapel, FL | I Care Air Care', 'AC Installation Wesley Chapel — Free Quote · 0% Financing'],
  [`${P}/services/ac-maintenance-tampa.astro`, 'AC Maintenance & Tune-Ups in Wesley Chapel, FL', 'AC Tune-Up & Maintenance Plans Wesley Chapel · 4.9★'],
  [`${P}/services/ac-repair-tampa.astro`, 'AC Repair Wesley Chapel & Tampa | Same-Day Service', 'AC Repair Wesley Chapel & Tampa — Same-Day · 4.9★ (700+)'],
  [`${P}/services/ac-replacement-tampa.astro`, 'AC Replacement in Wesley Chapel & Tampa, FL', 'AC Replacement Wesley Chapel — Free Quote · 0% Financing'],
  [`${P}/services/air-duct-cleaning-tampa.astro`, 'Air Duct Cleaning Wesley Chapel | 7-Step Process', 'Air Duct Cleaning Wesley Chapel — 7-Step NADCA · 4.9★'],
  [`${P}/services/emergency-ac-repair-tampa.astro`, 'Urgent AC Repair Wesley Chapel & Tampa | I Care Air Care', 'Emergency AC Repair Wesley Chapel & Tampa — Same-Day'],
  [`${P}/services/heat-pump-repair-tampa.astro`, 'Heat Pump Repair in Wesley Chapel & Tampa, FL', 'Heat Pump Repair Wesley Chapel & Tampa — All Brands · 4.9★'],
  [`${P}/services/heating-services-tampa.astro`, 'Heating & Heat Pump Services in Wesley Chapel FL', 'Heating & Heat Pump Service Wesley Chapel — 4.9★ (700+)'],
  [`${P}/services/hvac-installation-tampa.astro`, 'HVAC Installation in Wesley Chapel & Tampa FL', 'HVAC Installation Wesley Chapel — Free Estimate · Financing'],
  [`${P}/services/indoor-air-quality-tampa.astro`, 'Indoor Air Quality in Wesley Chapel & Tampa, FL', 'Indoor Air Quality Wesley Chapel — Free Assessment · 4.9★'],
  [`${P}/services/mini-split-installation-tampa.astro`, 'Mini-Split Installation in Wesley Chapel & Tampa, FL', 'Mini-Split Installation Wesley Chapel — Free Quote · 4.9★'],
  [`${P}/services/refrigeration-repair-tampa.astro`, 'Commercial Refrigeration Repair Wesley Chapel FL', 'Commercial Refrigeration Repair Tampa Bay — EPA-Certified'],
  [`${P}/services/thermostat-installation-tampa.astro`, 'Smart Thermostat Installation Wesley Chapel FL', 'Smart Thermostat Install Wesley Chapel — Ecobee & Nest'],
  [`${P}/services/index.astro`, 'HVAC Services in Wesley Chapel & Tampa Bay | I Care Air Care', 'Wesley Chapel HVAC Services — AC, Heating & More · 4.9★'],
  // ---- Home ----
  [`${P}/index.astro`, 'Wesley Chapel AC Repair & HVAC | I Care Air Care', 'Wesley Chapel AC Repair — Same-Day · 4.9★ 700+ Reviews'],
  // ---- Service areas ----
  [`${P}/service-areas/wesley-chapel-ac-repair.astro`, 'Wesley Chapel AC Repair & HVAC Services | I Care Air Care', 'Wesley Chapel AC Repair — Same-Day · 4.9★ (700+ Reviews)'],
  [`${P}/service-areas/pasco-county-ac-repair.astro`, 'Pasco County AC Repair & HVAC Services | I Care Air Care', 'Pasco County AC Repair — Same-Day · 4.9★ (700+)'],
  [`${P}/service-areas/new-tampa-heating-and-cooling.astro`, 'New Tampa AC Repair & HVAC | I Care Air Care', 'New Tampa AC Repair & HVAC — Same-Day · 4.9★ (700+)'],
  [`${P}/service-areas/land-o-lakes-hvac-services.astro`, "Land O' Lakes HVAC Services | I Care Air Care", "Land O' Lakes AC Repair & HVAC — Same-Day · 4.9★ (700+)"],
  [`${P}/service-areas/lutz-home-air-conditioning-service.astro`, 'Lutz Home AC & HVAC Service | I Care Air Care', 'Lutz AC & HVAC Service — Same-Day · 4.9★ (700+ Reviews)'],
  [`${P}/service-areas/odessa-emergency-ac-repair.astro`, 'Odessa AC Repair & Urgent HVAC | I Care Air Care', 'Odessa AC Repair & Urgent HVAC — Same-Day · 4.9★ (700+)'],
  [`${P}/service-areas/hillsborough-county-hvac-company.astro`, 'Hillsborough County HVAC Company | I Care Air Care', 'Hillsborough County HVAC & AC Repair — 4.9★ (700+)'],
  [`${P}/service-areas/polk-county-residential-ac-repair.astro`, 'Polk County Residential AC Repair & HVAC | I Care Air Care', 'Polk County AC Repair & HVAC — Same-Day · 4.9★ (700+)'],
  [`${P}/service-areas/air-conditioning-repair-zephyrhills-fl-i-care-air-care.astro`, 'AC Repair in Zephyrhills, FL | I Care Air Care', 'AC Repair Zephyrhills, FL — Same-Day · 4.9★ (700+ Reviews)'],
  [`${P}/service-areas/index.astro`, 'HVAC Service Areas | Wesley Chapel & Tampa Bay', 'HVAC Service Areas — Wesley Chapel & Tampa Bay · 4.9★'],
];

// [file, oldDescription, newDescription] — only the clearest meta wins
const METAS = [
  [`${P}/services/emergency-ac-repair-tampa.astro`,
    'Wesley Chapel urgent AC repair across Tampa Bay. Same-day service when available, flat-rate pricing, 1-year warranty. Call (813) 395-2324.',
    'AC out in the Florida heat? We prioritize urgent no-cool calls across Wesley Chapel & Tampa Bay — same-day when available, flat-rate pricing, 1-year warranty. Call (813) 395-2324.'],
];

let ok = 0, miss = 0;
async function apply(file, oldS, newS, kind) {
  const text = await readFile(file, 'utf8');
  const needle = `${kind}="${oldS}"`;
  if (!text.includes(needle)) { console.error(`MISS [${kind}] ${file}\n   wanted: ${oldS}`); miss++; return; }
  await writeFile(file, text.replace(needle, `${kind}="${newS}"`));
  ok++; console.log(`✓ ${kind}: ${file.split('/').pop()}`);
}

for (const [f, o, n] of TITLES) await apply(f, o, n, 'title');
for (const [f, o, n] of METAS) await apply(f, o, n, 'description');
console.log(`\nApplied ${ok} changes, ${miss} misses.`);
