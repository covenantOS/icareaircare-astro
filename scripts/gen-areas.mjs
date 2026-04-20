import { writeFileSync } from 'node:fs';

const areas = [
  {
    slug: 'pasco-county-ac-repair',
    city: 'Pasco County',
    h1: 'Pasco County AC Repair & HVAC Services',
    title: 'Pasco County AC Repair & HVAC | I Care Air Care',
    desc: 'Pasco County\'s 4.9★ HVAC contractor. Based in Wesley Chapel — serving Wesley Chapel, New Port Richey, Port Richey, Hudson, Dade City. Call (813) 395-2324.',
    subtitle: 'Serving Wesley Chapel, New Port Richey, Port Richey, Hudson, Dade City, Zephyrhills, San Antonio & every Pasco County community.',
    eyebrow: 'Pasco County, FL',
    hoods: ['Wesley Chapel', 'New Port Richey', 'Port Richey', 'Hudson', 'Dade City', 'Zephyrhills', 'Land O\u2019 Lakes', 'Lutz', 'San Antonio', 'Spring Hill', 'Trinity', 'Odessa'],
    intro: `<h2>Pasco County's trusted local HVAC contractor</h2>
<p>Pasco County has grown faster than almost any county in Florida — and with that growth comes a flood of HVAC contractors trying to cash in. We've been here the whole time. I Care Air Care has served Pasco County since 2010 from our base in Wesley Chapel, building a reputation (700+ five-star Google reviews) on one thing: treating every homeowner like a neighbor.</p>
<h2>Where we work in Pasco County</h2>
<p>From the east side's new-construction communities (Wesley Chapel's Epperson and Mirada, Zephyrhills' Silverado and Abbott Park) to the established west-side neighborhoods of New Port Richey, Port Richey and Hudson, our technicians cover the entire county. Dade City, San Antonio, Trinity, Odessa and Land O' Lakes are all on our regular service map.</p>
<h2>Pasco County HVAC services</h2>
<p>Every core HVAC service we offer is available county-wide — <a href="/services/ac-repair-tampa/">AC repair</a>, <a href="/services/emergency-ac-repair-tampa/">emergency service</a>, <a href="/services/ac-maintenance-tampa/">tune-ups and maintenance plans</a>, <a href="/services/hvac-installation-tampa/">new system installation</a>, <a href="/services/air-duct-cleaning-tampa/">duct cleaning</a>, <a href="/services/heating-services-tampa/">heating</a>, <a href="/services/thermostat-installation-tampa/">smart thermostats</a>, and <a href="/services/refrigeration-repair-tampa/">commercial refrigeration</a>. We\'re licensed to pull Pasco County permits (CAC1816515) and handle all permitting and inspection logistics.</p>`,
    faqs: [
      { q: 'How far will you drive in Pasco County?', a: 'Anywhere. From New Port Richey to Dade City, Zephyrhills to Land O\' Lakes — we service the entire county from our Wesley Chapel base.' },
      { q: 'Do you pull Pasco County HVAC permits?', a: 'Yes, we handle all Pasco County permitting and scheduling of inspections under Florida license CAC1816515.' },
      { q: 'Is there an extra charge for west-side Pasco service?', a: 'No. Flat-rate pricing county-wide.' },
      { q: 'Do you service manufactured/mobile homes?', a: 'Yes — we regularly service manufactured homes in Zephyrhills, Dade City and elsewhere in Pasco County.' },
    ],
  },
  {
    slug: 'hillsborough-county-hvac-company',
    city: 'Hillsborough County',
    h1: 'Hillsborough County HVAC Company',
    title: 'Hillsborough County HVAC Company | I Care Air Care',
    desc: 'Hillsborough County HVAC — Tampa, New Tampa, Lutz, Carrollwood, Brandon. 4.9★ with 700+ reviews. AC repair, installation, duct cleaning. Call (813) 395-2324.',
    subtitle: 'Serving Tampa, New Tampa, Lutz, Carrollwood, Brandon, Riverview, Valrico, Seffner & every Hillsborough community.',
    eyebrow: 'Hillsborough County, FL',
    hoods: ['Tampa', 'New Tampa', 'Lutz', 'Carrollwood', 'Brandon', 'Riverview', 'Valrico', 'Seffner', 'Temple Terrace', 'Westchase', 'Town \u2019N Country', 'Thonotosassa'],
    intro: `<h2>Hillsborough County HVAC — based next door in Wesley Chapel</h2>
<p>We're headquartered just north of the Hillsborough line in Wesley Chapel, which puts us within easy reach of every major Hillsborough community. Whether it's a same-day AC repair in New Tampa, a new system installation in Carrollwood, or duct cleaning in Brandon, our technicians are already in the area.</p>
<h2>Communities we serve in Hillsborough</h2>
<p>North Hillsborough is our strongest coverage — <strong>New Tampa, Tampa Palms, Hunter\'s Green, Tampa</strong>, <strong>Carrollwood, Westchase, Lutz</strong> and <strong>Temple Terrace</strong> are all short drives from our Wesley Chapel base. We also service <strong>Brandon, Riverview, Valrico, Seffner and Thonotosassa</strong> on the east side, and can reach <strong>South Tampa, Town \'N Country and MacDill</strong> for larger projects.</p>
<h2>The full HVAC service line for Hillsborough homes</h2>
<p>Every service we offer is available throughout Hillsborough: <a href="/services/ac-repair-tampa/">AC repair</a>, <a href="/services/emergency-ac-repair-tampa/">emergency dispatch</a>, <a href="/services/ac-maintenance-tampa/">maintenance plans</a>, <a href="/services/hvac-installation-tampa/">high-efficiency installations</a>, <a href="/services/air-duct-cleaning-tampa/">duct cleaning</a>, <a href="/services/heating-services-tampa/">heating services</a>, <a href="/services/thermostat-installation-tampa/">smart thermostats</a>, and <a href="/services/refrigeration-repair-tampa/">commercial refrigeration</a>. All backed by our 1-year repair warranty and 700+ verified 5-star reviews.</p>`,
    faqs: [
      { q: 'Do you pull Hillsborough County permits?', a: 'Yes. All our Hillsborough installs are permitted and inspected to code.' },
      { q: 'How fast can you reach Brandon or Riverview?', a: 'Typically 60–90 minutes from our Wesley Chapel base. Central Tampa and New Tampa are often faster.' },
      { q: 'Do you service older homes in South Tampa?', a: 'Yes — we handle the duct work, electrical and space constraints common to older Tampa neighborhoods.' },
      { q: 'Are rates the same across Hillsborough?', a: 'Yes, flat-rate pricing regardless of where in the county you are.' },
    ],
  },
  {
    slug: 'polk-county-residential-ac-repair',
    city: 'Polk County',
    h1: 'Polk County Residential AC Repair',
    title: 'Polk County Residential AC Repair | I Care Air Care',
    desc: 'Polk County residential AC repair and HVAC services — Lakeland, Plant City, Davenport, Auburndale. 4.9★ · 700+ reviews. Call (813) 395-2324.',
    subtitle: 'Serving the western Polk County corridor — Lakeland, Plant City, Davenport, Auburndale — with fast, honest residential HVAC service.',
    eyebrow: 'Polk County, FL',
    hoods: ['Lakeland', 'Plant City', 'Davenport', 'Auburndale', 'Mulberry', 'Bartow', 'Lake Alfred', 'Haines City'],
    intro: `<h2>Polk County residential HVAC — western corridor specialists</h2>
<p>Western Polk County — Lakeland, Plant City, Davenport, Auburndale — has exploded with new residential growth, and we've been right there alongside that growth. From our Wesley Chapel base we run a regular service loop into the I-4 corridor covering routine repairs, system replacements, and maintenance plans for homeowners who want a local family contractor rather than a big-box chain.</p>
<h2>Polk County HVAC services</h2>
<p>We offer the full residential HVAC service line across Polk: <a href="/services/ac-repair-tampa/">AC repair</a>, <a href="/services/emergency-ac-repair-tampa/">24/7 emergency dispatch</a>, <a href="/services/ac-maintenance-tampa/">seasonal tune-ups</a>, <a href="/services/hvac-installation-tampa/">new system installation</a>, <a href="/services/air-duct-cleaning-tampa/">duct cleaning</a>, <a href="/services/heating-services-tampa/">heating</a>, and <a href="/services/thermostat-installation-tampa/">smart thermostat installation</a>. Every install is Manual-J sized and permit-pulled. Every repair is flat-rate quoted and backed by a 1-year warranty.</p>`,
    faqs: [
      { q: 'Do you service Lakeland and Plant City?', a: 'Yes — both are regular stops on our Polk County service route.' },
      { q: 'Are rates different for Polk County?', a: 'No — our flat-rate pricing is county-independent.' },
      { q: 'Do you pull Polk County permits?', a: 'Yes. Florida license CAC1816515 covers all Polk County installs.' },
      { q: 'Do you handle Davenport area new-construction?', a: 'Yes — we work with several Davenport new-construction homeowners on system upgrades and supplemental installs.' },
    ],
  },
  {
    slug: 'land-o-lakes-hvac-services',
    city: 'Land O\u2019 Lakes',
    h1: 'Land O\u2019 Lakes HVAC Services',
    title: 'Land O\u2019 Lakes HVAC Services | I Care Air Care',
    desc: 'Land O\u2019 Lakes HVAC contractor — AC repair, installation, maintenance, duct cleaning. 4.9★ local team. Serving Connerton, Bexley, Dupree Lakes. Call (813) 395-2324.',
    subtitle: 'Your Wesley Chapel neighbors — 10 minutes away. Serving Connerton, Bexley, Dupree Lakes, Lake Padgett & all of Land O\' Lakes.',
    eyebrow: 'Land O\u2019 Lakes, FL',
    hoods: ['Connerton', 'Bexley', 'Dupree Lakes', 'Lake Padgett', 'Ballantrae', 'Stonegate', 'Oak Grove', 'Sunset Lakes', 'Wilderness Lake Preserve'],
    intro: `<h2>Land O' Lakes HVAC — from our Wesley Chapel base, 10 minutes away</h2>
<p>Land O' Lakes is one of our fastest-response areas — under 15 minutes from our Wesley Chapel headquarters to most neighborhoods. That means when your AC quits on a 95° July afternoon in <strong>Connerton, Bexley, Dupree Lakes</strong> or <strong>Lake Padgett</strong>, we're often the first truck in your driveway.</p>
<h2>Services across Land O' Lakes</h2>
<p>Every HVAC service we offer is available throughout Land O' Lakes, from emergency <a href="/services/ac-repair-tampa/">AC repair</a> and <a href="/services/ac-maintenance-tampa/">preventive tune-ups</a> to <a href="/services/hvac-installation-tampa/">full system replacements</a>, <a href="/services/air-duct-cleaning-tampa/">duct cleaning</a> and <a href="/services/thermostat-installation-tampa/">smart thermostat installation</a>. We handle the permits, pull the inspections, and give you a written quote before any work begins.</p>
<h2>Why homeowners in Connerton and Bexley choose us</h2>
<p>Newer Land O' Lakes communities like Connerton and Bexley have builder-grade systems that often under-perform in Florida humidity. We're regulars in both communities, specializing in supplemental upgrades: humidity-aware smart thermostats, variable-speed blower upgrades, and resized returns that fix the cold-bedroom / warm-living-room problem.</p>`,
    faqs: [
      { q: 'How fast can you reach Land O\' Lakes?', a: 'Typically 10–20 minutes from our Wesley Chapel base — one of our quickest response areas.' },
      { q: 'Do you service Connerton and Bexley?', a: 'Yes — we service every major Land O\' Lakes community including Connerton, Bexley, Dupree Lakes and Lake Padgett.' },
      { q: 'What does AC repair cost in Land O\' Lakes?', a: 'Flat-rate, typically $150–$600 depending on the issue. Quoted before any work begins.' },
      { q: 'Can you handle new-construction humidity problems?', a: 'Yes — this is a common call-out in Land O\' Lakes newer builds. Usually a thermostat & return-sizing fix.' },
    ],
  },
  {
    slug: 'lutz-home-air-conditioning-service',
    city: 'Lutz',
    h1: 'Lutz Home Air Conditioning Service',
    title: 'Lutz Home Air Conditioning Service | I Care Air Care',
    desc: 'Lutz, FL AC repair, tune-ups, and installation. Local Wesley Chapel-based HVAC team. 4.9★ · 700+ reviews. Call (813) 395-2324 for same-day service.',
    subtitle: 'Serving Cheval, Cordoba Ranch, Lake Fern, Van Dyke & all Lutz homes with fast, honest AC repair and HVAC service.',
    eyebrow: 'Lutz, FL',
    hoods: ['Cheval', 'Cordoba Ranch', 'Lake Fern', 'Van Dyke', 'Steinbrenner', 'Lutz Lake Fern', 'Sunlake'],
    intro: `<h2>Lutz HVAC service — local team, fast response</h2>
<p>Lutz sits right between our Wesley Chapel base and central Tampa, putting us within a 20-minute response for almost every neighborhood. From the gated communities around <strong>Cheval</strong> and <strong>Cordoba Ranch</strong> to the older homes along <strong>Lake Fern Road</strong> and <strong>Van Dyke</strong>, our team has worked on thousands of Lutz HVAC systems.</p>
<h2>Lutz HVAC services we provide</h2>
<p>The full line: <a href="/services/ac-repair-tampa/">AC repair</a>, <a href="/services/emergency-ac-repair-tampa/">emergency service</a>, <a href="/services/ac-maintenance-tampa/">21-point tune-ups</a>, <a href="/services/hvac-installation-tampa/">new system installation</a>, <a href="/services/air-duct-cleaning-tampa/">duct cleaning</a>, <a href="/services/heating-services-tampa/">heating repair</a>, <a href="/services/thermostat-installation-tampa/">smart thermostats</a>, and <a href="/services/refrigeration-repair-tampa/">commercial refrigeration</a> for Lutz small businesses.</p>`,
    faqs: [
      { q: 'How quickly can you reach Lutz?', a: 'Usually 15–25 minutes. We service Lutz every day.' },
      { q: 'Do you service Cheval and Cordoba Ranch?', a: 'Yes — regularly. We know the access protocols at the gated communities.' },
      { q: 'Is there a travel fee for Lutz?', a: 'No — flat-rate pricing county-wide.' },
      { q: 'Do you handle both Hillsborough and Pasco sides of Lutz?', a: 'Yes — we pull permits in both counties under Florida license CAC1816515.' },
    ],
  },
  {
    slug: 'new-tampa-heating-and-cooling',
    city: 'New Tampa',
    h1: 'New Tampa Heating & Cooling',
    title: 'New Tampa Heating & Cooling | I Care Air Care',
    desc: 'New Tampa HVAC services — AC repair, heating, installation, duct cleaning. Serving Tampa Palms, Hunter\'s Green, K-Bar Ranch, Cory Lake. Call (813) 395-2324.',
    subtitle: 'Serving Tampa Palms, Hunter\'s Green, K-Bar Ranch, Cory Lake Isles, Cross Creek & every New Tampa community.',
    eyebrow: 'New Tampa, FL',
    hoods: ['Tampa Palms', 'Hunter\u2019s Green', 'K-Bar Ranch', 'Cory Lake Isles', 'Cross Creek', 'Easton Park', 'Live Oak Preserve', 'Richmond Place', 'Pebble Creek'],
    intro: `<h2>New Tampa HVAC — the same-day specialists for Pebble Creek to K-Bar Ranch</h2>
<p>New Tampa's explosive growth through the early 2000s means thousands of homes here are hitting the 20-year mark all at once — which is exactly when HVAC systems start to fail. We've seen the pattern in every New Tampa community: <strong>Tampa Palms, Hunter's Green, Pebble Creek</strong> and <strong>Cross Creek</strong> all have concentrated clusters of replacement-age equipment.</p>
<p>From our Wesley Chapel base we can be anywhere in New Tampa in under 20 minutes. That proximity, combined with 15+ years of hands-on experience in these exact neighborhoods, is why we're the local go-to for honest diagnosis and no-pressure quotes.</p>
<h2>Heating &amp; cooling services for New Tampa homes</h2>
<p><a href="/services/ac-repair-tampa/">AC repair</a>, <a href="/services/emergency-ac-repair-tampa/">emergency dispatch</a>, <a href="/services/ac-maintenance-tampa/">tune-ups</a>, <a href="/services/hvac-installation-tampa/">high-efficiency installation</a>, <a href="/services/air-duct-cleaning-tampa/">duct cleaning</a>, <a href="/services/heating-services-tampa/">heat pump & heat strip service</a>, <a href="/services/thermostat-installation-tampa/">smart thermostats</a>, and <a href="/services/refrigeration-repair-tampa/">commercial refrigeration</a>. All backed by our 1-year warranty and 700+ verified Google reviews.</p>`,
    faqs: [
      { q: 'How fast can you reach New Tampa?', a: 'Typically 15–25 minutes. Often faster than most Tampa-based contractors.' },
      { q: 'Do you service Tampa Palms and K-Bar Ranch?', a: 'Yes — frequent service area. We know the common HVAC issues for homes of that vintage.' },
      { q: 'Is New Tampa equipment reaching replacement age?', a: 'Many systems from the 2000s build boom are hitting 18–22 years — past the economic repair point. We\'ll give you honest replace-vs-repair math.' },
      { q: 'Do you offer New Tampa emergency dispatch?', a: 'Yes — 24/7. Most emergency calls in New Tampa reached within 60–90 minutes.' },
    ],
  },
  {
    slug: 'odessa-emergency-ac-repair',
    city: 'Odessa',
    h1: 'Odessa Emergency AC Repair',
    title: 'Odessa Emergency AC Repair | I Care Air Care',
    desc: 'Odessa, FL 24/7 emergency AC repair and HVAC services. Fast response across Keystone, Lake Keystone, Starkey Ranch. Call (813) 395-2324.',
    subtitle: '24/7 emergency AC repair and HVAC service in Odessa, Keystone & the Starkey Ranch corridor.',
    eyebrow: 'Odessa, FL',
    hoods: ['Keystone', 'Lake Keystone', 'Starkey Ranch', 'Gunn Highway', 'Citrus Park', 'Westchase border'],
    intro: `<h2>Odessa &amp; Keystone — fast emergency HVAC response</h2>
<p>Odessa and Keystone sit between our Wesley Chapel base and the Hillsborough line. When AC fails in Odessa during a July heat wave, our emergency dispatch can usually have a technician on site within 90 minutes — often sooner for <strong>Starkey Ranch</strong>, <strong>Keystone</strong>, and the <strong>Gunn Highway corridor</strong>.</p>
<h2>Every HVAC service, 24/7 when needed</h2>
<p>We handle emergency <a href="/services/emergency-ac-repair-tampa/">AC repair</a>, routine <a href="/services/ac-maintenance-tampa/">maintenance</a>, <a href="/services/hvac-installation-tampa/">new system installation</a>, <a href="/services/air-duct-cleaning-tampa/">duct cleaning</a>, <a href="/services/heating-services-tampa/">heating</a>, and <a href="/services/thermostat-installation-tampa/">smart thermostats</a> across Odessa. Flat-rate pricing, 1-year warranty, Florida-licensed (CAC1816515).</p>`,
    faqs: [
      { q: 'What\'s your Odessa emergency response time?', a: 'Typically 60–90 minutes from call to on-site. Faster for Starkey Ranch and Gunn Highway neighborhoods.' },
      { q: 'Are after-hours rates much higher?', a: 'A modest dispatch fee — still flat-rate, still quoted before any work.' },
      { q: 'Do you service Starkey Ranch?', a: 'Yes. Starkey Ranch is a regular service community for us.' },
      { q: 'Keystone properties often have larger HVAC systems — can you handle those?', a: 'Absolutely — multi-zone, high-tonnage residential systems are our specialty.' },
    ],
  },
  {
    slug: 'air-conditioning-repair-zephyrhills-fl-i-care-air-care',
    city: 'Zephyrhills',
    h1: 'Air Conditioning Repair in Zephyrhills, FL',
    title: 'AC Repair in Zephyrhills, FL | I Care Air Care',
    desc: 'Zephyrhills AC repair and HVAC services — Silverado, Abbott Park, Link\'s Landing. Fast local response, 4.9★ · 700+ reviews. Call (813) 395-2324.',
    subtitle: 'Serving Silverado, Abbott Park, Link\'s Landing & every Zephyrhills neighborhood from our Wesley Chapel base.',
    eyebrow: 'Zephyrhills, FL',
    hoods: ['Silverado', 'Abbott Park', 'Link\u2019s Landing', 'Hidden River', 'Betmar Acres', 'Zephyr Lakes'],
    intro: `<h2>Zephyrhills AC repair &amp; HVAC — the local contractor your neighbors trust</h2>
<p>Zephyrhills has seen a major wave of new construction along the east side — <strong>Silverado, Abbott Park, Link's Landing</strong> — while the established communities (<strong>Betmar Acres, Hidden River</strong>, the original Zephyrhills core) continue to need reliable HVAC service for aging equipment. We handle both.</p>
<p>From our Wesley Chapel base, Zephyrhills is a short, regular drive on Highway 54. Most service calls we're on-site the same business day.</p>
<h2>Zephyrhills HVAC services</h2>
<p>Complete residential HVAC line: <a href="/services/ac-repair-tampa/">AC repair</a>, <a href="/services/emergency-ac-repair-tampa/">emergency dispatch</a>, <a href="/services/ac-maintenance-tampa/">tune-ups &amp; maintenance plans</a>, <a href="/services/hvac-installation-tampa/">new system installation</a>, <a href="/services/air-duct-cleaning-tampa/">duct cleaning</a>, <a href="/services/heating-services-tampa/">heating</a>, and <a href="/services/thermostat-installation-tampa/">smart thermostat installation</a>. We also handle manufactured-home HVAC common to Zephyrhills, and commercial refrigeration for local restaurants and markets.</p>`,
    faqs: [
      { q: 'How fast can you reach Zephyrhills?', a: 'Typically 30–45 minutes from our Wesley Chapel base.' },
      { q: 'Do you service Betmar Acres and manufactured homes?', a: 'Yes — frequently. We know the specific HVAC and ductwork considerations for these homes.' },
      { q: 'Do you service new construction in Silverado and Abbott Park?', a: 'Yes — supplementing builder-grade systems with smart thermostats, better returns, and humidity control is a common call.' },
      { q: 'Are rates the same for Zephyrhills service?', a: 'Yes — county-wide flat-rate pricing.' },
    ],
  },
];

for (const a of areas) {
  const content = `---
import ServiceAreaLayout from '../../layouts/ServiceAreaLayout.astro';

const faqs = ${JSON.stringify(a.faqs, null, 2)};
---
<ServiceAreaLayout
  slug=${JSON.stringify(a.slug)}
  title=${JSON.stringify(a.title)}
  description=${JSON.stringify(a.desc)}
  h1=${JSON.stringify(a.h1)}
  eyebrow=${JSON.stringify(a.eyebrow)}
  subtitle={${JSON.stringify(a.subtitle)}}
  heroImage="/images/ICAC%20Team%281%29.webp"
  cityName=${JSON.stringify(a.city)}
  faqs={faqs}
  neighborhoods={${JSON.stringify(a.hoods)}}
>
${a.intro}
</ServiceAreaLayout>
`;
  writeFileSync(`src/pages/service-areas/${a.slug}.astro`, content);
  console.log('wrote', a.slug);
}
console.log('done');
