// Tech Performance Score — Formula A from the industry research report.
// 100-point composite, A-F letter grade. Each component normalized
// linearly between a 0-point and 100-point anchor (configurable).

export interface ScoreWeights {
  revenue_per_day: number;
  avg_ticket: number;
  close_rate: number;
  membership_conversion: number;
  callback_rate_inverted: number;
  review_rate: number;
  utilization: number;
  volume: number;
}

export interface ScoreTargets {
  revenue_per_day: { zero: number; hundred: number };
  avg_ticket: { zero: number; hundred: number };
  close_rate: { zero: number; hundred: number };
  membership_conversion: { zero: number; hundred: number };
  callback_rate_inverted: { zero: number; hundred: number };
  review_rate: { zero: number; hundred: number };
  utilization: { zero: number; hundred: number };
  volume: { zero: number; hundred: number };
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  revenue_per_day: 0.25,
  avg_ticket: 0.15,
  close_rate: 0.15,
  membership_conversion: 0.10,
  callback_rate_inverted: 0.10,
  review_rate: 0.10,
  utilization: 0.10,
  volume: 0.05,
};

export const DEFAULT_TARGETS: ScoreTargets = {
  revenue_per_day: { zero: 1000, hundred: 2400 },
  avg_ticket: { zero: 200, hundred: 550 },
  close_rate: { zero: 50, hundred: 90 },
  membership_conversion: { zero: 10, hundred: 35 },
  callback_rate_inverted: { zero: 5, hundred: 0 },
  review_rate: { zero: 5, hundred: 30 },
  utilization: { zero: 50, hundred: 75 },
  volume: { zero: 2, hundred: 5 },
};

export interface ScoreInputs {
  revenue_per_day: number;
  avg_ticket: number;
  close_rate_pct: number;
  membership_conversion_pct: number;
  callback_rate_pct: number;
  review_rate_pct: number;
  utilization_pct: number;
  jobs_per_day: number;
}

export interface ScoreOutput {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: Record<keyof ScoreWeights, { raw: number; normalized: number; weighted: number }>;
}

function normalize(value: number, zero: number, hundred: number): number {
  if (zero === hundred) return 50;
  // Allow inverted (callback) where zero > hundred.
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  if (zero < hundred) {
    return clamp(((value - zero) / (hundred - zero)) * 100);
  } else {
    return clamp(((zero - value) / (zero - hundred)) * 100);
  }
}

export function gradeFor(total: number): ScoreOutput['grade'] {
  if (total >= 90) return 'A';
  if (total >= 80) return 'B';
  if (total >= 70) return 'C';
  if (total >= 60) return 'D';
  return 'F';
}

export function score(
  inputs: ScoreInputs,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  targets: ScoreTargets = DEFAULT_TARGETS,
): ScoreOutput {
  const components: ScoreOutput['components'] = {} as ScoreOutput['components'];
  const map: Record<keyof ScoreWeights, number> = {
    revenue_per_day: inputs.revenue_per_day,
    avg_ticket: inputs.avg_ticket,
    close_rate: inputs.close_rate_pct,
    membership_conversion: inputs.membership_conversion_pct,
    callback_rate_inverted: inputs.callback_rate_pct,
    review_rate: inputs.review_rate_pct,
    utilization: inputs.utilization_pct,
    volume: inputs.jobs_per_day,
  };

  let total = 0;
  for (const k of Object.keys(weights) as Array<keyof ScoreWeights>) {
    const raw = map[k] ?? 0;
    const t = targets[k];
    const normalized = normalize(raw, t.zero, t.hundred);
    const weighted = normalized * weights[k];
    components[k] = { raw, normalized, weighted };
    total += weighted;
  }

  return { total: Math.round(total * 10) / 10, grade: gradeFor(total), components };
}
