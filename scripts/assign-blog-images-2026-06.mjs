// One-off: reassign unique hero images + unique imageAlt to the blog posts
// that previously shared duplicated images. Edits frontmatter only.
import { readFile, writeFile } from 'node:fs/promises';

const BLOG = 'src/content/blog';

// [file, image path, imageAlt]
const ASSIGN = [
  ['10-most-common-ac-problems-wesley-chapel-homes.md',
   '/images/10-common-ac-problems-wesley-chapel-technician-electrical-diagnostics.webp',
   'I Care Air Care technician running electrical diagnostics on an outdoor AC condenser in Wesley Chapel'],
  ['ac-repair-in-epperson-fast-reliable-cooling-for-lagoon-community-homes.md',
   '/images/ac-repair-epperson-condenser-refrigerant-gauges-i-care-air-care.webp',
   'AC condenser with refrigerant tank and I Care Air Care service gauges during AC repair in Epperson'],
  ['ac-repair-seven-oaks-wesley-chapel.md',
   '/images/ac-repair-seven-oaks-wesley-chapel-outdoor-condenser-tool-bag.webp',
   'Outdoor AC condenser and I Care Air Care tool bag ready for AC repair in Seven Oaks, Wesley Chapel'],
  ['ac-repair-wesley-chapel-fl.md',
   '/images/ac-repair-wesley-chapel-fl-technician-refrigerant-gauges-condenser.webp',
   'I Care Air Care technician using refrigerant gauges to repair an AC condenser in Wesley Chapel, FL'],
  ['ac-maintenance-tips.md',
   '/images/ac-maintenance-tips-tampa-bay-two-technicians-servicing-condenser.webp',
   'Two I Care Air Care technicians servicing an outdoor AC condenser during a Tampa Bay maintenance visit'],
  ['how-to-lower-cooling-bills-in-wesley-chapel-without-overworking-your-ac.md',
   '/images/lower-cooling-bills-wesley-chapel-technician-reviewing-energy-bill.webp',
   'I Care Air Care technician reviewing a high energy bill with a Wesley Chapel homeowner to lower cooling costs'],
  ['what-does-a-residential-preventive-hvac-maintenance-visit-include-in-wesley-chapel-fl.md',
   '/images/wesley-chapel-hvac-tune-up-new-pleated-air-filters.webp',
   'Clean pleated HVAC air filters replaced during a Wesley Chapel preventive maintenance tune-up'],
  ['seer2-explained-florida-2026.md',
   '/images/seer2-explained-florida-smart-thermostat-efficient-cooling.webp',
   'Smart thermostat set to 72 degrees with 45% humidity, illustrating SEER2 cooling efficiency in Florida'],
  ['ac-replacement-wesley-chapel-fl.md',
   '/images/ac-replacement-wesley-chapel-fl-technicians-installing-new-condenser.webp',
   'I Care Air Care technicians removing an old unit and installing a new AC condenser in Wesley Chapel, FL'],
  ['carrier-vs-trane-vs-rheem-tampa.md',
   '/images/carrier-outdoor-ac-condenser-unit-tampa-bay-brand-comparison.webp',
   'Carrier outdoor AC condenser installed at a Tampa Bay home, compared with Trane and Rheem'],
  ['new-construction-hvac-guide-for-epperson-mirada-homeowners.md',
   '/images/new-construction-hvac-epperson-mirada-indoor-air-handler-ductwork.webp',
   'Indoor HVAC air handler and ductwork in a new-construction Epperson and Mirada home'],
  ['why-homeowners-need-reliable-air-conditioning-repair-in-tampa.md',
   '/images/reliable-ac-repair-tampa-i-care-air-care-honest-pricing.webp',
   'I Care Air Care reliable AC repair with honest upfront pricing for Tampa homeowners'],
  ['how-to-find-reliable-heating-and-air-contractors-near-me.md',
   '/images/reliable-hvac-contractor-near-me-satisfied-homeowners-i-care-air-care.webp',
   'Happy homeowners with an I Care Air Care technician by the service van after finding a reliable HVAC contractor'],
  ['evaluate-hvac-companies-tampa-bay-repair-warranty.md',
   '/images/evaluate-hvac-warranty-tampa-technician-reviewing-quote-homeowner.webp',
   'I Care Air Care technician reviewing a repair quote and warranty with a Tampa Bay homeowner'],
  ['which-preventive-hvac-maintenance-plans-in-tampa-bay-offer-the-best-value.md',
   '/images/which-hvac-maintenance-plan-best-value-tampa-clean-ductwork.webp',
   'Clean, well-maintained galvanized HVAC ductwork representing the best-value Tampa Bay maintenance plans'],
  // --- filled from existing unused library images ---
  ['how-to-book-preventive-hvac-maintenance-in-tampa-bay-with-financing-options.md',
   '/images/HVAC-Services-in-Tampa-FL-%E2%80%93-AC-Refrigerant-Pressure-Testing.webp',
   'I Care Air Care technician performing AC refrigerant pressure testing during a preventive maintenance visit in Tampa Bay'],
  ['what-are-the-best-preventive-hvac-maintenance-plans-for-homeowners-in-tampa-bay-who-want-a-local-trusted-contractor.md',
   '/images/HVAC-Services-in-Tampa-FL-%E2%80%93-Outdoor-AC-Unit-Repair-Man.webp',
   'Local I Care Air Care technician servicing an outdoor AC unit for a trusted Tampa Bay maintenance plan'],
  ['air-conditioning-installation-wesley-chapel.md',
   '/images/air-conditioning-installation-wesley-chapel-new-outdoor-condenser-units-rooftop.webp',
   'Newly installed outdoor AC condenser units after an air conditioning installation in Wesley Chapel'],
  ['heat-pump-vs-ac-tampa.md',
   '/images/efficient-heat-pump-500-annual-savings-vs-standard-ac-furnace.webp',
   'Infographic comparing an efficient heat pump annual savings versus a standard AC and furnace in Tampa'],
  ['why-is-my-ac-running-but-not-cooling-in-florida-what-homeowners-need-to-know.md',
   '/images/air-conditioning-not-cooling-tampa-fl-homeowner-ac-remote-control-troubleshooting.webp',
   'Florida homeowner using a remote to troubleshoot an AC that is running but not cooling'],
  ['ac-blowing-warm-air-in-wesley-chapel-7-common-causes-and-how-we-fix-them.md',
   '/images/ac-blowing-warm-air-tampa-technician-mini-split-indoor-unit-inspection-repair.webp',
   'I Care Air Care technician inspecting a mini-split indoor unit blowing warm air in Wesley Chapel'],
];

let changed = 0;
for (const [file, image, alt] of ASSIGN) {
  const path = `${BLOG}/${file}`;
  let text = await readFile(path, 'utf8');
  const before = text;

  // replace the image: line
  text = text.replace(/^image:\s*.*$/m, `image: "${image}"`);

  // replace existing imageAlt, or insert one right after the image line
  if (/^imageAlt:\s*.*$/m.test(text)) {
    text = text.replace(/^imageAlt:\s*.*$/m, `imageAlt: "${alt}"`);
  } else {
    text = text.replace(/^(image:\s*.*)$/m, `$1\nimageAlt: "${alt}"`);
  }

  if (text !== before) { await writeFile(path, text); changed++; console.log('✓', file); }
  else console.error('NO CHANGE:', file);
}
console.log(`\nUpdated ${changed}/${ASSIGN.length} posts`);
