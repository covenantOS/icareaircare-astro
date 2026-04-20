import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const services = [
  ['ac-repair-tampa', 'AC Repair in Tampa', 'Fast, honest AC repair across Tampa Bay. Licensed techs, same-day service, no pressure diagnostics.'],
  ['emergency-ac-repair-tampa', 'Emergency AC Repair in Tampa', '24/7 emergency AC repair when your system fails. Dispatched from Wesley Chapel across the Tampa Bay area.'],
  ['ac-maintenance-tampa', 'AC Maintenance in Tampa', 'Preventive AC maintenance & tune-ups that extend equipment life and cut your cooling bill.'],
  ['hvac-installation-tampa', 'HVAC Installation in Tampa', 'High-efficiency HVAC installations done right the first time — sized, permitted and guaranteed.'],
  ['air-duct-cleaning-tampa', 'Air Duct Cleaning in Tampa', 'Professional 7-step air duct cleaning to remove dust, allergens and biological contaminants.'],
  ['heating-services-tampa', 'Heating Services in Tampa', 'Heat pump and furnace repair, tune-ups and replacements across Tampa Bay.'],
  ['refrigeration-repair-tampa', 'Refrigeration Repair in Tampa', 'Commercial refrigeration service for Tampa Bay restaurants and retailers.'],
  ['thermostat-installation-tampa', 'Thermostat Installation in Tampa', 'Smart thermostat installation, wiring and setup — compatible with all major HVAC brands.'],
];

const areas = [
  ['wesley-chapel-ac-repair', 'Wesley Chapel', 'Wesley Chapel AC Repair & HVAC Services'],
  ['pasco-county-ac-repair', 'Pasco County', 'Pasco County AC Repair'],
  ['hillsborough-county-hvac-company', 'Hillsborough County', 'Hillsborough County HVAC Company'],
  ['polk-county-residential-ac-repair', 'Polk County', 'Polk County Residential AC Repair'],
  ['land-o-lakes-hvac-services', 'Land O\u2019 Lakes', 'Land O\u2019 Lakes HVAC Services'],
  ['lutz-home-air-conditioning-service', 'Lutz', 'Lutz Home Air Conditioning Service'],
  ['new-tampa-heating-and-cooling', 'New Tampa', 'New Tampa Heating and Cooling'],
  ['odessa-emergency-ac-repair', 'Odessa', 'Odessa Emergency AC Repair'],
  ['air-conditioning-repair-zephyrhills-fl-i-care-air-care', 'Zephyrhills', 'Zephyrhills Air Conditioning Repair'],
];

const write = (path, content) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); };

const makeStub = ({ layoutPath, heroPath, ctaPath, title, desc, h1, eyebrow, trail, ctaLabel }) => {
  const t = JSON.stringify(trail);
  return `---
import BaseLayout from '${layoutPath}';
import Hero from '${heroPath}';
import CTABand from '${ctaPath}';
---
<BaseLayout
  title=${JSON.stringify(title)}
  description=${JSON.stringify(desc)}
  breadcrumbs={${t}}
>
  <Hero eyebrow=${JSON.stringify(eyebrow)} title=${JSON.stringify(h1)} subtitle=${JSON.stringify(desc)} ctaLabel=${JSON.stringify(ctaLabel || 'Schedule Service')} />
  <section class="py-16">
    <div class="container-site max-w-3xl prose-icac">
      <p class="text-slate-500 italic">[Phase 2/3 will rewrite this page with fresh 2026-researched content, full FAQ section, local signals and Service schema. This stub preserves the URL so rankings survive the migration.]</p>
    </div>
  </section>
  <CTABand />
</BaseLayout>
`;
};

for (const [slug, name, desc] of services) {
  const trail = [
    { name: 'Home', url: 'https://www.icareaircare.com/' },
    { name: 'Services', url: 'https://www.icareaircare.com/services/' },
    { name, url: `https://www.icareaircare.com/services/${slug}/` },
  ];
  write(`src/pages/services/${slug}.astro`, makeStub({
    layoutPath: '../../layouts/BaseLayout.astro',
    heroPath: '../../components/Hero.astro',
    ctaPath: '../../components/CTABand.astro',
    title: `${name} | I Care Air Care`,
    desc,
    h1: name,
    eyebrow: 'HVAC Service',
    trail,
  }));
}

