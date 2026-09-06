export type RelatedServiceCard = {
  href: string;
  label: string;
  blurb: string;
  image: string;
  imageAlt: string;
};

export type RelatedServicesBlock = {
  heading: string;
  intro: string;
  cards: RelatedServiceCard[];
  areaHref: string;
  areaLabel: string;
};

export const BLOG_RELATED_SERVICES: Record<string, RelatedServicesBlock> = {
  'carrier-vs-trane-vs-rheem-tampa': {
    heading: 'Need the install, not just the comparison?',
    intro: 'This post is a brand comparison. If you are ready to size a system or fix the one you have, these are the pages that match that job.',
    cards: [
      {
        href: '/services/hvac-installation-tampa/',
        label: 'HVAC installation',
        blurb: 'Manual-J sizing, permit, and a matched Carrier, Trane, or Rheem system.',
        image: '/images/carrier-outdoor-condenser-tampa-install.webp',
        imageAlt: 'New outdoor condenser installed in a Tampa Bay backyard',
      },
      {
        href: '/services/ac-repair-tampa/',
        label: 'AC repair',
        blurb: 'Capacitors, contactors, and no-cool calls on the brand already in your yard.',
        image: '/images/air-conditioning-installation-wesley-chapel-electrical-testing-outdoor-condenser.webp',
        imageAlt: 'Technician testing electrical parts on an outdoor AC condenser',
      },
      {
        href: '/services/ac-maintenance-tampa/',
        label: 'AC maintenance',
        blurb: 'Twice-a-year tune-ups so a new system stays on its warranty path.',
        image: '/images/ac-maintenance-tampa-dirty-air-filter.webp',
        imageAlt: 'Dirty AC air filter pulled during a maintenance visit',
      },
    ],
    areaHref: '/service-areas/wesley-chapel-ac-repair/',
    areaLabel: 'Wesley Chapel service area',
  },
  'seer2-explained-florida-2026': {
    heading: 'Ready to use this on a real system?',
    intro: 'SEER2 is a rating. The work is a sized install, a replacement quote, or a tune-up that keeps the current system honest.',
    cards: [
      {
        href: '/services/hvac-installation-tampa/',
        label: 'HVAC installation',
        blurb: 'Florida minimum is 15.2 SEER2. We size and permit the install, then register the warranty.',
        image: '/images/rheem-outdoor-condenser-tampa-install.webp',
        imageAlt: 'Rheem outdoor condenser installed for a Florida SEER2 system',
      },
      {
        href: '/services/ac-replacement-tampa/',
        label: 'AC replacement',
        blurb: 'Changeout when the old unit is past the $5,000 age-times-repair line.',
        image: '/images/trane-outdoor-condenser-tampa-install.webp',
        imageAlt: 'Trane outdoor heat pump condenser on a replacement pad',
      },
      {
        href: '/services/ac-maintenance-tampa/',
        label: 'AC maintenance',
        blurb: 'Coil rinse, charge check, and electrical readings so the rating on the sticker still shows up on the bill.',
        image: '/images/ac-maintenance-tampa-dirty-condenser-rinse.webp',
        imageAlt: 'Outdoor condenser fins rinsed during AC maintenance',
      },
    ],
    areaHref: '/service-areas/wesley-chapel-ac-repair/',
    areaLabel: 'Wesley Chapel service area',
  },
  'ac-tune-up-cost-tampa': {
    heading: 'Book the visit this post is about',
    intro: 'Cost ranges are published market numbers. The pages below are where we schedule the actual maintenance, repair, or duct work.',
    cards: [
      {
        href: '/services/ac-maintenance-tampa/',
        label: 'AC maintenance',
        blurb: '21-point tune-up, spring and fall. Readings in writing, not a 20-minute walkaround.',
        image: '/images/wesley-chapel-hvac-tune-up-new-pleated-air-filters.webp',
        imageAlt: 'New pleated air filters set out during an AC tune-up',
      },
      {
        href: '/services/ac-repair-tampa/',
        label: 'AC repair',
        blurb: 'When the tune-up finds a weak capacitor or a pitted contactor, this is the next call.',
        image: '/images/wesley-chapel-front-yard-condenser.webp',
        imageAlt: 'Outdoor AC condenser at a Wesley Chapel home',
      },
      {
        href: '/services/air-duct-cleaning-tampa/',
        label: 'Air duct cleaning',
        blurb: 'If static pressure is high and the filter loads in weeks, the ducts are often the restriction.',
        image: '/images/air-duct-cleaning-tampa-pulled-register.webp',
        imageAlt: 'Pulled ceiling register showing a dusty duct boot',
      },
    ],
    areaHref: '/service-areas/wesley-chapel-ac-repair/',
    areaLabel: 'Wesley Chapel service area',
  },
};
