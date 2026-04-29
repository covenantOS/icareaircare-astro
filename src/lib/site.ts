export const SITE = {
  name: 'I Care Air Care',
  legalName: 'I Care Air Care LLC',
  tagline: 'Honest HVAC service for Wesley Chapel, Tampa Bay & surrounding communities.',
  url: 'https://www.icareaircare.com',
  phone: '(813) 395-2324',
  phoneHref: 'tel:+18133952324',
  bookUrl: 'https://book.housecallpro.com/book/I-Care-Air-Care/fc288ca4ca7c48c3bbcf2e13316f44e8?v2=true&lead_source=google&merchant_id=20299a14-5630-423e-86f1-4e7f59c7f1c8&rwg_token=AFd1xnGAsHVZNInJGvpu38195sGp79l7PNwlA7p5bjxGrC4HxCnMJhyim0v8UUckWrmgMBm9R6IfC7pHAG2eizmJtX7s7KiAvw%3D%3D',
  bookUrlExternal: 'https://book.housecallpro.com/book/I-Care-Air-Care/fc288ca4ca7c48c3bbcf2e13316f44e8?v2=true&lead_source=google&merchant_id=20299a14-5630-423e-86f1-4e7f59c7f1c8&rwg_token=AFd1xnGAsHVZNInJGvpu38195sGp79l7PNwlA7p5bjxGrC4HxCnMJhyim0v8UUckWrmgMBm9R6IfC7pHAG2eizmJtX7s7KiAvw%3D%3D',
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
  rating: { value: 4.9, count: 700 },
  yearsInBusiness: 16,
  // Customer database / homes-served stat. Conservative number based on
  // ~4k unique customers in the CRM as of 2026-04-29; we display "4,000+"
  // as a defensible homes-served claim.
  customersServed: '4,000+',
  customersServedNum: 4000,
  owner: 'Tim Hawk',
  socials: {
    google: 'https://maps.app.goo.gl/2iCjuu1yf3GAbvSS8',
    yelp: 'https://www.yelp.com/biz/i-care-air-care-zephyrhills',
  },
  // External profiles that corroborate the business identity. Anything in this
  // list lands in the LocalBusiness schema's `sameAs` array — Google reads it
  // as third-party verification of the entity (E-E-A-T lever).
  // Yelp listing per Will (2026-04-29): the Zephyrhills URL is the canonical
  // one we want both UI links and schema sameAs to point at.
  externalProfiles: [
    'https://maps.app.goo.gl/2iCjuu1yf3GAbvSS8',
    'https://www.facebook.com/icareaircare/',
    'https://www.bbb.org/us/fl/wesley-chapel/profile/air-conditioning-contractor/i-care-air-care-llc-0653-90109276',
    'https://icareaircare.rheempropartner.com/',
    'https://www.angi.com/companylist/us/fl/wesley-chapel/i-care-air-care-reviews-6298982.htm',
    'https://www.homeadvisor.com/rated.ICareAirCareLLC.25490578.html',
    'https://www.yelp.com/biz/i-care-air-care-zephyrhills',
    'https://www.manta.com/c/mrsxx5j/i-care-air-care',
  ],
  // Tim Hawk's individual external profiles. These corroborate the Person
  // entity in schema (founder/author E-E-A-T signal).
  founderProfiles: [
    'https://www.linkedin.com/in/tim-hawk-0bba6352',
  ],
  // Florida DBPR public license verification. Stable deep-link to the
  // CAC1816515 license record so AI engines can verify Tim's credential.
  licenseVerificationUrl: 'https://www.myfloridalicense.com/wl11.asp?mode=0&SID=&brd=&typ=N',
  // Each area's geo centroid — used by ServiceAreaLayout to recenter the map
  // iframe on the actual area instead of the HQ pin.
  serviceAreas: [
    { slug: 'wesley-chapel-ac-repair', name: 'Wesley Chapel', geo: { lat: 28.2426914, lng: -82.3726776 } },
    { slug: 'pasco-county-ac-repair', name: 'Pasco County', geo: { lat: 28.3232, lng: -82.4319 } },
    { slug: 'hillsborough-county-hvac-company', name: 'Hillsborough County', geo: { lat: 27.9069, lng: -82.3018 } },
    { slug: 'polk-county-residential-ac-repair', name: 'Polk County', geo: { lat: 27.9659, lng: -81.6985 } },
    { slug: 'land-o-lakes-hvac-services', name: "Land O' Lakes", geo: { lat: 28.2191, lng: -82.4598 } },
    { slug: 'lutz-home-air-conditioning-service', name: 'Lutz', geo: { lat: 28.1508, lng: -82.4631 } },
    { slug: 'new-tampa-heating-and-cooling', name: 'New Tampa', geo: { lat: 28.1206, lng: -82.3457 } },
    { slug: 'odessa-emergency-ac-repair', name: 'Odessa', geo: { lat: 28.1936, lng: -82.5917 } },
    { slug: 'air-conditioning-repair-zephyrhills-fl-i-care-air-care', name: 'Zephyrhills', geo: { lat: 28.2336, lng: -82.1812 } },
  ],
  services: [
    { slug: 'ac-repair-tampa', name: 'AC Repair' },
    { slug: 'emergency-ac-repair-tampa', name: 'Emergency AC Repair' },
    { slug: 'ac-maintenance-tampa', name: 'AC Maintenance' },
    { slug: 'hvac-installation-tampa', name: 'HVAC Installation' },
    { slug: 'air-duct-cleaning-tampa', name: 'Air Duct Cleaning' },
    { slug: 'heating-services-tampa', name: 'Heating Services' },
    { slug: 'ac-installation-wesley-chapel', name: 'AC Installation Wesley Chapel' },
    { slug: 'ac-replacement-tampa', name: 'AC Replacement' },
    { slug: 'heat-pump-repair-tampa', name: 'Heat Pump Repair' },
    { slug: 'mini-split-installation-tampa', name: 'Mini-Split Installation' },
    { slug: 'indoor-air-quality-tampa', name: 'Indoor Air Quality' },
    { slug: 'refrigeration-repair-tampa', name: 'Refrigeration Repair' },
    { slug: 'thermostat-installation-tampa', name: 'Thermostat Installation' },
  ],
};