for (const [slug, city, hdr] of areas) {
  const trail = [
    { name: 'Home', url: 'https://www.icareaircare.com/' },
    { name: 'Service Areas', url: 'https://www.icareaircare.com/service-areas/' },
    { name: city, url: `https://www.icareaircare.com/service-areas/${slug}/` },
  ];
  write(`src/pages/service-areas/${slug}.astro`, makeStub({
    layoutPath: '../../layouts/BaseLayout.astro',
    heroPath: '../../components/Hero.astro',
    ctaPath: '../../components/CTABand.astro',
    title: `${hdr} | I Care Air Care`,
    desc: `Local HVAC & AC repair in ${city}, FL. 30+ years experience, 4.9★ Google rated. Call (813) 395-2324.`,
    h1: hdr,
    eyebrow: `${city}, FL`,
    trail,
  }));
}

write('src/pages/service-areas/index.astro', `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import AreaGrid from '../../components/AreaGrid.astro';
import CTABand from '../../components/CTABand.astro';
---
<BaseLayout
  title="Service Areas | I Care Air Care"
  description="We serve Wesley Chapel, Tampa, Land O Lakes, Lutz, New Tampa, Odessa, Zephyrhills, Pasco, Hillsborough & Polk counties."
  breadcrumbs={[{name:'Home',url:'https://www.icareaircare.com/'},{name:'Service Areas',url:'https://www.icareaircare.com/service-areas/'}]}
>
  <section class="bg-brand-800 text-white py-14">
    <div class="container-site">
      <p class="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Where we work</p>
      <h1 class="mt-2 text-4xl md:text-5xl font-bold text-white">Service areas across Tampa Bay</h1>
    </div>
  </section>
  <AreaGrid />
  <CTABand />
</BaseLayout>
`);

const simple = [
  ['about-us', 'About Us', 'Family-run Tampa Bay HVAC contractor with 30+ years of experience.'],
  ['our-team', 'Our Team', 'Meet the licensed technicians behind I Care Air Care.'],
  ['contact', 'Contact Us', 'Call (813) 395-2324 or book online. We serve Wesley Chapel & Tampa Bay.'],
  ['reviews', 'Reviews', 'Read 120+ verified 5-star Google reviews from Tampa Bay homeowners.'],
  ['financing', 'Financing', 'Flexible HVAC financing options with approved credit.'],
  ['blogs', 'HVAC Blog', 'Tips, guides and news from I Care Air Care HVAC technicians.'],
];
for (const [slug, title, desc] of simple) {
  const trail = [
    { name: 'Home', url: 'https://www.icareaircare.com/' },
    { name: title, url: `https://www.icareaircare.com/${slug}/` },
  ];
  write(`src/pages/${slug}.astro`, `---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import CTABand from '../components/CTABand.astro';
---
<BaseLayout
  title=${JSON.stringify(`${title} | I Care Air Care`)}
  description=${JSON.stringify(desc)}
  breadcrumbs={${JSON.stringify(trail)}}
>
  <Hero title=${JSON.stringify(title)} subtitle=${JSON.stringify(desc)} ctaLabel="Call Us" />
  <section class="py-16">
    <div class="container-site max-w-3xl prose-icac">
      <p class="text-slate-500 italic">[Phase 4 will rewrite this page with full content and schema.]</p>
    </div>
  </section>
  <CTABand />
</BaseLayout>
`);
}

write('src/pages/404.astro', `---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Page Not Found | I Care Air Care" description="The page you requested could not be found." noindex>
  <section class="py-28 text-center">
    <div class="container-site max-w-xl">
      <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">404</p>
      <h1 class="mt-3 text-4xl font-bold">We can\u2019t find that page.</h1>
      <p class="mt-3 text-slate-600">Try the homepage, or give us a call.</p>
      <a href="/" class="mt-6 inline-flex rounded-full bg-brand-600 text-white px-5 py-3 font-semibold">Back home</a>
    </div>
  </section>
</BaseLayout>
`);

console.log('Stubs generated.');
