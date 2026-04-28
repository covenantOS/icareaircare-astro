export const SITE = {
  name: 'I Care Air Care',
  legalName: 'I Care Air Care LLC',
  tagline: 'Honest HVAC service for Wesley Chapel, Tampa Bay & surrounding communities.',
  // One-line brand disambiguation for AI engines and meta descriptions.
  brandSentence: 'I Care Air Care (one company, founded 2010 by Tim Hawk in Wesley Chapel, FL).',
  url: 'https://www.icareaircare.com',
  phone: '(813) 395-2324',
  phoneHref: 'tel:+18133952324',
  bookUrl: 'https://book.housecallpro.com/book/I-Care-Air-Care/cb3eaa8c',
  // Branded short link — same destination, cleaner share, lets us swap providers later.
  bookPath: '/book/',
  email: 'tim@icareaircare.com',
  license: 'CAC1816515',
  address: {
    street: '27022 Foamflower Blvd',
    city: 'Wesley Chapel',
    region: 'FL',
    postalCode: '33544',
    country: 'US',
  },
  geo: { latitude: 28.2426914, longitude: -82.3726776 },
  hours: 'Office: Mon-Fri 8a-6p, Sat 10a-4p • Call for urgent no-cool help',
  hoursStructured: [
    { days: 'Mon–Fri', open: '8:00am', close: '6:00pm' },
    { days: 'Sat', open: '10:00am', close: '4:00pm' },
  ],
  rating: { value: 4.9, count: 600 },
  yearsInBusiness: 15,
  foundedYear: 2010,
  owner: 'Tim Hawk',
  founder: {
    name: 'Tim Hawk',
    jobTitle: 'Owner & Master HVAC Technician',
    yearsInTrade: 30,
    image: '/images/tim-hawk-owner.webp',
    bio: 'Tim Hawk founded I Care Air Care in 2010 after more than three decades in the Tampa Bay HVAC trade. Florida-licensed master contractor (CAC1816515), EPA Section 608 Universal certified.',
    credentials: [
      { name: 'Florida HVAC Mechanical Contractor License CAC1816515', issuer: 'Florida Department of Business and Professional Regulation', credentialCategory: 'license' },
      { name: 'EPA Section 608 Universal Certification', issuer: 'United States Environmental Protection Agency', credentialCategory: 'certification' },
    ],
    sameAs: [
      'https://www.icareaircare.com/about-us/',
      'https://maps.app.goo.gl/2iCjuu1yf3GAbvSS8',
    ],
  },
  socials: {
    google: 'https://maps.app.goo.gl/2iCjuu1yf3GAbvSS8',
  },
  serviceAreas: [
    { slug: 'wesley-chapel-ac-repair', name: 'Wesley Chapel' },
    { slug: 'pasco-county-ac-repair', name: 'Pasco County' },
    { slug: 'hillsborough-county-hvac-company', name: 'Hillsborough County' },
    { slug: 'polk-county-residential-ac-repair', name: 'Polk County' },
    { slug: 'land-o-lakes-hvac-services', name: "Land O' Lakes" },
    { slug: 'lutz-home-air-conditioning-service', name: 'Lutz' },
    { slug: 'new-tampa-heating-and-cooling', name: 'New Tampa' },
    { slug: 'odessa-emergency-ac-repair', name: 'Odessa' },
    { slug: 'air-conditioning-repair-zephyrhills-fl-i-care-air-care', name: 'Zephyrhills' },
  ],
  services: [
    { slug: 'ac-repair-tampa', name: 'AC Repair' },
    { slug: 'emergency-ac-repair-tampa', name: 'Emergency AC Repair' },
    { slug: 'ac-maintenance-tampa', name: 'AC Maintenance' },
    { slug: 'hvac-installation-tampa', name: 'HVAC Installation' },
    { slug: 'air-duct-cleaning-tampa', name: 'Air Duct Cleaning' },
    { slug: 'heating-services-tampa', name: 'Heating Services' },
    { slug: 'refrigeration-repair-tampa', name: 'Refrigeration Repair' },
    { slug: 'thermostat-installation-tampa', name: 'Thermostat Installation' },
  ],
  // Common 2026 flat-rate ranges. Surface as PriceSpecification on relevant pages
  // and as plain copy in pricing tables. Update annually.
  priceList: [
    { item: 'Diagnostic visit (credited toward repair)', min: 89, max: 89 },
    { item: 'Capacitor replacement', min: 180, max: 260 },
    { item: 'Contactor replacement', min: 180, max: 300 },
    { item: 'Condenser fan motor', min: 400, max: 650 },
    { item: 'Refrigerant recharge with leak check', min: 350, max: 750 },
    { item: 'Evaporator coil replacement', min: 1400, max: 2800 },
    { item: 'Compressor replacement', min: 1800, max: 3200 },
    { item: '21-point AC tune-up', min: 99, max: 159 },
    { item: 'Annual maintenance plan (2 visits)', min: 189, max: 249 },
    { item: 'Standard AC system replacement (2–4 ton)', min: 6500, max: 9500 },
    { item: 'Variable-speed inverter heat pump install', min: 11500, max: 14500 },
    { item: 'Whole-home duct cleaning (1,500–3,500 sqft)', min: 399, max: 799 },
    { item: 'Smart thermostat install (customer-supplied)', min: 169, max: 249 },
  ],
};

// Renders as "April 27, 2026". Used for "Reviewed by · Updated [date]" lines
// and the static review-block dateline so the date stays current per render.
export function formatToday(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
