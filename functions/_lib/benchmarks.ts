// Industry benchmarks for HVAC residential service techs (2025-2026).
// Sourced from the research report (HVAC-TECH-KPI-BENCHMARKS-2025-2026.md).
// Values in dollars or percent as labeled. Used to colour-code the dashboard.

export interface Band {
  poor: number;
  average: number;
  top: number;
  unit: 'dollars' | 'percent' | 'count';
  source: string;
  // For metrics where higher is better, direction = 'up'.
  // For callbacks where lower is better, direction = 'down'.
  direction: 'up' | 'down';
}

export const BENCHMARKS: Record<string, Band> = {
  revenue_per_tech_per_day: {
    poor: 1200, average: 2000, top: 2400,
    unit: 'dollars', direction: 'up',
    source: 'BaaDigi / MarginPlug 2026 — top quartile $2,400+/day',
  },
  avg_ticket: {
    poor: 250, average: 450, top: 600,
    unit: 'dollars', direction: 'up',
    source: 'FieldPulse / MarginPlug 2026 — premium markets $600+',
  },
  avg_ticket_tune_up: {
    poor: 110, average: 175, top: 300,
    unit: 'dollars', direction: 'up',
    source: 'Industry — base TU + add-on lifts to $175+; top performers $300+',
  },
  avg_ticket_diagnostic: {
    poor: 200, average: 350, top: 500,
    unit: 'dollars', direction: 'up',
    source: 'Industry — $89 dispatch + repair averages $350-500',
  },
  close_rate_tune_up: {
    poor: 30, average: 50, top: 75,
    unit: 'percent', direction: 'up',
    source: 'HVACR Business — 10% to repair, 70% to membership; combined 50%+',
  },
  close_rate_diagnostic: {
    poor: 50, average: 67, top: 85,
    unit: 'percent', direction: 'up',
    source: 'BaaDigi / Mercurio — 60-75% avg, 80%+ top',
  },
  close_rate_estimate: {
    poor: 30, average: 45, top: 60,
    unit: 'percent', direction: 'up',
    source: 'HVAC Coaching Corner — 50% min, 60-65% stretch',
  },
  callback_rate: {
    poor: 5, average: 3, top: 2,
    unit: 'percent', direction: 'down',
    source: 'Contracting Business / Mar-Hy — 2-3% acceptable, <2% top',
  },
  membership_conversion: {
    poor: 15, average: 25, top: 35,
    unit: 'percent', direction: 'up',
    source: 'HVACR Business — 25% min, 30-50% top quartile',
  },
  jobs_per_day: {
    poor: 3, average: 4, top: 6,
    unit: 'count', direction: 'up',
    source: 'ServiceTitan / Oxmaint — 3-5 standard, 5-8 top',
  },
  review_rate: {
    poor: 10, average: 20, top: 30,
    unit: 'percent', direction: 'up',
    source: 'Hnatewicz / Plecto — 20-35% with active SMS ask',
  },
};

export type Tier = 'poor' | 'average' | 'top';

export function classify(metric: keyof typeof BENCHMARKS, value: number | null | undefined): Tier | null {
  if (value === null || value === undefined || isNaN(value)) return null;
  const b = BENCHMARKS[metric];
  if (!b) return null;
  if (b.direction === 'up') {
    if (value >= b.top) return 'top';
    if (value >= b.average) return 'average';
    return 'poor';
  } else {
    if (value <= b.top) return 'top';
    if (value <= b.average) return 'average';
    return 'poor';
  }
}

export function tierColor(t: Tier | null): string {
  if (t === 'top') return '#15803d';      // emerald-700
  if (t === 'average') return '#b45309';  // amber-700
  if (t === 'poor') return '#b91c1c';     // red-700
  return '#64748b';                        // slate-500
}

export function tierLabel(t: Tier | null): string {
  if (t === 'top') return 'Top quartile';
  if (t === 'average') return 'Average';
  if (t === 'poor') return 'Below average';
  return '—';
}
