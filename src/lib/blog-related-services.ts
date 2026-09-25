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
  'ac-capacitor-replacement-cost-tampa': {
    heading: 'Book the repair this cost guide is about',
    intro: 'The ranges above are published market numbers. These pages are where we schedule the actual capacitor job, an urgent no-cool, or the tune-up that catches the next one.',
    cards: [
      {
        href: '/services/ac-repair-tampa/',
        label: 'AC repair',
        blurb: 'Humming outdoor unit, no spin. We stock common microfarad sizes on the truck.',
        image: '/images/ac-repair-tampa-failed-capacitor-contactor.webp',
        imageAlt: 'Failed capacitor and contactor inside an outdoor condenser',
      },
      {
        href: '/services/emergency-ac-repair-tampa/',
        label: 'Urgent AC repair',
        blurb: 'House already dangerous-hot. We prioritize no-cool homes on the route.',
        image: '/images/emergency-ac-repair-tampa-failed-capacitor-hand.webp',
        imageAlt: 'Failed capacitor in hand during urgent AC repair',
      },
      {
        href: '/services/ac-maintenance-tampa/',
        label: 'AC maintenance',
        blurb: 'We read microfarads on every tune-up so the can gets swapped before July.',
        image: '/images/ac-maintenance-tampa-dirty-air-filter.webp',
        imageAlt: 'Dirty air filter pulled during AC maintenance',
      },
    ],
    areaHref: '/service-areas/wesley-chapel-ac-repair/',
    areaLabel: 'Wesley Chapel service area',
  },
  'rheem-vs-trane-tampa': {
    heading: 'Need an install quote, not another comparison?',
    intro: 'This post is Rheem vs Trane. The pages below are the jobs that follow a brand decision.',
    cards: [
      {
        href: '/services/hvac-installation-tampa/',
        label: 'HVAC installation',
        blurb: 'Manual-J, permit, and warranty registration on the brand you pick.',
        image: '/images/rheem-vs-trane-tampa-two-condensers.webp',
        imageAlt: 'Two outdoor condensers compared for a Tampa install',
      },
      {
        href: '/services/ac-replacement-tampa/',
        label: 'AC replacement',
        blurb: 'Changeout when age times repair cost clears $5,000.',
        image: '/images/rheem-vs-trane-tampa-gauges-install.webp',
        imageAlt: 'Gauges on an outdoor condenser during a replacement',
      },
      {
        href: '/services/ac-repair-tampa/',
        label: 'AC repair',
        blurb: 'We service both brands. Parts speed is the Rheem Pro Partner edge.',
        image: '/images/carrier-vs-trane-rheem-service-parts.webp',
        imageAlt: 'HVAC service parts next to an outdoor condenser',
      },
    ],
    areaHref: '/service-areas/wesley-chapel-ac-repair/',
    areaLabel: 'Wesley Chapel service area',
  },
  'ac-contactor-failure-signs': {
    heading: 'If the outdoor unit clicks and will not start',
    intro: 'A pitted contactor is an AC repair call. These pages get a tech on the driveway or keep the next failure from landing on a Saturday.',
    cards: [
      {
        href: '/services/ac-repair-tampa/',
        label: 'AC repair',
        blurb: 'Contactor and capacitor swaps from the Wesley Chapel trucks, same-day when the part is on the van.',
        image: '/images/ac-contactor-pitted-contacts.webp',
        imageAlt: 'Pitted AC contactor contacts inside an outdoor condenser',
      },
      {
        href: '/services/emergency-ac-repair-tampa/',
        label: 'Urgent AC repair',
        blurb: 'House already hot and the outdoor unit dead. We prioritize no-cool homes during office hours.',
        image: '/images/emergency-ac-repair-tampa-failed-capacitor-hand.webp',
        imageAlt: 'Failed capacitor pulled during an urgent AC repair',
      },
      {
        href: '/service-areas/wesley-chapel-ac-repair/',
        label: 'Wesley Chapel AC repair',
        blurb: 'Seven Oaks, Meadow Pointe, Wiregrass, Epperson, and Mirada from Foamflower Blvd.',
        image: '/images/wesley-chapel-front-yard-condenser.webp',
        imageAlt: 'Outdoor AC condenser in a Wesley Chapel front yard',
      },
    ],
    areaHref: '/service-areas/wesley-chapel-ac-repair/',
    areaLabel: 'Wesley Chapel service area',
  },
  'ac-leaking-water-tampa': {
    heading: 'Water on the floor is usually a drain, not a new system',
    intro: 'A clogged condensate line is an AC repair. A twice-a-year flush is maintenance. Use the page that matches how wet the closet is.',
    cards: [
      {
        href: '/services/ac-repair-tampa/',
        label: 'AC repair',
        blurb: 'Wet-vac the line, reset the float switch, and check the pan. Most drain clears land $150 to $275.',
        image: '/images/ac-leaking-water-drain-clear-tampa.webp',
        imageAlt: 'Technician clearing an outdoor condensate drain with a wet-dry vacuum',
      },
      {
        href: '/services/ac-maintenance-tampa/',
        label: 'AC maintenance',
        blurb: 'The spring visit flushes the PVC before algae shuts the system off in June.',
        image: '/images/ac-maintenance-tampa-clogged-drain-line.webp',
        imageAlt: 'Clogged PVC condensate drain with algae',
      },
      {
        href: '/service-areas/wesley-chapel-ac-repair/',
        label: 'Wesley Chapel AC repair',
        blurb: 'Attic air handlers in 33543, 33544, and 33545 overflow onto drywall first.',
        image: '/images/emergency-ac-repair-tampa-float-switch-drain.webp',
        imageAlt: 'Technician checking a condensate float switch',
      },
    ],
    areaHref: '/service-areas/wesley-chapel-ac-repair/',
    areaLabel: 'Wesley Chapel service area',
  },
};
