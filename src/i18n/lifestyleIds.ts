export const LIFESTYLE_IDS = [
  'crp-anti-inflam-diet',
  'crp-zone2-cardio',
  'crp-sleep-apnea-hygiene',
  'crp-curcumin-resveratrol',
  'crp-optimal-maintenance',
  'glu-glycemic-time-restricted',
  'glu-post-meal-movement',
  'glu-berberine-inno',
  'glu-resistance-hypertrophy',
  'glu-optimal-preservation',
  'alb-protein-optimization',
  'alb-gut-absorption',
  'alb-liver-support',
  'alb-optimal-state',
  'rdw-erythrocyte-turnover',
  'rdw-iron-balance',
  'rdw-antioxidant-defense',
  'rdw-optimal-status',
  'cr-hydration-renal-hemodynamics',
  'cr-nitric-oxide-endothelial',
  'cr-creatine-clarification',
  'cr-optimal-preservation',
  'lym-thymic-immunosenescence',
  'lym-stress-cortisol',
  'lym-optimal-state',
  'wbc-chronic-infection-quench',
  'wbc-endurance-recovery',
  'wbc-optimal-range',
  'alp-hepatic-bone-protocol',
  'alp-magnesium-bone',
  'alp-optimal-status',
  'mcv-b-vitamin-methylation',
  'mcv-thyroid-screen',
  'mcv-optimal-status',
] as const;

export type LifestyleId = (typeof LIFESTYLE_IDS)[number];

export type LifestyleItemCopy = {
  title: string;
  clinicalMechanism: string;
  actionProtocol: string[];
  targetGoal: string;
  note?: string;
};

export type LifestyleCopy = Record<LifestyleId, LifestyleItemCopy>;

export function isLifestyleId(value: string): value is LifestyleId {
  return (LIFESTYLE_IDS as readonly string[]).includes(value);
}

export const EVIDENCE_KEYS = {
  'Grade A (Meta-Analysis / RCTs)': 'gradeA',
  'Grade B (Clinical Cohort / NHANES)': 'gradeB',
  'Grade C (Epidemiological / Mechanistic)': 'gradeC',
} as const;
